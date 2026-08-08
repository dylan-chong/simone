const MATCH_FN_TAG = Symbol('simone.match.fn')

interface MatchFnMarker {
  readonly [MATCH_FN_TAG]: true
}

export const match = {
  /**
   * Placeholder for a `withArgs()` slot whose real value can't be predicted by the test
   * (e.g. a callback the code under test generates internally). Skips strict argument
   * matching for that slot — the real value passed at call time flows through to `.calls(fn)`
   * as normal, so the test can still invoke it and assert on its effects. Only valid with
   * `.calls()`; using it with `.returns()`/`.throws()`/`.resolves()`/`.rejects()` throws.
   */
  fn<Fn extends (...args: any[]) => any>(): Fn {
    return { [MATCH_FN_TAG]: true } as unknown as Fn
  },
}

export function isMatchFn(value: unknown): value is MatchFnMarker {
  return typeof value === 'object' && value !== null && MATCH_FN_TAG in value
}
