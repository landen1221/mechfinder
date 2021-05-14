mongoose = require('mongoose')
{union} = require('../util')
User = require('../models/user')

priority =
    NONE: 0
    LOW: 1
    MEDIUM: 2
    HIGH: 3

notification = new mongoose.Schema
    to:         { type: mongoose.Schema.Types.ObjectId, ref: 'user' }
    message:    { type: String, trim: true }
    priority:   { type: Number, default: priority.LOW }
    href:       { type: String, trim: true, default: '' }
    seen:       { type: Date }
    clicked:    { type: Date }
    date:       { type: Date, default: () -> new Date() }

notification.statics.generate = (options, next) ->
    realNext = () -> return null
    realNext = next if next
    next = realNext

    defaults =
        to: ''
        message: ''
        priority: -1,
        href: ''

    settings = union defaults, options

    return next 'Missing required options' unless settings.to and settings.message
    return next 'Priority must be at least 0' unless settings.priority >= 0

    Notification = @
    User.findById settings.to, (err, u) ->
        return next err if err
        return next 'User not found' unless u

        n = new Notification(
            to: u._id
            message: settings.message
            priority: settings.priority
            href: settings.href
        )

        filter = 
            to: n.to
            message: n.message
            priority: n.priority
            href: n.href

        Notification.findOne filter, (err, notif) ->
            return next err if err
            n = notif if notif
            n.date = new Date()
            n.seen = null
            n.clicked = null

            n.save (err) ->
                return next err if err
                return next null, n

notification.statics.markSeen = (ids, next) ->
    realNext = () -> return null
    realNext = next if next
    next = realNext

    ids = if Array.isArray ids then ids else [ids]

    oids = []
    oids.push mongoose.Types.ObjectId id.toString() for id in ids
        
    q = this.find({'_id': { $in: oids }})

    q.exec (err, ns) ->
        return next err if err
        return next 'No IDs found to update' unless ns

        for n in ns
            n.seen = new Date()

        saveNotifications = (i, nots, after) ->
            if i < ns.length
                ns[i].save (err) ->
                    saveNotifications i + 1, nots, after
            else
                after nots

        saveNotifications 0, ns, (nots) ->
            return next null, nots

notification.statics.markClicked = (ids, next) ->
    realNext = () -> return null
    realNext = next if next
    next = realNext

    ids = if Array.isArray ids then ids else [ids]

    oids = []
    oids.push mongoose.Types.ObjectId id.toString() for id in ids
        
    q = this.find({'_id': { $in: oids}})

    q.exec (err, ns) ->
        return next err if err
        return next 'No IDs found to update' unless ns

        for n in ns
            n.clicked = new Date()
            n.seen = new Date()
        
        saveNotifications = (i, nots, after) ->
            if i < ns.length
                ns[i].save (err) ->
                    saveNotifications i + 1, nots, after
            else
                after nots
        
        saveNotifications 0, ns, (nots) ->
            return next null, nots


module.exports = mongoose.model('notification', notification)
