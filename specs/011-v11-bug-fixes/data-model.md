# Data Model: Version 1.1 Bug Fixes

**Branch**: `011-v11-bug-fixes` | **Date**: 2026-06-14

No new entities, storage schema changes, or localStorage migrations are required. All changes are to display logic and UI state.

---

## Changed: `IconDefinition.emoji` for multiplier apple variants

**Entity**: `IconDefinition` (`src/game/types.ts`)

| `definitionId` | Before | After | Reason |
|---------------|--------|-------|--------|
| `triple-apple` | `'2x🍎'` | `'🍎'` | Multi-char string clipped by `overflow-hidden` at 1.75 rem; multiplier now rendered as separate badge |
| `dozen-apple` | `'3x🍎'` | `'🍎'` | Same as above |

**No other fields on `IconDefinition` change.** The `valuePerColumn` field (2 and 3 respectively) already encodes the multiplier; the display badge reads it directly.

---

## Changed: Multiplier display logic in `ReelColumn`

**Component**: `ReelColumn.tsx`

Adds a `multiplierBadge` render branch:

| Condition | Rendered label |
|-----------|----------------|
| `hasOverride` | `×{effectiveValue}` (green, existing style) |
| `!hasOverride && def.valuePerColumn > 1` | `×{def.valuePerColumn}` (gray/white, new) |
| `!hasOverride && def.valuePerColumn === 1` | *(nothing — current behavior preserved)* |

---

## Changed: `computeHighlights` grouping key

**Function**: `computeHighlights` in `src/components/SlotGrid.tsx`

| Before | After |
|--------|-------|
| Groups cells by `definitionId` | Groups cells by `ICON_CATALOG[definitionId].family` |
| Returns `Map<definitionId, color>` | Returns `Map<definitionId, color>` (same shape) |

The output map shape is unchanged — consumers (`ReelColumn`) still look up by `definitionId`. The internal grouping now uses `family` so apple variants share a bucket.

---

## Changed: `Market` component props

**Component**: `Market.tsx`

| Prop | Type | Description |
|------|------|-------------|
| `isMagicPhase` | `boolean` (new) | When true, shows "Claim your spin first" banner and disables Buy buttons |

`MarketItem.tsx` receives an additional `justBought: boolean` prop (new) to control the temporary success indicator, and `disabled: boolean` (new) from the `isMagicPhase` gate.

---

## Changed: `ReelView` component props

**Component**: `ReelView.tsx`

| Prop | Type | Description |
|------|------|-------------|
| `isMagicPhase` | `boolean` (new) | When true, shows "Claim your spin first" banner and disables the Prestige button |

---

## No-change: localStorage / persistence schema

`src/game/persistence.ts` is untouched. The `emoji` field is derived from `catalog.ts` at runtime and never persisted. The `phase` field already exists in `GameState`; no migration needed.
