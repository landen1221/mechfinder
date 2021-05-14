var editProject = {
    postClicked: false,
    canPost: true,

    draftClicked: false,
    canDraft: true,

    editClicked: false,
    canEdit: true,

    removeClicked: false,
    canRemove: true,

    project: null,
    user: null,

    map: null,
    marker: null,

    data: {
        title: '',
        description: '',
        schedule: '',
        repair: null,
        tow: false,
        preference: null,
        diagnosis: false,
        parts: false,
        acceptableParts: [],
        hours: {},
        photos: [],
        draft: false,
        edit: false,
        newVehicle: false,
        vehicle: {
            make: '',
            model: '',
            year: '',
            engine: '',
            mileage: ''
        },
        deletePhotos: [],
        projectLocation: {
            lat: null,
            lng: null
        }
    },

    errs: [],
    eids: [],

    nil: function(obj) {
        return (obj == '' || obj == ' ' || obj == '&nbsp;' || typeof(obj) == 'undefined' || obj == null);
    },

    urlParam: function(name){
        var results = new RegExp('[\?&]' + name + '=([^&#]*)').exec(window.location.href);
        if (results === null){
            return null;
        }
        else{
            return decodeURI(results[1]) || 0;
        }
    },

    init: function() {
        var vid = editProject.urlParam('vid');
        if(!(util.is.nil(vid))) {
            $('#vehicle-information-saved-vehicle').val(vid);
        }
        if(VEHICLES.length < 1) {
            editProject.data.newVehicle = true;
        }

        if(USER) {
            editProject.user = USER;
        }

        if(PROJECT) {
            editProject.project = PROJECT;
            editProject.data.projectLocation.lat = editProject.project.geo.loc.coordinates[1];
            editProject.data.projectLocation.lng = editProject.project.geo.loc.coordinates[0];
        } else {
            editProject.project = {
                owner: {
                    _id: editProject.user._id
                }
            };
        }

        editProject.diagnosis.init();
        // editProject.hours.init();
        editProject.photos.init();

        $('#postThisProject').on('click touchstart', function(e) {
            if(!editProject.postClicked && editProject.canPost) {
                editProject.postClicked = true;
                setTimeout(function() { editProject.postClicked = false; }, 300);

                editProject.submit('post');
            }
        });

        $('#saveAsDraft').on('click touchstart', function(e) {
            if(!editProject.draftClicked && editProject.canDraft) {
                editProject.draftClicked = true;
                setTimeout(function() { editProject.draftClicked = false; }, 300);

                editProject.submit('draft');
            }
        });

        $('#editThisProject').on('click touchstart', function(e) {
            if(!editProject.editClicked && editProject.canEdit) {
                editProject.editClicked = true;
                setTimeout(function() { editProject.editClicked = false; }, 300);

                editProject.submit('edit');
            }
        });

        $('#removeThisProject').on('click touchstart', function(e) {
            if(!editProject.removeClicked && editProject.canRemove) {
                editProject.removeClicked = true;
                setTimeout(function() { editProject.removeClicked = false; }, 300);

                editProject.remove();
            }
        });

        $('#vehicle-information-saved-vehicle').on('change', function() {
            $('#new-vehicle').stop().slideUp(300);
            editProject.data.newVehicle = false;
        });

        $('#addNewVehicle').on('click touchstart', function(e) {
            $('#new-vehicle').stop().slideDown(300);
            $('#vehicle-information-saved-vehicle').val('');
            editProject.data.newVehicle = true;
        });
    },

    location: {
        guessedLocation: {
            lat: 33.4484,
            lng: 112.0740 // center of phoenix
        },

        map: null,
        marker: null,
        geocoder: null,

        clicked: false,

        googleInit: function() {
            console.log('google init');
            if(!util.is.nil(PROJECT)) {
                // use project location if editing project
                editProject.location.guessedLocation.lat = PROJECT.geo.loc.coordinates[1];
                editProject.location.guessedLocation.lng = PROJECT.geo.loc.coordinates[0];
            } else {
                // use user location if posting new project
                editProject.location.guessedLocation.lat = USER.geo.loc.coordinates[1];
                editProject.location.guessedLocation.lng = USER.geo.loc.coordinates[0];
            }

            editProject.location.geocoder = new google.maps.Geocoder();

            editProject.location.map = new google.maps.Map($('#projectMap')[0], {
                center: editProject.location.guessedLocation,
                zoom: 15
            });

            editProject.location.marker = new google.maps.Marker({
                position: editProject.location.map.getCenter(),
                map: editProject.location.map,
                title: editProject.data.title,
                label: editProject.data.title,
                draggable: true,
                animation: google.maps.Animation.DROP
            });

            $(window).on('resize', function(e) {
                editProject.location.reset();                
            });

            $('#editUpdateGeocoding').on('click touchmove touchend', function(e) {
                if(e.type != 'touchmove' && !editProject.location.clicked) {
                    editProject.location.clicked = true;
                    setTimeout(function() {
                        editProject.location.clicked = false;
                    }, 300);

                    editProject.location.geocode($('#editGeocodeAddress').val());
                }
            });

            $('#editGeocodeAddress').on('keyup', function(e) {
                if (e.which === 13) {
                    $('#editUpdateGeocoding').click();
                }
            });
        },

        reset: function() {
            console.log('resetting');
            google.maps.event.trigger(editProject.location.map, 'resize');
            var center = (!util.is.nil(editProject.location.marker)) ? editProject.location.marker.getPosition() : editProject.location.guessedLocation;
            editProject.location.map.setCenter(center);
            console.log('wtf?');
        },

        geocode: function(address) {
            geocoderRequest = {
                address: address
            };

            editProject.location.geocoder.geocode(geocoderRequest, function(results, status) {
                switch(status) {
                    case 'OK':
                        $('#editGeocodeAddress').removeClass('error');
                        editProject.location.marker.setPosition(results[0].geometry.location);
                        editProject.location.reset();
                        break;
                    default:
                        console.log('Geocoding Error: ' + status);
                        $('#editGeocodeAddress').addClass('error');
                        break;
                }
            });
        }
    },

    remove: function() {
        modal.confirm({
            title: 'Cancel Job',
            message: 'Are you sure you want to cancel this job?</br>This is a permanent change and your job will no longer be available.',
            yesText: 'Permanently Cancel',
            noText: 'Go Back',
            fixedButtons: false,
            yesColor: 'red',
            noColor: 'green',
            yes: function() {
                modal.cancelJob({
                    title: 'Your job was canceled permanently.',
                    message: 'Bummer, we really care about why you canceled. Help us understand why you canceled your job?',
                    submit: function(reason) {
                        data = {
                            reason: reason
                        };
                        $.ajax({
                            type: 'DELETE',
                            url: '/api/project/' + editProject.project._id,
                            data: data,
                            dataType: 'json'
                        })
                        .success(function(data) {
                            editProject.updateStatus('Your job has been canceled');
                            window.location = '/profile';
                        })
                        .fail(function(jqXHR) {
                            console.log(jqXHR);
                            editProject.updateStatus('There was an error while removing your job', true);
                        });
                    },
                    exit: function() {
                        data = {
                            reason: ''
                        };
                        $.ajax({
                            type: 'DELETE',
                            url: '/api/project/' + editProject.project._id,
                            data: data,
                            dataType: 'json'
                        })
                        .success(function(data) {
                            editProject.updateStatus('Your job has been canceled');
                            window.location = '/profile';
                        })
                        .fail(function(jqXHR) {
                            console.log(jqXHR);
                            editProject.updateStatus('There was an error while removing your job', true);
                        });
                    }
                });
            },
            no: function() {
            }
        });
    },

    submit: function(saveType) {
        // saving projects as drafts is a feature we'll ad in later
        if(saveType !== 'draft' && saveType !== 'edit' && saveType !== 'post') saveType = 'post';

        editProject.canDraft = false;
        editProject.canPost = false;

        $('.project-input').removeClass('error');

        // $('#editThisProject, #saveThisProject').addClass('gray');

        editProject.data.title = $('#project-title').val();
        // editProject.data.tow = $('#project-tow option:selected').val();
        // editProject.data.preference = $('#project-preference option:selected').val();

        // var year = $('#project-date-yy').val();
        // var month = $('#project-date-mm').val();
        // var day = $('#project-date-dd').val();
        // editProject.data.schedule = (editProject.user._id == editProject.project.owner._id) ? new Date(year, month, day) : {};

        editProject.data.diagnosis = $('#project-diagnosis option:selected').val() == '1' ? true : false;
        editProject.data.draft = (saveType == 'draft') ? true : false;
        editProject.data.edit = (saveType == 'edit') ? true : false;

        if(editProject.data.diagnosis) {
            editProject.data.description = $('#needs-description').val();
        } else {
            editProject.data.description = $('#knows-description').val();
            // editProject.data.repair = $('#project-service').val();
            editProject.data.parts = $('#project-parts').val();

            editProject.data.acceptableParts = [];
            $('input[name="acceptablePart"]').each(function(index, element) {
                if($(element).is(':checked')) {

                    editProject.data.acceptableParts.push($(element).val());
                }
            });
        }

        // editProject.data.hours = {}
        // switch($('#availability').val()) {
        //     case '0':
        //         // weekdays after five
        //         editProject.data.hours = {
        //             '0': { open: '17', close: '21' },
        //             '1': { open: '17', close: '21' },
        //             '2': { open: '17', close: '21' },
        //             '3': { open: '17', close: '21' },
        //             '4': { open: '17', close: '21' },
        //             '5': { open: '17', close: '21' },
        //             '6': { open: '17', close: '21' }
        //         }
        //         break;
        //     case '1':
        //         // weekends (8am to 8pm)
        //         editProject.data.hours = {
        //             '0': { open: '8', close: '20' },
        //             '1': { open: '', close: '' },
        //             '2': { open: '', close: '' },
        //             '3': { open: '', close: '' },
        //             '4': { open: '', close: '' },
        //             '5': { open: '', close: '' },
        //             '6': { open: '8', close: '20' }
        //         }
        //         break;
        //     case '2':
        //         // flexible (8am to 8pm)
        //         editProject.data.hours = {
        //             '0': { open: '8', close: '20' },
        //             '1': { open: '8', close: '20' },
        //             '2': { open: '8', close: '20' },
        //             '3': { open: '8', close: '20' },
        //             '4': { open: '8', close: '20' },
        //             '5': { open: '8', close: '20' },
        //             '6': { open: '8', close: '20' }
        //         }
        //         break;
        //     case '3':
        //         // custom
        //         editProject.data.hours = {
        //             '0': { open: '', close: '' },
        //             '1': { open: '', close: '' },
        //             '2': { open: '', close: '' },
        //             '3': { open: '', close: '' },
        //             '4': { open: '', close: '' },
        //             '5': { open: '', close: '' },
        //             '6': { open: '', close: '' }
        //         }

        //         for(i=0; i<editProject.hours.times.length; i++) {
        //             time = editProject.hours.times[i];
        //             editProject.data.hours[time.day] = { open: time.timeOpen, close: time.timeClose }
        //         }

        //         break;
        // }


        editProject.data.photos = [];
        for(i=0; i<editProject.photos.list.length; i++) {
            editProject.data.photos.push(editProject.photos.list[i].data);
        }

        editProject.data.deletePhotos = [];
        for(i=0; i<editProject.photos.delete.length; i++) {
            editProject.data.deletePhotos.push(editProject.photos.delete[i]);
        }

        var position = editProject.location.marker.getPosition();
        editProject.data.projectLocation.lat = position.lat();
        editProject.data.projectLocation.lng = position.lng();

        editProject.errs = [];
        editProject.eids = [];

        if(util.is.nil(editProject.data.title)) {
            editProject.errs.push('You must enter a job title');
            editProject.eids.push('project-title');
        }

        // if(util.is.nil(editProject.data.tow)) {
        //     editProject.errs.push('You must select your towing preference');
        //     editProject.eids.push('project-tow');
        // } else {
        //     editProject.data.tow = $('#project-tow option:selected').val() == '1' ? true : false;
        // }

        // if(util.is.nil(editProject.data.preference) && editProject.user._id == editProject.project.owner._id) {
        //     editProject.errs.push('Please select a mechanic preference');
        //     editProject.eids.push('project-preference');
        // }

        // var now = new Date();
        // if(editProject.user._id == editProject.project.owner._id && (editProject.data.schedule.getTime() - now.getTime()) < -(1000 * 60 * 60 * 24)) {
        //     editProject.errs.push('You must select today or a date after today\'s date');
        //     editProject.eids.push('project-date-yy');
        //     editProject.eids.push('project-date-mm');
        //     editProject.eids.push('project-date-dd');
        // }

        if(util.is.nil(editProject.data.description)) {
            editProject.errs.push('You must enter a description of the issues or suggestions for the mechanic');
            editProject.eids.push((editProject.data.diagnosis) ? 'needs-description' : 'knows-description');
        }

        if(!editProject.data.diagnosis) {
            // if(util.is.nil(editProject.data.repair)) {
            //     editProject.errs.push('You must select a service needed');
            //     editProject.eids.push('project-service');
            // }

            if(util.is.nil(editProject.data.parts) && editProject.user._id == editProject.project.owner._id) {
                editProject.errs.push('Please select whether or not you have parts for this job');
                editProject.eids.push('project-parts');
            } else {
                editProject.data.parts = $('#project-parts').val() == '1' ? true : false;
            }
        }

        console.log(editProject.user._id);
        console.log(editProject.project);
        if(editProject.user._id != editProject.project.owner._id) {
            console.log('not should be here');
            editProject.data.vehicle = editProject.project.vehicle;
        } else {
            if(editProject.data.newVehicle) {
                editProject.data.vehicle = {
                    make: $('#newVehicleMake').val(),
                    model: $('#newVehicleModel').val(),
                    year: $('#newVehicleYear').val(),
                    engine: $('#newVehicleEngine').val(),
                    mileage: $('#newVehicleMileage').val()
                }

                if(util.is.nil(editProject.data.vehicle.make)) {
                    editProject.errs.push('You must enter your vehicle\'s make');
                    editProject.eids.push('newVehicleMake');
                }

                if(util.is.nil(editProject.data.vehicle.model)) {
                    editProject.errs.push('You must enter your vehicle\'s model');
                    editProject.eids.push('newVehicleModel');
                }

                if(editProject.data.vehicle.year < 1) {
                    editProject.errs.push('You must enter a valid vehicle year');
                    editProject.eids.push('newVehicleYear');
                }
            } else {
                console.log('okayyyyy');
                editProject.data.vehicle = $('#vehicle-information-saved-vehicle').val();

                if(util.is.nil(editProject.data.vehicle)) {
                    editProject.errs.push('Please select a vehicle or add a new one');
                    editProject.eids.push('selectProfile');
                }
            }
        }

        console.log(editProject.data.vehicle);

        if(editProject.errs.length > 0) {
            if(editProject.errs.length > 1) {
                editProject.updateStatus('Please fix the highlighted errors before continuing', true);
            } else {
                editProject.updateStatus(editProject.errs[0], true);
            }

            for(i=0; i<editProject.eids.length; i++) {
                $('#'+editProject.eids[i]).addClass('error');
            }

            editProject.canPost = true;
            editProject.canDraft = true;
        } else {
            editProject.updateStatus('Posting your job...');
            console.log(editProject.data);

            modal.notify({
                title: 'Saving Changes',
                message: 'We are currently saving changes to your job. This may take a few moments, so thank you for your patience.',
                canOkay: false,
                canExit: false,
                loading: true
            });

            var apiURL = (saveType == 'edit') ? '/api/project/' + editProject.project._id : '/api/project'

            var request = $.ajax({
                type: 'POST',
                url: apiURL,
                data: editProject.data,
                dataType: 'json'
            });

            request.done(function(data) {
                // editProject.updateStatus('Your job has been saved, redirecting you now...');
                // window.location = '/projects/' + data.project._id
                editProject.updateStatus('Your changes have been saved');

                modal.confirm({
                    title: 'Saved',
                    message: 'Your changes have been saved. What\'s next?',
                    yes: function() {
                        window.location = '/projects/' + data.project._id
                    },
                    yesText: 'Take Me to My Job',
                    noText: 'Keep Editing',
                    noColor: 'green',
                    fixedButtons: false
                });
            });

            request.fail(function(jqXHR) {
                console.log(jqXHR);
                editProject.updateStatus('There was an error saving your job data', true);
                editProject.canPost = true;
                editProject.canDraft = true;

                $('#editThisProject, #saveThisProject').removeClass('gray');

                modal.notify({
                    title: 'Error',
                    message: 'There was an error saving your job data. If this error persists, please contact us. We apologize for the inconvenience.'
                });
            });
        }
    },

    updateStatus: function(message, err) {
        if(typeof(err) !== 'boolean') err = false;

        $('#postStatus').stop().fadeTo(300, 0, function() {
            if(err) {
                $(this).addClass('error');
            } else {
                $(this).removeClass('error');
            }

            $(this).html(message).stop().fadeTo(300, 1);
        });
    },

    diagnosis: {
        needsShown: false,
        knowsShown: false,

        init: function() {
            $('#project-diagnosis').on('change', function(e) {
                editProject.diagnosis.update($(this).val());
            });

            editProject.diagnosis.needs.init();
            editProject.diagnosis.knows.init();
        },

        needs: {
            init: function() {

            },
        },

        knows: {
            init: function() {

            },
        },

        update: function(needsDiagnosis) {
            if(needsDiagnosis == '1') {
                if(!editProject.diagnosis.needsShown) {
                    editProject.diagnosis.needsShown = true;
                    editProject.diagnosis.knowsShown = false;

                    $('#needs-diagnosis-yes').attr('data-selected', '1');
                    $('#needs-diagnosis-no').attr('data-selected', '0');

                    $('.knows-diagnosis').stop().slideUp(300, function() {
                        $('.needs-diagnosis').stop().slideDown(300, function() {
                            // post-fadein re-intialization
                        });
                    });
                }
            } else {
                if(!editProject.diagnosis.knowsShown) {
                    editProject.diagnosis.knowsShown = true;
                    editProject.diagnosis.needsShown = false;

                    $('#needs-diagnosis-no').attr('data-selected', '1');
                    $('#needs-diagnosis-yes').attr('data-selected', '0');

                    $('.needs-diagnosis').stop().slideUp(300, function() {
                        $('.knows-diagnosis').stop().slideDown(300, function() {
                            // post-fadein re-initialization
                        });
                    });
                }
            }
        },
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
            if(editProject.project._id) {
                for(i=0; i<editProject.hours.count(editProject.project.hours); i++) {
                    hours = editProject.project.hours[i];
                    editProject.hours.addAvailability({
                        day: i.toString(),
                        timeOpen: hours.open,
                        timeClose: hours.close
                    });
                }
            }

            $('#addHours').on('click touchstart', function(e) {
                if(!editProject.hours.addTimeFlagged) {
                    editProject.hours.addTimeFlagged = true;
                    setTimeout(function(){ editProject.hours.addTimeFlagged = false; }, 300);

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

                    if(!addProblem && !editProject.hours.hasAvailability(hours)) {
                        addProblem = true;
                        alert('You have already added this time frame into your available hours.');
                    }

                    if(!addProblem && hours.timeOpen == hours.timeClose) {
                        addProblem = true;
                        alert('You must have at least 30 minutes between opening and closing time.');
                    }

                    if(!addProblem) {
                        editProject.hours.addAvailability(hours);
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
            for(i=0; i<editProject.hours.times.length; i++) {
                h = editProject.hours.times[i];

                if(hours.day == h.day && hours.timeOpen == h.timeOpen && hours.timeClose == h.timeClose) {
                    return false;
                }
            }

            return true;
        },

        addAvailability: function(hours) {
            if(!util.is.nil(hours.day) && !util.is.nil(hours.timeOpen) && !util.is.nil(hours.timeClose)) {
                editProject.hours.times.push(hours);
                var dataid = hours.day+hours.timeOpen+hours.timeClose;

                var html = '';
                html += '<tr data-id="' + dataid + '" style="display: none;">';
                    html += '<td>' + editProject.hours.dayToString(hours.day) + '</td>';
                    html += '<td>' + editProject.hours.hourToString(hours.timeOpen) + ' - ' + editProject.hours.hourToString(hours.timeClose) + '</td>';
                    html += '<td><a class="delete standard-button red" href="javascript:void(0);" data-id="' + dataid + '"><i class="fa fa-trash"></i> Delete</a></td>';
                html += '</tr>';

                $('#hoursTable').append(html);
                $('#hoursTable tr td a.delete[data-id="' + dataid + '"]').off('click touchstart').on('click touchstart', function(e) {
                    var dataidClicked = $(this).attr('data-id');
                    editProject.hours.deleteAvailability(dataidClicked);
                });

                $('#hoursTable tr[data-id="' + dataid + '"]').fadeIn(300);

                if(editProject.hours.times.length >= 7) {
                    $('#hoursSelectors').stop().slideUp(300);
                }

                $('#hoursDay option[value="' + hours.day + '"]').prop('disabled', true);
                $('#hoursDay option:not([disabled])').first().prop('selected', true);
            }
        },

        deleteAvailability: function(dataid) {
            $('#hoursTable tr[data-id="' + dataid + '"]').stop().fadeOut(300, function() {
                $(this).remove();

                for(i=0; i<editProject.hours.times.length; i++) {
                    var hours = editProject.hours.times[i];
                    if(hours.day+hours.timeOpen+hours.timeClose == dataid) {
                        if(editProject.hours.times.length >= 7) {
                            $('#hoursSelectors').stop().slideDown(300);
                        }

                        editProject.hours.times.splice(i, 1);
                        $('#hoursDay option[value="' + hours.day + '"]').prop('disabled', false);
                        $('#hoursDay option:not([disabled])').first().prop('selected', true);
                        break;
                    }
                }
            });
        },

        clear: function() {
            for(i=0; i<editProject.hours.times.length; i++) {
                var dataid = '';
                dataid += editProject.hours.times[i].day;
                dataid += editProject.hours.times[i].timeOpen;
                dataid += editProject.hours.times[i].timeClose;
                editProject.hours.deleteAvailability(dataid);
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
                    editProject.photos.addPhoto(file, data);
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
                            editProject.photos.addPhoto(f, event.target.result);
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

            if(editProject.project._id) {
                for(i=0; i<editProject.project.photos.length; i++) {
                    photo = editProject.project.photos[i];

                    editProject.photos.existing.push({
                        id: 'savedPhoto' + photo
                    });

                    var removeClicked = false;
                    $('#remove-savedPhoto' + photo).on('click touchstart', function(e) {
                        if(!removeClicked) {
                            removeClicked = true;
                            setTimeout(function() { removeClicked = false; }, 300);

                            var clickedId = $(this).attr('data-id');
                            editProject.photos.removePhoto(clickedId);
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
                for(i=0; i<editProject.photos.list.length; i++) {
                    if(editProject.photos.list[i].id == id) {
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

                    editProject.photos.list.push({
                        file: file,
                        data: data,
                        id: id
                    });

                    $('#picboxes').append(html);
                    if(editProject.photos.list.length < 2) {
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
                            editProject.photos.removePhoto(clickedId);
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
            for(i=0; i<editProject.photos.list.length; i++) {
                if(editProject.photos.list[i].id == id) {
                    index = i;
                    break;
                }
            }

            if(index >= 0) {
                editProject.photos.list.splice(index, 1);
            } else {
                for(i=0; i<editProject.photos.existing.length; i++) {
                    if(editProject.photos.existing[i].id == id) {
                        index = i;
                        break;
                    }
                }

                if(index >= 0) {
                    // add the targeted photo to the to-be deleted array and then remove it from the existing array
                    editProject.photos.delete.push(id.replace('savedPhoto', ''));
                    editProject.photos.existing.splice(index, 1);
                }
            }

            if(index >= 0) {
                $('#picbox-' + id).stop().fadeOut(300, function() {
                    $(this).remove();
                });

                $('#add-photos-fileinput').val('');
            }

            if(editProject.photos.list.length < 1 && editProject.photos.existing.length < 1) {
                $('#dragndrop').stop().slideDown(300);
            }
        },

        clear: function() {
            for(i=0; i<editProject.photos.list.length; i++) {
                editProject.photos.removePhoto(editProject.photos.list[i]);
            }
        }
    }
}

$(document).ready(function() {
    editProject.init();
});
