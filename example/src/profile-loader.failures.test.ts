import { describe, it, expect } from 'vitest'
import { mockModule } from '../../src/index'
import { Channel } from './types'
import { loadProfile } from './profile-loader'

const userServiceMock = mockModule(import('./user-service'))
const emailServiceMock = mockModule(import('./email-service'))

describe('loadProfile — expected failures', () => {
  it.fails('loads email preferences before user data', async () => {
    emailServiceMock.expects('getEmailPreferences').withArgs({ userId: 'user-1', channel: Channel.Web }).resolves({ marketing: true, notifications: true })
    userServiceMock.expects('getUser').withArgs({ id: 'user-1' }).resolves({ id: 'user-1', name: 'Alice' })

    await loadProfile('user-1', Channel.Web)
  })

  it.fails('loads a profile without setting up email preferences', async () => {
    userServiceMock.expects('getUser').withArgs({ id: 'user-1' }).resolves({ id: 'user-1', name: 'Alice' })

    await loadProfile('user-1', Channel.Web)
  })

  it.fails('loads one profile but fetches two users', async () => {
    userServiceMock.expects('getUser').withArgs({ id: 'user-1' }).resolves({ id: 'user-1', name: 'Alice' })
    emailServiceMock.expects('getEmailPreferences').withArgs({ userId: 'user-1', channel: Channel.Web }).resolves({ marketing: true, notifications: true })
    userServiceMock.expects('getUser').withArgs({ id: 'user-2' }).resolves({ id: 'user-2', name: 'Bob' })

    await loadProfile('user-1', Channel.Web)
  })

  it.fails('loads a profile for the wrong user', async () => {
    userServiceMock.expects('getUser').withArgs({ id: 'user-99', includeDeleted: true }).resolves({ id: 'user-99', name: 'Nobody' })
    emailServiceMock.expects('getEmailPreferences').withArgs({ userId: 'user-1', channel: Channel.Web }).resolves({ marketing: true, notifications: true })

    await loadProfile('user-1', Channel.Web)
  })
})
