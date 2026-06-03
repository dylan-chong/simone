import type { EmailPreferences, SendEmailResult } from './types'

export async function sendWelcomeEmail(userId: string, email: string): Promise<SendEmailResult> {
  throw new Error('real implementation — hits SMTP server')
}

export async function getEmailPreferences(userId: string): Promise<EmailPreferences> {
  throw new Error('real implementation — hits database')
}
