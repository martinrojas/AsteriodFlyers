
/**
 * Module dependencies.
 */

var express = require('express'),
	routes  = require('./routes'),
	api     = require('./routes/api'),
	http    = require('http'),
	path    = require('path');

// var routes = require('./routes');
// var user = require('./routes/user');

// Import the Terminus logic.
// var terminus = require('./terminus');

var app = module.exports = express();

/**
 * Configuration
 */

// all environments
// all environments
app.set('port', process.env.PORT || 8080);
app.set('views', __dirname + '/views');
app.set('view engine', 'jade');
app.use(express.logger('dev'));
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(express.static(path.join(__dirname, 'public')));
app.use(app.router);

// development only
if (app.get('env') === 'development') {
  app.use(express.errorHandler());
}

// production only
if (app.get('env') === 'production') {
  // TODO
}

/**
 * Routes
 */

// serve index and view partials
app.get('/', routes.index);
app.get('/partials/:name', routes.partials);

// JSON API
app.get('/api/name', api.name);

// redirect all others to the index (HTML5 history)
app.get('*', routes.index);


/**
 * Start Server
 */

http.createServer(app).listen(app.get('port'), function () {
  console.log('Express server listening on port ' + app.get('port'));
});


// var server = require('http').createServer(app).listen(process.env.PORT || 8080);

// Create a Socket.IO server and attach it to the http server
// var io = require('socket.io').listen(server);
// Reduce the logging output of Socket.IO
// io.set('log level',1);
// Listen for Socket.IO Connections. Once connected, start the game logic.
// io.sockets.on('connection', function (socket) {
    //console.log('client connected');
    // terminus.initGame(io, socket);
// });
