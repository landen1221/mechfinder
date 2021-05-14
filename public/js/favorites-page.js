$(document).ready(function() {
    favoritesPage.init();
});

var favoritesPage = {
    clicked: false,

    init: function() {
        favoritesPage.tabHandler();
        favoritesPage.initFavBtn();
        favoritesPage.initRowLinks();
        var targetTab = favoritesPage.urlParam('tab');
        if(!(util.is.nil(targetTab))) {
            $('#' + targetTab).click();
        }
    },
   
    tabHandler: function() {
        var tabContents = $('.tab-contents');
        var tabs = $('ul.tabs');
        var activeTab;
        var target;
        tabs.on('click', function(event) {
            activeTab = tabs.find('.current');
            activeContent = tabContents.find('.current');
            target = $(event.target);
            if (target.prop('tagName') === "LI") {
                if (!target.hasClass('current')) {
                    var tabToEnable = target.attr('data-tab');
                    activeContent.removeClass('current');
                    activeTab.removeClass('current');
                    target.addClass('current');
                    tabContents.find('#'+tabToEnable).addClass('current');
                }
            }
        });
    },

    urlParam: function(name){
        var results = new RegExp('[\?&]' + name + '=([^&#]*)').exec(window.location.href);
        if (results === null){
            return null;
        }
        else{
            return decodeURI(results[1]) || 0;
        }
    },

    getFavorites: function() {
        $.ajax({
            type: "POST",
            url: '/api/findfavorites',
            data: favoritesPage.data,
            dataType: 'json'
        })
            .done(function(results) {
                console.log(results);
            })
            .fail(function(err) {

            });
    },

    initRowLinks: function(){
        $(".project-row").on('click touchend touchmove', function(e) {
            if(!favoritesPage.clicked) {
                favoritesPage.clicked = true;
                setTimeout(function() {
                    favoritesPage.clicked = false;
                }, 300);
                if (e.type === 'touchmove' || $(e.target).hasClass('fa')) {
                    return null;
                } else {
                    window.document.location = $(this).data("href");
                }
            }
        });
    },

    initFavBtn: function() {
        $('.favorite-action').click(function() {
            $(this).parent().parent().remove();
        });
    },

    sendFavorites: function(id, type) {
        var favsToSend = {
            favorites: {
                mechanics: [],
                users: [],
                projects: []
            }
        };
        favsToSend.favorites[type].push(id);
        $.ajax({
            type: "POST",
            url: '/api/profile/favorites',
            data: favsToSend,
            dataType: 'json'
        })
            .done(function(results) {
                // console.log(results);
            })
            .fail(function(err) {
                console.log(err);
            })
        ;
    }
};
