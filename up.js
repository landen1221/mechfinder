var coffee = require('coffee-script')
var http = require('http')
var watchFolder = require('./app/util').watchFolder

process.chdir(__dirname);

switch (process.env.NODE_ENV) {
    case 'dev':
    case 'test':
        port = 80;
        break;

    default:
        port = 3000;
        break;
}
// launch the server
server = http.Server().listen(port)
var up = require('up')(server,
    __dirname,
    {
        workerPingInterval: '2s',
        numWorkers: 5,
        workerTimeout: '3s',
        keepAlive: true
    })

// reload the server when we see changes to the app
watchFolder(
    './app',
    function() { return true; },
    function (ev, fn) {
        console.log ("  .. Saw change in " + fn + ", reloading server.");
        up.reload();
    },
    function () {}
);

// now monitor the process and restart if we can't fetch the home page
var failed = 0;             // current number of consequetive failed checks
var failedThreshold = 5;    // number of consequetive failed checks before process restart
var delay = 1000 * 2;      // delay (in ms) between checks
var failedCheck = function() {
    failed++;
    if (failed >= failedThreshold)
    {
        console.log("Exceeded failure threshold, restart server...");
        failed = 0;
        up.reload();
    }
    return false;
};
var healthCheck = function() {
    var timedOut = false;
    var req = http.get(
        {
            port: port,
            path: '/'
        },
        function (res) {
            res.on('data', function(chunk) {});
            res.on('end', function() {
                if (!(res.statusCode == 200 || res.statusCode == 304))
                {
                    console.log("Received unhealthy status of " + res.statusCode);
                    failedCheck();
                }
                else
                {
                    if (failed > 0) {
                        failed = 0;
                        console.log("Returned to healthy status.");
                    }
                }
                setTimeout(healthCheck, delay);
            });
    });
    req.setTimeout(1000*6, function() {
        timedOut = true
        console.log("Timed out checking health.");
        failedCheck();
        req.abort();
        setTimeout(healthCheck, delay);
    });
    req.on('error', function(err) {
        if (!timedOut)
        {
            console.log("Health check connection failed with " + err.code + ": " + err.message);
            failedCheck();
            setTimeout(healthCheck, delay);
        }
    });
};

// begin health checks
setTimeout(healthCheck, delay);
