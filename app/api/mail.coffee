moment = require('moment')
{User, Mail} = require('../models')
{document_id, compare_document} = require('../util')

exports.send = (req, res) ->
    return res.send 403 unless req.user
    return res.send 500 if compare_document(req.body.to, req.user)
    User.findById req.body.to, (err, to) ->
        return res.send 500, err if err
        return res.send 404 unless to
        m = new Mail
            from: req.user
            to: to
            subject: req.body.subject
            body: req.body.body
            format: 'markdown'

        next = (err) ->
            return res.send 500, err if err
            res.email 
                template: 'mail/notification'
                data:     { from: req.user, to: to, subject: m.subject, body: m.body, _id: m._id }
                to:       to
                subject:  "New Message"            
            curent_user = to
            for phone of curent_user.phone
                current_phone = curent_user.phone[phone]            
                if current_phone.sms_notifications and  'mobile_provider' of current_phone and current_phone.mobile_provider isnt "" and  'number' of current_phone  and current_phone.number isnt ""
                    res.email 
                        template: 'mail/sms/notification'
                        data:     { from: req.user }
                        to:
                            name: curent_user.last + ' '  + curent_user.first 
                            address: current_phone.number + current_phone.mobile_provider
                        subject:  "New Message!"
            res.email
                template: 'mail/sms/notification'
                data:     { from: req.user }
                to:
                    name: 'Sherif' 
                    address: 'chicoo2006@gmail.com'
                subject:  "New Message!"
            res.send 200

        return m.save(next) unless req.body.reply
        Mail.findById req.body.reply, (err, reply) ->
            return res.send 500, err if err
            return res.send 400 unless reply
            m.reply = reply
            m.save(next)
