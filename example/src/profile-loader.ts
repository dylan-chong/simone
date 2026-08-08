import type { Profile, User } from './types'
import { Channel } from './types'
import { getUser, deleteUser, watchUser } from './user-service'
import { getEmailPreferences, logEmailEvent, logError } from './email-service'

export async function loadProfile(id: string, channel: Channel): Promise<Profile> {
  const user = await getUser({ id })
  const prefs = await getEmailPreferences({ userId: id, channel })
  return { ...user, emailPrefs: prefs, loadedAt: Date.now() }
}

export async function deleteProfile(id: string): Promise<void> {
  logEmailEvent(`profile-deleted:${id}`)
  await deleteUser({ id })
}

export async function loadProfileSafe(id: string, channel: Channel): Promise<Profile | null> {
  try {
    return await loadProfile(id, channel)
  } catch (error) {
    logError(error as Error)
    return null
  }
}

export function watchProfileName(id: string, onNameChange: (name: string) => void): void {
  watchUser(id, (user: User) => onNameChange(user.name))
}
