import * as fs from 'fs';
import * as minimatch from 'minimatch';
import { dirname, join as joinPath, resolve as resolvePath } from 'path';

import { isDebug } from './env';
import { Watcher, WeakEventMap as WatcherEvents, EventNames, WatcherOptions } from './watcher';

export type ProjectWatcherPathOptions = WatcherEvents & {
    /** Auto update exports in index file */
    autoIndex?: boolean|'js'|'ts',

    /** if autoIndex=true, dont create index file if its not exist */
    dontCreateIndex?: boolean,

    /** if creating new dir, copy template from this path */
    newDirTemplate?: string,

    /** if creating new file, copy template from this path */
    newFileTemplate?: string,

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
    runInlineScripts?: boolean,

    /** Map or require module (as global variable) for inlined scripts */
    inlineScriptModules?: string[] | { [moduleName: string]: string },
}

/** Uses https://github.com/isaacs/minimatch for path rules */
export type ProjectWatcherPaths = { [pathRule: string]: ProjectWatcherPathOptions };

export type ProjectWatcherOptions = {
    watcher?: WatcherOptions,
    paths: ProjectWatcherPaths,
}

/** Uses https://github.com/isaacs/minimatch for path rules */
export class ProjectWatcher {
    readonly watcher: Watcher;
    readonly paths: { rule: minimatch.IMinimatch, opts: ProjectWatcherPathOptions }[];

    constructor(rootPath: string | string[], opts: ProjectWatcherOptions) {
        this.paths = Object.entries(opts.paths).map(([ ruleStr, pathOpts ]) => ({
            rule: new minimatch.Minimatch(ruleStr),
            opts: pathOpts
        }));

        rootPath = Array.isArray(rootPath) ? rootPath : [ rootPath ];
        rootPath = rootPath.map(x => resolvePath(x).replace(/\\/g, '/'));
        this.watcher = new Watcher(rootPath, opts.watcher);

        [ 'newDir', 'renameDir', 'removeDir', 'newFile', 'renameFile', 'removeFile' ].forEach((event: any) => {
            this.watcher.on(event, (path: string) => {
                path = normalizePath(rootPath as string[], path);
                this.paths.forEach(({ rule, opts }) => {
                    if (isDebug) console.log(`[${event}] try match '${path}' with ${rule.pattern}`);
                    if (rule.match(path)) {
                        if (isDebug) console.log(`[${event}] matched '${path}' with ${rule.pattern}`);
                        if (opts.autoIndex) updateIndexFile(path, opts);
                    }
                });
            });
        });

        [ 'newDir', 'newFile' ].forEach((event: any) => {
            this.watcher.on(event, (path: string) => {
                path = normalizePath(rootPath as string[], path);
                this.paths.forEach(({ rule, opts }) => {
                    if (isDebug) console.log(`[${event}] try match '${path}' with ${rule.pattern}`);
                    if (rule.match(path)) {
                        if (isDebug) console.log(`[${event}] matched '${path}' with ${rule.pattern}`);
                        if (event === 'newDir' && opts.newDirTemplate) copyDirTemplate(path, opts.newDirTemplate);
                        if (event === 'newFile' && opts.newFileTemplate) copyFileTemplate(path, opts.newFileTemplate);
                    }
                });
            });
        });

        EventNames.forEach(eventName => {
            this.watcher.on(eventName, (path: string, ...args: any[]) => {
                path = normalizePath(rootPath as string[], path);
                this.paths.forEach(({ rule, opts }) => {
                    if (isDebug) console.log(`[${eventName}] try match '${path}' with ${rule.pattern}`);
                    if (opts[eventName] && rule.match(path)) {
                        if (isDebug) console.log(`[${eventName}] matched '${path}' with ${rule.pattern}`);
                        (opts[eventName] as Function)(path, ...args);
                    }
                });
            });
        });
    }

    close = () => {
        this.watcher.watcher.close();
    }
}

export function updateIndexFile(path: string, opts: ProjectWatcherPathOptions) {
    // TODO: if file exists & no 'auto generated' comment

    const parent = dirname(path);
    const ext = opts.autoIndex === 'ts' ? '.ts' : '.js';
    const parentIndex = joinPath(parent, './index' + ext);
    if (!fs.existsSync(parentIndex) && opts.dontCreateIndex) return; 

    const entries = fs.readdirSync(parent).filter(x => !x.startsWith('index.'));
    const content = '// Auto generated\n\n' + entries.map(x => `export * from './${x}';`).join('\n');
    fs.writeFileSync(parentIndex, content, 'utf8');
}

export function copyDirTemplate(dst: string, from: string) {
    copyDir(dst, from);
}

export function copyDir(dst: string, from: string) {
    if (!fs.existsSync(dst)) fs.mkdirSync(dst);

    const entries = fs.readdirSync(from);
    entries.forEach(x => {
        if (fs.statSync(x).isDirectory) copyDir(joinPath(dst, x), joinPath(from, x));
        else copyFile(joinPath(dst, x), joinPath(from, x));
    })
}

export function copyFileTemplate(dst: string, from: string) {
    fs.copyFileSync(from, dst);
}

export function copyFile(dst: string, from: string) {
    fs.writeFileSync(dst, fs.readFileSync(from));
}

export function normalizePath(normalizedRootPaths: string[], path: string): string {
    path = path.replace(/\\/g, '/').replace(/^\.\//, '');
    if (isDebug) console.log(`normalizePath [${normalizedRootPaths.join(', ')}] ${path}`);
    const rootPath = normalizedRootPaths.find(x => path.startsWith(x));
    if (!rootPath) return path;
    if (isDebug) console.log(`normalizePath ${rootPath} ${path}`);
    return path.substr(rootPath.length + 1);
}