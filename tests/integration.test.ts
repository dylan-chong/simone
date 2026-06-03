import { describe, it, expect, beforeEach } from 'vitest'
import { createMockModule } from '../src/mock-module'
import { registry } from '../src/registry'
import { globalQueue } from '../src/expectation'

type MathService = typeof import('./fixtures/math-service')

describe('integration: mockModule with global ordering', () => {
  beforeEach(() => {
    registry.clear()
    globalQueue.reset()
  })

  it('mocks a module and verifies expectations in order', () => {
    const mathService = createMockModule<MathService>('mathService', ['add', 'multiply'])

    mathService.expects('add').withArgs(1, 2).returns(3)
    mathService.expects('multiply').withArgs(2, 3).returns(6)

    expect(mathService.add(1, 2)).toBe(3)
    expect(mathService.multiply(2, 3)).toBe(6)

    registry.verifyAll()
  })

  it('fails verification when expectation not consumed', () => {
    const mathService = createMockModule<MathService>('mathService', ['add', 'multiply'])

    mathService.expects('add').withArgs(1, 2).returns(3)

    expect(() => registry.verifyAll()).toThrow('was expected but never called')
  })

  it('throws on unmocked function call', () => {
    const mathService = createMockModule<MathService>('mathService', ['add', 'multiply'])

    expect(() => mathService.add(1, 2)).toThrow(
      'has no expectations configured'
    )
  })

  it('throws when .never() function is called', () => {
    const mathService = createMockModule<MathService>('mathService', ['add', 'multiply'])
    mathService.expects('multiply').never()

    expect(() => mathService.multiply(2, 3)).toThrow(
      'is expected to never be called'
    )
  })

  it('enforces global call order across modules', () => {
    const mathService = createMockModule<MathService>('mathService', ['add', 'multiply'])
    const otherService = createMockModule<{ doThing: () => string }>('otherService', ['doThing'])

    mathService.expects('add').withArgs(1, 2).returns(3)
    otherService.expects('doThing').withArgs().returns('done')

    // Calling otherService before mathService violates global order
    expect(() => otherService.doThing()).toThrow(
      'expected mathService.add(1, 2) to be called next'
    )
  })

  it('consumes same-args expectations in declaration order', () => {
    const mathService = createMockModule<MathService>('mathService', ['add', 'multiply'])
    mathService.expects('add').withArgs(1, 1).returns(10)
    mathService.expects('add').withArgs(1, 1).returns(20)

    expect(mathService.add(1, 1)).toBe(10)
    expect(mathService.add(1, 1)).toBe(20)

    registry.verifyAll()
  })
})
