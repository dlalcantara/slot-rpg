# Research: Version 1.1 Bug Fixes

**Branch**: `011-v11-bug-fixes` | **Date**: 2026-06-14

## Bug 1 — Apple Family Border Colors

**Decision**: Use `family` field (from `ICON_CATALOG`) as the grouping key in `computeHighlights`, not `definitionId`.

**Findings**:
- `computeHighlights` in `src/components/SlotGrid.tsx` builds a `defColSets` map keyed by `definitionId`.
- `apple`, `triple-apple`, and `dozen-apple` all have `family: 'apple'` in `ICON_CATALOG` (`src/game/catalog.ts`), but because the map keys on `definitionId`, each variant is tracked independently.
- Highlights are applied per-cell via `highlights.get(icon.definitionId)` in `ReelColumn.tsx:146`.
- Fix: build a `familyColSets: Map<family, Set<colIdx>>` first, then produce the output map by iterating each cell and resolving `family → color → definitionId`.
- The test file `tests/unit/computeHighlights.test.ts` **duplicates the function inline** rather than importing it; it will need new test cases for cross-variant apple scenarios, and the duplicated function body updated to match the fix.

**Alternatives considered**:
- Extend `computeHighlights` to accept a catalog lookup callback (more flexible but unnecessary abstraction).
- Map icon → family at the call site in `SlotGrid.tsx` before building the defColSets (same fix, just moved; cleaner to fix inside the function where the data is already available).

---

## Bug 2 — Multiplier Icon Display + Magic Boost Double Display

**Decision**: Change catalog emoji for `triple-apple` and `dozen-apple` to `🍎` (no prefix). Add a separate multiplier badge in `ReelColumn.tsx` that shows `×N` when `def.valuePerColumn > 1` and no override is active, or `×N` of the override value when a boost is active.

**Findings**:
- `icon-cell` CSS (`src/styles/index.css:22`) has `overflow-hidden` and `w-12 h-12` (48 × 48 px) at `font-size: 1.75rem`.
- At 1.75rem, the string `2x🍎` is wider than 48 px and the `2x` prefix is clipped.
- Current catalog: `triple-apple.emoji = '2x🍎'`, `dozen-apple.emoji = '3x🍎'`.
- In `ReelColumn.tsx:164–168`, `def.emoji` is rendered first, then `(×{effectiveValue})` is rendered conditionally on `hasOverride`. For a boosted `triple-apple`, both render — producing "2x🍎" + "(×3)" — multiplier displayed twice.
- Changing the emoji to `🍎` and always rendering `×{def.valuePerColumn}` when `valuePerColumn > 1` (and not overridden) achieves consistent, readable display.
- When `hasOverride`, render only the override value `×{effectiveValue}` (boost replaces base multiplier display).

**Alternatives considered**:
- Remove `overflow-hidden` from `icon-cell`: fixes clipping but doesn't fix the double-display bug.
- Reduce font size for multi-character strings dynamically: fragile, runtime-dependent.
- Add a `multiplier` field to `IconDefinition`: unnecessary — `valuePerColumn` already encodes this.

---

## Bug 3 — Reels Store Purchase Feedback

**Decision**: Track `recentlyBought` state in `Market.tsx` (a `Set<string>` of `definitionId`s purchased in the last 1.5 s), show a brief "✓" checkmark overlay or green flash on the item row, and reset after a timeout.

**Findings**:
- `MarketItem.tsx` has a Buy button that calls `onBuy(def.definitionId)` with no post-purchase state change.
- `Market.tsx` passes `onBuy` straight through without any local feedback tracking.
- No existing toast/flash infrastructure in the store component (though the spin flow uses `SpinResultToast`).
- Simplest approach: add `const [recentlyBought, setRecentlyBought] = useState<Set<string>>(new Set())` in `Market.tsx`; pass a wrapped `handleBuy` that sets the id in the set and clears it after 1.5 s.
- Pass `justBought: boolean` down to `MarketItem.tsx` and apply a brief green border / "Purchased!" label when true.

**Alternatives considered**:
- Add a standalone toast component for the store: heavier, and reusing the SpinResultToast pattern would require adapting it for non-spin events.
- Add feedback in `App.tsx` / `handleBuy`: the store is better scoped here.

---

## Bug 4 — Unclaimed Spin Gating

**Decision**: Pass `isMagicPhase: boolean` to `Market` and `ReelView`; both show a dismissible-banner (non-blocking alert, not a modal) and disable their primary actions while the flag is true.

**Findings**:
- `state.phase === 'magic'` while a spin result is unclaimed (between `BEGIN_MAGIC_PHASE` dispatch and `CLAIM` dispatch).
- `App.tsx` already derives `isMagicPhase = state.phase === 'magic'`.
- `ReelView` receives no `isMagicPhase` prop; prestige confirm button calls `onPrestige` directly.
- `Market.tsx` receives no `isMagicPhase` prop; buy button calls `onBuy` in `MarketItem`.
- Fix: pass `isMagicPhase` as a prop to both. In `ReelView`, show a banner and disable the "Prestige" button (and the prestige-selection confirm button). In `Market`, show a banner and pass `disabled` to `MarketItem`'s Buy button (in addition to the existing `affordable`/`atCap` checks).

**Alternatives considered**:
- Block in the reducer (`BUY_ICON` no-ops when phase === 'magic'): still needed as a guard, but without UI feedback the user won't understand why nothing happened.
- Navigate the user back to Spin tab automatically: too aggressive; a banner is less disruptive.

---

## Bug 5 — SSS Feat Description

**Decision**: Change `description` in `achievements.ts` from `'Own at least 3 silver-family icons.'` to `'Have at least 3 silver icons in your reel.'`

**Findings**:
- `src/game/achievements.ts:50` — `id: 'sss'`, `description: 'Own at least 3 silver-family icons.'`
- Trigger logic at lines 158–159 and 217–218 checks `ICON_CATALOG[i.definitionId]?.family === 'silver'`; the condition is correct — only the description text needs updating.
- No other references to this description in the codebase.

**Alternatives considered**: None — text-only change.
