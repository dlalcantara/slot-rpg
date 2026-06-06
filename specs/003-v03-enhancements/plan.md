# Implementation Plan: Version 0.3 Enhancements

**Branch**: `003-v03-enhancements` | **Date**: 2026-06-06 | **Spec**: [spec.md](spec.md)

## Summary

Add spin multipliers (x1/x10/x100 that scale one spin's outcome), a game log in the Spin tab, conditional modal display (notable results only), animate and auto-convert toggles, market pricing updates (crown = 100 gold, alternate denomination display), deferred currency bar updates, and persistence of settings + game log across reloads. All changes are additive to the existing React/TypeScript/Vite/Tailwind stack with no new runtime dependencies.

## Technical Context

**Language/Version**: TypeScript 5.6 / React 18.3

**Primary Dependencies**: React, Tailwind CSS 3.4, Vite 6, Vitest 2.1, @testing-library/react

**Storage**: localStorage via `src/game/persistence.ts` (existing)

**Testing**: Vitest + @testing-library/react

**Target Platform**: Browser (GitHub Pages, mobile-first 720×1280 px)

**Project Type**: Web application (single-page, no backend)

**Performance Goals**: Spin computation ≤ 16 ms; animation frame budget 60 fps; bundle ≤ 250 KB gzipped

**Constraints**: No new runtime dependencies; multiplied spin is one spin resolved once with payouts scaled; currency bar must not update until spin animation ends + modal dismissed (if shown)

**Scale/Scope**: ~12 source files modified/added; state version bump v2 → v3

## Constitution Check

- [x] **I. Code Quality** — TypeScript strict mode already enabled; no `any` casts planned. New settings shape is fully typed via `PlayerSettings` interface.
- [x] **II. Test-First** — Unit tests written before implementation for: multiplier payout scaling, autoConvert toggle in reducer, notable-result detection logic, game log capping at 10, settings persistence round-trip, state migration v2→v3. Component tests for GameLog render and SpinControls toggles.
- [x] **III. UX Consistency** — Layout verified at 720×1280 px; toggle controls are inline and do not increase vertical footprint significantly; game log is capped/scrollable so it cannot push controls off-screen.
- [x] **IV. Performance** — No new dependencies; x100 spin is still one `computeSpin()` call with multiplication; no synchronous blocking added; bundle delta expected < 2 KB.
- [x] **V. Build Pipeline** — Existing CI gates (typecheck → lint → unit → integration → build → bundle size) apply unchanged.

## Project Structure

### Documentation (this feature)

```text
specs/003-v03-enhancements/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
└── tasks.md             # Phase 2 output (/speckit-tasks)
```

### Source Code (repository root)

```text
src/
├── App.tsx                          # Wire new actions, deferred currency display, settings state
├── game/
│   ├── types.ts                     # Add PlayerSettings, SpinLogEntry; extend GameState
│   ├── reducer.ts                   # SPIN accepts multiplier; autoConvert gate; game log; new actions
│   ├── persistence.ts               # Migrate v2→v3 (add settings + gameLog fields)
│   ├── initialState.ts              # Include default settings and empty gameLog
│   └── catalog.ts                   # Crown cost: gold 10 → 100
└── components/
    ├── SpinControls.tsx             # NEW: multiplier toggle (x1/x10/x100) + animate toggle
    ├── GameLog.tsx                  # NEW: game log list, capped at 10 entries
    ├── SpinResultModal.tsx          # Unchanged interface; App controls when it's shown
    ├── CurrencyDisplay.tsx          # Accept displayedCurrencies (deferred) instead of raw state
    └── MarketItem.tsx               # Show alternate denomination line under primary price

tests/
├── unit/
│   ├── reducer.test.ts              # Multiplier scaling, autoConvert toggle, game log cap
│   ├── notableResult.test.ts        # >20% threshold logic, crown detection
│   └── persistence.test.ts          # v2→v3 migration round-trip
└── component/
    ├── GameLog.test.tsx             # Renders up to 10 entries, labels multiplier
    ├── SpinControls.test.tsx        # Toggle states, emits correct multiplier
    └── MarketItem.test.tsx          # Alternate denomination display
```

**Structure Decision**: Single project, extending existing `src/` layout. No new top-level directories needed.

## Complexity Tracking

No constitution violations. All gates pass.
