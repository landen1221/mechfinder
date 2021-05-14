$(document).ready(function() {
    searchableDropdown.init();
});

var searchableDropdown = {
    init: function() {

    },

    setup: function($searchInput, $dropDown, strSearchList, submitCallback) {
        $(strSearchList + ' li').each(function(i){
            // for highlighting first element
            if (i === 0) {
                $(this).addClass('selected');
            }
            // normalize search data
            $(this).attr('data-search-term', $(this).text().toLowerCase());
        });

        $(strSearchList + ' li').off('click').on('click', function(e) {
            var selected = $(this).text();
            if (selected !== '') {
                $searchInput.attr('value', selected);
                $searchInput.val(selected).trigger('change');
            }
            $dropDown.slideUp();
            submitCallback();
        });

        var selectedIndex = 0;
        $searchInput.off('keyup').on('keyup', function(e){
            var searchTerm = $(this).val().toLowerCase();        
            var found = [];    

            $(strSearchList + ' li').each(function(){
                if ($(this).filter('[data-search-term *= ' + searchTerm + ']').length > 0 || searchTerm.length < 1) {
                    $(this).show();
                    $(this).addClass('isVisible');
                    found.push($(this).html());
                } else {
                    $(this).hide();
                    $(this).removeClass('isVisible');
                }
            });

            if (found.length > 0) {
                $dropDown.slideDown();
            } else {
                $dropDown.slideUp();
            }
            var selected = '';
            var doSetVal = false;
            switch(e.which) {
                case 38: // up
                    selectedIndex--;
                break;

                case 40: // down
                    selectedIndex++;
                break;

                case 13: // enter
                    doSetVal = true;                            
                break;

                default: selectedIndex = 0;
            }
            if (selectedIndex > (found.length - 1)) {
                selectedIndex = found.length - 1;
            } else if (selectedIndex < 0) {
                selectedIndex = 0;
            }
            $(strSearchList + ' li:visible').each(function (i) {
                if (i === selectedIndex) {
                    selected = $(this).text();
                    $(this).addClass('selected');
                } else {
                    $(this).removeClass('selected');
                }
            });                    
            if (doSetVal) {
                if (selected !== '') {
                    $searchInput.attr('value', selected);
                    $searchInput.val(selected).trigger('change');
                }                        
                $dropDown.slideUp();
                submitCallback();
            }
        });

        $searchInput.off('focus').on('focus', function() {
            $dropDown.slideDown();
        });

        $searchInput.off('blur').on('blur', function() {
            $dropDown.slideUp();
        });
    }
};