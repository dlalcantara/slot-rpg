# Tasks: Version 1.1 Bug Fixes

**Input**: Design documents from `specs/011-v11-bug-fixes/`

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story. Constitution requires test-first (Red-Green-Refactor); test tasks are listed before their implementation counterparts in every phase.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: Which user story this task belongs to (US1–US5)

---

## Phase 1: Setup

**Purpose**: Verify baseline before touching any files.

- [X] T001 Run `npm test` and confirm all existing tests pass (baseline green)
- [X] T002 Run `npx tsc --noEmit` and confirm zero type errors (baseline clean)

---

## Phase 2: Foundational

No shared infrastructure changes required. All 5 bugs are independent; proceed directly to user story phases.

---

## Phase 3: US1 — Apple Family Icon Border Colors (Priority: P1) 🎯

**Goal**: `computeHighlights` in `SlotGrid.tsx` treats Apple / 2×Apple / 3×Apple as one family for green/yellow border purposes.

**Independent Test**: Navigate to the Spin tab during Magic Phase with apple, triple-apple, and dozen-apple each in a separate column — all three cells must show a green ring.

### Tests for User Story 1

> **Write these tests FIRST and confirm they FAIL before implementation (Red)**

- [X] T003 [US1] Add cross-variant apple family test cases to `tests/unit/computeHighlights.test.ts`: (a) apple/triple-apple/dozen-apple in 3 separate columns of a 3-col grid → all three definitionIds map to `'green'`; (b) apple in col 0, triple-apple in col 1, blank in col 2 (3 active) → both map to `'yellow'`; (c) only apple in col 0 of 3 → no highlight for any apple variant. Also update the duplicated function body inside the test file to use the family-based algorithm so tests target the right contract.

### Implementation for User Story 1

- [X] T004 [US1] Fix `computeHighlights` in `src/components/SlotGrid.tsx`: (1) add `import { ICON_CATALOG } from '../game/catalog'` at top; (2) replace the `defColSets: Map<string, Set<number>>` loop with a `familyColSets: Map<string, Set<number>>` loop that keys on `ICON_CATALOG[cell.icon.definitionId]?.family ?? 'blank'` and skips `'blank'`; (3) replace the output-map loop with a second pass over grid cells that reads each cell's family colSet and emits `definitionId → color`. See plan.md Bug 1 section for the exact algorithm.

**Checkpoint**: `npm test -- computeHighlights` passes all cases including the new cross-variant tests.

---

## Phase 4: US2 — Multiplier Icon Display Fix (Priority: P1)

**Goal**: 2×Apple and 3×Apple cells display the 🍎 emoji plus a `×N` badge without clipping. Magic Boost on a multiplier apple shows the boosted value exactly once.

**Independent Test**: Open the Spin tab during Magic Phase with a reel containing triple-apple and dozen-apple icons — both show `🍎 ×2` / `🍎 ×3` without clipping; activating Magic Boost (increaseValue) on triple-apple shows only one multiplier label.

### Tests for User Story 2

> **Write these tests FIRST and confirm they FAIL before implementation (Red)**

- [X] T005 [US2] Add failing test cases to `tests/unit/ReelColumn.test.tsx`: (a) a column of `triple-apple` icons renders `🍎` and `×2` text, and `2x🍎` must NOT appear; (b) a column of `dozen-apple` icons renders `🍎` and `×3` text; (c) when `valueOverrides` has a boosted value for a `triple-apple` icon, the cell renders only one `×N` label (green, the override), not two; (d) a column of plain `apple` icons renders no `×` multiplier label at all.

### Implementation for User Story 2

- [X] T006 [P] [US2] Change emoji field in `src/game/catalog.ts`: `triple-apple.emoji` from `'2x🍎'` → `'🍎'`; `dozen-apple.emoji` from `'3x🍎'` → `'🍎'`. No other catalog fields change.
- [X] T007 [US2] Update multiplier badge render in `src/components/ReelColumn.tsx` (the per-cell JSX, currently lines ~162–168): replace the current single `{hasOverride && <span ...>(×{effectiveValue})</span>}` with a conditional that shows `×{effectiveValue}` (green, `text-green-400`) when `hasOverride`, or `×{def.valuePerColumn}` (muted, `text-gray-300`) when `!hasOverride && def.valuePerColumn > 1`, or nothing otherwise.

**Checkpoint**: `npm test -- ReelColumn` passes including new multiplier badge cases.

---

## Phase 5: US3 — Reels Store Purchase Feedback (Priority: P2)

**Goal**: Buying a reel in the Reels Store shows a visible success indicator on the purchased item within 1 second.

**Independent Test**: Open the Reels Store with enough copper, purchase Apple — a green flash / `✓` appears on the row within 1 second and fades after ~1.5 s.

### Tests for User Story 3

> **Write these tests FIRST and confirm they FAIL before implementation (Red)**

- [X] T008 [US3] Add failing test cases to `tests/unit/market.test.tsx` (use fake timers): (a) after clicking the Buy button on an affordable item, a `✓` or `ring-green-400` class appears on that item row; (b) after `vi.advanceTimersByTime(1600)`, the indicator is gone; (c) other item rows do not show the indicator.

### Implementation for User Story 3

- [X] T009 [US3] Add `justBought: boolean` prop to `src/components/MarketItem.tsx`; when true, apply `ring-2 ring-green-400` to the item container div and render a `<span>✓</span>` adjacent to the Buy button (or change button text to `✓`).
- [X] T010 [US3] Add purchase-flash state to `src/components/Market.tsx`: `const [recentlyBought, setRecentlyBought] = useState<Set<string>>(new Set())`; wrap `onBuy` with a local handler that calls `onBuy`, adds the `definitionId` to a new Set copy, sets it, and schedules a `setTimeout` (1500 ms) to remove it. Clean up timeout refs on unmount. Pass `justBought={recentlyBought.has(def.definitionId)}` to each `<MarketItem>`.

**Checkpoint**: `npm test -- market` passes including purchase-flash cases.

---

## Phase 6: US4 — Unclaimed Spin Gating (Priority: P2)

**Goal**: While a spin is unclaimed (Magic Phase), both the Reels Store and the Reel tab disable their primary actions and display a "Claim your spin first" banner.

**Independent Test**: Spin the reels; before claiming, navigate to Reels Store — Buy buttons are disabled and a yellow banner is visible. Navigate to Reel tab — Prestige button is disabled and same banner is visible. Claim the spin; both are re-enabled.

### Tests for User Story 4

> **Write these tests FIRST and confirm they FAIL before implementation (Red)**

- [X] T011 [P] [US4] Add failing unit tests to `tests/unit/market.test.tsx`: (a) when `isMagicPhase=true`, Buy buttons are all disabled; (b) a banner with text containing "Claim" is rendered; (c) when `isMagicPhase=false`, Buy buttons follow normal affordable/cap logic and no "Claim" banner is present.
- [X] T012 [P] [US4] Add failing unit tests for `ReelView` (new describe block in `tests/unit/market.test.tsx` or a new `tests/unit/ReelView.test.tsx`): (a) when `isMagicPhase=true`, the Prestige button is disabled; (b) a "Claim" banner is rendered; (c) when `isMagicPhase=false`, prestige availability follows normal logic.
- [X] T013 [P] [US4] Add failing integration test in `tests/integration/marketFlow.test.tsx`: dispatch `SPIN` then `BEGIN_MAGIC_PHASE` → navigate to the Market tab view → assert buy is blocked with message → dispatch `CLAIM` → assert buy is unblocked.

### Implementation for User Story 4

- [X] T014 [US4] Add `isMagicPhase: boolean` to the `Props` interface of `src/components/Market.tsx`. At the top of the returned JSX, when `isMagicPhase`, render a yellow banner (`text-yellow-400 bg-yellow-900/30 rounded p-2 text-sm mb-2`) with text `"Claim your spin before purchasing."`. Pass `disabled={isMagicPhase}` down to `<MarketItem>` (in addition to existing `affordable`/`atCap`).
- [X] T015 [US4] Add `disabled: boolean` to the `Props` interface of `src/components/MarketItem.tsx` and include it in the Buy `<button>` disabled condition: `disabled={!affordable || atCap || disabled}`.
- [X] T016 [US4] Add `isMagicPhase: boolean` to the `Props` interface of `src/components/ReelView.tsx`. When `isMagicPhase`, render the same yellow banner (`"Claim your spin before prestiging."`) above the reel contents, and set `disabled={isMagicPhase || !prestigeAvailable}` on the Prestige start button. Also disable the prestige-selection Confirm button when `isMagicPhase`.
- [X] T017 [US4] In `src/App.tsx`, pass `isMagicPhase={isMagicPhase}` to both `<Market>` (line ~269) and `<ReelView>` (line ~199).

**Checkpoint**: `npm test -- market` and `npm test -- marketFlow` pass including gating cases.

---

## Phase 7: US5 — SSS Feat Description Update (Priority: P3)

**Goal**: The SSS feat in the Feats tab reads "Have at least 3 silver icons in your reel."

**Independent Test**: Open the Feats tab and locate SSS — description matches exactly.

### Tests for User Story 5

> **Write this test FIRST and confirm it FAILS before implementation (Red)**

- [X] T018 [US5] Add failing description test to `tests/unit/achievements.test.ts` (following the pattern of existing description tests at line ~632): `ACHIEVEMENTS.find(a => a.id === 'sss')?.description` equals `'Have at least 3 silver icons in your reel.'`

### Implementation for User Story 5

- [X] T019 [US5] In `src/game/achievements.ts` line ~50, change `description: 'Own at least 3 silver-family icons.'` → `'Have at least 3 silver icons in your reel.'`

**Checkpoint**: `npm test -- achievements` passes including new SSS description test.

---

## Phase 8: Polish & Cross-Cutting Concerns

- [X] T020 [P] Smoke-test at 720 × 1280 px: verify `×2` / `×3` badges fit inside icon cells without overflow on mobile viewport
- [X] T021 **[GATE 1] Typecheck** — `npx tsc --noEmit` exits 0 (blocks next gates)
- [X] T022 **[GATE 2] Lint** — `npm run lint` exits 0 with zero errors
- [X] T023 **[GATE 3] Unit Tests** — `npm test -- --run` all unit tests pass
- [X] T024 **[GATE 4] Integration Tests** — all integration tests pass
- [X] T025 **[GATE 5] Build** — `npm run build` compiles cleanly
- [X] T026 **[GATE 6] Bundle Size** — gzipped JS bundle ≤ 250 KB; report delta in PR description

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — run immediately
- **US1 (Phase 3)**: Independent — can start after Setup
- **US2 (Phase 4)**: Independent — can start after Setup; T006 (catalog) and T007 (ReelColumn) are parallel to each other
- **US3 (Phase 5)**: Independent — can start after Setup; T009 (MarketItem) before T010 (Market)
- **US4 (Phase 6)**: T014 (Market) depends on T015 (MarketItem `disabled` prop). T016 (ReelView) is fully independent of US3. T017 (App.tsx) depends on T014 and T016.
- **US5 (Phase 7)**: Fully independent — can start any time after Setup
- **Polish (Phase 8)**: Depends on all desired user stories complete

### Within Each User Story

- Tests (T003, T005, T008, T011–T013, T018) MUST be written and confirmed **FAILING** before implementation starts
- T006 (catalog emoji) must complete before T007 (ReelColumn render) so the test data is consistent
- T014 (Market gate) requires T015 (MarketItem disabled prop) to be in place first
- T017 (App.tsx prop threading) must come last in US4 after T014 and T016

### Parallel Opportunities

- T003 (US1 tests) and T005 (US2 tests) can run in parallel — different files
- T006 (catalog) can run in parallel with T007 (ReelColumn) only after T005 tests are written
- T011, T012, T013 (US4 tests) can all run in parallel — different test files/describe blocks
- T016 (ReelView gating) runs in parallel with T014/T015 (Market gating)
- T018 (US5 test) + T019 (US5 fix) can run in parallel with any US1–US4 phase

---

## Parallel Example: US4 Tests

```bash
# All three test tasks can launch simultaneously:
T011: Add isMagicPhase unit tests to tests/unit/market.test.tsx
T012: Add ReelView isMagicPhase unit tests
T013: Add integration test to tests/integration/marketFlow.test.tsx
```

---

## Implementation Strategy

### MVP First (US1 + US2 — both P1)

1. Complete Phase 1 (Setup / baseline)
2. Complete Phase 3 (US1 — Apple border fix)
3. Complete Phase 4 (US2 — Multiplier display fix)
4. **STOP and VALIDATE**: run unit tests for computeHighlights + ReelColumn; manual smoke at 720 × 1280 px
5. Proceed to P2 bugs (US3, US4) if time allows

### Incremental Delivery

1. Setup → US1 → validate → US2 → validate → ship P1 fixes
2. US3 → US4 → validate → ship P2 fixes
3. US5 → validate → ship P3 fix
4. Polish / Gates → PR

### Solo Strategy

Work sequentially by priority: US1 → US2 → US3 → US4 → US5 → Polish.
US3 and US4 share Market.tsx/MarketItem.tsx — complete US3 fully before starting US4's Market changes.

---

## Notes

- `[P]` tasks target different files; verify no file conflicts before running in parallel
- US3 and US4 both modify `Market.tsx` and `MarketItem.tsx` — do not interleave; finish US3 fully first
- The `computeHighlights` test file duplicates the function body — update the copy in the test alongside adding new cases (T003)
- No new npm packages; no localStorage migration; no new components
