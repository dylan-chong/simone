import { describe, it, expect, beforeEach } from 'vitest'
import { registry } from '../src/registry'
import { globalQueue, ResponseType } from '../src/expectation'

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
    globalQueue.add({ fnName: 'mod.getUser', args: ['user-1'], response: { type: ResponseType.return, value: 'x' } })

    expect(() => registry.verifyAll()).toThrow('was expected but never called')
  })

  it('verifyAll passes when globalQueue is fully consumed', () => {
    globalQueue.add({ fnName: 'mod.getUser', args: ['user-1'], response: { type: ResponseType.return, value: 'x' } })
    globalQueue.consume('mod.getUser', ['user-1'])

    expect(() => registry.verifyAll()).not.toThrow()
  })

  it('verifyAll throws SimoneAlreadyFailedError when queue has failed', () => {
    globalQueue.add({ fnName: 'mod.getUser', args: ['user-1'], response: { type: ResponseType.return, value: 'x' } })
    try {
      globalQueue.consume('mod.getUser', ['wrong-arg'])
    } catch {}

    expect(() => registry.verifyAll()).toThrow('A previous expectation already failed in this test')
  })

  it('resetAll clears the globalQueue and resets registered modules', () => {
    const mod = { reset: () => {} }
    registry.register(mod)
    globalQueue.add({ fnName: 'mod.getUser', args: ['user-1'], response: { type: ResponseType.return, value: 'x' } })
    registry.resetAll()

    expect(globalQueue.getUnconsumed()).toHaveLength(0)
  })
})
