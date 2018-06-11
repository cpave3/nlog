'use strict';

const fs        = require('fs');
const Tail      = require('tail-forever');
const log       = require('./Log');
const events    = require('./eventEngine');

class Watcher {

    constructor(config) {
        this.rawConfig    = config;
        this.targetFile   = config.target;
        this.regexFilter  = this.regexStringToExp(config.rules.regex || '.*');
        this.expected     = config.rules.matches || this.defaultMatches();
        this.historic     = config.rules.processHistoricData || false;
        this.tail         = config.rules.tail || true;
        this.active       = this.verifyTarget() || false;
        this.databaseName = config.store || this.slugify(this.targetFile);
        this.name         = config.name || this.databaseName;
        this.uuid         = this.generateGuid();
    }

    generateGuid() {
        function s4() {
            return Math.floor((1 + Math.random()) * 0x10000)
            .toString(16)
            .substring(1);
        }
        return s4() + s4() + '-' + s4() + '-' + s4() + '-' + s4() + '-' + s4() + s4() + s4();
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
            // We are now hopefully getting the matches
            // we need to compare what we got to our expected matches
            const stringMatch = match.shift();
            if (this.expected.length === match.length) {
                // The regex returned the correct number of matches
                const processed = {};
                match.forEach((value, index) => {
                    processed[this.expected[index].name] 
                    = (this.expected[index].type && this.expected[index].type == 'json') 
                    ? JSON.parse(value) 
                    : value; 
                });
                this.db.post(processed, (err, id) => {
                    if (err) {
                        log.error(`Error: ${err}`);
                    }
                    this.db.find({ id }, (err, record) => {
                        if (err) {
                            log.error(`Error: ${err}`);
                        }
                        events.emit('newLine', {
                            uuid: this.uuid,
                            record: record
                        });
                    });
                });
            }
        });
        this.tail.on('error', (err) => {
            log.error(`Error: ${err}`);
        });
    }

    assignConnection(connection) {
        return new Promise((resolve, reject) => {
            try {
                this.connection = connection;
                this.db = this.connection.database(this.databaseName);
                this.db.exists((exists) => {
                    if (exists) {
                        resolve(exists);
                    } else {
                    this.db.createSync((err) => {
                        if (err) {
                            reject(err);
                        } else {
                            resolve(!!this.connection);
                        }
                    });
                    }
                });
            } catch (err) {
                reject(err);
            }
        });
    }
}

module.exports = Watcher;
