mongoose = require('mongoose')
humanize = require('humanize')
stripe = require("stripe")(MF.properties.stripe.back)
{Vehicle, TYPES}  = require('./vehicle')
Currency = require('./types/currency')
Numeric  = require('./types/numeric')
Image = require('./types/image')
{compare_document, normalize_state, expand_state} = require('../util')

Message = new mongoose.Schema
    user    : { type: mongoose.Schema.Types.ObjectId, ref: 'user' }
    date    :
        type: Date
        default: Date.now
    message : String

Dispute = new mongoose.Schema

    charge :{ type: mongoose.Schema.Types.ObjectId, ref: 'charge' }
    owner:{ type: mongoose.Schema.Types.ObjectId, ref: 'user' }
    secondparty:{ type: mongoose.Schema.Types.ObjectId, ref: 'user' }
    issuedByOwner: Boolean
    winner:{ type: mongoose.Schema.Types.ObjectId, ref: 'user' }
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
            'open',     # open charge, not paid to mechanic
            'canceled',   # initiator canceled
            'arbitration',    # went into arbitration
            'closed'    # won by either party
        ]
    incident    :
        description :   String
        amountdisputed: Currency()
        amounttoaccept: Currency()
    messages    : [Message]
    date_opened:   { type: Date, default: -> new Date() }
    date_closed:   { type: Date }
    date_arbitered: { type: Date }
    date_canceled: { type: Date }
# build a permission matrix for a given user
Dispute.methods.permissions = (user) ->
    is_owner    = compare_document(@owner, user)
    is_assigned = compare_document(@secondparty, user)
    return {
        is_owner:     is_owner
        is_assigned:  is_assigned
        is_related:   (is_owner or is_assigned)
        can_cancel:   is_owner and @state in ['open']
        can_accept:   is_assigned and @state in ['open', 'arbitration']
        can_interact:  (is_owner or is_assigned) and @state in ['open']
    }
Dispute.methods.accept = (user, next) ->
    perms = @permissions(user)
    return next('Permission denied.') unless perms.can_accept
    @state = 'closed'
    @date_closed = new Date
    @save(next)

Dispute.methods.cancel = (user, next) ->
    perms = @permissions(user)
    return next('Permission denied.') unless perms.can_cancel
    @state = 'canceled'
    @date_canceled = new Date
    @save(next)

Dispute.methods.message = (message, user, next ) ->
    perms = @permissions(user)
    return next('Permission denied.') unless perms.can_interact
    m = @messages.create {
        user:user
        message:message
    }
    @messages.push(m)
    @save (err) -> next(err, m)

module.exports = mongoose.model('dispute', Dispute)
