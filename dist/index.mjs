// src/index.ts
var defineHandler = (handler) => {
  return handler;
};
var defineHandlers = (handlers) => {
  return handlers;
};
var createEmitter = (eventHandlers, options) => {
  const handlers = eventHandlers ? new Map(Object.entries(eventHandlers)) : /* @__PURE__ */ new Map();
  return {
    /**
     * Add an event handler for the given event key.
     * @param {string|symbol} key Type of event to listen for
     * @param {Function} handler Function that is invoked when the specified event occurs
     * @throws {TypeError} If the handler is not a function
     */
    on(key, handler) {
      if (typeof handler !== "function") {
        throw new TypeError("The handler must be a function");
      }
      if (!handlers.has(key)) {
        handlers.set(key, []);
      }
      const handlerArray = handlers.get(key);
      const limit = options?.maxHandlers ?? 10;
      if (handlerArray.length >= limit) {
        throw new RangeError(
          `Max handlers limit (${limit}) reached for the event "${String(key)}". 
          This may indicate a memory leak, 
          perhaps due to adding anonymous function as handler within middleware or request handler.
          Check your code or consider increasing limit using options.maxHandlers.`
        );
      }
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
     * @param {EventPayloadMap[keyof EventPayloadMap]} payload - Data passed to each invoked handler
     */
    emit(key, c, payload) {
      const handlerArray = handlers.get(key);
      if (handlerArray) {
        for (const handler of handlerArray) {
          handler(c, payload);
        }
      }
    },
    /**
     * Emit an event with the given event key and payload.
     * Asynchronously triggers all event handlers associated with the specified key.
     * @param {string|symbol} key - The event key
     * @param {Context} c - The current context object
     * @param {EventPayloadMap[keyof EventPayloadMap]} payload - Data passed to each invoked handler
     * @param {EmitAsyncOptions} options - Options.
     * @throws {AggregateError} If any handler encounters an error.
     */
    async emitAsync(key, c, payload, options2 = { mode: "concurrent" }) {
      const handlerArray = handlers.get(key);
      if (handlerArray) {
        if (options2.mode === "sequencial") {
          for (const handler of handlerArray) {
            await handler(c, payload);
          }
        } else {
          const results = await Promise.allSettled(
            handlerArray.map(async (handler) => {
              await handler(c, payload);
            })
          );
          const errors = results.filter((r) => r.status === "rejected").map(
            (e) => e.reason
          );
          if (errors.length > 0) {
            throw new AggregateError(errors, `${errors.length} handler(s) for event ${String(key)} encountered errors`);
          }
        }
      }
    }
  };
};
var emitter = (eventHandlers, options) => {
  const instance = createEmitter(eventHandlers, options);
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
