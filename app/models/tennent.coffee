mongoose = require('mongoose')

tennent = new mongoose.Schema
    active: {
        type: Boolean
        default: true
        example: 'Site is active and available.'
        help: 'If not active the site will not respond on the url.'
    }
    name: String
    pattern: String
    employees: Number
    theme: {
        bg: { type: String, title: 'Background',  help: 'Background color of the entire site.', example: '#ffffff' }
        fg1: String
        fg2: String
        logo: Buffer
    }
    created: {
        type: Date,
        default: -> new Date()
    }

module.exports = mongoose.model('tennent', tennent)
