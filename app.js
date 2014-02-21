
/**
 * Module dependencies.
 */

var express = require('express');
var http = require('http');
var path = require('path');

// var routes = require('./routes');
// var user = require('./routes/user');

// Import the Anagrammatix game file.
var agx = require('./agxgame');


var app = express();

// all environments
app.use(express.logger('dev'));
app.use(express.static(path.join(__dirname, 'public')));

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

var server = require('http').createServer(app).listen(80);

// Create a Socket.IO server and attach it to the http server
var io = require('socket.io').listen(server);

// Reduce the logging output of Socket.IO
io.set('log level',1);

// Listen for Socket.IO Connections. Once connected, start the game logic.
io.sockets.on('connection', function (socket) {
    //console.log('client connected');
    agx.initGame(io, socket);
});
