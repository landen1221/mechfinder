var zonify = {
    init: function() {
        $('.zonify').each(function(index, element) {
            var dateString = $(element).data('date');
            var dateFormat = $(element).data('format');
            var converted = zonify.convert(dateString, dateFormat);

            $(element).html(converted);
        });
    },

    convert: function(dateString, dateFormat) {
        dateFormat = util.is.nil(dateFormat) ? 'MM/DD/YYYY' : dateFormat;

        if(!util.is.nil(dateString)) {
            var date = new Date(dateString);
            return util.time.format(date, dateFormat);
        }

        return '';
    }
};

$(document).ready(function() {
    zonify.init();
});
