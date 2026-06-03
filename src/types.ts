export type FunctionKeys<Module> = {
  [K in keyof Module]: Module[K] extends (...args: any[]) => any ? K : never
}[keyof Module]

export interface MockedModule<Module> {
  expects<K extends FunctionKeys<Module>>(name: K): Expectation<Module[K]>
}

export interface Expectation<Fn> {
  withArgs(...args: Fn extends (...a: infer A) => any ? A : never): ExpectationWithArgs<Fn>
}

export interface ExpectationWithArgs<Fn> {
  returns(value: Fn extends (...a: any[]) => infer R ? R : never): void
  throws(error: unknown): void
  resolves(value: Fn extends (...a: any[]) => Promise<infer V> ? V : never): void
  rejects(error: Fn extends (...a: any[]) => Promise<any> ? unknown : never): void
  calls(fn: Fn): void
}

export type MockModuleInstance<Module> = MockedModule<Module> & {
  [K in FunctionKeys<Module>]: Module[K]
}
