import { globalQueue } from './expectation'
import { registry, type Resettable } from './registry'
import type { MockModuleInstance, ExpectationWithArgs } from './types'

type MockModuleInternal<Module> = MockModuleInstance<Module> & Resettable

export function createMockModule<Module>(moduleName: string, functionNames: string[]): MockModuleInternal<Module> {
  const configuredFns = new Set<string>()

  const mod: MockModuleInternal<Module> = {
    expects(name: string): any {
      if (!functionNames.includes(name)) {
        throw new Error(`simone: '${name}' is not a function export`)
      }

      return {
        withArgs(...args: unknown[]): ExpectationWithArgs<any> {
          configuredFns.add(name)
          const fnId = `${moduleName}.${name}`
          return {
            returns(value: unknown): void {
              globalQueue.add({ fnId, args, returnValue: value })
            },
            throws(error: unknown): void {
              globalQueue.add({ fnId, args, returnValue: error, shouldThrow: true })
            },
            resolves(value: unknown): void {
              globalQueue.add({ fnId, args, returnValue: Promise.resolve(value) })
            },
            rejects(error: unknown): void {
              globalQueue.add({ fnId, args, returnValue: Promise.reject(error) })
            },
            calls(fn: (...a: any[]) => unknown): void {
              globalQueue.add({ fnId, args, returnValue: undefined, callback: fn })
            },
          }
        },
      }
    },

    reset(): void {
      configuredFns.clear()
    },
  } as MockModuleInternal<Module>

  for (const name of functionNames) {
    (mod as any)[name] = (...args: unknown[]) => {
      if (!configuredFns.has(name)) {
        throw new Error(`simone: ${moduleName}.${name}() was called but has no expectations configured`)
      }
      return globalQueue.consume(`${moduleName}.${name}`, args)
    }
  }

  registry.register(mod)
  return mod
}
