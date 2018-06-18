'use strict';

// The test runner requirements
const chai  = require('chai');
const expect = chai.expect;

// The things we want to test
const helpers = require('../src/helpers');

describe('helpers.bulkReplace', () => {
    it('should turn \\ into \\\\', () => {
        expect(helpers.bulkReplace('\\', [[/\\/g, '\\\\']])).to.equal('\\\\');
    })

    it('should return \'cats and dogs\' when given /rats/cats/g', () => {
        expect(helpers.bulkReplace('rats and dogs', [[/rats/g, 'cats']])).to.equal('cats and dogs');
    })
});