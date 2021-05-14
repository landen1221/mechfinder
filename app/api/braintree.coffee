{Project, User, Comment, Event, Membership} = require('../models')
Notification = require('../models/notification')
Transaction = require('../models/transaction')
braintree = require('braintree')
util = require('../util')

braintreeEnvironment = if MF.properties.braintree.environment is 'production' then braintree.Environment.Production else braintree.Environment.Sandbox

gateway = braintree.connect(
    environment: braintreeEnvironment
    merchantId: MF.properties.braintree.merchantId
    publicKey: MF.properties.braintree.publicKey
    privateKey: MF.properties.braintree.privateKey
)

exports.clientToken = (req, res) ->
    return res.send 403, {err: 'Not logged in'} unless req.user
    return res.send 403, {err: 'No associated braintree account'} unless req.user.braintree.hasAccount
    # return res.send(409, "create Braintree user before generating the client token") unless req.user.braintree.hasAccount

    customerId = req.user._id.toString()
    gateway.clientToken.generate { customerId: customerId }, (err, response) ->
        return res.send 500, {err: err} if err
        return res.send response

exports.createUser = (req, res) ->
    return res.send 403, {err: 'Not logged in'} unless req.user
    return res.send 403, {err: 'Already has account'} if req.user.braintree.hasAccount
    u = req.user

    request =
        id: req.user._id.toString()
        firstName: req.body.first || u.first
        lastName: req.body.last || u.last
        company: req.body.company || u.company
        email: req.body.email || u.email
        phone: req.body.phone || u.phone.number

    gateway.customer.create request, (err, result) ->
        return res.send 500, {err: err} if err
        u.braintree.hasAccount = true
        u.save (err) ->
            return res.send(500, err) if err
            return res.send {user: u, braintree: result}

exports.updateUser = (req, res) ->
    return res.send 403, {err: 'Not logged in'} unless req.user
    return res.send 403, {err: 'No associated braintree account'} unless req.user.braintree.hasAccount
    request =
        firstName: req.body.first
        lastName: req.body.last
        company: req.body.company
        email: req.body.email
        phone: req.body.phone
    gateway.customer.update req.user._id.toString(), request, (err, result) ->
        return res.send(500, err) if err
        return res.send(result)

exports.deleteUser = (req, res) ->
    return res.send 403, {err: 'Not logged in'} unless req.user
    return res.send 403, {err: 'No associated braintree account'} unless req.user.braintree.hasAccount
    gateway.customer.delete req.user._id.toString(), (err) ->
        return res.send(500, err) if err
        return res.send()

exports.createMerchant = (req, res) ->
    return res.send 403, {err: 'Not logged in'} unless req.user
    return res.send 403, {err: 'Already has account'} if req.user.braintree.hasAccount
    u = req.user

    request =
        id: req.user._id.toString()
        masterMerchantAccountId: MF.properties.braintree.merchantAccountId
        tosAccepted: true
        individual:
            firstName: req.body.first || u.first
            lastName: req.body.last || u.last
            email: req.body.email || u.email
            phone: req.body.phone || u.phone.number
            dateOfBirth: req.body.dateOfBirth || u.dob
            ssn: req.body.ssn || util.decryptString(u.ssn)
            address:
                streetAddress: req.body.individualStreetAddress || u.billing.primary
                locality: req.body.individualLocality || u.billing.city
                region: req.body.individualRegion || u.billing.state
                postalCode: req.body.individualPostalCode || u.billing.zip
        funding:
            descriptor: req.body.descriptor || u.banking.bank
            destination: req.body.destination || 'bank' # email, mobile phone, or bank
            email: req.body.email || u.email
            mobilePhone: req.body.phone || u.phone.number
            accountNumber: req.body.accountNumber || util.decryptString(u.banking.account)
            routingNumber: req.body.routingNumber || util.decryptString(u.banking.routing)
    business =
        legalName: req.body.legalName || u.business.legalName
        dbaName: req.body.dbaName || u.business.name
        taxId: req.body.taxId || u.business.taxId
        address:
            streetAddress: req.body.businessStreetAddress || req.body.individualStreetAddress || u.business.address
            locality: req.body.businessLocality || req.body.individualLocality || u.business.city
            region: req.body.businessRegion || req.body.individualRegion || u.business.state
            postalCode: req.body.businessPostalCode || req.body.individualPostalCode || u.business.zip

    request.business = business if business.legalName

    gateway.merchantAccount.create request, (err, result) ->
        return res.send 500, {err: err} if err
        # make sure that the merchant account was successfully created
        if result.success
            u.braintree.hasAccount = true
            u.save (err) ->
                return res.send 500, {err: err} if err
                return res.send {user: u, braintree: result}
        else
            errs = result.errors.deepErrors()

            # some errors require action on OUR user object
            # find those errors and reset that data to force users
            # to re-submit
            i = 0
            while i < errs.length
                switch errs[i].code
                    when '82674'
                        # pending or suspended merchant account
                        u.braintree.active = false
                    when '82649' or '82640' or '82635'
                        # bad routing number
                        u.banking.routing = ''
                        u.setBanking = false
                    when '82671' or '82641'
                        # bad account number
                        u.banking.account = ''
                        u.setBanking = false
                    when '82648' or '82647' or '82634'
                        # bad/missing tax id
                        u.business.taxId = ''
                    when '82642' or '82625'
                        # bad ssn
                        u.ssn = ''
                        u.setSSN = false
                    when '82657' or '82661' or '82617'
                        # bad individual/applicant street address
                        u.billing.primary = ''
                    when '82685'
                        # bad business street address
                        u.business.address = ''
                    when '82658'
                        # missing locale (city)
                        u.billing.city = ''
                    when '82659' or '82662'
                        # missing zip code
                        u.billing.zip = ''
                    when '82686'
                        # bad/missing business zip code
                        u.business.zip = ''
                    when '82660' or '82668'
                        # missing region (state)
                        u.billing.state = ''
                    when '82684'
                        # bad/missing business region (state)
                        u.business.state = ''
                i++

            u.save (err) ->
                return res.send 500, {err: err} if err
                return res.send 500, {user: u, err: 'Unable to complete Braintree verification', braintreeErrors: errs}

exports.merchantAccount = (req, res) ->
    return res.send 403, {err: 'Not logged in'} unless req.user
    return res.send 403, {err: 'No associated braintree account'} unless req.user.braintree.hasAccount
    gateway.merchantAccount.find req.user._id.toString(), (err, merchantAccount) ->
        return res.send(500, err) if err
        return res.send(merchantAccount)

exports.updateMerchant = (req, res) ->
    return res.send 403, {err: 'Not logged in'} unless req.user
    return res.send 403, {err: 'No associated braintree account'} unless req.user.braintree.hasAccount
    u = req.user
    request =
        masterMerchantAccountId: MF.properties.braintree.merchantAccountId
        tosAccepted: true
        individual:
            firstName: req.body.first
            lastName: req.body.last
            email: req.body.email
            phone: req.body.phone
            dateOfBirth: req.body.dateOfBirth
            ssn: req.body.ssn
            address:
                streetAddress: req.body.individualStreetAddress
                locality: req.body.individualLocality
                region: req.body.individualRegion
                postalCode: req.body.individualPostalCode
        funding:
            descriptor: req.body.descriptor
            destination: req.body.destination
            email: req.body.email
            mobilePhone: req.body.phone
            accountNumber: req.body.accountNumber
            routingNumber: req.body.routingNumber
        business:
            legalName: req.body.legalName
            dbaName: req.body.dbaName
            taxId: req.body.taxId
            address:
                streetAddress: req.body.businessStreetAddress
                locality: req.body.businessLocality
                region: req.body.businessRegion
                postalCode: req.body.businessPostalCode

    gateway.merchantAccount.update req.user._id.toString(), request, (err, result) ->
        return res.send(500, err) if err
        u.braintree.hasAccount = true
        u.save (err) ->
            return res.send(500, err) if err
            return res.send(result)

exports.paymentMethods = (req, res) ->
    return res.send 403, {err: 'Not logged in'} unless req.user
    return res.send 403, {err: 'No associated braintree account'} unless req.user.braintree.hasAccount

    gateway.customer.find req.user._id.toString(), (err, customer) ->
        if err
            return res.send 500, {err: err} unless err.type is 'notFoundError'
            return res.send [] # return an empty array if the user isn't found (no braintree account)
        return res.send customer.creditCards

exports.createPaymentMethod = (req, res) ->
    return res.send 403, {err: 'Not logged in'} unless req.user
    return res.send 403, {err: 'No associated braintree account'} unless req.user.braintree.hasAccount
    return res.send 400, {err: 'Missing required fields', body: req.body} unless req.body.nonce

    request =
        customerId: req.user._id.toString()
        paymentMethodNonce: req.body.nonce

    gateway.paymentMethod.create request, (err, response) ->
        return res.send 500, {err: err} if err
        return res.send response

exports.createEstimateTransaction = (req, res) ->
    return res.send 403, {err: 'Not logged in'} unless req.user
    return res.send 403, {err: 'No associated braintree account'} unless req.user.braintree.hasAccount
    return res.send 400, {err: 'Missing required fields', body: req.body} unless req.body.project and req.body.estimate and (req.body.nonce or req.body.token)

    Project.findById req.body.project, (err, p) ->
        return res.send 500, {err: err} if err
        return res.send 404, {err: 'Project not found'} unless p

        estimate = p.bids.id req.body.estimate
        return res.send 500, {err: 'Estimate not found'} unless estimate

        u = req.user

        nonce = req.body.nonce if req.body.nonce
        token = req.body.token if req.body.token

        merchantAccountId = estimate.owner.toString()

        transaction = new Transaction
            project: p._id
            from: req.user._id.toString()
            to: merchantAccountId
            amount: estimate.buyerTotal
            reason: 'Escrow for Estimate: ' + estimate._id
            referral: 
                buyer: estimate.buyerReferralAmount
                seller: estimate.sellerReferralAmount


        amount = util.centsToDollars estimate.buyerTotal, false
        referral = util.centsToDollars estimate.mfTotal, false
        request =
            amount: amount.toString()
            orderId: transaction._id.toString()
            merchantAccountId: merchantAccountId # the account Id belonging to the mechanic
            customer:
                firstName: req.body.customerFirst || u.first
                lastName: req.body.customerLast || u.last
                company: req.body.customerCompany
                phone: req.body.customerPhone || u.phone.number
                fax: req.body.customerFax
                website: req.body.customerWebsite
                email: req.body.customerEmail || u.email
            options:
                submitForSettlement: true
                holdInEscrow: true
            serviceFeeAmount: referral.toString()

        billing =
            firstName: req.body.billingFirst || req.body.customerFirst || u.first
            lastName: req.body.billingLast || req.body.customerLast || u.last
            company: req.body.billingCompany || req.body.customerCompany
            streetAddress: req.body.billingAddress1 || u.billing.primary
            extendedAddress: req.body.billingAddress2 || u.billing.secondary
            locality: req.body.billingLocality || u.billing.city
            region: req.body.billingRegion || u.billing.state
            postalCode: req.body.billingPostalCode || u.billing.zip
            countryCodeAlpha2: req.body.billingCountryCode
        shipping =
            firstName: req.body.shippingFirst || req.body.billingFirst || req.body.customerFirst || u.first
            lastName: req.body.shippingLast || req.body.billingLast || req.body.customerLast || u.last
            company: req.body.shippingCompany || req.body.billingCompany || req.body.customerCompany
            streetAddress: req.body.shippingAddress1 || req.body.billingAddress1 || u.billing.primary
            extendedAddress: req.body.shippingAddress2 || req.body.billingAddress2 || u.billing.secondary
            locality: req.body.shippingLocality || req.body.billingLocality || u.billing.city
            region: req.body.shippingRegion || req.body.billingRegion || u.billing.state
            postalCode: req.body.shippingPostalCode || req.body.billingPostalCode || u.billing.zip
            countryCodeAlpha2: req.body.shippingCountryCode || req.body.billingCountryCode

        request.paymentMethodToken = token if token
        request.paymentMethodNonce = nonce if nonce

        if u.braintree.billingAddressId then (request.billingAddressId = u.braintree.billingId) else (request.billing = billing)
        if u.braintree.shippingAddressId then (request.shippingAddressId = u.braintree.shippingId) else (request.shipping = shipping)

        gateway.transaction.sale request, (err, result) ->
            return res.send 500, {err: err} if err

            u.braintree.billingId = result.transaction.billing.id if result.transaction and result.transaction.billing
            u.braintree.customerId = result.transaction.customer.id if result.transaction and result.transaction.customer
            u.braintree.shippingId = result.transaction.shipping.id if result.transaction and result.transaction.shipping
            u.braintree.riskDataId = result.transaction.riskData.id if result.transaction and result.transaction.riskData

            transaction.orderNumber = result.transaction.id if result.transaction
            transaction.status = result.transaction.status if result.transaction
            transaction.escrowStatus = result.transaction.escrowStatus if result.transaction

            if result.success
                transaction.save (err) ->
                    return res.send 500, {err: err} if err

                    u.save (err) ->
                        return res.send 500, {err: err} if err
                        return res.send 500, {err: 'Missing braintree transaction ID'} unless result.transaction.id
                        estimate.braintreeTransaction = result.transaction.id

                        p.save (err) ->
                            return res.send 500, {err: err} if err
                            return res.send {user: u, project: p, braintree: result} unless MF.properties.env is 'development'

                            # in dev env, set the transaction as settled immediately (or wait a few hours to test)
                            gateway.testing.settle result.transaction.id, (err, settleResult) ->
                                return res.send 500, {err: err} if err
                                transaction.status = settleResult.transaction.status
                                transaction.save (err) ->
                                    return res.send 500, {err: err} if err
                                    return res.send {user: u, project: p, braintree: result, settleResult: settleResult}
            else
                errs = result.errors.deepErrors()
                u.save (err) ->
                    return res.send 500, {err: err} if err
                    return res.send 500, {user: u, err: 'Braintree verification failed', braintreeErrors: errs}

exports.createTransaction = (req, res, next) ->
    console.log 'deprecated'
    # return res.send(403) unless req.user and req.user.braintree.hasAccount
    return res.send 403, {err: 'Not logged in'} unless req.user
    return res.send 403, {err: 'No associated braintree account'} unless req.user.braintree.hasAccount
    unless req.body.merchantAccountId and req.body.amount and req.body.payment_method_nonce
        return res.send 400, {err: 'Missing required fields', body: req.body}

    u = req.user
    amount = util.centsToDollars req.body.amount, false
    nonce = req.body.payment_method_nonce
    serviceFee = util.centsToDollars 0.2 * parseInt(req.body.amount), false # 20% service fee

    u.createTransaction -(amount), req.body.projectId, 'new braintree transaction', null, null, (err) ->
        transaction = u.transactions.last()

        request =
            amount: amount.toString()
            orderId: transaction._id.toString()
            merchantAccountId: req.body.merchantAccountId # the account Id belonging to the mechanic
            paymentMethodNonce: nonce
            customer:
                firstName: req.body.customerFirst || u.first
                lastName: req.body.customerLast || u.last
                company: req.body.customerCompany
                phone: req.body.customerPhone || u.phone.number
                fax: req.body.customerFax
                website: req.body.customerWebsite
                email: req.body.customerEmail || u.email
            options:
                submitForSettlement: true
                holdInEscrow: true
            serviceFeeAmount: serviceFee.toString()

        billing =
            firstName: req.body.billingFirst || req.body.customerFirst || u.first
            lastName: req.body.billingLast || req.body.customerLast || u.last
            company: req.body.billingCompany || req.body.customerCompany
            streetAddress: req.body.billingAddress1 || u.billing.primary
            extendedAddress: req.body.billingAddress2 || u.billing.secondary
            locality: req.body.billingLocality || u.billing.city
            region: req.body.billingRegion || u.billing.state
            postalCode: req.body.billingPostalCode || u.billing.zip
            countryCodeAlpha2: req.body.billingCountryCode
        shipping =
            firstName: req.body.shippingFirst || req.body.billingFirst || req.body.customerFirst || u.first
            lastName: req.body.shippingLast || req.body.billingLast || req.body.customerLast || u.last
            company: req.body.shippingCompany || req.body.billingCompany || req.body.customerCompany
            streetAddress: req.body.shippingAddress1 || req.body.billingAddress1 || u.billing.primary
            extendedAddress: req.body.shippingAddress2 || req.body.billingAddress2 || u.billing.secondary
            locality: req.body.shippingLocality || req.body.billingLocality || u.billing.city
            region: req.body.shippingRegion || req.body.billingRegion || u.billing.state
            postalCode: req.body.shippingPostalCode || req.body.billingPostalCode || u.billing.zip
            countryCodeAlpha2: req.body.shippingCountryCode || req.body.billingCountryCode

        if u.braintree.billingAddressId then (request.billingAddressId = u.braintree.billingId) else (request.billing = billing)
        if u.braintree.shippingAddressId then (request.shippingAddressId = u.braintree.shippingId) else (request.shipping = shipping)

        gateway.transaction.sale request, (err, result) ->
            u.transactions.pop() if err or not result.success # if err then remove the added transaction?
            return res.send 500, {err: err} if err

            u.braintree.billingId = result.transaction.billing.id if result.transaction and result.transaction.billing
            u.braintree.customerId = result.transaction.customer.id if result.transaction and result.transaction.customer
            u.braintree.shippingId = result.transaction.shipping.id if result.transaction and result.transaction.shipping
            u.braintree.riskDataId = result.transaction.riskData.id if result.transaction and result.transaction.riskData

            transaction.orderNumber = result.transaction.id if result.transaction
            transaction.status = result.transaction.status if result.transaction
            transaction.escrowStatus = result.transaction.escrowStatus if result.transaction

            if result.success
                u.save (err) ->
                    return res.send 500, {err: err} if err
                    return res.send {user: u, braintree: result}
            else
                errs = result.errors.deepErrors()
                u.save (err) ->
                    return res.send 500, {err: err} if err
                    return res.send 500, {user: u, err: 'Unable to complete Braintree verification', braintreeErrors: errs}

exports.releaseEstimateTransaction = (req, res) ->
    return res.send 403, {err: 'Not logged in'} unless req.user
    return res.send 403, {err: 'No associated braintree account'} unless req.user.braintree.hasAccount
    return res.send 400, {err: 'Missing required fields', body: req.body} unless req.body.projectId and req.body.estimateId

    q = Project.findById req.body.projectId
    q.populate 'owner', 'username first last email phone'
    q.populate 'poster', 'username first last email phone'
    q.populate 'assigned', 'username first last email phone'
    q.populate 'vehicle'
    q.exec (err, p) ->
        return res.send 500, {err: err} if err
        return res.send 404, {err: 'Project not found'} unless p

        estimate = p.bids.id req.body.estimateId
        return res.send 404, {err: 'Estimate not found'} unless estimate
        return res.send 500, {err: 'Estimate has no braintree transaction'} unless estimate.braintreeTransaction

        u = req.user
        Transaction.findOne {orderNumber: estimate.braintreeTransaction}, (err, t) ->
            return res.send 500, {err: err} if err
            return res.send 404, {err: 'Transaction not found'} unless t
            gateway.transaction.releaseFromEscrow estimate.braintreeTransaction, (err, result) ->
                return res.send 500, {err: err} if err or not result
                if result.transaction?.status and result.transaction?.escrowStatus
                    t.status = result.transaction.status
                    t.escrowStatus = result.transaction.escrowStatus

                if result.success
                    estimate.state = 'released'
                    estimate.date_released = new Date()
                    t.save (err) ->
                        return res.send 500, {err: err} if err

                        lastOneDone = true
                        for bid in p.bids
                            unless bid.state in ['retracted', 'canceled', 'released', 'refunded']
                                lastOneDone = false
                                break

                        p.state = 'finished' if lastOneDone

                        p.save (err) ->
                            return res.send 500, {err: err} if err

                            finished = if p.state is 'finished' then p.title + ' Complete! ' else ''

                            options =
                                to: p.assigned
                                message: finished + req.user.username + ' has released their  payment on your estimate'
                                priority: 1
                                href: '/projects/' + p._id.toString()

                            Notification.generate options, (err, n) ->
                                console.log err if err

                            res.email
                                template: 'projects/payment-released'
                                to: p.assigned
                                subject: p.owner.username + ' has released your payment'
                                data:
                                    project: p
                                    estimate: estimate
                                    hrefs:
                                        home: 'https://' + MF.properties.self.host
                                        image: 'https://' + MF.properties.self.host + '/static/img/mechfinder-logo-beta.png'
                                        project: 'https://' + MF.properties.self.host + '/projects/' + p._id
                                        findProjects: 'https://' + MF.properties.self.host + '/projects'
                                        rateCustomer: 'https://' + MF.properties.self.host + '/projects/' + p._id + '?rateCustomer=true'
                            
                            if lastOneDone
                                options = 
                                    to: req.user._id
                                    message: 'Congrats on completing ' + p.title + '!'
                                    priority: 1
                                    href: '/projects/' + p._id.toString()
                                
                                Notification.generate options, (err, n) ->
                                    console.log err if err

                            return res.send {user: req.user, estimate: estimate, braintree: result}
                else
                    braintreeErrors = result.errors.deepErrors()
                    p.save (err) ->
                        return res.send 500, {err: err} if err
                        return res.send 500, {err: 'Braintree error', user: u, project: p, braintreeErrors: braintreeErrors, escrowStatus: t.escrowStatus }


exports.releaseTransaction = (req, res) ->
    console.log 'deprecated'
    return res.send 403, {err: 'Not logged in'} unless req.user
    return res.send 403, {err: 'No associated braintree account'} unless req.user.braintree.hasAccount
    u = req.user
    u.findTransactionByOrderNumber req.body.transactionId, (err, transaction) ->
        return res.send(500, err) if err
        gateway.transaction.releaseFromEscrow req.body.transactionId, (err, result) ->
            transaction.status = result.transaction.status if result.transaction
            transaction.escrowStatus = result.transaction.escrowStatus if result.transaction
            u.save (err) ->
                return res.send(500, err) if err
                return res.send(result)

exports.refundTransaction = (req, res) ->
    console.log 'deprecated'
    return res.send 403, {err: 'Not logged in'} unless req.user
    return res.send 403, {err: 'No associated braintree account'} unless req.user.braintree.hasAccount
    gateway.transaction.refund req.body.transactionId, req.body.amount, (err, result) ->
        return res.send(500, err) if err
        return res.send(result)
