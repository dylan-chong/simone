import { describe, it, expect, beforeEach } from 'vitest'
import { globalQueue } from '../src/expectation'

describe('globalQueue', () => {
  beforeEach(() => {
    globalQueue.reset()
  })

  it('matches the next expectation when fn and args match', () => {
    globalQueue.add({ fnName: 'mod.getUser', args: ['user-1'], response: { type: 'return', value: 'Alice' } })

    const result = globalQueue.consume('mod.getUser', ['user-1'])
    expect(result).toBe('Alice')
  })

  it('enforces ordering — throws if wrong fn is called', () => {
    globalQueue.add({ fnName: 'mod.getUser', args: ['user-1'], response: { type: 'return', value: 'Alice' } })
    globalQueue.add({ fnName: 'mod.sendEmail', args: ['user-1'], response: { type: 'return', value: undefined } })

    expect(() => globalQueue.consume('mod.sendEmail', ['user-1'])).toThrow(
      'expected mod.getUser("user-1") to be called next, but mod.sendEmail("user-1") was called'
    )
  })

  it('enforces ordering — throws if right fn but wrong args', () => {
    globalQueue.add({ fnName: 'mod.getUser', args: ['user-1'], response: { type: 'return', value: 'Alice' } })

    expect(() => globalQueue.consume('mod.getUser', ['user-2'])).toThrow(
      'mod.getUser() was called with wrong arguments\n\n' +
      '- arg 0: "user-1"\n' +
      '+ arg 0: "user-2"'
    )
  })

  it('consumes expectations sequentially', () => {
    globalQueue.add({ fnName: 'mod.getUser', args: ['user-1'], response: { type: 'return', value: 'first' } })
    globalQueue.add({ fnName: 'mod.getUser', args: ['user-1'], response: { type: 'return', value: 'second' } })

    expect(globalQueue.consume('mod.getUser', ['user-1'])).toBe('first')
    expect(globalQueue.consume('mod.getUser', ['user-1'])).toBe('second')
  })

  it('throws when queue is empty', () => {
    expect(() => globalQueue.consume('mod.getUser', ['user-1'])).toThrow(
      'mod.getUser("user-1") was called but no expectations remain'
    )
  })

  it('matches deep-equal objects', () => {
    globalQueue.add({ fnName: 'mod.create', args: [{ name: 'Alice', age: 30 }], response: { type: 'return', value: 'ok' } })

    expect(globalQueue.consume('mod.create', [{ name: 'Alice', age: 30 }])).toBe('ok')
  })

  it('rejects structurally different objects', () => {
    globalQueue.add({ fnName: 'mod.create', args: [{ name: 'Alice', age: 30 }], response: { type: 'return', value: 'ok' } })

    expect(() => globalQueue.consume('mod.create', [{ name: 'Bob', age: 30 }])).toThrow(
      'mod.create() was called with wrong arguments\n\n' +
      '- arg 0: {\n  "name": "Alice",\n  "age": 30\n}\n' +
      '+ arg 0: {\n  "name": "Bob",\n  "age": 30\n}'
    )
  })

  it('matches nested objects', () => {
    globalQueue.add({ fnName: 'mod.fn', args: [{ a: { b: { c: 1 } } }], response: { type: 'return', value: 'ok' } })

    expect(globalQueue.consume('mod.fn', [{ a: { b: { c: 1 } } }])).toBe('ok')
  })

  it('rejects nested objects with different values', () => {
    globalQueue.add({ fnName: 'mod.fn', args: [{ a: { b: { c: 1 } } }], response: { type: 'return', value: 'ok' } })

    expect(() => globalQueue.consume('mod.fn', [{ a: { b: { c: 2 } } }])).toThrow(
      'mod.fn() was called with wrong arguments\n\n' +
      '- arg 0: {\n  "a": {\n    "b": {\n      "c": 1\n    }\n  }\n}\n' +
      '+ arg 0: {\n  "a": {\n    "b": {\n      "c": 2\n    }\n  }\n}'
    )
  })

  it('matches arrays', () => {
    globalQueue.add({ fnName: 'mod.fn', args: [[1, 2, 3]], response: { type: 'return', value: 'ok' } })

    expect(globalQueue.consume('mod.fn', [[1, 2, 3]])).toBe('ok')
  })

  it('rejects arrays with different length', () => {
    globalQueue.add({ fnName: 'mod.fn', args: [[1, 2, 3]], response: { type: 'return', value: 'ok' } })

    expect(() => globalQueue.consume('mod.fn', [[1, 2]])).toThrow(
      'mod.fn() was called with wrong arguments\n\n' +
      '- arg 0: [\n  1,\n  2,\n  3\n]\n' +
      '+ arg 0: [\n  1,\n  2\n]'
    )
  })

  it('rejects arrays with different values', () => {
    globalQueue.add({ fnName: 'mod.fn', args: [[1, 2, 3]], response: { type: 'return', value: 'ok' } })

    expect(() => globalQueue.consume('mod.fn', [[1, 2, 4]])).toThrow(
      'mod.fn() was called with wrong arguments\n\n' +
      '- arg 0: [\n  1,\n  2,\n  3\n]\n' +
      '+ arg 0: [\n  1,\n  2,\n  4\n]'
    )
  })

  it('distinguishes null from objects', () => {
    globalQueue.add({ fnName: 'mod.fn', args: [null], response: { type: 'return', value: 'ok' } })

    expect(() => globalQueue.consume('mod.fn', [{}])).toThrow(
      'mod.fn() was called with wrong arguments\n\n' +
      '- arg 0: null\n' +
      '+ arg 0: {}'
    )
  })

  it('distinguishes arrays from objects', () => {
    globalQueue.add({ fnName: 'mod.fn', args: [[1, 2]], response: { type: 'return', value: 'ok' } })

    expect(() => globalQueue.consume('mod.fn', [{ 0: 1, 1: 2 }])).toThrow(
      'mod.fn() was called with wrong arguments\n\n' +
      '- arg 0: [\n  1,\n  2\n]\n' +
      '+ arg 0: {\n  "0": 1,\n  "1": 2\n}'
    )
  })

  it('matches primitives by value', () => {
    globalQueue.add({ fnName: 'mod.fn', args: [42, 'hello', true, null, undefined], response: { type: 'return', value: 'ok' } })

    expect(globalQueue.consume('mod.fn', [42, 'hello', true, null, undefined])).toBe('ok')
  })

  it('rejects objects with extra keys', () => {
    globalQueue.add({ fnName: 'mod.fn', args: [{ a: 1 }], response: { type: 'return', value: 'ok' } })

    expect(() => globalQueue.consume('mod.fn', [{ a: 1, b: 2 }])).toThrow(
      'mod.fn() was called with wrong arguments\n\n' +
      '- arg 0: {\n  "a": 1\n}\n' +
      '+ arg 0: {\n  "a": 1,\n  "b": 2\n}'
    )
  })

  it('rejects objects with missing keys', () => {
    globalQueue.add({ fnName: 'mod.fn', args: [{ a: 1, b: 2 }], response: { type: 'return', value: 'ok' } })

    expect(() => globalQueue.consume('mod.fn', [{ a: 1 }])).toThrow(
      'mod.fn() was called with wrong arguments\n\n' +
      '- arg 0: {\n  "a": 1,\n  "b": 2\n}\n' +
      '+ arg 0: {\n  "a": 1\n}'
    )
  })

  it('getUnconsumed returns remaining expectations', () => {
    globalQueue.add({ fnName: 'mod.getUser', args: ['user-1'], response: { type: 'return', value: 'Alice' } })
    globalQueue.add({ fnName: 'mod.sendEmail', args: ['user-1'], response: { type: 'return', value: undefined } })

    globalQueue.consume('mod.getUser', ['user-1'])

    const remaining = globalQueue.getUnconsumed()
    expect(remaining).toHaveLength(1)
    expect(remaining[0].fnName).toBe('mod.sendEmail')
  })

  it('getUnconsumed returns empty after all consumed', () => {
    globalQueue.add({ fnName: 'mod.getUser', args: ['user-1'], response: { type: 'return', value: 'Alice' } })
    globalQueue.consume('mod.getUser', ['user-1'])

    expect(globalQueue.getUnconsumed()).toHaveLength(0)
  })

  it('reset clears all expectations', () => {
    globalQueue.add({ fnName: 'mod.getUser', args: ['user-1'], response: { type: 'return', value: 'Alice' } })
    globalQueue.reset()

    expect(globalQueue.getUnconsumed()).toHaveLength(0)
  })

  it('throws the error when response type is throw', () => {
    globalQueue.add({ fnName: 'mod.getUser', args: ['user-1'], response: { type: 'throw', error: new Error('fail') } })

    expect(() => globalQueue.consume('mod.getUser', ['user-1'])).toThrow('fail')
  })

  it('returns a rejected promise when response type is reject', async () => {
    globalQueue.add({ fnName: 'mod.getUser', args: ['user-1'], response: { type: 'reject', error: new Error('denied') } })

    await expect(globalQueue.consume('mod.getUser', ['user-1'])).rejects.toThrow('denied')
  })

  it('invokes callback and returns its result', () => {
    globalQueue.add({ fnName: 'mod.add', args: [1, 2], response: { type: 'callback', fn: (a: number, b: number) => a + b } })

    expect(globalQueue.consume('mod.add', [1, 2])).toBe(3)
  })

  it('callback receives the called args', () => {
    const received: unknown[] = []
    globalQueue.add({ fnName: 'mod.fn', args: ['x'], response: { type: 'callback', fn: (...args: unknown[]) => { received.push(...args); return 'ok' } } })

    globalQueue.consume('mod.fn', ['x'])
    expect(received).toEqual(['x'])
  })
})
