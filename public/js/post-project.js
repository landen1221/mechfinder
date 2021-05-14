var postProject = {
    user: null,
    vehicles: [],

    init: function() {
        postProject.user = USER;

        if(util.is.nil(postProject.user)) return window.location.reload(true);
        if(!util.is.nil(VEHICLES)) postProject.vehicles = VEHICLES;

        if(postProject.vehicles.length <= 0) postProject.validate.newVehicle = true;

        postProject.hours.init();
        postProject.photos.init();
        postProject.clicks.init();
    },

    project: {
        _id: '',
        vehicle: {
            make: '',
            model: '',
            year: '',
            engine: '',
            mileage: ''
        },
        diagnosis: false,
        repair: '',
        description: '',
        parts: false,
        acceptablePart: [],
        tow: false,
        preference: '',
        schedule: new Date(),
        hours: {},
        photos: [],
        deletePhotos: [],
        projectLocation: {
            lat: null,
            lng: null
        },
        draft: false
    },

    hours: {
        addTimeFlagged: false,
        times: [],

        count: function(hours) {
            var length = 0;
            for(hour in hours) {
                if(hours.hasOwnProperty(hour)) {
                    length ++;
                }
            }

            return length;
        },

        init: function() {
            if(postProject.project._id) {
                for(i=0; i<postProject.hours.count(postProject.project.hours); i++) {
                    hours = postProject.project.hours[i];
                    postProject.hours.addAvailability({
                        day: i.toString(),
                        timeOpen: hours.open,
                        timeClose: hours.close
                    });
                }
            }

            $('#addHours').on('click touchstart', function(e) {
                if(!postProject.hours.addTimeFlagged) {
                    postProject.hours.addTimeFlagged = true;
                    setTimeout(function(){ postProject.hours.addTimeFlagged = false; }, 300);

                    var day = $('#hoursDay').val();
                    var timeOpen = $('#hoursOpen').val();
                    var timeClose = $('#hoursClose').val();

                    var addProblem = false;
                    if(timeOpen == '') {
                        addProblem = true;
                        alert('You must select an opening time before adding');
                    }

                    if(timeClose == '' && !addProblem) {
                        addProblem = true;
                        alert('You must select a closing time before adding');
                    }

                    var hours = {
                        day: day,
                        timeOpen: timeOpen,
                        timeClose: timeClose
                    }

                    if(!addProblem && !postProject.hours.hasAvailability(hours)) {
                        addProblem = true;
                        alert('You have already added this time frame into your available hours.');
                    }

                    if(!addProblem && hours.timeOpen == hours.timeClose) {
                        addProblem = true;
                        alert('You must have at least 30 minutes between opening and closing time.');
                    }

                    if(!addProblem) {
                        postProject.hours.addAvailability(hours);
                    }
                }
            });

            $('#availability').on('change', function(e) {
                if($(this).val() == '3') {
                    $('#customHours').stop().slideDown(300);
                } else {
                    $('#customHours').stop().slideUp(300);
                }
            });
        },

        dayToString: function(day) {
            switch(day) {
                case '0': return 'Sunday';
                case '1': return 'Monday';
                case '2': return 'Tuesday';
                case '3': return 'Wednesday';
                case '4': return 'Thursday';
                case '5': return 'Friday';
                default:  return 'Saturday';
            }
        },

        hourToString: function(hour) {
            switch(hour) {
                case '1':  return '1:00 AM';
                case '2':  return '2:00 AM';
                case '3':  return '3:00 AM';
                case '4':  return '4:00 AM';
                case '5':  return '5:00 AM';
                case '6':  return '6:00 AM';
                case '7':  return '7:00 AM';
                case '8':  return '8:00 AM';
                case '9':  return '9:00 AM';
                case '10': return '10:00 AM';
                case '11': return '11:00 AM';
                case '12': return '12:00 PM';
                case '13': return '1:00 PM';
                case '14': return '2:00 PM';
                case '15': return '3:00 PM';
                case '16': return '4:00 PM';
                case '17': return '5:00 PM';
                case '18': return '6:00 PM';
                case '19': return '7:00 PM';
                case '20': return '8:00 PM';
                case '21': return '9:00 PM';
                case '22': return '10:00 PM';
                case '23': return '11:00 PM';
                default:   return '12:00 AM';
            }
        },

        hasAvailability: function(hours) {
            for(i=0; i<postProject.hours.times.length; i++) {
                h = postProject.hours.times[i];

                if(hours.day == h.day && hours.timeOpen == h.timeOpen && hours.timeClose == h.timeClose) {
                    return false;
                }
            }

            return true;
        },

        addAvailability: function(hours) {
            if(!util.is.nil(hours.day) && !util.is.nil(hours.timeOpen) && !util.is.nil(hours.timeClose)) {
                postProject.hours.times.push(hours);
                var dataid = hours.day+hours.timeOpen+hours.timeClose;

                var html = '';
                html += '<tr data-id="' + dataid + '" style="display: none;">';
                    html += '<td>' + postProject.hours.dayToString(hours.day) + '</td>';
                    html += '<td>' + postProject.hours.hourToString(hours.timeOpen) + ' - ' + postProject.hours.hourToString(hours.timeClose) + '</td>';
                    html += '<td><a class="delete standard-button red" href="javascript:void(0);" data-id="' + dataid + '"><i class="fa fa-trash"></i> Delete</a></td>';
                html += '</tr>';

                $('#hoursTable').append(html);
                $('#hoursTable tr td a.delete[data-id="' + dataid + '"]').off('click touchstart').on('click touchstart', function(e) {
                    var dataidClicked = $(this).attr('data-id');
                    postProject.hours.deleteAvailability(dataidClicked);
                });

                $('#hoursTable tr[data-id="' + dataid + '"]').fadeIn(300);

                if(postProject.hours.times.length >= 7) {
                    $('#hoursSelectors').stop().slideUp(300);
                }

                $('#hoursDay option[value="' + hours.day + '"]').prop('disabled', true);
                $('#hoursDay option:not([disabled])').first().prop('selected', true);
            }
        },

        deleteAvailability: function(dataid) {
            $('#hoursTable tr[data-id="' + dataid + '"]').stop().fadeOut(300, function() {
                $(this).remove();

                for(i=0; i<postProject.hours.times.length; i++) {
                    var hours = postProject.hours.times[i];
                    if(hours.day+hours.timeOpen+hours.timeClose == dataid) {
                        if(postProject.hours.times.length >= 7) {
                            $('#hoursSelectors').stop().slideDown(300);
                        }

                        postProject.hours.times.splice(i, 1);
                        $('#hoursDay option[value="' + hours.day + '"]').prop('disabled', false);
                        $('#hoursDay option:not([disabled])').first().prop('selected', true);
                        break;
                    }
                }
            });
        },

        clear: function() {
            for(i=0; i<postProject.hours.times.length; i++) {
                var dataid = '';
                dataid += postProject.hours.times[i].day;
                dataid += postProject.hours.times[i].timeOpen;
                dataid += postProject.hours.times[i].timeClose;
                postProject.hours.deleteAvailability(dataid);
            }
        }
    },

    photos: {
        list: [],
        existing: [],
        delete: [],

        init: function() {
            var addPhotosTriggered = false;
            $('#add-photos-link, #addPhotosDroplink').on('click', function(e) {
                if(!addPhotosTriggered) {
                    addPhotosTriggered = true;
                    setTimeout(function() { addPhotosTriggered = false;}, 300);
                    $('#add-photos-fileinput').click();
                }
            });

            $('#piclist').filedrop({
                callback: function(file, data) {
                    postProject.photos.addPhoto(file, data);
                }
            });

            $('#add-photos-fileinput').on('change', function(e) {
                //file = e.target.files[0];
                var files = $(this).get(0).files;
                for(i=0; i<files.length; i++) {
                    var file = files[i];
                    var reader = new FileReader();
                    reader.onload = (function(f) {
                        return function(event) {
                            postProject.photos.addPhoto(f, event.target.result);
                        }
                    })(file);

                    reader.readAsDataURL(file);
                }
            });

            $('#picboxes').on('dragenter', function(e) {
                $(this).addClass('dragging');
            }).on('dragleave drop', function(e) {
                $(this).removeClass('dragging');
            });

            if(postProject.project._id) {
                for(i=0; i<postProject.project.photos.length; i++) {
                    photo = postProject.project.photos[i];

                    postProject.photos.existing.push({
                        id: 'savedPhoto' + photo
                    });

                    var removeClicked = false;
                    $('#remove-savedPhoto' + photo).on('click touchstart', function(e) {
                        if(!removeClicked) {
                            removeClicked = true;
                            setTimeout(function() { removeClicked = false; }, 300);

                            var clickedId = $(this).attr('data-id');
                            postProject.photos.removePhoto(clickedId);
                        }
                    });
                }
            }            
        },

        addPhoto: function(file, data, existing) {
            if(typeof(existing !== 'boolean')) existing = false;

            // if we have any other supported file extensions, feel free to add them
            if(file.name.toLowerCase().match(/\.(jpg|jpeg|png|gif)$/) || existing) {
                // create unique id for div and image tag based off of file name
                var id = file.name.replace(/\W/g, '');

                var alreadyAdded = false;
                for(i=0; i<postProject.photos.list.length; i++) {
                    if(postProject.photos.list[i].id == id) {
                        alreadyAdded = true;
                        break;
                    }
                }

                if(!alreadyAdded) {
                    var html = '';
                    html += '<div id="picbox-' + id + '" class="picbox" style="display: none;">';
                        html += '<img id="upload-' + id + '" alt="' + file.name + '" src="' + data + '" />';
                        html += '<div id="remove-' + id + '" class="remove" data-id="' + id + '">X</div>'
                    html += '</div>';

                    postProject.photos.list.push({
                        file: file,
                        data: data,
                        id: id
                    });

                    $('#picboxes').append(html);
                    if(postProject.photos.list.length < 2) {
                        $('#dragndrop').stop().slideUp(300, function() {
                            $('#picboxes').stop().slideDown(300);
                        });
                    }

                    var removeClicked = false;
                    $('#remove-' + id).on('click touchstart', function(e) {
                        if(!removeClicked) {
                            removeClicked = true;
                            setTimeout(function() { removeClicked = false; }, 300);

                            var clickedId = $(this).attr('data-id');
                            postProject.photos.removePhoto(clickedId);
                        }
                    });

                    $('#picbox-' + id).stop().fadeIn(300);
                } else {
                    $('#addError').stop().slideUp(300, function() {
                        $(this).html('You have already added one or more of the photos you have selected').stop().slideDown(300);
                        setTimeout(function() {
                            $('#addError').stop().slideUp(300);
                        }, 5000);
                    });
                }
            } else {
                $('#addError').stop().slideUp(300, function() {
                    $(this).html('Some files uploaded were not images. Please upload image files only').stop().slideDown(300);
                    setTimeout(function() {
                        $('#addError').stop().slideUp(300);
                    }, 5000);
                });
            }
        },

        removePhoto: function(id) {
            var index = -1;
            for(i=0; i<postProject.photos.list.length; i++) {
                if(postProject.photos.list[i].id == id) {
                    index = i;
                    break;
                }
            }

            if(index >= 0) {
                postProject.photos.list.splice(index, 1);
            } else {
                for(i=0; i<postProject.photos.existing.length; i++) {
                    if(postProject.photos.existing[i].id == id) {
                        index = i;
                        break;
                    }
                }

                if(index >= 0) {
                    // add the targeted photo to the to-be deleted array and then remove it from the existing array
                    postProject.photos.delete.push(id.replace('savedPhoto', ''));
                    postProject.photos.existing.splice(index, 1);
                }
            }

            if(index >= 0) {
                $('#picbox-' + id).stop().fadeOut(300, function() {
                    $(this).remove();
                });

                $('#add-photos-fileinput').val('');
            }

            if(postProject.photos.list.length < 1 && postProject.photos.existing.length < 1) {
                $('#dragndrop').stop().slideDown(300);
            }
        },

        clear: function() {
            for(i=0; i<postProject.photos.list.length; i++) {
                postProject.photos.removePhoto(postProject.photos.list[i]);
            }
        }
    },

    location: {
        initialized: false,

        guessedLocation: {
            lat: 33.4484,
            lng: -112.0740 // center of phoenix
        },

        map: null,
        marker: null,
        geocoder: null,

        googleInit: function() {
            $(document).ready(function(e) {
                postProject.location.initialized = true;

                postProject.location.guessedLocation.lat = USER.geo.loc.coordinates[1] || 33.4484;
                postProject.location.guessedLocation.lng = USER.geo.loc.coordinates[0] || -112.0740;

                postProject.location.geocoder = new google.maps.Geocoder();

                postProject.location.map = new google.maps.Map($('#projectMap')[0], {
                    center: postProject.location.guessedLocation,
                    zoom: 15
                });

                postProject.location.marker = new google.maps.Marker({
                    position: postProject.location.map.getCenter(),
                    map: postProject.location.map,
                    draggable: true,
                    animation: google.maps.Animation.DROP
                });

                $(window).on('resize', function(e) {
                    postProject.location.reset();
                });

                $('#updateGeocoding').on('click touchmove touchend', function(e) {
                    if(e.type != 'touchmove' && !postProject.clicks.clicked.geocode) {
                        postProject.clicks.clicked.geocode = true;
                        setTimeout(function() {
                            postProject.clicks.clicked.geocode = false;
                        }, 300);

                        postProject.location.geocode($('#geocodeAddress').val());
                    }
                });

                $('#geocodeAddress').on('keyup', function(e) {
                    if (e.which === 13) {
                        $('#updateGeocoding').click();
                    }
                });
            });
        },

        geocode: function(address) {
            geocoderRequest = {
                address: address
            };

            postProject.location.geocoder.geocode(geocoderRequest, function(results, status) {
                switch(status) {
                    case 'OK':
                        console.log('good job');
                        $('#geocodeAddress').removeClass('error');
                        postProject.location.marker.setPosition(results[0].geometry.location);
                        postProject.location.reset();
                        break;
                    default:
                        console.log('Geocoding Error: ' + status);
                        $('#geocodeAddress').addClass('error');
                        break;
                }
            });
        },

        reset: function() {
            google.maps.event.trigger(postProject.location.map, 'resize');
            var center = (!util.is.nil(postProject.location.marker)) ? postProject.location.marker.getPosition() : postProject.location.guessedLocation;
            postProject.location.map.setCenter(center);
        }
    },

    clicks: {
        clicked: {
            next: false,
            back: false,
            diagnosisChoice: false,
            partsChoice: false,
            towChoice: false,
            mechanicPreference: false,
            draftChoice: false,
            number: false,
            geocode: false
        },

        init: function() {
            $('#setVehicle, #setNewVehicle').off('click touchmove touchend').on('click touchmove touchend', function(e) {
                if(e.type != 'touchmove' && !postProject.clicks.clicked.next) {
                    postProject.clicks.clicked.next = true;
                    setTimeout(function() {
                        postProject.clicks.clicked.next = false;
                    }, 300);

                    postProject.validate.vehicle(function() {
                        postProject.switchStep('diagnosisStep');

                        //Tracking is done here to prevent recording
                        //   people who are just exploring
                        newProjectData = {
                            'User': USER._id,
                            'Previous Step': 'Vehicle Selection'
                        };
                        mfMixpanel.track('New Project', newProjectData);
                    });
                }
            });

            $('#addNewVehicle').off('click touchmove touchend').on('click touchmove touchend', function(e) {
                if(e.type != 'touchmove' && !postProject.clicks.clicked.newVehicle) {
                    postProject.clicks.clicked.newVehicle = true;
                    setTimeout(function() {
                        postProject.clicks.clicked.newVehicle = false;
                    }, 300);

                    postProject.validate.newVehicle = true;

                    $('#existingVehicleContainer').stop().fadeOut(300, function() {
                        $('#newVehicleContainer').stop().fadeIn(300);
                    });
                }
            });

            $('#backExistingVehicle').off('click touchmove touchend').on('click touchmove touchend', function(e) {
                if(e.type != 'touchmove' && !postProject.clicks.clicked.newVehicle) {
                    postProject.clicks.clicked.newVehicle = true;
                    setTimeout(function() {
                        postProject.clicks.clicked.newVehicle = false;
                    }, 300);

                    postProject.validate.newVehicle = false;

                    $('#newVehicleContainer').stop().fadeOut(300, function() {
                        $('#existingVehicleContainer').stop().fadeIn(300);
                    });
                }
            });

            $('.diagnosisChoice').off('click touchmove touchend').on('click touchmove touchend', function(e) {
                if(e.type != 'touchmove' && !postProject.clicks.clicked.diagnosisChoice) {
                    postProject.clicks.clicked.diagnosisChoice = true;
                    setTimeout(function() {
                        postProject.clicks.clicked.diagnosisChoice = false;
                    }, 300);

                    postProject.project.diagnosis = ($(this).attr('data-value') == '1');

                    // var stepTo = 'repairStep';
                    // if(postProject.project.diagnosis) stepTo = 'descriptionStep';
                    var stepTo = 'descriptionStep';
                    postProject.switchStep(stepTo);

                    if(postProject.project.diagnosis) {
                        // skip 3, 5, & 6
                        // $('#numberRepairStep, #numberPartsStep, #numberAcceptablePartsStep').hide();
                        $('#numberPartsStep, #numberAcceptablePartsStep').hide();
                        // $('#numberDescriptionStep .mf-circle-number').html(3);
                        // $('#numberTowStep .mf-circle-number').html(4);
                        // $('#numberMechanicPreferenceStep .mf-circle-number').html(5);
                        // $('#numberScheduleStep .mf-circle-number').html(6);
                        // $('#numberAvailabilityStep .mf-circle-number').html(7);
                        $('#numberPhotosStep .mf-circle-number').html(4);
                        $('#numberLocationStep .mf-circle-number').html(5);
                        $('#numberNameStep .mf-circle-number').html(6);
                        $('#publishDescription').html('I want to publish this job so that mechanics can diagnose what\'s wrong with my vehicle');
                    } else {
                        // $('#numberRepairStep, #numberPartsStep, #numberAcceptablePartsStep').show();
                        $('#numberPartsStep, #numberAcceptablePartsStep').show();
                        // $('#numberDescriptionStep .mf-circle-number').html(4);
                        // $('#numberTowStep .mf-circle-number').html(7);
                        // $('#numberMechanicPreferenceStep .mf-circle-number').html(8);
                        // $('#numberScheduleStep .mf-circle-number').html(9);
                        // $('#numberAvailabilityStep .mf-circle-number').html(10);
                        $('#numberPhotosStep .mf-circle-number').html(6);
                        $('#numberLocationStep .mf-circle-number').html(7);
                        $('#numberNameStep .mf-circle-number').html(8);
                        $('#publishDescription').html('I want to publish this job so that mechanics can place estimates on parts &amp; labor to fix it');
                    }

                    newProjectData = {
                        'User': USER._id,
                        'Previous Step': 'Diagnosis Choice',
                        'Diagnosis': postProject.project.diagnosis
                    };
                    mfMixpanel.track('New Project', newProjectData);
                }
            });

            $('#backDiagnosis').off('click touchmove touchend').on('click touchmove touchend', function(e) {
                if(e.type != 'touchmove' && !postProject.clicks.clicked.back) {
                    postProject.clicks.clicked.back = true;
                    setTimeout(function() {
                        postProject.clicks.clicked.back = false;
                    }, 300);

                    postProject.switchStep('vehicleStep');
                }
            });

            // $('#setRepair').off('click touchmove touchend').on('click touchmove touchend', function(e) {
            //     if(e.type != 'touchmove' && !postProject.clicks.clicked.next) {
            //         postProject.clicks.clicked.next = true;
            //         setTimeout(function() {
            //             postProject.clicks.clicked.next = false;
            //         }, 300);

            //         postProject.validate.repair(function() {
            //             postProject.switchStep('descriptionStep');
            //         });

            //         newProjectData = {
            //             'User': USER._id,
            //             'Previous Step': 'Repair Set',
            //             'Diagnosis': postProject.project.diagnosis
            //         };
            //         mfMixpanel.track('New Project', newProjectData);
            //     }
            // });

            // $('#backRepair').off('click touchmove touchend').on('click touchmove touchend', function(e) {
            //     if(e.type != 'touchmove' && !postProject.clicks.clicked.back) {
            //         postProject.clicks.clicked.back = true;
            //         setTimeout(function() {
            //             postProject.clicks.clicked.back = false;
            //         }, 300);

            //         postProject.switchStep('diagnosisStep');
            //     }
            // });

            $('#setDescription').off('click touchmove touchend').on('click touchmove touchend', function(e) {
                if(e.type != 'touchmove' && !postProject.clicks.clicked.next) {
                    postProject.clicks.clicked.next = true;
                    setTimeout(function() {
                        postProject.clicks.clicked.next = false;
                    }, 300);

                    postProject.validate.description(function() {
                        var to = 'partsStep';
                        if(postProject.project.diagnosis) to = 'photosStep';
                        postProject.switchStep(to);

                        newProjectData = {
                            'User': USER._id,
                            'Previous Step': 'Description Set',
                            'Diagnosis': postProject.project.diagnosis
                        };
                        mfMixpanel.track('New Project', newProjectData);
                    });
                }
            });

            $('#backDescription').off('click touchmove touchend').on('click touchmove touchend', function(e) {
                if(e.type != 'touchmove' && !postProject.clicks.clicked.back) {
                    postProject.clicks.clicked.back = true;
                    setTimeout(function() {
                        postProject.clicks.clicked.back = false;
                    }, 300);

                    // if(postProject.project.diagnosis) {
                    //     postProject.switchStep('diagnosisStep');
                    // } else {
                    //     postProject.switchStep('repairStep');
                    // }
                    postProject.switchStep('diagnosisStep');
                }
            });

            $('.partsChoice').off('click touchmove touchend').on('click touchmove touchend', function(e) {
                if(e.type != 'touchmove' && !postProject.clicks.clicked.partsChoice) {
                    postProject.clicks.clicked.partsChoice = true;
                    setTimeout(function() {
                        postProject.clicks.clicked.partsChoice = false;
                    }, 300);

                    postProject.project.parts = ($(this).attr('data-value') == '1');
                    postProject.switchStep('acceptablePartsStep');

                    newProjectData = {
                        'User': USER._id,
                        'Previous Step': 'Have Parts',
                        'Diagnosis': postProject.project.diagnosis
                    };
                    mfMixpanel.track('New Project', newProjectData);
                }
            });

            $('#backParts').off('click touchmove touchend').on('click touchmove touchend', function(e) {
                if(e.type != 'touchmove' && !postProject.clicks.clicked.back) {
                    postProject.clicks.clicked.back = true;
                    setTimeout(function() {
                        postProject.clicks.clicked.back = false;
                    }, 300);

                    postProject.switchStep('descriptionStep');
                }
            });

            $('#setAcceptableParts').off('click touchmove touchend').on('click touchmove touchend', function(e) {
                if(e.type != 'touchmove' && !postProject.clicks.clicked.next) {
                    postProject.clicks.clicked.next = true;
                    setTimeout(function() {
                        postProject.clicks.clicked.next = false;
                    }, 300);

                    postProject.validate.acceptableParts(function() {
                        postProject.switchStep('photosStep');
                    });

                    newProjectData = {
                        'User': USER._id,
                        'Previous Step': 'Acceptable Parts',
                        'Diagnosis': postProject.project.diagnosis
                    };
                    mfMixpanel.track('New Project', newProjectData);
                }
            });

            $('#backAcceptableParts').off('click touchmove touchend').on('click touchmove touchend', function(e) {
                if(e.type != 'touchmove' && !postProject.clicks.clicked.back) {
                    postProject.clicks.clicked.back = true;
                    setTimeout(function() {
                        postProject.clicks.clicked.back = false;
                    }, 300);

                    postProject.switchStep('partsStep');
                }
            });

            // $('.towChoice').off('click touchmove touchend').on('click touchmove touchend', function(e) {
            //     if(e.type != 'touchmove' && !postProject.clicks.clicked.towChoice) {
            //         postProject.clicks.clicked.towChoice = true;
            //         setTimeout(function() {
            //             postProject.clicks.clicked.towChoice = false;
            //         }, 300);

            //         postProject.project.tow = ($(this).attr('data-value') == '1');
            //         postProject.switchStep('mechanicPreferenceStep');

            //         newProjectData = {
            //             'User': USER._id,
            //             'Previous Step': 'Needs Tow',
            //             'Diagnosis': postProject.project.diagnosis
            //         };
            //         mfMixpanel.track('New Project', newProjectData);
            //     }
            // });

            // $('#backTow').off('click touchmove touchend').on('click touchmove touchend', function(e) {
            //     if(e.type != 'touchmove' && !postProject.clicks.clicked.back) {
            //         postProject.clicks.clicked.back = true;
            //         setTimeout(function() {
            //             postProject.clicks.clicked.back = false;
            //         }, 300);

            //         if(postProject.project.diagnosis) {
            //             postProject.switchStep('descriptionStep');
            //         } else { 
            //             postProject.switchStep('acceptablePartsStep');
            //         }
            //     }
            // });

            // $('.mechanicPreference').off('click touchmove touchend').on('click touchmove touchend', function(e) {
            //     if(e.type != 'touchmove' && !postProject.clicks.clicked.mechanicPreference) {
            //         postProject.clicks.clicked.mechanicPreference = true;
            //         setTimeout(function() {
            //             postProject.clicks.clicked.mechanicPreference = false;
            //         }, 300);

            //         var pref = 'none';
            //         switch($(this).attr('data-value')) {
            //             case '1':
            //                 // mobile
            //                 pref = 'mobile';
            //                 break;
            //             case '-1':
            //                 // shops
            //                 pref = 'shop';
            //                 break;
            //         }

            //         postProject.project.preference = pref;
            //         postProject.switchStep('scheduleStep');

            //         newProjectData = {
            //             'User': USER._id,
            //             'Previous Step': 'Mechanic Preference',
            //             'Diagnosis': postProject.project.diagnosis
            //         };
            //         mfMixpanel.track('New Project', newProjectData);
            //     }
            // });

            // $('#backPreference').off('click touchmove touchend').on('click touchmove touchend', function(e) {
            //     if(e.type != 'touchmove' && !postProject.clicks.clicked.back) {
            //         postProject.clicks.clicked.back = true;
            //         setTimeout(function() {
            //             postProject.clicks.clicked.back = false;
            //         }, 300);

            //         postProject.switchStep('towStep');
            //     }
            // });

            // $('#setSchedule').off('click touchmove touchend').on('click touchmove touchend', function(e) {
            //     if(e.type != 'touchmove' && !postProject.clicks.clicked.next) {
            //         postProject.clicks.clicked.next = true;
            //         setTimeout(function() {
            //             postProject.clicks.clicked.next = false;
            //         }, 300);

            //         postProject.validate.schedule(function() {
            //             postProject.switchStep('availabilityStep');
            //         });

            //         newProjectData = {
            //             'User': USER._id,
            //             'Previous Step': 'Schedule Set',
            //             'Diagnosis': postProject.project.diagnosis
            //         };
            //         mfMixpanel.track('New Project', newProjectData);
            //     }
            // });

            // $('#backSchedule').off('click touchmove touchend').on('click touchmove touchend', function(e) {
            //     if(e.type != 'touchmove' && !postProject.clicks.clicked.back) {
            //         postProject.clicks.clicked.back = true;
            //         setTimeout(function() {
            //             postProject.clicks.clicked.back = false;
            //         }, 300);

            //         postProject.switchStep('mechanicPreferenceStep');
            //     }
            // });

            // $('#setAvailability').off('click touchmove touchend').on('click touchmove touchend', function(e) {
            //     if(e.type != 'touchmove' && !postProject.clicks.clicked.next) {
            //         postProject.clicks.clicked.next = true;
            //         setTimeout(function() {
            //             postProject.clicks.clicked.next = false;
            //         }, 300);

            //         postProject.validate.availability(function() {
            //             postProject.switchStep('photosStep');
            //         });

            //         newProjectData = {
            //             'User': USER._id,
            //             'Previous Step': 'Availability Set',
            //             'Diagnosis': postProject.project.diagnosis
            //         };
            //         mfMixpanel.track('New Project', newProjectData);
            //     }
            // });

            // $('#backAvailability').off('click touchmove touchend').on('click touchmove touchend', function(e) {
            //     if(e.type != 'touchmove' && !postProject.clicks.clicked.back) {
            //         postProject.clicks.clicked.back = true;
            //         setTimeout(function() {
            //             postProject.clicks.clicked.back = false;
            //         }, 300);

            //         postProject.switchStep('scheduleStep');
            //     }
            // });

            $('#setPhotos').off('click touchmove touchend').on('click touchmove touchend', function(e) {
                if(e.type != 'touchmove' && !postProject.clicks.clicked.next) {
                    postProject.clicks.clicked.next = true;
                    setTimeout(function() {
                        postProject.clicks.clicked.next = false;
                    }, 300);

                    postProject.validate.photos(function() {
                        postProject.switchStep('locationStep');
                    });

                    newProjectData = {
                        'User': USER._id,
                        'Previous Step': 'Photos',
                        'Diagnosis': postProject.project.diagnosis
                    };
                    mfMixpanel.track('New Project', newProjectData);
                }
            });

            $('#backPhotos').off('click touchmove touchend').on('click touchmove touchend', function(e) {
                if(e.type != 'touchmove' && !postProject.clicks.clicked.back) {
                    postProject.clicks.clicked.back = true;
                    setTimeout(function() {
                        postProject.clicks.clicked.back = false;
                    }, 300);

                    var to = (postProject.project.diagnosis) ? 'descriptionStep' : 'acceptablePartsStep';
                    postProject.switchStep(to);
                }
            });

            $('#setLocation').off('click touchmove touchend').on('click touchmove touchend', function(e) {
                if(e.type != 'touchmove' && !postProject.clicks.clicked.next) {
                    postProject.clicks.clicked.next = true;
                    setTimeout(function() {
                        postProject.clicks.clicked.next = false;
                    }, 300);

                    postProject.validate.location(function() {
                        postProject.switchStep('nameStep');
                    });

                    newProjectData = {
                        'User': USER._id,
                        'Previous Step': 'Location',
                        'Diagnosis': postProject.project.diagnosis
                    };
                    mfMixpanel.track('New Project', newProjectData);
                }
            });

            $('#backLocation').off('click touchmove touchend').on('click touchmove touchend', function(e) {
                if(e.type != 'touchmove' && !postProject.clicks.clicked.back) {
                    postProject.clicks.clicked.back = true;
                    setTimeout(function() {
                        postProject.clicks.clicked.back = false;
                    }, 300);

                    postProject.switchStep('photosStep');
                }
            });

            $('#setName').off('click touchmove touchend').on('click touchmove touchend', function(e) {
                if(e.type != 'touchmove' && !postProject.clicks.clicked.next) {
                    postProject.clicks.clicked.next = true;
                    setTimeout(function() {
                        postProject.clicks.clicked.next = false;
                    }, 300);

                    postProject.validate.name(function() {
                        postProject.switchStep('finishStep');
                    });

                    newProjectData = {
                        'User': USER._id,
                        'Previous Step': 'Project Name',
                        'Diagnosis': postProject.project.diagnosis
                    };
                    mfMixpanel.track('New Project', newProjectData);

                    postProject.post();
                }
            });

            $('#backName').off('click touchmove touchend').on('click touchmove touchend', function(e) {
                if(e.type != 'touchmove' && !postProject.clicks.clicked.back) {
                    postProject.clicks.clicked.back = true;
                    setTimeout(function() {
                        postProject.clicks.clicked.back = false;
                    }, 300);

                    postProject.switchStep('locationStep');
                }
            });

            // $('.publishOrDraft').off('click touchmove touchend').on('click touchmove touchend', function(e) {
            //     if(e.type != 'touchmove' && !postProject.clicks.clicked.draftChoice) {
            //         postProject.clicks.clicked.draftChoice = true;
            //         setTimeout(function() {
            //             postProject.clicks.clicked.draftChoice = false;
            //         }, 300);

            //         postProject.project.draft = ($(this).attr('data-value') == '0');
            //         postProject.post();                    
            //     }
            // });

            // $('#backFinish').off('click touchmove touchend').on('click touchmove touchend', function(e) {
            //     if(e.type != 'touchmove' && !postProject.clicks.clicked.back) {
            //         postProject.clicks.clicked.back = true;
            //         setTimeout(function() {
            //             postProject.clicks.clicked.back = false;
            //         }, 300);

            //         postProject.switchStep('nameStep');
            //     }
            // });

            $('.number').on('mouseenter', function() {
                var label = $(this).attr('data-label');
                if(label) postProject.updateNumbersLabel(label);
            });

            $('.number').on('mouseleave', function() {
                var label = $('.number.current').attr('data-label');
                if(label) postProject.updateNumbersLabel(label);
            });

            // $('.number').off('click touchmove touchend').on('click touchmove touchend', function(e) {
            //     if(e.type != 'touchmove' && !postProject.clicks.clicked.number) {
            //         postProject.clicks.clicked.number = true;
            //         setTimeout(function() {
            //             postProject.clicks.clicked.number = false;
            //         }, 300);

            //         var order = parseInt($(this).attr('data-order')) || 0;
            //         if(order < postProject.currentOrder) {
            //             postProject.switchStep($(this).attr('data-step'));
            //         }
            //     }
            // });
        }
    },

    validate: {
        newVehicle: false,

        errs: [],
        eids: [],

        highlight: function() {
            for(i=0; i<postProject.validate.eids.length; i++) {
                $('#'+postProject.validate.eids[i]).addClass('error');
            }
        },

        vehicle: function(next) {
            next = (typeof next === 'function') ? next : function(){};

            if(postProject.validate.newVehicle) {
                postProject.project.vehicle = {
                    make: $('#inputMake').val(),
                    model: $('#inputModel').val(),
                    year: $('#inputYear').val(),
                    engine: $('#newVehicleEngine').val(),
                    mileage: $('#newVehicleMileage').val()
                };

                postProject.validate.errs = [];
                postProject.validate.eids = [];
                if(util.is.nil(postProject.project.vehicle.make)) {
                    postProject.validate.errs.push('You must enter your vehicle\'s make');
                    postProject.validate.eids.push('inputMake');
                }

                if(util.is.nil(postProject.project.vehicle.model)) {
                    postProject.validate.errs.push('You must enter your vehicle\'s model');
                    postProject.validate.eids.push('inputModel');
                }

                if(postProject.project.vehicle.year < 1) {
                    postProject.validate.errs.push('You must enter a valid vehicle year');
                    postProject.validate.eids.push('inputYear');
                }

                if(postProject.validate.eids.length > 0) {
                    postProject.validate.highlight();
                } else {
                    next();
                }
            } else {
                var selectedId = $('#vehicleSelection').val();
                if(!util.is.nil(selectedId)) {
                    postProject.project.vehicle = selectedId;
                    next();
                }
            }
        },

        repair: function(next) {
            next = (typeof next === 'function') ? next : function(){};
            postProject.project.repair = $('#projectRepair').val();

            postProject.validate.errs = [];
            postProject.validate.eids = [];

            if(util.is.nil(postProject.project.repair)) {
                postProject.validate.errs.push('You must select a service needed');
                postProject.validate.eids.push('projectRepair');

                postProject.validate.highlight();
            } else {
                next();
            }
        },

        description: function(next) {
            next = (typeof next === 'function') ? next : function(){};
            postProject.project.description = $('#jobDescription').val();

            postProject.validate.errs = [];
            postProject.validate.eids = [];
            if(util.is.nil(postProject.project.description)) {
                postProject.validate.errs.push('You must enter a description of the issues or suggestions for the mechanic');
                postProject.validate.eids.push('jobDescription');

                postProject.validate.highlight();
            } else {
                next();
            }
        },

        acceptableParts: function(next) {
            next = (typeof next === 'function') ? next : function(){};

            postProject.project.acceptableParts = [];
            $('input[name="acceptablePart"]').each(function(index, element) {
                if($(element).is(':checked')) {
                    postProject.project.acceptableParts.push($(element).val());
                }
            });

            next();
        },

        schedule: function(next) {
            next = (typeof next === 'function') ? next : function(){};

            var year = $('#projectDateYY').val();
            var month = $('#projectDateMM').val();
            var day = $('#projectDateDD').val();
            postProject.project.schedule = new Date(year, month, day);

            postProject.validate.errs = [];
            postProject.validate.eids = [];
            var now = new Date();
            if(postProject.project.schedule.getTime() - now.getTime() < -(1000 * 60 * 60 * 24)) {
                postProject.validate.errs.push('You must select today or a date after today\'s date');
                postProject.validate.eids.push('projectDateYY');
                postProject.validate.eids.push('projectDateMM');
                postProject.validate.eids.push('projectDateDD');

                postProject.validate.highlight();
            } else {
                next();
            }
        },

        availability: function(next) {
            next = (typeof next === 'function') ? next : function(){};

            postProject.project.hours = {}
            switch($('#availability').val()) {
                case '0':
                    // weekdays after five
                    postProject.project.hours = {
                        '0': { open: '17', close: '21' },
                        '1': { open: '17', close: '21' },
                        '2': { open: '17', close: '21' },
                        '3': { open: '17', close: '21' },
                        '4': { open: '17', close: '21' },
                        '5': { open: '17', close: '21' },
                        '6': { open: '17', close: '21' }
                    }
                    break;
                case '1':
                    // weekends (8am to 8pm)
                    postProject.project.hours = {
                        '0': { open: '8', close: '20' },
                        '1': { open: '', close: '' },
                        '2': { open: '', close: '' },
                        '3': { open: '', close: '' },
                        '4': { open: '', close: '' },
                        '5': { open: '', close: '' },
                        '6': { open: '8', close: '20' }
                    }
                    break;
                case '2':
                    // flexible (8am to 8pm)
                    postProject.project.hours = {
                        '0': { open: '8', close: '20' },
                        '1': { open: '8', close: '20' },
                        '2': { open: '8', close: '20' },
                        '3': { open: '8', close: '20' },
                        '4': { open: '8', close: '20' },
                        '5': { open: '8', close: '20' },
                        '6': { open: '8', close: '20' }
                    }
                    break;
                case '3':
                    // custom
                    postProject.project.hours = {
                        '0': { open: '', close: '' },
                        '1': { open: '', close: '' },
                        '2': { open: '', close: '' },
                        '3': { open: '', close: '' },
                        '4': { open: '', close: '' },
                        '5': { open: '', close: '' },
                        '6': { open: '', close: '' }
                    }

                    for(i=0; i<postProject.hours.times.length; i++) {
                        time = postProject.hours.times[i];
                        postProject.project.hours[time.day] = { open: time.timeOpen, close: time.timeClose }
                    }

                    break;
            }

            next();
        },

        photos: function(next) {
            next = (typeof next === 'function') ? next : function(){};

            postProject.project.photos = [];
            for(i=0; i<postProject.photos.list.length; i++) {
                postProject.project.photos.push(postProject.photos.list[i].data);
            }

            postProject.project.deletePhotos = [];
            for(i=0; i<postProject.photos.delete.length; i++) {
                postProject.project.deletePhotos.push(postProject.photos.delete[i]);
            }

            next();
        },

        location: function(next) {
            next = (typeof next === 'function') ? next : function(){};
            if(!postProject.location.initialized) {
                postProject.project.projectLocation = postProject.location.guessedLocation;
            } else {
                var position = postProject.location.marker.getPosition();
                postProject.project.projectLocation.lat = position.lat();
                postProject.project.projectLocation.lng = position.lng();
            }
            
            next();
        },

        name: function(next) {
            next = (typeof next === 'function') ? next: function(){};
            postProject.project.title = $('#jobName').val();

            postProject.validate.errs = [];
            postProject.validate.eids = [];
            if(util.is.nil(postProject.project.title)) {
                postProject.validate.errs.push('You must enter a job short description for your job');
                postProject.validate.eids.push('jobName');

                postProject.validate.highlight();
            } else {
                next();
            }
        }
    },

    save: function() {
        var url = '/api/project';
        if(!util.is.nil(postProject.project._id)) url += '/' + postProject.project._id;
        var request = $.ajax({
            type: 'POST',
            url: url,
            data: postProject.project,
            dataType: 'json'
        });

        request.done(function(data) {
            postProject.project._id = data.project._id;
            if(!util.is.nil(data.vehicle)) {
                postProject.project.vehicle = data.vehicle._id;

                var found = false;
                for(var i=0; i<postProject.vehicles.length; i++) {
                    var v = postProject.vehicles[i];
                    if(v._id == data.vehicle._id) {
                        found = true;
                        break;
                    }
                }

                if(!found) {
                    postProject.vehicles.push(data.vehicle);
                    var html = '<option data-id="' + data.vehicle._id + '">' + data.vehicle.year + ' ' + data.vehicle.make + ' ' + data.vehicle.model + '</option>';
                    $('#vehicleSelection').append(html);
                }
            }
        });

        request.fail(function(jqXHR) {
            console.log(jqXHR);
        });
    },

    post: function() {
        modal.notify({
            title: 'Saving Your Project',
            message: 'Your project is currently being saved',
            submitText: '',
            canOkay: false,
            canExit: false,
            loading: true
        });

        var url = '/api/project';
        if(!util.is.nil(postProject.project._id)) url += '/' + postProject.project._id;
        var request = $.ajax({
            type: 'POST',
            url: url,
            data: postProject.project,
            dataType: 'json'
        });

        request.done(function(data) {
            newProjectData = {
                'User': USER._id,
                'Project': data.project._id,
                'Is Diagnosis?': data.project.diagnosis,
                'Repair Type': data.project.repair
            };

            window.location = '/projects/' + data.project._id;
        });

        request.fail(function(jqXHR) {
            console.log(jqXHR);
            var verbiage = postProject.project.draft ? 'posting your project' : 'saving your draft';
            modal.notify({
                title: 'Error',
                message: 'There was an error while ' + verbiage + '. If this error persists, please contact us for more information.'
            });
        });
    },

    currentStep: 'vehicleStep',
    currentOrder: 1,
    switchStep: function(toId, validated) {
        var fromId = postProject.currentStep;
        postProject.currentStep = toId;
        postProject.updateNumbers(fromId, toId);

        $('#'+fromId).stop().fadeOut(300, function() {
            if(toId == 'descriptionStep') {
                if(postProject.project.diagnosis) {
                    $('#descriptionHeader').html('What\'s Happening?');
                    $('#descriptionText').html('Describe what is happening to your vehicle. Include any noises or smells that it makes as well as how it looks/feels when you drive');
                    $('#jobDescription').attr('placeholder', 'E.g. My car keeps overheating after it runs for about 10 minutes and I smell smoke after 15 minutes of driving');
                } else {
                    $('#descriptionHeader').html('Describe the Problem &amp; Fixes');
                    $('#descriptionText').html('Describe the technical issues with the vehicle as well as how to fix them');
                    $('#jobDescription').attr('placeholder', 'E.g. The alternator has gone bad. The vehicle needs a new alternator');
                }
            }

            $('#'+toId).stop().fadeIn(300, function() {
                if(toId == 'locationStep') {
                    postProject.location.reset();
                }
            });

            if(fromId == 'vehicleStep') {
                var vehicle = postProject.project.vehicle;
                if(typeof(postProject.project.vehicle) == 'string') {
                    for(var i=0; i < postProject.vehicles.length; i++) {
                        var v = postProject.vehicles[i];
                        if(v._id == vehicle) vehicle = v;
                    }
                }

                $('#jobName').val(postProject.user.username + '\'s ' + vehicle.make + ' ' + vehicle.model);
                $('#newVehicleContainer').hide();
                $('#existingVehicleContainer').show();
            }
        });

        postProject.save();
    },

    updateNumbers: function(fromId, toId) {
        done = (typeof done === 'boolean') ? done : false;

        var fromElement = $('#' + fromId);
        var toElement = $('#' + toId);

        var fromNumId = fromElement.attr('data-numberid');
        var toNumId = toElement.attr('data-numberid');

        var fromNumber = $('#'+fromNumId);
        var toNumber = $('#'+toNumId);

        var fromOrder = parseInt(fromNumber.attr('data-order')) || 0;
        var toOrder = parseInt(toNumber.attr('data-order')) || 0;

        postProject.currentOrder = toOrder;

        // determine if moving forward or backwards
        var difference = toOrder - fromOrder;
        var forward = (difference > 0);

        $('.number').removeClass('current');

        if(!forward) {
            fromNumber.removeClass('done');
        } else {
            fromNumber.addClass('done');
        }

        toNumber.removeClass('done').addClass('current');

        postProject.updateNumbersLabel(toNumber.attr('data-label'));
    },

    updateNumbersLabel: function(label) {
        if(label != $('#stepsNow').html()) {
            $('#stepsNow').stop().fadeTo(300, 0, function() {
                $(this).html(label).stop().fadeTo(300, 1);
            });
        }
    }
};

$(document).ready(function(e) {
    postProject.init();
});