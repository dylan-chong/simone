import type { EmailPreferences, EmailQuery, SendEmailRequest, SendEmailResult } from './types'

export async function sendWelcomeEmail(request: SendEmailRequest): Promise<SendEmailResult> {
  throw new Error('real implementation — hits SMTP server')
}

export async function getEmailPreferences(query: EmailQuery): Promise<EmailPreferences> {
  throw new Error('real implementation — hits database')
}
