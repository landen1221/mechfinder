Ticket = require('../models/ticket')
Project = require('../models/project')

exports.post = (req, res) ->
    return res.send 400, {err: 'Not logged in'} unless req.user

    ticket = new Ticket
        user: req.user._id
        project: req.body.projectId if req.body.projectId
        category: req.body.category if req.body.category
        message: req.body.message if req.body.message
    
    ticket.save (err) ->
        res.email
            template: 'projects/ticket'
            to: 'marcus@mechfinder.com'
            subject: 'New Help Request Ticket'
            data:
                user: req.user
                ticket: ticket

        return res.send 500, {err: err} if err
        return res.send ticket