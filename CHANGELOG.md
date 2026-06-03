# Change Log
This repository adheres to semantic versioning and follows the conventions of [keepachangelog.com](http://keepachangelog.com).

## [Unreleased]

## [3.1.1] - 2026-06-04
### Added
- README section on handling non-determinism (fake timers for Date.now, mocking uuid)

## [3.1.0] - 2026-06-04
### Changed
- Convention: all `mockModule` variables now use `Mock` suffix (e.g. `userServiceMock`)
- Updated examples and README to follow the naming convention

## [3.0.0] - 2026-06-04
### Changed
- **BREAKING** `mockModule(import('./path'))` replaces `mockModule<typeof import('./path')>('./path')` — type inference is now automatic from the dynamic import expression, no explicit generic or path duplication needed

## [2.0.0] - 2026-06-04
### Added
- `ramda` as runtime dependency for robust deep equality comparison
- Circular reference detection in diff output (shows `[Circular]`)
- Helpful error when `mockModule()` called without Vite plugin configured

### Fixed
- Plugin import-removal no longer strips co-imported names (e.g. `verifyAll` alongside `mockModule`)
- Plugin regex now handles nested angle brackets in type params (e.g. `Record<string, Fn>`)
- ESM module resolution — published package now works correctly when installed via npm

### Changed
- **BREAKING** Deep equality uses `R.equals` instead of custom implementation — `Date`, `RegExp`, `Map`, `Set` are now compared by value, not by object identity
- **BREAKING** `mockModule()` throws `SimoneError` when called without the Vite plugin (previously returned a silently broken mock)
- Plugin internals extracted into well-named helpers (`replaceMockModuleCalls`, `stripMockModuleImport`, `resolveModulePath`)
- All `while` loops replaced with `for...of` using `matchAll`
- All `let` variables replaced with `const` using `reduce` and early-return helpers
- `else` block in `formatArgsDiff` flattened with `continue`

## [1.4.2] - 2026-06-03
### Added
- 100% code coverage enforcement for both main project and example
- `coverage` directory added to `.gitignore`

## [1.4.1] - 2026-06-03
### Fixed
- Test script now runs `tsc --noEmit` on both projects to catch source type errors (vitest `--typecheck` only checks test files)

## [1.4.0] - 2026-06-03
### Added
- `SimoneError` class for all simone errors
- `SimoneAlreadyFailedError` for suppressing noisy `verifyAll` errors after a prior failure
- Per-arg diff with left-padded JSON when function called with wrong arguments
- Object keys sorted alphabetically in diff output for readable comparison
- Typecheck for example project tests
- `Channel` enum in example project

### Changed
- All errors throw `SimoneError` instead of plain `Error` with `simone:` prefix
- `verifyAll()` throws `SimoneAlreadyFailedError` for any prior failure (not just arg mismatches)
- `setup.ts` uses `try/finally` so `resetAll()` always runs
- Test script runs each project once (typecheck includes runtime tests)
- Test assertions use hardcoded multiline template literals

## [1.3.0] - 2026-06-03
### Added
- Integration tests for mixing `.returns()`, `.throws()`, `.calls()`, `.resolves()`, `.rejects()` across modules
- Comprehensive `deepEqual` edge case tests (nested objects, arrays, null, primitives, extra/missing keys)
- Exact error message assertions in all tests

### Changed
- `QueuedExpectation` uses a discriminated union `Response` type instead of flat boolean flags
- `responseType` enum for response variants
- Renamed `fnId` → `fnName`, `cursor` → `consumedCount`
- `.rejects()` only available on Promise-returning functions (compile error otherwise)
- Rejected promises created lazily in `consume()` to avoid unhandled rejections

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
