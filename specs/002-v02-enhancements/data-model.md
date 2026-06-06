# Data Model: Slot Machine RPG v0.2 Enhancements

## Changed Entities

### GameState (extended)

`src/game/types.ts`

```ts
interface GameState {
  version: number          // bump to 2 for migration
  reel: Reel
  currencies: Currencies
  phase: GamePhase
  lastSpinResult: SpinResult | null
  spinCount: number        // NEW: total spins performed this game
}
```

**Validation**: `spinCount` ≥ 0; initialized to 0; incremented by exactly 1 per SPIN action.

**State transition**: `SPIN` action → `spinCount++` (alongside existing currency math). `HARD_RESET` → `spinCount = 0`.

**Persistence**: included in the existing localStorage serialization — no special handling needed. Version bump to `2` triggers migration for saved states lacking `spinCount` (default to `0`).

### CURRENCY_ORDER (reordered)

`src/game/currencyRegistry.ts`

```ts
// Before
export const CURRENCY_ORDER = ['food', 'copper', 'silver', 'gold', 'crowns']

// After
export const CURRENCY_ORDER = ['food', 'gold', 'silver', 'copper', 'crowns']
```

No schema change — purely a display-order change. `applyAutoConversions` in reducer iterates this order; the copper→silver→gold conversion chain still works correctly because auto-conversion reads `autoConvertTo` on each definition, not positional order.

### Initial Reel Composition

`src/game/initialState.ts`

```ts
// Before: 3 blank, 1 apple, 1 copper
// After:  2 blank, 1 apple, 1 copper
reel: {
  icons: [
    { id: stableId('blank'),  definitionId: 'blank'  },
    { id: stableId('blank'),  definitionId: 'blank'  },
    { id: stableId('apple'),  definitionId: 'apple'  },
    { id: stableId('copper'), definitionId: 'copper' },
  ],
}
```

## New UI State (App.tsx local state)

```ts
type ActiveTab = 'reel' | 'spin' | 'market'

// In App component:
const [activeTab, setActiveTab] = useState<ActiveTab>('spin')
const [spinDone, setSpinDone] = useState(false)   // triggers result modal
```

`spinDone` is set to `true` by `onSpinDone` callback from `SlotGrid`, and reset to `false` when the player dismisses `SpinResultModal`.

## Component Interface Changes

### CurrencyDisplay

```ts
interface Props {
  currencies: Currencies
  spinCount: number        // NEW
}
```

### ReelColumn

```ts
interface Props {
  icons: Icon[]
  reelIcons: Icon[]        // NEW: full reel for random cycling during spin
  spinning: boolean
  colIndex: number
  onDone?: () => void
}
```

`reelIcons` is the player's reel — used to randomly pick display icons during the spinning interval.

### SlotGrid

```ts
interface Props {
  lastSpinResult: SpinResult | null
  reel: Reel               // NEW: passed through to ReelColumn for cycling
  spinning: boolean
  onSpinDone: () => void
}
```

### SpinResultModal (new)

```ts
interface Props {
  result: SpinResult
  onDismiss: () => void
}
```

Renders a fixed overlay listing payouts. Single "Continue" button calls `onDismiss`.
