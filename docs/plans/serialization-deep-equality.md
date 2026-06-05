# Plan: Serialization-based deep equality

## Context
`R.equals` doesn't compare custom Error properties (like `code` on `DatabaseError`), and we need to handle nested Errors, custom classes, circular refs, Date, RegExp, etc. Instead of a custom recursive `deepEqual`, we serialize both sides to a canonical string and compare the strings. This unifies equality checking and diff output into one mechanism.

## Approach

Replace the current `deepEqual` + `stableStringify` with a single `serialize(value)` function. Equality is `serialize(a) === serialize(b)`. The diff output uses the same serialized form.

### Serialization rules

Output is **JavaScript notation** (not JSON): unquoted keys where valid identifiers, `undefined` literal, no unnecessary quotes.

1. **Primitives**: `string` → quoted, `number`/`boolean`/`null`/`undefined` → literal
2. **Arrays**: `[item, item, ...]` recursing into each element
3. **Plain objects** (`Object.getPrototypeOf(x) === Object.prototype` or `null`): `{ key: value, ... }` with keys sorted alphabetically
4. **Error instances**: `{ __simone_type__: "ErrorClassName", message: "...", ...ownEnumerableProps }` — include all own enumerable properties EXCEPT `stack`, keys sorted
5. **Other class instances** (Date, RegExp, custom classes): `{ __simone_type__: "ClassName", ...ownEnumerableProps }` — keys sorted. For Date, add a `value` prop with ISO string. For RegExp, add `source` and `flags`.
6. **Functions**: `{ __simone_type__: "Function", source: fn.toString() }`
7. **Circular references**: `{ __simone_type__: "CircularRef" }` — detected via ancestor path tracking (not a global visited set). A reference seen in a sibling branch is NOT circular — only ancestors in the current recursion path count.
8. **Symbol, BigInt, WeakRef, etc.**: `{ __simone_type__: "Symbol", description: "..." }` / `{ __simone_type__: "BigInt", value: "123n" }`

### Key design decisions
- Object keys sorted alphabetically for determinism
- `stack` excluded from Error serialization (two `new Error('msg')` should match)
- Functions compared by `.toString()` source (including native function output)
- Circular reference detection via ancestor path (WeakSet pushed/popped per recursion level, not globally accumulated)
- Output is human-readable JS notation for better diff output

## Files to modify

- `src/expectation.ts` — replace `deepEqual`, `stableStringify`, `sortKeys` with new `serialize(value)` function. Remove `ramda` import. The `consume` method compares `serialize(next.args)` vs `serialize(calledArgs)`. The `formatArgsDiff` uses `serialize` per-arg for the diff lines.
- `package.json` — remove `ramda` from dependencies (no longer needed)

## Implementation

```ts
function serialize(value: unknown, ancestors = new WeakSet<object>()): string {
  if (value === undefined) return 'undefined'
  if (value === null) return 'null'
  if (typeof value === 'string') return JSON.stringify(value)
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)
  if (typeof value === 'bigint') return `{ __simone_type__: "BigInt", value: "${value}n" }`
  if (typeof value === 'symbol') return `{ __simone_type__: "Symbol", description: ${JSON.stringify(value.description)} }`
  if (typeof value === 'function') return `{ __simone_type__: "Function", source: ${JSON.stringify(value.toString())} }`

  // Circular ref = same object appears in current ancestor path
  if (ancestors.has(value)) return '{ __simone_type__: "CircularRef" }'

  // Push onto ancestor path for this branch
  ancestors.add(value)

  const result = serializeObject(value, ancestors)

  // Pop from ancestor path (siblings can reference the same object)
  ancestors.delete(value)

  return result
}

function serializeObject(value: object, ancestors: WeakSet<object>): string {
  if (Array.isArray(value)) {
    const items = value.map(v => serialize(v, ancestors))
    return `[${items.join(', ')}]`
  }

  if (value instanceof Date) {
    return `{ __simone_type__: "Date", value: ${JSON.stringify(value.toISOString())} }`
  }

  if (value instanceof RegExp) {
    return `{ __simone_type__: "RegExp", source: ${JSON.stringify(value.source)}, flags: ${JSON.stringify(value.flags)} }`
  }

  if (value instanceof Error) {
    const props = Object.keys(value)
      .filter(k => k !== 'stack')
      .sort()
      .map(k => `${safeKey(k)}: ${serialize((value as any)[k], ancestors)}`)
    const typeLine = `__simone_type__: ${JSON.stringify(value.constructor.name)}`
    const msgLine = `message: ${JSON.stringify(value.message)}`
    return `{ ${[typeLine, msgLine, ...props].join(', ')} }`
  }

  // Other class instances (not plain Object)
  const proto = Object.getPrototypeOf(value)
  if (proto !== Object.prototype && proto !== null) {
    const className = value.constructor?.name ?? 'Unknown'
    const props = Object.keys(value).sort()
      .map(k => `${safeKey(k)}: ${serialize((value as any)[k], ancestors)}`)
    return `{ __simone_type__: ${JSON.stringify(className)}, ${props.join(', ')} }`
  }

  // Plain object
  const entries = Object.keys(value as object).sort()
    .map(k => `${safeKey(k)}: ${serialize((value as Record<string, unknown>)[k], ancestors)}`)
  return `{ ${entries.join(', ')} }`
}
```

### Equality check
```ts
// In consume():
if (serialize(next.args) !== serialize(calledArgs)) { ... }
```

### Diff output
Already uses per-arg serialization — just replace `stableStringify` calls with `serialize`.

## Verification
- `npm test` — all existing tests pass
- Example project tests pass including DatabaseError custom props
- New test: circular reference shows `{ __simone_type__: "CircularRef" }`
- New test: shared reference in siblings serializes fully (not circular)
- New test: Date comparison works by value
- New test: RegExp comparison works
- Remove `ramda` from package.json, verify no import errors
