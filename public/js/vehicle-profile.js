var vehicleProfile = {
    user: {},
    vehicles: [],

    nil: function(obj) {
        return (obj == '' || obj == ' ' || obj == '&nbsp;' || typeof(obj) == 'undefined' || obj == null);
    },

    init: function() {
        vehicleProfile.user = USER;
        vehicleProfile.vehicles = VEHICLES;

        vehicleProfile.edit.init();
        vehicleProfile.add.init();
    },

    edit: {
        canDelete: true,
        deleteClicked: false,
        canEdit: true,
        editClicked: false,
        rowClicked: false,
        data: {
            // userId: '',
            vehicle: {
                make: '',
                model: '',
                year: '',
                engine: '',
                transmission: ''
            }
        },

        init: function() {
            // vehicleProfile.edit.data.userId = vehicleProfile.user._id;

            // if(vehicleProfile.vehicles.length > 0) {
            //     vehicleProfile.edit.fillForm(vehicleProfile.vehicles[0]);
            // }

            // $('#selectProfile').on('change', function(e) {
            //     v = vehicleProfile.edit.selectedVehicle();
            //     vehicleProfile.edit.fillForm(v);
            // });

            $('#deleteVehicle').off('click touchstart').on('click touchstart', function(e) {
                if(vehicleProfile.edit.canDelete && !vehicleProfile.edit.deleteClicked) {
                    vehicleProfile.deleteClicked = true;
                    setTimeout(function() {vehicleProfile.deleteClicked = false; }, 300);

                    v = vehicleProfile.edit.selectedVehicle();
                    vehicleProfile.edit.deleteVehicle(v);
                }
            });

            $('#saveVehicleEdits').off('click touchstart').on('click touchstart', function(e) {
                if(vehicleProfile.edit.canEdit && !vehicleProfile.edit.editClicked) {
                    vehicleProfile.editClicked = true;
                    setTimeout(function() {vehicleProfile.editClicked = false; }, 300);
                    v = vehicleProfile.edit.selectedVehicle();
                    vehicleProfile.edit.editVehicle(v);
                }
            });

            var filterId = '';
            var filtered = [];
            function filterVehicle(val) {
                return val._id === filterId;
            }

            $('.saveVehicleButton').each( function(i) {
                $(this).off().on('click touchend touchmove', function(e) {
                    filterId = $(this).attr('data-id');
                    filtered = vehicleProfile.vehicles.filter(filterVehicle);
                    if (vehicleProfile.edit.canEdit) {
                        vehicleProfile.edit.editVehicle(filtered[0]);
                    }
                });                
            });

            $('.deleteVehicleButton').each(function(i) {
                $(this).off().on('click touchend touchmove', function(e) {
                    filterId = $(this).attr('data-id');
                    filtered = vehicleProfile.vehicles.filter(filterVehicle);
                    if (vehicleProfile.edit.canDelete) {
                        vehicleProfile.edit.deleteVehicle(filtered[0]);
                    }
                });   
            });

            vehicleProfile.edit.accordionInit();            
        },

        accordionInit: function() {
            $('.accordion-header').off().on('click touchend touchmove', function(e) {
                if (!vehicleProfile.edit.rowClicked) {
                    vehicleProfile.edit.rowClicked = true;
                    setTimeout(function() { vehicleProfile.edit.rowClicked = false; }, 300);

                    if (e.type != 'touchmove') {
                        if ($(this).hasClass('expanded')) {
                            $(this).next().slideUp(300);
                            $(this).removeClass('expanded');
                        } else {
                            $(this).next().slideDown(300);
                            $(this).addClass('expanded');
                        }
                        $(this).children().children().toggleClass('fa-plus-circle fa-minus-circle');
                    }
                }                
            });

            $('input[id^="editVehicleMake"], input[id^="editVehicleModel"], input[id^="editVehicleYear"], input[id^="editVehicleEngine"], input[id^="editVehicleMileage"]').off().on('keyup', function(e) {
                $('#saveVehicleEdits' + $(this).attr('data-id')).removeClass('flat').html('<i class="fa fa-floppy-o fa-fw"></i> Save Changes');
            });

            if (vehicleProfile.vehicles.length === 0) {
                $('#addNewAccordion').click();
            } else if (vehicleProfile.vehicles.length === 1) {
                $('#accordionHeader' + vehicleProfile.vehicles[0]._id).click();
            }
        },

        fillForm: function(vehicle) {
            $('#editVehicleMake' + vehicle._id).val(vehicle.make);
            $('#editVehicleModel' + vehicle._id).val(vehicle.model);
            $('#editVehicleYear' + vehicle._id).val(vehicle.year);
            $('#editVehicleEngine' + vehicle._id).val(vehicle.engine);
            $('#editVehicleMileage' + vehicle._id).val(vehicle.mileage);
        },

        editVehicle: function(vehicle) {
            vehicleProfile.edit.canEdit = false;

            $('#editVehicleForm .input-error').removeClass('input-error');

            vehicleProfile.edit.data.vehicle._id = vehicle._id;
            vehicleProfile.edit.data.vehicle.make = $('#editVehicleMake' + vehicle._id).val();
            vehicleProfile.edit.data.vehicle.model = $('#editVehicleModel' + vehicle._id).val();
            vehicleProfile.edit.data.vehicle.year = parseInt($('#editVehicleYear' + vehicle._id).val()) || -1;
            vehicleProfile.edit.data.vehicle.engine = $('#editVehicleEngine' + vehicle._id).val();
            vehicleProfile.edit.data.vehicle.mileage = parseInt($('#editVehicleMileage' + vehicle._id).val()) || '';

            vehicleProfile.edit.errs = [];
            vehicleProfile.edit.eids = [];

            if(vehicleProfile.nil(vehicleProfile.edit.data.vehicle.make)) {
                vehicleProfile.edit.errs.push('You must enter your vehicle\'s make');
                vehicleProfile.edit.eids.push('editVehicleMake' + vehicle._id);
            }

            if(vehicleProfile.nil(vehicleProfile.edit.data.vehicle.model)) {
                vehicleProfile.edit.errs.push('You must enter your vehicle\'s model');
                vehicleProfile.edit.eids.push('editVehicleModel' + vehicle._id);
            }

            if(vehicleProfile.edit.data.vehicle.year < 0) {
                vehicleProfile.edit.errs.push('You must enter a valid vehicle year');
                vehicleProfile.edit.eids.push('editVehicleYear' + vehicle._id);
            }

            if(vehicleProfile.edit.errs.length > 0) {
                var html = '<p>Please correct the following issues before saving your changes:</p>';
                html += '<ul>';
                for(var i=0; i<vehicleProfile.edit.errs.length; i++) {
                    html += '<li>' + vehicleProfile.edit.errs[i] + '</li>';
                }
                html += '</ul>';
                modal.notify({
                    title: 'Invalid Vehicle Info',
                    message: html
                });

                for(i=0; i<vehicleProfile.edit.eids.length; i++) {
                    $('#'+vehicleProfile.edit.eids[i]).addClass('input-error');
                }

                vehicleProfile.edit.canEdit = true;
            } else {
                modal.notify({
                    title: 'Saving Vehicle',
                    message: 'Your vehicle profile is being saved.',
                    loading: true,
                    canOkay: false,
                    canExit: false
                });

                var request = $.ajax({
                    type: "PUT",
                    url: '/api/profile/vehicle',
                    data: vehicleProfile.edit.data,
                    dataType: 'json'
                });


                request.done(function(vehicle) {
                    vehicleProfile.edit.canEdit = true;
                    $('#selectProfile option[data-id="' + vehicle._id + '"]').text(vehicle.year + ' ' + vehicle.make + ' ' + vehicle.model);
                    modal.hide(null, true);
                    $('#saveVehicleEdits' + vehicle._id).addClass('empty').html('<i class="fa fa-check fa-fw"></i> Saved');
                });

                request.fail(function(jqXHR) {
                    vehicleProfile.edit.canEdit = true;
                    modal.notify({
                        title: 'Error',
                        message: 'There was a problem while saving changes to your vehicle. If this problem persists, please feel free to contact us for support.'
                    });
                });
            }
        },

        deleteVehicle: function(vehicle) {
            vehicleProfile.edit.canDelete = false;
            
            modal.notify({
                title: 'Deleting Vehicle',
                message: 'Your vehicle profile is being deleted',
                loading: true,
                canOkay: false,
                canExit: false
            });

            for(i=0; i<vehicleProfile.vehicles.length; i++) {
                if(vehicleProfile.vehicles[i]._id == vehicle._id) {
                    vehicleProfile.vehicles.splice(i, 1);
                    var data = {
                        user: vehicleProfile.user,
                        vehicle: vehicle._id
                    }

                    var request = $.ajax({
                        type: "DELETE",
                        url: '/api/profile/vehicle',
                        data: data,
                        dataType: 'json'
                    });

                    request.done(function(data) {
                        modal.hide(null, true);

                        $('#accordionHeader' + vehicle._id).remove();
                        $('#accordionDetails' + vehicle._id).remove();
                        vehicleProfile.edit.canDelete = true;

                        if(vehicleProfile.vehicles.length > 0) {
                            vehicleProfile.edit.selectVehicle(vehicleProfile.vehicles[0]);
                        } else {
                            $('#editVehicleForm').stop().fadeOut(300);
                        }
                        if (vehicleProfile.vehicles.length === 0) {
                            $('#addNewAccordion').click();
                        } else if (vehicleProfile.vehicles.length === 1) {
                            $('#accordionHeader' + vehicleProfile.vehicles[0]._id).click();
                        }
                    });

                    request.fail(function(err) {
                        modal.notify({
                            title: 'Error',
                            message: 'There was a problem while deleting your vehicle profile. Refresh the page and try again. If this problem persists, please contact us for support.'
                        });

                        vehicleProfile.edit.canDelete = true;
                    });
                    break;
                }
            }
        },

        selectedVehicle: function() {
            var id = $('#selectProfile').val();
            return vehicleProfile.vehicleWithID(id);
        },

        selectVehicle: function(vehicle) {
            $('#selectProfile').val(vehicle._id);

            $('#editVehicleMake').val(vehicle.make);
            $('#editVehicleModel').val(vehicle.model);
            $('#editVehicleYear').val(vehicle.year);
            $('#editVehicleEngine').val(vehicle.engine);
            $('#editVehicleMileage').val(vehicle.mileage);
        }
    },

    add: {
        canSave: true,
        saveClicked: false,
        data: {
            user: '',
            vehicle: {
                make: '',
                model: '',
                year: '',
                engine: '',
                mileage: ''
            }
        },

        errs: [],
        eids: [],

        init: function() {
            vehicleProfile.add.data.user = vehicleProfile.user;

            $('#saveVehicleProfile').off('click touchstart').on('click touchstart', function(e) {
                if(!vehicleProfile.add.saveClicked && vehicleProfile.add.canSave) {
                    vehicleProfile.add.saveClicked = true;
                    setTimeout(function() { vehicleProfile.add.saveClicked = false; }, 300);

                    vehicleProfile.add.submit();
                }
            });
        },

        updateFormIds: function($accordion, suffix, vehicle) {
            var inputs = ['editVehicleMake', 'editVehicleModel', 'editVehicleYear', 'editVehicleEngine', 'editVehicleMileage'];
            var $header = $accordion.find('#accordionHeaderTemplate');
            var $details = $accordion.find('#accordionDetailsTemplate');

            $accordion.attr('style','');
            $accordion.attr('id', 'container' + suffix);
            $header.prop('id', 'accordionHeader' + suffix).html(vehicle.year + ' ' + vehicle.make + ' ' + vehicle.model + '<div class="expand-icon"><i class="fa fa-plus-circle"></i></div>');
            $details.prop('id', 'accordionDetails' + suffix);
            
            for (var i = 0; i < inputs.length; i++) {
                $details.find('input[id^="' + inputs[i] +'"]:first').prop('id', inputs[i] + suffix).attr('data-id', suffix);
                $details.find('label[for^="' + inputs[i] +'"]:first').prop('for', inputs[i] + suffix).attr('data-id', suffix);
            }
            
            $details.find('a[id^="saveVehicleEdits"]:first').prop('id', 'saveVehicleEdits' + suffix).attr('data-id', suffix);
            $details.find('a[id^="deleteVehicle"]:first').prop('id', 'deleteVehicle' + suffix).attr('data-id', suffix);

            return $accordion;
        },

        submit: function() {
            vehicleProfile.add.canSave = false;

            $('#addVehicleForm .input-error').removeClass('input-error');

            vehicleProfile.add.data.vehicle.make = $('#inputMake').val();
            vehicleProfile.add.data.vehicle.model = $('#inputModel').val();
            vehicleProfile.add.data.vehicle.year = parseInt($('#inputYear').val()) || -1;
            vehicleProfile.add.data.vehicle.engine = $('#vehicleEngine').val();
            vehicleProfile.add.data.vehicle.mileage = parseInt($('#vehicleMileage').val()) || '';

            vehicleProfile.add.errs = [];
            vehicleProfile.add.eids = [];

            if(vehicleProfile.nil(vehicleProfile.add.data.vehicle.make)) {
                vehicleProfile.add.errs.push('You must enter your vehicle\'s make');
                vehicleProfile.add.eids.push('inputMake');
            }

            if(vehicleProfile.nil(vehicleProfile.add.data.vehicle.model)) {
                vehicleProfile.add.errs.push('You must enter your vehicle\'s model');
                vehicleProfile.add.eids.push('inputModel');
            }

            if(vehicleProfile.add.data.vehicle.year < 0) {
                vehicleProfile.add.errs.push('You must enter a valid vehicle year');
                vehicleProfile.add.eids.push('inputYear');
            }

            if(vehicleProfile.add.errs.length > 0) {
                var html = '<p>Please correct the following issues before adding your vehicle:</p>';
                html += '<ul>';
                for(var i=0; i<vehicleProfile.add.errs.length; i++) {
                    html += '<li>' + vehicleProfile.add.errs[i] + '</li>';
                }
                html += '</ul>';
                modal.notify({
                    title: 'Invalid Vehicle Info',
                    message: html
                });

                for(i=0; i<vehicleProfile.add.eids.length; i++) {
                    $('#'+vehicleProfile.add.eids[i]).addClass('input-error');
                }

                vehicleProfile.add.canSave = true;
            } else {
                modal.notify({
                    title: 'Adding Vehicle',
                    message: 'Your vehicle is being added to your saved vehicle profiles',
                    loading: true,
                    canOkay: false,
                    canExit: false
                });

                var request = $.ajax({
                    type: "POST",
                    url: '/api/profile/vehicle',
                    data: vehicleProfile.add.data,
                    dataType: 'json'
                });

                request.done(function(data) {
                    modal.hide(null, true);

                    var $accordion = $('#accordionTemplate').clone();
                    var accordion = vehicleProfile.add.updateFormIds($accordion, data.vehicle._id, data.vehicle);
                    $('#accordionContainer > div:nth-child(1)').after(accordion);
                    vehicleProfile.edit.init();

                    vehicleProfile.vehicles.push(data.vehicle);
                    vehicleProfile.edit.fillForm(data.vehicle);
                    vehicleProfile.add.canSave = true;

                    $('#inputMake').val('');
                    $('#inputModel').val('');
                    $('#inputYear').val('');
                    $('#vehicleEngine').val('');
                    $('#vehicleMileage').val('');

                    if(vehicleProfile.vehicles.length == 1) {
                        $('#editVehicleForm').stop().fadeIn(300, function() {
                            $('html, body').animate({scrollTop: 0}, 300);
                        });
                    } else {
                        $('html, body').animate({scrollTop: 0}, 300);
                    }

                    $('#accordionHeader' + data.vehicle._id).click();
                    $('html, body').animate({
                        scrollTop: $('#accordionHeader' + data.vehicle._id).offset().top
                    }, 600);

                });

                request.fail(function(err) {
                    modal.notify({
                        title: 'Error',
                        message: 'There was an error while adding your vehicle. If this error persists, please contact us for support'
                    });

                    vehicleProfile.add.canSave = true;
                });
            }
        }
    },

    vehicleWithID: function(id) {
        for(i=0; i<vehicleProfile.vehicles.length; i++) {
            if(vehicleProfile.vehicles[i]['_id'] == id) {
                return vehicleProfile.vehicles[i];
            }
        }

        return null;
    }
}

$(document).ready(function(e) {
    vehicleProfile.init();
});
