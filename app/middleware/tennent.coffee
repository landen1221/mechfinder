{Tennent} = require('../models')

module.exports = () -> 
    (req, res, next) ->
        host = req.headers.host.split(':')[0]
        Tennent.findOne {pattern: host}, (err, t) -> 
            res.tennent = t
            res.locals.tennent = t
            next()