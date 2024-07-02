import { Env, Context, MiddlewareHandler } from 'hono';

/**
 * @module
 * Event Emitter Middleware for Hono.
 */

type EventKey = string | symbol;
type EventHandler<T, E extends Env = Env> = (c: Context<E>, payload: T) => void | Promise<void>;
type EventHandlers<T> = {
    [K in keyof T]?: EventHandler<T[K]>[];
};
interface Emitter<EventHandlerPayloads> {
    on<Key extends keyof EventHandlerPayloads>(key: Key, handler: EventHandler<EventHandlerPayloads[Key]>): void;
    off<Key extends keyof EventHandlerPayloads>(key: Key, handler?: EventHandler<EventHandlerPayloads[Key]>): void;
    emit<Key extends keyof EventHandlerPayloads>(key: Key, c: Context, payload: EventHandlerPayloads[Key]): void;
}
/**
 * Function to define fully typed event handler.
 * @param {EventHandler} handler - The event handlers.
 * @returns The event handler.
 */
declare const defineHandler: <T, K extends keyof T, E extends Env = Env>(handler: EventHandler<T[K], E>) => EventHandler<T[K], E>;
/**
 * Function to define fully typed event handlers.
 * @param {EventHandler[]} handlers - An object where each key is an event type and the value is an array of event handlers.
 * @returns The event handlers.
 */
declare const defineHandlers: <T, E extends Env = Env>(handlers: { [K in keyof T]?: EventHandler<T[K], E>[] | undefined; }) => { [K in keyof T]?: EventHandler<T[K], E>[] | undefined; };
/**
 * Create Event Emitter instance.
 *
 * @param {EventHandlers} eventHandlers - Event handlers to be registered.
 * @returns {Emitter} The EventEmitter instance.
 *
 * @example
 * ```js
 * // Define event handlers
 * const handlers: {
 *   'foo': [
 *     (c, payload) => { console.log('Foo:', payload) }
 *   ]
 * }
 *
 * // Initialize emitter with handlers
 * const ee = createEmitter(handlers)
 *
 * // AND/OR add more listeners on the fly.
 * ee.on('bar', (c, payload) => {
 *   c.get('logger').log('Bar:', payload.item.id)
 * })
 *
 * // Use the emitter to emit events.
 * ee.emit('foo', c, 42)
 * ee.emit('bar', c, { item: { id: '12345678' } })
 * ```
 *
 * ```ts
 * type AvailableEvents = {
 *   // event key: payload type
 *   'foo': number;
 *   'bar': { item: { id: string } };
 * };
 *
 * // Define event handlers
 * const handlers: defineHandlers<AvailableEvents>({
 *   'foo': [
 *     (c, payload) => { console.log('Foo:', payload) }  // payload will be inferred as number
 *   ]
 * })
 *
 * // Initialize emitter with handlers
 * const ee = createEmitter(handlers)
 *
 * // AND/OR add more listeners on the fly.
 * ee.on('bar', (c, payload) => {
 *   c.get('logger').log('Bar:', payload.item.id)
 * })
 *
 * // Use the emitter to emit events.
 * ee.emit('foo', c, 42) // Payload will be expected to be of a type number
 * ee.emit('bar', c, { item: { id: '12345678' }, c }) // Payload will be expected to be of a type { item: { id: string }, c: Context }
 * ```
 *
 */
declare const createEmitter: <EventHandlerPayloads>(eventHandlers?: EventHandlers<EventHandlerPayloads>) => Emitter<EventHandlerPayloads>;
/**
 * Event Emitter Middleware for Hono.
 *
 * @see {@link https://hono.dev/middleware/builtin/event-emitter}
 *
 * @param {EventHandlers} eventHandlers - Event handlers to be registered.
 * @returns {MiddlewareHandler} The middleware handler function.
 *
 * @example
 * ```js
 *
 * // Define event handlers
 * const handlers: {
 *   'foo': [
 *     (c, payload) => { console.log('Foo:', payload) }
 *   ]
 *   'bar': [
 *     (c, payload) => { console.log('Bar:', payload.item.id) }
 *   ]
 * }
 *
 * const app = new Hono()
 *
 * // Register the emitter middleware and provide it with the handlers
 * app.use('\*', emitter(handlers))
 *
 * // Use the emitter in route handlers to emit events.
 * app.post('/foo', async (c) => {
 *   // The emitter is available under "emitter" key in the context.
 *   c.get('emitter').emit('foo', c, 42)
 *   c.get('emitter').emit('bar', c, { item: { id: '12345678' } })
 *   return c.text('Success')
 * })
 * ```
 *
 * ```ts
 * type AvailableEvents = {
 *   // event key: payload type
 *   'foo': number;
 *   'bar': { item: { id: string } };
 * };
 *
 * type Env = { Bindings: {}; Variables: { emitter: Emitter<AvailableEvents> }; }
 *
 * // Define event handlers
 * const handlers: defineHandlers<AvailableEvents>({
 *   'foo': [
 *     (c, payload) => { console.log('Foo:', payload) }  // payload will be inferred as number
 *   ]
 *   'bar': [
 *     (c, payload) => { console.log('Bar:', payload.item.id) }  // payload will be inferred as { item: { id: string } }
 *   ]
 * })
 *
 * const app = new Hono<Env>()
 *
 * // Register the emitter middleware and provide it with the handlers
 * app.use('\*', emitter(handlers))
 *
 * // Use the emitter in route handlers to emit events.
 * app.post('/foo', async (c) => {
 *   // The emitter is available under "emitter" key in the context.
 *   c.get('emitter').emit('foo', c, 42) // Payload will be expected to be of a type number
 *   c.get('emitter').emit('bar', c, { item: { id: '12345678' } }) // Payload will be expected to be of a type { item: { id: string } }
 *   return c.text('Success')
 * })
 * ```
 */
declare const emitter: <EventHandlerPayloads>(eventHandlers?: EventHandlers<EventHandlerPayloads>) => MiddlewareHandler;

export { type Emitter, type EventHandler, type EventHandlers, type EventKey, createEmitter, defineHandler, defineHandlers, emitter };
