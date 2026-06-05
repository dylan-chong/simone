import { describe, it, expect } from 'vitest'
import { mockModule } from '../../src/index'
import { Channel, DatabaseError } from './types'
import { loadProfile, deleteProfile, loadProfileSafe } from './profile-loader'

const userServiceMock = mockModule(import('./user-service'))
const emailServiceMock = mockModule(import('./email-service'))

describe('loadProfile — expected failures', () => {
  it.fails('loads email preferences before user data', async () => {
    emailServiceMock
      .expects('getEmailPreferences')
      .withArgs({ userId: 'user-1', channel: Channel.Web })
      .resolves({ marketing: true, notifications: true })
    userServiceMock
      .expects('getUser')
      .withArgs({ id: 'user-1' })
      .resolves({ id: 'user-1', name: 'Alice' })

    await loadProfile('user-1', Channel.Web)
  })

  it.fails('loads a profile without setting up email preferences', async () => {
    userServiceMock
      .expects('getUser')
      .withArgs({ id: 'user-1' })
      .resolves({ id: 'user-1', name: 'Alice' })

    await loadProfile('user-1', Channel.Web)
  })

  it.fails('loads one profile but fetches two users', async () => {
    userServiceMock
      .expects('getUser')
      .withArgs({ id: 'user-1' })
      .resolves({ id: 'user-1', name: 'Alice' })
    emailServiceMock
      .expects('getEmailPreferences')
      .withArgs({ userId: 'user-1', channel: Channel.Web })
      .resolves({ marketing: true, notifications: true })
    userServiceMock
      .expects('getUser')
      .withArgs({ id: 'user-2' })
      .resolves({ id: 'user-2', name: 'Bob' })

    await loadProfile('user-1', Channel.Web)
  })

  it.fails('loads a profile for the wrong user', async () => {
    userServiceMock
      .expects('getUser')
      .withArgs({ id: 'user-99', includeDeleted: true })
      .resolves({ id: 'user-99', name: 'Nobody' })
    emailServiceMock
      .expects('getEmailPreferences')
      .withArgs({ userId: 'user-1', channel: Channel.Web })
      .resolves({ marketing: true, notifications: true })

    await loadProfile('user-1', Channel.Web)
  })
})

describe('deleteProfile — expected failures', () => {
  it.fails('deletes without logging the event first', async () => {
    userServiceMock
      .expects('deleteUser')
      .withArgs({ id: 'user-1' })
      .resolves(undefined)

    await deleteProfile('user-1')
  })
})

describe('loadProfileSafe — expected failures', () => {
  it.fails('expects wrong error type (Error instead of DatabaseError)', async () => {
    userServiceMock
      .expects('getUser')
      .withArgs({ id: 'user-1' })
      .rejects(new DatabaseError('ECONNRESET', 'connection reset by peer'))
    emailServiceMock
      .expects('logError')
      .withArgs(new Error('connection reset by peer'))
      .returns(undefined)

    await loadProfileSafe('user-1', Channel.Web)
  })

  it.fails('expects wrong error message', async () => {
    userServiceMock
      .expects('getUser')
      .withArgs({ id: 'user-1' })
      .rejects(new DatabaseError('ECONNRESET', 'connection reset by peer'))
    emailServiceMock
      .expects('logError')
      .withArgs(new DatabaseError('ECONNRESET', 'timeout'))
      .returns(undefined)

    await loadProfileSafe('user-1', Channel.Web)
  })

  it.fails('expects wrong error code', async () => {
    userServiceMock
      .expects('getUser')
      .withArgs({ id: 'user-1' })
      .rejects(new DatabaseError('ECONNRESET', 'connection reset by peer'))
    emailServiceMock
      .expects('logError')
      .withArgs(new DatabaseError('ETIMEDOUT', 'connection reset by peer'))
      .returns(undefined)

    await loadProfileSafe('user-1', Channel.Web)
  })
})
