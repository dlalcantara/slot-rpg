# Data Model: v0.6 Reel Icon Controls, UI Layout & Bug Fixes

## GameState Changes

### New field: `disabledIconIds: string[]`

Stores the `id` values of reel icon instances the player has disabled from spin eligibility.

```ts
// src/game/types.ts
export interface GameState {
  version: number          // bumped 4 → 5
  reel: Reel
  disabledIconIds: string[]  // ← NEW: reel icon instance ids excluded from draw pool
  currencies: Currencies
  phase: GamePhase
  lastSpinResult: SpinResult | null
  spinCount: number
  settings: PlayerSettings
  gameLog: SpinLogEntry[]
  magicGrid: MagicCell[][] | null
  lockedColumns: number[]
  magicCounters: MagicCounters
  masterOfElements: boolean
  pendingMultiplier: SpinMultiplier
}
```

**Invariant**: `reel.icons.length - disabledIconIds.length >= 12` is always enforced at the action level; no UI toggle may reduce enabled count below 12.

**Persistence**: `disabledIconIds` is serialised to localStorage with the rest of `GameState`. Version 4 saves are migrated to version 5 by adding `disabledIconIds: []`.

---

### New action: `TOGGLE_ICON`

```ts
// src/game/types.ts
export type GameAction =
  | ...existing actions...
  | { type: 'TOGGLE_ICON'; iconId: string }
```

**Reducer behaviour**:
- If `iconId` is in `disabledIconIds`: remove it (re-enable).
- If `iconId` is NOT in `disabledIconIds`:
  - Count enabled icons = `reel.icons.length - disabledIconIds.length`.
  - If enabled count ≤ 12: return state unchanged (floor enforced).
  - Otherwise: add `iconId` to `disabledIconIds`.
- Only valid when `phase === 'market'` (cannot change reel composition during a spin or magic phase).

---

## MagicCell: Icon Identity Change

No type change. The fix is behavioural: `iconsToMagicCells` now produces cells with **fresh UUIDs** per cell instead of sharing the reel icon's original `id`. This is transparent to the type system.

```ts
// Corrected iconsToMagicCells (reducer.ts internal helper)
function iconsToMagicCells(icons: Icon[]): MagicCell[] {
  return icons.map((icon) => ({
    icon: { ...icon, id: crypto.randomUUID() },
    valueOverride: null,
  }))
}
```

Each `MagicCell.icon.id` is now unique within the magic grid, preventing override-map collisions when the same reel icon is drawn into multiple cells.

---

## spinLogic: `drawColumn` Signature Change

```ts
// src/game/spinLogic.ts
export function drawColumn(reel: Reel, disabledIconIds: string[] = []): Icon[]
```

Internally filters `reel.icons` to exclude disabled ids before shuffling and drawing:
```ts
const pool = reel.icons.filter((icon) => !disabledIconIds.includes(icon.id))
```

**Guard**: if the filtered pool is empty (should never happen given the 12-icon floor), falls back to `reel.icons`. All call sites in `reducer.ts` must pass `state.disabledIconIds`.

---

## Persistence Migration

```ts
// src/game/persistence.ts
const CURRENT_VERSION = 5

export function loadState(): GameState | null {
  ...
  if (parsed.version === 4) {
    // Migrate v4 → v5: add disabledIconIds
    return { ...(parsed as unknown as GameState), version: 5, disabledIconIds: [] }
  }
  if (parsed.version !== CURRENT_VERSION) return null
  ...
}
```

---

## State Transitions

```
market phase
  └─ TOGGLE_ICON (iconId)
       ├─ enabled_count > 12 → disabledIconIds updated
       └─ enabled_count ≤ 12 → no-op

market phase
  └─ SPIN
       ├─ lockedColumns preserved (not cleared)  ← Bug 5 fix
       ├─ drawColumn(reel, disabledIconIds) for each non-locked column
       └─ iconsToMagicCells with fresh UUIDs   ← Bug 1 fix

spinning phase
  └─ BEGIN_MAGIC_PHASE
       └─ lockedColumns cleared to []           ← previously preserved from SPIN

magic phase
  └─ MAGIC_INCREASE_VALUE (colIdx, rowIdx)
       └─ valueOverride = currentValue + 1      ← Bug 2 fix (was + cost)

magic phase
  └─ CLAIM
       └─ detectMasterOfElements(magicGrid)     ← correct after Bug 1 fix
```

---

## Key Entities (no new entities; changes to existing)

| Entity | Change |
|--------|--------|
| `GameState` | +`disabledIconIds: string[]`; `version` bumped to 5 |
| `GameAction` | +`TOGGLE_ICON` variant |
| `MagicCell.icon.id` | Now a fresh UUID per cell (behavioural, no type change) |
| `drawColumn` | +`disabledIconIds` parameter |
