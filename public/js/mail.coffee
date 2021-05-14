
jQuery ($) ->

    $compose = $('#modal-compose').modal(show: false)

    $('.mail-compose').live 'click', ->
        to = $(this).data('user-id')
        $compose.find('.modal-body').html($.loading)
        $.get("/compose/#{to}").done (data) ->
            $compose.find('.modal-body').html(data)
            $compose.modal('show')
        false

    $('.mail-reply').live 'click', ->
        id = $(this).data('mail-id')
        $compose.find('.modal-body').html($.loading)
        $.get("/inbox/#{id}/reply").done (data) ->
            $compose.find('.modal-body').html(data)
            $compose.modal('show')
        false        

    $compose.find('.btn-primary').click ->
        $form = $compose.find('form')
        req = $.ajax(
            type: 'post'
            url: $form.attr('action')
            data: $form.serialize()
        )
        req.done -> $compose.modal('hide')
        req.fail -> $form.find('.alert-error').show()
        req.always -> 
            $form.find(':input:not(:submit)').removeAttr('disabled')
            $form.find(':submit').button('reset')
        $form.find('.alert').hide()
        $form.find(':input:not(:submit)').attr('disabled', 'disabled')
        $form.find(':submit').button('loading')
        false
