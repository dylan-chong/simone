import { expectTypeOf, test } from 'vitest'
import type { FunctionKeys, MockedModule, MockModuleInstance, Expectation, ExpectationWithArgs, SyncExpectationWithArgs, AsyncExpectationWithArgs } from '../src/types'

// Test module with mixed exports
type TestModule = {
  getUser: (id: string) => Promise<{ id: string; name: string }>
  createUser: (name: string, age: number) => Promise<{ id: string }>
  API_VERSION: string
  config: { timeout: number }
}

type SyncModule = { syncFn: (x: number) => number }

test('FunctionKeys extracts only function-typed keys', () => {
  expectTypeOf<FunctionKeys<TestModule>>().toEqualTypeOf<'getUser' | 'createUser'>()
})

test('MockedModule.expects only accepts function keys', () => {
  type Mod = MockedModule<TestModule>
  expectTypeOf<Mod['expects']>().parameter(0).toEqualTypeOf<'getUser' | 'createUser'>()
})

test('Expectation.withArgs enforces parameter types', () => {
  type E = Expectation<(id: string) => Promise<{ id: string }>>
  type WithArgs = E['withArgs']
  expectTypeOf<WithArgs>().parameters.toEqualTypeOf<[id: string]>()
})

test('async function gets AsyncExpectationWithArgs', () => {
  type EWA = ExpectationWithArgs<TestModule['getUser']>
  expectTypeOf<EWA>().toEqualTypeOf<AsyncExpectationWithArgs<TestModule['getUser']>>()
})

test('sync function gets SyncExpectationWithArgs', () => {
  type EWA = ExpectationWithArgs<SyncModule['syncFn']>
  expectTypeOf<EWA>().toEqualTypeOf<SyncExpectationWithArgs<SyncModule['syncFn']>>()
})

test('AsyncExpectationWithArgs.resolves unwraps Promise return type', () => {
  type EWA = AsyncExpectationWithArgs<TestModule['getUser']>
  expectTypeOf<EWA['resolves']>().parameter(0).toEqualTypeOf<{ id: string; name: string }>()
})

test('AsyncExpectationWithArgs.rejects accepts unknown', () => {
  type EWA = AsyncExpectationWithArgs<TestModule['getUser']>
  expectTypeOf<EWA['rejects']>().parameter(0).toEqualTypeOf<unknown>()
})

test('AsyncExpectationWithArgs does not have returns or throws', () => {
  type EWA = AsyncExpectationWithArgs<TestModule['getUser']>
  expectTypeOf<EWA>().not.toHaveProperty('returns')
  expectTypeOf<EWA>().not.toHaveProperty('throws')
})

test('SyncExpectationWithArgs.returns enforces return type', () => {
  type EWA = SyncExpectationWithArgs<SyncModule['syncFn']>
  expectTypeOf<EWA['returns']>().parameter(0).toEqualTypeOf<number>()
})

test('SyncExpectationWithArgs.throws accepts unknown', () => {
  type EWA = SyncExpectationWithArgs<SyncModule['syncFn']>
  expectTypeOf<EWA['throws']>().parameter(0).toEqualTypeOf<unknown>()
})

test('SyncExpectationWithArgs does not have resolves or rejects', () => {
  type EWA = SyncExpectationWithArgs<SyncModule['syncFn']>
  expectTypeOf<EWA>().not.toHaveProperty('resolves')
  expectTypeOf<EWA>().not.toHaveProperty('rejects')
})

test('mockModule expects only accepts function keys', () => {
  type Mod = MockedModule<TestModule>
  // @ts-expect-error - 'API_VERSION' is not a function key
  type _Invalid1 = ReturnType<Mod['expects']> extends Expectation<infer _> ? never : never
})

test('withArgs enforces correct argument types from module', () => {
  expectTypeOf<Expectation<TestModule['createUser']>['withArgs']>().parameters.toEqualTypeOf<[name: string, age: number]>()
})

test('calls enforces correct function signature', () => {
  type EWA = AsyncExpectationWithArgs<TestModule['getUser']>
  expectTypeOf<EWA['calls']>().parameter(0).toEqualTypeOf<TestModule['getUser']>()
})

test('MockModuleInstance has both expects and callable function stubs', () => {
  type Instance = MockModuleInstance<TestModule>
  expectTypeOf<Instance['expects']>().toBeFunction()
  expectTypeOf<Instance['getUser']>().toEqualTypeOf<TestModule['getUser']>()
  expectTypeOf<Instance['createUser']>().toEqualTypeOf<TestModule['createUser']>()
})
