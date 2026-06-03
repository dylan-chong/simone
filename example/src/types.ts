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

export interface EmailQuery {
  userId: string
  channel: 'web' | 'mobile'
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
