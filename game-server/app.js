var pomelo = require('pomelo');
var routeUtil = require('./app/util/routeUtil');
/**
 * Init app for client.
 */
var app = pomelo.createApp();
app.set('name', 'chatofpomelo');


// app configure
app.configure('production|development', function() {
	// route configures
	app.route('chat', routeUtil.chat);

	// filter configures
	app.filter(pomelo.timeout());

	// connection config
	app.set('connectorConfig',
        {
            connector : pomelo.connectors.sioconnector,
            heartbeat : 3,
            heartbeatTimeout : 5,
            closeTimeout: 5
        });
});

// start app
app.start();

process.on('uncaughtException', function(err) {
	console.error(' Caught exception: ' + err.stack);
});