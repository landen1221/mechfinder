var sellerReview = {
    project: null,
    user: null,
    targetEstimate: null,
    photoCount: null,
    clicked: false,

    init: function() {
        sellerReview.project = PROJECT;
        sellerReview.user = USER;
        if(util.is.nil(sellerReview.project) || util.is.nil(sellerReview.user)) return window.location.reload(true);

        sellerReview.photoCount = sellerReview.project.photos.length;

        var estimate = null;
        for(var i=0; i<sellerReview.project.bids.length; i++) {
            estimate = sellerReview.project.bids[i];
            if(estimate.state == 'submitted' && estimate.owner._id == sellerReview.project.poster._id) break;
        }
        sellerReview.targetEstimate = estimate;

        $('.updateEstimate').on('click touchmove touchend', function(e) {
            if(e.type != 'touchmove' && !sellerReview.clicked) {
                sellerReview.clicked = true;
                setTimeout(function() {
                    sellerReview.clicked = false;
                }, 300);

                sellerReview.updateEstimate();
            }
        });

        $('.placeEstimate').on('click touchmove touchend', function(e) {
            if(e.type != 'touchmove' && !sellerReview.clicked) {
                sellerReview.clicked = true;
                setTimeout(function() {
                    sellerReview.clicked = false;
                }, 300);

                sellerReview.placeEstimate();
            }
        });

        $('.submitDraft').on('click touchmove touchend', function(e) {
            if(e.type != 'touchmove' && !sellerReview.clicked) {
                sellerReview.clicked = true;
                setTimeout(function() {
                    sellerReview.clicked = false;
                }, 300);

                sellerReview.submitDraft();
            }
        });

        $('.editVehicle').on('click touchmove touchend', function(e) {
            if(e.type != 'touchmove' && !sellerReview.clicked) {
                sellerReview.clicked = true;
                setTimeout(function() {
                    sellerReview.clicked = false;
                }, 300);

                sellerReview.editVehicle();
            }
        });

        $('.editDescription').on('click touchmove touchend', function(e) {
            if(e.type != 'touchmove' && !sellerReview.clicked) {
                sellerReview.clicked = true;
                setTimeout(function() {
                    sellerReview.clicked = false;
                }, 300);

                sellerReview.editDescription();
            }
        });

        $('.editServiceType').on('click touchmove touchend', function(e) {
            if(e.type != 'touchmove' && !sellerReview.clicked) {
                sellerReview.clicked = true;
                setTimeout(function() {
                    sellerReview.clicked = false;
                }, 300);

                sellerReview.editServiceType();
            }
        });

        $('.editNeedsTow').on('click touchmove touchend', function(e) {
            if(e.type != 'touchmove' && !sellerReview.clicked) {
                sellerReview.clicked = true;
                setTimeout(function() {
                    sellerReview.clicked = false;
                }, 300);

                sellerReview.editNeedsTow();
            }
        });

        $('#noFirstEstimate').on('click touchmove touchend', function(e) {
            console.log('BLAH');
            if(e.type != 'touchmove' && !sellerReview.clicked) {
                sellerReview.clicked = true;
                setTimeout(function() {
                    sellerReview.clicked = false;
                }, 300);

                sellerReview.noFirstEstimate();
            }
        });

        $('.editPhotos').on('click touchmove touchend', function(e) {
            if(e.type != 'touchmove' && !sellerReview.clicked) {
                sellerReview.clicked = true;
                setTimeout(function() {
                    sellerReview.clicked = false;
                }, 300);
                
                sellerReview.addPhotos();
            }
        });

        $('.removePhoto').each(function(i) {
            $(this).on('click', function(e) {
                sellerReview.removePhoto($(this).attr('data-id'));
            });
        });
    },

    removePhoto: function(id) {
        var body = {
            deletePhotos: [id]
        };

        var request = $.ajax({
            type: 'POST',
            url: '/api/project/' + sellerReview.project._id,
            data: body,
            dataType: 'json'
        });

        request.fail(function(jqXHR) {
            console.log(jqXHR);
            modal.notify({
                title: 'Submission Error',
                message: 'We were unable to delete this photo. If this error persists, please contact us to resolve the issue.',
                okay: function() {
                    window.location.reload(true);
                },
                cancel: function() {
                    window.locations.reload(true);
                }
            });
        });

        request.done(function(project) {
            $('#picbox-savedPhoto' + id).remove();
            sellerReview.photoCount--;
            if (sellerReview.photoCount <= 0) {
                $('.mf-dragndrop').css('display','block');
                $('.mf-gallery').remove();
            }
        });
    },

    addPhotos: function() {
        modal.photos ({
            submitText: 'Save',
            cancelText: 'Cancel',
            allowEmpty: true,
            submit: function(photos) {
                var body = {
                    photos: []
                };

                for (var i = 0; i < photos.length; i++) {
                    body.photos.push(photos[i].data);
                }

                var request = $.ajax({
                    type: 'POST',
                    url: '/api/project/' + sellerReview.project._id,
                    data: body,
                    dataType: 'json'
                });

                request.fail(function(jqXHR) {
                    console.log(jqXHR);
                    modal.notify({
                        title: 'Submission Error',
                        message: 'There was an error while saving your estimate. If this error persists, please contact us to resolve the issue.',
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
                        title: 'Pictures Updated',
                        message: 'Your photos have been added to this draft.',
                        okay: function() {
                            window.location.reload(true);
                        }
                    });
                });
            }
        });
    },

    updateEstimate: function() {
        modal.estimate({
            title: 'Update Your Estimate',
            message: 'Update the parts and labor you think will be required to fix ' + sellerReview.project.owner.username + '\'s ' + sellerReview.project.vehicle.make + '. The customer will be notified of your changes.',
            user: sellerReview.user,
            project: sellerReview.project,
            estimate: sellerReview.targetEstimate,
            edit: true,
            placeText: 'Save Changes',
            place: function(estimate) {
                sellerEstimates.place(estimate);
            }
        })
    },

    placeEstimate: function() {
        modal.estimate({
            project: sellerReview.project,
            user: sellerReview.user,
            edit: true,
            place: function(estimate) {
                modal.notify({
                    title: 'Submitting Estimate',
                    message: 'MechFinder is saving your estimate on this draft',
                    canExit: false,
                    canOkay: false,
                    loading: true
                });

                var body = estimate;

                var request = $.ajax({
                    type: 'POST',
                    url: '/api/project/' + sellerReview.project._id + '/bid',
                    data: body,
                    dataType: 'json'
                });

                request.fail(function(jqXHR) {
                    console.log(jqXHR);
                    modal.notify({
                        title: 'Submission Error',
                        message: 'There was an error while saving your estimate. If this error persists, please contact us to resolve the issue.',
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
                        message: 'Your estimate has been saved to this draft',
                        okay: function() {
                            window.location.reload(true);
                        }
                    });
                });
            }
        });
    },

    submitDraft: function() {
        modal.confirm({
            title: 'Submit Draft',
            message: (sellerReview.project.bids.length ? '' : 'You have not submitted an estimate on parts and labor for this draft. ') + 'Are you sure you wish to submit this draft?',
            yes: function() {
                modal.notify({
                    title: 'Sending to Customer',
                    message: 'Sending your draft ' + (sellerReview.project.bids.length ? 'and estimate' : '') + ' to the customer',
                    canOkay: false,
                    canExit: false,
                    loading: true
                });

                var body = {};
                var request = $.ajax({
                    method: 'POST',
                    url: '/api/project/' + sellerReview.project._id + '/sendDraft',
                    data: body,
                    dataType: 'json'
                })

                request.done(function(data) {
                    modal.notify({
                        title: 'Draft Sent',
                        message: 'Your draft has been sent to the customer. If they are satisfied with your diagnosis, your diagnosis payment will be released',
                        okay: function() {
                            window.location.reload(true);
                        },
                        exit: function() {
                            window.location.reload(true);
                        }
                    })
                });

                request.fail(function(jqXHR) {
                    console.log(jqXHR);
                    modal.notify({
                        title: 'Error',
                        message: 'There was a problem whil sending your draft to the customer. If this error persists, please contact us for more information',
                        okay: function() {
                            window.location.reload(true);
                        },
                        exit: function() {
                            window.location.reload(true);
                        }
                    })
                });
            }
        });
    },

    editVehicle: function() {
        modal.vehicle({
            title: 'Edit Vehicle Info',
            message: 'Update any vehicle info to match the customer\'s vehicle. They will be notified of your changes',
            vehicle: sellerReview.project.vehicle,
            submit: function(vehicle) {
                vehicle._id = sellerReview.project.vehicle._id;

                modal.notify({
                    title: 'Saving Changes',
                    message: 'Your changes to the vehicle are being saved',
                    loading: true,
                    canOkay: false,
                    canExit: false
                });

                var body = {
                    projectId: sellerReview.project._id,
                    vehicle: vehicle
                };

                var request = $.ajax({
                    method: 'PUT',
                    url: '/api/profile/vehicle',
                    data: body,
                    dataType: 'json'
                });

                request.done(function(data) {
                    console.log(data);
                    modal.notify({
                        title: 'Vehicle Saved',
                        message: 'Your updated vehicle information has been saved',
                        okay: function() {
                            window.location.reload(true);
                        }
                    });
                });

                request.fail(function(jqXHR) {
                    console.log(jqXHR);
                    modal.notify({
                        title: 'Error',
                        message: 'There was an issue while saving the updated vehicle info. If this problem persists, please contact us for more information.',
                        okay: function() {
                            window.location.reload(true);
                        }
                    })
                });
            }
        });
    },

    editDescription: function() {
        console.log(sellerReview.project.description);
        modal.input({
            title: 'Update Project Description',
            message: 'Please fill out a detailed description of what is wrong with the vehicle and how to fix it here:',
            textarea: true,
            clearText: false,
            defaultValue: sellerReview.project.description,
            submit: function(input) {
                modal.notify({
                    title: 'Updating Description',
                    message: 'We are currently saving the changes to the diagnosis description',
                    canOkay: false,
                    canExit: false,
                    loading: true
                });

                var body = {
                    description: input
                };

                var request = $.ajax({
                    method: 'POST',
                    url: '/api/project/' + sellerReview.project._id,
                    data: body,
                    dataType: 'json'
                });

                request.done(function(data) {
                    console.log(data);
                    modal.notify({
                        title: 'Description Updated',
                        message: 'The changes to the diagnosis have been saved',
                        okay: function() {
                            window.location.reload(true);
                        }
                    });
                });

                request.fail(function(jqXHR) {
                    console.log(jqXHR);
                    modal.notify({
                        title: 'Error',
                        message: 'There was a problem while updating the diagnosis description. If this error persists, please contact us for more information',
                        okay: function() {
                            window.location.reload(true);
                        }
                    })
                });
            }
        })
    },

    editServiceType: function() {
        var options = [
            { value: 'Auto Repair' },
            { value: 'Audio' },
            { value: 'Body Work' },
            { value: 'Electrical' },
            { value: 'Maintenance' },
            { value: 'Restoration' },
            { value: 'Windows' },
            { value: 'Tires' }
        ];

        var selectedIndex = 0;
        for(var i=0; i<options.length; i++) {
            var option = options[i];
            if(option.value == sellerReview.project.repair) {
                selectedIndex = i;
                break;
            }
        }

        modal.select({
            title: 'Service Type',
            message: 'Select the category of service that best fits the needs of the customer:',
            options: options,
            selectedIndex: selectedIndex,
            submit: function(value) {
                modal.notify({
                    title: 'Updating Description',
                    message: 'We are currently saving the changes to the diagnosis service type',
                    canOkay: false,
                    canExit: false,
                    loading: true
                });

                var body = {
                    repair: value
                };

                var request = $.ajax({
                    method: 'POST',
                    url: '/api/project/' + sellerReview.project._id,
                    data: body,
                    dataType: 'json'
                });

                request.done(function(data) {
                    console.log(data);
                    modal.notify({
                        title: 'Service Type Updated',
                        message: 'Your change to the diagnosis service type has been saved. The customer will be notified of this change.',
                        okay: function() {
                            window.location.reload(true);
                        }
                    });
                });

                request.fail(function(jqXHR) {
                    console.log(jqXHR);
                    modal.notify({
                        title: 'Error',
                        message: 'There was a problem while updating the diagnosis service type. If this error persists, please contact us for more information',
                        okay: function() {
                            window.location.reload(true);
                        }
                    })
                });
            }
        });
    },

    editNeedsTow: function() {
        var update = function(needs) {
            modal.notify({
                title: 'Updating Towing',
                message: 'We are currently updating the project with your towing setting',
                canOkay: false,
                canExit: false,
                loading: true
            });

            var body = {
                tow: needs
            };

            var request = $.ajax({
                method: 'POST',
                url: '/api/project/' + sellerReview.project._id,
                data: body,
                dataType: 'json'
            });

            request.done(function(data) {
                console.log(data);
                modal.notify({
                    title: 'Towing Updated',
                    message: 'You have updated the towing setting of this vehicle. The customer will be notified of this change.',
                    okay: function() {
                        window.location.reload(true);
                    }
                });
            });

            request.fail(function(jqXHR) {
                console.log(jqXHR);
                modal.notify({
                    title: 'Error',
                    message: 'There was a problem while updating the towing setting. If this error persists, please contact us for more information',
                    okay: function() {
                        window.location.reload(true);
                    }
                })
            });
        };

        modal.confirm({
            title: 'Towing',
            message: 'Does the customer need to be towed?',
            yes: function() {
                update(true);
            },
            no: function() {
                update(false);
            }
        });
    },

    noFirstEstimate: function() {
        $('#placeAnEstimate').stop().fadeOut(300, function() {
            $('#satisfiedAfterNoEstimate').stop().fadeIn(300);
        });
    }
};

$(document).ready(function(e) {
    sellerReview.init();
});