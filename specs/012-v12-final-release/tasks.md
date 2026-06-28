# Tasks: Version 1.2 Final Release

**Input**: Design documents from `specs/012-v12-final-release/`

**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅

**Tests**: Included — constitution mandates test-first (Red-Green-Refactor). Write each test task and confirm it fails BEFORE implementing the corresponding feature task.

**Organization**: Tasks are grouped by user story in priority order (P1 → P2 → P3). The Foundational phase unlocks all stories.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story]**: Maps to user stories from spec.md (US1–US7)
- All file paths are relative to the repository root

---

## Phase 1: Foundational (Type Extensions — Blocks All Stories)

**Purpose**: Extend TypeScript types so all user stories can reference the new fields without compile errors. No runtime behaviour changes yet.

**⚠️ CRITICAL**: Complete this phase before writing any tests or implementing any user story.

- [X] T001 Add `autoClaim: boolean` (default `false`) to `PlayerSettings` interface and `DEFAULT_SETTINGS` in `src/game/types.ts`
- [X] T002 [P] Extend `Props['topic']` union type in `src/components/HelpModal.tsx` to include `'magic'` (type-only change; do NOT add CONTENT entry yet)
- [X] T003 [P] Extend `HelpTopic` type alias in `src/App.tsx` to include `'magic'`

**Checkpoint**: `npm run typecheck` passes. No runtime changes yet.

---

## Phase 2: User Story 6 — Currency Tab Updates Immediately After Claim (Priority: P1) 🎯 Bug Fix

**Goal**: After clicking Claim with animations disabled, the currency tab reflects the new totals immediately with no perceptible delay.

**Independent Test**: Disable animations, spin and claim; assert currency display updates without waiting for any timer.

### Tests for US6

> **Write this test first — confirm it FAILS before implementing T005**

- [X] T004 [US6] Add failing integration test to `tests/integration/magicPhase.test.tsx` (new `describe` block): render `<App>` with `animate: false` via mocked `loadState`; spin → advance timers → click CLAIM; assert `CurrencyDisplay` shows the updated currency total immediately (not after a 3-second delay); use `vi.useFakeTimers()` and advance time by < 3000 ms after claim to prove no timer dependency

### Implementation for US6

- [X] T005 [US6] Fix `displayedCurrencies` update in `src/App.tsx`: in the `useEffect` that depends on `[state.lastSpinResult]`, add `setDisplayedCurrencies(state.currencies)` immediately after `setToastResult(state.lastSpinResult)`; remove `setDisplayedCurrencies` from the `setTimeout` callback (keep only `setToastResult(null)` in the timer)

**Checkpoint**: `npm run test:integration` — T004 now passes. Currency display no longer waits for the toast timer.

---

## Phase 3: User Story 1 — Understand Spin Results from Help Text (Priority: P1) 🎯 MVP

**Goal**: Spin Tab help text shows a worked example grid, explains multiplier logic, explains why Air doesn't pay out, and links to the Reels Store.

**Independent Test**: Open the Spin Tab `❓` help panel; confirm the example grid, "4 Apples" explanation, Air exclusion, and Reels Store prompt are all visible.

### Tests for US1

> **Write these tests first — confirm they FAIL before implementing T007**

- [X] T006 [US1] Add failing unit tests to `tests/unit/HelpModal.test.tsx` for the updated `spin` topic:
  - `topic="spin"` body contains text matching the worked example (verify presence of multiplied Apple count, e.g. "4" or "2 × 1")
  - `topic="spin"` body contains "Air" and a phrase indicating it does not pay out (e.g. "not in every column")
  - `topic="spin"` body contains "Reels Store"
  - `topic="spin"` body does NOT contain the old optional-actions bullet text (e.g. does NOT contain "Respin a column to re-roll")

### Implementation for US1

- [X] T007 [US1] Update `spin` topic body in `src/components/HelpModal.tsx`:
  - Keep "Ways to Win" paragraph
  - Add worked example grid (2×🍎 / 🟤 / 🍎 / 💨 / 🍎 rows) with explanations: "4 🍎 Apples (2 × 1 × 2 × 1 × 1)", "1 🟤 Copper (1 × 1 × 1 × 1 × 1)", "💨 Air does not pay out — not present in every column"
  - Keep the Apple spin-cost sentence
  - Add "Buy icons from the Reels Store to increase your possible payouts."
  - Replace magic phase bullet list with a single line: "After each spin you enter the Magic Phase — open its ❓ for details."

**Checkpoint**: `npm run test:unit` — T006 tests now pass. Spin Tab help updated.

---

## Phase 4: User Story 5 — View Grouped Icons in the Reels Tab (Priority: P2)

**Goal**: Reels Tab shows each icon type once with a quantity badge instead of listing every individual icon.

**Independent Test**: Add multiple copies of the same icon; open the Reel tab; confirm one cell per icon type showing the correct count.

### Tests for US5

> **Write these tests first — confirm they FAIL before implementing T009**

- [X] T008 [US5] Create `tests/unit/ReelView.test.tsx` (new file) with:
  - Helper `makeReel(defs: string[]): Reel` that builds a reel from definition IDs
  - Test: reel with `['apple', 'apple', 'copper']` renders exactly 2 icon cells (not 3); apple cell shows count "2"; copper cell shows count "1"
  - Test: reel with `['apple']` renders one icon cell showing count "1"
  - Test: reel with `['apple', 'copper']` renders two cells each showing count "1"
  - Test: reel with `['apple', 'apple']` renders one cell (not two separate `icon.id`-keyed cells)

### Implementation for US5

- [X] T009 [US5] Update non-prestige icon display in `src/components/ReelView.tsx`:
  - Replace `sortedIcons.map((icon) => ...)` loop with `[...countByDefId.entries()].sort(([a],[b]) => a.localeCompare(b)).map(([defId, count]) => ...)` — key on `defId` not `icon.id`
  - Each cell renders `def?.emoji`, existing `×N` multiplier badge (`absolute bottom-0.5 right-0.5`), and a new count badge (`absolute top-0 left-0 text-xs font-bold text-white bg-gray-900/70 rounded-br px-0.5 leading-none`) showing `{count}`
  - Remove the now-unused `sortedIcons` variable declaration

**Checkpoint**: `npm run test:unit` — T008 tests now pass. Reel tab shows grouped icons.

---

## Phase 5: User Story 7 — Auto-Claim Toggle Skips Magic Phase (Priority: P2)

**Goal**: A new Auto-claim checkbox next to Auto-convert; when ticked, completing a spin bypasses the Magic Phase and applies the result directly.

**Independent Test**: Enable auto-claim, spin, confirm Magic Phase UI never appears and currency updates.

### Tests for US7

> **Write these tests first — confirm they FAIL before implementing T012–T014**

- [X] T010 [P] [US7] Update `tests/unit/SpinControls.test.tsx`:
  - Add `autoClaim: false` to the existing `defaultSettings` constant (required now that `PlayerSettings` has `autoClaim`)
  - Add test: renders "Auto-claim" checkbox label
  - Add test: with `autoClaim: false` in settings, checkbox is unchecked
  - Add test: with `autoClaim: true` in settings, checkbox is checked
  - Add test: ticking the checkbox calls `onSettingsChange({ autoClaim: true })`
- [X] T011 [P] [US7] Add failing integration test to `tests/integration/magicPhase.test.tsx` (new `describe` block): load `App` with `settings: { ...DEFAULT_SETTINGS, autoClaim: true }` via mocked `loadState`; spin → advance timers (to trigger `onSpinDone`); assert Magic Phase panel is NOT in the document; assert the CLAIM button is NOT visible; assert `lastSpinResult` is set (currency updated)

### Implementation for US7

- [X] T012 [P] [US7] Add `autoClaim` migration patch to `src/game/persistence.ts` in `loadState()`: after the `if (state.rowCount == null)` guard, add `if (!Object.prototype.hasOwnProperty.call(state.settings ?? {}, 'autoClaim')) { state.settings = { ...state.settings, autoClaim: false } }`
- [X] T013 [P] [US7] Add `autoClaim` checkbox to `src/components/SpinControls.tsx`: append a new `<label>` block after the Auto-convert label with `checked={settings.autoClaim ?? false}`, `onChange={(e) => onSettingsChange({ autoClaim: e.target.checked })}`, `disabled={spinning || isMagicPhase}`, `aria-label="Auto-claim"`, label text "Auto-claim"
- [X] T014 [US7] Update `handleSpinDone` in `src/App.tsx`: after `dispatch({ type: 'BEGIN_MAGIC_PHASE' })`, add `if (state.settings.autoClaim) { dispatch({ type: 'CLAIM' }) }`; add `state.settings.autoClaim` to the `useCallback` dependency array

**Checkpoint**: `npm run test:unit` and `npm run test:integration` — T010 and T011 now pass. Auto-claim works end to end.

---

## Phase 6: User Story 2 — Access Magic Phase Guidance (Priority: P2)

**Goal**: Magic Phase section has a `❓` help button that opens a dedicated help panel explaining elemental currency earning and the four optional actions.

**Independent Test**: In the Magic Phase, click the `❓` button; confirm the help panel opens with heading "The Magic Phase" and contains elemental currency and action descriptions.

### Tests for US2

> **Write these tests first — confirm they FAIL before implementing T016–T018**

- [X] T015 [US2] Add failing unit tests to `tests/unit/HelpModal.test.tsx` for the new `magic` topic:
  - `topic="magic"` renders heading "The Magic Phase"
  - `topic="magic"` body contains "elemental" (or "Air, Water, Earth, Fire")
  - `topic="magic"` body contains list items for Respin, Swap, Block, and Boost Value actions
  - Confirm `spin` topic no longer contains the old magic action bullet list (Respin / Swap / Block / Increase Value items) — assert those specific strings are absent

### Implementation for US2

- [X] T016 [P] [US2] Add `magic` entry to the `CONTENT` record in `src/components/HelpModal.tsx` with heading "The Magic Phase" and body explaining elemental currency earning and the four optional actions (Respin/Air, Swap/Water, Block/Earth, Boost Value/Fire)
- [X] T017 [P] [US2] Add `onHelp?: () => void` prop to `MagicPhasePanel` interface and component in `src/components/MagicPhasePanel.tsx`; wrap the existing `<h3>` in a `flex items-center justify-between` `<div>`; render `<button type="button" aria-label="Help: Magic Phase" onClick={onHelp} className="text-gray-400 hover:text-gray-200 text-sm px-1">❓</button>` when `onHelp` is defined
- [X] T018 [US2] Pass `onHelp={() => setHelpTopic('magic')}` to `<MagicPhasePanel>` in `src/App.tsx`

**Checkpoint**: `npm run test:unit` — T015 tests now pass. Magic Phase `❓` opens the new help panel.

---

## Phase 7: User Story 3 — Understand Reels Store and Reel Tab Relationship (Priority: P3)

**Goal**: Reels Store help text tells players they can view their current icons in the Reel tab.

**Independent Test**: Open the Reels Store `❓` help panel; confirm the Reel Tab explanation sentence is present.

### Tests for US3

> **Write this test first — confirm it FAILS before implementing T020**

- [X] T019 [US3] Add failing unit test to `tests/unit/HelpModal.test.tsx`: `topic="market"` body contains text mentioning the Reel tab and current icons (e.g. matches `/reel tab/i` and `/current icons/i` or equivalent)

### Implementation for US3

- [X] T020 [US3] Append a new `<p>` to the `market` topic body in `src/components/HelpModal.tsx`: "Visit the <strong>Reel</strong> tab to see all the icons currently in your slot machine."

**Checkpoint**: `npm run test:unit` — T019 test now passes. Reels Store help updated.

---

## Phase 8: User Story 4 — Understand the Game Type from Main Help (Priority: P3)

**Goal**: Main help text explicitly calls this a non-idle incremental game and mentions the Feats Tab.

**Independent Test**: Open the main `❓` help panel; confirm "non-idle" and "Feats" text are present.

### Tests for US4

> **Write these tests first — confirm they FAIL before implementing T022**

- [X] T021 [US4] Add failing unit tests to `tests/unit/HelpModal.test.tsx`: `topic="game"` body contains "non-idle"; `topic="game"` body contains "Feats"

### Implementation for US4

- [X] T022 [US4] Update `game` topic body in `src/components/HelpModal.tsx`: insert a sentence (e.g. "Slot RPG is a <strong>non-idle</strong> incremental game — you need to keep spinning to earn. The <strong>Feats</strong> tab contains achievements that unlock automatically as you play.") before the existing magic phase paragraph

**Checkpoint**: `npm run test:unit` — T021 tests now pass. Main help updated.

---

## Phase 9: Polish & Cross-Cutting Concerns

**Purpose**: Final validation gates in constitution-mandated order. No gate may start if an earlier gate fails.

- [X] T023 **[GATE 1] Typecheck** — `npm run typecheck` exits 0 with zero errors
- [X] T024 **[GATE 2] Lint** — `npm run lint` exits 0 with zero errors (fix any ESLint complaints)
- [X] T025 **[GATE 3] Unit Tests** — `npm run test:unit` all pass; verify coverage ≥ 80% on changed files
- [X] T026 **[GATE 4] Integration Tests** — `npm run test:integration` all pass
- [X] T027 **[GATE 5] Build** — `npm run build` compiles cleanly with no warnings treated as errors
- [X] T028 **[GATE 6] Bundle Size** — measure gzipped JS bundle (`ls -lh dist/assets/*.js`); confirm ≤ 250 KB; record before/after delta for PR description

---

## Dependencies & Execution Order

### Phase Dependencies

- **Foundational (Phase 1)**: No dependencies — start immediately
- **US6 (Phase 2)**: Can start after Foundational
- **US1 (Phase 3)**: Can start after Foundational; no dependency on US6
- **US5 (Phase 4)**: Can start after Foundational; independent of US1 and US6
- **US7 (Phase 5)**: Requires Foundational (T001 must exist); independent of US1/US5/US6
- **US2 (Phase 6)**: Requires Foundational T002/T003; independent of other stories
- **US3 (Phase 7)**: Requires Foundational T002 (type); independent of other stories
- **US4 (Phase 8)**: Requires Foundational T002 (type); independent of other stories
- **Polish (Phase 9)**: All prior phases complete

### User Story Dependencies

All user stories depend only on the Foundational phase. No story depends on another story completing first.

### Within Each User Story

1. Write tests → confirm Red
2. Implement → confirm Green
3. (Refactor if needed)

### Parallel Opportunities per Story

**US7 (Auto-Claim)** — T010, T011, T012, T013 are all marked [P] and can proceed simultaneously:
```
T010: Update SpinControls tests         (tests/unit/SpinControls.test.tsx)
T011: Add auto-claim integration test   (tests/integration/magicPhase.test.tsx)
T012: Persistence patch                 (src/game/persistence.ts)
T013: SpinControls checkbox             (src/components/SpinControls.tsx)
→ then T014: App.tsx handleSpinDone    (depends on T012 + T013 being done)
```

**US2 (Magic Phase Help)** — T016 and T017 can proceed simultaneously:
```
T016: Add magic CONTENT entry           (src/components/HelpModal.tsx)
T017: Add onHelp prop to panel          (src/components/MagicPhasePanel.tsx)
→ then T018: App.tsx wiring            (depends on T016 + T017)
```

**Foundational phase** — T002 and T003 can proceed simultaneously:
```
T002: HelpModal type extension          (src/components/HelpModal.tsx)
T003: App HelpTopic type               (src/App.tsx)
```

---

## Implementation Strategy

### MVP First (P1 Stories Only — Phases 1–3)

1. Complete Phase 1: Foundational
2. Complete Phase 2: US6 (Bug Fix) — immediate player-visible improvement
3. Complete Phase 3: US1 (Spin Tab Help) — clearest onboarding improvement
4. Run Phase 9 gates on the P1 scope → ship as a minimal release

### Incremental Delivery

1. Foundational → US6 → US1 → Gates → **MVP release** (bug fix + clearer spin help)
2. Add US5 (Grouped Icons) → Gates → **Release 1.2.1**
3. Add US7 (Auto-claim) + US2 (Magic help) → Gates → **Release 1.2.2**
4. Add US3 (Reels Store help) + US4 (Main help) → Gates → **Release 1.2 Final**

---

## Notes

- [P] = can run in parallel (different files, no incomplete-task dependencies)
- All HelpModal.tsx content changes (T007, T016, T020, T022) are in the same file — do NOT mark [P]; do them sequentially
- All HelpModal.test.tsx additions (T006, T015, T019, T021) are in the same file — do NOT mark [P]; do them in story order
- The `sortedIcons` removal in T009 is part of that task — ensure `npm run lint` passes after (dead code must be removed per constitution)
- `defaultSettings` in `SpinControls.test.tsx` MUST be updated in T010 to include `autoClaim: false` or `npm run typecheck` will fail on the test file
