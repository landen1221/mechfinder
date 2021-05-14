var sellerControls = {
    user: null,

    init: function() {
        console.log('admin seller controls init');

        if(util.is.nil(USER)) return window.location.reload(true);
        sellerControls.user = USER;

        $('.savingIcon').stop().fadeTo(1, 0);

        sellerControls.clicks.init();
    },

    clicks: {
        clicked: {
            save: false
        },

        init: function() {
            $('.saveReferral').off('click touchmove touchend').on('click touchmove touchend', function(e) {
                if(e.type != 'touchmove' && !sellerControls.clicks.clicked.save) {
                    sellerControls.clicks.clicked.save = true;
                    setTimeout(function() {
                        sellerControls.clicks.clicked.save = false;
                    }, 300);

                    var referralType = $(this).attr('data-type');
                    sellerControls.saveReferral(referralType);
                }
            });
        }
    },

    saveReferral: function(referralType) {
        if(referralType == 'diagnosis' || referralType == 'workorder') {
            var idPart = (referralType == 'diagnosis') ? 'Diagnosis' : 'Workorder';
            var percentage = $('#referralRate' + idPart).val();
            var decimal = util.percentage.from(percentage);
            console.log(decimal);


            $('#savingReferral' + idPart).removeClass('fa-check fa-exclamation-triangle').addClass('fa-cog fa-spin').stop().fadeTo(300, 1);
            if(util.is.nil(decimal) || decimal < 0 || decimal > 1) {
                alert('You must enter a valid amount for the referral diagnosis percentage');
                    $('#savingReferral' + idPart).removeClass('fa-cog fa-spin').addClass('fa-exclamation-triangle');
            } else {
                var body = {
                    userId: sellerControls.user._id,
                    referralType: referralType,
                    referralRate: decimal
                };

                var request = $.ajax({
                    method: 'POST',
                    url: '/admin/api/updateReferral',
                    data: body,
                    dataType: 'json'
                });

                request.done(function(data) {
                    $('#savingReferral' + idPart).removeClass('fa-cog fa-spin').addClass('fa-check');
                    window.location.reload(true);
                });

                request.fail(function(jqXHR) {
                    console.log(jqXHR);
                    alert('There was an error while saving the users referral rate');
                    $('#savingReferral' + idPart).removeClass('fa-cog fa-spin').addClass('fa-exclamation-triangle');
                });
            }
        } else {
            alert('Invalid referral type');
        }
    }
};

$(document).ready(function(e) {
    sellerControls.init();
});