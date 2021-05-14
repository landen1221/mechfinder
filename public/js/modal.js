var modal = {
    shown: false,
    element: null,

    nil: function(string) {
        return (string == '' || string == ' ' || string == '&nbsp;' || typeof(string) == 'undefined' || string == null);
    },

    isNumeric: function(obj) {
        return !jQuery.isArray( obj ) && (obj - parseFloat( obj ) + 1) >= 0;
    },

    init: function() {
        $('.modalContainer').on('click touchend touchmove', function(e) {
            e.stopPropagation();
        });

        $('#modalPhotosFiledrop').filedrop({
            callback: function(file, data) {
                modal.addPhoto(file, data);
            }
        });

        $('#modalPhotosFileInput').on('change', function(e) {
            var files = $(this).get(0).files;
            for(i=0; i<files.length; i++) {
                var file = files[i];
                var reader = new FileReader();
                reader.onload = (function(f) {
                    return function(event) {
                        modal.addPhoto(f, event.target.result);
                    }
                })(file);

                reader.readAsDataURL(file);
            }
        });

        $('#modalPhotosTriggerFile').on('click', function(e) {
            $('#modalPhotosFileInput').click();
        });

        $('#modalPhotosFiledrop').on('dragenter', function(e) {
            $(this).addClass('dragging');
        }).on('dragleave drop', function(e) {
            $(this).removeClass('dragging');
        });
    },

    photosList: [],
    photoRemoveClicked: false,
    addPhoto: function(file, data) {
        if(file.name.toLowerCase().match(/\.(jpg|jpeg|png|gif)$/)) {
            // create unique id for div and image tag based off of file name
            var id = file.name.replace(/\W/g, '');

            var alreadyAdded = false;
            for(i=0; i<modal.photosList.length; i++) {
                if(modal.photosList[i].id == id) {
                    alreadyAdded = true;
                    break;
                }
            }

            if(!alreadyAdded) {
                modal.photosList.push({
                    file: file,
                    data: data,
                    id: id
                });

                var html = '';
                html += '<div id="modalPhotosPhoto' + id + '" class="photo" style="display: none;">';
                    html += '<div id="modalPhotosRemove' + id + '" class="remove">';
                        html += '<a id="modalPhotosRemove-' + id + '" data-id="' + id + '" href="javascript:void(0);">X</a>';
                    html += '</div>';
                    html += '<img src="' + data + '" alt="' + file.name + '" />';
                html += '</div>';

                $('#modalPhotosPhotos').prepend(html);

                $('#modalPhotosRemove-' + id).on('click', function(e) {
                    var clickedId = $(this).attr('data-id');
                    modal.removePhoto(clickedId);
                });

                $('#modalPhotosPhoto' + id).stop().fadeIn(300);
            }
        }
    },

    removePhoto: function(photoId) {
        var index = -1;
        for(var i=0; i<modal.photosList.length; i++) {
            if(modal.photosList[i].id == photoId) {
                index = i;
                break;
            }
        }

        if(index >= 0) {
            modal.photosList.splice(index, 1);
            $('#modalPhotosPhoto' + photoId).stop().fadeOut(300, function() {
                $(this).remove();
            });

            $('#modalPhotosFileInput').val('');
        }
    },

    photos: function(options) {
        var defaults = {
            title: '',
            message: '',
            submit: function(vehicle) {},
            cancel: function() {},
            back: function() {},
            exit: null,
            submitText: 'Submit',
            canCancel: true,
            canBack: false,
            cancelText: 'Cancel',
            cancelOnExit: true,
            canExit: true,
            allowEmpty: false
        }

        modal.photosList = [];
        $('#modalPhotosPhotos .photo').remove();
        $('#modalPhotosFileInput').val('');

        var settings = $.extend({}, defaults, options);

        if(!settings.exit) {
            if(settings.cancelOnExit) {
                settings.exit = function() {
                    return settings.cancel();
                }
            } else {
                settings.exit = function() {};
            }
        }

        var actualSubmit = function(vehicle) {
            modal.hide($('#modalPhotos'));
            settings.submit(vehicle);
        }

        var actualCancel = function() {
            modal.hide($('#modalPhotos'));
            settings.cancel();
        }

        var actualBack = function() {
            modal.hide($('#modalPhotos'));
            settings.back();
        }

        var actualExit = function() {
            modal.hide($('#modalPhotos'));
            settings.exit();
        }

        if(settings.title) {
            $('#modalPhotosTitle').html(settings.title);
        }

        if(settings.message) {
            $('#modalPhotosMessage').html(settings.message);
        }

        if(settings.submitText) {
            $('#modalPhotosTrue').html(settings.submitText);
        }

        if(settings.cancelText) {
            $('#modalPhotosFalse').html(settings.cancelText);
        }

        var updateStatus = function(message, err) {
            err = (typeof(err) === 'boolean') ? err : false;

            $('#modalPhotosStatus').stop().fadeTo(300, 0, function() {
                $(this).html(message).stop().fadeTo(300, 1);
            });
        }

        var trySubmit = function(photos) {
            var errs = [];
            var eids = [];

            if(!settings.allowEmpty && photos.length <= 0) {
                errs.push('You must add a photo before continuing');
            }

            if(errs.length > 0) {
                var err = errs[0];
                if(errs.length > 1) {
                    err = 'Please correct the highlighted errors before adding';
                }

                for(var i=0; i<eids.length; i++) {
                    $('#' + eids[i]).addClass('error');
                }

                updateStatus(err, true);
            } else {
                actualSubmit(photos);
            }
        }

        $('#modalPhotosTrue').off('click').on('click', function(e) {
            trySubmit(modal.photosList);
        });

        $('#modalPhotosFalse').off('click');
        if(settings.canExit && settings.canCancel) {
            $('#modalPhotosFalse').on('click', function(e) {
                actualCancel();
            }).show();
        } else {
            $('#modalPhotosFalse').hide();
        }

        $('#modalPhotosBack').off('click').hide();;
        if(settings.canBack) {
            $('#modalPhotosBack').on('click', function(e) {
                actualBack();
            }).show();
        }

        modal.show($('#modalPhotos'), settings.canExit, actualExit);
    },

    notifyInterval: null,
    notify: function(options) {
        var defaults = {
            title: '',
            message: '',
            okay: function() {},
            exit: function() {},
            canExit: true,
            canOkay: true,
            okayText: 'Okay',
            condensed: true,
            loading: false,
            loadingColor: '',
            loadingKind: 'spinner',
            loadingSpinner: 'fa-cog'
        };

        var settings = $.extend({}, defaults, options);

        var actualOkay = function() {
            if(settings.canOkay) {
                modal.hide($('#modalNotification'));
                settings.okay();
            }
        }

        var actualExit = function() {
            modal.hide($('#modalNotification'));
            settings.exit();
        }

        $('#modalNotificationProgress').css('width', '0%');

        if(settings.title) {
            $('#modalNotificationTitle').html(settings.title);
        }

        if(settings.message) {
            $('#modalNotificationMessage').html(settings.message);
        }

        if(settings.canExit) {
            $('#modalNotificationOkay').text(settings.okayText);
        }

        $('#modalNotificationOkay').hide();
        if(settings.canOkay) {
            $('#modalNotificationOkay').show();
        }

        $('#modalNotification').addClass('condensed');
        if(!settings.condensed) {
            $('#modalNotification').removeClass('condensed');
        }

        $('#modalNotificationOkay').off('click').on('click', function(e) {
            actualOkay();
        });

        $('#modalNotificationLoading, #modalNotificationSpinner').hide();
        $('#modalNotificationProgress').css('width', '0%');
        if(!util.is.nil(modal.notifyInterval)) clearInterval(modal.notifyInterval);
        if(settings.loading) {
            if(settings.loadingKind == 'bar') {
                $('#modalNotificationLoading').removeClass('gray blue red');
                if(settings.loadingColor) $('#modalNotificationLoading').addClass(settings.loadingColor);

                $('#modalNotificationLoading').show();
                modal.notifyInterval = setInterval(function() {
                    var w = $('#modalNotificationProgress').width();
                    var c = $('#modalNotificationLoading').width();
                    var p = parseInt(Math.round((w/c) * 100));
                    if(p < 95) {
                        $('#modalNotificationProgress').css('width', (p+4) + '%');
                    } else {
                        if(!util.is.nil(modal.notifyInterval)) clearInterval(modal.notifyInterval);
                    }
                }, 100);
            } else if(settings.loadingKind == 'spinner') {
                $('#modalNotificationSpinner i').removeClass().addClass('fa ' + settings.loadingSpinner + ' fa-spin fa-fw');
                $('#modalNotificationSpinner').show();
            }
        }

        modal.show($('#modalNotification'), settings.canExit, actualExit);
    },

    socialClicked: false,
    social: function(options) {
        var defaults = {
            title: '',
            message: '',
            skip: function() {},
            exit: function() {},
            tile: function(platform) {},
            canExit: true,
            canSkip: true,
            skipText: 'No Thanks',
            condensed: true,
            tilesExit: true
        };

        var settings = $.extend({}, defaults, options);

        var actualSkip = function() {
            if(settings.canSkip) {
                modal.hide($('#modalSocial'));
                settings.skip();
            }
        }

        var actualExit = function() {
            modal.hide($('#modalSocial'));
            settings.exit();
        }

        var actualTile = function(platform) {
            modal.hide($('#modalSocial'));
            settings.tile(platform);
        }

        if(settings.title) {
            $('#modalSocialTitle').html(settings.title);
        }

        if(settings.message) {
            $('#modalSocialMessage').html(settings.message);
        }

        if(settings.canExit) {
            $('#modalSocialSkip').text(settings.skipText);
        }

        $('#modalSocialSkip').hide();
        if(settings.canSkip) {
            $('#modalSocialSkip').show();
        }

        $('#modalSocial').addClass('condensed');
        if(!settings.condensed) {
            $('#modalSocial').removeClass('condensed');
        }

        $('#modalSocialSkip').off('click').on('click', function(e) {
            actualSkip();
        });

        $('#modalSocial .social-tile').off('click touchmove touchend').on('click touchmove touchend', function(e) {
            if(e.type != 'touchmove' && !modal.socialClicked) {
                modal.socialClicked = true;
                setTimeout(function() {
                    modal.socialClicked = false;
                }, 300);

                actualTile($(this).attr('data-platform'));
            }
        });

        modal.show($('#modalSocial'), settings.canExit, actualExit);
    },

    login: function(options) {
        var defaults = {
            title: 'Login',
            message: 'Enter your email and password below to login or <a href="/auth/facebook?facebookRedirect=' + window.location.href + '">login using Facebook</a>:',
            submit: function(email, password) {},
            cancel: function() {},
            exit: null,
            submitText: 'Submit',
            cancelText: 'Cancel',
            cancelOnExit: true,
            canExit: true,
            err: false
        }

        var settings = $.extend({}, defaults, options);
        console.log(settings.message);

        if(!settings.exit) {
            if(settings.cancelOnExit) {
                settings.exit = function() {
                    return settings.cancel();
                }
            } else {
                settings.exit = function() {};
            }
        }

        var actualSubmit = function(email, password) {
            modal.hide($('#modalLogin'));
            settings.submit(email, password);
        }

        var actualCancel = function() {
            modal.hide($('#modalLogin'));
            settings.cancel();
        }

        var actualExit = function() {
            modal.hide($('#modalLogin'));
            settings.exit();
        }

        if(settings.title) {
            $('#modalLoginTitle').html(settings.title);
        }

        if(settings.message) {
            $('#modalLoginMessage').html(settings.message);
        } else {
            $('#modalLoginMessage').html(defaults.message);
        }

        if(settings.submitText) {
            $('#modalLoginSubmit').html(settings.submitText);
        }

        if(settings.cancelText) {
            $('#modalLoginCancel').html(settings.cancelText);
        }

        var updateStatus = function(message, err) {
            err = (typeof(err) === 'boolean') ? err : false;

            $('#modalLoginStatus').stop().fadeTo(300, 0, function() {
                if(err) $(this).addClass('error');
                else $(this).removeClass('error');
                $(this).html(message).stop().fadeTo(300, 1);
            });
        }

        if(settings.err) $('#modalLoginEmail, #modalLoginPassword').addClass('error');
        else $('#modalLoginEmail, #modalLoginPassword').removeClass('error');
        $('#modalLoginSubmit').off('click').on('click', function(e) {
            $('#modalLoginEmail, #modalLoginPassword').removeClass('error');

            var email = $('#modalLoginEmail').val();
            var password = $('#modalLoginPassword').val();
            if(!util.is.email(email)) $('#modalLoginEmail').addClass('error');
            if(util.is.nil(password)) $('#modalLoginPassword').addClass('error');

            if(!util.is.email(email) || util.is.nil(password)) updateStatus('Please correct the highlighted fields before submitting', true);
            else actualSubmit(email, password);
        });

        $('#modalLoginCancel').off('click');
        if(settings.canExit) {
            $('#modalLoginCancel').on('click', function(e) {
                actualCancel();
            }).show();
        } else {
            $('#modalLoginCancel').hide();
        }

        $('#modalLoginPassword').on('keyup', function(e) {
            if (e.which == 13) {
                $('#modalLoginSubmit').click();
            }
        });

        modal.show($('#modalLogin'), settings.canExit, actualExit);
        $('#modalLoginEmail').focus();
    },

    signup: function(options) {
        var defaults = {
            title: 'Sign Up',
            message: 'Fill out the fields below to sign up, or <a href="/auth/facebook?facebookRedirect=' + window.location.href + '">sign up using Facebook</a>:',
            submit: function(data) {},
            cancel: function() {},
            exit: null,
            submitText: 'Submit',
            cancelText: 'Cancel',
            cancelOnExit: true,
            canExit: true,
            errs: [],
            eids: []
        }

        var settings = $.extend({}, defaults, options);

        if(!settings.exit) {
            if(settings.cancelOnExit) {
                settings.exit = function() {
                    return settings.cancel();
                }
            } else {
                settings.exit = function() {};
            }
        }

        var actualSubmit = function(data) {
            modal.hide($('#modalSignup'));
            settings.submit(data);
        }

        var actualCancel = function() {
            modal.hide($('#modalSignup'));
            settings.cancel();
        }

        var actualExit = function() {
            modal.hide($('#modalSignup'));
            settings.exit();
        }

        if(settings.title) {
            $('#modalSignupTitle').html(settings.title);
        }

        if(settings.message) {
            $('#modalSignupMessage').html(settings.message);
        }

        if(settings.submitText) {
            $('#modalSignupSubmit').html(settings.submitText);
        }

        if(settings.cancelText) {
            $('#modalSignupCancel').html(settings.cancelText);
        }

        var updateStatus = function(message, err) {
            err = (typeof(err) === 'boolean') ? err : false;

            $('#modalSignupStatus').stop().fadeTo(300, 0, function() {
                if(err) $(this).addClass('error');
                else $(this).removeClass('error');
                $(this).html(message).stop().fadeTo(300, 1);
            });
        }

        $('#modalSignup input').removeClass('error');
        for(var i=0; i<settings.eids.length; i++) {
            $('#' + settings.eids[i]).addClass('error');
        }

        if(settings.errs.length > 1) {
            updateStatus('Please correct the highlighted errors before continuing', true);
        } else if(settings.errs.length == 1) {
            updateStatus(settings.errs[0], true);
        }

        $('#modalSignupSubmit').off('click').on('click', function(e) {
            $('#modalSignup input').removeClass('error');

            var data = {
                first: $('#modalSignupFirst').val(),
                last: $('#modalSignupLast').val(),
                email: $('#modalSignupEmail').val(),
                password: $('#modalSignupPassword').val(),
                terms: $('#modalSignupTerms').is(':checked'),
                role: $('#modalSignupRole').val()
            }

            var errs = [];
            var eids = []
            if(util.is.nil(data.first)) {
                errs.push('You must enter your first name');
                eids.push('modalSignupFirst');
            }

            if(util.is.nil(data.last)) {
                errs.push('You must enter your last name');
                eids.push('modalSignupLast');
            }

            if(!util.is.email(data.email)) {
                errs.push('You must enter a valid email');
                eids.push('modalSignupEmail');
            }

            if(util.is.nil(data.password)) {
                errs.push('You must enter a password');
                eids.push('modalSignupPassword');
            } else if(data.password.length < 6) {
                errs.push('Your password must be 6 characters or more');
                eids.push('modalSignupPassword');
            }

            if(eids.length > 0) {
                var etxt = (errs.length > 1) ? 'Please correct the highlighted errors before continuing' : errs[0];
                updateStatus(etxt, true);

                for(var i=0; i<eids.length; i++) {
                    $('#' + eids[i]).addClass('error');
                }
            } else {
                if(!data.terms) {
                    updateStatus('You must agree to our Terms &amp; Conditions before continuing', true);
                } else {
                    actualSubmit(data);
                }
            }
        });

        $('#modalSignupCancel').off('click');
        if(settings.canExit) {
            $('#modalSignupCancel').on('click', function(e) {
                actualCancel();
            }).show();
        } else {
            $('#modalSignupCancel').hide();
        }

        modal.show($('#modalSignup'), settings.canExit, actualExit);
        $('#modalSignupFirst').focus();
    },

    canHide: false,
    show: function(modalElement, canExit, actualExit) {
        canExit = (typeof(canExit) === 'boolean') ? canExit : true;
        actualExit = (typeof(actualExit) === 'function') ? actualExit : function() {};

        $('.modal').stop().fadeOut(300);

        if(!canExit) {
            $('.modalExit').hide();
        } else {
            $('.modalExit').show();
        }

        $('.modal').off('click touchend touchmove');
        $('.modalExit').off('click');
        if(canExit) {
            $('.modal').on('click touchend touchmove', function(e) {
                if(e.type != 'touchmove') {
                    actualExit();
                    modal.hide($(this));
                }
            });

            $('.modalExit').on('click', function(e) {
                actualExit();
                modal.hide($(this).parents('.modal'));
            });
        }

        modalElement.stop().fadeIn(300, function() {
            modal.canHide = true;
        });
        modal.shown = true;
        modal.element = modalElement;
    },

    hide: function(modalElement, force) {
        force = (typeof force == 'boolean') ? force : false;
        if(modal.canHide || force) {
            if(!util.is.nil(modalElement)) {
                modalElement.stop().fadeOut(300);
            } else {
                if(!util.is.nil(modal.element)) modal.element.stop().fadeOut(300);
            }

            modal.canHide = false;
            modal.shown = false;
            modal.element = null;
        }
    },

    cancelJob: function(options) {
        var defaults = {
            title: '',
            message: 'Why are you canceling your job?',
            submit: function(text) {},
            canExit: true,
            exit: null
        };

        var settings = $.extend({}, defaults, options);

        var actualExit = function() {
            modal.hide($('#modalCancelJob'));
            settings.exit();
        };

        var actualSubmit = function(text) {
            modal.hide($('#modalCancelJob'));
            settings.submit(text);
        };

        if(settings.title) {
            $('#modalCancelJobTitle').html(settings.title);
        }

        if(settings.message) {
            $('#modalCancelJobMessage').html(settings.message);
        }

        $('#modalCancelJobTrue').off().on('click', function() {
            var value = $('input:radio[name=cancel-reason]:checked').attr('value');
            if(util.is.nil(value)) {
                value = $('#other-comments').val();
            }
            actualSubmit(value);
        });        

        $('#other-comments').slideUp(0);
        $('#modalCancelJobTrue').slideUp(0);

        $('#other').off().on('click', function() {
            $('#other-comments').slideDown(100);
        });

        $('input:radio[name=cancel-reason]').on('click', function() {
            $('#modalCancelJobTrue').slideDown(100);
        });

        modal.show($('#modalCancelJob'), settings.canExit, actualExit);
    },

    select: function(options) {
        var defaults = {
            title: '',
            message: 'Choose from the options listed below: ',
            submit: function(text) {},
            cancel: function() {},
            back: function() {},
            exit: null,
            submitText: 'Next',
            cancelText: 'Cancel',
            cancelOnExit: true,
            canCancel: true,
            canExit: true,
            canBack: false,
            centerText: false,
            clearText: true,
            options: [
                { label: 'Yes', value: '1' },
                { label: 'No', value: '0' }
            ],
            allowEmptyLabels: false,
            allowEmptyValues: false,
            selectedIndex: 0
        };

        var settings = $.extend({}, defaults, options);

        if(!settings.exit) {
            if(settings.cancelOnExit) {
                settings.exit = function() {
                    return settings.cancel();
                };
            } else {
                settings.exit = function() {};
            }
        }

        var actualSubmit = function(text) {
            modal.hide($('#modalSelect'));
            settings.submit(text);
        };

        var actualCancel = function() {
            modal.hide($('#modalSelect'));
            settings.cancel();
        };

        var actualBack = function() {
            modal.hide($('#modalSelect'));
            settings.back();
        };

        var actualExit = function() {
            modal.hide($('#modalSelect'));
            settings.exit();
        };

        $('#modalSelectSelect').html('');
        for(var i=0; i<settings.options.length; i++) {
            option = settings.options[i];

            if(typeof(option) === 'string') {
                opt = { label: option, value: option }
            } else {
                opt = option
            }

            if(!(util.is.nil(opt.value) && util.is.nil(opt.label))) {
                if(util.is.nil(opt.value) && !settings.allowEmptyValues) {
                    opt['value'] = opt.label;
                } else if(util.is.nil(opt.label) && !settings.allowEmptyLabels) {
                    opt['label'] = opt.value;
                }

                $('#modalSelectSelect').append('<option value="' + opt.value + '">' + opt.label + '</option>');
            }
        }
        $('#modalSelectSelect option').eq(settings.selectedIndex).prop('selected', true);

        if(settings.title) {
            $('#modalSelectTitle').html(settings.title);
        }

        if(settings.message) {
            $('#modalSelectMessage').html(settings.message);
        }

        if(settings.submitText) {
            $('#modalSelectTrue').html(settings.submitText);
        }

        if(settings.cancelText) {
            $('#modalSelectFalse').html(settings.cancelText);
        }

        $('#modalSelectTrue').off('click').on('click', function(e) {
            actualSubmit($('#modalSelectSelect').val());
        });

        $('#modalSelectFalse').off('click');
        if(settings.canExit && settings.canCancel) {
            $('#modalSelectFalse').on('click', function(e) {
                actualCancel();
            }).show();
        } else {
            $('#modalSelectFalse').hide();
        }

        $('#modalSelectBack').off('click').hide();
        if(settings.canBack) {
            $('#modalSelectBack').on('click', function(e) {
                actualBack();
            }).show();
        }

        modal.show($('#modalSelect'), settings.canExit, actualExit);
    },

    input: function(options) {
        var defaults = {
            title: '',
            message: 'Please enter content here:',
            submit: function(text) {},
            cancel: function() {},
            back: function() {},
            exit: null,
            submitText: 'Next',
            submitTextFixed: true,
            cancelText: 'Cancel',
            cancelOnExit: true,
            canExit: true,
            canCancel: true,
            canBack: false,
            centerText: false,
            clearText: true,
            placeholder: '',
            defaultValue: '',
            textarea: false,
            allowBlank: false,
            condensed: true
        }

        var settings = $.extend({}, defaults, options);

        if(!settings.exit) {
            if(settings.cancelOnExit) {
                settings.exit = function() {
                    return settings.cancel();
                }
            } else {
                settings.exit = function() {};
            }
        }

        var actualSubmit = function(text) {
            modal.hide($('#modalTextbox'));
            settings.submit(text);
        };

        var actualCancel = function() {
            modal.hide($('#modalTextbox'));
            settings.cancel();
        };

        var actualBack = function() {
            modal.hide($('#modalTextbox'));
            settings.back();
        };

        var actualExit = function() {
            modal.hide($('#modalTextbox'));
            settings.exit();
        };

        if(settings.title) {
            $('#modalTextboxTitle').html(settings.title);
        }

        if(settings.message) {
            $('#modalTextboxMessage').html(settings.message);
        }

        if(settings.submitText) {
            $('#modalTextboxTrue').html(settings.submitText);
        }

        if(!settings.submitTextFixed) {
            $('#modalTextboxTrue').addClass('unfixed');
        } else {
            $('#modalTextboxTrue').removeClass('unfixed');
        }

        if(settings.cancelText) {
            $('#modalTextboxFalse').html(settings.cancelText);
        }

        $('#modalTextboxText').attr('placeholder', settings.placeholder);

        $('#modalTextboxText').removeClass('centered');
        if(settings.centerText) {
            $('#modalTextboxText').addClass('centered');
        }

        $('#modalTextbox').addClass('condensed');
        if(!settings.condensed) {
            $('#modalTextbox').removeClass('condensed');
        }

        if(settings.textarea) {
            $('#modalTextboxInput').hide();
            $('#modalTextboxArea').show();
        } else {
            $('#modalTextboxArea').hide();
            $('#modalTextboxInput').show();
        }

        var updateStatus = function(message, err) {
            err = (typeof(err) === 'boolean') ? err : false;

            $('#modalTextboxStatus').stop().fadeTo(300, 0, function() {
                if(err) $(this).addClass('error');
                else $(this).removeClass('error');
                $(this).html(message).stop().fadeTo(300, 1);
            });
        }

        $('#modalTextboxText, #modalTextboxTextarea').removeClass('error');
        $('#modalTextboxTrue').off('click').on('click', function(e) {
            $('#modalTextboxText, #modalTextboxTextarea').removeClass('error');

            var source = (!settings.textarea) ? $('#modalTextboxText').val() : $('#modalTextboxTextarea').val();

            if(util.is.nil(source) && !settings.allowBlank) {
                updateStatus('Please fill out the highlighted field', true);
                $('#modalTextboxText, #modalTextboxTextarea').addClass('error');
            } else {
                actualSubmit(source);
            }
        });

        $('#modalTextboxFalse').off('click');
        if(settings.canExit && settings.canCancel) {
            $('#modalTextboxFalse').on('click', function(e) {
                actualCancel();
            }).show();
        } else {
            $('#modalTextboxFalse').hide();
        }

        $('#modalTextboxBack').off('click').hide();
        if(settings.canBack) {
            $('#modalTextboxBack').on('click', function(e) {
                actualBack();
            }).show();
        }

        modal.show($('#modalTextbox'), settings.canExit, actualExit);

        if(settings.clearText) {
            if(!settings.textarea) $('#modalTextboxText').val('');
            else $('#modalTextboxTextarea').val('');
        } else {
            if(settings.defaultValue) {
                if(!settings.textarea) $('#modalTextboxText').val(settings.defaultValue);
                else $('#modalTextboxTextarea').val(settings.defaultValue);
            }
        }
    },

    confirm: function(options) {
        var defaults = {
            title: '',
            message: 'Are you sure?',
            yes: function() {},
            no: function() {},
            back: function() {},
            yesText: 'Yes',
            noText: 'No',
            canYes: true,
            canNo: true,
            canBack: false,
            exit: null,
            canExit: true,
            cancelOnExit: true,
            fixedButtons: true,
            yesColor: '',
            noColor: '',
            checkbox: false
        };

        var settings = $.extend({}, defaults, options);

        if(!settings.exit) {
            if(settings.cancelOnExit) {
                settings.exit = function() {
                    return settings.no();
                }
            } else {
                settings.exit = function() {};
            }
        }

        var actualYes = function() {
            modal.hide($('#modalConfirmation'));
            settings.yes();
        };

        var actualNo = function() {
            modal.hide($('#modalConfirmation'));
            settings.no();
        };

        var actualBack = function() {
            modal.hide($('#modalConfirmation'));
            settings.back();
        };

        var actualExit = function() {
            modal.hide($('#modalConfirmation'));
            settings.exit();
        };

        if(settings.title) {
            $('#modalConfirmationTitle').html(settings.title);
        }

        if(settings.message) {
            $('#modalConfirmationMessage').html(settings.message);
        }

        if(settings.yesText) {
            $('#modalConfirmationTrue').html(settings.yesText);
        }

        if(settings.noText) {
            $('#modalConfirmationFalse').html(settings.noText);
        }

        if(settings.checkbox) {
            $('#modalConfirmationCheckbox').show();
        } else {
            $('#modalConfirmationCheckbox').hide();
        }

        $('#modalConfirmationTrue, #modalConfirmationFalse').removeClass('unfixed');
        if(!settings.fixedButtons) {
            $('#modalConfirmationTrue, #modalConfirmationFalse').addClass('unfixed');
        }

        $('#modalConfirmationTrue').removeClass('green red').addClass('blue');
        if(!util.is.nil(settings.yesColor)) {
            $('#modalConfirmationTrue').removeClass('blue').addClass(settings.yesColor);
        }

        $('#modalConfirmationFalse').removeClass('green blue').addClass('red');
        if(!util.is.nil(settings.noColor)) {
            $('#modalConfirmationFalse').removeClass('red').addClass(settings.noColor);
        }

        $('#modalConfirmationTrue').off('click').on('click', function(e) {
            if(settings.canYes) {
                $('#modalConfirmationCheckbox').removeClass('error');
                var checked = settings.checkbox && $('#modalConfirmationChecked').is(':checked');
                var canYes = true;
                if(settings.forceChecked) canYes = checked;

                if(canYes) actualYes();
                else if(settings.forceChecked && !checked) {
                    $('#modalConfirmationCheckbox').addClass('error');
                }
            }
        });

        $('#modalConfirmationFalse').off('click');
        if(settings.canExit || settings.canNo) {
            $('#modalConfirmationFalse').on('click', function(e) {
                if(settings.canNo) {
                    actualNo();
                }
            }).show();
        } else {
            $('#modalConfirmationFalse').hide();
        }

        modal.show($('#modalConfirmation'), settings.canExit, actualExit);

        $('#modalConfirmationTrue').hide();
        if(settings.canYes) {
            $('#modalConfirmationTrue').show();
        }

        $('#modalConfirmationFalse').hide();
        if(settings.canNo) {
            $('#modalConfirmationFalse').show();
        }

        $('#modalConfirmationBack').off('click').hide();
        if(settings.canBack) {
            $('#modalConfirmationBack').on('click', function(e) {
                actualBack();
            }).show();
        }
    },

    mfRating: function(options) {
        var defaults = {
            submit: function(rating, feedback) {},
            cancel: function() {},
            exit: null,
            submitText: 'Submit',
            cancelText: 'Cancel',
            cancelOnExit: true,
            canExit: true,
            centerText: false
        }

        var settings = $.extend({}, defaults, options);

        if(!settings.exit) {
            if(settings.cancelOnExit) {
                settings.exit = function() {
                    return settings.cancel();
                }
            } else {
                settings.exit = function() {};
            }
        }

        var actualSubmit = function(rating, feedback) {
            modal.hide($('#modalMFRating'));
            settings.submit(rating, feedback);
        }

        var actualCancel = function() {
            modal.hide($('#modalMFRating'));
            settings.cancel();
        }

        var actualExit = function() {
            modal.hide($('#modalMFRating'));
            settings.exit();
        }

        var updateStatus = function(message, err) {
            err = (typeof(err) === 'boolean') ? err : false;

            $('#modalMFRatingStatus').stop().fadeTo(300, 0, function() {
                if(err) $(this).addClass('error');
                else $(this).removeClass('error');
                $(this).html(message).stop().fadeTo(300, 1);
            });
        }

        if(settings.submitText) {
            $('#modalMFRatingTrue').html(settings.submitText);
        }

        if(settings.cancelText) {
            $('#modalMFRatingFalse').html(settings.cancelText);
        }

        if(settings.clearText) {
            $('#modalMFRatingInputText').val('');
        }

        $('#modalMFRatingTrue').off('click').on('click', function(e) {
            var rating = parseInt($('#modalMFRating .selected').attr('data-val')) || 0;
            if(rating <= 0) {
                updateStatus('You must select a rating before submitting', true);
            } else {
                updateStatus('');
                actualSubmit(rating, $('#modalMFRatingInputText').val());
            }
        });

        $('#modalMFRatingFalse').off('click');
        if(settings.canExit) {
            $('#modalMFRatingFalse').on('click', function(e) {
                actualCancel();
            }).show();
        } else {
            $('#modalMFRatingFalse').hide();
        }

        $('.faceAnchor').removeClass('selected hovered override');
        $('#modalMFRatingFaces .face a').off('click').on('click', function(e) {
            $('.faceAnchor').removeClass('selected');
            $(this).addClass('selected');
        }).off('mouseenter').on('mouseenter', function(e) {
            $('.faceAnchor').removeClass('hovered');
            $(this).addClass('hovered');
        }).off('mouseleave').on('mouseleave', function(e) {
            $('.faceAnchor').removeClass('hovered');
        });

        modal.show($('#modalMFRating'), settings.canExit, actualExit);
    },

    rating: function(options) {
        var defaults = {
            submit: function(rating, feedback) {},
            cancel: function() {},
            exit: null,
            submitText: 'Submit',
            cancelText: 'Cancel',
            cancelOnExit: true,
            canExit: true,
            centerText: false,
            targetRole: ''
        }

        var settings = $.extend({}, defaults, options);

        if(settings.targetRole != 'buyer' && settings.targetRole != 'seller') return null;

        if(!settings.exit) {
            if(settings.cancelOnExit) {
                settings.exit = function() {
                    return settings.cancel();
                }
            } else {
                settings.exit = function() {};
            }
        }

        var actualSubmit = function(rating, feedback) {
            modal.hide($('#modalRating'));
            settings.submit(rating, feedback);
        }

        var actualCancel = function() {
            modal.hide($('#modalRating'));
            settings.cancel();
        }

        var actualExit = function() {
            modal.hide($('#modalRating'));
            settings.exit();
        }

        var updateStatus = function(message, err) {
            err = (typeof(err) === 'boolean') ? err : false;

            $('#modalRatingStatus').stop().fadeTo(300, 0, function() {
                if(err) $(this).addClass('error');
                else $(this).removeClass('error');
                $(this).html(message).stop().fadeTo(300, 1);
            });
        }

        if(settings.submitText) {
            $('#modalRatingTrue').html(settings.submitText);
        }

        if(settings.cancelText) {
            $('#modalRatingFalse').html(settings.cancelText);
        }

        if(settings.clearText) {
            $('#modalRatingInputText').val('');
        }

        $('#modalRatingTrue').off('click').on('click', function(e) {
            var rating = $('#modalRating .selected').length;
            if(rating <= 0) {
                updateStatus('You must select a rating before submitting', true);
            } else {
                updateStatus('');
                actualSubmit(rating, $('#modalRatingInputText').val());
            }
        });

        $('#modalRatingFalse').off('click');
        if(settings.canExit) {
            $('#modalRatingFalse').on('click', function(e) {
                actualCancel();
            }).show();
        } else {
            $('#modalRatingFalse').hide();
        }

        if(settings.targetRole == 'buyer') {
            $('#modalRatingStars').show();
            $('#modalRatingWrenches').hide();
            $('#modalRating span.roleIdentifier').html('Customer');
            $('#modalRating span.kindIdentifier').html('Stars');
        } else {
            $('#modalRatingWrenches').show();
            $('#modalRatingStars').hide();
            $('#modalRating span.roleIdentifier').html('Mechanic');
            $('#modalRating span.kindIdentifier').html('Wrenches');
        }

        $('.starAnchor, .wrenchAnchor').removeClass('selected');

        $('#modalRatingStars .star a, #modalRatingWrenches .wrench a').off('click').on('click', function(e) {
            var dval = parseInt($(this).attr('data-val'));
            var dkind = $(this).attr('data-kind');
            var kind = dkind.charAt(0).toUpperCase() + dkind.slice(1);

            $('.'+dkind+'Anchor').removeClass('selected');

            var c = dval;
            while(c > 0) {
                $('#modalRating'+kind+c).addClass('selected');
                c--;
            }
        }).off('mouseenter').on('mouseenter', function(e) {
            var dval = parseInt($(this).attr('data-val'));
            var dkind = $(this).attr('data-kind');
            var kind = dkind.charAt(0).toUpperCase() + dkind.slice(1);

            $('.'+dkind+'Anchor').removeClass('hovered');

            var c = dval;
            while(c > 0) {
                $('#modalRating'+kind+c).addClass('hovered');
                c--;
            }

            c = dval+1;
            while(c <= 5) {
                $('#modalRating'+kind+c).addClass('override');
                c++;
            }
        }).off('mouseleave').on('mouseleave', function(e) {
            var dkind = $(this).attr('data-kind');
            $('.'+dkind+'Anchor').removeClass('hovered override');
        });

        modal.show($('#modalRating'), settings.canExit, actualExit);
    },

    payment: function(options) {
        var defaults = {
            title: 'Payment Information',
            fields: [],
            message: 'Enter your payment information below (all fields required):',
            submit: function() {},
            cancel: function() {},
            submitText: 'Submit',
            cancelText: 'Cancel',
            canSubmit: true,
            canCancel: true,
            exit: null,
            canExit: true,
            cancelOnExit: true,
            fixedButtons: true,
            centerText: false,
            submitColor: '',
            cancelColor: ''
        }

        var settings = $.extend({}, defaults, options);

        if(!settings.exit) {
            if(settings.cancelOnExit) {
                settings.exit = function() {
                    return settings.cancel();
                }
            } else {
                settings.exit = function() {};
            }
        }

        var actualSubmit = function(info) {
            modal.hide($('#modalPayment'));
            settings.submit(info);
        }

        var actualCancel = function() {
            modal.hide($('#modalPayment'));
            settings.cancel();
        }

        var actualExit = function() {
            modal.hide($('#modalPayment'));
            settings.exit();
        }

        var updateStatus = function(message, err) {
            err = (typeof(err) === 'boolean') ? err : false;

            $('#modalPaymentStatus').stop().fadeTo(300, 0, function() {
                if(err) $(this).addClass('error');
                else $(this).removeClass('error');
                $(this).html(message).stop().fadeTo(300, 1);
            });
        }

        var checkFields = function() {
            return false;
        }

        if(settings.title) {
            $('#modalPaymentTitle').html(settings.title);
        }

        if(settings.message) {
            $('#modalPaymentMessage').html(settings.message);
        }

        for(var i=0; i<settings.fields.length; i++) {
            $('#'+settings.fields[i]).addClass('error');
        }

        if(settings.submitText) {
            $('#modalPaymentTrue').html(settings.submitText);
        }

        if(settings.cancelText) {
            $('#modalPaymentFalse').html(settings.cancelText);
        }

        $('#modalPaymentTrue, #modalPaymentFalse').removeClass('unfixed');
        if(!settings.fixedButtons) {
            $('#modalPaymentTrue, #modalPaymentFalse').addClass('unfixed');
        }

        $('#modalPaymentTrue').removeClass('green red').addClass('blue');
        if(!util.is.nil(settings.submitColor)) {
            $('#modalPaymentFalse').removeClass('blue').addClass(settings.submitColor);
        }

        $('#modalPaymentFalse').removeClass('green blue').addClass('red');
        if(!util.is.nil(settings.cancelColor)) {
            $('#modalPaymentFalse').removeClass('red').addClass(settings.cancelColor);
        }

        $('#modalPaymentTrue').off('click');
        if(settings.canSubmit) {
            $('#modalPaymentTrue').on('click', function(e) {
                var errs = [];
                var eids = [];

                $('#modalPayment .error').removeClass('error');

                var card = {
                    number: $('#modalPaymentCard').val(),
                    name: $('#modalPaymentNameOnCard').val(),
                    expiration: {
                        mm: $('#modalPaymentMM').val(),
                        yy: $('#modalPaymentYY').val()
                    },
                    cvc: $('#modalPaymentCVC').val(),
                    save: $('#modalPaymentSave').is(':checked')
                }

                var filteredCard = card.number.replace(/\D/g, '');
                if(util.is.nil(card.number) || !util.is.creditCard(filteredCard) || card.number.replace(/\s+/g, '').replace(/-/g, '') != filteredCard) {
                    errs.push('Please enter a valid card number');
                    eids.push('modalPaymentCard');
                } else {
                    card.number = filteredCard;
                }

                if(util.is.nil(card.name)) {
                    errs.push('Please enter the name displayed on the card');
                    eids.push('modalPaymentNameOnCard');
                }

                var filteredMonth = parseInt(card.expiration.mm.replace(/\D/g, ''));
                var errorMonth = false;
                if(util.is.nil(card.expiration.mm) || filteredMonth != card.expiration.mm || filteredMonth < 1 || filteredMonth > 12) {
                    errs.push('Please enter a valid expiration month');
                    eids.push('modalPaymentMM');
                    errorMonth = true;
                } else {
                    card.expiration.mm = filteredMonth;
                }

                if(card.expiration.yy.length == 2) card.expiration.yy = '20' + card.expiration.yy;
                var filteredYear = parseInt(card.expiration.yy.replace(/\D/g, ''));
                var errorYear = false;
                if(util.is.nil(card.expiration.yy) || filteredYear < 1975 || filteredYear > 2200 || filteredYear != card.expiration.yy) {
                    errs.push('Please enter a valid expiration year');
                    eids.push('modalPaymentYY');
                    errorYear = true;
                } else {
                    card.expiration.yy = filteredYear;
                }

                var expirationError = false;
                if(!errorMonth && !errorYear) {
                    var date = new Date();
                    if(date.getFullYear() > card.expiration.yy) {
                        expirationError = true;
                    }

                    if(date.getMonth() + 1 > card.expiration.mm && date.getFullYear() == card.expiration.yy) {
                        expirationError = true;
                    }

                    if(expirationError) {
                        errs.push('Your card has expired. Please provide a different card for payment');
                        eids.push('modalPaymentMM');
                        eids.push('modalPaymentYY');
                    }
                }

                if(util.is.nil(card.cvc) || card.cvc.length > 4 || card.cvc.length < 3) {
                    errs.push('Please enter the CVC number on the back of your card');
                    eids.push('modalPaymentCVC');
                }

                if(errs.length > 0) {
                    var err = errs[0];
                    if(errs.length > 1) {
                        err = 'Please correct the highlighted errors before continuing';
                    }

                    for(var i=0; i<eids.length; i++) {
                        $('#'+eids[i]).addClass('error');
                    }

                    updateStatus(err, true);
                } else {
                    actualSubmit(card);
                }
            });
        }

        $('#modalPaymentFalse').off('click');
        if(settings.canCancel) {
            $('#modalPaymentFalse').on('click', function(e) {
                actualCancel();
            }).show();
        } else {
            $('#modalPaymentFalse').hide();
        }

        modal.show($('#modalPayment'), settings.canExit, actualExit);
        $('#modalPaymentCard').focus();

        if(settings.canSubmit) {
            $('#modalPaymentTrue').show();
        } else {
            $('#modalPaymentTrue').hide();
        }
    },

    banking: function(options) {
        var defaults = {
            title: 'Banking Information',
            fields: [],
            message: 'Enter your banking information below so you can get paid for your jobs. (all fields required):',
            submit: function() {},
            cancel: function() {},
            submitText: 'Submit',
            cancelText: 'Cancel',
            canSubmit: true,
            canCancel: true,
            exit: null,
            canExit: true,
            cancelOnExit: true,
            fixedButtons: true,
            submitColor: '',
            cancelColor: ''
        }

        var settings = $.extend({}, defaults, options);

        if(!settings.exit) {
            if(settings.cancelOnExit) {
                settings.exit = function() {
                    return settings.cancel();
                }
            } else {
                settings.exit = function() {};
            }
        }

        var actualSubmit = function(info) {
            modal.hide($('#modalBanking'));
            settings.submit(info);
        }

        var actualCancel = function() {
            modal.hide($('#modalBanking'));
            settings.cancel();
        }

        var actualExit = function() {
            modal.hide($('#modalBanking'));
            settings.exit();
        }

        var updateStatus = function(message, err) {
            err = (typeof(err) === 'boolean') ? err : false;

            $('#modalBankingStatus').stop().fadeTo(300, 0, function() {
                if(err) $(this).addClass('error');
                else $(this).removeClass('error');
                $(this).html(message).stop().fadeTo(300, 1);
            });
        }

        var checkFields = function() {
            return false;
        }

        if(settings.title) {
            $('#modalBankingTitle').html(settings.title);
        }

        if(settings.message) {
            $('#modalBankingMessage').html(settings.message);
        }

        for(var i=0; i<settings.fields.length; i++) {
            $('#'+settings.fields[i]).addClass('error');
        }

        if(settings.submitText) {
            $('#modalBankingTrue').html(settings.submitText);
        }

        if(settings.cancelText) {
            $('#modalBankingFalse').html(settings.cancelText);
        }

        $('#modalBankingTrue, #modalBankingFalse').removeClass('unfixed');
        if(!settings.fixedButtons) {
            $('#modalBankingTrue, #modalBankingFalse').addClass('unfixed');
        }

        $('#modalBankingTrue').removeClass('green red').addClass('blue');
        if(!util.is.nil(settings.submitColor)) {
            $('#modalBankingTrue').removeClass('blue').addClass(settings.submitColor);
        }

        $('#modalBankingFalse').removeClass('green blue').addClass('red');
        if(!util.is.nil(settings.cancelColor)) {
            $('#modalBankingFalse').removeClass('red').addClass(settings.cancelColor);
        }

        $('#modalBankingTrue').off('click');
        if(settings.canSubmit) {
            $('#modalBankingTrue').on('click', function(e) {
                var errs = [];
                var eids = [];

                $('#modalBanking .error').removeClass('error');

                var info = {
                    bank: $('#modalBankingBank').val(),
                    routing: $('#modalBankingRouting').val().replace(/\D/g, ''),
                    account: $('#modalBankingAccount').val()
                }

                var accountRepeat = $('#modalBankingAccountRepeat').val()

                if(util.is.nil(info.bank)) {
                    errs.push('Please enter the name of your bank');
                    eids.push('modalBankingBank');
                }

                if(util.is.nil(info.routing)) {
                    errs.push('Please enter your bank\'s routing number');
                    eids.push('modalBankingRouting');
                } else if(info.routing.length != 9) {
                    errs.push('Please enter a valid routing number');
                    eids.push('modalBankingRouting');
                }

                if(util.is.nil(info.account)) {
                    errs.push('Please enter your account number');
                    eids.push('modalBankingAccount')
                }

                if(info.account !== accountRepeat) {
                    errs.push('The account numbers you have entered do not match');
                    eids.push('modalBankingAccount');
                    eids.push('modalBankingAccountRepeat');
                }

                if(errs.length > 0) {
                    var err = errs[0];
                    if(errs.length > 1) {
                        err = 'Please correct the highlighted errors before continuing';
                    }

                    for(var i=0; i<eids.length; i++) {
                        $('#'+eids[i]).addClass('error');
                    }

                    updateStatus(err, true);
                } else {
                    actualSubmit(info);
                }
            });
        }

        $('#modalBankingFalse').off('click');
        if(settings.canCancel) {
            $('#modalBankingFalse').on('click', function(e) {
                actualCancel();
            }).show();
        } else {
            $('#modalBankingFalse').hide();
        }

        modal.show($('#modalBanking'), settings.canExit, actualExit);
        $('#modalBankingBank').focus();

        $('#modalBankingTrue').hide();
        if(settings.canSubmit) {
            $('#modalBankingTrue').show();
        }
    },

    billing: function(options) {
        var defaults = {
            title: 'Billing Information',
            message: 'Enter your billing information below:',
            fields: [],
            submit: function() {},
            cancel: function() {},
            submitText: 'Submit',
            cancelText: 'Cancel',
            canSubmit: true,
            canCancel: true,
            exit: null,
            canExit: true,
            cancelOnExit: true,
            fixedButtons: true,
            submitColor: '',
            cancelColor: ''
        }

        var settings = $.extend({}, defaults, options);

        if(!settings.exit) {
            if(settings.cancelOnExit) {
                settings.exit = function() {
                    return settings.cancel();
                }
            } else {
                settings.exit = function() {};
            }
        }

        var actualSubmit = function(info) {
            modal.hide($('#modalBilling'));
            settings.submit(info);
        }

        var actualCancel = function() {
            modal.hide($('#modalBilling'));
            settings.cancel();
        }

        var actualExit = function() {
            modal.hide($('#modalBilling'));
            settings.exit();
        }

        var updateStatus = function(message, err) {
            err = (typeof(err) === 'boolean') ? err : false;

            $('#modalBillingStatus').stop().fadeTo(300, 0, function() {
                if(err) $(this).addClass('error');
                else $(this).removeClass('error');
                $(this).html(message).stop().fadeTo(300, 1);
            });
        }

        var checkFields = function() {
            return false;
        }

        if(settings.title) {
            $('#modalBillingTitle').html(settings.title);
        }

        if(settings.message) {
            $('#modalBillingMessage').html(settings.message);
        }

        for(var i=0; i<settings.fields.length; i++) {
            $('#'+settings.fields[i]).addClass('error');
        }

        if(settings.submitText) {
            $('#modalBillingTrue').html(settings.submitText);
        }

        if(settings.cancelText) {
            $('#modalBillingFalse').html(settings.cancelText);
        }

        $('#modalBillingTrue, #modalBillingFalse').removeClass('unfixed');
        if(!settings.fixedButtons) {
            $('#modalBillingTrue, #modalBillingFalse').addClass('unfixed');
        }

        $('#modalBillingTrue').removeClass('green red').addClass('blue');
        if(!util.is.nil(settings.submitColor)) {
            $('#modalBillingTrue').removeClass('blue').addClass(settings.submitColor);
        }

        $('#modalBillingFalse').removeClass('green blue').addClass('red');
        if(!util.is.nil(settings.cancelColor)) {
            $('#modalBillingFalse').removeClass('red').addClass(settings.cancelColor);
        }

        $('#modalBillingTrue').off('click');
        if(settings.canSubmit) {
            $('#modalBillingTrue').on('click', function(e) {
                var errs = [];
                var eids = [];

                $('#modalBilling .error').removeClass('error');

                var info = {
                    primary: $('#modalBillingPrimary').val(),
                    secondary: $('#modalBillingSecondary').val(),
                    city: $('#modalBillingCity').val(),
                    state: $('#modalBillingState').val(),
                    zip: $('#modalBillingZip').val()
                }

                if(util.is.nil(info.primary)) {
                    errs.push('Please enter your billing address');
                    eids.push('modalBillingPrimary');
                }

                if(util.is.nil(info.city)) {
                    errs.push('Please enter your business city');
                    eids.push('modalBillingCity');
                }

                if(util.is.nil(info.state)) {
                    errs.push('Please enter your business state');
                    eids.push('modalBillingState')
                }

                if(!util.is.zip(info.zip)) {
                    errs.push('Please enter a valid business zip code');
                    eids.push('modalBillingZip');
                } else {
                    info.zip = util.format.zip(info.zip);
                    $('#modalBillingZip').val(info.zip);
                }

                if(errs.length > 0) {
                    var err = errs[0];
                    if(errs.length > 1) {
                        err = 'Please correct the highlighted errors before continuing';
                    }

                    for(var i=0; i<eids.length; i++) {
                        $('#'+eids[i]).addClass('error');
                    }

                    updateStatus(err, true);
                } else {
                    actualSubmit(info);
                }
            });
        }

        $('#modalBillingFalse').off('click');
        if(settings.canCancel) {
            $('#modalBillingFalse').on('click', function(e) {
                actualCancel();
            }).show();
        } else {
            $('#modalBillingFalse').hide();
        }

        modal.show($('#modalBilling'), settings.canExit, actualExit);
        $('#modalBillingPrimary').focus();

        $('#modalBillingTrue').hide();
        if(settings.canSubmit) {
            $('#modalBillingTrue').show();
        }
    },

    sellerBusinessInfo: function(options) {
        var defaults = {
            title: 'Tax ID/EIN Information',
            message: 'Enter your information below (all fields required):',
            fields: [],
            submit: function() {},
            cancel: function() {},
            submitText: 'Submit',
            cancelText: 'Cancel',
            canSubmit: true,
            canCancel: true,
            exit: null,
            canExit: true,
            cancelOnExit: true,
            fixedButtons: true,
            submitColor: '',
            cancelColor: ''
        }

        var settings = $.extend({}, defaults, options);

        if(!settings.exit) {
            if(settings.cancelOnExit) {
                settings.exit = function() {
                    return settings.cancel();
                }
            } else {
                settings.exit = function() {};
            }
        }

        var actualSubmit = function(info) {
            modal.hide($('#modalSellerBusinessInfo'));
            settings.submit(info);
        }

        var actualCancel = function() {
            modal.hide($('#modalSellerBusinessInfo'));
            settings.cancel();
        }

        var actualExit = function() {
            modal.hide($('#modalSellerBusinessInfo'));
            settings.exit();
        }

        var updateStatus = function(message, err) {
            err = (typeof(err) === 'boolean') ? err : false;

            $('#modalSellerBusinessInfoStatus').stop().fadeTo(300, 0, function() {
                if(err) $(this).addClass('error');
                else $(this).removeClass('error');
                $(this).html(message).stop().fadeTo(300, 1);
            });
        }

        var checkFields = function() {
            return false;
        }

        if(settings.title) {
            $('#modalSellerBusinessInfoTitle').html(settings.title);
        }

        if(settings.message) {
            $('#modalSellerBusinessInfoMessage').html(settings.message);
        }

        for(var i=0; i<settings.fields.length; i++) {
            $('#'+settings.fields[i]).addClass('error');
        }

        if(settings.submitText) {
            $('#modalSellerBusinessInfoTrue').html(settings.submitText);
        }

        if(settings.cancelText) {
            $('#modalSellerBusinessInfoFalse').html(settings.cancelText);
        }

        $('#modalSellerBusinessInfoTrue, #modalSellerBusinessInfoFalse').removeClass('unfixed');
        if(!settings.fixedButtons) {
            $('#modalSellerBusinessInfoTrue, #modalSellerBusinessInfoFalse').addClass('unfixed');
        }

        $('#modalSellerBusinessInfoTrue').removeClass('green red').addClass('blue');
        if(!util.is.nil(settings.submitColor)) {
            $('#modalSellerBusinessInfoTrue').removeClass('blue').addClass(settings.submitColor);
        }

        $('#modalSellerBusinessInfoFalse').removeClass('green blue').addClass('red');
        if(!util.is.nil(settings.cancelColor)) {
            $('#modalSellerBusinessInfoFalse').removeClass('red').addClass(settings.cancelColor);
        }

        $('#modalSellerBusinessInfoTrue').off('click');
        if(settings.canSubmit) {
            $('#modalSellerBusinessInfoTrue').on('click', function(e) {
                var errs = [];
                var eids = [];

                $('#modalSellerBusinessInfo .error').removeClass('error');

                var info = {
                    legalName: $('#modalSellerBusinessInfoLegalName').val(),
                    name: $('#modalSellerBusinessInfoBusinessAs').val(),
                    taxId: $('#modalSellerBusinessInfoTaxId').val(),
                    address: $('#modalSellerBusinessInfoAddress').val(),
                    city: $('#modalSellerBusinessInfoCity').val(),
                    state: $('#modalSellerBusinessInfoState').val(),
                    zip: $('#modalSellerBusinessInfoZip').val()
                }

                if(util.is.nil(info.legalName)) {
                    errs.push('Please enter your legal business name');
                    eids.push('modalSellerBusinessInfoLegalName');
                } else if(info.legalName.length > 40) {
                    errs.push('Legal business names may be no longer than 40 characters');
                    eids.push('modalSellerBusinessInfoLegalName');
                }

                if(info.name.length > 40) {
                   errs.push('Business names may be no longer than 40 characters');
                   eids.push('modalSellerBusinessInfoBusinessAs');
               }

                if(util.is.nil(info.taxId)) {
                    errs.push('Please enter a valid Tax ID');
                    eids.push('modalSellerBusinessInfoTaxId');
                } else {
                    var taxId = info.taxId;
                    var taxErr = '';
                    if(typeof(taxId) == 'number') taxId = taxId.toString();

                    if(typeof(taxId) !== 'string') taxErr = 'Please enter a valid Tax ID';
                    taxId = taxId.replace(/\D/g, '');

                    if(taxId.length != 9) taxErr = 'Please enter a valid Tax ID';
                    taxId = taxId.substr(0, 2) + '-' + taxId.substr(2, 7);
                    var regexp = /^(\d{2})-?\d{7}$/i;

                    if(!regexp.test(taxId)) taxErr = 'Please enter a valid Tax ID';

                    if(util.is.nil(taxErr)) {
                        info.taxId = taxId;
                        $('#modalSellerBusinessInfoTaxId').val(info.taxId);
                    } else {
                        errs.push(taxErr);
                        eids.push('modalSellerBusinessInfoTaxId');
                    }
                }

                if(util.is.nil(info.address)) {
                    errs.push('Please enter your business address');
                    eids.push('modalSellerBusinessInfoAddress')
                }

                if(util.is.nil(info.city)) {
                    errs.push('Please enter your business city');
                    eids.push('modalSellerBusinessInfoCity');
                }

                if(util.is.nil(info.state)) {
                    errs.push('Please enter your business state');
                    eids.push('modalSellerBusinessInfoState')
                }

                if(!util.is.zip(info.zip)) {
                    errs.push('Please enter a valid business zip code');
                    eids.push('modalSellerBusinessInfoZip');
                } else {
                    info.zip = util.format.zip(info.zip);
                    $('#modalSellerBusinessInfoZip').val(info.zip);
                }

                if(errs.length > 0) {
                    var err = errs[0];
                    if(errs.length > 1) {
                        err = 'Please correct the highlighted errors before continuing';
                    }

                    for(var i=0; i<eids.length; i++) {
                        $('#'+eids[i]).addClass('error');
                    }

                    updateStatus(err, true);
                } else {
                    actualSubmit(info);
                }
            });
        }

        $('#modalSellerBusinessInfoFalse').off('click');
        if(settings.canCancel) {
            $('#modalSellerBusinessInfoFalse').on('click', function(e) {
                actualCancel();
            }).show();
        } else {
            $('#modalSellerBusinessInfoFalse').hide();
        }

        modal.show($('#modalSellerBusinessInfo'), settings.canExit, actualExit);
        $('#modalSellerBusinessInfoLegalName').focus();

        $('#modalSellerBusinessInfoTrue').hide();
        if(settings.canSubmit) {
            $('#modalSellerBusinessInfoTrue').show();
        }
    },

    sellerUserInfo: function(options) {
        var defaults = {
            title: 'User Information',
            message: 'Enter your information below (all fields required):',
            fields: [],
            submit: function() {},
            cancel: function() {},
            submitText: 'Submit',
            cancelText: 'Cancel',
            canSubmit: true,
            canCancel: true,
            exit: null,
            canExit: true,
            cancelOnExit: true,
            fixedButtons: true,
            submitColor: '',
            cancelColor: ''
        }

        var settings = $.extend({}, defaults, options);

        if(!settings.exit) {
            if(settings.cancelOnExit) {
                settings.exit = function() {
                    return settings.cancel();
                }
            } else {
                settings.exit = function() {};
            }
        }

        var actualSubmit = function(info) {
            modal.hide($('#modalSellerUserInfo'));
            settings.submit(info);
        }

        var actualCancel = function() {
            modal.hide($('#modalSellerUserInfo'));
            settings.cancel();
        }

        var actualExit = function() {
            modal.hide($('#modalSellerUserInfo'));
            settings.exit();
        }

        var updateStatus = function(message, err) {
            err = (typeof(err) === 'boolean') ? err : false;

            $('#modalSellerUserInfoStatus').stop().fadeTo(300, 0, function() {
                if(err) $(this).addClass('error');
                else $(this).removeClass('error');
                $(this).html(message).stop().fadeTo(300, 1);
            });
        }

        var checkFields = function() {
            return false;
        }

        if(settings.title) {
            $('#modalSellerUserInfoTitle').html(settings.title);
        }

        if(settings.message) {
            $('#modalSellerUserInfoMessage').html(settings.message);
        }

        for(var i=0; i<settings.fields.length; i++) {
            $('#'+settings.fields[i]).addClass('error');
        }

        if(settings.submitText) {
            $('#modalSellerUserInfoTrue').html(settings.submitText);
        }

        if(settings.cancelText) {
            $('#modalSellerUserInfoFalse').html(settings.cancelText);
        }

        $('#modalSellerUserInfoTrue, #modalSellerUserInfoFalse').removeClass('unfixed');
        if(!settings.fixedButtons) {
            $('#modalSellerUserInfoTrue, #modalSellerUserInfoFalse').addClass('unfixed');
        }

        $('#modalSellerUserInfoTrue').removeClass('green red').addClass('blue');
        if(!util.is.nil(settings.submitColor)) {
            $('#modalSellerUserInfoTrue').removeClass('blue').addClass(settings.submitColor);
        }

        $('#modalSellerUserInfoFalse').removeClass('green blue').addClass('red');
        if(!util.is.nil(settings.cancelColor)) {
            $('#modalSellerUserInfoFalse').removeClass('red').addClass(settings.cancelColor);
        }

        $('#modalSellerUserInfoAddEIN').on('change', function() {
            if($(this).is(':checked')) {
                $('#modalSellerUserInfoTrue').html(settings.submitText + ' and Add Tax ID/EIN');
            } else {
                $('#modalSellerUserInfoTrue').html(settings.submitText);
            }
        });

        $('#modalSellerUserInfoTrue').off('click');
        if(settings.canSubmit) {
            $('#modalSellerUserInfoTrue').on('click', function(e) {
                var errs = [];
                var eids = [];

                $('#modalSellerUserInfo .error').removeClass('error');

                var info = {
                    first: $('#modalSellerUserInfoFirst').val(),
                    last: $('#modalSellerUserInfoLast').val(),
                    dob: {
                        mm: parseInt($('#modalSellerUserInfoMM').val().replace(/\D/g, '')),
                        dd: parseInt($('#modalSellerUserInfoDD').val().replace(/\D/g, '')),
                        yy: parseInt($('#modalSellerUserInfoYY').val().replace(/\D/g, ''))
                    },
                    ssn: $('#modalSellerUserInfoSSN').val().replace(/\D/g, ''),
                    ein: $('#modalSellerUserInfoAddEIN').prop('checked')
                }

                if(util.is.number(info.dob.yy) && info.dob.yy < 100) {
                    info.dob.yy += 1900;
                }

                if(util.is.nil(info.first)) {
                    errs.push('You must enter your first name');
                    eids.push('modalSellerUserInfoFirst');
                }

                if(util.is.nil(info.last)) {
                    errs.push('You must enter your last name');
                    eids.push('modalSellerUserInfoLast')
                }

                if(!util.is.number(info.dob.mm) || info.dob.mm > 12 || info.dob.mm < 1) {
                    errs.push('You must enter a valid number (from 1 to 12) for the month');
                    eids.push('modalSellerUserInfoMM');
                } else {
                    $('#modalSellerUserInfoMM').val(info.dob.mm);
                }

                var maxDay = new Date(info.dob.yy, info.dob.mm, 0).getDate()
                if(!util.is.number(info.dob.dd) || info.dob.dd > 31 || info.dob.dd < 1 || (info.dob.dd > maxDay)) {
                    errs.push('You must enter a valid number (from 1 to ' + maxDay + ') for the day for this month');
                    eids.push('modalSellerUserInfoDD');
                } else {
                    $('#modalSellerUserInfoDD').val(info.dob.dd);
                }

                var now = new Date();
                if(!util.is.number(info.dob.yy) || info.dob.yy > now.getFullYear() || info.dob.yy < 1900) {
                    errs.push('You must enter a valid year');
                    eids.push('modalSellerUserInfoYY');
                } else {
                    $('#modalSellerUserInfoYY').val(info.dob.yy);
                }

                if(info.ssn.length !== 9) {
                    errs.push('Please enter a valid social security number');
                    eids.push('modalSellerUserInfoSSN');
                } else {
                    var ssn = info.ssn.substr(0, 3);
                    ssn += '-';
                    ssn += info.ssn.substr(3, 2);
                    ssn += '-';
                    ssn += info.ssn.substr(5, 4);
                    $('#modalSellerUserInfoSSN').val(ssn);
                }

                if(errs.length > 0) {
                    var err = errs[0];
                    if(errs.length > 1) {
                        err = 'Please correct the highlighted errors before continuing';
                    }

                    for(var i=0; i<eids.length; i++) {
                        $('#'+eids[i]).addClass('error');
                    }

                    updateStatus(err, true);
                } else {
                    var dob = new Date(info.dob.mm + '/' + info.dob.dd + '/' + info.dob.yy);
                    info.dob = dob;
                    actualSubmit(info);
                }
            });
        }

        $('#modalSellerUserInfoFalse').off('click');
        if(settings.canCancel) {
            $('#modalSellerUserInfoFalse').on('click', function(e) {
                actualCancel();
            }).show();
        } else {
            $('#modalSellerUserInfoFalse').hide();
        }

        modal.show($('#modalSellerUserInfo'), settings.canExit, actualExit);
        $('#modalSellerUserInfoFirst').focus();

        $('#modalSellerUserInfoTrue').hide();
        if(settings.canSubmit) {
            $('#modalSellerUserInfoTrue').show();
        }
    },

    diagnosisEstimate: function(options) {
        var defaults = {
            title: '',
            message: '',
            user: null,
            project: null,
            estimate: null,
            place: function() {},
            cancel: function() {},
            exit: null,
            edit: false
        };

        var settings = $.extend({}, defaults, options);

        // don't even show the modal if there's no user and project sent
        if(util.is.nil(settings.project) || util.is.nil(settings.user)) return;

        // make sure the user has permissions to edit when edit mode is sent
        if(settings.edit) {
            if(!util.is.nil(settings.estimate) && settings.user._id != settings.estimate.owner._id) settings.edit = false;
        }

        // if this is a new diagnosis estimate
        if(util.is.nil(settings.estimate)) {
            settings.estimate = {
                owner: settings.user,
                taxRate: {
                    parts: 0,
                    labor: settings.user.tax.labor
                },
                referral: {
                    seller: settings.user.referral.diagnosis,
                    buyer: settings.project.owner.referral.diagnosis
                },
                discount: {
                    seller: 0,
                    buyer: 0
                },
                discountId: {
                    seller: '',
                    buyer: ''
                },
                diagnosisWaiver: 0,
                diagnosisWaived: settings.user.waivesDiagnosis,
                labor: [{
                    label: '',
                    rate: settings.user.diagnosisCharge,
                    hours: 1
                }],
                parts: [],
                state: 'draft'
            };
        }

        if(util.is.nil(settings.exit)) {
            settings.exit = function() {
                return settings.cancel();
            }
        }

        var actualPlace = function(estimate) {
            modal.hide($('#modalDiagnosisEstimate'));
            console.log(estimate);
            settings.place(estimate);
        };

        var actualAccept = function(estimate) {
            modal.hide($('#modalDiagnosisEstimate'));
            settings.accept(estimate);
        };

        var actualCancel = function() {
            modal.hide($('#modalDiagnosisEstimate'));
            settings.cancel();
        };

        var actualExit = function() {
            modal.hide($('#modalDiagnosisEstimate'));
            settings.exit();
        };

        var updateStatus = function(message, err) {
            err = (typeof(err) === 'boolean') ? err : true;

            $('#modalDiagnosisEstimateStatus').stop().fadeTo(300, 0, function() {
                $(this).html(message).stop().fadeTo(300, 1);
            });
        };

        if(settings.title) {
            $('#modalDiagnosisEstimateTitle').html(settings.title);
        }

        if(settings.message) {
            $('#modalDiagnosisEstimateMessage').html(settings.message);
        }

        // updates the workorder markup based off of current estimate state
        // var updateMarkup = function(discount) {
        //     var refParens = (settings.perspective == 'seller');

        //     var estimate = settings.estimate = util.estimate.virtualize(settings.estimate, discount);

        //     $('#modalEstimatPartsSubtotal').html(util.currency.centsToDollars(estimate.partsAmount));
        //     $('#modalEstimatePartsSubtotalTax').html(util.currency.centsToDollars(estimate.partsTaxAmount));
        //     $('#modalEstimateLaborSubtotal').html(util.currency.centsToDollars(estimate.laborAmount));
        //     $('#modalEstimateLaborSubtotalTax').html(util.currency.centsToDollars(estimate.laborTaxAmount));

        //     $('#modalEstimatePartsLaborTotal').html(util.currency.centsToDollars(estimate.partsLaborAmount));
        //     $('#modalEstimatePartsLaborTaxTotal').html(util.currency.centsToDollars(estimate.taxAmount));

            

        // updates the estimate modal markup based off of current estimate state
        var updateMarkup = function(discount) {
            var refParens = (settings.user._id == settings.estimate.owner._id);
            var estimate = settings.estimate = util.estimate.virtualize(settings.estimate, discount);

            if(settings.user._id == settings.project.owner._id) {
                $('#modalDiagnosisDiscountTotal').html('(' + util.currency.centsToDollars(estimate.buyerDiscountAmount) + ')');
            } else if(settings.user._id == settings.estimate.owner._id) {
                $('#modalDiagnosisDiscountTotal').html(util.currency.centsToDollars(estimate.sellerDiscountAmount));
            }

            if(settings.estimate.state != 'submitted' && settings.estimate.state != 'draft') {
                if(settings.user._id == settings.project.owner._id) {
                    if(settings.estimate.discount.buyer <= 0) {
                        $('#modalDiagnosisDiscountRow').hide();
                    } else {
                        $('#modalDiagnosisDiscountRow').show();
                    }
                } else if(settings.user._id == settings.estimate.owner._id) {
                    if(settings.estimate.discount.seller <= 0) {
                        $('#modalDiagnosisDiscountRow').hide();
                    } else {
                        $('#modalDiagnosisDiscountRow').show();
                    }
                }
            }

            $('#modalDiagnosisFeeAmount').html((refParens ? '(': '') + util.currency.centsToDollars(refParens ? estimate.sellerReferralAmount : estimate.buyerReferralAmount) + (refParens ? ')' : ''));
            $('#modalDiagnosisTaxAmount').html(util.currency.centsToDollars(estimate.taxAmount));
            $('#modalDignosisAfterFee').html(util.currency.centsToDollars(refParens ? estimate.sellerTotal : estimate.buyerTotal));
        };

        // show the discounts row if the user is looking at an estimate on their own project
        if(settings.user._id == settings.project.owner._id) {
            var discounts = util.estimate.applicableDiscounts(settings.project, settings.estimate, settings.project.owner.discounts);
            if(discounts.length > 0) {
                $('#modalDiagnosisDiscountRow').show();

                $('#modalDiagnosisDiscount').html('<option value="" selected="selected" disabled="disabled">Select one</option>');

                var html = '<option value="" selected="selected">No Discount</option>';
                for(var i=0; i<discounts.length; i++) {
                    var discount = discounts[i];
                    html += '<option value="' + discount._id + '">';
                        if(!util.is.nil(discount.label)) {
                            html += discount.label;
                        } else {
                            if(discount.amount > 0) {
                                html += util.currency.centsToDollars(discount.amount) + ' Off';
                            } else {
                                html += util.percentage.to(discount.rate) + ' Off';
                            }
                        }
                    html += '</option>';
                }
                $('#modalDiagnosisDiscount').html(html);

                if(settings.estimate.state == 'submitted') {
                    $('#modalDiagnosisDiscount').off('change').on('change', function(e) {
                        var discountId = $('#modalDiagnosisDiscount').val();

                        var discount = {
                            buyer: null,
                            seller: null,
                        };
                        settings.estimate.discountId.buyer = '';

                        for(var i=0; i<settings.project.owner.discounts.length; i++) {
                            if(discountId == settings.project.owner.discounts[i]._id) {
                                discount.buyer = settings.project.owner.discounts[i];
                                settings.estimate.discountId.buyer = discountId;
                                break;
                            }
                        }
                        updateMarkup(discount);
                    });
                } else {
                    $('#modalDiagnosisDiscount').hide();
                }
            } else {
                $('#modalDiagnosisDiscountRow').hide();
            }
        } else if(settings.estimate.owner._id == settings.user._id) {
            $('#modalDiagnosisDiscountRow').hide();
            // var discounts = util.estimate.applicableDiscounts(settings.project, settings.estimate, settings.estimate.owner.discounts);
            // if(discounts.length > 0 && settings.estimate.owner._id == settings.user._id) {
            //     $('#modalDiagnosisDiscountRow').show();

            //     var html = '<option value="" selected="selected">No Discount</option>';
            //     for(var i=0; i<discounts.length; i++) {
            //         var discount = discounts[i];
            //         html += '<option value="' + discount._id + '">';
            //             if(!util.is.nil(discount.label)) {
            //                 html += discount.label;
            //             } else {
            //                 if(discount.amount > 0) {
            //                     html += util.currency.centsToDollars(discount.amount) + ' Off';
            //                 } else {
            //                     html += util.percentage.to(discount.rate) + ' Off';
            //                 }
            //             }
            //         html += '</option>';
            //     }
                
            //     $('#modalDiagnosisDiscount').html(html);

            //     if(settings.estimate.state == 'submitted' || settings.estimate.state == 'draft') {
            //         $('#modalDiagnosisDiscount').off('change').on('change', function(e) {
            //             settings.estimate.discount.seller = $('#modalDiagnosisDiscount').val();
            //             updateMarkup();
            //         });
            //         $('#modalDiagnosisDiscount').off('change').on('change', function(e) {
            //             var discountId = $('#modalDiagnosisDiscount').val();

            //             var discount = {
            //                 buyer: null,
            //                 seller: null,
            //             };
            //             settings.estimate.discountId.seller = '';

            //             for(var i=0; i<settings.estimate.owner.discounts.length; i++) {
            //                 if(discountId == settings.estimate.owner.discounts[i]._id) {
            //                     discount.seller = settings.estimate.owner.discounts[i];
            //                     settings.estimate.discountId.seller = discountId;
            //                     break;
            //                 }
            //             }
            //             updateMarkup(discount);
            //         });
            //     } else {
            //         $('#modalDiagnosisDiscount').hide();
            //     }
            // } else {
            //     $('#modalDiagnosisDiscountRow').hide();
            // }
        }

        // remove/enable 'editability' when edit mode is not enabled
        $('#modalDiagnosisEstimateFee, #modalDiagnosisEstimateWaived, #modalDiagnosisEstimateTax').prop('disabled', !settings.edit);
        if(!settings.edit) {
            $('#modalDiagnosisEstimateFee, #modalDiagnosisEstimateWaived, #modalDiagnosisEstimateTax').addClass('hide-nature');
        } else {
            $('#modalDiagnosisEstimateFee, #modalDiagnosisEstimateWaived, #modalDiagnosisEstimateTax').removeClass('hide-nature');
        }

        // update comment on modal load
        $('#modalDiagnosisMessageEntry').val($('<div>').html(settings.estimate.comment).text());
        if(!settings.edit) {
            $('#modalDiagnosisMessageEntry').addClass('hide-nature').prop('disabled', true);
        } else {
            $('#modalDiagnosisMessageEntry').removeClass('hide-nature').prop('disabled', false);
        }

        // update the message to customer header depending on user view
        if(settings.user._id == settings.project.owner._id) {
            $('#modalDiagnosisMessageHeader').html('Message from Mechanic');
        } else {
            $('#modalDiagnosisMessageHeader').html('Message to Customer');
        }

        // marcus
        // hide the message showing/entering if not customer or bid owner that is viewing
        if(settings.user._id == settings.project.owner._id || settings.user._id == settings.estimate.owner._id) {
            // make sure there's something in the box worth showing
            if(util.is.nil(settings.estimate.comment) && !settings.edit) {
                $('#modalDiagnosisMessageContainer').hide();
            } else {
                $('#modalDiagnosisMessageContainer').show();
            }
        } else {
            $('#modalDiagnosisMessageContainer').hide();
        }

        // update tax rates on modal load
        var setLaborTaxRate = util.percentage.to(settings.estimate.taxRate.labor, true);
        if(parseFloat(setLaborTaxRate) <= 0) setLaborTaxRate = util.percentage.to(settings.user.tax.labor, true);
        console.log(setLaborTaxRate);
        $('#modalDiagnosisEstimateTax').val(setLaborTaxRate);
        console.log($('#modalDiagnosisEstimateTax').val());

        // update diagnosis charge on modal load
        $('#modalDiagnosisEstimateFee').val(util.currency.centsToDollars(settings.estimate.labor[0].rate))

        // on tax field change, update calculations
        $('#modalDiagnosisEstimateTax').off('change input paste').on('change input paste', function() {
            var val = $(this).val();
            var taxDecimal = util.is.nil(val) ? 0 : util.percentage.from(val);
            if(util.is.nil(taxDecimal) && taxDecimal != 0) taxDecimal = -1;
            
            settings.estimate.taxRate.labor = taxDecimal;

            if(taxDecimal < 0 || taxDecimal > 0.15) {
                $(this).addClass('error');
            } else {
                $(this).removeClass('error');
                updateMarkup();
            }
        });

        // on diagnosis charge field change, update calculations
        $('#modalDiagnosisEstimateFee').off('change input paste').on('change input paste', function() {
            var val = $(this).val();
            var cents = util.is.nil(val) ? -1 : util.currency.dollarsToCents(val);
            if(util.is.nil(cents)) cents = -1;
            
            settings.estimate.labor[0].rate = cents;

            if(cents < 0) {
                $(this).addClass('error');
            } else {
                $(this).removeClass('error');
                updateMarkup();
            }
        });

        // update estimate whenever user changes waive diagnosis option
        $('#modalDiagnosisEstimateWaived').on('change', function() {
            var waivesDiagnosis = ($(this).val() == '1') ? true : false;
            settings.estimate.diagnosisWaived = waivesDiagnosis;
        });

        // load in the estimate/user's waive preference
        var waiveValue = settings.estimate.diagnosisWaived ? '1' : '0';
        $('#modalDiagnosisEstimateWaived').val(waiveValue);

        updateMarkup();

        modal.show($('#modalDiagnosisEstimate'), settings.canExit, actualExit);

        // initialize bottom button showing/clicking
        $('#modalDiagnosisEstimatePlace').hide().off('click touchmove touchend');
        if(settings.edit) {
            $('#modalDiagnosisEstimatePlace').show().on('click touchmove touchend', function(e) {
                if(e.type != 'touchmove') {
                    settings.estimate.comment = $('#modalDiagnosisMessageEntry').val();
                    var estimate = util.estimate.virtualize(settings.estimate);

                    if(settings.estimate.labor.length <= 0) {
                        updateStatus('Please fill out either parts or labor for this estimate');
                    } else if(estimate.sellerTotal < 1000) {
                        updateStatus('You must earn at least $10.00 in order to submit an estimate');
                    } else if(estimate.buyerTotal > 10000 * 100) {
                        updateStatus('You may not charge the customer over $10,000 on a diagnosis');
                    } else if(settings.estimate.taxRate.labor < 0 || settings.estimate.taxRate.labor > 0.15) {
                        updateStatus('Labor tax must be between 0% and 15%');
                    } else {
                        mfMixpanel.track('Estimate Placed', {'Is Diagnosis': true});
                        actualPlace(settings.estimate);
                    }
                }
            });
        }

        $('#modalDiagnosisEstimateAccept').hide().off('click touchmove touchend');
        if(!settings.edit && settings.project.owner._id == settings.user._id && settings.estimate.state == 'submitted') {
            $('#modalDiagnosisEstimateAccept').show().on('click touchmove touchend', function(e) {
                if(e.type != 'touchmove') {
                    actualAccept(settings.estimate);
                }
            });
        }

        $('#modalDiagnosisEstimateCancel').off('click touchmove touchend').on('click touchmove touchend', function(e) {
            if(e.type !== 'touchmove') {
                actualCancel();
            }
        });
    },

    estimate: function(options) {
        var defaults = {
            title: 'Create Your Estimate',
            message: '',
            place: function() {},
            accept: function() {},
            cancel: function() {},
            exit: null,
            user: null,
            project: null,
            estimate: null,
            edit: false,
            cancelText: 'Cancel',
            perspective: ''
        };

        var settings = $.extend({}, defaults, options);

        // don't even show the modal if there's no user and project present
        if(util.is.nil(settings.project) || util.is.nil(settings.user)) return;

        // make sure the user has permissions to edit when edit mode is sent
        if(settings.edit) {
            if(!util.is.nil(settings.estimate) && settings.user._id != settings.estimate.owner._id) settings.edit = false;
        }

        if(settings.perspective != 'buyer' && settings.perspective != 'seller') settings.perspective = settings.user.role;
        if(settings.perspective == 'seller' && settings.user.role != 'seller') settings.perspective = 'buyer';

        // if this is a new estimate
        if(util.is.nil(settings.estimate)) {
            settings.estimate = {
                owner: settings.user,
                taxRate: {
                    parts: 0,
                    labor: 0
                },
                referral: {
                    seller: settings.user.referral.workorder,
                    buyer: settings.project.owner.referral.workorder
                },
                discount: {
                    seller: 0,
                    buyer: 0
                },
                discountIds: {
                    seller: '',
                    buyer: ''
                },
                diagnosisWaiver: 0,
                parts: [],
                labor: [],
                state: 'draft'
            };

            // add diagnosis waivers if same mechanic and a parent project exists
            if(!util.is.nil(settings.project.parent) && settings.user._id == settings.project.parent.assigned) {
                for(var i=0; i<settings.project.parent.bids.length; i++) {
                    var parentEstimate = util.estimate.virtualize(settings.project.parent.bids[i]);
                    if(parentEstimate.state == 'released' || parentEstimate.state == 'requested' || parentEstimate.state == 'accepted') {
                        if(parentEstimate.diagnosisWaived) {
                            settings.estimate.diagnosisWaiver = parentEstimate.partsLaborAmount;
                        }
                        break;
                    }
                }
            }
        }

        if(util.is.nil(settings.exit)) {
            settings.exit = function() {
                return settings.cancel();
            }
        }

        var actualPlace = function(estimate) {
            modal.hide($('#modalEstimate'));
            console.log(estimate);
            settings.place(estimate);
        };

        var actualAccept = function(estimate) {
            modal.hide($('#modalEstimate'));
            settings.accept(estimate);
        };

        var actualCancel = function() {
            modal.hide($('#modalEstimate'));
            settings.cancel();
        };

        var actualExit = function() {
            modal.hide($('#modalEstimate'));
            settings.exit();
        };
        

        var updateStatus = function(message, err) {
            err = (typeof(err) === 'boolean') ? err : false;

            $('#modalEstimateStatus').stop().fadeTo(300, 0, function() {
                $(this).html(message).stop().fadeTo(300, 1);
            });
        }

        // updates the workorder markup based off of current estimate state
        var updateMarkup = function(discount) {
            var refParens = (settings.perspective == 'seller');

            var estimate = settings.estimate = util.estimate.virtualize(settings.estimate, discount);

            $('#modalEstimatPartsSubtotal').html(util.currency.centsToDollars(estimate.partsAmount));
            $('#modalEstimatePartsSubtotalTax').html(util.currency.centsToDollars(estimate.partsTaxAmount));
            $('#modalEstimateLaborSubtotal').html(util.currency.centsToDollars(estimate.laborAmount));
            $('#modalEstimateLaborSubtotalTax').html(util.currency.centsToDollars(estimate.laborTaxAmount));

            $('#modalEstimatePartsLaborTotal').html(util.currency.centsToDollars(estimate.partsLaborAmount));
            $('#modalEstimatePartsLaborTaxTotal').html(util.currency.centsToDollars(estimate.taxAmount));

            if(settings.perspective == 'buyer') {
                $('#modalEstimateDiscountTotal').html('(' + util.currency.centsToDollars(estimate.buyerDiscountAmount) + ')');
            } else if(settings.perspective == 'seller') {
                $('#modalEstimateDiscountTotal').html(util.currency.centsToDollars(estimate.sellerDiscountAmount));
            }

            if(settings.estimate.state != 'submitted' && settings.estimate.state != 'draft') {
                if(settings.perspective == 'buyer') {
                    if(settings.estimate.discount.buyer <= 0) {
                        $('#modalEstimateDiscountRow').hide();
                    } else {
                        $('#modalEstimateDiscountRow').show();
                    }
                } else if(settings.perspective == 'seller') {
                    if(settings.estimate.discount.seller <= 0) {
                        $('#modalEstimateDiscountRow').hide();
                    } else {
                        $('#modalEstimateDiscountRow').show();
                    }
                }
            }

            $('#modalEstimateReferralTotal').html((refParens ? '(' : '') + util.currency.centsToDollars(refParens ? estimate.sellerReferralAmount : estimate.buyerReferralAmount) + (refParens ? ')': ''));
            var neg = ((refParens && estimate.sellerTotal < 0) || (!refParens && estimate.buyerTotal < 0));
            $('#modalEstimateTotalTotal').html((neg ? '(' : '') + util.currency.centsToDollars(Math.abs(refParens ? estimate.sellerTotal : estimate.buyerTotal)) + (neg ? ')' : ''));

            if(!refParens) {
                $('#modalEstimateTotalVerbiage').html('Customer Charge');
            } else {
                $('#modalEstimateTotalVerbiage').html('Total to Mechanic');
            }
        };
        
        // show the discounts row if the user is looking at an estimate on their own project
        if(settings.perspective == 'buyer') {
            var discounts = util.estimate.applicableDiscounts(settings.project, settings.estimate, settings.project.owner.discounts);
            console.log('applicable discounts:');
            console.log(discounts);
            if(discounts.length > 0 && settings.user._id == settings.project.owner._id) {
                $('#modalEstimateDiscountRow').show();

                $('#modalEstimateDiscount').html('<option value="" selected="selected" disabled="disabled">Select one</option>');

                var html = '<option value="" selected="selected">No Discount</option>';
                for(var i=0; i<discounts.length; i++) {
                    var discount = discounts[i];
                    html += '<option value="' + discount._id + '">';
                        if(!util.is.nil(discount.label)) {
                            html += discount.label;
                        } else {
                            if(discount.amount > 0) {
                                html += util.currency.centsToDollars(discount.amount) + ' Off';
                            } else {
                                html += util.percentage.to(discount.rate) + ' Off';
                            }
                        }
                    html += '</option>';
                }
                $('#modalEstimateDiscount').html(html);

                if(settings.estimate.state == 'submitted') {
                    $('#modalEstimateDiscount').off('change').on('change', function(e) {
                        var discountId = $('#modalEstimateDiscount').val();

                        var discount = {
                            buyer: null,
                            seller: null,
                        };
                        settings.estimate.discountId.buyer = '';

                        for(var i=0; i<settings.project.owner.discounts.length; i++) {
                            if(discountId == settings.project.owner.discounts[i]._id) {
                                discount.buyer = settings.project.owner.discounts[i];
                                settings.estimate.discountId.buyer = discountId;
                                break;
                            }
                        }
                        updateMarkup(discount);
                    });
                } else {
                    $('#modalEstimateDiscount').hide();
                }
            } else {
                $('#modalEstimateDiscountRow').hide();
            }
        } else if(settings.perspective == 'seller') {
            $('#modalEstimateDiscountRow').hide();
            // var discounts = util.estimate.applicableDiscounts(settings.project, settings.estimate, settings.estimate.owner.discounts);
            // if(discounts.length > 0 && settings.estimate.owner._id == settings.user._id) {
            //     $('#modalEstimateDiscountRow').show();

            //     var html = '<option value="" selected="selected">No Discount</option>';
            //     for(var i=0; i<discounts.length; i++) {
            //         var discount = discounts[i];
            //         html += '<option value="' + discount._id + '">';
            //             if(!util.is.nil(discount.label)) {
            //                 html += discount.label;
            //             } else {
            //                 if(discount.amount > 0) {
            //                     html += util.currency.centsToDollars(discount.amount) + ' Off';
            //                 } else {
            //                     html += util.percentage.to(discount.rate) + ' Off';
            //                 }
            //             }
            //         html += '</option>';
            //     }
                
            //     $('#modalEstimateDiscount').html(html);

            //     if(settings.estimate.state == 'submitted' || settings.estimate.state == 'draft') {
            //         $('#modalEstimateDiscount').off('change').on('change', function(e) {
            //             settings.estimate.discount.seller = $('#modalEstimateDiscount').val();
            //             updateMarkup();
            //         });
            //         $('#modalEstimateDiscount').off('change').on('change', function(e) {
            //             var discountId = $('#modalEstimateDiscount').val();

            //             var discount = {
            //                 buyer: null,
            //                 seller: null,
            //             };
            //             settings.estimate.discountId.seller = '';

            //             for(var i=0; i<settings.estimate.owner.discounts.length; i++) {
            //                 if(discountId == settings.estimate.owner.discounts[i]._id) {
            //                     discount.seller = settings.estimate.owner.discounts[i];
            //                     settings.estimate.discountId.seller = discountId;
            //                     break;
            //                 }
            //             }
            //             updateMarkup(discount);
            //         });
            //     } else {
            //         $('#modalEstimateDiscount').hide();
            //     }
            // } else {
            //     $('#modalEstimateDiscountRow').hide();
            // }
        }

        var addPart = function(part, markupOnly) {
            markupOnly = (typeof markupOnly === 'boolean') ? markupOnly : false;

            var html = '';
            html += '<tr class="partRow">';
                html += '<td class="actions">';
                    if(settings.edit) {
                        html += '<a class="trash" href="javascript:void(0);">';
                            html += '<i class="fa fa-trash"></i>';
                        html += '</a>';
                    }
                html += '</td>';
                html += '<td class="wrap fillspace left">' + part.label + '</td>';
                html += '<td>' + part.quantity + '</td>';
                html += '<td>' + util.currency.centsToDollars(part.cost) + '</td>';
                html += '<td>' + (util.currency.centsToDollars((part.quantity * part.cost))) + '</td>';
            html += '</tr>';

            $('#modalEstimatePartsTable tr:nth-child(2)').after(html);
            if(!markupOnly) settings.estimate.parts.push(part);
            updateMarkup();

            if(settings.edit) {
                $('#modalEstimate .parts-section a.trash').off('click').on('click', function(e) {
                    var index = $(this).closest('tr').index() - 2;
                    var length = settings.estimate.parts.length;
                    settings.estimate.parts.splice(length - index - 1, 1);
                    updateMarkup();
                    $(this).closest('tr').remove();
                });
            }
        };

        var addLabor = function(lab, markupOnly) {
            markupOnly = (typeof markupOnly === 'boolean') ? markupOnly : false;

            var html = '';
            html += '<tr class="laborRow">';
                html += '<td class="actions">';
                    if(settings.edit) {
                        html += '<a class="trash" href="javascript:void(0);">';
                            html += '<i class="fa fa-trash"></i>';
                        html += '</a>';
                    }
                html += '</td>';
                html += '<td class="wrap fillspace left">' + lab.label + '</td>';
                html += '<td>' + lab.hours + '</td>';
                html += '<td>' + util.currency.centsToDollars(lab.rate) + '</td>';
                html += '<td>' + (util.currency.centsToDollars((lab.hours * lab.rate))) + '</td>';
            html += '</tr>';

            $('#modalEstimateLaborTable tr:nth-child(2)').after(html);
            if(!markupOnly) settings.estimate.labor.push(lab);
            updateMarkup();
            
            if(settings.edit) {
                $('#modalEstimate .labor-section a.trash').off('click').on('click', function(e) {
                    var index = $(this).closest('tr').index() - 2;
                    var length = settings.estimate.labor.length;
                    settings.estimate.labor.splice(length - index - 1, 1);
                    updateMarkup();
                    $(this).closest('tr').remove();
                });
            }
        };

        var validatePart = function() {
            var part = {
                label: $('#modalEstimatePartLabel').val(),
                quantity: $('#modalEstimatePartQuantity').val(),
                cost: util.currency.dollarsToCents($('#modalEstimatePartCost').val())
            }

            var errs = [];
            var eids = [];
            $('#modalEstimate .addPartRow .error').removeClass('error');

            if(util.is.nil(part.label)) {
                errs.push('You must fill out a name for this part');
                eids.push('modalEstimatePartLabel');
            }

            if(!util.is.number(part.quantity)) {
                errs.push('You must fill out a quantity for this part');
                eids.push('modalEstimatePartQuantity');
            } else {
                part.quantity = parseFloat(part.quantity);
            }

            if(util.is.nil(part.cost)) {
                errs.push('You must fill out a price for this part');
                eids.push('modalEstimatePartCost');
            }

            if(part.quantity < 1) {
                errs.push('Part quantities must be at least 1');
                eids.push('modalEstimatePartQuantity');
            } else if(part.quantity % 1 !== 0) {
                errs.push('Please exclude decimals from part quantities');
                eids.push('modalEstimatePartQuantity');
            }

            if(part.cost < 0) {
                errs.push('Part costs must be at least $0.00');
                eids.push('modalEstimatePartCost');
            }

            if(errs.length > 0) {
                var err = errs[0];
                if(errs.length > 1) {
                    err = 'Please correct the highlighted erros before adding';
                }

                for(var i=0; i<eids.length; i++) {
                    $('#' + eids[i]).addClass('error');
                }

                updateStatus(err);
            } else {
                addPart(part);
                $('#modalEstimatePartLabel, #modalEstimatePartQuantity, #modalEstimatePartCost').val('');
                $('#modalEstimatePartLabel').focus();
            }
        };

        var validateLabor = function(lab) {
            var lab = {
                label: $('#modalEstimateLaborLabel').val(),
                hours: $('#modalEstimateLaborHours').val(),
                rate: util.currency.dollarsToCents($('#modalEstimateLaborRate').val())
            }

            var errs = [];
            var eids = [];
            $('#modalEstimate .addLaborRow .error').removeClass('error');

            if(util.is.nil(lab.label)) {
                errs.push('You must fill out a name for this part');
                eids.push('modalEstimateLaborLabel');
            }

            if(!util.is.number(lab.rate)) {
                errs.push('You must fill out a rate of pay');
                eids.push('modalEstimateLaborRate');
            }

            if(!util.is.number(lab.hours)) {
                errs.push('You must enter the number of hours');
                eids.push('modalEstimateLaborHours');
            } else {
                lab.hours = parseFloat(lab.hours);
            }

            if(lab.hours <= 0) {
                errs.push('Hours must be at greater than 0');
                eids.push('modalEstimateLaborHours');
            }

            if(lab.rate < 0) {
                errs.push('You must charge at least $0.00 per hour');
                eids.push('modalEstimateLaborRate');
            }

            if(errs.length > 0) {
                var err = errs[0];
                if(errs.length > 1) {
                    err = 'Please correct the highlighted errors before adding';
                }

                for(var i=0; i<eids.length; i++) {
                    $('#' + eids[i]).addClass('error');
                }

                updateStatus(err);
            } else {
                addLabor(lab);
                $('#modalEstimateLaborLabel, #modalEstimateLaborHours, #modalEstimateLaborRate').val('');
                $('#modalEstimateLaborLabel').focus();
            }
        };

        // update the modal title
        if(settings.title) {
            $('#modalEstimateTitle').html(settings.title);
        }

        // update the modal message
        if(settings.message) {
            $('#modalEstimateMessage').html(settings.message);
        }

        // update the referral fee verbiage
        if(settings.perspective == 'buyer') {
            $('#modalEstimateReferralVerbiage').html('Service Fee');
        } else {
            $('#modalEstimateReferralVerbiage').html('Referral Fee');
        }

        // update comment on modal load
        $('#modalEstimateCommentEntry, #modalEstimateCommentEntryRead').val($('<div>').html(settings.estimate.comment).text());
        if(!settings.edit) {
            $('#modalEstimateCommentSectionRead').show();
            $('#modalEstimateCommentSection').hide();
        } else {
            $('#modalEstimateCommentSectionRead').hide();
            $('#modalEstimateCommentSection').show();
        }

        if(settings.user._id == settings.project.owner._id) {
            $('#modalEstimateCommentSectionRead').show();
            $('#modalEstimateCommentSection').hide();
        } else if(settings.user._id == settings.estimate.owner._id && settings.estimate.state != 'accepted' && settings.estimate.state != 'released' && settings.estimate.state != 'requested') {
            $('#modalEstimateCommentSectionRead').hide();
            $('#modalEstimateCommentSection').show();
        } else {
            $('#modalEstimateCommentSectionRead, #modalEstimateCommentSection').hide();
        }
        
        if(util.is.nil(settings.estimate.comment)) {
            $('#modalEstimateCommentSectionRead').hide();
        }

        // clear out all of the existing rows in the table
        $('tr.laborRow, tr.partRow').remove();

        // initialize any already-loaded tax percentages
        var setPartsTaxRate = util.percentage.to(settings.estimate.taxRate.parts, false);
        var setLaborTaxRate = util.percentage.to(settings.estimate.taxRate.labor, false);
        if(setPartsTaxRate <= 0) setPartsTaxRate = util.percentage.to(settings.user.tax.parts, false);
        if(setLaborTaxRate <= 0) setLaborTaxRate = util.percentage.to(settings.user.tax.labor, false);
        $('#modalEstimatePartsTaxRate').val(setPartsTaxRate);
        $('#modalEstimateLaborTaxRate').val(setLaborTaxRate);

        // add markup for already existing parts/material rows
        for(var i=0; i<settings.estimate.parts.length; i++) addPart(settings.estimate.parts[i], true);
        for(var i=0; i<settings.estimate.labor.length; i++) addLabor(settings.estimate.labor[i], true);

        // update diagnosis waiver row (hide if the diagnosis waiver is 0)
        if(settings.estimate.diagnosisWaiver > 0) {
            $('#modalEstimateDiagnosisWaiver').html('('+ util.currency.centsToDollars(settings.estimate.diagnosisWaiver) + ')');
            $('#modalEstimateDiagnosisWaiverTotal').html('(' + util.currency.centsToDollars(settings.estimate.diagnosisWaiver) + ')');
            $('#modalEstimateDiagnosisWaiverTotalRow').show();
        } else {
            $('#modalEstimateDiagnosisWaiverTotalRow').hide();
        }

        if(settings.user._id == settings.estimate.owner._id) {
            $('#modalEstimateAccept').hide();
            $('#modalEstimatePlace').show();
        } else {
            $('#modalEstimatePlace').hide();
            $('#modalEstimateAccept').show();
        }


        $('#modalEstimateLaborTaxRate, #modalEstimatePartsTaxRate').off('change input paste').on('change input paste', function() {
            var val = $(this).val();
            var taxDecimal = util.is.nil(val) ? 0 : util.percentage.from(val);
            if(util.is.nil(taxDecimal) && taxDecimal != 0) taxDecimal = -1;
                
            if($(this).hasClass('taxRateParts')) {
                settings.estimate.taxRate.parts = taxDecimal;
            } else {
                settings.estimate.taxRate.labor = taxDecimal;
            }

            if(taxDecimal < 0 || taxDecimal > 0.15) {
                $(this).addClass('error');
            } else {
                $(this).removeClass('error');
                updateMarkup();
            }
        });

        $('#modalEstimateAddPart').off('click').on('click', function(e) {
            validatePart();
        });

        $('#modalEstimateAddLabor').off('click').on('click', function(e) {
            validateLabor();
        });

        $('#modalEstimatePartLabel, #modalEstimatePartQuantity, #modalEstimatePartCost').keydown(function(e) {
            if(e.keyCode == 13 || e.which == 13) validatePart();
        });

        $('#modalEstimateLaborLabel, #modalEstimateLaborHours, #modalEstimateLaborRate').keydown(function(e) {
            if(e.keyCode == 13 || e.which == 13) validateLabor();
        });

        $('#workorderTabSeller').off('click touchmove touchend').on('click touchmove touchend', function(e) {
            settings.perspective = 'seller';
            $('#workorderTabBuyer').removeClass('selected');
            $(this).addClass('selected');
            updateMarkup();
        });

        $('#workorderTabBuyer').off('click touchmove touchend').on('click touchmove touchend', function(e) {
            settings.perspective = 'buyer';
            $('#workorderTabSeller').removeClass('selected');
            $(this).addClass('selected');
            updateMarkup();
        });

        updateMarkup();

        if(settings.cancelText) $('#modalEstimateCancel').html(settings.cancelText);

        modal.show($('#modalEstimate'), true, actualExit);

        // initialize bottom button showing/clicking
        $('#modalEstimatePlace').hide().off('click touchmove touchend');
        if(settings.edit) {
            $('#modalEstimatePlace').show().on('click touchmove touchend', function(e) {
                if(e.type != 'touchmove') {
                    settings.estimate.comment = $('#modalEstimateCommentEntry').val();
                    var estimate = util.estimate.virtualize(settings.estimate);

                    if(estimate.labor.length <= 0 && estimate.parts.length <= 0) {
                        updateStatus('Please fill out either parts or labor for this estimate');
                    } else if(estimate.sellerTotal < 1000) {
                        updateStatus('You must earn at least $10.00 in order to submit an estimate');
                    } else if(estimate.buyerTotal > 10000 * 100) {
                        updateStatus('You may not charge the customer over $10,000 on a single estimate (see customer view for more information)');
                    } else if(estimate.taxRate.labor < 0 || estimate.taxRate.labor > 0.15 || estimate.taxRate.parts < 0 || estimate.taxRate.parts > 0.15) {
                        updateStatus('Tax rates must be between 0% and 15%');
                    } else {
                        mfMixpanel.track('Estimate Placed', {'Is Diagnosis': false});
                        actualPlace(estimate);
                    }
                }
            });

            if(settings.placeText) {
                $('#modalEstimatePlace').html(settings.placeText);
            }
        }

        $('#modalEstimateAccept').hide().off('click touchmove touchend');
        if(!settings.edit && settings.project.owner._id == settings.user._id && settings.estimate.state == 'submitted') {
            $('#modalEstimateAccept').show().on('click touchmove touchend', function(e) {
                if(e.type != 'touchmove') {
                    actualAccept(settings.estimate);
                }
            });
        }

        $('#modalEstimateCancel').off('click touchmove touchend').on('click touchmove touchend', function(e) {
            if(e.type !== 'touchmove') {
                actualCancel();
            }
        });

        // remove the add parts/labor row if not editing
        $('#modalEstimate .editRow').hide();
        if(settings.edit) {
            $('#modalEstimate .editRow').show();
        }

        // remove the tax subtotal row if not editing and there's no tax charge
        $('#modalEstimatePartsSubtotalWithTaxRow, #modalEstimateLaborSubtotalWithTaxRow').show();
        if(!settings.edit) {
            if(settings.estimate.taxParts <= 0) {
                $('#modalEstimatePartsSubtotalWithTaxRow').hide();
            }

            if(settings.estimate.taxLabor <= 0) {
                $('#modalEstimateLaborSubtotalWithTaxRow').hide();
            }
        }

        if(settings.user.role == 'seller') {
            $('#modalEstimateWorkorderTabs').show();
        } else {
            $('#modalEstimateWorkorderTabs').hide();
        }
    },

    vehicle: function(options) {
        var defaults = {
            title: '',
            message: 'Choose from the options listed below: ',
            submit: function(vehicle) {},
            cancel: function() {},
            back: function() {},
            exit: null,
            submitText: 'Next',
            cancelText: 'Cancel',
            backText: 'Back',
            cancelOnExit: true,
            canExit: true,
            canCancel: true,
            canBack: false,
            vehicle: null
        }

        var settings = $.extend({}, defaults, options);

        if(!settings.exit) {
            if(settings.cancelOnExit) {
                settings.exit = function() {
                    return settings.cancel();
                }
            } else {
                settings.exit = function() {};
            }
        }

        var actualSubmit = function(vehicle) {
            modal.hide($('#modalVehicle'));
            settings.submit(vehicle);
        }

        var actualCancel = function() {
            modal.hide($('#modalVehicle'));
            settings.cancel();
        }

        var actualBack = function() {
            modal.hide($('#modalVehicle'));
            settings.back();
        }

        var actualExit = function() {
            modal.hide($('#modalVehicle'));
            settings.exit();
        }

        if(settings.title) {
            $('#modalVehicleTitle').html(settings.title);
        }

        if(settings.message) {
            $('#modalVehicleMessage').html(settings.message);
        }

        if(settings.submitText) {
            $('#modalVehicleTrue').html(settings.submitText);
        }

        if(settings.cancelText) {
            $('#modalVehicleFalse').html(settings.cancelText);
        }

        if(!util.is.nil(settings.vehicle)) {
            if(!util.is.nil(settings.vehicle.make))
                $('#modalVehicleSelectMake').val(settings.vehicle.make).prepend('<option value="' + settings.vehicle.make + '">' + settings.vehicle.make + '</option>');

            if(!util.is.nil(settings.vehicle.model))
                $('#modalVehicleSelectModel').val(settings.vehicle.model).prepend('<option value="' + settings.vehicle.model + '">' + settings.vehicle.model + '</option>');

            if(!util.is.nil(settings.vehicle.year))
                $('#modalVehicleSelectYear').val(settings.vehicle.year).prepend('<option value="' + settings.vehicle.year + '">' + settings.vehicle.year + '</option>');

            if(!util.is.nil(settings.vehicle.engine))
                $('#modalVehicleCylinders').val(settings.vehicle.engine);

            if(!util.is.nil(settings.vehicle.mileage))
                $('#modalVehicleMileage').val(settings.vehicle.mileage);
        }

        var updateStatus = function(message, err) {
            err = (typeof(err) === 'boolean') ? err : false;

            $('#modalVehicleStatus').stop().fadeTo(300, 0, function() {
                $(this).html(message).stop().fadeTo(300, 1);
            });
        }

        var trySubmit = function(vehicle) {
            $('#modalVehicleSelectMake').removeClass('error');
            $('#modalVehicleSelectModel').removeClass('error');
            $('#modalVehicleSelectYear').removeClass('error');
            $('#modalVehicleCylinders').removeClass('error');
            $('#modalVehicleMileage').removeClass('error');

            var errs = [];
            var eids = [];
            if(util.is.nil(vehicle.make)) {
                errs.push('You must select a vehicle make');
                eids.push('modalVehicleSelectMake');
            }

            if(util.is.nil(vehicle.model)) {
                errs.push('You must select a vehicle model');
                eids.push('modalVehicleSelectModel');
            }

            if(isNaN(vehicle.year) || vehicle.year < 1900) {
                errs.push('You must select a vehicle year');
                eids.push('modalVehicleSelectYear');
            }

            if(isNaN(vehicle.engine) || vehicle.engine < 0) {
                errs.push('You must enter a valid amount of vehicle cylinders');
                eids.push('modalVehicleCylinders');
            }

            if(isNaN(vehicle.mileage) || vehicle.mileage < 0) {
                errs.push('You must enter a valid mileage on the vehicle');
                eids.push('modalVehicleMileage');
            }

            if(errs.length > 0) {
                var err = errs[0];
                if(errs.length > 1) {
                    err = 'Please correct the highlighted errors before adding';
                }

                for(var i=0; i<eids.length; i++) {
                    $('#' + eids[i]).addClass('error');
                }

                updateStatus(err, true);
            } else {
                actualSubmit(vehicle);
            }
        }

        $('#modalVehicleTrue').off('click').on('click', function(e) {
            var vehicle = {
                make: $('#modalVehicleSelectMake').val(),
                model: $('#modalVehicleSelectModel').val(),
                year: parseInt($('#modalVehicleSelectYear').val()),
                engine: parseInt($('#modalVehicleCylinders').val()),
                mileage: parseInt($('#modalVehicleMileage').val())
            }

            trySubmit(vehicle);
        });

        $('#modalVehicleFalse').off('click');
        if(settings.canExit && settings.canCancel) {
            $('#modalVehicleFalse').on('click', function(e) {
                actualCancel();
            }).show();
        } else {
            $('#modalVehicleFalse').hide();
        }

        $('#modalVehicleBack').off('click').hide();
        if(settings.canBack) {
            $('#modalVehicleBack').on('click', function(e) {
                actualBack();
            }).show();
        }

        modal.show($('#modalVehicle'), settings.canExit, actualExit);
    },


}

$(document).ready(function() {
    modal.init();
});
