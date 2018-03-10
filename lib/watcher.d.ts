import * as chokidar from 'chokidar';
import { EventEmitter } from './event-emitter';
export declare type EventMap = {
    newDir: (path: string) => any;
    newFile: (path: string) => any;
    renameFile: (oldPath: string, newPath: string) => any;
    renameDir: (oldPath: string, newPath: string) => any;
    removeDir: (path: string) => any;
    removeFile: (path: string) => any;
    changeFile: (path: string) => any;
};
export declare type WeakEventMap = {
    [event in Events]?: EventMap[event];
};
export declare type Events = keyof EventMap;
export declare const EventNames: Events[];
export declare type WatcherOptions = chokidar.WatchOptions;
export declare class Watcher extends EventEmitter<EventMap> {
    readonly watcher: chokidar.FSWatcher;
    eventTimeoutMS: number;
    renameDirTimeoutMS: number;
    renameFileTimeoutMS: number;
    setupIterationTimeoutMS: number;
    private _debugLog;
    debugLog: Function | boolean;
    constructor(path: string | string[], opts?: WatcherOptions);
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
