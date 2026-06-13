# Data Model: Version 0.8 — Achievements

## New Types (`src/game/achievements.ts`)

### `AchievementId`

```typescript
export type AchievementId =
  | 'how-do-you-like-them-apples'
  | 'second-breakfast'
  | 'out-of-stock'
  | 'sss'
  | 'i-understand-it-now'
  | 'coin-collector'
  | 'be-water-my-friend'
  | 'why'
  | 'born-with-diamond-spoon'
  | 'this-is-sparta'
  | 'ancient-civilization'
  | 'wip1'
  | 'wip2'
  | 'master-of-elements'
  | 'happily-ever-after'
```

### `AchievementDefinition`

```typescript
export interface AchievementDefinition {
  id: AchievementId
  title: string
  description: string
  isWip: boolean
}
```

## Modified: `GameState` (`src/game/types.ts`)

| Field | Before | After |
|-------|--------|-------|
| `masterOfElements` | `boolean` | **REMOVED** |
| `unlockedAchievements` | *(absent)* | `AchievementId[]` — persisted, append-only |

## Modified: `SpinMultiplier` (`src/game/types.ts`)

```typescript
// Before
export type SpinMultiplier = 1 | 10 | 100

// After
export type SpinMultiplier = 1
```

## Modified: `SpinLogEntry` (`src/game/types.ts`)

```typescript
// Before
multiplier: SpinMultiplier

// After
multiplier: number   // historical entries may hold 10 or 100
```

## Achievement Unlock Conditions

| Achievement ID | Trigger action(s) | Condition |
|---|---|---|
| `how-do-you-like-them-apples` | `BUY_ICON` | `ICON_CATALOG[action.iconDefinitionId].family === 'apple'` |
| `second-breakfast` | `CLAIM` | ≥ 2 Apple-family icons in spin result columns |
| `out-of-stock` | `BUY_ICON`, `PRESTIGE` | `max(iconCountPerDefinition) * 2 >= newState.reel.icons.length` |
| `sss` | `BUY_ICON`, `PRESTIGE` | `iconCountByFamily('silver') >= 3` |
| `i-understand-it-now` | `PRESTIGE` | any kept icon has `cost.currency` of `'silver'` or `'gold'` |
| `coin-collector` | `BUY_ICON`, `PRESTIGE` | reel contains ≥ 1 each of `copper`, `silver`, `gold` families |
| `be-water-my-friend` | `CLAIM` | `prevState.magicCounters.swap > 0` AND `rawPayouts` has ≥ 2 distinct families |
| `why` | `CLAIM` | `prevState.blockedColumns.length > 0` AND `sum(allColPayouts) > sum(activeColPayouts)` |
| `born-with-diamond-spoon` | `PRESTIGE` | `action.keepDefinitionIds.includes('crown')` |
| `this-is-sparta` | `CLAIM` | `newState.currencies.crowns >= 300` |
| `ancient-civilization` | `CLAIM` | `newState.currencies.crowns >= 5000` |
| `wip1` | *(never)* | `isWip = true` — no unlock logic |
| `wip2` | *(never)* | `isWip = true` — no unlock logic |
| `master-of-elements` | `CLAIM` | all 4 element families (`air`, `water`, `earth`, `fire`) appear ≥ 1 time in spin result columns |
| `happily-ever-after` | any achievement unlock | all 14 non-WIP, non-meta IDs are in `newState.unlockedAchievements` |

## Persistence Migration (applied in `loadState()`)

1. If `saved.masterOfElements` exists → delete the field.
2. If `saved.unlockedAchievements` is `undefined` → set to `[]`.
3. If `saved.settings.spinMultiplier` is not `1` → set to `1`.

These are applied before the loaded state is returned to the reducer, ensuring all live sessions start clean regardless of prior version.
