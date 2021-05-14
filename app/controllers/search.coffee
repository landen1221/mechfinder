{User, Project, ZipCode} = require('../models')
{normalize_state, compare_document, to_boolean, COUNTRIES, STATES, calculateDistance, formatDistance} = require('../util')

exports.mechanics = (req, res) ->
    # return res.redirect '/' unless req.user
    userId = if req.user then req.user._id else ''

    filter = req.body.filter = (req.body.filter or {})
    filter.role = 'seller'
    User.find_near filter, (err, mechanics, total) ->
        return res.send 500, {err: err} if err
        res.render 'search/mechanics',
            layout: 'layouts/internal'
            results: mechanics
            user: req.user || null
            head:
                meta:
                    title: 'Find a Mechanic to Work on Your Car'
                    description: 'The process is simple. Post your job in MechFinder\'s secure portal, select the mechanic of your choice who wants to service your car, and rate him when the work is done.'

projectsSearch = (req, res, region) ->
    region = if typeof region is 'string' then region else ''
    # return res.redirect '/' unless req.user
    userId = if req.user then req.user._id else ''

    spec = res.locals.spec = (res.locals.spec or {})
    spec.query = req.body.query
    Project.find_near spec, (err, projects, total) ->
        return res.send 500, {err: err} if err

        for p in projects
            p.shortdesc = p.description.substring 0,25 if p.description

        res.render 'search/projects',
            layout: 'layouts/internal'
            countries: COUNTRIES
            states: STATES
            results: projects
            total: total
            user: req.user || null
            region: region
            head:
                meta:
                    title: 'Find Jobs Near You'
                    description: 'Local mechanics: search for local customers that need their vehicles fixed on your schedule and at your rates.'
                    keywords: 'alternative to repair shop, repair your car, nearest auto shop near me, find mechanics'

exports.projects = (req, res) ->
    projectsSearch req, res

exports.projectsRegion = (req, res) ->
    region = req.params.region
    projectsSearch req, res, region

exports.favorites = (req, res) ->
    Project.find_favorites req.user.favorites.projects, (err, projects, total) ->
        return res.send 500, err if err
        User.find_favorites req.user.favorites.mechanics, 'seller', (err, mechanics, total) ->
            return res.send 500, err if err
            projs = []
            for proj in projects
                result = {}
                result._id          = proj._id            if proj._id
                result.photos       = proj.photos         if proj.photos
                result.date_created = proj.date_created   if proj.date_created
                result.bids         = proj.bids           if proj.bids
                result.vehicle      = proj.vehicle        if proj.vehicle
                result.diagnosis    = proj.diagnosis      if proj.diagnosis
                result.repair       = proj.repair         if proj.repair
                result.city         = proj.geo.city       if proj.geo.city and proj.geo.city isnt '-'
                result.state        = proj.geo.state      if proj.geo.state and proj.geo.state isnt '-'
                if proj.geo.loc and proj.geo.loc.coordinates[1] isnt 0 and proj.geo.loc.coordinates[0] isnt 0
                    calculateDistance(proj.geo.loc.coordinates[1], proj.geo.loc.coordinates[0], req.geo.lat, req.geo.long, (distance) ->
                        formatDistance distance, (dist) ->
                            result.distance = dist
                    )
                else
                    result.distance = 'Location Unspecified'
                projs.push result
            
            mechs = []
            for mech in mechanics
                result = {}
                result._id               = mech._id                if mech._id
                result.name              = mech.name               if mech.name
                result.mechanicType      = mech.mechanicType       if mech.mechanicType
                result.yearsOfExperience = mech.yearsOfExperience  if mech.yearsOfExperience
                result.certifications    = mech.certifications     if mech.certifications
                result.warranty          = mech.warranty           if mech.warranty
                result.insurance         = mech.insurance          if mech.insurance
                result.specialties       = mech.specialties        if mech.specialties
                result.city              = mech.geo.city           if mech.geo.city and mech.geo.city isnt '-'
                result.state             = mech.geo.state          if mech.geo.state and mech.geo.state isnt '-'
                result.username          = mech.username           if mech.username
                if mech.geo.loc and mech.geo.loc.coordinates[0] isnt 0 and mech.geo.loc.coordinates[1] isnt 0
                    calculateDistance(mech.geo.loc.coordinates[1], mech.geo.loc.coordinates[0], req.geo.lat, req.geo.long, (distance) ->
                        formatDistance distance, (dist) ->
                            result.distance = dist
                    )
                else
                    result.distance = 'Location Unspecified'
                mechs.push result

            res.render 'search/favorites',
                layout: 'layouts/internal'
                favoriteProjects: projs
                favoriteMechanics: mechs
                head:
                    meta:
                        title: 'My Favorites'
