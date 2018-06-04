'use strict';

const fs        = require('fs');
const Tail      = require('tail-forever');
const log       = require('./Log');
class Watcher {

    constructor(config) {
        this.rawConfig   = config;
        this.targetFile  = config.target;
        this.regexFilter = this.regexStringToExp(config.rules.regex || '.*');
        this.expected    = config.rules.matches || this.defaultMatches();
        this.historic    = config.rules.processHistoricData || false;
        this.tail        = config.rules.tail || true;
        this.active      = this.verifyTarget() || false;
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
        log.success('Watching started');
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
                match.forEach( (value, index) => {
                    processed[this.expected[index].name] = value; 
                });
                console.log('proc', processed);
                // TODO: Handle objects and arrays correctly
                // TODO: save data into DB
                // TODO: Emit data to clients
            }
        });
        this.tail.on('error', (err) => {
            log.error(`Error: ${err}`);
        });
    }

}

module.exports = Watcher;
