/// <reference types="minimatch" />
import * as minimatch from 'minimatch';
import { Watcher, WeakEventMap as WatcherEvents, WatcherOptions } from './watcher';
export declare type ProjectWatcherPathOptions = WatcherEvents & {
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
    /**
     * Runs code from comment on changeFile event.
     *
     * Example:
     * ```js
     * // project-watch { return fs.readdirSync(__dirname).filter(x => !x.startsWith('index')).join(x => `export * from './${x}';\n`) }
     * export * from './input';
     * export * from './smth';
     * // project-watch:end
     * ```
     *
     * Multiline comments supported too.
     *
     * Example with async:
     * ```js
     * // project-watch Promise(resolve => { fs.readdir(__dirname, (err, entries) => resolve(entries.filter(x => !x.startsWith('index')).join(x => `export * from './${x}';\n`)) ) }
     * export * from './input';
     * export * from './smth';
     * // project-watch:end
     * ```
     *
     * Next line only scripts:
     * ```js
     * // project-watch-line { return `export default class ${path.basename(__filename)} extends React.Component { `; }
     * export default class Input extends React.Component {
     * ```
     */
    runInlineScripts?: boolean;
    /** Map or require module (as global variable) for inlined scripts */
    inlineScriptModules?: string[] | {
        [moduleName: string]: string;
    };
};
/** Uses https://github.com/isaacs/minimatch for path rules */
export declare type ProjectWatcherPaths = {
    [pathRule: string]: ProjectWatcherPathOptions;
};
export declare type ProjectWatcherOptions = {
    watcher?: WatcherOptions;
    paths: ProjectWatcherPaths;
};
/** Uses https://github.com/isaacs/minimatch for path rules */
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
export declare function copyDirTemplate(dst: string, from: string): void;
export declare function copyDir(dst: string, from: string): void;
export declare function copyFileTemplate(dst: string, from: string): void;
export declare function copyFile(dst: string, from: string): void;
export declare function normalizePath(normalizedRootPaths: string[], path: string): string;
export declare function takeLocalPath(normalizedRootPaths: string[], path: string): string;
export declare function normalizePathSlash(path: string): string;
