mongoose = require('mongoose')
moment = require('moment')
{compare_document} = require('../util')

event = new mongoose.Schema
         
    project:           { type: mongoose.Schema.Types.ObjectId, ref: 'project' }
    user:              { type: mongoose.Schema.Types.ObjectId, ref: 'user' }
    mechanic:          { type: mongoose.Schema.Types.ObjectId, ref: 'user' }
    notes:             { type: String, trim: true }
    location:          { type: String, trim: true }
    date:              { type: Date }

    # event state machine
    state: {
        type: String
        default: -> 'submitted'
        enum: [
            'notes'
            'submitted'
            'accepted'
            'rejected'
            'canceled'
        ]
    }
    date_submitted:    { type: Date, default: -> new Date() }
    date_accepted:     { type: Date }
    date_rejected:     { type: Date }
    date_canceled:     { type: Date }

event.methods.permissions = (user) -> 
    is_user = compare_document(user, this.user)
    is_mechanic = compare_document(user, this.mechanic)
    return {
        can_view:       is_user or is_mechanic
        can_comment:    this.state in ['submitted', 'accepted', 'rejected'] and (is_user or is_mechanic)
        can_accept:     this.state is 'submitted' and is_mechanic
        can_reject:     this.state in ['submitted', 'accepted'] and is_mechanic
        can_reschedule: this.state in ['submitted', 'accepted', 'rejected'] and is_user
        can_cancel:     this.state in ['submitted', 'accepted', 'rejected'] and is_user
    }

event.methods.comment = (user, comments, next) ->
    return next('Permission denied.') unless this.permissions(user).can_comment
    return next() unless comments? and comments.length > 0
    this.model('comment').create {
            topic: this
            user: user
            comments: comments
        }, next

event.methods.accept = (user, comments, next) ->
    return next('Permission denied.') unless this.permissions(user).can_accept
    this.state = 'accepted'
    this.date_accepted = new Date()
    this.save (err) => 
        return next(err) if err
        this.comment(user, comments, next)

event.methods.reject = (user, comments, next) ->
    return next('Permission denied.') unless this.permissions(user).can_reject
    this.state = 'rejected'
    this.date_rejected = new Date()
    this.save (err) =>
        return next(err) if err
        this.comment(user, comments, next)

event.methods.reschedule = (user, location, date, comments, next) -> 
    return next('Permission denied.') unless this.permissions(user).can_reschedule
    this.state = 'submitted'
    this.date = date
    this.location = location
    this.save (err) =>
        return next(err) if err
        this.comment(user, comments, next)

event.methods.cancel = (user, next) -> 
    return next('Permission denied.') unless this.permissions(user).can_cancel
    this.state = 'canceled'
    this.date_canceled = new Date()
    this.save(next)

event.statics.findByUser = (user, next) ->
    this.find(
            state: { $in: ['notes', 'submitted', 'accepted', 'rejected'] }
            $or: [{ user: user }, {mechanic: user }])
        .sort('+date_submitted')
        .select('date state')
        .exec(next)

event.statics.findByDay = (user, day, next) ->
    a = moment(day).clone().startOf('day').toDate()
    b = moment(day).clone().endOf('day').toDate()
    this.find(
            date: { $gte: a, $lte: b }
            $or: [{ user: user }, { mechanic: user }]
        )
        .populate('user')
        .populate('mechanic')
        .populate('project')
        .sort('+date_submitted')
        .exec(next)

event.statics.notes = (user, day, next) ->
    a = moment(day).clone().startOf('day').toDate()
    b = moment(day).clone().endOf('day').toDate()
    this.findOne(
            user: user
            date: { $gte: a, $lte: b }
            state: 'notes'
        ).exec (err, e) ->
            return next(err) if err
            e = new Event(
                user: user
                state: 'notes'
                date: moment(day).clone().startOf('day').toDate()
            ) unless e
            next(null, e)

module.exports = Event = mongoose.model('event', event)