import * as fs from 'fs';
import * as path from 'path';
import * as chokidar from 'chokidar';

import { EventEmitter } from './event-emitter';
import { isDebug } from './env';

export type EventMap = {
    newDir: (path: string) => any,
    newFile: (path: string) => any,
    renameFile: (oldPath: string, newPath: string) => any,
    renameDir: (oldPath: string, newPath: string) => any,
    removeDir: (path: string) => any,
    removeFile: (path: string) => any,
    changeFile: (path: string) => any,
}

export type WeakEventMap = {
    [event in Events]?: EventMap[event];
}

export type Events = keyof EventMap;

export const EventNames: Events[] = [ 
    'newDir',
    'newFile',
    'renameFile',
    'renameDir',
    'removeDir',
    'removeFile',
    'changeFile',
];

export type WatcherOptions = chokidar.WatchOptions;

export class Watcher extends EventEmitter<EventMap> {
    readonly watcher: chokidar.FSWatcher;

    eventTimeoutMS: number = 50;
    renameDirTimeoutMS: number = 50;
    renameFileTimeoutMS: number = 50;
    setupIterationTimeoutMS: number = 100;

    private _debugLog: any = false;
    get debugLog() { return  this._debugLog; }
    set debugLog(value: Function|boolean) {
        if (value === true) value = (...args: any[]) => console.log(...args);
        this._debugLog = value;
    }

    constructor(path: string | string[], opts?: WatcherOptions) {
        super();
        this.debugLog = isDebug;

        const options = {
            persistent: true,
            atomic: true,
            ...opts
        };

        this.watcher = chokidar.watch(path, options).on('ready', this.listen);
    }

    private handleNewDir = async (path: string) => {
        this.stopListening();
        if (this.debugLog) this._debugLog('handleNewDir');
        await this.emitWait(this.eventTimeoutMS, 'newDir', path);
        setTimeout(this.listen, this.setupIterationTimeoutMS);
    }

    private handleDirRename = async (oldPath: string, newPath: string) => {
        this.stopListening();
        if (this.debugLog) this._debugLog('handleDirRename');
        await this.emitWait(this.eventTimeoutMS, 'renameDir', oldPath, newPath);
        setTimeout(this.listen, this.setupIterationTimeoutMS);
    }

    private handleRemoveDir = async (path: string) => {
        this.stopListening();
        if (this.debugLog) this._debugLog('handleRemoveDir');
        await this.emitWait(this.eventTimeoutMS, 'removeDir', path);
        setTimeout(this.listen, this.setupIterationTimeoutMS);
    }

    private handleUnlinkDir = async (unlinkPath: string) => {
        this.stopListening();
        if (this.debugLog) this._debugLog('handleUnlinkDir');
        this.watcher.addListener('addDir', (newPath: string) => {
            clearTimeout(timer);
            this.handleDirRename(unlinkPath, newPath);
        });

        const timer = setTimeout(() => {
            this.stopListening();
            this.handleRemoveDir(unlinkPath);
        }, this.renameDirTimeoutMS);
    }

    private handleFileChange = async (path: string) => {
        this.stopListening();
        if (this.debugLog) this._debugLog('handleFileChange');
        await this.emitWait(this.eventTimeoutMS, 'changeFile', path);
        setTimeout(this.listen, this.setupIterationTimeoutMS);
    }

    private handleFileRename = async (oldPath: string, newPath: string) => {
        this.stopListening();
        if (this.debugLog) this._debugLog('renameFile');
        await this.emitWait(this.eventTimeoutMS, 'renameFile', oldPath, newPath);
        setTimeout(this.listen, this.setupIterationTimeoutMS);
    }
    
    private handleNewFile = (addPath: string) => {
        this.stopListening();
        if (this.debugLog) this._debugLog('handleNewFile');
        this.watcher.addListener('unlink', (oldPath) => {
            clearTimeout(timer);
            this.handleFileRename(oldPath, addPath);
        });
    
        const timer = setTimeout(async () => {
            if (this.debugLog) this._debugLog('emit newFile, cancel handleFileRename');
            this.stopListening();
            await this.emitWait(this.eventTimeoutMS, 'newFile', addPath);
            setTimeout(this.listen, this.setupIterationTimeoutMS);
        }, this.renameFileTimeoutMS);
    }

    private handleFileRemove = async (path: string) => {
        this.stopListening();
        if (this.debugLog) this._debugLog('handleFileRemove');
        await this.emitWait(this.eventTimeoutMS, 'removeFile', path);
        setTimeout(this.listen, this.setupIterationTimeoutMS);
    }

    private listen = () => {
        if (this.debugLog) this._debugLog('setup');
        this.stopListening();
        this.watcher.addListener('addDir', this.handleNewDir);
        this.watcher.addListener('change', this.handleFileChange);
        this.watcher.addListener('add', this.handleNewFile);
        this.watcher.addListener('unlinkDir', this.handleUnlinkDir);
        this.watcher.addListener('unlink', this.handleFileRemove);
    }

    private stopListening = () => {
        this.watcher.removeAllListeners();
    }
}
