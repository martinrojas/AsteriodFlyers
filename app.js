
/**
 * Module dependencies.
 */

var express = require('express');
var http = require('http');
var path = require('path');

// var routes = require('./routes');
// var user = require('./routes/user');

var app = express();

// all environments
app.use(express.logger('dev'));
app.use(express.static(path.join(__dirname, 'public')));

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

var server = require('http').createServer(app).listen(8080);