import * as fs from 'fs';
import * as minimatch from 'minimatch';
import { dirname, join as joinPath, resolve as resolvePath, extname, basename } from 'path';

import { isDebug, isDev } from './env';
import { Watcher, WeakEventMap as WatcherEvents, WatcherEventNames, WatcherOptions } from './watcher';
import { ILogger, DefaultLogger, LogLevel } from './logger';

export type ReplacementMap = {
    [from: string]: string|((info: { filePath: string, fileName: string, fileExt: string, targetDirName: string }) => string)
};

export type ProjectWatcherPathOptions = WatcherEvents & {
    /** if this path matches, it will stop event propogation (not for custom handlers) */
    break?: boolean,

    /** if this path matches, it will stop event propogation for custom handlers */
    breakCustomEvents?: boolean,

    /** Auto update exports in index file */
    autoIndex?: boolean|'js'|'ts',

    /** if autoIndex=true, dont create index file if its not exist */
    dontCreateIndex?: boolean,

    /** pathRule[] */
    excludeIndex?: string[],

    /** if creating new dir, copy template from this path */
    newDirTemplate?: string,

    /** if creating new file, copy template from this path */
    newFileTemplate?: string,

    /** for `newDirTemplate` & `newFileTemplate` replace this entries in text */
    replace?: ReplacementMap,

    /**
     * for `newDirTemplate` replace fileNames from templates
     * 
     * eg
     * When creating dir like 'blocks/myBlock'  
     * And template file copied from 'template/NAME.js'  
     * 
     * with  
     * ```js
     *  replaceFileName: {
     *  NAME: ({ targetDirName }) => `${targetDirName}.js`,
     * }
     * ```
     * 
     * File will be copied as 'blocks/myBlock/myBlock.js'
     */
    replaceFileName?: ReplacementMap,

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
    // runInlineScripts?: boolean,

    /** Map or require module (as global variable) for inlined scripts */
    // inlineScriptModules?: string[] | { [moduleName: string]: string },
}

/** Uses https://github.com/isaacs/minimatch for path rules */
export type ProjectWatcherPaths = { [pathRule: string]: ProjectWatcherPathOptions };

export type ProjectWatcherOptions = {
    watcher?: WatcherOptions,
    paths: ProjectWatcherPaths,
}

/**
 * Core
 * 
 * Uses https://github.com/isaacs/minimatch for path rules
 */
export class ProjectWatcher {
    readonly watcher: Watcher;
    readonly paths: { rule: minimatch.IMinimatch, opts: ProjectWatcherPathOptions }[];
    readonly logger: ILogger;

    constructor(rootPath: string | string[], opts: ProjectWatcherOptions, logger: ILogger = DefaultLogger.instance) {
        this.logger = logger;
    
        this.paths = Object.entries(opts.paths).map(([ ruleStr, pathOpts ]) => ({
            rule: new minimatch.Minimatch(ruleStr),
            opts: pathOpts
        }));

        rootPath = Array.isArray(rootPath) ? rootPath : [ rootPath ];
        rootPath = rootPath.map(x => resolvePath(x).replace(/\\/g, '/'));
        this.watcher = new Watcher(rootPath, opts.watcher);

        // update index file
        [ 'newDir', 'renameDir', 'removeDir', 'newFile', 'renameFile', 'removeFile' ].forEach((event: any) => {
            this.watcher.on(event, (path: string) => {
                const localPath = takeLocalPath(rootPath as string[], path, this.logger);
                this.paths.some(({ rule, opts }) => {
                    this.logger.log(LogLevel.log, `[${event}] try match '${localPath}' with ${rule.pattern}`);
                    if (rule.match(localPath)) {
                        this.logger.log(LogLevel.log, `[${event}] matched '${localPath}' with ${rule.pattern}`);
                        if (opts.autoIndex) updateIndexFile(path, opts, logger);
                        if (opts.break) return true;
                    }
                    return false;
                });
            });
        });

        // newDir/newFile template options
        [ 'newDir', 'newFile' ].forEach((event: any) => {
            this.watcher.on(event, (path: string) => {
                this.logger.log(LogLevel.log, `[${event}] for '${path}'`);
                const localPath = takeLocalPath(rootPath as string[], path, this.logger);

                // only empty entities
                const fileStat = fs.statSync(path);
                if (fileStat.isDirectory() && fs.readdirSync(path).length !== 0) {
                    this.logger.log(LogLevel.log, `[${event}] for '${path}' fileStat.isDirectory() && fs.readdirSync(path).length !== 0`);
                    return;
                }
                if (fileStat.isFile() && fileStat.size !== 0) {
                    this.logger.log(LogLevel.log, `[${event}] for '${path}' fileStat.size !== 0; fileStat.size=${fileStat.size}`);
                    return;
                }

                this.paths.some(({ rule, opts }) => {
                    this.logger.log(LogLevel.log, `[${event}] try match '${localPath}' with ${rule.pattern}`);
                    if (rule.match(localPath)) {
                        this.logger.log(LogLevel.log, `[${event}] matched '${localPath}' with ${rule.pattern}`);
                        if (event === 'newDir' && opts.newDirTemplate) copyDirTemplate(path, opts.newDirTemplate, opts.replace, opts.replaceFileName, this.logger);
                        if (event === 'newFile' && opts.newFileTemplate) copyFileTemplate(path, opts.newFileTemplate, opts.replace, this.logger);
                        if (opts.break) return true;
                    }
                    return false;
                });
            });
        });

        // custom event handlers
        WatcherEventNames.forEach(eventName => {
            this.watcher.on(eventName, (path: string, ...args: any[]) => {
                const localPath = takeLocalPath(rootPath as string[], path, this.logger);

                this.paths.some(({ rule, opts }) => {
                    this.logger.log(LogLevel.log, `[${eventName}] try match '${localPath}' with ${rule.pattern}`);
                    if (opts[eventName] && rule.match(localPath)) {
                        this.logger.log(LogLevel.log, `[${eventName}] matched '${localPath}' with ${rule.pattern}`);
                        (opts[eventName] as Function)(path, ...args);
                        if (opts.breakCustomEvents) return true;
                    }
                    return false;
                });
            });
        });
    }

    close = () => {
        this.watcher.watcher.close();
    }
}

export function updateIndexFile(path: string, opts: ProjectWatcherPathOptions, logger?: ILogger) {
    // TODO: if file exists & no 'auto generated' comment

    const parent = dirname(path);
    const ext = opts.autoIndex === 'ts' ? '.ts' : '.js';
    const parentIndex = joinPath(parent, './index' + ext);
    if (!fs.existsSync(parentIndex) && opts.dontCreateIndex) return;

    const entries = fs.readdirSync(parent).filter(x => {
        if (x.startsWith('index.')) return false;
        if (opts.excludeIndex && opts.excludeIndex.some(pathRule => minimatch(x, pathRule))) return false;
        return true;
    });
    const content = '// Auto generated\n\n' + entries.map(x => {
        const ext = extname(x);
        const codeExt = [ '.js', '.jsx', '.ts', '.tsx', '' ];
        if (codeExt.includes(ext)) return `export * from './${basename(x, ext)}';`;
        const nameParts = x.split('.');
        const name = `${nameParts[0]}${nameParts[1].toUpperCase()}`;
        return  `export const ${name} = require('./${x}');`;
    }).join('\n');
    fs.writeFileSync(parentIndex, content, 'utf8');
}

export function copyDirTemplate(dst: string, from: string, replacements?: ReplacementMap, replaceFileName?: ReplacementMap, logger?: ILogger) {
    if (logger) logger.log(LogLevel.log, `copyDirTemplate from '${from}' to '${dst}'`);
    const targetDirName = basename(dst);
    copyDir(dst, from, targetDirName, replacements, replaceFileName, logger);
}

export function copyDir(dst: string, from: string, targetDirName: string, replacements?: ReplacementMap, replaceFileName?: ReplacementMap, logger?: ILogger) {
    if (logger) logger.log(LogLevel.log, `copyDir from '${from}' to '${dst}'`);
    if (!fs.existsSync(dst)) fs.mkdirSync(dst);

    const entries = fs.readdirSync(from);
    entries.forEach(x => {
        if (fs.statSync(joinPath(from, x)).isDirectory()) copyDir(joinPath(dst, x), joinPath(from, x), targetDirName, replacements, replaceFileName, logger);
        else copyFile(joinPath(dst, x), joinPath(from, x), targetDirName, replacements, replaceFileName, logger);
    });
}

export function copyFileTemplate(dst: string, from: string, replacements?: ReplacementMap, logger?: ILogger) {
    if (logger) logger.log(LogLevel.log, `copyFileTemplate from '${from}' to '${dst}'`);
    const targetDirName = basename(dst);
    copyFile(dst, from, targetDirName, replacements, undefined, logger);
}

export function copyFile(dst: string, from: string, targetDirName: string, replacements?: ReplacementMap, replaceFileName?: ReplacementMap, logger?: ILogger) {
    if (logger) logger.log(LogLevel.log, `copyFile from '${from}' to '${dst}'`);
    if (replaceFileName) {
        const dstFileExt = extname(dst);
        const dstFileName = basename(dst, dstFileExt);

        fnameReplaceLoop: for (const [ replaceFrom, replaceTo ] of Object.entries(replaceFileName)) {
            if (replaceFrom === dstFileName) {
                let replaceResult: string;
    
                if (typeof replaceTo === 'function') {
                    replaceResult = replaceTo({
                        filePath: dst,
                        fileName: dstFileName,
                        fileExt: dstFileExt,
                        targetDirName,
                    });
                } else {
                    replaceResult = replaceTo;
                }

                dst = joinPath(dirname(dst), replaceResult);
                break fnameReplaceLoop;
            }
        }
    }
    if (replacements) {
        let fileContent = fs.readFileSync(from, 'utf8');
        const dstFileExt = extname(dst);
        const dstFileName = basename(dst, dstFileExt);

        for (const [ replaceFrom, replaceTo ] of Object.entries(replacements)) {
            let replaceResult: string;

            if (typeof replaceTo === 'function') {
                replaceResult = replaceTo({
                    filePath: dst,
                    fileName: dstFileName,
                    fileExt: dstFileExt,
                    targetDirName,
                });
            } else {
                replaceResult = replaceTo;
            }

            fileContent = fileContent.split(replaceFrom).join(replaceResult);
        }
        fs.writeFileSync(dst, fileContent);
    } else {
        fs.writeFileSync(dst, fs.readFileSync(from));
    }
}

export function normalizePath(normalizedRootPaths: string[], path: string, logger?: ILogger): string {
    path = path.replace(/\\/g, '/').replace(/^\.\//, '');
    if (logger) logger.log(LogLevel.log, `normalizePath [${normalizedRootPaths.join(', ')}] ${path}`);
    const rootPath = normalizedRootPaths.find(x => path.startsWith(x));
    if (!rootPath) return path;
    if (logger) logger.log(LogLevel.log, `normalizePath ${rootPath} ${path}`);
    return path; // path.substr(rootPath.length + 1);
}

export function takeLocalPath(normalizedRootPaths: string[], path: string, logger?: ILogger): string {
    path = path.replace(/\\/g, '/').replace(/^\.\//, '');
    if (logger) logger.log(LogLevel.log, `normalizePath [${normalizedRootPaths.join(', ')}] ${path}`);
    const rootPath = normalizedRootPaths.find(x => path.startsWith(x));
    if (!rootPath) return path;
    if (logger) logger.log(LogLevel.log, `normalizePath ${rootPath} ${path}`);
    return path.substr(rootPath.length + 1);
}

export function normalizePathSlash(path: string) {
    return path.replace(/\\/g, '/');
}