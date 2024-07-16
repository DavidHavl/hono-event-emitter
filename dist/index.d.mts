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
type EventPayloadMap = {
    [key: string]: unknown;
};
type EmitAsyncOptions = {
    mode: 'concurrent' | 'sequencial';
};
type EventEmitterOptions = {
    maxHandlers?: number;
};
interface Emitter<EPMap extends EventPayloadMap> {
    on<Key extends keyof EPMap>(key: Key, handler: EventHandler<EPMap[Key]>): void;
    off<Key extends keyof EPMap>(key: Key, handler?: EventHandler<EPMap[Key]>): void;
    emit<Key extends keyof EPMap>(key: Key, c: Context, payload: EPMap[Key]): void;
    emitAsync<Key extends keyof EPMap>(key: Key, c: Context, payload: EPMap[Key], options?: EmitAsyncOptions): Promise<void>;
}
/**
 * Function to define fully typed event handler.
 * @param {EventHandler} handler - The event handlers.
 * @returns The event handler.
 */
declare const defineHandler: <EPMap extends EventPayloadMap, Key extends keyof EPMap, E extends Env = Env>(handler: EventHandler<EPMap[Key], E>) => EventHandler<EPMap[Key], E>;
/**
 * Function to define fully typed event handlers.
 * @param {EventHandler[]} handlers - An object where each key is an event type and the value is an array of event handlers.
 * @returns The event handlers.
 */
declare const defineHandlers: <EPMap extends EventPayloadMap, E extends Env = Env>(handlers: { [K in keyof EPMap]?: EventHandler<EPMap[K], E>[] | undefined; }) => { [K_1 in keyof EPMap]?: EventHandler<EPMap[K_1], E>[] | undefined; };
/**
 * Create Event Emitter instance.
 *
 * @template EPMap - The event payload map.
 * @param {EventHandlers<EPMap>} [eventHandlers] - Event handlers to be registered.
 * @param {EventEmitterOptions} [options] - Options for the event emitter.
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
 * ee.on('baz', async (c, payload) => {
 *  // Do something async
 * })
 *
 * // Use the emitter to emit events.
 * ee.emit('foo', c, 42)
 * ee.emit('bar', c, { item: { id: '12345678' } })
 * await ee.emitAsync('baz', c, { item: { id: '12345678' } })
 * ```
 *
 * ```ts
 * type AvailableEvents = {
 *   // event key: payload type
 *   'foo': number;
 *   'bar': { item: { id: string } };
 *   'baz': { item: { id: string } };
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
 * ee.on('baz', async (c, payload) => {
 *  // Do something async
 * })
 *
 * // Use the emitter to emit events.
 * ee.emit('foo', c, 42) // Payload will be expected to be of a type number
 * ee.emit('bar', c, { item: { id: '12345678' } }) // Payload will be expected to be of a type { item: { id: string }, c: Context }
 * await ee.emitAsync('baz', c, { item: { id: '12345678' } }) // Payload will be expected to be of a type { item: { id: string } }
 * ```
 *
 */
declare const createEmitter: <EPMap extends EventPayloadMap>(eventHandlers?: EventHandlers<EPMap>, options?: EventEmitterOptions) => Emitter<EPMap>;
/**
 * Event Emitter Middleware for Hono.
 *
 * @see {@link https://github.com/honojs/middleware/tree/main/packages/event-emitter}
 *
 * @template EPMap - The event payload map.
 * @param {EventHandlers<EPMap>} [eventHandlers] - Event handlers to be registered.
 * @param {EventEmitterOptions} [options] - Options for the event emitter.
 * @returns {MiddlewareHandler} The middleware handler function.
 *
 * @example
 * ```js
 *
 * // Define event handlers
 * const handlers: {
 *   'foo': [
 *     (c, payload) => { console.log('Foo:', payload) }
 *   ],
 *   'bar': [
 *     (c, payload) => { console.log('Bar:', payload.item.id) }
 *   ],
 *   'baz': [
 *     async (c, payload) => {
 *       // Do something async
 *     }
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
 *   await c.get('emitter').emitAsync('baz', c, { item: { id: '12345678' } })
 *   return c.text('Success')
 * })
 * ```
 *
 * ```ts
 * type AvailableEvents = {
 *   // event key: payload type
 *   'foo': number;
 *   'bar': { item: { id: string } };
 *   'baz': { item: { id: string } };
 * };
 *
 * type Env = { Bindings: {}; Variables: { emitter: Emitter<AvailableEvents> }; }
 *
 * // Define event handlers
 * const handlers: defineHandlers<AvailableEvents>({
 *   'foo': [
 *     (c, payload) => { console.log('Foo:', payload) }  // payload will be inferred as number
 *   ],
 *   'bar': [
 *     (c, payload) => { console.log('Bar:', payload.item.id) }  // payload will be inferred as { item: { id: string } }
 *   ],
 *   'baz': [
 *     async (c, payload) => {
 *       // Do something async
 *     }
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
 *   await c.get('emitter').emitAsync('baz', c, { item: { id: '12345678' } }) // Payload will be expected to be of a type { item: { id: string } }
 *   return c.text('Success')
 * })
 * ```
 */
declare const emitter: <EPMap extends EventPayloadMap>(eventHandlers?: EventHandlers<EPMap>, options?: EventEmitterOptions) => MiddlewareHandler;

export { type EmitAsyncOptions, type Emitter, type EventEmitterOptions, type EventHandler, type EventHandlers, type EventKey, type EventPayloadMap, createEmitter, defineHandler, defineHandlers, emitter };
