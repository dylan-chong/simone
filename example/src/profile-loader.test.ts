import { describe, it, expect } from 'vitest'
import { mockModule } from '../../src/index'
import { loadProfile } from './profile-loader'

const userService = mockModule<typeof import('./user-service')>('./user-service')
const emailService = mockModule<typeof import('./email-service')>('./email-service')

describe('loadProfile', () => {
  it('includes user name and email preferences in the profile', async () => {
    userService.expects('getUser').withArgs({ id: 'user-1' }).resolves({ id: 'user-1', name: 'Alice' })
    emailService.expects('getEmailPreferences').withArgs({ userId: 'user-1', channel: 'web' }).resolves({ marketing: true, notifications: false })

    expect(await loadProfile('user-1', 'web')).toEqual({
      id: 'user-1',
      name: 'Alice',
      emailPrefs: { marketing: true, notifications: false },
      loadedAt: expect.any(Number),
    })
  })

  it('derives user name from the user id', async () => {
    userService.expects('getUser').withArgs({ id: 'user-1' }).calls(
      async (query) => ({ id: query.id, name: `User-${query.id}` })
    )
    emailService.expects('getEmailPreferences').withArgs({ userId: 'user-1', channel: 'mobile' }).calls(
      async () => ({ marketing: false, notifications: true })
    )

    expect(await loadProfile('user-1', 'mobile')).toEqual({
      id: 'user-1',
      name: 'User-user-1',
      emailPrefs: { marketing: false, notifications: true },
      loadedAt: expect.any(Number),
    })
  })

  it('loads profile with marketing opted in', async () => {
    userService.expects('getUser').withArgs({ id: 'user-1' }).resolves({ id: 'user-1', name: 'Alice' })
    emailService.expects('getEmailPreferences').withArgs({ userId: 'user-1', channel: 'web' }).resolves({ marketing: true, notifications: false })

    expect(await loadProfile('user-1', 'web')).toEqual({
      id: 'user-1',
      name: 'Alice',
      emailPrefs: { marketing: true, notifications: false },
      loadedAt: expect.any(Number),
    })
  })

  it('fails when the database is offline', async () => {
    userService.expects('getUser').withArgs({ id: 'user-1' }).throws(new Error('db offline'))

    await expect(loadProfile('user-1', 'web')).rejects.toThrow('db offline')
  })

  it('fails when the user service times out', async () => {
    userService.expects('getUser').withArgs({ id: 'user-1' }).rejects(new Error('timeout'))

    await expect(loadProfile('user-1', 'web')).rejects.toThrow('timeout')
  })

  it('loads profiles for multiple users sequentially', async () => {
    userService.expects('getUser').withArgs({ id: 'user-1' }).resolves({ id: 'user-1', name: 'Alice' })
    emailService.expects('getEmailPreferences').withArgs({ userId: 'user-1', channel: 'web' }).resolves({ marketing: true, notifications: true })
    userService.expects('getUser').withArgs({ id: 'user-2' }).resolves({ id: 'user-2', name: 'Bob' })
    emailService.expects('getEmailPreferences').withArgs({ userId: 'user-2', channel: 'web' }).resolves({ marketing: false, notifications: true })

    expect(await loadProfile('user-1', 'web')).toEqual({
      id: 'user-1',
      name: 'Alice',
      emailPrefs: { marketing: true, notifications: true },
      loadedAt: expect.any(Number),
    })
    expect(await loadProfile('user-2', 'web')).toEqual({
      id: 'user-2',
      name: 'Bob',
      emailPrefs: { marketing: false, notifications: true },
      loadedAt: expect.any(Number),
    })
  })
})
