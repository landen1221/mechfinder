mongoose = require('mongoose')
Numeric  = require('./types/numeric')

Vehicle = {
    owner: { type: mongoose.Schema.Types.ObjectId, ref: 'user' }
    make:         { type: String, trim: true }
    model:        { type: String, trim: true }
    year:         { type: Number }
    engine:       { type: String, trim: true }
    active:       { type: Boolean, default: true }
    mileage:      Numeric(min: 0, max: 10000000)
}

module.exports = mongoose.model('vehicle', Vehicle)
