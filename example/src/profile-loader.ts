import type { User, EmailPreferences } from './types'
import { Channel } from './types'
import { getUser } from './user-service'
import { getEmailPreferences } from './email-service'

export interface Profile extends User {
  emailPrefs: EmailPreferences
  loadedAt: number
}

export async function loadProfile(id: string, channel: Channel): Promise<Profile> {
  const user = await getUser({ id })
  const prefs = await getEmailPreferences({ userId: id, channel })
  return { ...user, emailPrefs: prefs, loadedAt: Date.now() }
}
