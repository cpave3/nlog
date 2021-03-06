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

describe('helpers.removeFile', () => {
    it('should return FALSE on an empty path', () => {
        expect(helpers.removeFile()).to.equal(false);
    }); 
    it('should return FALSE if it fails to perform the action', () => {
        expect(helpers.removeFile(() => {})).to.equal(false);
    });
    it('should return TRUE if it succeeds in removing the file', () => {
        const path = require('path');
        const fs = require('fs');
        fs.writeFile(path.join(__dirname, 'tempfile'), 'this file should have been deleted', (err) => {
            if(err) {
                assert.fail('Failed to write test file');
            }
            expect(helpers.removeFile(path.join(__dirname, 'tempfile'))).to.equal(true);
        }); 
    });
});