# Phase 0 Research: Version 0.5 Visual Fixes

All Technical Context fields are fixed by the existing codebase (TypeScript 5.6 + React 18.3, Vite 6,
Tailwind 3, Vitest 2). No NEEDS CLARIFICATION remained from the spec. Two design questions required a
decision; both are resolved below. The remaining items are mechanical data/config changes documented
in `data-model.md`.

---

## R1 — Empty-cell flash at end of spin

**Decision**: During the `spinning` phase, source each `ReelColumn`'s settle target from
`state.magicGrid` (populated by the `SPIN` action with the freshly drawn columns) rather than from
`lastSpinResult`.

**Rationale**: The flash happens because `SlotGrid.displayColumns` only reads `magicGrid` when
`isMagicPhase` is true. During `spinning`, `isMagicPhase` is false, so columns animate toward the
*previous* `lastSpinResult` (or the blank placeholder on the first spin), settle there, and only flip
to the real grid once `BEGIN_MAGIC_PHASE` runs. Reading the already-populated `magicGrid` during
`spinning` makes the columns settle directly on the real result. `lastSpinResult` is intentionally not
updated until `CLAIM`, so it is the wrong source mid-spin.

**Alternatives considered**:
- *Populate `lastSpinResult` on SPIN*: rejected — `lastSpinResult` is the claimed/finalized result
  used by the result modal and post-claim display; overloading it mid-spin risks notable-result logic
  regressions.
- *Delay `BEGIN_MAGIC_PHASE` dispatch*: rejected — does not remove the stale settle target, only its
  timing; the wrong icons would still appear briefly.

---

## R2 — Showing magic-ability edits on the grid

**Decision**: In `ReelColumn`, re-synchronize the local `displayIcons` state to the `icons` prop
whenever `icons` changes and no animation is currently running.

**Rationale**: `ReelColumn` caches `icons` into `displayIcons` state and only refreshes it inside the
effect keyed on `[spinning]`. Respin/swap/boost mutate `magicGrid` while `spinning` is false, so the
prop changes but the cached state does not, leaving the grid visually frozen even though the data is
correct (the reported "results computed correctly but not displayed"). A dedicated effect on the
`icons` prop (guarded so it does not stomp an in-flight animation) keeps the display authoritative.

**Alternatives considered**:
- *Make `ReelColumn` fully controlled (render `icons` directly)*: cleaner long-term, but the spin
  animation relies on local state to fl/show random icons; a partial sync is the smaller, lower-risk
  change consistent with the existing component design.
- *Key the column on grid contents to force remount*: rejected — remounting discards animation state
  and would reintroduce flicker.

---

## R3 — Respin animation (per single column)

**Decision**: Add a per-column "respin pulse": the parent tells one `ReelColumn` to run its existing
interval-based shuffle animation once, after which it settles on the updated `icons`. Honor the
`animate` setting — when off, the new icons appear immediately. Reuse the current 200 ms shuffle
interval and a single stop timeout (no per-column staggering needed for a single column).

**Rationale**: The App-level `spinning` boolean animates *all* columns and is tied to the full SPIN →
magic flow; respin must animate exactly one column without re-running the whole pipeline.
`ReelColumn` already contains the interval/stop-timer animation; exposing a lightweight trigger
(e.g., a changing per-column "respin token" prop) reuses that code path with minimal new surface.
Dispatch order: trigger the animation, dispatch `MAGIC_RESPIN` (which updates the grid data); the
animation settles onto the new `icons` via the R2 sync. Disabling animation must short-circuit to the
immediate result, matching FR-005.

**Alternatives considered**:
- *Reuse global `spinning`*: rejected — would animate all five columns and re-enter spin logic.
- *CSS-only transition*: rejected — the existing visual language is a symbol shuffle, not a slide;
  matching it keeps UX consistency (Constitution III).

---

## R4 — Locked-column indication & column click target

**Decision**: Strengthen the existing lock affordance (currently a small 🔒 + amber ring) into a
clearly legible, persistent treatment (e.g., padlock badge + distinct amber border/label per column),
and render an explicit, obvious column-level click target/affordance when a column-targeting ability
(respin or lock) is active (e.g., a highlighted "Select column" hit area / button spanning the column
with hover/focus emphasis).

**Rationale**: FR-006/FR-007 are usability requirements; the current `onColumnClick` lives on the
whole column `div` with only subtle hover opacity, which is why columns are hard to click. A visible,
emphasized target tied to the active mode removes ambiguity. All additions stay within the existing
48 × 48 px icon bounding boxes / column footprint to satisfy Constitution III (no layout shift).

**Alternatives considered**:
- *Separate per-column buttons below the grid*: rejected — adds layout height and breaks the
  click-the-column mental model.

---

## R5 — Market ordering

**Decision**: Sort the market list ascending by a normalized price computed from each item's cost
(currency tier × amount), with tier weights Copper < Silver < Gold (e.g., copper = 1, silver = 100,
gold = 10 000, mirroring the existing 100:1 auto-convert ratios). Items with no cost are excluded
(unchanged).

**Rationale**: FR-009 requires cheapest-first across currency tiers. The existing 100× conversion
ratio between tiers (`currencyRegistry.ts`) gives a principled normalization so 1 copper < 1 silver <
1 gold and 10 copper < 1 silver, etc. This is a pure presentational sort in `Market.tsx`; data is
unchanged beyond the catalog cost edits.

**Alternatives considered**:
- *Hard-coded display order*: rejected — brittle; a computed sort stays correct if costs change again.

---

## R6 — Cheat trigger & resource editing

**Decision**: Add a hidden `CheatPanel` opened by a deliberate, non-obvious gesture (e.g., a secret
key sequence or a hidden tap target such as multi-tapping the title), exposing fields to set resource
balances. Setting a resource dispatches a new `SET_CURRENCY` reducer action that validates input
(reject negative / non-finite; clamp to a sane non-negative integer) and updates the balance.

**Rationale**: FR-012/FR-013 require a hidden, non-interfering mechanism retainable as an easter egg.
Routing the change through a reducer action keeps state flow consistent (persistence, currency
display) and testable in isolation. Exact gesture/visual is a design detail (spec assumption) and does
not affect scope or success criteria.

**Alternatives considered**:
- *Browser console helper only*: rejected — not an in-app easter egg and harder for non-dev testers.
- *Editing localStorage directly*: rejected — bypasses validation and the reducer, risking corrupt
  state.

**Validation rule**: a `SET_CURRENCY` with a negative, non-finite, or non-numeric amount is ignored
(state unchanged); valid amounts set the named currency to a non-negative integer (matches the spec's
invalid-input edge case).
