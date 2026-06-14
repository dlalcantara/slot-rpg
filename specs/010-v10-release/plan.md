# Implementation Plan: Version 1.0 Release Polish

**Branch**: `010-v10-release` | **Date**: 2026-06-14 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/010-v10-release/spec.md`

## Summary

Polish the v1.0 release: add contextual help modals for each tab and the game title (with AI attribution), replace text icon labels with emoji on the reel grid and in the Reels Store, fix two achievement descriptions ("Second breakfast" and "Master of Elements"), rename "Food" → "Apple" and "Market" → "Reels Store" throughout, reorganize the currency panel into a 2×5 emoji grid, remove the x1 spin button, and reorder the Feats list so "Blow It Up" precedes "Be Water, My Friend". No new npm dependencies; no game-logic changes; no localStorage migration.

## Technical Context

**Language/Version**: TypeScript 5.6 / React 18.3 (Vite 6, Tailwind CSS 3)

**Primary Dependencies**: React 18, Vite 6, Tailwind CSS 3, Vitest 2, @testing-library/react 16

**Storage**: localStorage via `src/game/persistence.ts` — no schema change; `food` key unchanged, only its display label changes

**Testing**: Vitest + @testing-library/react — existing suites in `tests/unit/` and `tests/integration/`

**Target Platform**: Browser (GitHub Pages CDN), mobile-first 720 × 1280 px

**Project Type**: Single-page web application — no backend

**Performance Goals**: Bundle ≤ 250 KB gzip; spin computation ≤ 16 ms; page load ≤ 3 s on Slow 3G

**Constraints**: No new npm dependencies; emoji strings add negligible bundle weight; help modal uses existing overlay pattern; 2×5 currency grid must not overflow at 720 × 1280 px

**Scale/Scope**: 1 new component (`HelpModal.tsx`), ~8 modified files, no migration step

## Constitution Check

- [x] **I. Code Quality** — TypeScript strict on. New `emoji` field is `string` (non-optional). No `any` casts introduced. Dead multiplier code removed rather than hidden.
- [x] **II. Test-First** — Unit tests written Red before implementation: `HelpModal` renders correct content per topic; `CurrencyDisplay` renders 2-row grid in correct order with emoji; achievement descriptions match spec wording; `blow-it-up` precedes `be-water-my-friend` in `ACHIEVEMENTS` array; `ICON_CATALOG` entries expose `emoji` field; `SpinControls` does not render an x1 button.
- [x] **III. UX Consistency** — `HelpModal` follows `WinModal`/`StarvationModal` overlay pattern; modal tested at 720 × 1280 px. Currency panel 2×5 grid uses `grid-cols-5` so it cannot wrap unexpectedly. Emoji icons occupy existing 48 × 48 px `icon-cell` bounding boxes.
- [x] **IV. Performance** — No new dependencies. Emoji are UTF-8 string literals; negligible bundle delta. No spin-path code changes.
- [x] **V. Build Pipeline** — Existing GitHub Actions gates require no changes.

*All items pass. No complexity violations.*

## Project Structure

### Documentation (this feature)

```text
specs/010-v10-release/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── quickstart.md        # Phase 1 output
├── checklists/
│   └── requirements.md
└── tasks.md             # Phase 2 output (/speckit-tasks)
```

### Source Code (repository root)

```text
src/
├── App.tsx                       # MODIFY: rename 'Market'→'Reels Store' tab label; add helpTopic state; add ❓ button next to title; add help icon (❓) inside each tab; integrate <HelpModal>
├── game/
│   ├── types.ts                  # MODIFY: add emoji:string field to IconDefinition interface
│   ├── catalog.ts                # MODIFY: add emoji field to every ICON_CATALOG entry
│   ├── currencyRegistry.ts       # MODIFY: rename food label 'Food'→'Apple'; reorder CURRENCY_ORDER to [food,copper,silver,gold,crowns,air,water,earth,fire]
│   └── achievements.ts           # MODIFY: fix 'second-breakfast' description; fix 'master-of-elements' description; update 'how-do-you-like-them-apples' description (Market→Reels Store); move 'blow-it-up' entry before 'be-water-my-friend'
└── components/
    ├── HelpModal.tsx              # NEW: modal with topic:'game'|'reel'|'spin'|'market'|'achievements'; renders help content + AI attribution for 'game' topic; onClose handler; click-outside closes
    ├── CurrencyDisplay.tsx        # MODIFY: 2×5 CSS grid layout (grid-cols-5); show emoji icon + value per cell; include Spins as 10th slot; use CURRENCY_ORDER reordered list
    ├── SpinControls.tsx           # MODIFY: remove entire multiplier toggle <div> (MULTIPLIERS=[1] makes it trivially x1-only)
    ├── MarketItem.tsx             # MODIFY: use def.emoji (not def.label) for the icon-cell <span>
    └── ReelColumn.tsx             # MODIFY: use def.emoji (not def.label) for the icon cell <span>

tests/
├── unit/
│   ├── achievements.test.ts       # MODIFY: assert 'second-breakfast' description; assert 'master-of-elements' description; assert blow-it-up index < be-water-my-friend index
│   ├── catalog.test.ts            # MODIFY: assert every ICON_CATALOG entry has a non-empty emoji field
│   └── CurrencyDisplay.test.tsx   # MODIFY: assert 2-row grid; assert correct cell order; assert emoji visible
│   └── HelpModal.test.tsx         # NEW: renders correct heading per topic; renders AI attribution for 'game'; onClose fires on button click
└── (integration tests unchanged — no game-logic changes)
```

## Complexity Tracking

> No constitution violations. Table not required.
