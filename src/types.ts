export type FunctionKeys<T> = {
  [K in keyof T]: T[K] extends (...args: any[]) => any ? K : never
}[keyof T]

export interface MockedModule<T> {
  expects<K extends FunctionKeys<T>>(name: K): Expectation<T[K]>
}

export interface Expectation<F> {
  withArgs(...args: F extends (...a: infer A) => any ? A : never): ExpectationWithArgs<F>
  never(): void
}

export interface ExpectationWithArgs<F> {
  returns(value: F extends (...a: any[]) => infer R ? R : never): void
}

export type MockModuleInstance<T> = MockedModule<T> & {
  [K in FunctionKeys<T>]: T[K]
}
