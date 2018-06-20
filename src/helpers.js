'use strict';

const fs = require('fs');
const path = require('path');

const methods = {
    bulkReplace: (input = '', arrayReplacements = []) => {
        // Each item in arrayReplacements should be a regex/string pair.
        // The regex will be matched and replaced with the string.
        // This is just a bulk abstraction of String.replace()
        return arrayReplacements
            .filter((pair) => {
                // This will return all pairs with a RegExp and String
                return pair instanceof Array && 
                       pair.length === 2 && 
                       pair[0] instanceof RegExp &&
                       typeof pair[1] == 'string';
            })
            .reduce((accum, pair) => {
                // Apply each of the modifications to the input string
                return accum.replace(pair[0], pair[1]);
            }, input);
    },
    stringEscape: (input = '', options = { slashes: true }) => {
        // This method takes an input string and applies RegEx substitutions to it based in the input object
        const replacements = [];
        if(options.slashes) {replacements.push([/\\/g, '\\\\'])}
        return methods.bulkReplace(input, replacements);
    },
    objectify: (input, strict = false) => {
        // We need to take the input and return an object representation of it, similar to JSON.parse
        try {
            return JSON.parse(methods.stringEscape(input, { slashes: true }));
        } catch (error) {
            // Something is not right with the input, and it cannot be converted into an object in this way
            if (strict) {
                // If we are operating in strict mode, we will return undefined, because null and false are both
                // Technically valid JSON.
                return undefined;
            }
            // Otherwise, we will return the input as it was given
            return input;
        }
    },
    mkdirp: (targetPath) => {
        // We are provided with a path which needs to be created, mkdir -p style
        targetPath
            .split(path.sep)
            .reduce((currentPath, dir) => {
                // We get an array of each dir on the path, and synchronously 
                // make them if they don't already exist
                currentPath += dir + path.sep;
                if (!fs.existsSync(currentPath)){
                    fs.mkdirSync(currentPath);
                }
                return currentPath;
            }, '');
    },
    getDirContents: async (firstPath, ...extraPaths) => {
        return new Promise( async (resolve, reject) => {
            // Here, we should rescursively verify and generate directories
            try {
                const arrayPaths = [firstPath, ...extraPaths];
                const arrayResults = [];
                arrayPaths.forEach(directoryPath => {
                    if (fs.existsSync(directoryPath)) {
                        const items = fs.readdirSync(directoryPath);
                        arrayResults.push(items);
                    } else {
                        reject(`Invalid directory specified: ${directoryPath}`)
                    }
                });
                resolve(arrayResults.length === 1 ? arrayResults[0] : arrayResults);
            } catch (error) {
                reject(error.message);
            }
        })
    }
};

module.exports = methods;