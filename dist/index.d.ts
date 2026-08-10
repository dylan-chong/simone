import type { MockModuleInstance } from './types.js';
export type { MockedModule, MockModuleInstance, Expectation, ExpectationWithArgs, SyncExpectationWithArgs, AsyncExpectationWithArgs, FunctionKeys } from './types.js';
export { SimoneError, SimoneAlreadyFailedError } from './errors.js';
export { match } from './match.js';
export declare function mockModule<Module>(module: Promise<Module>): MockModuleInstance<Module>;
export declare function verifyAll(): void;
export declare function resetAll(): void;
