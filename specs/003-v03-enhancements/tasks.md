# Tasks: Version 0.3 Enhancements

**Input**: Design documents from `specs/003-v03-enhancements/`

**Prerequisites**: plan.md ✅ | spec.md ✅ | research.md ✅ | data-model.md ✅

**Tests**: Included per Constitution II (Test-First Development is mandatory for non-trivial logic).

**Organization**: Tasks grouped by user story for independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no shared dependencies)
- **[Story]**: Which user story this belongs to (US1–US6)

---

## Phase 1: Setup

**Purpose**: Confirm baseline and prepare test files.

- [x] T001 Verify `npm run typecheck && npm run lint && npm run test:run` all pass on current branch
- [x] T002 [P] Create empty test file `tests/unit/reducer.test.ts` (extend existing file or create if absent) — confirm vitest picks it up
- [x] T003 [P] Create empty test files `tests/unit/notableResult.test.ts` and `tests/unit/persistence.test.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Type system, state migration, and catalog fix. MUST complete before any user story.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [x] T004 Add `PlayerSettings` interface and `DEFAULT_SETTINGS` constant to `src/game/types.ts` (per data-model.md)
- [x] T005 Add `SpinLogEntry` interface to `src/game/types.ts` (per data-model.md)
- [x] T006 Extend `GameState` in `src/game/types.ts`: add `settings: PlayerSettings` and `gameLog: SpinLogEntry[]`; bump `version` comment to 3
- [x] T007 Update `makeInitialState()` in `src/game/initialState.ts` to include `settings: DEFAULT_SETTINGS` and `gameLog: []`
- [x] T008 Update `loadState()` in `src/game/persistence.ts`: bump `CURRENT_VERSION` to 3; add migration branch for `version === 2` that injects `settings: DEFAULT_SETTINGS` and `gameLog: []`
- [x] T009 Change crown cost in `src/game/catalog.ts` from `{ currency: 'gold', amount: 10 }` to `{ currency: 'gold', amount: 100 }`
- [x] T010 Update `SPIN` action type in `src/game/reducer.ts` to `{ type: 'SPIN'; multiplier: 1 | 10 | 100 }` and add `UPDATE_SETTINGS` action type `{ type: 'UPDATE_SETTINGS'; patch: Partial<PlayerSettings> }`
- [x] T011 Add `UPDATE_SETTINGS` case to `gameReducer` in `src/game/reducer.ts`: merge patch into `state.settings` and call `saveState`
- [x] T012 Fix `App.tsx` call sites to pass `multiplier: 1` to the `SPIN` dispatch so the app compiles; run `npm run typecheck` to confirm zero errors

**Checkpoint**: `npm run typecheck` exits 0. App loads and spins with no regressions.

---

## Phase 3: User Story 1 — Spin Multiplier Control (Priority: P1) 🎯 MVP

**Goal**: Player can select x1/x10/x100 next to the SPIN button; one spin is resolved and its payouts scaled by the multiplier; apple cost scales accordingly.

**Independent Test**: Toggle to x10, press SPIN with ≥10 apples — 10 apples deducted, result shown once, rewards are 10× a normal same-symbol spin. Toggle to x100, confirm 100 apples deducted and rewards 100×.

### Tests for User Story 1 ⚠️ Write these FIRST — confirm they FAIL before implementing

- [x] T013 [P] [US1] In `tests/unit/reducer.test.ts`: write test — SPIN with `multiplier: 10` deducts 10 food and each payout amount equals base × 10; confirm test FAILS
- [x] T014 [P] [US1] In `tests/unit/reducer.test.ts`: write test — SPIN with `multiplier: 100` deducts 100 food and payouts scale ×100; confirm FAILS
- [x] T015 [P] [US1] In `tests/unit/reducer.test.ts`: write test — SPIN with `multiplier: 10` when player has exactly 10 food succeeds (not blocked); confirm FAILS
- [x] T016 [P] [US1] In `tests/unit/reducer.test.ts`: write test — SPIN with `multiplier: 10` when player has 9 food is a no-op (blocked); confirm FAILS

### Implementation for User Story 1

- [x] T017 [US1] Update `SPIN` case in `src/game/reducer.ts`: deduct `multiplier` food instead of 1; multiply each `payout.amount` by `multiplier` before applying; block spin if `state.currencies.food < multiplier`
- [x] T018 [US1] Create `src/components/SpinControls.tsx` with multiplier toggle buttons (x1 / x10 / x100) and an `onMultiplierChange` prop; active button styled distinctly
- [x] T019 [US1] In `App.tsx`: add `multiplier` state (`1 | 10 | 100`, default 1); render `<SpinControls>` next to `<SpinButton>` in the Spin tab; pass `multiplier` to `SPIN` dispatch
- [x] T020 [US1] Run `npm run test:unit` — T013–T016 now pass; run `npm run typecheck`

**Checkpoint**: x1/x10/x100 toggle visible in Spin tab; multiplier correctly scales cost and reward.

---

## Phase 4: User Story 2 — Game Log in Spin Tab (Priority: P1)

**Goal**: Spin tab shows a log of the 10 most recent spin results. Results modal only appears for notable results (>20% gain of any food/currency, or crown gained). Every spin adds one log entry.

**Independent Test**: Perform 12 spins with non-notable results — no modal shown, 10 log entries visible (11th and 12th oldest evicted). Then trigger a notable result — modal appears AND log entry added.

### Tests for User Story 2 ⚠️ Write FIRST — confirm FAIL

- [x] T021 [P] [US2] In `tests/unit/reducer.test.ts`: write test — SPIN appends a `SpinLogEntry` to `gameLog`; after 11 spins `gameLog.length === 10`; confirm FAILS
- [x] T022 [P] [US2] In `tests/unit/notableResult.test.ts`: write tests for `isNotableResult()` — food gain >20% of balance is notable; gain ≤20% is not; crown gain is always notable; balance=0 any gain is notable; confirm FAILS

### Implementation for User Story 2

- [x] T023 [US2] Create `src/game/notableResult.ts` exporting `isNotableResult(prev: Currencies, next: Currencies): boolean` — >20% gain in any food/currency key or crowns increased
- [x] T024 [US2] Update `SPIN` case in `src/game/reducer.ts`: build a `SpinLogEntry` (spinNumber, multiplier, scaled payouts, timestamp) and prepend to `state.gameLog`; trim to 10 entries
- [x] T025 [US2] Create `src/components/GameLog.tsx` rendering a scrollable list of up to 10 `SpinLogEntry` items; each entry shows `Spin #N (xM): [payout summary or "No match"]`
- [x] T026 [US2] In `App.tsx`: capture `prevCurrencies` before dispatch using a ref; after state update call `isNotableResult(prevCurrencies, state.currencies)` to decide whether to set `spinDone` (show modal); always add log entry regardless
- [x] T027 [US2] Add `<GameLog entries={state.gameLog} />` to the Spin tab panel in `App.tsx`, below `<SpinButton>`
- [x] T028 [US2] Run `npm run test:unit` — T021–T022 pass; smoke-test modal suppression in browser

**Checkpoint**: Game log visible; modal only appears on notable results.

---

## Phase 5: User Story 4 — Currency Bar Timing & Auto-Convert Toggle (Priority: P2)

**Goal**: Currency bar updates only after animation ends + modal dismissed. Auto-convert toggle disables copper→silver→gold conversion when off.

**Independent Test**: Spin — currency bar stays frozen until animation ends (and modal dismissed if shown). Disable auto-convert, spin until >100 copper — copper exceeds 100 without converting.

### Tests for User Story 4 ⚠️ Write FIRST — confirm FAIL

- [x] T029 [P] [US4] In `tests/unit/reducer.test.ts`: write test — with `state.settings.autoConvert = false`, SPIN that would trigger conversion does NOT convert (copper stays >100); confirm FAILS
- [x] T030 [P] [US4] In `tests/unit/reducer.test.ts`: write test — with `state.settings.autoConvert = true`, SPIN that yields 100+ copper DOES convert to silver; confirm FAILS

### Implementation for User Story 4

- [x] T031 [US4] In `src/game/reducer.ts` SPIN case: gate `applyAutoConversions(currencies)` behind `state.settings.autoConvert`; when false, skip conversion
- [x] T032 [US4] In `App.tsx`: add `displayedCurrencies` state initialized from `loadOrInit().currencies`; update it only in `handleSpinDone` (when no modal) or `handleModalDismiss` (when modal shown); pass `displayedCurrencies` to `<CurrencyDisplay>`
- [x] T033 [US4] Update `CurrencyDisplay.tsx` prop from `currencies: Currencies` (from game state) to accept `currencies: Currencies` (the deferred display value) — prop name unchanged, source changes in App.tsx
- [x] T034 [US4] Add auto-convert toggle to `src/components/SpinControls.tsx` (checkbox labeled "Auto-convert money", default checked); emit via `onSettingsChange({ autoConvert })` prop
- [x] T035 [US4] In `App.tsx`: wire `onSettingsChange` from `<SpinControls>` to dispatch `UPDATE_SETTINGS`
- [x] T036 [US4] Run `npm run test:unit` — T029–T030 pass; manually verify currency bar stays frozen then updates

**Checkpoint**: Currency bar deferred correctly; auto-convert toggle works.

---

## Phase 6: User Story 3 — Animate Toggle (Priority: P2)

**Goal**: "Animate" toggle near the matrix. When off, result matrix shown instantly; game log and currency bar update without waiting for animation.

**Independent Test**: Disable animate, press SPIN — matrix updates immediately with no column cycling, game log adds entry, currency bar updates (no modal if non-notable).

### Tests for User Story 3 ⚠️ Write FIRST — confirm FAIL

- [x] T037 [P] [US3] In `tests/component/SpinControls.test.tsx`: write test — animate toggle renders, toggles state, emits `onSettingsChange({ animate: false })`; confirm FAILS

### Implementation for User Story 3

- [x] T038 [US3] Add animate toggle to `src/components/SpinControls.tsx` (checkbox labeled "Animate", default checked); emit via `onSettingsChange({ animate })` prop
- [x] T039 [US3] Pass `animate` from `state.settings.animate` through `App.tsx` → `SlotGrid` → `ReelColumn`; when `animate === false`, `ReelColumn` skips the `setInterval` cycling and calls `onColumnDone` synchronously with the final icon
- [x] T040 [US3] In `App.tsx` `handleSpin`: when `!state.settings.animate`, call `handleSpinDone` synchronously after dispatch instead of waiting for animation callback
- [x] T041 [US3] Run `npm run test:unit` — T037 passes; smoke-test in browser: no animation, instant result

**Checkpoint**: Animate toggle suppresses animation; all downstream updates fire immediately.

---

## Phase 7: User Story 6 — Settings & Game Log Persistence (Priority: P2)

**Goal**: Toggle states (auto-convert, animate, spin multiplier) and the last 10 spins persist across page reloads.

**Independent Test**: Change all three toggles, perform 3 spins, reload page — toggles restore to changed values, game log shows 3 entries.

### Tests for User Story 6 ⚠️ Write FIRST — confirm FAIL

- [x] T042 [P] [US6] In `tests/unit/persistence.test.ts`: write test — save state with custom settings and gameLog, call `loadState()`, confirm settings and gameLog are restored correctly; confirm FAILS
- [x] T043 [P] [US6] In `tests/unit/persistence.test.ts`: write test — v2 state (no settings/gameLog fields) migrates to v3 with `DEFAULT_SETTINGS` and `gameLog: []`; confirm FAILS

### Implementation for User Story 6

- [x] T044 [US6] Verify `saveState` in `src/game/persistence.ts` already serializes the full `GameState` (including new `settings` and `gameLog` fields) — no change needed if so; add explicit fields to serialization if needed
- [x] T045 [US6] In `App.tsx`: ensure `multiplier` UI state is initialized from `loadOrInit().settings.spinMultiplier` (not hardcoded to 1) so the UI reflects restored settings on load
- [x] T046 [US6] Run `npm run test:unit` — T042–T043 pass; smoke-test: change toggles, reload, confirm they restore

**Checkpoint**: All settings and game log survive a page reload.

---

## Phase 8: User Story 5 — Market Pricing Updates (Priority: P3)

**Goal**: Crown costs 100 gold (already done in T009). All market items show an alternate denomination below their primary price (e.g., "1 silver / 100 copper").

**Independent Test**: Open Market tab — crown shows 100 gold; any silver-priced item shows copper equivalent; any gold-priced item shows silver and copper equivalents.

### Tests for User Story 5 ⚠️ Write FIRST — confirm FAIL

- [x] T047 [P] [US5] In `tests/component/MarketItem.test.tsx`: write test — item costing 1 silver renders "100 copper" alternate price line; item costing 1 gold renders "100 silver" alternate line; confirm FAILS

### Implementation for User Story 5

- [x] T048 [US5] In `src/components/MarketItem.tsx`: below the primary cost badge, render an alternate denomination line using `CURRENCY_REGISTRY` conversion rates — if cost is silver show copper equivalent, if cost is gold show silver equivalent (and optionally copper)
- [x] T049 [US5] Run `npm run test:unit` — T047 passes; open Market tab in browser, verify crown = 100 gold and all alternate prices display correctly

**Checkpoint**: Market tab shows correct crown pricing and alternate denomination hints.

---

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**: Final cleanup, full gate sequence.

- [x] T050 [P] Remove any `console.log` debug statements introduced during development
- [x] T051 [P] Verify all toggles default to correct initial state on a fresh session (clear localStorage, reload): auto-convert=on, animate=on, multiplier=x1, game log empty
- [x] T052 **[GATE 1] Typecheck** — run `npm run typecheck`; fix all errors before continuing
- [x] T053 **[GATE 2] Lint** — run `npm run lint`; fix all ESLint errors
- [x] T054 **[GATE 3] Unit Tests** — run `npm run test:unit`; all tests pass, ≥80% coverage on changed files
- [x] T055 **[GATE 4] Integration Tests** — run `npm run test:integration`; all pass
- [x] T056 **[GATE 5] Build** — run `npm run build`; production bundle compiles with zero warnings-as-errors
- [x] T057 **[GATE 6] Bundle Size** — measure gzipped JS bundle; confirm ≤ 250 KB; document before/after delta

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies — start immediately
- **Phase 2 (Foundational)**: Depends on Phase 1 — **BLOCKS all user stories**
- **Phase 3 (US1)**: Depends on Phase 2
- **Phase 4 (US2)**: Depends on Phase 2; integrates with Phase 3 (multiplier in log entry)
- **Phase 5 (US4)**: Depends on Phase 2; integrates with Phase 3 (multiplier in SPIN dispatch)
- **Phase 6 (US3)**: Depends on Phase 2 and Phase 5 (SpinControls already exists)
- **Phase 7 (US6)**: Depends on Phase 2; validates Phases 3–6 settings all persist
- **Phase 8 (US5)**: Depends only on Phase 2 (T009 catalog fix already done)
- **Phase 9 (Polish)**: Depends on all desired story phases complete

### User Story Dependencies

- **US1 (P1)**: Independent after Foundational
- **US2 (P1)**: Independent after Foundational; integrates with US1 (multiplier in log entry)
- **US4 (P2)**: Independent after Foundational; integrates with US1 (multiplier on SPIN dispatch)
- **US3 (P2)**: Independent after Foundational; shares SpinControls component with US1/US4
- **US6 (P2)**: Independent after Foundational; validates everything from US1–US4 persists
- **US5 (P3)**: Fully independent after T009 (catalog fix in Foundational)

### Parallel Opportunities Within Phases

**Phase 2**: T004–T006 can run in parallel (different sections of types.ts, or different files); T007 depends on T004–T006; T008 depends on T006; T009–T011 can run in parallel.

**Phase 3**: T013–T016 (tests) all parallel; T017 depends on T013–T016 failing first.

**Phase 4**: T021–T022 parallel; T023–T024 parallel; T025–T027 parallel within their dependency groups.

---

## Parallel Execution Examples

### Phase 3 (US1 — Spin Multiplier)

```bash
# Write all four tests in parallel (different describe blocks or one file):
Task T013: "SPIN multiplier:10 deducts 10 food, payouts ×10"
Task T014: "SPIN multiplier:100 deducts 100 food, payouts ×100"
Task T015: "SPIN with exactly 10 food and multiplier:10 succeeds"
Task T016: "SPIN with 9 food and multiplier:10 is a no-op"

# Then implement (T017) and wire UI (T018–T019) in parallel (different files):
Task T018: "Create SpinControls.tsx multiplier buttons"
Task T019: "Wire multiplier state and dispatch in App.tsx"
```

### Phase 4 (US2 — Game Log)

```bash
# Tests in parallel:
Task T021: "gameLog appends and caps at 10"
Task T022: "isNotableResult() detection logic"

# Implementation in parallel (different files):
Task T023: "Create notableResult.ts utility"
Task T024: "Update SPIN reducer to append SpinLogEntry"
Task T025: "Create GameLog.tsx component"
```

---

## Implementation Strategy

### MVP First (User Stories 1 + 2 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational (CRITICAL — blocks all stories)
3. Complete Phase 3: US1 (Spin Multiplier)
4. Complete Phase 4: US2 (Game Log + conditional modal)
5. **STOP and VALIDATE**: Multiplier works, game log shows, modal only on notable results
6. Demo/deploy as early increment

### Incremental Delivery

1. Setup + Foundational → baseline confirmed
2. US1 → multiplier live
3. US2 → game log + modal logic live (MVP slice)
4. US4 → currency bar timing + auto-convert live
5. US3 → animate toggle live
6. US6 → persistence confirmed end-to-end
7. US5 → market pricing polished
8. Polish + Gates → ship

---

## Notes

- [P] tasks = different files, no shared incomplete dependencies — safe to parallelise
- Test tasks MUST be written and confirmed **failing** before their implementation tasks run (Constitution II)
- Each story's Checkpoint is a verify-in-browser moment — don't skip it
- `displayedCurrencies` in App.tsx is UI-only state; never put it in GameState
- `isNotableResult` lives in `src/game/notableResult.ts` — pure function, easy to unit test
- Commit after each phase checkpoint
