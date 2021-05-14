mongoose = require('mongoose')
humanize = require('humanize')
async = require('async')
{Vehicle}  = require('./vehicle')
Currency = require('./types/currency')
Numeric  = require('./types/numeric')
Image = require('./types/image')
{compare_document, normalize_state, expand_state, union} = require('../util')
{ZipCode} = require('./zipcode')
Notification = require('../models/notification')
Entities = require('html-entities').XmlEntities
entities = new Entities()

REPAIRS = [
    "Auto Repair"
    "Audio"
    "Body Work"
    "Electrical"
    "Maintenance"
    "Restoration"
    "Windows"
    "Tires"
    "Other/Not Sure"
]

ACCEPTABLE_PARTS = [
    "OEM/New"
    "Aftermarket"
    "Used"
    "Remanufactured"
    "Not Sure"
    "N/A"
]


Bid = new mongoose.Schema({
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'user' }
    braintreeTransaction: { type: String, trim: true, default: '' }
    comment: { type: String, trim: true, default: '' }

    taxRate:
        parts: { type: Number, default: 0, min: 0, max: 0.15 }
        labor: { type: Number, default: 0, min: 0, max: 0.15 }
    
    referral:
        buyer: { type: Number, default: 0.1, min: 0 }
        seller: { type: Number, default: 0.1, min: 0 }
    
    discount:
        buyer: { type: Number, default: 0, min: 0 }
        seller: { type: Number, default: 0, min: 0 }
    
    discountId: 
        buyer: { type: mongoose.Schema.Types.ObjectId, default: null }
        seller: { type: mongoose.Schema.Types.ObjectId, default: null }


    diagnosisWaiver: Currency()
    diagnosisWaived: { type: Boolean, default: false }

    date_submitted:  { type: Date, default: -> new Date() }
    date_accepted:   { type: Date }
    date_canceled:   { type: Date }
    date_retracted:  { type: Date }
    date_requested:  { type: Date }
    date_released:   { type: Date }
    date_refunded:   { type: Date }

    parts: [{
        label: { type: String, trim: true }
        quantity: { type: Number, default: 0, min: 0 }
        cost: Currency()
    }]

    labor: [{
        label: { type: String, trim: true }
        hours: { type: Number, default: 0, min: 0 }
        rate: Currency()
    }]

    state:
        type: String
        default: -> 'submitted'
        enum: [
            'submitted',    # mechanic has submitted a bid to an open proeject
            'accepted',     # customer accepted this bid
            'canceled',     # customer accepted a different bid later
            'retracted',    # mechanic retracted this bid from the project
            'requested',    # mechanic has request payment for this estimate
            'released',     # customer has released funds for this estimate
            'refunded',     # a mechfinder rep has refunded the money
        ]
    
    # old object properties (here for migration purposes, will delete after all users are migrated)
    user:     { type: mongoose.Schema.Types.ObjectId, ref: 'user' }
    comments: { type: String, trim: true }
    estimate: Currency()
    serviceFee: { type: Number, default: 0.175 }
    waivedDiagnosisFee: { type: Number, default: 0 }
    tax: { type: Number, default: 0 }
}, {
    toObject: 
        virtuals: true,
    toJSON: 
        virtuals: true
})
    
roundCents = (cents) ->
    return parseInt(Math.round(cents))

Bid.virtual('partsAmount').get ->
    return 0 unless this.parts
    total = 0
    total += part.cost * part.quantity for part in this.parts
    return roundCents total

Bid.virtual('partsTaxAmount').get ->
    return 0 unless this.parts
    total = 0
    total += part.cost * part.quantity * this.taxRate.parts for part in this.parts
    return roundCents total

Bid.virtual('laborAmount').get ->
    return 0 unless this.labor
    total = 0
    total += labor.rate * labor.hours for labor in this.labor
    return roundCents total

Bid.virtual('laborTaxAmount').get ->
    return 0 unless this.labor
    total = 0
    total += labor.rate * labor.hours * this.taxRate.labor for labor in this.labor
    return roundCents total

Bid.virtual('partsLaborAmount').get ->
    return roundCents this.partsAmount + this.laborAmount

Bid.virtual('subtotalAmount').get ->
    return roundCents this.partsLaborAmount - this.diagnosisWaiver

Bid.virtual('buyerDiscountAmount').get ->
    return roundCents this.discount.buyer * this.subtotalAmount

Bid.virtual('sellerDiscountAmount').get ->
    return roundCents this.discount.seller * this.subtotalAmount

Bid.virtual('taxAmount').get ->
    return roundCents this.partsTaxAmount + this.laborTaxAmount

Bid.virtual('sellerReferralAmount').get ->
    return roundCents this.referral.seller * this.subtotalAmount

Bid.virtual('buyerReferralAmount').get ->
    return roundCents this.referral.buyer * this.subtotalAmount

Bid.virtual('sellerTotal').get ->
    return roundCents this.subtotalAmount + this.taxAmount - this.sellerReferralAmount + this.sellerDiscountAmount

Bid.virtual('buyerTotal').get ->
    return roundCents this.subtotalAmount + this.taxAmount + this.buyerReferralAmount - this.buyerDiscountAmount

Bid.virtual('mfTotal').get ->
    return roundCents this.sellerReferralAmount + this.buyerReferralAmount

projectDiff = new mongoose.Schema
    project: { type: mongoose.Schema.Types.ObjectId, ref: 'project' }
    date: {type: Date, default: Date.now}
    changes: {type: mongoose.Schema.Types.Mixed}

projectDiffModel = mongoose.model('projectDiff', projectDiff)

project = new mongoose.Schema
    number:             { type: Number, unique: true }
    diagnosis:          { type: Boolean, default: true }
    vehicle:            { type: mongoose.Schema.Types.ObjectId, ref: 'vehicle' }
    owner:              { type: mongoose.Schema.Types.ObjectId, ref: 'user' }
    poster:             { type: mongoose.Schema.Types.ObjectId, ref: 'user' }
    assigned:           { type: mongoose.Schema.Types.ObjectId, ref: 'user' }
    child:              { type: mongoose.Schema.Types.ObjectId, ref: 'project' }
    parent:             { type: mongoose.Schema.Types.ObjectId, ref: 'project' }
    viewers:            [{ type: mongoose.Schema.Types.ObjectId, ref: 'user' }]

    title:              { type: String, trim: true }
    description:        { type: String, trim: true }
    # schedule:           { type: Date, default: -> new Date() }
    # repair:             { type: String, enum: REPAIRS, trim: true, default: 'Other/Not Sure' }
    sellerRated:        { type: Boolean, default: false }
    buyerRated:         { type: Boolean, default: false }
    # tow:                { type: Boolean, default: false }
    # preference:         { type: String, enum: ['none', 'mobile', 'shop'], lowercase: true, default: 'none' }
    parts:              { type: Boolean, default: false }
    acceptableParts:    [{ type: String, enum: ACCEPTABLE_PARTS}]
    canceledReason:     { type: String, trim: true, default: '' }

    date_created:       { type: Date, default: -> new Date() }
    date_assigned:      { type: Date }
    date_finished:      { type: Date }
    date_canceled:      { type: Date }

    bids:               [Bid]

    photos:             [{ type: mongoose.Schema.Types.ObjectId, ref: 'image' }]
    diffs:              [{ type: mongoose.Schema.Types.ObjectId, ref: 'projectDiff' }]

    geo: # project location, must be copied from user when project is created
        ip: { type: String, trim: true }
        source: { type: String, trim: true }
        state: { type: String, default: '', trim: true }
        country: { type: String, default: '', trim: true }
        city: { type: String, default: '', trim: true }
        postal: { type: String, default: '', trim: true }
        long: { type: Number, default: 0.0 }
        lat: { type: Number, default: 0.0 }
        location: [Number]
        loc:
            type: { type: String, default: 'Point'}
            coordinates: [0,0]

    state:
        type: String
        default: -> 'bidding'
        enum: [
            'creating',     # mechanic is creating a draft for the customer (after a diagnosis project)
            'reviewing',    # the (diagnosis) project is submitted for review by the customer
            'draft',        # project is just a saved draft
            'bidding',      # open for bidding
            'assigned',     # user has assigned a mechanic, not open for bidding
            'finished',     # mechanic finished work
            'canceled',     # user canceled project
        ],
        set: (v) ->
            this._previous_state = this.state
            v

    # hours: # day of week, sunday is 0
    #     '0':
    #         open:     { type: String, default: '' }
    #         close:    { type: String, default: '' }
    #     '1':
    #         open:     { type: String, default: '9' }
    #         close:    { type: String, default: '17' }
    #     '2':
    #         open:     { type: String, default: '9' }
    #         close:    { type: String, default: '17' }
    #     '3':
    #         open:     { type: String, default: '9' }
    #         close:    { type: String, default: '17' }
    #     '4':
    #         open:     { type: String, default: '9' }
    #         close:    { type: String, default: '17' }
    #     '5':
    #         open:     { type: String, default: '9' }
    #         close:    { type: String, default: '17' }
    #     '6':
    #         open:     { type: String, default: '' }
    #         close:    { type: String, default: '' }

project.index('geo.loc': '2dsphere')

project.methods.hire = (user, bid, discountId, buyer, seller, next) ->
    perms = @permissions(user)
    return next('Permission denied') unless perms.can_hire

    b = @bids.id(bid)
    return next('No such bid.') unless b?
    return next('Invalid state to hire bid.') unless ((b.parts and b.parts.length > 0) or (b.labor and b.labor.length > 0)) and b.state is 'submitted'
    return next('Permission denied') if @state in ['draft'] and (not compare_document(b.owner, @poster))
    
    if buyer and discountId and discountId.buyer
        d = buyer.discounts.id(discountId.buyer)
        if d
            now = new Date()
            now.setHours(0, 0, 0, 0)

            return next('Discount has expired') if d.expiration and d.expiration < now
            return next('Discount limit exceeded') if d.used.length >= d.uses and d.uses > 0

            d.used.push new Date()
            rate = d.rate
            rate = d.amount / b.subtotalAmount if d.amount > 0
            b.discount.buyer = rate
            buyer.save()
    
    if seller and discountId and discountId.seller
        d = seller.discounts.id(discountId.seller)
        if d
            now = new Date()
            now.setHours(0, 0, 0, 0)

            return next('Discount has expired') if d.expiration and d.expiration < now
            return next('Discount limit exceeded') if d.used.length >= d.uses and d.uses > 0
            
            d.used.push new Date()
            rate = d.rate
            rate = d.amount / b.subtotalAmount if d.amount > 0
            b.discount.seller = rate
            seller.save()

    p = @

    b.state = 'accepted'
    b.date_accepted = new Date()
    p.assigned = b.owner

    unless p.state is 'assigned'
        p.state = 'assigned'
        p.date_assigned = new Date()
        options = 
            to: p.assigned
            message: 'You\'re hired! View job & contact customer.'
            href: '/projects/' + p._id.toString()
            priority: 3
        
        Notification.generate options, (err, n) ->
            console.log err if err

    user.save (err) ->
        console.log err if err
        p.save next(null, p)

project.methods.recordDiffs = (oldProject, next) ->
    diff = new projectDiffModel(
        project: this
    )

    hasDifference = (a, b) ->
        for key, value of a
            return true unless b[key]?

            if typeof a[key] is 'object'
                if typeof a[key].equals is 'function'
                    return true unless a[key].equals b[key]
                else if a[key] instanceof Date
                    return true unless a[key].getTime() is b[key].getTime()
                else
                    return true if hasDifference a[key], b[key]
            else
                return true unless a[key] is b[key]
        return false

    changes = (beforeObject, afterObject) ->
        before = beforeObject
        after = afterObject

        # convert any schemas to plain objects before doing anything
        before = beforeObject.toObject() if typeof beforeObject.toObject is 'function'
        after = afterObject.toObject() if typeof afterObject.toObject is 'function'

        d = {}
        for key, value of before
            # ignore diffs change, since they're inherent to updating projects
            unless key is 'diffs'
                if typeof before[key] isnt typeof after[key]
                    d[key] = {act: 'edit', val: before[key]}
                else
                    if Array.isArray before[key] and Array.isArray after[key]
                        if before[key].length > after[key].length
                            d[key] = {act: 'remove', val: before[key]}
                        else if before[key].length < after[key].length
                            d[key] = {act: 'add', val: before[key]}
                        else
                            if hasDifference before[key], after[key]
                                d[key] = {act: 'both', val: before[key]}
                    else if after[key]?
                        if typeof before[key] is 'object'
                            if typeof before[key].equals is 'function'
                                # check object for .equals for quicker comparisons to avoid unecessary manual recursion
                                unless before[key].equals after[key]
                                    d[key] = {act: 'edit', val: before[key]}
                            else if before[key] instanceof Date
                                unless before[key].getTime() is after[key].getTime()
                                    d[key] = {act: 'edit', val: before[key]}
                            else
                                d[key] = changes before[key], after[key]
                        else
                            unless before[key] is after[key]
                                d[key] = {act: 'edit', val: before[key]}
                    else
                        d[key] = {act: 'remove', val: before[key]}

        return d

    diff.changes = changes oldProject, this

    return next() unless Object.keys(diff.changes).length

    diff.save (err) ->
        next err

# build a permission matrix for a given user
project.methods.permissions = (user) ->
    is_owner    = compare_document(@owner, user)
    is_assigned = compare_document(@assigned, user)
    is_poster   = compare_document(@poster, user)
    return {
        is_owner:     is_owner
        is_assigned:  is_assigned
        can_see_milestones : is_owner or is_assigned or ( @state in ['bidding'])
        is_related:   (is_owner or is_assigned)
        can_cancel:   is_owner and @state in ['bidding']
        can_escrow:   is_owner
        can_edit:     is_owner and @state in ['bidding', 'draft'] or is_poster and @state in ['draft', 'creating', 'reviewing']
        can_hire:     is_owner and @state in ['bidding', 'assigned', 'draft', 'reviewing']
        can_schedule: is_owner and @state in ['assigned']
        can_bid:      (not is_owner) and (@state in ['bidding'] or (@state in ['assigned'] and is_assigned)) or (@state in ['draft', 'creating', 'reviewing'] and is_poster)
        can_comment:  true
        can_rate:     (is_owner or is_assigned) and @assigned and @state in ['finished']
    }

project.methods.rate = (user, stars, notes, next) ->
    return next('Permission denied') unless @permissions(user).can_rate

    if compare_document(@owner, user)
        return next 'Rating already complete for seller' if @sellerRated
        return @assigned.rate(user, this, stars, notes, next)

    if compare_document(@assigned, user)
        return next 'Rating already complete for buyer' if @buyerRated
        return @owner.rate(user, this, stars, notes, next)

project.methods.requestPayment = (requesterId, estimateId, next) ->
    return next 'Project bidding is not opened' unless @state is 'assigned'
    return next 'Mechanic not assigned to project' unless @assigned.equals requesterId

    estimate = @bids.id estimateId
    return next 'Bid not found with id: ' + estimateId unless estimate
    return next 'Payment requests not accepted for this bid' unless estimate.state is 'accepted'

    estimate.state = 'requested'
    estimate.date_requested = new Date()
    @save (err) -> next err, estimate

project.methods.cancel = (user, next) ->
    perms = @permissions(user)
    return next('Permission denied.') unless perms.can_cancel
    @state = 'canceled'
    @date_canceled = new Date()
    @save(next)
    
project.methods.bid = (options, next) ->
    defaults =
        user: null
        parts: null
        labor: null
        comment: ''
        taxRate:
            parts: 0
            labor: 0
        referral:
            buyer: 0
            seller: 0
        discount:
            buyer: 0
            seller: 0
        diagnosisWaiver: 0
        diagnosisWaived: false

    settings = union defaults, options

    perms = @permissions settings.user
    return next 'Permission denied' unless perms.can_bid

    if @assigned
        for b in @bids when compare_document b.owner, settings.user
            if b.state is 'submitted'
                b.state = 'retracted'
                b.date_retracted = new Date()
    else
        for b in @bids when compare_document b.owner, settings.user
            b.state = 'retracted'
            b.date_retracted = new Date()
    
    settings.comment = entities.encode settings.comment

    b = @bids.create
        owner: settings.user._id
        parts: settings.parts
        labor: settings.labor
        comment: settings.comment
        taxRate:
            parts: settings.taxRate.parts
            labor: settings.taxRate.labor
        referral:
            buyer: settings.referral.buyer
            seller: settings.referral.seller
        discount:
            buyer: settings.discount.buyer
            seller: settings.discount.seller
        diagnosisWaiver: settings.diagnosisWaiver
        diagnosisWaived: settings.diagnosisWaived
    
    return next 'Max amount exceeded' unless b.buyerTotal < 10000 * 100
    
    console.log 'THE CREATED BID:'
    console.log b
    
    @bids.push b
    @save (err) ->
        next(err, b)

project.statics.find_near = (filter, next) ->
    finding = state: 'bidding'
    filter.distance = 1000 unless filter.distance
    # When there isnt a location or the user blocks the location
    #  it defaults to 0, 0 which is in the middle of the ocean
    if filter.loc and filter.loc[0] isnt 0 and filter.loc[1] isnt 0
        finding['geo.loc'] =
            $geoNear:
                $geometry:
                    type: "Point" ,
                    coordinates: filter.loc
                # Distance is in meters so divide miles by .00062137
                $maxDistance: filter.distance / 0.00062137

    if filter.vehicleIds?
        finding.vehicle = $in: filter.vehicleIds

    if filter.ownerIds? and filter.ratingIds?
        finding.owner = $in: filter.ownerIds if filter.ownerIds.length > 0

    if filter.posted? and filter.posted isnt 'none'
        today = new Date()
        date = new Date(today.getFullYear(),today.getMonth(),today.getDate() - filter.posted)
        finding.date_created = $gte: date.toISOString()

    if filter.showSeen in ['false', false]
        finding.viewers = $ne: filter.userId

    if filter.userId
        finding.bids =
            $not:
                $elemMatch:
                    user: filter.userId

    q = @find(finding)

    if filter.preference? and filter.preference isnt 'none'
        q.or([{preference: filter.preference},{preference: 'none'}])

    if filter.repair? and filter.repair isnt 'none' and filter.repair
        if filter.repair isnt 'Diagnostic'
            q.where('repair').equals(filter.repair)
            q.where('diagnosis').equals('false')
        else
            q.where('diagnosis').equals('true') if filter.repair is 'Diagnostic'

    q.populate('owner')
    q.populate('assigned')
    q.populate('bids.user')
    q.populate('vehicle')

    q.skip(filter.index).limit(filter.numberOfResults).exec (err, result) ->
        if err
            console.log err
            return next(err)
        q.count (err, total) ->
            return next(err) if err
            next null, result, total

project.statics.find_favorites = (ids, next) ->
    finding = _id: $in: ids

    q = @find(finding)

    q.populate('owner')
    q.populate('assigned')
    q.populate('bids.user')
    q.populate('vehicle')

    q.skip(0).limit(50).exec (err, result) ->
        return next(err) if err
        q.count (err, total) ->
            return next(err) if err
            next null, result, total


project.pre 'save', (next) ->
    return next() if @number?
    @model('project').find().sort('-number').select('number').limit(1).exec (err, projects) =>
        return next(err) if err
        n = 11236
        n = projects[0].number if projects? and projects.length > 0 and projects[0].number?
        n += 10 + Math.floor(Math.random()*90)
        @number = n
        next()

module.exports = mongoose.model('project', project)
module.exports.REPAIRS = REPAIRS
module.exports.projectDiff = projectDiffModel
