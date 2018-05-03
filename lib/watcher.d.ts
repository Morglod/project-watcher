import * as chokidar from 'chokidar';
import { EventEmitter } from './event-emitter';
export declare type WatcherEventMap = {
    newDir: (path: string) => any;
    newFile: (path: string) => any;
    renameFile: (oldPath: string, newPath: string) => any;
    renameDir: (oldPath: string, newPath: string) => any;
    removeDir: (path: string) => any;
    removeFile: (path: string) => any;
    changeFile: (path: string) => any;
};
export declare type WeakEventMap = Partial<WatcherEventMap>;
export declare type WatcherEvents = keyof WatcherEventMap;
export declare const WatcherEventNames: WatcherEvents[];
export declare type WatcherOptions = chokidar.WatchOptions;
/**
 * FileSystem watcher
 *
 * Use `on`/`once`/`addListener`/`removeListener`.
 */
export declare class Watcher extends EventEmitter<WatcherEventMap> {
    readonly watcher: chokidar.FSWatcher;
    eventTimeoutMS: number;
    renameDirTimeoutMS: number;
    renameFileTimeoutMS: number;
    setupIterationTimeoutMS: number;
    private _debugLog;
    debugLog: Function | boolean;
    constructor(path: string | string[], opts?: WatcherOptions);
    /** stop listening and close fs watcher */
    dispose: () => void;
    private handleNewDir;
    private handleDirRename;
    private handleRemoveDir;
    private handleUnlinkDir;
    private handleFileChange;
    private handleFileRename;
    private handleNewFile;
    private handleFileRemove;
    private listen;
    private stopListening;
}
