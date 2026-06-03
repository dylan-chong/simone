import type { Profile } from './types'
import { Channel } from './types'
import { getUser } from './user-service'
import { getEmailPreferences } from './email-service'

export async function loadProfile(id: string, channel: Channel): Promise<Profile> {
  const user = await getUser({ id })
  const prefs = await getEmailPreferences({ userId: id, channel })
  return { ...user, emailPrefs: prefs, loadedAt: Date.now() }
}
