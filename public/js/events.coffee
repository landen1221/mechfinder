
sortEvents = (data) ->
    events = {}
    for e in data
        e.date = new Date(e.date)
        y = e.date.getFullYear()
        m = e.date.getMonth()
        events[y] = {} if events[y] is undefined
        events[y][m] = [] if events[y][m] is undefined
        events[y][m].push(e)
    events

jQuery ($) ->
    $cal = $('#calendar')
    return unless $cal.length > 0
    $.get('/api/event').done (data) ->
        events = sortEvents(data)
        $cal.datepicker(
            inline: true
            getClassesForDay: (date) ->
                y = date.getFullYear()
                m = date.getMonth()
                c = 0
                notes = ''
                if events[y] and events[y][m]
                    for e in events[y][m]
                        if e.date.getDate() is date.getDate()
                            if e.state is 'notes'
                                notes = ' event-notes'
                            else
                                c = Math.max(c, if e.state is 'rejected' then 3 else (if e.state is 'submitted' then 2 else 1))
                switch c
                    when 0 then '' + notes
                    when 1 then 'event event-accepted' + notes
                    when 2 then 'event event-submitted' + notes
                    when 3 then 'event event-rejected' + notes
        )
        $('#calendar').bind 'clickDate', (e) ->
            url = "/events/#{e.date.getFullYear()}/#{e.date.getMonth()+1}/#{e.date.getDate()}"
            $('#modal-events-date').text(moment(e.date).format('L'))
            $('#modal-events').data({'load': url, 'date': e.date}).modal('show')
            $('#modal-events .modal-body').html($.loading).load(url)
    #$('#modal-events').modal(show: false)