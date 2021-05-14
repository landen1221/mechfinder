
# tweak the jquery validation logic to conform to bootstrap
jQuery.validator.defaults.errorClass = 'help-inline'
jQuery.validator.defaults.highlight = (el) -> jQuery(el).closest('.control-group').toggleClass('error', true)
jQuery.validator.defaults.unhighlight = (el) -> jQuery(el).closest('.control-group').toggleClass('error', false)

jQuery.fn.modal.defaults.backdrop = 'static'
jQuery.fn.modal.Constructor.prototype.enforceFocus = ->
    $(document).on 'focusin.modal', (e) =>
        this.$element.focus() unless this.$element[0] is e.target or
                                     this.$element.has(e.target).length > 0 or
                                     $(e.target).parents('.popover, .tooltip').length > 0

jQuery ($) -> 
    # jquery page initialization here       
    $.loading = '<div class="loading"></div>'
        
    # enable ajax popover/tooltop content
    $.popovers = []
    $.closePopovers = -> $(p).popover('hide') for p in $.popovers
    $.managePopovers = (selector) ->
        $.popovers.push(p) for p in $(selector).popover(
            trigger: 'manual'
            content: -> 
                
                # return content if set manually or we've already loaded it once
                popover = $(this)
                content = popover.data('content')
                return content if content

                # request content, return loading animation for now
                $.get(popover.data('load')).done (data) ->
                    popover.attr('content', data)
                    if popover.data('popover').$tip
                        popover.data('popover').$tip.find('.popover-content').html(data)
                'Loading...'
        ).click((e) ->
            e.stopPropagation()
            $(p).popover('hide') for p in $.popovers when p isnt this
            $(this).popover('toggle')
        )
    $.managePopovers('*[rel=popover][data-load]')

    # hide popovers when clicking outside of them
    $('html').click (e) ->
        # check the parents to see if we are inside of a tool tip.  If the click came
        # from outside the tooltip, then hide our tooltip
        if $(e.target).parents('.tooltop, .popover').length is 0
            $(p).popover('hide') for p in $.popovers

    # follow .table-hover > tr.href style links
    $('.table-hover > tbody > tr[href]').click ->
        window.location = $(this).closest('tr').attr('href')

    # follow data row links
    $('.row-fluid.data[href]').click -> window.location = $(this).attr('href')

    # load local mechanics display
    local_mechanics = $('.local-mechanics')
    if local_mechanics.length > 0 
        postal = local_mechanics.data('postal')
        local_mechanics.load('/mechanics/' + postal)

    # load local customers display
    local_cusotmers = $('.local-customers')
    if local_cusotmers.length > 0 
        postal = local_cusotmers.data('postal')
        local_cusotmers.load('/customers/' + postal)

    # highlight navbar tabs when we are on their page
    $('.nav a[href="' + window.location.pathname + '"]').parent('li').addClass('active')

    # make stars clickable.. shows a dialog with detailed rating info for user
    $('.stars[data-user-id]').live 'click', ->
        req = $.ajax(
            url: '/ratings/' + $(this).data('user-id')
            type: 'get'
        )
        req.fail ->
            $('#modal-ratings').modal('show');
            alert 'Error retrieving ratings. Please try again later or contact customer support.'
        req.done (data) ->
            $('#modal-ratings .modal-body').html(data);
        $('#modal-ratings').modal('show');