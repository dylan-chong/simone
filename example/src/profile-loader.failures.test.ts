import { describe, it } from 'vitest'
import { mockModule } from '../../src/index'
import { loadProfile } from './profile-loader'

const userService = mockModule<typeof import('./user-service')>('./user-service')
const emailService = mockModule<typeof import('./email-service')>('./email-service')

describe('loadProfile — expected failures', () => {
  it.fails('expectations must be declared in call order', async () => {
    // Fails because loadProfile calls getUser first, but we declared emailService first
    emailService.expects('getEmailPreferences').withArgs('user-1').returns(
      Promise.resolve({ marketing: true, notifications: true })
    )
    userService.expects('getUser').withArgs('user-1').returns(
      Promise.resolve({ id: 'user-1', name: 'Alice' })
    )

    await loadProfile('user-1')
  })

  it.fails('all called functions must have expectations', async () => {
    // Fails because loadProfile also calls getEmailPreferences which has no expectation
    userService.expects('getUser').withArgs('user-1').returns(
      Promise.resolve({ id: 'user-1', name: 'Alice' })
    )

    await loadProfile('user-1')
  })

  it.fails('functions marked .never() cannot be called', async () => {
    // Fails because loadProfile calls getUser which is marked .never()
    userService.expects('getUser').never()
    emailService.expects('getEmailPreferences').withArgs('user-1').returns(
      Promise.resolve({ marketing: true, notifications: true })
    )

    await loadProfile('user-1')
  })

  it.fails('all expectations must be consumed', async () => {
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
