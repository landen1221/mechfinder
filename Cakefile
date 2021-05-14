fs = require('fs')
http = require('http')
https = require('https')
path = require('path')
spawn = require('child_process').spawn
util = require('util')
mime = require('mime')
async = require('async')
humanize = require('humanize')
{watchFolder, wachFile, visitFolder, normalize_state, normalize_city, title} = require('./app/util')

option '-f', '--force', 'Foricibly run the start-db or stop-db command, ignoring the lock file.'
option '-w', '--watch', 'Watches directories for changed files (applies to /src and up server only).'
option '-n', '--number [WORKERS]', 'Number of work processes to spawn (applies to up server only)'
option '-p', '--port [PORT]', 'Port number to listen on.'
option '-q', '--portx [HTTP_PORT]', 'HTTP port number to listen on.'
option '-i', '--ip [IP]', 'IP address used to test location service.'

defaults =
    watch: false
    number: 1
    port: 3000
    portx: 3001
    ip: '127.0.0.1'

mergeDefaultsInto = (opts) ->
    (opts[key] = val if typeof opts[key] is 'undefined') for key, val of defaults
    opts

setupEnvironment = () ->
    global.MF = if 'MF' in global then MF else {}
    switch (process.env.NODE_ENV || 'development')
        when 'production' then MF.properties = require(__dirname + '/app/properties').production
        when 'test' then MF.properties = require(__dirname + '/app/properties').test
        when 'development' then MF.properties = require(__dirname + '/app/properties').development

task 'build',
    'Builds javascript and css static artifacts from coffeescript/less resources',
    (opts) ->
        mergeDefaultsInto opts
        console.log "Building static js and css artifacts:"
        require('./app/static').build (err) -> process.exit(if err then 1 else 0)

task 'run',
    'Execute the server using the \'up\' load balancer.',
    (opts) ->
        mergeDefaultsInto opts
        setupEnvironment()

        console.log "Starting HTTPS listener on port #{opts.port} with #{opts.number} workers..."
        console.log "Starting HTTP listener on port #{opts.portx} with #{opts.number} workers..."

        if not opts.watch and opts.number is 1
            app = require('./app')
            app.https.listen(opts.port)
            app.http.listen(opts.portx)
        else
            server = http.Server().listen(opts.port)
            up = require('up')(
                server,
                __dirname,
                workerPingInterval: '1s'
                numWorkers: opts.number
                workerTimeout: '2s'
            )
            if opts.watch
                console.log "  .. Watching for changes"
                watchFolder './app',
                    (-> true),
                    (ev, fn) ->
                        console.log "  .. Saw change in #{fn}, reloading server."
                        up.reload()
                    () ->

task 'fetch-geo',
    'Downloads latest ip2location geocoding database.',
    (opts) ->
        setupEnvironment()

        # login first
        console.log 'Downloading updated ip2location database...'
        data = require('querystring').stringify(
            emailAddress: 'matt@mechfinder.com'
            password:     '46HCD7QZ'
            btnLogin:     'Login')
        post =
            hostname:   'www.ip2location.com'
            port:   '443'
            path:   '/login'
            method: 'POST'
            headers:
                'Content-Length': data.length
                'Content-Type': 'application/x-www-form-urlencoded'
        console.log '  .. Logging in'
        req = https.request post,
            (res) ->
                console.log res.statusCode
                console.log "     #{util.inspect(res.headers)}"
                res.on 'data', (chunk) -> {}
                res.on 'end', () ->
                    console.log '  .. Requesting database'
                    post.method = 'GET'
                    post.path = 'http://www.ip2location.com/download?code=DB9BIN'
                    post.headers = {Cookie: (c.substring(0, c.indexOf(';')) for c in res.headers['set-cookie']).join('; ')}
                    req = https.request post,
                        (res) ->
                            console.log res.statusCode
                            output = fs.createWriteStream('./data/ip2location.zip')
                            output.on 'open', (descriptor) ->
                                console.log "  .. Receiving file (#{res.headers['content-length']} bytes)"
                                res.pipe(output)
                                res.on 'end', () ->
                                    console.log '  .. Unzipping'
                                    process.chdir('data')
                                    unzip = spawn 'unzip', ['./ip2location.zip'], stdio: 'inherit'
                                    unzip.on 'exit', () -> console.log '  .. Done'
                    req.end()
        req.write(data)
        req.end()

task 'locate',
    'Test ip-location feature.',
    (opts) ->
        mergeDefaultsInto opts
        setupEnvironment()
        console.log "Attempting to locate #{opts.ip}"
        locator = require('./app/iplocator').open('./data/IP-COUNTRY-REGION-CITY-LATITUDE-LONGITUDE.BIN')
        console.log "Locator header data: #{util.inspect(locator.header)}"
        a = locator.locate(opts.ip)
        console.log util.inspect(a)

task 'update-user-locations',
    'Update the location values for all users.',
    (opts) ->
        setupEnvironment()
        console.log 'Connecting to mongodb...'
        models = require('./app/models')
        mongoose = require('mongoose')
        mongoose.connect('mongodb://localhost/mechfinder')
        models.User.find {}, (err, users) ->
            return console.log 'Err: ', err if err
            pump = ->
                return console.log 'Finished.' if users.length is 0
                u = users.pop()
                return process.nextTick(pump) unless u.address.length > 0
                a = u.address[0]
                async.series [

                    # normalize country and state
                    (next) ->
                        a.country = 'us' unless a.country
                        a.state = normalize_state(a.country, a.state) if a.state
                        next()

                    # fill missing zip code from city and state
                    (next) ->
                        return next() if a.postal
                        unless a.city and a.state
                            console.log "Can't fill blank postal for #{u.name} because they have no city/state: #{a.city}, #{a.state}"
                            return next()
                        models.ZipCode.guess_zipcode a.country, a.state, a.city, (err, postal) ->
                            return next(err) if err
                            if postal
                                a.postal = postal
                                console.log "Filling empty postal for #{u.name}: #{a.city}, #{a.state} = #{a.postal}"
                            else
                                console.log "Can't find postal for #{u.name} living in #{a.city}, #{a.state}"
                            next()

                    # update city and state from zip code
                    (next) ->
                        return next() unless a.postal
                        models.ZipCode.findOne {postal: a.postal}, (err, record) ->
                            return next(err) if err
                            if record
                                a.city = normalize_city(record.city)
                                a.state = record.state
                                console.log "Reseting city and state for #{u.name}: #{a.postal} = #{a.city}, #{a.state}"
                            next()

                    # update spatial coordinates
                    (next) ->
                        u.calculate_location (err) ->
                            console.log "Error calculating location for user #{u.name}: #{err}" if err
                            next()

                    # save user
                    (next) -> u.save(next)

                ], (err, result) ->
                    console.log "Error processing user #{u.name}.. ", err if err
                    process.nextTick pump

            pump()

task 'update-project-locations',
    'Update the location values for all projects.',
    (opts) ->
        setupEnvironment()
        console.log 'Connecting to mongodb...'
        models = require('./app/models')
        mongoose = require('mongoose')
        mongoose.connect('mongodb://localhost/mechfinder')
        models.Project.find({}).populate('owner').exec (err, projects) ->
            return console.error 'Err: ', err if err
            pump = ->
                return console.log 'Finished.' if projects.length is 0
                p = projects.pop()
                if p.owner
                    p.location = p.owner.location
                    if p.owner.address.length > 0
                        p.address = {
                            country: p.owner.address[0].country
                            city: p.owner.address[0].city
                            state: p.owner.address[0].state
                        }
                else
                    console.log "no owner for project #{p.id}"
                p.save (err) ->
                    return console.log "Error saving project #{p._id}.. ", err if err
                    process.nextTick pump
            pump()

loadZipCodes = (file) ->

    console.log 'Connecting to mongodb...'
    models = require('./app/models')
    mongoose = require('mongoose')
    mongoose.connect('mongodb://localhost/mechfinder')

    console.log 'Reading csv records...'
    csv = require('csv')().from.path(file, columns: true)
    csv.on 'record', (data) ->
        if data.Decommisioned == 'false' and
           data.LocationType == 'PRIMARY'
            a = {
                location: [Number(data.Long), Number(data.Lat)]
                postal: data.Zipcode
                city: data.City
                state: data.State
                country: 'us'
            }
            csv.pause()
            models.ZipCode.update {postal: a.postal}, a, {upsert: true}, (err) ->
                return console.log("  .. Error writing data to table: #{err}.") if err
                csv.resume()
    csv.on 'end', ->
        console.log("Done.")

task 'fetch-zip',
    'Downloads latest free zipcode data.',
    (opts) ->
        setupEnvironment()
        console.log 'Downloading updated zipcode database...'
        req = http.get 'http://federalgovernmentzipcodes.us/free-zipcode-database-Primary.csv', (res) ->
            console.log "  .. Receiving file (#{res.headers['content-length']} bytes)"
            res.pipe(fs.createWriteStream('./data/zipcodes.csv'))
            res.on 'end', () -> invoke 'load-zip'

task 'load-zip',
    'Loads existing zip code csv file.',
    (opts) ->
        setupEnvironment()
        loadZipCodes('./data/zipcodes.csv')

task 'load-makes',
    'Loads vehicle make/model/year/cylinders data into mongo.',
    (opts) ->
        setupEnvironment()
        console.log 'Connecting to database...'
        models = require('./app/models')
        mongoose = require('mongoose')
        mongoose.connect('mongodb://localhost/mechfinder')

        console.log 'Reading csv make/model/year/cylinders records...'
        csv = require('csv')().from.path('makes.csv', columns: false)
        csv.on 'record', (data) ->
            a = {
                year: data[0]
                make: data[1]
                model: data[2]
                cylinders: data[3]
            }
            csv.pause()
            models.Make.update a, a, {upsert: true}, (err) ->
                csv.resume()
                return console.log("  .. Error writing data to table: #{err}.") if err
        csv.on 'end', ->
            console.log("Done.")
