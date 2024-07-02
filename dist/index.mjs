// src/index.ts
var defineHandler = (handler) => {
  return handler;
};
var defineHandlers = (handlers) => {
  return handlers;
};
var createEmitter = (eventHandlers) => {
  const handlers = eventHandlers ? new Map(Object.entries(eventHandlers)) : /* @__PURE__ */ new Map();
  return {
    /**
     * Add an event handler for the given event key.
     * @param {string|symbol} key Type of event to listen for
     * @param {Function} handler Function that is invoked when the specified event occurs
     */
    on(key, handler) {
      if (!handlers.has(key)) {
        handlers.set(key, []);
      }
      const handlerArray = handlers.get(key);
      if (!handlerArray.includes(handler)) {
        handlerArray.push(handler);
      }
    },
    /**
     * Remove an event handler for the given event key.
     * If `handler` is undefined, all handlers for the given key are removed.
     * @param {string|symbol} key Type of event to unregister `handler` from
     * @param {Function} handler - Handler function to remove
     */
    off(key, handler) {
      if (!handler) {
        handlers.delete(key);
      } else {
        const handlerArray = handlers.get(key);
        if (handlerArray) {
          handlers.set(
            key,
            handlerArray.filter((h) => h !== handler)
          );
        }
      }
    },
    /**
     * Emit an event with the given event key and payload.
     * Triggers all event handlers associated with the specified key.
     * @param {string|symbol} key - The event key
     * @param {Context} c - The current context object
     * @param {EventHandlerPayloads[keyof EventHandlerPayloads]} payload - Data passed to each invoked handler
     */
    emit(key, c, payload) {
      const handlerArray = handlers.get(key);
      if (handlerArray) {
        for (const handler of handlerArray) {
          handler(c, payload);
        }
      }
    }
  };
};
var emitter = (eventHandlers) => {
  const instance = createEmitter(eventHandlers);
  return async (c, next) => {
    c.set("emitter", instance);
    await next();
  };
};
export {
  createEmitter,
  defineHandler,
  defineHandlers,
  emitter
};
