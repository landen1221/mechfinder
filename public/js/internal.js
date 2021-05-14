$(document).ready(function(e) {
    internal.init();
});

var internal = {
    init: function() {
        internal.nav.init();
        internal.sideMenu.init();
        internal.userMenu.init();
        internal.highlightCurrent();
    }, // internal.init()

    highlightCurrent: function() {
        console.log(window.location.href);
        var split = window.location.href.split(/[?#/]/);
        var currentItem = '';
        switch (split[3]) {
            case 'profile':
                currentItem = 'dashboard-item';
                break;
            case 'projects':
                if (split[4] === 'post') {
                    currentItem = 'post-item';
                } else if (split.length <= 4) {
                    currentItem = 'projects-item';
                }
                break;
            case 'my':
                if (split[4] === 'projects') {
                    currentItem = 'my-projects-item';
                } else if (split[4] === 'favorites') {
                    currentItem = 'favorites-item';
                }
                break;
            case 'mechanics':
                currentItem = 'mechanics-item';
                break;
        }
        $('.item-link').removeClass('current');
        $('#' + currentItem).addClass('current');
    },

    nav: {
        loginClicked: false,
        signupClicked: false,

        init: function() {
            $('#nav-logout').on('click touchstart', function(e) {
                // will go here for logout event
                var request = $.ajax({
                    url: '/api/session',
                    type: "DELETE"
                });

                request.success(function(data) {
                    modal.notify({
                        title: 'Logged Out',
                        message: 'You have been logged out successfully. <a id="logBackInFromLogout" href="javascript:void(0);">Click here to log back in</a>.',
                        okay: function() {
                            window.location = '/';
                        },
                        exit: function() {
                            window.location = '/';
                        }
                    });

                    $('#logBackInFromLogout').off('click touchmove touchend').on('click touchmove touchend', function(e) {
                        if(e.type != 'touchmove' && !internal.nav.loginClicked) {
                            setTimeout(function() {
                                internal.nav.loginClicked = false;
                            }, 300);
                            
                            internal.nav.login();
                        }
                    });
                });

                request.fail(function(jqXHR) {
                    console.log(jqXHR);
                    window.location.reload(true);
                });
            });

            internal.nav.initLoginClicks();
        },

        initLoginClicks: function() {
            $('#internalNavLogin, .internalLoginAction').on('click touchend touchmove', function(e) {
                if(e.type != 'touchmove' && !internal.nav.loginClicked) {
                    internal.nav.loginClicked = true;
                    setTimeout(function() {
                        internal.nav.loginClicked = false;
                    }, 300);

                    internal.nav.login();
                }
            });

            $('#internalNavSignup, .internalSignupAction').on('click touchend touchmove', function(e) {
                console.log('clicked it');
                if(e.type != 'touchmove' && !internal.nav.signupClicked) {
                    internal.nav.signupClicked = true;
                    setTimeout(function() {
                        internal.nav.signupClicked = false;
                    }, 300);

                    mfMixpanel.track('Sign Up Click', {'Source': 'Internal'});
                    internal.nav.signup();
                }
            });
        },

        login: function(err) {
            err = (typeof err == 'boolean') ? err : false;
            console.log('login');
            modal.login({
                err: err,
                message: !util.is.nil(err) ? 'Invalid email and password combination. Please try again' : '',
                submit: function(email, password) {
                    modal.notify({
                        title: 'Logging In',
                        message: 'We are currently logging you in. This may take a few moments, so thank you for your patience.',
                        loading: true,
                        canExit: false,
                        canOkay: false
                    });

                    var body = {
                        email: email,
                        password: password,
                        stayLoggedIn: true
                    }

                    var request = $.ajax({
                        url: "/api/session",
                        method: "POST",
                        data: body,
                        dataType: "json"
                    });

                    request.done(function(user) {
                        if(user.role == 'admin') window.location = '/admin';
                        else window.location.reload(true);
                    });

                    request.fail(function( jqXHR, textStatus ) {
                        console.log(jqXHR);
                        internal.nav.login(true);
                    });
                }
            });
        },

        signup: function(errs, eids) {
            errs = util.is.nil(errs) ? [] : errs;
            eids = util.is.nil(eids) ? [] : eids;

            modal.signup({
                errs: errs,
                eids: eids,
                submit: function(data) {
                    console.log('signing up with data: ' );
                    console.log(data);

                    modal.notify({
                        title: 'Processing Signup',
                        message: 'We are signing you up for an account. This may take a few moments, so thank you for your patience.',
                        loading: true,
                        canOkay: false,
                        canExit: false
                    });

                    var request = $.ajax({
                        type: 'POST',
                        url: '/api/signup',
                        data: data,
                        dataType: 'json'
                    });

                    request.fail(function(jqXHR) {
                        console.log(jqXHR);
                        var response = (!util.is.nil(jqXHR.responseJSON)) ? jqXHR.responseJSON : null;

                        if(!util.is.nil(response) && !util.is.nil(response.err)) {
                            if(response.err == 'Email address already in use.') {
                                boxWithErrors = 'modalSignupEmail';
                                errorStatement = 'This email address is already being used';
                                internal.nav.signup([errorStatement], [boxWithErrors]);
                            } else {
                                modal.notify({
                                    title: 'Error',
                                    message: 'There was a problem while signing you up for an account. If this error persists, please contact us for support.'
                                });
                            }
                        } else {
                            modal.notify({
                                title: 'Error',
                                message: 'There was a problem while signing you up for an account. If this error persists, please contact us for support.'
                            });
                        }

                        
                    });

                    request.done(function(data) {
                        signupData = {
                            'User': data.user._id,
                            'Username': data.user.username,
                            'Role': data.user.role,
                            'Email': data.user.email,
                            'Source': 'Internal'
                        };
                        mfMixpanel.track('User Registration', signupData);

                        window.location.reload(true);
                    });
                }
            });
        }
    },

    userMenu: {
        shown: false,
        clicked: false,
        firstclick: true,

        init: function() {
            var isTouchDevice = ('ontouchstart' in window || 'onmsgesturechange' in window),
            $button = $('.usertab'),
            $menu = $('.user-dropdown');
            
            $button.on('click touchend touchmove', function(e) {
                if(!internal.userMenu.shown && !internal.userMenu.clicked && e.type != 'touchmove') {
                    internal.userMenu.clicked = true;
                    setTimeout(function() { internal.userMenu.clicked = false; }, 300);

                    $menu.stop().fadeIn(300, function() {
                        internal.userMenu.shown = true;
                    });
                }
            });
            
            $button.on('mouseenter', function(e) {
                $menu.stop().fadeIn(300, function() {
                    internal.userMenu.shown = true;
                });
            });
            $button.on('mouseleave', function(e) {
                $menu.stop().fadeOut(300);
            });

            $button.on('touchstart', function(e) {
                $button.off('mouseenter mouseleave');
                if(internal.userMenu.firstclick) {
                    $button.click();
                    internal.userMenu.firstclick = false;
                }
            });

            $(document).on('click touchend touchmove', function(e) {
                if(e.type != 'touchmove' && !internal.userMenu.clicked && internal.userMenu.shown && e.target.id != 'usertab' && e.target.id != 'user-dropdown' && internal.userMenu.shown) {
                    internal.userMenu.clicked = true;
                    setTimeout(function() { internal.userMenu.clicked = false; }, 300);

                    internal.userMenu.shown = false;
                    $menu.stop().fadeOut(300);
                }
            });
        }
    },

    sideMenu: {
        shown: true,
        clicked: false,

        init: function() {
            // hide all of the groups by default
            // $('#vehicle-profile-group, #personal-profile-group, #accounting-group').hide();

            $('#open-side-menu-hamburger').on('click touchend touchmove', function(e) {
                if(!internal.sideMenu.shown && !internal.sideMenu.clicked && e.type != 'touchmove') {
                    internal.sideMenu.clicked = true;
                    setTimeout(function() { internal.sideMenu.clicked = false; }, 300);

                    $('#side-menu').stop().fadeIn(300, function() {
                        internal.sideMenu.shown = true;
                    });
                }
            });            

            $(document).on('click touchend touchmove', function(e) {
                if(e.type != 'touchmove' && !internal.sideMenu.clicked && internal.sideMenu.shown && e.target.id != 'desktop-side-hamburger' && e.target.id != 'mobile-side-hamburger' && internal.sideMenu.shown && $(window).width() <= 992) {
                    internal.sideMenu.clicked = true;
                    setTimeout(function() { internal.sideMenu.clicked = false; }, 300);

                    internal.sideMenu.shown = false;
                    $('#side-menu').stop().fadeOut(300);
                }
            });

            $('#side-menu-hamburger').on('click touchend touchmove', function(e) {
                if(internal.sideMenu.shown && e.type != 'touchmove' && internal.sideMenu.shown && !internal.sideMenu.clicked) {
                    internal.sideMenu.clicked = true;
                    setTimeout(function() { internal.sideMenu.clicked = false; }, 300);

                    console.log("Side Menu Hamburger: " + event.type);
                    internal.sideMenu.shown = false;
                    $('#side-menu').stop().fadeOut(300);
                }
            });

            internal.sideMenu.marcusVsMenu();

            // this code coincides with the divs used for media query readings
            $(window).on('resize', function() {
                internal.sideMenu.marcusVsMenu();
            });
        },

        marcusVsMenu: function() {
            if($('#mq-992').is(':visible')) {
                internal.sideMenu.shown = true;
                $('#side-menu').show();
                $('#open-side-menu-hamburger').hide();
            } else {
                internal.sideMenu.shown = false;
                $('#side-menu').hide();
                $('#open-side-menu-hamburger').show();
            }
        }
    },
};
