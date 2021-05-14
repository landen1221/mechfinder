var projectHired = {
    user: null,
    project: null,

    init: function() {
        if(util.is.nil(PROJECT) || util.is.nil(USER)) return window.location.reload(true);

        projectHired.user = USER;
        projectHired.project = PROJECT;

        projectHired.clicks.init();
    },

    clicks: {
        clicked: {
            addEstimate: false,
            requestPayment: false
        },

        init: function() {
            $('.addEstimate').off('click touchmove touchend').on('click touchmove touchend', function(e) {
                if(e.type != 'touchmove' && !projectHired.clicks.clicked.addEstimate) {
                    projectHired.clicks.clicked.addEstimate = true;
                    setTimeout(function() {
                        projectHired.clicks.clicked.addEstimate = false;
                    }, 300);

                    projectHired.addEstimate();
                }
            });

            $('.requestPayment').off('click touchmove touchend').on('click touchmove touchend', function(e) {
                if(e.type != 'touchmove' && !projectHired.clicks.clicked.requestPayment) {
                    projectHired.clicks.clicked.requestPayment = true;
                    setTimeout(function() {
                        projectHired.clicks.clicked.requestPayment = false;
                    }, 300);

                    projectHired.requestPayment($(this).attr('data-bid'));
                }
            });
        }
    },

    estimateWithId: function(estimateId, indexOnly) {
        indexOnly = (typeof indexOnly === 'boolean') ? indexOnly : false;

        var bid;
        for(var i=0; i<sellerEstimates.project.bids.length; i++) {
            bid = sellerEstimates.project.bids[i];
            if(bid._id == estimateId) {
                return (indexOnly) ? i : bid;
            }
        }

        return (indexOnly) ? -1 : null;
    },

    addEstimate: function() {
        modal.estimate({
            project: projectHired.project,
            user: projectHired.user,
            edit: true,
            place: function(estimate) {
                modal.notify({
                    title: 'Submitting Estimate',
                    message: 'MechFinder is sending your estimate to ' + projectHired.project.owner.username,
                    canExit: false,
                    canOkay: false,
                    loading: true
                });

                var body = estimate;

                var request = $.ajax({
                    type: 'POST',
                    url: '/api/project/' + projectHired.project._id + '/bid',
                    data: body,
                    dataType: 'json'
                });

                request.fail(function(jqXHR) {
                    console.log(jqXHR);
                    modal.notify({
                        title: 'Submission Error',
                        message: 'There was an error while submitting your estimate. If this error persists, please contact us to resolve the issue.',
                        okay: function() {
                            window.location.reload(true);
                        },
                        cancel: function() {
                            window.locations.reload(true);
                        }
                    });
                });

                request.done(function(project) {
                    modal.notify({
                        title: 'Estimate Submitted',
                        message: projectHired.project.owner.username + ' has been notified of your estimate',
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

    requestPayment: function(estimateId, draft) {
        console.log('requestPayment()');
        var estimate = projectHired.estimateWithId(estimateId);
        if(!util.is.nil(estimate)) {
            if(estimate.state === 'accepted') {
                if(projectHired.project.diagnosis && util.is.nil(projectHired.project.child)) {
                    if(util.is.nil(draft)) {
                        modal.confirm({
                            title: 'Draft Project',
                            message: 'In order to request payment for a diagnosis, you are required to draft a job for the customer describing the parts and labor required to fix the problems you have diagnosed. Would you like to start this process now?',
                            yes: function() {
                                projectHired.draft.project(estimateId);
                            },
                            no: function() {
                                projectHired.draft.cancel();
                            }
                        });
                    } else {
                        projectHired.draft.submit(estimateId, draft);
                    }
                } else {
                    modal.notify({
                        title: 'Requesting Payment',
                        message: 'We are currently sending the payment request to the customer. This may take a few moments, so thank you for your patience.',
                        loading: true,
                        canOkay: false,
                        canExit: false
                    });

                    var body = {
                        estimateId: estimate._id
                    }

                    var request = $.ajax({
                        type: 'POST',
                        url: '/api/project/' + projectHired.project._id + '/requestPayment',
                        data: body,
                        dataType: 'json'
                    });

                    request.done(function(estimate) {
                        projectHired.project.bids[projectHired.estimateWithId(estimate._id, true)] = estimate;
                        var message = 'We have notified the customer of your request for payment. If the request is accepted, job funds are released to you. If the request is declined, contact the customer to try to identify and resolve any issues.';
                        modal.notify({
                            title: 'Payment Requested',
                            message: message,
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
                            title: 'Error',
                            message: 'There was a problem while requesting a payment on this estimate. If you continue to receive this message, please contact us.',
                            okay: function() {
                                window.location.reload(true);
                            },
                            cancel: function() {
                                window.locations.reload(true);
                            }
                        });
                    });
                }
            }
        }
    },

    draft: {
        skip: {
            photos: false,
            estimate: false,
            firstEstimate: false
        },
        data: {
            estimateId: null,
            vehicle: null,
            vehicleId: '',
            // repair: '',
            description: '',
            // tow: null,
            photos: [],
            firstEstimate: null
        },

        project: function(estimateId) {
            console.log('draft project()');
            if(!util.is.nil(estimateId)) projectHired.draft.data.estimateId = estimateId;
            if(projectHired.user.role != 'seller') return null;

            if(util.is.nil(projectHired.draft.data.vehicleId))
                return projectHired.draft.vehicle();

            // if(util.is.nil(projectHired.draft.data.repair))
            //     return projectHired.draft.repair();

            if(util.is.nil(projectHired.draft.data.description))
                return projectHired.draft.description();

            // if(typeof(projectHired.draft.data.tow) !== 'boolean')
            //     return projectHired.draft.tow();

            if(!projectHired.draft.skip.photos && projectHired.draft.data.photos.length <= 0)
                return projectHired.draft.photos();

            // if(!projectHired.draft.skip.estimate)
            //     return projectHired.draft.placeEstimate();

            // if(!projectHired.draft.skip.firstEstimate && util.is.nil(projectHired.draft.data.firstEstimate))
            //     return projectHired.draft.firstEstimate();

            projectHired.requestPayment(projectHired.draft.data.estimateId, projectHired.draft.data);
        },

        cancel: function() {
            console.log('draft cancel()');
            modal.notify({
                title: 'Payment Request Canceled',
                message: 'Your payment request has been canceled. In order to have funds released to you, please come back and fill out a new job for the customer.'
            });
        },

        estimateOnDraft: function(firstEstimate) {
            console.log('draft estimateOnDraft()');
            console.log('going to submit an estimate on the draft');
            console.log(firstEstimate);
            console.log(projectHired.project.child._id);

            var body = firstEstimate;

            modal.notify({
                title: 'Submitting Estimate',
                message: 'We are currently submitting your estimate. It will be the first one to show up on the job. This may take a few moments, so thank you for your patience.',
                loading: true,
                canOkay: false,
                canExit: false
            });

            var request = $.ajax({
                type: 'POST',
                url: '/api/project/' + projectHired.project.child._id + '/bid',
                data: body,
                dataType: 'json'
            });

            request.done(function(project) {
                modal.notify({
                    title: 'Estimate Submitted',
                    message: 'Thanks for taking the time to write a draft for the customer. Your estimate will show up first in the customer\'s list of estimates on their project.',
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
                    title: 'Error',
                    message: 'There was a problem while submitting your bid. Please contact us if this error persists.'
                });
            });
        },

        firstEstimate: function() {
            console.log('draft firstEstimate()');
            var estimate = util.estimate.virtualize(projectHired.estimateWithId(projectHired.draft.data.estimateId));

            var waiveFee = (!util.is.nil(estimate) && estimate.diagnosisWaived && estimate.estimate); 
            var msg = (waiveFee) ? ' You have opted to waive your diagnosis fee if hired for this job, so this will show up on your estimate for this new job.' : '';
            console.log(projectHired.project.child);
            modal.estimate({
                title: 'First Estimate',
                message: 'Since you did the diagnosis, you will be the first estimate on this job. Include the parts and labor below required to fix the problems that you have diagnosed.' + msg,
                project: projectHired.project.child,
                user: projectHired.user,
                edit: true,
                placeText: 'Submit',
                place: function(estimate) {
                    projectHired.draft.estimateOnDraft(estimate);
                },
                cancel: function() {
                    window.location.reload(true);
                }
            });
        },

        placeEstimate: function() {
            console.log('draft placeEstimate()');
            modal.confirm({
                title: 'Place an Estimate',
                message: 'Would you like to be the first mechanic to place an estimate on the new job you have created for the customer?',
                yes: function() {
                    // projectHired.draft.skip.estimate = true;
                    // projectHired.draft.project();
                    // window.location.reload(true);
                    projectHired.draft.firstEstimate();
                },
                no: function() {
                    // projectHired.draft.skip.estimate = true;
                    // projectHired.draft.skip.firstEstimate = true;
                    // projectHired.draft.project();
                    window.location.reload(true);
                }
            });
        },

        photos: function() {
            console.log('draft photos()');
            modal.photos({
                submitText: 'Next',
                submitTextNoPhotos: 'Skip',
                cancelText: 'Skip',
                allowEmpty: true,
                canCancel: false,
                canBack: true,
                back: function() {
                    projectHired.draft.tow();
                },
                submit: function(photos) {
                    if(photos.length <= 0) projectHired.draft.skip.photos = true;
                    projectHired.draft.data.photos = [];
                    for(var i=0; i<photos.length; i++) {
                        projectHired.draft.data.photos.push(photos[i].data);
                    }
                    projectHired.draft.project();
                },
                cancel: function() {
                    projectHired.draft.skip.photos = true;
                    projectHired.draft.project();
                },
                exit: function() {
                    projectHired.draft.cancel();
                }
            });
        },

        tow: function() {
            console.log('draft tow()');
            modal.confirm({
                title: 'Towing',
                message: 'Will the customer\'s vehicle need to be towed?',
                yes: function() {
                    projectHired.draft.data.tow = true;
                    projectHired.draft.project();
                },
                no: function() {
                    projectHired.draft.data.tow = false;
                    projectHired.draft.project();
                },
                canBack: true,
                back: function() {
                    projectHired.draft.description();
                },
                exit: function() {
                    projectHired.draft.cancel();
                }
            })
        },

        description: function() {
            console.log('draft description()');
            modal.input({
                title: 'Description',
                message: 'Describe the problem in detail and any fixes or recommendations that you have for the vehicle:',
                textarea: true,
                canBack: true,
                canCancel: false,
                back: function() {
                    projectHired.draft.repair();
                },
                submit: function(text) {
                    projectHired.draft.data.description = text;
                    projectHired.draft.project();
                },
                exit: function() {
                    projectHired.draft.cancel();
                }
            })
        },

        repair: function() {
            console.log('draft repair()');
            modal.select({
                title: 'Service Type',
                message: 'Select the category of service that best fits the needs of the customer:',
                canCancel: false,
                canBack: true,
                back: function() {
                    projectHired.draft.vehicle();
                },
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
                    projectHired.draft.data.repair = value;
                    projectHired.draft.project();
                },
                exit: function() {
                    projectHired.draft.cancel();
                }
            });
        },

        vehicle: function() {
            console.log('draft vehicle()');
            var previous = projectHired.project.vehicle;
            modal.vehicle({
                title: 'Review Vehicle',
                message: 'Make sure all of the following information is correct in regards to the customer\'s vehicle:',
                vehicle: projectHired.project.vehicle,
                submit: function(vehicle) {
                    if(previous.make == vehicle.make && previous.model == vehicle.model && previous.year == vehicle.year && previous.engine == vehicle.engine && previous.mileage == vehicle.mileage) {
                        projectHired.draft.data.vehicle = vehicle;
                        projectHired.draft.data.vehicleId = projectHired.project.vehicle._id;
                        projectHired.draft.project();
                    } else {
                        modal.notify({
                            title: 'Saving Vehicle',
                            message: 'We are currently saving your updated vehicle information. This may take a few moments, so thank you for your patience.',
                            loading: true
                        });

                        vehicle._id = projectHired.project.vehicle._id;
                        var body = {
                            vehicle: vehicle,
                            projectId: projectHired.project._id
                        }

                        // save the vehicle
                        var request = $.ajax({
                            type: "PUT",
                            url: '/api/profile/vehicle',
                            data: body,
                            dataType: 'json'
                        });

                        request.done(function(vehicle) {
                            projectHired.project.vehicle = vehicle;
                            projectHired.draft.data.vehicle = vehicle;
                            projectHired.draft.data.vehicleId = vehicle._id;
                            projectHired.draft.project();
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
                    projectHired.draft.cancel();
                }
            });
        },

        submit: function(estimateId, draft) {
            console.log('draft submit()');
            modal.notify({
                title: 'Submitting Draft',
                message: 'We are currently sending your draft to the customer. Once the draft is processed, your request for payment will be sent to the customer automatically. This may take a few moments, so thank you for your patience.',
                loading: true,
                canExit: false,
                canOkay: false,
            });

            var body = {
                parent: projectHired.project._id,
                owner: projectHired.project.owner._id,
                creating: true,
                vehicle: draft.vehicleId,
                title: projectHired.project.title + ' (Diagnosed)',
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
                console.log(data);
                projectHired.project.child = data.project;
                projectHired.project.child.owner = data.owner;
                projectHired.project.child.parent = data.parent;
                projectHired.project.child.vehicle = data.vehicle;
                window.location = '/projects/' + projectHired.project.child._id + '/review';

                // modal.notify({
                //     title: 'Draft Saved',
                //     message: 'Your draft has been saved. Click okay to continue to the draft review page, where you can edit this draft, submit the first estimate on the draft, and request payment for your diagnosis',
                //     okayText: 'Take Me There',
                //     okay: function() {
                //         window.location = '/projects/' + projectHired.project.child._id + '/review';
                //     }
                // });
                // if(!util.is.nil(projectHired.draft.data.firstEstimate)) {
                //     projectHired.draft.estimateOnDraft(estimateId, projectHired.draft.data.firstEstimate);
                // } else {
                //     // they didn't do a first estimate
                //     projectHired.requestPayment(estimateId);
                // }
            });

            request.fail(function(jqXHR) {
                console.log(jqXHR);
            });
        }
    }
};

$(document).ready(function(e) {
    projectHired.init();
});