var accounting = {
    user: null,
    rowClicked: false,

    init: function() {
        console.log('accounting module loaded');
        accounting.user = USER;

        $('#accountingTable tr').on('click touchend touchmove', function(e) {
            if(!accounting.rowClicked) {
                accounting.rowClicked = true;
                setTimeout(function() { accounting.rowClicked = false; }, 300);

                if (e.type != 'touchmove') {
                    accounting.redirect($(this).attr('data-href'));
                }
            }
        });
    },

    redirect: function(href) {
        if(!util.is.nil(href)) {
            window.location = href;
        }
    }
}

$(document).ready(function(e) {
    accounting.init();
});
