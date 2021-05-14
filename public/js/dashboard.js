$(document).ready(function(e) {
    dashboard.init();
});

var dashboard = {
    clicked: false,

    init: function() {
        dashboard.tileHandler();
        $('.tile-clickable').parent().addClass('clickable');
    },

    nil: function(string) {
        if(string == "" || string == " ") return true;
        else return false;
    },

    tileHandler: function() {
        $(".tile-clickable").off('click touchend touchmove').on('click touchend touchmove', function(e) {
            if(!dashboard.clicked) {
                dashboard.clicked = true;
                setTimeout(function() {
                    dashboard.clicked = false;
                }, 300);
                if (e.type === 'touchmove') {
                    return null;
                } else {
                    window.document.location = $(this).data("href");
                    // console.log($(this).data("href"));
                }
            }
        });
    }
}
