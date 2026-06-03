import type { EmailPreferences } from './types'

export async function sendWelcomeEmail(userId: string, email: string): Promise<{ sent: boolean }> {
  throw new Error('real implementation — hits SMTP server')
}

export async function getEmailPreferences(userId: string): Promise<EmailPreferences> {
  throw new Error('real implementation — hits database')
}
