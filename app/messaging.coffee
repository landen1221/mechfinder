nodemailer = require('nodemailer')
handlebars = require('handlebars')
{union, is_string} = require('./util')
{Mail} = require('./models')
os = require('os')
path = require('path')

format_address = (address) ->
    address = [address] unless address instanceof Array
    ((if is_string(a) then a else "#{a.name} <#{a.email ? a.address}>") for a in address).join(',')

# CONFIG =
#     transport: 'SMTP'
#     host:      'smtp.1and1.com',
#     secureConnection: false,
#     port:      587,
#     user:      'info@mechfinder.com'
#     pass:      'aCspzzSJ4604'

CONFIG =
    transport: 'SMTP'
    service: 'Gmail'
    user: 'support@mechfinder.com'
    pass: 'SUpp4# 1!!@'
    secure: true
    port: 465

DEFAULTS =
    from:      'MechFinder.com <support@mechfinder.com>'
    subject:   'MechFinder Customer Support'

# notifies a user with a given template and data object. inspects the user's configuration
# to see if they want email or sms for this template
exports.notify = ->

# send an email address, requires a 'from', 'to', 'subject', 'template', 'data'
exports.email = (opts) ->
    console.log 'should be sending the email here'

exports.sms = (opts) ->
    opts = union(SMS_DEFAULTS, opts)

module.exports = (cfg, defaults) ->

    defaults = union(DEFAULTS, defaults)
    cfg = union(CONFIG, cfg)
    transport = { sendMail: (opts) -> console.dir opts }

    if cfg.transport is 'SMTP' and cfg.service is 'Gmail'
        transport = nodemailer.createTransport 'SMTP', {
            service: 'Gmail'
            auth: { user: cfg.user, pass: cfg.pass }
            secure: cfg.secure
            port: cfg.port
        }

    (req, res, next) ->
        res.email = (opts) ->
            opts = union(defaults, opts)
            if opts.template
                truePath = 'messages/' + opts.template
                normalizedPath = path.normalize truePath
                normalizedPath = normalizedPath.replace(/\\/g,'/') if os.platform() is 'win32'
                opts.template = handlebars.templates[normalizedPath]

            opts.from = format_address(opts.from)
            opts.to = format_address(opts.to)

            console.log MF.properties.env
            opts.subject = 'MF DEVELOPMENT - ' + opts.subject if MF.properties.env isnt 'production'

            process.nextTick ->
                if opts.template
                    opts.html = opts.template(opts.data)

                transport.sendMail opts, (err) ->
                    console.error err if err

        res.sms = (opts) -> console.warn 'SMS is not implemented yet.'

        res.notify = (opts) ->

            # to must be a user
            to = opts.to
            opts.to = "#{to.name} <#{to.email}>"

            # render template html
            if opts.template
                x = opts.template.split('/')
                x.unshift('messages')
                opts.html = handlebars.templates[x.join('/')](opts.data)
                opts.template = null

            # create the in-mail record
            new Mail(
                from: null
                to: to
                subject: opts.subject
                format: 'html'
                body: opts.html
            ).save (err) ->

                # send the email notification
                # TODO: check the user's preferences for how they woudl like to be notified
                return console.error err if err
                res.email(opts)

        next()
