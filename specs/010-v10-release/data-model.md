# Data Model: Version 1.0 Release Polish

**Feature**: 010-v10-release
**Phase**: 1 — Design & Contracts

No new game-state entities are introduced. This feature modifies existing type definitions and static data constants.

---

## Modified Type: `IconDefinition` (`src/game/types.ts`)

Add one new field:

| Field  | Type     | Required | Description                              |
|--------|----------|----------|------------------------------------------|
| emoji  | string   | yes      | Emoji glyph shown in the icon cell on the reel grid and the market icon cell. Separate from `label` (human-readable name). |

All existing `IconDefinition` fields are unchanged.

---

## Modified Constant: `ICON_CATALOG` (`src/game/catalog.ts`)

Each entry gains an `emoji` value. Labels remain as human-readable names (used in market item names and aria-labels).

| definitionId  | label      | emoji  |
|---------------|------------|--------|
| blank         | (unchanged)| ⬜     |
| apple         | Apple      | 🍎     |
| triple-apple  | 2× Apple   | 2x🍎  |
| dozen-apple   | 3× Apple   | 3x🍎  |
| copper        | Copper     | 🟠     |
| silver        | Silver     | ⚪     |
| gold          | Gold       | 🟡     |
| crown         | Crown      | 👑     |
| air           | Air        | 💨     |
| water         | Water      | 💧     |
| earth         | Earth      | 🌿     |
| fire          | Fire       | 🔥     |
| energy        | Energy     | ⚡     |

---

## Modified Constant: `CURRENCY_ORDER` (`src/game/currencyRegistry.ts`)

Reordered to support the 2×5 currency panel layout. Spins occupies the 10th slot in `CurrencyDisplay` but is not part of `CURRENCY_ORDER` (it is the separate `spinCount` prop).

```
Old: ['food', 'gold', 'silver', 'copper', 'crowns', 'air', 'water', 'earth', 'fire']
New: ['food', 'copper', 'silver', 'gold', 'crowns', 'air', 'water', 'earth', 'fire']
```

Row mapping (for reference):
- Row 1: food (Apple), copper, silver, gold, crowns
- Row 2: air, water, earth, fire, spins (from spinCount)

## Modified Constant: `CURRENCY_REGISTRY` (`src/game/currencyRegistry.ts`)

Rename `food` entry label:

| Key  | Old label | New label |
|------|-----------|-----------|
| food | 'Food'    | 'Apple'   |

No other registry entries change.

---

## Modified Constant: `ACHIEVEMENTS` (`src/game/achievements.ts`)

Two description fixes and one ordering change:

| id                 | Old description                                                                   | New description                       |
|--------------------|-----------------------------------------------------------------------------------|---------------------------------------|
| second-breakfast   | Earn food from at least 2 apple-family icons in a single spin.                    | Earn >= 2 Apple in one spin.          |
| master-of-elements | Have all four elements — Air, Water, Earth, and Fire — appear in a single spin.   | Earn all four elements in one spin.   |

Order change: `blow-it-up` moves from index 10 to index 6 (before `be-water-my-friend`).

Side effect: `how-do-you-like-them-apples` description currently says "Buy an apple from the Market." — update to "Buy an apple from the Reels Store." as a natural consequence of the Market rename.

---

## New Component: `HelpModal` (`src/components/HelpModal.tsx`)

Static content component; no game state involved.

**Props**:

| Prop     | Type                                            | Description                                  |
|----------|-------------------------------------------------|----------------------------------------------|
| topic    | `'game' \| 'reel' \| 'spin' \| 'market' \| 'achievements'` | Which help content to display  |
| onClose  | `() => void`                                    | Called when the modal is dismissed           |

**Rendering**: Full-screen backdrop + centered card, matching `WinModal`/`StarvationModal` overlay pattern. Close button in top-right. Click-outside also closes.

**Content mapping** (see `research.md` for full text):

| topic         | heading                | body                                                  |
|---------------|------------------------|-------------------------------------------------------|
| game          | About Slot RPG         | Game overview + AI attribution paragraph              |
| reel          | The Reel Tab           | Explanation of reel icons and Prestige                |
| spin          | The Spin Tab           | Ways to Win scoring: when identical symbols appear across all columns from left to right, earn currency by multiplying the icon count per column together; magic phase actions  |
| market        | The Reels Store        | Buying icons, cost tiers, cap rule                    |
| achievements  | Feats                  | How achievements unlock; Happily Ever After meta-feat |

---

## No New Storage Entities

No `localStorage` schema changes. The `food` → `Apple` rename is a display label change only; the key `'food'` in `Currencies` is unchanged. No migration needed.
