{Project, User} = require('../models')
Content = require('../models/content')
Holla = require('../models/holla')
Ticket = require('../models/ticket')
Transaction = require('../models/transaction')
Notification = require('../models/notification')
util = require('../util')
braintree = require('braintree')

braintreeEnvironment = if MF.properties.braintree.environment is 'production' then braintree.Environment.Production else braintree.Environment.Sandbox

gateway = braintree.connect(
    environment: braintreeEnvironment
    merchantId: MF.properties.braintree.merchantId
    publicKey: MF.properties.braintree.publicKey
    privateKey: MF.properties.braintree.privateKey
)

exports.test = (req, res) ->
    return res.send {test: 'first test of admin api'}

exports.users = (req, res) ->
    role = if req.query.role then req.query.role else 'buyer'
    start = if req.query.start then req.query.start else 0
    limit = if req.query.limit then req.query.limit else 20
    query = if req.query.query then req.query.query else ''
    sort = if req.query.sort then req.query.sort else 'created'
    direction = if req.query.direction then req.query.direction else '1'
    
    sortDirection = if direction is '0' or direction is '-1' then '-' else ''
    
    queryObject = {}
    if query
        queryExp = new RegExp query, 'i'
        orArray = [
            { 'username': queryExp }
            { 'first': queryExp }
            { 'last': queryExp }
            { 'mechanicType': queryExp }
            { 'phone.number': queryExp }
            { 'geo.postal': queryExp }
            { 'geo.city': queryExp }
            { 'geo.state': queryExp }
        ]

        orArray.push { '_id': query } if query.match /^[0-9a-fA-F]{24}$/
        
        queryObject = 
            $or: orArray
    
    q = User.find {role: role}
    q.and queryObject
    q.skip start
    q.limit limit
    q.sort sortDirection + sort
    q.exec (err, user) ->
        return res.send 500, {err: err} if err
        return res.send user

exports.projects = (req, res) ->
    start = if req.query.start then req.query.start else 0
    limit = if req.query.limit then req.query.limit else 20
    query = if req.query.query then req.query.query else ''
    sort = if req.query.sort then req.query.sort else 'date_created'
    direction = if req.query.direction then req.query.direction else '1'
    owner = if req.query.owner then req.query.owner else ''
    assigned = if req.query.assigned then req.query.assigned else ''
    
    sortDirection = if direction is '0' or direction is '-1' then '-' else ''
    
    queryObject = {}
    if query
        queryExp = new RegExp query, 'i'
        orArray = [
            { 'title': queryExp }
            { 'description': queryExp }
            { 'geo.postal': queryExp }
            { 'geo.city': queryExp }
            { 'geo.state': queryExp }
            { 'canceledReason': queryExp }
            { 'acceptableParts': queryExp }
            { 'repair': queryExp }
        ]

        orArray.push { '_id': query } if query.match /^[0-9a-fA-F]{24}$/
        
        queryObject = 
            $or: orArray

    q = Project.find queryObject
    q.skip start
    q.limit limit
    q.sort sortDirection + sort
    q.populate 'owner'
    q.populate 'assigned'
    q.where 'owner', owner if owner
    q.where 'assigned', assigned if assigned
    q.exec (err, projects) ->
        return res.send 500, {err: err} if err
        return res.send projects

exports.content = (req, res) ->
    console.log 'post content api'
    return res.send 400, {err: 'Missing required properties'} unless req.body._id and req.body.markup

    Content.findById req.body._id, (err, content) ->
        return res.send 500, {err: err} if err
        return res.send 404, {err: 'Content not found'} unless content

        content.markup = req.body.markup
        content.updated = new Date()
        content.updater = req.user._id
        content.save (err) ->
            return res.send 500, {err: err} if err
            return res.send content

exports.hollas = (req, res) ->
    start = if req.query.start then req.query.start else 0
    limit = if req.query.limit then req.query.limit else 20
    query = if req.query.query then req.query.query else ''
    sort = if req.query.sort then req.query.sort else 'date'
    direction = if req.query.direction then req.query.direction else '1'
    
    sortDirection = if direction is '0' or direction is '-1' then '-' else ''
    
    queryObject = {}
    if query
        queryExp = new RegExp query, 'i'
        orArray = [
            { 'message': queryExp }
            { 'user.username': queryExp }
        ]

        orArray.push { '_id': query } if query.match /^[0-9a-fA-F]{24}$/
        
        queryObject = 
            $or: orArray

    q = Holla.find queryObject
    q.skip start
    q.limit limit
    q.sort sortDirection + sort
    q.populate 'user'
    q.exec (err, hollas) ->
        return res.send 500, {err: err} if err
        return res.send hollas

exports.acknowledgeHolla = (req, res) ->
    return res.send 400, {err: 'Missing required parameters'} unless req.params.id

    Holla.findById req.params.id, (err, holla) ->
        return res.send 500, {err: err} if err
        return res.send 404, {err: 'Holla not found'} unless holla

        holla.acknowledged = if holla.acknowledged then null else new Date()
        holla.save (err) ->
            return res.send 500, {err: err} if err
            return res.send holla

exports.tickets = (req, res) ->
    start = if req.query.start then req.query.start else 0
    limit = if req.query.limit then req.query.limit else 20
    query = if req.query.query then req.query.query else ''
    sort = if req.query.sort then req.query.sort else 'date'
    direction = if req.query.direction then req.query.direction else '1'

    query = query.toString() unless typeof query is 'string'
    
    sortDirection = if direction is '0' or direction is '-1' then '-' else ''
    
    queryObject = {}
    if query
        queryExp = new RegExp query, 'i'
        orArray = [
            { 'message': queryExp }
            { 'state': queryExp } 
            { 'user.username': queryExp }
            { 'user.first': queryExp }
            { 'user.last': queryExp } 
            { 'project.title': queryExp }
        ]

        orArray.push { '_id': query } if query.match /^[0-9a-fA-F]{24}$/
        orArray.push { 'number': query }
        
        queryObject = 
            $or: orArray

    q = Ticket.find queryObject
    q.skip start
    q.limit limit
    q.sort sortDirection + sort
    q.populate 'user'
    q.populate 'project'
    q.exec (err, hollas) ->
        return res.send 500, {err: err} if err
        return res.send hollas

exports.updateTicket = (req, res) ->
    return res.send 400, {err: 'Missing require parameters'} unless req.params.id

    Ticket.findById req.params.id, (err, ticket) ->
        return res.send 500, {err: err} if err
        return res.send 404, {err: 'Ticket not found'} unless ticket

        ticket.state = req.body.state if req.body.state in ['open', 'responded', 'resolved', 'closed']
        ticket.save (err) ->
            return res.send 500, {err: err} if err
            return res.send ticket

exports.addContent = (req, res) ->
    return res.send 400, { err: 'Missing required properties' } unless req.body.markup

    c = new Content
    c.set {
        markup: req.body.markup
        title: req.body.title
        updated: new Date()
        updater: req.user._id
    }

    c.save (err) ->
        return res.send 500, { err: err } if err
        return res.send c

exports.updateReferral = (req, res) ->
    return res.send 400, {err: 'Missing required properties'} unless req.body.userId and req.body.referralType and req.body.referralRate

    userId = req.body.userId
    referralType = req.body.referralType
    referralRate = parseFloat req.body.referralRate

    return res.send 400, {err: 'Invalid referral type'} unless referralType in ['diagnosis', 'workorder']
    return res.send 400, {err: 'Invalid referral rate'} if isNaN(referralRate) or referralRate < 0 or referralRate > 1

    q = User.findById userId
    q.exec (err, user) ->
        return res.send 500, {err: err} if err
        return res.send 404, {err: 'User not found'} unless user

        user.referral.diagnosis = referralRate if referralType is 'diagnosis'
        user.referral.workorder = referralRate if referralType is 'workorder'
        user.save (err) ->
            return res.send 500, {err: err} if err
            return res.send user

exports.updateRole = (req, res) ->
    return res.send 400, {err: 'Missing required properties'} unless req.body.userId and req.body.role

    userId = req.body.userId
    role = req.body.role

    return res.send 400, {err: 'Invalid role type'} unless role in ['buyer', 'seller']

    q = User.findById userId
    q.exec (err, user) ->
        return res.send 500, {err: err} if err
        return res.send 404, {err: 'User not found'} unless user

        user.role = role

        console.log user.role
        user.save (err) ->
            return res.send 500, {err: err} if err
            return res.send user

exports.releaseEstimate = (req, res) ->
    return res.send 400, {err: 'Missing required properties'} unless req.body.projectId and req.body.estimateId

    projectId = req.body.projectId
    estimateId = req.body.estimateId

    q = Project.findById projectId
    q.populate 'bids.owner'
    q.populate 'poster'
    q.populate 'assigned'
    q.populate 'owner'
    q.populate 'vehicle'
    q.exec (err, project) ->
        return res.send 500, {err: err} if err
        return res.send 404, {err: 'Project not found'} unless project

        estimate = project.bids.id estimateId
        return res.send 404, {err: 'Estimate not found'} unless estimate
        return res.send 500, {err: 'Estimate has not braintree transaction'} unless estimate.braintreeTransaction

        Transaction.findOne {orderNumber: estimate.braintreeTransaction}, (err, transaction) ->
            return res.send 500, {err: err} if err
            return res.send 404, {err: 'Transaction not found'} unless transaction

            gateway.transaction.releaseFromEscrow estimate.braintreeTransaction, (err, result) ->
                return res.send 500, {err: err} if err
                return res.send 500, {err: 'No braintree result'} unless result
                if result.transaction?.status and result.transaction?.escrowStatus
                    transaction.status = result.transaction.status
                    transaction.escrowStatus = result.transaction.escrowStatus

                if result.success
                    estimate.state = 'released'
                    estimate.date_released = new Date()
                    transaction.save (err) ->
                        return res.send 500, {err: err} if err

                        lastOneDone = true
                        for bid in project.bids
                            unless bid.state in ['retracted', 'canceled', 'released', 'refunded']
                                lastOneDone = false
                                break

                        project.state = 'finished' if lastOneDone

                        project.save (err) ->
                            return res.send 500, {err: err} if err
                            return res.send {user: req.user, project: project, estimate: estimate, braintree: result}
                else
                    braintreeErrors = result.errors.deepErrors()
                    project.save (err) ->
                        return res.send 500, {err: err} if err
                        return res.send 500, {err: 'Braintree error', user: req.user, project: project, braintreeErrors: braintreeErrors, escrowStatus: transaction.escrowStatus }

exports.refundEstimate = (req, res) ->
    return res.send 400, {err: 'Missing required properties'} unless req.body.projectId and req.body.estimateId

    projectId = req.body.projectId
    estimateId = req.body.estimateId

    q = Project.findById projectId
    q.populate 'bids.owner'
    q.populate 'poster'
    q.populate 'assigned'
    q.populate 'owner'
    q.populate 'vehicle'
    q.exec (err, project) ->
        return res.send 500, {err: err} if err
        return res.send 404, {err: 'Project not found'} unless project

        estimate = project.bids.id estimateId
        return res.send 404, {err: 'Estimate not found'} unless estimate
        return res.send 500, {err: 'Estimate has not braintree transaction'} unless estimate.braintreeTransaction

        Transaction.findOne {orderNumber: estimate.braintreeTransaction}, (err, transaction) ->
            return res.send 500, {err: err} if err
            return res.send 404, {err: 'Transaction not found'} unless transaction

            gateway.transaction.refund estimate.braintreeTransaction, (err, result) ->
                return res.send 500, {err: err} if err

                if result.success
                    refund = new Transaction
                        to: transaction.to
                        from: transaction.from
                        project: transaction.project
                        orderNumber: result.transaction.id
                        referral:
                            buyer: transaction.referral.buyer
                            seller: transaction.referral.seller

                    refund.save (err) ->
                        return res.send 500, {err: err} if err

                        estimate.state = 'refunded'
                        estimate.date_refunded = new Date()
                    
                        lastOneDone = true
                        for bid in project.bids
                            unless bid.state in ['retracted', 'canceled', 'released', 'refunded']
                                lastOneDone = false
                                break
                        
                        project.state = 'finished' if lastOneDone

                        project.save (err) ->
                            return res.send 500, {err: err} if err
                            return res.send {user: req.user, project: project, estimate: estimate, braintree: result }
                else
                    braintreeErrors = result.errors.deepErrors()
                    project.save (err) ->
                        return res.send 500, {err: err} if err
                        return res.send 500, {err: 'Braintree error', user: req.user, project: project, braintreeErrors: braintreeErrors, escrowStatus: transaction.escrowStatus } 

exports.addDiscount = (req, res) ->
    return res.send 400, err: 'Missing required properties' unless req.body.userId and req.body.number and req.body.unit and req.body.uses

    User.findById req.body.userId, (err, user) ->
        return res.send 500, {err: err} if err
        return res.send 404, {err: 'User not found'} unless user

        discount = 
            label: req.body.label || ''
            kind: req.body.kind || ''
            amount: if req.body.unit is 'amount' then req.body.number else 0 
            rate: if req.body.unit is 'rate' then req.body.number else 0 
            expiration: req.body.expiration || null
            uses: req.body.uses
        
        console.log 'adding discount:'
        console.log discount
        user.discounts.push discount
        user.save (err) ->
            return res.send 500, {err: err} if err
            return res.send discount


    # Discount = new mongoose.Schema
    # label:      { type: String, default: '', trim: true }                           # label for the discount (as it looks on user end)
    # kind:       { type: String, default: '', enum: ['', 'diagnosis', 'workorder'] } # the type of project that the discount applies to ('' = either kind is okay)
    # amount:     Currency()                                                          # dollar amount of the discount (cannot be set with rate)
    # rate:       { type: Number, default: 0 }                                        # decimal discount rate (cannot be set with amount)
    # created:    { type: Date, default: -> new Date() }                              # date the discount was added
    # expiration: { type: Date }                              # expiration date of the discount (none if = created, can be used in conjunction with projects)
    # uses:       { type: Number, default: 0 }                                        # number of uses remaining to which the discount can apply
    # used:       [{ type: Date, default: -> new Date() }] 




exports.vehicleActiveFix = (req, res) ->
    console.log 'deprecated'
    
    Vehicle.update {}, {$set: {active: true}}, {multi: true}, (err) ->
        console.log err if err
        return res.send 500, {err: err} if err
        return res.send {err: false}

exports.evolveBids = (req, res) ->
    console.log 'deprecated'

    Project.find {}, (err, projects) ->
        iterate = (i, projects, next) ->
            console.log 'project: ' + i
            if i >= projects.length
                next()
            else
                project = projects[i]
                c = 0
                for b in project.bids
                    console.log 'bid: ' + c
                    c++
                    b.owner = b.user if b.user
                    if b.tax and typeof b.tax is 'number'
                        b.taxRate.parts = b.tax
                    b.referral.seller = b.serviceFee if b.serviceFee
                    b.referral.buyer = 0
                    b.diagnosisWaiver = if b.waivedDiagnosisFee then b.waivedDiagnosisFee else 0
                    console.log b
                
                project.save (err) ->
                    console.log err if err
                    return res.send 500, {err: err} if err
                    iterate i+1, projects, next
        
        iterate 0, projects, () ->
            console.log 'finished bids'
            
            Transaction.find {}, (err, transactions) ->
                iterate2 = (i, transactions, next) ->
                    if i >= transactions.length
                        next()
                    else
                        console.log 'transaction: ' + i
                        transaction = transactions[i]
                        transaction.referral.seller = transaction.fee if transaction.fee
                        transaction.save (err) ->
                            console.log err if err
                            return res.send 500, {err: err} if err
                            iterate2 i+1, transactions, next
                
                iterate2 0, transactions, () ->
                    console.log 'finished transactions'
                    return res.send {err: false}

exports.languageStuffz = (req, res) ->
    console.log 'deprecated'
    
    User.find {}, (err, users) ->
        iterate = (i, users, next) ->
            if i >= users.length
                next()
            else
                user = users[i]
                console.log user.languages
                user.languages.english = true if typeof user.languages.english isnt 'boolean'
                user.languages.spanish = true if typeof user.languages.spanish isnt 'boolean'
                user.languages.english = user.languages.english
                user.languages.spanish = user.languages.spanish
                user.save (err) ->
                    return res.send 500, {err: err} if err
                    iterate i+1, users, next
        
        iterate 0, users, () ->
            console.log 'finished user languages'
            return res.send {err: false}

