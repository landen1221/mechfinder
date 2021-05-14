var estimatesTable = {
    project: null,

    init: function() {
        console.log('estimates table init');

        estimatesTable.project = PROJECT;
        if(util.is.nil(estimatesTable.project)) return window.location.reload(true);

        estimatesTable.clicks.init();
    },

    clicks: {
        clicked: {
            action: false
        },

        init: function() {
            $('.releaseEstimate').on('click touchmove touchend', function(e) {
                if(e.type != 'touchmove' && !estimatesTable.clicks.clicked.action) {
                    var id = $(this).attr('data-id');
                    estimatesTable.releaseEstimate(id);
                }
            });

            $('.refundEstimate').on('click touchmove touchend', function(e) {
                if(e.type != 'touchmove' && !estimatesTable.clicks.clicked.action) {
                    var id = $(this).attr('data-id');
                    estimatesTable.refundEstimate(id);
                }
            });
        }
    },

    releaseEstimate: function(id) {
        console.log('releasing estimate: ' + id);

        var conf = confirm('Are you sure you wish to release this estimate to the mechanic?');

        if(conf) {
            $('#actionsCell'+id).html('<i class="fa fa-cog fa-spin fa-fw"></i>');

            var body = {
                projectId: estimatesTable.project._id,
                estimateId: id
            };

            var request = $.ajax({
                method: 'POST',
                url: '/admin/api/releaseEstimate',
                data: body,
                dataType: 'json'
            });

            request.done(function(data) {
                console.log('yayyayayyaayayaya');
                console.log(data);
                alert('The payment for this estimate has been released to the mechanic');
                window.location.reload(true);
            });

            request.fail(function(jqXHR) {
                console.log(jqXHR);
                alert('There was an error while releasing this estimate');
                window.location.reload(true);
            });
        }
    },

    refundEstimate: function(id) {
        console.log('refunding estimate: ' + id);

        var conf = confirm('Are you sure you wish to refund this estimate to the customer?');

        if(conf) {
            $('#actionsCell'+id).html('<i class="fa fa-cog fa-spin fa-fw"></i>');

            var body = {
                projectId: estimatesTable.project._id,
                estimateId: id
            };

            var request = $.ajax({
                method: 'POST',
                url: '/admin/api/refundEstimate',
                data: body,
                dataType: 'json'
            });

            request.done(function(data) {
                console.log('refunded, oooooh');
                console.log(data);
                alert('The payment for this estimate has been refunded to the customer');
                window.location.reload(true);
            });

            request.fail(function(jqXHR) {
                console.log(jqXHR);
                alert('There was an error while releasing this estimate');
                window.location.reload(true);
            });
        }
    }
};

$(document).ready(function() {
    estimatesTable.init();
});