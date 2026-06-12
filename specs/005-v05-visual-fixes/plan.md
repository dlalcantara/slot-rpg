# Implementation Plan: Version 0.5 Visual Fixes

**Branch**: `005-v05-visual-fixes` | **Date**: 2026-06-12 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/005-v05-visual-fixes/spec.md`

## Summary

Version 0.5 is a polish pass over the v0.4 Magic Elements feature. It fixes two animation/display
defects (columns settling on stale/empty cells before flipping to the real result; magic-ability grid
edits not re-rendering), animates the respin ability per-column, makes locked columns and column
click targets clearly legible, rebalances and reorders the market (Air = 1 copper, Water = 1 copper,
Earth = 1 silver, cheapest-first), updates the new-game deck (1 Air, 1 Water, 1 Food/Apple, 1 Copper)
and starting resources (10 Air, 10 Water, 100 Food), consolidates the two parallel Magic Phase
controls (toggle buttons + rules guide) into a single clickable guide, and adds a hidden developer
cheat for setting resource balances. The work is overwhelmingly presentational plus configuration
data; the only logic addition is a single resource-setting reducer action. Payout math, costs/counters, lock limits, and
Master-of-Elements detection are unchanged.

## Technical Context

**Language/Version**: TypeScript 5.6 (strict mode) + React 18.3

**Primary Dependencies**: Vite 6, Tailwind CSS 3, Vitest 2, @testing-library/react 16,
@testing-library/user-event (no new runtime dependencies)

**Storage**: `localStorage` via `src/game/persistence.ts`; state serialised as JSON with a numeric
`version` field. **No GameState schema change in v0.5** → `version` stays `4`; existing saves load
unchanged and keep their balances (only new games adopt the new deck/resources).

**Testing**: Vitest + @testing-library/react + user-event; jsdom environment. Existing suites:
`tests/unit/*`, `tests/integration/*`.

**Target Platform**: Browser (GitHub Pages); mobile-first at 720 × 1280 px.

**Project Type**: Single-page React application; single `src/` tree, no monorepo.

**Performance Goals**: Spin computation ≤ 16 ms; bundle ≤ 250 KB gzipped; page load ≤ 3 s on Slow 3G.
Per-column respin animation reuses the existing interval-based animation (no new timers library).

**Constraints**: No new runtime dependencies; all changes extend existing
`catalog.ts` / `currencyRegistry.ts` / `initialState.ts` / `reducer.ts` / component patterns. Icon
slots keep their 48 × 48 px bounding boxes.

**Scale/Scope**: Single-player browser game; all state in memory + localStorage. ~7 source files
touched plus tests.

## Root-Cause Notes (grounding for the fixes)

These are derived from reading the current source and drive the design decisions in Phase 1.

- **Empty-cell flash (FR-001)**: During the `spinning` phase `isMagicPhase` is `false`, so
  `SlotGrid.displayColumns` falls back to `lastSpinResult` (the *previous* spin's columns, or the
  blank placeholder on first spin). Each `ReelColumn` therefore settles its animation onto stale/blank
  icons; only when `BEGIN_MAGIC_PHASE` flips `phase` to `magic` does the grid switch to the freshly
  spun `magicGrid`. Fix: make the spinning grid settle on the new result by sourcing the settle target
  from `magicGrid` whenever it is present (it is populated by `SPIN`), independent of `isMagicPhase`.
- **Magic edits not shown (FR-002/FR-003)**: `ReelColumn` copies `icons` into local `displayIcons`
  state and only re-syncs inside the effect keyed on `[spinning]`. Respin/swap/boost mutate
  `magicGrid` while `spinning` is `false`, so `displayIcons` never updates and the grid looks frozen.
  Fix: re-sync `displayIcons` to the `icons` prop whenever it changes and no animation is in flight.
- **Respin not animated (FR-004/FR-005)**: `MAGIC_RESPIN` only rewrites grid data; there is no
  per-column animation trigger (the App-level `spinning` flag is global). Fix: add a per-column
  "respin pulse" the parent can trigger for a single column, reusing `ReelColumn`'s existing interval
  animation and honoring the `animate` setting.
- **Duplicated Magic Phase controls (FR-014/FR-015)**: action selection lives as a toggle-button
  strip *inside* `SlotGrid` (local `magicMode` state), while `MagicPhasePanel` renders a parallel,
  non-interactive cost/availability guide — two controls for the same four actions with no visual
  link. Fix: lift `magicMode` to `App`, make each `MagicPhasePanel` row the clickable selector
  (selected/disabled states + swap hint), pass `magicMode` into `SlotGrid` as a prop, and delete the
  duplicate toggle strip.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- [x] **I. Code Quality** — TypeScript strict mode already enabled; no `any` planned. New reducer
      action and component props are fully typed. Functions stay < 40 lines / complexity ≤ 10.
- [x] **II. Test-First** — Unit tests written first for: market price ordering, updated catalog
      costs, new initial deck/resources, and the cheat (set-resource) reducer action. Component tests
      (Red→Green) for: ReelColumn re-syncing on `icons` change, respin animation honoring `animate`,
      locked-column indicator, column click-target affordance, and the unified magic action selector
      (clicking a guide row selects/clears the mode; no duplicate toggle strip). Integration test
      extends `magicPhase` to assert the grid reflects respin/swap visually (rendered text) and that
      action selection is driven from the guide rows.
- [x] **III. UX Consistency** — 3 × 5 grid unchanged; icon slots keep 48 × 48 px boxes. Lock
      indicator and column click target are additive overlays within existing bounding boxes; verified
      at 720 × 1280 px. No input accepted during an active spin/respin.
- [x] **IV. Performance** — No new dependencies; respin animation reuses the existing 200 ms interval
      pattern; cheat is O(1). Estimated bundle delta < 2 KB gzipped. Spin/claim math untouched.
- [x] **V. Build Pipeline** — Existing `typecheck → lint → unit → integration → build → bundle-size`
      gates in `package.json` / CI unchanged and enforced.

No violations → Complexity Tracking table omitted.

## Project Structure

### Documentation (this feature)

```text
specs/005-v05-visual-fixes/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── contracts/           # Phase 1 output (UI + reducer-action contracts)
│   ├── reducer-actions.md
│   └── ui-behavior.md
├── checklists/
│   └── requirements.md  # From /speckit-specify
└── tasks.md             # Phase 2 output (/speckit-tasks — NOT created here)
```

### Source Code Changes

```text
src/
├── game/
│   ├── catalog.ts            # update costs: air → copper 1, water → copper 1, earth → silver 1
│   ├── currencyRegistry.ts   # update startingAmount: air 10, water 10 (food already 100)
│   ├── initialState.ts       # update reel to [air, water, apple, copper]
│   ├── reducer.ts            # add SET_CURRENCY (cheat) action
│   └── types.ts              # add SET_CURRENCY to GameAction union
├── components/
│   ├── ReelColumn.tsx        # re-sync displayIcons on icons change; per-column respin animation;
│   │                         #   clearer locked indicator; clearer column click target
│   ├── SlotGrid.tsx          # source settle target from magicGrid during spinning; pass respin
│   │                         #   animation trigger; clearer affordance when respin/lock mode active;
│   │                         #   receive magicMode as a prop, remove duplicate toggle button strip
│   ├── MagicPhasePanel.tsx   # make each ability row the action selector (clickable, selected/
│   │                         #   disabled states); host the swap "select 2nd cell" hint
│   ├── Market.tsx            # sort items ascending by normalized price
│   └── CheatPanel.tsx        # new: hidden resource-editor (easter-egg trigger)
└── App.tsx                   # lift magicMode state here; pass to MagicPhasePanel + SlotGrid; wire
                              #   cheat trigger + dispatch SET_CURRENCY; pass respin-anim handler

tests/
├── unit/
│   ├── catalog.test.ts       # update: new element costs
│   ├── reducer.test.ts       # add: SET_CURRENCY behavior + validation (ignore invalid)
│   ├── initialState.test.ts  # new (or extend): deck + starting resources
│   └── market.test.ts        # new: ascending price ordering
└── integration/
    └── magicPhase.test.ts    # extend: grid text reflects respin/swap; lock indicator visible
```

**Structure Decision**: Single-project React SPA (Option 1). All changes extend the existing `src/`
tree; no new top-level directories. The only genuinely new files are `CheatPanel.tsx` and a small
number of new unit-test files.

## Phase 0: Research

See [research.md](./research.md). All Technical Context items are known from the existing codebase;
the only open design questions are the **respin animation mechanism** and the **cheat trigger**, both
resolved there with no NEEDS CLARIFICATION remaining.

## Phase 1: Design & Contracts

- [data-model.md](./data-model.md) — config/data deltas (catalog costs, starting deck/resources,
  market ordering rule) and the cheat action's data shape.
- [contracts/reducer-actions.md](./contracts/reducer-actions.md) — the `SET_CURRENCY` action
  contract and validation rules.
- [contracts/ui-behavior.md](./contracts/ui-behavior.md) — observable UI contracts for animation
  settle, magic re-render, respin animation, lock indicator, and column click target.
- [quickstart.md](./quickstart.md) — manual verification script at 720 × 1280 px.

Agent context (`CLAUDE.md`) updated to point at this plan.
