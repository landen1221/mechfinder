var notify = {
    exitable: false,
    loaded: false,
    clickedNot: false,
    user: null,
    socket: null,
    nots: [],
    triggerScroll: 50,
    loadingMore: false,
    endOfNotifications: false,

    init: function() {
        notify.user = USER;
        // notify.initSocket();
        notify.get();

        $('#notify, #notifyExit').on('click touchstart', function(e) {
            notify.hide();
        });

        $('#notifyContainer').on('click touchstart', function(e) {
            e.stopPropagation();
        });

        $('.openNotifications').on('click', function(e) {
            notify.show();
        });

        $('#notificationBanner').on('click touchend touchmove', function(e) {
            if(!notify.clickedNot) {
                notify.clickedNot = true;
                setTimeout(function() { notify.clickedNot = false; }, 300);
                if(e.type === 'touchmove') return false;

                var notId = $(this).attr('data-not');
                notify.clickNotification(notId);
            }
        });

        $('#notificationBannerDismiss').on('click', function(e) {
            e.stopPropagation();
            var notId = $(this).closest('#notificationBanner').stop().hide().attr('data-not');
            notify.seeNotifications(notId);
        });

        $('#notifyInbox').on('scroll', function(e) {
            var scrollTop = $(this).scrollTop();
            var scrollHeight = $(this)[0].scrollHeight;
            var offsetHeight = $(this)[0].offsetHeight;

            if(scrollHeight - scrollTop - offsetHeight < notify.triggerScroll) {
                notify.loadMore();
            }
        });

        $('#notifyClear').on('click touchend touchmove', function(e) {
            if(e.type != 'touchmove' && !notify.clickedNot) {
                notify.clickedNot = true;
                setTimeout(function() {
                    notify.clickedNot = false;
                }, 300);

                notify.clearNotifications();
            }
        });
    },

    // initSocket: function() {
    //     if(typeof(io) !== 'undefined') {
    //         notify.socket = io();
    //     } else {
    //         setTimeout(function() {
    //             chat.initSocket();
    //         }, 500);
    //     }
    // },

    show: function() {
        notify.exitable = false;
        $('#notify').stop().fadeIn(300, function() {
            notify.exitable = true;
        });

        var unseen = [];
        for(var i=0; i<notify.nots.length; i++) {
            if(util.is.nil(notify.nots[i].seen)) {
                unseen.push(notify.nots[i]._id);
            }
        }

        notify.seeNotifications(unseen);
    },

    hide: function() {
        if(notify.exitable) $('#notify').stop().fadeOut(300);
    },

    withId: function(id) {
        for(var i=0; i<notify.nots.length; i++) {
            if(notify.nots[i]._id == id) return notify.nots[i];
        }

        return null;
    },

    update: function() {
        var markup = notify.markup();

        $('#notifyInbox').html(markup);
        $('.notifyInboxRow').off('click touchend touchmove').on('click touchend touchmove', function(e) {
            if(!notify.clickedNot) {
                notify.clickedNot = true;
                setTimeout(function() { notify.clickedNot = false; }, 300);
                if(e.type === 'touchmove') return false;

                var notId = $(this).attr('data-not');
                notify.clickNotification(notId);
            }
        });

        notify.updateUnclicked();
    },

    updateUnclicked: function() {
        var not;
        var count = 0;
        for(var i=0; i<notify.nots.length; i++) {
            if(util.is.nil(notify.nots[i].clicked)) count++;
        }

        if(count > 0) {
            $('#notificationsSup').html(count).stop().fadeIn(300);
        } else {
            $('#notificationsSup').stop().fadeOut(300);
        }
    },

    markup: function() {
        var html = '';
        var not;
        for(var i=0; i<notify.nots.length; i++) {
            not = notify.nots[i];

            html += '<div class="inbox-row notifyInboxRow" data-not="' + not._id + '">';
                html += '<div class="inbox-flex">';
                    html += '<div class="inbox-flexbox time">';
                        if(!util.is.nil(not.date)) {
                            if(util.time.sameDay(not.date, new Date())) {
                                html += util.time.timeOfDay(not.date, 'HH:MM');
                            } else {
                                html += util.time.format(not.date, 'MM/DD/YYYY');
                            }
                        }
                    html += '</div>';
                    html += '<div class="inbox-flexbox message">';
                        html += not.message;
                    html += '</div>';

                    var dotColor = 'green';
                    switch(not.priority) {
                        case 2:
                            // medium priority (yellow dot)
                            dotColor = 'yellow';
                            break;
                        case 3:
                            // high priority (red dot)
                            dotColor = 'red';
                            break;
                    }

                    var openMarkup = (util.is.nil(not.clicked)) ? '' : '-o';

                    html += '<div class="inbox-flexbox actions"><a class="' + dotColor + '" href="javascript:void(0);">';
                        html += '<i class="fa fa-circle' + openMarkup + ' fa-fw" aria-hidden="true"></i>';
                    html += '</a></div>';

                html += '</div>';
            html += '</div>';
        }

        if(notify.nots.length <= 0) {
            html += '<div id="noNotificationsInInbox" class="background-text no-messages">You have no notifications at this time</div>';
        } else {
            $('#noNotificationsInInbox').remove();
        }

        return html;
    },

    bannerUpdate: function() {
        var not;
        var count = 0;
        for(var i=0; i<notify.nots.length; i++) {
            not = notify.nots[i];
            if(util.is.nil(not.seen)) {
                count++;
                break;
            }
        }

        if(count > 0) {
            // unseen notification exists
            $('#notificationBannerMessage').html(not.message);

            var borderClass = 'green';
            switch(not.priority) {
                case 2:
                    // medium priority (yellow dot)
                    borderClass = 'yellow';
                    break;
                case 3:
                    // high priority (red dot)
                    borderClass = 'red';
                    break;
            }

            $('#notificationBanner')
                .attr('data-not', not._id)
                .removeClass('green yellow red blue')
                .addClass(borderClass)
                .stop()
                .show();
            
            $('#internalTopSpacer').addClass('notification-shown');
        } else {
            $('#internalTopSpacer').removeClass('notification-shown');
        }
    },

    clickNotification: function(notId) {
        var not = notify.withId(notId);

        if(!util.is.nil(not)) {
            // set the notification clicked property
            var request = $.ajax({
                type: 'POST',
                url: '/api/notifications/click/' + not._id,
                data: {},
                dataType: 'json'
            });

            request.done(function(data) {
                console.log(data);
            });

            request.fail(function(jqXHR) {
                console.log(jqXHR);
            });

            if(!util.is.nil(not.href)) {
                window.location = not.href;
            } else {
                window.location = "/profile/" + notify.user._id;
            }
        }
    },

    seeNotifications: function(notIds) {
        if(!util.is.nil(notIds)) {
            notIds = (typeof(notIds) === 'string') ? [notIds] : notIds;

            if(notIds.length > 0) {
                var body = {
                    ids: notIds
                }

                var request = $.ajax({
                    type: 'POST',
                    url: '/api/notifications/see',
                    data: body,
                    dataType: 'json'
                });

                request.done(function(data) {
                    console.log(data);
                });

                request.fail(function(jqXHR) {
                    console.log(jqXHR);
                });
            }
        }
    },

    clearNotifications: function() {
        var request = $.ajax({
            method: 'POST',
            url: '/api/notifications/clear',
            data: {},
            dataType: 'json'
        });

        request.done(function(data) {
            console.log(data);
        });

        request.fail(function(jqXHR) {
            console.log(jqXHR);
        });

        // open the dots
        $('i.fa-circle').addClass('fa-circle-o').removeClass('fa-circle');

        for(var i=0; i<notify.nots.length; i++) {
            if(util.is.nil(notify.nots[i].clicked)) notify.nots[i].clicked = new Date();
        }

        notify.updateUnclicked();
    },

    loadMore: function() {
        if(!notify.loadingMore && !notify.endOfNotifications) {
            var skip = notify.nots.length - 1;
            notify.get(skip);
        }
    },

    toast: function(message)  {
        if(!util.is.nil(message)) {
            $('#notifyToast').stop().hide();
            $('#notifyToastMessage').html(message);
            $('#notifyToast').stop().fadeIn(300);
        } else {
            $('#notifyToast').stop().hide();
        }
    },

    get: function(skip) {
        skip = (util.is.nil(skip)) ? 0 : skip;
        notify.loadingMore = true;

        notify.toast('Loading older notifications...');

        var request = $.ajax({
            type: 'GET',
            url: '/api/notifications/' + skip,
            dataType: 'json',
            cache: false
        });

        request.done(function(nots) {
            for(var i=0; i<nots.length; i++) {
                notify.nots.push(nots[i]);
            }

            notify.loadingMore = false;
            if(nots.length <= 0) {
                notify.endOfNotifications = true;
                $('#notifyInbox').off('scroll');
            }

            $('#notifyInbox').removeClass('loading');

            notify.toast('');

            notify.update();
            // only update the banner if this is the first load of nots
            if(skip == 0) notify.bannerUpdate();
        });

        request.fail(function(jqXHR) {
            notify.loadingmore = false;
            notify.toast('There was a problem while loading older notifications');
            console.log('failed to get nots');
        });
    }
}

$(document).ready(function() {
    notify.init();
});
