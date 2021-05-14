{ZipCode} = require('../models')
{normalize_city, title, STATES} = require('../util')
IPLocator = require('../iplocator')

exports.cities = (req, res) ->

    # find the abbreviation
    cx = req.params.country.toLowerCase()
    sx = req.params.state.toLowerCase()
    if sx.length > 2 and STATES[cx] isnt undefined
        for k, v of STATES[cx]
            sx = k if sx is v.toLowerCase()

    ZipCode.get_cities_by_state cx, sx, (err, cities) ->
        return res.send 500, err if err
        res.send (normalize_city(x.city) for x in cities)

exports.postal = (req, res) ->
    postal = req.params.postal.toLowerCase()
    cx = req.params.country.toLowerCase()
    return res.send 400, 'Postal code too short.' if postal.length < 5
    ZipCode.find {country: cx, postal: postal}, (err, results) ->
        return res.send 500, err if err
        return res.send 404, 'No postal code data found.' unless results.length > 0
        res.send 200, results[0]

exports.get = (req, res) ->
    res.send req.geo

exports.update = (req, res) ->
    ip = req.headers['x-forwarded-for'] ? req.ip

    if req.body.source == 'user'
        # user specified location has highest precendence.. just
        # overwrite any existing geo data, we dont even care
        ZipCode.findOne postal: req.body.postal, (err, zip) ->
            return res.send(500, {result: false, err: err}) if err or not zip
            if ip
                str = ip.split(':')
                ipstr = str[str.length-1]
                ip = ipstr
            req.geo = {
                ip: ip
                source: 'user'
                long: zip.location[1]
                lat: zip.location[0]
                city: zip.city
                state: zip.state
                postal: zip.postal
                country: zip.country
                loc:
                    'type': 'Point'
                    'coordinates': [zip.location[1], zip.loation[0]]
            }
            req.session.geo = req.geo if req.session
            res.send req.geo

    else if req.body.source == 'browser'
        if req.geo and req.geo.source == 'user' and not req.body.override
            # browser position data overwrites any existing ip data
            # not an error condition, but just send the existing data
            res.send req.geo
        else
            console.log 'should be doing a browser one'
            ZipCode.find {location: {$near: [Number(req.body.long), Number(req.body.lat)]}}, null, {limit:1}, (err, zips) ->
                return res.send 500, err if err
                return res.send 404, err unless zips and zips.length > 0
                if ip
                    str = ip.split(':')
                    ipstr = str[str.length-1]
                    ip = ipstr
                zip = zips[0]
                req.geo = {
                    ip: ip
                    source: 'browser'
                    lat: Number(req.body.lat)
                    long: Number(req.body.long)
                    city: zip.city
                    state: zip.state
                    postal: zip.postal
                    country: zip.country
                    loc:
                        'type': 'Point'
                        'coordinates': [Number(req.body.long), Number(req.body.lat)]
                }

                req.session.geo = req.geo if req.session
                res.send req.geo

    else if req.body.source == 'ip'
        if req.geo and req.geo.source == 'user' and not req.body.override
            return res.send req.geo
        else
            if ip
                str = ip.split(':')
                ipstr = str[str.length-1]
                ip = ipstr

            # picking out a sample public IP for now since this is accessed locally
            ip = '216.17.209.8' if MF.properties.env is 'development' and ip is '1'

            file =  MF.properties.root + '/../data/IP-COUNTRY-REGION-CITY-LATITUDE-LONGITUDE-ZIPCODE.BIN'

            iplocator = IPLocator.open file
            location = iplocator.locate ip

            req.geo = location
            if req.geo?
                req.geo.ip = ip
                req.geo.source = 'ip'
                req.geo.loc =
                    'type': 'Point'
                    'coordinates': [Number(req.geo.long), Number(req.geo.lat)]

            return res.send 404, ('Unable to find location with IP: ' + ip) unless location

            req.session.geo = req.geo if req.session
            return res.send req.geo

    else res.send 500, {result: false, err: 'Specify either "user" or "browser" as the source field for this position data.'}
