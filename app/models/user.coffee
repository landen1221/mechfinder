mongoose = require('mongoose')
crypto = require('crypto')
moment = require('moment')

{compare_document, normalize_state, expand_state} = require('../util')
Currency = require('./types/currency')

Rating = new mongoose.Schema
    user:            { type: mongoose.Schema.Types.ObjectId, ref: 'user' }
    rel:             { type: mongoose.Schema.Types.ObjectId, ref: 'project' }
    stars:           { type: Number }
    notes:           { type: String }
    date:            { type: Date, default: -> new Date() }
    nullified:       { type: Boolean, default: false }

Discount = new mongoose.Schema
    label:      { type: String, default: '', trim: true }                           # label for the discount (as it looks on user end)
    kind:       { type: String, default: '', enum: ['', 'diagnosis', 'workorder'] } # the type of project that the discount applies to ('' = either kind is okay)
    amount:     Currency()                                                          # dollar amount of the discount (cannot be set with rate)
    rate:       { type: Number, default: 0 }                                        # decimal discount rate (cannot be set with amount)
    created:    { type: Date, default: -> new Date() }                              # date the discount was added
    expiration: { type: Date }                              # expiration date of the discount (none if = created, can be used in conjunction with projects)
    uses:       { type: Number, default: 0 }                                        # number of uses remaining to which the discount can apply
    used:       [{ type: Date, default: -> new Date() }]                            # the dates on which the discount was used

user = new mongoose.Schema
    username:       { type: String, trim: true, example: 'John1738' }
    first:          { type: String, trim: true, title: 'First Name'}
    first_lower:    { type: String, lowercase: true }
    middle:         { type: String, trim: true }
    last:           { type: String, trim: true, title: 'Last Name'}
    last_lower:     { type: String, lowercase: true }
    email:          { type: String, trim: true, unique: true, lowercase: true, title: 'Email Address'}
    role:           { type: String, default: 'buyer', enum: ['buyer', 'seller', 'support', 'admin'] }
    dob:            { type: Date }
    ssn:            { type: String, trim: true, deafult: '' }

    
    facebookId: { type: String, default: '' }
    provider : { type: String, default: 'local', enum:['local', 'facebook']}
    picture: { type: mongoose.Schema.Types.ObjectId, ref: 'image' }
    photos: [{ type: mongoose.Schema.Types.ObjectId, ref: 'image' }]

    salt:       { type: String }
    password:   { type: String }

    active: { type: Boolean, default: true }
    verified: { type: Boolean, default: false }
    verificationDate:   { type: Date, default: Date.now }
    recoveryDate: { type: Date, default: (-> new Date()) }
    recoveryKey: { type: mongoose.Schema.Types.ObjectId }

    last_login: { type: Date, default: (-> new Date()), title: 'Last Login' }
    last_activity: { type: Date, default: (-> new Date()), title: 'Last Activity' }
    created: { type: Date, default: -> new Date() }
    complete: { type: Boolean, default: false }

    ratings: [Rating]
    average_rating: { type: Number, default: 0 }
    active_projects: { type: Number, default: 0 }

    vehicles: [{ type: mongoose.Schema.Types.ObjectId, ref: 'vehicle'} ]
    projects: [{ type: mongoose.Schema.Types.ObjectId, ref: 'project'} ]

    referral:
        workorder: { type: Number, default: 0.1 }
        diagnosis: { type: Number, default: 0.1 }
    
    discounts: [Discount] 
    # if expiration != created and past expiration date, then can't use discount, if expiration == created, then projects must be > 0 to be able to use discount
    
    tax:
        parts: { type: Number, default: 0, min: 0, max: 0.15 }
        labor: { type: Number, default: 0, min: 0, max: 0.15 }

    mechanicType: {type: String, default: 'mobile', trim: true, lowercase: true }
    specialties: [{ type: String, trim: true }]
    experience: [{ type: String, trim: true }]
    certifications: [{type: String, trim: true}]
    offersDiagnosis: {type: Boolean, default: false}
    diagnosisCharge: Currency()
    waivesDiagnosis: {type: Boolean, default: false}
    yearsOfExperience: {type: Number, default: 0}
    insurance: {type: Boolean, default: false}
    registrationNumber: {type: String, default: '', trim: true} # mechanic's state registration # (optional)
    tows: {type: Boolean, default: false}
    flatbed: {type: Boolean, default: false}
    about: {type: String, trim: true, default: ''}
    seenDiagnosisProcess: { type: Boolean, default: false }

    setBilling: { type: Boolean, default: false }
    setBanking: { type: Boolean, default: false }
    setDOB: { type: Boolean, default: false }
    setSSN: { type: Boolean, default: false }

    warranty:
        amount: {type: Number, default: 0}
        units: {type: String, default: 'days', enum: ['days', 'weeks', 'months', 'years']}

    languages:
        english: { type: Boolean, default: true }
        spanish: { type: Boolean, default: false }

    favorites:
        mechanics: [{ type: mongoose.Schema.Types.ObjectId, ref: 'user' }]  # sellers
        users: [{ type: mongoose.Schema.Types.ObjectId, ref: 'user' }]      # buyers
        projects: [{ type: mongoose.Schema.Types.ObjectId, ref: 'user' }]

    banking:
        bank: { type: String, trim: true, default: '' }
        routing: { type: String, trim: true, default: '' }
        account: { type: String, trim: true, default: '' }

    billing:
        primary: { type: String, trim: true, default: '' }
        secondary: { type: String, trim: true, default: '' }
        city: { type: String, trim: true, default: '' }
        state: { type: String, trim: true, default: '' }
        zip: { type: String, trim: true, default: '' }

    braintree:
        hasAccount: { type: Boolean, default: false }
        active: { type: Boolean, default: false }
        billingId: { type: String }
        customerId: { type: String }
        riskDataId: { type: String }
        shippingId: { type: String }

    phone:
        kind: { type: String, enum: ['Mobile', 'Landline', ''], default: '' }
        number: { type: String, trim: true, default: '' }
        verified: { type: Boolean, default: false }
        sms: { type: Boolean, default: false }
        smsCharges: {type: Boolean, default: false }
        provider: { type: String, default: '', trim: true }
        skip: { type: Boolean, default: false }

    business:
        legalName: { type: String, trim: true, default: '' }
        name: { type: String, trim: true, default: '' }
        taxId: { type: String, trim: true, default: '' }
        address: { type: String, trim: true, default: '' }
        city: { type: String, trim: true, default: '' }
        state: { type: String, trim: true, default: '', example: 'az' }
        zip: { type: String, trim: true, default: '' }

    geo:
        ip: { type: String, trim: true }
        source: { type: String, trim: true } # source of the location; e.g. 'browser', 'ip', 'user'
        state: { type: String, default: '', trim: true }
        country: { type: String, default: '', trim: true }
        city: { type: String, default: '', trim: true }
        postal: { type: String, default: '', trim: true }
        loc:
            type: { type: String, default: 'Point'}
            coordinates: [0,0]

    verification:
        type: String
        trim: true
        default: ->
            text = ''
            possible = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnopqrstuvwxyz23456789'
            i = 0
            while i < 5
                text += possible.charAt(Math.floor(Math.random() * possible.length))
                i++
            return text

    hours: # day of week, sunday is 0
        '0':
            open:   { type: String, default: '' }
            close:  { type: String, default: '' }
        '1':
            open:   { type: String, default: '9' }
            close:  { type: String, default: '17' }
        '2': 
            open:   { type: String, default: '9' }
            close:  { type: String, default: '17' }
        '3': 
            open:   { type: String, default: '9' }
            close:  { type: String, default: '17' }
        '4': 
            open:   { type: String, default: '9' }
            close:  { type: String, default: '17' }
        '5': 
            open:   { type: String, default: '9' }
            close:  { type: String, default: '17' }
        '6':
            open:   { type: String, default: '' }
            close:  { type: String, default: '' }
            
    preferences:
        chat:
            sound:  { type: Boolean, default: true }
        notifications:
            email:
                support:            {type: Boolean, default: true}
                projectBasic:       {type: Boolean, default: true}
                projectImportant:   {type: Boolean, default: true}
                chat:               {type: Boolean, default: true}
                marketing:          {type: Boolean, default: true}
                general:            {type: Boolean, default: true}
                newProjects:        {type: Boolean, default: true}
                buyerUpdates:       {type: Boolean, default: true}
                reviewed:           {type: Boolean, default: true}
            sms:
                support:            {type: Boolean, default: true}
                projectBasic:       {type: Boolean, default: true}
                projectImportant:   {type: Boolean, default: true}
                chat:               {type: Boolean, default: true}
                marketing:          {type: Boolean, default: true}
                general:            {type: Boolean, default: true}
                newProjects:        {type: Boolean, default: true}
                buyerUpdates:       {type: Boolean, default: true}
                reviewed:           {type: Boolean, default: true}


user.set 'toJSON', transform: (doc, json, options) ->
  delete json.password
  delete json.salt
  delete json.banking
  delete json.ssn
  delete json.dob
  return json

user.index('geo.loc': '2dsphere')

user.virtual('name').get ->
    return @company if @use_company_as_display_name and @company
    return "#{@first} #{@last}" unless @middle and @middle.length > 0
    "#{@first} #{@middle[0].toUpperCase()} #{@last}"

user.methods.addVehicle = (v, next) ->
    return next('err') unless v
    user = @
    user.vehicles.push(v)
    user.save(next)

user.methods.addProject = (p, next) ->
    return next('err') unless p
    user = @
    user.projects.push(p)
    user.save(next)

user.methods.calculate_rating = ->
    total = 0
    (total += r.stars) for r in (@ratings or []) when not r.nullified
    # @average_rating = (total / (@ratings or []).length)
    trueAvg = (total / (@ratings or []).length)
    roundedAvg = Math.round(trueAvg * 10) / 10
    @average_rating = roundedAvg

user.methods.find_rating = (user, rel) ->
    return null unless @ratings
    for r in @ratings when compare_document(user, r.user) and compare_document(rel, r.rel)
        return r
    null

user.methods.rate = (user, rel, stars, notes, next) ->
    r = @find_rating(user, rel)
    if r
        r.stars = stars
        r.notes = notes
        r.date = new Date
    else
        @ratings = [] unless @ratings
        r = @ratings.create(
            user: user
            rel: rel
            stars: stars
            notes: notes
        )
        @ratings.push(r)
    @calculate_rating()
    @save (err) -> next(err, r)

# pwd: password to set
# next: (err) ->
user.methods.credential = (pwd, next) ->
    u = this
    crypto.randomBytes 64, (err, buf) ->
        return next(err) if err
        s = buf.toString('hex')
        crypto.pbkdf2 pwd, s, 5000, 512, 'sha512WithRSAEncryption', (err, encoded) ->
            return next(err) if err
            u.salt = s
            u.password = Buffer(encoded, 'binary').toString('hex')
            u.password_changed = new Date()
            return next(null, u)

# pwd: password to check
# next: (err, result) ->
user.methods.check = (pwd, next) ->
    u = this
    crypto.pbkdf2 pwd, @salt, 5000, 512, 'sha512WithRSAEncryption', (err, encoded) ->
        return next(err, false) if err
        return next(null, u.password == Buffer(encoded, 'binary').toString('hex'))

user.methods.count_active_projects = (next) ->
    @model('project')
        .where('state').in(['bidding', 'assigned'])
        .or([
            {owner: @}
            {assigned: @}
        ])
        .count(next)

user.methods.count_finished_projects = (next) ->
    @model('project')
        .where('state').in(['finished'])
        .or([
            {owner: @}
            {assigned: @}
        ])
        .count(next)

# role: buyer, seller (required)
# online: true/false (optional)
# transform: funciton(q) (optional)
# skip: number (required)
# limit: number (required)
# next: function(err, users) (required)
user.statics.find_near = (filter, next) ->
    q =
        active: true

    if filter.loc and filter.loc[0] isnt 0 and filter.loc[1] isnt 0
        q['geo.loc'] =
            $near:
                $geometry:
                    type: 'Point',
                    coordinates: filter.loc
                # Divide miles by .00062173 to get meters
                $maxDistance: filter.distance / 0.00062137

    if filter.minRating
        q.average_rating = {$gte: filter.minRating}

    if filter.repair? and filter.repair isnt 'none'
        if filter.repair isnt 'Diagnostic'
            q.specialties = { $in: [filter.repair] }
        else
            q.specialties = { $in: ['Diagnostics'] }

    if filter.langIds and filter.langIds isnt 'none'
        q._id = $in: filter.langIds

    q.role = filter.role if filter.role

    q.yearsOfExperience = $gte: filter.yearsExperience if filter.yearsExperience

    q.certifications = {$size: 0} if filter.certification and filter.certification is 'not certified'
    q.certifications = {$not: {$size: 0}} if filter.certification and filter.certification is 'certified'

    q.experience = {$in: [filter.make.name]} if filter.make and filter.make.name isnt 'none'

    q = @find(q)

    if filter.type? and filter.type isnt 'none'
        q.or([{mechanicType: filter.type},{mechanicType: 'both'}])

    q.skip(filter.index).limit(filter.numberOfResults).exec (err, result) ->
        if err
            console.log err
            return next(err)
        q.count (err, total) ->
            return next(err) if err
            next null, result, total

user.statics.find_favorites = (ids, role, next) ->
    finding = _id: $in: ids
    finding.role = role

    q = @find(finding)

    q.skip(0).limit(50).exec (err, result) ->
        return next(err) if err
        q.count (err, total) ->
            return next(err) if err
            next null, result, total

user.pre 'save', (next) ->
    @first_lower = @first
    @last_lower = @last
    @company_lower = @company
    next()

module.exports = mongoose.model('user', user)
