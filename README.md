# Simone

Typed mock expectations for Vitest. Sinon-style API with full TypeScript inference.

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

## Strict Behavior

- Calling a function with no expectations configured → throws immediately
- Calling with args that don't match → throws immediately
- Calling functions out of declaration order → throws immediately
- Setting up an expectation that is never consumed → test fails after it completes
- Calling `.expects()` with a name that doesn't exist on the module → compile error + runtime error

