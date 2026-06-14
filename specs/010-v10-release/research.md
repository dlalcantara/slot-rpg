# Research: Version 1.0 Release Polish

**Feature**: 010-v10-release
**Phase**: 0 — Outline & Research

All changes are localized to existing components; no external unknowns or new dependencies.

---

## Decision: Help Modal Pattern

**Decision**: Reuse the `WinModal` / `StarvationModal` overlay pattern for help modals.

**Rationale**: Both `WinModal` and `StarvationModal` already implement a full-screen backdrop + centered card pattern with keyboard-accessible dismiss (click-outside / button). Reusing the same approach ensures visual consistency and zero new abstractions.

**Alternatives considered**: A popover/tooltip on hover was rejected because the spec explicitly says "display a help modal" and the target is mobile-first (hover is not reliable on touch devices).

---

## Decision: Icon Emoji vs. Label Field

**Decision**: Add an `emoji: string` field to `IconDefinition` in `types.ts` and use it in the icon cell display. Retain `label` as the human-readable name for market item text and aria-labels.

**Rationale**: `def.label` is used in two distinct contexts in `MarketItem.tsx` — as the icon cell glyph (`<span className="icon-cell">{def.label}</span>`) and as the item name (`<p>{def.label}</p>`). Replacing label with emoji would destroy the item name. A separate `emoji` field decouples the two concerns cleanly.

**Alternatives considered**: Replacing `label` with emoji directly would require adding a parallel `name` field to preserve human-readable names — functionally equivalent but breaks backward naming convention. Separate `emoji` field is cleaner.

---

## Decision: Emoji Assignments

| Icon definitionId | emoji |
|-------------------|-------|
| blank             | ⬜    |
| apple             | 🍎    |
| triple-apple      | 2x🍎  |
| dozen-apple       | 3x🍎  |
| copper            | 🟠    |
| silver            | ⚪    |
| gold              | 🟡    |
| crown             | 👑    |
| air               | 💨    |
| water             | 💧    |
| earth             | 🌿    |
| fire              | 🔥    |
| energy            | ⚡    |

**Rationale**: Single-cell emojis for all base icons. Triple-apple uses two distinct apple emojis to signal "double" without needing text. Dozen-apple uses three to signal "triple".

**Currency panel emoji mapping** (same emojis, consistent with reel icons):

| Currency key | emoji |
|--------------|-------|
| food (Apple) | 🍎    |
| copper       | 🟠    |
| silver       | ⚪    |
| gold         | 🟡    |
| crowns       | 👑    |
| air          | 💨    |
| water        | 💧    |
| earth        | 🌿    |
| fire         | 🔥    |
| spins        | 🎰    |

---

## Decision: Currency Panel Layout

**Decision**: Replace the current `flex-wrap` single-row layout in `CurrencyDisplay.tsx` with a two-row CSS grid (2 rows × 5 columns). The `CURRENCY_ORDER` in `currencyRegistry.ts` is reordered to `['food', 'copper', 'silver', 'gold', 'crowns', 'air', 'water', 'earth', 'fire']`. The spin count is integrated as the 10th slot in the grid using the same cell structure.

**Rationale**: Spec explicitly mandates 2 rows of 5. A CSS grid (`grid-cols-5`) is the least-markup solution and avoids any wrapping ambiguity.

**Alternatives considered**: Two separate `flex` rows were considered but require managing array slicing in JSX, which is more error-prone than a natural 5-column grid.

---

## Decision: x1 Button Removal

**Decision**: Remove the entire multiplier toggle `<div>` from `SpinControls.tsx`. `MULTIPLIERS = [1]` already limits the UI to a single button; removing the containing section is the correct scope.

**Rationale**: The spec says remove the x1 button. Since there is only one multiplier value and no plan to add more in this release, the entire section can go without any functional loss. The `spinMultiplier` state and dispatch remain in place; it just defaults to 1 permanently.

**Alternatives considered**: Hiding the section via CSS was rejected as dead code; the button shouldn't render at all.

---

## Decision: Feats Reorder — "Blow It Up" before "Be Water, My Friend"

**Decision**: Move the `blow-it-up` entry in the `ACHIEVEMENTS` array from its current index (10) to index 6, placing it immediately before `be-water-my-friend`.

**Rationale**: The `AchievementsTab` renders the array in declaration order. Reordering the array is the only change needed — no component changes.

---

## Decision: Help Modal Content

| Topic           | Content summary |
|-----------------|-----------------|
| Game (logo)     | Brief overview of how Slot RPG works; how to earn currencies, upgrade the reel, and use the magic phase. AI attribution paragraph verbatim. |
| Reel tab        | Explains the reel: the pool of icons that can appear during spins; how Prestige works. |
| Spin tab        | Ways to Win scoring: this slot machine uses "Ways to Win" — when identical symbols appear on all columns from left to right, you earn currency by multiplying the number of matching icons on each column together. The magic phase allows re-spins, swaps, and blocking. |
| Reels Store tab | Explains buying icons to add them to the reel; cost tiers (copper, silver, gold); cap at 50% of reel. |
| Feats tab       | Explains achievements: unlock by meeting in-game conditions; Happily Ever After requires all others. |

---

## No NEEDS CLARIFICATION Items

All requirements in the spec are fully resolved by inspection of the existing codebase. No external research required.
