async = require('async')
fs = require('fs')
path = require('path')
coffee = require('coffee-script')
{compile_js, compile_less} = require('./views')
{visitFolder, watchFile, watchFolder} = require('./util')

lessFiles = exports.lessFiles = {
    '/static/styles/site.css': 'public/styles/site.less'
    '/static/styles/admin.css': 'public/styles/admin.less'
}

jsFiles = exports.jsFiles = {
    '/static/js/master.js': [
        'public/lib/jquery.min.js'
        'public/lib/jquery-ui.min.js'
        'public/lib/moment.js'
        'public/lib/chart.js'
        'public/lib/jquery.form.js'
        'public/lib/jquery-validation/jquery.validate.js'
        'public/lib/touchTouch.jquery.js'
        'public/lib/jquery.countdown.js'
        'public/lib/jquery.flexisel.js'
        'public/js/util.js'
        'public/js/global.js'
        'public/lib/braintree.js'
        'public/lib/socket.io.js'
        'public/js/zonify.js'
        'public/js/datepicker.js'
        'public/js/scrollto.js'
    ]
    '/static/js/admin.js': [
        'public/lib/jquery.min.js'
        'public/js/util.js'
        'public/lib/braintree.js'
        'public/js/zonify.js'
    ]
    '/static/js/navbar.js': [
        'public/js/navbar.js'
    ]
    '/static/js/inbox.js': [
        'public/js/inbox.js'
    ]
    '/static/js/moreInfoMechanic.js': [
        'public/js/moreInfoMechanic.js'
    ]
    '/static/js/moreInfoCustomer.js': [
        'public/js/moreInfoCustomer.js'
    ]
    '/static/js/signup.js': [
        'public/js/signup.js'
    ]
    '/static/js/internal.js': [
        'public/js/internal.js'
    ]
    '/static/js/handlebars.js': [
        'public/lib/handlebars/handlebars.js'
    ]
    '/static/js/geo.js': [
        'public/js/geo.js'
    ]
    '/static/js/dashboard.js': [
        'public/js/dashboard.js'
    ]
    '/static/js/favorites-page.js': [
        'public/js/favorites-page.js'
    ]
    '/static/js/accounting.js': [
        'public/js/accounting.js'
    ]
    '/static/js/mechanic-profile.js': [
        'public/js/mechanic-profile.js'
    ]
    '/static/js/personal-profile.js': [
        'public/js/personal-profile.js'
    ]
    '/static/js/vehicle-profile.js': [
        'public/js/vehicle-profile.js'
    ]
    '/static/js/modal-handler.js': [
        'public/js/modal-handler.js'
    ]
    '/static/js/search-pages.js': [
        'public/js/search-pages.js'
    ]
    '/static/js/project-estimates-view.js': [
        'public/js/project-estimates-view.js'
    ]
    '/static/js/project-estimates-seller.js': [
        'public/js/project-estimates-seller.js'
    ]
    '/static/js/project-estimates-buyer.js': [
        'public/js/project-estimates-buyer.js'
    ]
    '/static/js/review-project.js': [
        'public/js/review-project.js'
    ]
    '/static/js/review-project-seller.js': [
        'public/js/review-project-seller.js'
    ]
    '/static/js/project-estimates-hire.js': [
        'public/js/project-estimates-hire.js'
    ]
    '/static/js/project-estimates-hired.js': [
        'public/js/project-estimates-hired.js'
    ]
    '/static/js/contact.js': [
        'public/js/contact.js'
    ]
    '/static/js/filedrop.js': [
        'public/js/filedrop.js'
    ]
    '/static/js/post-project.js': [
        'public/js/post-project.js'
    ]
    '/static/js/edit-project.js': [
        'public/js/edit-project.js'
    ]
    '/static/js/recover.js': [
        'public/js/recover.js'
    ]
    '/static/js/vehicle-filter.js': [
        'public/js/vehicle-filter.js'
    ]
    '/static/js/modal.js' : [
        'public/js/modal.js'
    ]
    '/static/js/chat.js': [
        'public/js/chat.js'
    ]
    '/static/js/notifications.js': [
        'public/js/notifications.js'
    ]
    '/static/js/faq-page.js': [
        'public/js/faq-page.js'
    ]
    '/static/js/tooltips.js': [
        'public/js/tooltips.js'
    ]
    '/static/js/favorites-listener.js': [
        'public/js/favorites-listener.js'
    ]
    '/static/js/public-profile.js': [
        'public/js/public-profile.js'
    ]
    '/static/js/gallery.js': [
        'public/js/gallery.js'
    ]
    '/static/js/searchable-dropdown.js': [
        'public/js/searchable-dropdown.js'
    ]
    '/static/js/mf-mixpanel.js': [
        'public/js/mf-mixpanel.js'
    ]

    '/static/js/admin/users-table.js': [
        'public/js/admin/users-table.js'
    ]
    '/static/js/admin/projects-table.js': [
        'public/js/admin/projects-table.js'
    ]
    '/static/js/admin/estimates-table.js': [
        'public/js/admin/estimates-table.js'
    ]
    '/static/js/project-estimates-dispute.js': [
        'public/js/project-estimates-dispute.js'
    ]
    '/static/js/admin/cms.js': [
        'public/js/admin/cms.js'
    ]
    '/static/js/admin/holla.js': [
        'public/js/admin/holla.js'
    ]
    '/static/js/admin/tickets.js': [
        'public/js/admin/tickets.js'
    ]
    '/static/js/admin/admin-controls-referral.js': [
        'public/js/admin/admin-controls-referral.js'
    ]
    '/static/js/admin/admin-role-switch.js': [
        'public/js/admin/admin-role-switch.js'
    ]
    '/static/js/admin/user-discounts.js': [
        'public/js/admin/user-discounts.js'
    ]
    '/static/lib/stacktable/mf-stacktable.js': [
        'public/lib/stacktable/mf-stacktable.js'
    ]
}

js = (files, options) ->

    cache = null
    (compile = ->
        compile_js files, options, (err, data) ->
            return console.log("Error compiling static javascript, #{err}") if err
            cache = data
    )()

    # watch for changes
    if options?.watch
        async.each files, (i, next) ->
            next()
            watchFile i, (change, i) ->
                console.log "  .. Change in #{i}, recompiling..."
                compile() unless change is 'deleted'


    (req, res) ->
        res.type 'js'
        res.set 'Content-Encoding', 'gzip' if typeof cache isnt 'string'
        res.send cache

less = (file, options) ->

    cache = null
    (compile = ->
        compile_less file, options, (err, data) ->
            return console.log("Error compiling static css, #{file}: #{err}") if err
            cache = data
    )()

    # watch for changes
    if options?.watch
        watchFolder path.dirname(file),
            (i, s) -> s.isDirectory() or (s.size > 0 and path.extname(i) is '.less')
            (event, i) ->
                console.log "  .. Change in #{i}, recompiling #{file}..."
                compile()

    (req, res) ->
        res.type 'css'
        res.set 'Content-Encoding', 'gzip' if typeof cache isnt 'string'
        res.send cache

pathToStatic = (url) -> path.normalize(path.join(process.cwd(), '.build', url))

makeFolders = (folder, next) ->
    async.reduce(
        x for x in (folder.split(path.sep)) when x,
        '/',
        (memo, part, next) ->
            memo = path.join(memo, part)
            fs.exists memo, (exists) ->
                return next(null, memo) if exists
                fs.mkdir memo, (err) -> next(null, memo)
        (err) -> next(err)
    )

exports.build = (next) ->

    async.parallel [

        # build static css files
        (next) ->
            async.eachSeries (x for x, y of lessFiles),
                (url, next) ->
                    input = lessFiles[url]
                    output = pathToStatic(url)
                    console.log "Compiling #{input} to #{output}"
                    compile_less input, { minify: true, compress: true }, (err, data) ->
                        return next(err) if err
                        makeFolders path.dirname(output), (err) ->
                            return next(err) if err
                            fs.writeFile output, data, (err) ->
                                next(err)
                (err) ->
                    console.log "Error compiling less files: #{err}" if err
                    next(err)

        # build static js files
        (next) ->
            async.eachSeries (x for x, y of jsFiles),
                (url, next) ->
                    input = jsFiles[url]
                    output = pathToStatic(url)
                    console.log "Compiling #{input.length} files to #{output}"
                    compile_js input, { minify: true, compress: true }, (err, data) ->
                        return next(err) if err
                        makeFolders path.dirname(output), (err) ->
                            return next(err) if err
                            fs.writeFile output, data, (err) ->
                                next(err)
                (err) ->
                    console.log "Error compiling js files: #{err}" if err
                    next(err)

        # build application coffee files
        (next) ->
            visitFolder 'app',
                (f, s) -> s.isDirectory() or (s.size > 0 and path.extname(f) is '.coffee')
                (f, s, next) ->
                    output = path.join(process.cwd(), '.build', path.dirname(f), path.basename(f, '.coffee') + '.js')
                    fs.readFile f, 'utf8', (err, data) ->
                        return next(err) if err
                        try
                            data = coffee.compile(data)
                        catch err
                            console.log "#{f}:#{err.location.first_line} #{err}"
                            next(err)

                        makeFolders path.dirname(output), (err) ->
                            return next(err) if err
                            fs.writeFile output, data, next
                next
        ],
        (err) -> next(err)

serve = (app, url, type) ->
    cache = null
    fs.readFile pathToStatic(url), (err, data) -> cache = data
    app.get url, (req, res) ->
        res.type type
        res.set 'Content-Encoding', 'gzip'
        res.send cache

exports.apply = (app) ->
    # build options for css and javascript compilers

    # I'm not quite sure what this is supposed to do. I'm assuming it avoids recompiling changes on the fly ~ Marcus
    
    # if app.get('env') is 'production'
    #     console.log 'environment is production'
    #     # serve from static files
    #     serve(app, url, 'css') for url, file of lessFiles
    #     serve(app, url, 'js') for url, file of jsFiles
    #     return

    # service content dynamically compiled
    opts =
        watch:    true
        minify:   false
        compress: false
    app.get(url, less(file, opts)) for url, file of lessFiles
    app.get(url, js(files, opts)) for url, files of jsFiles
