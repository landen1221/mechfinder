mongoose = require('mongoose')

content = new mongoose.Schema
    markup:       { type: String, default: 'Content goes here...', trim: true }
    previous:   { type: String, default: '', trim: true }
    title:      { type: String, default: 'Title', trim: true }
    updated:    { type: Date, default: -> new Date() }
    updater:    { type: mongoose.Schema.Types.ObjectId, ref: 'user' }

module.exports = mongoose.model('content', content)
