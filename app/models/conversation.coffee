mongoose = require('mongoose')
Entities = require('html-entities').XmlEntities
entities = new Entities()
nodemailer = require('nodemailer')
handlebars = require('handlebars')
os = require('os')
User = require('./user')
path = require('path')

conversation = new mongoose.Schema
    date: { type: Date }
    participants: [{ type: mongoose.Schema.Types.ObjectId, ref: 'user' }]
    last:
        from: { type: mongoose.Schema.Types.ObjectId, ref: 'user' }
        message: { type: String, default: '' },
        seen: [{ type: mongoose.Schema.Types.ObjectId, ref: 'user' }]
    messages: [{
        from: { type: mongoose.Schema.Types.ObjectId, ref: 'user' }
        message: { type: String, default: '' }
        time: { type: Date, default: -> new Date() }
        seen: [{ type: mongoose.Schema.Types.ObjectId, ref: 'user' }]
    }]

format_address = (address) ->
    address = [address] unless address instanceof Array
    ((if typeof a is 'string' then a else "#{a.name} <#{a.email ? a.address}>") for a in address).join(',')

conversation.methods.send = (from, message, next) ->
    message = entities.encode message

    emailExp = /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9._-]+)/img
    phoneExp = /(?:(?:\+?1\s*(?:[.-]\s*)?)?(?:\(\s*([2-9]1[02-9]|[2-9][02-8]1|[2-9][02-8][02-9])\s*\)|([2-9]1[02-9]|[2-9][02-8]1|[2-9][02-8][02-9]))\s*(?:[.-]\s*)?)?([2-9]1[02-9]|[2-9][02-9]1|[2-9][02-9]{2})\s*(?:[.-]\s*)?([0-9]{4})(?:\s*(?:#|x\.?|ext\.?|extension)\s*(\d+))?/img

    message = message.replace emailExp, '********'
    message = message.replace phoneExp, '##########'

    this.messages.push(
        from: from
        message: message
        seen: [from]
    )

    length = this.messages.length
    newDate = this.messages[length - 1].time
    previousDate = this.date || newDate
    this.date = newDate

    this.last =
        from: from
        message: message
        seen: [from]

    this.save (err, c) ->
        next err if err
        c.populate 'messages.from', 'username role picture', (err) ->
            next err, c.messages[length - 1]
            
    if Math.abs(newDate.getTime() - previousDate.getTime()) > 1000 * 60 * 30 or length is 1
        c = this
        User.findById from, (err, starter) ->
            if starter and not err
                for p in c.participants
                    unless p.toString() is from.toString()
                        User.findById p, (err, u) ->
                            if u and u?.role isnt 'support' and not err and u?.preferences.notifications.email.chat
                                # send the email here
                                transport = nodemailer.createTransport 'SMTP', {
                                    service: 'Gmail'
                                    auth: { user: 'support@mechfinder.com', pass: 'SUpp4# 1!!@' }
                                    secure: true
                                    port: 465
                                }

                                template = 'contact/conversation-started'
                                subject = starter.username + ' wrote you a message'
                                to =
                                    name: u.first + ' ' + u.last
                                    address: u.email
                                from =
                                    name: 'MechFinder Support'
                                    address: 'support@mechfinder.com'
                                data =
                                    participant: u
                                    starter: starter
                                    imageHref: 'https://' + MF.properties.self.host + '/static/img/mechfinder-logo-beta.png'
                                    dashboardHref: 'https://' + MF.properties.self.host + '/profile/' + u._id.toString() + '?conversationId=' + c._id.toString()
                                    message: message
                                    
                                opts = 
                                    template: template
                                    subject: subject
                                    to: to
                                    from: from
                                    data: data
                                
                                if opts.template
                                    truePath = 'messages/' + opts.template
                                    normalizedPath = path.normalize truePath
                                    normalizedPath = normalizedPath.replace(/\\/g,'/') if os.platform() is 'win32'
                                    opts.template = handlebars.templates[normalizedPath]

                                opts.from = format_address(opts.from)
                                opts.to = format_address(opts.to)

                                opts.subject = 'MF DEVELOPMENT - ' + opts.subject if MF.properties.env isnt 'production'

                                process.nextTick ->
                                    if opts.template
                                        opts.html = opts.template(opts.data)

                                    transport.sendMail opts, (err) ->
                                        console.error err if err

conversation.methods.addParticipants = (ps, next) ->
    for p in ps
        inParticipants = this.participants.some (part) ->
            return part.equals p

        this.participants.push p unless inParticipants

    this.save (err, c) ->
        next err if err
        # c.populate('messages.from', 'username role picture').populate('participants', 'username role picture').populate('last.from', 'username role picture').execPopulate (err, c) ->
        c.populate 'participants', 'username role picture', (err) ->
            c.populate 'last.from', 'username role picture', (err) ->
                c.populate 'messages.from', 'username role picture', (err) ->
                    next err, c

module.exports = mongoose.model('conversation', conversation)
