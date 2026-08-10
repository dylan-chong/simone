import { ResponseType } from './expectation.js';
import { SimoneError } from './errors.js';
import { globalQueue, registry } from './globals.js';
export function createMockModule(moduleName, functionNames) {
    const configuredFns = new Set();
    const mod = {
        expects(name) {
            if (!functionNames.includes(name)) {
                throw new SimoneError(`'${name}' is not a function export`);
            }
            return {
                withArgs(...args) {
                    configuredFns.add(name);
                    const fnName = `${moduleName}.${name}`;
                    return {
                        returns(value) {
                            globalQueue.add({ fnName, args, response: { type: ResponseType.return, value } });
                        },
                        throws(error) {
                            globalQueue.add({ fnName, args, response: { type: ResponseType.throw, error } });
                        },
                        resolves(value) {
                            globalQueue.add({ fnName, args, response: { type: ResponseType.return, value: Promise.resolve(value) } });
                        },
                        rejects(error) {
                            globalQueue.add({ fnName, args, response: { type: ResponseType.reject, error } });
                        },
                        calls(fn) {
                            globalQueue.add({ fnName, args, response: { type: ResponseType.callback, fn } });
                        },
                    };
                },
            };
        },
        reset() {
            configuredFns.clear();
        },
    };
    for (const name of functionNames) {
        const stub = (...args) => {
            if (!configuredFns.has(name)) {
                globalQueue.markFailed();
                const error = new SimoneError(`${moduleName}.${name}() was called but has no expectations configured`);
                Error.captureStackTrace(error, stub);
                throw error;
            }
            return globalQueue.consume(`${moduleName}.${name}`, args, stub);
        };
        mod[name] = stub;
    }
    registry.register(mod);
    return mod;
}
