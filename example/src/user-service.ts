import type { User, UserQuery, CreateUserRequest, CreateUserResult } from './types'

export async function getUser(query: UserQuery): Promise<User> {
  throw new Error('real implementation — hits database')
}

export async function createUser(request: CreateUserRequest): Promise<CreateUserResult> {
  throw new Error('real implementation — hits database')
}

export async function deleteUser(query: UserQuery): Promise<void> {
  throw new Error('real implementation — hits database')
}
