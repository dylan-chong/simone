import { afterEach } from 'vitest'
import { verifyAll, resetAll } from '../index'

afterEach(() => {
  verifyAll()
  resetAll()
})
