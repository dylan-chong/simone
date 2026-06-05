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
    if (serialize(next.args) !== serialize(calledArgs)) {
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
    const exp = i < expected.length ? serialize(expected[i]) : undefined
    const act = i < actual.length ? serialize(actual[i]) : undefined
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

function serialize(value: unknown, ancestors = new WeakSet<object>()): string {
  if (value === undefined) return 'undefined'
  if (value === null) return 'null'
  if (typeof value === 'string') return JSON.stringify(value)
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)
  if (typeof value === 'bigint') return `{ __simone_type__: "BigInt", value: "${value}n" }`
  if (typeof value === 'symbol') return `{ __simone_type__: "Symbol", description: ${JSON.stringify(value.description)} }`
  if (typeof value === 'function') return `{ __simone_type__: "Function", source: ${JSON.stringify(value.toString())} }`

  if (ancestors.has(value)) return '{ __simone_type__: "CircularRef" }'

  ancestors.add(value)
  const result = serializeObject(value, ancestors)
  ancestors.delete(value)

  return result
}

function serializeObject(value: object, ancestors: WeakSet<object>): string {
  if (Array.isArray(value)) {
    if (value.length === 0) return '[]'
    const items = value.map((v) => serialize(v, ancestors))
    const oneLine = `[${items.join(', ')}]`
    if (oneLine.length <= 60) return oneLine
    return `[\n  ${items.join(',\n  ')}\n]`
  }

  if (value instanceof Date) {
    return `{ __simone_type__: "Date", value: ${JSON.stringify(value.toISOString())} }`
  }

  if (value instanceof RegExp) {
    return `{ __simone_type__: "RegExp", source: ${JSON.stringify(value.source)}, flags: ${JSON.stringify(value.flags)} }`
  }

  if (value instanceof Error) {
    const typeLine = `__simone_type__: ${JSON.stringify(value.constructor.name)}`
    const msgLine = `message: ${JSON.stringify(value.message)}`
    const props = Object.keys(value)
      .filter((k) => k !== 'stack')
      .sort()
      .map((k) => `${safeKey(k)}: ${serialize((value as any)[k], ancestors)}`)
    const allEntries = [typeLine, msgLine, ...props]
    return formatObject(allEntries)
  }

  const proto = Object.getPrototypeOf(value)
  if (proto !== Object.prototype && proto !== null) {
    const className = value.constructor?.name ?? 'Unknown'
    const typeLine = `__simone_type__: ${JSON.stringify(className)}`
    const props = Object.keys(value).sort()
      .map((k) => `${safeKey(k)}: ${serialize((value as any)[k], ancestors)}`)
    return formatObject([typeLine, ...props])
  }

  const entries = Object.keys(value as object).sort()
    .map((k) => `${safeKey(k)}: ${serialize((value as Record<string, unknown>)[k], ancestors)}`)
  return formatObject(entries)
}

function formatObject(entries: string[]): string {
  if (entries.length === 0) return '{}'
  const oneLine = `{ ${entries.join(', ')} }`
  if (oneLine.length <= 60) return oneLine
  return `{\n  ${entries.join(',\n  ')}\n}`
}

function safeKey(key: string): string {
  return /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(key) ? key : JSON.stringify(key)
}
