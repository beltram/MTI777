'use strict';
/**
 * Module dependencies.
 */
var init = require('./config/init')(),
	config = require('./config/config'),
	mongoose = require('mongoose'),
	chalk = require('chalk');

var express = require('express');
var api = require('instagram-node').instagram();
var app = express();



api.use({
	  client_id: 'ed925da22e42426db63fb67d7fe2cad3',
	  client_secret: 'cd7060f962f148bd8481ad3f053043ae'
	});

var redirect_uri = 'http://localhost:3000/handleauth';

module.exports.authorize_user = function(req, res) {
	console.log('authorize user');
	  //res.redirect(api.get_authorization_url(redirect_uri, { scope: ['likes'], state: 'a state' }));
	};


/**
 * Main application entry file.
 * Please note that the order of loading is important.
 */

// Bootstrap db connection
var db = mongoose.connect(config.db, function(err) {
	if (err) {
		console.error(chalk.red('Could not connect to MongoDB!'));
		console.log(chalk.red(err));
	}
});

// Init the express application
var app = require('./config/express')(db);

// Bootstrap passport config
require('./config/passport')();




// Start the app by listening on <port>
app.listen(config.port);

// Expose app
exports = module.exports = app;

// Logging initialization
console.log('MEAN.JS application started on port ' + config.port);



