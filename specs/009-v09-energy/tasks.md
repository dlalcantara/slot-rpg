# Tasks: Version 0.9 — Energy

**Input**: Design documents from `specs/009-v09-energy/`

**Prerequisites**: plan.md ✓, spec.md ✓, research.md ✓, data-model.md ✓

**Tests**: Constitution §II mandates test-first (NON-NEGOTIABLE). Within each user story phase, failing tests are written before implementation.

**Organization**: Tasks grouped by user story (US1–US5). Foundational phase unblocks all stories; user story phases can proceed sequentially after it.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no blocking intra-phase dependencies)
- **[Story]**: Maps to user story from spec.md

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Type additions, catalog/registry entries, and persistence migrations that must compile and be in place before any user-story code can be written. No behavior changes.

**⚠️ CRITICAL**: Complete this phase fully (`tsc --noEmit` exits 0) before starting any Phase 3+ work.

- [X] T001 Update `src/game/types.ts`: add `'energy'` to `CurrencyKey`; add `multiCost: { currency: CurrencyKey; amount: number }[] | null` to `IconDefinition`; add `'starvation'` to `GamePhase`; add `rowCount: 3 | 4 | 5` and `initialSpinPayouts: Payout[] | null` to `GameState`; add `{ type: 'DISMISS_STARVATION' }` variant to `GameAction`
- [X] T002 [P] Update `src/game/achievements.ts`: rename `AchievementId` union members `'wip1'`→`'sweet'` and `'wip2'`→`'nice'`; replace `'ancient-civilization'` with `'blow-it-up'`; update the `ACHIEVEMENTS` metadata map: name/description for `sweet` ("Sweet" / "Earn ≥16 energy in a single spin"), `nice` ("Nice" / "Earn ≥69 energy in a single spin"), and `blow-it-up` ("Blow it up" / "Use the respin action and earn even more as a result") — do NOT add unlock logic yet
- [X] T003 [P] Add `'energy'` entry to `src/game/currencyRegistry.ts`: `{ key: 'energy', label: 'Energy', startingAmount: 0, autoConvertTo: null, convertibleFrom: null, winCondition: null, lossCondition: null }`
- [X] T004 [P] Add `'energy'` icon definition to `src/game/catalog.ts` with `cost: null` and `multiCost: [{ currency: 'gold', amount: 1 }, { currency: 'air', amount: 1 }, { currency: 'water', amount: 1 }, { currency: 'earth', amount: 1 }, { currency: 'fire', amount: 1 }]`; also add `multiCost: null` to all existing icon definitions so the type is satisfied
- [X] T005 [P] Update `src/game/initialState.ts` `makeInitialState()` return value: add `rowCount: 3` and `initialSpinPayouts: null` (copper prestige change deferred to US3 / T019)
- [X] T006 Add migration steps to `src/game/persistence.ts` `loadState()`: (1) if `saved.rowCount` is absent → set `3`; (2) if `saved.initialSpinPayouts` is absent → set `null`; (3) filter `'ancient-civilization'` out of `saved.unlockedAchievements`; (4) replace `'wip1'`→`'sweet'` and `'wip2'`→`'nice'` in `saved.unlockedAchievements`

**Checkpoint**: `tsc --noEmit` exits 0 — user story implementation can now begin

---

## Phase 3: User Story 1 — Energy Icon and Row Expansion (Priority: P1) 🎯 MVP

**Goal**: Purchasable Energy icon with 5-currency cost; energy payout follows product formula; claiming ≥16 energy expands the grid to 4 rows and unlocks "Sweet"; ≥69 expands to 5 rows and unlocks "Nice". Row count persists; resets on prestige.

**Independent Test**: Buy the Energy icon → spin until the spin result includes ≥16 energy → confirm the slot machine visually shows 4 rows → open Achievements → confirm "Sweet" is unlocked. Continue to ≥69 energy → confirm 5 rows and "Nice".

### Tests for User Story 1 ⚠️ Write these FIRST — ensure they FAIL before implementation

- [X] T007 [P] [US1] Add failing tests to `tests/unit/spinLogic.test.ts`: `drawColumn(reel, 4)` returns exactly 4 icons; `drawColumn(reel, 5)` returns exactly 5 icons; reel wraps correctly for both; existing 3-row behavior still passes
- [X] T008 [P] [US1] Add failing tests to `tests/unit/achievements.test.ts`: `checkNewAchievements` called with `claimPayouts` containing energy amount = 16 → `sweet` earned; energy = 69 → both `sweet` and `nice` earned; energy = 15 → neither earned; energy = 69 on first-ever spin (no prior 16) → both earned simultaneously
- [X] T009 [P] [US1] Add failing tests to `tests/unit/reducer.test.ts`: CLAIM with energy payout ≥16 sets `state.rowCount` to 4; CLAIM with energy ≥69 sets `rowCount` to 5; CLAIM with energy 15 leaves `rowCount` unchanged; CLAIM with energy ≥16 when `rowCount` already 4 does not re-fire achievement dialog
- [X] T010 [P] [US1] Add failing integration test to `tests/integration/marketFlow.test.tsx`: player with exactly {gold:1, air:1, water:1, earth:1, fire:1} can successfully buy the Energy icon and all five currencies are deducted; player missing any one of the five cannot buy (button disabled)

### Implementation for User Story 1

- [X] T011 [US1] Refactor `src/game/spinLogic.ts`: rename/replace `extractColumn` with `drawColumn(reel: Reel, startOffset: number, rowCount: number): Icon[]` that draws `rowCount` consecutive icons; update all callers (SPIN handler in reducer.ts) to pass `state.rowCount`
- [X] T012 [US1] Update CLAIM handler in `src/game/reducer.ts`: after `calculatePayouts`, extract energy payout total (product formula, do NOT add to `state.currencies`); if energy ≥16 and `sweet` not yet unlocked, set `rowCount` to max(current, 4); if energy ≥69 and `nice` not yet unlocked, set `rowCount` to max(current, 5); pass `claimPayouts` to `checkNewAchievements`
- [X] T013 [US1] Update `src/game/achievements.ts`: add optional `claimPayouts?: Payout[]` parameter to `checkNewAchievements`; add `sweet` unlock check (`claimPayouts` energy amount ≥16); add `nice` unlock check (energy ≥69); include both `'sweet'` and `'nice'` in the set of non-meta achievements counted toward `'happily-ever-after'`
- [X] T014 [P] [US1] Update `src/components/MarketItem.tsx`: (a) rewrite `canAfford` as a recursive function that mirrors `ensureLiquidity` — if player has enough of the cost currency directly, true; else recurse into `convertibleFrom` chain; (b) add `canAffordMulti(costs, currencies)` check for `multiCost` items (all costs must be independently satisfiable); (c) render the Energy icon when `def.cost === null && def.multiCost !== null` (currently returns null); display all five cost currencies in the cost label
- [X] T015 [P] [US1] Update `src/components/Market.tsx`: pass `multiCost`-aware `canBuyMore` flag for the Energy icon; ensure it appears in the market item list (currently filtered out by `def.cost` check if any)
- [X] T016 [US1] Update `src/components/SlotGrid.tsx`: accept `rowCount: number` prop; render `rowCount` rows per column instead of hardcoded 3; verify layout fits 720×1280 viewport at 4 and 5 rows
- [X] T017 [P] [US1] Update `src/components/CurrencyDisplay.tsx`: filter out `'energy'` from the list of displayed currencies
- [X] T018 [US1] Update `src/App.tsx`: read `state.rowCount`; pass it as prop to `SlotGrid`

**Checkpoint**: Energy icon purchasable, row expansion works, "Sweet"/"Nice" achievements unlock correctly

---

## Phase 4: User Story 3 — Prestige Starting Copper (Priority: P2)

**Purpose**: Implementing US3 before US2 because the auto-prestige in US2 uses `PRESTIGE_STARTING_CURRENCIES`; copper must be there before US2 tests check post-prestige currencies.

**Goal**: After any prestige (regular or auto), player starts with copper=10 alongside food=10, air=10, water=10.

**Independent Test**: Prestige normally → confirm currencies include copper=10, food=10, air=10, water=10 (all others 0).

### Tests for User Story 3 ⚠️ Write FIRST — ensure they FAIL before implementation

- [X] T019 [US3] Add failing test to `tests/unit/reducer.test.ts`: after PRESTIGE action, `state.currencies.copper` equals 10; also verify food=10, air=10, water=10

### Implementation for User Story 3

- [X] T020 [US3] Update `src/game/initialState.ts` `PRESTIGE_STARTING_CURRENCIES`: add `copper: 10` (alongside existing `food: 10`, `air: 10`, `water: 10`)

**Checkpoint**: Prestige starting currencies verified at copper=10

---

## Phase 5: User Story 2 — Auto-Prestige on Food Depletion (Priority: P2)

**Goal**: When food reaches 0 after a claim, the game auto-prestiges (reel resets, currencies reset including copper=10), shows a StarvationModal notification, and resumes play. Game Over screen no longer appears in normal play.

**Independent Test**: Reduce food to 1, spin to 0 food → no Game Over screen → reel resets to {apple, copper, air, water} → currencies reset → StarvationModal appears → dismiss → back to market. Previously unlocked achievements still present.

### Tests for User Story 2 ⚠️ Write FIRST — ensure they FAIL before implementation

- [X] T021 [P] [US2] Add failing tests to `tests/unit/reducer.test.ts`: CLAIM that results in food=0 sets `state.phase` to `'starvation'` (not `'gameover'`); auto-prestige resets reel to exactly {apple, copper, air, water}; currencies reset to `PRESTIGE_STARTING_CURRENCIES` including copper=10; `rowCount` resets to 3; previously unlocked achievements remain; DISMISS_STARVATION action transitions phase to `'market'`
- [X] T022 [P] [US2] Add failing component test for `src/components/StarvationModal.tsx`: renders notification text containing "ran out of food" and "reset"; clicking dismiss fires the dismiss callback

### Implementation for User Story 2

- [X] T023 [US2] Update `src/game/reducer.ts`: in the CLAIM handler, replace the `checkPhase → 'gameover'` path for food=0 with auto-prestige: reset reel to {apple, copper, air, water}, reset currencies to `PRESTIGE_STARTING_CURRENCIES`, reset `rowCount` to 3, set `phase: 'starvation'`, preserve `unlockedAchievements`; do NOT call achievement checks for prestige-type achievements during auto-prestige; add `DISMISS_STARVATION` case that sets `phase: 'market'`
- [X] T024 [US2] Create `src/components/StarvationModal.tsx`: overlay dialog with message "You ran out of food. The slot machine has been reset." and a single dismiss button; same visual pattern as existing modals (WinModal, GameOverScreen)
- [X] T025 [US2] Update `src/App.tsx`: when `state.phase === 'starvation'`, render `StarvationModal`; wire dismiss button to dispatch `{ type: 'DISMISS_STARVATION' }`

**Checkpoint**: Auto-prestige fires on food=0; StarvationModal appears and dismisses cleanly; GameOver screen never reachable in normal play

---

## Phase 6: User Story 4 — Bug Fixes (Priority: P3)

**Goal**: Fix four correctness bugs: "Second Breakfast" and "Master of Elements" check payout amounts (not grid presence); multi-level currency conversion (gold→silver→copper) works in the UI; "I Understand It Now" has correct description.

**Independent Test**: (a) Spin with apple in 2 columns but no column group → "Second Breakfast" does not fire. Spin with apple payout ≥2 → fires. (b) Same for MoE. (c) With 0 copper, 0 silver, 2 gold → Buy copper-cost item → succeeds. (d) Prestige keeping copper-only icons → "I Understand It Now" does not fire; prestige keeping silver-cost icon → fires.

### Tests for User Story 4 ⚠️ Write FIRST — ensure they FAIL before implementation

- [X] T026 [P] [US4] Add failing tests to `tests/unit/achievements.test.ts`: `checkNewAchievements` with `claimPayouts` containing apple-family amount=1 → `second-breakfast` NOT earned; apple-family amount=2 → earned; apple icons present in grid but payout=1 → NOT earned
- [X] T027 [P] [US4] Add failing tests to `tests/unit/achievements.test.ts`: `checkNewAchievements` with `claimPayouts` containing only 3 of 4 element families → `master-of-elements` NOT earned; all 4 element families in claimPayouts → earned; all 4 elements in spin grid but only 3 produce payout → NOT earned
- [X] T028 [P] [US4] Add failing integration test to `tests/integration/marketFlow.test.tsx`: player with `{ copper: 0, silver: 0, gold: 2 }` — the Buy button for a 1-copper-cost item is enabled; dispatching BUY succeeds and gold decreases (via gold→silver→copper conversion chain); verify `canAfford` returns true for this scenario
- [X] T029 [P] [US4] Add test to `tests/unit/achievements.test.ts`: verify `ACHIEVEMENTS['i-understand-it-now'].description` equals `"Prestige keeping an icon that costs at least 1 silver"`

### Implementation for User Story 4

- [X] T030 [US4] Fix `second-breakfast` in `src/game/achievements.ts`: replace the grid icon-count check with `(claimPayouts ?? []).find(p => p.family === 'apple')?.amount ?? 0) >= 2`
- [X] T031 [US4] Fix `master-of-elements` in `src/game/achievements.ts`: replace the spin-grid family-presence check with a check that all four of `['air', 'water', 'earth', 'fire']` have an entry in `claimPayouts`
- [X] T032 [US4] Fix `i-understand-it-now` description in `src/game/achievements.ts`: update the description string to `"Prestige keeping an icon that costs at least 1 silver"` (unlock condition is already correct — no logic change needed)

**Checkpoint**: All four bug fixes verified; achievement tests pass; multi-level conversion integration test passes

---

## Phase 7: User Story 5 — "Blow it up" Achievement (Priority: P3)

**Goal**: "Blow it up" unlocks when the player uses the magic/respin phase, the initial spin result was non-zero, and the final claimed result totals strictly more resources than the initial spin. "Ancient Civilization" is replaced and does not carry over.

**Independent Test**: Get a non-zero initial spin → use magic → improve the result → claim → confirm "Blow it up" unlocks. Repeat with zero initial spin → use magic → confirm it does NOT unlock.

### Tests for User Story 5 ⚠️ Write FIRST — ensure they FAIL before implementation

- [X] T033 [P] [US5] Add failing tests to `tests/unit/achievements.test.ts`: `checkNewAchievements` with `prevState.phase='magic'`, `initialSpinPayouts` total=5, `claimPayouts` total=8 → `blow-it-up` earned; same but `claimPayouts` total=5 (equal) → NOT earned; `claimPayouts` total=3 (less) → NOT earned; `prevState.phase='spinning'` (magic not used) → NOT earned; `initialSpinPayouts` total=0 (original was zero) → NOT earned
- [X] T034 [P] [US5] Add failing tests to `tests/unit/reducer.test.ts`: after SPIN action completes, `state.initialSpinPayouts` is set to the computed payouts for that spin (non-null); after CLAIM, `state.initialSpinPayouts` is reset to null; after prestige, `state.initialSpinPayouts` is null

### Implementation for User Story 5

- [X] T035 [US5] Update SPIN case in `src/game/reducer.ts`: after calling `calculatePayouts` to produce the initial spin result, set `state.initialSpinPayouts` to those payouts; clear `state.initialSpinPayouts` to `null` in CLAIM, PRESTIGE, and DISMISS_STARVATION handlers
- [X] T036 [US5] Add `blow-it-up` unlock check to `src/game/achievements.ts` `checkNewAchievements`: condition is `prevState.phase === 'magic'` AND `sum(prevState.initialSpinPayouts ?? []) > 0` AND `sum(claimPayouts ?? []) > sum(prevState.initialSpinPayouts ?? [])`; where sum is total of all `.amount` values across payouts

**Checkpoint**: "Blow it up" unlocks under the correct conditions; edge cases (zero initial, equal totals, no magic) confirmed non-triggering

---

## Phase 8: Polish & Gates

**Purpose**: Final quality gates across all user stories.

- [X] T037 [P] Review layout at 720×1280 px with 4-row and 5-row grids — confirm no overflow or truncation in `src/components/SlotGrid.tsx`
- [X] T038 **[GATE 1] Typecheck** — run `tsc --noEmit`; exits 0 with zero errors (blocks next gates)
- [X] T039 **[GATE 2] Lint** — run ESLint; exits 0 with zero errors
- [X] T040 **[GATE 3] Unit Tests** — run `vitest run tests/unit`; all tests pass
- [X] T041 **[GATE 4] Integration Tests** — run `vitest run tests/integration`; all tests pass
- [X] T042 **[GATE 5] Build** — run `vite build`; production bundle compiles cleanly
- [X] T043 **[GATE 6] Bundle Size** — gzipped JS bundle ≤ 250 KB; report delta vs. pre-v09 baseline in PR description

---

## Dependencies & Execution Order

### Phase Dependencies

- **Foundational (Phase 2)**: No dependencies — start immediately
- **US1 (Phase 3)**: Depends on Phase 2 completing — highest priority, start immediately after
- **US3 (Phase 4)**: Depends on Phase 2; independent of US1 — can proceed in parallel with US1 if needed
- **US2 (Phase 5)**: Depends on Phase 2 AND US3 (auto-prestige uses `PRESTIGE_STARTING_CURRENCIES` with copper=10)
- **US4 (Phase 6)**: Depends on Phase 2 AND US1 (uses `claimPayouts` param added in US1); canAfford integration test from T028 verifies the fix already applied in T014
- **US5 (Phase 7)**: Depends on Phase 2 AND US1 (uses `claimPayouts` param); T035 depends on US1's SPIN/CLAIM structure already in place
- **Polish (Phase 8)**: Depends on all desired user stories complete

### User Story Dependencies

- **US1 (P1)**: Can start immediately after Foundational
- **US3 (P2)**: Can start after Foundational; single-file, single-line change
- **US2 (P2)**: Must come after US3 (copper prestige currency)
- **US4 (P3)**: Must come after US1 (claimPayouts parameter)
- **US5 (P3)**: Must come after US1 (initialSpinPayouts type, CLAIM structure); independent of US2/US4

### Within Each User Story

- Tests MUST be written and confirmed FAILING before implementation begins
- T011 (spinLogic.ts parameterization) before T012 (reducer uses new drawColumn)
- T012 (claimPayouts in reducer) before T013 (achievements reads claimPayouts)
- T014+T015 (market components) can be done in parallel with T011–T013
- T016 (SlotGrid) after T011 (rowCount is now meaningful)
- T018 (App.tsx rowCount) after T016

### Files Modified in Multiple Phases

| File | Phases | Notes |
|---|---|---|
| `src/game/reducer.ts` | US1 (T012), US2 (T023), US5 (T035) | Different sections; apply in phase order |
| `src/game/achievements.ts` | Phase 2 (T002), US1 (T013), US4 (T030–T032), US5 (T036) | Additive; T002 is metadata only, logic added later |
| `src/App.tsx` | US1 (T018), US2 (T025) | Different additions; US1 rowCount prop, US2 modal |
| `tests/unit/reducer.test.ts` | US1 (T009), US3 (T019), US2 (T021), US5 (T034) | Each phase adds new test cases |
| `tests/unit/achievements.test.ts` | US1 (T008), US4 (T026–T027, T029), US5 (T033) | Each phase adds new test cases |

---

## Parallel Opportunities

### Phase 2 (Foundational)

```
Parallel after T001 completes:
  T002  achievements.ts AchievementId metadata
  T003  currencyRegistry.ts energy entry
  T004  catalog.ts energy icon
  T005  initialState.ts rowCount + initialSpinPayouts
Then: T006  persistence.ts migrations
```

### Phase 3 (US1) — Tests

```
All four failing-test tasks can run in parallel:
  T007  spinLogic.test.ts
  T008  achievements.test.ts sweet/nice
  T009  reducer.test.ts rowCount
  T010  marketFlow.test.tsx energy purchase
```

### Phase 3 (US1) — Implementation

```
After T011 (spinLogic):
  T012  reducer.ts CLAIM energy
  T016  SlotGrid.tsx rowCount rows
  (T014, T015, T017 can run in parallel with T012)
After T012:
  T013  achievements.ts sweet/nice logic
After T016:
  T018  App.tsx rowCount prop
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 2: Foundational
2. Complete Phase 3: US1 — Energy icon + row expansion
3. **STOP and VALIDATE**: Energy icon purchasable, rows expand, Sweet/Nice unlock
4. Ship/demo if ready

### Incremental Delivery

1. Phase 2 → Foundation compiles ✓
2. Phase 3 (US1) → Energy icon live, row expansion works ✓
3. Phase 4 (US3) → Prestige copper ✓
4. Phase 5 (US2) → Auto-prestige on starvation ✓
5. Phase 6 (US4) → Four bug fixes ✓
6. Phase 7 (US5) → "Blow it up" achievement ✓
7. Phase 8 → All gates green → PR ready

---

## Summary

| Phase | User Story | Tasks | Notes |
|---|---|---|---|
| Phase 2 | Foundational | T001–T006 (6) | Blocks everything |
| Phase 3 | US1 Energy + Rows | T007–T018 (12) | MVP; 4 tests + 8 impl |
| Phase 4 | US3 Prestige Copper | T019–T020 (2) | Must precede US2 |
| Phase 5 | US2 Auto-Prestige | T021–T025 (5) | 2 tests + 3 impl |
| Phase 6 | US4 Bug Fixes | T026–T032 (7) | 4 tests + 3 impl |
| Phase 7 | US5 Blow it up | T033–T036 (4) | 2 tests + 2 impl |
| Phase 8 | Polish/Gates | T037–T043 (7) | 1 layout check + 6 gates |
| **Total** | | **43 tasks** | |
