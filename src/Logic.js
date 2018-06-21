'use strict';

const express   = require('express');
const http      = require('http');
const socketIo  = require('socket.io');
const Datastore = require('nedb');
const path      = require('path');
const fs        = require('fs');

const events    = require('./eventEngine');
const Watcher   = require('./Watcher');
const prefs     = require('./preferences');
const log       = require('./Log');
const helpers   = require('./helpers');

const { addConfig, loadConfigs, validateConfig }  = require('./configManagement');

const port = process.env.PORT || 4001;

// Socket server related requirements
const app     = express();
const routes  = require('./routes/index'); 
app.use(routes);
const server  = http.createServer(app);
const io      = socketIo(server);


// First of all, we need to load in any config files from the config directory
// These will be the files which specify which logs to watch and what to do with them
let   configs  = [];
const watchers = [];
const clients  = [];

const methods = {
    initiateWatchers: (detach) => {
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
                        watcher.assignConnection(Datastore)
                            .then((success) => {
                                watcher.startWatching();
                            })
                            .catch((err) => {
                                log.error(`Error: ${err}`);
                            });
                    }
                });
            }
            methods.startListening();
        })
        .catch((err) => {
            log.error(`Error: ${err}`);
        });
    },
    rememberSocket: (socket) => {
        clients.push(socket);
    },
    startListening: () => {
        server.listen(port, () => {
            log.info(`Listening on port: ${port}`)
        });
    },
    viewDatastores: () => {
        // This command needs to pluck the contents of the data and config directories and get details on their files
        // First, we need to get the directories and make sure they are both set and exist
        const homeDir = process.env[(process.platform == 'win32') ? 'USERPROFILE' : 'HOME'];
        const defaultSettingsDir = path.join(homeDir, '.nlog', 'conf.d');
        const defaultDataDir = path.join(homeDir, '.nlog', 'data');
        if (!prefs.config || ! prefs.config.dir) {
            prefs.config = {
                dir: defaultSettingsDir
            };
        }
        if (!prefs.data || ! prefs.data.dir) {
            prefs.data = {
                dir: defaultDataDir
            };
        }

        // We need to get the data and config directories first...
        helpers.getDirContents(prefs.config.dir, prefs.data.dir)
        .then(arrayResults => {
            // We should have an array with 2 sub-arrays. Each sub array will contain the respective file names. 
            const arrayConfigFiles = arrayResults[0];
            const arrayDataFiles = arrayResults[1];
            const arrayPairedData = [];
            // For each config, we need to load it in, hash it and store the hash somewhere against the config
            arrayConfigFiles.forEach(config => {
                try {
                   // attempt to load each file
                   const objectConfig = JSON.parse(fs.readFileSync(path.join(prefs.config.dir, config), 'utf8'));
                   const stringHash = require('crypto').createHash('md5').update(JSON.stringify(objectConfig), 'utf8').digest('hex');
                   // Now that we have the config and hash, we need to check if any of the data objects match this config.
                   if (arrayDataFiles.indexOf(`${stringHash}.db`) != -1) {
                       arrayPairedData.push(arrayDataFiles.splice(arrayDataFiles.indexOf(`${stringHash}.db`, 1)));
                   }                    

                } catch (error) {
                    log.error(`Error: ${error.message}`);
                    log.danger(`Invalid config found: ${path.join(prefs.config.dir, config)}`) 
                }
            });
            // With the list of Orphaned data files, we should now return them to the next layer of the promise, 
            // and let the user select which ones to clean up
            return arrayDataFiles;
        })
        .then(arrayDataFiles => {
            // const inquirer  = require('inquirer'); // No point loading this early
            log.danger('Orphaned data files:');
            log.json(arrayDataFiles);
        })
        .catch(error => {
            log.error(error);
        });
    }
};

/* 
 * This event fires whenever a Watcher places a new record into its DB
 * We need to remember the socket connection in an array somewhere
 * and also send the client a list of watchers for it to subscribe to
 */
io.on('connection', (socket) => {
    log.warning('Incoming connection');
    methods.rememberSocket(socket);
    const mappedWatchers = watchers.filter((watcher) => {
        return watcher.active
    }).map((watcher) => {
        return { name: watcher.name, uuid: watcher.uuid };
    });

    // We send the client the list of watchers to select from
    io.emit('welcome', mappedWatchers);
    socket.on('disconnect', () => log.danger('A client has disconnected'));
    socket.on('subscribe', (request) => {
        // A user has requested to subscribe to the provided watchers, we need to remember this
        if (!request || !request.watchers) return;
        request.watchers.forEach((watcherId) => socket.join(watcherId));
    });
});

events.on('newLine', (data) => {
    // From here, we need to emit the event back out to all listeners
    // only users who are listening for a given watcher should hear this though.
    if (!data) return;
    log.info(`New line found for ${data.uuid}`);
    io.in(data.uuid).emit('newLine', {...data});
});

module.exports = methods;