{User} = require('../models')
Conversation = require('../models/conversation')


MESSAGE_INTERVAL = 20

exports.start = (req, res) ->
    return res.send 403, {err: 'Not logged in'} unless req.user
    return res.send 400, {err: 'Missing participants'} unless req.body.participants and Array.isArray(req.body.participants) and req.body.participants.length > 0

    # make sure all participants exist
    checkParticipant = (i) ->
        if i < req.body.participants.length
            participant = req.body.participants[i]

            if participant is req.user._id.toString()
                checkParticipant i+1
            else
                User.count {_id: participant}, (err, count) ->
                    return res.send 404, {err: 'User not found with ID: ' + participant} unless count > 0
                    checkParticipant i+1
        else
            req.body.participants.push req.user._id.toString() unless req.user._id.toString() in req.body.participants

            findConversation = (participants) ->
                q = Conversation.findOne(
                    participants:
                        $size: participants.length,
                        $all: participants
                )
                q.populate('participants', 'username role picture')
                q.populate('messages.from', 'username role picture')
                q.populate('last.from', 'username role picture')
                q.sort('-messages.date')
                q.exec (err, c) ->
                    return res.send 500, {err: err} if err
                    return res.send c if c # don't need to start a new one if one already exists

                    c = new Conversation()
                    c.addParticipants req.body.participants, (err, c) ->
                        return res.send 500, {err: err} if err

                        c.messages.reverse()
                        c.messages = c.messages.slice 0, MESSAGE_INTERVAL
                        c.messages = c.messages.reverse()

                        return res.send c

            if req.body.dispute is 'true' or req.body.dispute is true
                # start a dispute by adding in the support@mechfinder.com account to the list of accounts
                User.findOne {email: 'support@mechfinder.com'}, (err, u) ->
                    return res.send 500, {err: err} if err
                    return res.send 500, {err: 'Support account not found'} unless u
                    req.body.participants.push u._id

                    # notify support via email
                    d =
                        started: req.user._id.toString()
                        startedUsername: req.user.username
                        involving: req.body.participants
                        sent: new Date()

                    res.email
                        template: 'contact/dispute'
                        data: d
                        to: { name: 'Disputes', address: 'support@mechfinder.com' } # change to your email for testing I guess
                        subject: 'New Dispute'

                    findConversation(req.body.participants)
            else
                findConversation(req.body.participants)

    checkParticipant 0


exports.send = (req, res) ->
    return res.send 403, {err: 'Not logged in'} unless req.user
    return res.send 400, {err: 'Empty message'} unless typeof req.body.message is 'string' and req.body.message

    sendMessage = (conv) ->
        conv.send req.user._id, req.body.message, (err, c) ->
            return res.send 500, {err: err} if err

            q = Conversation.findById(c._id)
            q.populate('participants', 'username role picture')
            q.populate('messages.from', 'username role picture')
            q.populate('last.from', 'username role picture')
            q.sort('-messages.date')
            q.exec (err, c) ->
                return res.send 500, {err: err} if err
                return res.send 404, {err: 'Conversation not found'} unless c

                c.messages.reverse()
                c.messages = c.messages.slice 0, MESSAGE_INTERVAL
                c.messages = c.messages.reverse()

                return res.send c

    if req.body.conversation
        # they are sending a message in an established conversation
        Conversation.findById req.body.conversation, (err, c) ->
            return res.send 500, {err: err} if err
            return res.send 404, {err: 'Conversation not found'} unless c
            sendMessage c
    else
        # they are generating a new conversation
        # make sure they sent us at least one target customer
        return res.send 400, {err: 'Missing participants'} unless req.body.participants

        req.body.participants.push req.user._id

        c = new Conversation()
        c.addParticipants req.body.participants, (err, c) ->
            return res.send 500, {err: err} if err
            sendMessage c

exports.get = (req, res) ->
    return res.send 403, {err: 'Not logged in'} unless req.user
    
    q = Conversation.find({participants: req.user})
    q.select('date participants last messages')
    q.populate('last.from', 'username role picture')
    q.populate('participants', 'username role picture')
    q.populate('messages.from', 'username role picture')
    q.sort('-date')
    q.exec (err, conversations) ->
        return res.send 500, {err: err} if err

        i = 0
        for c in conversations
            conversations[i].messages = conversations[i].messages.reverse()
            conversations[i].messages = conversations[i].messages.slice 0, MESSAGE_INTERVAL
            conversations[i].messages = conversations[i].messages.reverse()
            i++

        return res.send conversations

exports.getConversation = (req, res) ->
    return res.send(403, {err: 'Not logged in'}) unless req.user
    return res.send(400, {err: 'Missing conversation id'}) unless req.params.id

    q = Conversation.findById(req.params.id)
    q.populate('participants', 'username role picture')
    q.populate('messages.from', 'username role picture')
    q.populate('last.from', 'username role picture')
    q.sort('-messages.date')
    q.exec (err, c) ->
        console.log err if err
        return res.send 500, {err: err} if err
        return res.send 404, {err: 'Conversation not found'} unless c

        c.messages.reverse()
        c.messages = c.messages.slice 0, MESSAGE_INTERVAL
        c.messages = c.messages.reverse()

        return res.send c

exports.messages = (req, res) ->
    return res.send(403, {err: 'Not logged in'}) unless req.user
    return res.send(400, {err: 'Missing conversation ID'}) unless req.params.id

    skip = 0
    skip = parseInt(req.params.skip) if req.params.skip

    q = Conversation.findById(req.params.id)
    q.populate('participants', 'username role picture')
    q.populate('messages.from', 'username role picture')
    q.populate('last.from', 'username role picture')
    q.sort('-messages.date')
    q.exec (err, c) ->
        return res.send 500, {err: err} if err
        return res.send 404, {err: 'Conversation not found'} unless c

        messages = c.messages.reverse()

        start = skip
        end = skip + MESSAGE_INTERVAL

        sliced = messages.slice start, end
        # reversed = sliced.reverse()

        isEnd = false
        isEnd = true if messages.length < MESSAGE_INTERVAL

        data =
            messages: sliced
            end: isEnd

        return res.send data

# set "seen" property for a range of messages (given a start id and an end id)
exports.see = (req, res) ->
    return res.send(403, {err: 'Not logged in'}) unless req.user
    return res.send(400, {err: 'Missing conversation ID'}) unless req.body.conversationId
    return res.send(400, {err: 'Missing start/end message ID'}) unless req.body.startId and req.body.endId

    forceLast = if req.body.forceLastMessage is 'true' or req.body.forceLastMessage is true then true else false

    Conversation.findById req.body.conversationId, (err, c) ->
        return res.send 500, {err: err} if err
        return res.send 404, {err: 'Conversation not found'} unless c

        a = req.body.startId
        b = req.body.endId

        firstFound = false
        lastFound = false
        for message in c.messages
            if message._id.toString() is a or message._id.toString() is b
                unless firstFound
                    firstFound = true
                else
                    lastFound = true

            if firstFound
                inSeen = message.seen.some (part) ->
                    return part.equals req.user._id

                message.seen.push req.user unless inSeen
                break if lastFound

        if forceLast
            inSeenLast = c.last.seen.some (part) ->
                return part.equals req.user._id

            c.last.seen.push req.user unless inSeenLast

        c.save (err) ->
            return res.send 500, {err: err} if err
            return res.send {result: true, err: ''}
