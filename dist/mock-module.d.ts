import type { Resettable } from './registry.js';
import type { MockModuleInstance } from './types.js';
type MockModuleInternal<Module> = MockModuleInstance<Module> & Resettable;
export declare function createMockModule<Module>(moduleName: string, functionNames: string[]): MockModuleInternal<Module>;
export {};
