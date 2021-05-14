mongoose = require('mongoose')

zipcode = new mongoose.Schema
    location:     [Number]
    city:         { type: String, trim: true, uppercase: true }
    state:        { type: String, trim: true, uppercase: true }
    postal:       { type: String, trim: true, unique: true }
    country:      { type: String, trim: true, enum: ['us', 'ca'] }

# add spatial index
zipcode.index(location: '2d')

zipcode.virtual('latitude').get -> @location?[1]
zipcode.virtual('longitude').get -> @location?[0]

zipcode.statics.get_cities_by_state = (country, state, next) ->
    # db.zipcodes.aggregate({$match: {state:"MN"}},{$group: { _id:"$city"}},{$sort:{_id:1}})
    this.aggregate(
        { $match: {
            country: rx = new RegExp(country, 'i'),
            state: rx = new RegExp(state, 'i') 
        } },
        { $group: { _id: "$city" } },
        { $sort: { _id: 1 } },
        { $project: { _id: 0, city: "$_id" } },
        next)

zipcode.statics.guess_zipcode = (country, state, city, next) ->
    this.find {
        country: country
        state: new RegExp(state, 'i')
        city: new RegExp(city, 'i')
    }, (err, zipcodes) ->
        return next(err) if err
        return next(null, null) unless zipcodes.length > 0
        next(null, zipcodes[0].postal)

module.exports = mongoose.model('zipcode', zipcode)
