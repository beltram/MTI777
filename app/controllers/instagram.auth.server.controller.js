'use strict';

/**
 * Get the error message from error object
 */

var api = require('instagram-node').instagram();

api.use({
	  client_id: 'ed925da22e42426db63fb67d7fe2cad3',
	  client_secret: 'cd7060f962f148bd8481ad3f053043ae'
	});

var redirect_uri = 'http://localhost:3000/instagram/handleauth';

exports.authorize_user = function(req, res) {
	  res.redirect(api.get_authorization_url(redirect_uri, { scope: ['likes'], state: 'a state' }));
};

exports.handleauth = function(req, res) {
	  api.authorize_user(req.query.code, redirect_uri, function(err, result) {
	    if (err) {
	      console.log(err.body);
	      res.send('Did not work');
	    } else {
	      console.log('Yay! Access token is ' + result.access_token);
	      res.send(result.access_token);
	    }
	  });
};
	
exports.getAccessToken = function() {
	
};