# Research: Magic Elements (v0.4)

**Date**: 2026-06-07 | **Branch**: `004-magic-elements`

---

## 1. Magic Phase State Architecture

**Decision**: Introduce a `magicGrid: MagicCell[][]` field on `GameState` that holds the
mutable column layout during the Magic Phase. A `MagicCell` is `{ icon: Icon; valueOverride?: number }`.
Magic actions modify `magicGrid` in place (via reducer). CLAIM reads from `magicGrid` to compute
payouts.

**Rationale**: The existing `SpinResult.columns: Icon[][]` is immutable and used only for display.
A separate mutable grid avoids mutating `SpinResult` and keeps the reducer pure. `valueOverride`
allows "Increase Card Value" without needing new `IconDefinition` records per instance.

**Alternatives considered**:
- Mutating `SpinResult.columns` directly — rejected because SpinResult is passed to display
  components and treated as a final record.
- Storing individual cell value deltas in a side map — equivalent complexity, less readable.

---

## 2. GamePhase Extension

**Decision**: Extend `GamePhase` to `'market' | 'spinning' | 'magic' | 'gameover' | 'win'`.
`SPIN` action transitions `market → spinning`; the existing `onSpinDone` callback (fired by
`SlotGrid` after animation) transitions `spinning → magic` via a new `BEGIN_MAGIC_PHASE` action.
`CLAIM` transitions `magic → market` (or `gameover`/`win`).

**Rationale**: Keeps the phase machine explicit and consistent with existing pattern. The
`spinning` phase is already controlled by the UI animation callback, so threading `BEGIN_MAGIC_PHASE`
through the same path is zero extra complexity.

**Alternatives considered**:
- Using a boolean `isMagicPhase` flag — rejected to avoid phase-state duplication that could
  go out of sync.

---

## 3. SPIN Action Redesign

**Decision**: The `SPIN` reducer action generates columns but does **not** compute payouts. It
stores columns in `magicGrid` and sets `phase = 'spinning'`. Payout computation moves to `CLAIM`.

**Rationale**: Payouts must reflect magic-altered grid state. Moving computation to CLAIM is the
minimal change: `calculatePayouts` already accepts `Icon[][]` and is exported from `spinLogic.ts`.
`MagicCell[][]` → `Icon[][]` projection is a one-liner (strip `valueOverride` after applying it).

---

## 4. Magic Action Cost Counters

**Decision**: Store per-phase counters in `GameState.magicCounters: { respin: number; swap: number; increaseValue: number }`.
These reset to `{ respin: 0, swap: 0, increaseValue: 0 }` at `BEGIN_MAGIC_PHASE`.
Lock cost is computed from `lockedColumns.length` at action time, not a counter.

**Rationale**: Matches spec precisely. Counters on `GameState` are persisted to localStorage,
which is correct (a page refresh during magic phase should preserve progress).

---

## 5. Column Locking

**Decision**: `GameState.lockedColumns: number[]` holds indices (0–4) of locked columns.
Locks are cleared in the `SPIN` reducer before generating new columns (so locked columns
keep their icons but the lock itself is consumed). The `SlotGrid` component receives
`lockedColumns` as a prop and skips animation + shows a lock badge for those columns.

**Rationale**: Spec says locks clear when SPIN is pressed. Clearing in the reducer at SPIN
time (before column generation) is the right moment: the lock protects the column's icons
during that spin, then clears.

---

## 6. Increase Card Value Implementation

**Decision**: `MAGIC_INCREASE_VALUE` action takes `{ colIdx, rowIdx }` and adds
`magicCounters.increaseValue + 1` to the cell's effective value. The Nth use of increase-value
(across all cells this magic phase) adds N to the target cell's value. Values are additive on
top of the icon's base `valuePerColumn` — so a triple-apple (base 3) increased on the 1st use
becomes 4, on a 2nd use (anywhere) becomes 5, etc.

**Rationale**: Flat additive increments keep the mechanic intuitive for high-value icons like
triple-apple (3) and dozen-apple (12) — doubling would make dozen-apple wildly overpowered on
a single Fire spend. Additive +N also makes the escalating Fire cost feel proportional.

**Alternatives considered**:
- Multiply by base value (double then triple) — rejected; makes dozen-apple (12) reach 144
  on two Fire, far exceeding the cost of 1+2=3 Fire.
- Fixed +1 per use regardless of counter — simpler but inconsistent with how other magic
  cost counters work (they escalate, so the value gain should too).

---

## 7. Elemental Icon Definitions

**Decision**: Add four new `IconDefinition` entries to `catalog.ts`:

| definitionId | family   | valuePerColumn | effect currency | cost                |
|--------------|----------|---------------|-----------------|---------------------|
| `air`        | `air`    | 1             | `air`           | copper × 10         |
| `water`      | `water`  | 1             | `water`         | silver × 1          |
| `earth`      | `earth`  | 1             | `earth`         | silver × 10         |
| `fire`       | `fire`   | 1             | `fire`          | gold × 1            |

**Rationale**: Follows exact market prices from spec. `valuePerColumn: 1` gives single-icon
payout; the Master of Elements condition is checked independently of payout value.

---

## 8. Elemental Currency Definitions

**Decision**: Add four `CurrencyDefinition` entries to `currencyRegistry.ts`:
`air`, `water`, `earth`, `fire` — all `startingAmount: 0`, no auto-convert, no win/loss
conditions, no convertibleFrom.

**Rationale**: Elemental currencies are independent resources; they don't participate in the
copper → silver → gold auto-convert chain.

---

## 9. Starting Reel Update

**Decision**: Change `initialState.ts` from `[blank, blank, apple, copper]` to
`[blank, apple, copper, air]`.

**Rationale**: Spec FR-003. Air is already in the starting reel, so the player can earn Air
currency from the first spin without a market purchase. The second blank is removed.

---

## 10. Master of Elements Detection

**Decision**: New file `src/game/masterOfElements.ts` exports
`detectMasterOfElements(columns: Icon[][]): boolean`. Counts icons per elemental family across
all cells; returns `true` if Air ≥ 3 AND Water ≥ 3 AND Earth ≥ 3 AND Fire ≥ 3.
Called from the `CLAIM` reducer. Stores result in `GameState.masterOfElements: boolean`.

**Rationale**: Small, pure function — easy to unit-test. Keeping it separate from
`spinLogic.ts` preserves single-responsibility.

---

## 11. Notable Result / Results Modal Update

**Decision**: Update `notableResult.ts`:
- For `copper`, `silver`, `gold`: compute combined money delta as
  `Δcombined = 10000·Δgold + 100·Δsilver + Δcopper` and compare against
  `10000·prevGold + 100·prevSilver + prevCopper`. Show modal if `Δcombined / prevCombined > 0.20`
  (or if `prevCombined === 0`).
- For all other currencies (including elemental and food): keep existing per-key logic.
- Remove the existing `crowns` special case — crowns now follows standard per-key logic
  (any gain if prev=0, else > 20% gain).

**Rationale**: Directly implements spec FR-015/FR-016. Consolidating money into a single
signal prevents a 99-copper gain on a 1-gold wallet triggering the modal.

---

## 12. localStorage Migration

**Decision**: Bump `GameState.version` from `3` to `4`. In `persistence.ts` / `loadState`,
if stored version is `< 4`, discard and return `null` (triggers `makeInitialState()`).

**Rationale**: New fields (`magicGrid`, `lockedColumns`, `magicCounters`, `masterOfElements`,
new currencies) cannot be safely hydrated from a v3 save. A clean reset is the safest path
for a side-project game with no migration budget.
