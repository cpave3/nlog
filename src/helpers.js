'use strict';
const methods = {
    objectify: (input, strict = false) => {
        // We need to take the input and return an object representation of it, similar to JSON.parse
        let output;
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
    stringEscape: (input = '', options = { slashes: true }) => {
        // This method takes an input string and applies RegEx substitutions to it based in the input object
        if(options.slashes) {input = input.replace(/\\/g, '\\\\')}
        return input;
    },
};

module.exports = methods;