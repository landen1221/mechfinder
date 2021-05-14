var mechanicProfile = {
    user: null,
    saveClicked: false,

    init: function() {
        mechanicProfile.user = USER;

        mechanicProfile.photos.init();
        mechanicProfile.businessInfo.init();
        mechanicProfile.experience.init();
        mechanicProfile.specialties.init();
        mechanicProfile.certification.init();
        mechanicProfile.towing.init();

        $('.saveChanges').on('click touchend touchmove', function(e) {
            if(e.type != 'touchmove' && !mechanicProfile.saveClicked) {
                mechanicProfile.saveClicked = true;
                setTimeout(function() { mechanicProfile.saveClicked = false; }, 300);

                mechanicProfile.save();
            }
        });

        $('.cancelChanges').on('click', function() {
            window.location.reload(true);
        });

        $('#gotoBusinessInfo').on('click', function() {
            $('#business').click();
            $(window).scrollTop(0);
            mechanicProfile.save(false);
        });
    },

    nil: function(string) {
        return (typeof(string) == "undefined" || string == "" || string == " " || string == "&nbsp;");
    },

    data: {
        mechanicType: 'mobile',
        experience: [],
        specialties: [],
        certifications: [],
        hours: {},
        offersDiagnosis: true,
        diagnosisCharge: -1,
        waivesDiagnosis: true,
        yearsOfExperience: -1,
        warranty: { amount: -1, units: ''},
        insurance: true,
        registrationNumber: '',
        tows: true,
        flatbed: false,
        about: '',
        photos: [],
        deletePhotos: []
    },

    positiveFloat: function(string) {
        num = parseFloat(string);
        if(!num) return 0;
        return num;
    },

    positiveInt: function(string) {
        num = parseInt(string);
        if(!num) return 0;
        return num;
    },

    errs: [],
    eids: [],

    save: function(isModal) {
        if (typeof isModal == 'undefined') {
            isModal = true;
        }

        mechanicProfile.data.mechanicType = $('#mechanicType').val();

        mechanicProfile.data.experience = [];
        for(i=0; i<mechanicProfile.experience.list.length; i++) {
            mechanicProfile.data.experience.push(mechanicProfile.experience.list[i].make);
        }

        mechanicProfile.data.specialties = [];
        for(i=0; i<mechanicProfile.specialties.list.length; i++) {
            mechanicProfile.data.specialties.push(mechanicProfile.specialties.list[i].specialty);
        }

        mechanicProfile.data.certifications = [];
        for(i=0; i<mechanicProfile.certification.certificationsListed.length; i++) {
            mechanicProfile.data.certifications.push(mechanicProfile.certification.certificationsListed[i].certification);
        }

        // --------------------------------------------------------------------------

        mechanicProfile.data.hours = {}
        // switch($('#availability').val()) {
        switch($('#availability').val()) {
            case '0':
                // weekdays after five
                mechanicProfile.data.hours = {
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
                mechanicProfile.data.hours = {
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
                mechanicProfile.data.hours = {
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
                mechanicProfile.data.hours = {
                    '0': { open: '', close: '' },
                    '1': { open: '', close: '' },
                    '2': { open: '', close: '' },
                    '3': { open: '', close: '' },
                    '4': { open: '', close: '' },
                    '5': { open: '', close: '' },
                    '6': { open: '', close: '' }
                }

                for(i=0; i<mechanicProfile.businessInfo.hours.times.length; i++) {
                    time = mechanicProfile.businessInfo.hours.times[i];
                    mechanicProfile.data.hours[time.day] = { open: time.timeOpen, close: time.timeClose }
                }

                break;
        }

        mechanicProfile.data.offersDiagnosis = $('#mechanicDoesDiagnosis').val() == '1' ? true : false;

        mechanicProfile.data.diagnosisCharge = 0;
        mechanicProfile.data.waivesDiagnosis = true;
        if(mechanicProfile.data.offersDiagnosis) {
            mechanicProfile.data.diagnosisCharge = util.currency.dollarsToCents($('#mechanicDiagnosisCharge').val());
            if(util.is.nil(mechanicProfile.data.diagnosisCharge)) mechanicProfile.data.diagnosisCharge = 0;
            mechanicProfile.data.waivesDiagnosis = $('#mechanicWaivesDiagnosis').val() == '1' ? true : false;
        }

        mechanicProfile.data.yearsOfExperience = mechanicProfile.positiveInt($('#mechanicYearsOfExperience').val());

        mechanicProfile.data.warranty = { amount: -1, units: '' }
        mechanicProfile.data.warranty.amount = mechanicProfile.positiveInt($('#mechanicWarrantyLength').val());
        mechanicProfile.data.warranty.units = $('#mechanicWarrantyUnits').val();

        mechanicProfile.data.insurance = $('#mechanicInsurance').val() == '1' ? true : false;
        mechanicProfile.data.registrationNumber = $('#mechanicRegistrationNumber').val();

        mechanicProfile.data.tows = $('#mechanicTows').val() == '1' ? true : false;
        mechanicProfile.data.flatbed = false;
        if(mechanicProfile.data.tows) {
            mechanicProfile.data.flatbed = $('#mechanicHasFlatbed').val() == '1' ? true : false;
        }

        mechanicProfile.data.about = $('#mechanicAbout').val();

        mechanicProfile.data.photos = [];
        for(i=0; i<mechanicProfile.photos.list.length; i++) {
            mechanicProfile.data.photos.push(mechanicProfile.photos.list[i].data);
        }

        mechanicProfile.data.deletePhotos = [];
        for(i=0; i<mechanicProfile.photos.delete.length; i++) {
            mechanicProfile.data.deletePhotos.push(mechanicProfile.photos.delete[i]);
        }

        // client-side validation
        mechanicProfile.errs = [];
        mechanicProfile.eids = [];

        if(mechanicProfile.data.offersDiagnosis && mechanicProfile.data.diagnosisCharge < 0) {
            mechanicProfile.errs.push('Please enter a positive price for your diagnosis charge');
            mechanicProfile.eids.push('mechanicDiagnosisCharge');
        }

        if(mechanicProfile.data.yearsOfExperience < 0) {
            mechanicProfile.errs.push('Please enter a positive number for years of experience');
            mechanicProfile.eids.push('mechanicYearsOfExperience');
        }

        if(mechanicProfile.data.warranty.amount < 0) {
            mechanicProfile.errs.push('Please enter a positive number for warranty length');
            mechanicProfile.eids.push('mechanicWarrantyLength');
        }

        $('.error').removeClass('error');
        if(mechanicProfile.errs.length > 0) {
            var message = 'Please fix the highlighted errors before saving your changes';
            if(mechanicProfile.errs.length == 1) {
                message = mechanicProfile.errs[0];
            }

            modal.notify({
                title: 'Invalid Info',
                message: message
            })

            for(i=0; i<mechanicProfile.eids.length; i++) {
                $('#'+mechanicProfile.eids[i]).addClass('error');
            }
        } else {
            mfMixpanel.track('Updated Mechanic Profile');
            // send the post request here

            var body = mechanicProfile.data;

            modal.notify({
                title: 'Saving Changes',
                message: 'We are currently updating your mechanic information. This may take a few moments, so thank you for your patience.',
                loading: true,
                canOkay: false,
                canExit: false
            });

            var request = $.ajax({
                type: 'POST',
                url: '/api/profile',
                data: body,
                dataType: 'json'
            });

            request.done(function(data) {
                // To prevent uploading duplicate photos
                mechanicProfile.photos.list = [];
                mechanicProfile.photos.existing = [];
                mechanicProfile.photos.delete = [];

                if (isModal) {
                    modal.notify({
                        title: 'Info Saved',
                        message: 'Your information has been saved!',
                        canOkay: true
                    });
                } else {
                    modal.hide(null, true);
                }
            });

            request.fail(function(jqXHR) {
                modal.notify({
                    title: 'Error',
                    message: 'There was an issue while saving your information. If this error persists, please contact us'
                })
            });
        }
    },

    towing: {
        init: function() {
            $('#mechanicTows').on('change', function(e) {
                if($(this).val() == '1') {
                    $('#mechanicFlatbed').stop().fadeIn(300);
                } else {
                    $('#mechanicFlatbed').stop().fadeOut(300);
                }
            });
        }
    },

    certification: {
        addClicked: false,
        deleteClicked: false,
        certificationsListed: [],
        listingIdCount: 0,
        warnings: [],
        erroredIds: [],

        init: function() {
            $('#mechanicCertified').on('change', function(e) {
                var certified = $(this).val();

                if(certified == "1") {
                    $('#showIfCertified').stop().slideDown(300);
                } else {
                    $('#showIfCertified').stop().slideUp(300);
                }

                mechanicProfile.certification.initClicks();
            });

            $('#mechanicCertification').on('keyup', function(e) {
                if (e.which == 13) {
                    $('#addEducation').click();
                }
            });

            $('#addEducation').on('click touchstart', function(e) {
                if(!mechanicProfile.certification.addClicked) {
                    mechanicProfile.certification.addClicked = true;
                    setTimeout(function() { mechanicProfile.certification.addClicked = false; }, 300);
                    var certification = $('#mechanicCertification').removeClass('has-error').val();

                    warnings = [];
                    erroredIds = [];

                    // I left this design pattern the same in case we add more fields here in the future -Marcus
                    if(mechanicProfile.nil(certification)) {
                        warnings.push('You must enter your certification');
                        erroredIds.push('mechanicCertification');
                    }

                    for(i=0; i<mechanicProfile.certification.certificationsListed.length; i++) {
                        certificationListed = mechanicProfile.certification.certificationsListed[i];

                        if(certification == certificationListed['certification']) {
                            warnings.push('You have already added this certification to the list');
                        }
                    }

                    if(warnings.length > 0) {
                        var warning;
                        if(warnings.length == 1) {
                            warning = warnings[0];
                        } else {
                            warning = 'Please correct all highlighted fields before adding education/certifications';
                        }

                        $('#certificationWarning').stop().fadeTo(300, 0, function() {
                            $(this).html(warning).stop().fadeTo(300, 1);
                        });


                        for(i=0; i<erroredIds.length; i++) {
                            $('#'+erroredIds[i]).addClass('has-error').val('');
                        }
                    } else {
                        $('#certificationWarning').stop().fadeOut(300, 0, function() {
                            $(this).html('&nbsp;');
                        });

                        for(i=0; i<erroredIds.length; i++) {
                            $('#'+erroredIds[i]).removeClass('has-error');
                        }

                        mechanicProfile.certification.addCertification(certification);
                        $('#mechanicCertification').val('');
                    }
                }
            });



            for(var i=0; i<mechanicProfile.user.certifications.length; i++) {
                mechanicProfile.certification.certificationsListed.push({
                    certification: mechanicProfile.user.certifications[i],
                    id: i
                });

                mechanicProfile.certification.listingIdCount++;
            }

            mechanicProfile.certification.initClicks();
        },

        addCertification: function(certification) {
            var id = mechanicProfile.certification.listingIdCount;

            if(mechanicProfile.certification.certificationsListed.length == 0) {
                $('#certificationListingText').stop().fadeTo(300, 0, function() {
                    $(this).html('Customers will see the following information:').stop().fadeTo(300, 1);
                });
            }

            mechanicProfile.certification.certificationsListed.push({
                certification: certification,
                id: id
            });

            var html = '';
            html += '<li id="certificationListed' + id + '">' + certification + ' <a class="certification-listing-delete red-text" id="deleteListing'+id+'" data-id="' + id + '" href="javascript:void(0);">[remove]</a></li>';

            $('#certificationListings').append(html);
            $('#certificationListed' + id).stop().slideDown(300);
            mechanicProfile.certification.initClicks();

            mechanicProfile.certification.listingIdCount += 1;
        },

        initClicks: function() {
            $('a.certification-listing-delete').off('click touchstart').on('click touchstart', function(e) {
                if(!mechanicProfile.certification.deleteClicked) {
                    mechanicProfile.certification.deleteClicked = true;
                    setTimeout(function() { mechanicProfile.certification.deleteClicked = false; }, 300);

                    buttonId = $(this).attr('data-id');
                    mechanicProfile.certification.deleteCertification(buttonId);
                }
            });
        },

        deleteCertification: function(id) {
            $('#certificationListed' + id).stop().slideUp(300, function() {
                $(this).remove();
            });

            for(i=0; i<mechanicProfile.certification.certificationsListed.length; i++) {
                if(mechanicProfile.certification.certificationsListed[i].id == id) {
                    mechanicProfile.certification.certificationsListed.splice(i, 1);
                    break;
                }
            }

            if(mechanicProfile.certification.certificationsListed.length == 0) {
                $('#certificationListingText').stop().fadeTo(300, 0, function() {
                    $(this).html('You no longer have any certifications').stop().fadeTo(300, 1);
                });
            }
        }
    },

    experience: {
        deleteClicked: false,
        availableList: [],
        list: [],

        countries: [],
        makes: [],

        // Jquery elements set during init for easier refactoring
        $addButton: null,
        $vehicleInput: null,
        $warningLine: null,
        $vehicleListCard: null,
        $vehicleList: null,
        $vehicleDropdown: null,

        init: function() {
            $addButton = $('#addVehicle');
            $vehicleInput = $('#inputVehicle');
            $warningLine = $('#warnVehicle');
            $vehicleListCard = $('#cardVehicleList');
            $vehicleList = $('#listVehicle');
            var strSearchList = '#dropdownVehicle';
            $vehicleDropdown = $(strSearchList);

            $addButton.on('click', function(e) {
                $vehicleInput.removeClass('error');
                $warningLine.removeClass('red-text').html('');
                mechanicProfile.experience.checkMakeErrors($vehicleInput.val(), function(warnings, data) {
                    if (util.is.nil(warnings)) {
                        mechanicProfile.experience.addMake(data.make, data.id);
                        $vehicleInput.val('');
                        $vehicleListCard.fadeIn(300);
                    } else {
                        $vehicleInput.addClass('error');
                        $warningLine.addClass('red-text').html(warnings[0]); 
                    }
                });
            });

            loopCallback = function(warnings, data) {
                if (util.is.nil(warnings)) {
                    mechanicProfile.experience.addMake(data.make, data.id);
                }
            };
            for (var i = 0; i < EXPLIST.length; i++) {
                mechanicProfile.experience.checkMakeErrors(EXPLIST[i], loopCallback);
            }

            searchableDropdown.setup($vehicleInput, $vehicleDropdown, strSearchList, function(){
                $addButton.click();
            });           
        },

        checkMakeErrors: function(input, callback) {
            var vehicle = input.replace(/[^\w\s-]|_/gi, '');
            var id = vehicle.replace(/[^\w]|_/gi, '');
            var warnings = [];
            var makesList = mechanicProfile.experience.list;
            var makes = [];
            var data = {
                make: vehicle,
                id: id
            };

            for (var i = 0; i < makesList.length; i++) {
                makes.push(makesList[i].make.toLowerCase());
            }
            if (util.is.nil(id)) {
                warnings.push('Please enter a valid vehicle make');
            }
            if (makes.indexOf(id.toLowerCase()) != -1 ) {
                warnings.push('You\'ve already added that make.');
            }
            if (warnings.length !== 0) {
                callback(warnings, data);
            } else {
                callback(null, data);
            }
        },

        addMake: function(make, id) {
            if (!util.is.nil(id)){
                var html = '<li id="make' + id + '">' + make + ' <a class="deleteVehicle red-text" id="deleteMake' + id + '" data-id="' + id + '" href="javascript:void(0);">[remove]</a></li>';
                $vehicleList.append(html);
                $('.deleteVehicle').off().on('click', function(e) {
                    var dataId = $(this).attr('data-id');
                    $('#make' + dataId).remove();
                    var makeList = mechanicProfile.experience.list;
                    mechanicProfile.experience.list = makeList.filter(function(val){
                        return val.id != dataId;
                    });
                });
                mechanicProfile.experience.list.push({
                    id: id,
                    make: make
                });
            }
        }
    },

    specialties: {
        deleteClicked: false,
        list: [],

        init: function() {
            $('input[name="specialtiesItem"]').on('change', function(e) {
                mechanicProfile.specialties.update();
            });

            mechanicProfile.specialties.update();
        },

        initClicks: function() {
            $('.specialty-delete').off('click touchstart').on('click touchstart', function(e) {
                if(!mechanicProfile.specialties.deleteClicked) {
                    mechanicProfile.specialties.deleteClicked = true;
                    setTimeout(function() { mechanicProfile.specialties.deleteClicked = false; }, 300);

                    dataId = $(this).attr('data-id');
                    $('#'+dataId).attr('checked', false);
                    $(this).closest('li').slideUp(300);

                    for(i=0; i<mechanicProfile.specialties.list.length; i++) {
                        if(mechanicProfile.specialties.list[i].id == dataId) {
                            mechanicProfile.specialties.list.splice(i, 1);
                        }
                    }

                    if(mechanicProfile.specialties.list.length == 0) {
                        $('#noSpecialties').slideUp(300, function() {
                            $(this).html('Add any specialties that you would like customers to see when they view your profile:').slideDown(300);
                        });
                    }
                }
            });
        },

        update: function() {
            var oldListLength = mechanicProfile.specialties.list.length;
            mechanicProfile.specialties.list = [];

            var html = '';
            $('input[name="specialtiesItem"]').each(function(element, index) {
                if($(this).is(':checked')) {
                    var id = $(this).attr('id');
                    mechanicProfile.specialties.list.push({
                        id: id,
                        specialty: $(this).val()

                    });
                    html += '<li>' + $(this).val() + ' <a class="specialty-delete" id="deleteSpecialty' + id + '" data-id="' + id + '" href="javascript:void(0);">[Delete]</a></li>';
                }
            });

            if(oldListLength == 0 && mechanicProfile.specialties.list.length > 0) {
                $('#noSpecialties').slideUp(300, function() {
                    $(this).html('The customer will see these specialties:').slideDown(300);
                });
            }


            $('#specialtiesListed').fadeOut(300, function() {
                $(this).html(html).fadeIn(300);

                mechanicProfile.specialties.initClicks();
            });
        }
    },

    photos: {
        addTriggered: false,
        list: [],
        existing: [],
        delete: [],

        init: function() {
            $('#addPhotosLinkMechanic, #addPhotosDroplinkMechanic').on('click', function(e) {
                if(!mechanicProfile.photos.addTriggered) {
                    mechanicProfile.photos.addTriggered = true;
                    setTimeout(function() { mechanicProfile.photos.addTriggered = false;}, 300);
                    $('#addPhotosFileInputMechanic').click();
                }
            });

            $('#piclistMechanic').filedrop({
                callback: function(file, data) {
                    mechanicProfile.photos.addPhoto(file, data);
                }
            });

            $('#addPhotosFileInputMechanic').on('change', function(e) {
                var files = $(this).get(0).files;
                for(i=0; i<files.length; i++) {
                    var file = files[i];
                    var reader = new FileReader();
                    reader.onload = (function(f) {
                        return function(event) {
                            mechanicProfile.photos.addPhoto(f, event.target.result);
                        }
                    })(file);

                    reader.readAsDataURL(file);
                }
            });

            $('#picboxesMechanic').on('dragenter', function(e) {
                $(this).addClass('dragging');
            }).on('dragleave drop', function(e) {
                $(this).removeClass('dragging');
            });

            var photo;
            for(var i=0; i<mechanicProfile.user.photos.length; i++) {
                photo = mechanicProfile.user.photos[i];

                mechanicProfile.photos.existing.push({
                    id: photo
                });
            }

            mechanicProfile.photos.initClicks();
        },

        removeClicked: false,
        initClicks: function() {
            $('.mechanicPhotoRemove').off('click touchstart').on('click touchstart', function(e) {
                if(!mechanicProfile.photos.removeClicked) {
                    mechanicProfile.photos.removeClicked = true;
                    setTimeout(function() { mechanicProfile.photos.removeClicked = false; }, 300);

                    var clickedId = $(this).attr('data-id');
                    mechanicProfile.photos.removePhoto(clickedId);
                }
            });
        },

        addPhoto: function(file, data) {
            // if we have any other supported file extensions, feel free to add them
            if(file.name.toLowerCase().match(/\.(jpg|jpeg|png|gif)$/)) {
                // create unique id for div and image tag based off of file name
                var id = file.name.replace(/\W/g, '');

                var alreadyAdded = false;
                for(i=0; i<mechanicProfile.photos.list.length; i++) {
                    if(mechanicProfile.photos.list[i].id == id) {
                        alreadyAdded = true;
                        break;
                    }
                }

                if(!alreadyAdded) {
                    var html = '';
                    html += '<div id="mechanicPicbox-' + id + '" class="picbox" style="display: none;">';
                        html += '<img id="mechanicUpload-' + id + '" alt="' + file.name + '" src="' + data + '" />';
                        html += '<div id="mechanicRemove-' + id + '" class="remove mechanicPhotoRemove" data-id="' + id + '">X</div>'
                    html += '</div>';

                    mechanicProfile.photos.list.push({
                        file: file,
                        data: data,
                        id: id
                    });

                    $('#picboxesMechanic').append(html);
                    if(mechanicProfile.photos.list.length < 2) {
                        $('#dragndropMechanic').stop().slideUp(300, function() {
                            $('#picboxesMechanic').stop().slideDown(300);
                        });
                    }

                    mechanicProfile.photos.initClicks();

                    $('#mechanicPicbox-' + id).stop().fadeIn(300);
                } else {
                    $('#addErrorMechanic').stop().slideUp(300, function() {
                        $(this).html('You have already added one or more of the photos you have selected').stop().slideDown(300);
                        setTimeout(function() {
                            $('#addErrorMechanic').stop().slideUp(300);
                        }, 5000);
                    });
                }
            } else {
                $('#addErrorMechanic').stop().slideUp(300, function() {
                    $(this).html('Some files uploaded were not images. Please upload image files only').stop().slideDown(300);
                    setTimeout(function() {
                        $('#addErrorMechanic').stop().slideUp(300);
                    }, 5000);
                });
            }
        }, // mechanicProfile.customer.photos.addPhoto()

        removePhoto: function(id) {
            var index = -1;
            for(i=0; i<mechanicProfile.photos.list.length; i++) {
                if(mechanicProfile.photos.list[i].id == id) {
                    index = i;
                    break;
                }
            }

            if(index >= 0) {
                mechanicProfile.photos.list.splice(index, 1);
            } else {
                for(var i=0; i<mechanicProfile.photos.existing.length; i++) {
                    if(mechanicProfile.photos.existing[i].id == id) {
                        index = i;
                        break;
                    }
                }

                if(index >= 0) {
                    mechanicProfile.photos.delete.push(id.replace('savedPhoto', ''));
                    mechanicProfile.photos.existing.splice(index, 1);
                }
            }

            if(index >= 0) {
                $('#mechanicPicbox-' + id).stop().fadeOut(300, function() {
                    $(this).remove();
                });

                $('#addPhotosFileInputMechanic').val('');
            }

            if(mechanicProfile.photos.list.length < 1 && mechanicProfile.photos.existing.length < 1) {
                $('#dragndropMechanic').stop().slideDown(300);
            }
        }, // mechanicProfile.photos.removePhoto()

        clear: function() {
            for(i=0; i<mechanicProfile.photos.list.length; i++) {
                mechanicProfile.photos.removePhoto(mechanicProfile.photos.list[i]);
            }
        }
    }, // mechanicProfile.photos{}

    businessInfo: {
        init: function() {
            mechanicProfile.businessInfo.hours.init();

            $('#mechanicDoesDiagnosis').on('change', function(e) {
                if($(this).val() == '1') {
                    $('#mechanicDoesDiagnosisBox, #mechanicWaivesFeeBox').stop().fadeIn(300);
                } else {
                    $('#mechanicDoesDiagnosisBox, #mechanicWaivesFeeBox').stop().fadeOut(300);
                }
            });
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
                for(i=0; i<mechanicProfile.businessInfo.hours.count(mechanicProfile.user.hours); i++) {
                    hours = mechanicProfile.user.hours[i];
                    mechanicProfile.businessInfo.hours.addAvailability({
                        day: i.toString(),
                        timeOpen: hours.open,
                        timeClose: hours.close
                    });
                }

                $('#addHours').on('click touchstart', function(e) {
                    if(!mechanicProfile.businessInfo.hours.addTimeFlagged) {
                        mechanicProfile.businessInfo.hours.addTimeFlagged = true;
                        setTimeout(function(){ mechanicProfile.businessInfo.hours.addTimeFlagged = false; }, 300);

                        var day = $('#hoursDay').val();
                        var timeOpen = $('#hoursOpen').val();
                        var timeClose = $('#hoursClose').val();

                        var addProblem = false;
                        if(timeOpen === '') {
                            addProblem = true;
                            modal.notify({
                                title: 'Notice',
                                message: 'You must select an opening time before adding hours'
                            });
                        }

                        if(timeClose === '' && !addProblem) {
                            addProblem = true;
                            modal.notify({
                                title: 'Notice',
                                message: 'You must select a closing time before adding hours'
                            });
                        }

                        var hours = {
                            day: day,
                            timeOpen: timeOpen,
                            timeClose: timeClose
                        }

                        if(!addProblem && !mechanicProfile.businessInfo.hours.hasAvailability(hours)) {
                            addProblem = true;
                            modal.notify({
                                title: 'Notice',
                                message: 'You have already added this time frame into your available hours'
                            });
                        }

                        if(!addProblem && hours.timeOpen == hours.timeClose) {
                            addProblem = true;
                            modal.notify({
                                title: 'Notice',
                                message: 'You must have at least 30 minutes between opening and closing time'
                            });
                        }

                        if(!addProblem) {
                            mechanicProfile.businessInfo.hours.addAvailability(hours);
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
                for(i=0; i<mechanicProfile.businessInfo.hours.times.length; i++) {
                    h = mechanicProfile.businessInfo.hours.times[i];

                    if(hours.day == h.day && hours.timeOpen == h.timeOpen && hours.timeClose == h.timeClose) {
                        return false;
                    }
                }

                return true;
            },

            addAvailability: function(hours) {
                if(!util.is.nil(hours.day) && !util.is.nil(hours.timeOpen) && !util.is.nil(hours.timeClose)) {
                    mechanicProfile.businessInfo.hours.times.push(hours);
                    var dataid = hours.day+hours.timeOpen+hours.timeClose;

                    var html = '';
                    html += '<tr data-id="' + dataid + '" style="display: none;">';
                        html += '<td>' + mechanicProfile.businessInfo.hours.dayToString(hours.day) + '</td>';
                        html += '<td>' + mechanicProfile.businessInfo.hours.hourToString(hours.timeOpen) + ' - ' + mechanicProfile.businessInfo.hours.hourToString(hours.timeClose) + '</td>';
                        html += '<td><a class="delete standard-button red" href="javascript:void(0);" data-id="' + dataid + '"><i class="fa fa-trash"></i> Delete</a></td>';
                    html += '</tr>';

                    $('#hoursOfOperationTable').append(html);
                    $('#hoursOfOperationTable tr td a.delete[data-id="' + dataid + '"]').off('click touchstart').on('click touchstart', function(e) {
                        var dataidClicked = $(this).attr('data-id');
                        mechanicProfile.businessInfo.hours.deleteAvailability(dataidClicked);
                    });

                    $('#hoursOfOperationTable tr[data-id="' + dataid + '"]').fadeIn(300);

                    if(mechanicProfile.businessInfo.hours.times.length >= 7) {
                        $('#hoursSelectors').stop().slideUp(300);
                    }

                    $('#hoursDay option[value="' + hours.day + '"]').prop('disabled', true);
                    $('#hoursDay option:not([disabled])').first().prop('selected', true);
                }
            },

            deleteAvailability: function(dataid) {
                $('#hoursOfOperationTable tr[data-id="' + dataid + '"]').stop().fadeOut(300, function() {
                    $(this).remove();

                    for(i=0; i<mechanicProfile.businessInfo.hours.times.length; i++) {
                        var hours = mechanicProfile.businessInfo.hours.times[i];
                        if(hours.day+hours.timeOpen+hours.timeClose == dataid) {
                            if(mechanicProfile.businessInfo.hours.times.length >= 7) {
                                $('#hoursSelectors').stop().slideDown(300);
                            }

                            mechanicProfile.businessInfo.hours.times.splice(i, 1);
                            $('#dayHoursOfOperation option[value="' + hours.day + '"]').prop('disabled', false);
                            $('#dayHoursOfOperation option:not([disabled])').first().prop('selected', true);
                            break;
                        }
                    }
                });
            },

            clear: function() {
                for(i=0; i<mechanicProfile.businessInfo.hours.times.length; i++) {
                    var dataid = '';
                    dataid += mechanicProfile.businessInfo.hours.times[i].day;
                    dataid += mechanicProfile.businessInfo.hours.times[i].timeOpen;
                    dataid += mechanicProfile.businessInfo.hours.times[i].timeClose;
                    mechanicProfile.businessInfo.hours.deleteAvailability(dataid);
                }
            }
        },
    },
}

$(document).ready(function(e) {
    mechanicProfile.init();
});
