'use strict';

/**
 * Module dependencies.
 */
var contracts = require('contracts'),
f = contracts.filters;

exports.tagsSchema = {
		  type: 'object',
		  additionalProperties: false,
		  filters: f.cleanObject(),
		  properties: {
		    value: { type: 'string'}
		  }
		};
