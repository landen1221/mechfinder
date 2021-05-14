var buyerEstimates = {
    user: null,
    project: null,
    braintree: {
        sdk: null,
        client: null
    },

    init: function() {
        if(util.is.nil(USER) || util.is.nil(PROJECT) || util.is.nil(braintree)) { 
            window.location.reload(true);
        } else {
            buyerEstimates.user = USER;
            buyerEstimates.project = PROJECT;
            buyerEstimates.braintree.sdk = braintree;

            buyerEstimates.clicks.init();

            var releaseEstimateId = util.url.paramsToObject()['releasePayment'];
            if(releaseEstimateId) {
                buyerEstimates.releaseFunds(releaseEstimateId);
            }
        }
    },

    clicks: {
        clicked: {
            publishDraft: false,
            releaseFunds: false,
            rateMechanic: false
        },

        init: function() {
            $('.publishDraft').off('click touchmove touchend').on('click touchmove touchend', function(e) {
                if(e.type !== 'touchmove' && !buyerEstimates.clicks.clicked.publishDraft) {
                    buyerEstimates.clicks.clicked.publishDraft = true;
                    setTimeout(function() {
                        buyerEstimates.clicks.clicked.publishDraft = false;
                    }, 300);

                    buyerEstimates.publishDraft();
                }
            });

            $('.releaseFunds').off('click touchmove touchend').on('click touchmove touchend', function(e) {
                if(e.type !== 'touchmove' && !buyerEstimates.clicks.clicked.releaseFunds) {
                    buyerEstimates.clicks.clicked.releaseFunds = true;
                    setTimeout(function() {
                        buyerEstimates.clicks.clicked.releaseFunds = false;
                    }, 300);

                    buyerEstimates.releaseFunds($(this).attr('data-bid'));
                }
            });

            $('.rateMechanic').off('click touchmove touchend').on('click touchmove touchend', function(e) {
                if(e.type !== 'touchmove' && !buyerEstimates.clicks.clicked.rateMechanic) {
                    buyerEstimates.clicks.clicked.rateMechanic = true;
                    setTimeout(function() {
                        buyerEstimates.clicks.clicked.rateMechanic = false;
                    }, 300);

                    buyerEstimates.rateMechanic();
                }
            });
        }
    },

    estimateWithId: function(estimateId, indexOnly) {
        indexOnly = (typeof indexOnly === 'boolean') ? indexOnly : false;

        var bid;
        for(var i=0; i<buyerEstimates.project.bids.length; i++) {
            bid = buyerEstimates.project.bids[i];
            if(bid._id == estimateId) {
                return (indexOnly) ? i : bid;
            }
        }

        return (indexOnly) ? -1 : null;
    },

    releaseFunds: function(estimateId) {
        var estimate = util.estimate.virtualize(buyerEstimates.estimateWithId(estimateId));

        if(estimate) {
            modal.confirm({
                title: 'Release Payment?',
                message: 'Are you sure you want to release your ' + util.currency.centsToDollars(estimate.buyerTotal) + ' payment to the mechanic?',
                yes: function() {
                    var body = {
                        estimateId: estimateId,
                        projectId: buyerEstimates.project._id
                    }

                    modal.notify({
                        canOkay: false,
                        canExit: false,
                        title: 'Releasing Funds',
                        message: 'We are currently getting your funds from escrow and sending them to the Mechanic. This may take a few moments, so thank you for your patience.'
                    });

                    var request = $.ajax({
                        type: 'POST',
                        url: '/api/braintree/releaseEstimateTransaction',
                        data: body,
                        dataType: 'json'
                    });

                    request.done(function(data) {
                        var lastOneDone = true;
                        if(!util.is.nil(data.estimate)) {
                            buyerEstimates.project.bids[buyerEstimates.estimateWithId(data.estimate._id, true)] = data.estimate;
                            var bid;
                            for(var i=0; i<buyerEstimates.project.bids.length; i++) {
                                bid = buyerEstimates.project.bids[i];
                                if(bid.state != 'retracted' && bid.state != 'canceled' && bid.state != 'released') {
                                    // bid is still waiting
                                    lastOneDone = false;
                                    break;
                                }
                            }
                        } else {
                            lastOneDone = false;
                        }

                        if(lastOneDone) {
                            modal.confirm({
                                title: 'Funds Released',
                                message: 'Your funds have been released and your job is now complete. Would you like to take the time to rate your mechanic?',
                                yes: function() {
                                    buyerEstimates.rateMechanic();
                                },
                                no: function() {
                                    window.location.reload(true);
                                }
                            });
                        } else {
                            modal.notify({
                                title: 'Funds Released',
                                message: 'Your funds have been released from escrow and sent to the mechanic. Thank you for using MechFinder!',
                                okay: function() {
                                    window.location.reload(true);
                                },
                                exit: function() {
                                    window.location.reload(true);
                                }
                            });
                        }
                    });

                    request.fail(function(jqXHR) {
                        console.log(jqXHR);
                        var braintreeErrors = (!util.is.nil(jqXHR.responseJSON.braintreeErrors)) ? jqXHR.responseJSON.braintreeErrors : [{code: -1}];

                        for(var i=0; i<braintreeErrors.length; i++) {
                            var err = braintreeErrors[i];
                            switch(err.code) {
                                case '91561':
                                    var escrowStatus = (!util.is.nil(jqXHR.responseJSON.escrowStatus)) ? jqXHR.responseJSON.escrowStatus : 'other';

                                    switch(escrowStatus) {
                                        case 'hold_pending':
                                            modal.notify({
                                                title: 'Still Processing',
                                                message: 'Your funds could not be released at this time because they are currently being processed for escrow. Please try again in a few hours to see if your transaction has come through. If this error persists, contact us for more information.',
                                                okay: function() {
                                                    window.location.reload(true);
                                                },
                                                cancel: function() {
                                                    window.locations.reload(true);
                                                }
                                            });
                                            break;
                                        case 'release_pending':
                                        case 'released':
                                            modal.notify({
                                                title: 'Already Released',
                                                message: 'It appears as though your funds are already in the process of being released from escrow. You should see the status of this estimate change shortly. If this error persists, please contact us for more info.',
                                                okay: function() {
                                                    window.location.reload(true);
                                                },
                                                cancel: function() {
                                                    window.locations.reload(true);
                                                }
                                            });
                                            break;
                                        case 'refunded':
                                            modal.notify({
                                                title: 'Refunded',
                                                message: 'It appears as though the transaction for this estimate has already been refunded to your account. Please contact your mechanic for more information.',
                                                okay: function() {
                                                    window.location.reload(true);
                                                },
                                                cancel: function() {
                                                    window.locations.reload(true);
                                                }
                                            });
                                        default:
                                            modal.notify({
                                                title: 'Unable to Release',
                                                message: 'Your funds could not be released from escrow at this time. Please contact us if this error persists.',
                                                okay: function() {
                                                    window.location.reload(true);
                                                },
                                                cancel: function() {
                                                    window.locations.reload(true);
                                                }
                                            });
                                            break;
                                    }

                                    break;
                                default:
                                    modal.notify({
                                        title: 'Error',
                                        message: 'There was an error while releasing your funds to the Mechanic. If this error persists, please contact us so that we can resolve the issue as quickly as possible.',
                                        okay: function() {
                                            window.location.reload(true);
                                        },
                                        cancel: function() {
                                            window.locations.reload(true);
                                        }
                                    });
                                    break;
                            }
                        }
                    });
                },
            });
        }
    },

    rateMechanic: function() {
        modal.rating({
            targetRole: 'seller',
            cancel: function() {
                window.location.reload(true)
            },
            submit: function(rating, feedback) {
                var body = {
                    rating: rating,
                    feedback: feedback
                }

                var request = $.ajax({
                    type: 'POST',
                    url: '/api/project/' + buyerEstimates.project._id + '/rate',
                    data: body,
                    dataType: 'json'
                });

                request.done(function(rating) {
                    console.log('rating submitted');
                    // used to move on here, but now we're just gonna assume success and move on
                });

                request.fail(function(jqXHR) {
                    console.log(jqXHR);
                });

                modal.mfRating({
                    cancel: function() {
                        window.location.reload(true);
                    },
                    submit: function(rating, feedback) {
                        console.log('good job yourated so well: ');
                        console.log(rating);
                        console.log(feedback);
                        console.log('posting that to the back-end');

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
                                skip: function() { window.location.reload(true); },
                                tile: function() { window.location.reload(true); },
                                exit: function() { window.location.reload(true); }
                            });
                        } else {
                            modal.notify({
                                title: 'Thanks for the Feedback',
                                message: 'Thank you for your feedback! We use comments and feedback like yours to make MechFinder better and better every day!',
                                okay: function() { window.location.reload(true); },
                                exit: function() { window.location.reload(true); }
                            })
                        }
                    }
                });
            }
        });
    },

    publishDraft: function() {
        modal.confirm({
            title: 'Publish Job?',
            message: 'Are you sure you wish to open this job to estimates?',
            yes: function() {
                modal.notify({
                    title: 'Publishing Job',
                    message: 'We are currently opening your job up for estimates. As soon as this process is complete, your job will go from a draft to a publicly-available job.',
                    loading: true,
                    canOkay: false,
                    canExit: false
                });

                var request = $.ajax({
                    method: 'POST',
                    url: '/api/project/' + buyerEstimates.project._id + '/publish',
                    data: {},
                    dataType: 'json'
                });

                request.done(function(data) {
                    modal.notify({
                        title: 'Job Published',
                        message: 'Your job has been opened up to the public for estimates. You will be notified as soon as you start receiving bids from the mechanics in your area.',
                        okay: function() {
                            window.location.reload(true);
                        },
                        exit: function() {
                            window.location.reload(true);
                        }
                    });
                });

                request.fail(function(jqXHR) {
                    console.log(jqXHR);
                    modal.notify({
                        title: 'Publishing Error',
                        message: 'There was a problem while publishing your job. If you continue to receive this error, please contact us.',
                        okay: function() {
                            window.location.reload(true);
                        },
                        cancel: function() {
                            window.locations.reload(true);
                        }
                    });
                });
            },
            no: function() {
                modal.notify({
                    title: 'Job Publishing Canceled',
                    message: 'You have chosen not to publish your job. If you change your mind down the road, feel free to find this job and publish it at any time.',
                    okay: function() {
                        window.location.reload(true);
                    },
                    cancel: function() {
                        window.locations.reload(true);
                    }
                });
            }
        });
    }
};

$(document).ready(function() {
    buyerEstimates.init();
});