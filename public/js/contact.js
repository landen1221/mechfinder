var contact = {
    submitClicked: false,
    canSubmit: true,

    nil: function(string) {
        if(typeof(string) == 'undefined' || string == ' ' || string == '') return true;
        return false;
    },

    init: function() {
        $('#contactSubmit').on('click touchstart', function(e) {
            if(!contact.submitClicked) {
                contact.submitClicked = true;
                setTimeout(function(){ contact.submitClicked = false; }, 300);

                if(contact.canSubmit) {
                    contact.submit();
                }
            }
        });
    },

    highlightFields: function(fieldIDs) {
        for(i=0; i<fieldIDs.length; i++) {
            $('#'+fieldIDs[i]).addClass('error');
        }
    },

    unHightlightFields: function() {
        $('.error').removeClass('error');
    },

    updateStatus: function(message, error) {
        if(contact.nil(error)) { error = false; }

        $('#contactStatus').stop().fadeTo(300, 0, function() {
            if(!error) {
                $('#contactStatus').removeClass('error')
            } else {
                $('#contactStatus').addClass('error');
            }

            $('#contactStatus').html(message).stop().fadeTo(300, 1);
        });
    },

    submit: function() {
        contact.canSubmit = false;

        contact.unHightlightFields();
        contact.updateStatus('Submitting your contact request...');

        var first = $('#contactFirst').val();
        var last = $('#contactLast').val();
        var email = $('#contactEmail').val();
        var subject = $('#contactSubject').val();
        var topic = $('#contactTopic').val();
        var message = $('#contactMessage').val();

        var errors = [];
        var errIDs = [];
        if(contact.nil(first)) {
            errors.push('Please enter your first name');
            errIDs.push('contactFirst');
        }

        if(contact.nil(last)) {
            errors.push('Please enter your last name');
            errIDs.push('contactLast');
        }

        var emailRegExp = /[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?/i;
        if(contact.nil(email) || !emailRegExp.test(email)) {
            errors.push('Please enter a valid email address');
            errIDs.push('contactEmail');
        }

        if(contact.nil(subject)) {
            errors.push('Please enter a subject line');
            errIDs.push('contactSubject');
        }

        if(contact.nil(topic)) {
            errors.push('Please select a topic');
            errIDs.push('contactTopic');
        }

        if(contact.nil(message)) {
            errors.push('Please enter a message');
            errIDs.push('contactMessage');
        } else if(message.length > 4000) {
            errors.push('Your message can not exceed 4000 characters');
            errIDs.push('contactMessage');
        }

        if(errors.length > 0) {
            var err;
            if(errors.length > 1) {
                err = 'Please correct the highlighted errors before continuing';
            } else {
                err = errors[0];
            }

            contact.updateStatus(err, true);
            contact.highlightFields(errIDs);
            contact.canSubmit = true;
        } else {
            var body = {
                first: first,
                last: last,
                email: email,
                subject: subject,
                topic: topic,
                message: message,
                clientInfo: contact.clientInfo()
            }

            var request = $.ajax({
                method: 'post',
                url: '/api/contact',
                data: body,
                dataType: 'json'
            });

            request.success(function( data ) {
                contact.updateStatus('Your message has been sent. Thank you for using MechFinder.');
                $('#contactFirst').val('');
                $('#contactLast').val('');
                $('#contactEmail').val('');
                $('#contactSubject').val('');
                $('#contactTopic').val('General');
                $('#contactMessage').val('');
            });

            request.fail(function( jqXHR, textStatus ) {
                contact.canSubmit = true;
                res = jqXHR.responseJSON;
                var status = '';
                var eid = '';
                switch(res.ecode) {
                    case 1:
                        // bad first name
                        status = 'Please enter your first name';
                        eid = 'contactFirst';
                        break;
                    case 2:
                        // bad last name
                        status = 'Please enter your last name';
                        eid = 'contactLast';
                        break;
                    case 3:
                        // bad email
                        status = 'Please enter a valid email';
                        eid = 'contactEmail';
                        break;
                    case 4:
                        // bad subject
                        status = 'Please enter a subject line';
                        eid = 'contactSubject';
                        break;
                    case 5:
                        // bad topic
                        status = 'Please choose a topic';
                        eid = 'contactTopic';
                        break;
                    case 6:
                        // bad message
                        status = 'Please enter your message';
                        eid = 'contactMessage';
                        break;
                    case 7:
                        // character count > 4000
                        status = 'Please limit your message to 4,000 characters or less';
                        eid = 'contactMessage';
                        break;
                    default:
                        status = 'There was an error while sending your message';
                        break;
                }

                if(!contact.nil(eid)) {
                    $('#'+eid).addClass('error');
                }

                contact.updateStatus(status, true);
            });
        }
    },

    clientInfo: function() {
        var nVer = navigator.appVersion;
        var nAgt = navigator.userAgent;
        var browserName  = navigator.appName;
        var fullVersion  = ''+parseFloat(navigator.appVersion);
        var majorVersion = parseInt(navigator.appVersion,10);
        var nameOffset,verOffset,ix;

        // In Opera, the true version is after "Opera" or after "Version"
        if ((verOffset=nAgt.indexOf("Opera"))!=-1) {
            browserName = "Opera";
            fullVersion = nAgt.substring(verOffset+6);
            if ((verOffset=nAgt.indexOf("Version"))!=-1)
            fullVersion = nAgt.substring(verOffset+8);
        }
        // In MSIE, the true version is after "MSIE" in userAgent
        else if ((verOffset=nAgt.indexOf("MSIE"))!=-1) {
            browserName = "Microsoft Internet Explorer";
            fullVersion = nAgt.substring(verOffset+5);
        }

        // In Chrome, the true version is after "Chrome"
        else if ((verOffset=nAgt.indexOf("Chrome"))!=-1) {
            browserName = "Chrome";
            fullVersion = nAgt.substring(verOffset+7);
        }
        // In Safari, the true version is after "Safari" or after "Version"
        else if ((verOffset=nAgt.indexOf("Safari"))!=-1) {
            browserName = "Safari";
            fullVersion = nAgt.substring(verOffset+7);
            if ((verOffset=nAgt.indexOf("Version"))!=-1)
            fullVersion = nAgt.substring(verOffset+8);
        }
        // In Firefox, the true version is after "Firefox"
        else if ((verOffset=nAgt.indexOf("Firefox"))!=-1) {
            browserName = "Firefox";
            fullVersion = nAgt.substring(verOffset+8);
        }
        // In most other browsers, "name/version" is at the end of userAgent
        else if ( (nameOffset=nAgt.lastIndexOf(' ')+1) <
            (verOffset=nAgt.lastIndexOf('/')) )
        {
            browserName = nAgt.substring(nameOffset,verOffset);
            fullVersion = nAgt.substring(verOffset+1);
            if (browserName.toLowerCase()==browserName.toUpperCase()) {
                browserName = navigator.appName;
            }
        }
        // trim the fullVersion string at semicolon/space if present
        if ((ix=fullVersion.indexOf(";"))!=-1)
            fullVersion=fullVersion.substring(0,ix);
        if ((ix=fullVersion.indexOf(" "))!=-1)
            fullVersion=fullVersion.substring(0,ix);

        majorVersion = parseInt(''+fullVersion,10);
        if (isNaN(majorVersion)) {
            fullVersion  = ''+parseFloat(navigator.appVersion);
            majorVersion = parseInt(navigator.appVersion,10);
        }

        var info = {};

        info.browserName = browserName;
        info.fullVersion = fullVersion;
        info.majorVersion = majorVersion;
        info.appName = navigator.appName;
        info.userAgent = navigator.userAgent;


        var OSName="Unknown OS";
        if (navigator.appVersion.indexOf("Win")!=-1) OSName="Windows";
        if (navigator.appVersion.indexOf("Mac")!=-1) OSName="MacOS";
        if (navigator.appVersion.indexOf("X11")!=-1) OSName="UNIX";
        if (navigator.appVersion.indexOf("Linux")!=-1) OSName="Linux";

        info.os = OSName;

        return info;
    }
}

$(document).ready(function() {
    contact.init();
});
