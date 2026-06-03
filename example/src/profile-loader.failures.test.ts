import { describe, it } from 'vitest'
import { mockModule } from '../../src/index'
import { loadProfile } from './profile-loader'

const userService = mockModule<typeof import('./user-service')>('./user-service')
const emailService = mockModule<typeof import('./email-service')>('./email-service')

describe('loadProfile — expected failures', () => {
  it.fails('loads the email preferences and then the user in that order', async () => {
    // Fails because loadProfile calls getUser first, but we declared emailService first
    emailService.expects('getEmailPreferences').withArgs('user-1').returns(
      Promise.resolve({ marketing: true, notifications: true })
    )
    userService.expects('getUser').withArgs('user-1').returns(
      Promise.resolve({ id: 'user-1', name: 'Alice' })
    )

    await loadProfile('user-1')
  })

  it.fails('loads a profile without setting up email preferences', async () => {
    // Fails because loadProfile also calls getEmailPreferences which has no expectation
    userService.expects('getUser').withArgs('user-1').returns(
      Promise.resolve({ id: 'user-1', name: 'Alice' })
    )

    await loadProfile('user-1')
  })

  it.fails('loads a profile even though getUser should never be called', async () => {
    // Fails because loadProfile calls getUser which is marked .never()
    userService.expects('getUser').never()
    emailService.expects('getEmailPreferences').withArgs('user-1').returns(
      Promise.resolve({ marketing: true, notifications: true })
    )

    await loadProfile('user-1')
  })

  it.fails('loads one profile but expects two users to be fetched', async () => {
    userService.expects('getUser').withArgs('user-1').returns(
      Promise.resolve({ id: 'user-1', name: 'Alice' })
    )
    emailService.expects('getEmailPreferences').withArgs('user-1').returns(
      Promise.resolve({ marketing: true, notifications: true })
    )
    // Fails because this extra expectation is never consumed
    userService.expects('getUser').withArgs('user-2').returns(
      Promise.resolve({ id: 'user-2', name: 'Bob' })
    )

    await loadProfile('user-1')
  })
})
