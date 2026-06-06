# Data Model: Magic Elements (v0.4)

**Date**: 2026-06-07 | **Branch**: `004-magic-elements`

---

## Changed / Extended Types (`src/game/types.ts`)

### `CurrencyKey` — extend union

```
Before: 'food' | 'copper' | 'silver' | 'gold' | 'crowns'
After:  'food' | 'copper' | 'silver' | 'gold' | 'crowns' | 'air' | 'water' | 'earth' | 'fire'
```

### `GamePhase` — extend union

```
Before: 'market' | 'spinning' | 'gameover' | 'win'
After:  'market' | 'spinning' | 'magic' | 'gameover' | 'win'
```

Phase transitions:
- `market` → `spinning` : SPIN action
- `spinning` → `magic`  : BEGIN_MAGIC_PHASE action (fired by SlotGrid onSpinDone callback)
- `magic` → `market`    : CLAIM action (or `gameover` / `win` if conditions met)

### `MagicCell` — new

```typescript
interface MagicCell {
  icon: Icon
  valueOverride: number | null  // null = use icon definition's valuePerColumn
}
```

### `MagicCounters` — new

```typescript
interface MagicCounters {
  respin: number       // number of respins performed this magic phase
  swap: number         // number of swaps performed this magic phase
  increaseValue: number // number of increase-value actions this magic phase
}
```

### `GameState` — new fields

```typescript
interface GameState {
  // ... existing fields unchanged ...
  version: number       // bumped 3 → 4

  // Magic Phase state
  magicGrid: MagicCell[][] | null   // 5 columns × 3 rows; null when not in magic phase
  lockedColumns: number[]           // indices 0–4; cleared on SPIN
  magicCounters: MagicCounters      // reset to zeros on BEGIN_MAGIC_PHASE
  masterOfElements: boolean         // set true on CLAIM if condition met; never resets to false
}
```

### `GameAction` — new actions

```typescript
type GameAction =
  | { type: 'SPIN'; multiplier: SpinMultiplier }
  | { type: 'BEGIN_MAGIC_PHASE' }
  | { type: 'MAGIC_RESPIN'; colIdx: number }
  | { type: 'MAGIC_SWAP'; fromCol: number; fromRow: number; toCol: number; toRow: number }
  | { type: 'MAGIC_LOCK'; colIdx: number }
  | { type: 'MAGIC_INCREASE_VALUE'; colIdx: number; rowIdx: number }
  | { type: 'CLAIM' }
  | { type: 'BUY_ICON'; iconDefinitionId: string }
  | { type: 'HARD_RESET' }
  | { type: 'CONTINUE_AFTER_WIN' }
  | { type: 'RESTORE_STATE'; savedState: GameState }
  | { type: 'UPDATE_SETTINGS'; patch: Partial<PlayerSettings> }
```

---

## New Catalog Entries (`src/game/catalog.ts`)

| definitionId | family  | label   | valuePerColumn | effect                              | cost                       |
|--------------|---------|---------|---------------|-------------------------------------|----------------------------|
| `air`        | `air`   | `Air`   | 1             | `add_currency` → `air`, 1/col       | copper × 10                |
| `water`      | `water` | `Water` | 1             | `add_currency` → `water`, 1/col     | silver × 1                 |
| `earth`      | `earth` | `Earth` | 1             | `add_currency` → `earth`, 1/col     | silver × 10                |
| `fire`       | `fire`  | `Fire`  | 1             | `add_currency` → `fire`, 1/col      | gold × 1                   |

---

## New Currency Registry Entries (`src/game/currencyRegistry.ts`)

| key     | label   | startingAmount | autoConvertTo | convertibleFrom | winCondition | lossCondition |
|---------|---------|---------------|---------------|-----------------|--------------|---------------|
| `air`   | `Air`   | 0             | null          | null            | null         | null          |
| `water` | `Water` | 0             | null          | null            | null         | null          |
| `earth` | `Earth` | 0             | null          | null            | null         | null          |
| `fire`  | `Fire`  | 0             | null          | null            | null         | null          |

`CURRENCY_ORDER` updated to include elemental currencies after `crowns`.

---

## Starting Reel (`src/game/initialState.ts`)

```
Before: [blank, blank, apple, copper]
After:  [blank, apple, copper, air]
```

`version` bumped `3 → 4`.

---

## Magic Cost Rules (encoded in reducer, not types)

| Action         | Currency | Cost formula                                              | Counter used        |
|----------------|----------|-----------------------------------------------------------|---------------------|
| Respin column  | Air      | `magicCounters.respin + 1` Air per use                   | `respin`            |
| Swap cells     | Water    | `magicCounters.swap + 1` Water per use                   | `swap`              |
| Lock column    | Earth    | `lockedColumns.length + 1` Earth per use (max 3 locks)   | none (uses length)  |
| Increase value | Fire     | `magicCounters.increaseValue + 1` Fire per use           | `increaseValue`     |

---

## Payout Computation Change (`src/game/spinLogic.ts`)

`calculatePayouts` signature unchanged. At CLAIM time, `magicGrid` is projected to `Icon[][]`
by applying `valueOverride`:

```typescript
// pseudo-code projection before calling calculatePayouts
const effectiveColumns: Icon[][] = magicGrid.map(col =>
  col.map(cell => ({
    ...cell.icon,
    // valueOverride applied via a wrapper — see contracts/calculatePayoutsWithOverrides
  }))
)
```

Because `calculatePayouts` reads `ICON_CATALOG[icon.definitionId].valuePerColumn`, the
projection must produce temporary icon definitions or the function must accept an override map.
**Chosen approach**: pass an optional `overrides: Map<string, number>` keyed by `icon.id` to
`calculatePayouts`, defaulting to the catalog value when no override exists.

---

## Notable Result Update (`src/game/notableResult.ts`)

```typescript
// Combined money value
function combinedMoney(c: Currencies): number {
  return 10000 * (c.gold ?? 0) + 100 * (c.silver ?? 0) + (c.copper ?? 0)
}

// New logic:
// 1. Treat copper, silver, gold as a group — compare combinedMoney delta vs prev
// 2. All other currencies (food, crowns, air, water, earth, fire) — per-key logic (unchanged)
```

---

## Increase Card Value Mechanics

The Nth invocation of `MAGIC_INCREASE_VALUE` this Magic Phase (N = `magicCounters.increaseValue + 1` before the action) adds N to the target cell's effective value:

```
effectiveValue = (valueOverride ?? base valuePerColumn) + N
```

Examples:
| Icon          | Base value | After 1st use (N=1) | After 2nd use anywhere (N=2) on same cell |
|---------------|-----------|---------------------|------------------------------------------|
| Air           | 1         | 2                   | 4                                        |
| Apple         | 1         | 2                   | 4                                        |
| Triple Apple  | 3         | 4                   | 6                                        |
| Dozen Apple   | 12        | 13                  | 15                                       |

The counter is global for the phase — if the 1st use targets cell A (adds 1) and the 2nd use
targets cell B (adds 2), the counter is at 2 before a 3rd use (which would add 3 to any cell).

## Master of Elements (`src/game/masterOfElements.ts`)

```typescript
export function detectMasterOfElements(grid: MagicCell[][]): boolean
// Returns true iff count of air icons ≥ 3 AND water ≥ 3 AND earth ≥ 3 AND fire ≥ 3
// across all cells in all columns
```

`GameState.masterOfElements` is set to `true` by CLAIM if condition met; never set back
to `false` (player can continue playing after the notification).
