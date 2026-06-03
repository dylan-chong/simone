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

  it('stub returns value when called and matches next in global queue', () => {
    const mod = createMockModule<UserService>('userService', ['getUser', 'createUser'])
    mod.expects('getUser').withArgs('user-1').returns(Promise.resolve({ id: 'user-1', name: 'Alice' }))

    const result = mod.getUser('user-1')
    expect(result).resolves.toEqual({ id: 'user-1', name: 'Alice' })
  })

  it('stub throws when call does not match next expectation in queue', () => {
    const mod = createMockModule<UserService>('userService', ['getUser', 'createUser'])
    mod.expects('getUser').withArgs('user-1').returns(Promise.resolve({ id: 'user-1', name: 'Alice' }))

    expect(() => mod.getUser('wrong-id')).toThrow()
  })

  it('enforces global ordering across functions', () => {
    const mod = createMockModule<UserService>('userService', ['getUser', 'createUser'])
    mod.expects('getUser').withArgs('user-1').returns(Promise.resolve({ id: 'user-1', name: 'Alice' }))
    mod.expects('createUser').withArgs('Bob', 25).returns(Promise.resolve({ id: '2' }))

    // Calling createUser before getUser violates order
    expect(() => mod.createUser('Bob', 25)).toThrow()
  })

  it('.never() causes throw when function is called', () => {
    const mod = createMockModule<UserService>('userService', ['getUser', 'createUser'])
    mod.expects('getUser').never()

    expect(() => mod.getUser('anything')).toThrow(
      'was called but is expected to never be called'
    )
  })

  it('expects throws for non-existent function name', () => {
    const mod = createMockModule<UserService>('userService', ['getUser', 'createUser'])

    // @ts-expect-error - testing runtime error for invalid key
    expect(() => mod.expects('nonExistent')).toThrow(
      "'nonExistent' is not a function export"
    )
  })

  it('reset clears never-set', () => {
    const mod = createMockModule<UserService>('userService', ['getUser', 'createUser'])
    mod.expects('getUser').never()
    mod.reset()

    // After reset, getUser is unmocked (throws "no expectations configured", not "never")
    expect(() => mod.getUser('user-1')).toThrow('has no expectations configured')
  })

  it('stub with multiple args returns value when all args match', () => {
    const mod = createMockModule<UserService>('userService', ['getUser', 'createUser'])
    mod.expects('createUser').withArgs('Bob', 25).returns(Promise.resolve({ id: 'new-1' }))

    const result = mod.createUser('Bob', 25)
    expect(result).resolves.toEqual({ id: 'new-1' })
  })

  it('stub with multiple args throws when args do not match', () => {
    const mod = createMockModule<UserService>('userService', ['getUser', 'createUser'])
    mod.expects('createUser').withArgs('Bob', 25).returns(Promise.resolve({ id: 'new-1' }))

    expect(() => mod.createUser('Alice', 30)).toThrow()
  })

  it('registers itself in the global registry', () => {
    const mod = createMockModule<UserService>('userService', ['getUser', 'createUser'])
    expect(registry.getAll()).toContain(mod)
  })
})
