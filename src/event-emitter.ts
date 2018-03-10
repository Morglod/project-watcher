import * as events from 'events';

import { isDebug } from './env';

export type Listener = (...args: any[]) => Promise<any>|void;
export type DefaultEventMap = { [event: string]: Listener };

export class EventEmitter<EventMap extends DefaultEventMap = DefaultEventMap> {
    readonly emitter = new events.EventEmitter;

    emit<EventKey extends keyof EventMap = string>(event: EventKey, ...args: any[]) {
        if (isDebug) console.log('emit', event, args);
        this.emitter.emit(event, ...args);
    }

    async emitWait<EventKey extends keyof EventMap = string>(timeout: number, event: EventKey, ...args: any[]) {
        if (isDebug) console.log('emit', timeout, event, args);
        return new Promise(resolve => {
            setTimeout(async () => {
                await Promise.all(this.emitter.listeners(event).map(x => x(...args)));
                resolve();
            }, timeout);
        });
    }

    on<EventKey extends keyof EventMap = string>(event: EventKey, listener: EventMap[EventKey]): this {
        this.emitter.on(event, listener);
        return this;
    }
    once<EventKey extends keyof EventMap = string>(event: EventKey, listener: EventMap[EventKey]): this {
        this.emitter.once(event, listener);
        return this;
    }
    addListener<EventKey extends keyof EventMap = string>(event: EventKey, listener: EventMap[EventKey]): this {
        this.emitter.addListener(event, listener);
        return this;
    }
    removeListener<EventKey extends keyof EventMap = string>(event: EventKey, listener: EventMap[EventKey]): this {
        this.emitter.removeListener(event, listener);
        return this;
    }
}