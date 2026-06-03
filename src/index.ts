import { registry } from './registry'
import { SimoneError } from './errors'
import type { MockModuleInstance } from './types'

export type { MockedModule, MockModuleInstance, Expectation, ExpectationWithArgs, FunctionKeys } from './types'
export { SimoneError, SimoneAlreadyFailedError } from './errors'

export function mockModule<Module>(path: string): MockModuleInstance<Module> {
  throw new SimoneError(
    `mockModule() was called directly — this means the simone Vite plugin is not configured.\n` +
    `Add simonePlugin() to your vitest.config.ts plugins array.`
  )
}

export function verifyAll(): void {
  registry.verifyAll()
}

export function resetAll(): void {
  registry.resetAll()
}
