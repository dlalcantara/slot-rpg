# Tasks: Version 0.8 — Achievements

**Input**: Design documents from `specs/008-v08-achievements/`

**Prerequisites**: plan.md ✅ spec.md ✅ research.md ✅ data-model.md ✅

**Tests**: Included — Constitution §II mandates test-first (NON-NEGOTIABLE). Tests must be written and confirmed FAILING before implementation begins.

**Organization**: Grouped by user story to enable independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Parallelizable — different files, no dependency on incomplete tasks
- **[Story]**: User story this task belongs to (US1–US5)

---

## Phase 1: Setup

**Purpose**: Confirm baseline before any changes land.

- [X] T001 Run `npm run test:run` to confirm all existing tests pass — fix any pre-existing failures before starting

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core type and state changes that every user story depends on. Must be complete before Phase 3+.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [X] T002 Create `src/game/achievements.ts`: define `AchievementId` string union (15 IDs), `AchievementDefinition` interface, and `ACHIEVEMENTS` constant array (15 entries — title, description, isWip; no check logic yet)
- [X] T003 [P] Update `src/game/types.ts`: add `unlockedAchievements: AchievementId[]` to `GameState`; remove `masterOfElements: boolean` from `GameState`
- [X] T004 [P] Update `src/game/initialState.ts`: add `unlockedAchievements: []`, remove `masterOfElements: false`
- [X] T005 [P] Update `src/game/persistence.ts`: add migration — delete `masterOfElements` from saved state if present; set `unlockedAchievements` to `[]` if absent
- [X] T006 [P] Update `src/game/reducer.ts`: remove `masterOfElements` field assignments from `CLAIM` and `PRESTIGE` cases; remove `detectMasterOfElements` import; then delete `src/game/masterOfElements.ts`
- [X] T007 [P] Update `src/App.tsx`: remove `showMasterOfElements` state, the MoE `useEffect`, and the MoE dialog JSX block — project must compile cleanly with `npm run typecheck`

**Checkpoint**: `npm run typecheck` exits 0; `npm run test:run` still passes (no new failures)

---

## Phase 3: User Story 1 — Achievement System (Priority: P1) 🎯 MVP

**Goal**: Players can unlock achievements via in-game actions, see an unlock dialog, and view all achievements in a new 4th tab.

**Independent Test**: Open the game → buy one apple from the Market → confirm "How do you like them Apples" dialog appears → open Achievements tab → confirm achievement is highlighted.

### ⚠️ Write Tests FIRST — confirm RED before implementing

- [X] T008 Write failing unit tests for `checkNewAchievements` in `tests/unit/achievements.test.ts`: one test per checkable achievement condition (13 conditions; exclude WIP1/WIP2 and "Happily Ever After" which are covered separately) — confirm tests FAIL before T009
- [X] T010 [P] Write failing unit tests for achievement accumulation in `tests/unit/reducer.test.ts`: `BUY_ICON` apple → `unlockedAchievements` gains `'how-do-you-like-them-apples'`; duplicate unlock not appended — confirm FAIL before T011

### Implementation

- [X] T009 Implement `checkNewAchievements(prevState: GameState, newState: GameState, action: GameAction): AchievementId[]` in `src/game/achievements.ts`: evaluate all 13 checkable conditions + "Happily Ever After" cascade; filter out already-unlocked IDs; return only newly earned ones
- [X] T011 Update `src/game/reducer.ts`: at end of `BUY_ICON`, `CLAIM`, and `PRESTIGE` cases, call `checkNewAchievements(state, newState, action)` and merge returned IDs into `newState.unlockedAchievements` (deduplicated)
- [X] T012 [P] Create `src/components/AchievementsTab.tsx`: scrollable list of all 15 achievements; unlocked entries visually highlighted (e.g. green border + bright text), WIP entries labeled "Coming Soon" and dimmed, locked entries dimmed — accepts `unlockedAchievements: AchievementId[]` prop
- [X] T013 [P] Create `src/components/AchievementDialog.tsx`: modal overlay showing achievement title and description on unlock; dismiss button; accepts `achievementId: AchievementId | null` and `onDismiss: () => void` props
- [X] T014 Update `src/App.tsx`: add `'achievements'` to `ActiveTab` union and tabs array; add hidden-div render for `AchievementsTab`; add `pendingDialogs: AchievementId[]` local state; add `useEffect` (with `useRef` snapshot) to detect newly added entries in `state.unlockedAchievements` and enqueue them; render `AchievementDialog` for `pendingDialogs[0]`; on dismiss pop the queue
- [X] T015 Write integration test in `tests/integration/achievementFlow.test.tsx`: dispatch `BUY_ICON` for apple → assert `state.unlockedAchievements` includes `'how-do-you-like-them-apples'`; dispatch `CLAIM` with a spin result containing 2 apple-family icons → assert `'second-breakfast'` added

**Checkpoint**: Achievements tab renders; buying an apple triggers dialog; tab shows unlocked entry highlighted; all Phase 3 tests green

---

## Phase 4: User Story 2 — Expanded Market Purchasing (Priority: P2)

**Goal**: Market purchase limit is `qty × 2 < reel_size` (dynamic) instead of a hard cap of 3. "N left" label removed.

**Independent Test**: Have 3 of an icon in a reel of 6 (3×2=6 ≥ 6) → buy button disabled. Have 3 of an icon in a reel of 7 (3×2=6 < 7) → buy button enabled → after purchase, reel is 4/8 → buy button disabled.

### ⚠️ Write Tests FIRST — confirm RED before implementing

- [X] T016 Write failing unit tests in `tests/unit/reducer.test.ts`: `BUY_ICON` blocked when `ownedCount * 2 >= reel.icons.length`; allowed and reel grows by 1 when `ownedCount * 2 < reel.icons.length`; odd-reel edge case (3/7 → succeeds → 4/8) — confirm FAIL before T017

### Implementation

- [X] T017 Update `tryBuyIcon` in `src/game/reducer.ts`: change guard from `if (ownedCount >= 3)` to `if (ownedCount * 2 >= state.reel.icons.length)`
- [X] T018 [P] Update `src/components/Market.tsx`: compute `canBuyMore = ownedCount * 2 < reel.icons.length` per icon; pass `canBuyMore: boolean` to `MarketItem` (remove `remainingPurchasable: number`)
- [X] T019 [P] Update `src/components/MarketItem.tsx`: replace `remainingPurchasable: number` prop with `canBuyMore: boolean`; remove "N left" display line; set `atCap = !canBuyMore`
- [X] T020 Update `tests/integration/marketFlow.test.tsx`: remove hard-cap-of-3 assertions; add `qty*2 < reel_size` formula assertions; remove "N left" label assertions
- [X] T021 [P] Update `tests/unit/market.test.tsx`: add tests for even-reel cap (3/6 blocked, 2/6 allowed), odd-reel cap (3/7 allowed → 4/8 blocked), and reel-grows-by-1 on purchase

**Checkpoint**: Market buy button enables/disables per formula; "N left" label gone; all Phase 4 tests green

---

## Phase 5: User Story 3 — Remove x10/x100 Multipliers (Priority: P2)

**Goal**: x10 and x100 multiplier buttons are removed from the UI; only x1 remains.

**Independent Test**: Load the game → confirm no x10 or x100 buttons present in SpinControls.

### ⚠️ Write Tests FIRST — confirm RED before implementing

- [X] T022 Write failing unit tests in `tests/unit/reducer.test.ts`: verify `SpinMultiplier` type is now `1` only (TypeScript-level); verify persistence migration clamps loaded `spinMultiplier: 10` to `1` — confirm FAIL before T023-T025

### Implementation

- [X] T023 Update `src/game/types.ts`: narrow `SpinMultiplier = 1`; change `SpinLogEntry.multiplier` type from `SpinMultiplier` to `number` (preserves historical log entries)
- [X] T024 Update `src/game/persistence.ts`: add migration step — if loaded `settings.spinMultiplier !== 1`, set to `1`
- [X] T025 Update `src/components/SpinControls.tsx`: remove `10` and `100` from the `MULTIPLIERS` array; confirm the x1 button remains and the component renders correctly
- [X] T026 Run `npm run typecheck` and resolve any remaining references to `SpinMultiplier` values `10` or `100` in reducer, tests, or other files

**Checkpoint**: No x10/x100 UI; saved game with `spinMultiplier: 10` loads cleanly with `spinMultiplier: 1`; typecheck passes

---

## Phase 6: User Story 4 — Win Condition Removal and Currency Achievements (Priority: P3)

**Goal**: Reaching 100 crowns does not trigger a win screen. "This is Sparta" (300) and "Ancient Civilization" (5000) fire as achievements only.

**Independent Test**: Accumulate 300 crowns → no game-over/win screen → "This is Sparta" achievement dialog appears.

### ⚠️ Write Tests FIRST — confirm RED before implementing

- [X] T027 Add failing unit test in `tests/unit/reducer.test.ts`: set crowns to 100 → dispatch `CLAIM` → assert `state.phase` remains `'market'`, not `'win'` — confirm FAIL before T028

### Implementation

- [X] T028 Update `src/game/currencyRegistry.ts`: set `crowns.winCondition: null`
- [X] T029 Add targeted tests in `tests/unit/achievements.test.ts`: state with `currencies.crowns = 300` → `checkNewAchievements` returns `'this-is-sparta'`; `currencies.crowns = 5000` → returns `'ancient-civilization'`; already unlocked → not returned again
- [X] T030 Verify backward compatibility: `WinModal` component remains in `src/components/WinModal.tsx` unchanged; `CONTINUE_AFTER_WIN` action still handled in reducer (for saved games with `phase: 'win'`)

**Checkpoint**: 100+ crowns → game continues; 300 crowns → "This is Sparta" dialog; 5000 crowns → "Ancient Civilization" dialog

---

## Phase 7: User Story 5 — "Happily Ever After" Meta-Achievement (Priority: P3)

**Goal**: Unlocking all 14 non-WIP, non-meta achievements automatically awards "Happily Ever After".

**Independent Test**: Manually set `unlockedAchievements` to all 14 non-meta IDs → dispatch any action → "Happily Ever After" is awarded and its dialog appears in the queue.

### ⚠️ Write Tests FIRST — confirm RED before implementing (should pass via Phase 3 implementation)

- [X] T031 Add unit test in `tests/unit/achievements.test.ts`: pass `prevState` with 13 unlocked + `newState` with 14th non-meta ID just added → assert `checkNewAchievements` returns `['happily-ever-after']`; also test that it is NOT returned if already present in `unlockedAchievements`
- [X] T032 Add integration test in `tests/integration/achievementFlow.test.tsx`: simulate state with 14th achievement just added → assert `unlockedAchievements` includes `'happily-ever-after'`; assert both the 14th dialog and the "Happily Ever After" dialog are queued sequentially

**Checkpoint**: Full 15-achievement system complete; "Happily Ever After" cascades correctly

---

## Phase 8: Polish & CI Gates

**Purpose**: Final cleanup and verification of all six pipeline gates.

- [X] T033 [P] Remove dead code: any remaining `masterOfElements` references in tests or comments; unused imports introduced during Phase 2-7
- [X] T034 **[GATE 1] Typecheck** — `npm run typecheck` (`tsc --noEmit`) exits 0 — fix all type errors before proceeding
- [X] T035 **[GATE 2] Lint** — `npm run lint` (ESLint) exits 0 with zero errors — fix all lint errors before proceeding
- [X] T036 **[GATE 3] Unit Tests** — `npm run test:unit` — all unit tests pass; new code ≥ 80% line coverage
- [X] T037 **[GATE 4] Integration Tests** — `npm run test:integration` — all integration tests pass
- [X] T038 **[GATE 5] Build** — `npm run build` — production bundle compiles without warnings treated as errors
- [X] T039 **[GATE 6] Bundle Size** — measure gzipped JS bundle size; confirm ≤ 250 KB; report delta (before/after) in PR description
- [X] T040 [P] Manual smoke test at 720 × 1280 px: verify Achievements tab renders, unlock dialog fires, market cap works, no x10/x100 buttons present — screenshot for PR description

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies — start immediately
- **Phase 2 (Foundational)**: Depends on Phase 1 — **BLOCKS all user story phases**
- **Phase 3 (US1)**: Depends on Phase 2 completion — no dependency on US2/US3/US4/US5
- **Phase 4 (US2)**: Depends on Phase 2 completion — no dependency on US1/US3/US4/US5
- **Phase 5 (US3)**: Depends on Phase 2 completion — no dependency on US1/US2/US4/US5
- **Phase 6 (US4)**: Depends on Phase 3 (achievement check for currency milestones is implemented in T009/T011)
- **Phase 7 (US5)**: Depends on Phase 3 (cascade logic in `checkNewAchievements` from T009)
- **Phase 8 (Polish)**: Depends on Phases 3–7 complete

### User Story Dependencies

- **US1 (P1)**: Can start after Foundational — independent
- **US2 (P2)**: Can start after Foundational — independent
- **US3 (P2)**: Can start after Foundational — independent
- **US4 (P3)**: Depends on US1 (achievement check infrastructure from T009/T011)
- **US5 (P3)**: Depends on US1 (cascade logic from T009)

### Within Each Phase

1. Write tests first (RED), confirm FAIL
2. Implement (GREEN)
3. `npm run typecheck` after each modified file
4. Commit after each logical group

---

## Parallel Opportunities

### Phase 2 (Foundational) — after T002:
```
T003: types.ts       T004: initialState.ts
T005: persistence.ts T006: reducer.ts + delete masterOfElements.ts
T007: App.tsx
```

### Phase 3 (US1) — T008 and T010 in parallel (different test files):
```
T008: achievements.test.ts (13 conditions)
T010: reducer.test.ts (accumulation)
```
Then after T009 and T011:
```
T012: AchievementsTab.tsx    T013: AchievementDialog.tsx
```

### Phase 4 (US2) — after T017:
```
T018: Market.tsx    T019: MarketItem.tsx
T020: marketFlow.test.tsx    T021: market.test.tsx
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Phase 1: Setup
2. Phase 2: Foundational (CRITICAL — blocks all stories)
3. Phase 3: US1 — Achievement System
4. **STOP and VALIDATE**: buy apple → dialog appears; Achievements tab visible and correct
5. Demo-ready with core feature complete

### Incremental Delivery

1. Phases 1–2: Foundation → types and state stable
2. Phase 3: Achievement system → MVP delivered
3. Phase 4: Market cap → gameplay balance
4. Phase 5: Remove multipliers → clean UI
5. Phases 6–7: Win condition / Happily Ever After → endgame complete
6. Phase 8: CI gates + polish → PR-ready

---

## Notes

- `[P]` tasks operate on different files with no cross-dependency — safe to parallelise
- `[US*]` label maps each task to its user story for traceability
- Constitution §II: tests MUST be written and FAIL before implementation — no exceptions
- Each phase checkpoint should be verified with `npm run test:run` before proceeding
- `masterOfElements.ts` deletion (T006) requires removing its import from reducer in the same commit to avoid broken imports
