# Research: v0.6 Reel Icon Controls, UI Layout & Bug Fixes

## Root-Cause Analysis (source-code verified)

### Enhancement 1 — Icon Enable/Disable in Reels Tab

No existing infrastructure. The `Reel` type holds `icons: Icon[]` (reel instances, each with a unique `id` assigned at purchase). `drawColumn()` in `spinLogic.ts` uses the full `reel.icons` array as its draw pool.

**Decision**: Introduce `disabledIconIds: string[]` on `GameState` (not on `Reel`) to track which reel icon instances are currently excluded from spinning. This keeps `Reel` as a pure collection and lets the reducer / spinLogic operate on a filtered view.

**Constraint**: Enabled count = `reel.icons.length − disabledIconIds.length`. Disabling is only allowed when enabled count > 12 (so the result remains ≥ 12). When total icons < 13, no icons can be disabled.

**Rationale**: Per-instance disable (by `icon.id`) lets players remove individual copies of an icon they have multiples of, which is more flexible than type-level disabling.

**Alternatives considered**:
- Per-type (definitionId) disable: simpler UI but removes all copies of a type at once; worse when the player has 3 Air and wants to keep 2.
- Disable flag on `Icon` struct: pollutes the core data type and requires deeper state mutation.

---

### Enhancement 2 — SPIN/CLAIM Same Screen Position

**Root cause** (App.tsx lines 193–225): The control block switches between two layouts:
- Non-magic: `[SpinControls]` then `[SpinButton]`
- Magic: `[MagicPhasePanel]` then `[CLAIM button]`

`MagicPhasePanel` has significantly more height than `SpinControls`, so CLAIM's Y position is lower than SPIN's Y position — the user must move the mouse downward after spinning to claim.

**Decision**: Always render `SpinControls` (the toggle row) regardless of phase. During the magic phase, render CLAIM immediately below `SpinControls` (in the exact SPIN position), then render `MagicPhasePanel` further down. `SpinControls` settings (multiplier, animate, auto-convert) are valid to view/change between phases anyway.

**New layout**:
```
[SpinControls]  ← always visible
[SPIN or CLAIM] ← SPIN during market/spinning, CLAIM during magic — same anchor point
[MagicPhasePanel] ← only during magic phase, appears below CLAIM
```

**Rationale**: Matches the spec's "retain display of the toggles above the SPIN button; swap the displayed order of the CLAIM and Magic Phase controls."

**Alternatives considered**:
- Absolute/fixed-position overlay for CLAIM: fragile across screen sizes.
- Matching heights via padding/min-height: band-aid; breaks if panel contents change.

---

### Bug 1 — Boost Value Affects Multiple Cells (cross-column contamination)

**Root cause** (spinLogic.ts `drawColumn` + reducer.ts `iconsToMagicCells`):

`drawColumn()` returns references to the actual `Icon` objects stored in `reel.icons`. Each reel icon has a UUID assigned when purchased (`id: crypto.randomUUID()` in `BUY_ICON`). The starting icons use `stableId()` counters (`air-1`, `water-2`, etc.).

When the same icon instance is drawn into multiple columns (possible with small reels — a 4-icon reel draws 3 icons per column across 5 columns, so icons necessarily repeat), all those cells share the same `icon.id`.

`buildOverridesMap` (called in CLAIM's `calculatePayouts` and in `SlotGrid`'s display) keys overrides by `icon.id`. Boosting one cell sets an override for that `id`, which then applies to every other cell that holds the same icon object — contaminating payouts and display across columns.

**Decision**: In `iconsToMagicCells` (called when the spin result is converted to a magic grid), clone each icon with a fresh `crypto.randomUUID()`:
```ts
function iconsToMagicCells(icons: Icon[]): MagicCell[] {
  return icons.map((icon) => ({
    icon: { ...icon, id: crypto.randomUUID() },
    valueOverride: null,
  }))
}
```

Every magic grid cell now has a unique `id`. A boost override on one cell cannot leak to another.

**Alternatives considered**:
- Key overrides by `(colIdx, rowIdx)` tuple instead of `icon.id`: requires changing `buildOverridesMap`, `SlotGrid`, and `calculatePayouts` signatures; higher blast radius.
- Clone icons at draw time in `drawColumn`: works but pollutes spinLogic with UUID concerns unrelated to spin logic.

---

### Bug 2 — Boost Value Increment Wrong (+N instead of +1)

**Root cause** (reducer.ts `MAGIC_INCREASE_VALUE`, line ~219):
```ts
const cost = state.magicCounters.increaseValue + 1
...
valueOverride: currentValue + cost  // BUG: cost grows with each use
```

`cost` doubles as both the fire-currency cost AND the increment. On the 1st use `cost=1` (correct); on the 2nd use `cost=2`, making the delta +2 not +1; on the 3rd use `cost=3`, delta +3, etc.

**Decision**: Separate the two concerns. Keep `cost` for the fire-currency deduction. Hard-code the value increment to `+1`:
```ts
valueOverride: currentValue + 1
```

**Rationale**: Escalating cost is intentional design (fire is spent at increasing rate). Escalating increment is not — each boost should be worth exactly 1 unit of the icon's payout.

---

### Bug 3 — Master of Elements Does Not Trigger After Boost Value

**Root cause**: Compound effect of Bug 1. With duplicate `icon.id` values in the magic grid, the `iconsToMagicCells` clone approach (Bug 1 fix) stabilises the grid state so that `detectMasterOfElements`'s count-by-`definitionId` scan operates on a correct, non-duplicated grid.

`detectMasterOfElements` counts `cell.icon.definitionId` values and is independent of `valueOverride`, so MoE detection itself is not directly broken. However, with the Bug-1 state corruption producing unexpected grid mutations, the magic grid passed to `CLAIM` may not accurately reflect the intended arrangement.

**Decision**: The Bug 1 fix (unique cell IDs) is the primary fix. A targeted unit test (`MAGIC_INCREASE_VALUE` on a grid where MoE conditions are met → CLAIM → expect `masterOfElements: true`) will confirm correctness post-fix.

---

### Bug 4 — Air Spin Animation: Column Grows in Height

**Root cause** (ReelColumn.tsx `respinToken` effect, ~line 108):
```ts
const pool = reelIcons.length > 0 ? reelIcons : icons   // pool = full reel (e.g., 4–12 icons)
setDisplayIcons(pool.map(() => pool[Math.floor(Math.random() * pool.length)]))
//              ^^^^ maps over pool length, not column length
```

`pool` is `reelIcons` — the entire reel (4 to many icons). Mapping over it produces as many display rows as there are icons in the reel, not the 3 rows a column should display. Result: during respin animation the column briefly renders with `pool.length` rows.

**Decision**: Change `pool.map(...)` to `icons.map(...)` to always produce exactly `icons.length` (= 3) rows while still sampling randomly from the full pool:
```ts
setDisplayIcons(icons.map(() => pool[Math.floor(Math.random() * pool.length)]))
```

The same issue is latent in the global-spin animation (line ~72) but `icons.map(...)` is already used there — that path is correct.

---

### Bug 5 — Locked Columns Animate During the Next Spin

**Root cause** (reducer.ts `SPIN` action, ~line 130):
```ts
lockedColumns: [],   // clears locks before the animation plays
```

`SPIN` clears `lockedColumns` immediately. The `ReelColumn` component's global-spin effect fires when `spinning` flips to `true`; at that point `locked` (derived from `lockedColumns`) is already `false` for all columns, so all columns animate — even those whose content was preserved from the previous magic phase.

**Decision**: Do **not** clear `lockedColumns` in the `SPIN` action. Clear them only in `BEGIN_MAGIC_PHASE` (which already does `lockedColumns: []`). With locked columns persisting during the spinning phase, `ReelColumn` receives `locked=true` and short-circuits the animation:
```ts
if (locked) {
  setAnimating(false)
  setDisplayIcons(icons)
  onDone?.()
  return
}
```

**Consequences**: The lock indicator is visible during the spinning animation (columns that were locked in the previous magic phase show the lock badge while unlocked columns spin). This provides useful visual feedback — the player sees which columns are frozen. The indicator disappears once `BEGIN_MAGIC_PHASE` fires and clears `lockedColumns`.

**Alternatives considered**:
- Add a separate `spinningLockedColumns` field: duplicates state unnecessarily.
- Clear in SPIN but re-derive locked columns from lastSpinResult: overly complex.

---

### Bug 6 — Lock Indicator Offsets Column Layout

**Root cause** (ReelColumn.tsx, ~line 132): The lock indicator div is the **first child** of the `flex-col` container, rendered before the icon cells. Its presence adds height only to locked columns, shifting their icons down relative to unlocked columns.

**Decision**: Move the lock indicator to a **fixed-height wrapper below the icons**. Reserve the same height on all columns (locked and unlocked alike) to prevent any horizontal shift:
```tsx
{/* icons */}
{displayIcons.map(...)}

{/* Lock indicator — fixed 24 px slot below icons; always present for consistent layout */}
<div className="h-6 flex items-center justify-center">
  {locked && (
    <span className="text-xs text-amber-300 font-bold">🔒</span>
  )}
</div>
```

The `h-6` (24 px) wrapper occupies the same vertical space whether or not the column is locked; no horizontal shift occurs.

**Rationale**: Using a fixed-height placeholder is the simplest approach that satisfies "same width as the column icons (or smaller)" and "place it under the column."

---

### Bug 7 — Currency Conversion: 0 Copper but Gold Available

**Root cause** (reducer.ts `tryBuyIcon`, ~lines 58–70):

The conversion is one-level only. For a copper-cost item when the player has 0 copper:
- `convertibleFrom` for copper = `{ currency: 'silver', rate: 100 }`
- If silver > 0: converts silver → copper → buys. ✓
- If silver = 0 but gold > 0: checks `currencies.silver >= unitsNeeded` (0 >= 1) → **returns false**. ✗

The function does not attempt a second-level conversion (gold → silver → copper).

**Decision**: Refactor the conversion block into a helper that ensures the intermediate currency is also covered before spending, walking up the `convertibleFrom` chain:

```
Ensure the player has enough of `costCurrency`:
  If not: find convertibleFrom source (silver for copper)
    Ensure the player has enough of that source:
      If not: find convertibleFrom source of source (gold for silver)
        If still not enough: return state (cannot afford)
      Convert gold → silver
    Convert silver → copper
  Deduct costAmount from copper
```

Since the chain is at most 2 levels (copper ← silver ← gold), a single recursive call or a simple two-pass loop suffices.

**Currency chain** (from `currencyRegistry.ts`):
- copper: convertibleFrom silver (rate 100: 1 silver = 100 copper)
- silver: convertibleFrom gold (rate 100: 1 gold = 100 silver)
- gold: convertibleFrom null (top of chain)

**Alternatives considered**:
- Generic recursive conversion: clean but over-engineered for a 2-level chain.
- Pre-populate currencies before tryBuyIcon: would need a separate "ensure liquidity" pass.

---

## Persistence Schema Version Bump

Adding `disabledIconIds` to `GameState` requires bumping `CURRENT_VERSION` from `4` to `5`.

**Migration strategy**: In `loadState()`, if `parsed.version === 4`, patch it to version 5 with `disabledIconIds: []` rather than discarding the save. This preserves in-progress games.

---

## Files Touched

| File | Change |
|------|--------|
| `src/game/types.ts` | Add `disabledIconIds: string[]` to `GameState`; add `TOGGLE_ICON` to `GameAction` |
| `src/game/initialState.ts` | Add `disabledIconIds: []`; bump `version` to 5 |
| `src/game/persistence.ts` | Bump `CURRENT_VERSION` to 5; add v4→v5 migration |
| `src/game/spinLogic.ts` | `drawColumn` accepts `disabledIconIds` param; filters pool accordingly |
| `src/game/reducer.ts` | Fix `iconsToMagicCells` (unique IDs); fix `MAGIC_INCREASE_VALUE` (+1 not +cost); remove `lockedColumns: []` from `SPIN`; add `TOGGLE_ICON` handler; fix `tryBuyIcon` (multi-level conversion) |
| `src/game/masterOfElements.ts` | No change needed; fix comes via Bug 1 fix |
| `src/components/ReelColumn.tsx` | Fix respin `pool.map` → `icons.map`; move lock indicator below icons with fixed-height wrapper |
| `src/components/ReelView.tsx` | Add per-icon toggle buttons with enable/disable logic and 12-icon floor |
| `src/components/App.tsx` | Restructure Spin tab controls: always render SpinControls; swap CLAIM/MagicPhasePanel order during magic phase; pass `disabledIconIds` and dispatch `TOGGLE_ICON` |
| `tests/unit/reducer.test.ts` | New tests for TOGGLE_ICON, fixed MAGIC_INCREASE_VALUE, SPIN lock preservation, tryBuyIcon multi-level conversion |
| `tests/unit/spinLogic.test.ts` | New test: `drawColumn` excludes disabled icon IDs |
| `tests/unit/ReelColumn.test.tsx` | New test: respin animation preserves column height |
| `tests/integration/magicPhase.test.tsx` | New test: Boost Value + MoE scenario |
