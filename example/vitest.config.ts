import { defineConfig } from 'vitest/config'
import { simonePlugin } from '../src/vitest/index'

export default defineConfig({
  plugins: [simonePlugin()],
  test: {
    root: './example',
    include: ['src/**/*.test.ts'],
    globals: true,
    typecheck: {
      tsconfig: './example/tsconfig.json',
    },
    coverage: {
      provider: 'v8',
      include: ['src/**/*.ts'],
      exclude: ['src/**/*.test.ts', 'src/types.ts', 'src/email-service.ts', 'src/user-service.ts'],
      thresholds: {
        lines: 100,
        functions: 100,
        branches: 100,
        statements: 100,
      },
    },
  },
})
