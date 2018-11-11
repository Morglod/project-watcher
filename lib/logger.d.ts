export declare enum LogLevel {
    /** Everything */
    log = "log",
    /** Important info */
    info = "info",
    /** Errors */
    error = "error"
}
export interface ILogger {
    log(level: LogLevel, message?: any, ...optionalParams: any[]): void;
}
export declare class DefaultLogger implements ILogger {
    private static _instance;
    static readonly instance: ILogger;
    log(level: LogLevel, message?: any, ...optionalParams: any[]): void;
}
