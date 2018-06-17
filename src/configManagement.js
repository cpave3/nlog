'use strict';

const path      = require('path');
const fs        = require('fs');

const { mkdirp } = require('./helpers');

const methods = {
    addConfig: (configFile) => {
        // TODO: Needs to be implemented
        console.log(configFile);
    },
    defaultPreferences: () => {
        const homeDir = process.env[(process.platform == 'win32') ? 'USERPROFILE' : 'HOME'];
        const defaultSettingsDir = path.join(homeDir, '.nlog', 'conf.d');
        const defaultDataDir = path.join(homeDir, '.nlog', 'data');
        return {
            config: {
                dir: defaultSettingsDir
            },
            data: {
                dir: defaultDataDir
            }
        }
    },
    loadConfigs: (configDir) => {
       return new Promise( async (resolve, reject) => {
            // Here, we should rescursively verify and generate directories
            await mkdirp(configDir);
            fs.readdir(configDir, (err, items) => {
                if (err) {
                    reject(err);
                }
                // No massive errors, so iterate through the config files and make sure they are valid
                if (items && items.length > 0) {
                    const arrayConfigs = items.map((item) => {
                        return JSON.parse(fs.readFileSync(path.join(configDir, item), 'utf8'));
                    });
                    resolve(arrayConfigs);
                } else {
                    const arrayConfigs = [];
                    resolve(arrayConfigs);
                }
            });
        })
    },
    validateConfig: (objectConfig) => {
        // Check that the config has the required keys
        return  !!objectConfig &&
                !!objectConfig.target && 
                !!objectConfig.rules.regex && 
                !!objectConfig.rules.matches;
    }
};

module.exports = methods;
