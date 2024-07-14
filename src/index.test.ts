import { type Context, Hono } from 'hono';
import { describe, expect, it, vi } from 'vitest';
import { type Emitter, createEmitter, defineHandler, defineHandlers, emitter } from './index'; // Adjust the import path as needed

describe('Event Emitter Middleware', () => {
  describe('createEmitter', () => {
    it('should create an emitter with initial handlers', () => {
      type EventHandlerPayloads = {
        test: { id: string; text: string };
      };
      const handlers = {
        test: [vi.fn()],
      };
      const ee = createEmitter<EventHandlerPayloads>(handlers);
      expect(ee).toBeDefined();
      expect(ee.emit).toBeDefined();
      expect(ee.on).toBeDefined();
      expect(ee.off).toBeDefined();
      expect(ee.emitAsync).toBeDefined();
    });

    it('should create an emitter without initial handlers', () => {
      const ee = createEmitter();
      expect(ee).toBeDefined();
    });

    it('should allow adding and removing handlers', () => {
      type EventHandlerPayloads = {
        test: string;
      };
      const ee = createEmitter<EventHandlerPayloads>();
      const handler = vi.fn();
      ee.on('test', handler);
      ee.emit('test', {} as Context, 'payload');
      expect(handler).toHaveBeenCalledWith({}, 'payload');

      ee.off('test', handler);
      ee.emit('test', {} as Context, 'payload');
      expect(handler).toHaveBeenCalledTimes(1);
    });

    it('should remove all handlers for an event when no handler is specified', () => {
      type EventHandlerPayloads = {
        test: string;
      };
      const ee = createEmitter<EventHandlerPayloads>();
      const handler1 = vi.fn();
      const handler2 = vi.fn();
      ee.on('test', handler1);
      ee.on('test', handler2);
      ee.off('test');
      ee.emit('test', {} as Context, 'payload');
      expect(handler1).not.toHaveBeenCalled();
      expect(handler2).not.toHaveBeenCalled();
    });

    it('should emit events to all registered handlers', () => {
      type EventHandlerPayloads = {
        test: string;
      };
      const ee = createEmitter<EventHandlerPayloads>();
      const handler1 = vi.fn();
      const handler2 = vi.fn();
      ee.on('test', handler1);
      ee.on('test', handler2);
      ee.emit('test', {} as Context, 'payload');
      expect(handler1).toHaveBeenCalledWith({}, 'payload');
      expect(handler2).toHaveBeenCalledWith({}, 'payload');
    });

    it('should not add the same named function handler multiple times', () => {
      type EventHandlerPayloads = {
        test: string;
      };
      const ee = createEmitter<EventHandlerPayloads>();
      const handler = vi.fn();
      ee.on('test', handler);
      ee.on('test', handler);
      ee.emit('test', {} as Context, 'payload');
      expect(handler).toHaveBeenCalledTimes(1);
    });

    it('should emit async events concurrently', async () => {
      type EventHandlerPayloads = {
        test: { id: string };
      };
      const ee = createEmitter<EventHandlerPayloads>();
      const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
      const handler1 = vi.fn(
        defineHandler<EventHandlerPayloads, 'test'>(async (_c, _payload) => {
          await delay(100);
        }),
      );
      const handler2 = vi.fn(
        defineHandler<EventHandlerPayloads, 'test'>(async (_c, _payload) => {
          await delay(100);
        }),
      );

      ee.on('test', handler1);
      ee.on('test', handler2);

      const start = Date.now();
      await ee.emitAsync('test', {} as Context, { id: '123' }, { mode: 'concurrent' });
      const end = Date.now();

      // The total time should be close to 100ms (since handlers run concurrently)
      // We'll allow a small margin for execution time
      expect(end - start).toBeLessThan(150);

      expect(handler1).toHaveBeenCalledWith(expect.anything(), { id: '123' });
      expect(handler2).toHaveBeenCalledWith(expect.anything(), { id: '123' });
      expect(handler1).toHaveBeenCalledTimes(1);
      expect(handler2).toHaveBeenCalledTimes(1);
    });

    it('should emit async events sequentially', async () => {
      type EventHandlerPayloads = {
        test: { id: string };
      };
      const ee = createEmitter<EventHandlerPayloads>();
      const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));
      const handler1 = vi.fn(
        defineHandler<EventHandlerPayloads, 'test'>(async (_c, _payload) => {
          await delay(100);
        }),
      );
      const handler2 = vi.fn(
        defineHandler<EventHandlerPayloads, 'test'>(async (_c, _payload) => {
          await delay(100);
        }),
      );
      ee.on('test', handler1);
      ee.on('test', handler2);
      const start = Date.now();
      await ee.emitAsync('test', {} as Context, { id: '123' }, { mode: 'sequencial' });
      const end = Date.now();

      // The total time should be close to 200ms (since handlers run sequentially)
      // We'll allow a small margin for execution time
      expect(end - start).toBeGreaterThanOrEqual(200);
      expect(end - start).toBeLessThan(250);

      expect(handler1).toHaveBeenCalledWith(expect.anything(), { id: '123' });
      expect(handler2).toHaveBeenCalledWith(expect.anything(), { id: '123' });
      expect(handler1).toHaveBeenCalledTimes(1);
      expect(handler2).toHaveBeenCalledTimes(1);
    });

    it('should throw AggregateError when async handlers fail using emitAsync with concurent mode', async () => {
      type EventHandlerPayloads = {
        test: string;
      };
      const ee = createEmitter<EventHandlerPayloads>();
      const handler1 = vi.fn().mockRejectedValue(new Error('Error 1'));
      const handler2 = vi.fn().mockRejectedValue(new Error('Error 2'));
      ee.on('test', handler1);
      ee.on('test', handler2);
      await expect(ee.emitAsync('test', {} as Context, 'payload')).rejects.toThrow(AggregateError);
      try {
        await ee.emitAsync('test', {} as Context, 'payload', { mode: 'concurrent' });
        // Should not reach here
        expect(true).toBe(false);
      } catch (error) {
        expect((error as AggregateError).errors).toHaveLength(2);
        expect((error as AggregateError).errors[0].message).toBe('Error 1');
        expect((error as AggregateError).errors[1].message).toBe('Error 2');
      }
    });

    it('should stop execution on first error in async handlers fail using emitAsync with sequential mode', async () => {
      type EventHandlerPayloads = {
        test: { id: string };
      };

      const ee = createEmitter<EventHandlerPayloads>();

      const handler1 = vi.fn(
        defineHandler<EventHandlerPayloads, 'test'>(async () => {
          throw new Error('Error 1');
        }),
      );

      const handler2 = vi.fn(
        defineHandler<EventHandlerPayloads, 'test'>(async () => {
          // This should not be called
        }),
      );

      ee.on('test', handler1);
      ee.on('test', handler2);

      try {
        await ee.emitAsync('test', {} as Context, { id: '789' }, { mode: 'sequencial' });
        // Should not reach here
        expect(true).toBe(false);
      } catch (error) {
        expect(error).toBeInstanceOf(Error);
        expect((error as Error).message).toBe('Error 1');
      }

      expect(handler1).toHaveBeenCalledWith(expect.anything(), { id: '789' });
      expect(handler1).toHaveBeenCalledTimes(1);
      expect(handler2).not.toHaveBeenCalled();
    });

    it('should throw TypeError when adding a non-function handler', () => {
      type EventHandlerPayloads = {
        test: string;
      };
      const ee = createEmitter<EventHandlerPayloads>();
      // biome-ignore lint/suspicious/noExplicitAny: <explanation>
      expect(() => ee.on('test', 'not a function' as any)).toThrow(TypeError);
    });

    it('should do nothing when emitting an event with no handlers', () => {
      type EventHandlerPayloads = {
        test: string;
      };
      const ee = createEmitter<EventHandlerPayloads>();
      expect(() => ee.emit('test', {} as Context, 'payload')).not.toThrow();
    });

    it('should do nothing when emitting an async event with no handlers', async () => {
      type EventHandlerPayloads = {
        test: string;
      };
      const ee = createEmitter<EventHandlerPayloads>();
      await expect(ee.emitAsync('test', {} as Context, 'payload')).resolves.toBeUndefined();
    });
  });

  describe('emitter middleware', () => {
    it('should add emitter to context', async () => {
      type EventHandlerPayloads = {
        test: string;
      };
      const middleware = emitter<EventHandlerPayloads>();
      const context = {
        set: vi.fn(),
      } as unknown as Context;
      const next = vi.fn();

      await middleware(context, next);

      expect(context.set).toHaveBeenCalledWith('emitter', expect.any(Object));
      expect(next).toHaveBeenCalled();
    });

    it('should create emitter with provided handlers', async () => {
      const handler = vi.fn();
      type EventHandlerPayloads = {
        test: string;
      };
      const middleware = emitter<EventHandlerPayloads>({ test: [handler] });

      let capturedEmitter: Emitter<EventHandlerPayloads> | undefined;
      const context = {
        set: vi.fn().mockImplementation((key, value) => {
          if (key === 'emitter') {
            capturedEmitter = value;
          }
        }),
      } as unknown as Context;
      const next = vi.fn();

      await middleware(context, next);

      expect(context.set).toHaveBeenCalledWith('emitter', expect.any(Object));
      expect(capturedEmitter).toBeDefined();

      capturedEmitter?.emit('test', {} as Context, 'payload');
      expect(handler).toHaveBeenCalledWith({}, 'payload');
    });
  });

  describe('defineHandler', () => {
    it('should return the provided handler', () => {
      const handler = (_c: Context, _payload: number) => {};
      const definedHandler = defineHandler(handler);
      expect(definedHandler).toBe(handler);
    });
  });

  describe('defineHandlers', () => {
    it('should return the provided handlers object', () => {
      const handlers = {
        test: [(_c: Context, _payload: number) => {}],
      };
      const definedHandlers = defineHandlers(handlers);
      expect(definedHandlers).toBe(handlers);
    });
  });

  describe('type safety', () => {
    it('should enforce correct types for event payloads', () => {
      type Events = {
        numberEvent: number;
        objectEvent: { id: string };
      };

      const ee = createEmitter<Events>();

      // These should compile without errors
      ee.on('numberEvent', (_c, payload) => {
        const _num: number = payload;
      });
      ee.on('objectEvent', (_c, payload) => {
        const _id: string = payload.id;
      });

      // @ts-expect-error
      ee.emit('numberEvent', {} as Context, 'not a number');

      // @ts-expect-error
      ee.emit('objectEvent', {} as Context, { wrongKey: 'value' });

      // These should compile without errors
      ee.emit('numberEvent', {} as Context, 42);
      ee.emit('objectEvent', {} as Context, { id: 'test' });
    });
  });
  describe('Hono request flow', () => {
    it('should work when assigning event handlers via middleware', async () => {
      type EventHandlerPayloads = {
        'todo:created': { id: string; text: string };
      };

      type Env = { Variables: { emitter: Emitter<EventHandlerPayloads> } };

      const handlers = defineHandlers<EventHandlerPayloads>({
        'todo:created': [vi.fn((_c, _payload) => {})],
      });

      const app = new Hono<Env>();

      app.use(emitter(handlers));

      let currentContext = null;
      app.post('/todo', (c) => {
        currentContext = c;
        c.get('emitter').emit('todo:created', c, { id: '2', text: 'Buy milk' });
        return c.json({ message: 'Todo created' });
      });

      const res = await app.request('http://localhost/todo', { method: 'POST' });
      expect(res).not.toBeNull();
      expect(res.status).toBe(200);
      expect(handlers['todo:created']?.[0]).toHaveBeenCalledWith(currentContext, { id: '2', text: 'Buy milk' });
    });

    it('should work when assigning async event handlers via middleware', async () => {
      type EventHandlerPayloads = {
        'todo:created': { id: string; text: string };
      };

      type Env = { Variables: { emitter: Emitter<EventHandlerPayloads> } };

      const handlers = defineHandlers<EventHandlerPayloads>({
        'todo:created': [vi.fn(async (_c, _payload) => {})],
      });

      const app = new Hono<Env>();

      app.use(emitter(handlers));

      let currentContext = null;
      app.post('/todo', async (c) => {
        currentContext = c;
        await c.get('emitter').emitAsync('todo:created', c, { id: '2', text: 'Buy milk' });
        return c.json({ message: 'Todo created' });
      });

      const res = await app.request('http://localhost/todo', { method: 'POST' });
      expect(res).not.toBeNull();
      expect(res.status).toBe(200);
      expect(handlers['todo:created']?.[0]).toHaveBeenCalledWith(currentContext, { id: '2', text: 'Buy milk' });
    });
  });
});
