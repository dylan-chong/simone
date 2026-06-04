import { describe, it, expect, beforeEach } from 'vitest'
import { createMockModule } from '../src/mock-module'
import { registry } from '../src/registry'
import { globalQueue } from '../src/expectation'

type UserService = typeof import('./fixtures/user-service')

describe('createMockModule', () => {
  beforeEach(() => {
    registry.clear()
    globalQueue.reset()
  })

  it('returns an object with expects method', () => {
    const mod = createMockModule<UserService>('userService', ['getUser', 'createUser'])
    expect(mod.expects).toBeTypeOf('function')
  })

  it('returns an object with callable function stubs', () => {
    const mod = createMockModule<UserService>('userService', ['getUser', 'createUser'])
    expect(mod.getUser).toBeTypeOf('function')
    expect(mod.createUser).toBeTypeOf('function')
  })

  it('does not create stubs for non-function exports', () => {
    const mod = createMockModule<UserService>('userService', ['getUser', 'createUser'])
    expect((mod as any).API_VERSION).toBeUndefined()
  })

  it('stub throws when called without any expectation configured', () => {
    const mod = createMockModule<UserService>('userService', ['getUser', 'createUser'])

    expect(() => mod.getUser('user-1')).toThrow(
      'getUser() was called but has no expectations configured'
    )
  })

  it('stub returns value when called and matches next in global queue', async () => {
    const mod = createMockModule<UserService>('userService', ['getUser', 'createUser'])
    mod.expects('getUser').withArgs('user-1').resolves({ id: 'user-1', name: 'Alice' })

    const result = mod.getUser('user-1')
    await expect(result).resolves.toEqual({ id: 'user-1', name: 'Alice' })
  })

  it('stub throws when call does not match next expectation in queue', () => {
    const mod = createMockModule<UserService>('userService', ['getUser', 'createUser'])
    mod.expects('getUser').withArgs('user-1').resolves({ id: 'user-1', name: 'Alice' })

    expect(() => mod.getUser('wrong-id')).toThrow(`userService.getUser() was called with wrong arguments

- arg 0: "user-1"
+ arg 0: "wrong-id"`)
  })

  it('enforces global ordering across functions', () => {
    const mod = createMockModule<UserService>('userService', ['getUser', 'createUser'])
    mod.expects('getUser').withArgs('user-1').resolves({ id: 'user-1', name: 'Alice' })
    mod.expects('createUser').withArgs('Bob', 25).resolves({ id: '2' })

    expect(() => mod.createUser('Bob', 25)).toThrow(
      'expected userService.getUser("user-1") to be called next, but userService.createUser("Bob", 25) was called'
    )
  })

  it('expects throws for non-existent function name', () => {
    const mod = createMockModule<UserService>('userService', ['getUser', 'createUser'])

    // @ts-expect-error - testing runtime error for invalid key
    expect(() => mod.expects('nonExistent')).toThrow(
      "'nonExistent' is not a function export"
    )
  })

  it('reset clears configured state', () => {
    const mod = createMockModule<UserService>('userService', ['getUser', 'createUser'])
    mod.expects('getUser').withArgs('user-1').resolves({ id: 'user-1', name: 'Alice' })
    mod.reset()

    expect(() => mod.getUser('user-1')).toThrow('has no expectations configured')
  })

  it('stub with multiple args returns value when all args match', async () => {
    const mod = createMockModule<UserService>('userService', ['getUser', 'createUser'])
    mod.expects('createUser').withArgs('Bob', 25).resolves({ id: 'new-1' })

    const result = mod.createUser('Bob', 25)
    await expect(result).resolves.toEqual({ id: 'new-1' })
  })

  it('stub with multiple args throws when args do not match', () => {
    const mod = createMockModule<UserService>('userService', ['getUser', 'createUser'])
    mod.expects('createUser').withArgs('Bob', 25).resolves({ id: 'new-1' })

    expect(() => mod.createUser('Alice', 30)).toThrow(`userService.createUser() was called with wrong arguments

- arg 0: "Bob"
+ arg 0: "Alice"
- arg 1: 25
+ arg 1: 30`)
  })

  it('calls invokes callback with matched args', async () => {
    const mod = createMockModule<UserService>('userService', ['getUser', 'createUser'])
    mod.expects('getUser').withArgs('user-1').calls(async (id) => ({ id, name: 'Dynamic' }))

    const result = await mod.getUser('user-1')
    expect(result).toEqual({ id: 'user-1', name: 'Dynamic' })
  })

  it('calls still enforces arg matching', () => {
    const mod = createMockModule<UserService>('userService', ['getUser', 'createUser'])
    mod.expects('getUser').withArgs('user-1').calls(async (id) => ({ id, name: 'X' }))

    expect(() => mod.getUser('wrong-id')).toThrow(`userService.getUser() was called with wrong arguments

- arg 0: "user-1"
+ arg 0: "wrong-id"`)
  })

  it('rejects causes stub to return a rejected promise', async () => {
    const mod = createMockModule<UserService>('userService', ['getUser', 'createUser'])
    mod.expects('getUser').withArgs('user-1').rejects(new Error('db connection failed'))

    await expect(mod.getUser('user-1')).rejects.toThrow('db connection failed')
  })

  it('resolves returns a resolved promise with the value', async () => {
    const mod = createMockModule<UserService>('userService', ['getUser', 'createUser'])
    mod.expects('getUser').withArgs('user-1').resolves({ id: 'user-1', name: 'Alice' })

    const result = await mod.getUser('user-1')
    expect(result).toEqual({ id: 'user-1', name: 'Alice' })
  })

  it('rejects returns a rejected promise with the error', async () => {
    const mod = createMockModule<UserService>('userService', ['getUser', 'createUser'])
    mod.expects('getUser').withArgs('user-1').rejects(new Error('not found'))

    await expect(mod.getUser('user-1')).rejects.toThrow('not found')
  })

  it('registers itself in the global registry', () => {
    const mod = createMockModule<UserService>('userService', ['getUser', 'createUser'])
    expect(registry.getAll()).toContain(mod)
  })
})
