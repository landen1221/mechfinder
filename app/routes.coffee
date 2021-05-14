controllers =
    admin:    require('./controllers/admin')
    home:     require('./controllers/home')
    profile:  require('./controllers/profile')
    project:  require('./controllers/project')
    search:   require('./controllers/search')
    content:     require('./controllers/content')

api =
    ad:       require('./api/advertise')
    admin:      require('./api/admin')
    chat:     require('./api/chat')
    login:    require('./api/login')
    public:   require('./api/public')
    dispute:  require('./api/dispute')
    ticket:   require('./api/ticket')
    geo:      require('./api/geo')
    makes:    require('./api/makes')
    project:  require('./api/project')
    paypal:  require('./api/paypal')
    event:    require('./api/event')
    profile:  require('./api/profile')
    mail:     require('./api/mail')
    braintree: require('./api/braintree')
    verify:   require('./api/verify')
    search:   require('./api/search')
    conversation: require('./api/conversation')
    notify: require('./api/notify')
    rating: require('./api/rating')
sitemap =     require('sitemap')
{Article} =   require('./models')
Meta =        require('./models/meta')('meta.json')
{merge} =     require('./util')

exports.register = (app) ->
    # facebook auth
    app.get  '/auth/facebook',             api.login.facebook
    app.get  '/auth/facebook/callback',    api.login.fbcallback

    # public controllers
    app.get  '/',                   controllers.home.welcome
    app.get  '/home/mechanic',      controllers.home.welcomeMechanics
    app.get  '/signup',             controllers.home.signup
    app.get  '/signup/invite',      controllers.home.signupInvite
    app.get  '/recover/:id',        controllers.home.recover

    # user controllers
    app.get  '/activate/:id',           controllers.profile.activate
    app.get  '/profile',                controllers.profile.profile
    app.get  '/profile/:id',            controllers.profile.view
    app.get  '/profile/:id/personal',   controllers.profile.personal
    app.get  '/profile/:id/accounting', controllers.profile.accounting
    app.get  '/profile/:id/vehicles',   controllers.profile.vehicles
    app.get  '/profile/:id/mechanic',   controllers.profile.mechanicPersonal
    app.get  '/profile/:id/public',     controllers.profile.publicProfile

    # search controllers
    app.get  '/mechanics',      controllers.search.mechanics
    app.get  '/projects',       controllers.search.projects
    # app.get  '/projects/:region', controllers.search.projectsRegion
    app.get  '/my/favorites',   controllers.search.favorites

    # project controllers
    app.get  '/projects/post',          controllers.project.post
    app.get  '/projects/post/quick',    controllers.project.quickPost
    app.get  '/projects/post/quick/d',  controllers.project.quickPostD
    app.get  '/projects/:id/quickCopy', controllers.project.quickCopy
    app.get  '/projects/:id',           controllers.project.view
    app.get  '/projects/:id/edit',      controllers.project.edit
    app.get  '/projects/:id/review',    controllers.project.review
    app.get  '/my/projects',            controllers.project.mine

    # static content
    app.get  '/terms',      controllers.content.terms
    app.get  '/about',      controllers.content.about
    app.get  '/contact',    controllers.content.contact
    app.get  '/privacy',    controllers.content.privacy

    app.get  '/machanic/info',              controllers.content.seller.how
    app.get  '/mechanic/info/howItWorks',   controllers.content.seller.how
    app.get  '/mechanic/info/grow',         controllers.content.seller.grow
    app.get  '/mechanic/info/structure',    controllers.content.seller.structure

    app.get  '/info',                       controllers.content.buyer.how
    app.get  '/customer/info',              controllers.content.buyer.how
    app.get  '/customer/info/howItWorks',   controllers.content.buyer.how
    app.get  '/customer/info/benefits',     controllers.content.buyer.benefits
    app.get  '/customer/info/protection',   controllers.content.buyer.protection
    
    app.get  '/faq',        controllers.content.faq
    app.get  '/faq/:id',    controllers.content.faq.question

    # conversation api
    app.post    '/api/conversation/start',              api.conversation.start
    app.post    '/api/conversation',                    api.conversation.send
    app.post    '/api/conversation/see',                api.conversation.see
    app.get     '/api/conversations',                   api.conversation.get
    app.get     '/api/conversation/:id',                api.conversation.getConversation
    app.get     '/api/conversation/messages/:id',       api.conversation.messages
    app.get     '/api/conversation/messages/:id/:skip', api.conversation.messages

    # notify api
    app.get     '/api/notifications',           api.notify.get
    app.get     '/api/notifications/:skip',     api.notify.get
    app.post    '/api/notifications/see',       api.notify.see
    app.post    '/api/notifications/click/:id', api.notify.click
    app.post    '/api/notifications/clear',     api.notify.clear

    # search
    app.post '/api/findprojects',   api.search.findprojects
    app.post '/api/findfavorites',  api.search.findfavorites
    app.post '/api/findmechanics',  api.search.findmechanics

    # make/model/year api
    app.get  '/api/makes/:mk/:md/:yr',  api.makes.makes
    app.get  '/api/makes/:mk/:md',      api.makes.makes
    app.get  '/api/makes/:mk',          api.makes.makes
    app.get  '/api/makes',              api.makes.makes


    app.post '/api/paypal/ipn',     api.paypal.ipn
    app.post '/api/paypal/ipn2',    api.paypal.ipn2

    # projects
    app.post '/api/project',                        api.project.post
    app.post '/api/project/:id',                    api.project.update
    app.post '/api/project/:id/requestPayment',     api.project.requestPayment
    app.post '/api/project/:id/requestEstimate',    api.project.requestEstimate
    app.post '/api/project/:id/requestMoreInfo',    api.project.requestMoreInfo
    app.post '/api/project/:id/publish',            api.project.publish
    app.post '/api/project/:id/draft',              api.project.draft
    app.post '/api/project/:id/sendDraft',          api.project.sendDraft
    app.del  '/api/project/:id',                    api.project.remove
    app.post '/api/newproject/:id',                 api.project.welcomeproject
    app.post '/api/project/:id/bid',                api.project.bid
    app.post '/api/project/:id/retractBid',         api.project.retractBid
    app.post '/api/project/:id/comment',            api.project.comment
    app.post '/api/project/:id/hire',               api.project.hire
    app.post '/api/milestones/:id/release',         api.project.release
    app.post '/api/milestones/:id/reqrelease',      api.project.reqrelease
    app.post '/api/milestones/:id/cancel',          api.project.cancelmilestone

    app.post '/api/project/:id/hirefromcard',   api.project.chargesaved, api.project.chargecharges, api.project.hire
    app.post '/api/project/:id/hireandcharge',  api.project.chargestripe, api.project.chargecharges, api.project.hire
    app.get  '/api/projects/:id/hire/:bid',         api.project.hirepaypal, api.project.hire
    app.post '/api/project/:id/meetup',    api.project.meetup
    app.post '/api/project/:id/rate',      api.project.rate

    app.post '/api/project/:id/escrow',      api.project.escrow
    app.post '/api/project/:id/createscrow',      api.project.escrowstripe
    app.post '/api/project/:id/createscrowfromsaved',      api.project.escrowsaved
    app.post '/api/project/:id/escrowfrombalance',   api.project.escrowfrombalance

    app.post '/api/project/:id/end',       api.project.end
    app.post  '/api/project/:id/reveal',       api.project.reveal
    app.post '/api/project/:id/cancel',    api.project.cancel
    app.post '/api/project/:id/initiate-dispute', api.project.initiate_dispute
    app.post '/api/project/:id/cancel-dispute',   api.project.cancel_dispute

    # disputes
    app.post  '/api/disputes',                  api.dispute.new
    app.post  '/api/disputes/:id/message',                  api.dispute.message
    app.post  '/api/disputes/:id/cancel',                  api.dispute.cancel
    app.post  '/api/disputes/:id/accept',                  api.dispute.accept

    # tickets
    app.post '/api/ticket', api.ticket.post

    # ratings api
    app.post '/api/rating', api.rating.rate

    # payments
    app.post '/api/braintree/createUser',       api.braintree.createUser
    app.post '/api/braintree/updateUser',       api.braintree.updateUser
    app.del '/api/braintree/deleteUser',       api.braintree.deleteUser
    app.post '/api/braintree/createMerchant',       api.braintree.createMerchant
    app.get '/api/braintree/merchantAccount',       api.braintree.merchantAccount
    app.post '/api/braintree/updateMerchant',       api.braintree.updateMerchant
    app.get '/api/braintree/clientToken',       api.braintree.clientToken
    app.post '/api/braintree/createTransaction',       api.braintree.createTransaction#, api.project.populateCharges#, api.project.hire
    app.post '/api/braintree/createPaymentMethod',      api.braintree.createPaymentMethod
    app.post '/api/braintree/createEstimateTransaction',    api.braintree.createEstimateTransaction
    app.post '/api/braintree/releaseEstimateTransaction',   api.braintree.releaseEstimateTransaction
    app.post '/api/braintree/releaseTransaction',       api.braintree.releaseTransaction
    app.post '/api/braintree/refundTransaction',       api.braintree.refundTransaction
    app.get  '/api/braintree/paymentMethods',           api.braintree.paymentMethods

    # phone verification
    app.post '/api/verify/sendToken',       api.verify.sendToken
    app.post '/api/verify/verifyToken',       api.verify.verifyToken


    # events
    app.get  '/api/event',                 api.event.list
    app.post '/api/event/:id/accept',      api.event.accept
    app.post '/api/event/:id/reject',      api.event.reject
    app.post '/api/event/:id/reschedule',  api.event.reschedule
    app.post '/api/event/:id/cancel',      api.event.cancel
    app.post '/api/event/:year/:month/:day/notes', api.event.notes

    # chat
    app.post '/api/chat',                  api.chat.send
    app.get  '/api/chat',                  api.chat.check
    app.post '/api/mail',                  api.mail.send

    # contact api
    app.post '/api/contact',               api.public.contact

    # image api
    app.get '/api/public/image/:id',                api.public.image
    app.get '/api/public/image/:id/data',           api.public.imageData
    app.post '/api/public/image',                   api.public.postImage

    # advertising api
    app.post '/api/advertise',             api.ad.advertise

    # geo api
    app.get  '/api/cities/:country/:state', api.geo.cities
    app.get  '/api/postal/:country/:postal', api.geo.postal
    app.get  '/api/geo',                   api.geo.get
    app.post '/api/geo',                   api.geo.update

    # login/signup api
    app.post '/api/verify/email',          api.login.verifyEmail
    app.post '/api/verify/email/:code',    api.login.verifyEmail
    app.post '/api/session',               api.login.login
    app.del  '/api/session',               api.login.logout
    app.get  '/api/signup/:email',         api.login.validate_email
    app.post '/api/recover',               api.login.recover
    app.post '/api/recover/reset',         api.login.recoverPassword
    app.post '/api/signup',                api.login.signup
    app.post '/api/reset',                 api.login.reset

    app.post '/api/profile',               api.profile.update
    app.post '/api/profile/favorites',     api.profile.favorites
    app.post '/api/profile/vehicle',       api.profile.addVehicle
    app.del  '/api/profile/vehicle',       api.profile.deleteVehicle
    app.put '/api/profile/vehicle',        api.profile.editVehicle




    # admin controllers
    app.get '/admin',               controllers.admin.home
    app.get '/admin/sellers',       controllers.admin.sellers
    app.get '/admin/buyers',        controllers.admin.buyers
    app.get '/admin/projects',      controllers.admin.projects
    app.get '/admin/project/:id',   controllers.admin.project
    app.get '/admin/user/:id',      controllers.admin.user
    app.get '/admin/logout',        controllers.admin.logout
    app.get '/admin/cms',           controllers.admin.cms
    app.get '/admin/holla',         controllers.admin.holla
    app.get '/admin/tickets',       controllers.admin.tickets

    # admin api
    app.get '/admin/api/test',      api.admin.test
    app.get '/admin/api/users',   api.admin.users
    app.get '/admin/api/projects',  api.admin.projects
    app.post '/admin/api/content', api.admin.content
    app.get '/admin/api/hollas', api.admin.hollas
    app.post '/admin/api/hollas/:id/acknowledge', api.admin.acknowledgeHolla
    app.get '/admin/api/tickets', api.admin.tickets
    app.post '/admin/api/tickets/:id', api.admin.updateTicket
    app.post '/admin/api/addContent', api.admin.addContent
    app.post '/admin/api/updateReferral', api.admin.updateReferral
    app.post '/admin/api/updateRole', api.admin.updateRole
    app.post '/admin/api/releaseEstimate', api.admin.releaseEstimate
    app.post '/admin/api/refundEstimate', api.admin.refundEstimate
    app.post '/admin/api/addDiscount', api.admin.addDiscount

    # deprecated methods
    app.post '/admin/api/vehicleActiveFix', api.admin.vehicleActiveFix # deprecated
    app.post '/admin/api/evolveBids', api.admin.evolveBids
    app.post '/admin/api/languageStuffz', api.admin.languageStuffz



    # generate the sitemap
    mapUrls = []
    for p in app.routes['get']
        if  p.path.indexOf(':')             is -1 and 
                p.path.indexOf('/api')      is -1 and
                p.path.indexOf('/static')   is -1 and
                p.path.indexOf('/admin')    is -1 and
                p.path.indexOf('/auth')     is -1 and
                p.path.indexOf('/profile')  is -1 and
                p.path.indexOf('/my')       is -1 and
                p.path.indexOf('/post')     is -1
            mapUrls.push {url: p.path}

    mapOptions = 
        hostname: 'https://' + MF.properties.self.host
        cacheTime: 600 * 1000
        urls: mapUrls

    map = sitemap.createSitemap mapOptions


    # serve the sitemap view
    nodes = []
    for url in map.urls
        nodes.push 
            path: url.url
            meta: Meta.find url.url
    
    app.get '/sitemap', (req, res) ->
        res.render 'content/sitemap',
            layout: 'layouts/info'
            nodes: nodes
            user: req.user
            meta:
                title: 'Sitemap'

    
    # serve the sitemap xml
    app.get '/sitemap.xml', (req, res) ->
        map.toXML (xml) ->
            res.header 'Content-Type', 'application/xml'
            res.send xml
