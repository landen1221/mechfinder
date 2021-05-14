
jQuery ($) ->
    last_refresh = null
    incoming_chats = []
    refresh_delay = 2000
    refresh_backoff = 1
    me = $('body').data('user-id')

    # track the time that a chat was closed, when we navigate pages, dont reopen
    # the frame unless a chat came in after we closed it
    closed_chats = JSON.parse(sessionStorage?.getItem('closed-chats') or '{}')
    min_chats = JSON.parse(sessionStorage?.getItem('min-chats') or '{}')
    
    scroll_messages = ($messages) ->
        return unless $messages.length > 0
        m = $messages[0]
        m.scrollTop = m.scrollHeight

    find_chat_container = ->
        return container if (container = $('#chat-container')).length > 0
        $('body').append '<div id="chat-container"></div>'
        return $('#chat-container')

    find_chat_frame = (id, name, picture) ->
        return frame.show() if (frame = $("#chat-#{id}")).length > 0
        img = if picture then "<img src=\"/i/#{picture}/24/24/o\" />" else ''
        find_chat_container().append "
            <div class=\"chat-frame\" id=\"chat-#{id}\">
                <h4>
                    <div class=\"picture\">#{img}</div>
                    #{name}
                    <button type=\"button\" class=\"close\" aria-hidden=\"true\">×</button>
                    <button type=\"button\" class=\"close minimize\" aria-hidden=\"true\">_</button>
                </h4>
                <div class=\"chat-messages\"></div>
                <input type=\"text\" class=\"chat-entry\" />
            </div>"
        frame = $("#chat-#{id}")
        (frame.addClass('minimize') if key is id) for key, val of min_chats
        frame.data 'user', id
        frame.click -> frame.removeClass('notice')
        frame.find('h4, .minimize').click ->
            frame.removeClass('notice')
            if frame.is('.minimize')
                frame.removeClass('minimize')
                delete min_chats[id]
            else
                frame.addClass('minimize')
                min_chats[id] = new Date()
            sessionStorage?.setItem('min-chats', JSON.stringify(min_chats))
            return false
        frame.find('.close:not(.minimize)').click ->
            frame.hide()
            closed_chats[id] = new Date()
            delete min_chats[id]
            sessionStorage?.setItem('min-chats', JSON.stringify(min_chats))
            sessionStorage?.setItem('closed-chats', JSON.stringify(closed_chats))
            return false
        frame.find('.chat-entry').keypress (e) ->
            return unless e.which is 13
            $x = $(this)
            message = $x.val()
            req = $.post('/api/chat', {
                d: last_refresh
                to: id
                message: message
            })
            req.done (data) ->  
                last_refresh = data.date
                queue_chats data.chats
            req.fail -> frame.find('.chat-messages').append '<div class="alert alert-error">Failed to send chat: "' + message + '"</div>'
            $x.val('')

        return frame

    process_chat = (chat, next) -> 
        from = if chat.from._id is me then chat.to else chat.from
        frame = find_chat_frame(from._id, from.name, from.picture)
        frame.addClass('notice') if frame.is('.minimize')
        if closed_chats[from._id]
            if closed_chats[from._id] > chat.date
                frame.hide()
            else
                delete closed_chats[from._id]
                sessionStorage?.setItem('closed-chats', JSON.stringify(closed_chats))
                frame.show()
        scroll_messages frame.find('.chat-messages').append("<span class=\"#{if chat.from._id is frame.data('user') then 'you' else 'me' }\">#{chat.message}</span>")
        next()

    pump_chats = ->
        return if incoming_chats.length is 0
        c = incoming_chats.shift()
        setTimeout (-> process_chat c, pump_chats), 0

    queue_chats = (chats) -> 
        return unless chats and chats.length > 0
        setTimeout pump_chats, 0 if incoming_chats.length is 0
        incoming_chats.push chats...
        pump_chats() if incoming_chats.length is chats.length

    refresh = ->
        $.get('/api/chat', {d: last_refresh}).done (data) ->
            last_refresh = data.date
            queue_chats data.chats

            # check more slowly until we receive a chat
            refresh_backoff = (if data.chats.length is 0 then refresh_backoff+0.25 else 1)
            setTimeout refresh, refresh_delay *  Math.min(refresh_backoff, 5)

    refresh() if me
    
    $('.btn-chat').live 'click', ->
        if me
            user = $(this).data('user-id')
            return false if user is me
            frame = find_chat_frame(user, $(this).data('name'), $(this).data('picture'))
            frame.find('.chat-entry').focus()
        else
            window.location = '/#signup-chooser' if confirm('You need to signup before you can use the chat feature. Woudl you like to signup now? It\'s free!')
        return false
