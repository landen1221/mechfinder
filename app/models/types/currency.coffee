{union} = require('../../util')

defaults =
  type: Number
  min: 0
  default: 0
  set: (v) ->
    if (typeof v == 'string' and v.length > 1 and v[0] == '$')
      return parseInt(Math.round(parseFloat(v.substr(1).replace(/,/g, ''))))
    else
      return if v then parseInt(Math.round(v)) else 0

module.exports = (opts) -> union(defaults, opts)
