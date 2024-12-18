# hono-event-emitter

## [1.0.0] - 2024-05-24
### Added
- Full release of the library.



## [2.0.0] - 2024-06-02
### Added
- `defineHandler` and `defineHandlers` helper functions to create fully typed event handlers.
### Changed
- Event handlers and EventHandler type now take Context as first argument and payload as second argument.
- Consequentially `.emit()` now requires Context as second argument and payload as third: `.emit('foo', ctx, payload)`.



## [3.0.0] - 2024-07-15
### Added
- Add a new emitAsync method to invoke asynchronous event handlers.
-  Add potential memory leak prevention via max handler limit.
-  Add new option 'maxHandlers' to createEmitter() and emitter() methods.



## [4.0.0] - 2024-12-18
### Changed
- Move context to be the first argument of emit methods `.emit(ctx, 'foo', payload)` and `.emitAsync(ctx, 'foo', payload)` to match the signature of the library published in hono middleware repository.
