import { ExpectationQueue } from './expectation.js';
import { Registry } from './registry.js';
export const globalQueue = new ExpectationQueue();
export const registry = new Registry(globalQueue);
