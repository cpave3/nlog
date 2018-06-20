'use strict';

const express   = require('express');
const http      = require('http');
const socketIo  = require('socket.io');
const Datastore = require('nedb');

const events    = require('./eventEngine');
const Watcher   = require('./Watcher');
const prefs     = require('./preferences');
const log       = require('./Log');

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
        log.warning('WIP');
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