# Handle files uploaded through ajax using application/octet-stream and x-file-name symantics
fs = require('fs')
uuid = require('node-uuid')
path = require('path')

module.exports = (opts) ->
    opts ?= {}
    uploadDir = opts.uploadDir or '/tmp'
    (req, res, next) ->
        return next() unless req.xhr and req.header('x-file-name')
        extension = path.extname(req.header('x-file-name'))
        filename = uuid.v4() + extension
        tmpFilePath = path.join(uploadDir, filename)
        req.files ?= {}
        req.body ?= {}
        req._body = true
        ws = fs.createWriteStream(tmpFilePath);
        ws.on 'close', (err) ->
            req.files['qqfile'] =
                path: tmpFilePath
                name: req.header('x-file-name')
                type: req.header('x-mime-type')
            next()
        req.pipe(ws);