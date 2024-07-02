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