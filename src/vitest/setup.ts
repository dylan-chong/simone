import { afterEach } from 'vitest'
import { verifyAll, resetAll } from '../index'

afterEach(() => {
  try { verifyAll() } finally { resetAll() }
})
