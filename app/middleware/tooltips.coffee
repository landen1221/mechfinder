Tooltip = require('../models/tooltip')

module.exports = () ->
    (req, res, next) ->
        Tooltip.find (err, ts) ->
            req.tooltips = []
            req.tooltips = ts if ts
            next()
            