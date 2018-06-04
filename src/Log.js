'use strict';

const chalk = require('chalk');
const prettyjson = require('prettyjson');

const Log = {
    success: (stringMessage) => {console.log(chalk.green(stringMessage))},
    warning: (stringMessage) => {console.log(chalk.yellow(stringMessage))},
    danger:  (stringMessage) => {console.log(chalk.red(stringMessage))},
    info:    (stringMessage) => {console.log(chalk.blue(stringMessage))},
    error:   (stringMessage) => {console.log(chalk.bgRed(stringMessage))},
    json:    (stringMessage) => {console.log(prettyjson.render(stringMessage))},
};

module.exports = Log;
