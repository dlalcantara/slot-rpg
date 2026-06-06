# Implementation Plan: Magic Elements (v0.4)

**Branch**: `004-magic-elements` | **Date**: 2026-06-07 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/004-magic-elements/spec.md`

## Summary

Add four elemental currencies (Air, Water, Earth, Fire) earned by rolling elemental icons on the
reels, which are purchased via the Market. After every spin animation the game enters a new **Magic
Phase** where the player spends elemental currency on four actions (respin column, swap adjacent
cells, lock column, increase card value) before pressing CLAIM to compute and award payouts.
Includes a "Master of Elements" special win notification and a revised results-modal threshold that
uses a combined money value for Copper/Silver/Gold.

## Technical Context

**Language/Version**: TypeScript 5.6 (strict mode) + React 18.3

**Primary Dependencies**: Vite 6, Tailwind CSS 3, Vitest 2, @testing-library/react 16

**Storage**: `localStorage` via `src/game/persistence.ts` — state serialised as JSON; version
field used for migration.

**Testing**: Vitest + @testing-library/react + @testing-library/user-event; jsdom environment.

**Target Platform**: Browser (GitHub Pages); mobile-first at 720 × 1280 px.

**Project Type**: Single-page React application; single `src/` tree, no monorepo.

**Performance Goals**: Spin computation ≤ 16 ms; bundle ≤ 250 KB gzipped; page load ≤ 3 s on Slow 3G.

**Constraints**: No new runtime dependencies; all additions extend existing
`catalog.ts` / `currencyRegistry.ts` / `reducer.ts` / `types.ts` patterns.

**Scale/Scope**: Single-player browser game; all state in memory + localStorage.

## Constitution Check

- [x] **I. Code Quality** — TypeScript strict mode already enabled (`tsconfig.json`); no `any`
      planned; new code follows existing patterns.
- [x] **II. Test-First** — Unit tests written first for: elemental currency accumulation, magic
      action cost deduction, lock/unlock logic, Master of Elements detection, combined-money
      notable-result threshold. Integration test covers full spin → magic phase → CLAIM flow.
- [x] **III. UX Consistency** — 3 × 5 grid unchanged; CLAIM button added in Spin tab between
      SpinButton and GameLog; magic panel sized within existing `max-w-lg` container. Lock
      indicator uses existing icon slot bounding boxes (48 × 48 px).
- [x] **IV. Performance** — No new dependencies; magic actions are O(1) array operations;
      bundle delta estimated < 2 KB gzipped.
- [x] **V. Build Pipeline** — Existing `typecheck → lint → unit → integration → build` gates in
      `package.json` unchanged; CI enforces them.

## Project Structure

### Documentation (this feature)

```text
specs/004-magic-elements/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── contracts/           # Phase 1 output
└── tasks.md             # Phase 2 output (/speckit-tasks)
```

### Source Code Changes

```text
src/
├── game/
│   ├── types.ts              # extend: GamePhase, GameState, MagicGrid, new actions
│   ├── catalog.ts            # add: air, water, earth, fire icon definitions
│   ├── currencyRegistry.ts   # add: air, water, earth, fire currency definitions
│   ├── initialState.ts       # update: starting reel to [blank, apple, copper, air]
│   ├── reducer.ts            # add: MAGIC_RESPIN, MAGIC_SWAP, MAGIC_LOCK,
│   │                         #      MAGIC_INCREASE_VALUE, CLAIM actions;
│   │                         #      modify SPIN to stop before computing payouts
│   ├── spinLogic.ts          # extract: calculatePayouts (already exported)
│   │                         #      add: computeMagicRespin(columns, colIdx, reel)
│   ├── notableResult.ts      # update: combined money threshold; elemental currencies
│   └── masterOfElements.ts   # new: detectMasterOfElements(columns)
├── components/
│   ├── MagicPhasePanel.tsx   # new: action buttons + cost display during magic phase
│   ├── SlotGrid.tsx          # update: accept locked columns prop; show lock indicator
│   ├── SpinButton.tsx        # update: disable during magic phase
│   ├── Market.tsx            # update: add 4 elemental market items
│   └── CurrencyDisplay.tsx   # update: display air/water/earth/fire balances

tests/
├── unit/
│   ├── magicActions.test.ts  # new: respin, swap, lock, increase-value cost + effect
│   ├── masterOfElements.test.ts # new: detection threshold (≥3 each element)
│   └── notableResult.test.ts # update: combined money cases
└── integration/
    └── magicPhase.test.ts    # new: full spin → magic → claim flow
```

## Complexity Tracking

> No constitution violations. All changes extend existing patterns.
