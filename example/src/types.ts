export interface User {
  id: string
  name: string
}

export interface UserQuery {
  id: string
  includeDeleted?: boolean
}

export interface CreateUserRequest {
  name: string
  age: number
  email: string
}

export interface CreateUserResult {
  id: string
}

export interface EmailPreferences {
  marketing: boolean
  notifications: boolean
}

export enum Channel {
  Web = 'web',
  Mobile = 'mobile',
}

export interface EmailQuery {
  userId: string
  channel: Channel
}

export interface SendEmailRequest {
  to: string
  subject: string
  body: string
}

export interface SendEmailResult {
  sent: boolean
  messageId: string
}

export interface Profile extends User {
  emailPrefs: EmailPreferences
  loadedAt: number
}

export class DatabaseError extends Error {
  constructor(public readonly code: string, message: string) {
    super(message)
    this.name = 'DatabaseError'
  }
}
