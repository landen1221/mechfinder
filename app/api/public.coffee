Image = require('../models/image')

exports.contact = (req, res) ->
    unless req.body.first
        return res.send 400, {success: false, ecode: 1, err: 'Missing first name', body: req.body}

    unless req.body.last
        return res.send 400, {success: false, ecode: 2, err: 'Missing last name', body: req.body}

    emailRegExp = /[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?/i;
    unless req.body.email and emailRegExp.test req.body.email
        return res.send 400, {success: false, ecode: 3, err: 'Bad email', body: req.body}

    unless req.body.subject
        return res.send 400, {success: false, ecode: 4, err: 'Missing subject', body: req.body}

    unless req.body.topic
        return res.send 400, {success: false, ecode: 5, err: 'Missing topic', body: req.body}

    unless req.body.message
        return res.send 400, {success: false, ecode: 6, err: 'Missing message', body: req.body}

    unless req.body.message.length < 4000
        return res.send 400, {success: false, ecode: 7, err: 'Message exceeds character count', body: req.body}

    data = req.body.first + ' ' + req.body.last + ' (' + req.body.email + ') has submitted a contact request: '
    data += req.body.topic if req.body.topic

    data += '\n\n\n\n'
    data += req.body.message
    data += '\n\n\n\n'

    if req.body.clientInfo
        data += 'Client Browser Info: '
        data += '\nBrowser Name: ' + req.body.clientInfo.browserName if req.body.clientInfo.browserName
        data += ' (' + req.body.clientInfo.majorVersion + ')' if req.body.clientInfo.browserName and req.body.clientInfo.majorVersion
        data += '\nOperating System: ' + req.body.clientInfo.os + '\n' if req.body.clientInfo.os

    res.email
        data: data
        text: data
        to: {
            name: 'Customer Support',
            address: 'support@mechfinder.com'
        }
        from: {
            name: req.body.first + ' ' + req.body.last,
            address: req.body.email
        }
        subject: req.body.subject + ' - Mechfinder Contact Form'
        replyTo: req.body.email


    res.send 200, {result: true}

exports.imageData = (req, res) ->
    return res.send 400, {err: 'Missing required params'} unless req.params.id

    Image.findById req.params.id, (err, img) ->
        return res.send 500, {err: err} if err
        return res.send 404, {'Image not found'} unless img
        return res.send img

exports.image = (req, res) ->
    return res.send 400, {err: 'Missing required params'} unless req.params.id

    Image.findById req.params.id, (err, img) ->
        return res.send 500, {err: err} if err
        return res.send 404, {'Image not found'} unless img
        res.set
            'Content-Type': 'image/' + img.extension
            'Content-Length': img.buffer.length

        return res.send img.buffer

exports.postImage = (req, res) ->
    return res.send 403, {err: 'Not logged in'} unless req.user
    return res.send 400, {err: 'Missing required fields', body: req.body} unless req.body.imageData

    options = 
        data: req.body.imageData
        uploader: req.user._id
        next: (err, img) ->
            return res.send 500, {err: err} if err
            return res.send img._id
    Image.add options
