---

description: "Task list for Slot Machine RPG — MVP implementation"
---

# Tasks: Slot Machine RPG — MVP

**Input**: Design documents from `/specs/001-slot-machine-game/`

**Prerequisites**: plan.md ✓, spec.md ✓, data-model.md ✓, contracts/game-actions.md ✓

**Tests**: Included — plan.md constitution check mandates Test-First / Red-Green-Refactor.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1–US5)
- Exact file paths are included in every task description

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization — Vite + React 18 + TypeScript strict + Tailwind + Vitest + CI

- [x] T001 Scaffold Vite + React 18 + TypeScript project at repo root (`index.html`, `src/main.tsx`, `src/App.tsx`, `package.json`) with dependencies: react, react-dom, @vitejs/plugin-react, tailwindcss, vitest, @testing-library/react, @testing-library/user-event, @typescript-eslint/eslint-plugin, gh-pages
- [x] T002 Configure `tsconfig.json` at repo root with `strict: true`, `target: "ES2020"`, `lib: ["ES2020","DOM"]`, path aliases for `src/`
- [x] T003 [P] Configure `vite.config.ts` at repo root: `@vitejs/plugin-react`, `base: '/slot-rpg/'`, vitest `globals: true`, coverage settings
- [x] T004 [P] Configure Tailwind CSS: `tailwind.config.ts` and `src/styles/index.css` with base directives; import in `src/main.tsx`
- [x] T005 [P] Configure ESLint: `eslint.config.js` at repo root with `@typescript-eslint/recommended`, `react-hooks`, no-`any` rule enabled
- [x] T006 Create CI workflow `.github/workflows/ci.yml` with six ordered gates: typecheck → lint → unit → integration → build → bundle-size-check (≤ 250 KB gzipped)

**Checkpoint**: `npm run dev` starts without errors; `npm test` runs ✓

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core TypeScript types, catalog, registry, and initial state — MUST complete before any user story

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [x] T007 Define all shared TypeScript types in `src/game/types.ts`: `CurrencyKey`, `IconEffect` (discriminated union: `add_currency` | `none`), `IconDefinition`, `Icon`, `Reel`, `CurrencyDefinition`, `Currencies`, `Payout`, `SpinResult`, `GameState` (with `version`, `reel`, `currencies`, `phase`, `lastSpinResult`)
- [x] T008 [P] Implement icon catalog in `src/game/catalog.ts`: export `ICON_CATALOG: Record<string, IconDefinition>` with all 8 MVP entries (blank, apple, triple-apple, dozen-apple, copper, silver, gold, crown) per data-model.md table
- [x] T009 [P] Implement currency registry in `src/game/currencyRegistry.ts`: export `CURRENCY_REGISTRY: Record<string, CurrencyDefinition>` with all 5 MVP entries (food, copper, silver, gold, crowns) including `autoConvertTo`, `convertibleFrom`, `winCondition`, `lossCondition` per data-model.md
- [x] T010 Implement initial state in `src/game/initialState.ts`: export `INITIAL_STATE: GameState` — reel with 3 Blank + 1 Apple + 1 Copper instances (UUIDs), `currencies: {food:100, copper:0, silver:0, gold:0, crowns:0}`, `phase: 'market'`, `lastSpinResult: null`, `version: 1` (depends on T007, T008, T009)

**Checkpoint**: `tsc --noEmit` exits 0; all types imported correctly; no `any` casts ✓

---

## Phase 3: User Story 1 — Spin the Slot Machine and Earn Currency (Priority: P1) 🎯 MVP

**Goal**: Player can press SPIN, see a 3×5 grid resolve, earn currency from aligned icons, lose 1 Food per spin, and see game-over when Food hits 0.

**Independent Test**: Load the game, press SPIN five times — Food decrements from 100, currency is awarded when icons align across all 5 columns, game ends when Food reaches 0.

### Tests for User Story 1 ✓

- [x] T011 [P] [US1] Write unit tests for `spinLogic` in `tests/unit/spinLogic.test.ts`: (a) each column draws exactly 3 icons with wrap-around, (b) payout product is correct for known counts `[2,3,1,2,1]` → 12, (c) family absent from any column yields no payout, (d) blank family never pays out
- [x] T012 [P] [US1] Write unit tests for reducer `SPIN` action in `tests/unit/reducer.test.ts`: (a) food decrements by 1, (b) payout applied to correct currency, (c) `phase` → `'gameover'` when food reaches 0, (d) `lastSpinResult` is set
- [x] T013 [P] [US1] Write integration test for full spin flow in `tests/integration/fullSpinFlow.test.tsx`: render app, click SPIN, assert food counter decrements in DOM; mock spinLogic to produce a known payout, assert currency display updates

### Implementation for User Story 1

- [x] T014 [P] [US1] Implement `spinLogic` function in `src/game/spinLogic.ts`: shuffle-copy reel per column, random start offset, extract 3 consecutive icons with wrap-around, compute `SpinResult` and `Payout[]` using catalog lookup for family matching and `valuePerColumn` product
- [x] T015 [US1] Implement `SPIN` action branch in `src/game/reducer.ts`: apply spinLogic result, deduct 1 food, apply payouts to currencies, check `lossCondition` → `'gameover'`, else check `winCondition` → `'win'`, else `'market'`; set `lastSpinResult`; persist (depends on T014)
- [x] T016 [P] [US1] Create `ReelColumn.tsx` in `src/components/ReelColumn.tsx`: renders 3 icon cells from `Icon[]`, each cell a fixed 32×32 px bounding box showing `label` text placeholder
- [x] T017 [P] [US1] Create `SlotGrid.tsx` in `src/components/SlotGrid.tsx`: renders 5 `ReelColumn` components from `SpinResult | null`; shows placeholder grid when `lastSpinResult` is null
- [x] T018 [P] [US1] Create `CurrencyDisplay.tsx` in `src/components/CurrencyDisplay.tsx`: shows Food, Copper, Silver, Gold, Crowns balances from `Currencies` prop
- [x] T019 [P] [US1] Create `SpinButton.tsx` in `src/components/SpinButton.tsx`: dispatches `SPIN`; disabled when `phase !== 'market'` or `currencies.food === 0` per UI contract
- [x] T020 [P] [US1] Create `GameOverScreen.tsx` in `src/components/GameOverScreen.tsx`: shown when `phase === 'gameover'`; displays loss message; prominent "Reset & Play Again" button that dispatches `HARD_RESET`
- [x] T021 [US1] Wire US1 components into `src/App.tsx` using `useReducer` with the game reducer; render `CurrencyDisplay`, `SlotGrid`, `SpinButton`; show `GameOverScreen` overlay when `phase === 'gameover'` (depends on T015–T020)

**Checkpoint**: User Story 1 is fully functional — SPIN works, Food decrements, game-over screen appears ✓

---

## Phase 4: User Story 2 — Buy Icons from the Market (Priority: P2)

**Goal**: Player can open the Market, spend currency (with automatic downward conversion), and the purchased icon is permanently added to the Reel.

**Independent Test**: Start with seeded currency, open Market, buy one Apple (1 Copper), spin once — 1 Copper deducted, Apple now in reel pool.

### Tests for User Story 2 ✓

- [x] T022 [P] [US2] Write unit tests for reducer `BUY_ICON` action in `tests/unit/reducer.test.ts`: (a) direct deduction when funds sufficient, (b) downward conversion from silver when copper = 0, conversion example per contracts (0 copper + 1 silver → 99 copper after buying 1-copper item), (c) rejection when all tiers insufficient, (d) reel length increases by 1 on success
- [x] T023 [P] [US2] Write integration test for market purchase flow in `tests/integration/marketFlow.test.tsx`: render app with seeded state, find Market panel, click buy Apple button, assert copper balance decreased and reel icon count increased in DOM

### Implementation for User Story 2

- [x] T024 [P] [US2] Implement `BUY_ICON` action branch in `src/game/reducer.ts`: resolve payment (direct deduction or downward conversion via `convertibleFrom` chain), append new `Icon` instance to `reel.icons`, persist; reject (no state change) if insufficient funds
- [x] T025 [P] [US2] Create `MarketItem.tsx` in `src/components/MarketItem.tsx`: renders icon label, cost, and Buy button; button disabled when player cannot afford (checking direct balance + convertible tiers)
- [x] T026 [P] [US2] Create `Market.tsx` in `src/components/Market.tsx`: renders all purchasable icons from `ICON_CATALOG` (those with non-null `cost`) as `MarketItem` list; dispatches `BUY_ICON` on purchase
- [x] T027 [US2] Wire Market into `src/App.tsx`: show `Market` panel when `phase === 'market'`; hide when `phase === 'spinning' | 'gameover' | 'win'` per UI contract (depends on T024–T026)

**Checkpoint**: User Stories 1 AND 2 both work — market purchases affect reel composition on next spin ✓

---

## Phase 5: User Story 3 — Win the Game by Collecting 100 Crowns (Priority: P3)

**Goal**: When Crowns reach 100, WIN modal appears; player can continue playing or reset.

**Independent Test**: Inject 10 Gold → buy Crown icon → spin until 100 Crowns → WIN modal appears; player dismisses modal and can continue playing.

### Tests for User Story 3 ✓

- [x] T028 [P] [US3] Write unit tests for win condition in `tests/unit/reducer.test.ts`: (a) `phase → 'win'` when crowns reach exactly 100 after spin, (b) `CONTINUE_AFTER_WIN` transitions `phase → 'market'` with all other state unchanged
- [x] T029 [P] [US3] Write integration test for win/continue flow in `tests/integration/fullSpinFlow.test.tsx`: mock spin to produce 100 crowns payout, assert WIN modal rendered; click "Continue Playing", assert modal dismissed and market visible

### Implementation for User Story 3

- [x] T030 [P] [US3] Implement `CONTINUE_AFTER_WIN` action branch in `src/game/reducer.ts`: `phase → 'market'`, no other state changes, persist
- [x] T031 [P] [US3] Create `WinModal.tsx` in `src/components/WinModal.tsx`: overlay shown when `phase === 'win'`; "Continue Playing" button dispatches `CONTINUE_AFTER_WIN`; "Reset" button dispatches `HARD_RESET`
- [x] T032 [US3] Wire `WinModal` into `src/App.tsx`: render as overlay when `phase === 'win'` (depends on T030–T031)

**Checkpoint**: All three core stories work end-to-end — spin, buy, win flow complete ✓

---

## Phase 6: User Story 4 — Resume Play After Closing the Browser (Priority: P4)

**Goal**: Page refresh restores full game state from `localStorage`; Hard Reset wipes state and returns to initial; game-over screen shows reset CTA.

**Independent Test**: Buy two icons, spin three times, refresh — all state restored. Press Hard Reset — game returns to exact initial state (3 Blank, 1 Apple, 1 Copper; 100 Food; 0 money; 0 Crowns).

### Tests for User Story 4 ✓

- [x] T033 [P] [US4] Write unit tests for persistence module in `tests/unit/persistence.test.ts`: (a) `saveState` writes correct JSON to `localStorage['slot-rpg-state']`, (b) `loadState` returns parsed `GameState` when key present, (c) `loadState` returns `null` when key absent or JSON invalid, (d) `clearState` removes the key
- [x] T034 [P] [US4] Write integration test for persistence and hard reset in `tests/integration/persistenceFlow.test.tsx`: (a) simulate page reload by unmounting and remounting app with localStorage seeded — assert state restored, (b) click Hard Reset — assert state matches `INITIAL_STATE`

### Implementation for User Story 4

- [x] T035 [P] [US4] Implement persistence module in `src/game/persistence.ts`: `saveState(state: GameState): void`, `loadState(): GameState | null`, `clearState(): void` using `localStorage` key `slot-rpg-state`; handle version mismatch by returning `null`
- [x] T036 [P] [US4] Implement `HARD_RESET` and `RESTORE_STATE` action branches in `src/game/reducer.ts`: `HARD_RESET` replaces state with `INITIAL_STATE` and persists; `RESTORE_STATE` replaces in-memory state with payload (or falls back to `INITIAL_STATE` on version mismatch)
- [x] T037 [P] [US4] Create `HardResetButton.tsx` in `src/components/HardResetButton.tsx`: always-visible button dispatching `HARD_RESET`; shown in all non-gameover phases
- [x] T038 [US4] Wire persistence into `src/App.tsx`: call `loadState()` on mount and dispatch `RESTORE_STATE`; call `saveState()` after every reducer dispatch; ensure `HardResetButton` is always rendered (depends on T035–T037)

**Checkpoint**: Full persistence works — refresh restores state; Hard Reset resets to initial state exactly ✓

---

## Phase 7: User Story 5 — Automatic Currency Conversion (Priority: P5)

**Goal**: 100 Copper automatically converts to 1 Silver; 100 Silver automatically converts to 1 Gold — applied after every spin payout, driven by the currency registry.

**Independent Test**: Start with 99 Copper, earn 1 more Copper via spin — balance reads 0 Copper, 1 Silver.

### Tests for User Story 5 ✓

- [x] T039 [P] [US5] Write unit tests for auto-conversion in `tests/unit/reducer.test.ts`: (a) 99 copper + 1 copper earned → 0 copper, 1 silver; (b) 99 silver + 1 silver earned → 0 silver, 1 gold; (c) 99 copper + 2 copper earned → 1 copper, 1 silver; (d) conversion is driven by registry `autoConvertTo` field (not hardcoded)

### Implementation for User Story 5

- [x] T040 [US5] Implement upward auto-conversion pass in `src/game/reducer.ts` within the `SPIN` action: after applying all payouts, iterate `CURRENCY_REGISTRY` entries that have `autoConvertTo`; for each, compute `floor(balance / threshold)` batches and convert; apply in registry order (copper → silver → gold)

**Checkpoint**: Currency conversion is correct — automated tests pass for all threshold scenarios ✓

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Animation, mobile layout, icon sizing, and build gates

- [x] T041 [P] Implement reel spin animation (~5 s) in `src/components/ReelColumn.tsx`: CSS keyframe or JS interval that cycles icons for `phase === 'spinning'`; freezes on final icons when animation completes and dispatches animation-done callback to parent
- [x] T042 [P] Apply Tailwind CSS mobile-first layout targeting 720×1280 px in `src/styles/index.css` and all components: full-width slot grid, stacked currency display, scrollable market list; desktop breakpoint ≥ 1280 px
- [x] T043 [P] Enforce 32×32 px icon bounding boxes in `src/components/ReelColumn.tsx` so placeholder text is centered and PNG drop-ins are sized correctly
- [ ] T044 Run all quickstart.md validation scenarios end-to-end (manual or scripted) and fix any discrepancies found
- [x] T045 **[GATE 1] Typecheck** — `tsc --noEmit` exits 0
- [x] T046 **[GATE 2] Lint** — `eslint src tests` exits 0 with zero errors
- [x] T047 **[GATE 3] Unit Tests** — `vitest run tests/unit` all pass (28/28)
- [x] T048 **[GATE 4] Integration Tests** — `vitest run tests/integration` all pass (10/10)
- [x] T049 **[GATE 5] Build** — `vite build` compiles cleanly
- [x] T050 **[GATE 6] Bundle Size** — gzipped JS bundle ≤ 250 KB (actual: 49.73 KB ✓)

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Phase 1 completion — BLOCKS all user stories
- **User Stories (Phases 3–7)**: All depend on Phase 2 completion; can proceed in priority order P1 → P2 → P3 → P4 → P5 (or in parallel if multiple developers)
- **Polish (Phase 8)**: Depends on all user story phases being complete

### User Story Dependencies

- **US1 (P1)**: Starts after Foundational — no story dependencies
- **US2 (P2)**: Starts after Foundational — integrates with US1 reducer and App.tsx
- **US3 (P3)**: Starts after Foundational — integrates with US1 reducer (win check already scaffolded in SPIN action)
- **US4 (P4)**: Starts after Foundational — wraps all stories (persistence layer, HARD_RESET)
- **US5 (P5)**: Starts after Foundational — extends US1 SPIN action with auto-conversion pass

### Within Each User Story

1. Write tests FIRST — confirm they FAIL
2. Implement until tests PASS (Red → Green)
3. Refactor if needed (Green → Refactor)
4. Commit before moving to next story

### Parallel Opportunities

- T003, T004, T005 (Setup config files) — all [P], different files
- T008, T009 (catalog + registry) — [P], different files
- T011, T012, T013 (US1 test files) — [P], different files
- T014, T016, T017, T018, T019, T020 (US1 implementation) — [P] where marked, different files
- T022, T023 (US2 tests) — [P], different files
- T024, T025, T026 (US2 implementation) — [P], different files

---

## Parallel Example: User Story 1

```bash
# Write all US1 tests in parallel:
Task: T011 — tests/unit/spinLogic.test.ts
Task: T012 — tests/unit/reducer.test.ts (SPIN branch)
Task: T013 — tests/integration/fullSpinFlow.test.tsx

# After tests fail, implement in parallel:
Task: T014 — src/game/spinLogic.ts
Task: T016 — src/components/ReelColumn.tsx
Task: T017 — src/components/SlotGrid.tsx
Task: T018 — src/components/CurrencyDisplay.tsx
Task: T019 — src/components/SpinButton.tsx
Task: T020 — src/components/GameOverScreen.tsx
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup
2. Complete Phase 2: Foundational — CRITICAL, blocks all stories
3. Complete Phase 3: User Story 1
4. **STOP and VALIDATE**: Press SPIN five times, check Food decrements, check game-over
5. Deploy to GitHub Pages to confirm static build works

### Incremental Delivery

1. Setup + Foundational → foundation compiles and types check
2. US1 → spin loop works → **MVP demo**
3. US2 → market purchases affect reel
4. US3 → win condition closes the game loop
5. US4 → persistence makes it feel like a real game
6. US5 → currency economy is balanced
7. Polish → animation, mobile layout, all CI gates green

### Parallel Team Strategy

With multiple developers after Phase 2 completes:
- Developer A: US1 (spin core) + US5 (auto-conversion, extends US1 reducer)
- Developer B: US2 (market) + US3 (win condition)
- Developer C: US4 (persistence) + Polish

---

## Notes

- `[P]` tasks touch different files and have no incomplete dependencies — safe to parallelize
- `[Story]` label maps every task to its user story for traceability
- Each story produces a complete, independently testable game increment
- Always write tests first — confirm RED before writing any implementation
- Commit after each user story phase or logical group
- Stop at each **Checkpoint** to validate the story independently before proceeding
- Avoid: tasks that share a file without a dependency edge, cross-story state coupling
