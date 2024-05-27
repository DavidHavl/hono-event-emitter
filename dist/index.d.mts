import { MiddlewareHandler } from 'hono';

type EventKey = string | symbol;
type EventHandler<T> = (payload: T) => void;
type EventHandlers<T> = {
    [K in keyof T]?: EventHandler<T[K]>[];
};
interface Emitter<EventHandlerPayloads> {
    on<Key extends keyof EventHandlerPayloads>(type: Key, handler: EventHandler<EventHandlerPayloads[Key]>): void;
    off<Key extends keyof EventHandlerPayloads>(type: Key, handler?: EventHandler<EventHandlerPayloads[Key]>): void;
    emit<Key extends keyof EventHandlerPayloads>(type: Key, payload: EventHandlerPayloads[Key]): void;
}
declare const createEmitter: <EventHandlerPayloads>(eventHandlers?: EventHandlers<EventHandlerPayloads>) => Emitter<EventHandlerPayloads>;
declare const emitter: <EventHandlerPayloads>(eventHandlers?: EventHandlers<EventHandlerPayloads>) => MiddlewareHandler;

export { type Emitter, type EventHandler, type EventHandlers, type EventKey, createEmitter, emitter };
