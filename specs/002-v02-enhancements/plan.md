# Implementation Plan: Slot Machine RPG v0.2 Enhancements

**Branch**: `002-v02-enhancements` | **Date**: 2026-06-06 | **Spec**: [spec.md](spec.md)

## Summary

Restructure the UI into a three-tab layout (Reel / Spin / Market), add a persistent currency bar with a Spins counter, improve spin animation (simultaneous start, cycling icons at 0.2s intervals, per-column stop indicator, result modal), resize icons to 128×128 px, and update the starting reel to 2 blanks + 1 apple + 1 copper.

## Technical Context

**Language/Version**: TypeScript 5.6 / React 18.3

**Primary Dependencies**: React, Tailwind CSS 3.4, Vite 6, Vitest 2.1, @testing-library/react

**Storage**: localStorage (existing persistence layer via `src/game/persistence.ts`)

**Testing**: Vitest + @testing-library/react

**Target Platform**: Browser (GitHub Pages, mobile-first 720×1280 px)

**Project Type**: Web application (single-page, no backend)

**Performance Goals**: Spin computation ≤ 16 ms; animation frame budget: 60 fps; bundle ≤ 250 KB gzipped

**Constraints**: No new runtime dependencies (keep bundle lean); icon cycling interval exactly 200 ms; all columns start spinning simultaneously (0 ms stagger)

**Scale/Scope**: Single-player, client-only; ~10 source files touched

## Constitution Check

- [x] **I. Code Quality** — TypeScript strict mode already enabled; no `any` casts planned for new code.
- [x] **II. Test-First** — Unit tests written before implementation for: Spins counter logic, CURRENCY_ORDER reordering, initial reel composition. Animation behavior covered by component tests (simulate timer, assert class changes).
- [x] **III. UX Consistency** — Tab layout verified at 720×1280 px; icon slots use 128×128 px bounding boxes (constitution updated to match); spin must complete or be skippable within 5 s; Spin button disabled during active spin.
- [x] **IV. Performance** — No new dependencies; animation uses `setInterval` (browser-native); spin logic unchanged; bundle delta expected < 1 KB.
- [x] **V. Build Pipeline** — Existing CI gates (typecheck → lint → unit → build) apply unchanged.

## Project Structure

### Documentation (this feature)

```text
specs/002-v02-enhancements/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
└── tasks.md             # Phase 2 output (/speckit-tasks)
```

### Source Code (repository root)

```text
src/
├── App.tsx                          # Tab layout shell + persistent currency bar
├── game/
│   ├── currencyRegistry.ts          # CURRENCY_ORDER reordered (gold > silver > copper)
│   ├── initialState.ts              # Starting reel: 2 blank, 1 apple, 1 copper
│   ├── types.ts                     # GameState gains spinCount: number
│   ├── reducer.ts                   # SPIN action increments spinCount
│   └── (spinLogic, persistence, catalog unchanged)
└── components/
    ├── CurrencyDisplay.tsx          # Add Spins counter display
    ├── ReelColumn.tsx               # Simultaneous start, 200ms icon cycling, spinning style
    ├── SlotGrid.tsx                 # Larger grid, pass reel icons for cycling
    ├── SpinResultModal.tsx          # NEW: post-spin result modal
    ├── ReelView.tsx                 # NEW: Reel tab content
    └── (Market, SpinButton, WinModal, GameOverScreen unchanged)

tests/
├── unit/
│   ├── reducer.test.ts              # Add spinCount increment test
│   └── initialState.test.ts        # Verify starting reel composition
└── component/
    ├── CurrencyDisplay.test.tsx     # Spins counter renders
    ├── ReelColumn.test.tsx          # Simultaneous start, icon cycling, stop state
    └── SpinResultModal.test.tsx     # Modal renders result, dismisses correctly
```

**Structure Decision**: Single project, extending the existing `src/` layout. No new directories needed beyond `tests/component/`.

