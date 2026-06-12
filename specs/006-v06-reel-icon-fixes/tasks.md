# Tasks: v0.6 Reel Icon Controls, UI Layout & Bug Fixes

**Input**: Design documents from `specs/006-v06-reel-icon-fixes/`

**Branch**: `006-v06-reel-icon-fixes`

**Constitution note**: Tests are MANDATORY for all non-trivial logic (constitution II). Each user story phase opens with test tasks that MUST be confirmed to fail (Red) before implementation begins.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no shared dependencies)
- **[Story]**: Which user story this task belongs to
- All paths are relative to repository root

---

## Phase 1: Setup (Shared Type Infrastructure)

**Purpose**: Establish the new `GameState` shape that all user stories depend on. No reducer or component logic changes yet — types and initial state only.

- [ ] T001 Add `disabledIconIds: string[]` field to `GameState` interface and bump `version` to `5` in `src/game/types.ts`
- [ ] T002 Add `disabledIconIds: []` to `makeInitialState()` return value and update `version: 5` in `src/game/initialState.ts`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Two cross-cutting fixes that must land before any user story work begins — the persistence migration (keeps existing saves) and the icon-ID uniqueness fix (prerequisite for correct Boost Value and MoE behaviour).

**⚠️ CRITICAL**: No user story implementation can begin until this phase is complete.

- [ ] T003 Bump `CURRENT_VERSION` to `5` and add v4→v5 migration (`if parsed.version === 4` → spread state + `version: 5, disabledIconIds: []`) in `src/game/persistence.ts`
- [ ] T004 Fix `iconsToMagicCells` helper to clone each icon with a fresh `crypto.randomUUID()` so every magic-grid cell has a unique `id` — prevents boost-override cross-column contamination in `src/game/reducer.ts`

**Checkpoint**: Types, initial state, persistence migration, and cell-ID uniqueness are all correct. User story work can now proceed.

---

## Phase 3: User Story 1 — Enable/Disable Reel Icons (Priority: P1) 🎯 MVP

**Goal**: Players with ≥ 13 unlocked icons can toggle individual icons off so they are excluded from spin draws, with the game preventing the enabled count from dropping below 12.

**Independent Test**: Navigate to the Reel tab with 13+ icons, disable one icon, spin — verify the disabled icon does not appear in the result. Attempt to disable when 12 are enabled — verify the toggle is non-interactive.

### Tests for User Story 1

> **Write these first; confirm they FAIL before implementing T008–T012**

- [ ] T005 [P] [US1] Write unit tests for `TOGGLE_ICON` reducer action (enable/disable round-trip, 12-icon floor enforcement, phase guard) in `tests/unit/reducer.test.ts`
- [ ] T006 [P] [US1] Write unit tests verifying `drawColumn` excludes disabled icon ids from drawn results in `tests/unit/spinLogic.test.ts`

### Implementation for User Story 1

- [ ] T007 [P] [US1] Add `{ type: 'TOGGLE_ICON'; iconId: string }` to the `GameAction` union in `src/game/types.ts`
- [ ] T008 [P] [US1] Update `drawColumn` signature to accept optional `disabledIconIds: string[] = []` and filter the eligible pool before shuffling in `src/game/spinLogic.ts`
- [ ] T009 [US1] Implement `TOGGLE_ICON` reducer case (re-enable if present; disable only if enabled count > 12; phase guard: market only) in `src/game/reducer.ts` (depends on T007)
- [ ] T010 [US1] Update `SPIN` and `MAGIC_RESPIN` reducer cases to pass `state.disabledIconIds` to `drawColumn` in `src/game/reducer.ts` (depends on T008, T009)
- [ ] T011 [US1] Rewrite `ReelView` to accept `disabledIconIds: string[]` and `onToggleIcon: (iconId: string) => void` props; render per-icon toggle buttons with enabled/disabled state and `cursor-not-allowed` when at the 12-icon floor in `src/components/ReelView.tsx`
- [ ] T012 [US1] Wire `ReelView` in `App.tsx`: pass `state.disabledIconIds` and dispatch `TOGGLE_ICON` from `onToggleIcon` in `src/App.tsx` (depends on T011)

**Checkpoint**: User Story 1 fully functional. Reel tab shows toggles; disabled icons do not appear in spin results; floor is enforced.

---

## Phase 4: User Story 2 — SPIN and CLAIM Same Screen Position (Priority: P2)

**Goal**: CLAIM button appears in the identical screen position as the SPIN button so no mouse movement is required between spinning and claiming.

**Independent Test**: Perform a spin; observe that CLAIM is anchored at the same Y position as SPIN was. MagicPhasePanel appears below CLAIM. SpinControls (toggles) remain visible above both.

### Tests for User Story 2

> **Write this first; confirm it FAILS before implementing T014**

- [ ] T013 [US2] Write a component render test that verifies: in magic phase, CLAIM renders before `MagicPhasePanel` in document order, and `SpinControls` is always present regardless of phase in `tests/integration/magicPhase.test.tsx`

### Implementation for User Story 2

- [ ] T014 [US2] Restructure the Spin-tab control block in `src/App.tsx`: always render `<SpinControls>` first; in magic phase render `<CLAIM button>` then `<MagicPhasePanel>` below it; in non-magic phase render `<SpinButton>` (depends on T013)

**Checkpoint**: SPIN and CLAIM share the same anchor. SpinControls always visible. MagicPhasePanel appears below CLAIM during magic phase.

---

## Phase 5: User Story 3 — Accurate Boost Value Behaviour (Priority: P3)

**Goal**: Boost Value raises only the clicked cell's value by exactly +1 per use; Master of Elements triggers correctly after Boost Value is applied.

**Independent Test**: Activate Boost Value twice on one cell — value increases by exactly +2 total; adjacent cells unchanged. If MoE conditions are met, CLAIM triggers the MoE modal.

### Tests for User Story 3

> **Write these first; confirm they FAIL before implementing T016**

- [ ] T015 [P] [US3] Write unit tests for `MAGIC_INCREASE_VALUE`: first activation +1, second activation on same cell +1 more (not +2), other cells unchanged in `tests/unit/reducer.test.ts`
- [ ] T015b [P] [US3] Write integration test: spin with elemental-heavy reel, apply Boost Value, CLAIM → assert `state.masterOfElements === true` in `tests/integration/magicPhase.test.tsx`

### Implementation for User Story 3

- [ ] T016 [US3] Fix `MAGIC_INCREASE_VALUE` reducer case: change `currentValue + cost` to `currentValue + 1` in `src/game/reducer.ts` (depends on T004 in Phase 2 for the cross-cell isolation fix)

**Checkpoint**: Boost Value applies exactly +1 per activation to the target cell only. MoE fires when elemental conditions are satisfied after a boost.

---

## Phase 6: User Story 4 — Stable Spin Animations (Priority: P4)

**Goal**: Air Spin animation does not grow the column height; locked columns do not animate during the next spin; lock indicator appears below the column in a fixed-height slot, causing no horizontal layout shift.

**Independent Test**: Trigger Air Spin — verify column row count stays at 3. Lock a column then spin — verify locked column shows no animation. View a locked column alongside unlocked — verify all columns are identically wide and start at the same Y.

### Tests for User Story 4

> **Write these first; confirm they FAIL before implementing T019–T021**

- [ ] T017 [P] [US4] Write a `ReelColumn` unit test verifying that during a respin-token animation the number of displayed icons equals `icons.length` (3), not `reelIcons.length` in `tests/unit/ReelColumn.test.tsx`
- [ ] T018 [P] [US4] Write a reducer unit test verifying that after `SPIN`, `state.lockedColumns` retains the values from the preceding magic phase (not cleared to `[]`) in `tests/unit/reducer.test.ts`

### Implementation for User Story 4

- [ ] T019 [P] [US4] Fix respin animation in `ReelColumn`: change `pool.map(...)` to `icons.map(...)` in the `respinToken` effect so column height stays constant at `icons.length` in `src/components/ReelColumn.tsx`
- [ ] T020 [P] [US4] Remove `lockedColumns: []` from the `SPIN` reducer case so that previously locked columns persist through the spinning phase (they are still cleared in `BEGIN_MAGIC_PHASE`) in `src/game/reducer.ts`
- [ ] T021 [US4] Restructure `ReelColumn` JSX: move lock indicator to after `displayIcons.map`; wrap it in `<div className="h-6 flex items-center justify-center">` that is always rendered; use a compact emoji-only indicator (`🔒`) to stay within column width; remove the previous top-anchored indicator div in `src/components/ReelColumn.tsx` (depends on T019)

**Checkpoint**: Air Spin maintains 3-row columns. Locked columns are static during the next spin. All columns are flush regardless of lock state.

---

## Phase 7: User Story 5 — Currency Auto-Conversion for Purchases (Priority: P5)

**Goal**: Purchasing an item succeeds even when the player has 0 of the required denomination but sufficient higher-denomination currency to cover it via conversion.

**Independent Test**: With 0 copper and 1 silver, buy a 1-copper item — succeeds and leaves 99 copper. With 0 copper, 0 silver, and 1 gold, buy a 1-copper item — succeeds (gold → silver → copper conversion chain).

### Tests for User Story 5

> **Write these first; confirm they FAIL before implementing T023**

- [ ] T022 [US5] Write unit tests for `tryBuyIcon` / `ensureLiquidity`: (a) 0 copper + silver → success; (b) 0 copper + 0 silver + gold → success (two-level chain); (c) 0 copper + 0 silver + 0 gold → failure; (d) 0 silver + gold for silver-cost item → success in `tests/unit/reducer.test.ts`

### Implementation for User Story 5

- [ ] T023 [US5] Extract `ensureLiquidity(currencies, currency, amount)` helper that walks `convertibleFrom` up to 2 levels; rewrite `tryBuyIcon` to call it in place of the current one-level shortfall branch in `src/game/reducer.ts` (depends on T022)

**Checkpoint**: All currency combinations work. Purchases succeed whenever total value (across all denominations) is sufficient.

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Final validation across all stories before merge.

- [ ] T024 [P] Remove any `console.log` or debug statements introduced during implementation across `src/`
- [ ] T025 [P] Verify the 720 × 1280 px layout: lock indicator does not push columns; SPIN/CLAIM positions are identical; icon toggle buttons are touch-target sized (≥ 44 px) — manual smoke test or snapshot
- [ ] T026 **[GATE 1] Typecheck** — run `npm run typecheck`; must exit 0
- [ ] T027 **[GATE 2] Lint** — run `npm run lint`; must exit 0 with zero errors
- [ ] T028 **[GATE 3] Unit Tests** — run `npm run test:unit`; all tests pass (Red→Green confirmed for each story)
- [ ] T029 **[GATE 4] Integration Tests** — run `npm run test:integration`; all tests pass
- [ ] T030 **[GATE 5] Build** — run `npm run build`; production bundle compiles cleanly
- [ ] T031 **[GATE 6] Bundle Size** — measure gzipped JS bundle size; must be ≤ 250 KB; record before/after delta in PR description

---

## Dependencies & Execution Order

### Phase Dependencies

```
Phase 1 (Setup)
  └── Phase 2 (Foundational)  ← BLOCKS all user stories
        ├── Phase 3 (US1)
        ├── Phase 4 (US2)     ← fully independent; no dependency on US1
        ├── Phase 5 (US3)     ← depends on T004 (Phase 2) for cell ID fix
        ├── Phase 6 (US4)
        └── Phase 7 (US5)
              └── Phase 8 (Polish)
```

### User Story Dependencies

- **US1 (P1)**: After Phase 2 — independent
- **US2 (P2)**: After Phase 2 — independent (only touches App.tsx layout)
- **US3 (P3)**: After Phase 2 — depends on T004 (iconsToMagicCells fix)
- **US4 (P4)**: After Phase 2 — independent
- **US5 (P5)**: After Phase 2 — independent

### Within Each User Story

1. Write tests → confirm RED
2. Implement (in the order shown)
3. Confirm GREEN
4. Checkpoint: story independently testable

### Parallel Opportunities

- **T005, T006** (US1 test writing) can run in parallel — different files
- **T007, T008** (US1 type + spinLogic) can run in parallel — different files
- **T015, T015b** (US3 test writing) can run in parallel — different files
- **T017, T018** (US4 test writing) can run in parallel — different files
- **T019, T020** (US4 respin fix + SPIN lock fix) can run in parallel — different files
- **T024, T025** (polish cleanup) can run in parallel

---

## Parallel Example: User Story 1

```
# Tests (run in parallel — different files):
T005: Write TOGGLE_ICON unit tests in tests/unit/reducer.test.ts
T006: Write drawColumn disabled-ids unit tests in tests/unit/spinLogic.test.ts

# Confirm both FAIL — then implement:
T007: Add TOGGLE_ICON to GameAction union (types.ts)   ← parallel with T008
T008: Update drawColumn signature (spinLogic.ts)       ← parallel with T007

# Sequential after T007+T008:
T009: Implement TOGGLE_ICON reducer case (reducer.ts)
T010: Update SPIN + MAGIC_RESPIN to pass disabledIconIds (reducer.ts)
T011: Rewrite ReelView with toggle buttons (ReelView.tsx)
T012: Wire ReelView in App.tsx (App.tsx)
```

---

## Implementation Strategy

### MVP First (User Story 1 — Icon Enable/Disable)

1. Complete Phase 1 + Phase 2 (Setup + Foundational)
2. Complete Phase 3 (US1 — icon toggles)
3. **STOP and VALIDATE**: toggle icons off, spin, confirm absent from result; verify 12-icon floor
4. Ship or demo the enhancement before tackling the bug fixes

### Incremental Delivery

1. Phase 1 + 2 → foundation ready
2. Phase 3 (US1) → icon toggle feature ✓
3. Phase 4 (US2) → SPIN/CLAIM position fix ✓
4. Phase 5 (US3) → Boost Value accuracy ✓
5. Phase 6 (US4) → animation stability ✓
6. Phase 7 (US5) → currency conversion ✓
7. Phase 8 → gates pass → merge

### Suggested Merge Order

Each phase can be merged independently as a "fix PR" if desired. The recommended single-PR boundary is all phases together, given the small blast radius of each change.

---

## Notes

- `[P]` = different files, safe to parallelise
- Tests must FAIL before implementation (constitution requirement — Red-Green-Refactor)
- The `iconsToMagicCells` fix (T004, Phase 2) is a prerequisite for US3 correctness; implement it first even though it has no dedicated test task — the existing `magicPhase.test.tsx` suite will catch regressions
- `TOGGLE_ICON` is only valid in the `market` phase; the reducer returns state unchanged if invoked during `spinning` or `magic`
- `disabledIconIds` persists to localStorage; the migration in T003 ensures existing v4 saves are not lost
