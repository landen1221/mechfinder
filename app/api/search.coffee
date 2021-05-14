{Project, User, Vehicle, ZipCode} = require('../models')
{calculateDistance, formatDistance, compare_document} = require('../util')

exports.findprojects = (req, res) ->
    userId = if req.user then req.user._id else ''
    filter = req.body.filter = (req.body.filter or {})
    filter.userId = userId

    filterByMake filter.make, (ids) ->
        filter.vehicleIds = ids
        
        filterByLanguage filter.language, (ids) ->
            filter.ownerIds = ids

            filterByRating filter.minRating, (ids) ->
                filter.ratingIds = ids

                if filter and filter.location and filter.location.lat and filter.location.lng
                    lng = parseFloat(filter.location.lng) || 0
                    lat = parseFloat(filter.location.lat) || 0
                else
                    lng = 0
                    lat = 0

                lng = req.geo.loc.coordinates[0] if lng is 0
                lat = req.geo.loc.coordinates[1] if lat is 0
                filter.loc = [lng, lat]

                Project.find_near filter, (err, projects, total) ->
                    return res.send 500, {err: err} if err
                    # For safety, only pass user favorites
                    user = 'favorites': if req.user then req.user.favorites else {projects: [], mechanics: [], users: []}
                    # Rebuild the data we send back for user privacy
                    results = []
                    for project in projects
                        result = {}
                        result._id = project._id
                        result.owner = {}
                        result.owner._id = project.owner._id
                        result.owner.username = project.owner.username
                        result.owner.average_rating = project.owner.average_rating
                        result.date_created = project.date_created
                        result.userBid = false
                        result.bids = []
                        # Only send back the state so that other mechanics
                        #  can't scrape this data in order to compete
                        for bid in project.bids
                            result.bids.push bid.state if bid.state is 'submitted'
                            if req.user and compare_document(bid.user, req.user)
                                result.userBid = true
                        result.vehicle = {}
                        result.vehicle.year  = project.vehicle.year if project.vehicle.year
                        result.vehicle.make  = project.vehicle.make if project.vehicle.make
                        result.vehicle.model = project.vehicle.model if project.vehicle.model
                        result.repair        = project.repair if project.repair
                        result.diagnosis     = project.diagnosis if project.diagnosis
                        result.state         = project.geo.state if project.geo.state
                        result.city          = project.geo.city if project.geo.city
                        result.title         = project.title if project.title
                        result.viewers       = project.viewers if project.viewers
                        if project.geo.loc and project.geo.loc.coordinates[1] isnt 0 and project.geo.loc.coordinates[0] isnt 0
                            calculateDistance project.geo.loc.coordinates[1], project.geo.loc.coordinates[0], lat, lng, (distance) ->
                                integerDistance = parseInt(Math.ceil(distance))
                                integerDistance += 1 if integerDistance is 0
                                result.distance = 'Within ' + integerDistance + ' mile' + if integerDistance > 1 then 's' else ''
                        else
                            result.distance = -1
                        results.push result
                    data = {
                        'total': total,
                        'projects': results,
                        'user': user
                        }
                    return res.send data

exports.findmechanics = (req, res) ->
    userId = if req.user then req.user._id else ''

    filter = req.body.filter = (req.body.filter or {})
    filter.role = 'seller'
    # locationByZip req, filter.zip, (data) ->
    #     filter.loc = data

    if filter and filter.location and filter.location.lat and filter.location.lng
        lng = parseFloat(filter.location.lng) || 0
        lat = parseFloat(filter.location.lat) || 0
    else
        lng = 0
        lat = 0

    # fallback on geo middleware if not filter location was sent from client
    lng = req.geo.loc.coordinates[0] if lng is 0
    lat = req.geo.loc.coordinates[1] if lat is 0
    filter.loc = [lng, lat]

    filterByLanguage filter.language, (ids) ->
        filter.langIds = ids

        User.find_near filter, (err, mechanics, total) ->
            return res.send 500, {err: err} if err
            # For safety, only pass user favorites
            user = 'favorites': if req.user then req.user.favorites else {projects: [], mechanics: [], users: []}
            # Rebuild search results for mechanic privacy
            results = []
            for mechanic in mechanics
                result = {}
                result._id               = mechanic._id if mechanic._id
                result.username          = mechanic.username if mechanic.username
                result.insurance         = mechanic.insurance if mechanic.insurance
                result.warranty          = mechanic.warranty if mechanic.warranty
                result.yearsOfExperience = mechanic.yearsOfExperience if mechanic.yearsOfExperience
                result.certifications    = mechanic.certifications if mechanic.certifications
                result.specialties       = mechanic.specialties if mechanic.specialties
                result.mechanicType      = mechanic.mechanicType if mechanic.mechanicType
                result.state             = mechanic.geo.state if mechanic.geo.state
                result.city              = mechanic.geo.city if mechanic.geo.city
                result.average_rating    = mechanic.average_rating if mechanic.average_rating
                if mechanic.geo.loc and mechanic.geo.loc.coordinates[1] isnt 0 and mechanic.geo.loc.coordinates[0] isnt 0
                    calculateDistance mechanic.geo.loc.coordinates[1], mechanic.geo.loc.coordinates[0], lat, lng, (distance) ->
                        integerDistance = parseInt(Math.ceil(distance))
                        integerDistance += 1 if integerDistance is 0
                        result.distance = 'Within ' + integerDistance + ' mile' + if integerDistance > 1 then 's' else ''
                else
                    result.distance = -1
                results.push result

            data =
                'total': total,
                'mechanics': results,
                'user': user
            return res.send data

# formatDistance = (distance, next) ->
#     Number(distance)
#     dist = switch
#         when distance < 1 then 'Within 1 mile'
#         when distance < 5 then 'Within 5 miles'
#         when distance < 10 then 'Within 10 miles'
#         when distance < 15 then 'Within 15 miles'
#         when distance < 25 then 'Within 25 miles'
#         when distance < 50 then 'Within 50 miles'
#         when distance < 100 then 'Within 100 miles'
#         else 'More than 100 miles'
#     next dist

toRad = (val) ->
    val * Math.PI / 180

distance = (lat1, lng1, lat2, lng2, next) ->
    dLat = toRad(lat2-lat1)
    dLng = toRad(lng2-lng1)
    a = Math.sin(dLat/2) * Math.sin(dLat/2) + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng/2) * Math.sin(dLng/2)
    c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a))
    d = 3959 * c
    next d

filterByMake = (make, next) ->
    finding = 'year':
        $gte: make.startingYear
        $lte: make.endingYear
    if make.name isnt 'none'
        finding.make = make.name
    Vehicle.find finding, { _id: 1 }, (err, vehicles) ->
        ids = vehicles.map((vehicle) ->
            vehicle.id
        )
        next ids

locationByZip = (req, zip, next) ->
    if zip is 'none'
        console.log req.geo.long + ', ' + req.geo.lat
        next [req.geo.long, req.geo.lat]
    else
        ZipCode.find {postal: zip}, (err, result) ->
            if result.length > 0
                next result[0].location
            else
                next [0,0]

# Expects either 'Spanish' or 'English' and a callback, returns an array of user ids
filterByLanguage = (language, next) ->
    english = {'languages.english': 'true'}
    english = {'languages.english': 'false'} if language is 'Spanish'

    spanish = {'languages.spanish': 'true'}
    spanish = {'languages.spanish': 'false'} if language is 'English'

    toFind = { $or: [spanish, english] }

    User.find toFind, { _id: 1 }, (err, users) ->
        ids = users.map((user) ->
            user._id
        )
        next ids

filterByRating = (minRating, next) ->
    toFind = { average_rating: { $gte: minRating } }

    User.find toFind, { _id: 1 }, (err, users) ->
        ids = users.map((user) ->
            user._id
        )
        next ids

# Gets favorites
exports.findfavorites = (req, res) ->
    Project.find_favorites req.user.favorites.projects, (err, projects, total) ->
        return res.send 500, {err: err} if err
        data = {
            'favoriteProjects': projects
        }
        return res.send data
        