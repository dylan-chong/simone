import { getUser } from './user-service'
import { getEmailPreferences } from './email-service'

export async function loadProfile(id: string) {
  const user = await getUser(id)
  const prefs = await getEmailPreferences(id)
  return { ...user, emailPrefs: prefs, loadedAt: Date.now() }
}
