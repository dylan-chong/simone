// src/index.ts
import { createMockModule } from './mock-module'
import { registry } from './registry'
import type { MockModuleInstance } from './types'

export type { MockedModule, MockModuleInstance, Expectation, ExpectationWithArgs, FunctionKeys } from './types'

export function mockModule<T>(path: string): MockModuleInstance<T> {
  const moduleName = path.replace(/^.*\//, '').replace(/\.\w+$/, '')
  return createMockModule<T>(moduleName, [])
}

export function verifyAll(): void {
  registry.verifyAll()
}

export function resetAll(): void {
  registry.resetAll()
}
