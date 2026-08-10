import { SimoneError } from './errors.js';
import { isMatchFn } from './match.js';
export var ResponseType;
(function (ResponseType) {
    ResponseType["return"] = "return";
    ResponseType["throw"] = "throw";
    ResponseType["reject"] = "reject";
    ResponseType["callback"] = "callback";
})(ResponseType || (ResponseType = {}));
export class ExpectationQueue {
    queue = [];
    consumedCount = 0;
    failed = false;
    add(expectation) {
        if (expectation.response.type !== ResponseType.callback && expectation.args.some(isMatchFn)) {
            throw new SimoneError(`${expectation.fnName}: match.fn() can only be used with .calls() — ` +
                `the matched function must be invoked and its effect asserted, not just returned or thrown.`);
        }
        this.queue.push(expectation);
    }
    consume(fnName, calledArgs, caller) {
        if (this.consumedCount >= this.queue.length) {
            this.failed = true;
            throw this.createError(`${fnName}(${formatArgs(calledArgs)}) was called but no expectations remain`, caller);
        }
        const next = this.queue[this.consumedCount];
        if (next.fnName !== fnName) {
            this.failed = true;
            throw this.createError(`expected ${next.fnName}(${formatArgs(next.args)}) to be called next, but ${fnName}(${formatArgs(calledArgs)}) was called`, caller);
        }
        if (!argsMatch(next.args, calledArgs)) {
            this.failed = true;
            throw this.createError(`${fnName}() was called with wrong arguments\n\n` +
                formatArgsDiff(next.args, calledArgs), caller);
        }
        this.consumedCount++;
        if (next.response.type === ResponseType.throw) {
            throw next.response.error;
        }
        if (next.response.type === ResponseType.reject) {
            return Promise.reject(next.response.error);
        }
        if (next.response.type === ResponseType.callback) {
            return next.response.fn(...calledArgs);
        }
        return next.response.value;
    }
    createError(message, caller) {
        const suffix = `\n\nafter ${this.consumedCount} successful mock ${this.consumedCount === 1 ? 'call' : 'calls'}`;
        const error = new SimoneError(message + suffix);
        if (caller)
            Error.captureStackTrace(error, caller);
        return error;
    }
    getUnconsumed() {
        return this.queue.slice(this.consumedCount);
    }
    markFailed() {
        this.failed = true;
    }
    hasFailed() {
        return this.failed;
    }
    reset() {
        this.queue = [];
        this.consumedCount = 0;
        this.failed = false;
    }
}
function argsMatch(expected, actual) {
    if (expected.length !== actual.length)
        return false;
    return expected.every((exp, i) => isMatchFn(exp) || serialize(exp) === serialize(actual[i]));
}
function formatArgs(args) {
    return args.map((a) => JSON.stringify(a)).join(', ');
}
function formatArgsDiff(expected, actual) {
    const lines = [];
    const maxLen = Math.max(expected.length, actual.length);
    for (const i of Array.from({ length: maxLen }, (_, idx) => idx)) {
        if (i < expected.length && i < actual.length && isMatchFn(expected[i])) {
            const prefix = `  arg ${i}: `;
            lines.push(prefix + indent('{ __simone_type__: "MatchFn" }', prefix.length));
            continue;
        }
        const exp = i < expected.length ? serialize(expected[i]) : undefined;
        const act = i < actual.length ? serialize(actual[i]) : undefined;
        if (exp === act) {
            const prefix = `  arg ${i}: `;
            lines.push(prefix + indent(act, prefix.length));
            continue;
        }
        if (exp !== undefined) {
            const prefix = `- arg ${i}: `;
            lines.push(prefix + indent(exp, prefix.length));
        }
        if (act !== undefined) {
            const prefix = `+ arg ${i}: `;
            lines.push(prefix + indent(act, prefix.length));
        }
    }
    return lines.join('\n');
}
function indent(str, width) {
    const pad = ' '.repeat(width);
    return str.split('\n').join('\n' + pad);
}
function serialize(value, ancestors = new WeakSet()) {
    if (value === undefined)
        return 'undefined';
    if (value === null)
        return 'null';
    if (typeof value === 'string')
        return JSON.stringify(value);
    if (typeof value === 'number' || typeof value === 'boolean')
        return String(value);
    if (typeof value === 'bigint')
        return `{ __simone_type__: "BigInt", value: "${value}n" }`;
    if (typeof value === 'symbol')
        return `{ __simone_type__: "Symbol", description: ${JSON.stringify(value.description)} }`;
    if (typeof value === 'function')
        return `{ __simone_type__: "Function", source: ${JSON.stringify(value.toString())} }`;
    if (ancestors.has(value))
        return '{ __simone_type__: "CircularRef" }';
    ancestors.add(value);
    const result = serializeObject(value, ancestors);
    ancestors.delete(value);
    return result;
}
function serializeObject(value, ancestors) {
    if (Array.isArray(value)) {
        if (value.length === 0)
            return '[]';
        const items = value.map((v) => serialize(v, ancestors));
        const oneLine = `[${items.join(', ')}]`;
        if (oneLine.length <= 60)
            return oneLine;
        return `[\n  ${items.join(',\n  ')}\n]`;
    }
    if (value instanceof Date) {
        return `{ __simone_type__: "Date", value: ${JSON.stringify(value.toISOString())} }`;
    }
    if (value instanceof RegExp) {
        return `{ __simone_type__: "RegExp", source: ${JSON.stringify(value.source)}, flags: ${JSON.stringify(value.flags)} }`;
    }
    if (value instanceof Error) {
        const typeLine = `__simone_type__: ${JSON.stringify(value.constructor.name)}`;
        const msgLine = `message: ${JSON.stringify(value.message)}`;
        const props = Object.keys(value)
            .filter((k) => k !== 'stack')
            .sort()
            .map((k) => `${safeKey(k)}: ${serialize(value[k], ancestors)}`);
        const allEntries = [typeLine, msgLine, ...props];
        return formatObject(allEntries);
    }
    const proto = Object.getPrototypeOf(value);
    if (proto !== Object.prototype && proto !== null) {
        const className = value.constructor?.name ?? 'Unknown';
        const typeLine = `__simone_type__: ${JSON.stringify(className)}`;
        const props = Object.keys(value).sort()
            .map((k) => `${safeKey(k)}: ${serialize(value[k], ancestors)}`);
        return formatObject([typeLine, ...props]);
    }
    const entries = Object.keys(value).sort()
        .map((k) => `${safeKey(k)}: ${serialize(value[k], ancestors)}`);
    return formatObject(entries);
}
function formatObject(entries) {
    if (entries.length === 0)
        return '{}';
    const oneLine = `{ ${entries.join(', ')} }`;
    if (oneLine.length <= 60)
        return oneLine;
    return `{\n  ${entries.join(',\n  ')}\n}`;
}
function safeKey(key) {
    return /^[a-zA-Z_$][a-zA-Z0-9_$]*$/.test(key) ? key : JSON.stringify(key);
}
