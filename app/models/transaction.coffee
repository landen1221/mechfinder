mongoose = require('mongoose')
Currency = require('./types/currency')

# transaction = new mongoose.Schema
#     from:           { type: mongoose.Schema.Types.ObjectId, ref: 'user' }
#     to:             { type: mongoose.Schema.Types.ObjectId, ref: 'user' }
#     project:        { type: mongoose.Schema.Types.ObjectId, ref: 'project'}
#     reason:         { type: String, trim: true, default: '' }
#     method:         { type: String, trim: true, default: '' }
#     amount:         { type: Number, default: 0, min: 0 }
#     fee:            { type: Number, default: 0, min: 0 }
#     orderNumber:    { type: String, default: '' }
#     status:         {
#                         type: String,
#                         enum: ['settlement_pending','settlement_declined','settled','settling','submitted_for_settlement','voided','failed','gateway_rejected','processor_declined','authorization_expired','authorized']
#                     }
#     escrowStatus:   { type: String, trim: true, default: '' }
#     date:           { type: Date, default: -> new Date() }

Transaction = new mongoose.Schema
    from:           { type: mongoose.Schema.Types.ObjectId, ref: 'user' }   # who paid it
    to:             { type: mongoose.Schema.Types.ObjectId, ref: 'user' }   # who it was paid to
    project:        { type: mongoose.Schema.Types.ObjectId, ref: 'project'} # associated project
    orderNumber:    { type: String, default: '' }                           # braintree order number
    referral:
        buyer:      Currency()                                              # buyer referral dollar amount (not %)      
        seller:     Currency()                                              # buyer referral dollar amount (not %)
    # reason:         { type: String, trim: true, default: '' }               # reason for the transaction
    # method:         { type: String, trim: true, default: '' }               # method ?
    # refundNumber:   { type: String, default: '' }                           # braintree refund number
    # amount:         Currency()                                              # for estimates, parts + labor + tax
    # date:           { type: Date, default: -> new Date() }                  # transaction timestamp
    # escrowStatus:   { type: String, trim: true, default: '' }
    # status:
    #     type: String
    #     enum: [
    #         'settlement_pending'
    #         'settlement_declined'
    #         'settled'
    #         'settling'
    #         'submitted_for_settlement'
    #         'voided'
    #         'failed'
    #         'gateway_rejected'
    #         'processor_declined'
    #         'authorization_expired'
    #         'authorized'
    #     ]

    # old stuff used for evolving older transactions before remodel
    # fee:            { type: Number, default: 0, min: 0 }



module.exports = mongoose.model('transaction', Transaction)
