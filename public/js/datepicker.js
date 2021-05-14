var datepicker = {
    init: function() {

        
        var html = '';
        for(var i=0; i<12; i++) {
            html += '<option value="' + i + '">' + util.time.monthName(i) + '</option>';
        }
        $('select[name="mfDatePickerMM"]').html(html);


        var today = new Date();
        var year = today.getFullYear();
        html = '';
        for(var i=0; i<10; i++) {
            html += '<option value="' + (i+year) + '">' + (i+year) + '</option>';
        }
        $('select[name="mfDatePickerYY"]').html(html);
        
        $('select[name="mfDatePickerMM"]').on('change', function() {
            var mm = $(this).val();
            var yy = $(this).siblings('select[name="mfDatePickerYY"]').val();
            var $element = $(this).siblings('select[name="mfDatePickerDD"]');

            datepicker.updateDays($element, parseInt(mm), parseInt(yy));
        });
        
        $('select[name="mfDatePickerYY"]').on('change', function() {
            var yy = $(this).val();
            var mm = $(this).siblings('select[name="mfDatePickerMM"]').val();
            var $element = $(this).siblings('select[name="mfDatePickerDD"]');

            datepicker.updateDays($element, parseInt(mm), parseInt(yy));
        });

        datepicker.updateDays($('select[name="mfDatePickerDD"]'), today.getMonth(), today.getFullYear());

        $('select[name="mfDatePickerMM"]').val(today.getMonth());
        $('select[name="mfDatePickerDD"]').val(today.getDate());
        $('select[name="mfDatePickerYY"]').val(today.getFullYear());
    },

    updateDays: function($element, month, year) {
        var days = util.time.daysInMonth(month, year);

        var currentDay = parseInt($element.val());
        var staySelected = false;
        if(currentDay <= days) staySelected = true;

        var html = '';
        for(var i=1; i<days+1; i++) {
            html += '<option value="' + i + '" ' + ((staySelected && i == currentDay) ? 'selected="selected"' : '') + '> ' + i + ' </option>';
        }

        $element.html(html);
        if(!staySelected) $element.val('1');
    }
};

$(document).ready(function() {
    datepicker.init();
});