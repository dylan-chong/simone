import { globalQueue } from './expectation.js'
import { SimoneError, SimoneAlreadyFailedError } from './errors.js'

export interface Resettable {
  reset(): void
}

class Registry {
  private modules = new Set<Resettable>()

  register(mod: Resettable): void {
    this.modules.add(mod)
  }

  getAll(): Resettable[] {
    return [...this.modules]
  }

  verifyAll(): void {
    if (globalQueue.hasFailed()) {
      throw new SimoneAlreadyFailedError()
    }
    const unconsumed = globalQueue.getUnconsumed()
    if (unconsumed.length > 0) {
      const details = unconsumed
        .map((e) => `  - ${e.fnName}(${e.args.map((a) => JSON.stringify(a)).join(', ')})`)
        .join('\n')
      throw new SimoneError(`the following was expected but never called:\n${details}`)
    }
  }

  resetAll(): void {
    globalQueue.reset()
    for (const mod of this.modules) {
      mod.reset()
    }
  }

  clear(): void {
    this.modules.clear()
    globalQueue.reset()
  }
}

export const registry = new Registry()
