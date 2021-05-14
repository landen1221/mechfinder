{Project, User, Make, Comment, Charge, Vehicle} = require('../models')
{compare_document, union} = require('../util')
async = require('async')
        

exports.mine = (req, res) -> # done cleaning up
    return res.redirect '/' unless req.user and req.user?.role is 'buyer' or req.user?.role is 'seller'

    if req.user.role is 'buyer'
        q = Project.find owner: req.user
        q.populate 'owner', 'picture username geo mechanicType warranty average_rating role ratings referral.workorder referral.diagnosis tax.parts tax.labor diagnosisCharge discounts'
        q.populate 'assigned', 'picture username geo mechanicType warranty average_rating role ratings referral.workorder referral.diagnosis tax.parts tax.labor diagnosisCharge'
        q.populate 'bids.owner', 'picture username geo mechanicType warranty average_rating role ratings referral.workorder referral.diagnosis tax.parts tax.labor diagnosisCharge discounts'
        q.populate 'vehicle'
        q.sort '-date_finished -date_created'
        q.exec (err, projects) ->
            return res.send 500, {err: err} if err
            res.render 'projects/open-buyer',
                layout: 'layouts/internal'
                user: req.user
                data:
                    buyer_projects: projects
                    buyer_bidding:  (p for p in projects when p.state is 'bidding')
                    buyer_assigned: (p for p in projects when p.state is 'assigned')
                    buyer_finished: (p for p in projects when p.state is 'finished')
                    buyer_canceled: (p for p in projects when p.state is 'canceled')
                    buyer_draft:    (p for p in projects when p.state is 'draft')
                head:
                    meta:
                        title: 'My Projects'
    else
        q = Project.find 'bids.owner': req.user
        q.populate 'owner', 'picture username geo mechanicType warranty average_rating role ratings referral.workorder referral.diagnosis tax.parts tax.labor diagnosisCharge discounts'
        q.populate 'assigned', 'picture username geo mechanicType warranty average_rating role ratings referral.workorder referral.diagnosis tax.parts tax.labor diagnosisCharge'
        q.populate 'bids.owner', 'picture username geo mechanicType warranty average_rating role ratings referral.workorder referral.diagnosis tax.parts tax.labor diagnosisCharge discounts'
        q.populate 'vehicle'
        q.sort '-date_finished -date_created'
        q.exec (err, projects) ->
            return res.send 500, {err: err} if err
            res.render 'projects/open-seller',
                layout: 'layouts/internal'
                user: req.user
                data:
                    seller_projects: projects
                    seller_bidding:  (p for p in projects when p.state is 'bidding')
                    seller_assigned: (p for p in projects when p.state is 'assigned' and compare_document(p.assigned, req.user))
                    seller_finished: (p for p in projects when p.state is 'finished' and compare_document(p.assigned, req.user))
                    seller_canceled: (p for p in projects when p.state is 'canceled' and compare_document(p.assigned, req.user))
                    seller_lost:     (p for p in projects when p.state is 'assigned' and not compare_document(p.assigned, req.user))
                head:
                    meta:
                        title: 'My Projects'

exports.view = (req, res) -> # done cleaning up
    # return res.redirect '/' unless req.user
    userId = if req.user then req.user._id else ''
    return res.send 500, {err: 'Missing required parameters'} unless req.params.id

    q = Project.findById req.params.id
    q.populate 'bids.owner', 'picture username geo mechanicType warranty average_rating role ratings referral.workorder referral.diagnosis tax.parts tax.labor diagnosisCharge discounts'
    q.populate 'assigned', 'picture username geo mechanicType warranty average_rating role ratings referral.workorder referral.diagnosis tax.parts tax.labor diagnosisCharge'
    q.populate 'owner', 'picture username geo mechanicType warranty average_rating role ratings referral.diagnosis referral.workorder diagnosisCharge discounts'
    q.populate 'parent'
    q.populate 'child'
    q.populate 'poster', 'username'
    q.populate 'vehicle'
    q.exec (err, p) ->
        return res.send 500, {err: err} if err
        return res.send 404, {err: 'Project not found'} unless p
        return res.send 404, {err: 'Project not found'} if p.state in ['draft', 'creating'] and (userId.toString() isnt p.owner._id.toString() and userId.toString() isnt p.poster._id.toString())
        return res.redirect '/projects/' + p._id + '/review' if p.state in ['creating', 'reviewing']

        foundViewer = false
        for viewer in p.viewers
            if userId.toString() is viewer.toString()
                foundViewer = true
                break
        
        if userId and !foundViewer
            p.viewers.push userId
            p.save()
        
        return res.render 'projects/view',
            layout: 'layouts/internal'
            project: p
            user: req.user
            quickCopy: MF.properties.env is 'development'
            head:
                meta:
                    title: p.title + ' - Projects'

exports.review = (req, res) -> # done cleaning up
    return res.redirect '/' unless req.user
    return res.redirect '/projects' unless req.params.id 

    q = Project.findById req.params.id
    q.populate 'vehicle'
    q.populate 'poster', 'picture username geo mechanicType warranty average_rating role ratings referral.workorder referral.diagnosis tax.parts tax.labor diagnosisCharge discounts'
    q.populate 'parent', 'bids diagnosis state assigned'
    q.populate 'bids.owner', 'picture username geo mechanicType warranty average_rating role ratings referral.workorder referral.diagnosis tax.parts tax.labor diagnosisCharge discounts'
    q.exec (err, p) ->
        return res.send 500, {err: err} if err
        return res.redirect '/projects/' + p._id.toString() unless p.state in ['creating', 'reviewing'] and p.parent and p.parent.diagnosis and p.parent.state isnt 'finished'
        return res.send 404, {err: 'Project not found'} unless p.owner.toString() is req.user._id.toString() or p.poster._id.toString() is req.user._id.toString()


        # should delete all bids except the one that was requested, given this is a diagnosis project
        i = 0
        while i < p.parent.bids.length
            if p.parent.bids[i].state in ['accepted', 'requested']
                i++
            else
                p.parent.bids.splice i, 1

        return res.redirect '/projects/' + p._id.toString() if p.parent.bids.length <= 0

        options = [
            { path: 'owner', select: 'picture username geo mechanicType warranty average_rating role ratings referral.workorder referral.diagnosis tax.parts tax.labor diagnosisCharge discounts' }
            { path: 'poster', select: 'picture username geo mechanicType warranty average_rating role ratings referral.workorder referral.diagnosis tax.parts tax.labor diagnosisCharge discounts' }
            { path: 'assigned', select: 'picture username geo mechanicType warranty average_rating role ratings referral.workorder referral.diagnosis tax.parts tax.labor diagnosisCharge discounts' }
        ]
        
        Project.populate p, options, (err, p) ->
            return res.send 500, {err: err} if err
            return res.render 'projects/review',
                layout: 'layouts/internal'
                project: p
                user: req.user
                head:
                    meta:
                        title: 'Review ' + p.poster.username + '\'s Draft'



exports.post = (req, res) ->
    return res.redirect('/') unless req.user and req.user.role isnt 'seller'

    Make.find_makes (err, makes) ->
        q = Vehicle.where('owner', req.user)
        q.where('active', true)
        q.exec (err, vehicles) ->
            res.render 'projects/post',
                types: Project.TYPES
                repairs: Project.REPAIRS
                makes: makes
                user: req.user
                targetUser: req.user
                vehicles: vehicles
                layout: 'layouts/internal'
                tooltips: req.tooltips
                quickPost: MF.properties.env is 'development'
                head:
                    meta:
                        title: 'Post a Project'

quickPost = (req, res, diagnosis) ->
    diagnosis = if typeof diagnosis is 'boolean' then diagnosis else false

    return res.send 500, {err: 'Not logged in'} unless req.user
    return res.redirect '/projects/post' unless MF.properties.env is 'development'

    q = Vehicle.find owner: req.user._id
    q.exec (err, vehicles) ->
        return res.send 404, {err: 'No vehicles found for user'} unless vehicles and vehicles.length
        # vehicle = vehicles[Math.floor(Math.random() * vehicles.length)];
        vehicle = vehicles[0]

        word = if diagnosis then 'Diagnosis' else 'Workorder'
        project = new Project
            owner: req.user._id
            poster: req.user._id
            diagnosis: diagnosis
            vehicle: vehicle._id
            title: word + ' Job for ' + vehicle.year + ' ' + vehicle.make + ' ' + vehicle.model
            description: 'Voila! In view, a humble vaudevillian veteran, cast vicariously as both victim and villain by the vicissitudes of Fate. This visage, no mere veneer of vanity, is it vestige of the vox populi, now vacant, vanished, as the once vital voice of the verisimilitude now venerates what they once vilified. However, this valorous visitation of a bygone vexation stands vivified, and has vowed to vanquish these venal and virulent vermin vanguarding vice and vouchsafing the violently vicious and voracious violation of volition. The only verdict is vengeance; a vendetta held as a votive, not in vain, for the value and veracity of such shall one day vindicate the vigilant and the virtuous. Verily, this vichyssoise of verbiage veers most verbose vis-a-vis an introduction, and so it&apos;s my very good honor to meet you and you may call me Project.'
            repair: 'Other/Not Sure'
            tow: false
            preference: 'mobile'
            parts: true
            acceptableParts: ['OEM/New', 'Aftermarket']
            geo: req.geo

        project.save (err) ->
            return res.send 500, {err: err} if err
            return res.redirect '/projects/' + project._id

exports.quickPost = (req, res) ->
    quickPost req, res, false

exports.quickPostD = (req, res) ->
    quickPost req, res, true


exports.quickCopy = (req, res) ->
    return res.send 500, {err: 'Not logged in'} unless req.user
    return res.send 400, {err: 'Missing required fields'} unless req.params.id
    return res.redirect '/projects/' + req.params.id unless MF.properties.env is 'development'

    q = Project.findById req.params.id
    q.exec (err, p) ->
        return res.send 500, {err: err} if err
        return res.send 404, {err: 'Project not found'} unless p
        p2 = p
        delete p2._id
        p2.title = p.title + ' (Copied)'
        p2.save (err) ->
            return res.send 500, {err: err} if err
            return res.redirect '/projects/' + p2._id



exports.edit = (req, res) ->
    return res.redirect '/' unless req.user
    return res.redirect '/projects' unless req.params.id

    q = Project.findById req.params.id
    q.populate 'owner', 'username'
    q.populate 'poster', 'username'
    q.exec (err, p) ->
        return res.send 500, {err: err} if err
        return res.send 404, {err: 'Project not found'} unless p
        unless req.user._id.toString() is p.owner._id.toString() or (req.user._id.toString() is p.poster._id.toString() and p.state is 'draft')
            return res.redirect('/projects/' + req.params.id)

        q = Vehicle.where 'owner', p.owner._id
        q.exec (err, vehicles) ->
            return res.send 500, {err: err} if err

            return res.render 'projects/edit',
                layout: 'layouts/internal'
                user: req.user
                targetUser: p.owner
                vehicles: vehicles
                project: p
                head:
                    meta:
                        title: 'Edit Your Project'
