import type { ExpectationQueue } from './expectation.js'
import { SimoneError, SimoneAlreadyFailedError } from './errors.js'

export interface Resettable {
  reset(): void
}

export class Registry {
  private modules = new Set<Resettable>()

  constructor(private queue: ExpectationQueue) {}

  register(mod: Resettable): void {
    this.modules.add(mod)
  }

  getAll(): Resettable[] {
    return [...this.modules]
  }

  verifyAll(): void {
    if (this.queue.hasFailed()) {
      throw new SimoneAlreadyFailedError()
    }
    const unconsumed = this.queue.getUnconsumed()
    if (unconsumed.length > 0) {
      const details = unconsumed
        .map((e) => `  - ${e.fnName}(${e.args.map((a) => JSON.stringify(a)).join(', ')})`)
        .join('\n')
      throw new SimoneError(`the following was expected but never called:\n${details}`)
    }
  }

  resetAll(): void {
    this.queue.reset()
    for (const mod of this.modules) {
      mod.reset()
    }
  }

  clear(): void {
    this.modules.clear()
    this.queue.reset()
  }
}
