---
name: Pathfinder instrument philosophy
description: The three-mode loop and why CODE was replaced with ACTION
---

## Rule
The three operator modes are AUGMENT (observe), ARCHIVE (remember), ACTION (decide).
Code — compilers, Rust files, hot-swap, cargo — is implementation substrate, not operator surface.

**Why:** The instrument surface must be continuous. If the operator hits a Rust compiler panel,
they've fallen through the skin into the machine room. The sculpture test: trace a finger across
the three modes without encountering implementation details.

**How to apply:**
- Any panel showing file trees, compiler output, or language-level artifacts is machine room.
- Machine room belongs under the surface (governance, workflows, runtime), not in the mode switcher.
- New modes should answer an operator question: "What do I see?", "What do I know?", "What do I do?"

