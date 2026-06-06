import { ResponseType } from './expectation.js'
import { SimoneError } from './errors.js'
import { globalQueue, registry } from './globals.js'
import type { Resettable } from './registry.js'
import type { MockModuleInstance, SyncExpectationWithArgs, AsyncExpectationWithArgs } from './types.js'

type MockModuleInternal<Module> = MockModuleInstance<Module> & Resettable

export function createMockModule<Module>(moduleName: string, functionNames: string[]): MockModuleInternal<Module> {
  const configuredFns = new Set<string>()

  const mod: MockModuleInternal<Module> = {
    expects(name: string): any {
      if (!functionNames.includes(name)) {
        throw new SimoneError(`'${name}' is not a function export`)
      }

      return {
        withArgs(...args: unknown[]): SyncExpectationWithArgs<any> & AsyncExpectationWithArgs<any> {
          configuredFns.add(name)
          const fnName = `${moduleName}.${name}`
          return {
            returns(value: unknown): void {
              globalQueue.add({ fnName, args, response: { type: ResponseType.return, value } })
            },
            throws(error: unknown): void {
              globalQueue.add({ fnName, args, response: { type: ResponseType.throw, error } })
            },
            resolves(value: unknown): void {
              globalQueue.add({ fnName, args, response: { type: ResponseType.return, value: Promise.resolve(value) } })
            },
            rejects(error: unknown): void {
              globalQueue.add({ fnName, args, response: { type: ResponseType.reject, error } })
            },
            calls(fn: (...a: any[]) => unknown): void {
              globalQueue.add({ fnName, args, response: { type: ResponseType.callback, fn } })
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
        globalQueue.markFailed()
        throw new SimoneError(`${moduleName}.${name}() was called but has no expectations configured`)
      }
      return globalQueue.consume(`${moduleName}.${name}`, args)
    }
  }

  registry.register(mod)
  return mod
}
