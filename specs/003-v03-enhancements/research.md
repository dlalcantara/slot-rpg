# Research: Version 0.3 Enhancements

**Date**: 2026-06-06

## 1. Deferred Currency Bar Display

**Decision**: Maintain `displayedCurrencies` in React state in `App.tsx`, separate from `state.currencies` (which the reducer updates immediately). Update `displayedCurrencies` only after the spin animation ends AND the modal is dismissed (if one was shown).

**Rationale**: The reducer must remain a pure function and cannot hold UI timing state. Keeping a parallel display value in component state is the minimal change that preserves purity while satisfying the requirement. Alternatives like `pendingCurrencies` in GameState would bleed UI concern into the data model.

**Alternatives considered**:
- Store `pendingCurrencies` in GameState — rejected: conflates UI timing with game state; complicates persistence and migration.
- Use a React context/ref to delay the render — rejected: more complex than a single `useState`.

## 2. Spin Multiplier Mechanics

**Decision**: Add `multiplier: 1 | 10 | 100` parameter to the `SPIN` action. The reducer calls `computeSpin()` once, then multiplies each `payout.amount` by the multiplier before applying. Apple cost = `multiplier * 1`.

**Rationale**: Re-using one spin and scaling payouts preserves all existing win condition and auto-convert logic unchanged. It correctly models "one spin, amplified stakes" rather than "many spins compressed".

**Alternatives considered**:
- Run `computeSpin()` N times — rejected: changes game log semantics (one action = one entry) and is slower for x100.
- Store multiplier in GameState — rejected: it's a UI setting, not a game model concern. Stored in `PlayerSettings`.

## 3. Notable Result Detection (Modal Trigger)

**Decision**: Compute "notable" in `App.tsx` (not the reducer) by comparing `state.currencies` before and after the spin. A result is notable if: any currency (food, copper, silver, gold) gained > 20% of the pre-spin balance for that currency, OR crowns increased.

**Rationale**: The reducer already stores `lastSpinResult`. The delta can be derived by comparing pre/post currencies in App state. Keeping this logic in the component layer avoids encoding UI presentation rules in the data model.

**Edge case**: If pre-spin balance is 0 for a currency, any gain is treated as notable (division-by-zero guard: use `gain > 0` when balance is 0).

## 4. Auto-Convert Toggle

**Decision**: Add `autoConvert: boolean` to `PlayerSettings`. In `reducer.ts`, gate `applyAutoConversions()` behind `action.settings.autoConvert` (passed in with the SPIN action) or read from state.settings.

**Rationale**: Simplest integration point — `applyAutoConversions` is already an isolated function in the reducer. Passing settings on the action avoids a separate `UPDATE_SETTINGS` action race condition.

**Implementation note**: Settings are stored in `GameState.settings` and persisted. The SPIN action reads `state.settings.autoConvert` directly.

## 5. Animate Toggle

**Decision**: `animate: boolean` in `PlayerSettings`, read in `SlotGrid`/`ReelColumn`. When false, skip `setInterval` cycling and immediately show final result matrix; still call `onSpinDone` synchronously.

**Rationale**: The animation is entirely in component state (`useEffect` + `setInterval`). Passing `animate` as a prop is sufficient — no reducer involvement needed.

## 6. Game Log

**Decision**: Store `gameLog: SpinLogEntry[]` in `GameState` (max 10 entries, prepend on each spin, trim tail). Persist alongside other state.

**Rationale**: Persisting in GameState reuses the existing `saveState` call in the reducer with no additional storage logic. The 10-entry cap keeps the stored payload small.

**SpinLogEntry shape**: `{ spinNumber, multiplier, payouts, timestamp }` — enough to render "Spin #12 (x10): +50 food, +3 copper" without re-deriving from other state.

## 7. Market Alternate Denomination Display

**Decision**: In `MarketItem.tsx`, if an item costs silver or gold, compute and display the copper/silver equivalent inline under the primary price. Rates: 1 silver = 100 copper; 1 gold = 100 silver = 10,000 copper.

**Rationale**: Pure display logic; no data model changes required. The conversion rates are already encoded in `CURRENCY_REGISTRY.autoConvertTo.rate` (100 for both copper→silver and silver→gold).

## 8. State Migration v2 → v3

**Decision**: Add migration branch in `loadState()`: if `parsed.version === 2`, inject `settings: DEFAULT_SETTINGS` and `gameLog: []` before returning.

**Rationale**: Consistent with the existing v1→v2 migration pattern already in `persistence.ts`.

## 9. Crown Catalog Price

**Decision**: Change `crown.cost` in `catalog.ts` from `{ currency: 'gold', amount: 10 }` to `{ currency: 'gold', amount: 100 }`.

**Rationale**: Direct data fix; no structural changes needed.
