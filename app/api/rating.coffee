Rating = require '../models/rating'

exports.rate = (req, res) ->
    return res.send 400, {err: 'User not logged in'} unless req.user
    return res.send 400, {err: 'Missing required properties'} unless req.body.rating

    rating = parseInt(req.body.rating) || -1
    message = req.body.message || ''

    return res.send 400, {err: 'Invalid number for rating'} unless rating >= 1 and rating <= 3

    rating = new Rating
        user: req.user._id
        rating: rating
        message: message
    
    rating.save (err) ->
        return res.send 500, {err: err} if err
        return res.send rating