export type FunctionKeys<Module> = {
    [K in keyof Module]: Module[K] extends (...args: any[]) => any ? K : never;
}[keyof Module];
export interface MockedModule<Module> {
    expects<K extends FunctionKeys<Module>>(name: K): Expectation<Module[K]>;
}
export interface Expectation<Fn> {
    withArgs(...args: Fn extends (...a: infer A) => any ? A : never): ExpectationWithArgs<Fn>;
}
export type ExpectationWithArgs<Fn> = Fn extends (...a: any[]) => Promise<any> ? AsyncExpectationWithArgs<Fn> : SyncExpectationWithArgs<Fn>;
export interface SyncExpectationWithArgs<Fn> {
    returns(value: Fn extends (...a: any[]) => infer R ? R : never): void;
    throws(error: unknown): void;
    calls(fn: Fn): void;
}
export interface AsyncExpectationWithArgs<Fn> {
    resolves(value: Fn extends (...a: any[]) => Promise<infer V> ? V : never): void;
    rejects(error: unknown): void;
    calls(fn: Fn): void;
}
export type MockModuleInstance<Module> = MockedModule<Module> & {
    [K in FunctionKeys<Module>]: Module[K];
};
