export enum LogLevel {
    /** Everything */
    log = 'log',

    /** Important info */
    info = 'info',

    /** Errors */
    error = 'error',
}

export interface ILogger {
    log(level: LogLevel, message?: any, ...optionalParams: any[]): void;
}

export class DefaultLogger implements ILogger {
    private static _instance: ILogger;

    static get instance() {
        if (this._instance) return this._instance;
        return this._instance = new DefaultLogger;
    }

    log(level: LogLevel, message?: any, ...optionalParams: any[]): void {
        switch(level) {
            case LogLevel.error:
                console.error(message, optionalParams);
                break;
            case LogLevel.info:
            case LogLevel.log:
                console.log(message, optionalParams);
                break;
        }
    }
}