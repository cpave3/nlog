'use strict';

/**
 * This is simply to share a single event emitter between all 
 * of the files so everything can be controlled from a single point
 */

const events = require('events');
const eventEmitter = new events.EventEmitter();

module.exports = eventEmitter;
