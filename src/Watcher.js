'use strict';

class Watcher {

    constructor(config) {
        this.rawConfig   = config;
        this.targetFile  = config.target;
        this.regexFilter = this.regexStringToExp(config.rules.regex || '.*');
        this.matches     = config.rules.matches || this.defaultMatches();
        this.historic    = config.rules.processHistoricData || false;
        this.tail        = config.rules.tail || true;
        this.active      = this.verifyTarget() || false;
        console.log(this);
    }

    verifyTarget(targetFile = this.targetFile) {
        // Logic here to see if the file exists
        return false;
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

}

module.exports = Watcher;
