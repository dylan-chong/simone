import { describe, it, expect } from 'vitest'
import { mockModule } from '../../src/index'
import { loadProfile } from './profile-loader'

const userService = mockModule<typeof import('./user-service')>('./user-service')
const emailService = mockModule<typeof import('./email-service')>('./email-service')

describe('loadProfile — expected failures', () => {
  it.fails('fetches email preferences before user data', async () => {
    // Fails because loadProfile calls getUser first, but we declared emailService first
    emailService.expects('getEmailPreferences').withArgs('user-1').resolves({ marketing: true, notifications: true })
    userService.expects('getUser').withArgs('user-1').resolves({ id: 'user-1', name: 'Alice' })

    await loadProfile('user-1')
  })

  it.fails('fetches a user without configuring email preferences', async () => {
    // Fails because loadProfile also calls getEmailPreferences which has no expectation
    userService.expects('getUser').withArgs('user-1').resolves({ id: 'user-1', name: 'Alice' })

    await loadProfile('user-1')
  })

  it.fails('expects two users but only fetches one', async () => {
    userService.expects('getUser').withArgs('user-1').resolves({ id: 'user-1', name: 'Alice' })
    emailService.expects('getEmailPreferences').withArgs('user-1').resolves({ marketing: true, notifications: true })
    // Fails because this extra expectation is never consumed
    userService.expects('getUser').withArgs('user-2').resolves({ id: 'user-2', name: 'Bob' })

    await loadProfile('user-1')
  })

  it.fails('fetches the wrong user', async () => {
    // Fails because loadProfile calls getUser('user-1') but we expected 'user-99'
    userService.expects('getUser').withArgs('user-99').resolves({ id: 'user-99', name: 'Nobody' })
    emailService.expects('getEmailPreferences').withArgs('user-1').resolves({ marketing: true, notifications: true })

    await loadProfile('user-1')
  })

  it.fails('encounters a database error during user fetch', async () => {
    userService.expects('getUser').withArgs('user-1').throws(new Error('db offline'))

    const profile = await loadProfile('user-1')
    expect(profile.name).toBe('Alice')
  })

  it.fails('encounters a timeout during user fetch', async () => {
    userService.expects('getUser').withArgs('user-1').rejects(new Error('timeout'))

    const profile = await loadProfile('user-1')
    expect(profile.name).toBe('Alice')
  })
})
