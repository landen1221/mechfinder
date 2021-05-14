{User} = require('../models')
moment = require('moment')

# ['log', 'warn', 'dir'].forEach (method) ->
#     old = console[method]
#     console[method] = ->
#         stack = (new Error()).stack.split(/\n/)
#         if stack[0].indexOf 'Error' is 0
#             stack = stack.slice 1
#
#         args = [].slice.apply(arguments).concat([stack[1].trim()])
#         return old.apply console, args

module.exports = () ->
    (req, res, next) ->
        logData =
            time: new Date().toISOString()
            ip: req.ip
            method: req.method
            path: req.path
            body: req.body
            params: req.params
        console.log( JSON.stringify(logData) )
        next()
