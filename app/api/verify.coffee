{Project, User, Comment, Event, Membership, Transaction} = require('../models')
authy = require('authy')(MF.properties.authy.apiKey, MF.properties.authy.url)

exports.sendToken = (req, res) ->
    return res.send 403, {result: false, err: 'No user session'} unless req.user
    return res.send 400, {err: 'Missing required data'} unless req.body.phone
    return res.send 400, {err: 'Missing required properties'} unless req.body.phone.number and req.body.phone.kind
    return res.send 400, {err: 'Bad phone number'} unless req.body.phone.number.length is 10
    return res.send 400, {err: 'Bad phone kind'} unless req.body.phone.kind is 'Mobile' or req.body.phone.kind is 'Landline'

    phoneNumber = req.body.phone.number # '480-650-5756'
    countryCode = req.body.phone.countryCode || '1' # default to US
    deliveryMethod = req.body.method.toLowerCase() || 'sms' # other option is 'call'

    authy.phones().verification_start phoneNumber, countryCode, deliveryMethod, (err, response) ->
        console.log err if err
        return res.send 500, err if err
        return res.send response

exports.verifyToken = (req, res) ->
    return res.send 403, {result: false, err: 'No user session'} unless req.user

    phoneNumber = req.body.phoneNumber # '480-650-5756'
    countryCode = req.body.countryCode || '1' # default to US
    verificationCode = req.body.verificationCode
    authy.phones().verification_check phoneNumber, countryCode, verificationCode, (err, response) ->
        console.log err if err
        if err
            return res.send 400, {err: 'Incorrect pin', message: 'The pin you have entered does not match the one we sent to your phone.'} if err.error_code and err.error_code is '60022'
            return res.send 400, {err: 'Too many attempts', message: 'You have attempted too many incorrect pins'} if err.error_code and err.error_code is '60003'
            return res.send 500, {result: false, err: err}

        User.findOne {'phone.number': phoneNumber}, (err, u) ->
            console.log err if err
            return res.send 500, {result: false, err: err} if err
            return res.send 403, {result: false, err: 'Phone number registered to another user', message: 'This phone number has been assigned to another user'} unless u._id.equals req.user._id
            return res.send 401, {result: false, err: 'Invalid phone number', message: 'The phone number you have provided is not registered'} unless u

            u.phone.verified = true
            u.save (err) ->
                console.log err if err
                return res.send 500, {result: false, err: err} if err
                return res.send u
