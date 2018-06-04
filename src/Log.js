'use strict';

const   prettyjson = require('prettyjson');
const   colors = {
            Reset:    "\x1b[0m",
            FgRed:    "\x1b[31m",
            FgGreen:  "\x1b[32m",
            FgYellow: "\x1b[33m",
            FgBlue:   "\x1b[34m",
            BgRed:    "\x1b[41m",
        }

const Log = {
    success: (stringMessage) => {console.log(`${colors.FgGreen}${stringMessage}${colors.Reset}`)},
    warning: (stringMessage) => {console.log(`${colors.FgYellow}${stringMessage}${colors.Reset}`)},
    danger:  (stringMessage) => {console.log(`${colors.FgRed}${stringMessage}${colors.Reset}`)},
    info:    (stringMessage) => {console.log(`${colors.FgBlue}${stringMessage}${colors.Reset}`)},
    error:   (stringMessage) => {console.log(`${colors.BgRed}${stringMessage}${colors.Reset}`)},
    json:    (stringMessage) => {console.log(prettyjson.render(stringMessage))},
};

module.exports = Log;
