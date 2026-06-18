---
name: TypeScript let-variable narrowing in async closures
description: TS treats let-variables assigned inside .then() callbacks as their init type at the await site — breaks if/ternary narrowing.
---

## The rule

When a `let` variable is initialized to `null` and assigned inside a `.then()` callback, TypeScript's control flow analysis retains the *init type* (`null`) at the point after the `await`. It does not widen to the declared union type based on the closure assignment.

```ts
// BROKEN — TS sees capturedPacket as null after the await
let capturedPacket: Foo | null = null;
const p = somePromise.then(d => { capturedPacket = d as Foo; });
await p;
if (capturedPacket) {
  capturedPacket.bar; // ERROR: Property 'bar' does not exist on type 'never'
}
```

The truthy branch of `if (null)` is `never`, so `capturedPacket` inside the block is `never`.

**Why:** TypeScript's CFA does not model async causality. The assignment in the `.then()` callback is visible to TS, but the narrowing of the outer variable is reset to `null` (the last directly-observed init value) rather than widened to the declared union.

**How to apply:** Whenever you need a `let` variable to capture a value from an async callback for use after an `await`, use a double-assert through `unknown` to bypass TS narrowing:

```ts
let capturedPacket: Foo | null = null;
const p = somePromise.then(d => { capturedPacket = d as Foo; });
await p;

// Double-assert: runtime value is correct; TS just can't see the assignment
const pkt = capturedPacket as unknown as Foo | null;
if (pkt !== null) {
  pkt.bar; // OK
}
```

Or, if the init value is the only concern, initialize with a cast:

```ts
let capturedPacket = null as Foo | null;
```

This forces TS to widen the declared type from the start.
