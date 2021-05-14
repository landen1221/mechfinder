{union, COUNTRIES, STATES} = require('../util')
{Article} = require('../models')
Content = require('../models/content')

exports.terms = (req, res) -> 
    res.render 'content/terms',
        layout: 'layouts/info'
        user: req.user
        head:
            meta:
                title: 'Terms & Conditions'
                description: 'MechFinder Terms and Conditions.'
                keywords: 'MechFinder Terms, Mechfinder Conditions, MechFinder Terms and Conditions'

exports.about = (req, res) ->
    Content.findById '57ed436e2c1b32b91e00000f', (err, content) ->
        return res.send 500, {err: err} if err
        return res.send 404, {err: 'Content not found'} unless content
        res.render 'content/about',
            layout: 'layouts/info'
            user: req.user
            content: content
            head:
                meta:
                    title: 'About Us'
                    description: 'Learn about MechFinder and the MechFinder Team.'
                    keywords: 'MechFinder Team, MechFinder Founders, MechFinder Management Team'

exports.contact = (req, res) ->
    res.render 'content/contact',
        layout: null
        user: req.user
        head:
            meta:
                title: 'Contact Us'
                description: 'Contact the MechFinder Support Team.'
                keywords: 'MechFinder Support, MechFinder Contact Information, MechFinder Address, MechFinder Email, Mechfinder Phone'

exports.privacy = (req, res) ->
    Content.findById '57ead7a0e65207aa343d84a1', (err, content) ->
        return res.send 500, {err: err} if err
        return res.send 404, {err: 'Content not found'} unless content
        res.render 'content/privacy',
            layout: 'layouts/info'
            user: req.user
            content: content
            head:
                meta:
                    title: 'Privacy Policy'
                    description: 'We take our customers\' privacy very seriously.  Please check out the MechFinder privacy policy.'
                    keywords: 'MechFinder Privacy Privacy'

exports.buyer = {}
exports.seller = {}

exports.seller.how = (req, res) ->
    res.render 'content/how-it-works-mechanic',
        layout: 'layouts/info'
        infoRole: 'seller'
        user: req.user
        head:
            meta:
                title: 'How it Works for Mechanics Explained'
                description: 'Mechanics make extra money on the side or full time on their own schedule.  Mechanics submit estimates and work directly with customers building their reputation and customer base.'
                keywords: 'make more money as a mechanic, how to fix cars for cash, mobile mechanics'

exports.seller.grow = (req, res) ->
    res.render 'content/grow-business',
        layout: 'layouts/info'
        infoRole: 'seller'
        user: req.user
        head:
            meta:
                title: 'Mechanics Earn Money and Grow Your Businesses on Your Own Schedule'
                description: 'MechFinder makes it easy to earn money fixing cars on your schedule. With so many customers in [metro_area_variable], there’s opportunity at every turn.'
                keywords: 'phoenix car mechanics, mechanic jobs, mobile mechanic'

exports.seller.structure = (req, res) ->
    res.render 'content/fee-structure',
        layout: 'layouts/info'
        infoRole: 'seller'
        user: req.user
        head:
            meta:
                title: 'How You Earn Money as a Mechanic'
                description: 'Here are the nuts and bolts of how to make money as a mechanic with MechFinder.'
                keywords: 'MechFinder fees, how does MechFinder pay me, how to earn money'

exports.buyer.how = (req, res) ->
    res.render 'content/how-it-works-customer',
        layout: 'layouts/info'
        infoRole: 'buyer'
        user: req.user
        head:
            meta:
                title: 'How it Works for Customers Explained'
                description: 'Customers post a job for local mechanics to place estimates on. The customer then chooses the estimate and mechanic that is the best fit for their needs.'
                keywords: 'how MechFinder works, how mobile mechanics work, mobile mechanics'

exports.buyer.benefits = (req, res) ->
    res.render 'content/benefits',
        layout: 'layouts/info'
        infoRole: 'buyer'
        user: req.user
        head:
            meta:
                title: 'The Best Way to Fix Your Car',
                description: 'MechFinder is a one-stop shop for all your vehicle needs, find top rated mechanics who specialize in your vehicle\'s brand and service required.'
                keywords: 'auto shop you can trust, cheap car repairs, customer satisfaction ratings'

exports.buyer.protection = (req, res) ->
    res.render 'content/customer-protection',
        layout: 'layouts/info'
        infoRole: 'buyer'
        user: req.user
        head:
            meta:
                title: 'Secure Payment Protection &amp; Customer Privacy Policy'
                description: 'Our partnership with Braintree provides secure and safe payment gateway solutions as a subsidiary of PayPal for both our customers and mechanics.'
                keywords: 'secure payments for repairs, privacy protection for customers information, protect your information online'
    
exports.faq = (req, res) -> 
    res.render 'content/faq',
        layout: 'layouts/info'
        user: req.user
        head:
            meta:
                title: 'Frequently Asked Questions About Mobile Mechanics'
                description: 'Mobile Mechanics are self-employed mechanics who come to you to perform routine maintenance and auto repairs, Learn all about how it\'s better and easier for you here.'
                keywords: 'frequently asked questions, how MechFinder works, what to know about MechFinder'

exports.faq.question = (req, res) ->
    if req.params.id
        res.render 'content/faq',
            questionId: req.params.id
            layout: 'layouts/info'
            user: req.user
    else
        res.render 'content/faq',
            layout: 'layouts/info'
            user: req.user
