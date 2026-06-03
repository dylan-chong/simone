import { describe, it, expect, beforeEach } from 'vitest'
import { globalQueue, ResponseType } from '../src/expectation'
import {
  userWithAddress,
  userWithDifferentAddress,
  orderWithItems,
  orderWithDifferentItems,
  nestedConfig,
  nestedConfigWithChanges,
} from './fixtures/complex-args'

function sorted(value: unknown): string {
  return JSON.stringify(sortKeys(value), null, 2)
}

function sortKeys(value: unknown): unknown {
  if (value === null || typeof value !== 'object') return value
  if (Array.isArray(value)) return value.map(sortKeys)
  const obj: Record<string, unknown> = {}
  for (const key of Object.keys(value as Record<string, unknown>).sort()) {
    obj[key] = sortKeys((value as Record<string, unknown>)[key])
  }
  return obj
}

describe('globalQueue', () => {
  beforeEach(() => {
    globalQueue.reset()
  })

  it('matches the next expectation when fn and args match', () => {
    globalQueue.add({ fnName: 'mod.getUser', args: ['user-1'], response: { type: ResponseType.return, value: 'Alice' } })

    const result = globalQueue.consume('mod.getUser', ['user-1'])
    expect(result).toBe('Alice')
  })

  it('enforces ordering — throws if wrong fn is called', () => {
    globalQueue.add({ fnName: 'mod.getUser', args: ['user-1'], response: { type: ResponseType.return, value: 'Alice' } })
    globalQueue.add({ fnName: 'mod.sendEmail', args: ['user-1'], response: { type: ResponseType.return, value: undefined } })

    expect(() => globalQueue.consume('mod.sendEmail', ['user-1'])).toThrow(
      'expected mod.getUser("user-1") to be called next, but mod.sendEmail("user-1") was called'
    )
  })

  it('enforces ordering — throws if right fn but wrong args', () => {
    globalQueue.add({ fnName: 'mod.getUser', args: ['user-1'], response: { type: ResponseType.return, value: 'Alice' } })

    expect(() => globalQueue.consume('mod.getUser', ['user-2'])).toThrow(
      'mod.getUser() was called with wrong arguments\n\n' +
      '- arg 0: "user-1"\n' +
      '+ arg 0: "user-2"'
    )
  })

  it('consumes expectations sequentially', () => {
    globalQueue.add({ fnName: 'mod.getUser', args: ['user-1'], response: { type: ResponseType.return, value: 'first' } })
    globalQueue.add({ fnName: 'mod.getUser', args: ['user-1'], response: { type: ResponseType.return, value: 'second' } })

    expect(globalQueue.consume('mod.getUser', ['user-1'])).toBe('first')
    expect(globalQueue.consume('mod.getUser', ['user-1'])).toBe('second')
  })

  it('throws when queue is empty', () => {
    expect(() => globalQueue.consume('mod.getUser', ['user-1'])).toThrow(
      'mod.getUser("user-1") was called but no expectations remain'
    )
  })

  it('matches deep-equal objects', () => {
    globalQueue.add({ fnName: 'mod.create', args: [{ name: 'Alice', age: 30 }], response: { type: ResponseType.return, value: 'ok' } })

    expect(globalQueue.consume('mod.create', [{ name: 'Alice', age: 30 }])).toBe('ok')
  })

  it('rejects structurally different objects', () => {
    globalQueue.add({ fnName: 'mod.create', args: [{ name: 'Alice', age: 30 }], response: { type: ResponseType.return, value: 'ok' } })

    expect(() => globalQueue.consume('mod.create', [{ name: 'Bob', age: 30 }])).toThrow(
      'mod.create() was called with wrong arguments\n\n' +
      '- arg 0: {\n  "age": 30,\n  "name": "Alice"\n}\n' +
      '+ arg 0: {\n  "age": 30,\n  "name": "Bob"\n}'
    )
  })

  it('matches nested objects', () => {
    globalQueue.add({ fnName: 'mod.fn', args: [{ a: { b: { c: 1 } } }], response: { type: ResponseType.return, value: 'ok' } })

    expect(globalQueue.consume('mod.fn', [{ a: { b: { c: 1 } } }])).toBe('ok')
  })

  it('rejects nested objects with different values', () => {
    globalQueue.add({ fnName: 'mod.fn', args: [{ a: { b: { c: 1 } } }], response: { type: ResponseType.return, value: 'ok' } })

    expect(() => globalQueue.consume('mod.fn', [{ a: { b: { c: 2 } } }])).toThrow(
      'mod.fn() was called with wrong arguments\n\n' +
      '- arg 0: {\n  "a": {\n    "b": {\n      "c": 1\n    }\n  }\n}\n' +
      '+ arg 0: {\n  "a": {\n    "b": {\n      "c": 2\n    }\n  }\n}'
    )
  })

  it('matches arrays', () => {
    globalQueue.add({ fnName: 'mod.fn', args: [[1, 2, 3]], response: { type: ResponseType.return, value: 'ok' } })

    expect(globalQueue.consume('mod.fn', [[1, 2, 3]])).toBe('ok')
  })

  it('rejects arrays with different length', () => {
    globalQueue.add({ fnName: 'mod.fn', args: [[1, 2, 3]], response: { type: ResponseType.return, value: 'ok' } })

    expect(() => globalQueue.consume('mod.fn', [[1, 2]])).toThrow(
      'mod.fn() was called with wrong arguments\n\n' +
      '- arg 0: [\n  1,\n  2,\n  3\n]\n' +
      '+ arg 0: [\n  1,\n  2\n]'
    )
  })

  it('rejects arrays with different values', () => {
    globalQueue.add({ fnName: 'mod.fn', args: [[1, 2, 3]], response: { type: ResponseType.return, value: 'ok' } })

    expect(() => globalQueue.consume('mod.fn', [[1, 2, 4]])).toThrow(
      'mod.fn() was called with wrong arguments\n\n' +
      '- arg 0: [\n  1,\n  2,\n  3\n]\n' +
      '+ arg 0: [\n  1,\n  2,\n  4\n]'
    )
  })

  it('distinguishes null from objects', () => {
    globalQueue.add({ fnName: 'mod.fn', args: [null], response: { type: ResponseType.return, value: 'ok' } })

    expect(() => globalQueue.consume('mod.fn', [{}])).toThrow(
      'mod.fn() was called with wrong arguments\n\n' +
      '- arg 0: null\n' +
      '+ arg 0: {}'
    )
  })

  it('distinguishes arrays from objects', () => {
    globalQueue.add({ fnName: 'mod.fn', args: [[1, 2]], response: { type: ResponseType.return, value: 'ok' } })

    expect(() => globalQueue.consume('mod.fn', [{ 0: 1, 1: 2 }])).toThrow(
      'mod.fn() was called with wrong arguments\n\n' +
      '- arg 0: [\n  1,\n  2\n]\n' +
      '+ arg 0: {\n  "0": 1,\n  "1": 2\n}'
    )
  })

  it('matches primitives by value', () => {
    globalQueue.add({ fnName: 'mod.fn', args: [42, 'hello', true, null, undefined], response: { type: ResponseType.return, value: 'ok' } })

    expect(globalQueue.consume('mod.fn', [42, 'hello', true, null, undefined])).toBe('ok')
  })

  it('rejects objects with extra keys', () => {
    globalQueue.add({ fnName: 'mod.fn', args: [{ a: 1 }], response: { type: ResponseType.return, value: 'ok' } })

    expect(() => globalQueue.consume('mod.fn', [{ a: 1, b: 2 }])).toThrow(
      'mod.fn() was called with wrong arguments\n\n' +
      '- arg 0: {\n  "a": 1\n}\n' +
      '+ arg 0: {\n  "a": 1,\n  "b": 2\n}'
    )
  })

  it('rejects objects with missing keys', () => {
    globalQueue.add({ fnName: 'mod.fn', args: [{ a: 1, b: 2 }], response: { type: ResponseType.return, value: 'ok' } })

    expect(() => globalQueue.consume('mod.fn', [{ a: 1 }])).toThrow(
      'mod.fn() was called with wrong arguments\n\n' +
      '- arg 0: {\n  "a": 1,\n  "b": 2\n}\n' +
      '+ arg 0: {\n  "a": 1\n}'
    )
  })

  it('getUnconsumed returns remaining expectations', () => {
    globalQueue.add({ fnName: 'mod.getUser', args: ['user-1'], response: { type: ResponseType.return, value: 'Alice' } })
    globalQueue.add({ fnName: 'mod.sendEmail', args: ['user-1'], response: { type: ResponseType.return, value: undefined } })

    globalQueue.consume('mod.getUser', ['user-1'])

    const remaining = globalQueue.getUnconsumed()
    expect(remaining).toHaveLength(1)
    expect(remaining[0].fnName).toBe('mod.sendEmail')
  })

  it('getUnconsumed returns empty after all consumed', () => {
    globalQueue.add({ fnName: 'mod.getUser', args: ['user-1'], response: { type: ResponseType.return, value: 'Alice' } })
    globalQueue.consume('mod.getUser', ['user-1'])

    expect(globalQueue.getUnconsumed()).toHaveLength(0)
  })

  it('reset clears all expectations', () => {
    globalQueue.add({ fnName: 'mod.getUser', args: ['user-1'], response: { type: ResponseType.return, value: 'Alice' } })
    globalQueue.reset()

    expect(globalQueue.getUnconsumed()).toHaveLength(0)
  })

  it('throws the error when response type is throw', () => {
    globalQueue.add({ fnName: 'mod.getUser', args: ['user-1'], response: { type: ResponseType.throw, error: new Error('fail') } })

    expect(() => globalQueue.consume('mod.getUser', ['user-1'])).toThrow('fail')
  })

  it('returns a rejected promise when response type is reject', async () => {
    globalQueue.add({ fnName: 'mod.getUser', args: ['user-1'], response: { type: ResponseType.reject, error: new Error('denied') } })

    await expect(globalQueue.consume('mod.getUser', ['user-1'])).rejects.toThrow('denied')
  })

  it('invokes callback and returns its result', () => {
    globalQueue.add({ fnName: 'mod.add', args: [1, 2], response: { type: ResponseType.callback, fn: (a: number, b: number) => a + b } })

    expect(globalQueue.consume('mod.add', [1, 2])).toBe(3)
  })

  it('callback receives the called args', () => {
    const received: unknown[] = []
    globalQueue.add({ fnName: 'mod.fn', args: ['x'], response: { type: ResponseType.callback, fn: (...args: unknown[]) => { received.push(...args); return 'ok' } } })

    globalQueue.consume('mod.fn', ['x'])
    expect(received).toEqual(['x'])
  })

  it('matches complex nested object with arrays', () => {

    globalQueue.add({ fnName: 'mod.placeOrder', args: [orderWithItems], response: { type: ResponseType.return, value: 'ok' } })

    expect(globalQueue.consume('mod.placeOrder', [orderWithItems])).toBe('ok')
  })

  it('rejects complex object with nested array differences', () => {

    globalQueue.add({ fnName: 'mod.placeOrder', args: [orderWithItems], response: { type: ResponseType.return, value: 'ok' } })

    expect(() => globalQueue.consume('mod.placeOrder', [orderWithDifferentItems])).toThrow(
      'mod.placeOrder() was called with wrong arguments'
    )
  })

  it('matches deeply nested config object', () => {

    globalQueue.add({ fnName: 'mod.configure', args: [nestedConfig], response: { type: ResponseType.return, value: 'ok' } })

    expect(globalQueue.consume('mod.configure', [nestedConfig])).toBe('ok')
  })

  it('rejects deeply nested config with changed values', () => {

    globalQueue.add({ fnName: 'mod.configure', args: [nestedConfig], response: { type: ResponseType.return, value: 'ok' } })

    expect(() => globalQueue.consume('mod.configure', [nestedConfigWithChanges])).toThrow(
      'mod.configure() was called with wrong arguments'
    )
  })

  it('matches user object with nested address', () => {

    globalQueue.add({ fnName: 'mod.updateUser', args: ['user-1', userWithAddress], response: { type: ResponseType.return, value: 'ok' } })

    expect(globalQueue.consume('mod.updateUser', ['user-1', userWithAddress])).toBe('ok')
  })

  it('rejects user object when only nested address differs', () => {

    globalQueue.add({ fnName: 'mod.updateUser', args: ['user-1', userWithAddress], response: { type: ResponseType.return, value: 'ok' } })

    expect(() => globalQueue.consume('mod.updateUser', ['user-1', userWithDifferentAddress])).toThrow(
      'mod.updateUser() was called with wrong arguments\n\n' +
      '  arg 0: "user-1"\n' +
      '- arg 1: ' + sorted(userWithAddress) + '\n' +
      '+ arg 1: ' + sorted(userWithDifferentAddress)
    )
  })

  it('matches multiple complex args mixed with primitives', () => {
    globalQueue.add({
      fnName: 'mod.processOrder',
      args: ['shop-1', orderWithItems, true, userWithAddress, 42],
      response: { type: ResponseType.return, value: 'done' },
    })

    expect(globalQueue.consume('mod.processOrder', ['shop-1', orderWithItems, true, userWithAddress, 42])).toBe('done')
  })

  it('rejects when one complex arg differs among many', () => {
    globalQueue.add({
      fnName: 'mod.processOrder',
      args: ['shop-1', orderWithItems, true, userWithAddress, 42],
      response: { type: ResponseType.return, value: 'done' },
    })

    expect(() => globalQueue.consume('mod.processOrder', ['shop-1', orderWithDifferentItems, true, userWithAddress, 42])).toThrow(
      'mod.processOrder() was called with wrong arguments\n\n' +
      '  arg 0: "shop-1"\n' +
      '- arg 1: ' + sorted(orderWithItems) + '\n' +
      '+ arg 1: ' + sorted(orderWithDifferentItems) + '\n' +
      '  arg 2: true\n' +
      '  arg 3: ' + sorted(userWithAddress) + '\n' +
      '  arg 4: 42'
    )
  })

  it('rejects when a primitive arg differs among complex args', () => {
    globalQueue.add({
      fnName: 'mod.sync',
      args: [nestedConfig, 'production', 3, userWithAddress],
      response: { type: ResponseType.return, value: 'ok' },
    })

    expect(() => globalQueue.consume('mod.sync', [nestedConfig, 'staging', 3, userWithAddress])).toThrow(
      'mod.sync() was called with wrong arguments\n\n' +
      '  arg 0: ' + sorted(nestedConfig) + '\n' +
      '- arg 1: "production"\n' +
      '+ arg 1: "staging"\n' +
      '  arg 2: 3\n' +
      '  arg 3: ' + sorted(userWithAddress)
    )
  })

  it('rejects when last arg differs in a multi-arg call', () => {
    globalQueue.add({
      fnName: 'mod.save',
      args: ['tenant-1', true, nestedConfig],
      response: { type: ResponseType.return, value: 'saved' },
    })

    expect(() => globalQueue.consume('mod.save', ['tenant-1', true, nestedConfigWithChanges])).toThrow(
      'mod.save() was called with wrong arguments\n\n' +
      '  arg 0: "tenant-1"\n' +
      '  arg 1: true\n' +
      '- arg 2: ' + sorted(nestedConfig) + '\n' +
      '+ arg 2: ' + sorted(nestedConfigWithChanges)
    )
  })

  it('diff normalizes key order so only value differences are visible', () => {
    globalQueue.add({
      fnName: 'mod.fn',
      args: [{ z: 1, a: 2, m: 'hello' }],
      response: { type: ResponseType.return, value: 'ok' },
    })

    expect(() => globalQueue.consume('mod.fn', [{ m: 'world', z: 1, a: 2 }])).toThrow(
      'mod.fn() was called with wrong arguments\n\n' +
      '- arg 0: {\n  "a": 2,\n  "m": "hello",\n  "z": 1\n}\n' +
      '+ arg 0: {\n  "a": 2,\n  "m": "world",\n  "z": 1\n}'
    )
  })
})
