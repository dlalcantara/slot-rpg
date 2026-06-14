# Implementation Plan: Version 1.1 Bug Fixes

**Branch**: `011-v11-bug-fixes` | **Date**: 2026-06-14 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/011-v11-bug-fixes/spec.md`

## Summary

Fix five bugs in the v1.1 release: (1) Apple-family icons (Apple / 2×Apple / 3×Apple) do not share green/yellow border highlights because `computeHighlights` groups by `definitionId` instead of `family`. (2) The `2x🍎` / `3x🍎` emoji strings are clipped by the 48×48 px `icon-cell`; fix by changing catalog emoji to `🍎` and rendering the multiplier as a separate badge — which also eliminates the double-multiplier display when Magic Boost is active. (3) Buying a reel in the Reels Store provides no visual confirmation; add a brief green success flash per item. (4) Players can prestige or buy reels while a spin is unclaimed; gate both actions behind an "unclaimed spin" banner. (5) The SSS feat description is incorrect; update to the specified text.

No new npm dependencies. No localStorage migration. No game-logic changes beyond the UI gate.

## Technical Context

**Language/Version**: TypeScript 5.6 / React 18.3 (Vite 6, Tailwind CSS 3)

**Primary Dependencies**: React 18, Vite 6, Tailwind CSS 3, Vitest 2, @testing-library/react 16

**Storage**: localStorage via `src/game/persistence.ts` — no schema change; `emoji` is never persisted

**Testing**: Vitest + @testing-library/react — existing suites in `tests/unit/` and `tests/integration/`

**Target Platform**: Browser (GitHub Pages CDN), mobile-first 720 × 1280 px

**Project Type**: Single-page web application — no backend

**Performance Goals**: Bundle ≤ 250 KB gzip; spin computation ≤ 16 ms; page load ≤ 3 s on Slow 3G

**Constraints**: No new npm dependencies; all changes are CSS/JSX/logic only; no migration step

**Scale/Scope**: 7 modified source files, 3 updated test files, no new components

## Constitution Check

- [x] **I. Code Quality** — TypeScript strict on. No `any` casts introduced. `isMagicPhase` prop typed as `boolean`. `recentlyBought` typed as `Set<string>`. Dead emoji prefix strings removed from catalog.
- [x] **II. Test-First** — Tests written Red before implementation: `computeHighlights` cross-variant apple cases; `ReelColumn` multiplier badge display; `Market` purchase flash; `Market` and `ReelView` unclaimed-spin banner; SSS achievement description.
- [x] **III. UX Consistency** — `×N` badge fits within existing 48×48 px `icon-cell` (short text at `text-xs`). Unclaimed-spin banners use existing `text-yellow-400` warning pattern. Purchase flash uses existing `ring-2 ring-green-400` border pattern. Verified at 720 × 1280 px.
- [x] **IV. Performance** — No new dependencies. String literals only. `setTimeout` cleanup on unmount for purchase flash. No spin-path code changes.
- [x] **V. Build Pipeline** — Existing GitHub Actions gates require no changes.

*All items pass. No complexity violations.*

## Project Structure

### Documentation (this feature)

```text
specs/011-v11-bug-fixes/
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
├── game/
│   ├── catalog.ts              # MODIFY: triple-apple emoji '2x🍎'→'🍎'; dozen-apple '3x🍎'→'🍎'
│   └── achievements.ts         # MODIFY: SSS description text
├── components/
│   ├── SlotGrid.tsx            # MODIFY: computeHighlights — group by family, not definitionId; import ICON_CATALOG
│   ├── ReelColumn.tsx          # MODIFY: multiplier badge logic (×N when valuePerColumn>1 and !hasOverride)
│   ├── Market.tsx              # MODIFY: add isMagicPhase prop + banner; add recentlyBought state; wrap onBuy
│   ├── MarketItem.tsx          # MODIFY: add justBought + disabled props; render success flash
│   └── ReelView.tsx            # MODIFY: add isMagicPhase prop + banner; disable prestige button
└── App.tsx                     # MODIFY: pass isMagicPhase to Market and ReelView

tests/
├── unit/
│   ├── computeHighlights.test.ts   # MODIFY: add apple-family cross-variant cases; update duplicated function body
│   ├── ReelColumn.test.tsx         # MODIFY: add multiplier badge test cases
│   ├── market.test.tsx             # MODIFY: add justBought flash test; add isMagicPhase banner test
│   └── achievements.test.ts        # MODIFY: assert SSS description matches new text
└── integration/
    └── marketFlow.test.tsx         # MODIFY: add unclaimed-spin gate integration test
```

**Structure Decision**: Single-project SPA — all changes in `src/`. No new files; no new components.

## Bug-by-Bug Implementation Guide

### Bug 1 — Apple Family Border Colors (`SlotGrid.tsx`)

**Root cause**: `computeHighlights` builds `defColSets: Map<definitionId, Set<colIdx>>`. Apple variants have different `definitionId`s (`apple`, `triple-apple`, `dozen-apple`) so they never share a bucket.

**Fix**:
1. Import `ICON_CATALOG` at the top of `SlotGrid.tsx`.
2. Replace `defColSets` with `familyColSets: Map<family, Set<colIdx>>`.
3. For each cell: `const family = ICON_CATALOG[cell.icon.definitionId]?.family ?? 'blank'`; skip if `'blank'`; add `colIdx` to `familyColSets.get(family)`.
4. Build the output `map: Map<definitionId, color>` by iterating every cell again, looking up its family's colSet, and mapping `definitionId → color`.

**Test cases to add in `computeHighlights.test.ts`**:
- Apple in col 0, triple-apple in col 1, dozen-apple in col 2 (3 active) → all three definitionIds map to `'green'`
- Apple in col 0, triple-apple in col 1, blank in col 2 (3 active) → `apple` and `triple-apple` map to `'yellow'`
- Only apple in col 0 (of 3) → no highlight for any apple variant

---

### Bug 2 — Multiplier Icon Display (`catalog.ts` + `ReelColumn.tsx`)

**Root cause**: `triple-apple.emoji = '2x🍎'` — at 1.75 rem the `2x` prefix overflows the 48×48 `icon-cell` (which has `overflow-hidden`). Magic Boost adds a second `(×N)` badge on top.

**Fix in `catalog.ts`**:
- `triple-apple.emoji`: `'2x🍎'` → `'🍎'`
- `dozen-apple.emoji`: `'3x🍎'` → `'🍎'`

**Fix in `ReelColumn.tsx`** (render section for each cell, replacing the current `hasOverride` branch):
```
if hasOverride:
  show: <span class="text-xs text-green-400 ml-1">×{effectiveValue}</span>
else if def.valuePerColumn > 1:
  show: <span class="text-xs text-gray-300 ml-1">×{def.valuePerColumn}</span>
else:
  show nothing
```

**Test cases to add in `ReelColumn.test.tsx`**:
- Column of `triple-apple` icons renders `🍎` and `×2` badge; `2x🍎` must NOT appear
- Column of `dozen-apple` icons renders `🍎` and `×3` badge
- Magic Boost override on `triple-apple` renders `×{overrideValue}` (green), NOT two multiplier labels
- Column of plain `apple` icons renders no multiplier badge

---

### Bug 3 — Reels Store Purchase Feedback (`Market.tsx` + `MarketItem.tsx`)

**Fix in `Market.tsx`**:
- Add `const [recentlyBought, setRecentlyBought] = useState<Set<string>>(new Set())`.
- Wrap `onBuy` with a local handler that calls `onBuy`, adds the `definitionId` to `recentlyBought`, and schedules `setTimeout` to remove it after 1500 ms. Clear timeout on unmount.
- Pass `justBought={recentlyBought.has(def.definitionId)}` and `disabled={isMagicPhase}` to `MarketItem`.

**Fix in `MarketItem.tsx`**:
- Add `justBought: boolean` prop.
- When `justBought`, apply a `ring-2 ring-green-400` border to the item row and render a `✓` indicator next to the Buy button (or replace button text with `✓`).
- Transition handled by the parent timeout, no animation library needed.

**Test cases to add in `market.test.tsx`**:
- After calling `onBuy`, the bought item shows a success indicator (query by text `✓` or by `ring-green-400` class on item).
- After 1500 ms (fake timers), the indicator disappears.

---

### Bug 4 — Unclaimed Spin Gating (`App.tsx` + `Market.tsx` + `ReelView.tsx`)

**Fix in `App.tsx`**:
- Pass `isMagicPhase={isMagicPhase}` to `<Market>` and `<ReelView>`.

**Fix in `Market.tsx`**:
- Add `isMagicPhase: boolean` to `Props`.
- At the top of the component's rendered output, when `isMagicPhase`:
  - Render a yellow banner: `"Claim your spin before purchasing."` (using `text-yellow-400 bg-yellow-900/30 rounded p-2 text-sm`).
  - Pass `disabled={isMagicPhase || atCap || !affordable}` (effectively `disabled` when gated).

**Fix in `ReelView.tsx`**:
- Add `isMagicPhase: boolean` to `Props`.
- When `isMagicPhase`:
  - Show same yellow banner: `"Claim your spin before prestiging."`
  - Disable the "Prestige" start button (`disabled={isMagicPhase || !prestigeAvailable}`).
  - If already in prestige-selection mode (unlikely during magic phase, but guard anyway), show the banner and disable the "Confirm" button too.

**Test cases to add**:
- `market.test.tsx`: when `isMagicPhase=true`, Buy button is disabled and banner text is present.
- `marketFlow.test.tsx` (integration): dispatch SPIN → BEGIN_MAGIC_PHASE, navigate to Market tab, assert Buy is disabled with message; dispatch CLAIM, assert Buy re-enables.
- `ReelView` test (unit): when `isMagicPhase=true`, Prestige button is disabled and banner is present.

---

### Bug 5 — SSS Feat Description (`achievements.ts`)

**Fix**: Line 50 — change `description: 'Own at least 3 silver-family icons.'` → `'Have at least 3 silver icons in your reel.'`

**Test case to add in `achievements.test.ts`**: assert `ACHIEVEMENTS.find(a => a.id === 'sss')?.description === 'Have at least 3 silver icons in your reel.'`
