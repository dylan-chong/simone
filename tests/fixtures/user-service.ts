export function getUser(id: string): Promise<{ id: string; name: string }> {
  throw new Error('not implemented')
}

export function createUser(name: string, age: number): Promise<{ id: string }> {
  throw new Error('not implemented')
}

export const API_VERSION = '1.0'

export function withCallback(id: string, cb: (result: string) => void): void {
  throw new Error('not implemented')
}
