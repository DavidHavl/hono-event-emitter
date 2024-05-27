# Event Emitter middleware for Hono

Minimal, lightweight and edge compatible Event Emitter middleware for [Hono](https://github.com/honojs/hono).

It enables event driven code flow in hono applications (essential in large projects).

Inspired by event emitter concept in other frameworks such as [Fastify](https://github.com/Shiva127/fastify-event-bus), [Adonisjs](https://docs.adonisjs.com/guides/emitter) and others.

Api is inspired by [mitt](https://github.com/developit/mitt/tree/main).


<?xml version="1.0"?>
<svg xmlns="http://www.w3.org/2000/svg" width="100" height="20">
<linearGradient id="a" x2="0" y2="100%">
    <stop offset="0" stop-color="#bbb" stop-opacity=".1"/>
    <stop offset="2" stop-opacity=".1"/>
</linearGradient>

<rect rx="3" width="60" height="20" fill="#555"/> <!-- Comment -->
<rect rx="3" x="60" width="40" height="20" fill="#4c1"/>

<path fill="#4c1" d="M58 0h4v20h-4z"/>

<rect rx="3" width="100" height="20" fill="url(#a)"/>
	<g fill="#fff" text-anchor="middle" font-family="DejaVu Sans,Verdana,Geneva,sans-serif" font-size="11">
	    <text x="30" y="15" fill="#010101" fill-opacity=".3">coverage</text>
	    <text x="30" y="14">coverage</text>
	    <text x="80" y="15" fill="#010101" fill-opacity=".3">100%</text>
	    <text x="80" y="14">100%</text>
	</g>
</svg>

## Installation

```sh
npm install hono-event-emitter
# or
yarn add hono-event-emitter
# or
pnpm add hono-event-emitter
# or
bun install hono-event-emitter
```


## Usage

### There are 2 ways you can use this:

#### 1. As Hono middleware
```js
// app.js

import { emitter } from 'hono-event-emitter'
import { Hono } from 'hono'

// Define event handlers
const handlers = {
  'todo:created': [
    (payload, c) => { console.log('New todo created:', payload) }
  ],
  'foo': [
    (payload) => { console.log('Foo:', payload) }
  ]
}

const app = new Hono()

// Register the emitter middleware and provide it with the handlers
app.use('*', emitter(handlers))

app.post('/todo', async (c) => {
  // ...
  // The emitter is available under "emitter" key in the context. Use emit method to emit events
  c.get('emitter').emit('foo', 42)
  // You can also pass along the context
  c.get('emitter').emit('todo:created', { todo, c })
})

export default app
```

You can also subscribe to events inside middlewares or route handlers, but you can only use named functions!
The emitter is available in the context as `emitter` key, and when using named functions it will only be subscribed to once, even if the middleware is called multiple times.

```js
// Define event handler as named function
const todoCreatedHandler = ({ todo, c }) => {
  console.log('New todo created:', todo)
}
// ...
app.use((c) => {
  // ...
  // Subscribe to event
  c.get('emitter').on('todo:created', todoCreatedHandler)
})

app.post('/todo', async (c) => {
  // ...
    // Emit event
  c.get('emitter').emit('todo:created', { todo, c });
})
// ...
```

#### 2 Standalone

```js
// app.js

import { createEmitter } from 'hono-event-emitter'
import { Hono } from 'hono'


// Setup event listeners
const handlers = {
  'todo:created': [
    (payload) => { console.log('New todo created:', payload) }
  ],
  'todo:deleted': [
    ({ id, c }) => { console.log(`Todo ${id} has ben deleted:`) }
  ]
}

// Initialize emitter
const ee = createEmitter(handlers)

// You can also add more listeners later
ee.on('foo', (payload) => { console.log('Foo:', payload) })

// Initialize the hono app
const app = new Hono()

app.post('/todo', async (c) => {
  // ...
  // Emit event
  ee.emit('todo:created', todo)
})

app.delete('/todo/:id', async (c) => {
  // ...
  // Emit event
  ee.emit('todo:deleted', { id, c })
})

export default app
```

#### Websocket example:

```js
// app.js

import { Hono } from 'hono'
import { upgradeWebSocket } from 'hono/cloudflare-workers'
import { emitter } from 'hono-event-emitter'

const app = new Hono()

// Register the emitter middleware
app.use('*', emitter())

app.get('/ws', upgradeWebSocket((c) => {
    // Define handler
    function sendMessage(ws) {
        return (message) => ws.send(message);
    }
    
    return {
      onOpen(event, ws) {
        // Setup event listener when connection is opened
        c.get('emitter').on('message', sendMessage(ws))
        console.log('Connection opened')
      },
      onClose: (event, ws) => {
        // Remove event listener when connection is closed
        c.get('emitter').off('message', sendMessage(ws))
        console.log('Connection closed')
      },
    }
  })
)

app.post('/send-message', async (c) => {
  // Emit event
  c.get('emitter').emit('message', 'Hello from server!')
  c.json({ message: 'Message sent' })
})

```

### Typescript

#### 1. As hono middleware

```ts
// app.ts

import { emitter, type Emitter, type EventHandlers } from 'hono-event-emitter'
import { Hono } from 'hono'

type Todo = {
  id: string,
  title: string,
  completed: boolean
}

type AvailableEvents = {
  // event key: payload type
  'todo:created': { todo: Todo, c: Context };
  'todo:deleted': { id: string };
  'foo': number;
};

const handlers: EventHandlers<AvailableEvents> = {
  'todo:deleted': [
    (payload) => {} // payload will be inferred as { id: string }
  ]
}

const todoCreatedHandler = ({ todo: Todo, c: Context }) => {
  // ...
  console.log('New todo created:', todo)
}

// Initialize the app with emitter type
const app = new Hono<{ Variables: { emitter: Emitter<AvailableEvents> }}>()

// Register the emitter middleware and provide it with the handlers
app.use('*', emitter(handlers))

// And/Or setup event listeners as "named function" inside middleware or route handler
app.use((c) => {
  c.get('emitter').on('todo:created', todoCreatedHandler)
})

app.post('/todo', async (c) => {
  // ...
  // Emit event and pass the payload (todo object) plus context
  c.get('emitter').emit('todo:created', { todo, c })
})

app.delete('/todo/:id', async (c) => {
  // ...
  // Emit event
  c.get('emitter').emit('todo:deleted', { id })
})

export default app
```

#### 2. Standalone:

```ts
// app.ts

import { createEmitter, type Emitter, type EventHandlers } from 'hono-event-emitter'
import { Hono } from 'hono'

type Todo = {
  id: string,
  title: string,
  completed: boolean
}

type AvailableEvents = {
  // event key: payload type
  'todo:created': { todo: Todo, c: Context };
  'todo:deleted': { id: string },
  'foo': number;
}

// Define event listeners
const handlers: EventHandlers<AvailableEvents> = {
  'todo:deleted': [
    (payload) => {} // payload will be inferred as { id: string }
  ]
}

// And you can also define extra event handler as named function
const todoCreatedHandler = ({ todo: Todo, c: Context }) => {
  // ...
  console.log('New todo created:', todo)
}

// Initialize emitter with handlers
const ee = createEmitter<AvailableEvents>(handlers)

// Add more listeners on the fly. Here you can use anonymous or closure functions.
ee.on('todo:deleted', (payload) => { console.log('Todo deleted:', payload) }) // Payload will be inferred as { id: string }

// Initialize the app
const app = new Hono()

app.post('/todo', async (c) => {
  // ...
  // Emit event
  ee.emit('todo:created', { todo, c }) // payload  will be expected to be { todo: Todo, c: Context } type
})

app.delete('/todo/:id', async (c) => {
  // ...
  // Emit event
  ee.emit('todo:deleted', { id }) // payload  will be expected to be { id: string } type
})

export default app
```

### NOTE:

When assigning event handlers inside of middleware or route handlers, don't use anonymous or closure functions, only named functions!
This is because anonymous functions or closures in javascript are created as new object every time and therefore can't be easily checked for equality/duplicates.


For more usage examples, see the [tests](src/index.test.ts).

## Author

David Havl <https://github.com/DavidHavl>

## License

MIT
