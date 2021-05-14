$(document).ready(function(e) {
    favoritesListener.init();
});

var favoritesListener = {
    init: function() {
        $('.favorite-action').off('click').click(function() {
            $(this).find('.fa').toggleClass('fa-star-o fa-star');
            var id = $(this).attr('data-ids');
            var type = $(this).attr('data-role');
            favoritesListener.sendFavorites(id, type);
        });
    },

    sendFavorites: function(id, type) {
        var data = {
            favorites: {
                mechanics: [],
                users: [],
                projects: []
            }
        };
        data.favorites[type].push(id);

        $.ajax({
            type: "POST",
            url: '/api/profile/favorites',
            data: data,
            dataType: 'json'
        })
            .done(function(results) {
                data.favorites[type] = [];
            })
            .fail(function(err) {
                console.log('Couldn\'t submit favorite. Error:', JSON.parse(err.responseText).err);
                modal.notify({
                    title: 'Error',
                    message: 'We couldn\'t add this to your favorites. </br>Error: ' + JSON.parse(err.responseText).err,
                    canOkay: true,
                    canExit: true
                });
            })
        ;
    }
};
