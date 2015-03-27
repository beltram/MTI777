'use strict';

/**
 * Module dependencies.
 */
var contracts = require('contracts'),
f = contracts.filters;

exports.photosSchema = {
		  type: 'object',
		  additionalProperties: false,
		  filters: f.cleanObject(),
		  properties: {
		    id: { type: 'string', required: true },
		    provider: { type: 'string', required: true },
		    latitude: { type: 'string', required: true },
		    longitude: { type: 'string', required: true },
		    country: { type: 'string'},
		    region: { type: 'string'},
		    city: { type: 'string'},
		    proximity: { type: 'string', required: true },
		    owner_id: { type: 'string'},
		    owner_name: { type: 'string'},
		    owner_profile_picture: { type: 'string'},
		    tags: { type: 'array'},
		    type: { type: 'string'},
		    url: { type: 'string', required: true },
		    date_created: { type: 'string'},
		    full_date_created: { type: 'date'},
		    title: { type: 'string'}
		  }
		};
