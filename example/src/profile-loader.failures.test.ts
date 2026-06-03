import { describe, it } from 'vitest'
import { mockModule } from '../../src/index'
import { loadProfile } from './profile-loader'

const userService = mockModule<typeof import('./user-service')>('./user-service')
const emailService = mockModule<typeof import('./email-service')>('./email-service')

describe('loadProfile — expected failures', () => {
  it.fails('throws when calling mocked functions out of order', async () => {
    emailService.expects('getEmailPreferences').withArgs('user-1').returns(
      Promise.resolve({ marketing: true, notifications: true })
    )
    userService.expects('getUser').withArgs('user-1').returns(
      Promise.resolve({ id: 'user-1', name: 'Alice' })
    )

    // loadProfile calls getUser first, but we declared emailService first
    await loadProfile('user-1')
  })

  it.fails('throws when a function with no expectations is called', async () => {
    // Only mock getUser, not getEmailPreferences
    userService.expects('getUser').withArgs('user-1').returns(
      Promise.resolve({ id: 'user-1', name: 'Alice' })
    )

    // loadProfile also calls getEmailPreferences — will throw
    await loadProfile('user-1')
  })

  it.fails('throws when .never() function is called', async () => {
    userService.expects('getUser').never()
    emailService.expects('getEmailPreferences').withArgs('user-1').returns(
      Promise.resolve({ marketing: true, notifications: true })
    )

    // loadProfile calls getUser — violates .never()
    await loadProfile('user-1')
  })

  it.fails('fails when expectation is set up but never consumed', async () => {
    userService.expects('getUser').withArgs('user-1').returns(
      Promise.resolve({ id: 'user-1', name: 'Alice' })
    )
    emailService.expects('getEmailPreferences').withArgs('user-1').returns(
      Promise.resolve({ marketing: true, notifications: true })
    )
    // Set up an extra expectation that won't be consumed
    userService.expects('getUser').withArgs('user-2').returns(
      Promise.resolve({ id: 'user-2', name: 'Bob' })
    )

    await loadProfile('user-1')
    // afterEach verifyAll will catch the unconsumed expectation
  })
})
