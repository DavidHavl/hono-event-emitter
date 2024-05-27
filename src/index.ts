import type { MiddlewareHandler } from 'hono';
import { createMiddleware } from 'hono/factory';

export type EventKey = string | symbol;
export type EventHandler<T> = (payload: T) => void;
export type EventHandlers<T> = { [K in keyof T]?: EventHandler<T[K]>[] };


export interface Emitter<EventHandlerPayloads> {
  on<Key extends keyof EventHandlerPayloads>(type: Key, handler: EventHandler<EventHandlerPayloads[Key]>): void;
  off<Key extends keyof EventHandlerPayloads>(type: Key, handler?: EventHandler<EventHandlerPayloads[Key]>): void;
  emit<Key extends keyof EventHandlerPayloads>(type: Key, payload: EventHandlerPayloads[Key]): void;
}

/**
 * Function to create an Event Emitter instance.
 * @returns {Emitter}
 */
export const createEmitter = <EventHandlerPayloads>(
  eventHandlers?: EventHandlers<EventHandlerPayloads>,
): Emitter<EventHandlerPayloads> => {
  // A map of event keys and their corresponding event handlers.
  const handlers: Map<EventKey, EventHandler<unknown>[]> = eventHandlers
    ? new Map(Object.entries(eventHandlers))
    : new Map();

  return {
    /**
     * Add an event handler for the given event key.
     * @param {string|symbol} key Type of event to listen for
     * @param {Function} handler Function that is invoked when the specified event occurs
     */
    on<Key extends keyof EventHandlerPayloads>(key: Key, handler: EventHandler<EventHandlerPayloads[Key]>) {
      if (!handlers.has(key as EventKey)) {
        handlers.set(key as EventKey, []);
      }
      const handlerArray = handlers.get(key as EventKey) as Array<EventHandler<EventHandlerPayloads[Key]>>;
      if (!handlerArray.includes(handler)) {
        handlerArray.push(handler);
      }
    },

    /**
     * Remove an event handler for the given event key.
     * If `handler` is undefined, all handlers for the given key are removed.
     * @param {string|symbol} key Type of event to unregister `handler` from
     * @param {Function} [handler] Handler function to remove
     */
    off<Key extends keyof EventHandlerPayloads>(key: Key, handler?: EventHandler<EventHandlerPayloads[Key]>) {
      if (!handler) {
        handlers.delete(key as EventKey);
      } else {
        const handlerArray = handlers.get(key as EventKey);
        if (handlerArray) {
          handlers.set(
            key as EventKey,
            handlerArray.filter((h) => h !== handler),
          );
        }
      }
    },

    /**
     * Emit an event with the given event key and payload.
     * Triggers all event handlers associated with the specified key.
     * @param {string|symbol} key The event key
     * @param {EventHandlerPayloads} [payload] Any value (preferably an object), passed to each invoked handler
     */
    emit<Key extends keyof EventHandlerPayloads>(key: Key, payload: EventHandlerPayloads[Key]) {
      const handlerArray = handlers.get(key as EventKey);
      if (handlerArray) {
        for (const handler of handlerArray) {
          handler(payload);
        }
      }
    },
  };
};

/**
 * Function to create an Event Emitter Middleware.
 * This function takes an optional parameter of eventHandlers and returns a MiddlewareHandler.
 * Inside this function, an instance of the event emitter is created and set to context under the key 'emitter'.
 */
export const emitter = <EventHandlerPayloads>(
  eventHandlers?: EventHandlers<EventHandlerPayloads>,
): MiddlewareHandler => {
  // Create new instance to share with any middleware and handlers
  const instance = createEmitter<EventHandlerPayloads>(eventHandlers);
  return createMiddleware(async (c, next) => {
    c.set('emitter', instance);
    await next();
  });
};
