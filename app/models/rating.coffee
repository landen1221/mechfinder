mongoose = require 'mongoose'

Rating = new mongoose.Schema
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'user' }
    rating: { type: Number, default: 2 } # rating by user from 1 to 3 (sad face, meh face, happy face)
    message: { type: String, default: '', trim: true }
    date: { type: Date, default: -> new Date() }

module.exports = mongoose.model 'rating', Rating
