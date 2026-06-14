# Tasks: Version 1.0 Release Polish

**Input**: Design documents from `specs/010-v10-release/`

**Prerequisites**: plan.md ✅ spec.md ✅ research.md ✅ data-model.md ✅ quickstart.md ✅

**Tests**: Included per Constitution §II (Test-First, NON-NEGOTIABLE).

**Organization**: Grouped by user story for independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no shared dependencies)
- **[Story]**: User story this task belongs to (US1–US4)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Type change and emoji data that US2 and US4 both require. Must be complete before those phases begin.

**⚠️ CRITICAL**: US2 and US4 tasks cannot begin until this phase is complete.

- [X] T001 Add `emoji: string` field to `IconDefinition` interface in `src/game/types.ts`
- [X] T002 [P] Write failing test asserting every `ICON_CATALOG` entry has a non-empty `emoji` field in `tests/unit/catalog.test.ts` (must see RED before T003)
- [X] T003 Add `emoji` field to every entry in `src/game/catalog.ts` using the assignments from `specs/010-v10-release/data-model.md` (blank→⬜, apple→🍎, triple-apple→2x🍎, dozen-apple→3x🍎, copper→🟠, silver→⚪, gold→🟡, crown→👑, air→💨, water→💧, earth→🌿, fire→🔥, energy→⚡); confirm T002 turns GREEN

**Checkpoint**: `npm run typecheck` exits 0; T002 passes.

---

## Phase 3: User Story 1 — New Player Seeks Game Help (Priority: P1) 🎯 MVP

**Goal**: Contextual help modals accessible from the logo and each tab, with scoring explanation for the Spin tab and AI attribution on the game modal.

**Independent Test**: Click ❓ next to "Slot RPG" title → game modal appears with AI attribution text. Click ❓ on each tab → relevant modal appears. Dismiss → game state unchanged.

### Tests for User Story 1

> **Write these tests FIRST — confirm RED before implementing T005/T006**

- [X] T004 [P] [US1] Create `tests/unit/HelpModal.test.tsx`: assert (a) renders correct `<h2>` heading for each topic value; (b) renders AI attribution paragraph when topic is `'game'`; (c) calls `onClose` when close button clicked; (d) "Ways to Win" text appears when topic is `'spin'`

### Implementation for User Story 1

- [X] T005 [US1] Create `src/components/HelpModal.tsx`: full-screen backdrop + centered card matching `WinModal`/`StarvationModal` pattern; props `topic: 'game' | 'reel' | 'spin' | 'market' | 'achievements'` and `onClose: () => void`; click-outside closes; content per topic from `specs/010-v10-release/data-model.md` including verbatim AI attribution for `'game'` and Ways to Win scoring for `'spin'`; confirm T004 turns GREEN
- [X] T006 [US1] Modify `src/App.tsx`: add `helpTopic` state (`'game' | 'reel' | 'spin' | 'market' | 'achievements' | null`); add ❓ `<button>` adjacent to "Slot RPG" `<h1>` that sets `helpTopic='game'`; inside `tabs.map()` add a small ❓ `<button>` per tab that calls `e.stopPropagation()` and sets `helpTopic` to the tab's id; render `{helpTopic && <HelpModal topic={helpTopic} onClose={() => setHelpTopic(null)} />}` at bottom of component tree

**Checkpoint**: Help modals functional. Verify manually at 720 × 1280 px per `quickstart.md`.

---

## Phase 4: User Story 2 — Player Views Currency Panel (Priority: P2)

**Goal**: Currency panel displays as a 2×5 emoji grid in the specified order.

**Independent Test**: Open game → currency panel shows 2 rows of 5 cells; Row 1: 🍎 Apple, 🟠 Copper, ⚪ Silver, 🟡 Gold, 👑 Crowns; Row 2: 💨 Air, 💧 Water, 🌿 Earth, 🔥 Fire, 🎰 Spins.

### Tests for User Story 2

> **Write these tests FIRST — confirm RED before implementing T008/T009**

- [X] T007 [P] [US2] Modify `tests/unit/CurrencyDisplay.test.tsx`: add assertions for (a) exactly 10 currency cells rendered; (b) first 5 cells in order: food/Apple, copper, silver, gold, crowns; (c) last 5 cells in order: air, water, earth, fire, spins; (d) each cell contains the correct emoji character

### Implementation for User Story 2

- [X] T008 [P] [US2] Modify `src/game/currencyRegistry.ts`: (a) rename `food` entry label `'Food'` → `'Apple'`; (b) reorder `CURRENCY_ORDER` to `['food', 'copper', 'silver', 'gold', 'crowns', 'air', 'water', 'earth', 'fire']`; (c) add exported `CURRENCY_EMOJI: Record<string, string>` constant mapping each key to its emoji (food→🍎, copper→🟠, silver→⚪, gold→🟡, crowns→👑, air→💨, water→💧, earth→🌿, fire→🔥) plus a `SPINS_EMOJI = '🎰'` export
- [X] T009 [US2] Modify `src/components/CurrencyDisplay.tsx`: replace `flex-wrap` layout with `grid grid-cols-5 gap-2`; for each key in `CURRENCY_ORDER` (filtered to exclude `'energy'`) render emoji from `CURRENCY_EMOJI[key]` + value; add Spins as the 10th cell using `SPINS_EMOJI` + `spinCount`; remove `COLOR` record (no longer needed for grid cells); confirm T007 turns GREEN

**Checkpoint**: Currency panel shows 2×5 emoji grid. Verify at 720 × 1280 px.

---

## Phase 5: User Story 3 — Player Reads Achievement Descriptions (Priority: P3)

**Goal**: Accurate achievement descriptions for "Second breakfast" and "Master of Elements"; "Blow It Up" listed before "Be Water, My Friend".

**Independent Test**: Open Feats tab → "Second Breakfast" description reads "Earn >= 2 Apple in one spin."; "Master of Elements" reads "Earn all four elements in one spin."; "Blow It Up" appears above "Be Water, My Friend" in the list.

### Tests for User Story 3

> **Write these tests FIRST — confirm RED before implementing T011/T012**

- [X] T010 [P] [US3] Modify `tests/unit/achievements.test.ts`: add assertions for (a) `second-breakfast` description equals `'Earn >= 2 Apple in one spin.'`; (b) `master-of-elements` description equals `'Earn all four elements in one spin.'`; (c) `how-do-you-like-them-apples` description contains `'Reels Store'`; (d) index of `blow-it-up` in `ACHIEVEMENTS` array is less than index of `be-water-my-friend`

### Implementation for User Story 3

- [X] T011 [P] [US3] Modify `src/game/achievements.ts`: fix `second-breakfast` description → `'Earn >= 2 Apple in one spin.'`; fix `master-of-elements` description → `'Earn all four elements in one spin.'`; update `how-do-you-like-them-apples` description → `'Buy an apple from the Reels Store.'`
- [X] T012 [P] [US3] Modify `src/game/achievements.ts`: move the `blow-it-up` entry in the `ACHIEVEMENTS` array to appear immediately before the `be-water-my-friend` entry; confirm T010 turns GREEN

**Checkpoint**: All three achievement description tests pass; feat order visually correct in Feats tab.

---

## Phase 6: User Story 4 — Renamed and Reorganized UI (Priority: P4)

**Goal**: "Market" → "Reels Store" everywhere; x1 button removed from Spin tab; reel and store icons show emoji instead of text labels.

**Independent Test**: Spin tab has no x1 button; tab labeled "Reels Store"; Market.tsx heading reads "Reels Store"; reel grid and store icon cells display emoji glyphs.

### Tests for User Story 4

> **Write these tests FIRST — confirm RED before implementing T014–T017**

- [X] T013 [P] [US4] Create `tests/unit/SpinControls.test.tsx`: assert no element with text matching `/x1/i` is rendered by `<SpinControls>`

### Implementation for User Story 4

- [X] T014 [P] [US4] Rename "Market" → "Reels Store" in two places: (a) update `label` of the `'market'` entry in the `tabs` array in `src/App.tsx` from `'Market'` to `'Reels Store'`; (b) update the `<h3>` heading text in `src/components/Market.tsx` from `'Market'` to `'Reels Store'`
- [X] T015 [P] [US4] Remove the multiplier toggle `<div>` (the block containing `{MULTIPLIERS.map(...)}`) from `src/components/SpinControls.tsx`; confirm T013 turns GREEN
- [X] T016 [P] [US4] Modify `src/components/ReelColumn.tsx`: replace `def?.label ?? '?'` with `def?.emoji ?? '?'` in the icon cell `<span>` on line 164 (depends on T003)
- [X] T017 [P] [US4] Modify `src/components/MarketItem.tsx`: replace `def.label` with `def.emoji` in the `icon-cell` `<span>` on line 47 (the icon display); keep `def.label` in the `<p className="text-sm font-medium">` name line and `aria-label` (depends on T003)

**Checkpoint**: All US4 tests pass. Manually verify reel and store show emoji, tab reads "Reels Store", x1 gone.

---

## Phase 7: Polish & Quality Gates

**Purpose**: Final validation across all changes.

- [X] T018 [P] Run `quickstart.md` manual verification checklist at 720 × 1280 px: help modals readable, currency grid not clipped, emoji icons fit icon-cell bounding boxes, all renamed labels correct
- [X] T019 **[GATE 1] Typecheck** — `tsc --noEmit` exits 0 (blocks next gates)
- [X] T020 **[GATE 2] Lint** — `npm run lint` exits 0 with zero errors
- [X] T021 **[GATE 3] Unit Tests** — `npm run test:unit` — all unit tests pass
- [X] T022 **[GATE 4] Integration Tests** — `npm run test:integration` — all integration tests pass
- [X] T023 **[GATE 5] Build** — `npm run build` compiles cleanly with no warnings-as-errors
- [X] T024 **[GATE 6] Bundle Size** — gzipped JS bundle ≤ 250 KB; record before/after delta in PR description — Result: 59.69 KB gzip (well under 250 KB limit)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Foundational (Phase 2)**: No dependencies — start immediately
- **US1 (Phase 3)**: Independent — can start any time (no dependency on Foundational)
- **US2 (Phase 4)**: Depends on Foundational (T001, T003 must be done for emoji lookup)
- **US3 (Phase 5)**: Independent — can start any time (no dependency on any prior phase)
- **US4 (Phase 6)**: Depends on Foundational (T003 must be done for T016, T017)
- **Polish (Phase 7)**: Depends on all phases complete

### User Story Dependencies

- **US1**: Fully independent. Can start immediately.
- **US2**: Requires T001 (type) and T003 (catalog emoji). T008/T009 can begin after Foundational.
- **US3**: Fully independent. Can start immediately (even in parallel with Foundational).
- **US4**: T014/T015 are independent. T016/T017 require T003.

### Within Each Phase

- Test tasks (T004, T007, T010, T013) must go RED before corresponding implementation
- T008 and T009 are sequential (T008 sets up CURRENCY_ORDER/CURRENCY_EMOJI; T009 consumes them)
- T011 and T012 both modify `achievements.ts` — run sequentially to avoid conflicts
- T016 and T017 are parallel (different files)

### Parallel Opportunities

- US1 (T004–T006) and US3 (T010–T012) can proceed in parallel from the start
- Foundational (T001–T003) and US1 (T004–T006) and US3 (T010–T012) can all run simultaneously
- Within US4: T014, T015, T016, T017 are all [P] once Foundational is done

---

## Parallel Example: Fastest Path

```
Immediately (no dependencies):
  → T004 [US1] Write HelpModal tests (RED)
  → T010 [US3] Write achievement description tests (RED)
  → T002 [Foundational] Write catalog emoji test (RED)
  → T001 [Foundational] Add emoji field to types.ts

After T001:
  → T003 [Foundational] Add emoji to catalog.ts (GREEN T002)
  → T007 [US2] Write CurrencyDisplay tests (RED)
  → T013 [US4] Write SpinControls test (RED)

After T004 RED:
  → T005 [US1] Create HelpModal.tsx (GREEN T004)
  → T006 [US1] Wire into App.tsx

After T010 RED:
  → T011 + T012 [US3] Fix descriptions + reorder (GREEN T010)

After T003:
  → T008 [US2] Update currencyRegistry.ts
  → T016 + T017 [US4] Update ReelColumn.tsx, MarketItem.tsx

After T007 RED + T008:
  → T009 [US2] Update CurrencyDisplay.tsx (GREEN T007)

After T013 RED:
  → T014 + T015 [US4] Rename Market, remove x1 (GREEN T013)
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 3 (US1) — fully independent
2. **STOP and VALIDATE**: Help modals work at all breakpoints
3. Merge US1 if needed, continue with remaining phases

### Incremental Delivery

1. US1 (Help) → independently shippable
2. US3 (Achievement fixes) → independently shippable
3. Foundational → unlocks US2 and US4
4. US2 (Currency panel) → independently shippable
5. US4 (Renames + emoji icons) → completes v1.0 polish
6. Phase 7 gates → merge-ready

---

## Notes

- [P] tasks operate on different files and have no shared incomplete dependencies
- T011 and T012 both touch `achievements.ts` — do not run simultaneously
- `spinMultiplier` remains in game state and reducer; only the UI button is removed (T015)
- `food` currency key in `Currencies` type is unchanged; only its display label changes to 'Apple'
- The `COLOR` record in `CurrencyDisplay.tsx` can be removed as part of T009 (no longer needed with emoji grid)
