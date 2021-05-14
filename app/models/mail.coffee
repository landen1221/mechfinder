mongoose = require('mongoose')
humanize = require('humanize')

mail = new mongoose.Schema
    from:     { type: mongoose.Schema.Types.ObjectId, ref: 'user' }
    to:       { type: mongoose.Schema.Types.ObjectId, ref: 'user' }
    reply:    { type: mongoose.Schema.Types.ObjectId, ref: 'mail' }
    subject:  { type: String }
    body:     { type: String }
    format:   { type: String, enum: [ 'text', 'html', 'markdown' ], default: 'text' }
    sent:     { type: Date, default: -> new Date() }
    read:     { type: Boolean, default: false }

module.exports = mongoose.model('mail', mail)