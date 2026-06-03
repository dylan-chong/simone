interface QueuedExpectation {
  fnId: string
  args: unknown[]
  returnValue: unknown
  callback?: (...args: any[]) => unknown
}

class GlobalExpectationQueue {
  private queue: QueuedExpectation[] = []
  private cursor = 0

  add(expectation: QueuedExpectation): void {
    this.queue.push(expectation)
  }

  consume(fnId: string, calledArgs: unknown[]): unknown {
    if (this.cursor >= this.queue.length) {
      throw new Error(
        `${fnId}(${formatArgs(calledArgs)}) was called but no expectations remain`
      )
    }

    const next = this.queue[this.cursor]
    if (next.fnId !== fnId || !deepEqual(next.args, calledArgs)) {
      throw new Error(
        `expected ${next.fnId}(${formatArgs(next.args)}) to be called next, but ${fnId}(${formatArgs(calledArgs)}) was called`
      )
    }

    this.cursor++
    if (next.callback) {
      return next.callback(...calledArgs)
    }
    return next.returnValue
  }

  getUnconsumed(): QueuedExpectation[] {
    return this.queue.slice(this.cursor)
  }

  reset(): void {
    this.queue = []
    this.cursor = 0
  }
}

export const globalQueue = new GlobalExpectationQueue()

function formatArgs(args: unknown[]): string {
  return args.map((a) => JSON.stringify(a)).join(', ')
}

function deepEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true
  if (a === null || b === null) return false
  if (typeof a !== 'object' || typeof b !== 'object') return false

  if (Array.isArray(a) && Array.isArray(b)) {
    if (a.length !== b.length) return false
    return a.every((item, i) => deepEqual(item, b[i]))
  }
  if (Array.isArray(a) || Array.isArray(b)) return false

  const aObj = a as Record<string, unknown>
  const bObj = b as Record<string, unknown>
  const aKeys = Object.keys(aObj)
  const bKeys = Object.keys(bObj)

  if (aKeys.length !== bKeys.length) return false
  return aKeys.every((key) => deepEqual(aObj[key], bObj[key]))
}
