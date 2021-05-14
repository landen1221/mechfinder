{normalize_state} = require('../util')

module.exports = (file) ->
    locator = require('../iplocator').open(file)
    (req, res, next) ->

        # This doesn't actually do anything, its just a list of arizona ips
        testIps = ['23.104.87.70', '204.152.255.29', '199.195.141.226', '98.165.23.195', '45.40.137.61']

        # use geo data from session if possible 
        str = req.ip.split(':')
        ipstr = str[str.length-1]
        ip = ipstr
        ip = '216.17.209.8' if MF.properties.env is 'development' and ip is '1'
        
        if req.session and req.session.geo and (req.session.geo.source isnt 'ip' or ip == req.session.geo.ip)
            req.geo = req.session.geo
        else
            req.geo = locator.locate(ip)
            if req.geo
                req.geo.ip = ip
                req.geo.source = 'ip'
                req.geo.state = normalize_state(req.geo.country, req.geo.state).toUpperCase() if req.geo.country and req.geo.country isnt '-' and req.geo.state and req.geo.state isnt '-'
                req.geo.loc =
                    'type': 'Point'
                    'coordinates': [Number(req.geo.long), Number(req.geo.lat)]
            else
                req.geo =
                    ip: ip
                    source: 'ip'
                    state: ''
                    country: ''
                    city: ''
                    postal: ''
                    loc:
                        type: 'Point'
                        coordinates: [0, 0]

            req.session.geo = req.geo if req.session

        res.locals.geo = req.geo ? {}
        next()
