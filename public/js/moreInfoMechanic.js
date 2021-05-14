$(document).ready(function(e) {
    $('.tab.flat-button').click(function() {
        $('div.main-content').hide();
        $('div.' + this.getAttribute('tab')).show();
        return false;
    });
});
