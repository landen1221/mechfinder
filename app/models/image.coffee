# crypto = require('crypto')
# fs = require('fs')
# path = require('path')
# mime = require('mime')
# url = require('url')
# util = require('util')
# mongoose = require('mongoose')
# StreamBuffer = require('stream-buffers')
# bucket = require('../aws').ugc
# {exec, spawn} = require('child_process')
#
# ImageVersion = new mongoose.Schema
#     url:          { type: String }
#     content_type: { type: String }
#     size:         { type: Number }
#     width:        { type: Number, min: 1 }
#     height:       { type: Number, min: 1 }
#     strategy:     { type: String, enum: ['inside', 'outside', 'stretch'] }
#     hash:         { type: String }
#     created:      { type: Date, default: -> new Date() }
#     accessed:     { type: Date, default: -> new Date() }
#
# Image = new mongoose.Schema
#     filename:     { type: String }
#     url:          { type: String }
#     content_type: { type: String }
#     size:         { type: Number, min: 1 }
#     width:        { type: Number, min: 1 }
#     height:       { type: Number, min: 1 }
#     hash:         { type: String }
#     versions:     [ImageVersion]
#     references:   { type: Number, min: 0, default: 0 }
#     created:      { type: Date, default: -> new Date() }
#
# # returns a request for the original object, as a stream
# Image.methods.load_original = (next) ->
#     req = bucket.get(url.parse(this.url).pathname)
#     req.on 'error', (err) -> next(err)
#     req.on 'response', (response) -> next(null, response)
#     req.end()
#
# Image.methods.find_version = (w, h, strategy) ->
#     for v in this.versions
#         return v if v.width is w and
#                     v.height is h and
#                     v.strategy is strategy
#     return null
#
# # next(err, hash, Buffer)
# resize_image = (buf, w, h, strategy, next) ->
#
#     args = [
#         '-define', "jpeg:size=#{w*2}x#{h*2}",                                           # limit amount of jpeg data read
#         '-',                                                                            # load raster data from stdin
#         '-thumbnail', (if strategy is 'outside' then "#{w}x#{h}^" else "#{w}x#{h}")]    # use thumbnail scaling strategy
#     args.push '-gravity', 'Center', '-crop', "#{w}x#{h}" if strategy is 'outside'       # crop down to final size (size wxh^ produces something too big)
#     args.push '-'                                                                       # emit raster data to stdout
#
#     out = new StreamBuffer.WritableStreamBuffer(initialSize: buf.length)
#     hash = crypto.createHash('md5')
#     child = spawn 'convert', args, { stdio: ['pipe', 'pipe', 'pipe'] }
#     child.stdout.on 'data', (data) -> out.write(data)
#     child.on 'close', (result) ->
#         return next("convert failed with #{result}") if result isnt 0
#         data = out.getContents()
#         hash.update(data)
#         hash = hash.digest('base64')
#         next(null, hash, data)
#
#     child.stdin.end(buf)
#
# # next(err, ImageVersion, Buffer or Stream)
# Image.methods.load_version = (w, h, strategy, next) ->
#
#     # look for existing version
#     v = this.find_version(w, h, strategy)
#     if v
#         req = bucket.get(url.parse(v.url).pathname)
#         req.on 'error', (err) -> next(err)
#         req.on 'response', (response) -> next(null, v, response)
#         req.end()
#         return
#
#     # load original data
#     this.load_original (err, stream) =>
#         next(err) if err
#         buf = new StreamBuffer.WritableStreamBuffer(initialSize: this.size)
#         stream.pipe(buf)
#         stream.on 'error', (err) -> next(err)
#         stream.on 'end', =>
#             resize_image buf.getContents(), w, h, strategy, (err, hash, buf) =>
#
#                 # return the resized thumbnail content asap
#                 return next(err) if err
#                 x = url.parse(this.url).pathname
#                 fn = "#{path.basename(x, path.extname(x))}-#{w}x#{h}-#{strategy}.jpeg"
#                 size = buf.length
#                 v = {
#                     url:          bucket.http('/' + fn)
#                     content_type: 'image/jpeg'
#                     size:         size
#                     width:        w
#                     height:       h
#                     strategy:     strategy
#                     hash:         hash
#                     created:      new Date()
#                     accessed:     new Date()
#                 }
#                 next(null, v, buf)
#
#                 # upload to aws
#                 req = bucket.put(fn,
#                     'Content-Length': size
#                     'Content-Type': 'image/jpeg'
#                     'Content-MD5': hash
#                     'x-amz-acl': 'public-read'
#                     'x-amz-storage-class': 'REDUCED_REDUNDANCY'
#                 )
#                 req.end(buf)
#                 req.on 'error', (err) -> console.log "Error sending thumbnail to AWS: #{err}"
#                 req.on 'response', (res) =>
#                     return console.log "Received non-200 status from AWS: #{res.statusCode}" if res.statusCode != 200
#                     res.on 'data', (data) =>
#                     res.once 'end', (err) =>
#
#                         # save the version
#                         return console.log "Received error from AWS response: #{err}" if err
#                         this.versions.push(v)
#                         this.save (err) -> console.log "Failed to save ImageVersion: #{err}" if err
#
# Image.statics.from_file = (location, name, content_type, next) ->
#
#     # stat file for size and compute hash
#     fs.stat location, (err, stats) =>
#         return next(err) if err
#         hash = crypto.createHash('md5')
#         input = fs.createReadStream(location)
#         input.on 'error', (err) -> next(err)
#         input.on 'data', (data) -> hash.update(data)
#         input.on 'end', () =>
#
#             # look for an existing image with this hash
#             hash = hash.digest('base64')
#             this.findOneAndUpdate {hash:hash}, {$inc: {references:1}}, (err, image) =>
#                 return next(err) if err
#                 return next(null, image) if image
#
#                 # open image file for width/height and verification that it works
#                 exec "identify -format \"%wx%h\" #{location}", { stdio: [null, 'pipe', 'pipe'] }, (err, stdout, stderr) =>
#                     return next(err) if err
#                     result = stdout.match /^(\d+)x(\d+)$/m
#                     width = Number(result[1])
#                     height = Number(result[2])
#
#                     # new image, upload to s3
#                     fn = path.basename(location)
#                     req = bucket.put(fn,
#                         'Content-Length': stats.size
#                         'Content-Type': content_type
#                         'Content-MD5': hash
#                         'x-amz-acl': 'public-read'
#                         'x-amz-storage-class': 'REDUCED_REDUNDANCY'
#                     )
#                     req.on 'error', (err) -> next(err)
#                     req.on 'response', (res) =>
#                         return next(res.statusCode) if res.statusCode isnt 200
#                         res.on 'data', (data) =>
#                         res.on 'end', (err) =>
#
#                             # save image record
#                             return next(err) if err
#                             this.create {
#                                 filename:     name
#                                 url:          bucket.http('/' + fn)
#                                 content_type: content_type
#                                 size:         stats.size
#                                 width:        width
#                                 height:       height
#                                 hash:         hash
#                             }, (err, image) ->
#                                 return next(err) if err
#                                 next(null, image)
#
#                     fs.createReadStream(location).pipe(req)
#
# module.exports = mongoose.model('image', Image)

# util = require('util')
{union} = require('../util')
mongoose = require('mongoose')

Image = new mongoose.Schema
    uploader:   { type: mongoose.Schema.Types.ObjectId, ref: 'user' }
    buffer:     { type: Buffer, contentType: String }
    extension:  { type: String, lowercase: true, trim: true }

Image.statics.add = (options) ->
    defaults = 
        data: null
        uploader: null
        async: false
        next: () ->

    settings = union defaults, options

    data = settings.data
    uploader = settings.uploader
    async = settings.async
    next = settings.next

    next 'Data must be a string' unless typeof data is 'string'

    firstSplit = data.split ','
    secondSplit = firstSplit[0].split ';'
    thirdSplit = secondSplit[0].split '/'
    base64Data = firstSplit[1]
    extension = thirdSplit[1]

    buffer = new Buffer(base64Data, 'base64')

    validExtensions = ['gif', 'png', 'jpg', 'jpeg']

    if extension in validExtensions
        img = new this
            uploader: uploader
            buffer: buffer
            extension: extension

        if async
            next null, img

        img.save (err) ->
            next err, img unless async
    else
        next 'Unsupported image extension'

module.exports = mongoose.model('image', Image)
