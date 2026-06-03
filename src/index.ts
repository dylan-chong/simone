import { registry } from './registry.js'
import { SimoneError } from './errors.js'
import type { MockModuleInstance } from './types.js'

export type { MockedModule, MockModuleInstance, Expectation, ExpectationWithArgs, FunctionKeys } from './types.js'
export { SimoneError, SimoneAlreadyFailedError } from './errors.js'

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
