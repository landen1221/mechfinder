async = require('async')
moment = require('moment')
{User, Ad} = require('../models')

PRICING = {
    nation: 150
    state: 100
    city: 50
}

exports.advertise = (req, res) ->
    return res.send 403 unless req.user
    a = new Ad {
        user: req.user
        customer: req.user.name
        phone: req.body.phone
        title: req.body.campaign
        link: req.body.link
        image: req.body.image
        start: moment(req.body.start).toDate()
        end: moment(req.body.start).add('month', 1).toDate()
        section: req.body.section or 'sidebar'
    }
    a.state = req.body.state if req.body.type in ['state', 'city']
    a.city = req.body.city if req.body.type is 'city'
    a.amount = PRICING[req.body.type]
    a.payed = false

    # check for limits
    async.series [
        (next) -> 
            return next() unless req.body.type is 'nation'
            opts = {}
            opts.payed = true
            opts.$and = [
                {$or: [{state: {$exists:false}}, {state: null}, {state: ""}]},
                {$or: [{city: {$exists:false}}, {city: null}, {city: ""}]}
            ]
            opts.start = {$lte: a.start}
            opts.end = {$gte: a.end}
            Ad.find(opts).count (err, count) ->
                return next(err) if err
                return res.send 400, "There are too many nationwide ads already running, please select a city or statewide ad, or try again next month." if count >= 2
                next()

        (next) ->
            return next() unless req.body.type is 'state'
            opts = {}
            opts.payed = true
            opts.state = a.state
            opts.$or = [{city: {$exists:false}}, {city: null}, {city: ""}]
            opts.start = {$lte: a.start}
            opts.end = {$gte: a.end}
            Ad.find(opts).count (err, count) ->
                return next(err) if err
                return res.send 400, "There are too many state ads already running in #{a.state}. Try advertising to a specific city." if count >= 5
                next()

        (next) ->
            return next() unless req.body.type is 'city'
            opts = {}
            opts.payed = true
            opts.state = a.state
            opts.city = a.city
            opts.start = {$lte: a.start}
            opts.end = {$gte: a.end}
            Ad.find(opts).count (err, count) ->
                return next(err) if err
                return res.send 400, "There are too many city ads already running in #{a.city}, #{a.state}. Consider statewide advertising." if count >= 10
                next()

        ], (err) -> 
            return res.send 500, err if err
            a.save (err) ->
                return res.send 500, err if err
                res.send a