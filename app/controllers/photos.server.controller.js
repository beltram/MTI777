'use strict';

/**
 * Module dependencies.
 */
var mongoose = require('mongoose'),
photosModel = require('../models/photos.server.model').photosSchema,
tagsModel = require('../models/tags.server.model').tagsSchema,
contracts = require('contracts'),
f = contracts.filters,
_ = require('lodash'),
instagramAuth = require('./instagram.auth.server.controller'),
async = require('async'),
ig = require('instagram-node').instagram();

ig.use({ access_token: '1666698932.ed925da.e55d1f6c17d545ab894c9edece8e213e' });
ig.use({ client_id: 'ed925da22e42426db63fb67d7fe2cad3',
	client_secret: 'cd7060f962f148bd8481ad3f053043ae' });

var foursquare = require('node-foursquare-venues')('WE0CCLWUMHAXV25DRQWYTIX4DONT2FL3OBCDHPBYWCDF1O5D',
'W4XOR1RPF4BSBP4342LNK0BO3EALSRK5WON4L4TY1PUESYZ5');

var flickr = require('flickrapi'),
flickrOptions = {
	api_key: '34cf529e2a0f669bcef5785ec98dddbd',
	secret: '11a79ac824a54e0c',
	user_id: '131095906@N04',
	access_token: '72157650956215917-aebb5ba7161b5fae',
	access_token_secret: '2ec06afbe1180b19'
};

var number_of_apis = 2;

/*
 * user id
 * 1666698932
 */

var sort_by = function(field, reverse, primer){
	var key; 
	if(primer) {
		key = function(x) {return primer(x[field]);};
	} else {
		key = function(x) {return x[field];};
	}
	reverse = !reverse ? 1 : -1;
	return function (a, b) {
		return a = key(a), b = key(b), reverse * ((a > b) - (b > a));
	};
};

var getProximity = function (lat1, lon1, lat2, lon2, unit) {
	var radlat1 = Math.PI * lat1/180,
	radlat2 = Math.PI * lat2/180,
	radlon1 = Math.PI * lon1/180,
	radlon2 = Math.PI * lon2/180,
	theta = lon1-lon2,
	radtheta = Math.PI * theta/180,
	dist = Math.sin(radlat1) * Math.sin(radlat2) + Math.cos(radlat1) * Math.cos(radlat2) * Math.cos(radtheta);

	dist = Math.acos(dist);
	dist = dist * 180/Math.PI;
	dist = dist * 60 * 1.1515;
	if (unit==='km') { dist = dist * 1.609344; }
	if (unit==='n') { dist = dist * 0.8684; }
	return dist;
};

var getCoordinate = function(country,region,city,callback) {
	flickr.authenticate(flickrOptions, function(error, flickr) {
		flickr.places.resolvePlaceURL({
			api_key: '131095906@N04',
			url: '/'+country+region+city+''
		}, function(err, result) {
			var loc = result.location;
			callback(loc.latitude,loc.longitude);
		});
	});
};

var instaToModel = function(photos,lat,lon,limit,sortBy,sort,callback) {
	var aggr = [];
	for (var i in photos) {
		var ph = photos[i],
		r,
		prox = getProximity(ph.location.latitude, ph.location.longitude, lat, lon, 'km');

		var a=[];
		var tags = ph.tags;
		for(var j in tags) {
			var t = tags[j];
			var res = contracts.transform({
				value: t
			}, tagsModel);
			a.push(res);
		}

		if(ph.caption) {
			r = contracts.transform({
				id: ph.id,
				provider: 'Instagram',
				latitude: ph.location.latitude+'',
				longitude: ph.location.longitude+'',
				proximity: prox+'',
				owner_id: ph.user.id,
				owner_name: ph.user.full_name,
				owner_profile_picture: ph.user.profile_picture,
				tags: a,
				type: ph.type,
				url: ph.images.standard_resolution.url,
				date_created: ph.created_time,
				full_date_created: new Date(ph.created_time*1000),
				title: ph.caption.text
			}, photosModel);
		} else {
			r = contracts.transform({
				id: ph.id,
				provider: 'Instagram',
				latitude: ph.location.latitude+'',
				longitude: ph.location.longitude+'',
				proximity: prox+'',
				owner_id: ph.user.id,
				owner_name: ph.user.full_name,
				owner_profile_picture: ph.user.profile_picture,
				tags: a,
				type: ph.type,
				url: ph.images.standard_resolution.url,
				date_created: ph.created_time,
				full_date_created: new Date(ph.created_time*1000)
			}, photosModel);
		}
		aggr.push(r);
	}

	aggr = aggr.sort(sort_by(sortBy, sort, parseFloat));
	aggr = aggr.slice(0,limit);
	callback(aggr);
};

var flickrToModel = function(photos,lat,lon,limit,sortBy,sort,callback) {
	var aggr = [];
	flickr.authenticate(flickrOptions, function(error, flickr) {
		var getInfo = function(err,re){
			var ph = re.photo,
			prox = getProximity(ph.location.latitude, ph.location.longitude, lat, lon, 'km');
			var a=[];
			var tags = ph.tags.tag;
			for(var i in tags) {
				var t = tags[i];
				var res = contracts.transform({
					value: t.raw
				}, tagsModel);
				a.push(res);
			}
			var r = contracts.transform({
				id: ph.id,
				provider: 'Flickr',
				latitude: ph.location.latitude,
				longitude: ph.location.longitude,
				proximity: prox+'',
				owner_id: ph.owner.nsid,
				owner_name: ph.owner.realname,
				owner_profile_picture: 'http://farm'+ph.owner.iconfarm+'.staticflickr.com/'+ph.owner.iconserver+'/buddyicons/'+ph.owner.nsid+'.jpg',
				tags: a,
				type: ph.media,
				url: 'https://farm'+ph.farm+'.staticflickr.com/'+ph.server+'/'+ph.id+'_'+ph.secret+'.jpg',
				date_created: ph.dates.posted,
				full_date_created: new Date(ph.dates.posted*1000),
				title: ph.title._content
			}, photosModel);			
			aggr.push(r);
			if(aggr.length===photos.length) {
				aggr = aggr.sort(sort_by(sortBy, sort, parseFloat));
				aggr = aggr.slice(0,limit);
				callback(aggr);
			}
		};

		for(var i in photos) {
			var p = photos[i];
			flickr.photos.getInfo({
				api_key: '131095906@N04',
				photo_id: p.id
			},getInfo);
		}
	});	
};

exports.getPhotosByCoordinates = function(req, res) {
	var par = req.params,
	sortBy = req.param('sortBy') ? req.param('sortBy') : 'date_created',
			_limit = req.param('limit') ? req.param('limit') : 100,
					sort = req.param('sort')==='desc' ? true : req.param('sort')==='asc' ? false : true,
							radius = req.param('radius') ? req.param('radius') : 1000,
							latitude = par.latitude,
							longitude = par.longitude;
			console.log(latitude,longitude);
			async.parallel([
			                function(callback){
			                	var options = {};
			                	options.count=100;
			                	options.distance = radius;
			                	ig.media_search(Number(latitude),Number(longitude),options, function(err, medias, remaining, limit) {
			                		instaToModel(medias,Number(latitude),Number(longitude),_limit*number_of_apis,sortBy,sort,function(r){
			                			callback(null,r); 
			                		});
			                	});
			                }, 
			                function(callback){
			                	flickr.authenticate(flickrOptions, function(error, flickr) {
			                		flickr.photos.search({
			                			api_key: '131095906@N04',
			                			lat: latitude,
			                			lon: longitude,
			                			radius: Math.floor(radius/1000),
			                			radius_units: 'km',
			                			per_page: 100
			                		}, function(err, result) {
			                			var photos = result.photos.photo;
			                			flickrToModel(photos,Number(latitude),Number(longitude),_limit*number_of_apis,sortBy,sort,function(r){
			                				callback(null,r);
			                			});
			                		});
			                	});
			                }
			                ],
			                function(err, results){
				var f;
				if(results[0] && results[1]) f = results[0].concat(results[1]);
				else if (results[0]) f = results[0];
				else f = results[1];
				//sort the result with the parameter specified in the url
				var fi = f.sort(sort_by(sortBy, sort, parseFloat));
				//truncate the result
				fi=fi.slice(0,_limit);
				res.send(fi);
			});
};

exports.getPhotosByFullLocation = function(req, res) {
	var par = req.params,
	sortBy = req.param('sortBy') ? req.param('sortBy') : 'date_created',
			_limit = req.param('limit') ? req.param('limit') : 100,
					sort = req.param('sort')==='desc' ? true : req.param('sort')==='asc' ? false : true,
							radius = req.param('radius') ? req.param('radius') : 1000,
							country = par.country,
							region = par.region,
							city=par.city;	
			if(!country) {
				res.send('Syntax Error : Add at least a country name');
			} else {
				country+='/';
				if(!region) {
					region='';
					city='';
				} else {
					region+='/';
					if(!city) {
						city='';
					}
				}		 
			}
			getCoordinate(country,region,city,function(lat,lon){
				async.parallel([
				                function(callback){
				                	var options = {};
				                	options.count=10;
				                	options.distance = radius;
				                	ig.media_search(Number(lat),Number(lon),options, function(err, medias, remaining, limit) {
				                		instaToModel(medias,Number(lat),Number(lon),_limit*number_of_apis,sortBy,sort,function(r){
				                			callback(null,r); 
				                		});
				                	});
				                }, 
				                function(callback){
				                	flickr.authenticate(flickrOptions, function(error, flickr) {
				                		flickr.photos.search({
				                			api_key: '131095906@N04',
				                			lat: lat,
				                			lon: lon,
				                			radius: Math.floor(radius/1000),
				                			radius_units: 'km',
				                			per_page: 10
				                		}, function(err, result) {
				                			var photos = result.photos.photo;
				                			flickrToModel(photos,Number(lat),Number(lon),_limit*number_of_apis,sortBy,sort,function(r){
				                				callback(null,r);
				                			});
				                		});
				                	});
				                }
				                ],
				                function(err, results){
					var f;
					if(results[0] && results[1]) f = results[0].concat(results[1]);
					else if (results[0]) f = results[0];
					else f = results[1];
					//sort the result with the parameter specified in the url
					var fi = f.sort(sort_by(sortBy, sort, parseFloat));
					//truncate the result
					fi=fi.slice(0,_limit);
					res.send(fi);
				});
			});
};











