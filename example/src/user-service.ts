import type { User, CreateUserResult } from './types'

export async function getUser(id: string): Promise<User> {
  throw new Error('real implementation — hits database')
}

export async function createUser(name: string, age: number): Promise<CreateUserResult> {
  throw new Error('real implementation — hits database')
}

export async function deleteUser(id: string): Promise<void> {
  throw new Error('real implementation — hits database')
}
