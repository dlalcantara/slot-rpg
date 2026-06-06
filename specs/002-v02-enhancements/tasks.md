# Tasks: Slot Machine RPG v0.2 Enhancements

**Input**: Design documents from `specs/002-v02-enhancements/`

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: Which user story this task belongs to (US1–US4)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Data model and state changes required before any UI work can begin.

- [ ] T001 Add `spinCount: number` field to `GameState` interface in `src/game/types.ts`
- [ ] T002 Bump `GameState.version` to `2` in `src/game/types.ts`
- [ ] T003 [P] Update `makeInitialState` in `src/game/initialState.ts` to start `spinCount` at `0` and reel at 2 blank + 1 apple + 1 copper (remove the third blank)
- [ ] T004 [P] Add `spinCount` increment to the `SPIN` case in `src/game/reducer.ts`
- [ ] T005 [P] Add `HARD_RESET` handling to reset `spinCount` to `0` in `src/game/reducer.ts` (verify it already resets via `makeInitialState`)
- [ ] T006 Add version migration in `src/game/persistence.ts`: if loaded state `version < 2`, set `spinCount = 0`
- [ ] T007 [P] Reorder `CURRENCY_ORDER` in `src/game/currencyRegistry.ts` from `['food','copper','silver','gold','crowns']` to `['food','gold','silver','copper','crowns']`

**Checkpoint**: Game logic updated — `spinCount` persists, reel starts with 4 icons, currency order correct.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Tab shell and persistent currency bar that all user stories build inside.

- [ ] T008 Add `activeTab` local state (`'reel' | 'spin' | 'market'`, default `'spin'`) to `src/App.tsx`
- [ ] T009 Replace the current flat layout in `src/App.tsx` with a tab bar (three buttons: Reel / Spin / Market) rendered above all tab panels
- [ ] T010 Render three tab panels in `src/App.tsx` — use `hidden` CSS class (not conditional rendering) so components stay mounted; only the active tab is visible
- [ ] T011 Move `<CurrencyDisplay>` outside and above the tab panels in `src/App.tsx` so it is always visible
- [ ] T012 Pass `spinCount={state.spinCount}` to `<CurrencyDisplay>` in `src/App.tsx`
- [ ] T013 Add `spinCount: number` prop to `CurrencyDisplay` in `src/components/CurrencyDisplay.tsx` and render it as a "Spins" label alongside the currencies

**Checkpoint**: Three tabs render; currency bar (with Spins counter) is always visible above them.

---

## Phase 3: User Story 1 — Tab Navigation Layout (Priority: P1) 🎯 MVP

**Goal**: Players can switch between Reel, Spin, and Market tabs; each shows distinct content.

**Independent Test**: Load the game, click each tab, confirm correct content appears and tab switching hides previous content.

- [ ] T014 [US1] Create `src/components/ReelView.tsx` that receives `reel: Reel` prop and renders a list of the reel's icon labels (one per icon instance)
- [ ] T015 [US1] Place `<ReelView reel={state.reel} />` inside the Reel tab panel in `src/App.tsx`
- [ ] T016 [US1] Move `<SlotGrid>` and `<SpinButton>` into the Spin tab panel in `src/App.tsx`
- [ ] T017 [US1] Move `<Market>` into the Market tab panel in `src/App.tsx` (remove the `showMarket` conditional — market is always mounted, just hidden when not on Market tab)

**Checkpoint**: All three tabs display their correct content; switching tabs works; Reel tab lists current reel icons.

---

## Phase 4: User Story 2 — Persistent Currency Bar with Spins Counter (Priority: P2)

**Goal**: Currency bar is always visible with correct Gold > Silver > Copper order and incrementing Spins counter.

**Independent Test**: Perform spins, switch tabs, confirm currency bar and Spins counter are visible and correct on every tab.

*Note: The foundational tasks (T007–T013) already implement the core of this story. This phase verifies correctness and handles edge cases.*

- [ ] T018 [US2] Write unit test in `tests/unit/reducer.test.ts` asserting `spinCount` increments by 1 per `SPIN` action and resets to `0` on `HARD_RESET`
- [ ] T019 [US2] Write unit test in `tests/unit/initialState.test.ts` asserting the starting reel contains exactly 2 blanks, 1 apple, 1 copper (4 total)
- [ ] T020 [P] [US2] Write unit test in `tests/unit/reducer.test.ts` asserting currency order in `CURRENCY_ORDER` is `food, gold, silver, copper, crowns`
- [ ] T021 [US2] Verify `CurrencyDisplay` renders Spins counter and currencies in correct order by manually smoke-testing at 720×1280 px viewport

**Checkpoint**: `spinCount` unit tested; starting reel unit tested; currency order unit tested; visual confirmed at mobile viewport.

---

## Phase 5: User Story 3 — Improved Spin Animation (Priority: P3)

**Goal**: All columns start simultaneously, cycle icons every 0.2 s, stop individually with obvious visual distinction, and a result modal appears when all columns stop.

**Independent Test**: Press Spin, observe all columns animate simultaneously, stop one-by-one with clear visual difference, then dismiss the result modal.

### 5a: Spinning visual state & simultaneous start

- [ ] T022 [US3] Rewrite the `useEffect` in `src/components/ReelColumn.tsx` to remove the `colIndex * 300` start delay — all columns must call `setAnimating(true)` immediately when `spinning` becomes `true`
- [ ] T023 [US3] Add `reelIcons: Icon[]` prop to `ReelColumn` in `src/components/ReelColumn.tsx`; start a `setInterval(200)` on spin start that picks a random icon from `reelIcons` and stores it in local state for display while animating
- [ ] T024 [US3] Replace the `opacity-50` spinning style in `ReelColumn` with a clearly distinct class (e.g., `bg-blue-900 ring-2 ring-blue-400`) so the spinning state is visually obvious; restore default `bg-gray-800` when stopped
- [ ] T025 [US3] Update `src/components/SlotGrid.tsx` to accept `reel: Reel` prop and pass `reelIcons={reel.icons}` to each `<ReelColumn>`
- [ ] T026 [US3] Pass `reel={state.reel}` to `<SlotGrid>` in `src/App.tsx`

### 5b: Per-column staggered stop timing

- [ ] T027 [US3] Update stop `setTimeout` durations in `ReelColumn` to `1500 + colIndex * 600` ms (columns 0–4 stop at 1500, 2100, 2700, 3300, 3900 ms); clear the cycling interval when the column stops and display its final resolved icon from `icons` prop

### 5c: Result modal

- [ ] T028 [US3] Create `src/components/SpinResultModal.tsx` — fixed overlay showing a list of payouts from `result.payouts` (family, amount, currency); if payouts is empty show "No match — better luck next time"; single "Continue" button calls `onDismiss`
- [ ] T029 [US3] Add `spinDone` local state (boolean, default `false`) to `src/App.tsx`; set it `true` in `handleSpinDone`, reset to `false` in a new `handleModalDismiss` callback
- [ ] T030 [US3] Render `<SpinResultModal>` in `src/App.tsx` when `spinDone && state.lastSpinResult !== null`; pass `result={state.lastSpinResult}` and `onDismiss={handleModalDismiss}`

### 5d: Spin button disabled during spin

- [ ] T031 [US3] Ensure `SpinButton` is disabled while `spinning === true` in `src/components/SpinButton.tsx` — add `disabled={spinning}` prop if not already present; apply a visually disabled style (e.g., `opacity-50 cursor-not-allowed`)
- [ ] T032 [US3] Pass `spinning={spinning}` to `<SpinButton>` in `src/App.tsx` (if not already passed)

**Checkpoint**: All columns spin simultaneously; icons cycle visibly every 0.2 s; columns stop with staggered timing and a clear visual indicator; result modal appears and dismisses correctly; Spin button is non-interactive during spin.

---

## Phase 6: User Story 4 — Icon Size & Starting Reel (Priority: P4)

**Goal**: All icons render at 128×128 px; new game starts with 2 blanks, 1 apple, 1 copper.

**Independent Test**: Start a new game, verify reel has 4 icons (correct types), and confirm icon cells are 128×128 px at all viewports.

*Note: Starting reel composition was already changed in T003. This phase handles icon sizing and verification.*

- [ ] T033 [US4] Update `icon-cell` CSS class in `src/styles/index.css` (or Tailwind config) to use `w-32 h-32` (128×128 px) instead of any existing fixed size
- [ ] T034 [US4] Verify icon size renders correctly in `<ReelColumn>`, `<SlotGrid>`, and `<ReelView>` — adjust any wrapper `div` sizing as needed so icons are not clipped or overflowing at 128×128
- [ ] T035 [US4] Confirm `<SlotGrid>` grid sizing is larger than before (the tab layout frees horizontal/vertical space); adjust gap/padding if the grid looks cramped at the new icon size

**Checkpoint**: Icons are visibly 128×128 px throughout the game; starting reel confirmed as 2 blank + 1 apple + 1 copper; grid fits the Spin tab comfortably.

---

## Phase 7: Polish & Cross-Cutting Concerns

- [ ] T036 [P] Remove dead code from `src/App.tsx`: the old `showMarket` variable and any leftover conditional rendering replaced by the tab layout
- [ ] T037 [P] Smoke test at 720×1280 px: tab bar visible, currency bar always present, grid not clipped, icons 128×128, spin button disabled during spin, modal appears post-spin
- [ ] T038 **[GATE 1] Typecheck** — run `npm run typecheck`; fix all errors before proceeding
- [ ] T039 **[GATE 2] Lint** — run `npm run lint`; fix all ESLint errors
- [ ] T040 **[GATE 3] Unit Tests** — run `npm run test:unit`; all tests pass
- [ ] T041 **[GATE 4] Build** — run `npm run build`; production bundle compiles cleanly
- [ ] T042 **[GATE 5] Bundle Size** — confirm gzipped JS bundle ≤ 250 KB; report before/after delta

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies — start immediately; T003/T004/T005/T007 are parallel
- **Phase 2 (Foundational)**: Requires Phase 1 complete; T008→T009→T010 sequential; T011/T012/T013 follow T010
- **Phase 3 (US1 — Tabs)**: Requires Phase 2; T014/T015/T016/T017 can proceed in parallel
- **Phase 4 (US2 — Currency Bar)**: Requires Phase 2; T018/T019/T020 parallel, T021 after
- **Phase 5 (US3 — Animation)**: Requires Phase 3 (SlotGrid must be in Spin tab); 5a → 5b → 5c → 5d sequential within sub-phases
- **Phase 6 (US4 — Icon Size)**: Requires Phase 3 (components must be in tabs); T033/T034/T035 mostly parallel
- **Phase 7 (Polish)**: Requires all phases complete

### Parallel Opportunities

- T003, T004, T007 (Phase 1) — different files
- T018, T019, T020 (Phase 4 tests) — different test files
- T014, T015, T016, T017 (Phase 3) — different components/locations
- T033, T034 (Phase 6) — different files

---

## Implementation Strategy

### MVP First (User Story 1 — Tab Layout)

1. Complete Phase 1: Setup (T001–T007)
2. Complete Phase 2: Foundational tab shell (T008–T013)
3. Complete Phase 3: Tab content (T014–T017)
4. **STOP and VALIDATE**: Three tabs work; currency bar visible on all tabs
5. Continue to Phase 4 (currency tests), Phase 5 (animation), Phase 6 (icon size)

### Incremental Delivery

1. Phase 1+2 → Tab shell with currency bar ✓
2. Phase 3 → Full tab navigation ✓ (MVP deliverable)
3. Phase 4 → Currency bar tests confirmed ✓
4. Phase 5 → Improved spin animation + result modal ✓
5. Phase 6 → Icon sizing complete ✓
6. Phase 7 → Gates pass → Ship ✓
