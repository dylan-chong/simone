export type FunctionKeys<Module> = {
  [K in keyof Module]: Module[K] extends (...args: any[]) => any ? K : never
}[keyof Module]

export interface MockedModule<Module> {
  expects<K extends FunctionKeys<Module>>(name: K): Expectation<Module[K]>
}

export interface Expectation<Fn> {
  withArgs(...args: Fn extends (...a: infer A) => any ? A : never): ExpectationWithArgs<Fn>
  never(): void
}

export interface ExpectationWithArgs<Fn> {
  returns(value: Fn extends (...a: any[]) => infer R ? R : never): void
}

export type MockModuleInstance<Module> = MockedModule<Module> & {
  [K in FunctionKeys<Module>]: Module[K]
}
