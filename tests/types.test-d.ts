import { expectTypeOf, test } from 'vitest'
import type { FunctionKeys, MockedModule, MockModuleInstance, Expectation, ExpectationWithArgs } from '../src/types'

// Test module with mixed exports
type TestModule = {
  getUser: (id: string) => Promise<{ id: string; name: string }>
  createUser: (name: string, age: number) => Promise<{ id: string }>
  API_VERSION: string
  config: { timeout: number }
}

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

test('ExpectationWithArgs.returns enforces return type', () => {
  type EWA = ExpectationWithArgs<(id: string) => Promise<{ id: string }>>
  type Returns = EWA['returns']
  expectTypeOf<Returns>().parameter(0).toEqualTypeOf<Promise<{ id: string }>>()
})

test('Expectation.never returns void', () => {
  type E = Expectation<(id: string) => Promise<{ id: string }>>
  expectTypeOf<E['never']>().returns.toEqualTypeOf<void>()
})

test('mockModule expects only accepts function keys', () => {
  type Mod = MockedModule<TestModule>
  // @ts-expect-error - 'API_VERSION' is not a function key
  type _Invalid1 = ReturnType<Mod['expects']> extends Expectation<infer _> ? never : never
})

test('withArgs enforces correct argument types from module', () => {
  type Mod = MockedModule<TestModule>
  type CreateUserExp = ReturnType<Mod['expects']>
  // Verify expects('createUser') returns Expectation with correct arg types
  expectTypeOf<Expectation<TestModule['createUser']>['withArgs']>().parameters.toEqualTypeOf<[name: string, age: number]>()
})

test('returns enforces correct return type from module', () => {
  type EWA = ExpectationWithArgs<TestModule['getUser']>
  expectTypeOf<EWA['returns']>().parameter(0).toEqualTypeOf<Promise<{ id: string; name: string }>>()
})

test('MockModuleInstance has both expects and callable function stubs', () => {
  type Instance = MockModuleInstance<TestModule>
  // Has expects method
  expectTypeOf<Instance['expects']>().toBeFunction()
  // Has function stubs with correct signatures
  expectTypeOf<Instance['getUser']>().toEqualTypeOf<TestModule['getUser']>()
  expectTypeOf<Instance['createUser']>().toEqualTypeOf<TestModule['createUser']>()
})
