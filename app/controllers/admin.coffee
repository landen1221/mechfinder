{User, Project} = require('../models')
Content = require('../models/content');

exports.home = (req, res) ->
    console.log 'hit the home route'
    
    return res.render 'admin/home',
        layout: 'layouts/admin'
        title: 'Home'
        user: req.user

exports.sellers = (req, res) ->
    sellerCount = -1
    User.count {role: 'seller'}, (err, count) ->
        sellerCount = count unless err
    
        return res.render 'admin/sellers',
            layout: 'layouts/admin'
            title: 'Mechanics'
            user: req.user
            sellerCount: sellerCount

exports.user = (req, res) ->
    return res.send 400, {err: 'Missing required param'} unless req.params.id
    User.findById req.params.id, (err, user) ->
        return res.send 500, {err: err} if err
        return res.send 404, {err: 'User not found'} unless user
        return res.render 'admin/user',
            layout: 'layouts/admin',
            title: user.first + ' ' + user.last + '\'s Info'
            user: user

exports.buyers = (req, res) ->
    buyerCount = -1
    User.count {role: 'buyer'}, (err, count) ->
        buyerCount = count unless err

        return res.render 'admin/buyers',
            layout: 'layouts/admin'
            title: 'Customers'
            user: req.user
            buyerCount: buyerCount

exports.projects = (req, res) ->
    projectCount = -1

    Project.count {}, (err, count) ->
        projectCount = count unless err

        return res.render 'admin/projects',
            layout: 'layouts/admin'
            title: 'Projects'
            user: req.user
            projectCount: projectCount

exports.project = (req, res) ->
    return res.send 400, {err: 'Missing required parameters'} unless req.params.id

    q = Project.findById req.params.id
    q.populate 'owner'
    q.populate 'poster'
    q.populate 'assigned'
    q.populate 'vehicle'
    q.populate 'bids.owner'
    q.exec (err, project) ->
        return res.send 500, {err: err} if err
        return res.send 404, {err: 'Project not found'} unless project
        return res.render 'admin/project',
            layout: 'layouts/admin'
            title: project.title
            project: project

exports.logout = (req, res) ->
    console.log 'hit the logout route'

    req.session.destroy (err) ->
        return res.send 500, err if err
        return res.redirect '/'

exports.cms = (req, res) ->
    Content.find {}, (err, contents) ->
        return res.send 500, {err: err} if err
        return res.render 'admin/cms',
            layout: 'layouts/admin'
            title: 'CMS'
            user: req.user
            contents: contents

exports.holla = (req, res) ->
    return res.render 'admin/holla',
        layout: 'layouts/admin'
        title: 'Hollas'
        user: req.user

exports.tickets = (req, res) ->
    return res.render 'admin/tickets',
        layout: 'layouts/admin'
        title: 'Tickets'
        user: req.user
