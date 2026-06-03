import { describe, it, expect } from 'vitest'
import { mockModule } from '../../src/index'
import { loadProfile } from './profile-loader'

const userService = mockModule<typeof import('./user-service')>('./user-service')
const emailService = mockModule<typeof import('./email-service')>('./email-service')

describe('loadProfile', () => {
  it('returns enriched user data with email preferences', async () => {
    userService.expects('getUser').withArgs('user-1').returns(
      Promise.resolve({ id: 'user-1', name: 'Alice' })
    )
    emailService.expects('getEmailPreferences').withArgs('user-1').returns(
      Promise.resolve({ marketing: true, notifications: false })
    )

    const profile = await loadProfile('user-1')

    expect(profile.name).toBe('Alice')
    expect(profile.emailPrefs).toEqual({ marketing: true, notifications: false })
    expect(profile.loadedAt).toBeTypeOf('number')
  })

  it('loads multiple users in order', async () => {
    userService.expects('getUser').withArgs('user-1').returns(
      Promise.resolve({ id: 'user-1', name: 'Alice' })
    )
    emailService.expects('getEmailPreferences').withArgs('user-1').returns(
      Promise.resolve({ marketing: true, notifications: true })
    )
    userService.expects('getUser').withArgs('user-2').returns(
      Promise.resolve({ id: 'user-2', name: 'Bob' })
    )
    emailService.expects('getEmailPreferences').withArgs('user-2').returns(
      Promise.resolve({ marketing: false, notifications: true })
    )

    const alice = await loadProfile('user-1')
    const bob = await loadProfile('user-2')

    expect(alice.name).toBe('Alice')
    expect(bob.name).toBe('Bob')
    expect(bob.emailPrefs.marketing).toBe(false)
  })

  it('ensures deleteUser and sendWelcomeEmail are never called', async () => {
    userService.expects('deleteUser').never()
    emailService.expects('sendWelcomeEmail').never()
    userService.expects('getUser').withArgs('user-1').returns(
      Promise.resolve({ id: 'user-1', name: 'Alice' })
    )
    emailService.expects('getEmailPreferences').withArgs('user-1').returns(
      Promise.resolve({ marketing: true, notifications: true })
    )

    await loadProfile('user-1')
  })
})
