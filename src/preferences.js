'use strict';

const Preferences = require('preferences');
const { defaultPreferences } = require('./configManagement');
// Settings and config related requirements
const prefs = new Preferences('com.bytedriven.nlog', defaultPreferences());

module.exports = prefs;