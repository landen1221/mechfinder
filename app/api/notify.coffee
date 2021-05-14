mongoose = require('mongoose')
{User} = require('../models')
Notification = require('../models/notification')

GET_LIMIT = 20

exports.get = (req, res) ->
    return res.send 403, {err: 'Not logged in'} unless req.user
    skip = if req.params.skip and (not isNaN(parseInt(req.params.skip))) then req.params.skip else 0

    Notification.find({to: req.user._id}).limit(GET_LIMIT).skip(skip).sort('-date').exec (err, n) ->
        return res.send 500, {err: err} if err
        return res.send n

exports.click = (req, res) ->
    return res.send 403, {err: 'Not logged in'} unless req.user
    return res.send 400, {err: 'Missing required parameters'} unless req.params.id

    Notification.findById req.params.id, (err, n) ->
        return res.send 500, {err: err} if err
        return res.send 404, {err: 'Notification not found'} unless n

        Notification.find {href: n.href}, (err, ns) ->
            ids = []
            ids.push notification._id for notification in ns

            Notification.markClicked ids, (err, ns) ->
                return res.send 500, {err: err} if err
                return res.send n

exports.see = (req, res) ->
    return res.send 403, {err: 'Not logged in'} unless req.user
    return res.send 400, {err: 'Missing required fields'} unless req.body.ids

    ids = if Array.isArray req.body.ids then req.body.ids else [req.body.ids]
    return res.send 400, {err: 'Must send at least one notification ID'} unless ids.length > 0

    Notification.markSeen ids, (err, n) ->
        return res.send 500, {err: err} if err
        return res.send n

exports.clear = (req, res) ->
    return res.send 403, {err: 'Not logged in'} unless req.user
    
    q = Notification.find {to: req.user._id}
    q.exec (err, nots) ->
        return res.send 500, {err: err} if err
        return res.send [] unless nots and nots.length > 0
        ids = []
        ids.push n._id for n in nots

        Notification.markClicked ids, (err, ns) ->
            return res.send 500, {err: err} if err
            return res.send ns
