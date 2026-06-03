# Simone

Typed mock expectations for Vitest. Sinon-style API with full TypeScript inference.

Opinionated towards a semi-functional style where you mock exported functions on a module. OOP-style mocks (classes, instances, method stubs) are not supported.

## Install

```bash
npm install -D simone
```

## Setup

```ts
// vitest.config.ts
import { simonePlugin } from 'simone/vitest'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [simonePlugin()]
})
```

## Usage

```ts
import { mockModule } from 'simone'
import { loadProfile } from './profile-loader'

const userService = mockModule<typeof import('./user-service')>('./user-service')

it('loads a user profile', async () => {
  userService.expects('getUser').withArgs('user-1').returns(
    Promise.resolve({ id: 'user-1', name: 'Alice' })
  )

  const profile = await loadProfile('user-1')
  expect(profile.name).toBe('Alice')
})
```

See the [`example/`](./example) directory for complete working examples:

- [`user-service.ts`](./example/src/user-service.ts) / [`email-service.ts`](./example/src/email-service.ts) — modules to mock
- [`profile-loader.ts`](./example/src/profile-loader.ts) — code under test
- [`profile-loader.test.ts`](./example/src/profile-loader.test.ts) — mocking multiple modules with global call ordering
- [`profile-loader.failures.test.ts`](./example/src/profile-loader.failures.test.ts) — expected failures demonstrating strict behavior

## API

### `mockModule<T>(path)`

Creates a typed mock for all function exports of the module at `path`.

### `.expects(name).withArgs(...args).returns(value)`

Sets up an expectation: when `name` is called with `args`, return `value`. Each expectation is consumed once in declaration order. All args and return values are type-checked against the original function signature.

### `.expects(name).withArgs(...args).throws(error)`

Causes the stub to throw `error` synchronously when called.

### `.expects(name).withArgs(...args).resolves(value)`

Shorthand for `.returns(Promise.resolve(value))`. Only available when the function returns a `Promise` — compile error otherwise.

### `.expects(name).withArgs(...args).rejects(error)`

Shorthand for `.returns(Promise.reject(error))`. Only available when the function returns a `Promise`.

### `.expects(name).withArgs(...args).calls(fn)`

Invokes `fn` with the matched args to compute the return value. `fn` must match the original function's signature.

## Strict Behavior

- Calling a function with no expectations configured → throws immediately
- Calling with args that don't match → throws immediately
- Calling functions out of declaration order → throws immediately
- Setting up an expectation that is never consumed → test fails after it completes
- Calling `.expects()` with a name that doesn't exist on the module → compile error + runtime error

## Releasing

1. Add an entry to `CHANGELOG.md` under a new version heading
2. Bump `version` in `package.json`
3. Commit: `git commit -am "chore: release vX.Y.Z"`
4. Tag: `git tag vX.Y.Z`
5. Push: `git push && git push --tags`

## Adding a New Function to the API

1. Add the type signature to `src/types.ts`
2. Implement in `src/mock-module.ts` (and `src/expectation.ts` if queue behaviour changes)
3. Add type tests to `tests/types.test-d.ts`
4. Add runtime tests to `tests/mock-module.test.ts`
5. Add a passing example test to `example/src/profile-loader.test.ts`
6. Add an expected-failure test to `example/src/profile-loader.failures.test.ts`
7. Document in the API section above
8. Run `npm test` to verify all tests, type checks, and examples pass

Example project test names must describe expected behaviour from the perspective of the example project's domain (e.g. "fails when the database is offline"), not the simone API being used (e.g. "uses .throws() to simulate an error").

