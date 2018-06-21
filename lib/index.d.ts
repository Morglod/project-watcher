/// <reference types="minimatch" />
import * as minimatch from 'minimatch';
import { Watcher, WeakEventMap as WatcherEvents, WatcherOptions } from './watcher';
export declare const REPLACE_FILE_NAME = "{{FILE_NAME}}";
export declare type ReplacementMap = {
    [from: string]: string | ((info: {
        filePath: string;
        fileName: string;
        fileExt: string;
        targetDirName: string;
    }) => string);
};
export declare type ProjectWatcherPathOptions = WatcherEvents & {
    /** if this path matches, it will stop event propogation (not for custom handlers) */
    break?: boolean;
    /** if this path matches, it will stop event propogation for custom handlers */
    breakCustomEvents?: boolean;
    /** Auto update exports in index file */
    autoIndex?: boolean | 'js' | 'ts';
    /** if autoIndex=true, dont create index file if its not exist */
    dontCreateIndex?: boolean;
    /** pathRule[] */
    excludeIndex?: string[];
    /** if creating new dir, copy template from this path */
    newDirTemplate?: string;
    /** if creating new file, copy template from this path */
    newFileTemplate?: string;
    /** for `newDirTemplate` & `newFileTemplate` replace this entries in text */
    replace?: ReplacementMap;
};
/** Uses https://github.com/isaacs/minimatch for path rules */
export declare type ProjectWatcherPaths = {
    [pathRule: string]: ProjectWatcherPathOptions;
};
export declare type ProjectWatcherOptions = {
    watcher?: WatcherOptions;
    paths: ProjectWatcherPaths;
};
/**
 * Core
 *
 * Uses https://github.com/isaacs/minimatch for path rules
 */
export declare class ProjectWatcher {
    readonly watcher: Watcher;
    readonly paths: {
        rule: minimatch.IMinimatch;
        opts: ProjectWatcherPathOptions;
    }[];
    constructor(rootPath: string | string[], opts: ProjectWatcherOptions);
    close: () => void;
}
export declare function updateIndexFile(path: string, opts: ProjectWatcherPathOptions): void;
export declare function copyDirTemplate(dst: string, from: string, replacements?: ReplacementMap): void;
export declare function copyDir(dst: string, from: string, targetDirName: string, replacements?: ReplacementMap): void;
export declare function copyFileTemplate(dst: string, from: string, replacements?: ReplacementMap): void;
export declare function copyFile(dst: string, from: string, targetDirName: string, replacements?: ReplacementMap): void;
export declare function normalizePath(normalizedRootPaths: string[], path: string): string;
export declare function takeLocalPath(normalizedRootPaths: string[], path: string): string;
export declare function normalizePathSlash(path: string): string;
