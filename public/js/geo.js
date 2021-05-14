var geo = {
    initialized: false,
    connected: false,

    location: {
        ip: '',
        source: '',
        state: '',
        country: '',
        city: '',
        lat: 0.0,
        long: 0.0,
        postal: ''
    },

    init: function() {
        if(navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(function(position) {
                geo.connect(position.coords.latitude, position.coords.longitude);
                geo.initialized = true;
            }, function(e) {
                if(e.code == e.PERMISSION_DENIED) {
                    geo.fallback();
                    geo.initialized = true;
                }
            });
        }
    },

    connect: function(lat, long) {
        geo.location.source = 'browser';
        geo.location.lat = lat;
        geo.location.long = long;

        var body = {
            source: geo.location.source,
            lat: geo.location.lat,
            long: geo.location.long
        };

        var request = $.ajax({
            type: 'POST',
            url: '/api/geo',
            data: body,
            dataType: 'json'
        });

        request.success(function(data) {
            geo.location.ip = data.ip;
            geo.location.country = data.country;
            geo.location.city = data.city;
            geo.location.postal = data.postal;
            geo.location.state = data.state;

            geo.connected = true;
        });

        request.fail(function(jqXHR) {
            console.log('Failed to process the request data by browser');
            geo.connected = false;
        });
    },

    fallback: function() {
        console.log('User has denied location from the browser. Falling back to IP');
        geo.location.source = 'ip';

        var body = {
            source: geo.location.source
        };

        var request = $.ajax({
            type: 'POST',
            url: '/api/geo',
            data: body,
            dataType: 'json'
        });

        request.success(function(data) {
            geo.location.ip = data.ip;
            geo.location.country = data.country;
            geo.location.city = data.city;
            geo.location.postal = data.postal;
            geo.location.state = data.state;
            geo.location.lat = data.lat;
            geo.location.long = data.long;

            geo.connected = true;
        });

        request.fail(function(jqXHR) {
            console.log('Failed to send the request data by ip');
            geo.connected = false;
        });
    }
};

$(document).ready(function(e) {
    geo.init();
});
