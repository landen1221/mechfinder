mongoose = require('mongoose')
Currency = require('./types/currency')
Numeric = require('./types/numeric')

Line = new mongoose.Schema
    type: {
        type: String
        default: 'parts'
        enum: [
            'parts',
            'labor',
            'other'
        ]
    }
    description: { type: String, trim: true }
    price:       Currency(default: 0, max: 100000)
    quantity:    Numeric(default: 1, min: 0, max: 1000)
    subtotal:    Currency(default: 0)

Payment = new mongoose.Schema
    amount: Currency(default: 0, max: 100000)
    date_payed: { type: Date }

invoice = new mongoose.Schema
    
    owner:       { type: mongoose.Schema.Types.ObjectId, ref: 'user' }
    user:        { type: mongoose.Schema.Types.ObjectId, ref: 'user' }
    project:     { type: mongoose.Schema.Types.ObjectId, ref: 'project' }

    lines:       [Line]
    discount:    Currency(default: 0, max: 100000)       # flat discount, positive number
    tax_rate:    Numeric(default: 0, min: 0, max: 100)   # tax rate in 1..100% form, not 0.0 to 1.0
    tax_amount:  Currency(default: 0)
    total:       Currency(default: 0)

    payments:    [Payment]
    total_payed: Currency(default: 0)
    total_owed:  Currency(default: 0)

    state: {
        type: String
        default: -> 'open'
        enum: [
            'open',     # open invoice, not fully paid
            'closed',   # paid in full
            'disputed', # user disputed invoice amount or project work
            'canceled', # mechanic canceled invoice
        ]
    }
    date_opened:   { type: Date, default: -> new Date() }
    date_closed:   { type: Date }
    date_disputed: { type: Date }
    date_canceled: { type: Date }

invoice.methods.addline = (price, amount, type, description, next) ->
    l = @lines.create(
        price: price
        amount: amount
        type: type
        description:  description
    )
    @lines.push(l)
    @save (err) -> next(err, l)

invoice.methods.compute = (next) ->
    
    sub = 0
    for x in this.lines
        x.subtotal = x.price * x.quantity
        sub += x.subtotal
    this.discount = sub if this.discount > sub
    sub -= discount
    this.tax_amount = sub * this.tax_rate / 100
    this.total = sub + tax_amount

    payed = 0
    for x in this.payments
        payed += x.amount
    this.total_payed = payed
    this.total_owed = this.total - this.total_payed
    @save (err) -> next(err)    

module.exports = mongoose.model('invoice', invoice)