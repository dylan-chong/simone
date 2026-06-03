export async function sendWelcomeEmail(userId: string, email: string): Promise<{ sent: boolean }> {
  throw new Error('real implementation — hits SMTP server')
}

export async function getEmailPreferences(userId: string): Promise<{ marketing: boolean; notifications: boolean }> {
  throw new Error('real implementation — hits database')
}
