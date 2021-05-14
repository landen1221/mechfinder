{Project, User, Comment, Event, Charge, Vehicle, Image, ZipCode} = require('../models')
moment = require('moment')
{compare_document, PROVIDERS, scrub} = require('../util')
async = require('async')
{union, to_boolean} = require('../util')
ProjectDiff = require('../models/project').projectDiff
Notification = require('../models/notification')
Holla = require('../models/holla')

exports.sendDraft = (req, res) ->
    return res.send 403, {err: 'Not logged in'} unless req.user
    return res.send 400, {result: false, err: 'Missing required parameters'} unless req.params.id

    q = Project.findById req.params.id
    q.populate 'owner', 'picture username email first last geo mechanicType warranty average_rating role ratings referral.workorder referral.diagnosis tax.parts tax.labor.diagnosis diagnosisCharge'
    q.populate 'poster', 'picture username geo mechanicType warranty average_rating role ratings referral.workorder referral.diagnosis tax.parts tax.labor.diagnosis diagnosisCharge'
    q.populate 'assigned', 'picture username geo mechanicType warranty average_rating role ratings referral.workorder referral.diagnosis tax.parts tax.labor.diagnosis diagnosisCharge'
    q.populate 'bids.owner', 'picture username geo mechanicType warranty average_rating role ratings referral.workorder referral.diagnosis tax.parts tax.labor.workorder diagnosisCharge'
    q.populate 'vehicle'
    q.populate 'parent'
    q.exec (err, p) ->
        return res.send 500, {err: err} if err
        return res.send 404, {err: 'Project not found'} unless p
        return res.send 403, {err: 'Insufficient permissions to send draft'} unless req.user._id.toString() is p.poster._id.toString()
        return res.send 400, {err: 'Project in incorrect state to send draft'} unless p.state is 'creating'
        
        p.state = 'reviewing'
        p.save (err) ->
            return res.send 500, {err: err} if err

            for b in p.parent.bids
                b.state = 'requested' if b.state in ['accepted']
            
            p.parent.save (err) ->
                return res.send 500, {err: err} if err
                
                res.email
                    template: 'projects/diagnosis'
                    to: p.owner
                    subject: 'Diagnosis on your ' + p.vehicle.make
                    data:
                        project: p
                        hrefs:
                            home: 'https://' + MF.properties.self.host
                            image: 'https://' + MF.properties.self.host + '/static/img/mechfinder-logo-beta.png'
                            projectReview: 'https://' + MF.properties.self.host + '/projects/' + p._id + '/review'
                
                options =
                    to: p.owner._id
                    message: req.user.username + ' has posted their diagnosis on your ' + p.vehicle.make
                    priority: 2
                    href: '/projects/' + p._id.toString() + '/review'

                Notification.create options, (err, n) ->
                    return res.send p


exports.post = (req, res) ->
    return res.send 403, {err: 'Not logged in'} unless req.user
    # return res.send 400, {result: false, err: 'Missing required fields'} unless req.body.vehicle

    ownerId = req.user._id
    if req.user.role is 'seller'
        return res.send 400, {err: 'Project must be sent owner if seller is posting'} unless req.body.owner
        ownerId = req.body.owner
    
    User.findById ownerId, (err, owner) ->
        return res.send 500, {err: err} if err
        return res.send 404, {err: 'Owner not found'} unless owner

        afterVehicle = (vehicle) ->
            # unless  req.body.title and
            #         req.body.description and
            #         req.body.tow and
            #         req.body.diagnosis
            #     return res.send 400, {result: false, err: 'Missing required fields'}

            req.body.diagnosis = false if req.body.diagnosis is 'false' or req.body.diagnosis is false
            req.body.diagnosis = true if req.body.diagnosis is 'true' or req.body.diagnosis is true
            req.body.repair = 'Other/Not Sure' if req.body.diagnosis

            if Array.isArray req.body.hours
                hours = req.body.hours
                req.body.hours = {}
                req.body.hours[i.toString()] = hour for hour, i in hours

            afterGeo = (geo) ->
                iteratePhotos = (i, photos, ids, after) ->
                    if i < photos.length
                        options =
                            data: photos[i]
                            uploader: req.user._id
                            next: (err, img) ->
                                ids.push img._id unless err or not img
                                iteratePhotos i+1, photos, ids, after
                        
                        Image.add options
                    else
                        after ids


                req.body.photos = [] unless req.body.photos

                iteratePhotos 0, req.body.photos, [], (photoIds) ->
                    req.body.photos = photoIds

                    defaults =
                        title: 'Project Title',
                        description: 'Issues with my vehicle',
                        tow: false,
                        type: 'none',
                        acceptableParts: [],
                        hours: {
                            '0': { open: '17', close: '23' },
                            '1': { open: '17', close: '23' },
                            '2': { open: '17', close: '23' },
                            '3': { open: '17', close: '23' },
                            '4': { open: '17', close: '23' },
                            '5': { open: '17', close: '23' },
                            '6': { open: '17', close: '23' }
                        },
                        diagnosis: true,
                        parts: false
                        repair: '',
                        schedule: new Date(),
                        photos: []

                    project = union(defaults, req.body)
                    project.schedule = new Date() unless project.schedule

                    p = new Project(
                        owner: owner
                        poster: req.user
                        title: scrub project.title, {phone: true, email: true}
                        description: scrub project.description, {phone: true, email: true}
                        # tow: project.tow
                        # preference: project.preference
                        # schedule: project.schedule
                        diagnosis: project.diagnosis
                        # repair: project.repair
                        parts: project.parts
                        acceptableParts: project.acceptableParts
                        # hours: project.hours
                        geo: geo
                        photos: project.photos
                        vehicle: vehicle
                        state: 'draft'
                    )

                    creating = if req.body.creating is 'true' or req.body.creating is true then true else false
                    reviewing = if req.body.reviewing is 'true' or req.body.reviewing is true then true else false
                    draft = if req.body.draft is 'true' or req.body.draft is true then true else false

                    p.state = 'draft' if draft
                    p.state = 'reviewing' if reviewing
                    p.state = 'creating' if creating

                    p.parent = req.body.parent if req.body.parent
                    p.child = req.body.child if req.body.child

                    p.save (err) ->
                        return res.send 500, err if err
                        req.user.addProject p, (err) ->
                            return res.send 500, err if err

                            

                            if p.parent
                                Project.findById p.parent, (err, parent) ->
                                    parent.child = p._id
                                    parent.save (err) ->
                                        # sendNotification()
                                        return res.send {project: p, owner: owner, parent: parent, vehicle: vehicle}
                            else
                                # sendNotification()
                                return res.send {project: p, owner: owner, vehicle: vehicle}

            geo = req.geo
            if req.body.projectLocation?.lat and req.body.projectLocation?.lng
                lat = req.body.projectLocation.lat
                lng = req.body.projectLocation.lng

                lat = parseFloat req.body.projectLocation.lat if req.body.projectLocation.lat is 'string'
                lng = parseFloat req.body.projectLocation.lng if req.body.projectLocation.lng is 'string'

                if isNaN lat or isNaN lng
                    afterGeo(geo)
                else
                    ZipCode.find {location: {$near: [Number(lng), Number(lat)]}}, null, {limit: 1}, (err, zips) ->
                        unless err or zips?.length isnt 1
                            zip = zips[0]
                            geo.source = 'user'
                            geo.lat = Number(lat)
                            geo.long = Number(lng)
                            geo.city = zip.city
                            geo.state = zip.state
                            geo.postal = zip.postal
                            geo.loc =
                                'type': 'Point'
                                'coordinates': [Number(lng), Number(lat)]
                        afterGeo(geo)
            else
                afterGeo(geo)

        if typeof req.body.vehicle is 'string'
            Vehicle.findById req.body.vehicle, (err, v) ->
                return res.send 500, err if err
                return res.send 400, {result: false, err: 'Invalid vehicle ID'} unless v

                afterVehicle v
        else
            unless req.body.vehicle.make and req.body.vehicle.model and req.body.vehicle.year
                return res.send 400, {result: false, err: 'Missing required vehicle fields'}

            mileage = if req.body.vehicle.mileage then parseInt req.body.vehicle.mileage else 0
            mileage = 0 if(isNaN mileage) or mileage > 10000000 or mileage < 0
            v = new Vehicle(
                owner: owner
                make: req.body.vehicle.make
                model: req.body.vehicle.model
                year: req.body.vehicle.year
                engine: req.body.vehicle.engine
                mileage: mileage
            )

            return res.send 400, {err: 'Invalid vehicle year'} unless v.year > 1900
            return res.send 400, {err: 'Invalid vehicle mileage'} if req.body.mileage and v.mileage < 0

            afterVehicle v

            v.save (err) ->
                return res.send 500, err if err
                req.user.addVehicle v, (err) ->
                    return res.send 500, err if err

exports.publish = (req, res) ->
    return res.send 403, {err: 'Not logged in'} unless req.user
    return res.send 400, {err: 'Missing required parameters'} unless req.params.id

    q = Project.findById req.params.id
    q.populate 'owner'
    q.populate 'vehicle'
    q.exec (err, p) ->
        return res.send 500, {err: err} if err
        return res.send 404, {err: 'Project not found'} unless p
        return res.send 403, {err: 'Invalid project state for publishing'} unless p.state in ['draft', 'reviewing']
        p.state = 'bidding'
        p.save (err) ->
            sendNotification = () ->
                # send the admin notification
                hollaOpts = 
                    user: req.user._id
                    message: req.user.username + ' has posted a new job' + (if p.owner._id.toString() is req.user._id.toString() then '' else ' for ' + p.owner.username) + ': ' + p.title
                    href: ''
                Holla.generate hollaOpts, (err, h) ->

                res.email
                    template: 'admin/new-project'
                    to: 'notifications@mechfinder.com'
                    subject: 'New Job Created'
                    data:
                        project: p
                        vehicle: p.vehicle
                        user: req.user
                        hrefs:
                            project: 'https://' + MF.properties.self.host + '/projects/' + p._id

                unless p.state in ['draft', 'creating']
                    options = 
                        to: p.owner._id
                        message: 'Local mechanics have been notified of your job. We will email you when it recieves estimates.'
                        priority: 1
                        href: '/my/projects'
                    Notification.generate options, (err, n) ->

                    filter =
                        loc: req.user.geo.loc.coordinates # need to user project location
                        distance: 25
                        role: 'seller'

                    User.find_near filter, (err, mechanics, total) ->
                        options = 
                            to: ''
                            message: 'A new job has been posted within ' + filter.distance + ' miles of you!'
                            priority: 1
                            href: '/projects/' + p._id.toString()

                        sellerIds = []
                        for mech in mechanics
                            sellerIds.push mech._id.toString()
                            options.to = mech._id
                            Notification.generate options, (err, n) ->
                                console.log err if err

                            if mech.preferences.notifications.email.newProjects
                                res.email
                                    template: 'projects/new'
                                    to: mech
                                    subject: 'New Job Posted Near You'
                                    data:
                                        project: p
                                        vehicle: p.vehicle
                                        user: req.user
                                        target: mech
                                        hrefs:
                                            home: 'https://' + MF.properties.self.host
                                            image: 'https://' + MF.properties.self.host + '/static/img/mechfinder-logo-beta.png'
                                            project: 'https://' + MF.properties.self.host + '/projects/' + p._id
                        
                        # email mechanics who have been on customer's previous projects that weren't found in the radius search
                        q = Project.find {owner: req.user._id}
                        q.populate 'assigned', 'picture username geo mechanicType warranty average_rating role ratings referral.workorder referral.diagnosis tax.parts tax.labor diagnosisCharge'
                        q.exec (err, projects) ->
                            unless err or not projects or projects.length < 1
                                for project in projects
                                    if project.assigned
                                        unless project.assigned._id.toString() in sellerIds or not project.assigned.preferences.notifications.email.buyerUpdates
                                            sellerIds.push project.assigned._id.toString()
                                            res.email
                                                template: 'projects/new-repeat-buyer'
                                                to: project.assigned
                                                subject: 'New job posted by a previous customer'
                                                data:
                                                    project: p
                                                    vehicle: p.vehicle
                                                    user: req.user
                                                    target: project.assigned
                                                    hrefs:
                                                        home: 'https://' + MF.properties.self.host
                                                        image: 'https://' + MF.properties.self.host + '/static/img/mechfinder-logo-beta.png'
                                                        project: 'https://' + MF.properties.self.host + '/projects/' + p._id
                                                        personalProfile: 'https://' + MF.properties.self.host + '/profile/' + project.assigned._id + '/personal'
            
            sendNotification()
            return res.send 500, {err: err} if err
            return res.send p

exports.draft = (req, res) ->
    return res.send 403, {err: 'Not logged in'} unless req.user
    return res.send 400, {err: 'Missing required parameters'} unless req.params.id

    q = Project.findById req.params.id
    q.exec (err, p) ->
        return res.send 500, {err: err} if err
        return res.send 404, {err: 'Project not found'} unless p
        return res.send 403, {err: 'Invalid project state for drafting'} unless p.state in ['draft', 'reviewing']
        p.state = 'draft'
        p.save (err) ->
            return res.send 500, {err: err} if err
            return res.send p

exports.update = (req, res) ->
    return res.send(403) unless req.user
    return res.send 500 unless req.params.id

    Project.findById req.params.id, (err, p) ->
        return res.send 500, err if err
        return res.send 404 unless p
        return res.send 403 unless p.permissions(req.user).can_edit

        oldProjectData = p.toObject()

        p.title             = scrub req.body.title, {phone: true, email: true}          if req.body.title
        p.description       = scrub req.body.description, {phone: true, email: true}    if req.body.description

        p.repair            = req.body.repair           if req.body.repair
        p.tow               = req.body.tow              if req.body.tow or req.body.tow == false
        p.preference        = req.body.preference       if req.body.preference
        p.schedule          = req.body.schedule         if req.body.schedule
        p.diagnosis         = req.body.diagnosis        if req.body.diagnosis or req.body.diagnosis == false
        p.repair            = req.body.repair           if req.body.repair
        p.parts             = req.body.parts            if req.body.parts
        p.acceptableParts   = req.body.acceptableParts  if req.body.acceptableParts
        p.hours             = req.body.hours            if req.body.hours

        afterGeo = () ->
            iteratePhotos = (i, photos, ids, after) ->
                if i < photos.length
                    options = 
                        data: photos[i]
                        uploader: req.user._id
                        next: (err, img) ->
                            ids.push img._id unless err or not img
                            iteratePhotos i+1, photos, ids, after
                    
                    Image.add options
                else
                    after ids

            req.body.photos = [] unless req.body.photos

            iteratePhotos 0, req.body.photos, [], (photoIds) ->
                for photoId in photoIds
                    p.photos.push photoId

                if req.body.deletePhotos
                    i = 0
                    for photo in req.body.deletePhotos
                        c = 0
                        for projectPhoto in p.photos
                            if p.photos[c].equals photo
                                p.photos.splice c, 1
                                break
                            c++
                        i++

                afterVehicle = (p, pOld) ->
                    p.recordDiffs pOld, (err) ->
                        return res.send 500, err if err

                        p.save (err) ->
                            return res.send(500, err) if err

                            # if the buyer changed their own job
                            if req.user._id.toString() is p.owner.toString()
                                # notify the mechanics that have active estimates on the job of changes
                                # iterate through all the estimates
                                options = 
                                    to: ''
                                    message: req.user.username + ' has updated information on their job. You\'ll need to submit a new estimate based on their changes'
                                    priority: 1
                                    href: '/projects/' + p._id.toString()

                                for b in p.bids
                                    if b.state in ['submitted']
                                        options.to = b.owner
                                        b.state = 'canceled'
                                        b.date_canceled = new Date()
                                        Notification.generate options, (err, n) ->
                                p.save (err) ->
                                    return res.send {result: true, err: false, project: p}

                            else
                                # notify the customer that the mechanic has updated their job
                                options =
                                    to: p.owner
                                    message: 'Your mechanic has updated the service description on your project'
                                    priority: 2
                                    href: '/projects/' + p._id.toString() + '/review'

                                Notification.generate options, (err, n) ->
                                return res.send {result: true, err: false, project: p}

                if req.body.vehicle
                    if typeof req.body.vehicle is 'string'
                        Vehicle.findById req.body.vehicle, (err, v) ->
                            return res.send 500, err if err
                            return res.send 403, {result: false, err: 'Vehicle ID not found'} unless v

                            p.vehicle = req.body.vehicle

                            afterVehicle p, oldProjectData
                    else
                        unless req.body.vehicle.make and req.body.vehicle.model and req.body.vehicle.year
                            return res.send 400, {result: false, err: 'Missing required vehicle fields'}

                        mileage = if req.body.vehicle.mileage then parseInt req.body.vehicle.mileage else 0
                        mileage = 0 if(isNaN mileage) or mileage > 10000000 or mileage < 0

                        v = new Vehicle(
                            owner: req.user
                            make: req.body.vehicle.make
                            model: req.body.vehicle.model
                            year: req.body.vehicle.year
                            engine: req.body.vehicle.engine
                            mileage: mileage
                        )

                        v.save (err) ->
                            return res.send 500, err if err
                            req.user.addVehicle v, (err) ->
                                return res.send 500, err if err

                                p.vehicle = v
                                afterVehicle p, oldProjectData
                else
                    afterVehicle p, p

        if req.body.projectLocation?.lat and req.body.projectLocation?.lng
            lat = req.body.projectLocation.lat
            lng = req.body.projectLocation.lng

            lat = parseFloat req.body.projectLocation.lat if req.body.projectLocation.lat is 'string'
            lng = parseFloat req.body.projectLocation.lng if req.body.projectLocation.lng is 'string'

            if isNaN lat or isNaN lng
                afterGeo()
            else
                ZipCode.find {location: {$near: [Number(lng), Number(lat)]}}, null, {limit: 1}, (err, zips) ->
                    unless err or zips?.length isnt 1
                        zip = zips[0]
                        p.geo.source = 'user'
                        p.geo.lat = Number(lat)
                        p.geo.long = Number(lng)
                        p.geo.city = zip.city
                        p.geo.state = zip.state
                        p.geo.postal = zip.postal
                        p.geo.loc =
                            'type': 'Point'
                            'coordinates': [Number(lng), Number(lat)]
                    afterGeo()
        else
            afterGeo()



        

exports.remove = (req, res) ->
    return res.send 403 unless req.user
    return res.send 500 unless req.params.id

    Project.findById req.params.id, (err, p) ->
        return res.send 500, err if err
        return res.send 404 unless p
        return res.send 403 unless p.permissions(req.user).can_edit

        canceledReason = ''
        canceledReason = req.body.reason if req.body.reason

        oldProject = p.toObject()

        p.set(
            state: 'canceled'
            canceledReason: canceledReason
        )

        p.recordDiffs oldProject, (err) ->
            p.save (err) ->
                return res.send 500, err if err
                return res.send {result: true, err: false, project: p}


exports.welcomeproject = (req, res) ->
    return res.send(403) unless req.user
    Project.findById req.params.id, (err, p) ->
        return res.send(500, err) if err
        return res.send(404) unless p
        return res.send(403) unless p.permissions(req.user).can_edit

        p.set(
            description:      req.body.description
            budget:           req.body.budget
            pictures:         req.body.pictures
            vehicle: {
                make:         req.body.vehicle_make
                model:        req.body.vehicle_model
                year:         req.body.vehicle_year
                starts:       req.body.vehicle_starts
                drives:       req.body.vehicle_drives
                needs_tow:    req.body.vehicle_needs_tow
            }
            phone:            req.body.phone
        )

        p.save (err) ->
            return res.send(500, err) if err
            res.send p

exports.retractBid = (req, res) ->
    return res.send 403, {err: 'Not logged in'} unless req.user
    return res.send 403, {err: 'Email not verified'} unless req.user.verified
    return res.send 400, {err: 'Missing required parameters'} unless req.params.id
    return res.send 400, {err: 'Missing required properties'} unless req.body.estimateId

    Project.findById req.params.id, (err, p) ->
        return res.send 500, {err: err} if err
        return res.send 404, {err: 'Project not found'} unless p

        estimate = p.bids.id req.body.estimateId
        return res.send 404, {err: 'Estimate not found'} unless estimate
        return res.send 403, {err: 'Insufficient permissions to retract'} unless estimate.owner.equals req.user._id
        return res.send 403, {err: 'Cannot retract estimate in current state', state: estimate.state} unless estimate.state is 'submitted'

        estimate.state = 'retracted'
        estimate.date_retracted = new Date()
        p.save (err) ->
            return res.send 500, {err: err} if err
            return res.send estimate

exports.requestMoreInfo = (req, res) ->
    return res.send 403, {err: 'Not logged in'} unless req.user
    return res.send 403, {err: 'Invalid user role'} unless req.user.role is 'buyer'
    return res.send 400, {err: 'Missing required fields'} unless req.params.id

    q = Project.findById req.params.id
    q.exec (err, p) ->
        return res.send 500, {err: err} if err
        return res.send 404, {err: 'Project not found'} unless p
        return res.send 403, {err: 'Permission denied'} unless p.owner.toString() is req.user._id.toString()
        return res.send 403, {err: 'Invalid project state'} unless p.state is 'draft' and p.owner.toString() isnt p.poster?.toString()

        # send a notification to the poster
        options =
            to: p.poster
            message: req.user.username + ' has requested that you fill out more information on this project'
            priority: 2
            href: '/projects/' + p._id.toString() + '/edit'

        Notification.generate options, (err, n) ->
            return res.send 500, {err: err} if err
            return res.send n



exports.bid = (req, res) ->
    return res.send 403 unless req.user
    return res.send 403, {result: false, message: 'Email not verified'} unless req.user.verified

    # need at least SOME labor or parts in a bid
    return res.send 400, {result: false, message: 'Missing required fields', body: req.body} unless req.body.labor or req.body.parts

    Project.findById(req.params.id).populate('owner').populate('bids.user parent').exec (err, p) ->
        return res.send 500, err if err
        options =
            user: req.user
            labor: req.body.labor
            parts: req.body.parts
            comment: req.body.comment || ''
            diagnosisWaived: req.body.diagnosisWaived if req.body.diagnosisWaived in ['true', 'false', true, false]
            referral:
                buyer: if p.diagnosis then p.owner.referral.diagnosis else p.owner.referral.workorder
                seller: if p.diagnosis then req.user.referral.diagnosis else req.user.referral.workorder
        
        options.taxRate =
            parts: 0
            labor: 0
        options.taxRate.parts = req.body.taxRate.parts if req.body.taxRate and req.body.taxRate.parts
        options.taxRate.labor = req.body.taxRate.labor if req.body.taxRate and req.body.taxRate.labor

        if p.parent and p.parent.diagnosis and p.parent.bids and p.parent.bids.length > 0
            # the project has a parent, so we need to tack on the waiver to the bid
            for b in p.parent.bids
                if b.state in ['accepted', 'released', 'requested']
                    # waive the labor of the old diagnosis project on this project
                    options.diagnosisWaiver = b.laborAmount
                    break

        p.bid options, (err, b) ->
            return res.send 500, err if err
            console.log b.toJSON()

            # need to find a better way to populate the new bid's user here
            q = Project.findById(req.params.id)
            q.populate 'owner', 'picture username geo mechanicType warranty average_rating role ratings referral.workorder referral.diagnosis tax.parts tax.labor.diagnosis diagnosisCharge'
            q.populate 'bids.owner', 'picture username geo mechanicType warranty average_rating role ratings referral.workorder referral.diagnosis tax.parts tax.labor.workorder diagnosisCharge'
            q.populate 'vehicle'
            q.exec (err, p) ->
                return res.send 500, err if err

                count = 0
                for bid in p.bids
                    count++ if bid.owner._id.equals req.user._id
                    break if count > 1

                hiredCount = 0
                if p.state is 'assigned'
                    hiredCount = count

                verbiage = if count > 1 then 'updated' else 'placed'

                return res.send(p) if p.state in ['draft', 'creating']

                options =
                    to: p.owner._id
                    message: req.user.username + ' has ' + verbiage + ' an estimate on your project: ' + p.title
                    priority: 1
                    href: '/projects/' + p._id.toString()

                Notification.generate options, (err, n) ->

                if p.owner.preferences.notifications.email.projectBasic
                    if count > 1
                        if hiredCount > 1
                            # assigned seller added another estimate to project
                            res.email
                                template: 'projects/bid-additional'
                                to: p.owner
                                subject: req.user.username + ' suggested additional repairs'
                                data:
                                    project: p
                                    bid: b
                                    seller: req.user
                                    hrefs:
                                        home: 'https://' + MF.properties.self.host
                                        image: 'https://' + MF.properties.self.host + '/static/img/mechfinder-logo-beta.png'
                                        project: 'https://' + MF.properties.self.host + '/projects/' + p._id
                                        how: 'https://' + MF.properties.self.host + '/customer/info/howItWorks'
                        else
                            # seller edited his estimate
                            res.email
                                template: 'projects/bid-edited'
                                to: p.owner
                                subject: req.user.username + ' edited their estimate'
                                data:
                                    project: p
                                    bid: b
                                    seller: req.user
                                    hrefs:
                                        home: 'https://' + MF.properties.self.host
                                        image: 'https://' + MF.properties.self.host + '/static/img/mechfinder-logo-beta.png'
                                        project: 'https://' + MF.properties.self.host + '/projects/' + p._id
                                        how: 'https://' + MF.properties.self.host + '/customer/info/howItWorks'
                    else
                        # seller added estimate to project 
                        res.email
                            template: 'projects/bid'
                            to: p.owner
                            subject: 'New Estimate Received for Your ' + p.vehicle.make
                            data:
                                project: p
                                bid: b
                                seller: req.user
                                hrefs:
                                    home: 'https://' + MF.properties.self.host
                                    image: 'https://' + MF.properties.self.host + '/static/img/mechfinder-logo-beta.png'
                                    project: 'https://' + MF.properties.self.host + '/projects/' + p._id
                                    how: 'https://' + MF.properties.self.host + '/customer/info/howItWorks'
                                
                return res.send p

exports.requestEstimate = (req, res) ->
    return res.send 403, {err: 'Not logged in'} unless req.user
    return res.send 400, {err: 'Missing required parameters'} unless req.params.id
    return res.send 400, {err: 'Missing required fields'} unless req.body.targetUserId

    q = Project.findById req.params.id
    q.exec (err, project) ->
        return res.send 500, {err: err} if err
        return res.send 404, {err: 'Project not found'} unless project

        q = User.findById req.body.targetUserId, (err, targetUser) ->
            return res.send 500, {err: err} if err
            return res.send 404, {err: 'Target user not found'} unless targetUser

            options = 
                to: targetUser._id
                message: req.user.username + ' has requested that you place an estimate on their job: ' + project.title
                priority: 1
                href: '/projects/' + project._id

            Notification.generate options, (err, n) ->
                return res.send 500, {err: err} if err or (not n)
                return res.send n

exports.requestPayment = (req, res) ->
    return res.send 403, {err: 'Not logged in'} unless req.user
    return res.send 400, {err: 'Missing required parameters'} unless req.params.id
    return res.send 400, {err: 'Missing required fields'} unless req.body.estimateId

    q = Project.findById(req.params.id)
    q.populate 'owner', 'email first last phone preferences picture username geo mechanicType warranty average_rating role ratings referral.workorder referral.diagnosis tax.parts tax.labor diagnosisCharge'
    q.populate 'bids.owner', 'picture username geo mechanicType warranty average_rating role ratings referral.workorder referral.diagnosis tax.parts tax.labor diagnosisCharge'
    q.populate 'vehicle'
    q.exec (err, p) ->
        return res.send 500, {err: err} if err
        return res.send 404, {err: 'Project not found'} unless p

        p.requestPayment req.user._id, req.body.estimateId, (err, b) ->
            return res.send 500, {err: err} if err

            lastOneDone = true
            for bid in p.bids
                unless bid.state in ['retracted', 'canceled', 'released', 'requested']
                    lastOneDone = false
                    break

            options =
                to: p.owner._id
                message: req.user.username + ' has requested payment for your job: ' + p.title
                priority: 3
                href: '/projects/' + p._id.toString()

            if p.owner.preferences.notifications.email.projectImportant and lastOneDone
                # email the user that the job is done if set in prefs
                res.email
                    template: 'projects/payment-requested'
                    to: p.owner
                    subject: req.user.username + ' has requested payment for your job'
                    data:
                        project: p
                        seller: req.user
                        hrefs:
                            home: 'https://' + MF.properties.self.host
                            image: 'https://' + MF.properties.self.host + '/static/img/mechfinder-logo-beta.png'
                            project: 'https://' + MF.properties.self.host + '/projects/' + p._id
                            projectRelease: 'https://' + MF.properties.self.host + '/projects/' + p._id + '?releasePayment=' + req.body.estimateId

            Notification.generate options, (err, n) ->

            return res.send b

            


exports.comment = (req, res) ->
    return res.send(403) unless req.user
    q = Project.findById(req.params.id)
    q.populate 'owner', 'picture username geo mechanicType warranty average_rating role ratings referral.workorder referral.diagnosis tax.parts tax.labor diagnosisCharge'
    q.exec (err, p) ->
        return res.send(403) unless p.permissions(req.user).can_comment
        c = new Comment(topic: p, user: req.user, comments: req.body.comments)
        c.save (err) ->
            return res.send(500, err) if err
            res.send(c)
            unless compare_document(req.user, p.owner)
                to = p.owner
                res.notify
                    template: 'projects/comment'
                    to: to
                    subject: 'New Comment on Your Mechfinder Project'
                    data:
                        project: p
                        comment: c
                        user: req.user
                for ph of to.phone
                    current_phone = to.phone[ph]
                    if current_phone.sms_notifications and  'mobile_provider' of current_phone and current_phone.mobile_provider isnt "" and  'number' of current_phone  and current_phone.number isnt ""
                        res.email
                            template: 'projects/sms/comment'
                            to:
                                name: to.last + ' '  + to.first
                                address: current_phone.number + current_phone.mobile_provider
                            subject: 'New Comment on Your Project'
                            data:
                                from: req.user
                res.email
                    template: 'projects/sms/notification'
                    data:     { from: req.user }
                    to:
                        name: 'Sherif'
                        address: 'chicoo2006@gmail.com'
                    subject:  "Mechfinder private message from #{req.user.name}."

exports.meetup = (req, res) ->
    return res.send(403) unless req.user
    q = Project.findById(req.params.id)
    q.populate 'owner', 'picture username geo mechanicType warranty average_rating role ratings referral.workorder referral.diagnosis tax.parts tax.labor diagnosisCharge'
    q.populate 'assigned', 'picture username geo mechanicType warranty average_rating role ratings referral.workorder referral.diagnosis tax.parts tax.labor diagnosisCharge'
    q.exec (err, p) ->
        return res.send(403) unless p.permissions(req.user).can_schedule
        ev = new Event(
            project:  p
            user:     req.user
            mechanic: p.assigned
            notes:    req.body.notes
            location: req.body.location
            date:     moment("#{req.body.date} #{req.body.hour}:#{req.body.minute} #{req.body.period}", "MM/DD/YYYY h:mm a").toDate()
        )
        ev.save (err) ->
            return res.send(500, err) if err
            res.notify
                template: 'projects/meetup'
                to: p.assigned
                subject: 'New Meetup Scheduled on Mechfinder'
                data:
                    project: p
                    event: ev
                    user: req.user
            res.email
                template: 'projects/rate-reminder'
                to: p.owner
                subject: 'Remember To Rate The Mechanic'
                data:
                    p: p
            to = p.owner
            for ph of to.phone
                current_phone = to.phone[ph]
                if current_phone.sms_notifications and  'mobile_provider' of current_phone and current_phone.mobile_provider isnt "" and  'number' of current_phone  and current_phone.number isnt ""
                    res.email
                        template: 'projects/sms/rate-buyer'
                        to:
                            name: to.last + ' '  + to.first
                            address: current_phone.number + current_phone.mobile_provider
                        subject: ' Remember To Rate'
                        data:
                            from: req.user
                            p: p

            to = p.assigned
            for ph of to.phone
                current_phone = to.phone[ph]
                if current_phone.sms_notifications and  'mobile_provider' of current_phone and current_phone.mobile_provider isnt "" and  'number' of current_phone  and current_phone.number isnt ""
                    res.email
                        template: 'projects/sms/meet-seller'
                        to:
                            name: to.last + ' '  + to.first
                            address: current_phone.number + current_phone.mobile_provider
                        subject: ' Confirm Meet Up'
                        data:
                            from: req.user
                            p: p

            res.send(ev)

exports.hirepaypal = (req,res, next) ->
    console.log("deprecated")
    return res.send 410
    req.body.bid = req.params.bid
    next()
exports.chargeBalance = (req,res, next) ->
    console.log("deprecated")
    return res.send 410
    return res.send(403) unless req.user
    return res.send(403) unless req.body.bid
    Project.findById(req.params.id).populate('assigned').populate('charges').exec (err, p) ->
        return res.send(500, err) if err
        return res.send(404) unless p
        return res.send(403) unless p.permissions(req.user).can_escrow
        bid = p.bids.id(req.body.bid)
        p.calculateAmount (amount) ->
            total = req.user.balance + amount
            if bid.estimate > amount && total >= bid.estimate
                return p.chargebalance req.user, bid.estimate - amount, next
            else if bid.estimate <= amount
                return next()
            return next(' not enough money in your balance ')

exports.chargecharges = (req, res, next) ->
    console.log("deprecated")
    return res.send 410
    return res.send(403) unless req.user
    return res.send(403) unless req.body.bid
    Project.findById(req.params.id).populate('assigned').populate('charges').exec (err, p) ->
        return res.send(500, err) if err
        return res.send(404) unless p
        return res.send(403) unless p.permissions(req.user).can_escrow
        bid = p.bids.id(req.body.bid)
        p.calculateAmount (amount) ->
            total = req.user.balance + amount
            if req.user.balance < 0 or amount != bid.estimate
                p.fixcharges req.user, bid.estimate, next
            else
                next()

exports.chargestripe = (req, res, next) ->
    console.log("deprecated")
    return res.send 410
    return res.send(403) unless req.user
    return res.send(403) unless req.body.stripeToken
    Project.findById req.params.id, (err, p) ->
        return res.send(500, err) if err
        return res.send(404) unless p
        u = req.user
        p.addstripecharge  req.user, req.body.amount, req.body.description,  req.body.stripeToken, (err) ->
            return res.send(500, err) if err
            next()

exports.chargesaved = (req, res, next) ->
    console.log("deprecated")
    return res.send 410
    return res.send(403) unless req.user
    return res.send(403) unless req.body.optionsRadios
    Project.findById req.params.id, (err, p) ->
        return res.send(500, err) if err
        return res.send(404) unless p
        u = req.user
        p.addsavedcharge  req.user, req.body.amount, req.body.description,  req.body.optionsRadios, (err) ->
            return res.send(500, err) if err
            next()

exports.populateCharges = (req, res, next) ->
    console.log( 'populating charges' );
    Project.findById(req.body.projectId).populate('assigned').populate('charges').exec (err, p) ->
        return res.send(500, err) if err
        return res.send(404) unless p
        return res.send(403) unless p.permissions(req.user).can_escrow
        amount = parseFloat(req.body.amount)
        req.user.getTransactionRates amount, (err, rates) ->
            return res.send(500, err) if err
            p.populateCharges req.user, rates.totalAmount, (err) ->
                return res.send(500, err) if err
                return next()

exports.hire = (req, res) ->
    return res.send 403, {err: 'Not logged in'} unless req.user
    return res.send 400, {err: 'Missing required fields'} unless req.body.projectId and req.body.bidId

    discountId = req.body.discountId

    q = Project.findById(req.body.projectId)
    q.populate('charges')
    q.populate('owner')
    q.populate('bids.owner')
    q.populate('vehicle')
    q.exec (err, p) ->
        return res.send 500, {err: err} if err
        return res.send 404, {err: 'Project not found'} unless p
        u = req.user
        bid = null
        for b in p.bids
            if b._id.toString() is req.body.bidId
                bid = b
                break
        
        return res.send 404, {err: 'Bid not found'} unless bid
        p.hire req.user, req.body.bidId, discountId, p.owner, bid.owner, (err, p) ->
            return res.send 500, {err: err} if err

            res.email
                template: 'projects/hire-buyer'
                to: req.user
                subject: 'Meet your mechanic and schedule your repair'
                data:
                    user: req.user
                    project: p
                    bid: bid
                    seller: bid.owner
                    hrefs:
                        home: 'https://' + MF.properties.self.host
                        image: 'https://' + MF.properties.self.host + '/static/img/mechfinder-logo-beta.png'
                        project: 'https://' + MF.properties.self.host + '/projects/' + p._id
                        message: 'https://' + MF.properties.self.host + '/projects/' + p._id + '?contactAction=' + bid.owner._id

            res.email
                template: 'projects/hire'
                to: bid.owner
                subject: 'Congratulations - You are hired!'
                data:
                    user: req.user
                    project: p
                    bid: bid
                    seller: bid.owner
                    hrefs:
                        home: 'https://' + MF.properties.self.host
                        image: 'https://' + MF.properties.self.host + '/static/img/mechfinder-logo-beta.png'
                        project: 'https://' + MF.properties.self.host + '/projects/' + p._id
                        message: 'https://' + MF.properties.self.host + '/projects/' + p._id + '?contactAction=' + req.user._id
                        how: 'https://' + MF.properties.self.host + '/mechanic/info/howItWorks'

            console.log 'what about before the return statement?'
            return res.send {project: p, bid: bid}

exports.release = (req,res) ->
    return res.send(403) unless req.user
    Charge.findOne({_id:req.params.id}).populate('assigned').populate('project').exec (err, c) ->
        return res.send 500 if err?
        return res.send 401 unless c?
        return res.send 403 unless c.permissions(req.user).can_release
        c.release req.user, (err) ->
            res.send(c.project)

exports.reveal = (req,res) ->
    return res.send(403) unless req.user
    Project.findOne({_id:req.params.id}).populate('owner').populate('owner.viewers').exec (err, p) ->
        return res.send 500 if err?
        return res.send 401 unless p?
        return res.send 403 if p.permissions(req.user).is_related
        is_viewer = false
        async.forEach p.owner.viewers, (view, cb) ->
            if compare_document(view, req.user)
                is_viewer = true
                cb()
            else
                cb()
        , () ->
            return res.send 401 if is_viewer
            p.owner.reveal req.user, (err) ->
                #res.send(p.project)
                res.send(p)

exports.revealsaved = (req,res) ->
    return res.send(403) unless req.user
    Project.findOne({_id:req.params.id}).populate('owner').populate('owner.viewers').exec (err, p) ->
        return res.send 500 if err?
        return res.send 401 unless p?
        return res.send 403 if p.permissions(req.user).is_related
        is_viewer = false
        async.forEach p.owner.viewers, (view, cb) ->
            if compare_document(view, req.user)
                is_viewer = true
                cb()
            else
                cb()
        , () ->
            return res.send 401 if is_viewer
            p.owner.revealsaved req.user, req.body.optionsRadios, u.revealPrice - req.user.balance , (err) ->
                #res.send(p.project)
                res.send(p)

exports.revealcard = (req,res) ->
    return res.send(403) unless req.user
    Project.findOne({_id:req.params.id}).populate('owner').populate('owner.viewers').exec (err, p) ->
        return res.send 500 if err?
        return res.send 401 unless p?
        return res.send 403 if p.permissions(req.user).is_related
        is_viewer = false
        async.forEach p.owner.viewers,  (view, cb) ->
            if compare_document(view, req.user)
                is_viewer = true
                cb()
            else
                cb()
        , () ->
            return res.send 401 if is_viewer
            p.owner.revealcard req.user, req.body.stripeToken, u.revealPrice - req.user.balance , (err) ->
                #res.send(p.project)
                res.send(p)

exports.reqrelease = (req,res) ->
    console.log("deprecated")
    return res.send 410
    return res.send(403) unless req.user
    Charge.findOne({_id:req.params.id}).populate('assigned').populate('project').exec (err, c) ->
        return res.send 500 if err?
        return res.send 401 unless c?
        return res.send 403 unless c.permissions(req.user).can_request
        c.request req.user, (err) ->
            res.send(c.project)
exports.cancelmilestone = (req,res) ->
    console.log("deprecated")
    return res.send 410
    return res.send(403) unless req.user
    Charge.findOne({_id:req.params.id}).populate('owner').populate('project').exec (err, c) ->
        return res.send 500 if err?
        return res.send 401 unless c?
        return res.send 403 unless c.permissions(req.user).can_cancel
        c.cancel req.user, (err) ->
            res.send(c.project)
exports.escrow = (req,res) ->
    console.log("deprecated")
    return res.send 410
    return res.send(403) unless req.user
    return res.send(403) unless req.body.amount and req.body.description
    Project.findById req.params.id, (err, p) ->
        return res.send(500, err) if err
        return res.send(404) unless p
        return res.send(403) unless p.permissions(req.user).can_escrow
        return res.send
            amount: req.body.amount
            description: req.body.description
            balance:req.user.balance
            p:p
exports.escrowstripe = (req,res) ->
    console.log("deprecated")
    return res.send 410
    return res.send(403) unless req.user
    return res.send(403) unless req.body.amount and req.body.description and req.body.stripeToken
    Project.findById(req.params.id).populate('assigned').exec (err, p) ->
        return res.send(500, err) if err
        return res.send(404) unless p
        return res.send(403) unless p.permissions(req.user).can_escrow
        p.addstripecharge req.user, req.body.amount, req.body.description, req.body.stripeToken, (err) ->
            return res.send(500, err) if err
            res.send(p)
exports.escrowsaved = (req,res) ->
    console.log("deprecated")
    return res.send 410
    return res.send(403) unless req.user
    return res.send(403) unless req.body.amount and req.body.description and req.body.optionsRadios
    Project.findById(req.params.id).populate('assigned').exec (err, p) ->
        return res.send(500, err) if err
        return res.send(404) unless p
        return res.send(403) unless p.permissions(req.user).can_escrow
        p.addsavedcharge  req.user, req.body.amount, req.body.description,  req.body.optionsRadios, (err) ->
            return res.send(500, err) if err
            res.send(p)

exports.escrowfrombalance = (req,res) ->
    console.log("deprecated")
    return res.send 410
    return res.send(403) unless req.user
    return res.send(403) unless req.body.amount and req.body.description and req.body.project
    Project.findById(req.params.id).populate('assigned').exec (err, p) ->
        return res.send(500, err) if err
        return res.send(404) unless p
        return res.send(403) unless p.permissions(req.user).can_escrow
        p.addchargefrombalance req.user, req.body.amount, req.body.description, (err) ->
            return res.send(500, err) if err
            res.send(p)


exports.rate = (req, res) ->
    return res.send 403, {err: 'Not logged in'} unless req.user
    return res.send 400, {err: 'Missing required fields'} unless req.body.rating

    req.body.feedback = '' unless typeof req.body.feedback is 'string'
    rating = parseInt(req.body.rating)
    return res.send 400, {err: 'Invalid rating'} unless (not isNaN rating) and rating > 0

    Project.findById(req.params.id).populate('assigned').populate('owner').exec (err, p) ->
        return res.send 500, {err: err} if err
        return res.send 404, {err: 'Project not found'} unless p
        p.rate req.user, req.body.rating, req.body.feedback, (err, r) ->
            return res.send 500, {err: err} if err

            if compare_document(p.owner, req.user) # buyer is rating seller
                p.sellerRated = true
                p.save (err) ->
                    options =
                        to: p.assigned._id
                        message: p.owner.username + ' wrote a review based off of their experience working with you'
                        priority: 1
                        href: '/projects/' + p._id.toString()

                    Notification.generate options, (err, n) ->
                        console.log err if err

                    return res.send 500, {err: err} if err
                    return res.send r

            if compare_document(p.assigned, req.user) # seller is rating buyer
                p.buyerRated = true
                p.save (err) ->
                    options =
                        to: p.owner._id
                        message: p.assigned.username + ' wrote a review based off their experience doing a job for you'
                        priority: 1
                        href: '/projects/' + p._id.toString()

                    Notification.generate options, (err, n) ->
                        console.log err if err

                    return res.send 500, {err: err} if err
                    return res.send r

            # will probably uncomment all of this once we get to it
            # return res.send p
            # res.notify
            #     template: 'projects/rate'
            #     to: if compare_document(p.owner, r.user) then p.assigned else p.owner
            #     subject: 'You\'re Received a Rating on Mechfinder!'
            #     data:
            #         project: p
            #         user: req.user
            #         rating: r
            #     to = if compare_document(p.owner, r.user) then p.assigned else p.owner
            #     secondto = if compare_document(p.owner, r.user) then p.owner else p.assigned
            #     for ph of to.phone
            #         current_phone = to.phone[ph]
            #         if current_phone.sms_notifications and  'mobile_provider' of current_phone and current_phone.mobile_provider isnt "" and  'number' of current_phone  and current_phone.number isnt ""
            #             res.email
            #                 template: 'projects/sms/rate'
            #                 to:
            #                     name: to.last + ' '  + to.first
            #                     address: current_phone.number + current_phone.mobile_provider
            #                 subject: 'Rating Received!'
            #                 data:
            #                     project: p
            #                     user: req.user
            #                     rating: r
            #             res.email
            #                 template: 'projects/sms/facebook'
            #                 to:
            #                     name: to.last + ' '  + to.first
            #                     address: current_phone.number + current_phone.mobile_provider
            #                 subject: 'Facebook Like Us'
            #                 data:
            #                     project: p
                # res.email
                #     template: 'projects/facebook'
                #     to: to
                #     subject: 'Facebook Like Us!'
                #     data:
                #         from: req.user
                #         p:p
                # to = secondto
                # for ph of to.phone
                #     current_phone = to.phone[ph]
                #     if current_phone.sms_notifications and  'mobile_provider' of current_phone and current_phone.mobile_provider isnt "" and  'number' of current_phone  and current_phone.number isnt ""
                #         res.email
                #             template: 'projects/sms/facebook'
                #             to:
                #                 name: to.last + ' '  + to.first
                #                 address: current_phone.number + current_phone.mobile_provider
                #             subject: 'Facebook Like Us'
                #             data:
                #                 project: p
            # res.send(p)

exports.end = (req, res) ->
    return res.send(403) unless req.user
    Project.findById(req.params.id).populate('assigned').populate('owner').exec (err, p) ->
        return res.send(500, err) if err
        return res.send(404) unless p
        p.end req.user, req.body.stars, req.body.notes, (err, r) ->
            return res.send(500, err) if err
            res.notify
                template: 'projects/rate'
                to: if compare_document(p.owner, r.user) then p.assigned else p.owner
                subject: 'You\'re Received a Rating on Mechfinder!'
                data:
                    project: p
                    user: req.user
                    rating: r
                to = if compare_document(p.owner, r.user) then p.assigned else p.owner
                secondto = if compare_document(p.owner, r.user) then p.owner else p.assigned
                for ph in to.phone
                    current_phone = ph
                    if current_phone.sms_notifications and  'mobile_provider' of current_phone and current_phone.mobile_provider isnt "" and  'number' of current_phone  and current_phone.number isnt ""
                        res.email
                            template: 'projects/sms/rate'
                            to:
                                name: to.last + ' '  + to.first
                                address: current_phone.number + current_phone.mobile_provider
                            subject: 'Rating Received!'
                            data:
                                project: p
                                user: req.user
                                rating: r
                        res.email
                            template: 'projects/sms/facebook'
                            to:
                                name: to.last + ' '  + to.first
                                address: current_phone.number + current_phone.mobile_provider
                            subject: 'Facebook Like Us'
                            data:
                                project: p
                res.email
                    template: 'projects/facebook'
                    to: to
                    subject: 'Facebook Like Us!'
                    data:
                        from: req.user
                        p:p
                to = secondto
                for ph in to.phone
                    current_phone = ph
                    if current_phone.sms_notifications and  'mobile_provider' of current_phone and current_phone.mobile_provider isnt "" and  'number' of current_phone  and current_phone.number isnt ""
                        res.email
                            template: 'projects/sms/facebook'
                            to:
                                name: to.last + ' '  + to.first
                                address: current_phone.number + current_phone.mobile_provider
                            subject: 'Facebook Like Us'
                            data:
                                project: p
            res.send(p)

exports.cancel = (req, res) ->
    return res.send(403) unless req.user
    Project.findById req.params.id, (err, p) ->
        return res.send(500, err) if err
        return res.send(404) unless p
        if p.assigned isnt undefined
            to =  p.assigned
            for ph of to.phone
                current_phone = to.phone[ph]
                if current_phone.sms_notifications and  'mobile_provider' of current_phone and current_phone.mobile_provider isnt "" and  'number' of current_phone  and current_phone.number isnt ""
                    res.email
                        template: 'projects/sms/cancel'
                        to:
                            name: to.last + ' '  + to.first
                            address: current_phone.number + current_phone.mobile_provider
                        subject: 'Project Canceled'
                        data:
                            project: p
                            user: req.user
                            rating: r

        p.cancel req.user, (err) ->
            return res.send(500, err) if err
            res.send(p)

exports.initiate_dispute = (req, res) ->
    return res.send(403) unless req.user
    Project.findById req.params.id, (err, p) ->
        return res.send(500, err) if err
        return res.send(404) unless p
        p.initiate_dispute req.user, req.body.reason, (err) ->
            return res.send(500, err) if err
            res.send(p)

exports.cancel_dispute = (req, res) ->
    return res.send(403) unless req.user
    Project.findById req.params.id, (err, p) ->
        return res.send(500, err) if err
        return res.send(404) unless p
        p.cancel_dispute req.user, (err) ->
            return res.send(500, err) if err
            res.send(p)
