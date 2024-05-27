// src/index.ts
import { createMiddleware } from "hono/factory";
var createEmitter = (eventHandlers) => {
  const handlers = eventHandlers ? new Map(Object.entries(eventHandlers)) : /* @__PURE__ */ new Map();
  return {
    on(key, handler) {
      if (!handlers.has(key)) {
        handlers.set(key, []);
      }
      const handlerArray = handlers.get(key);
      if (!handlerArray.includes(handler)) {
        handlerArray.push(handler);
      }
    },
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
    emit(key, payload) {
      const handlerArray = handlers.get(key);
      if (handlerArray) {
        for (const handler of handlerArray) {
          handler(payload);
        }
      }
    }
  };
};
var emitter = (eventHandlers) => {
  const instance = createEmitter(eventHandlers);
  return createMiddleware(async (c, next) => {
    c.set("emitter", instance);
    await next();
  });
};
export {
  createEmitter,
  emitter
};
