// src/index.ts
import { createMockModule } from './mock-module'
import { registry } from './registry'
import type { MockModuleInstance } from './types'

export type { MockedModule, MockModuleInstance, Expectation, ExpectationWithArgs, FunctionKeys } from './types'
export { SimoneError, SimoneAlreadyFailedError } from './errors'

export function mockModule<Module>(path: string): MockModuleInstance<Module> {
  const moduleName = path.replace(/^.*\//, '').replace(/\.\w+$/, '')
  return createMockModule<Module>(moduleName, [])
}

export function verifyAll(): void {
  registry.verifyAll()
}

export function resetAll(): void {
  registry.resetAll()
}
