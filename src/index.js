#!/usr/local/bin/node
'use strict';

// Define consts

const program  = require('commander');
const log      = require('./Log');
const pjson    = require('../package.json');
const prefs    = require('./preferences');
const { initiateWatchers, viewDatastores } = require('./Logic');

program
    .version(pjson.version || '0.0.1')
    .description(pjson.description || '');

program
    .command('start')
    .alias('s')
    .option('-d, --detach', 'Run the nlog server in headless mode')
    .description('Start the nlog server and initiate all active watchers')
    .action((cmd) => initiateWatchers(cmd.detach));

// TODO: This command should let the user view their current config
program
    .command('view:pref')
    .alias('vp')
    .description('View the current preferences')
    .action(() => {
        log.json(prefs);
    });

// TODO: This command should present the user with the power to view all datastores
program
    .command('view:data')
    .alias('vd')
    .description('View the current datastore')
    .action(() => viewDatastores());

// TODO: This command should present the user with the power to clean up old data stores
program
    .command('clean')
    .description('Expunge old datastores')
    .action(() => {});

// TODO: This command should allow the quick addition of config files
program
    .command('add <config>')
    .option('-ln, --link', 'Make a synbolic link instead of copying the file')
    .alias('a')
    .description('Add a new cofig file to watch')
    .action((config, cmd) => {
        //addConfig(config)
        log.json({
            config: config,
            link: cmd.link
        });
    });

program.parse(process.argv);
