import { describe, it, expect } from 'vitest'
import { mockModule } from '../../src/index'
import { loadProfile } from './profile-loader'

const userService = mockModule<typeof import('./user-service')>('./user-service')

describe('loadProfile', () => {
  it('returns enriched user data', async () => {
    userService.expects('getUser').withArgs('user-1').returns(
      Promise.resolve({ id: 'user-1', name: 'Alice' })
    )

    const profile = await loadProfile('user-1')

    expect(profile.name).toBe('Alice')
    expect(profile.loadedAt).toBeTypeOf('number')
  })

  it('loads multiple users in order', async () => {
    userService.expects('getUser').withArgs('user-1').returns(
      Promise.resolve({ id: 'user-1', name: 'Alice' })
    )
    userService.expects('getUser').withArgs('user-2').returns(
      Promise.resolve({ id: 'user-2', name: 'Bob' })
    )

    const alice = await loadProfile('user-1')
    const bob = await loadProfile('user-2')

    expect(alice.name).toBe('Alice')
    expect(bob.name).toBe('Bob')
  })

  it('ensures deleteUser is never called', async () => {
    userService.expects('deleteUser').never()
    userService.expects('getUser').withArgs('user-1').returns(
      Promise.resolve({ id: 'user-1', name: 'Alice' })
    )

    await loadProfile('user-1')
  })
})
