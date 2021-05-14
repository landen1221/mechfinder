mongoose = require('mongoose')
moment = require('moment')
humanize = require('humanize')

Currency = require('./types/currency')

clickthrough = new mongoose.Schema
    ad:       { type: mongoose.Schema.Types.ObjectId, ref: 'ad' }
    user:     { type: mongoose.Schema.Types.ObjectId, ref: 'user' }
    ip:       { type: String }
    date:     { type: Date, default: -> new Date() }
    page:     { type: String }
    location: [Number]

view = new mongoose.Schema
    ad:       { type: mongoose.Schema.Types.ObjectId, ref: 'ad' }
    user:     { type: mongoose.Schema.Types.ObjectId, ref: 'user' }
    ip:       { type: String }
    date:     { type: Date, default: -> new Date() }
    page:     { type: String }
    location: [Number]

ad = new mongoose.Schema
    city:     String
    city_lower: { type: String }
    state:    String
    user:     { type: mongoose.Schema.Types.ObjectId, ref: 'user' }
    customer: { type: String, trim: true }
    phone:    { type: String, trim: true }
    title:    { type: String, trim: true }
    section:  { type: String, trim: true, enum: ['sidebar', 'banner'] }
    image:    { type: mongoose.Schema.Types.ObjectId, ref: 'image', set: (v) -> if v and v.length > 0 then v else null }
    link:     { type: String, trim: true }
    start:    { type: Date, default: -> moment().add('d', 14).toDate() }
    end:      { type: Date, default: -> moment().add('d', 28).toDate() }
    amount:   Currency()
    payed:    { type: Boolean, default: false }
    payed_on: { type: Date }
    created:  { type: Date, default: -> new Date() }

ad.virtual('amount_display').get -> if this.amount then '$' + humanize.numberFormat(this.amount) else ''

ad.methods.record_view = (req, next) ->
    v = new View {
        ad: this
        user: req.user
        ip: req.ip
        page: req.header('Referer')
    }
    v.location = [req.geo.long, req.geo.lat] if req.geo
    v.save next

ad.methods.record_click = (req, next) ->
    c = new Click {
        ad: this
        user: req.user
        ip: req.ip
        page: req.header('Referer')
    }
    c.location = [req.geo.long, req.geo.lat] if req.geo
    c.save next

ad.statics.get_stats = (id, next) ->
    stats = {view_count: 0, click_count: 0}
    View.count ad: id, (err, count) ->
        return next(err) if err
        stats.view_count = count
        Click.count ad: id, (err, count) ->
            return next(err) if err
            stats.click_count = count
            next(null, stats)

# calls next(err, ads) where ads is a map of section keys and arrays of ads in those sections
# date is optional, defaults to current date
ad.statics.find_active = (date, next) ->
    if date.constructor.name is 'Function'
        next = date
        date = new Date()
    this.find(payed: true)
        .where('section').gt('')
        .where('start').lte(date)
        .where('end').gte(date)
        .select('section title image link state city city_lower phone')
        .populate('image')
        .exec (err, ads) ->
            return next(err) if err
            x = {}
            for a in ads
                a.image_url = a.image?.url
                x[a.section] = [] unless x[a.section]
                x[a.section].push(a)
                    
            next(null, x)

ad.statics.count_active = (date, next) ->
    if date.constructor.name is 'Function'
        next = date
        date = new Date()
    this.find(payed: true)
        .where('start').lte(date)
        .where('end').gte(date)
        .count(next)

ad.statics.count_unpayed = (next) -> this.find(payed: false).count(next)

ad.pre 'save', (next) ->
    @city_lower = if @city? then @city.toLowerCase() else null
    @payed_on = new Date() if this.payed and this.isModified('payed')
    next()    

# clickthroughs and views are not exported, interact with them
# through the ad model itself
View = mongoose.model('ad-view', view)
Click = mongoose.model('ad-click', clickthrough)

module.exports = mongoose.model('ad', ad)
