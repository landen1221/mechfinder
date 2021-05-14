mongoose = require('mongoose')
{union} = require('../../util')

defaults =
  type: mongoose.Schema.Types.ObjectId
  ref: 'image'
  set: (v) ->
    return null if typeof v is 'string' and v.length is 0 
    v
    
module.exports = (opts) -> union(defaults, opts)
