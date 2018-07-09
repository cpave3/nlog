'use strict';

const fs        = require('fs');
const Tail      = require('tail-forever');
const log       = require('./Log');
const events    = require('./eventEngine');
const path      = require('path');
const prefs     = require('./preferences');
const { objectify, mkdirp } = require('./helpers');

class Watcher {

    constructor(config) {
        this.rawConfig    = config || {};
        this.targetFile   = config.target || null;
        this.regexFilter  = this.regexStringToExp(config.rules.regex || '.*');
        this.expected     = config.rules.matches || this.defaultMatches();
        this.historic     = config.rules.processHistoricData || false;
        this.tail         = config.rules.tail || true;
        this.active       = this.verifyTarget() || false;
        this.databaseName = config.store || this.slugify(this.targetFile);
        this.name         = config.name || this.databaseName;
        this.uuid         = this.generateHash(config);
    }

    generateHash(objectToHash) {
        // TODO: This needs to be deterministic so that the UUID remains the same between restarts
        // This could possibly be done by hashing the config file itself (event though that may not be a guid)
        return require('crypto')
            .createHash('md5')
            .update(JSON.stringify(objectToHash), 'utf8')
            .digest('hex')
    }

    verifyTarget(targetFile = this.targetFile) {
        // Logic here to see if the file exists
        if (this.rawConfig.active === false) {
            return false;
        }
        return fs.existsSync(targetFile);
    }

    regexStringToExp(stringExpression = '^.*$') {
        // Somehow convert the string into proper regex here
        return new RegExp(stringExpression, 'g');
    }

    slugify(stringInput = this.targetFile || '') {
        return stringInput
            .toLowerCase()
            .trim()
            .replace(/[/.]/g, '-')
            .replace(/^[^a-z0-9]/g, '')
            .replace(/--/g, '-');
    }

    defaultMatches() {
        return [
            {
                name: 'data',
                type: 'string',
            }
        ];
    }

    startWatching() {
        this.tail = new Tail(this.targetFile);
        log.success(`Started Watching: ${this.name || this.targetFile}`);
        this.tail.on('line', (line) => {
            // We have a line, and need to process it
            this.regexFilter.lastIndex = 0;
            const match = this.regexFilter.exec(line);
            if (match) {
                // We are now hopefully getting the matches
                // we need to compare what we got to our expected matches
                const stringMatch = match.shift();
                if (this.expected.length === match.length) {
                    // The regex returned the correct number of matches
                    const processed = {};
                    match.forEach((value, index) => {
                        // If we are expecting a special type, such as JSON, process it, otherwise, save it verbatim
                        let processedValue = null;
                        try {
                            processedValue = (this.expected[index].type && this.expected[index].type == 'json') 
                            ? JSON.parse(value) 
                            : value;
                        } catch (error) {
                            // Something happemed, probably bad JSON, so we will just get the raw value to avoid errors.
                            processedValue = value;
                        }

                        processed[this.expected[index].name] = processedValue ;
                    });
                    // Save the record to the DB
                    this.db.insert(processed, (err, record) => {
                        if (err) {
                            log.error(`Error: ${err}`);
                        }
                        // Send it to our listeners
                        events.emit('newLine', {
                            uuid: this.uuid,
                            record: record
                        });
                    });
                }
            } else {
                log.danger('Bad line recieved');
            }
        });
        // If something goes wrong while tailing, log it to the server console.
        this.tail.on('error', (err) => {
            log.error(`Error: ${err}`);
        });
    }

    /**
     * This should instantiate the DB instance based on the ID hash of the configuration
     * @param {*} connection 
     */
    assignConnection(Datastore) {
        return new Promise( async (resolve, reject) => {
            try {
                if (!prefs.data) {
                    // For some reason the data dir doesn't exist, so we need to set it.
                    const homeDir = process.env[(process.platform == 'win32') ? 'USERPROFILE' : 'HOME'];
                    const defaultDataDir = path.join(homeDir, '.nlog', 'data');
                    prefs.data = {
                        dir: defaultDataDir
                    };
                    await mkdirp(prefs.data.dir);
                }
                this.db = new Datastore({ filename: `${path.join(prefs.data.dir, `${this.uuid}.db`)}`, autoload: true });
                resolve(true);
            } catch (err) {
                reject(err);
            }
        })
    }
}

module.exports = Watcher;
