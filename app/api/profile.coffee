{User, Comment, Project, Vehicle, Image} = require('../models')
{compare_document, validZip, union, encryptString, decryptString, scrub} = require('../util')
async = require('async')

exports.addVehicle = (req, res) ->
    return res.send 500, 'Bad user id' unless req.body.user and req.body.user._id is req.session.user
    return res.send 500, 'Missing required data' unless req.body.vehicle and req.body.vehicle.make and req.body.vehicle.model and req.body.vehicle.year

    mileage = if req.body.vehicle.mileage then parseInt req.body.vehicle.mileage else 0
    mileage = 0 if(isNaN mileage) or mileage > 10000000 or mileage < 0

    v = new Vehicle
    v.set(
        owner: req.session.user
        make: req.body.vehicle.make
        model: req.body.vehicle.model
        year: req.body.vehicle.year
        engine: req.body.vehicle.engine
        mileage: mileage
    )

    v.save (err) ->
        return res.send 500, err if err

        User.findById req.user._id, (err, u) ->
            u.vehicles.push(v)
            u.save (err) ->
                return res.send 500, err if err

                return res.send {err: false, vehicle: v}

exports.deleteVehicle = (req, res) ->
    return res.send 500, 'Bad user id' unless req.body.user and req.body.user._id is req.session.user
    return res.send 500, 'Missing required data' unless req.body.vehicle

    Vehicle.findById req.body.vehicle, (err, v) ->
        return res.send 500, {err: err} if err
        return res.send 404, {err: 'Vehicle not found'} unless v

        v.active = false
        v.save (err) ->
            return res.send 500, {err: err} if err
            return res.send {err: false, vehicle: v}

exports.editVehicle = (req, res) ->
    return res.send 403, {err: 'Not logged in'} unless req.user
    return res.send 400, {err: 'Missing required fields'} unless req.body.vehicle and req.body.vehicle._id and req.body.vehicle.make and req.body.vehicle.model and req.body.vehicle.year

    Vehicle.findById req.body.vehicle._id, (err, v) ->
        return res.send 500, {err: err} if err
        return res.send 404, {err: 'Vehicle not found'} unless v

        saveVehicle = () ->
            engine = if req.body.vehicle.engine then req.body.vehicle.engine else ''
            mileage = if req.body.vehicle.mileage then parseInt req.body.vehicle.mileage else 0

            mileage = 0 if(isNaN mileage) or mileage > 10000000 or mileage < 0

            v.set(
                make: req.body.vehicle.make
                model: req.body.vehicle.model
                year: req.body.vehicle.year
                engine: engine
                mileage: mileage
            )

            v.save (err) ->
                return res.send 500, {err: err} if err
                return res.send v

        if req.body.projectId
            # if given a project id, find the project
            # see if vehicle and mech are assigned to it
            # then edit if they both are
            Project.findById req.body.projectId, (err, p) ->
                return res.send 500, {err: err} if err
                return res.send 404, {err: 'Project not found'} unless p
                unless p.vehicle.toString() is req.body.vehicle._id and ((p.assigned and p.assigned.toString() is req.user._id.toString()) or (p.poster.toString() is req.user._id.toString())) 
                    return res.send 403, {err: 'Insufficient permissions to edit this vehicle'}

                saveVehicle()
        else
            return res.send 403, {err: 'Insufficient permissions to edit this vehicle'} unless req.user._id.toString() is v.owner.toString()
            saveVehicle()


toggleFavorite = (list, item, next) =>
    if list.indexOf(item) == -1
        list.push(item)
        next list
    else
        newList = []
        if list.length <= 1
            newList = []
        else
            newList = list.filter (fav) ->
                item = String(item)
                fav = String(fav)
                fav != item
        next newList

exports.favorites = (req, res) ->
    return res.send 401, {err: 'User not logged in'} unless req.session.user
    return res.send 500, {err: 'Missing favorites data'} unless req.body.favorites

    User.findById req.session.user, (err, u) ->
        return res.send 500, err if err

        if req.body.favorites
            mech = req.body.favorites.mechanics[0] if req.body.favorites.mechanics
            cust = req.body.favorites.users[0] if req.body.favorites.users
            proj = req.body.favorites.projects[0] if req.body.favorites.projects

            if not mech and not cust and not proj
                return res.send 400, {err: 'Invalid object ID'}

            if req.body.favorites.mechanics and mech
                return res.send 403, {err: 'Exceeded maximum favorites for mechanics'} unless u.favorites.mechanics.length <= 50
                toggleFavorite u.favorites.mechanics, mech, (mechs) ->
                    u.favorites.mechanics = mechs

            if req.body.favorites.users and cust
                return res.send 403, {err: 'Exceeded maximum favorites for customers'} unless u.favorites.users.length <= 50
                toggleFavorite u.favorites.users, cust, (custs) ->
                    u.favorites.users = custs

            if req.body.favorites.projects and proj
                return res.send 403, {err: 'Exceeded maximum favorites for projects'} unless u.favorites.projects.length <= 50
                toggleFavorite u.favorites.projects, proj, (projs) ->
                    u.favorites.projects = projs

        if req.body.password and req.body.rpassword and req.body.password is req.body.rpassword
            u.credential req.body.password, (err) ->
                u.save (err) ->
                    return res.send 500, err if err
                    return res.send u
        else
            u.save (err) ->
                return res.send 500, err if err
                return res.send u.favorites

exports.update = (req, res) ->
    return res.send 403, {result: false, err: 'User not logged in'} unless req.user

    User.findById req.user, (err, u) ->
        return res.send 500, err if err

        if req.body.role and req.body.role in ['seller', 'buyer', 'support', 'admin']
            u.role = req.body.role
            u.discounts = []

        u.first = req.body.first if req.body.first
        u.last = req.body.last if req.body.last
        u.email = req.body.email if req.body.email
        u.seenDiagnosisProcess = req.body.seenDiagnosisProcess if req.body.seenDiagnosisProcess in ['true', true, 'false', false]
        if req.body.dob
            u.dob = req.body.dob
            u.setDOB = true

        if req.body.ssn
            if typeof req.body.ssn is 'number'
                ssn = req.body.ssn.toString()
            else if typeof req.body.ssn is 'string'
                ssn = req.body.ssn

            ssn = ssn.replace(/\D/g, '')
            if ssn.length is 9
                u.ssn = encryptString(ssn)
                u.setSSN = true

        if req.body.business
            # cut off business names at 40 chars due to braintree limitations
            u.business.legalName = req.body.business.legalName.substr 0, 40 if req.body.business.legalName
            if req.body.business.name
                u.business.name = req.body.business.name.substr 0, 40
            else if req.body.business.legalName
                u.business.name = req.body.business.legalName.substr 0, 40

            if req.body.business.taxId
                taxId = req.body.business.taxId
                taxId = taxId.toString() if typeof taxId is 'number'
                return res.send 401, {err: 'Bad data'} unless typeof taxId is 'string'

                taxId = taxId.replace(/\D/g, '')
                return res.send 401, {err: 'Bad data'} unless taxId.length is 9

                taxId = taxId.substr(0, 2) + '-' + taxId.substr(2, 7)
                regexp = /^(\d{2})-?\d{7}$/i
                return res.send 401, {err: 'Bad data'} unless regexp.test(taxId)

                u.business.taxId = taxId

            u.business.address = req.body.business.address if req.body.business.address
            u.business.city = req.body.business.city if req.body.business.city
            u.business.state = req.body.business.state if req.body.business.state
            u.business.zip = req.body.business.zip if validZip req.body.business.zip, true

        if req.body.billing
            u.setBilling = true
            u.billing.primary = req.body.billing.primary if req.body.billing.primary
            u.billing.secondary = req.body.billing.secondary if req.body.billing.secondary
            u.billing.city = req.body.billing.city if req.body.billing.city
            u.billing.state = req.body.billing.state if req.body.billing.state
            u.billing.zip = req.body.billing.zip if validZip req.body.billing.zip, true

        if req.body.banking
            u.banking.bank = req.body.banking.bank if req.body.banking.bank
            if req.body.banking.routing
                routing = req.body.banking.routing
                routing = routing.toString() if typeof routing is 'number'
                return res.send 401, {err: 'Bad data'} unless typeof routing is 'string'

                routing = routing.replace(/\D/g, '')
                return res.send 401, {err: 'Bad data'} unless routing.length is 9

                u.banking.routing = encryptString(routing)
                u.setBanking = true
            u.banking.account = encryptString(req.body.banking.account) if req.body.banking.account

        if req.body.phone
            if req.body.phone.skip or req.body.phone.skip is false or req.body.phone.skip is 'false'
                u.phone.skip = if req.body.phone.skip is true or req.body.phone.skip is 'true' then true else false

            if req.body.phone.number and not (u.phone.number is req.body.phone.number)
                u.phone.verified = false

            u.phone.number = req.body.phone.number if req.body.phone.number
            u.phone.kind = req.body.phone.kind if req.body.phone.kind

            if u.phone.kind is 'Mobile'
                u.phone.sms = if (req.body.phone.sms is 'true' or req.body.phone.sms is true) then true else false
                u.phone.smsCharges = if (req.body.phone.smsCharges is 'true' or req.body.phone.smsCharges is true) then true else false
            else
                u.phone.sms = false
                u.phone.smsCharges = false

        if req.body.languages
            u.languages.english = if req.body.languages.english is 'true' then true else false
            u.languages.spanish = if req.body.languages.spanish is 'true' then true else false

        if req.body.mechanicType and req.body.mechanicType isnt 'shop' and req.body.mechanicType isnt 'mobile'
            return res.send 400, {result: false, err: 'Invalid mechanic type: ' + req.body.mechanicType + '.', body: req.body}

        if req.body.specialties and not Array.isArray req.body.specialties
            return res.send 400, {result: false, err: 'Invalid specialties type', body: req.body}

        if req.body.experience and not Array.isArray req.body.experience
            return res.send 400, {result: false, err: 'Invalid experience type', body: req.body}

        if req.body.certifications and not Array.isArray req.body.certifications
            return res.send 400, {result: false, err: 'Invalid certifications type', body: req.body}

        if Array.isArray req.body.hours
            hours = req.body.hours
            req.body.hours = {}
            req.body.hours[i.toString()] = hour for hour, i in hours

        if req.body.diagnosisCharge
            req.body.diagnosisCharge = 0 if typeof req.body.diagnosisCharge is 'number' and req.body.diagnosisCharge < 0

        if req.body.amount
            req.body.warranty.amount = 0 if typeof req.body.warranty.amount is 'number' and req.body.warranty.amount < 0

        setOffersDiagnosis = if req.body.offersDiagnosis is 'true' or req.body.offersDiagnosis is 'false' or typeof req.body.offersDiagnosis is 'boolean' then true else false
        setWaivesDiagnosis = if req.body.waivesDiagnosis is 'true' or req.body.waivesDiagnosis is 'false' or typeof req.body.waivesDiagnosis is 'boolean' then true else false
        setInsurance = if req.body.insurance is 'true' or req.body.insurance is 'false' or typeof req.body.insurance is 'boolean' then true else false
        setTows = if req.body.tows is 'true' or req.body.tows is 'false' or typeof req.body.tows is 'boolean' then true else false
        setFlatbed = if req.body.flatbed is 'true' or req.body.flatbed is 'false' or typeof req.body.flatbed is 'boolean' then true else false

        if req.body.preferences
            if req.body.preferences.chat
                u.preferences.chat.sound = req.body.preferences.chat.sound if req.body.preferences.chat.sound in ['true', 'false', true, false]

            if req.body.preferences.notifications
                if req.body.preferences.notifications.email
                    emailPrefs = req.body.preferences.notifications.email
                    for key, val of emailPrefs
                        emailPrefs[key] = if val is 'true' or val is 'false' then (if val is 'true' then true else false) else val # convert 'true' to true and 'false' to false

                    u.preferences.notifications.email.support           = emailPrefs.support            if typeof emailPrefs.support is 'boolean'
                    u.preferences.notifications.email.projectBasic      = emailPrefs.projectBasic       if typeof emailPrefs.projectBasic is 'boolean'
                    u.preferences.notifications.email.projectImportant  = emailPrefs.projectImportant   if typeof emailPrefs.projectImportant is 'boolean'
                    u.preferences.notifications.email.chat              = emailPrefs.chat               if typeof emailPrefs.chat is 'boolean'
                    u.preferences.notifications.email.marketing         = emailPrefs.marketing          if typeof emailPrefs.marketing is 'boolean'
                    u.preferences.notifications.email.general           = emailPrefs.general            if typeof emailPrefs.general is 'boolean'
                    u.preferences.notifications.email.newProjects       = emailPrefs.newProjects        if typeof emailPrefs.newProjects is 'boolean'
                    u.preferences.notifications.email.buyerUpdates      = emailPrefs.buyerUpdates       if typeof emailPrefs.buyerUpdates is 'boolean'
                    u.preferences.notifications.email.reviewed          = emailPrefs.reviewed           if typeof emailPrefs.reviewed is 'boolean'

        if req.body.photos
            req.body.photos = [] unless Array.isArray(req.body.photos)

        u.mechanicType = req.body.mechanicType if req.body.mechanicType
        u.specialties = req.body.specialties if req.body.specialties
        u.experience = req.body.experience if req.body.experience
        u.certifications = req.body.certifications if req.body.certifications
        u.diagnosisCharge = req.body.diagnosisCharge if req.body.diagnosisCharge
        u.offersDiagnosis = req.body.offersDiagnosis if setOffersDiagnosis
        u.waivesDiagnosis = req.body.waivesDiagnosis if setWaivesDiagnosis
        u.insurance = req.body.insurance if setInsurance
        u.registrationNumber = req.body.registrationNumber if req.body.registrationNumber
        u.tows = req.body.tows if setTows
        u.flatbed = req.body.flatbed if setFlatbed
        aboutScrub = 
            email: true
            phone: true
            xss: true
        u.about = scrub req.body.about, aboutScrub if req.body.about
        u.hours = req.body.hours if req.body.hours
        u.warranty = req.body.warranty if req.body.warranty
        u.yearsOfExperience = req.body.yearsOfExperience if req.body.yearsOfExperience

        iteratePhotos = (i, photos, ids, after) ->
            if i < photos.length
                options = 
                    data: photos[i]
                    uploader: u._id
                    next: (err, img) ->
                        ids.push img._id unless err or not img
                        iteratePhotos i+1, photos, ids, after

                Image.add options
            else
                after ids


        req.body.photos = [] unless req.body.photos

        iteratePhotos 0, req.body.photos, [], (photoIds) ->
            for photoId in photoIds
                u.photos.push photoId

            if req.body.deletePhotos and Array.isArray req.body.deletePhotos
                i = 0
                for photo in req.body.deletePhotos
                    c = 0
                    for userPhoto in u.photos
                        if u.photos[c].equals photo
                            u.photos.splice c, 1
                            break
                        c++
                    i++

            afterImage = () ->
                if req.body.password and req.body.rpassword and req.body.password is req.body.rpassword
                    u.credential req.body.password, (err) ->
                        u.save (err) ->
                            return res.send 500, err if err
                            return res.send u
                else
                    u.save (err) ->
                        return res.send 500, err if err
                        return res.send u

            if req.body.picture
                options = 
                    data: req.body.picture
                    uploader: req.user._id
                    next: (err, img) ->
                        return res.send 500, {err: err} if err
                        if img
                            u.picture = img
                            afterImage()
                        else
                            afterImage()

                Image.add options
                    
            else
                afterImage()
