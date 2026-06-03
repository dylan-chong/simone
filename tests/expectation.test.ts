import { describe, it, expect, beforeEach } from 'vitest'
import { globalQueue } from '../src/expectation'

describe('globalQueue', () => {
  beforeEach(() => {
    globalQueue.reset()
  })

  it('matches the next expectation when fn and args match', () => {
    globalQueue.add({ fnId: 'mod.getUser', args: ['user-1'], returnValue: 'Alice' })

    const result = globalQueue.consume('mod.getUser', ['user-1'])
    expect(result).toBe('Alice')
  })

  it('enforces ordering — throws if wrong fn is called', () => {
    globalQueue.add({ fnId: 'mod.getUser', args: ['user-1'], returnValue: 'Alice' })
    globalQueue.add({ fnId: 'mod.sendEmail', args: ['user-1'], returnValue: undefined })

    expect(() => globalQueue.consume('mod.sendEmail', ['user-1'])).toThrow(
      'expected mod.getUser("user-1") to be called next, but mod.sendEmail("user-1") was called'
    )
  })

  it('enforces ordering — throws if right fn but wrong args', () => {
    globalQueue.add({ fnId: 'mod.getUser', args: ['user-1'], returnValue: 'Alice' })

    expect(() => globalQueue.consume('mod.getUser', ['user-2'])).toThrow(
      'expected mod.getUser("user-1") to be called next, but mod.getUser("user-2") was called'
    )
  })

  it('consumes expectations sequentially', () => {
    globalQueue.add({ fnId: 'mod.getUser', args: ['user-1'], returnValue: 'first' })
    globalQueue.add({ fnId: 'mod.getUser', args: ['user-1'], returnValue: 'second' })

    expect(globalQueue.consume('mod.getUser', ['user-1'])).toBe('first')
    expect(globalQueue.consume('mod.getUser', ['user-1'])).toBe('second')
  })

  it('throws when queue is empty', () => {
    expect(() => globalQueue.consume('mod.getUser', ['user-1'])).toThrow(
      'mod.getUser("user-1") was called but no expectations remain'
    )
  })

  it('matches deep-equal objects', () => {
    globalQueue.add({ fnId: 'mod.create', args: [{ name: 'Alice', age: 30 }], returnValue: 'ok' })

    expect(globalQueue.consume('mod.create', [{ name: 'Alice', age: 30 }])).toBe('ok')
  })

  it('rejects structurally different objects', () => {
    globalQueue.add({ fnId: 'mod.create', args: [{ name: 'Alice', age: 30 }], returnValue: 'ok' })

    expect(() => globalQueue.consume('mod.create', [{ name: 'Bob', age: 30 }])).toThrow()
  })

  it('getUnconsumed returns remaining expectations', () => {
    globalQueue.add({ fnId: 'mod.getUser', args: ['user-1'], returnValue: 'Alice' })
    globalQueue.add({ fnId: 'mod.sendEmail', args: ['user-1'], returnValue: undefined })

    globalQueue.consume('mod.getUser', ['user-1'])

    const remaining = globalQueue.getUnconsumed()
    expect(remaining).toHaveLength(1)
    expect(remaining[0].fnId).toBe('mod.sendEmail')
  })

  it('getUnconsumed returns empty after all consumed', () => {
    globalQueue.add({ fnId: 'mod.getUser', args: ['user-1'], returnValue: 'Alice' })
    globalQueue.consume('mod.getUser', ['user-1'])

    expect(globalQueue.getUnconsumed()).toHaveLength(0)
  })

  it('reset clears all expectations', () => {
    globalQueue.add({ fnId: 'mod.getUser', args: ['user-1'], returnValue: 'Alice' })
    globalQueue.reset()

    expect(globalQueue.getUnconsumed()).toHaveLength(0)
  })

  it('throws the returnValue when shouldThrow is set', () => {
    globalQueue.add({ fnId: 'mod.getUser', args: ['user-1'], returnValue: new Error('fail'), shouldThrow: true })

    expect(() => globalQueue.consume('mod.getUser', ['user-1'])).toThrow('fail')
  })

  it('invokes callback and returns its result', () => {
    globalQueue.add({ fnId: 'mod.add', args: [1, 2], returnValue: undefined, callback: (a: number, b: number) => a + b })

    expect(globalQueue.consume('mod.add', [1, 2])).toBe(3)
  })

  it('callback receives the called args', () => {
    const received: unknown[] = []
    globalQueue.add({ fnId: 'mod.fn', args: ['x'], returnValue: undefined, callback: (...args) => { received.push(...args); return 'ok' } })

    globalQueue.consume('mod.fn', ['x'])
    expect(received).toEqual(['x'])
  })
})
