import { describe, it, expect, beforeEach } from 'vitest'
import { registry } from '../src/registry'
import { globalQueue } from '../src/expectation'

describe('registry', () => {
  beforeEach(() => {
    registry.clear()
    globalQueue.reset()
  })

  it('registers and retrieves mock modules', () => {
    const mockMod = { id: 'test' } as any
    registry.register(mockMod)

    expect(registry.getAll()).toContain(mockMod)
  })

  it('clears all registered modules', () => {
    registry.register({ id: '1' } as any)
    registry.register({ id: '2' } as any)
    registry.clear()

    expect(registry.getAll()).toHaveLength(0)
  })

  it('verifyAll throws when globalQueue has unconsumed expectations', () => {
    globalQueue.add({ fnId: 'mod.getUser', args: ['user-1'], returnValue: 'x' })

    expect(() => registry.verifyAll()).toThrow('was expected but never called')
  })

  it('verifyAll passes when globalQueue is fully consumed', () => {
    globalQueue.add({ fnId: 'mod.getUser', args: ['user-1'], returnValue: 'x' })
    globalQueue.consume('mod.getUser', ['user-1'])

    expect(() => registry.verifyAll()).not.toThrow()
  })

  it('resetAll clears the globalQueue and registered modules never-sets', () => {
    globalQueue.add({ fnId: 'mod.getUser', args: ['user-1'], returnValue: 'x' })
    registry.resetAll()

    expect(globalQueue.getUnconsumed()).toHaveLength(0)
  })
})
