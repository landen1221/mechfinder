$(document).ready(function(e) {
    viewEstimates.init();
});

var viewEstimates = {
    user: null,
    project: null,

    init: function() {
        if(util.is.nil(USER) || util.is.nil(PROJECT)) return window.location.reload(true);

        viewEstimates.user = USER;
        viewEstimates.project = PROJECT;

        viewEstimates.clicks.init();
        $('#estimatesTable').stacktable({myClass: 'mobile-stacktable', estimatesTable: true});
        $('#acceptedEstimatesTable').stacktable({myClass: 'mobile-stacktable', estimatesTable: true});
        $('#ratingsTable').stacktable({myClass: 'mobile-stacktable', estimatesTable: true});
    },

    clicks: {
        clicked: {
            document: false,
            viewWorkorder: false
        },

        shown: {
            actionMenu: false
        },

        init: function() {
            $(document).on('click touchend touchmove', function(e) {
                if(!e.type != 'touchmove' && !viewEstimates.clicks.clicked.document) {
                    viewEstimates.clicks.clicked.document = true;
                    setTimeout(function() {
                        viewEstimates.clicks.clicked.document = false;
                    }, 300);

                    var target = e.target;
                    if($(target).hasClass('estimateDropdown')) {
                        viewEstimates.clicks.toggleEstimateActionMenu($(target).children('.dropdown'));
                    } else if($(target).hasClass('estimateDropdownIcon')) {
                        viewEstimates.clicks.toggleEstimateActionMenu($(target).parent().children('.dropdown'));
                    } else {
                        viewEstimates.clicks.toggleEstimateActionMenu();
                    }
                }
            });

            $('.viewWorkorder').off('click touchmove touchend').on('click touchmove touchend', function(e) {
                if(e.type != 'touchmove' && !viewEstimates.clicks.clicked.viewWorkorder) {
                    viewEstimates.clicks.clicked.viewWorkorder = true;
                    setTimeout(function() {
                        viewEstimates.clicks.clicked.viewWorkorder = false;
                    }, 300);

                    viewEstimates.viewWorkorder($(this).attr('data-bid'));
                }
            });
        },

        toggleEstimateActionMenu: function($element) {
            if(viewEstimates.clicks.shown.actionMenu || typeof($element) == 'undefined') {
                $('.dropdown').stop().fadeOut(200);
                viewEstimates.clicks.shown.actionMenu = false;
            } else {
                $element.stop().fadeIn(200);
                viewEstimates.clicks.shown.actionMenu = true;
            }
        },
    },

    viewWorkorder: function(estimateId) {
        var estimate = null;
        for(i=0; i<viewEstimates.project.bids.length; i++) {
            bid = viewEstimates.project.bids[i];
            if(bid._id == estimateId) {
                estimate = bid;
                break;
            }
        }

        if(!util.is.nil(estimate)) {
            modal.estimate({
                title: 'Estimate View',
                message: 'Estimate by: <a href="/profile/' + estimate.owner._id + '" target="_blank">' + estimate.owner.username + '</a><br /><br />If you want to hire the mechanic for this estimate, click the Hire button at the bottom of this workorder:',
                estimate: estimate,
                project: viewEstimates.project,
                user: viewEstimates.user,
                accept: function(estimate) {
                    if(!util.is.nil(projectHire)) {
                        projectHire.hire(estimate);
                    }
                }
            });
        }
    }
};

var viewProjectOld = { // will remove all of this when I'm done with it'
    user: null,
    project: null,
    braintree: null,
    braintreeClient: null,

    init: function() {
        if(!PROJECT) window.location = '/';
        viewProject.user = USER;
        viewProject.project = PROJECT;
        
        if(util.is.nil(braintree)) {
            // we couldn't grab braintree client sdk for some reason, refresh the page
            window.location.reload(true);
        } else {
            viewProject.braintree = braintree;
        }

        if(!util.is.nil(viewProject.user)) viewProject.estimates.init();
    },

    estimateWithId: function(estimateId, indexOnly) {
        indexOnly = (typeof indexOnly === 'boolean') ? indexOnly : false;

        var bid;
        for(var i=0; i<viewProject.project.bids.length; i++) {
            bid = viewProject.project.bids[i];
            if(bid._id == estimateId) {
                return (indexOnly) ? i : bid;
                break;
            }
        }

        return (indexOnly) ? -1 : null;
    },

    estimates: {
        init: function() {
            if(viewProject.user.role == 'buyer') {
                viewProject.estimates.buyer.init();
            } else if(viewProject.user.role == 'seller') {
                viewProject.estimates.seller.init();
            }

            $('.view-workorder').on('click touchstart', function(e) {
                if(!viewProject.estimates.hired.documentClicked) {
                    viewProject.estimates.hired.documentClicked = true;
                    setTimeout(function() { viewProject.estimates.hired.documentClicked = false; }, 300);
                    viewProject.estimates.viewWorkorder($(this).attr('data-bid'), !$(this).hasClass('no-breakdown'));
                }
            });

            if(!util.is.nil(viewProject.project.assigned)) {
                viewProject.estimates.hired.init();
            }

            if(viewProject.project.state == 'finished') {
                viewProject.estimates.finished.init();
            }


            $(document).on('click touchend touchmove', function(e) {
                if(!viewProject.estimates.hired.documentClicked && e.type != 'touchmove') {
                    viewProject.estimates.hired.documentClicked = true;
                    setTimeout(function() { viewProject.estimates.hired.documentClicked = false; }, 300);

                    var target = e.target;
                    if($(target).hasClass('estimateDropdown')) {
                        viewProject.estimates.toggleEstimateActionMenu($(target).children('.dropdown'));
                    } else {
                        viewProject.estimates.toggleEstimateActionMenu();
                    }
                }
            });
        },

        finished: {
            init: function() {
                viewProject.estimates.finished.initClicks();
            },

            initClicks: function() {
                $('.rate-mechanic').off('click').on('click', function(e) {
                    viewProject.estimates.finished.rate('seller');
                });


                $('.rate-customer').off('click').on('click', function(e) {
                    viewProject.estimates.finished.rate('buyer');
                });
            },

            rate: function(role) {
                if(role != 'buyer' && role != 'seller') return null;

                if(role == 'buyer' && viewProject.project.buyerRated) {
                    modal.notify({
                        title: 'Customer Rated',
                        message: 'It looks like you have already rated the customer for this job. If you continue to receive this message, contact us.'
                    });

                    $('.rate-customer').remove();
                } else if(role == 'seller' && viewProject.project.sellerRated) {
                    modal.notify({
                        title: 'Mechanic Rated',
                        message: 'It looks like you have already rated the mechanic for this job. If you continue to receive this message, contact us.'
                    });

                    $('.rate-mechanic').remove();
                } else {
                    modal.rating({
                        targetRole: role,
                        submit: function(rating, feedback) {
                            modal.notify({
                                title: 'Sending Rating',
                                message: 'We currently saving your rating. This may take a few moments, so thank you for your patience.',
                                canOkay: false,
                                canExit: false
                            });

                            var body = {
                                rating: rating,
                                feedback: feedback
                            }

                            var request = $.ajax({
                                type: 'POST',
                                url: '/api/project/' + viewProject.project._id + '/rate',
                                data: body,
                                dataType: 'json'
                            });

                            request.done(function(rating) {
                                $('.rate-customer, .rate-mechanic').remove();
                                modal.notify({
                                    title: 'Rated',
                                    message: 'Your rating has been sent! Thank you for using MechFinder',
                                });
                            });

                            request.fail(function(jqXHR) {
                                console.log(jqXHR);
                                modal.notify({
                                    title: 'Unable to Rate',
                                    message: 'There was an issue while rating your mechanic. If the rating did not go through, you will be able to rate your mechanic at a later time. If this error persists, please contact us.',
                                    okay: function() {
                                        window.location.reload(true);
                                    },
                                    cancel: function() {
                                        window.location.reload(true);
                                    }
                                });
                            });
                        }
                    });
                }
            }
        },

        hired: {
            documentClicked: false,
            menuShown: false,
            draftSkip: {
                photos: false,
                estimate: false,
                firstEstimate: false
            },
            draft: {
                estimateId: null,
                vehicle: null,
                vehicleId: '',
                repair: '',
                description: '',
                tow: null,
                photos: [],
                firstEstimate: null
            },

            init: function() {
                viewProject.estimates.hired.initClicks();
            },

            initClicks: function() {
                $('.request-payment').off('click touchstart').on('click', function() {
                    if(!viewProject.estimates.hired.documentClicked) {
                        viewProject.estimates.hired.documentClicked = true;
                        setTimeout(function() { viewProject.estimates.hired.documentClicked = false; }, 300);
                        viewProject.estimates.hired.requestPayment($(this).attr('data-bid'));
                    }
                });

                $('.add-estimate').off('click').on('click touchstart', function() {
                    if(!viewProject.estimates.hired.documentClicked) {
                        viewProject.estimates.hired.documentClicked = true;
                        setTimeout(function() { viewProject.estimates.hired.documentClicked = false; }, 300);
                        viewProject.estimates.hired.addEstimate();
                    }
                });

                $('.release-funds').off('click').on('click touchstart', function() {
                    if(!viewProject.estimates.hired.documentClicked) {
                        viewProject.estimates.hired.documentClicked = true;
                        setTimeout(function() { viewProject.estimates.hired.documentClicked = false; }, 300);
                        viewProject.estimates.hired.releaseFunds($(this).attr('data-bid'));
                    }
                });

                $('.cancel-estimate').off('click').on('click touchstart', function() {
                    if(!viewProject.estimates.hired.documentClicked) {
                        viewProject.estimates.hired.documentClicked = true;
                        setTimeout(function() { viewProject.estimates.hired.documentClicked = false; }, 300);
                        viewProject.estimates.hired.cancelEstimate($(this).attr('data-bid'));
                    }
                });
            },

            feedback: function() {
                modal.rating({
                    targetRole: 'seller',
                    cancel: function() {
                        window.location.reload(true)
                    },
                    submit: function(rating, feedback) {
                        modal.notify({
                            title: 'Sending Rating',
                            message: 'We currently saving your rating. This may take a few moments, so thank you for your patience.',
                            canOkay: false,
                            canExit: false
                        });

                        var body = {
                            rating: rating,
                            feedback: feedback
                        }

                        var request = $.ajax({
                            type: 'POST',
                            url: '/api/project/' + viewProject.project._id + '/rate',
                            data: body,
                            dataType: 'json'
                        });

                        request.done(function(rating) {
                            modal.notify({
                                title: 'Rated',
                                message: 'Your rating has been sent! Thank you for using MechFinder',
                                okay: function() {
                                    window.location.reload(true);
                                },
                                cancel: function() {
                                    window.location.reload(true);
                                }
                            });
                        });

                        request.fail(function(jqXHR) {
                            console.log(jqXHR);
                            modal.notify({
                                title: 'Unable to Rate',
                                message: 'There was an issue while rating your mechanic. If the rating did not go through, you will be able to rate your mechanic at a later time. If this error persists, please contact us.',
                                okay: function() {
                                    window.location.reload(true);
                                },
                                cancel: function() {
                                    window.location.reload(true);
                                }
                            });
                        });
                    }
                });
            },

            releaseFunds: function(estimateId) {
                modal.confirm({
                    title: 'Release Payment?',
                    message: 'Are you sure you want to release this payment to the mechanic?',
                    yes: function() {
                        var body = {
                            estimateId: estimateId,
                            projectId: viewProject.project._id
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
                                viewProject.project.bids[viewProject.estimateWithId(data.estimate._id, true)] = data.estimate;
                                var bid;
                                for(var i=0; i<viewProject.project.bids.length; i++) {
                                    bid = viewProject.project.bids[i];
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
                                        viewProject.estimates.hired.feedback();
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
                                        modal.notify({
                                            title: 'Error',
                                            message: 'There was an error while releasing your funds to the Mechanic. If this error persists, please contact us so that we can resolve the issue as quickly as possible.'
                                        });
                                        break;
                                }
                            }
                        });
                    },
                });
            },

            addEstimate: function() {
                if(viewProject.project.state == 'bidding' || viewProject.project.assigned._id == viewProject.user._id) {
                    modal.estimate({
                        user: viewEstimates.user,
                        project: viewEstimates.project,
                        edit: true,
                        place: function(estimate) {

                            var body = estimate;

                            var request = $.ajax({
                                type: 'POST',
                                url: '/api/project/' + viewProject.project._id + '/bid',
                                data: body,
                                dataType: 'json'
                            });

                            request.done(function(project) {
                                modal.notify({
                                    title: 'Estimate Submitted',
                                    message: 'Your estimate has been submitted and the customer has been notified. Thank you for placing an estimate.',
                                    okay: function() {
                                        window.location.reload(true);
                                    },
                                    exit: function() {
                                        window.location.reload(true);
                                    }
                                });

                                viewProject.estimates.hired.initClicks();
                                viewProject.estimates.seller.initClicks();
                            });

                            request.fail(function(jqXHR) {
                                console.log(jqXHR);
                                modal.notify({
                                    title: 'Error',
                                    message: 'There was a problem while bidding on this job. If this issue persists, please contact us for more information.',
                                    okay: function() {
                                        window.location.reload(true)
                                    },
                                    exit: function() {
                                        window.location.reload(true)
                                    }
                                });
                            });
                        }
                    });
                } else {
                    modal.notify({
                        title: 'Error',
                        message: 'You are currently not permitted to add bids to this job. If you have received this message erroneously, please contact us for support.'
                    })
                }
            },

            cancelEstimate: function(estimateId) {
                var estimate = viewProject.estimateWithId(estimateId);
                if(!util.is.nil(estimate)) {
                    if(estimate.state === 'submitted') {
                        modal.confirm({
                            title: 'Cancel Estimate?',
                            message: 'Are you sure you want to cancel your estimate?',
                            yes: function() {
                                modal.notify({
                                    title: 'Canceling Estimate',
                                    message: 'Your estimate is currently being canceled.',
                                    canExit: false,
                                    canOkay: false,
                                    loading: true
                                });
                                
                                var body = {
                                    estimateId: estimate._id
                                }

                                var request = $.ajax({
                                    type: 'POST',
                                    url: '/api/project/' + viewProject.project._id + '/retractBid',
                                    data: body,
                                    dataType: 'json'
                                });

                                request.done(function(estimate) {
                                    viewProject.project.bids[viewProject.estimateWithId(estimate._id, true)] = estimate;
                                    modal.notify({
                                        title: 'Estimate Canceled',
                                        message: 'Your estimate has been canceled.'
                                    });

                                    $('#estimateRow' + estimate._id).remove();
                                });

                                request.fail(function(jqXHR) {
                                    console.log(jqXHR);
                                    modal.notify({
                                        title: 'Error',
                                        message: 'There was a problem while canceling your estimate. Please contact your customer and let them know that you would no longer like your estimate to be considered for hire. If you continue to receive this message, please contact us.'
                                    });
                                });
                            }
                        });
                    } else {
                        modal.notify({
                            title: 'Cannot Cancel',
                            message: 'You cannot cancel a bid that has already been accepted by the customer.'
                        });
                    }
                }
            },

            draftSubmit: function(estimateId, draft) {
                modal.notify({
                    title: 'Submitting Draft',
                    message: 'We are currently sending your draft to the customer. Once the draft is processed, your request for payment will be sent to the customer automatically. This may take a few moments, so thank you for your patience.',
                    canExit: false,
                    canOkay: false,
                    loading: true
                });

                var body = {
                    parent: viewProject.project._id,
                    owner: viewProject.project.owner._id,
                    draft: true,
                    vehicle: draft.vehicleId,
                    title: viewProject.project.title + ' (Diagnosed)',
                    description: draft.description,
                    tow: draft.tow,
                    repair: draft.repair,
                    photos: draft.photos,
                    diagnosis: false,
                    firstEstimate: draft.firstEstimate
                };

                var request = $.ajax({
                    type: 'POST',
                    url: '/api/project',
                    data: body,
                    dataType: 'json'
                });

                request.done(function(data) {
                    viewProject.project.child = data.project;
                    if(!util.is.nil(viewProject.estimates.hired.draft.firstEstimate)) {
                        viewProject.estimates.hired.estimateOnDraft(estimateId, viewProject.estimates.hired.draft.firstEstimate);
                    } else {
                        // they didn't do a first estimate
                        viewProject.estimates.hired.requestPayment(estimateId);
                    }
                });

                request.fail(function(jqXHR) {
                    console.log(jqXHR);
                });
            },

            requestPayment: function(estimateId, draft) {
                var estimate = viewProject.estimateWithId(estimateId);
                if(!util.is.nil(estimate)) {
                    if(estimate.state === 'accepted') {
                        if(viewProject.project.diagnosis && util.is.nil(viewProject.project.child)) {
                            if(util.is.nil(draft)) {
                                modal.confirm({
                                    title: 'Draft Project',
                                    message: 'In order to request payment for a diagnosis, you are required to draft a job for the customer describing the parts and labor required to fix the problems you have diagnosed. Would you like to start this process now?',
                                    yes: function() {
                                        viewProject.estimates.hired.draftProject(estimateId);
                                    },
                                    no: function() {
                                        viewProject.estimates.hired.draftCancel();
                                    }
                                });
                            } else {
                                viewProject.estimates.hired.draftSubmit(estimateId, draft);
                            }
                        } else {
                            modal.notify({
                                title: 'Requesting Payment',
                                message: 'We are currently sending the payment request to the customer. This may take a few moments, so thank you for your patience.',
                                loading: true
                            });

                            var body = {
                                estimateId: estimate._id
                            }

                            var request = $.ajax({
                                type: 'POST',
                                url: '/api/project/' + viewProject.project._id + '/requestPayment',
                                data: body,
                                dataType: 'json'
                            });

                            request.done(function(estimate) {
                                viewProject.project.bids[viewProject.estimateWithId(estimate._id, true)] = estimate;
                                modal.notify({
                                    title: 'Payment Requested',
                                    message: 'We have notified the customer of your request for payment. If the request is accepted, job funds are released to you. If the request is declined, contact the customer to try to identify and resolve any issues.'
                                });

                                $('#estimateState'+ estimate._id).html('Payment Requested');
                                $('.request-payment[data-bid="' + estimate._id + '"]').remove();
                            });

                            request.fail(function(jqXHR) {
                                console.log(jqXHR);
                                modal.notify({
                                    title: 'Error',
                                    message: 'There was a problem while requesting a payment on this estimate. If you continue to receive this message, please contact us.'
                                });
                            });
                        }
                    } else {
                        modal.notify({
                            title: 'Cannot Request Payment',
                            message: 'You cannot request a payment on this bid. Please contact us if you have any questions regarding the status of this estimate.'
                        });
                    }
                }
            },

            draftProject: function(estimateId) {
                if(!util.is.nil(estimateId)) viewProject.estimates.hired.draft.estimateId = estimateId;
                if(viewProject.user.role != 'seller') return null;

                if(util.is.nil(viewProject.estimates.hired.draft.vehicleId))
                    return viewProject.estimates.hired.draftVehicle();

                if(util.is.nil(viewProject.estimates.hired.draft.repair))
                    return viewProject.estimates.hired.draftRepair();

                if(util.is.nil(viewProject.estimates.hired.draft.description))
                    return viewProject.estimates.hired.draftDescription();

                if(typeof(viewProject.estimates.hired.draft.tow) !== 'boolean')
                    return viewProject.estimates.hired.draftTow();

                if(!viewProject.estimates.hired.draftSkip.photos && viewProject.estimates.hired.draft.photos.length <= 0)
                    return viewProject.estimates.hired.draftPhotos();

                if(!viewProject.estimates.hired.draftSkip.estimate)
                    return viewProject.estimates.hired.draftPlaceEstimate();

                if(!viewProject.estimates.hired.draftSkip.firstEstimate && util.is.nil(viewProject.estimates.hired.draft.firstEstimate))
                    return viewProject.estimates.hired.draftFirstEstimate();

                viewProject.estimates.hired.requestPayment(viewProject.estimates.hired.draft.estimateId, viewProject.estimates.hired.draft);
            },

            draftCancel: function() {
                modal.notify({
                    title: 'Payment Request Canceled',
                    message: 'Your payment request has been canceled. In order to have funds released to you, please come back and fill out a new job for the customer.'
                });
            },

            estimateOnDraft: function(estimateId, firstEstimate) {
                var body = firstEstimate;

                modal.notify({
                    title: 'Submitting Estimate',
                    message: 'We are currently submitting your estimate. It will be the first one to show up on the job. This may take a few moments, so thank you for your patience.',
                    loading: true
                });

                var request = $.ajax({
                    type: 'POST',
                    url: '/api/project/' + viewProject.project.child._id + '/bid',
                    data: body,
                    dataType: 'json'
                });

                request.done(function(project) {
                    viewProject.estimates.hired.requestPayment(estimateId);
                });

                request.fail(function(jqXHR) {
                    console.log(jqXHR);
                    modal.notify({
                        title: 'Error',
                        message: 'There was a problem while submitting your bid. Please contact us if this error persists.'
                    });
                });
            },

            draftFirstEstimate: function() {
                var estimate = viewProject.estimateWithId(viewProject.estimates.hired.draft.estimateId);

                var waiveFee = (!util.is.nil(estimate) && estimate.diagnosisWaived && estimate.estimate);
                var waiveAmount = (waiveFee) ? estimate.estimate : -1;
                var msg = (waiveFee) ? ' You have opted to waive your diagnosis fee if hired for this job, so this will show up on your estimate for this new job.' : '';
                modal.estimate({
                    title: 'First Estimate',
                    message: 'Since you did the diagnosis, you will be the first estimate on this job. Include the parts and labor below required to fix the problems that you have diagnosed.' + msg,
                    placeText: 'Submit',
                    cancelText: 'Skip',
                    waivedDiagnosisFee: waiveAmount,
                    place: function(estimate) {
                        viewProject.estimates.hired.draft.firstEstimate = estimate;
                        viewProject.estimates.hired.draftProject();
                    },
                    cancel: function() {
                        viewProject.estimates.hired.draftSkip.firstEstimate = true;
                        viewProject.estimates.hired.draftProject();
                    },
                    exit: function() {
                        viewProject.estimates.hired.draftCancel();
                    }
                });
            },

            draftPlaceEstimate: function() {
                modal.confirm({
                    title: 'Place an Estimate',
                    message: 'You are almost done submitting a new job for the user. Would you like to be the first mechanic to place an estimate on the new job you are creating?',
                    yes: function() {
                        viewProject.estimates.hired.draftSkip.estimate = true;
                        viewProject.estimates.hired.draftProject();
                    },
                    no: function() {
                        viewProject.estimates.hired.draftSkip.estimate = true;
                        viewProject.estimates.hired.draftSkip.firstEstimate = true;
                        viewProject.estimates.hired.draftProject();
                    },
                    exit: function() {
                        viewProject.estimates.hired.draftCancel();
                    }
                });
            },

            draftPhotos: function() {
                modal.photos({
                    submitText: 'Next',
                    cancelText: 'Skip',
                    allowEmpty: true,
                    submit: function(photos) {
                        if(photos.length <= 0) viewProject.estimates.hired.draftSkip.photos = true;
                        viewProject.estimates.hired.draft.photos = [];
                        for(var i=0; i<photos.length; i++) {
                            viewProject.estimates.hired.draft.photos.push(photos[i].data);
                        }
                        viewProject.estimates.hired.draftProject();
                    },
                    cancel: function() {
                        viewProject.estimates.hired.draftSkip.photos = true;
                        viewProject.estimates.hired.draftProject();
                    },
                    exit: function() {
                        viewProject.estimates.hired.draftCancel();
                    }
                });
            },

            draftTow: function() {
                modal.confirm({
                    title: 'Towing',
                    message: 'Will the customer\'s vehicle need to be towed?',
                    yes: function() {
                        viewProject.estimates.hired.draft.tow = true;
                        viewProject.estimates.hired.draftProject();
                    },
                    no: function() {
                        viewProject.estimates.hired.draft.tow = false;
                        viewProject.estimates.hired.draftProject();
                    },
                    exit: function() {
                        viewProject.estimates.hired.draftCancel();
                    }
                })
            },

            draftDescription: function() {
                modal.input({
                    title: 'Description',
                    message: 'Describe the problem in detail and any fixes or recommendations that you have for the vehicle:',
                    textarea: true,
                    submit: function(text) {
                        viewProject.estimates.hired.draft.description = text;
                        viewProject.estimates.hired.draftProject();
                    },
                    cancel: function() {
                        viewProject.estimates.hired.draftCancel();
                    }
                })
            },

            draftRepair: function() {
                modal.select({
                    title: 'Service Type',
                    message: 'Select the category of service that best fits the needs of the customer:',
                    options: [
                        { value: 'Auto Repair' },
                        { value: 'Audio' },
                        { value: 'Body Work' },
                        { value: 'Electrical' },
                        { value: 'Maintenance' },
                        { value: 'Restoration' },
                        { value: 'Windows' },
                        { value: 'Tires' }
                    ],
                    submit: function(value) {
                        viewProject.estimates.hired.draft.repair = value;
                        viewProject.estimates.hired.draftProject();
                    },
                    cancel: function() {
                        viewProject.estimates.hired.draftCancel();
                    }
                });
            },

            draftVehicle: function() {
                var previous = viewProject.project.vehicle;
                modal.vehicle({
                    title: 'Review Vehicle',
                    message: 'Make sure all of the following information is correct in regards to the customer\'s vehicle:',
                    vehicle: viewProject.project.vehicle,
                    submit: function(vehicle) {
                        if(previous.make == vehicle.make && previous.model == vehicle.model && previous.year == vehicle.year && previous.engine == vehicle.engine && previous.mileage == vehicle.mileage) {
                            viewProject.estimates.hired.draft.vehicle = vehicle;
                            viewProject.estimates.hired.draft.vehicleId = viewProject.project.vehicle._id;
                            viewProject.estimates.hired.draftProject();
                        } else {
                            modal.notify({
                                title: 'Saving Vehicle',
                                message: 'We are currently saving your updated vehicle information. This may take a few moments, so thank you for your patience.',
                                loading: true
                            });

                            vehicle._id = viewProject.project.vehicle._id;
                            var body = {
                                vehicle: vehicle,
                                projectId: viewProject.project._id
                            }

                            // save the vehicle
                            var request = $.ajax({
                                type: "PUT",
                                url: '/api/profile/vehicle',
                                data: body,
                                dataType: 'json'
                            });

                            request.done(function(vehicle) {
                                viewProject.project.vehicle = vehicle;
                                viewProject.estimates.hired.draft.vehicle = vehicle;
                                viewProject.estimates.hired.draft.vehicleId = vehicle._id;
                                viewProject.estimates.hired.draftProject();
                            });

                            request.fail(function(jqXHR) {
                                console.log(jqXHR);
                                modal.notify({
                                    title: 'Error',
                                    message: 'There was a problem while saving the updated vehicle data. If this prolbem persists, please contact us for more information.'
                                });
                            });
                        }
                    },
                    cancel: function() {
                        viewProject.estimates.hired.draftCancel();
                    }
                });
            }
        },

        toggleEstimateActionMenu: function($element) {
            if(viewProject.estimates.hired.menuShown || typeof($element) == 'undefined') {
                $('.dropdown').stop().fadeOut(200);
                viewProject.estimates.hired.menuShown = false;
            } else {
                $element.stop().fadeIn(200);
                viewProject.estimates.hired.menuShown = true;
            }
        },

        buyer: { // done
            init: function() { // done
                $('.publish-draft').on('click', function(e) {
                    viewProject.estimates.buyer.publishDraft();
                });
            },

            publishDraft: function() { // done
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
                            url: '/api/project/' + projectHire.project._id + '/publish',
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
                                message: 'There was a problem while publishing your job. If you continue to receive this error, please contactus.'
                            });
                        });
                    },
                    no: function() {
                        modal.notify({
                            title: 'Job Publishing Canceled',
                            message: 'You have chosen not to publish your job. If you change your mind down the road, feel free to find this job and publish it at any time.'
                        });
                    }
                });
            }
        },

        seller: { // in progress
            offerClicked: false,
            skipPhone: false,
            skipSMS: false,
            ein: false,
            userInfo: false,

            targetEstimate: '',
            correctionModals: [],

            init: function() {
                viewProject.estimates.seller.initClicks();
            },

            initClicks: function() {
                $('.view-workorder').off('click').on('click touchstart', function(e) {
                    if(!viewProject.estimates.hired.documentClicked) {
                        viewProject.estimates.hired.documentClicked = true;
                        setTimeout(function() { viewProject.estimates.hired.documentClicked = false; }, 300);
                        viewProject.estimates.viewWorkorder($(this).attr('data-bid'));
                    }
                });

                $('.hire-mechanic').off('click').on('click touchstart', function(e) {
                    if(!viewProject.estimates.hired.documentClicked) {
                        viewProject.estimates.hired.documentClicked = true;
                        setTimeout(function() { viewProject.estimates.hired.documentClicked = false; }, 300);
                        viewProject.estimates.buyer.acceptBid($(this).attr('data-bid'));
                    }
                });

                $('.show-edit-estimate').off('click touchstart').on('click', function(e) {
                    if(!viewProject.estimates.hired.documentClicked) {
                        viewProject.estimates.hired.documentClicked = true;
                        setTimeout(function() { viewProject.estimates.hired.documentClicked = false; }, 300);
                        viewProject.estimates.seller.editWorkorder();
                    }
                });

                $('.show-edit-diagnosis').off('click touchstart').on('click', function(e) {
                    if(!viewProject.estimates.hired.documentClicked) {
                        viewProject.estimates.hired.documentClicked = true;
                        setTimeout(function() { viewProject.estimates.hired.documentClicked = false; }, 300);
                        viewProject.estimates.seller.editDiagnosis();
                    }
                });

                $('.cancel-estimate').off('click touchstart').on('click', function() {
                    if(!viewProject.estimates.hired.documentClicked) {
                        viewProject.estimates.hired.documentClicked = true;
                        setTimeout(function() { viewProject.estimates.hired.documentClicked = false; }, 300);
                        viewProject.estimates.seller.cancelEstimate($(this).attr('data-bid'));
                    }
                });

                $('.show-offer-diagnosis').off('click touchstart').on('click touchstart', function(e) {
                    if(!viewProject.estimates.seller.offerClicked) {
                        viewProject.estimates.seller.offerClicked = true;
                        setTimeout(function() { viewProject.estimates.seller.offerClicked = false; }, 300);

                        modal.diagnosisEstimate({
                            place: function(estimate) {
                                viewProject.estimates.seller.place(estimate);
                            }
                        });
                    }
                });

                $('.show-place-estimate').off('click touchstart').on('click touchstart', function(e) {
                    if(!viewProject.estimates.seller.offerClicked) {
                        viewProject.estimates.seller.offerClicked = true;
                        setTimeout(function() { viewProject.estimates.seller.offerClicked = false; }, 300);

                        modal.estimate({
                            place: function(estimate) {
                                viewProject.estimates.seller.place(estimate);
                            },
                            serviceFee: viewProject.user.serviceFee
                        });
                    }
                });
            },

            submit: function() {
                var body = viewProject.estimates.seller.targetEstimate;

                modal.notify({
                    title: 'Submitting Estimate',
                    message: 'Please wait while MechFinder sends your estimate to the job owner...',
                    canExit: false,
                    canOkay: false,
                    loading: true
                });

                var request = $.ajax({
                    type: 'POST',
                    url: '/api/project/' + viewProject.project._id + '/bid',
                    data: body,
                    dataType: 'json'
                });

                request.fail(function(jqXHR) {
                    console.log(jqXHR);
                    modal.notify({
                        title: 'Submission Error',
                        message: 'There was an error while submitting your estimate. MechFinder is working as fast as possible to resolve this issue. Thank you for your patience.'
                    });
                });

                request.done(function(project) {
                    viewProject.project = project;

                    modal.notify({
                        title: 'Estimate Submitted',
                        message: 'Your estimate has been submitted. Check out the estimates table to see your estimate as well as the others that have been submitted for this job.'
                    });

                    var estimate = project.bids[project.bids.length-1];
                    if(util.is.nil(estimate.labor)) estimate.labor = [];
                    if(util.is.nil(estimate.parts)) estimate.parts = [];

                    var hasBids = false;
                    var n = 0;
                    while(n < project.bids.length && !hasBids) {
                        if(project.bids[n].state == 'submitted' && project.bids[n]._id != estimate._id) hasBids = true;
                        n++;
                    }

                    var alreadyBid = ($('#estimateUser'+ estimate.user._id).length > 0);

                    if(!hasBids) {
                        $('#estimateTableNoEstimates').remove();
                    }

                    var c = 1;
                    if(!alreadyBid) {
                        c = $('#estimatesTable tr').length;
                    } else {
                        c = $('#estimateUser'+ viewProject.user._id).index();
                    }

                    var html = '';
                    if(!alreadyBid) html += '<tr id="estimateUser' + estimate.user._id + '">';
                    html += '<td>' + c + '</td>';
                    html += '<td>' + util.time.format(estimate.date_submitted, 'MM/DD/YYYY') + '</td>';
                    html += '<td>' + (estimate.owner.mechanicType[0].toUpperCase() + estimate.owner.mechanicType.slice(1)) + '</td>';
                    html += '<td>';
                        if(estimate.labor.length > 0 && estimate.parts.length > 0) html += 'Labor &amp; Parts';
                        else if(estimate.labor.length > 0) html += 'Labor Only';
                        else html += 'Parts Only';
                    html += '</td>';
                    if(viewProject.project.diagnosis) html += '<td>' + ((estimate.diagnosisWaived) ? 'Yes' : 'No') + '</td>';
                    html += '<td>';
                        html += '<div class="menu estimateDropdown" id="estiamteDropdown' + estimate._id + '">';
                            html += '<div class="dropdown">';
                                html += '<ul>';
                                    var editKind = (viewProject.project.diagnosis) ? 'diagnosis' : 'estimate';
                                    html += '<li><a class="show-edit-' + editKind + '" href="javascript:void(0);">Edit ' + (editKind.charAt(0).toUpperCase() + editKind.slice(1)) + '</a></li>';
                                    html += '<li><a class="cancel-estimate" data-bid="' + estimate._id + '" href="javascript:void(0);">Cancel Estimate</a></li>';
                                html += '</ul>';
                            html += '</div>';
                        html += '</div>';
                    html += '</td>';

                    if(!alreadyBid) html += '</tr>';

                    if(alreadyBid) {
                        $('tr#estimateUser' + estimate.user._id).html(html);
                    } else {
                        $('#estimatesTable').append(html);
                        if(!hasBids) {
                            $('#estimatesTable #estimateTableNoEstimates').remove();
                        }
                    }

                    $('.show-place-estimate, .show-offer-diagnosis').remove();
                    viewProject.estimates.seller.initClicks();
                });
            },

            place: function(estimate) { // done
                if(!util.is.nil(estimate)) viewProject.estimates.seller.targetEstimate = estimate;

                if(viewProject.user.verified) {
                    // make sure we don't have anything to correct before submitting
                    if(viewProject.estimates.seller.correctionModals.length > 0) {
                        var targetModal = viewProject.estimates.seller.correctionModals[0];
                        switch(targetModal.modal) {
                            case 'modalBanking':
                                viewProject.estimates.seller.sellerBankingBox(targetModal.fields);
                                break;
                            case 'modalSellerBusinessInfo':
                                viewProject.estimates.seller.sellerBusinessInfoBox(targetModal.fields);
                                break;
                            case 'modalSellerUserInfo':
                                viewProject.estimates.seller.sellerUserInfoBox(targetModal.fields);
                                break;
                            case 'modalBilling':
                                viewProject.estimates.seller.sellerBillingBox(targetModal.fields);
                                break;
                        }

                        viewProject.estimates.seller.correctionModals.shift();
                    } else {
                        if(viewProject.user.phone.verified || viewProject.estimates.seller.skipPhone || viewProject.user.phone.skip) {
                            // if user has requested to skip phone and the property still isn't set on the user object
                            if(viewProject.estimates.seller.skipPhone && !viewProject.user.phone.skip) {
                                var body = {
                                    phone: {
                                        skip: true
                                    }
                                }

                                var request = $.ajax({
                                    type: 'POST',
                                    url: '/api/profile',
                                    data: body,
                                    dataType: 'json'
                                });
                            }

                            if(!viewProject.estimates.seller.userInfo && viewProject.user.first && viewProject.user.last && (!util.is.nil(viewProject.user.dob) || viewProject.user.setDOB) && (viewProject.user.ssn || viewProject.user.setSSN)) {
                                if(!viewProject.estimates.seller.ein) {
                                    if(viewProject.user.billing && viewProject.user.billing.primary && viewProject.user.billing.city && viewProject.user.billing.state && viewProject.user.billing.zip || viewProject.user.setBilling) {
                                        if(viewProject.user.banking && viewProject.user.banking.bank && viewProject.user.banking.routing && viewProject.user.banking.account || viewProject.user.setBanking) {
                                            if(viewProject.user.braintree && viewProject.user.braintree.hasAccount) {
                                                viewProject.estimates.seller.submit();
                                            } else {
                                                viewProject.estimates.seller.addBraintreeMerchant();
                                            }
                                        } else {
                                            viewProject.estimates.seller.sellerBankingBox();
                                        }
                                    } else {
                                        viewProject.estimates.seller.sellerBillingBox();
                                    }
                                } else {
                                    viewProject.estimates.seller.sellerBusinessInfoBox();
                                }
                            } else {
                                viewProject.estimates.seller.userInfo = false;
                                viewProject.estimates.seller.sellerUserInfoBox();
                            }
                        } else {
                            if(util.is.nil(viewProject.user.phone.number)) {
                                viewProject.estimates.seller.phoneNumberBox();
                            } else {
                                if(util.is.nil(viewProject.user.phone.kind)) {
                                    viewProject.estimates.seller.phoneKindBox();
                                } else {
                                    if((!viewProject.user.phone.sms || util.is.nil(viewProject.user.phone.sms)) && viewProject.user.phone.kind === 'Mobile' && !viewProject.estimates.seller.skipSMS) {
                                        viewProject.estimates.seller.phoneSMSBox();
                                    } else {
                                        viewProject.estimates.seller.phoneVerificationEntry();
                                    }
                                }
                            }
                        }
                    }
                } else {
                    viewProject.estimates.seller.requestEmailVerification(function() {
                        viewProject.estimates.seller.emailVerificationBox();
                    });
                }
            },

            cancelPlacement: function() {
                var estimate = viewProject.estimates.seller.targetEstimate;

                modal.confirm({
                    title: 'Cancel Estimate?',
                    message: 'Are you sure you want to cancel this bid? All of the information that you have submitted until now has been saved automatically, so you will be able to pick right back up where you left off if you come back later.',
                    no: function() {
                        viewProject.estimates.seller.place();
                    },
                    yes: function() {
                        modal.notify({
                            title: 'Bid Canceled',
                            message: 'The submission of your estimate has been canceled. If you would still like, feel free to have another go at submitting your estimate at any time.'
                        });
                    },
                    canExit: false,
                    canNo: true,
                    yesText: 'Yes, Cancel It',
                    noText: 'No, Keep Going',
                    fixedButtons: false
                });
            },

            cancelEstimate: function(estimateId) {
                var estimate = viewProject.estimateWithId(estimateId);
                if(!util.is.nil(estimate)) {
                    if(estimate.state === 'submitted') {
                        modal.confirm({
                            title: 'Cancel Estimate?',
                            message: 'Are you sure you want to cancel this estimate?',
                            yes: function() {
                                modal.notify({
                                    title: 'Canceling Estimate',
                                    message: 'Your estimate is currently being canceled.',
                                    canExit: false,
                                    canOkay: false,
                                    loading: true
                                });
                                var body = {
                                    estimateId: estimate._id
                                }

                                var request = $.ajax({
                                    type: 'POST',
                                    url: '/api/project/' + viewProject.project._id + '/retractBid',
                                    data: body,
                                    dataType: 'json'
                                });

                                request.done(function(estimate) {
                                    viewProject.project.bids[viewProject.estimateWithId(estimate._id, true)] = estimate;
                                    modal.notify({
                                        title: 'Estimate Canceled',
                                        message: 'Your estimate has been canceled.'
                                    });

                                    $('#estimateUser' + viewProject.user._id).remove();

                                    var hasBids = false;
                                    for(var i=0; i<viewProject.project.bids.length; i++) {
                                        if(viewProject.project.bids[i].state == 'submitted') {
                                            hasBids = true;
                                            break;
                                        }
                                    }

                                    if(!hasBids) {
                                        var html = '<tr id="estimateTableNoEstimates">'
                                        var colspan = viewProject.project.diagnosis ? 7 : 6;
                                        html += '<td colspan="' + colspan + '">There are no estimates placed on this job</td>';
                                        html += '</tr>';
                                        $('#estimatesTable').append(html);
                                    }
                                });

                                request.fail(function(jqXHR) {
                                    console.log(jqXHR);
                                    modal.notify({
                                        title: 'Error',
                                        message: 'There was a problem while canceling your estimate. Please contact your customer and let them know that you would no longer like your estimate to be considered for hire. If you continue to receive this message, please contact us.'
                                    });
                                });
                            }
                        });
                    } else {
                        modal.notify({
                            title: 'Cannot Cancel',
                            message: 'You cannot cancel a bid that has already been accepted by the customer.'
                        });
                    }
                }
            },

            fixBraintreeErrors: function(fields) { // done
                var estimate = viewProject.estimates.seller.targetEstimate;

                // combine fields that come from the same modal into a single array item
                // (so we can call a modal and highlight all fields at once)
                var modals = [];
                for(var i=0; i<fields.length; i++) {
                    if(modals.length > 0) {
                        for(var c=0; c<modals.length; c++) {
                            if(modals[c].modal == fields[i].modal) {
                                // the modal has already been flagged for showing
                                modals[c].fields.push(fields[i].field);
                            } else {
                                // the modal has not been flagged for showing
                                modals.push({
                                    modal: fields[i].modal,
                                    fields: [fields[i].field]
                                });
                            }
                        }
                    } else {
                        modals.push({
                            modal: fields[i].modal,
                            fields: [fields[i].field]
                        });
                    }
                }

                viewProject.estimates.seller.correctionModals = modals;
                viewProject.estimates.seller.place();
            },

            addBraintreeMerchant: function() { //done
                var estimate = viewProject.estimates.seller.targetEstimate;

                modal.notify({
                    title: 'Connecting Account',
                    message: 'We are currently connecting your account to our escrow systems. This may take up to 15 minutes, so thank you for your patience.',
                    canExit: false,
                    canOkay: false,
                    loading: true
                });

                var request = $.ajax({
                    type: 'POST',
                    url: '/api/braintree/createMerchant',
                    data: {},
                    dataType: 'json'
                });

                request.fail(function(jqXHR) {
                    console.log(jqXHR);
                    console.log(jqXHR.responseJSON);

                    var braintreeErrors = jqXHR.responseJSON.braintreeErrors;
                    var unknownError = false;
                    if($.isArray(braintreeErrors) && braintreeErrors.length > 0) {
                        var fields = [];
                        for(var i=0; i<braintreeErrors.length; i++) {
                            switch(braintreeErrors[i].code) {
                                case '82649':
                                case '82640':
                                case '82635':
                                    // # bad routing number
                                    fields.push({
                                        modal: 'modalBanking',
                                        field: 'modalBankingRouting'
                                    });
                                    break;
                                case '82671':
                                case '82641':
                                    // # bad account number
                                    fields.push({
                                        modal: 'modalBanking',
                                        field: 'modalBankingAccount'
                                    });
                                    break;
                                case '82648':
                                case '82647':
                                case '82634':
                                    // # bad/missing tax id
                                    fields.push({
                                        modal: 'modalSellerBusinessInfo',
                                        field: 'modalSellerBusinessInfoTaxId'
                                    });
                                    break;
                                case '82642':
                                case '82625':
                                    // # bad ssn
                                    fields.push({
                                        modal: 'modalSellerUserInfo',
                                        field: 'modalSellerUserInfoSSN'
                                    });
                                    break;
                                case '82657':
                                case '82661':
                                case '82617':
                                case '82629':
                                    // # bad individual/applicant street address
                                    fields.push({
                                        modal: 'modalBilling',
                                        field: 'modalBillingPrimary'
                                    });
                                    break;
                                case '82685':
                                    // bad business street address
                                    fields.push({
                                        modal: 'modalSellerBusinessInfo',
                                        field: 'modalSellerBusinessInfoAddress'
                                    });
                                    break;
                                case '82658':
                                    // # missing billing locale (city)
                                    fields.push({
                                        modal: 'modalBilling',
                                        field: 'modalBillingCity'
                                    });
                                    break;
                                case '82659':
                                case '82662':
                                    // # missing billing zip code
                                    fields.push({
                                        modal: 'modalBilling',
                                        field: 'modalBillingZip'
                                    });
                                    break;
                                case '82686':
                                    // bad/missing business zip
                                    fields.push({
                                        modal: 'modalSellerBusinessInfo',
                                        field: 'modalSellerBusinessInfoZip'
                                    });
                                    break;
                                case '82660':
                                case '82668':
                                    // # missing billing region (state)
                                    fields.push({
                                        modal: 'modalBilling',
                                        field: 'modalBillingState'
                                    });
                                    break;
                                case '82684':
                                    // bad/missing business region (state)
                                    fields.push({
                                        modal: 'modalSellerBusinessInfo',
                                        field: 'modalSellerBusinessInfoState'
                                    });
                                    break;
                                default:
                                    // Unknown error occurred
                                    unknownError = true;
                                    break;
                            }

                            if(unknownError) break;
                        }

                        if(!unknownError) viewProject.estimates.seller.fixBraintreeErrors(fields);
                    } else {
                        unknownError = true;
                    }

                    if(unknownError) {
                        modal.notify({
                            title: 'Unknown Error',
                            message: 'An unknown error has occured while trying to place your estimate. Refresh the page and try to submit your bid again. If this error persists, please contact us so we can resolve the issue as quickly as possible'
                        });
                    }
                });

                request.done(function(data) {
                    viewProject.user = data.user;
                    viewProject.estimates.seller.place();
                });
            },

            sellerBankingBox: function(fields) { // done
                var estimate = viewProject.estimates.seller.targetEstimate;

                fields = $.isArray(fields) ? fields : [];
                var message = (fields.length > 0) ? 'Please correct the highlighted fields in order to submit your estimate:' : '';

                modal.banking({
                    submitText: 'Submit',
                    message: message,
                    fields: fields,
                    cancel: function() {
                        viewProject.estimates.seller.cancelPlacement();
                    },
                    submit: function(info) {
                        modal.notify({
                            title: 'Saving Your Info',
                            message: 'MechFinder is saving your updated information. This may take a few moments, so thank you for your patience.',
                            canExit: false,
                            canOkay: false,
                            loading: true
                        });

                        var body = {
                            banking: info
                        }

                        var request = $.ajax({
                            type: 'POST',
                            url: '/api/profile',
                            data: body,
                            dataType: 'json'
                        });

                        request.fail(function(jqXHR) {
                            console.log(jqXHR);
                            modal.notify({
                                title: 'Submission Error',
                                message: 'There was an error while saving your information. MechFinder is working as fast as possible to resolve this issue. Thank you for your patience.',
                                condensed: false
                            });
                        });

                        request.done(function(user) {
                            viewProject.user = user;
                            viewProject.estimates.seller.place();
                        });
                    }
                });
            },

            sellerBillingBox: function(fields) { // done
                var estimate = viewProject.estimates.seller.targetEstimate;

                fields = $.isArray(fields) ? fields : [];
                var message = (fields.length > 0) ? 'Please correct the highlighted fields in order to submit your estimate:' : '';

                modal.billing({
                    message: message,
                    fields: fields,
                    submitText: 'Continue',
                    cancel: function() {
                        viewProject.estimates.seller.cancelPlacement();
                    },
                    submit: function(info) {
                        modal.notify({
                            title: 'Saving Your Info',
                            message: 'MechFinder is saving your updated information. This may take a few moments, so thank you for your patience.',
                            canExit: false,
                            canOkay: false,
                            loading: true
                        });

                        var body = {
                            billing: info
                        }

                        var request = $.ajax({
                            type: 'POST',
                            url: '/api/profile',
                            data: body,
                            dataType: 'json'
                        });

                        request.fail(function(jqXHR) {
                            console.log(jqXHR);
                            modal.notify({
                                title: 'Submission Error',
                                message: 'There was an error while saving your information. MechFinder is working as fast as possible to resolve this issue. Thank you for your patience.',
                                condensed: false
                            });
                        });

                        request.done(function(user) {
                            viewProject.user = user;
                            viewProject.estimates.seller.place();
                        });
                    }
                });
            },

            sellerBusinessInfoBox: function(fields) { // done
                var estimate = viewProject.estimates.seller.targetEstimate;

                fields = $.isArray(fields) ? fields : [];
                var message = (fields.length > 0) ? 'Please correct the highlighted fields in order to submit your estimate:' : '';

                modal.sellerBusinessInfo({
                    message: message,
                    fields: fields,
                    submitText: 'Continue',
                    cancelText: 'Back',
                    cancel: function() {
                        viewProject.estimates.seller.userInfo = true;
                        viewProject.estimates.seller.place();
                    },
                    submit: function(info) {
                        modal.notify({
                            title: 'Saving Your Info',
                            message: 'MechFinder is saving your updated information. This may take a few moments, so thank you for your patience.',
                            canExit: false,
                            canOkay: false,
                            loading: true
                        });

                        var body = {
                            business: info
                        }

                        var request = $.ajax({
                            type: 'POST',
                            url: '/api/profile',
                            data: body,
                            dataType: 'json'
                        });

                        request.fail(function(jqXHR) {
                            console.log(jqXHR);
                            modal.notify({
                                title: 'Submission Error',
                                message: 'There was an error while saving your information. MechFinder is working as fast as possible to resolve this issue. Thank you for your patience.',
                                condensed: false
                            });
                        });

                        request.done(function(user) {
                            viewProject.user = user;
                            viewProject.estimates.seller.ein = false;
                            viewProject.estimates.seller.place();
                        });
                    }
                });
            },

            sellerUserInfoBox: function(fields) { // done
                var estimate = viewProject.estimates.seller.targetEstimate;

                fields = $.isArray(fields) ? fields : [];
                var message = (fields.length > 0) ? 'Please correct the highlighted fields in order to submit your estimate:' : '';

                modal.sellerUserInfo({
                    message: message,
                    fields: fields,
                    fixedButtons: false,
                    submitText: 'Continue',
                    cancel: function() {
                        viewProject.estimates.seller.cancelPlacement();
                    },
                    submit: function(info) {
                        modal.notify({
                            title: 'Saving Your Info',
                            message: 'MechFinder is saving your updated information. This may take a few moments, so thank you for your patience.',
                            canExit: false,
                            canOkay: false,
                            loading: true
                        });

                        var body = info;

                        var request = $.ajax({
                            type: 'POST',
                            url: '/api/profile',
                            data: body,
                            dataType: 'json'
                        });

                        request.fail(function(jqXHR) {
                            console.log(jqXHR);
                            modal.notify({
                                title: 'Submission Error',
                                message: 'There was an error while saving your information. MechFinder is working as fast as possible to resolve this issue. Thank you for your patience.',
                                condensed: false
                            });
                        });

                        request.done(function(user) {
                            viewProject.user = user;
                            viewProject.estimates.seller.ein = info.ein;
                            viewProject.estimates.seller.place();
                        });
                    }
                });
            },

            phoneVerificationEntry: function(via) { //done?
                var estimate = viewProject.estimates.seller.targetEstimate;

                modal.input({
                    title: 'Phone Verification Code',
                    message: 'We have ' + ((via == 'sms') ? 'messaged you' : 'called you') + ' with your verification code. Please enter the code in the box below: ',
                    submit: function(code) {
                        modal.notify({
                            title: 'Checking Verification',
                            message: 'We are checking the verification code you have entered now. This may take a few moments, so MechFinder appreciates your patience.',
                            canExit: false,
                            canOkay: false,
                            loading: true
                        });

                        var body = {
                            phoneNumber: viewProject.user.phone.number,
                            verificationCode: code
                        }

                        var request = $.ajax({
                            type: 'POST',
                            url: '/api/verify/verifyToken',
                            data: body,
                            dataType: 'json'
                        });

                        request.fail(function(jqXHR) {
                            console.log(jqXHR);
                            if(jqXHR.responseJSON.err == 'Incorrect pin') {
                                modal.notify({
                                    title: 'Incorrect Pin',
                                    message: 'The verification pin you have entered is incorrect. If this problem persists, please <a href="/contact">contact us</a> at your convenience.',
                                    okayText: 'Try Again',
                                    okay: function() {
                                        viewProject.estimates.seller.phoneVerificationEntry(via);
                                    }
                                });
                            } else if(jqXHR.responseJSON.err == 'Too many attempts') {
                                modal.notify({
                                    title: 'Incorrect Pin',
                                    message: 'You have reached the maximum number of attempts to verify your phone number. In the mean time, your bid can still be placed and you can still be hired, but customers will not be given your phone number until it is verified.',
                                    okayText: 'Continue',
                                    okay: function() {
                                        viewProject.estimates.seller.skipPhone = true;
                                        viewProject.estimates.seller.place();
                                    }
                                });
                            } else {
                                modal.notify({
                                    title: 'Submission Error',
                                    message: 'There was an error while checking your verification code. MechFinder is working as fast as possible to resolve this issue. Thank you for your patience.',
                                    condensed: false
                                });
                            }
                        });

                        request.done(function(user) {
                            viewProject.user = user;
                            viewProject.estimates.seller.place();
                        });
                    },
                    cancel: function() {
                        viewProject.estimates.seller.skipPhone = true;
                        viewProject.estimates.seller.place();
                    },
                    exit: function() {
                        viewProject.estimates.seller.cancelPlacement();
                    },
                    cancelOnExit: false,
                    cancelText: 'Skip'
                });
            },

            phoneVerificationBox: function() { //done?
                var estimate = viewProject.estimates.seller.targetEstimate;

                var sendRequest = function(method) {
                    modal.notify({
                        title: 'Sending Verification',
                        message: 'We are sending you a verification code now. This may take a few moments, so MechFinder appreciates your patience.',
                        canExit: false,
                        canOkay: false,
                        loading: true
                    });

                    var body = {
                        phone: viewProject.user.phone,
                        method: method
                    }

                    var request = $.ajax({
                        type: 'POST',
                        url: '/api/verify/sendToken',
                        data: body,
                        dataType: 'json'
                    });

                    request.fail(function(jqXHR) {
                        console.log(jqXHR);
                        modal.notify({
                            title: 'Submission Error',
                            message: 'There was an error while sending you a verification code. MechFinder is working as fast as possible to resolve this issue. Thank you for your patience.',
                            condensed: false
                        });
                    });

                    request.done(function(data) {
                        viewProject.estimates.seller.phoneVerificationEntry(method);
                    });
                }

                modal.confirm({
                    title: 'Phone Verification',
                    message: 'In order to verify your phone number, we will send you a text or a call to make sure this phone is yours. Please click whichever method is most convenient to you below:',
                    noText: 'Send me a Text',
                    yesText: 'Give me a Call',
                    noColor: 'green',
                    fixedButtons: false,
                    cancelOnExit: false,
                    canNo: (viewProject.user.phone.sms && viewProject.user.phone.smsCharges),
                    no: function() {
                        sendRequest('sms');
                    },
                    yes: function() {
                        sendRequest('call');
                    },
                    exit: function() {
                        viewProject.estimates.seller.cancelPlacement();
                    }
                });
            },

            phoneSMSBox: function() { //done ?
                var estimate = viewProject.estimates.seller.targetEstimate;

                var sendRequest = function(sms, smsCharges) {
                    var body = {
                        phone: {
                            sms: sms,
                            smsCharges: smsCharges
                        }
                    }

                    var request = $.ajax({
                        type: 'POST',
                        url: '/api/profile',
                        data: body,
                        dataType: 'json'
                    });

                    request.fail(function(jqXHR) {
                        console.log(jqXHR);
                        modal.notify({
                            title: 'Submission Error',
                            message: 'There was an error while updating your account info. MechFinder is working as fast as possible to resolve this issue. Thank you for your patience.',
                            condensed: false
                        });
                    });

                    request.done(function(user) {
                        viewProject.user = user;
                        viewProject.estimates.seller.skipSMS = true;
                        viewProject.estimates.seller.place();
                    });
                }

                modal.confirm({
                    title: 'SMS Notifications',
                    message: 'Would you like to turn on SMS notifications? By clicking "Yes", you are agreeing that you understand that carrier charges may apply.',
                    yes: function() {
                        sendRequest(true, true);
                    },
                    no: function() {
                        sendRequest(false, false);
                    },
                    exit: function() {
                        viewProject.estimates.seller.cancelPlacement();
                    }
                });
            },

            phoneKindBox: function() { // done?
                var estimate = viewProject.estimates.seller.targetEstimate;

                modal.select({
                    title: 'Phone Type',
                    message: 'Please select the type of device associated with your phone number: ',
                    condensed: true,
                    cancelText: 'Skip',
                    cancelOnExit: false,
                    options: ['Mobile', 'Landline'],
                    cancel: function() {
                        viewProject.estimates.seller.skipPhone = true;
                        viewProject.estimates.seller.place();
                    },
                    exit: function() {
                        viewProject.estimates.seller.cancelPlacement();
                    },
                    submit: function(kind) {
                        modal.notify({
                            title: 'Saving Phone Kind',
                            message: 'We are updating your account with the type of phone that you have selected. Thank you for your patience.',
                            canOkay: false,
                            canExit: false,
                            loading: true
                        });

                        var body = {
                            phone: {
                                kind: kind
                            }
                        }

                        var request = $.ajax({
                            type: 'POST',
                            url: '/api/profile',
                            data: body,
                            dataType: 'json'
                        });

                        request.fail(function(jqXHR) {
                            console.log(jqXHR);
                            modal.notify({
                                title: 'Submission Error',
                                message: 'There was an error while updating your account info. MechFinder is working as fast as possible to resolve this issue. Thank you for your patience.',
                                condensed: false
                            });
                        });

                        request.done(function(user) {
                            viewProject.user = user;
                            viewProject.estimates.seller.place();
                        });
                    }
                });
            },

            phoneNumberBox: function(message) { // done?
                var otherRole = (!util.is.nil(projectHire.user) && projectHire.user.role == 'buyer') ? 'mechanics' : 'customer';
                message = (util.is.nil(message)) ? 'Add a phone number here for ' + otherRole + ' to reach you: ' : message;

                var estimate = viewProject.estimates.seller.targetEstimate;

                modal.input({
                    title: 'Phone Number',
                    message: message,
                    placeholder: 'XXX-XXX-XXXX',
                    condensed: true,
                    cancelText: 'Skip',
                    cancelOnExit: false,
                    cancel: function() {
                        viewProject.estimates.seller.skipPhone = true;
                        viewProject.estimates.seller.place();
                    },
                    exit: function() {
                        viewProject.estimates.seller.cancelPlacement();
                    },
                    submit: function(num) {
                        modal.notify({
                            title: 'Saving Phone Number',
                            message: 'We are updating your account with the phone number you have entered. Thank you for your patience.',
                            canOkay: false,
                            canExit: false,
                            loading: true
                        });

                        number = num.replace(/\D/g, '');
                        if(util.is.nil(number) || number.length != 10) {
                            viewProject.estimates.seller.phoneNumberBox('The phone number you have entered is invalid. Valid phone numbers should contain ten (10) numeric digits including your area code. Please re-enter your phone number to continue: ');
                        } else {
                            var body = {
                                phone: {
                                    number: number
                                }
                            }

                            var request = $.ajax({
                                type: 'POST',
                                url: '/api/profile',
                                data: body,
                                dataType: 'json'
                            });

                            request.fail(function(jqXHR) {
                                console.log(jqXHR);
                                modal.notify({
                                    title: 'Submission Error',
                                    message: 'There was an error while updating your account info. MechFinder is working as fast as possible to resolve this issue. Thank you for your patience.',
                                    condensed: false
                                });
                            });

                            request.done(function(user) {
                                viewProject.user = user;
                                viewProject.estimates.seller.place();
                            });
                        }
                    }
                });
            },

            emailVerificationBox: function() { // done
                var estimate = viewProject.estimates.seller.targetEstimate;

                modal.input({
                    title: 'Email Verification',
                    message: 'A notification has been sent to your email with a verification code. Copy the code into the box below in order to verify your email. <a id="resendEmailVerification" href="javascript:void(0);">Resend My Verification Code</a>',
                    submit: function(code) {
                        viewProject.estimates.seller.checkEmailVerification(code, function() {
                            // once they're verified, re-call the place estimate function
                            viewProject.estimates.seller.place();
                        });
                    }
                });

                $('#resendEmailVerification').off('click').on('click', function(e) {
                    viewProject.estimates.seller.requestEmailVerification(function() {
                        modal.input({
                            title: 'Email Verification',
                            message: 'We have re-sent a notification to your email with a verification code. Copy the code into the box below in order to verify your email.',
                            submit: function(code) {
                                viewProject.estimates.seller.checkEmailVerification(code, function() {
                                    // once they're verified, re-call the place estimate function
                                    viewProject.estimates.seller.place();
                                });
                            }
                        });
                    });
                });
            },

            checkEmailVerification: function(code, next) { //done
                if(typeof(next) !== 'function') next = function(){};

                var estimate = viewProject.estimates.seller.targetEstimate;

                modal.notify({
                    title: 'Checking Verification Code',
                    message: 'We are checking the verification code with your account. This may take a few moments; thank you for your patience.',
                    canExit: false,
                    canOkay: false,
                    loading: true
                });

                var body = {
                    email: viewProject.user.email
                }

                var request = $.ajax({
                    type: 'POST',
                    url: '/api/verify/email/' + code,
                    data: body,
                    dataType: 'json'
                });

                request.done(function(user) {
                    viewProject.user = user;
                    next();
                });

                request.fail(function(jqXHR) {
                    console.log(jqXHR);
                    switch(jqXHR.responseJSON.err) {
                        case 'Incorrect validation code':
                            modal.notify({
                                title: 'Incorrect Code',
                                message: 'The validation code that you have entered was incorrect. Please <a href="/contact">contact us</a> if this problem persists.',
                                condensed: false,
                                okayText: 'Try Again',
                                okay: function() {
                                    viewProject.estimates.seller.emailVerificationBox();
                                }
                            });
                            break;
                        case 'Validation code expired':
                            modal.notify({
                                title: 'Code Expired',
                                message: 'The validation code that you have entered has expired. To confirm you email address, you may <a id="requestNewEmailVerification" href="javascript:void(0);">request a new code</a>.',
                                condensed: false
                            });

                            $('#requestNewEmailVerification').off('click').on('click', function(e) {
                                viewProject.estimates.seller.requestEmailVerification(function() {
                                    viewProject.estimates.seller.emailVerificationBox();
                                });
                            });
                            break;
                        default:
                            modal.notify({
                                title: 'Verification Error',
                                message: 'There was an error while verifying your account. MechFinder is working as fast as possible to resolve this issue. Thank you for your patience.',
                                condensed: false
                            });
                            break;
                    }
                });
            },

            requestEmailVerification: function(next) { //done
                var estimate = viewProject.estimates.seller.targetEstimate;

                if(typeof(next) !== 'function') next = function(){};

                modal.notify({
                    title: 'Email Verification Sending',
                    message: 'We are sending your email verification code now. If you do not see the code in your inbox, try checking your junk or spam filters as well.',
                    canExit: false,
                    canOkay: false,
                    loading: true
                });

                var body = {
                    email: viewProject.user.email
                }

                var request = $.ajax({
                    type: 'POST',
                    url: '/api/verify/email',
                    data: body,
                    dataType: 'json'
                });

                request.done(function(data) {
                    next(data);
                });

                request.fail(function(jqXHR) {
                    console.log(jqXHR);
                    modal.notify({
                        title: 'Verification Error',
                        message: 'There was an error while verifying your account. MechFinder is working as fast as possible to resolve this issue. Thank you for your patience.',
                        condensed: false
                    });
                });
            },

            editDiagnosis: function() {
                userId = viewProject.user._id;
                var estimate = null;
                for(i=0; i<viewProject.project.bids.length; i++) {
                    bid = viewProject.project.bids[i];
                    if(bid.user._id == userId && bid.state == 'submitted') {
                        estimate = bid;
                        break;
                    }
                }

                if(!util.is.nil(estimate)) {
                    modal.diagnosisEstimate({
                        title: 'Edit Estimate',
                        estimate: estimate,
                        serviceFee: viewProject.user.serviceFee,
                        placeText: 'Save Changes',
                        place: function(estimate) {
                            viewProject.estimates.seller.place(estimate);
                        }
                    });
                }
            },

            editWorkorder: function() {
                userId = viewProject.user._id;
                var estimate = null;
                for(i=0; i<viewProject.project.bids.length; i++) {
                    bid = viewProject.project.bids[i];
                    if(bid.user._id == userId && bid.state == 'submitted') {
                        estimate = bid;
                        break;
                    }
                }

                if(!util.is.nil(estimate)) {
                    modal.estimate({
                        title: 'Edit Estimate',
                        user: viewEstimates.user,
                        project: viewEstimates.project,
                        estimate: estimate,
                        edit: true,
                        place: function(estimate) {
                            viewProject.estimates.seller.place(estimate);
                        }
                    });
                }
            },
        },

        viewWorkorder: function(estimateId) {
            var estimate = null;
            for(i=0; i<viewProject.project.bids.length; i++) {
                bid = viewProject.project.bids[i];
                if(bid._id == estimateId) {
                    estimate = bid;
                    break;
                }
            }

            if(!util.is.nil(estimate)) {
                modal.estimate({
                    title: 'Estimate View',
                    estimate: estimate,
                    user: viewEstimates.user,
                    project: viewEstimates.project,
                    accept: function(estimate) {
                        if(!util.is.nil(projectHire)) {
                            projectHire.hire(estimate);
                        }
                    }
                });
            }
        }
    }
}
