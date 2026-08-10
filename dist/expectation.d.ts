declare global {
    interface ErrorConstructor {
        captureStackTrace(error: Error, caller?: Function): void;
    }
}
export declare enum ResponseType {
    return = "return",
    throw = "throw",
    reject = "reject",
    callback = "callback"
}
type Response = {
    type: ResponseType.return;
    value: unknown;
} | {
    type: ResponseType.throw;
    error: unknown;
} | {
    type: ResponseType.reject;
    error: unknown;
} | {
    type: ResponseType.callback;
    fn: (...args: any[]) => unknown;
};
interface QueuedExpectation {
    fnName: string;
    args: unknown[];
    response: Response;
}
export declare class ExpectationQueue {
    private queue;
    private consumedCount;
    private failed;
    add(expectation: QueuedExpectation): void;
    consume(fnName: string, calledArgs: unknown[], caller?: Function): unknown;
    private createError;
    getUnconsumed(): QueuedExpectation[];
    markFailed(): void;
    hasFailed(): boolean;
    reset(): void;
}
export {};
