# Contract: Reducer Actions (v0.5)

Only one new action is introduced. All existing actions (`SPIN`, `BEGIN_MAGIC_PHASE`, `MAGIC_*`,
`CLAIM`, `BUY_ICON`, `HARD_RESET`, `CONTINUE_AFTER_WIN`, `RESTORE_STATE`, `UPDATE_SETTINGS`) keep
their current contracts unchanged.

## `SET_CURRENCY` (new — developer cheat)

```ts
{ type: 'SET_CURRENCY'; currency: CurrencyKey; amount: number }
```

**Purpose**: Directly set a currency balance for development testing / easter egg.

**Preconditions**: none (phase-agnostic).

**Validation**:
- `currency` MUST be a known `CurrencyKey`. Unknown key → state returned unchanged.
- `amount` MUST be a finite number ≥ 0. If `amount` is `NaN`, `±Infinity`, or `< 0` → state returned
  unchanged.
- A non-integer valid `amount` is floored to an integer.

**Effect (on valid input)**:
- `currencies[currency] = floor(amount)`.
- `phase` unchanged; no auto-conversion applied; no win/loss re-evaluation.
- New state persisted via `saveState`.

**Effect (on invalid input)**: returns the input state object unchanged (no persistence side effect
required beyond returning state).

**Test cases (Red→Green)**:
1. `SET_CURRENCY food 500` → `currencies.food === 500`.
2. `SET_CURRENCY air 0` → `currencies.air === 0`.
3. `SET_CURRENCY food -5` → state unchanged.
4. `SET_CURRENCY food NaN` → state unchanged.
5. `SET_CURRENCY food 12.9` → `currencies.food === 12`.
6. `SET_CURRENCY notACurrency 5` → state unchanged.
7. Setting a currency does not change `phase` or other currencies.
