import { readFileSync, existsSync } from 'fs';
import { dirname, resolve } from 'path';
import { fileURLToPath } from 'url';
export function simonePlugin() {
    const currentDir = dirname(fileURLToPath(import.meta.url));
    const mockModulePath = resolve(currentDir, '../mock-module.js');
    return {
        name: 'simone',
        enforce: 'pre',
        config() {
            return {
                test: {
                    setupFiles: [resolve(currentDir, './setup.js')],
                },
            };
        },
        transform(code, id) {
            if (!code.includes('mockModule'))
                return null;
            if (id.includes('node_modules'))
                return null;
            const mockModuleRegex = /const\s+(\w+)\s*=\s*mockModule\s*\(\s*import\s*\(\s*['"]([^'"]+)['"]\s*\)\s*\)/g;
            const mocks = [...code.matchAll(mockModuleRegex)].map((match) => ({ varName: match[1], path: match[2] }));
            if (mocks.length === 0)
                return null;
            const transformed = stripMockModuleImport(replaceMockModuleCalls(code, mocks, id, mockModulePath));
            return { code: transformed, map: null };
        },
    };
}
function replaceMockModuleCalls(code, mocks, importerId, mockModulePath) {
    return mocks.reduce((acc, { varName, path }) => {
        const original = new RegExp(`const\\s+${varName}\\s*=\\s*mockModule\\s*\\(\\s*import\\s*\\(\\s*['"]${escapeRegex(path)}['"]\\s*\\)\\s*\\)`);
        const exportNames = analyzeModuleExports(path, importerId);
        return acc.replace(original, `const ${varName} = await vi.hoisted(async () => {\n` +
            `  const { createMockModule } = await import('${mockModulePath}');\n` +
            `  return createMockModule('${path}', ${JSON.stringify(exportNames)});\n` +
            `});\n` +
            `vi.mock('${path}', () => ${varName});`);
    }, code);
}
function stripMockModuleImport(code) {
    return code.replace(/import\s*\{([^}]*)\}\s*from\s*(['"][^'"]+['"])\s*;?\n?/g, (full, imports, source) => {
        if (!imports.includes('mockModule'))
            return full;
        const remaining = imports.split(',').map((s) => s.trim()).filter((s) => s && s !== 'mockModule');
        if (remaining.length === 0)
            return '';
        return `import { ${remaining.join(', ')} } from ${source};\n`;
    });
}
function resolveModulePath(basePath) {
    const extensions = ['.ts', '.tsx', '.js', '.jsx'];
    for (const ext of extensions) {
        const candidate = basePath.endsWith(ext) ? basePath : basePath + ext;
        if (existsSync(candidate)) {
            return candidate;
        }
    }
    return null;
}
function analyzeModuleExports(modulePath, importerId) {
    const dir = dirname(importerId);
    const resolved = resolve(dir, modulePath);
    const filePath = resolveModulePath(resolved);
    if (!filePath)
        return [];
    const source = readFileSync(filePath, 'utf-8');
    const names = [];
    const functionExportRegex = /export\s+(?:async\s+)?function\s+(\w+)/g;
    for (const m of source.matchAll(functionExportRegex)) {
        names.push(m[1]);
    }
    const arrowExportRegex = /export\s+const\s+(\w+)\s*=\s*(?:async\s*)?\(/g;
    for (const m of source.matchAll(arrowExportRegex)) {
        names.push(m[1]);
    }
    return names;
}
function escapeRegex(str) {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
