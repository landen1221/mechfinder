Conversation = require('./models/conversation')

module.exports = (http, sessionMiddlware) ->
    io = require('socket.io')(http)

    io.use((socket, next) ->
        sessionMiddlware(socket.request, socket.request.res, next)
    )

    clients = {}

    io.sockets.on 'connection', (socket) ->
        clients[socket.request.session.user] = socket.id

        socket.on 'disconnect', ->
            delete clients[socket.request.session.user]

        socket.on 'message', (message, participants, conversationId) ->
            participants = [] unless Array.isArray participants

            user = ''
            user = socket.request.session.user if socket.request.session.user

            if user and participants.length > 0 and conversationId and typeof message is 'string' and message.length > 0
                emitError = (json) ->
                    client = clients[user]
                    if client
                        io.sockets.connected[client].emit('message error', json)

                # find the conversation
                Conversation.findById conversationId, (err, c) ->
                    return emitError {err: err} if err
                    return emitError {err: 'Conversation not found'} unless c
                    c.send user, message, (err, m) ->
                        return emitError {err: err} if err
                        return emitError {err: 'Conversation not found'} unless m

                        i = 0
                        while i < participants.length
                            participant = participants[i]
                            client = clients[participant]
                            io.sockets.connected[client].emit('message', m, conversationId) if client and io.sockets.connected[client]
                            i++

        socket.on 'typing', (participants, conversationId) ->
            participants = [] unless Array.isArray participants

            user = ''
            user = socket.request.session.user if socket.request.session.user

            if user and participants.length > 0 and conversationId
                i = 0
                while i < participants.length
                    participant = participants[i]
                    # unless participant is user
                    client = clients[participant]
                    if client and io.sockets.connected[client]
                        io.sockets.connected[client].emit('typing', user, conversationId)
                    i++

# CONFIG =
#     transport: 'SMTP'
#     service: 'Gmail'
#     user: 'support@mechfinder.com'
#     pass: 'SUpp4# 1!!@'
#     secure: true
#     port: 465

# DEFAULTS =
#     from:      'Mechfinder.com <contact.us@mechfinder.com>'
#     subject:   'Mechfinder Customer Support'

# # notifies a user with a given template and data object. inspects the user's configuration
# # to see if they want email or sms for this template
# exports.notify = ->

# # send an email address, requires a 'from', 'to', 'subject', 'template', 'data'
# exports.email = (opts) ->
#     console.log 'should be sending the email here'

# exports.sms = (opts) ->
#     opts = union(SMS_DEFAULTS, opts)

# module.exports = (cfg, defaults) ->

#     defaults = union(DEFAULTS, defaults)
#     cfg = union(CONFIG, cfg)
#     transport = { sendMail: (opts) -> console.dir opts }

#     if cfg.transport is 'SMTP' and cfg.service is 'Gmail'
#         transport = nodemailer.createTransport 'SMTP', {
#             service: 'Gmail'
#             auth: { user: cfg.user, pass: cfg.pass }
#             secure: cfg.secure
#             port: cfg.port
#         }

#     (req, res, next) ->
#         res.email = (opts) ->
#             opts = union(defaults, opts)
#             if opts.template
#                 x = opts.template.split('/')
#                 x.unshift('messages')
#                 if os.platform() is 'win32'
#                     # replace the last \ with a / (which is how handlebars is compiling view paths
#                     opts.template = handlebars.templates[x.join('\\').replace(/\\([^\\]*)$/,'/$1');]
#                 else
#                     opts.template = handlebars.templates[x.join('/')]

#             opts.from = format_address(opts.from)
#             opts.to = format_address(opts.to)

#             opts.subject = 'MF DEVELOPMENT - ' + opts.subject if MF.properties.env isnt 'production'

#             process.nextTick ->
#                 if opts.template
#                     opts.html = opts.template(opts.data)

#                 transport.sendMail opts, (err) ->
#                     console.error err if err