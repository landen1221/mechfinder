{Mail} = require('../models')

module.exports = ->
    (req, res, next) ->
        return next() unless req.user and not req.xhr
        Mail.count {to: req.user, read: false}, (err, unread_mail) ->
            return res.send 500, err if err
            res.locals.unread_mail_count = unread_mail
            next()