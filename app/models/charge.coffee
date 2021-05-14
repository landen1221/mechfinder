mongoose = require('mongoose')
humanize = require('humanize')
stripe = require("stripe")(MF.properties.stripe.back)
{Vehicle, TYPES}  = require('./vehicle')
Currency = require('./types/currency')
Settings = require('./settings')
Numeric  = require('./types/numeric')
Image = require('./types/image')
{compare_document, normalize_state, expand_state} = require('../util')

Charge = new mongoose.Schema

    charge : Object
    paypal : Object
    date:
        type: Date
        default: Date.now
    project:
        type: mongoose.Schema.Types.ObjectId
        ref: 'project'
    state:
        type: String
        default: -> 'open'
        enum: [
            'open',     # open charge, not assigned to mechanic
            'assigned',     # assigned charge
            'closed',   # paid in full
            'requested', # user requested invoice amount
            'disputed', # user disputed invoice amount or project work
            'canceled', # mechanic canceled invoice
        ]
    type: { type: String, enum: ['paypal', 'stripe', 'balance'] }
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'user' }
    dispute: { type: mongoose.Schema.Types.ObjectId, ref: 'dispute' }
    assigned: { type: mongoose.Schema.Types.ObjectId, ref: 'user' }
    date_opened:   { type: Date, default: -> new Date() }
    date_closed:   { type: Date }
    date_disputed: { type: Date }
    date_canceled: { type: Date }
    date_requested: { type: Date }
# build a permission matrix for a given user

Charge.virtual('amount').get ->
    return @charge.amount unless @type is 'paypal'
    return @paypal.mc_gross * 100
Charge.virtual('desc').get ->
    return @charge.description unless @type is 'paypal'
    return @paypal.item_name
Charge.methods.permissions = (user) ->
    is_owner    = compare_document(@owner, user)
    is_assigned = compare_document(@assigned, user)
    return {
        is_owner:     is_owner
        is_assigned:  is_assigned
        is_related:   (is_owner or is_assigned)
        can_cancel:   (is_assigned and @state in ['assigned', 'disputed','requested']) or ( is_owner and @state in ['open'])
        can_request:   is_assigned and @state in ['assigned']
        can_assign:   is_owner and @state in ['open']
        can_dispute:   (is_owner or is_assigned) and @state in ['assigned', 'requested']
        can_release:  is_owner and @state in ['assigned', 'disputed','requested']
        can_interact:  (is_owner or is_assigned) and @state in ['assignd','disputed','requested']
        can_resolve: (is_owner or is_assigned) and @state is 'disputed'
    }

Charge.methods.release = (user, next) ->
    perms = @permissions(user)
    return next('Permission denied.') unless perms.can_release
    @state = 'closed'
    @date_closed = new Date
    c = @
    @save (err) ->
        if err
            return next(err)
        c.assigned.createTransaction (c.amount/100), c.project, 'release', 'charge', c, (error) ->
            return next err if err
            Settings.getsettings (err,settings) ->
                next(err) if err
                c.assigned.createTransaction -((c.amount/100) * (settings.charge/100 ) ), c.project, 'mechfinder charges', 'charge', c, (error) ->
                return next err if err
                next();

Charge.methods.leave = (amount, next) ->
    perms = @permissions(req.user)
    return next('Permission denied.') unless perms.is_owner
    return next('Permission denied.') unless @state is 'open'
    ch = @
    console.log amount, ' amount' , ch.amount , ' ch amount'
    if amount >= 0
        console.log 11
        @state = 'canceled'
        @date_canceled = new Date
        @save (err) ->
            return next(err) if err
            user.createTransaction (ch.amount/100), ch.project, 'from milestone fix', 'charge', ch, (err) ->
                return next(err) if err
    if amount > 0
        ch = new @models
        user.createTransaction -amount, ch.project, 'from milestone fix', 'charge', ch, (err) ->
            return next(err) if err
            ch.save(next)
    if amount < 0
        console.log 13
        console.log @amount, amount , 'Amount unknown case yet '
        next()
Charge.methods.assign = (user, assignee, next) ->
    perms = @permissions(user)
    return next('Permission denied2.') unless perms.can_assign
    @state = 'assigned'
    @assigned = assignee
    @save(next)


Charge.methods.request = (user, next) ->
    perms = @permissions(user)
    return next('Permission denied.') unless perms.can_request
    @state = 'requested'
    @date_requested = new Date
    return @save(next)

Charge.methods.createdispute = (user, dispute, next) ->
    perms = @permissions(user)
    return next('Permission denied.') unless perms.can_dispute
    @state = 'disputed'
    @dispute = dispute
    @date_disputed = new Date
    @save(next)

Charge.methods.reactivate = (next) ->
    @state = 'open'
    @dispute = null
    @date_disputed = null
    @save(next)

Charge.methods.cancel = (user, next) ->
    perms = @permissions(user)
    return next('Permission denied3.') unless perms.can_cancel
    @state = 'canceled'
    @date_canceled = new Date
    c = @
    @save (err) ->
        if err
            return next(err)
        c.owner.createTransaction (c.amount/100), c.project, 'cancel', 'charge', c, (error) ->
            return next err if err
            next()

Charge.methods.ownercancel = (user, next) ->
    perms = @permissions(user)
    return next('Permission denied3.') unless perms.can_cancel
    @state = 'canceled'
    @date_canceled = new Date
    c = @
    @save (err) ->
        if err
            return next(err)
        user.createTransaction (c.amount/100), c.project, 'cancel', 'charge', c, (error) ->
            return next err if err
            next()
Charge.methods.acceptoffer = (user, offer, next) ->
    perms = @permissions(user)
    return next('Permission denied4.') unless perms.can_resolve
    extra =  @amount/100 - offer.amounttoaccept
    if extra
        user.createTransaction (extra/100), c.project, 'cancel', 'charge', c, (error) ->
            return next err if err
            next()


Charge.methods.fixExtra = (user, offer, next)->

module.exports = mongoose.model('charge', Charge)
