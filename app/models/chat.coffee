mongoose = require('mongoose')
moment = require('moment')

chat = new mongoose.Schema
    from:    { type: mongoose.Schema.Types.ObjectId, ref: 'user' }
    to:      { type: mongoose.Schema.Types.ObjectId, ref: 'user' }
    date:    { type: Date, default: -> new Date() }
    message: { type: String, trim: true }

chat.statics.find_since = (user, last_check, next) ->
    this.find().or([{to: user},{from: user}]).where('date').gt(last_check).populate('from').populate('to').sort('date').exec(next)

module.exports = mongoose.model('chat', chat)
