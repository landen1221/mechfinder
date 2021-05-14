
{Make} = require('../models')

exports.makes = (req, res) ->

    {mk, md, yr} = req.params
    
    if mk and md and yr
        return Make.aggregate(
            { $match: {  make: mk, model: md, year: parseInt(yr) } },
            { $group: { _id: { make: "$make", model: "$model", year: "$year", cylinders: "$cylinders" } } },
            { $project: { _id: 0, cylinders: '$_id.cylinders' } },
            { $sort: { cylinders: 1 } },
            (err, data) ->
                return res.send 500, "Failed to retrieve make/model/year data for query." if err
                res.send 200, (m.cylinders for m in data)
        )


    if mk and md
        return Make.aggregate(
            { $match: {  make: mk, model: md } },
            { $group: { _id: { make: "$make", model: "$model", year: "$year" } } },
            { $project: { _id: 0, year: '$_id.year' } },
            { $sort: { year: 1 } },
            (err, data) ->
                return res.send 500, "Failed to retrieve make/model/year data for query." if err
                res.send 200, (m.year for m in data)
        )
    if mk
        return Make.aggregate(
            { $match: { make: mk } },
            { $group: { _id: { make: "$make", model: "$model" } } },
            { $project: { _id: 0, model: '$_id.model' } },
            { $sort: { model: 1 } },
            (err, data) ->
                return res.send 500, "Failed to retrieve make/model/year data for query." if err
                res.send 200, (m.model for m in data)
        )
    
    Make.aggregate(
        { $group: { _id: { make: '$make' } } },
        { $project: { _id: 0, make: '$_id.make' } },
        { $sort: { make: 1 } },
        (err, data) ->
            return res.send 500, "Failed to retrieve make/model/year data for query." if err
            res.send 200, (m.make for m in data)
    )
    