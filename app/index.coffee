express  = require('express')
mongoose = require('mongoose')
session = require('express-session')
redisClient = require('redis').createClient()
redisStore = require('connect-redis')(session)
handlebars = require('handlebars')
moment = require('moment')
util = require('util')
models = require('./models')
path = require('path')
fs = require('fs')
{title, merge, union, shallow} = require('./util')

# install handlebar helpers
require('./helpers')

# express 3 handlebars engine
hbs = (filename, options, next) ->

    # figure out the compiled view name.. pretty much just the path without .handlebars
    rel = path.relative(options.settings.views, filename)
    parts = (p for p in path.dirname(rel).split(path.sep) when p isnt '.')
    view = path.basename(filename, path.extname(filename))
    name = if parts.length > 0 then parts.join('/') + '/' + view else view

    # load and render the template
    template = handlebars.templates[name]
    if not template
        throw "No view at path '#{name}'"
    result = template(options)

    # now look for a layout
    layout = options.layout
    if not layout and not options.xhr
        for i in [parts.length-1..0]
            lp = parts[0..i].concat('layout').join('/')
            if handlebars.templates[lp]
                layout = lp
        if not layout
            if handlebars.templates['layout']
                layout = 'layout'

    # if a layout name given, render it with the inner template result assigned to 'body'
    if layout and layout.length > 0
        template = handlebars.templates[layout]
        if not template
            throw "No layout found at path '#{layout}'"
        options.body = result
        result = template(options)

    next(null, result)

mongoose.connect MF.properties.self.mongo

mongoose.connection.on 'error', (err) ->
    console.log 'mongoose error: ', err

app = express()

if app.get('env') != 'production'
    app.use (req, res, next) ->
        auth = undefined
        if req.headers.authorization
            auth = new Buffer(req.headers.authorization.substring(6), 'base64').toString().split(':')
        if !auth or auth[0] != 'mechfinder' or auth[1] != 'mechfinder'
            res.statusCode = 401
            res.setHeader 'WWW-Authenticate', 'Basic realm="Authentication Required"'
            res.end 'Unauthorized'
        else
            next()

# install precompiled handlebars views
require('./views').compile_views './views', watch: (app.get('env') isnt 'production')

# view engine configuration
app.enable('trust proxy')
app.set 'views', 'views'
app.set 'view engine', 'handlebars'
app.engine 'handlebars', hbs

# serve static files
app.set 'static_path', '/static'
app.use '/static/img',      express.static('public/img')
app.use '/static/css',      express.static('public/css')
app.use '/static/audio',    express.static('public/audio')
app.use '/static/video',    express.static('public/video')
app.use '/static/video-js', express.static('public/video-js')
#app.use '/static/font',     express.static('public/lib/font-awesome/font')
app.use '/static/font',     express.static('public/font')
app.use '/static/bootstrap',     express.static('public/bootstrap')

# request body, cookies, sessions, and other housekeeping stuff
app.use require('./middleware/upload')()    # parse ajax upload body before connect/formidable
app.use express.bodyParser()
app.use express.methodOverride()
app.use express.cookieParser()
app.set 'devMode', 'false'
if MF.properties.env is 'development'
    app.set 'devMode', 'true'

sess = {
    secret: MF.properties.self.secret
    resave: true
    saveUninitialized: false
    rolling: true
    store: new redisStore(
        host: MF.properties.redis.host
        port: MF.properties.redis.port
        client: redisClient
        ttl: MF.properties.redis.ttl
    )
    cookie:
        httpOnly: false
        secure: false
        maxAge: 1000 * 60 * 60 * 24 * 7 * 2
}

if app.get('env') is 'production'
    sess.cookie.secure = true

sessionMiddlware = session(sess)
app.use sessionMiddlware

# error handlers
app.use express.errorHandler(dumpExceptions: true, showStack: true) if app.get('env') is 'development'
app.use express.errorHandler() if app.get('env') is 'production'

# messaging configuration

app.use (req,res,next) ->
    req.stripesecret = MF.properties.stripe.back
    res.locals.stripepublic = MF.properties.stripe.front
    return next()

app.use require('./messaging')(
    {transport: if app.get('env') is 'development' then 'SMTP' else 'SMTP'},
    {}
)

# application routes
app.use require('./middleware/geo')('./data/IP-COUNTRY-REGION-CITY-LATITUDE-LONGITUDE-ZIPCODE.BIN') # determine location before anything else
# app.use require('./middleware/tennent')()   # figure out which tennent before we authenticate
app.use require('./middleware/authn')()     # read authenticate data from request (either session or possibly oauth tokns, etc)
app.use '/admin', require('./middleware/admin')()
app.use require('./middleware/authz')()     # determine if current user context can access the resource being requested
app.use require('./middleware/layout')()    # determine layout dynamically based on current user
app.use require('./middleware/ads')()       # inject advertisemet data into each response
app.use require('./middleware/mail')()
app.use require('./middleware/projects')()
app.use require('./middleware/users')()
app.use require('./middleware/logging')()
app.use require('./middleware/meta')('meta.json')
app.use require('./middleware/tooltips')()

# http to https 
# will redirect all controllers to https before any sensitive requests can be made over http
app.use (req, res, next) ->
    return res.redirect 301, 'https://' + req.host + req.path unless req.secure
    return res.redirect 301, 'https://mechfinder.com' + req.path unless req.host.indexOf 'www.mechfinder.com' is -1
    next()

app.use app.router

# server compiled less and js content
require('./static').apply(app)

app.locals.page_title = 'Mechfinder'

# app.get '/kill', (req, res) ->
#     throw 'Sharknado attack!!!'
# app.get '/stall', (req, res) ->
#     console.log 'Stalling out'
#     i = 0
#     while (true)
#         i++


require('./routes').register app
# require('./controllers/admin').resources app

# app.get '/mechfinder-forum/forum-management', (req, res) ->
#     res.redirect 'http://mechfinder.com/mechfinder-forum/forum-management/'

# # error handling
# app.use (req, res, next) ->
#     res.on 'error', (e) ->
#         console.log "Unhandled error responding to #{req.method} #{req.path}:\n#{e}"
#     next()

key
cert
# passphrase
chain
ca = []

startMessage = 'Voila! In view, a humble vaudevillian veteran, cast vicariously as both victim and villain by the vicissitudes of Fate. This visage, no mere veneer of vanity, is it vestige of the vox populi, now vacant, vanished, as the once vital voice of the verisimilitude now venerates what they once vilified. However, this valorous visitation of a bygone vexation stands vivified, and has vowed to vanquish these venal and virulent vermin vanguarding vice and vouchsafing the violently vicious and voracious violation of volition. The only verdict is vengeance; a vendetta held as a votive, not in vain, for the value and veracity of such shall one day vindicate the vigilant and the virtuous. Verily, this vichyssoise of verbiage veers most verbose vis-a-vis an introduction, and so it is my very good honor to meet you and you may call me Server.'
console.log startMessage

if process.env.NODE_ENV is 'production' #or process.env.NODE_ENV is 'development'
    key = fs.readFileSync(__dirname+'/../certs/mfprod.key', 'utf8')
    cert = fs.readFileSync(__dirname+'/../certs/mfprod.crt', 'utf8')
    # passphrase = fs.readFileSync(__dirname+'/../certs/passphrase', 'utf8').trim()

    chain = [
        'mfprod0.crt',
        'mfprod1.crt',
        'mfprod2.crt'
    ]

    ca = (fs.readFileSync __dirname + "/../certs/#{file}" for file in chain)

else
    key = fs.readFileSync(__dirname+'/../certs/mfdev.key', 'utf8')
    cert = fs.readFileSync(__dirname+'/../certs/mfdev.crt', 'utf8')

opts =
    key: key,
    cert: cert,
    # passphrase: passphrase,
    ca: ca

https = require('https').createServer(opts, app)
http = require('http').createServer(app)

sockets = require('./sockets')(https, sessionMiddlware)
socketsHTTP = require('./sockets')(http, sessionMiddlware)

module.exports = {https: https, http: http}
