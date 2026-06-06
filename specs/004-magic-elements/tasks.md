# Tasks: Magic Elements (v0.4)

**Input**: Design documents from `specs/004-magic-elements/`

**Prerequisites**: plan.md ✅ spec.md ✅ research.md ✅ data-model.md ✅ contracts/ ✅

**Tests**: Included — constitution mandates test-first (Red-Green-Refactor) for all non-trivial logic.

**Organization**: Tasks grouped by user story for independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: User story label (US1–US5)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Type system and persistence groundwork that everything else depends on.

- [ ] T001 Extend `GamePhase` union in `src/game/types.ts` to include `'magic'`
- [ ] T002 Add `MagicCell`, `MagicCounters` interfaces and extend `GameState` with `magicGrid`, `lockedColumns`, `magicCounters`, `masterOfElements` fields in `src/game/types.ts`
- [ ] T003 Add new `GameAction` variants (`BEGIN_MAGIC_PHASE`, `MAGIC_RESPIN`, `MAGIC_SWAP`, `MAGIC_LOCK`, `MAGIC_INCREASE_VALUE`, `CLAIM`) to the union in `src/game/types.ts`
- [ ] T004 Bump `GameState.version` from `3` to `4` and update `makeInitialState` to include new fields (`magicGrid: null`, `lockedColumns: []`, `magicCounters: {respin:0,swap:0,increaseValue:0}`, `masterOfElements: false`) in `src/game/initialState.ts`
- [ ] T005 Update `loadState` in `src/game/persistence.ts` to discard stored state with `version < 4` and return `null`

**Checkpoint**: Type system and persistence migration ready — no runtime changes yet.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Catalog and registry data that all user stories depend on. Can land without visible game changes.

**⚠️ CRITICAL**: Complete before any user story implementation.

- [ ] T006 [P] Add `air`, `water`, `earth`, `fire` `IconDefinition` entries to `src/game/catalog.ts` with correct costs (air: copper×10, water: silver×1, earth: silver×10, fire: gold×1) and `add_currency` effects
- [ ] T007 [P] Add `air`, `water`, `earth`, `fire` `CurrencyDefinition` entries to `src/game/currencyRegistry.ts` (startingAmount: 0, no auto-convert, no win/loss conditions); append to `CURRENCY_ORDER`
- [ ] T008 Update starting reel in `src/game/initialState.ts` from `[blank, blank, apple, copper]` to `[blank, apple, copper, air]`

**Checkpoint**: Catalog and registry ready — foundational data complete.

---

## Phase 3: User Story 1 — Add Elemental Icons to Reels and Earn Currencies (Priority: P1) 🎯 MVP

**Goal**: Player can purchase elemental icons in the Market (spending money), see them in their reel, and earn elemental currency when they land in a spin.

**Independent Test**: Purchase Air in Market → verify copper decreases and Air icon appears in reel view → spin until Air lands → verify Air currency balance increases.

### Tests for User Story 1 ⚠️ Write FIRST — confirm they FAIL before implementing

- [ ] T009 [P] [US1] Unit test: purchasing each elemental icon deducts correct money and appends icon to reel (no currency awarded yet) in `tests/unit/catalog.test.ts`
- [ ] T010 [P] [US1] Unit test: `calculatePayouts` awards elemental currency when elemental family appears in all 5 columns in `tests/unit/spinLogic.test.ts`
- [ ] T011 [P] [US1] Unit test: Currency tab renders all 7 currencies (Copper, Silver, Gold, Air, Water, Earth, Fire) in `tests/unit/CurrencyDisplay.test.tsx`

### Implementation for User Story 1

- [ ] T012 [US1] Update `CurrencyDisplay` component in `src/components/CurrencyDisplay.tsx` to render Air, Water, Earth, Fire balances alongside existing currencies (depends on T007)
- [ ] T013 [US1] Add four elemental market item cards to `src/components/Market.tsx` using existing `MarketItem` pattern (depends on T006)

**Checkpoint**: US1 fully functional — elemental icons purchasable, appear in reel, award currency on spin.

---

## Phase 4: User Story 2 — Perform Magic Actions After Spin (Priority: P1)

**Goal**: After the spin animation the game enters Magic Phase; player can use Respin, Swap, and Increase Value actions before pressing CLAIM to compute the result.

**Independent Test**: Spin → Magic Phase appears → use Respin (Air deducted, column re-rolls) → use Swap (Water deducted, two cells exchange) → use Increase Value (Fire deducted, cell value shown +N) → press CLAIM → payouts computed from modified grid.

### Tests for User Story 2 ⚠️ Write FIRST — confirm they FAIL before implementing

- [ ] T014 [P] [US2] Unit test: `SPIN` action stores columns in `magicGrid` and sets phase to `'spinning'` without computing payouts in `tests/unit/reducer.test.ts`
- [ ] T015 [P] [US2] Unit test: `BEGIN_MAGIC_PHASE` transitions phase to `'magic'` and resets `magicCounters` to zero in `tests/unit/reducer.test.ts`
- [ ] T016 [P] [US2] Unit test: `MAGIC_RESPIN` — deducts correct escalating Air cost, replaces target column with new icons; blocked when insufficient Air in `tests/unit/reducer.test.ts`
- [ ] T017 [P] [US2] Unit test: `MAGIC_SWAP` — deducts correct escalating Water cost, exchanges two adjacent cells; blocked on non-adjacency and insufficient Water in `tests/unit/reducer.test.ts`
- [ ] T018 [P] [US2] Unit test: `MAGIC_INCREASE_VALUE` — deducts N Fire and adds N to cell effective value on Nth use; works correctly for triple-apple (3→4) and dozen-apple (12→13) in `tests/unit/reducer.test.ts`
- [ ] T019 [P] [US2] Unit test: `CLAIM` computes payouts from `magicGrid` with `valueOverride` applied, sets `magicGrid` to null, transitions to `'market'` in `tests/unit/reducer.test.ts`
- [ ] T020 [US2] Integration test: full spin → `BEGIN_MAGIC_PHASE` → `MAGIC_RESPIN` → `CLAIM` flow produces correct currency awards in `tests/integration/magicPhase.test.ts`

### Implementation for User Story 2

- [ ] T021 [US2] Update `calculatePayouts` in `src/game/spinLogic.ts` to accept an optional `overrides: Map<string, number>` parameter (keyed by `icon.id`) and use override value when present
- [ ] T022 [US2] Refactor `SPIN` action in `src/game/reducer.ts`: generate columns, populate `magicGrid`, set phase to `'spinning'`; move payout computation out (depends on T021)
- [ ] T023 [US2] Add `BEGIN_MAGIC_PHASE` handler to `src/game/reducer.ts`: transition to `'magic'`, reset `magicCounters`, clear `lockedColumns` (depends on T022)
- [ ] T024 [US2] Add `MAGIC_RESPIN` handler to `src/game/reducer.ts` with Air cost and escalating counter (depends on T023)
- [ ] T025 [US2] Add `MAGIC_SWAP` handler to `src/game/reducer.ts` with Water cost, adjacency validation, and escalating counter (depends on T023)
- [ ] T026 [US2] Add `MAGIC_INCREASE_VALUE` handler to `src/game/reducer.ts` with Fire cost (+N additive value, N escalates per use) (depends on T023)
- [ ] T027 [US2] Add `CLAIM` handler to `src/game/reducer.ts`: project `magicGrid` → `Icon[][]` with overrides, call `calculatePayouts`, apply multiplier, update currencies, clear `magicGrid`, check phase (depends on T021, T026)
- [ ] T028 [US2] Create `src/components/MagicPhasePanel.tsx`: displays Respin / Swap / Increase Value action buttons with current cost and available currency; disables controls when currency insufficient
- [ ] T029 [US2] Update `src/components/SlotGrid.tsx` to render from `magicGrid` during magic phase and support cell/column selection for magic actions
- [ ] T030 [US2] Add CLAIM button and Magic Phase wiring to `src/App.tsx`: dispatch `BEGIN_MAGIC_PHASE` from `onSpinDone`, render `MagicPhasePanel` during `'magic'` phase, dispatch `CLAIM` on button press (depends on T028, T029)

**Checkpoint**: US2 fully functional — magic phase visible after every spin, all three actions work, CLAIM awards payouts.

---

## Phase 5: User Story 3 — Lock Columns for the Next Spin (Priority: P2)

**Goal**: Player can spend Earth during Magic Phase to lock up to 3 columns. Locked columns skip the spin animation and keep their icons. Locks clear after SPIN is pressed.

**Independent Test**: Lock a column (Earth deducted, column shows lock badge) → press SPIN → locked column keeps icons, unlocked columns re-roll → next Magic Phase shows no locks.

### Tests for User Story 3 ⚠️ Write FIRST — confirm they FAIL before implementing

- [ ] T031 [P] [US3] Unit test: `MAGIC_LOCK` — deducts correct escalating Earth cost, appends column index to `lockedColumns`; blocked when already 3 locked or already locked or insufficient Earth in `tests/unit/reducer.test.ts`
- [ ] T032 [P] [US3] Unit test: `SPIN` preserves icons in `magicGrid` for locked column indices and randomises the rest in `tests/unit/reducer.test.ts`
- [ ] T033 [P] [US3] Unit test: `BEGIN_MAGIC_PHASE` clears `lockedColumns` to `[]` in `tests/unit/reducer.test.ts`

### Implementation for User Story 3

- [ ] T034 [US3] Add `MAGIC_LOCK` handler to `src/game/reducer.ts`: validate max 3, deduct Earth (`lockedColumns.length + 1`), append index (depends on T023)
- [ ] T035 [US3] Update `SPIN` handler in `src/game/reducer.ts` to skip randomisation for indices in `lockedColumns` and carry their `magicGrid` content forward (depends on T034)
- [ ] T036 [US3] Update `src/components/SlotGrid.tsx` to show a lock badge on locked columns and suppress spin animation for them; receive `lockedColumns` prop
- [ ] T037 [US3] Add Lock button to `src/components/MagicPhasePanel.tsx` with Earth cost display and max-3 guard (depends on T028)

**Checkpoint**: US3 fully functional — lock mechanic works across spins, visual indicator present.

---

## Phase 6: User Story 4 — Master of Elements Win Condition (Priority: P2)

**Goal**: When CLAIM is pressed and the grid has ≥3 of each elemental icon (Air, Water, Earth, Fire), a "Master of Elements" notification is shown. Play continues normally.

**Independent Test**: Arrange grid with ≥3 Air, ≥3 Water, ≥3 Earth, ≥3 Fire via magic actions → press CLAIM → "Master of Elements" notification appears → dismiss → game continues normally.

### Tests for User Story 4 ⚠️ Write FIRST — confirm they FAIL before implementing

- [ ] T038 [P] [US4] Unit test: `detectMasterOfElements` returns `true` iff all four elements appear ≥3 times; false when any element < 3; handles grids with >3 of any element in `tests/unit/masterOfElements.test.ts`
- [ ] T039 [P] [US4] Unit test: `CLAIM` handler sets `state.masterOfElements = true` when condition met and leaves it `true` on subsequent spins in `tests/unit/reducer.test.ts`

### Implementation for User Story 4

- [ ] T040 [US4] Create `src/game/masterOfElements.ts` with `detectMasterOfElements(grid: MagicCell[][]): boolean` (counts elemental icons across all cells)
- [ ] T041 [US4] Update `CLAIM` handler in `src/game/reducer.ts` to call `detectMasterOfElements` and set `state.masterOfElements = true` if it returns `true` (depends on T040)
- [ ] T042 [US4] Add "Master of Elements" notification display to `src/App.tsx` — shown as an overlay or banner when `state.masterOfElements` becomes `true`; dismissable, play continues

**Checkpoint**: US4 fully functional — Master of Elements notification fires correctly and play continues.

---

## Phase 7: User Story 5 — Results Modal Threshold (Priority: P3)

**Goal**: Results modal only appears when earnings exceed 20% of current holdings. Gold/Silver/Copper are compared as a single combined money value.

**Independent Test**: Hold 1 Gold → earn 99 Copper → modal does NOT appear. Hold 100 Copper → earn 21 Copper → modal DOES appear. Hold 10 Air → earn 3 Air → modal DOES appear.

### Tests for User Story 5 ⚠️ Write FIRST — confirm they FAIL before implementing

- [ ] T043 [P] [US5] Unit test: updated `isNotableResult` — combined money cases: 99c earned on 10000 base → false; 201c earned on 1000 base → true; 0 combined money base → true for any gain in `tests/unit/notableResult.test.ts`
- [ ] T044 [P] [US5] Unit test: elemental currency cases follow per-key logic (not combined): 3 Air gained on 10 Air → true (30%); 1 Air gained on 10 Air → false in `tests/unit/notableResult.test.ts`

### Implementation for User Story 5

- [ ] T045 [US5] Update `src/game/notableResult.ts`: group `copper`, `silver`, `gold` into combined money (`10000·gold + 100·silver + copper`); compare Δcombined / prevCombined > 0.20 (or prevCombined = 0 → true); all other currencies keep existing per-key logic; remove crowns special-case

**Checkpoint**: US5 fully functional — modal fires only on meaningful gains.

---

## Phase 8: Polish & Cross-Cutting Concerns

- [ ] T046 [P] Verify `CurrencyDisplay.tsx` and `MagicPhasePanel.tsx` render correctly at 720×1280 px and ≥1280 px (no overflow, 48×48 px icon slots intact)
- [ ] T047 [P] Audit all magic action buttons for WCAG AA contrast ratio (4.5:1 minimum) in `src/components/MagicPhasePanel.tsx`
- [ ] T048 Remove any `console.log`, unused imports, and dead code introduced during implementation across `src/game/` and `src/components/`
- [ ] T049 **[GATE 1] Typecheck** — run `npm run typecheck` (`tsc --noEmit`), fix all errors
- [ ] T050 **[GATE 2] Lint** — run `npm run lint`, fix all ESLint errors
- [ ] T051 **[GATE 3] Unit Tests** — run `npm run test:unit`, confirm all pass with ≥80% coverage on changed files
- [ ] T052 **[GATE 4] Integration Tests** — run `npm run test:integration`, confirm all pass
- [ ] T053 **[GATE 5] Build** — run `npm run build`, confirm no warnings treated as errors
- [ ] T054 **[GATE 6] Bundle Size** — verify gzipped JS bundle ≤ 250 KB; record before/after delta

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies — start immediately
- **Phase 2 (Foundational)**: Depends on Phase 1 (T001–T005) — blocks all user stories
- **Phase 3 (US1)**: Depends on Phase 2; T009–T011 tests can run in parallel immediately after Phase 2
- **Phase 4 (US2)**: Depends on Phase 2; T014–T020 tests written before T021–T030 impl
- **Phase 5 (US3)**: Depends on Phase 4 complete (lock action extends magic phase)
- **Phase 6 (US4)**: Depends on Phase 4 complete (CLAIM handler must exist for masterOfElements hook)
- **Phase 7 (US5)**: Depends on Phase 2 only (notableResult.ts is standalone)
- **Phase 8 (Polish)**: Depends on all desired phases complete

### User Story Dependencies

- **US1 (P1)**: After Phase 2 — independent
- **US2 (P1)**: After Phase 2 — independent (but US3/US4 build on it)
- **US3 (P2)**: After US2 complete
- **US4 (P2)**: After US2 complete (CLAIM exists)
- **US5 (P3)**: After Phase 2 — independent of US1–US4

### Parallel Opportunities Within US2

```
# Write tests in parallel (all different files, same phase):
T014  SPIN stores magicGrid
T015  BEGIN_MAGIC_PHASE resets counters
T016  MAGIC_RESPIN cost + effect
T017  MAGIC_SWAP cost + adjacency
T018  MAGIC_INCREASE_VALUE additive value
T019  CLAIM computes from magicGrid

# Then implement reducer actions sequentially (T021 → T022 → T023 → T024/T025/T026 → T027)
# Implement UI in parallel with later reducer tasks:
T028  MagicPhasePanel.tsx    ← parallel with T024–T026
T029  SlotGrid.tsx updates   ← parallel with T024–T026
```

---

## Implementation Strategy

### MVP First (US1 + US2 only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational
3. Complete Phase 3: US1 (elemental icons purchasable, award currency)
4. Complete Phase 4: US2 (magic phase: respin, swap, increase value, CLAIM)
5. **STOP and VALIDATE**: full spin → magic → claim loop works
6. Ship or demo MVP

### Incremental Delivery

1. Setup + Foundational → types and data ready
2. US1 → elemental currencies earnable
3. US2 → magic phase playable (core loop complete)
4. US3 → column locking adds strategy
5. US4 → Master of Elements milestone reward
6. US5 → results modal polished

---

## Notes

- [P] tasks = different files, no blocking dependencies on incomplete work
- Tests for each story MUST be written and confirmed failing before implementation starts (constitution §II)
- `magicGrid` is `null` outside magic phase — all magic action handlers must guard on `state.phase === 'magic'`
- The `valueOverride` on `MagicCell` accumulates additively: each `MAGIC_INCREASE_VALUE` use adds N (where N escalates) on top of the current override, not the base value
- `lockedColumns` is cleared in `BEGIN_MAGIC_PHASE` (after the spin that used the locks), not in `SPIN`
- Commit after each checkpoint to preserve independently testable increments
