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
        if (this.debugLog) this._debugLog('handleNewDir');
        await this.emit('newDir', path);
        setTimeout(this.listen, this.setupIterationTimeoutMS);
    }

    private handleDirRename = async (oldPath: string, newPath: string) => {
        if (this.debugLog) this._debugLog('handleDirRename');
        await this.emit('renameDir', oldPath, newPath);
        setTimeout(this.listen, this.setupIterationTimeoutMS);
    }

    private handleRemoveDir = async (path: string) => {
        if (this.debugLog) this._debugLog('handleRemoveDir');
        await this.emit('removeDir', path);
        setTimeout(this.listen, this.setupIterationTimeoutMS);
    }

    private handleUnlinkDir = async (unlinkPath: string) => {
        if (this.debugLog) this._debugLog('handleUnlinkDir');
        this.watcher.once('addDir', (newPath: string) => {
            clearTimeout(timer);
            this.handleDirRename(unlinkPath, newPath);
        });

        const timer = setTimeout(() => {
            this.watcher.removeAllListeners();
            this.handleRemoveDir(unlinkPath);
        }, this.renameDirTimeoutMS);
    }

    private handleFileChange = async (path: string) => {
        if (this.debugLog) this._debugLog('handleFileChange');
        await this.emit('changeFile', path);
        setTimeout(this.listen, this.setupIterationTimeoutMS);
    }

    private handleFileRename = async (oldPath: string, newPath: string) => {
        if (this.debugLog) this._debugLog('renameFile');
        await this.emit('renameFile', oldPath, newPath);
        setTimeout(this.listen, this.setupIterationTimeoutMS);
    }
    
    private handleNewFile = (addPath: string) => {
        if (this.debugLog) this._debugLog('handleNewFile');
        this.watcher.once('unlink', (oldPath) => {
            clearTimeout(timer);
            this.handleFileRename(oldPath, addPath);
        });
    
        const timer = setTimeout(async () => {
            if (this.debugLog) this._debugLog('emit newFile, cancel handleFileRename');
            this.watcher.removeAllListeners();
            await this.emit('newFile', addPath);
            setTimeout(this.listen, this.setupIterationTimeoutMS);
        }, this.renameFileTimeoutMS);
    }

    private handleFileRemove = async (path: string) => {
        if (this.debugLog) this._debugLog('handleFileRemove');
        await this.emit('removeFile', path);
        setTimeout(this.listen, this.setupIterationTimeoutMS);
    }

    private listen = () => {
        if (this.debugLog) this._debugLog('setup');
        this.stopListening();
        this.watcher.once('addDir', this.handleNewDir);
        this.watcher.once('change', this.handleFileChange);
        this.watcher.once('add', this.handleNewFile);
        this.watcher.once('unlinkDir', this.handleUnlinkDir);
        this.watcher.once('unlink', this.handleFileRemove);
    }

    private stopListening = () => {
        this.watcher.removeListener('addDir', this.handleNewDir);
        this.watcher.removeListener('change', this.handleNewDir);
        this.watcher.removeListener('add', this.handleNewDir);
        this.watcher.removeListener('unlinkDir', this.handleNewDir);
        this.watcher.removeListener('unlink', this.handleNewDir);
    }
}
