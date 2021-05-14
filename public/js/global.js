$(document).ready(function(e) {
    calendar.init();
});

var calendar = {
    init: function() {
        $( ".datepicker" ).datepicker();
    }
}
