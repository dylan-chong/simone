import { SimoneError, SimoneAlreadyFailedError } from './errors.js';
export class Registry {
    queue;
    modules = new Set();
    constructor(queue) {
        this.queue = queue;
    }
    register(mod) {
        this.modules.add(mod);
    }
    getAll() {
        return [...this.modules];
    }
    verifyAll() {
        if (this.queue.hasFailed()) {
            throw new SimoneAlreadyFailedError();
        }
        const unconsumed = this.queue.getUnconsumed();
        if (unconsumed.length > 0) {
            const details = unconsumed
                .map((e) => `  - ${e.fnName}(${e.args.map((a) => JSON.stringify(a)).join(', ')})`)
                .join('\n');
            throw new SimoneError(`the following was expected but never called:\n${details}`);
        }
    }
    resetAll() {
        this.queue.reset();
        for (const mod of this.modules) {
            mod.reset();
        }
    }
    clear() {
        this.modules.clear();
        this.queue.reset();
    }
}
