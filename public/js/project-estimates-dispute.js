var disputeEstimate = {
    project: null,
    user: null,
    data: {
        projectId: '',
        userId: '',
        category: '',
        message: ''
    },
    
    init: function() {
        console.log('start a dispute');
        disputeEstimate.user = USER;
        disputeEstimate.project = PROJECT;

        if(util.is.nil(disputeEstimate.user)) return window.location.reload(true);
        if(util.is.nil(disputeEstimate.project)) return window.location.reload(true);

        disputeEstimate.clicks.init();
    },

    estimateWithId: function(id) {
        for(var i=0; i<disputeEstimate.project.bids.length; i++) {
            var estimate = disputeEstimate.project.bids[i];
            if(estimate._id == id) return estimate;
        }

        return null;
    },

    clicks: {
        clicked: {
            start: false
        },

        init: function() {
            $('.startDispute').off('click touchmove touchend').on('click touchmove touchend', function(e) {
                if(e.type != 'touchmove' && !disputeEstimate.clicks.clicked.start) {
                    disputeEstimate.clicks.clicked.start = true;
                    setTimeout(function() {
                        disputeEstimate.clicks.clicked.start = false;
                    }, 300);

                    disputeEstimate.dispute();
                }
            });
        }
    },

    dispute: function() {
        var title = 'Challenge With this Job?';
        var message = 'The first step in resolving a problem is to contact your ' + (disputeEstimate.user.role == 'buyer' ? 'mechanic' : 'customer') + '. If you have tried this and are still experiencing a problem, please click Next.';

        modal.notify({
            title: title,
            message: message,
            okayText: 'Next',
            okay: function() {
                disputeEstimate.category();
            }
        });
    },

    category: function() {
        var options = [];

        if(disputeEstimate.user.role == 'buyer') {
            options = [
                'I am unable to get in touch with the mechanic',
                'I am having issues with my mechanic',
                'I am unsatisfied with the repair',
                'I am having trouble with the website',
                'I have questions about payment',
                'Other'
            ];
        } else {
            options = [
                'I am unable to get in touch with the customer',
                'I am having issues with my customer',
                'I am having trouble with the website',
                'I have questions about payment',
                'Other'
            ];
        }

        modal.select({
            title: 'Select Best Option',
            message: 'What is it that you are having issues with?',
            options: options,
            submit: function(value) {
                disputeEstimate.data.category = value;
                disputeEstimate.message();
            }
        });
    },

    message: function() {
        console.log('showing the message modal');
        modal.input({
            title: 'Contact MechFinder Support Team',
            message: 'Let MechFinder know what you are needing help with',
            textarea: true,
            condensed: false,
            submit: function(message) {
                disputeEstimate.data.message = message;
                disputeEstimate.submit();
            }
        });
    },

    submit: function() {
        console.log('submitting: ');
        disputeEstimate.data.projectId = disputeEstimate.project._id;
        disputeEstimate.data.userId = disputeEstimate.user._id;
        console.log(disputeEstimate.data);

        modal.notify({
            title: 'Sending Request',
            message: 'A MechFinder representative is being notified of your request.',
            canOkay: false,
            canExit: false,
            loading: true
        });

        var body = disputeEstimate.data;
        var request = $.ajax({
            method: 'POST',
            url: '/api/ticket',
            data: body,
            dataType: 'json'
        });

        request.done(function(ticket) {
            modal.notify({
                title: 'Help Request Sent',
                message: 'Thank you for contacting MechFinder. We are usually able to respond within a day.<br /><br />Ticket Number: ' + ticket.number
            });
        });

        request.fail(function(jqXHR) {
            console.log(jqXHR);
        });
    }
};

$(document).ready(function() {
    disputeEstimate.init();
});