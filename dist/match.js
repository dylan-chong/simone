const MATCH_FN_TAG = Symbol('simone.match.fn');
export const match = {
    /**
     * Placeholder for a `withArgs()` slot whose real value can't be predicted by the test
     * (e.g. a callback the code under test generates internally). Skips strict argument
     * matching for that slot — the real value passed at call time flows through to `.calls(fn)`
     * as normal, so the test can still invoke it and assert on its effects. Only valid with
     * `.calls()`; using it with `.returns()`/`.throws()`/`.resolves()`/`.rejects()` throws.
     */
    fn() {
        return { [MATCH_FN_TAG]: true };
    },
};
export function isMatchFn(value) {
    return typeof value === 'object' && value !== null && MATCH_FN_TAG in value;
}
