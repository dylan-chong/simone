export enum ResponseType {
  return = 'return',
  throw = 'throw',
  reject = 'reject',
  callback = 'callback',
}

type Response =
  | { type: ResponseType.return; value: unknown }
  | { type: ResponseType.throw; error: unknown }
  | { type: ResponseType.reject; error: unknown }
  | { type: ResponseType.callback; fn: (...args: any[]) => unknown }

interface QueuedExpectation {
  fnName: string
  args: unknown[]
  response: Response
}

class GlobalExpectationQueue {
  private queue: QueuedExpectation[] = []
  private consumedCount = 0

  add(expectation: QueuedExpectation): void {
    this.queue.push(expectation)
  }

  consume(fnName: string, calledArgs: unknown[]): unknown {
    if (this.consumedCount >= this.queue.length) {
      throw new Error(
        `${fnName}(${formatArgs(calledArgs)}) was called but no expectations remain`
      )
    }

    const next = this.queue[this.consumedCount]
    if (next.fnName !== fnName) {
      throw new Error(
        `expected ${next.fnName}(${formatArgs(next.args)}) to be called next, but ${fnName}(${formatArgs(calledArgs)}) was called`
      )
    }
    if (!deepEqual(next.args, calledArgs)) {
      throw new Error(
        `${fnName}() was called with wrong arguments\n\n` +
        formatArgsDiff(next.args, calledArgs)
      )
    }

    this.consumedCount++
    if (next.response.type === ResponseType.throw) {
      throw next.response.error
    }
    if (next.response.type === ResponseType.reject) {
      return Promise.reject(next.response.error)
    }
    if (next.response.type === ResponseType.callback) {
      return next.response.fn(...calledArgs)
    }
    return next.response.value
  }

  getUnconsumed(): QueuedExpectation[] {
    return this.queue.slice(this.consumedCount)
  }

  reset(): void {
    this.queue = []
    this.consumedCount = 0
  }
}

export const globalQueue = new GlobalExpectationQueue()

function formatArgs(args: unknown[]): string {
  return args.map((a) => JSON.stringify(a)).join(', ')
}

function formatArgsDiff(expected: unknown[], actual: unknown[]): string {
  const lines: string[] = []
  const maxLen = Math.max(expected.length, actual.length)
  for (let i = 0; i < maxLen; i++) {
    const exp = i < expected.length ? JSON.stringify(expected[i], null, 2) : undefined
    const act = i < actual.length ? JSON.stringify(actual[i], null, 2) : undefined
    if (exp === act) {
      lines.push(`  arg ${i}: ${act}`)
    } else {
      if (exp !== undefined) lines.push(`- arg ${i}: ${exp}`)
      if (act !== undefined) lines.push(`+ arg ${i}: ${act}`)
    }
  }
  return lines.join('\n')
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
