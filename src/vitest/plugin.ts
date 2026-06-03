import type { Plugin, UserConfig } from 'vite'
import { readFileSync, existsSync } from 'fs'
import { dirname, resolve } from 'path'
import { fileURLToPath } from 'url'

export function simonePlugin(): Plugin {
  const currentDir = dirname(fileURLToPath(import.meta.url))
  const mockModulePath = resolve(currentDir, '../mock-module.ts')

  return {
    name: 'simone',
    enforce: 'pre',

    config() {
      return {
        test: {
          setupFiles: [resolve(currentDir, './setup.ts')],
        },
      } as UserConfig
    },

    transform(code: string, id: string) {
      if (!code.includes('mockModule')) return null
      if (id.includes('node_modules')) return null

      const mockModuleRegex = /const\s+(\w+)\s*=\s*mockModule\s*<[^>]*>\s*\(\s*['"]([^'"]+)['"]\s*\)/g
      let transformed = code
      const mocks: { varName: string; path: string }[] = []

      for (const match of code.matchAll(mockModuleRegex)) {
        mocks.push({ varName: match[1], path: match[2] })
      }

      if (mocks.length === 0) return null

      for (const { varName, path } of mocks) {
        const original = new RegExp(
          `const\\s+${varName}\\s*=\\s*mockModule\\s*<[^>]*>\\s*\\(\\s*['"]${escapeRegex(path)}['"]\\s*\\)`
        )
        const exportNames = analyzeModuleExports(path, id)
        transformed = transformed.replace(
          original,
          `const ${varName} = await vi.hoisted(async () => {\n` +
          `  const { createMockModule } = await import('${mockModulePath}');\n` +
          `  return createMockModule('${path}', ${JSON.stringify(exportNames)});\n` +
          `});\n` +
          `vi.mock('${path}', () => ${varName});`
        )
      }

      // Remove the user's mockModule import since we inline the real import
      transformed = transformed.replace(/import\s*\{[^}]*\bmockModule\b[^}]*\}\s*from\s*['"][^'"]+['"]\s*;?\n?/g, '')

      return { code: transformed, map: null }
    },
  }
}

function analyzeModuleExports(modulePath: string, importerId: string): string[] {
  const dir = dirname(importerId)
  const resolved = resolve(dir, modulePath)
  const extensions = ['.ts', '.tsx', '.js', '.jsx']

  let filePath: string | null = null
  for (const ext of extensions) {
    const candidate = resolved.endsWith(ext) ? resolved : resolved + ext
    if (existsSync(candidate)) {
      filePath = candidate
      break
    }
  }

  if (!filePath) return []

  const source = readFileSync(filePath, 'utf-8')
  const names: string[] = []

  const functionExportRegex = /export\s+(?:async\s+)?function\s+(\w+)/g
  for (const m of source.matchAll(functionExportRegex)) {
    names.push(m[1])
  }

  const arrowExportRegex = /export\s+const\s+(\w+)\s*=\s*(?:async\s*)?\(/g
  for (const m of source.matchAll(arrowExportRegex)) {
    names.push(m[1])
  }

  return names
}

function escapeRegex(str: string): string {
  return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}
