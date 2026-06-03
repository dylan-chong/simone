export interface User {
  id: string
  name: string
}

export interface CreateUserResult {
  id: string
}

export interface SendEmailResult {
  sent: boolean
}

export interface EmailPreferences {
  marketing: boolean
  notifications: boolean
}
