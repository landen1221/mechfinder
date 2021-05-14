{PROVIDERS, union, COUNTRIES, STATES} = require('../util')
{Project, User, Ad, Make} = require('../models')

Tooltip = require('../models/tooltip')

exports.welcome = (req, res) ->
    # return res.redirect('/profile') if req.session.user
    return res.redirect '/admin' if req.user and req.user.role is 'admin'
    return res.redirect '/profile/' + req.user._id if req.user

    res.render 'home/welcome',
        layout: null
        user: req.user
        head:
            meta:
                title: 'Mobile Mechanics for Auto Repairs and Maintenance'
                description: 'We\'re finding better ways for car owners to service, repair, and maintain their vehicles. Visit our site and find a highly rated mechanic near you,in minutes. Or, become a mechanic and earn money on your schedule.'
                keywords: 'automotive mobile mechanics, roadside assistance, premium customer experience'

exports.welcomeMechanics = (req, res) ->
    res.render 'home/welcome-mechanic',
        layout: null
        mechanicPage: true
        user: req.user
        head:
            meta:
                title: 'MechFinder Mobile Mechanics Login and Signup Page'
                description: 'Signup FREE with MechFinder and start earning cash fixing cars on your own schedule.  Take control of your income and schedule, and get paid what you are really worth!'
                keywords: 'mechanic jobs, mechanic work, earn money as a mechanic, get paid as a mechanic'

signup = (req, res, invite) ->
    invite = if typeof invite is 'boolean' then invite else false

    prefill = {}
    if req.query.source and req.query.source is 'facebook'
        prefill = 
            source: req.query.source
            facebookId: req.query.facebookId
            email: req.query.email
            first: req.query.first
            last: req.query.last

    return res.render 'home/signup',
        layout: null
        user: req.user
        prefill: prefill
        invite: invite
        head:
            meta:
                title: 'Get Started FREE With MechFinder Now!'
                description: 'Login or Signup to access MechFinder to view and edit your mechanic profile, communicate with clients, and browse local auto repair jobs in one easy to use mechanics center.'
                keywords: 'MechFinder Signup, get started, Signup, start with MechFinder'

exports.signup = (req, res) ->
    signup req, res, false

exports.signupInvite = (req, res) ->
    signup req, res, true

exports.recover = (req, res) ->
    return res.send 401, {err: true, message: 'Missing required id'} unless req.params.id
    return res.send 401, {err: true, message: 'Missing required key'} unless req.query.key

    User.findById req.params.id, (err, u) ->
        return res.send 500, {err: true} if err
        return res.send 500, {err: true} unless u
        # return res.send 401, {err: true, message: 'Invalid recovery key'} unless u.recoveryKey and u.recoveryKey.equals req.query.key
        # return res.send 401, {err: true, message: 'Recovery key expired'} unless ((new Date) - u.recoveryDate) < (1000 * 60 * 60 * 24)

        unless (u.recoveryKey and u.recoveryKey.equals req.query.key) and (new Date - u.recoveryDate < 1000 * 60 * 60 * 24)
            return res.render 'home/recover',
                layout: null
                err: true
                user: req.user
                head:
                    meta:
                        title: 'Account Recovery'

        return res.render 'home/recover',
            layout: null
            key: u.recoveryKey
            user: req.user
            head:
                meta:
                    title: 'Account Recovery'

# password reset function
exports.reset = (req, res) -> 
    return res.render 'home/reset', 
        email: req.body.email or req.query.email
        user: req.user
        head:
            meta:
                title: 'Password Reset'
