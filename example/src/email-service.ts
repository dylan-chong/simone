import type { EmailPreferences, EmailQuery, SendEmailRequest, SendEmailResult } from './types'

export async function sendWelcomeEmail(request: SendEmailRequest): Promise<SendEmailResult> {
  throw new Error('real implementation — hits SMTP server')
}

export async function getEmailPreferences(query: EmailQuery): Promise<EmailPreferences> {
  throw new Error('real implementation — hits database')
}

export function logEmailEvent(event: string): void {
  throw new Error('real implementation — writes to event log')
}

export function logError(error: Error): void {
  throw new Error('real implementation — writes to error log')
}
