'use strict';

// The test runner requirements
const chai  = require('chai');
const expect = chai.expect;

// The things we want to test
const Watcher = require('../src/Watcher');

const sampleValidConfig = require('./sampleValidConfig.json');

describe('Watcher', () => {
    it('should fail with missing config', () => {
        expect(() => {new Watcher()}).to.throw(TypeError);
    });

    // it('should work with a valid config', () => {
    //     const watcher = new Watcher(sampleConfig);
    // });
});