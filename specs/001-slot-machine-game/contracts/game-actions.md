# Game Action Contracts

**Branch**: `001-slot-machine-game` | **Date**: 2026-06-06

These contracts define every action the player can trigger and the guaranteed state transitions the game must produce. They serve as the behavioral specification for the reducer and as the basis for integration tests.

---

## Action: SPIN

**Preconditions**:
- `phase === 'market'`
- `currencies.food > 0`

**Effect**:
1. Deduct 1 from `currencies.food`.
2. For each of the 5 columns: shuffle a copy of `reel.icons`; pick a random start offset; extract 3 consecutive icons (wrap-around).
3. For each icon `family` that appears in all 5 columns: compute `amount = product of (sum of values of that family in each column)`. Add to `payouts`.
4. Apply all payouts to `currencies`.
5. Run upward auto-conversion for all currencies that define `autoConvertTo` (in registry order).
6. Check all currencies with a `lossCondition` — if any are met → `phase = 'gameover'`.
7. Else check all currencies with a `winCondition` — if any are met → `phase = 'win'`.
8. Else → `phase = 'market'`.
9. Set `lastSpinResult`.
10. Persist `GameState` to localStorage.

**Postconditions**:
- `currencies.food` is exactly 1 less than before (floored at 0 by game-over).
- All payout amounts are non-negative integers.
- `phase` is `'gameover'`, `'win'`, or `'market'`.

---

## Action: BUY_ICON

**Payload**: `{ iconDefinitionId: string }` — references the static icon catalog entry.

**Preconditions**:
- `phase === 'market'`
- Player can cover the cost either directly or via downward conversion (see effect step 1).

**Effect**:
1. **Resolve payment** using the cost currency (`costCurrency`, `costAmount`):
   a. If `currencies[costCurrency] >= costAmount`: deduct directly. Done.
   b. Else: compute shortfall = `costAmount - currencies[costCurrency]`.
      Walk up the `convertibleFrom` chain defined in the currency registry:
      - Find the nearest ancestor currency with a sufficient balance.
      - Convert the minimum whole units needed: `unitsToConvert = ceil(shortfall / rate)`.
      - Deduct `unitsToConvert` from the ancestor currency; add `unitsToConvert × rate` to `costCurrency`.
      - Then deduct `costAmount` from `costCurrency`.
      - If no ancestor has sufficient balance: **reject** (see below).
2. Append a new `Icon` instance (new UUID, `definitionId` matching the purchased icon) to `reel.icons`.
3. Persist `GameState` to localStorage.

**Conversion example**:
- Cost: 1 copper. Player has: 0 copper, 1 silver.
- Shortfall: 1 copper. `convertibleFrom` for copper: silver at rate 100.
- Units to convert: ceil(1 / 100) = 1 silver.
- Deduct 1 silver → add 100 copper. Then deduct 1 copper.
- Result: 99 copper, 0 silver.

**Postconditions**:
- `reel.icons.length` is exactly 1 greater than before.
- The net cost in purchasing power is exactly `costAmount` units of `costCurrency`.
- Conversion overshoot (e.g., 99 copper remainder) stays in the player's balance.
- No `lastSpinResult` change.

**Rejection** (insufficient funds across all convertible tiers):
- State is unchanged.
- UI MUST display a disabled state on the buy button when the player cannot afford the item even after all possible conversions.

---

## Action: HARD_RESET

**Payload**: none

**Preconditions**: none (valid from any phase)

**Effect**:
1. Replace entire `GameState` with `INITIAL_STATE`:
   - `reel.icons`: `[Blank, Blank, Blank, Apple(1), Copper(1)]`
   - `currencies`: all currency keys from the registry at their `startingAmount` (MVP: `{ food: 100, copper: 0, silver: 0, gold: 0, crowns: 0 }`)
   - `phase`: `'market'`
   - `lastSpinResult`: `null`
   - `version`: current schema version
2. Write `INITIAL_STATE` to localStorage (overwriting any previous save).

**Postconditions**:
- All state fields match `INITIAL_STATE` exactly.
- localStorage contains the serialized `INITIAL_STATE`.

---

## Action: CONTINUE_AFTER_WIN

**Payload**: none

**Preconditions**: `phase === 'win'`

**Effect**:
1. `phase = 'market'`
2. No other state changes. Crowns remain ≥ 100. Player may keep playing.
3. Persist updated `GameState`.

**Postconditions**:
- `phase === 'market'`
- All currency balances and reel unchanged.

---

## Action: RESTORE_STATE

**Payload**: `{ savedState: GameState }`

**Preconditions**: called only on initial page load, before any user interaction.

**Effect**:
1. If `savedState.version` matches current schema version: replace in-memory state with `savedState`.
2. If version mismatch or parse error: discard saved state, use `INITIAL_STATE`, overwrite localStorage.

**Postconditions**:
- In-memory state matches either `savedState` or `INITIAL_STATE`.
- localStorage is consistent with in-memory state.

---

## UI Contract: Spin Disablement

The SPIN button MUST be visually disabled (non-interactive) whenever:
- `phase !== 'market'`
- Any currency with a `lossCondition` of `{ threshold: 0 }` is already at 0 (i.e., the game would immediately end — currently Food)

The SPIN button MUST be re-enabled as soon as `phase` returns to `'market'` and no loss condition is already met.

## UI Contract: Market Availability

The Market panel MUST be visible and interactive when `phase === 'market'`.
The Market panel MUST be hidden or non-interactive when `phase === 'spinning'`, `'gameover'`, or `'win'`.

## UI Contract: Game-Over Screen

The game-over screen MUST:
- Be shown when `phase === 'gameover'`.
- Display a message conveying loss (Food ran out).
- Display a prominent "Reset & Play Again" button that dispatches `HARD_RESET`.
- NOT show the Market or SPIN button.

## UI Contract: WIN Modal

The WIN modal MUST:
- Appear as an overlay when `phase === 'win'`.
- Offer "Continue Playing" (dispatches `CONTINUE_AFTER_WIN`) and optionally "Reset" (dispatches `HARD_RESET`).
- Not block access to the market after the player chooses "Continue Playing".
