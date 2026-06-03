import { globalQueue } from './expectation'
import { registry, type Resettable } from './registry'
import type { MockModuleInstance, Expectation, ExpectationWithArgs } from './types'

type MockModuleInternal<Module> = MockModuleInstance<Module> & Resettable

export function createMockModule<Module>(moduleName: string, functionNames: string[]): MockModuleInternal<Module> {
  const neverFns = new Set<string>()
  const configuredFns = new Set<string>()

  const mod: MockModuleInternal<Module> = {
    expects(name: string): any {
      if (!functionNames.includes(name)) {
        throw new Error(`simone: '${name}' is not a function export`)
      }

      return {
        withArgs(...args: unknown[]): ExpectationWithArgs<any> {
          configuredFns.add(name)
          return {
            returns(value: unknown): void {
              globalQueue.add({
                fnId: `${moduleName}.${name}`,
                args,
                returnValue: value,
              })
            },
          }
        },
        never(): void {
          configuredFns.add(name)
          neverFns.add(name)
        },
      } satisfies Expectation<any>
    },

    reset(): void {
      neverFns.clear()
      configuredFns.clear()
    },
  } as MockModuleInternal<Module>

  for (const name of functionNames) {
    (mod as any)[name] = (...args: unknown[]) => {
      if (neverFns.has(name)) {
        throw new Error(`simone: ${moduleName}.${name}() was called but is expected to never be called`)
      }
      if (!configuredFns.has(name)) {
        throw new Error(`simone: ${moduleName}.${name}() was called but has no expectations configured`)
      }
      return globalQueue.consume(`${moduleName}.${name}`, args)
    }
  }

  registry.register(mod)
  return mod
}
