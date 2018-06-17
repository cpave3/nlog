#!/usr/local/bin/node
'use strict';

// Define consts

const program  = require('commander');
const log      = require('./Log');
const pjson    = require('../package.json');
const prefs    = require('./preferences');
const { initiateWatchers } = require('./Logic');




program
    .version(pjson.version || '0.0.1')
    .description(pjson.description || '');

program
    .command('start')
    .alias('s')
    .option('-d, --detach', 'Run the nlog server in headless mode')
    .description('Start the nlog server and initiate all active watchers')
    .action((cmd) => initiateWatchers(cmd.detach));

/**
 * DEBUG, will probably be removed
 */
program
    .command('view:pref')
    .action(() => {
        log.json(prefs);
    });

/**
 * TODO: Implement usage
 */
program
    .command('add <config>')
    .alias('a')
    .description('Add a new cofig file to watch')
    .action((config) => addConfig(config));

program.parse(process.argv);
