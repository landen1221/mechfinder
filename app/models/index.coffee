
# mongoose models
exports.Tennent = require('./tennent')
exports.User = require('./user')
exports.Comment = require('./comment')
exports.Chat = require('./chat')
exports.Mail = require('./mail')
exports.Project = require('./project')
exports.Vehicle = require('./vehicle')
exports.Charge = require('./charge')
exports.Dispute = require('./dispute')
exports.Invoice = require('./invoice')
exports.Event = require('./event')
exports.Image = require('./image')
exports.Ad = require('./ad')
exports.Settings = require('./settings')

# read-only lookup data
exports.ZipCode = require('./zipcode')  # zip code based geolocation/geotagging
exports.Make = require('./make')        # vehicle make/model/year data

# non-mongo based models
exports.Article = require('./article')
