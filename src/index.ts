// src/index.ts
import { createMockModule } from './mock-module'
import { registry } from './registry'

export type { MockedModule, Expectation, ExpectationWithArgs, FunctionKeys } from './types'

export function mockModule<T>(path: string, functionNames?: string[]): any {
  const moduleName = path.replace(/^.*\//, '').replace(/\.\w+$/, '')
  return createMockModule<T>(moduleName, functionNames ?? [])
}

export function verifyAll(): void {
  registry.verifyAll()
}

export function resetAll(): void {
  registry.resetAll()
}
