# Data Model: Version 0.9 — Energy

## Modified: `CurrencyKey` (`src/game/types.ts`)

```typescript
// Before
export type CurrencyKey = 'food' | 'copper' | 'silver' | 'gold' | 'crowns' | 'air' | 'water' | 'earth' | 'fire'

// After
export type CurrencyKey = 'food' | 'copper' | 'silver' | 'gold' | 'crowns' | 'air' | 'water' | 'earth' | 'fire' | 'energy'
```

`energy` is never persisted to `state.currencies`; it is computed transiently in the CLAIM handler and discarded after threshold checks.

---

## Modified: `IconDefinition` (`src/game/types.ts`)

```typescript
export interface IconDefinition {
  definitionId: string
  family: string
  valuePerColumn: number
  label: string
  effect: IconEffect
  cost: { currency: CurrencyKey; amount: number } | null    // existing — single currency
  multiCost: { currency: CurrencyKey; amount: number }[] | null   // NEW — multi-currency
}
```

Existing icons: `multiCost: null`.
Energy icon: `cost: null`, `multiCost: [{ currency: 'gold', amount: 1 }, { currency: 'air', amount: 1 }, { currency: 'water', amount: 1 }, { currency: 'earth', amount: 1 }, { currency: 'fire', amount: 1 }]`.

---

## Modified: `GamePhase` (`src/game/types.ts`)

```typescript
// Before
export type GamePhase = 'market' | 'spinning' | 'magic' | 'gameover' | 'win'

// After
export type GamePhase = 'market' | 'spinning' | 'magic' | 'gameover' | 'win' | 'starvation'
```

`'starvation'` is set after auto-prestige fires (food = 0 post-claim). Transitions to `'market'` on `DISMISS_STARVATION`.

---

## Modified: `GameState` (`src/game/types.ts`)

| Field | Change | Notes |
|-------|--------|-------|
| `rowCount` | **ADDED** `3 \| 4 \| 5` | Defaults to 3; increases on Sweet/Nice triggers; resets to 3 on prestige |

---

## Modified: `GameAction` (`src/game/types.ts`)

```typescript
// Added
| { type: 'DISMISS_STARVATION' }
```

---

## Modified: `AchievementId` (`src/game/achievements.ts`)

```typescript
// Before
| 'wip1'
| 'wip2'

// After
| 'sweet'
| 'nice'
```

---

## New Catalog Entry: Energy Icon (`src/game/catalog.ts`)

```typescript
energy: {
  definitionId: 'energy',
  family: 'energy',
  valuePerColumn: 1,
  label: 'Energy',
  effect: { type: 'add_currency', currency: 'energy', valuePerColumn: 1 },
  cost: null,
  multiCost: [
    { currency: 'gold',  amount: 1 },
    { currency: 'air',   amount: 1 },
    { currency: 'water', amount: 1 },
    { currency: 'earth', amount: 1 },
    { currency: 'fire',  amount: 1 },
  ],
}
```

---

## New Currency Registry Entry: Energy (`src/game/currencyRegistry.ts`)

```typescript
energy: {
  key: 'energy',
  label: 'Energy',
  startingAmount: 0,
  autoConvertTo: null,
  convertibleFrom: null,
  winCondition: null,
  lossCondition: null,
}
```

Not shown in `CurrencyDisplay` (filtered by key `'energy'`).

---

## Modified: `PRESTIGE_STARTING_CURRENCIES` (`src/game/initialState.ts`)

```typescript
// Before: copper starts at 0 (via the catch-all filter)
// After: copper explicitly set to 10
export const PRESTIGE_STARTING_CURRENCIES: Record<string, number> = {
  food: 10,
  air: 10,
  water: 10,
  copper: 10,   // NEW
  ...Object.fromEntries(
    Object.keys(CURRENCY_REGISTRY)
      .filter((k) => !['food', 'air', 'water', 'copper'].includes(k))
      .map((k) => [k, 0])
  ),
}
```

---

## Achievement Unlock Condition Changes

| Achievement | Before | After |
|---|---|---|
| `sweet` (was `wip1`) | WIP — never unlocks | Energy payout ≥ 16 in one claim; sets `rowCount` to max(current, 4) |
| `nice` (was `wip2`) | WIP — never unlocks | Energy payout ≥ 69 in one claim; sets `rowCount` to max(current, 5) |
| `second-breakfast` | ≥ 2 apple-family icons in active grid | `claimPayouts.find(p => p.family === 'apple')?.amount >= 2` |
| `master-of-elements` | All 4 element families present in active grid | All 4 element families have an entry in `claimPayouts` |
| `i-understand-it-now` | Description: "Prestige while keeping a silver or gold icon" | Description: "Prestige keeping an icon that costs at least 1 silver" (condition unchanged) |

---

## Persistence Migration (applied in `loadState()`)

1. If `saved.rowCount` is `undefined` → set to `3`.
2. If `saved.unlockedAchievements` includes `'wip1'` → replace with `'sweet'` (safety; WIP was never unlockable).
3. If `saved.unlockedAchievements` includes `'wip2'` → replace with `'nice'` (same).
4. Existing `spinMultiplier` and `masterOfElements` migrations from v0.8 remain in place.

---

## Row Count State Transitions

| Event | `rowCount` after |
|---|---|
| Game initialized / hard reset | 3 |
| Claim with energy ≥ 16 (first time) | max(current, 4) |
| Claim with energy ≥ 69 (first time) | max(current, 5) |
| Regular prestige | 3 |
| Auto-prestige (starvation) | 3 |
| Any other action | unchanged |
