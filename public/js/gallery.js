var gallery = {
    images: [],
    index: 0,

    launchClicked: false,
    arrowClicked: false,
    dotClicked: false,
    closeClicked: false,

    init: function() {
        console.log('gallery initialized');

        $('.mf-gallery img').on('click touchmove touchend', function(e) {
            if(e.type !== 'touchmove' && !gallery.launchClicked) {
                gallery.launchClicked = true;
                setTimeout(function() {
                    gallery.launchClicked = false;
                }, 300);

                gallery.launch($(this));
            }
        });

        $('.mfGalleryContainer').on('click touchend touchmove', function(e) {
            e.stopPropagation();
        });

        $('#mfGallery, #mfGalleryExit').on('click touchend touchmove', function(e) {
            if(e.type !== 'touchmove' && !gallery.closeClicked) {
                gallery.closeClicked = true;
                setTimeout(function() {
                    gallery.closeClicked = false;
                }, 300);

                $('#mfGallery').stop().fadeOut(300);
            }
        });

        // $('.modal').off('click touchend touchmove');
        // $('.modalExit').off('click');
        // if(canExit) {
        //     $('.modal').on('click touchend touchmove', function(e) {
        //         if(e.type != 'touchmove') {
        //             actualExit();
        //             modal.hide($(this));
        //         }
        //     });

        //     $('.modalExit').on('click', function(e) {
        //         actualExit();
        //         modal.hide($(this).parents('.modal'));
        //     });
        // }
    },

    initClicks: function() {
        $('.mfGalleryDot').off('click touchmove touchend').on('click touchmove touchend', function(e) {
            if(e.type !== 'touchmove' && !gallery.dotClicked) {
                gallery.dotClicked = true;
                setTimeout(function() {
                    gallery.dotClicked = false;
                }, 300);

                var index = parseInt($(this).data('index'));
                gallery.switchImage(index);
            }
        });

        $('.mfGalleryArrow').off('click touchmove touchend').on('click touchmove touchend', function(e) {
            if(e.type !== 'touchmove' && !gallery.arrowClicked) {
                gallery.arrowClicked = true;
                setTimeout(function() {
                    gallery.arrowClicked = false;
                }, 300);

                var dir = $(this).data('direction');
                
                var indexDirection = 1;
                if(dir == 'left') indexDirection = -1;

                var index = gallery.index + indexDirection;
                gallery.switchImage(index);
            }
        });
    },

    switchImage: function(index) {
        if(index >= gallery.images.length) index = 0;
        if(index < 0) index = gallery.images.length - 1;

        gallery.index = index;

        $('#mfGalleryImage').css('background-image', 'url("' + gallery.images[index] + '")');
        $('.mfGalleryDot').removeClass('active');
        $('#mfGalleryDot' + index).addClass('active');
    },

    launch: function($img) {
        var $gallery = $img.closest('.mf-gallery');

        var startIndex = 0;
        var images = $gallery.find('img').map(function(i) {
            if($(this).is($img)) startIndex = i;
            return $(this).attr('src');
        }).get();

        if(images.length > 0) {
            console.log('images: ' );
            console.log(images);
            gallery.images = images;

            var html = '';
            for(var i=0; i<gallery.images.length; i++) {
                html += '<a id="mfGalleryDot'+i+'" class="mfGalleryDot" data-index="' + i + '" href="javascript:void(0);"><i class="fa fa-circle"></i></a>';
            }

            $('#mfGalleryDots').html(html);

            gallery.initClicks();

            gallery.switchImage(startIndex);

            $('#mfGallery').stop().fadeIn(300, function() {

            });
        }
    }
};

$(document).ready(function() {
    gallery.init();
});