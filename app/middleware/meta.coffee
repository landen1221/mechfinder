url = require('url')
{shallow, merge} = require('../util')

module.exports = (file) -> 
    Meta = require('../models/meta')(file)
    (req, res, next) ->
        (res.locals.meta = req.meta = Meta.find(url.parse(req.url).path)) unless req.xhr
        next()