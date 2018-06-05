'use strict';

// Define consts
const   connection      = new(require('nosqlite').Connection)();
const   port            = process.env.PORT || 4001;
const   express         = require('express'),
        http            = require('http'),
        log             = require('./Log'),
        events          = require('./eventEngine'),
        socketIo        = require('socket.io');
const   program         = require('commander');
const   pjson           = require('../package.json');
const   Preferences     = require('preferences');

const   { addConfig, defaultPreferences, loadConfigs, validateConfig } = require('./configManagement');
const   Watcher        = require('./Watcher'); 

const prefs = new Preferences('com.bytedriven.nlog', defaultPreferences());
// FIrst of all, we need to load in any config files from the config directory
// These will be the files which specify which logs to watch and what to do with them
let configs = [];
const watchers = [];
loadConfigs(prefs.config.dir)
    .then((arrayConfigs) => {
        configs = arrayConfigs;
    })
    .then(() => {
        // Now the we hopefully have some configs, we should process them and start watching files as requested
        configs.forEach((config) => {
            if (validateConfig(config)) {
                watchers.push(new Watcher(config));
            }
        });
    })
    .then(() => {
        if (watchers) {
            watchers.forEach((watcher) => {
                if (watcher.active) {
                    watcher.assignConnection(connection)
                        .then((success) => {
                            watcher.startWatching();
                        })
                        .catch((err) => {
                            log.error(`Error: ${err}`);
                        });
                }
            });
        }
    })
    .catch((err) => {
        log.error(`Error: ${err}`);
    });

events.on('newLine', (data) => {
    log.warning('Event incoming');
    log.json(data);
});

program
    .version(pjson.version || '0.0.1')
    .description(pjson.description || '')
    .action(() => {
        log.warning('Nothing happened... yet.');
    });

program
    .command('view:pref')
    .action(() => {
        log.json(prefs);
    });

program
    .command('add <config>')
    .alias('a')
    .description('Add a new cofig file to watch')
    .action((config) => addConfig(config));

program.parse(process.argv);
