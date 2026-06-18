---
name: Context Custody Law
description: Packet domain context must be immutable through the pipeline — UI session state must never override packet context in downstream stages.
---

## The rule

Every packet carries an authoritative domain (and subDomain) from AETHER. Once AETHER resolves, no downstream stage may substitute local context, UI session context, or previous-observation context for the packet's domain.

**Why:** A stale `hintedDomainApiRef` (e.g., Finance from a BTC observation) can bleed into the next observation's RAPIDS call if the rapidsBody is built from `...baseBody`. Result: the AETHER packet is correct (Astrophysics), the authority chain is correct, but the DB query runs against Finance — producing a technically valid, structurally wrong answer. This is the "correct indicator on the wrong timeframe" failure class.

**How to apply:** After `await aetherPromise`, build downstream request bodies from the packet directly, not from the base body:

```ts
const rapidsBody: Record<string, unknown> = { observation: text };
if (pkt !== null) {
  rapidsBody["domain"]    = pkt.domain;     // packet owns the domain
  rapidsBody["subDomain"] = pkt.subDomain;  // sub-domain for narrowing
  rapidsBody["aetherAuthorityChain"]     = pkt.authorityChain;
  rapidsBody["aetherBlockedAuthorities"] = pkt.blockedAuthorities;
} else if (hintDomain) {
  rapidsBody["domain"] = hintDomain;        // fallback only when AETHER degraded
}
```

The UI hint domain (`hintedDomainApiRef`) is guidance to AETHER — it is not authoritative. Only the packet is authoritative.

**Generalisation:** This applies to every future stage. HERMES must use the domain from the RAPIDS→HERMES packet. JEMMA must use the domain from the HERMES→JEMMA packet. The domain is immutable once AETHER has set it.
