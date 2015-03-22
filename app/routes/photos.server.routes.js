'use strict';

/**
 * Module dependencies.
 */
var photos = require('../../app/controllers/photos.server.controller'),
flickrAuth = require('../../app/controllers/flickr.auth.server.controller'),
instagramAuth = require('../../app/controllers/instagram.auth.server.controller');

module.exports = function(app) {
	app.route('/photos/place/:country?/:region?/:city?')
		.get(photos.getPhotosByFullLocation);
	
	app.route('/photos/coord/:latitude/:longitude')
	.get(photos.getPhotosByCoordinates);
	/*
	app.route('/flickr/authorize_user')
	.get(flickrAuth.authorize_user);
	
	app.route('/flickr/handleauth')
	.get(flickrAuth.handleauth);
	
	app.route('/instagram/authorize_user')
	.get(instagramAuth.authorize_user);
	
	app.route('/instagram/handleauth')
	.get(instagramAuth.handleauth);*/
};