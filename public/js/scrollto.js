var scroll = {
    clicked: {
        scrollTo: false
    },

    init: function() {
        console.log('scroll init');
        $('.scrollTo').off('click touchmove touchend').on('click touchmove touchend', function(e) {
            console.log('clicked');
            if(e.type != 'touchmove' && !scroll.clicked.scrollTo) {
                scroll.clicked.scrollTo = true;
                setTimeout(function() {
                    scroll.clicked.scrollTo = false;
                }, 300);

                var elementId = $(this).attr('data-scroll');
                var speed = $(this).attr('data-speed');
                if(!util.is.nil(speed)) speed = parseInt(speed);
                else speed = 1000;

                scroll.to(elementId, speed);
            }
        });
    },

    to: function(elementId, speed) {
        $('html, body').animate({
            scrollTop: $('#' + elementId).offset().top
        }, speed);
    }
};

$(document).ready(function(e) {
    scroll.init();
});