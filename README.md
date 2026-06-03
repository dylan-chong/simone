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

```ts
// src/userService.ts
export async function getUser(id: string): Promise<{ id: string; name: string }> {
  return db.query('SELECT * FROM users WHERE id = ?', [id])
}

export async function deleteUser(id: string): Promise<void> {
  await db.query('DELETE FROM users WHERE id = ?', [id])
}
```

```ts
// src/profileLoader.ts
import { getUser } from './userService'

export async function loadProfile(id: string) {
  const user = await getUser(id)
  return { ...user, loadedAt: Date.now() }
}
```

```ts
// src/profileLoader.test.ts
import { mockModule } from 'simone'
import { loadProfile } from './profileLoader'

const userService = mockModule<typeof import('./userService')>('./userService')

describe('loadProfile', () => {
  it('returns enriched user data', async () => {
    userService.expects('getUser').withArgs('user-1').returns(
      Promise.resolve({ id: 'user-1', name: 'Alice' })
    )

    const profile = await loadProfile('user-1')

    expect(profile.name).toBe('Alice')
    expect(profile.loadedAt).toBeTypeOf('number')
  })

  it('handles multiple users', async () => {
    userService.expects('getUser').withArgs('user-1').returns(
      Promise.resolve({ id: 'user-1', name: 'Alice' })
    )
    userService.expects('getUser').withArgs('user-2').returns(
      Promise.resolve({ id: 'user-2', name: 'Bob' })
    )

    const alice = await loadProfile('user-1')
    const bob = await loadProfile('user-2')

    expect(alice.name).toBe('Alice')
    expect(bob.name).toBe('Bob')
  })

  it('ensures deleteUser is never called', async () => {
    userService.expects('deleteUser').never()
    userService.expects('getUser').withArgs('user-1').returns(
      Promise.resolve({ id: 'user-1', name: 'Alice' })
    )

    await loadProfile('user-1')
  })
})
```

## API

### `mockModule<T>(path)`

Creates a typed mock for all function exports of the module at `path`.

### `.expects(name).withArgs(...args).returns(value)`

Sets up an expectation: when `name` is called with `args`, return `value`. Each expectation is consumed once in declaration order. All args and return values are type-checked against the original function signature.

### `.expects(name).never()`

Declares that `name` must not be called at all.

## Strict Behavior

- Calling a function with no expectations configured → throws immediately
- Calling with args that don't match → throws immediately
- Calling functions out of declaration order → throws immediately
- Setting up an expectation that is never consumed → test fails after it completes
- Calling `.expects()` with a name that doesn't exist on the module → compile error + runtime error

## Examples

See the [`example/`](./example) directory for complete working tests:

- [`profile-loader.test.ts`](./example/src/profile-loader.test.ts) — mocking multiple modules with global call ordering
- [`profile-loader.failures.test.ts`](./example/src/profile-loader.failures.test.ts) — expected failures demonstrating strict behavior
