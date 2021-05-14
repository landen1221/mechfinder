
module.exports = () ->
    (req, res, next) ->
        return res.send 404, {err: 'Page not found'} unless req.user and req.user.role is 'admin'
        next()