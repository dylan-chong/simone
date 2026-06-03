import { defineConfig } from 'vitest/config'
import { simonePlugin } from '../src/vitest/index'

export default defineConfig({
  plugins: [simonePlugin()],
  test: {
    root: './example',
    include: ['src/**/*.test.ts'],
    globals: true,
  },
})
