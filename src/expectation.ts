import * as R from 'ramda'
import { SimoneError } from './errors.js'

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
  private failed = false

  add(expectation: QueuedExpectation): void {
    this.queue.push(expectation)
  }

  consume(fnName: string, calledArgs: unknown[]): unknown {
    if (this.consumedCount >= this.queue.length) {
      this.failed = true
      throw new SimoneError(
        `${fnName}(${formatArgs(calledArgs)}) was called but no expectations remain`
      )
    }

    const next = this.queue[this.consumedCount]
    if (next.fnName !== fnName) {
      this.failed = true
      throw new SimoneError(
        `expected ${next.fnName}(${formatArgs(next.args)}) to be called next, but ${fnName}(${formatArgs(calledArgs)}) was called`
      )
    }
    if (!R.equals(next.args, calledArgs)) {
      this.failed = true
      throw new SimoneError(
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

  markFailed(): void {
    this.failed = true
  }

  hasFailed(): boolean {
    return this.failed
  }

  reset(): void {
    this.queue = []
    this.consumedCount = 0
    this.failed = false
  }
}

export const globalQueue = new GlobalExpectationQueue()

function formatArgs(args: unknown[]): string {
  return args.map((a) => JSON.stringify(a)).join(', ')
}

function formatArgsDiff(expected: unknown[], actual: unknown[]): string {
  const lines: string[] = []
  const maxLen = Math.max(expected.length, actual.length)
  for (const i of Array.from({ length: maxLen }, (_, idx) => idx)) {
    const exp = i < expected.length ? stableStringify(expected[i]) : undefined
    const act = i < actual.length ? stableStringify(actual[i]) : undefined
    if (exp === act) {
      const prefix = `  arg ${i}: `
      lines.push(prefix + indent(act!, prefix.length))
      continue
    }
    if (exp !== undefined) {
      const prefix = `- arg ${i}: `
      lines.push(prefix + indent(exp, prefix.length))
    }
    if (act !== undefined) {
      const prefix = `+ arg ${i}: `
      lines.push(prefix + indent(act, prefix.length))
    }
  }
  return lines.join('\n')
}

function indent(str: string, width: number): string {
  const pad = ' '.repeat(width)
  return str.split('\n').join('\n' + pad)
}

function stableStringify(value: unknown): string {
  const seen = new WeakSet<object>()
  return JSON.stringify(sortKeys(value, seen), null, 2)
}

function sortKeys(value: unknown, seen: WeakSet<object>): unknown {
  if (value === null || typeof value !== 'object') return value
  if (seen.has(value)) return '[Circular]'
  seen.add(value)
  if (Array.isArray(value)) return value.map((v) => sortKeys(v, seen))
  const sorted: Record<string, unknown> = {}
  for (const key of Object.keys(value as Record<string, unknown>).sort()) {
    sorted[key] = sortKeys((value as Record<string, unknown>)[key], seen)
  }
  return sorted
}
