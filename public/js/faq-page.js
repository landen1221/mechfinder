$(document).ready(function() {
    faqPage.init();
});

var faqPage = {
    questionClicked: false,
    
    init: function() {        
        var idString = "#" + QID;
        
        if (QID != null) {
            $(".question").next().slideUp('fast');
            $(idString).stop().slideDown('fast');
            $(idString).addClass("highlight");
        }
        
        $('#accordion').find('.question').on('click touchend', function() {
            if(!faqPage.questionClicked) {
                faqPage.questionClicked = true;
                setTimeout(function() {
                    faqPage.questionClicked = false;
                }, 300);
                $(this).next().stop().slideToggle('fast');
            }            
        });
        
        $('.qlink').click(function() { 
            var targetId = $(this).attr('href').toString();         
            $(targetId).stop().slideDown('fast');
            $(targetId).addClass("highlight");
        });
    }
}
