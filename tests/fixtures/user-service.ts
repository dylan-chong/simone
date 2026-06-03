export function getUser(id: string): Promise<{ id: string; name: string }> {
  throw new Error('not implemented')
}

export function createUser(name: string, age: number): Promise<{ id: string }> {
  throw new Error('not implemented')
}

export const API_VERSION = '1.0'
