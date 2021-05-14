$(document).ready(function(e) {
    navbar.init();
});

var navbar = {
    init: function() {
        navbar.login.init();

        $('.signup').click(function() {
            console.log('sign up!!');
            mfMixpanel.track('Sign Up Click', {'Source': 'External'});
        });
    },

    nil: function(obj) {
        if(typeof(obj) == 'undefined' || obj == null || obj == ' ' || obj == '') return true;
        return false;
    },

    login: {
        documentClicked: false,
        loginShown: false,
        loginShowClicked: false,
        loginExitClicked: false,
        mobileMenuShown: false,

        init: function() {
            navbar.login.loginShown = true;
            navbar.login.login.init();
            navbar.login.forgot.init();

            $(document).on('click touchstart', function(event) {
                if (!navbar.login.documentClicked) {
                    navbar.login.documentClicked = true;
                    setTimeout(function(){ navbar.login.documentClicked = false; }, 300);

                    var target = event.target;
                    if ( target.id == 'mobilemenubutton' && target.tagName != 'A' && target.tagName != 'a') {
                        if(!navbar.login.mobileMenuShown) {
                            $('#mobilemenudropdown').stop().fadeIn(200);
                            navbar.login.mobileMenuShown = true;
                        } else {
                            $('#mobilemenudropdown').stop().fadeOut(200);
                            navbar.login.mobileMenuShown = false;
                        }
                    } else if (target.tagName != 'A' && target.tagName != 'a') {
                        if(navbar.login.mobileMenuShown) {
                            $('#mobilemenudropdown').stop().fadeOut(200);
                            navbar.login.mobileMenuShown = false;
                        }
                    }
                }
            });

            $('#loginPopupButton, #loginPopupButtonMobile').on('click touchstart', function(e) {
                if(!navbar.login.loginShowClicked) {
                    navbar.login.loginShowClicked = true;
                    setTimeout(function() { navbar.login.loginShowClicked = false; }, 300);

                    $('#loginOverlay').stop().fadeIn(300, function() {
                        navbar.login.loginShown = true;
                        $('#loginEmail').focus();
                    });
                }
            });

            $('#loginOverlay, #loginExitButton, #forgotExitButton').on('click touchstart', function(e) {
                if(!navbar.loginExitClicked && navbar.login.loginShown) {
                    navbar.loginExitClicked = true;
                    setTimeout(function() { navbar.loginExitClicked = false; }, 300);

                    // make sure the click didn't come from inside of the box
                    if($(event.target).closest('#loginBox').length <= 0 ||
                        $(event.target).attr('id') == 'loginExitButton' ||
                        $(event.target).attr('id') == 'forgotExitButton') {
                        $('#loginOverlay').stop().fadeOut(300, function() {
                            $('#forgotFields').hide();
                            $('#loginFields').show();
                        });
                    }
                   $('.textbox-box input').css('border', '1px solid #c6bdbd');
                }
            });
        },

        login: {
            forgotClicked: false,

            init: function() {
                $('#forgotEmail, #forgotPassword').on('click touchstart', function(e) {
                    if(!navbar.login.login.forgotClicked) {
                        navbar.login.login.forgotClicked = true;
                        setTimeout(function() { navbar.login.login.forgotClicked = false; }, 300);

                        $('#loginFields').stop().fadeOut(300, function() {
                            $('#forgotFields').stop().fadeIn(300);
                        });
                    }
                });

                $('#loginPassword').keypress(function (e) {
                    if (e.which == 13) {
                        submitLogin();
                        return false; 
                    }
                });

                $('#loginButton').on('click touchstart', function(e) {
                    submitLogin();
                });

                function submitLogin() {
                    $('#loginStatus').html('');
                    
                    var data = {
                        email: $('#loginEmail').val().toLowerCase(),
                        password: $('#loginPassword').val(),
                        stayLoggedIn: document.getElementById('keepMeLoggedIn').checked
                    };

                    var request = $.ajax({
                        url: "/api/session",
                        method: "POST",
                        data: data,
                        dataType: "json"
                    });

                    request.success(function(user) {
                        if(user.role == 'admin') window.location = '/admin';
                        else window.location = '/profile/' + user._id;
                    });

                    request.fail(function( jqXHR, textStatus ) {
                        loginFailed();
                    });
                }

                function loginFailed() {
                    $('.textbox-box input').css('border', '1px solid rgba(169, 1, 1, 1)');
                    $('#loginStatus').html('Invalid login. Please try again.').css('color', 'rgba(169, 1, 1, 1)');
                }
            }
        },

        forgot: {
            rememberedClicked: false,
            submitClicked: false,
            submitEnabled: true,
            email: '',

            init: function() {
                $('#forgotRemembered').on('click touchstart', function(e) {
                    if(!navbar.login.forgot.rememberedClicked) {
                        navbar.login.forgot.rememberedClicked = true;
                        setTimeout(function() { navbar.login.forgot.rememberedClicked = false; }, 300);

                        $('#forgotFields').stop().fadeOut(300, function() {
                            $('#loginFields').stop().fadeIn(300);
                        });
                    }
                });

                $('#forgotButton').on('click touchstart', function(e) {
                    if(!navbar.login.forgot.submitClicked) {
                        navbar.login.forgot.submitClicked = true;
                        setTimeout(function() { navbar.login.forgot.submitClicked = false; }, 300);
                        navbar.login.forgot.submit();
                    }
                });
            },

            updateStatus: function(message, error) {
                if(error !== true && error !== false) error = false;

                $('#forgotStatus').stop().fadeTo(300, 0, function() {
                    if(error) {
                        $(this).addClass('error');
                    } else {
                        $(this).removeClass('error');
                    }

                    $(this).html(message).stop().fadeTo(300, 1);
                });
            },

            submit: function() {
                if(navbar.login.forgot.submitEnabled) {
                    navbar.login.forgot.submitEnabled = false;
                    var email = $('#forgotEmailText').removeClass('error').val();

                    var emailRegExp = /[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?/i;
                    if(navbar.nil(email) || !emailRegExp.test(email)) {
                        $('#forgotEmailText').addClass('error');
                        navbar.login.forgot.updateStatus('Pease enter a valid email address', true);
                        navbar.login.forgot.submitEnabled = true;
                    } else {
                        navbar.login.forgot.updateStatus('Resetting your password...');
                        var data = { email: email };

                        // add ajax post req here
                        var request = $.ajax({
                            url: "/api/recover",
                            method: "POST",
                            data: data,
                            dataType: "json"
                        });

                        request.success(function(data) {
                            navbar.login.forgot.updateStatus('A password reset link has been sent if this email is registered');
                        });

                        request.fail(function(jqXHR, textStatus) {
                            navbar.login.forgot.updateStatus('There was an error while recovering your account');
                        });
                    }
                }
            }
        }
    },
}
