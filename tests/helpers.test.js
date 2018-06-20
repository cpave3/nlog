'use strict';

// The test runner requirements
const chai  = require('chai');
const expect = chai.expect;
const assert = chai.assert;

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

describe('helpers.getDirContents', () => {
    it('should return an error for an invalid directory', (done) => {
        const badFile = 'test.badfile';
        const arrayFiles = helpers.getDirContents(badFile);
        const errorMessage = `Invalid directory specified: ${badFile}`;
        arrayFiles
        .then((array) => {
            assert.fail(array);
            done();
        })
        .catch((error) => {
            expect(error).to.not.be.null;
            expect(error).to.not.be.undefined;
            expect(error).to.equal(errorMessage);
            done();
        });
    });

    it('should return an array of file names for a single valid directory', (done) => {
        const arrayFiles = helpers.getDirContents(__dirname);
        arrayFiles
        .then((array) => {
            expect(array).to.be.an('array');
            expect(array).to.not.be.null;
            expect(array).to.not.be.undefined;
            // It might be empty though, to be fair
            done();
        })
        .catch((error) => {
            console.log(error);
            assert.fail(error, []);
            done();
        });
    });

    it('should return an array of arrays of file names for multiple valid directories', (done) => {
        const arrayFiles = helpers.getDirContents(__dirname, '../');
        arrayFiles
        .then((array) => {
            expect(array).to.be.an('array');
            expect(array).to.not.be.null;
            expect(array).to.not.be.undefined;
            // It might be empty though, to be fair
            done();
        })
        .catch((error) => {
            console.log(error);
            assert.fail(error, []);
            done();
        });
    });
});