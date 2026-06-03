import { describe, it, expect } from 'vitest'
import { mockModule } from '../../src/index'
import { loadProfile } from './profile-loader'

const userService = mockModule<typeof import('./user-service')>('./user-service')
const emailService = mockModule<typeof import('./email-service')>('./email-service')

describe('loadProfile', () => {
  it('includes user name and email preferences in the profile', async () => {
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

  it('derives user name from the user id', async () => {
    userService.expects('getUser').withArgs('user-1').calls(
      async (id) => ({ id, name: `User-${id}` })
    )
    emailService.expects('getEmailPreferences').withArgs('user-1').calls(
      async () => ({ marketing: false, notifications: true })
    )

    const profile = await loadProfile('user-1')

    expect(profile.name).toBe('User-user-1')
    expect(profile.emailPrefs).toEqual({ marketing: false, notifications: true })
  })

  it('loads profile with marketing opted in', async () => {
    userService.expects('getUser').withArgs('user-1').resolves({ id: 'user-1', name: 'Alice' })
    emailService.expects('getEmailPreferences').withArgs('user-1').resolves({ marketing: true, notifications: false })

    const profile = await loadProfile('user-1')

    expect(profile.name).toBe('Alice')
    expect(profile.emailPrefs).toEqual({ marketing: true, notifications: false })
  })

  it('fails when the database is offline', async () => {
    userService.expects('getUser').withArgs('user-1').throws(new Error('db offline'))

    await expect(loadProfile('user-1')).rejects.toThrow('db offline')
  })

  it('fails when the user service times out', async () => {
    userService.expects('getUser').withArgs('user-1').rejects(new Error('timeout'))

    await expect(loadProfile('user-1')).rejects.toThrow('timeout')
  })

  it('loads profiles for multiple users sequentially', async () => {
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

})
