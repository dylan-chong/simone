import { getUser } from './user-service'

export async function loadProfile(id: string) {
  const user = await getUser(id)
  return { ...user, loadedAt: Date.now() }
}
