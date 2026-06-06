# Data Model: Slot Machine RPG — MVP

**Branch**: `001-slot-machine-game` | **Date**: 2026-06-06

## Entities

### IconEffect (discriminated union)

Declarative descriptor of what happens when an icon family aligns across all 5 columns. The reducer interprets this generically — adding a new effect type requires only a new union variant and catalog entry, not a reducer change.

| Variant             | Fields                                      | Meaning                                          |
|---------------------|---------------------------------------------|--------------------------------------------------|
| `add_currency`      | `currency: CurrencyKey, valuePerColumn: number` | Awards `valuePerColumn × product` of that currency |
| `none`              | —                                           | No effect (Blank icon)                           |

`CurrencyKey` = `'food' | 'copper' | 'silver' | 'gold' | 'crowns'`

Future variants (not in MVP, zero reducer changes required to add):
- `multiply_currency` — temporarily multiplies a currency gain
- `add_to_reel` — automatically adds an icon to the reel on alignment
- `remove_food_cost` — negates food cost for a spin

---

### IconDefinition (catalog entry)

The static, source-defined description of an icon type. Lives in `src/game/catalog.ts`. Adding a new icon = adding a new `IconDefinition` object.

| Field        | Type                        | Description                                         |
|--------------|-----------------------------|-----------------------------------------------------|
| `definitionId` | `string`                  | Stable slug (e.g., `'apple-1'`, `'triple-apple'`)   |
| `family`     | `string`                    | Alignment group (e.g., `'apple'`, `'copper'`)       |
| `valuePerColumn` | `number`                | Per-column contribution to the product (Blank = 0)  |
| `label`      | `string`                    | Display text for MVP placeholder                    |
| `effect`     | `IconEffect`                | Declarative payout effect (interpreted by reducer)  |
| `cost`       | `{ currency: CurrencyKey, amount: number } \| null` | Market cost; `null` = not for sale |

**Icon catalog** (MVP, defined in `src/game/catalog.ts`):

| definitionId      | family  | valuePerColumn | label        | effect currency | effect value | cost         |
|-------------------|---------|----------------|--------------|-----------------|--------------|--------------|
| `blank`           | blank   | 0              | `[ ]`        | none            | —            | not for sale |
| `apple`           | apple   | 1              | `Apple`      | food            | 1            | 1 copper     |
| `triple-apple`    | apple   | 3              | `3× Apple`   | food            | 3            | 1 silver     |
| `dozen-apple`     | apple   | 12             | `12× Apple`  | food            | 12           | 1 gold       |
| `copper`          | copper  | 1              | `Copper`     | copper          | 1            | 1 copper     |
| `silver`          | silver  | 1              | `Silver`     | silver          | 1            | 1 silver     |
| `gold`            | gold    | 1              | `Gold`       | gold            | 1            | 1 gold       |
| `crown`           | crown   | 1              | `Crown`      | crowns          | 1            | 10 gold      |

---

### Icon (reel instance)

A specific icon placed in the player's Reel. References a `IconDefinition` by `definitionId`.

| Field          | Type     | Description                                              |
|----------------|----------|----------------------------------------------------------|
| `id`           | `string` | UUID — unique identity of this instance in the reel      |
| `definitionId` | `string` | References the catalog entry; drives all behavior        |

The reel stores instances; the reducer looks up behavior from the catalog at runtime. Serializing only `definitionId` (not the full definition) keeps `localStorage` payloads small and keeps the catalog as the single source of truth.

---

### Reel

The player's personal ordered collection of icons. Shuffled independently per column on each spin.

| Field   | Type     | Description                                        |
|---------|----------|----------------------------------------------------|
| `icons` | `Icon[]` | All icons in the player's reel (order persisted)   |

**Initial state**: 5 `Icon` instances: 3 × `definitionId: 'blank'`, 1 × `definitionId: 'apple'`, 1 × `definitionId: 'copper'`.

**Invariant**: Reel must always have ≥ 1 icon. (Satisfied trivially by initial state and market-only additions.)

---

### CurrencyDefinition (registry entry)

The static description of a currency type. Lives in `src/game/currencyRegistry.ts`. Adding a new currency = adding one `CurrencyDefinition` object; no reducer changes required.

| Field              | Type                                                          | Description                                                    |
|--------------------|---------------------------------------------------------------|----------------------------------------------------------------|
| `key`              | `string`                                                      | Stable identifier (e.g., `'copper'`, `'food'`)                |
| `label`            | `string`                                                      | Display name                                                   |
| `startingAmount`   | `number`                                                      | Balance at game start / hard reset                             |
| `autoConvertTo`    | `{ currency: string, threshold: number, rate: number } \| null` | Triggers upward auto-conversion when balance ≥ threshold. `rate` units of this currency → 1 unit of `currency`. |
| `convertibleFrom`  | `{ currency: string, rate: number } \| null`                 | Allows downward on-demand conversion during a purchase. 1 unit of `currency` → `rate` units of this currency. |
| `winCondition`     | `{ threshold: number } \| null`                              | Player wins when this currency reaches `threshold`. `null` = no win condition. |
| `losCondition`     | `{ threshold: number } \| null`                              | Game over when this currency reaches `threshold` after a spin. `null` = no loss condition. |

**Currency registry** (MVP, defined in `src/game/currencyRegistry.ts`):

| key     | startingAmount | autoConvertTo (threshold→currency, rate) | convertibleFrom (currency, rate) | winCondition | lossCondition |
|---------|---------------|------------------------------------------|----------------------------------|--------------|---------------|
| food    | 100           | none                                     | none                             | none         | reaches 0     |
| copper  | 0             | silver at 100 (100:1)                    | silver, 100 per silver           | none         | none          |
| silver  | 0             | gold at 100 (100:1)                      | gold, 100 per gold               | none         | none          |
| gold    | 0             | none                                     | none                             | none         | none          |
| crowns  | 0             | none                                     | none                             | reaches 100  | none          |

**Upward auto-conversion** (applied after every spin payout, in registry order):
- Each currency with `autoConvertTo` defined: if `balance >= threshold`, convert floor batches upward.

**Downward on-demand conversion** (applied during a purchase when direct balance is insufficient):
- If player lacks enough of the cost currency, walk up the `convertibleFrom` chain (copper→silver→gold), converting the minimum number of whole units needed to cover the shortfall.
- Conversions are applied from the nearest sufficient tier first.
- If no tier in the chain has enough to cover the shortfall, the purchase is rejected.

---

### Currencies (runtime balance map)

A plain `Record<string, number>` keyed by `CurrencyDefinition.key`. No fixed fields — all currencies in the registry are present.

```
{ food: 100, copper: 0, silver: 0, gold: 0, crowns: 0 }   ← MVP initial state
```

Adding a new currency requires only: (1) a new `CurrencyDefinition` in the registry, (2) a starting balance in `INITIAL_STATE`.

---

### SpinResult

Transient — computed per spin, not persisted.

| Field     | Type                      | Description                                       |
|-----------|---------------------------|---------------------------------------------------|
| `columns` | `Icon[][]` (5 × 3)        | The 3 icon instances shown in each of the 5 columns |
| `payouts` | `Payout[]`                | List of currency awards resolved from this spin   |

### Payout

| Field      | Type     | Description                                                   |
|------------|----------|---------------------------------------------------------------|
| `family`   | `string` | Which icon family aligned (matches `IconDefinition.family`)   |
| `amount`   | `number` | Product of per-column value counts                            |
| `currency` | `string` | Which currency key is updated (from `IconEffect.currency`)    |

The payout → currency mapping is driven entirely by the `IconEffect` on each `IconDefinition`. No hardcoded family→currency table in the reducer.

---

### GameState

The single serialized object written to `localStorage` after every mutation.

| Field           | Type                                      | Description                                        |
|-----------------|-------------------------------------------|----------------------------------------------------|
| `version`       | `number`                                  | Schema version for future migration (starts at 1)  |
| `reel`          | `Reel`                                    | Player's current reel                              |
| `currencies`    | `Record<string, number>`                  | All currency balances, keyed by `CurrencyDefinition.key` |
| `phase`         | `'market' \| 'spinning' \| 'gameover' \| 'win'` | Current UI phase                            |
| `lastSpinResult`| `SpinResult \| null`                      | Result of the most recent spin (for display)       |

**localStorage key**: `slot-rpg-state`

---

## State Transitions

```
                   ┌─────────────────────────────────────────┐
                   │                                         │
              [page load]                              [buy icon]
                   │                                         │
                   ▼                                         │
    ┌──────────────────────────┐                             │
    │  phase: 'market'         │◄────────────────────────────┘
    │  (Market visible,        │
    │   SPIN button enabled)   │
    └──────────────┬───────────┘
                   │ [SPIN]
                   ▼
    ┌──────────────────────────┐
    │  phase: 'spinning'       │  (≈5 s animation, no input accepted)
    └──────────────┬───────────┘
                   │ [animation complete]
                   │
          ┌────────┴────────────────────────┐
          │                                 │
     [food > 0]                        [food == 0]
     [crowns < 100]                         │
          │                                 ▼
          │                    ┌────────────────────────┐
          │                    │  phase: 'gameover'     │
          │                    │  (reset CTA shown)     │
          │                    └────────────┬───────────┘
          │                                 │ [hard reset]
          │                                 ▼
          │                    ┌────────────────────────┐
          ▼                    │  phase: 'market'       │
    ┌──────────────────────────┤  (initial state)       │
    │  phase: 'market'         └────────────────────────┘
    │  (after spin, market
    │   open for purchases)    │ [crowns >= 100 after spin]
    └──────────────────────────┘          │
                   ▲                      ▼
                   │         ┌────────────────────────┐
                   │         │  phase: 'win'          │
                   │         │  (WIN modal shown)     │
                   └─────────┤  continue or reset     │
                  [continue] └────────────────────────┘
```

**Hard Reset** is valid from any phase and always transitions to `phase: 'market'` with `INITIAL_STATE`.

---

## Validation Rules

| Rule | Enforcement point |
|------|-------------------|
| Reel must have ≥ 1 icon | Enforced by initial state; market only adds, never removes |
| Food ≥ 0 | Game-over check runs after each spin; food cannot go below 0 |
| Market purchase requires sufficient funds in cost currency or convertible tiers | Reducer attempts downward conversion before rejecting |
| Spin not allowed during `phase: 'spinning'` | SPIN action is a no-op if `phase !== 'market'` |
| Currency values are non-negative integers | Enforced by reducer; auto-conversion uses integer arithmetic |
