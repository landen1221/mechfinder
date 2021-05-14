moment = require('moment')
{User, Project, Vehicle, Image, ZipCode} = require('../models')
{union, randomString} = require('../util')
validUrl = require('valid-url')
FB = require('fb')
mongoose = require('mongoose');
Notification = require('../models/notification')
Holla = require('../models/holla')
queryString = require('querystring')

_login = (req, user, next) ->
    req.session.regenerate (err) ->
        return next(err) if err
        req.session.authenticated = true
        req.session.user = user.id
        next()

exports.login = (req, res) ->
    User.findOne {active: true, email: req.body.email}, (err, u) ->
        return res.send 401, {result: false, err: err} if err or not u
        u.check req.body.password, (err, result) ->
            return res.send 401, {result: false, err: err} if err or not result
            u.last_login = new Date()
            u.last_activity = new Date()
            u.save (err) ->
                return res.send 500, {result: false, err: err} if err
                _login req, u, (err) ->
                    return res.send 500, {result: false, err: err} if err
                    if req.body.stayLoggedIn is 'true'
                        req.session.cookie.expires = null
                        req.session.cookie.maxAge = null
                    res.send u

exports.logout = (req, res) ->
    req.session.destroy (err) ->
        return res.send 500, err if err
        res.send {result: true}

exports.validate_email = (req, res) ->
    User.count {email: req.params.email}, (err, count) ->
        res.send {result: if err or count > 0 then false else true}

send_reset = (req, res, u) ->
    u.password_reset.pin = [
        Math.floor(Math.random()*10),
        Math.floor(Math.random()*10),
        Math.floor(Math.random()*10),
        Math.floor(Math.random()*10),
    ].join('')
    u.password_reset.expires = moment().add('h', 1).toDate()
    u.save (err) ->
        return res.send 500, err if err
        res.email
            template: 'account/reset'
            data:     { u: u }
            to:       { name: u.name, address: u.email }
            subject:  'Mechfinder Password Reset'
        res.send 200, { expires: u.password_reset.expires }

complete_reset = (req, res, u, pin, pwd) ->
    return res.send 404 unless u.password_reset.pin is pin and new Date <= u.password_reset.expires
    u.credential pwd, (err) ->
        return res.send 500, err if err
        u.password_reset.pin = null
        u.password_reset.expires = null
        u.save (err) ->
            return res.send 500, err if err
            return res.send 200

exports.reset = (req, res) ->
    email = req.body.email
    pin = req.body.pin
    pwd = req.body.password
    User.findOne {email: email}, (err, u) ->
        return res.send 500, err if err
        return res.send 404 unless u
        if pin and pwd then complete_reset(req, res, u, pin, pwd) else send_reset(req, res, u)

exports.recover = (req, res) ->
    return res.send 400, {result: false, err: 'Missing required fields.'} unless req.body and req.body.email
    User.findOne {email: req.body.email}, (err, u) ->
        return res.send 500, err if err
        # return res.send 401, {result: false, err: 'This email is not registered with MechFinder.', body: req.body} unless u

        # set a timeout to around 400ms to emulate a successful email lookup
        unless u
            cb = ->
                return res.send {err: false}
            setTimeout cb, 400
        else
            u.set(
                recoveryKey: mongoose.Types.ObjectId()
                recoveryDate: new Date()
            )

            u.save (err) ->
                return res.send 500, err if err

                d =
                    user: u
                    recoveryHref: 'https://' + MF.properties.self.host + '/recover/' + u._id + '?key=' + u.recoveryKey
                    contactHref: 'https://' + MF.properties.self.host + '/contact'
                    imageHref: 'https://' + MF.properties.self.host + '/static/img/mechfinder-logo-beta.png'

                res.email
                    template: 'account/recover'
                    data: d
                    to:       { name: u.name, address: u.email }
                    subject:  'MechFinder Account Recovery'

                return res.send {err: false}

exports.recoverPassword = (req, res) ->
    return res.send 400, {result: false, err: 'Password is required, minimum of six characters.'} unless req.body.password and req.body.repeat and req.body.password.length >= 6
    return res.send 400, {result: false, err: 'Passwords do not match'} unless req.body.password == req.body.repeat
    return res.send 400, {result: false, err: 'Missing required properties'} unless req.body.email and req.body.key

    User.findOne {email: req.body.email}, (err, u) ->
        return res.send 500, err if err
        return res.send 401, {result: false, err: 'Email not found'} unless u
        return res.send 401, {result: false, err: 'Key mismatch'} unless u.recoveryKey.equals req.body.key
        return res.send 401, {result: false, err: 'Recovery key expired'} unless ((new Date) - u.recoveryDate) < (1000 * 60 * 60 * 24)

        u.credential req.body.password, (err) ->
            return res.send 500, err if err

            # reset the recovery key here so that it can't be used later
            u.set(
                recoveryKey: mongoose.Types.ObjectId()
            )

            u.save (err) ->
                return res.send 500, err if err
                return res.send {err: false}

exports.verifyEmail = (req, res) ->
    return res.send 401, {result: false, err: 'Missing required fields'} unless req.body.email

    User.findOne {email: req.body.email}, (err, u) ->
        return res.send 500, {result: false, err: err} if err
        return res.send 404, {result: false, err: 'Email not found'} unless u

        if req.params.code
            return res.send 400, {result: false, err: 'Incorrect validation code'} unless u.verification is req.params.code
            return res.send 403, {result: false, err: 'Validation code expired'} unless ((new Date) - u.verificationDate) < (1000 * 60 * 60)
            u.set({verified: true})
            u.save (err) ->
                return res.send 500, {result: false, err: err} if err
                return res.send u
        else
            code = ''
            possible = 'ABCDEFGHJKMNPQRSTUVWXYZabcdefghjkmnopqrstuvwxyz23456789'
            i = 0
            while i < 5
                code += possible.charAt(Math.floor(Math.random() * possible.length))
                i++

            u.set({
                verification: code,
                verificationDate: new Date()
            })

            u.save (err, u) ->
                res.email
                    template: 'account/verification-code'
                    data:
                        user: u
                        profileHref: 'https://' + MF.properties.self.host + '/profile/' + u._id
                        imageHref: 'https://' + MF.properties.self.host + '/static/img/mechfinder-logo-beta.png'
                    to:       { name: u.name, address: u.email }
                    subject:  'MechFinder Email Verification'

                return res.send true

generateUsername = (first, next) ->
    num = Math.floor(Math.random() * 999)
    username = first.replace(/\s/g, '').replace(/[\W_]+/g, '') + String('000' + num).slice(-3);
    User.count {username: username}, (err, count) ->
        if count > 0 or err
            generateUsername first, next
        else
            next(username)

exports.signup = (req, res) ->
    return res.send 401, {result: false, err: 'Password is required, minimum of six characters.'} if not req.body.password or req.body.password.length < 6

    User.count {email: req.body.email}, (err, count) ->
        return res.send 400, {result: false, err: 'Email address already in use.'} if err or count > 0

        generateUsername req.body.first, (username) ->
            u = new User
            u.set
                username:       username
                active:         true
                first:          req.body.first
                last:           req.body.last
                email:          req.body.email
                role:           req.body.role || 'buyer'
                complete:       true
                languages:
                    spanish:    req.body.spanish || false
                    english:    req.body.english || true
                provider:       'facebook' if req.body.facebookId
                facebookId:     req.body.facebookId if req.body.facebookId
                geo: req.geo
            
            if u.role is 'buyer'
                discount = 
                    rate: 0.1
                    projects: 1
                    kind: 'workorder'
                u.discounts.push(discount) if req.body.invite in ['true', true]

            u.set({verified: true}) if MF.properties.env is 'development' or req.body.facebookId
            u.credential req.body.password, (err) ->
                return res.send 500, {err: err} if err
                u.save (err) ->
                    return res.send 500, {err: err} if err
                    _login req, u, (err) ->
                        return res.send 500, {err: err} if err
                        facebookRedirect = MF.facebookRedirect
                        MF.facebookRedirect = undefined

                        options = 
                            user: u._id
                            message: u.first + ' ' + u.last + ' has just signed up for an account'
                            href: '/profile/' + u._id + '/public'
                            
                        Holla.generate options, (err, holla) ->
                        res.email
                            template: 'admin/new-user'
                            to: 'notifications@mechfinder.com'
                            # to: 'marcus@mechfinder.com'
                            subject: 'New ' + (if u.role is 'buyer' then 'Customer' else 'Mechanic') + ' Signup'
                            data:
                                user: u
                                hrefs:
                                    profile: 'https://' + MF.properties.self.host + '/profile/' + u._id

                        return res.send {user: u, redirect: facebookRedirect}

exports.facebook = (req, res) ->
    MF.facebookInvite = true if req.query.facebookInvite in ['true', true]
    MF.facebookRedirect = req.query.facebookRedirect if validUrl.isUri(req.query.facebookRedirect)
    res.redirect 'https://www.facebook.com/dialog/oauth?client_id='+MF.properties.facebook.client+'&redirect_uri='+MF.properties.facebook.redirecturl+'&scope=email'

exports.fbcallback = (req,res) ->
    console.log 'hit the callback'

    if req.query.error
        console.log 'there was a query error'
        if req.query.error_description
            console.log req.query.error_description
        else
            console.log req.query.error
        return res.redirect '/'
    else if !req.query.code
        console.log 'not a oauth callback'
        return res.redirect '/'

    code = req.query.code
    FB.api 'oauth/access_token', {
        client_id: MF.properties.facebook.client
        client_secret: MF.properties.facebook.secret
        redirect_uri: MF.properties.facebook.redirecturl
        code: code
    }, (result) ->
        if !result or result.error
            console.log 'oauth error'
            console.log result.error if result.error
            return res.redirect '/'
        else
            accessToken = result.access_token
            expires = if result.expires then result.expires else 0
            
            FB.options = 
                fields: [
                    'id'
                    'name'
                    'first_name'
                    'last_name'
                    'picture'
                    'email'
                ]
                access_token: accessToken

            FB.api '/me', FB.options, (results) ->
                if results and results.error
                    console.log 'facebook login user data request error'
                    console.log results.error
                    return res.redirect '/'
                else

                    findQuery = 
                        $or: [
                            { facebookId: results.id }
                            { email: results.email } if results.email
                        ]

                    User.findOne findQuery, (err, u) ->
                        if err
                            console.log err
                            return res.redirect '/signup'
                        else
                            if u
                                u.facebookId = results.id
                                u.active = true
                                u.verified = true
                                u.provider = 'facebook'
                                u.last_login = new Date()
                                u.last_activity = new Date()
                                u.geo = req.geo
                                u.save (err) ->
                                    return res.redirect '/' if err
                                    _login req, u, (err) ->
                                        return res.redirect '/' if err
                                        facebookRedirect = MF.facebookRedirect
                                        if facebookRedirect
                                            MF.facebookRedirect = undefined
                                            return res.redirect facebookRedirect
                                        else
                                            return res.redirect '/profile'
                            else
                                baseUrl = '/signup?'
                                inviteFacebook = MF.facebookInvite
                                baseUrl = '/signup/invite?' if inviteFacebook
                                MF.facebookInvite = undefined    

                                queryObject = 
                                    source: 'facebook'
                                    facebookId: results.id
                                    first: results.first_name
                                    last: results.last_name
                                    email: results.email
                                baseUrl += queryString.stringify queryObject
                                return res.redirect baseUrl
