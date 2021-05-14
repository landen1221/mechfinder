(->
  settings = undefined
  mongoose = undefined
  mongoose = require("mongoose")
  settings = new mongoose.Schema(
    distance: Number
    paypalwfees:Number
    paypalpercentage:Boolean
    bankwfees:Number
    minimum:Number
    charge:Number
    bankpercentage:Boolean
    settingsid:
      type: Number
      default: 2
  )
  settings.statics.quickupdate = (setting, callback) ->
    console.log setting
    update = $set: {}
    update.$set.distance = setting.smsdistance
    update.$set.paypalwfees = setting.paypalwfees
    update.$set.paypalpercentage = setting.paypalpercentage
    update.$set.bankwfees = setting.bankwfees
    update.$set.minimum = setting.minimum
    update.$set.charge = setting.charge
    update.$set.bankpercentage = setting.bankpercentage
    q = settingsid: 1
    @findOneAndUpdate q, update,
      new: false
    , callback

  settings.statics.getsettings = (callback) ->
    q = settingsid : 1
    @findOne q, callback
  l = undefined
  module.exports = l = mongoose.model("settings", settings)
  return
).call this