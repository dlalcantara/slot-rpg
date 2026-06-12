# Tasks: v0.7 Prestige Patch

**Input**: Design documents from `specs/007-v07-prestige-patch/`

**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅

**Tests**: Included — constitution mandates TDD (write tests first, confirm fail, then implement).

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to
- Exact file paths in all descriptions

---

## Phase 1: Foundational (Blocking Prerequisites)

**Purpose**: State schema, type definitions, and data-layer changes that every feature phase depends on. No user story work can begin until this phase is complete.

**⚠️ CRITICAL**: Complete before any Phase 2+ work.

- [X] T001 Update `src/game/types.ts`: rename `lockedColumns` → `blockedColumns` in `GameState`; remove `disabledIconIds`; change `MagicMode` `'lock'` → `'block'`; remove `MAGIC_LOCK` and `TOGGLE_ICON` from `GameAction`; add `MAGIC_BLOCK_COLUMN` and `PRESTIGE` to `GameAction`
- [X] T002 [P] Update `src/game/initialState.ts`: bump `version` 5→6; remove `disabledIconIds`; rename `lockedColumns` → `blockedColumns`; export `PRESTIGE_STARTING_CURRENCIES` constant (food:10, air:10, water:10, all others:0); use `PRESTIGE_STARTING_CURRENCIES` in `makeInitialState()`
- [X] T003 [P] Update `src/game/persistence.ts`: bump `CURRENT_VERSION = 6`; add v5→v6 migration (strip `disabledIconIds` and `lockedColumns`, add `blockedColumns: []`)
- [X] T004 Update `src/game/spinLogic.ts`: remove `disabledIconIds` param from `drawColumn` and `computeSpin`; add optional `requiredColumnCount = columns.length` param to `calculatePayouts`; change win-condition check from `colValues.length < 5` to `colValues.length < requiredColumnCount`

**Checkpoint**: Foundation ready — all feature phases can now proceed in parallel (single dev: proceed sequentially).

---

## Phase 2: US1 + US3 — Block Column & Multiplier Lock (Priority: P1) 🎯 MVP

**Goal (US1)**: Replace the Earth "Lock Column" ability with "Block Column" — blocked columns are excluded from the spin result and reward calculation; cost escalates 1/2/3/4 Earth (×multiplier); resets on Claim; max 4 blocks.

**Goal (US3)**: Disable the x1|x10|x100 multiplier toggle during the Magic Phase. All ability costs (respin, swap, boost value, block column) are multiplied by the active multiplier.

**Independent Test (US1)**: Enter Magic Phase → use Block Column → verify column icons are dimmed and "🚫 Blocked" indicator appears → Claim → verify reward excludes the blocked column's icons → verify blockedColumns resets.

**Independent Test (US3)**: Enter Magic Phase with multiplier at x10 → attempt to click toggle → verify it doesn't change → respin costs 10 Air (not 1).

> **⚠️ Write tests first — confirm they FAIL before implementing**

### Tests for US1 + US3

- [X] T005 Write unit tests in `tests/unit/reducer.test.ts` for `MAGIC_BLOCK_COLUMN`: first block deducts 1 Earth; second block deducts 2 Earth; x10 multiplier makes first block cost 10 Earth; insufficient Earth → state unchanged; blocking already-blocked column → state unchanged; fifth block → state unchanged (max 4); blocked column not counted in CLAIM reward (use 4-column reel scenario)
- [X] T006 [P] Write unit tests in `tests/unit/reducer.test.ts` for CLAIM with blocked columns: icon present in 4 of 5 columns, block the missing-icon column, CLAIM → payout computed; `blockedColumns` is `[]` after CLAIM
- [X] T007 [P] Write unit test in `tests/unit/spinLogic.test.ts` for `calculatePayouts` with `requiredColumnCount=4`: icon in 4 active columns wins; icon in 3 active columns → no payout; default 5-column behavior preserved
- [X] T008 [P] Write integration test skeleton in `tests/integration/magicPhase.test.tsx` for block column + CLAIM flow: spin → magic phase → block one column → CLAIM → verify expected payout

### Implementation for US1 + US3

- [X] T009 Update SPIN case in `src/game/reducer.ts`: remove "carry `lockedColumns`" logic (all 5 columns drawn fresh); remove `disabledIconIds` arg from `drawColumn` calls
- [X] T010 Update BEGIN_MAGIC_PHASE case in `src/game/reducer.ts`: replace `lockedColumns: []` with `blockedColumns: []`
- [X] T011 Update MAGIC_RESPIN case in `src/game/reducer.ts`: multiply cost by `state.pendingMultiplier`; remove `disabledIconIds` from `drawColumn` call
- [X] T012 Update MAGIC_SWAP case in `src/game/reducer.ts`: multiply cost by `state.pendingMultiplier`
- [X] T013 Update MAGIC_INCREASE_VALUE case in `src/game/reducer.ts`: multiply cost by `state.pendingMultiplier`
- [X] T014 Replace MAGIC_LOCK case with MAGIC_BLOCK_COLUMN in `src/game/reducer.ts`: block up to 4 columns; cost = `(blockedColumns.length + 1) * pendingMultiplier`; add `colIdx` to `blockedColumns`
- [X] T015 Remove TOGGLE_ICON case from `src/game/reducer.ts`
- [X] T016 Update CLAIM case in `src/game/reducer.ts`: filter out `blockedColumns` from `iconColumns` before passing to `calculatePayouts`; store full 5-column `iconColumns` in `lastSpinResult`; reset `blockedColumns: []`
- [X] T017 Update `src/components/SpinControls.tsx`: add `isMagicPhase: boolean` prop; add `isMagicPhase` to `disabled` condition on multiplier buttons
- [X] T018 Update `src/components/MagicPhasePanel.tsx`: rename `lockedColumns` prop → `blockedColumns`; add `multiplier: SpinMultiplier` prop; multiply all costs by `multiplier`; replace Lock Column `ActionRow` with Block Column (`mode='block'`); max display changes from 3 to 4; update status text to show blocked columns
- [X] T019 Update `src/components/SlotGrid.tsx`: add `blockedColumns: number[]` prop; update `isTargetingMode` to include `'block'`; rename `handleColumnClick` `'lock'` branch → `'block'` dispatching `MAGIC_BLOCK_COLUMN`; pass `blocked={blockedColumns.includes(i)}` to each `ReelColumn`; remove `lockedColumns` prop
- [X] T020 Update `src/components/ReelColumn.tsx`: rename `locked` prop → `blocked`; change visual treatment (dim icons with `opacity-40`, show `🚫` indicator instead of `🔒`); update spin animation guard (`if (blocked)`)
- [X] T021 Update `src/App.tsx` for US1+US3: rename all `lockedColumns` references to `blockedColumns`; pass `blockedColumns={state.blockedColumns}` to `SlotGrid`; pass `blockedColumns` and `multiplier={state.pendingMultiplier}` to `MagicPhasePanel`; pass `isMagicPhase={isMagicPhase}` to `SpinControls`

**Checkpoint**: Block Column and Multiplier Lock are fully functional. Tests pass. Existing respin/swap/boost tests still pass.

---

## Phase 3: US2 — Magic Phase Visual Feedback (Priority: P1)

**Goal**: During the Magic Phase, icons appearing in all active (non-blocked) columns get a green border on every cell; icons missing from exactly one active column get a yellow border. Borders update whenever the grid changes (respin, block column).

**Independent Test**: Enter Magic Phase with an icon present in all 5 active columns → confirm green borders on all cells of that icon type. Respin one column so the icon appears in only 4 of 5 → borders turn yellow.

> **⚠️ Write tests first — confirm they FAIL before implementing**

### Tests for US2

- [X] T022 Write unit tests for `computeHighlights` function in `tests/unit/computeHighlights.test.ts`: 5/5 active columns → green; 4/5 → yellow; 3/5 → no highlight; with 1 blocked column, 4/4 active → green; blank icons excluded; empty grid → empty map

### Implementation for US2

- [X] T023 Add pure `computeHighlights(grid: MagicCell[][], blockedCols: number[]): Map<string, 'green' | 'yellow'>` helper to `src/components/SlotGrid.tsx` (outside component)
- [X] T024 Compute `highlights` map in `SlotGrid` render path: `isMagicPhase && magicGrid ? computeHighlights(magicGrid, blockedColumns) : new Map()`; pass `highlights` prop to each `ReelColumn`
- [X] T025 Add `highlights: Map<string, 'green' | 'yellow'>` prop (default `new Map()`) to `src/components/ReelColumn.tsx`; apply `ring-2 ring-green-400` or `ring-2 ring-yellow-400` border class to each cell button based on `highlights.get(icon.definitionId)`

**Checkpoint**: Green/yellow cell borders appear and update in real time during Magic Phase, including after Block Column actions.

---

## Phase 4: US4 — Claim Toast Notification (Priority: P2)

**Goal**: Replace the blocking `SpinResultModal` with a small, non-blocking toast that auto-dismisses after 3 seconds. If a second claim occurs while toast is visible, the toast is replaced rather than stacked.

**Independent Test**: Spin → Claim → verify toast appears with payout summary and no blocking overlay → toast disappears automatically after ~3 seconds → UI remains interactive while toast is visible.

> **⚠️ Write tests first — confirm they FAIL before implementing**

### Tests for US4

- [X] T026 Write component test in `tests/unit/SpinResultToast.test.tsx`: renders payout text when payouts present; renders "No match" text when payouts empty; has `role="status"` and `aria-live="polite"`

### Implementation for US4

- [X] T027 Create `src/components/SpinResultToast.tsx`: small fixed bottom-right card with `role="status"` and `aria-live="polite"`; render payout list or "No match" message; no dismiss button (auto-dismiss only)
- [X] T028 Update `src/App.tsx` for US4: replace `showModal`/`handleModalDismiss` state with `toastResult: SpinResult | null` and `toastTimerRef`; add `useEffect` on `state.lastSpinResult` to show toast and schedule 3-second dismiss (clear previous timer if pending); replace `<SpinResultModal>` with `{toastResult && <SpinResultToast result={toastResult} />}`; remove `isNotableResult` import if no longer used
- [X] T029 Delete `src/components/SpinResultModal.tsx`

**Checkpoint**: Claiming a spin shows a toast, not a modal. Rapid claims replace the previous toast.

---

## Phase 5: US5 — Market Purchase Limits (Priority: P2)

**Goal**: Cap purchases of any icon at 3 total copies in the reel. Starting icons (apple, air, water, copper) each start with 1 copy, so at most 2 can be purchased. The cap is enforced in both the UI (Buy button disabled) and the reducer (guard in `tryBuyIcon`).

**Independent Test**: Start a new game → open Market → verify apple shows "2 left"; buy 2 apples → verify apple shows "0 left" and Buy is disabled → verify attempting to buy a 3rd apple via keyboard/devtools has no effect.

> **⚠️ Write tests first — confirm they FAIL before implementing**

### Tests for US5

- [X] T030 Write unit tests in `tests/unit/reducer.test.ts` for `BUY_ICON` cap: buying 3rd copy of an icon succeeds; buying 4th copy → state unchanged (returns early)

### Implementation for US5

- [X] T031 Add 3-copy guard to `tryBuyIcon` in `src/game/reducer.ts`: before creating `newIcon`, check `state.reel.icons.filter(i => i.definitionId === iconDefinitionId).length >= 3`; if true, return `state`
- [X] T032 Update `src/components/Market.tsx`: add `reel: Reel` prop; compute `ownedCounts: Map<string, number>` from `reel.icons`; pass `remainingPurchasable={Math.max(0, 3 - (ownedCounts.get(def.definitionId) ?? 0))}` to each `MarketItem`
- [X] T033 Update `src/components/MarketItem.tsx`: add `remainingPurchasable: number` prop; add `atCap = remainingPurchasable === 0` to `disabled` condition; show `· N left` in price line when `remainingPurchasable < 3`
- [X] T034 Pass `reel={state.reel}` to `<Market>` in `src/App.tsx`

**Checkpoint**: Market correctly limits purchases to 3 copies per icon type; Buy button disabled at cap; reducer also blocks excess purchases.

---

## Phase 6: US6 — Apple Market Pricing Rebalance (Priority: P2)

**Goal**: Update Apple bundle listings: "2× Apple" for 1 Silver (was "3×" for 1 Silver); "3× Apple" for 1 Gold (was "12×" for 1 Gold).

**Independent Test**: Open Market → verify "2× Apple" listing costs 1 Silver → verify "3× Apple" listing costs 1 Gold → verify no other Apple bundle listings exist.

### Implementation for US6

- [X] T035 Update `src/game/catalog.ts`: change `triple-apple` `valuePerColumn` from 3 to 2 and `label` from `'3× Apple'` to `'2× Apple'`; change `dozen-apple` `valuePerColumn` from 12 to 3 and `label` from `'12× Apple'` to `'3× Apple'`

**Checkpoint**: Market shows "2× Apple / 1 Silver" and "3× Apple / 1 Gold". Existing reel icons with these definitionIds automatically reflect new payout values.

---

## Phase 7: US7 — Starting Currency Rebalance (Priority: P2)

**Goal**: New games start with food=10, air=10, water=10, and 0 of everything else (food was previously 100).

**Independent Test**: Hard-reset the game → verify food shows 10 (not 100) → verify air=10, water=10 → verify copper, silver, gold, earth, fire all show 0.

### Implementation for US7

- [X] T036 [P] Update `src/game/currencyRegistry.ts`: change `food.startingAmount` from `100` to `10`
- [X] T037 [P] Verify `src/game/initialState.ts` uses `PRESTIGE_STARTING_CURRENCIES` (food:10, air:10, water:10, others:0) rather than `buildInitialCurrencies()` (which reads from registry); remove `buildInitialCurrencies()` if it's now unused

**Checkpoint**: Hard reset starts with 10 food. Prestige reset also uses the same values (shared constant).

---

## Phase 8: US8 + US9 — Reel Tab Display & Remove Enable/Disable (Priority: P3)

**Goal (US8)**: Icons in the Reel tab are displayed grouped by icon type (all copies of the same icon are adjacent), making it easy to see copy counts at a glance.

**Goal (US9)**: Per-icon enable/disable controls are removed from the Reel tab entirely.

**Independent Test**: Open Reel tab with ≥2 copies of one icon type → verify identical icons appear consecutively → verify no enable/disable button or toggle exists for any icon.

### Implementation for US8 + US9

- [X] T038 Rewrite `src/components/ReelView.tsx`: remove `disabledIconIds` and `onToggleIcon` props; add `onPrestige` prop placeholder (wire up in US10); sort `reel.icons` by `definitionId` before rendering so identical icons group together; render plain icon cells (no toggle/opacity/disabled state); compute `countByDefId` and `eligibleDefIds` (those with ≥3 copies); add prestige explanation paragraph and disabled Prestige button (full button logic added in US10); update header to show only icon count (remove "N enabled" text)
- [X] T039 Update `src/App.tsx` for US8+US9: remove `disabledIconIds` and `onToggleIcon` props from `<ReelView>`; keep `onPrestige` as no-op stub until US10

**Checkpoint**: Reel tab shows grouped icons with no toggle controls. Prestige button visible but disabled (or not yet wired up).

---

## Phase 9: US10 — Prestige System (Priority: P3)

**Goal**: When the player has ≥4 icon types with 3 copies each, the Prestige button activates. Clicking it opens an in-tab selection UI where the player picks ≥4 icons to keep (1 copy each), then confirms. On confirmation: reel resets to 1 copy of each selected icon, currencies reset to food=10/air=10/water=10/0-else, spin counter is preserved.

**Independent Test**: Accumulate 4 icon types × 3 copies → Prestige button becomes active → click → select 4 icons → Confirm → verify reel has exactly 4 icons (1 of each selected type) → verify currencies reset → verify spin count unchanged.

> **⚠️ Write tests first — confirm they FAIL before implementing**

### Tests for US10

- [X] T040 Write unit tests in `tests/unit/reducer.test.ts` for `PRESTIGE`: valid selection (4 icons, each with ≥3 copies) → reel = 1 copy each; currencies = prestige starting values; spinCount preserved; phase = 'market'; <4 selection → state unchanged; selection includes defId without 3 copies → state unchanged; selection with 5 icons → reel = 5 icons
- [X] T041 [P] Write integration test in `tests/integration/prestige.test.tsx`: full flow — build up reel with 4×3 icons → dispatch PRESTIGE → verify all state resets

### Implementation for US10

- [X] T042 Add `PRESTIGE` case to `src/game/reducer.ts`: validate `keepDefinitionIds.length >= 4`; validate each defId has ≥3 copies in reel (`countMap`); reset reel to 1 copy of each selected defId (fresh UUIDs); reset currencies to `PRESTIGE_STARTING_CURRENCIES`; preserve `spinCount`; reset `phase: 'market'`, `magicGrid: null`, `blockedColumns: []`, `magicCounters`, `masterOfElements: false`, `pendingMultiplier: 1`
- [X] T043 Complete prestige UI in `src/components/ReelView.tsx`: add `prestigeSelecting: boolean` and `selected: Set<string>` local state; when `prestigeSelecting` is false, show grouped reel + prestige explanation + Prestige button (disabled if `eligibleDefIds.length < 4`, shows "need N more" hint); when `prestigeSelecting` is true, show eligible icons as selectable grid (toggle on click), Confirm button (disabled if `selected.size < 4`, shows count), Cancel button; on Confirm dispatch `onPrestige([...selected])` and reset local state
- [X] T044 Wire up `onPrestige` in `src/App.tsx`: `onPrestige={(keepDefinitionIds) => dispatch({ type: 'PRESTIGE', keepDefinitionIds })}`

**Checkpoint**: Full Prestige cycle works end-to-end. Spin counter preserved. All other state correctly reset.

---

## Phase 10: Polish & Cross-Cutting Concerns

**Purpose**: Final cleanup, type-check, all gates.

- [X] T045 [P] Verify `src/App.tsx` has no remaining references to removed fields (`disabledIconIds`, `lockedColumns`, `TOGGLE_ICON`, `SpinResultModal`, `showModal`, `handleModalDismiss`)
- [X] T046 [P] Remove unused imports across all touched files (check `isNotableResult` in `App.tsx`, `lockedColumns` in `MagicPhasePanel`, etc.)
- [X] T047 Run full unit test suite and confirm all tests pass: `npm run test:unit`
- [X] T048 Run full integration test suite: `npm run test:integration`
- [X] T049 **[GATE 1] Typecheck** — `npm run typecheck` exits 0 (blocks next gates)
- [X] T050 **[GATE 2] Lint** — `npm run lint` exits 0 with zero errors
- [X] T051 **[GATE 3] Unit Tests** — `npm run test:unit` all pass
- [X] T052 **[GATE 4] Integration Tests** — `npm run test:integration` all pass
- [X] T053 **[GATE 5] Build** — `npm run build` compiles without errors
- [X] T054 **[GATE 6] Bundle Size** — gzipped JS bundle ≤ 250 KB; record before/after delta

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Foundational)**: No dependencies — start immediately
- **Phase 2 (US1+US3)**: Requires Phase 1 complete — blocks Phases 3, 4 (magic phase changes)
- **Phase 3 (US2)**: Requires Phase 2 complete (needs `blockedColumns` in SlotGrid)
- **Phase 4 (US4)**: Requires Phase 1 complete; independent of Phases 2–3
- **Phase 5 (US5)**: Requires Phase 1 complete; independent of Phases 2–4
- **Phase 6 (US6)**: No dependencies — can start any time
- **Phase 7 (US7)**: No dependencies — can start any time
- **Phase 8 (US8+US9)**: Requires Phase 1 complete
- **Phase 9 (US10)**: Requires Phase 8 complete (adds UI on top of refactored ReelView)
- **Phase 10 (Polish)**: Requires all prior phases

### User Story Dependencies

- **US1+US3 (Phase 2)**: Depends on Phase 1 only
- **US2 (Phase 3)**: Depends on Phase 2 (needs `blockedColumns` for correct highlight computation)
- **US4 (Phase 4)**: Depends on Phase 1 only
- **US5 (Phase 5)**: Depends on Phase 1 only
- **US6 (Phase 6)**: No dependencies
- **US7 (Phase 7)**: No dependencies
- **US8+US9 (Phase 8)**: Depends on Phase 1 (types)
- **US10 (Phase 9)**: Depends on Phase 8

### Parallel Opportunities

Within Phase 1: T002 and T003 can run in parallel (different files).

After Phase 1 completes, the following phases can start in parallel:
- Phase 2 (US1+US3) + Phase 4 (US4) + Phase 5 (US5) + Phase 6 (US6) + Phase 7 (US7) + Phase 8 (US8+US9)

Within Phase 2: Tests (T005, T006, T007, T008) can run in parallel; reducer case updates (T009–T016) must be sequential (same file).

Within Phase 9: T040 and T041 can run in parallel.

---

## Parallel Example: US1 + US3 Tests

```bash
# Write these concurrently (different files):
Task T005: "Unit tests for MAGIC_BLOCK_COLUMN in tests/unit/reducer.test.ts"
Task T007: "Unit tests for calculatePayouts with requiredColumnCount in tests/unit/spinLogic.test.ts"
Task T008: "Integration test skeleton in tests/integration/magicPhase.test.tsx"
```

---

## Implementation Strategy

### MVP: US1+US3 (Phase 1 → Phase 2)

1. Complete Phase 1 (Foundational)
2. Complete Phase 2 (Block Column + Multiplier Lock)
3. **STOP and VALIDATE**: Magic Phase has Block Column working, multiplier locked, costs scaled
4. Run `npm run typecheck && npm run test`

### Incremental Delivery

1. Phase 1 → Foundation ready
2. Phase 2 → Block Column + Multiplier Lock *(core magic phase change)*
3. Phase 3 → Color coding *(visual enhancement)*
4. Phase 4 → Toast *(UX improvement)*
5. Phases 5–7 → Market rebalance *(balance changes)*
6. Phases 8–9 → Reel tab + Prestige *(headline feature)*
7. Phase 10 → Polish + all gates

---

## Notes

- [P] tasks = different files, no dependencies → can be done concurrently
- [Story] label maps each task to its user story for traceability
- Tests marked with ⚠️ must be written and confirmed to fail **before** the corresponding implementation tasks
- `src/game/reducer.ts` changes in Phase 2 are sequential (same file)
- `src/App.tsx` is touched in multiple phases — each phase's App update is scoped to only that phase's additions
- Total tasks: 54 | Test tasks: 12 | Implementation tasks: 37 | Gate tasks: 5
