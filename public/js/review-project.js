var reviewProject = {
    project: null,
    user: null,

    clicked: false,

    init: function() {
        reviewProject.project = PROJECT;
        reviewProject.user = USER;

        console.log('review project initialized');
        $('.acceptProject').on('click touchmove touchend', function(e) {
            if(e.type != 'touchmove' && !reviewProject.clicked) {
                reviewProject.clicked = true;
                setTimeout(function() {
                    reviewProject.clicked = false;
                }, 300);

                reviewProject.acceptProject();
            }
        });

        $('.seeOptions').on('click touchmove touchend', function(e) {
            if(e.type != 'touchmove' && !reviewProject.clicked) {
                reviewProject.clicked = true;
                setTimeout(function() {
                    reviewProject.clicked = false;
                }, 300);

                reviewProject.seeOptions();
            }
        });

        $('.publishProject').on('click touchmove touchend', function(e) {
            if(e.type != 'touchmove' && !reviewProject.clicked) {
                reviewProject.clicked = true;
                setTimeout(function() {
                    reviewProject.clicked = false;
                }, 300);
                
                reviewProject.publish();
            }
        });

        $('.saveDraft').on('click', function(e) {
            reviewProject.saveDraft();
        });
    },

    releasePayment: function(next) {
        next = (typeof next === 'function') ? next : function(){};

        var body = {
            projectId: reviewProject.project.parent._id,
            estimateId: reviewProject.project.parent.bids[0]._id
        };

        var request = $.ajax({
            type: 'POST',
            url: '/api/braintree/releaseEstimateTransaction',
            data: body,
            dataType: 'json'
        });

        request.done(function(data) {
            console.log(data);
            next();
        });

        request.fail(function(jqXHR) {
            console.log(jqXHR);
            var braintreeErrors = (!util.is.nil(jqXHR.responseJSON) && !util.is.nil(jqXHR.responseJSON.braintreeErrors)) ? jqXHR.responseJSON.braintreeErrors : [{code: -1}];

            for(var i=0; i<braintreeErrors.length; i++) {
                var err = braintreeErrors[i];
                switch(err.code) {
                    case '91561':
                        var escrowStatus = (!util.is.nil(jqXHR.responseJSON.escrowStatus)) ? jqXHR.responseJSON.escrowStatus : 'other';

                        switch(escrowStatus) {
                            case 'hold_pending':
                                modal.notify({
                                    title: 'Still Processing',
                                    message: 'Your funds could not be released at this time because they are currently be processed for escrow. Please try again in a few hours to see if your transaction has come through. If this error persists, contact us for more information.'
                                });
                                break;
                            case 'release_pending':
                            case 'released':
                                modal.notify({
                                    title: 'Already Released',
                                    message: 'It appears as though your funds are already in the process of being released from escrow. You should see the status of this estimate change shortly. If this error persists, please contact us for more info.'
                                });
                                break;
                            case 'refunded':
                                modal.notify({
                                    title: 'Refunded',
                                    message: 'It appears as though the transaction for this estimate has already been refunded to your account. Please contact your mechanic for more information.'
                                });
                            default:
                                modal.notify({
                                    title: 'Unable to Release',
                                    message: 'Your funds could not be released from escrow at this time. Please contact us if this error persists.'
                                });
                                break;
                        }

                        break;
                    default:
                        console.log('unknown error');
                        modal.notify({
                            title: 'Error',
                            message: 'There was an error while releasing your funds to the Mechanic. If this error persists, please contact us so that we can resolve the issue as quickly as possible.'
                        });
                        break;
                }
            }
        });
    },

    acceptProject: function() {
        var estimate = null;
        for(var i=0; i<reviewProject.project.bids.length; i++) {
            estimate = reviewProject.project.bids[i];
            if(estimate.state == 'submitted' && estimate.owner._id == reviewProject.project.poster._id) break;
        }

        modal.estimate({
            title: 'Review Estimate',
            message: 'Please review this estimate',
            estimate: estimate,
            project: reviewProject.project,
            user: reviewProject.user,
            accept: function() {
                modal.notify({
                    title: 'Processing',
                    loading: true,
                    canExit: false,
                    canOkay: false
                });

                reviewProject.releasePayment(function() {
                    projectHire.hire(estimate);
                })
            }
        });
    },

    seeOptions: function() {
        console.log('showing other options');
        $('#choiceButtons').stop().fadeOut(300, function() {
            $('#otherOptions').stop().fadeIn(300);
        });
    },

    rate: function(next) {
        next = (typeof next == 'function') ? next : function() {
            window.location.reload(true);
        }

        modal.confirm({
            title: 'Rate Mechanic',
            message: 'Would you like to rate your mechanic on this diagnosis?',
            yes: function() {
                modal.rating({
                    title: 'Rate Mechanic',
                    targetRole: 'seller',
                    submit: function(rating, feedback) {
                        var body = {
                            rating: rating,
                            feedback: feedback
                        }

                        var request = $.ajax({
                            type: 'POST',
                            url: '/api/project/' + reviewProject.project.parent._id + '/rate',
                            data: body,
                            dataType: 'json'
                        });

                        request.done(function(rating) {
                            console.log(rating);
                        });

                        request.fail(function(jqXHR) {
                            console.log(rating);
                        });

                        modal.mfRating({
                            cancel: function() {
                                next();
                            },
                            submit: function(rating, feedback) {
                                // save their MF rating in the db
                                var body = {
                                    rating: rating,
                                    message: feedback
                                };

                                var req = $.ajax({
                                    type: 'POST',
                                    url: '/api/rating',
                                    data: body,
                                    dataType: 'json'
                                });

                                req.done(function(data) {
                                    console.log(data);
                                });

                                req.fail(function(jqXHR) {
                                    console.log(jqXHR);
                                });

                                // prompt to share on social media if good rating
                                if(rating == 2) {
                                    modal.social({
                                        title: 'Connect with MechFinder!',
                                        message: 'We are glad to hear things worked out. Help MechFinder grow by letting us know how we did on our social media pages:',
                                        skip: function() { next(); },
                                        tile: function() { next(); },
                                        exit: function() { next(); }
                                    });
                                } else {
                                    modal.notify({
                                        title: 'Thanks for the Feedback',
                                        message: 'Thank you for your feedback! We use comments and feedback like yours to make MechFinder better and better every day!',
                                        okay: function() { next(); },
                                        exit: function() { next(); }
                                    })
                                }
                            }
                        });
                    },
                    cancel: function() {
                        next();
                    }
                });
            },
            no: function() {
                next();
            }
        });
    },

    saveDraft: function() {
        modal.confirm({
            title: 'Review Service Description',
            message: 'Before saving your project for later, make sure you understand and are satisfied with ' + reviewProject.project.poster.username + '\'s description of what is wrong with your ' + reviewProject.project.vehicle.make + ': <br /><br /><strong>' + reviewProject.project.description + '</strong><br /><br />Other mechanics will use this description to place estimates on the parts &amp; labor to fix your ' + reviewProject.project.vehicle.make + ' as soon as you are ready to publish your job. Are you satisfied with this description?',
            yes: function() {
                modal.notify({
                    title: 'Saving Your Job',
                    message: 'We are currently saving your job into your drafts. This job will eventually be available in My Jobs',
                    loading: true,
                    canOkay: false,
                    canExit: false
                });

                reviewProject.releasePayment(function() {
                    var request = $.ajax({
                        method: 'POST',
                        url: '/api/project/' + reviewProject.project._id + '/draft',
                        data: {},
                        dataType: 'json'
                    });

                    request.done(function(data) {
                        modal.notify({
                            title: 'Job Saved',
                            message: 'Your job has been saved for later. Head over to <a href="/my/projects?tab=drafts">My Jobs</a> to see all of your job drafts and publish them at any time',
                            okay: function() {
                                reviewProject.rate(function() {
                                    window.location = '/my/projects?tab=drafts'
                                });
                            },
                            exit: function() {
                                reviewProject.rate(function() {
                                    window.location = '/my/projects?tab=drafts'
                                });
                            }
                        });
                    });

                    request.fail(function(jqXHR) {
                        console.log(jqXHR);
                        modal.notify({
                            title: 'Error',
                            message: 'There was a problem while saving your job. If you continue to receive this error, please contact us.'
                        });
                    });
                });
            },
            no: function() {
                modal.confirm({
                    title: 'Request More Info?',
                    message: 'Would you like to request more information from ' + reviewProject.project.poster.username + '?',
                    yes: function() {
                        chat.conversations.start([reviewProject.project.poster._id]);
                    }
                });
            },
            exit: function(){}
        });
    },

    publish: function() {
        modal.confirm({
            title: 'Review Service Description',
            message: 'Before publishing your project to other local mechanics, make sure you understand and are satisfied with ' + reviewProject.project.poster.username + '\'s description of what is wrong with your ' + reviewProject.project.vehicle.make + ': <br /><br /><strong>' + reviewProject.project.description + '</strong><br /><br />Other mechanics will use this description to place estimates on the parts &amp; labor to fix your ' + reviewProject.project.vehicle.make + '. Are you satisfied with this description?',
            yes: function() {
                modal.confirm({
                    title: 'Publish Project?',
                    message: 'You are about to open this diagnosis for other mechanics to place estimates on. You will still be able to hire ' + reviewProject.project.poster.username + ' at any time while you gather other potential estimates for cost of parts and labor from other mechanics. Do you wish to continue?',
                    yes: function() {
                        modal.notify({
                            title: 'Publishing Job',
                            message: 'We are currently opening your job up for estimates. As soon as this process is complete, your job will go from a draft to a publicly-available job.',
                            loading: true,
                            canOkay: false,
                            canExit: false
                        });

                        reviewProject.releasePayment(function() {
                            var request = $.ajax({
                                method: 'POST',
                                url: '/api/project/' + reviewProject.project._id + '/publish',
                                data: {},
                                dataType: 'json'
                            });

                            request.done(function(data) {
                                modal.notify({
                                    title: 'Job Published',
                                    message: 'Your job has been opened up to the public for estimates. You will be notified as soon as you start receiving bids from the mechanics in your area.',
                                    okay: function() {
                                        reviewProject.rate();
                                    },
                                    exit: function() {
                                        reviewProject.rate();
                                    }
                                });
                            });

                            request.fail(function(jqXHR) {
                                console.log(jqXHR);
                                modal.notify({
                                    title: 'Publishing Error',
                                    message: 'There was a problem while publishing your job. If you continue to receive this error, please contact us.'
                                });
                            });
                        });
                    }
                });   
            },
            no: function() {
                modal.confirm({
                    title: 'Request More Info?',
                    message: 'Would you like to request more information from ' + reviewProject.project.poster.username + '?',
                    yes: function() {
                        chat.conversations.start([reviewProject.project.poster._id]);
                    }
                });
            },
            exit: function() {}
        });
    }
};

$(document).ready(function() {
    reviewProject.init();
});
