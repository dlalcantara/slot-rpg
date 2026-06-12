# Data Model: v0.7 Prestige Patch

**Branch**: `007-v07-prestige-patch` | **Plan**: [plan.md](./plan.md)

## State Version Bump: 5 → 6

### `GameState` diff

| Field | v5 | v6 | Notes |
|-------|----|----|-------|
| `version` | `5` | `6` | Bumped for migration |
| `lockedColumns: number[]` | ✅ present | ❌ removed | Replaced by `blockedColumns` |
| `disabledIconIds: string[]` | ✅ present | ❌ removed | Enable/disable feature removed |
| `blockedColumns: number[]` | ❌ absent | ✅ added | Block Column ability state; resets on CLAIM |

### Migration: v5 → v6

```ts
if (parsed.version === 5) {
  const { disabledIconIds, lockedColumns, ...rest } = parsed as GameState & {
    disabledIconIds: string[]
    lockedColumns: number[]
  }
  void disabledIconIds
  void lockedColumns
  return { ...rest, version: 6, blockedColumns: [] }
}
```

---

## `GameAction` Union Changes

### Removed actions
- `{ type: 'TOGGLE_ICON'; iconId: string }` — enable/disable removed
- `{ type: 'MAGIC_LOCK'; colIdx: number }` — lock column removed

### Changed actions
- `MagicMode` type: `'lock'` → `'block'`

### Added actions
```ts
| { type: 'MAGIC_BLOCK_COLUMN'; colIdx: number }
| { type: 'PRESTIGE'; keepDefinitionIds: string[] }
```

---

## Icon Catalog Changes (`src/game/catalog.ts`)

| definitionId | Field | Before | After |
|-------------|-------|--------|-------|
| `triple-apple` | `valuePerColumn` | `3` | `2` |
| `triple-apple` | `label` | `"3× Apple"` | `"2× Apple"` |
| `dozen-apple` | `valuePerColumn` | `12` | `3` |
| `dozen-apple` | `label` | `"12× Apple"` | `"3× Apple"` |

Cost unchanged for both entries.

---

## Currency Registry Changes (`src/game/currencyRegistry.ts`)

| Currency | Field | Before | After |
|----------|-------|--------|-------|
| `food` | `startingAmount` | `100` | `10` |

---

## Prestige Reset State

When `PRESTIGE` is dispatched with `keepDefinitionIds`, the resulting state is:

```ts
{
  ...state,
  reel: {
    icons: keepDefinitionIds.map((defId) => ({ id: crypto.randomUUID(), definitionId: defId }))
  },
  currencies: PRESTIGE_STARTING_CURRENCIES,  // food:10, air:10, water:10, all others:0
  // spinCount: retained (NOT reset)
  // phase: 'market'
  // magicGrid: null, blockedColumns: [], magicCounters reset
}
```

`PRESTIGE_STARTING_CURRENCIES` is a constant shared with `makeInitialState()`.

---

## `calculatePayouts` Signature Change

```ts
// Before
export function calculatePayouts(columns: Icon[][], overrides?: Map<string, number>): Payout[]

// After
export function calculatePayouts(
  columns: Icon[][],
  overrides?: Map<string, number>,
  requiredColumnCount?: number   // defaults to columns.length
): Payout[]
```

Win check inside: `colValues.length < (requiredColumnCount ?? columns.length)` replaces `colValues.length < 5`.

---

## Derived Display State: Magic Phase Highlights

Computed in `SlotGrid` (not stored in `GameState`):

```ts
type HighlightColor = 'green' | 'yellow'
type HighlightMap = Map<string, HighlightColor>  // keyed by definitionId
```

Algorithm:
1. Collect active columns = `magicGrid.filter((_, i) => !blockedColumns.includes(i))`.
2. For each `definitionId` (excluding `'blank'`), count how many active columns contain it.
3. `activeCount = 5 - blockedColumns.length`.
4. `count === activeCount` → `'green'`; `count === activeCount - 1` → `'yellow'`.

Passed as a prop to `ReelColumn`, which applies border CSS to each cell.
