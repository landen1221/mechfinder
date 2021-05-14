moment = require('moment')
{User, Chat} = require('../models')
{document_id, compare_document} = require('../util')

exports.send = (req, res) ->
    return res.send 403 unless req.user
    return exports.check(req, res) if compare_document(req.body.to, req.user)
    User.findById req.body.to, (err, to) ->
        return res.send 500, err if err
        return res.send 404 unless to
        c = new Chat
            from: req.user
            to: to
            message: req.body.message
        c.save (err) ->
            return res.send 500, err if err
            exports.check(req, res)

exports.check = (req, res) ->
    now = new Date()
    d = req.query.d or req.body.d
    last_check = (if d then new Date(d) else moment().add('m', -20).toDate())
    return res.send 403 unless req.user
    Chat.find_since req.user, last_check, (err, chats) ->
        return res.send 500 if err
        return res.send 404 unless chats
        res.send {
            date: now, 
            chats: ({ 
                _id: c._id,
                from: {
                    _id: c.from._id
                    name: c.from.name
                    picture: if c.from.profile then document_id(c.from.profile.picture) else null
                },
                to: {
                    _id: c.to._id
                    name: c.to.name
                    picture: if c.to.profile then document_id(c.to.profile.picture) else null
                }
                date: c.date,
                message: c.message
            } for c in chats)
        }
