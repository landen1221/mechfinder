mongoose = require('mongoose')

make = new mongoose.Schema

    make:  { type: String, trim: true }
    model: { type: String, trim: true }
    year:  { type: Number }
    cylinders: { type: Number }

__makes = null
make.statics.find_makes = (next) ->
    return next(null, __makes) if __makes?
    this.aggregate(
        { $group: { _id: { make: '$make' } } },
        { $project: { _id: 0, make: '$_id.make' } },
        { $sort: { make: 1 } },
        (err, data) ->
            return next(err, null) if err
            __makes = (m.make for m in data)
            next(null, __makes)
    )

module.exports = mongoose.model('make', make)
