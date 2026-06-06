# Contract: Reducer Actions (Magic Phase)

**Date**: 2026-06-07 | **Branch**: `004-magic-elements`

These contracts describe the pre/post conditions for each new and modified reducer action.

---

## SPIN (modified)

**Pre-conditions**:
- `state.phase === 'market'`
- `state.currencies.food >= multiplier`

**Post-conditions**:
- `state.phase === 'spinning'`
- `state.lockedColumns` is unchanged (locks protect the next spin's columns)
- `state.magicGrid` is populated with 5 columns generated from `computeSpin` **except** locked
  columns which retain their previous `magicGrid` content
- `state.magicCounters` is NOT reset yet (reset happens at `BEGIN_MAGIC_PHASE`)
- `state.currencies.food` decremented by `multiplier`
- No payouts computed yet

---

## BEGIN_MAGIC_PHASE

**Pre-conditions**:
- `state.phase === 'spinning'` (fired by `onSpinDone` animation callback)

**Post-conditions**:
- `state.phase === 'magic'`
- `state.magicCounters` reset to `{ respin: 0, swap: 0, increaseValue: 0 }`
- `state.lockedColumns` cleared to `[]`

---

## MAGIC_RESPIN `{ colIdx: number }`

**Pre-conditions**:
- `state.phase === 'magic'`
- `colIdx` in `[0, 4]`
- `state.currencies.air >= state.magicCounters.respin + 1`

**Post-conditions**:
- `state.magicGrid[colIdx]` replaced with a freshly drawn column from `state.reel`
- `state.currencies.air` decremented by `state.magicCounters.respin + 1`
- `state.magicCounters.respin` incremented by 1

---

## MAGIC_SWAP `{ fromCol, fromRow, toCol, toRow }`

**Pre-conditions**:
- `state.phase === 'magic'`
- Cells are adjacent: `|fromCol - toCol| + |fromRow - toRow| === 1`
- `state.currencies.water >= state.magicCounters.swap + 1`

**Post-conditions**:
- `state.magicGrid[fromCol][fromRow]` and `state.magicGrid[toCol][toRow]` swapped
- `state.currencies.water` decremented by `state.magicCounters.swap + 1`
- `state.magicCounters.swap` incremented by 1

---

## MAGIC_LOCK `{ colIdx: number }`

**Pre-conditions**:
- `state.phase === 'magic'`
- `colIdx` in `[0, 4]`
- `colIdx` not already in `state.lockedColumns`
- `state.lockedColumns.length < 3`
- `state.currencies.earth >= state.lockedColumns.length + 1`

**Post-conditions**:
- `colIdx` appended to `state.lockedColumns`
- `state.currencies.earth` decremented by `state.lockedColumns.length` (the pre-action length + 1)

---

## MAGIC_INCREASE_VALUE `{ colIdx: number; rowIdx: number }`

**Pre-conditions**:
- `state.phase === 'magic'`
- `state.currencies.fire >= state.magicCounters.increaseValue + 1`
- Target cell is not blank (`family !== 'blank'`)

**Post-conditions**:
- Let `N = state.magicCounters.increaseValue + 1` (the increment amount for this use)
- `state.magicGrid[colIdx][rowIdx].valueOverride` set to
  `(current valueOverride ?? base valuePerColumn) + N`
- `state.currencies.fire` decremented by `N`
- `state.magicCounters.increaseValue` incremented by 1

---

## CLAIM

**Pre-conditions**:
- `state.phase === 'magic'`

**Post-conditions**:
- Payouts computed from `state.magicGrid` (with value overrides applied)
- `state.currencies` updated with payout amounts × multiplier (multiplier stored from SPIN)
- Auto-convert applied if `settings.autoConvert`
- `state.masterOfElements` set to `true` if `detectMasterOfElements(state.magicGrid)` returns `true`
- `state.lastSpinResult` updated with final columns and payouts
- `state.magicGrid` set to `null`
- `state.phase` transitions to `'market'`, `'gameover'`, or `'win'`
- Game log entry appended
- State persisted to localStorage
