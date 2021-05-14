var discounts = {
    user: false,

    init: function() {
        $('#addDiscount').on('click', function(e) {
            discounts.addDiscount();
        });

        if(util.is.nil(USER)) return window.location.reload(true);

        discounts.user = USER;
    },
    
    addDiscount: function() {
        var name = $('#discountName').val();
        var number = parseInt($('#discountNumber').val()) || 0;
        var unit = ($('#discountUnit').val() == '$') ? 'amount' : 'rate';
        var kind = $('#discountKind').val();
        var expMM = $('#discountExpMM').val();
        var expDD = $('#discountExpDD').val();
        var expYYYY = $('#discountExpYYYY').val();
        var uses = parseInt($('#discountUses').val());

        if(number <= 0) return alert('You must enter a positive number for discount amount');

        if(unit == 'amount') number = util.currency.dollarsToCents(number);
        else number = util.percentage.from(number);

        var month = parseInt(expMM);
        var day = parseInt(expDD);
        var year = parseInt(expYYYY);

        var expiration = '';
        var badExpiration = false;
        if(month < 0 && (day > 0 || year > 2015)) badExpiration = true;
        else if(day < 1 && ((month >= 0 && month < 12) || year > 2015)) badExpiration = true;
        else if(year < 2016 && ((month >=0 && month < 12) || day > 0)) badExpiration = true;
        
        if(badExpiration) return alert('Invalid expiration date (leave on MM / DD / YYYY to never expire this discount, or set all three dropdowns to select an expiration date)');

        if(!(month < 0 && day < 1 && year < 2016)) {
            var expiration = new Date(year, month, day);
            var now = new Date();
            if(expiration.getTime() < now.getTime()) return alert('You must select an expiration date in the future');
        }

        var confirmed = true;
        if(name.length > 10) confirmed = confirm('The discount name will show up as a select box in the workorder modal. I recommend keeping under 10 characters in length. Are you sure you want to use this label in the dropdown?\n\n' + name);
        if(!confirmed) return null;

        console.log('kind: ' + kind);
        if(unit == 'rate') {
            var userDiagnosis = discounts.user.referral.diagnosis;
            var userWorkorder = discounts.user.referral.workorder;
            var underDiagnosis = (number <= userDiagnosis);
            var underWorkorder = (number <= userWorkorder);

            if(kind == 'diagnosis' && !underDiagnosis) return alert('Your discount rate cannot exceed the user\'s referral rate of ' + util.percentage.to(userDiagnosis));
            else if(kind == 'workorder' && !underWorkorder) return alert('Your discount rate cannot exceed the user\'s referral rate of ' + util.percentage.to(userWorkorder));
            else if(kind == '' && !underDiagnosis || !underWorkorder) {
                var focusedRate = (userDiagnosis < userWorkorder) ? userDiagnosis : userWorkorder;
                return alert('Your discount rate must not exceed the user\'s lowest referral rate: ' + util.percentage.to(focusedRate));
            }
        }

        var discount = {
            label: name,
            number: number,
            unit: unit,
            kind: kind,
            expiration: expiration,
            uses: uses,
            userId: discounts.user._id
        };

        var request = $.ajax({
            method: 'POST',
            url: '/admin/api/addDiscount',
            data: discount,
            dataType: 'json'
        });

        request.done(function(data) {
            alert('Discount added to user acount');
            window.location.reload(true);
        });

        request.fail(function(jqXHR) {
            console.log(jqXHR);
            alert('Discount addition failed to save. Refresh the page to verify');
        });
    }
};

$(document).ready(function() {
    discounts.init();
});