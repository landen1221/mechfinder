var personal = {
    saveClicked: false,
    canSave: true,
    pictureClicked: false,

    user: null,

    data: {
        username: '',
        first: '',
        last: '',
        email: '',
        password: '',
        rpassword: '',
        phone: {
            number: '',
            kind: '',
            sms: false,
            smsCharges: false
        },
        languages: {
            english: true,
            spanish: false
        },
        picture: null,
        preferences: {
            chat: {
                sound: true
            },
            notifications: {
                email: {
                    support: false,
                    projectBasic: false,
                    projectImportant: false,
                    chat: false,
                    marketing: false,
                    general: false,
                    newProjects: true,
                    buyerUpdates: true,
                    reviewed: true
                }
            }
        }
    },

    errs: [],
    eids: [],

    init: function() {
        personal.user = USER;
        personal.data.preferences = PREFS;

        $('#personal-profile-phoneselect').on('change', function(e) {
            if($(this).val() == 'Mobile') {
                $('#smsandcarrier, #carrieragreebox').stop().show();
                $('#verify-phone-by')
                    .append($('<option></option>')
                    .attr('value', 'SMS')
                    .text('SMS'));
            } else {
                $('#smsandcarrier, #carrieragreebox').stop().hide();
                $('#verify-phone-by option[value=\'SMS\']').remove();
            }
        });

        $('#personal-profile-sms').on('change', function(e) {
            if($(this).val() == '1') {
                $('#carrieragreebox').stop().show();
            } else {
                $('#carrieragreebox').stop().hide();
            }
        });

        $('#personal-profile-smscharges, #personal-profile-sms').on('change', function(e) {
            if($('#personal-profile-smscharges').is(':checked') && $('#personal-profile-sms').val() == '1') {
                $('#smsVerification').removeAttr('disabled');
            } else {
                $('#smsVerification').attr('disabled', 'disabled');
                $('#verify-phone-by').val('Call');
            }
        });

        $('#personal-profile-phonetype').on('change', function(e) {
            if($(this).val() == 'Mobile') {
                $('#smsandcarrier, #carrieragreebox').stop().slideDown(300);
            } else {
                $('#smsandcarrier, #carrieragreebox').stop().slideUp(300);
            }
        });

        $('.savePersonalProfile').on('click touchstart', function(e) {
            if(!personal.saveClicked && personal.canSave) {
                personal.saveClicked = true;
                setTimeout(function() { personal.saveClicked = false; }, 300);
                personal.validateForm();
            }
        });

        $('#personal-profile-picture').on('dragenter', function(e) {
            $(this).addClass('dragging');
        }).on('dragleave drop', function(e) {
            $(this).removeClass('dragging');
        }).filedrop({
            callback: function(file, data) {
                personal.changePicture(file, data);
            }
        });

        $('#personal-profile-file').on('change', function(e) {
            var files = $(this).get(0).files;
            var file = files[0];

            var reader = new FileReader();

            reader.onload = (function(f) {
                return function(event) {
                    personal.changePicture(f, event.target.result);
                }
            })(file);

            reader.readAsDataURL(file);
        });

        $('#personal-profile-picture').on('click touchstart', function(e) {
            if(!personal.pictureClicked) {
                personal.pictureClicked = true;
                setTimeout(function() { personal.pictureClicked = false; }, 300);
                $('#personal-profile-file').click();
            }
        });

        personal.verification.init();
    },

    changePicture: function(file, data) {
        if(file.name.toLowerCase().match(/\.(jpg|jpeg|png|gif)$/)) {
            personal.data.picture = data;

            $('#personal-profile-picture').css('background-image', 'url(' + data + ')');
        }
    },

    validateForm: function(callback) {
        personal.canSave = false;

        $('.error').removeClass('error');

        personal.data.first = $('#personal-profile-firstname').val();
        personal.data.last = $('#personal-profile-lastname').val();
        personal.data.email = $('#personal-profile-email').val();
        personal.data.password = $('#personal-profile-password').val();
        personal.data.rpassword = $('#personal-profile-rpassword').val();
        personal.data.phone.number = $('#personal-profile-phone').val().replace(/\D/g, '');
        personal.data.phone.kind = $('#personal-profile-phonetype').val();
        personal.data.phone.sms = ($('#personal-profile-sms').val() == '1') ? true : false;
        personal.data.phone.smsCharges = $('#personal-profile-smscharges').is(':checked');
        personal.data.languages.english = $('#personal-profile-english').is(':checked');
        personal.data.languages.spanish = $('#personal-profile-spanish').is(':checked');

        if ($('#prefsChatSound').length) { personal.data.preferences.chat.sound = $('#prefsChatSound').is(':checked'); }

        if ($('#notsSupport').length) { personal.data.preferences.notifications.email.support = $('#notsSupport').is(':checked'); }
        if ($('#notsProjectBasic').length) { personal.data.preferences.notifications.email.projectBasic = $('#notsProjectBasic').is(':checked'); }
        if ($('#notsProjectImportant').length) { personal.data.preferences.notifications.email.projectImportant = $('#notsProjectImportant').is(':checked'); }
        if ($('#notsChat').length) { personal.data.preferences.notifications.email.chat = $('#notsChat').is(':checked'); }
        if ($('#notsMarketing').length) { personal.data.preferences.notifications.email.marketing = $('#notsMarketing').is(':checked'); }
        if ($('#notsGeneral').length) { personal.data.preferences.notifications.email.general = $('#notsGeneral').is(':checked'); }
        if ($('#notsNewProjects').length) { personal.data.preferences.notifications.email.newProjects = $('#notsNewProjects').is(':checked'); }
        if ($('#notsBuyerUpdates').length) { personal.data.preferences.notifications.email.buyerUpdates = $('#notsBuyerUpdates').is(':checked'); }
        if ($('#notsReviewed').length) { personal.data.preferences.notifications.email.reviewed = $('#notsReviewed').is(':checked'); }

        personal.errs = [];
        personal.eids = [];

        var emailRegexp = /[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?/i;
        if(!util.is.nil(personal.data.email) && !emailRegexp.test(personal.data.email)) {
            personal.errs.push('Please enter a valid email address');
            personal.eids.push('personal-profile-email');
        }

        if(!util.is.nil(personal.data.password) && util.is.nil(personal.data.rpassword)) {
            personal.errs.push('Please repeat the password you have entered');
            personal.eids.push('personal-profile-rpassword');
        } else if(personal.data.password != personal.data.rpassword) {
            personal.errs.push('The passwords you have entered do no match');
            personal.eids.push('personal-profile-rpassword');
        }

        // if the user has opted to enter a phone number
        if(!util.is.nil(personal.data.phone.number) && personal.data.phone.number.length != 10) {
            personal.errs.push('Please enter a valid phone number');
            personal.eids.push('personal-profile-phone');
        }

        // only perform the following checks if it's a mobile phone number
        if(personal.data.phone.kind == 'Mobile' && personal.data.phone.sms) {
            if(!personal.data.phone.smsCharges) {
                personal.errs.push('Please acknowledge your understanding that carrier charges may apply, or turn off SMS notifications')
                personal.eids.push('personal-profile-smscharges-td');
            }
        }

        if(!personal.data.languages.english && !personal.data.languages.spanish) {
            personal.errs.push('Please select at least one language');
            personal.eids.push('personal-profile-languages');
        }

        if(personal.errs.length > 0) {
            var html = '<p>Please correct the following errors before saving: <br /><br /></p>';
            html += '<ul>';
            for(var i=0; i<personal.errs.length; i++) {
                html += '<li>' + personal.errs[i] + '</li>';
            }
            html += '</ul>';
            
            modal.notify({
                title: 'Invalid Fields',
                message: html
            });

            for(i=0; i<personal.eids.length; i++) {
                $('#'+personal.eids[i]).addClass('error');
            }

            personal.canSave = true;
        } else {
            mfMixpanel.track('Updated Personal Profile');

            modal.notify({
                title: 'Saving Your Info',
                message: 'We are saving your personal profile information. This may take a few moments, so thank you for your patience.',
                loading: true,
                canExit: false,
                canOkay: false
            });

            console.log('saving user changes');
            var request = $.ajax({
                type: 'POST',
                url: '/api/profile',
                data: personal.data,
                dataType: 'json'
            });

            request.done(function(user) {
                modal.notify({
                    title: 'Profile Saved',
                    message: 'Your personal profile information has been updated!'
                });

                personal.canSave = true;

                if(user.phone.number != personal.user.phone.number) {
                    $('#verify-code-box').stop().hide();
                    $('#verify-phonenumber').stop().fadeIn(300);
                }

                personal.user = user;

                $('#navbarPicture').css('background-image', 'url(' + personal.data.picture + ')');

                if(callback) callback();
            });

            request.fail(function(jqXHR) {
                modal.notify({
                    title: 'Error',
                    message: 'There was a problem while saving your personal profile information. If this issue persists, please contact us.'
                });
                personal.canSave = true;
            });
        }
    },

    verification: {
        clicked: {
            send: false
        },

        can: {
            send: true,
            verify: false
        },

        data: {
            method: '',
            phone: {
                number: '',
                kind: '',
                sms: false,
                smsCharges: false
            }
        },

        vdata: {
            verificationCode: '',
            phoneNumber: ''
        },

        errs: [],
        eids: [],

        send: function(method) {
            if(personal.verification.can.send) {
                method = (method === 'sms' || method === 'call') ? method : 'call';

                // disallow multiple requests
                personal.verification.can.send = false;

                personal.verification.data.method = method;
                var phoneNumber = $('#personal-profile-phone').val() || personal.user.phone.number;
                personal.verification.data.phone.number = phoneNumber.replace(/\D/g, '');
                personal.verification.data.phone.kind = $('#personal-profile-phonetype').val();
                personal.verification.data.phone.sms = ($('#personal-profile-sms').val() == '1') ? true : false;
                personal.verification.data.phone.smsCharges = $('#personal-profile-smscharges').is(':checked');

                personal.verification.errs = [];
                personal.verification.eids = [];
                
                if(util.is.nil(personal.verification.data.phone.number) || personal.verification.data.phone.number.length != 10) {
                    personal.verification.errs.push('Please enter a valid phone number');
                    personal.verification.eids.push('personal-profile-phone');
                }
                
                if(personal.verification.data.method == 'sms') {
                    if(personal.verification.data.phone.kind != 'Mobile') {
                        personal.verification.errs.push('Set your phone type to mobile');
                        personal.verification.eids.push('personal-profile-phonetype');
                    } else if(!personal.verification.data.phone.sms) {
                        personal.verification.errs.push('Turn SMS notifications on');
                        personal.verification.eids.push('personal-profile-sms');
                    } else if(!personal.verification.data.phone.smsCharges) {
                        personal.verification.errs.push('Acknowledge your understanding that carrier charges may apply');
                        personal.verification.eids.push('persona-profile-smscharges');
                    }
                }

                if(personal.verification.errs.length > 0) {
                    var html = '<p>Please correct the following errors before requesting a verification pin: <br /><br /></p>';
                    html += '<ul>';
                    for(var i=0; i<personal.verification.errs.length; i++) {
                        html += '<li>' + personal.verification.errs[i] + '</li>';
                    }
                    html += '</ul>';

                    modal.notify({
                        title: 'Invalid Fields',
                        message: html
                    });

                    for(i=0; i<personal.verification.eids.length; i++) {
                        $('#'+personal.verification.eids[i]).addClass('error');
                    }

                    personal.verification.can.send = true;
                } else {
                    var gerund = (method == 'call') ? 'calling' : 'texting';
                    var noun = (method == 'call') ? 'call' : 'message';
                    modal.notify({
                        title: 'Sending Verification',
                        message: 'We are ' + gerund + ' you with a short verification pin now. Please check your phone for our ' + noun + '.',
                        canExit: false,
                        canOkay: false,
                        loading: true
                    });

                    var request = $.ajax({
                        type: 'POST',
                        url: '/api/verify/sendToken',
                        data: personal.verification.data,
                        dataType: 'json'
                    });

                    request.done(function(user) {
                        personal.verification.can.send = true;
                        personal.verification.can.resend = true;

                        personal.verification.enter(personal.verification.data.phone.number, personal.verification.data.method);
                    });

                    request.fail(function(jqXHR) {
                        personal.verification.can.send = true;

                        modal.notify({
                            title: 'Error',
                            message: 'There was a problem while sending you your verification pin. Check to see that you have entered the correct phone number. If this issue persists, please contact us.'
                        });
                    });
                }
            }
        },

        enter: function(number, method) {
            var verb = (method == 'call') ? 'called' : 'texted';
            modal.input({
                title: 'Enter Pin',
                message: 'We have ' + verb + ' you with a verification pin. This may take a few moments to arrive. When it arrives, enter the verification pin that we have sent you in the field below: ',
                submit: function(code) {
                    personal.verification.can.verify = true;
                    personal.verification.check(code, number, method);
                }
            });
        },

        check: function(code, number, method) {
            if(personal.verification.can.verify) {
                personal.verification.vdata.verificationCode = code.replace(/\D/g, '');
                personal.verification.vdata.phoneNumber = number;

                if(personal.verification.vdata.verificationCode.length !== 4) {
                    // bad pin number format
                    personal.verification.incorrect(number, method);
                } else {
                    modal.notify({
                        title: 'Verifying',
                        message: 'We are checking the pin you have entered. This may take a few moments, so thank you for your patience.',
                        canExit: false,
                        canOkay: false,
                        loading: true
                    });

                    var request = $.ajax({
                        type: 'POST',
                        url: '/api/verify/verifyToken',
                        data: personal.verification.vdata,
                        dataType: 'json'
                    });

                    request.done(function(user) {
                        modal.notify({
                            title: 'Verified',
                            message: 'Your phone number has been verified!'
                        });

                        $('#verify-phonenumber').stop().slideUp(300);
                    });

                    request.fail(function(jqXHR) {
                        var message = 'Oops! There was a problem verifying your pin. Please try again or send a new verification pin';
                        if((jqXHR.status == 401 || jqXHR.status == 400 || jqXHR.status == 403) && jqXHR.responseJSON.message) message = jqXHR.responseJSON.message;
                        personal.verification.incorrect(number, method, message);
                        personal.verification.can.verify = true;
                    });
                }
            }
        },

        incorrect: function(number, method, message) {
            message = (typeof message == 'string') ? message : 'The pin you have entered does not match the one we sent to your phone. Would you like to try again or have another pin sent to you?'; 
            modal.confirm({
                title: 'Verification Issue',
                message: message,
                yes: function() {
                    personal.verification.send(method);
                },
                no: function() {
                    personal.verification.enter(number, method);
                },
                exit: function(){},
                yesText: 'Send Another Pin',
                noText: 'Try Again',
                noColor: 'green',
                fixedButtons: false
            });
        },

        init: function() {
            $('.verifyPhoneSend').on('click touchend touchmove', function(e) {
                if(e.type != 'touchmove' && !personal.verification.clicked.send) {
                    personal.verification.clicked.send = true;
                    setTimeout(function() {
                        personal.verification.clicked.send = false;
                    }, 300);

                    var method = $(this).data('method');
                    personal.verification.send(method);
                }
            });
        },
    }
}

$(document).ready(function(e) {
    personal.init();
});
