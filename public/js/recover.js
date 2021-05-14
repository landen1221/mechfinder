var recover = {
    init: function() {
        recover.reset.init();
        recover.recover.init();
    },

    nil: function(obj) {
        return (typeof(obj) === 'undefined' || obj == null || obj == '' || obj == ' ')
    },

    recover: {
        recoverClicked: false,
        canRecover: true,

        data: {
            email: ''
        },

        errs: [],
        eids: [],

        init: function() {
            $('#recoverSubmit').on('click touchstart', function(e) {
                if(recover.recover.canRecover && !recover.recover.recoverClicked) {
                    recover.recover.recoverClicked = true;
                    setTimeout(function() { recover.recover.recoverClicked = false; }, 300);

                    recover.recover.submit();
                }
            });
        },

        submit: function() {
            $('#recoverContent input.error').removeClass('error');
            recover.recover.canRecover = false;

            recover.recover.data.email = $('#recoverEmail').val();

            recover.recover.errs = [];
            recover.recover.eids = [];
            var emailRegExp = /[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?/i;
            if(recover.nil(recover.recover.data.email) || !emailRegExp.test(recover.recover.data.email)) {
                recover.recover.errs.push('Please enter a valid email');
                recover.recover.eids.push('recoverEmail');
            }

            if(recover.recover.errs.length > 0) {
                if(recover.recover.errs.length > 1) {
                    recover.recover.updateStatus('Please correct the highlighted errors above', true);
                } else {
                    recover.recover.updateStatus(recover.recover.errs[0]);
                }

                for(i=0; i<recover.recover.eids.length; i++) {
                    $('#'+recover.recover.eids[i]).addClass('error');
                }

                $('#'+recover.recover.eids[0]).focus();
                recover.recover.canReset = true;
            } else {
                recover.recover.updateStatus('Changing your password...');
                var request = $.ajax({
                    url: "/api/recover",
                    method: "POST",
                    data: recover.recover.data,
                    dataType: "json"
                });

                request.success(function(data) {
                    recover.recover.updateStatus('A recovery link has been sent to this email if it is registered');
                });

                request.fail(function(jqXHR, textStatus) {
                    recover.recover.updateStatus('There was an error while recovering your account');
                    recover.recover.canReset = true;
                });
            }
        },

        updateStatus: function(message, err) {
            if(typeof(err) !== 'boolean') err = false;

            $('#recoverStatus').stop().fadeTo(300, 0, function() {
                if(err) {
                    $(this).addClass('error');
                } else {
                    $(this).removeClass('error');
                }

                $(this).html(message).stop().fadeTo(300, 1);
            });
        }
    },

    reset: {
        resetClicked: false,
        canReset: true,

        user: '',
        key: '',

        data: {
            email: '',
            password: '',
            repeat: ''
        },

        errs: [],
        eids: [],

        init: function() {
            recover.reset.key = KEY;

            $('#resetSubmit').on('click touchstart', function(e) {
                if(recover.reset.canReset && !recover.reset.resetClicked) {
                    recover.reset.resetClicked = true;
                    setTimeout(function() { recover.reset.resetClicked = false; }, 300);

                    recover.reset.submit();
                }
            });
        },

        submit: function() {
            $('#resetContent input.error').removeClass('error');
            recover.reset.canReset = false;

            recover.reset.data.email = $('#resetEmail').val();
            recover.reset.data.password = $('#resetPassword').val();
            recover.reset.data.repeat = $('#resetRepeat').val();
            recover.reset.data.key = recover.reset.key;

            recover.reset.errs = [];
            recover.reset.eids = [];
            var emailRegExp = /[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?/i;
            if(recover.nil(recover.reset.data.email) || !emailRegExp.test(recover.reset.data.email)) {
                recover.reset.errs.push('Please enter a valid email');
                recover.reset.eids.push('resetEmail');
            }

            if(recover.nil(recover.reset.data.password) || recover.reset.data.password.length < 6) {
                recover.reset.errs.push('Passwords must be 6 or more characters');
                recover.reset.eids.push('resetPassword');
            }

            if(recover.reset.data.password !== recover.reset.data.repeat) {
                recover.reset.errs.push('Passwords do not match');
                recover.reset.eids.push('resetRepeat');
            }

            if(recover.reset.errs.length > 0) {
                if(recover.reset.errs.length > 1) {
                    recover.reset.updateStatus('Please correct the highlighted errors above', true);
                } else {
                    recover.reset.updateStatus(recover.reset.errs[0]);
                }

                for(i=0; i<recover.reset.eids.length; i++) {
                    $('#'+recover.reset.eids[i]).addClass('error');
                }

                $('#'+recover.reset.eids[0]).focus();
                recover.reset.canReset = true;
            } else {
                recover.reset.updateStatus('Changing your password...');
                var request = $.ajax({
                    url: "/api/recover/reset",
                    method: "POST",
                    data: recover.reset.data,
                    dataType: "json"
                });

                request.success(function(data) {
                    recover.reset.updateStatus('Your password has been changed');
                });

                request.fail(function(jqXHR, textStatus) {
                    recover.reset.updateStatus('There was an error changing your password');
                    recover.reset.canReset = true;
                });
            }
        },

        updateStatus: function(message, err) {
            if(typeof(err) !== 'boolean') err = false;

            $('#resetStatus').stop().fadeTo(300, 0, function() {
                if(err) {
                    $(this).addClass('error');
                } else {
                    $(this).removeClass('error');
                }

                $(this).html(message).stop().fadeTo(300, 1);
            });
        }
    }
}

$(document).ready(function() {
    recover.init();
});
