{Dispute, User, Comment, Event, Charge, Project} = require('../models')
moment = require('moment')

exports.new = (req, res) ->
    return res.send(403) unless req.user
    return res.send(402) unless req.body.milestone
    console.log(req.body)
    Charge.findOne( {_id: req.body.milestone}).populate('owner').exec (err, c) ->
        return res.send(500,err) if err
        return res.send(501) unless c
        perms = c.permissions(req.user)
        return res.send(403) unless perms.can_dispute
        console.log perms
        dispute = new Dispute({
            owner: req.user
            charge: c
            incident:
                amountdisputed: req.body['incedint.amountdisputed']
                amounttoaccept: req.body['incedint.amounttoaccept']
                description:    req.body['incident.description']
        })
        dispute.owner = req.user
        dispute.charge = c._id
        if perms.is_owner
            dispute.issuedByOwner = true
            dispute.secondparty = c.assigned
        else
            dispute.issuedByOwner = false
            dispute.secondparty = c.owner
        dispute.save (err) ->
            return res.send(500, err) if err
            c.createdispute req.user, dispute, (err) ->
                return res.send(500, err) if err
                return res.redirect('/disputes/' + dispute._id)        

exports.cancel = (req,res) ->
    return res.send(404) unless req.user
    Dispute.findById(req.params.id).populate('charge').populate('project').populate('secondparty').populate('owner').exec (err, d) ->
        return res.send(500, err) if err
        return res.send(404) unless d
        return res.send(403) unless d.permissions(req.user).can_cancel
        d.cancel req.user, (err) ->
            return res.send(500, err) if err
            d.charge.reactivate (err) ->
                return res.send(500, err) if err
                res.send('{success:true}')

exports.accept = (req,res) ->
    return res.send(404) unless req.user
    Dispute.findById(req.params.id).populate('charge').populate('project').populate('secondparty').populate('owner').exec (err, d) ->
        return res.send(500, err) if err
        return res.send(404) unless d
        return res.send(403) unless d.permissions(req.user).can_accept
        d.accept req.user, (err) ->
            return res.send(500, err) if err
            d.charge.acceptoffer req.user, d.incident, (err) ->
                return res.send(500, err) if err
                return res.send('{success:true}')


exports.message = (req,res) ->
    return res.send(404) unless req.user
    return res.send(501) unless req.body.message
    Dispute.findById(req.params.id).populate('messages.user').exec (err, d) ->
        return res.send(500, err) if err
        return res.send(404) unless d
        return res.send(403) unless d.permissions(req.user).can_interact
        d.message req.body.message, req.user, (err) ->
            return res.send(500, err) if err
            return res.send('ok')





        