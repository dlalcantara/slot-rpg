# Research: Version 0.9 — Energy

## Energy as a Currency Type

**Decision**: Add `'energy'` to the `CurrencyKey` union and add an `energy` entry to `CURRENCY_REGISTRY`. In the CLAIM handler, intercept energy payouts before they are added to `state.currencies`, use the energy total to check row-expansion thresholds, then discard it (do not persist to state).

**Rationale**: Reusing the existing payout infrastructure (`calculatePayouts` product formula) avoids a parallel energy-computation path. Filtering it in the CLAIM handler keeps `state.currencies` clean without requiring a new effect type.

**Alternatives considered**:
- New `IconEffect` type `{ type: 'add_energy' }` — would require modifying `calculatePayouts`; more code churn for no gain.
- Store energy in `state.currencies` and reset after checking — transient state in a persisted record; risk of wrong values on mid-spin saves.

---

## Multi-Currency Icon Cost

**Decision**: Add `multiCost: { currency: CurrencyKey; amount: number }[] | null` to `IconDefinition`. When `multiCost` is non-null, it is the authoritative cost; `cost` is set to `null`. Both `tryBuyIcon` in `reducer.ts` and the `canAfford` / display logic in `MarketItem.tsx` check for `multiCost` before falling back to `cost`.

**Rationale**: Additive field keeps all 14 existing icons unchanged. TypeScript union over `cost | multiCost` naturally models the two cases. No catalog migration required.

**Alternatives considered**:
- Change `cost` to `{ currency: CurrencyKey; amount: number }[]` (array everywhere) — would require updating every catalog entry and all callers; unnecessary churn.
- Separate `EnergyCost` interface — over-engineered for a single new icon; multi-cost field is sufficient for the foreseeable future.

---

## Row Count in Game State

**Decision**: Add `rowCount: 3 | 4 | 5` to `GameState` (default 3). Pass it to `drawColumn(reel, rowCount)` in the SPIN case, which passes it to `extractColumn`. Render `rowCount` rows per column in `SlotGrid`. Reset to 3 on any prestige (regular or auto).

**Rationale**: Row count is the minimal piece of state needed; no other data structure changes are required. The literal union `3 | 4 | 5` prevents invalid values at compile time.

**Alternatives considered**:
- Derive row count from unlocked achievements — coupling achievements to rendering logic; harder to test independently.
- Render all 5 rows always and hide unused ones — confuses the payout formula which counts all visible icons.

---

## Auto-Prestige Flow (Starvation)

**Decision**: Add `'starvation'` to `GamePhase`. When `checkPhase` returns `'gameover'` in the CLAIM handler, instead of assigning `phase: 'gameover'`, execute the auto-prestige immediately (reset reel to {apple, copper, air, water}, reset currencies to prestige starting amounts, reset `rowCount` to 3), then set `phase: 'starvation'`. App.tsx renders `StarvationModal` when `phase === 'starvation'`. A new `DISMISS_STARVATION` action transitions to `'market'`.

**Rationale**: Phase-driven modal display is consistent with how `WinModal` and `GameOverScreen` work. The `'gameover'` transition path is effectively replaced — `GameOverScreen` will never be reached during normal play. The `'gameover'` phase and `GameOverScreen` component are retained for backward-compat with saved games.

**Alternatives considered**:
- Boolean flag `autoPrestigeNotification: boolean` on `GameState` — less discoverable; a phase communicates intent clearly.
- Keep `'gameover'` phase and show different content based on a flag — conflates two distinct states.

---

## `canAfford` Recursive Fix

**Decision**: Rewrite `canAfford` in `MarketItem.tsx` as a recursive function that mirrors the `ensureLiquidity` logic: given a currency and amount needed, check if the player has enough directly, else recurse into the `convertibleFrom` chain. Handle `multiCost` by checking all costs independently and returning `true` only if all are satisfiable.

**Rationale**: The current one-level check means the Buy button incorrectly appears disabled for players with gold but no silver/copper. Mirroring `ensureLiquidity` keeps the UI and reducer in sync without extracting a shared utility (the function is small and self-contained).

**Alternatives considered**:
- Extract `ensureLiquidity` to a shared `currency.ts` and import into both files — valid if more callers emerge, but premature for one fix.
- Always enable the button and let the reducer reject — poor UX; disabled state is informative.

---

## `checkNewAchievements` — Payouts Parameter

**Decision**: Add an optional `claimPayouts?: Payout[]` parameter to `checkNewAchievements`. The CLAIM case in `reducer.ts` passes `rawPayouts` when calling `checkNewAchievements`. "Second Breakfast" checks `claimPayouts.find(p => p.family === 'apple')?.amount >= 2`. "Master of Elements" checks that all four element families have a payout entry. "Sweet" and "Nice" check the energy payout amount against 16 and 69.

**Rationale**: Payouts already exist in the CLAIM handler; threading them to `checkNewAchievements` avoids recomputing them or encoding the check in the state diff. Optional parameter keeps backward-compat for non-CLAIM calls.

**Alternatives considered**:
- Derive from `newState.currencies - prevState.currencies` — fragile when other food sources exist; energy is never added to currencies so it can't be derived this way.
- Embed payouts in the `CLAIM` action type — leaks internal computation details into the public action shape.

---

## "Sweet" / "Nice" — Replace WIP1 / WIP2

**Decision**: Rename `AchievementId` members `'wip1'` → `'sweet'` and `'wip2'` → `'nice'`. Update `ACHIEVEMENTS` entries. Add unlock checks: `'sweet'` when energy payout ≥ 16 (first time); `'nice'` when energy payout ≥ 69. The `NON_META_ACHIEVEMENT_IDS` filter for `happily-ever-after` now includes `'sweet'` and `'nice'` (they are no longer WIP).

**Rationale**: IDs are persisted in `unlockedAchievements`. Renaming requires a persistence migration for any saves that contain `'wip1'` or `'wip2'` (since those were WIP and thus theoretically never unlocked, migration is a no-op in practice, but a safety migration is still added).
