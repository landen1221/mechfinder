url = require('url')

module.exports = () ->
    (req, res, next) ->
        # determine if user is logged in or not
        res.locals.xhr = req.xhr
        res.locals.path = req.path
        if req.xhr
            res.locals.layout = null
        #else if req.session and req.session.authenticated
        #    res.locals.layout = 'layouts/user'
        else
            res.locals.layout = 'layouts/public'
        next()
