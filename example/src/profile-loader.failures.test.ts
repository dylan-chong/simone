import { describe, it, expect } from 'vitest'
import { mockModule } from '../../src/index'
import { loadProfile } from './profile-loader'

const userService = mockModule<typeof import('./user-service')>('./user-service')
const emailService = mockModule<typeof import('./email-service')>('./email-service')

describe('loadProfile — expected failures', () => {
  it.fails('loads email preferences before user data', async () => {
    emailService.expects('getEmailPreferences').withArgs('user-1').resolves({ marketing: true, notifications: true })
    userService.expects('getUser').withArgs('user-1').resolves({ id: 'user-1', name: 'Alice' })

    await loadProfile('user-1')
  })

  it.fails('loads a profile without setting up email preferences', async () => {
    userService.expects('getUser').withArgs('user-1').resolves({ id: 'user-1', name: 'Alice' })

    await loadProfile('user-1')
  })

  it.fails('loads one profile but fetches two users', async () => {
    userService.expects('getUser').withArgs('user-1').resolves({ id: 'user-1', name: 'Alice' })
    emailService.expects('getEmailPreferences').withArgs('user-1').resolves({ marketing: true, notifications: true })
    userService.expects('getUser').withArgs('user-2').resolves({ id: 'user-2', name: 'Bob' })

    await loadProfile('user-1')
  })

  it.fails('loads a profile for the wrong user', async () => {
    userService.expects('getUser').withArgs('user-99').resolves({ id: 'user-99', name: 'Nobody' })
    emailService.expects('getEmailPreferences').withArgs('user-1').resolves({ marketing: true, notifications: true })

    await loadProfile('user-1')
  })

  it.fails('loads a profile when the database is offline', async () => {
    userService.expects('getUser').withArgs('user-1').throws(new Error('db offline'))

    const profile = await loadProfile('user-1')
    expect(profile.name).toBe('Alice')
  })

  it.fails('loads a profile when the user service times out', async () => {
    userService.expects('getUser').withArgs('user-1').rejects(new Error('timeout'))

    const profile = await loadProfile('user-1')
    expect(profile.name).toBe('Alice')
  })
})
