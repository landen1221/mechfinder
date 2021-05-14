mongoose = require('mongoose')

User = require('./user')
Project = require('./project')

STATE = [
    'open'      # ticket is open
    'responded' # MF rep has responded to the ticket
    'resolved'  # user has had their issue resolved
    'closed'    # admin closed the ticket, but the issue wasn't resolved
]

Ticket = new mongoose.Schema
    number:     { type: Number, unique: true }
    user:       { type: mongoose.Schema.Types.ObjectId, ref: 'user' }
    project:    { type: mongoose.Schema.Types.ObjectId, ref: 'project' }
    category:   { type: String, trim: true, default: '' }
    message:    { type: String, trim: true, default: '' }
    state:      { type: String, trim: true, default: 'open', enum: STATE }
    created:    { type: Date, default: -> new Date() }
    responded:  { type: Date }
    resolved:   { type: Date }
    closed:     { type: Date }

Ticket.pre 'save', (next) ->
    return next() if @number?

    @model('ticket').find().sort('-number').select('number').limit(1).exec (err, tickets) =>
        return next(err) if err
        n = 11236
        n = tickets[0].number if tickets? and tickets.length > 0 and tickets[0].number?
        n += 10 + Math.floor(Math.random()*90)
        @number = n
        next()

module.exports = mongoose.model('ticket', Ticket)