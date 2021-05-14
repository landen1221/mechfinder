jQuery(function($) {

    $('#modal-compose-to .mail-compose').click(function() {
        $('#modal-compose-to').modal('hide');
    });

    $('#inbox tbody .subject, #sent tbody .subject').click(function(e) {
        $this = $(this);
        $tr = $this.closest('tr');
        if ($tr.next().is('.body')) {
            $tr.next().remove();
            return false;
        }
        $tr.after('<tr class="body"><td colspan="4"><div class="loading"></div></td></tr>');
        $.ajax({
            type: 'get',
            url: '/inbox/' + $this.attr('href').substr(1)
        }).done(function(data) {
            $tr.next('.body').find('td').html(data);
            $tr.removeClass('unread');
        }).fail(function() {
            $tr.next('.body').find('td').html('There was a problem retrieving this messsage. Please try again soon.');
        });
        return false;
    });

});
