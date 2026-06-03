# Change Log
This repository adheres to semantic versioning and follows the conventions of [keepachangelog.com](http://keepachangelog.com).

## [Unreleased]

## [1.2.0] - 2026-06-03
### Added
- `.expects(name).withArgs(...).throws(error)` — stub throws synchronously
- `.expects(name).withArgs(...).resolves(value)` — shorthand for returning a resolved promise
- `.expects(name).withArgs(...).rejects(error)` — shorthand for returning a rejected promise
- "Adding a New Function" guide in README

### Changed
- Example project uses domain-specific test names and single deep-object assertions
- Example project extracts all inline types to `example/src/types.ts`

## [1.1.0] - 2026-06-03
### Added
- `.expects(name).withArgs(...).calls(fn)` for dynamic return values via callback
- `MockModuleInstance<T>` type — typed return from `mockModule()` and `createMockModule()`
- Type checking on `.expects()`, `.withArgs()`, and `.returns()` calls
- `vitest --typecheck` included in `npm test`

### Removed
- `.expects(name).never()` — redundant, unconfigured mocks already throw when called
- `functionNames` parameter from `mockModule()` — Vite plugin derives it automatically

### Changed
- Generic type params renamed from single letters to descriptive names (`Module`, `Fn`)
- README usage section references example project files directly

## [1.0.0] - 2026-06-03
### Added
- `mockModule<T>(path)` with Sinon-style expectation API
- `.expects(name).withArgs(...).returns(value)` with strict global ordering
- Vite plugin for automatic module transform
- `verifyAll()` / `resetAll()` lifecycle hooks
- `afterEach` auto-verification via setup file
