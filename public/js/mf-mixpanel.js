$(document).ready(function() {
    mfMixpanel.init();
});

var mfMixpanel = {
    prefix: '',
    user: null,
    devMode: true,

    init: function() {
        console.log('mfMixpanel init');
        mfMixpanel.devMode = DEVMODE;
        mfMixpanel.user = USER;

        if (mfMixpanel.devMode === true) {
            mfMixpanel.prefix = 'DEV-';
        }

        if (mfMixpanel.user !== null) {
            mfMixpanel.setPerson();
        }

        mfMixpanel.trackPageView();
    },

    track: function(event, data) {
        if (typeof data === 'undefined') {
            data = {};
        }
        data['Dev Mode'] = mfMixpanel.devMode;

        mixpanel.track(mfMixpanel.prefix + event, data);
        if (typeof FB != 'undefined') {
            FB.AppEvents.logEvent(mfMixpanel.prefix + event);
        }
    },

    timedTrack: function(event, data) {
        if (typeof data === 'undefined') {
            data = {};
        }
        mixpanel.time_event(mfMixpanel.prefix + event);
        mfMixpanel.track(event, data);
    },

    setPerson: function(user) {
        if (typeof user === 'undefined'){
            user = mfMixpanel.user;
        }

        mixpanel.identify(user._id);
        mixpanel.people.set({
            "$first_name": mfMixpanel.prefix + user.first_lower,
            "$last_name": user.last_lower,
            "$created": user.created,
            "$email": user.email,
            'Role': user.role,
            'Development': mfMixpanel.devMode
        });
    },

    trackPageView: function() {
        mfMixpanel.timedTrack('Page View',{'Page Title': document.title});
    }
};