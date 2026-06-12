---

description: "Task list for Version 0.5 Visual Fixes"
---

# Tasks: Version 0.5 Visual Fixes

**Input**: Design documents from `specs/005-v05-visual-fixes/`

**Prerequisites**: plan.md, spec.md, research.md, data-model.md, contracts/

**Tests**: INCLUDED — the project constitution mandates Test-First (Red→Green→Refactor) for all
non-trivial logic, and plan.md commits to it. Each story writes its failing tests before implementation.

**Organization**: Tasks are grouped by user story (US1–US9) in priority order so each can be
implemented and verified independently.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel — the task's file is not touched by any other incomplete task.
- **[Story]**: Which user story the task belongs to (US1…US9).
- Exact file paths are included in each task.

## Path Conventions

Single-project React SPA: source in `src/`, tests in `tests/` at repo root (per plan.md).

## Shared-file sequencing (read before parallelizing)

Several stories edit the same files; tasks on a shared file MUST be sequential, not parallel:

- `src/components/ReelColumn.tsx` — US2, US3, US4, US5
- `src/components/SlotGrid.tsx` — US1, US3, US5, US9
- `src/App.tsx` — US3, US9, US8
- `tests/integration/magicPhase.test.ts` — US2, US5, US9
- `tests/unit/ReelColumn.test.tsx` — US2, US3, US4

Stories touching **disjoint** files (US6: catalog/Market, US7: currencyRegistry/initialState,
US8: reducer/types/CheatPanel) can run fully in parallel with each other and with the grid stories.

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Establish a known-green starting point and a bundle-size baseline for the PR delta.

- [ ] T001 Establish baseline: run `npm run typecheck && npm run lint && npm run test:run`, then `npm run build`; record the current gzipped JS bundle size for the later delta report.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core prerequisites shared by all stories.

**None.** v0.5 introduces no shared schema, model, or infrastructure changes — every story is a
self-contained presentational or config change (no GameState/version change). User-story phases may
begin immediately after Setup, observing the shared-file sequencing above.

**Checkpoint**: Foundation ready — user story implementation can begin.

---

## Phase 3: User Story 1 - Slot animation ends on the real result (Priority: P1) 🎯 MVP

**Goal**: Each column settles directly on its final symbols — no empty-cell flash before the result.

**Independent Test**: Spin with animation on and off; confirm each column lands on its final symbols
with no all-blank/placeholder frame.

### Tests for User Story 1

- [ ] T002 [P] [US1] Add failing test in `tests/integration/spinSettle.test.tsx` (new) asserting that after a spin completes (animation on, and animation off), the grid renders the freshly-spun symbols (`state.magicGrid`) and never an all-blank/placeholder column.

### Implementation for User Story 1

- [ ] T003 [US1] Update `displayColumns` in `src/components/SlotGrid.tsx` to source the settle target from `state.magicGrid` whenever it is present (during `spinning` and `magic`), falling back to `lastSpinResult` then the placeholder.
- [ ] T004 [US1] Run `tests/integration/spinSettle.test.tsx`; confirm green and visually confirm no empty-cell frame on first spin and subsequent spins.

**Checkpoint**: US1 functional and independently testable.

---

## Phase 4: User Story 2 - Magic ability results shown on the grid (Priority: P1)

**Goal**: Respin/swap/boost edits to the magic grid re-render immediately so the player sees them.

**Independent Test**: In the magic phase, respin a column and swap two cells; the displayed grid
updates to match each time.

### Tests for User Story 2

- [ ] T005 [P] [US2] Add failing test in `tests/unit/ReelColumn.test.tsx` (new) asserting that `ReelColumn` updates its rendered icons when the `icons` prop changes while `spinning` is false.
- [ ] T006 [P] [US2] Extend `tests/integration/magicPhase.test.ts` to assert the rendered grid text changes after `MAGIC_RESPIN` and after `MAGIC_SWAP` (not only the reducer state).

### Implementation for User Story 2

- [ ] T007 [US2] Add an effect in `src/components/ReelColumn.tsx` that syncs `displayIcons` to the `icons` prop when it changes and no animation is running (do not stomp an in-flight spin).
- [ ] T008 [US2] Run the US2 tests (T005, T006); confirm green.

**Checkpoint**: US1 + US2 both work independently.

---

## Phase 5: User Story 3 - Respin is animated when animation is on (Priority: P2)

**Goal**: Using respin animates only the targeted column (when `animate` is on), then settles on the
new symbols; with `animate` off it updates instantly.

**Independent Test**: Animation on → respin → only that column shuffles then settles. Animation off →
instant update.

**Depends on**: US2 (the animation settles onto the new icons via the prop re-sync).

### Tests for User Story 3

- [ ] T009 [US3] Extend `tests/unit/ReelColumn.test.tsx` with a failing test: a respin trigger runs the column animation when `animate` is true and settles on the new icons; with `animate` false it updates immediately and does not animate.

### Implementation for User Story 3

- [ ] T010 [US3] Add a per-column respin animation path to `src/components/ReelColumn.tsx` (e.g., a `respinToken` prop that runs the existing 200 ms interval shuffle once with a single stop timeout, honoring the `animate` flag).
- [ ] T011 [US3] Wire the trigger: pass a per-column respin trigger from `src/components/SlotGrid.tsx`, and in `src/App.tsx` make the respin action both trigger that column's animation and dispatch `MAGIC_RESPIN`.
- [ ] T012 [US3] Run US3 tests; confirm only the targeted column animates and the animation-off path is immediate.

**Checkpoint**: US1–US3 independently functional.

---

## Phase 6: User Story 4 - Locked columns clearly indicated (Priority: P2)

**Goal**: A column locked via Earth shows a clear, persistent locked indicator distinct from unlocked
columns.

**Independent Test**: Lock a column; a clear, persistent locked indicator appears on it.

### Tests for User Story 4

- [ ] T013 [US4] Extend `tests/unit/ReelColumn.test.tsx` with a failing test asserting a locked column renders a clear, persistent locked indicator (queryable element/label) distinct from unlocked columns.

### Implementation for User Story 4

- [ ] T014 [US4] Strengthen the locked-column indicator in `src/components/ReelColumn.tsx` (padlock badge + distinct border/label) within the existing 48×48 px bounding boxes (no layout shift).
- [ ] T015 [US4] Run US4 test; confirm green; manual check at 720×1280 px.

**Checkpoint**: US1–US4 independently functional.

---

## Phase 7: User Story 5 - Clear click targets for column abilities (Priority: P2)

**Goal**: When respin/lock mode is active, each column shows an obvious click target with hover/focus
emphasis.

**Independent Test**: Activate respin (or lock) mode; each column shows a clear target; clicking
selects the intended column on the first try.

### Tests for User Story 5

- [ ] T016 [US5] Extend `tests/integration/magicPhase.test.ts` with a failing test asserting that when a column-targeting mode (respin/lock) is active, each column renders an emphasized click target/affordance that is absent when no such mode is active.

### Implementation for User Story 5

- [ ] T017 [US5] Add a clear column click-target affordance (shown only when respin/lock mode is active, with hover/focus emphasis) across `src/components/SlotGrid.tsx` and `src/components/ReelColumn.tsx`, keeping within the existing column footprint.
- [ ] T018 [US5] Run US5 test; confirm green; manual mis-click check.

**Checkpoint**: US1–US5 independently functional.

---

## Phase 8: User Story 6 - Rebalanced and ordered market (Priority: P2)

**Goal**: Air = 1 copper, Water = 1 copper, Earth = 1 silver; items listed cheapest-first.

**Independent Test**: Open the market; confirm the three prices and ascending order.

**Parallelizable**: disjoint files from the grid stories — can run alongside them.

### Tests for User Story 6

- [ ] T019 [P] [US6] Update `tests/unit/catalog.test.ts` to expect costs air `{copper,1}`, water `{copper,1}`, earth `{silver,1}` (fails before impl).
- [ ] T020 [P] [US6] Add `tests/unit/market.test.tsx` (new) asserting market items render in ascending normalized-price order (cheapest first).

### Implementation for User Story 6

- [ ] T021 [P] [US6] Update `src/game/catalog.ts` costs: `air → { currency: 'copper', amount: 1 }`, `water → { currency: 'copper', amount: 1 }`, `earth → { currency: 'silver', amount: 1 }`.
- [ ] T022 [US6] Add an ascending normalized-price sort in `src/components/Market.tsx` (tier weights copper=1, silver=100, gold=10000, mirroring the 100:1 auto-convert ratios).
- [ ] T023 [US6] Run US6 tests; confirm green.

**Checkpoint**: Market correct and independently verifiable.

---

## Phase 9: User Story 7 - Updated starting deck and resources (Priority: P2)

**Goal**: New game deck = 1 Air, 1 Water, 1 Apple (Food), 1 Copper; resources = 10 Air, 10 Water, 100 Food.

**Independent Test**: Hard reset; Reel tab shows the four-symbol deck; currency display shows 10/10/100.

**Parallelizable**: disjoint files from the grid stories.

### Tests for User Story 7

- [ ] T024 [P] [US7] Add/extend `tests/unit/initialState.test.ts` (new) asserting a fresh game has deck = 1 air, 1 water, 1 apple, 1 copper and currencies air=10, water=10, food=100 (fails before impl).

### Implementation for User Story 7

- [ ] T025 [P] [US7] Update `startingAmount` in `src/game/currencyRegistry.ts`: `air` → 10, `water` → 10 (food already 100; others unchanged).
- [ ] T026 [P] [US7] Update `reel.icons` in `src/game/initialState.ts` to `[air, water, apple, copper]`.
- [ ] T027 [US7] Run US7 tests; confirm green; confirm existing `version: 4` saves still load (no migration) and keep their stored balances.

**Checkpoint**: New-game state correct; existing saves unaffected.

---

## Phase 10: User Story 9 - Unified magic action selector (Priority: P2)

**Goal**: A single clickable magic guide selects the action; the duplicate toggle button strip is
removed.

**Independent Test**: In the magic phase, clicking an ability row selects it (highlighted); clicking
again clears; switching moves selection; unaffordable rows are not selectable; the swap hint shows in
the guide; no separate toggle strip exists.

**Depends on**: grid click-handling must keep working off the lifted `magicMode` (coordinate with
US1/US3/US5 edits to `SlotGrid.tsx`).

### Tests for User Story 9

- [ ] T028 [US9] Extend `tests/integration/magicPhase.test.ts` with failing tests: clicking a guide row sets the active mode (selected styling), clicking the active row clears it, clicking another row switches it, an unaffordable row is not selectable, the swap "select 2nd cell" hint appears in the guide, and the old toggle button strip is no longer rendered.

### Implementation for User Story 9

- [ ] T029 [US9] Lift `magicMode` (and `swapFrom`) state out of `src/components/SlotGrid.tsx` into `src/App.tsx`; pass `magicMode` + `onSelectMode` to `MagicPhasePanel` and `magicMode` to `SlotGrid`.
- [ ] T030 [US9] Make each ability row in `src/components/MagicPhasePanel.tsx` a clickable selector (selected/disabled states; unaffordable rows non-selectable) and host the swap "select 2nd cell" hint.
- [ ] T031 [US9] Remove the duplicate toggle button strip from `src/components/SlotGrid.tsx` and consume `magicMode` via props (preserve column/cell click handling for respin/lock/swap/boost).
- [ ] T032 [US9] Run US9 tests; confirm a single selector and that grid click-handling still works.

**Checkpoint**: Magic phase has one clear action selector.

---

## Phase 11: User Story 8 - Developer cheat to modify resources (Priority: P3)

**Goal**: A hidden cheat sets resource balances; invisible/inert during normal play.

**Independent Test**: Trigger the cheat; set a resource; the display updates. Invalid input ignored;
cheat unreachable without the secret trigger.

**Parallelizable**: `reducer.ts`/`types.ts`/`CheatPanel.tsx` are disjoint from grid stories (App.tsx
edit must sequence after US3/US9 App.tsx edits).

### Tests for User Story 8

- [ ] T033 [P] [US8] Add `SET_CURRENCY` cases to `tests/unit/reducer.test.ts` (fail first): sets a value; sets 0; rejects negative / `NaN` / `Infinity` (state unchanged); floors non-integer; unknown currency unchanged; `phase` and other currencies unchanged.

### Implementation for User Story 8

- [ ] T034 [P] [US8] Add `| { type: 'SET_CURRENCY'; currency: CurrencyKey; amount: number }` to the `GameAction` union in `src/game/types.ts`.
- [ ] T035 [US8] Implement the `SET_CURRENCY` case (with the validation in contracts/reducer-actions.md) in `src/game/reducer.ts`, persisting via `saveState` on valid input.
- [ ] T036 [P] [US8] Create `src/components/CheatPanel.tsx` (new): hidden resource editor with per-currency inputs that dispatch `SET_CURRENCY`.
- [ ] T037 [US8] Wire a secret trigger to open the cheat panel and dispatch `SET_CURRENCY` in `src/App.tsx`; ensure it is hidden/unreachable during normal play.
- [ ] T038 [US8] Run US8 tests; confirm green; manual easter-egg + invalid-input check.

**Checkpoint**: All user stories independently functional.

---

## Phase 12: Polish & Cross-Cutting Concerns

**Purpose**: Final validation and constitution gates.

- [ ] T039 [P] Run the `quickstart.md` manual checks at 720×1280 px (all nine stories).
- [ ] T040 Remove any dead code / unused imports introduced by the changes (e.g., the removed toggle strip).
- [ ] T041 **[GATE 1] Typecheck** — `npm run typecheck` exits 0 (blocks next gates).
- [ ] T042 **[GATE 2] Lint** — `npm run lint` exits 0 with zero errors.
- [ ] T043 **[GATE 3] Unit Tests** — `npm run test:unit` passes.
- [ ] T044 **[GATE 4] Integration Tests** — `npm run test:integration` passes.
- [ ] T045 **[GATE 5] Build** — `npm run build` compiles cleanly.
- [ ] T046 **[GATE 6] Bundle Size** — gzipped JS bundle ≤ 250 KB; report the before/after delta in the PR.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: no dependencies.
- **Foundational (Phase 2)**: none for this feature.
- **User Stories (Phases 3–11)**: all may begin after Setup, subject to shared-file sequencing.
- **Polish (Phase 12)**: after all desired stories are complete.

### User Story Dependencies

- **US1 (P1)**, **US2 (P1)**: independent; both are the MVP.
- **US3 (P2)**: depends on **US2** (animation settles via the prop re-sync); shares `SlotGrid.tsx`/`App.tsx`.
- **US4 (P2)**, **US5 (P2)**: independent of each other; share grid files (sequence on `ReelColumn.tsx`/`SlotGrid.tsx`).
- **US6 (P2)**, **US7 (P2)**, **US8 (P3)**: independent, disjoint files — fully parallelizable.
- **US9 (P2)**: shares `SlotGrid.tsx`/`App.tsx`; sequence its grid edits after US1/US3/US5.

### Within Each User Story

- Failing tests first (Red), then implementation (Green), then verify.
- Run the story's tests before moving on.

### Parallel Opportunities

- US6, US7, US8 can be implemented in parallel with each other and alongside the grid stories.
- Within a story, tasks marked [P] touch unique files and can run together.
- Grid-touching stories (US1–US5, US9) must serialize edits to `ReelColumn.tsx` / `SlotGrid.tsx` / `App.tsx` and to the shared test files.

---

## Parallel Example: independent stories

```bash
# After Setup, these touch disjoint files and can run together:
Task: "US6 — update catalog costs in src/game/catalog.ts (T021)"
Task: "US7 — update startingAmount in src/game/currencyRegistry.ts (T025)"
Task: "US7 — update reel in src/game/initialState.ts (T026)"
Task: "US8 — add SET_CURRENCY to GameAction in src/game/types.ts (T034)"
Task: "US8 — create src/components/CheatPanel.tsx (T036)"
```

---

## Implementation Strategy

### MVP First (User Stories 1 + 2)

1. Phase 1 Setup.
2. US1 (settle on real result) + US2 (magic edits visible) — the two P1 fixes; the most visible
   defects. **Stop and validate.**

### Incremental Delivery

3. US3 (respin animation) → US4 (lock indicator) → US5 (click targets) — magic-phase polish.
4. US6 (market) and US7 (starting state) — config rebalance (parallelizable).
5. US9 (unified selector) — magic-phase consolidation.
6. US8 (cheat) — dev convenience / easter egg.
7. Phase 12 gates before PR.

### Notes

- [P] = unique file, no incomplete-task dependency.
- [Story] label maps each task to its user story for traceability.
- Commit after each task or logical group.
- No GameState/version change → existing saves persist; only new games adopt the new deck/resources.
