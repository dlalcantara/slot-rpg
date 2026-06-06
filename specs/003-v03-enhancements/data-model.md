# Data Model: Version 0.3 Enhancements

**Date**: 2026-06-06

## New Types (`src/game/types.ts`)

### `PlayerSettings`

```ts
export interface PlayerSettings {
  autoConvert: boolean      // default: true — auto-convert copper→silver→gold
  animate: boolean          // default: true — show slot column spin animation
  spinMultiplier: 1 | 10 | 100  // default: 1
}

export const DEFAULT_SETTINGS: PlayerSettings = {
  autoConvert: true,
  animate: true,
  spinMultiplier: 1,
}
```

### `SpinLogEntry`

```ts
export interface SpinLogEntry {
  spinNumber: number        // global spin counter at time of entry
  multiplier: 1 | 10 | 100 // multiplier used for this spin action
  payouts: Payout[]         // scaled payouts (after multiplier applied)
  timestamp: number         // Date.now() — for future display use
}
```

### `GameState` (extended)

New fields added to the existing interface:

```ts
export interface GameState {
  version: number           // bumped to 3
  reel: Reel
  currencies: Currencies
  phase: GamePhase
  lastSpinResult: SpinResult | null
  spinCount: number
  settings: PlayerSettings  // NEW
  gameLog: SpinLogEntry[]   // NEW — max 10 entries, most recent first
}
```

## Reducer Changes (`src/game/reducer.ts`)

### Updated `SPIN` action type

```ts
| { type: 'SPIN'; multiplier: 1 | 10 | 100 }
```

### New `UPDATE_SETTINGS` action

```ts
| { type: 'UPDATE_SETTINGS'; patch: Partial<PlayerSettings> }
```

**Reducer handling**: Merges patch into `state.settings` and calls `saveState`.

### SPIN logic changes

1. Deduct `multiplier` apples (instead of always 1).
2. Call `computeSpin(state.reel)` once.
3. Multiply each `payout.amount` by `multiplier`.
4. Gate `applyAutoConversions` behind `state.settings.autoConvert`.
5. Prepend a new `SpinLogEntry` to `state.gameLog`; trim to 10.

## Persistence Changes (`src/game/persistence.ts`)

- Bump `CURRENT_VERSION` to `3`.
- Add migration: if `parsed.version === 2`, inject `settings: DEFAULT_SETTINGS` and `gameLog: []`.

## Catalog Change (`src/game/catalog.ts`)

- `crown.cost`: `{ currency: 'gold', amount: 10 }` → `{ currency: 'gold', amount: 100 }`

## Component Contracts

### `SpinControls` (new)

```ts
interface SpinControlsProps {
  settings: PlayerSettings
  onSettingsChange: (patch: Partial<PlayerSettings>) => void
  spinning: boolean
}
```

Renders:
- Animate toggle (checkbox/switch labeled "Animate")
- Auto-convert toggle (checkbox/switch labeled "Auto-convert money")
- Multiplier buttons: x1 | x10 | x100 (radio-style, next to SPIN button)

### `GameLog` (new)

```ts
interface GameLogProps {
  entries: SpinLogEntry[]
}
```

Renders up to 10 entries. Each entry displays: `Spin #N (xM): [payout summary or "no match"]`.

### `CurrencyDisplay` (updated)

Accepts `displayedCurrencies: Currencies` (the deferred value from App state) instead of reading directly from `state.currencies`. Prop rename only — no internal logic change.

### `MarketItem` (updated)

Reads `CURRENCY_REGISTRY` conversion rates to compute and render an alternate denomination line. No new props needed — conversion math is derived from existing catalog/registry data.

## Currency Conversion Reference

| Primary | Equivalent |
|---------|-----------|
| 1 silver | 100 copper |
| 1 gold | 100 silver / 10,000 copper |

Encoded in `CURRENCY_REGISTRY[currency].autoConvertTo.rate` (both tiers = 100).

## State Version History

| Version | Changes |
|---------|---------|
| 1 | Initial state shape |
| 2 | Added `spinCount` |
| 3 | Added `settings: PlayerSettings`, `gameLog: SpinLogEntry[]` |
