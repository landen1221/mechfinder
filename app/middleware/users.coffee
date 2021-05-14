{User} = require('../models')

module.exports = ->
    (req, res, next) ->
        User.count (err, total_users) ->
            return res.send 500, err if err
            res.locals.total_users_count = total_users
            User.count role: 'seller', (err, total_mechanics) ->
                return res.send 500, err if err
                res.locals.total_mechanics_count = total_mechanics
                next()
