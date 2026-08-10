import { registry } from './globals.js';
import { SimoneError } from './errors.js';
export { SimoneError, SimoneAlreadyFailedError } from './errors.js';
export { match } from './match.js';
export function mockModule(module) {
    throw new SimoneError(`mockModule() was called directly — this means the simone Vite plugin is not configured.\n` +
        `Add simonePlugin() to your vitest.config.ts plugins array.`);
}
export function verifyAll() {
    registry.verifyAll();
}
export function resetAll() {
    registry.resetAll();
}
