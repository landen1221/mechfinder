mongoose = require('mongoose')
{union} = require('../util')
User = require('../models/user')

holla = new mongoose.Schema
    user:           { type: mongoose.Schema.Types.ObjectId, ref: 'user' }
    message:        { type: String, trim: true }
    href:           { type: String, trim: true, default: '' }
    acknowledged:   { type: Date }
    date:           { type: Date, default: () -> new Date() }

holla.statics.generate = (options, next) ->
    realNext = () -> return null
    realNext = next if next
    next = realNext

    defaults =
        user: ''
        message: ''
        href: ''

    settings = union defaults, options

    return next 'Missing required options' unless settings.user and settings.message

    Holla = @
    User.findById settings.user, (err, u) ->
        return next err if err
        return next 'User not found' unless u

        h = new Holla(
            user: u._id
            message: settings.message
            href: settings.href
        )

        h.save (err) ->
            return next err if err
            return next null, h

holla.statics.back = (ids, next) ->
    realNext = () -> return null
    realNext = next if next
    next = realNext

    ids = if Array.isArray ids then ids else [ids]

    oids = []
    oids.push mongoose.Types.ObjectId id.toString() for id in ids
        
    q = this.find({'_id': { $in: oids }})

    q.exec (err, hollas) ->
        return next err if err
        return next 'No IDs found to update' unless hollas

        for h in hollas
            h.acknowledge = new Date()

        saveHollas = (i, hollas, after) ->
            if i < ns.length
                ns[i].save (err) ->
                    saveHollas i + 1, hollas, after
            else
                after hollas

        saveHollas 0, hollas, (hs) ->
            return next null, hs

module.exports = mongoose.model('holla', holla)
