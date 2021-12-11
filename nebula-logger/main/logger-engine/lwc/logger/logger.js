//------------------------------------------------------------------------------------------------//
// This file is part of the Nebula Logger project, released under the MIT License.                //
// See LICENSE file or go to https://github.com/jongpie/NebulaLogger for full license details.    //
//------------------------------------------------------------------------------------------------//

import { LightningElement, api, wire } from 'lwc';
import { newLogEntry } from './logEntryBuilder';
import getSettings from '@salesforce/apex/ComponentLogger.getSettings';
import saveComponentLogEntries from '@salesforce/apex/ComponentLogger.saveComponentLogEntries';

export default class Logger extends LightningElement {
    componentLogEntries = [];
    settings;

    _scenario;

    @wire(getSettings)
    wiredSettings({ error, data }) {
        if (data) {
            this.settings = data;
        } else if (error) {
            /* eslint-disable-next-line no-console */
            console.error(error);
        }
    }

    /**
     * @description Returns the current user's instance of `LoggerSettings__c`
     * @return The current user's instance of the custom settings
     */
    @api
    getUserSettings() {
        return this.settings;
    }

    /**
     * @description Sets the scenario name for the current transaction - this is stored in `LogEntryEvent__e.Scenario__c`
     *              and `Log__c.Scenario__c`, and can be used to filter & group logs
     * @param  scenario The name to use for the current transaction's scenario
     */
    @api
    setScenario(scenario) {
        this._scenario = scenario;
        this.componentLogEntries.forEach(logEntry => {
            logEntry.scenario = this._scenario;
        });
    }

    /**
     * @description Creates a new log entry with logging level == `LoggingLevel.ERROR`
     * @return      The new entry's instance of `LogEntryEventBuilder`, useful for chaining methods
     */
    @api
    error(message) {
        return this._newEntry('ERROR', message);
    }

    /**
     * @description Creates a new log entry with logging level == `LoggingLevel.WARN`
     * @return      The new entry's instance of `LogEntryEventBuilder`, useful for chaining methods
     */
    @api
    warn(message) {
        return this._newEntry('WARN', message);
    }

    /**
     * @description Creates a new log entry with logging level == `LoggingLevel.INFO`
     * @return      The new entry's instance of `LogEntryEventBuilder`, useful for chaining methods
     */
    @api
    info(message) {
        return this._newEntry('INFO', message);
    }

    /**
     * @description Creates a new log entry with logging level == `LoggingLevel.DEBUG`
     * @return      The new entry's instance of `LogEntryEventBuilder`, useful for chaining methods
     */
    @api
    debug(message) {
        return this._newEntry('DEBUG', message);
    }

    /**
     * @description Creates a new log entry with logging level == `LoggingLevel.FINE`
     * @return      The new entry's instance of `LogEntryEventBuilder`, useful for chaining methods
     */
    @api
    fine(message) {
        return this._newEntry('FINE', message);
    }

    /**
     * @description Creates a new log entry with logging level == `LoggingLevel.FINER`
     * @return      The new entry's instance of `LogEntryEventBuilder`, useful for chaining methods
     */
    @api
    finer(message) {
        return this._newEntry('FINER', message);
    }

    /**
     * @description Creates a new log entry with logging level == `LoggingLevel.FINEST`
     * @return      The new entry's instance of `LogEntryEventBuilder`, useful for chaining methods
     */
    @api
    finest(message) {
        return this._newEntry('FINEST', message);
    }

    /**
     * @description Returns the number of entries that have been generated but not yet saved
     * @return Integer
     */
    @api
    getBufferSize() {
        return this.componentLogEntries.length;
    }

    /**
     * @description Discards any entries that have been generated but not yet saved
     */
    @api
    flushBuffer() {
        this.componentLogEntries = [];
    }

    /**
     * @description Saves any entries in Logger's buffer, using the specified save method for only this call.
     *              All subsequent calls to saveLog() will use the transaction save method.
     * @param  saveMethod The enum value of Logger.SaveMethod to use for this specific save action.
     */
    @api
    saveLog(saveMethodName) {
        if (this.getBufferSize() > 0) {
            if (!saveMethodName && this.settings && this.settings.defaultSaveMethodName) {
                saveMethodName = this.settings.defaultSaveMethodName;
            }

            saveComponentLogEntries({ componentLogEntries: this.componentLogEntries, saveMethodName: saveMethodName })
                .then(this.flushBuffer())
                .catch(error => {
                    if (this.settings.isConsoleLoggingEnabled === true) {
                        /* eslint-disable-next-line no-console */
                        console.error(error);
                        /* eslint-disable-next-line no-console */
                        console.error(this.componentLogEntries);
                    }
                });
        }
    }

    // Private functions
    _meetsUserLoggingLevel(logEntryLoggingLevel) {
        let logEntryLoggingLevelOrdinal = this.settings.supportedLoggingLevels[logEntryLoggingLevel];
        return this.settings && this.settings.isEnabled === true && this.settings.userLoggingLevel.ordinal <= logEntryLoggingLevelOrdinal;
    }

    _newEntry(loggingLevel, message) {
        const shouldSave = this._meetsUserLoggingLevel(loggingLevel);
        const logEntryBuilder = newLogEntry(loggingLevel, shouldSave, this.settings.isConsoleLoggingEnabled).setMessage(message);
        if (this._scenario) {
            logEntryBuilder.scenario = this._scenario;
        }
        if (this._meetsUserLoggingLevel(loggingLevel) === true) {
            this.componentLogEntries.push(logEntryBuilder);
        }

        return logEntryBuilder;
    }
}
