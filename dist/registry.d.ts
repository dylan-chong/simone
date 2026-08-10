import type { ExpectationQueue } from './expectation.js';
export interface Resettable {
    reset(): void;
}
export declare class Registry {
    private queue;
    private modules;
    constructor(queue: ExpectationQueue);
    register(mod: Resettable): void;
    getAll(): Resettable[];
    verifyAll(): void;
    resetAll(): void;
    clear(): void;
}
