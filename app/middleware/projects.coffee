{Project} = require('../models')

module.exports = ->
    (req, res, next) ->
        Project.count (err, total_projects) ->
            return res.send 500, err if err
            res.locals.total_projects_count = total_projects
            return next() unless req.user and not req.xhr
            req.user.count_active_projects (err, active_projects) ->
                return res.send 500, err if err
                res.locals.active_projects_count = active_projects
                req.user.count_finished_projects (err, finished_projects) ->
                    return res.send 500, err if err
                    res.locals.finished_projects_count = finished_projects
                    next()
