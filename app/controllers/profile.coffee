async = require('async')
{Settings, User, Project, Make, Comment, Vehicle} = require('../models')
Transaction = require('../models/transaction')
{COUNTRIES, STATES, PROVIDERS, compare_document} = require('../util')

braintree = require('braintree')
util = require('../util')

braintreeEnvironment = if MF.properties.braintree.environment is 'production' then braintree.Environment.Production else braintree.Environment.Sandbox

gateway = braintree.connect(
    environment: braintreeEnvironment
    merchantId: MF.properties.braintree.merchantId
    publicKey: MF.properties.braintree.publicKey
    privateKey: MF.properties.braintree.privateKey
)

userAccountStatus = (user, next) ->
    accountStatus =
        billingMissing: true
        bankingMissing: true
        aboutMissing: true
        specialtiesMissing: true
    accountStatus.billingMissing = false unless user.billing.zip is '' or user.billing.primary is '' or user.billing.state is ''
    accountStatus.bankingMissing = false unless user.banking.account is '' or user.banking.routing is '' or user.banking.bank is ''
    accountStatus.aboutMissing = false unless user.about is ''
    accountStatus.specialtiesMissing = false unless user.specialties.length < 1

    next accountStatus

exports.activate = (req, res) ->
    # return res.send 400, {err: true, message: 'Missing required properties'} unless req.params.id
    return res.redirect '/' unless req.params.id

    User.findById req.params.id, (err, u) ->
        return res.send 500, {err: true} if err
        return res.send 500, {err: true} unless u

        u.set({verified: true})
        u.save (err) ->
            return res.send 500, {err: true} if err
            return res.redirect '/profile/'+req.params.id

exports.profile = (req, res) ->
    return res.redirect('/') unless req.user
    return res.redirect('/profile/' + req.user._id)

exports.personal = (req, res) ->
    return res.redirect '/' unless req.user and req.params.id and req.user._id.toString() is req.params.id

    return res.render 'profile/personal-profile',
        layout: 'layouts/internal'
        user: req.user
        head:
            meta:
                title: 'Personal Profile'

exports.accounting = (req, res) ->
    return res.redirect '/' unless req.user and req.params.id and req.user._id.toString() is req.params.id

    q = Transaction.find({
        $or: [
            {to: req.user._id},
            {from: req.user._id}
        ]
    })
    
    q.populate 'to', 'username'
    q.populate 'from', 'username'
    q.populate('project')
    q.exec (err, ts) ->
        return res.send 500, {err: err} if err

        populateVehicles = (i, transactions, next) ->
            if i < transactions.length
                if transactions[i].project and transactions[i].project.vehicle
                    Vehicle.findById transactions[i].project.vehicle, (err, v) ->
                        t = transactions[i].toJSON()
                        transactions[i] = t
                        transactions[i].project.vehicle = v.toJSON() if v and not err
                        populateVehicles i+1, transactions, next
                else
                    populateVehicles((i+1), transactions, next)
            else
                next transactions
        
        n = 0
        populateBraintree = (i, transactions, next) ->
            if i < transactions.length
                gateway.transaction.find transactions[i].orderNumber, (err, btt) ->
                    transactions[i].braintree = btt

                    n++
                    next transactions if n >= transactions.length

                populateBraintree((i+1), transactions, next)
            else
                next [] if transactions.length <= 0

        populateVehicles 0, ts, (transactions) ->
            populateBraintree 0, transactions, (transactions) ->
                return res.render 'profile/accounting',
                    layout: 'layouts/internal'
                    user: req.user
                    transactions: transactions
                    head:
                        meta:
                            title: 'Accounting'

exports.vehicles = (req, res) ->
    return res.redirect '/' unless req.user and req.params.id and req.user._id.toString() is req.params.id

    Vehicle.find {owner: req.params.id, active: true}, (err, vs) ->
        return res.send 500, {err: err} if err
        return res.render 'profile/vehicles',
            layout: 'layouts/internal'
            user: req.user
            vehicles: vs
            head:
                meta:
                    title: 'Vehicle Profile'

exports.mechanicPersonal = (req, res) ->
    return res.redirect '/' unless req.user and req.params.id and req.user._id.toString() is req.params.id

    Make.find_makes (err, makes) ->
        return res.render 'profile/mechanic-profile',
            layout: 'layouts/internal'
            user: req.user
            makes: makes
            head:
                meta:
                    title: 'Mechanic Profile'

exports.publicProfile = (req, res) ->
    # return res.redirect '/' unless req.user
    
    User.findById(req.params.id).exec (err, u) ->
        return res.send 500, {err: err} if err
        return res.send 404, {err: 'User not found'} unless u and (u?.role is 'buyer' or u?.role is 'seller')

        q = null
        if u.role is 'buyer'
            q = Project.where('state').in(['bidding', 'finished'])
            q.where('owner', u._id)
            q.sort('-date_finished')
            q.populate('vehicle')
            q.populate('assigned')
            q.populate('owner')
            q.limit(25)
        else
            q = Project.where('state').in(['finished'])
            q.where('assigned', u._id)
            q.sort('-date_finished -date_created')
            q.populate('vehicle')
            q.populate('owner')
            q.populate('assigned')
            q.limit(25)

        afterProjects = (ret) ->
            return res.render 'profile/view-public', ret
                
        if q
            ret = 
                layout: 'layouts/internal'
                favorites: req.user?.favorites
                targetUser: u
                user: req.user
                head:
                    meta:
                        title: u.username + '\'s Profile'

            q.exec (err, projects) ->
                return res.send 500, {err: err} if err

                ret.projects = 
                    all: projects
                    bidding: (p for p in projects when p.state is 'bidding')
                    finished: (p for p in projects when p.state is 'finished')

                if req.user and req.user.role is 'buyer' and u.role is 'seller'
                    q = Project.where 'owner', req.user._id
                    q.populate 'vehicle'
                    q.populate 'owner'
                    q.populate 'assigned'
                    q.exec (err, userProjects) ->
                        ret.userProjects = userProjects
                        afterProjects ret
                else
                    ret.userProjects = []
                    afterProjects ret
        else
            return res.send 500, {err: 'No query'}

exports.view = (req, res) ->
    if req.user and req.params.id and req.user.id and (req.params.id is req.user.id)
        u = req.user
        q = null
        if u.role is 'buyer' or u.role is 'support'
            q = Project.where('state').ne('canceled')
            q.where('owner', u)
            q.sort('-date_finished')

        if u.role is 'seller' or u.role is 'support'
            findBids =
                bids:
                    $elemMatch:
                        owner: u
            q = Project.find(findBids)
            q.sort('-date_finished -date_created')

        if q
            q.exec (err, projects) ->
                filter =
                    loc: [req.geo.long, req.geo.lat]
                    distance: 10
                    userId: u._id
                q = Project.find_near filter, (err, nearProjects) ->
                    q = Vehicle.where('owner', u)
                    q.where 'active', true
                    q.exec (err, vehicles) ->
                        filter.role = 'seller'
                        q = User.find_near filter, (err, mechanics) ->
                            userAccountStatus u, (accountStatus) ->
                                finished = (p for p in projects when p.state is 'finished')
                                openReviews =
                                    buyer: 0
                                    seller: 0
                                i = 0
                                while i < finished.length
                                    openReviews.buyer++ unless finished[i].buyerRated
                                    openReviews.seller++ unless finished[i].sellerRated
                                    i++
                                return res.render 'profile/dashboard',
                                    layout: 'layouts/internal'
                                    head:
                                        meta:
                                            title: u.username + '\'s Profile'
                                            keywords: res.locals.meta.keywords
                                    user: u
                                    projects:
                                        all: projects
                                        bidding:  (p for p in projects when p.state is 'bidding')
                                        assigned: (p for p in projects when p.state is 'assigned')
                                        finished: (p for p in projects when p.state is 'finished')
                                        canceled: (p for p in projects when p.state is 'canceled')
                                        near: nearProjects
                                    vehicles: vehicles
                                    tooltips: req.tooltips
                                    mechanics: mechanics
                                    accountStatus: accountStatus
                                    openReviews: openReviews

    else if req.params.id
        return res.redirect '/profile/' + req.params.id + '/public' # redirect here for seo
    else
        return res.redirect '/'
