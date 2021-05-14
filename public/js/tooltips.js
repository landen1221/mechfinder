var tooltips = {
    shown: false,
    clicked: false,

    init: function() {
        $('.tooltip_info').off('click touchmove touchend').on('click touchmove touchend', function(e) {
            if(e.type != 'touchmove' && !tooltips.clicked && !tooltips.shown) {
                tooltips.clicked = true;
                setTimeout(function() {
                    tooltips.clicked = false;
                }, 300);

                tooltips.shown = true;
                var $title = $(this).find(".title");
                if (!$title.length) {
                    eleString = '<span class="tooltip-title">' + $(this).attr("title");
                    
                    if ($(this).attr("href") != '#') {
                        eleString += ' <a href="' + $(this).attr("href") + '">Read more...</a>';
                    }
                    
                    eleString += '</span>';
                    
                    $(this).append(eleString);
                } else {
                    $title.remove();
                    tooltips.shown = false;
                }
            }
        });
        
        $(document).mouseup(function (e)
        {
            var container = $(".tooltip-title");

            if (!container.is(e.target) && container.has(e.target).length === 0)
            {
                container.remove();
                tooltips.shown = false;
            }
        });
    }
}

$(document).ready(function() {
    tooltips.init();
});
