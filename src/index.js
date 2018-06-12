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

// Socket server related requirements
const app = express();
const routes = require('./routes/index');
app.use(routes);
const server = http.createServer(app);
const io = socketIo(server);
server.listen(port, () => log.info(`Listening on port: ${port}`));

// Settings and config related requirements
const prefs = new Preferences('com.bytedriven.nlog', defaultPreferences());
// First of all, we need to load in any config files from the config directory
// These will be the files which specify which logs to watch and what to do with them
let configs = [];
const watchers = [];
const clients = [];
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

//TODO: extract this code below to another file

// Add the incoming client to a list so we can keep track of them
function rememberSocket(socket) {
    clients.push(socket);
}

/* 
 * This event fires whenever a Watcher places a new record into its DB
 * We need to remember the socket connection in an array somewhere
 * and also send the client a list of watchers for it to subscribe to
 */
io.on('connection', (socket) => {
    log.warning('Incoming connection');
    rememberSocket(socket);
    const mappedWatchers = watchers.filter((watcher) => {return watcher.active}).map((watcher) => {
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
