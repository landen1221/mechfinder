var publicProfile = {
    user: null,
    targetUser: null,
    userProjects: [],

    init: function() {
        publicProfile.user = USER;
        publicProfile.targetUser = TARGET_USER;
        publicProfile.userProjects = USER_PROJECTS;

        publicProfile.clicks.init();
    },

    clicks: {
        clicked: {
            toggleReviews: false,
            requestEstimate: false
        },

        init: function() {
            $('.toggle-reviews').off('click touchmove touchend').on('click touchmove touchend', function(e) {
                if(e.type != 'touchmove' && !publicProfile.clicks.clicked.toggleReviews) {
                    publicProfile.clicks.clicked.toggleReviews = true;
                    setTimeout(function() {
                        publicProfile.clicks.clicked.toggleReviews = false;
                    }, 300);

                    var hidden = $('.hidden');
                    var visible = $('.visible');
                    var toggles = $('.toggle-reviews');
                    hidden.toggleClass('visible hidden');
                    visible.toggleClass('visible hidden');
                    toggles.toggleClass('blue gray');
                }
            });

            if(publicProfile.user.role == 'buyer') {
                $('.requestEstimate').off('click touchmove touchend').on('click touchmove touchend', function(e) {
                    if(e.type != 'touchmove' && !publicProfile.clicks.clicked.requestEstimate) {
                        publicProfile.clicks.clicked.requestEstimate = true;
                        setTimeout(function() {
                            publicProfile.clicks.clicked.requestEstimate = false;
                        }, 300);

                        publicProfile.requestEstimate();
                    }
                });
            }
        }
    },

    requestEstimate: function() {
        console.log('requesting an estimate from seller');
        console.log('user projects:');
        console.log(publicProfile.userProjects);
        var biddingProjects = publicProfile.userProjects;
        if(biddingProjects.length > 0) {
            var options = [];
            for(var i=0; i<biddingProjects.length; i++) {
                if(biddingProjects[i].state == 'bidding') {
                    options.push({
                        label: biddingProjects[i].vehicle.make + biddingProjects[i].vehicle.model + ' - ' + biddingProjects[i].title,
                        value: biddingProjects[i]._id
                    });
                }
            }

            options.push({
                label: 'Create a new job...',
                value: ''
            });

            console.log(options);
            modal.select({
                title: 'Select a Job',
                message: 'Which job do you want to request an estimate on?',
                options: options,
                allowEmptyValues: true,
                submit: function(value) {
                    if(util.is.nil(value)) {
                        window.location = '/projects/post';
                    } else {
                        var body = {
                            targetUserId: publicProfile.targetUser._id
                        };
                        
                        var request = $.ajax({
                            method: 'POST',
                            url: '/api/project/' + value + '/requestEstimate',
                            data: body,
                            dataType: 'json'
                        });

                        request.done(function(data) {
                            console.log(data);
                            modal.notify({
                                title: 'Request Sent',
                                message: 'We have notified ' + publicProfile.targetUser.username + ' of your request to have them place an estimate on your job',
                                okay: function() {
                                    window.location = '/projects/' + value
                                }
                            });
                        });

                        request.fail(function(jqXHR) {
                            console.log(jqXHR);
                            modal.notify({
                                title: 'Error',
                                message: 'There was a problem while sending your request for an estimate to the mechanic. If this problem persists, please contact us for more information.'
                            });
                        });
                    }
                }
            });
        } else {
            modal.confirm({
                title: 'Post a Job',
                message: 'Before you can hire a mechanic, you must post your first job. Would you like to post a job now?',
                yes: function() {
                    window.location = '/projects/post';
                }
            });
        }
    }
};

$(document).ready(function(e) {
    publicProfile.init();
});