$(document).ready(function() {
    signup.init();
});

var signup = {
    data: {
        first: null,
        last: null,
        email: null,
        password: null,
        rpassword: null,
        english: false,
        spanish: false,
        agreeterms: false,
        role: 'buyer',
        facebookId: '',
        invite: false
    },

    signupData: {
        user: null,
        redirect: ''
    },

    canClickComplete: true,
    clickedFacebook: false,
    clickedUpdateRole: false,

    init: function() {
        $('#signup-complete').on('click touchstart', function() {
            if(signup.canClickComplete) {
                // signup.hideErrorMessage();
                signup.canClickComplete = false;
                signup.updateStatus('<i class="fa fa-cog fa-spin fa-fw"></i> You are currently being signed up for an account', false);

                if (signup.validate()) {
                    signup.send();
                } else {
                    signup.canClickComplete = true;
                }
            }
        });

        $('.updateRole').on('click touchmove touchend', function(e) {
            if(e.type !== 'touchend' && !signup.clickedUpdateRole) {
                signup.clickedUpdateRole = true;
                signup.setRole($(this).attr('data-role'));
            }
        });
    },

    highlight: function(id) {
        if(!util.is.nil(id)) {
          $('#'+id).addClass('error');
        }
    },

    unHighlight: function() {
        $('.error').removeClass('error');
    },

    updateStatus: function(message, err) {
        err = (typeof(err) === 'boolean') ? err : false;
        $('#signup-emsg').stop().fadeTo(300, 0, function() {
            $(this).html(message).stop().fadeTo(300, 1).addClass('error');
            if(!err) {
                $(this).removeClass('error');
            }
        });
    },

    setRole: function(role) {
        console.log('setting role to: ' + role);
        // need some sort of message here that says, "We are redirecting you" since this api call will happen so fast

        if(role != signup.signupData.user.role) {
            var body = {
                role: role
            };

            var request = $.ajax({
                url: '/api/profile',
                type: 'POST',
                data: body,
                dataType: 'json'
            });

            request.done(function(data) {
                console.log(data);
                signup.successRedirect();
            });

            request.fail(function(jqXHR) {
                console.log(jqXHR);
                // we should not EVER hit this (if we do somebody is tampering), but if we do, just redirect to profile page
                window.location = '/profile/' + signup.signupData.user._id;
            });
        } else {
            // their user role is already set to what they clicked, just redirect
            signup.successRedirect();
        }
    },

    successRedirect: function() {
        if(!util.is.nil(signup.signupData.redirect)) window.location = signup.signupData.redirect
        else window.location = '/profile/' + signup.signupData.user._id;
    },

    send: function() {
        var request = $.ajax({
            type: 'POST',
            url: '/api/signup',
            data: signup.data,
            dataType: 'json'
        });

        request.fail(function(jqXHR) {
            signup.canClickComplete = true;
            console.log(jqXHR);
            var boxWithErrors = '';
            var errorStatement = 'A general uncoded system error occurred, please try again.';
            var response = (!util.is.nil(jqXHR.responseJSON)) ? jqXHR.responseJSON : null;

            if(!util.is.nil(response) && !util.is.nil(response.err)) {
                if(response.err == 'Email address already in use.') {
                    boxWithErrors = 'signup-email';
                    errorStatement = 'This email address is already being used.';
                }
            }

            signup.updateStatus(errorStatement, true);
            signup.highlight(boxWithErrors);
        });

        request.done(function(data) {
            signup.userId = data.user._id;
            signup.signupData.user = data.user;
            signup.signupData.redirect = data.redirect;
            $('#mainSignupBox').stop().fadeOut(300, function() {
                $('#roleSignupBox').stop().fadeIn(300);
            });

            signupData = {
                'User': data.user._id,
                'Username': data.user.username,
                'Role': data.user.role,
                'Email': data.user.email,
                'Source': 'External'
            };
            mfMixpanel.track('User Registration', signupData);
        });
    },

    validate: function() {
        signup.unHighlight();

        signup.data.first = $('#signup-firstname').val();
        signup.data.last = $('#signup-lastname').val();
        signup.data.email = $('#signup-email').val();
        signup.data.password = $('#signup-password').val();
        signup.data.rpassword = $('#signup-rpassword').val();
        signup.data.english = $('#signup-language-english').is(':checked');
        signup.data.spanish = $('#signup-language-spanish').is(':checked');
        signup.data.agreeterms = $('#signup-agreeterms').is(':checked');
        signup.data.facebookId = $('#signup-facebookId').val();
        signup.data.invite = ($('#signup-invite').val() == '1') ? true : false;

        var emailRegexp = /[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?/i;

        var boxesWithErrors = [];
        var errorStatement = [];

        if(util.is.nil(signup.data.first)) {
            boxesWithErrors.push('signup-firstname');
            errorStatement.push('You must enter your first name');
        }

        if(util.is.nil(signup.data.last)) {
            boxesWithErrors.push('signup-lastname');
            errorStatement.push('You must enter your last name');
        }

        if(util.is.nil(signup.data.email) || !emailRegexp.test(signup.data.email)) {
            boxesWithErrors.push('signup-email');
            errorStatement.push('You must enter a valid email address');
        }

        if(util.is.nil(signup.data.password)) {
            boxesWithErrors.push('signup-password');
            errorStatement.push('You must a password for your account');
        } else if(signup.data.password.length < 6) {
            boxesWithErrors.push('signup-password');
            errorStatement.push('Your password must be 6 or more characters');
        }

        if(util.is.nil(signup.data.rpassword) || signup.data.password != signup.data.rpassword) {
            boxesWithErrors.push('signup-rpassword');
            errorStatement.push('Your passwords do not match');
        }

        if(!(signup.data.english || signup.data.spanish)) {
            errorStatement.push('You must select a language before continuing');
            boxesWithErrors.push('signup-languages-checkboxes');

            $('#signup-language-spanish, #signup-language-english').on('change', function(e) {
                $('#signup-language-spanish, #signup-language-english').off('change');
                $('#signup-languages-checkboxes').removeClass('error');
            });
        }

        if(!signup.data.agreeterms) {
            errorStatement.push('You must agree to the Mechfinder.com terms and conditions before continuing');
            boxesWithErrors.push('signup-agreeterms-chck');

            $('#signup-agreeterms').on('change', function(e) {
                $(this).off('change');
                $('#signup-agreeterms-chck').removeClass('error');
            });
        }

        for(var i = 0; i < boxesWithErrors.length; i++ ) {
            signup.highlight(boxesWithErrors[i]);
        }

        if (errorStatement.length > 1) {
            signup.updateStatus('Please correct the highlighted fields before continuing', true);
            return false;
        } else if (errorStatement.length == 1)  {
            signup.updateStatus(errorStatement[0], true);
            return false;
        } else {
            return true;
        }
    }
}
