mongoose = require('mongoose')

comment = new mongoose.Schema

    topic:    { type: mongoose.Schema.Types.ObjectId }
    user:     { type: mongoose.Schema.Types.ObjectId, ref: 'user' }
    comments: { type: String, trim: true }
    
    # comment state machine
    state: {
        type: String
        default: -> 'submitted'
        enum: [
            'submitted',
            'retracted',
            'spam'
            
        ]
    }
    date_submitted:  { type: Date, default: -> new Date() }
    date_retracted:  { type: Date }
    date_spam:       { type: Date }

comment.statics.findRecentByTopic = (t, limit, next) ->
    this.find(topic: t, state: 'submitted')
        .populate('user')
        .sort('-date_submitted')
        .limit(limit)
        .exec next

comment.statics.findByTopic = (t, next) ->
    this.find(topic: t, state: 'submitted')
        .populate('user')
        .sort('-date_submitted')
        .exec next

module.exports = mongoose.model('comment', comment)