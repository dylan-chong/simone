# Simone

Typed mock expectations for Vitest. Sinon-style API with full TypeScript inference.

Opinionated towards a semi-functional style where you mock exported functions on a module. OOP-style mocks (classes, instances, method stubs) are not supported.

Intentionally restrictive — strict argument matching and global call ordering force LLMs (and humans) to write precise, deterministic tests instead of loose assertions that pass accidentally - Claude really likes to do this. Because of this, Claude can get desperate, so it'll need guidance on how to write tests properly.

Note that because of the restrictiveness, you will have to alter how your modules are structured in some cases to allow for precise mocking to be possible. Read the rest of this README for examples.

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

const userServiceMock = mockModule(import('./user-service'))

it('loads a user profile', async () => {
  userServiceMock
    .expects('getUser')
    .withArgs('user-1')
    .returns(Promise.resolve({ id: 'user-1', name: 'Alice' }))

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

### `mockModule(import('./path'))`

Creates a typed mock for all function exports of the module. Type inference is automatic from the `import()` expression — no explicit generic needed.

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

### No-arg functions

Functions with no arguments still require `.withArgs()` — call it with no arguments:

```ts
serviceMock
  .expects('healthCheck')
  .withArgs()
  .resolves({ ok: true })
```

### Void functions

For functions that return `void` or `Promise<void>`, pass `undefined` explicitly:

```ts
// sync void
loggerMock
  .expects('info')
  .withArgs('user created')
  .returns(undefined)

// async void
userServiceMock
  .expects('deleteUser')
  .withArgs({ id: 'user-1' })
  .resolves(undefined)
```

## Handling Non-Determinism

Simone uses strict argument matching — every arg must match exactly. This means non-deterministic values need to be controlled in your tests:

**`Date.now()` / `new Date()`** — use Vitest's fake timers:

```ts
import { vi } from 'vitest'
import { mockModule } from 'simone'
import { outputHelloMessage } from './greeter'

const loggerMock = mockModule(import('./logger'))

beforeEach(() => {
  vi.useFakeTimers()
  vi.setSystemTime(new Date('2024-01-14T10:00:00Z')) // a Tuesday
})

afterEach(() => {
  vi.useRealTimers()
})

it('outputs a hello message with the current day', () => {
  loggerMock
    .expects('info')
    .withArgs('Hello Simone, happy Tuesday')
    .returns(undefined)

  outputHelloMessage('Simone')
})
```

**UUID generation** — mock the uuid library so you can expect exact values:

```ts
import { mockModule } from 'simone'

const uuidMock = mockModule(import('uuid'))

it('creates a user with a generated id', () => {
  uuidMock
    .expects('v4')
    .withArgs()
    .returns('test-uuid-1234')

  const user = createUser('Alice')
  expect(user.id).toBe('test-uuid-1234')
})
```

**Globals (DOM, fetch, etc.)** — wrap in a module, then mock the wrapper:

```ts
// src/dom.ts
export function createDiv(): HTMLDivElement {
  return document.createElement('div')
}

export function appendChild(parent: HTMLElement, child: HTMLElement): void {
  parent.appendChild(child)
}
```

```ts
// src/renderer.test.ts
const domMock = mockModule(import('./dom'))

it('creates a div and appends it to the container', () => {
  const fakeDiv = { id: 'widget' } as unknown as HTMLDivElement
  const container = { id: 'root' } as unknown as HTMLElement

  domMock
    .expects('createDiv')
    .withArgs()
    .returns(fakeDiv)
  domMock
    .expects('appendChild')
    .withArgs(container, fakeDiv)
    .returns(undefined)

  renderWidget(container)
})
```

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

