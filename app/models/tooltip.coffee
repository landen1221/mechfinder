mongoose = require('mongoose')

tooltip = new mongoose.Schema
    text:   { type: String, default: 'Click for more...', trim: true }
    href:   { type: String, default: '/', trim: true }
    clicks: { type: Number, default: 0 }

module.exports = mongoose.model('tooltip', tooltip)
