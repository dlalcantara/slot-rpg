# Implementation Plan: Version 0.9 — Energy

**Branch**: `009-v09-energy` | **Date**: 2026-06-13 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/009-v09-energy/spec.md`

## Summary

Add an Energy icon with a multi-currency purchase cost (1 gold + 1 air + 1 water + 1 earth + 1 fire) whose spin payout expands the slot machine from 3 rows up to 5 rows. Replace food-starvation Game Over with a silent auto-prestige that notifies the player. Add 10 copper to all prestige starting resources. Fix four correctness bugs: the `canAfford` single-level chain check, "Second Breakfast" and "Master of Elements" using icon count rather than payout amount, and the "I Understand It Now" description.

## Technical Context

**Language/Version**: TypeScript 5.6 / React 18.3 (Vite 6, Tailwind CSS 3)

**Primary Dependencies**: React 18, Vite 6, Tailwind CSS 3, Vitest 2, @testing-library/react 16

**Storage**: localStorage via `src/game/persistence.ts`

**Testing**: Vitest + @testing-library/react — existing suites in `tests/unit/` and `tests/integration/`

**Target Platform**: Browser (GitHub Pages CDN), mobile-first 720 × 1280 px

**Project Type**: Single-page web application — no backend

**Performance Goals**: Bundle ≤ 250 KB gzip; spin computation ≤ 16 ms; page load ≤ 3 s on Slow 3G

**Constraints**: No new npm dependencies; row expansion must not break 720 × 1280 layout; localStorage migration backward-compatible

**Scale/Scope**: 1 new component file, ~12 modified files, 1 migration step

## Constitution Check

- [x] **I. Code Quality** — TypeScript strict on. Multi-cost and row-count use narrow union types. `canAfford` fix removes implicit single-level assumption; no `any` casts.
- [x] **II. Test-First** — Unit tests for energy product formula, rowCount transitions, auto-prestige on food=0, multi-level currency check, and each bug fix written Red before implementation.
- [x] **III. UX Consistency** — Row expansion changes grid height. 4-row and 5-row grids verified to fit 720 × 1280 px without overflow (icon slots remain 48 × 48 px; column height grows proportionally). StarvationModal uses same overlay pattern as existing modals.
- [x] **IV. Performance** — Max 5-column × 5-row = 25 icons per spin (up from 15). Product computation remains O(columns × rows), well under 16 ms. No new dependencies.
- [x] **V. Build Pipeline** — Existing GitHub Actions gates require no changes.

*All items pass. No complexity violations.*

## Project Structure

### Documentation (this feature)

```text
specs/009-v09-energy/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── checklists/
│   └── requirements.md
└── tasks.md             # Phase 2 output (/speckit-tasks)
```

### Source Code (repository root)

```text
src/
├── App.tsx                       # MODIFY: show StarvationModal on phase='starvation'; pass rowCount; dispatch DISMISS_STARVATION
└── game/
│   ├── types.ts                  # MODIFY: add 'energy' to CurrencyKey; add multiCost to IconDefinition; add 'starvation' to GamePhase; add rowCount:number to GameState; add initialSpinPayouts:Payout[]|null to GameState; add DISMISS_STARVATION action
│   ├── catalog.ts                # MODIFY: add energy icon with multiCost; cost:null
│   ├── currencyRegistry.ts       # MODIFY: add energy entry (no bar display)
│   ├── initialState.ts           # MODIFY: add rowCount:3; add copper:10 to PRESTIGE_STARTING_CURRENCIES
│   ├── persistence.ts            # MODIFY: migration — add rowCount:3 if absent; add initialSpinPayouts:null if absent; strip 'ancient-civilization' from unlockedAchievements
│   ├── reducer.ts                # MODIFY: tryBuyIcon handles multiCost; SPIN stores initialSpinPayouts; CLAIM filters energy payout, checks thresholds, updates rowCount, blow-it-up check, auto-prestiges on food=0, clears initialSpinPayouts; add DISMISS_STARVATION case
│   ├── achievements.ts           # MODIFY: rename wip1→sweet / wip2→nice; replace ancient-civilization→blow-it-up; add payouts param to checkNewAchievements; fix second-breakfast and master-of-elements; fix i-understand-it-now description; add sweet/nice/blow-it-up checks
│   └── spinLogic.ts              # MODIFY: parameterize drawColumn(reel, rowCount); update extractColumn to draw rowCount rows
└── components/
    ├── StarvationModal.tsx        # NEW: "You ran out of food; slot machine has been reset" dialog with dismiss button
    ├── MarketItem.tsx             # MODIFY: fix canAfford to recurse full chain; handle multiCost display and affordability; render when cost=null but multiCost present
    ├── Market.tsx                 # MODIFY: handle multiCost in canBuyMore; show energy icon in list
    ├── SlotGrid.tsx               # MODIFY: accept rowCount prop; render rowCount rows per column
    └── CurrencyDisplay.tsx        # MODIFY: filter 'energy' from display

tests/
├── unit/
│   ├── achievements.test.ts       # MODIFY: fix second-breakfast/MoE tests to use payouts; add sweet/nice/blow-it-up tests
│   ├── reducer.test.ts            # MODIFY: food=0→starvation phase; rowCount updates; DISMISS_STARVATION
│   └── spinLogic.test.ts          # MODIFY: drawColumn with rowCount 4 and 5
└── integration/
    └── marketFlow.test.tsx        # MODIFY: multi-currency purchase and canAfford recursion tests
```

**Structure Decision**: Single web application. All changes within `src/` and `tests/`. No new packages.

## Complexity Tracking

> No constitution violations.
