export async function getUser(id: string): Promise<{ id: string; name: string }> {
  throw new Error('real implementation — hits database')
}

export async function createUser(name: string, age: number): Promise<{ id: string }> {
  throw new Error('real implementation — hits database')
}

export async function deleteUser(id: string): Promise<void> {
  throw new Error('real implementation — hits database')
}
