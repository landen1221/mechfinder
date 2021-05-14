{Project, User, Comment, Event} = require('../models')
moment = require('moment')
loadEvent = (req, res, next) ->
  return res.send(403)  unless req.user
  Event.findById(req.params.id).populate("user").populate("mechanic").exec (err, ev) ->
    return res.send(500, err)  if err
    return res.send(404)  unless ev
    next ev
exports.accept = (req, res) ->
    loadEvent req, res, (ev) -> 
        smsconfirm ev, req.user, ev.mechanic, res if ev.user._id.toString() is req.user._id.toString()
        smsconfirm ev, req.user, ev.user, res if ev.mechanic._id.toString() is req.user._id.toString()
        emailconfirm ev, req.user, ev.user, res if ev.mechanic._id.toString() is req.user._id.toString()
        emailsherif ev, 'Accept Meet Up', req.user, res
        ev.accept req.user, req.body.comments, (err) ->
            return res.send 500, err if err
            res.send ev
exports.reject = (req, res) ->
    loadEvent req, res, (ev) ->
        emailuser ev, req.user, ev.mechanic, res if ev.user._id.toString() is req.user._id.toString()
        emailuser ev, req.user, ev.user, res if ev.mechanic._id.toString() is req.user._id.toString()
        emailbuyerresch ev, req.user, ev.user, res if ev.mechanic._id.toString() is req.user._id.toString()
        emailsherif ev, 'Reject Project', req.user, res
        ev.reject req.user, req.body.comments, (err) ->
            return res.send 500, err if err
            res.send ev
exports.cancel = (req, res) ->
    loadEvent req, res, (ev) -> 
        smscancel ev, req.user, ev.mechanic, res if ev.user._id.toString() is req.user._id.toString()
        smscancel ev, req.user, ev.user, res if ev.mechanic._id.toString() is req.user._id.toString()
        emailsherif ev, 'Cancel Event email ', req.user, res
        ev.cancel req.user, (err) ->
            return res.send 500, err if err
            res.send ev
emailuser = (ev, from,to, res) ->
  if to isnt undefined
    for ph of to.phone
        current_phone = to.phone[ph]
        if current_phone.sms_notifications and  'mobile_provider' of current_phone and current_phone.mobile_provider isnt "" and  'number' of current_phone  and current_phone.number isnt ""
            res.email
                template: 'events/sms/reschedule'
                to:
                    name: to.last + ' '  + to.first 
                    address: current_phone.number + current_phone.mobile_provider
                subject: 'Confirm Meet Up'
                data:
                    event: ev
                    user: from
emailbuyerresch = (ev, from,to, res) ->
    res.email
        template: 'events/reschedule'
        to: to
        subject: 'Mechanic Has Rescheduled Your Meet Up'
        data:
            event: ev
            user: from
emailconfirm = (ev, from,to, res) ->
    res.email
        template: 'events/confirmed'
        to: to
        subject: 'Mechanic Has Confirmed Your Meet Up'
        data:
            event: ev
            user: from
smsconfirm = (ev, from,to, res) ->
  if to isnt undefined
    for ph of to.phone
        current_phone = to.phone[ph]
        if current_phone.sms_notifications and  'mobile_provider' of current_phone and current_phone.mobile_provider isnt "" and  'number' of current_phone  and current_phone.number isnt ""
            res.email
                template: 'events/sms/rate'
                to:
                    name: to.last + ' '  + to.first 
                    address: current_phone.number + current_phone.mobile_provider
                subject: 'Remember To Rate'
                data:
                    event: ev
                    user: from
emailsherif = (ev, subject, from, res) ->
    res.email
        template: 'events/sms/reschedule'
        to:
            name: 'sherif' 
            address: 'chicoo2006@gmail.com'
        subject: subject
        data:
            event: ev
            user: from
exports.reschedule = (req, res) ->
    date = moment("#{req.body.date} #{req.body.hour}:#{req.body.minute} #{req.body.period}", "MM/DD/YYYY h:mm a").toDate()
    loadEvent req, res, (ev) ->
        emailuser ev, req.user, ev.mechanic, res if ev.user._id.toString() is req.user._id.toString()
        emailuser ev, req.user, ev.user, res if ev.mechanic._id.toString() is req.user._id.toString()
        emailsherif ev, 'Confirm reschedule', req.user, res
        ev.reschedule req.user, req.body.location, date, req.body.comments, (err) ->
            return res.send 500, err if err
            res.send ev
exports.list = (req, res) ->
    return res.send 403 unless req.user
    Event.findByUser req.user, (err, events) ->
        return res.send 500, err if err
        res.send events
exports.notes = (req, res) ->
    return res.send 403 unless req.user
    Event.notes req.user, new Date(req.params.year, req.params.month-1, req.params.day, 12, 0, 0), (err, ev) ->
        return res.send 500, err if err
        ev.notes = req.body.notes
        if ev.notes
            ev.save (err) ->
                return res.send 500, err if err
                res.send ev
        else unless ev.isNew
            ev.remove (err) ->
                return res.send 500, err if err
                res.send ev
        else
            res.send ev
