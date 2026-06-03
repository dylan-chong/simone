import { expectTypeOf, test } from 'vitest'
import type { FunctionKeys, MockedModule, Expectation, ExpectationWithArgs } from '../src/types'

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
