# Phase 1 Data Model: Version 0.5 Visual Fixes

v0.5 introduces **no new GameState fields** and **no schema/version bump** (persistence `version`
stays `4`; existing saves remain valid). The changes are (a) configuration-data edits, (b) one new
reducer action, and (c) a presentational sort rule. Entities below describe the deltas.

## 1. Icon costs (catalog) — changed

`src/game/catalog.ts` — only the `cost` field of three elements changes.

| Icon  | Current cost      | New cost (v0.5)   |
|-------|-------------------|-------------------|
| air   | copper 10         | **copper 1**      |
| water | silver 1          | **copper 1**      |
| earth | silver 10         | **silver 1**      |
| fire  | gold 1            | gold 1 (unchanged)|

All other catalog fields (family, valuePerColumn, effect, label) are unchanged.

## 2. Starting resources (currency registry) — changed

`src/game/currencyRegistry.ts` — only `startingAmount` for two currencies changes.

| Currency | Current start | New start (v0.5) |
|----------|---------------|------------------|
| food     | 100           | 100 (unchanged)  |
| air      | 0             | **10**           |
| water    | 0             | **10**           |
| earth/fire/copper/silver/gold/crowns | unchanged | unchanged |

`buildInitialCurrencies()` already derives the initial balances from `startingAmount`, so no other
code changes are needed for resources.

## 3. Starting deck (initial reel) — changed

`src/game/initialState.ts` — the `reel.icons` array.

| Slot | Current   | New (v0.5)        |
|------|-----------|-------------------|
| 1    | blank     | **air**           |
| 2    | apple     | **water**         |
| 3    | copper    | **apple** (= Food)|
| 4    | air       | **copper**        |

Result: exactly 1 Air, 1 Water, 1 Apple (Food producer), 1 Copper — matching FR-010. Order within the
deck is not user-visible (reel is a draw pool), so any order containing these four is acceptable;
plan uses [air, water, apple, copper].

## 4. Market ordering rule — new (presentational)

`src/components/Market.tsx`. Items keep coming from `ICON_CATALOG` where `cost !== null`, but are
sorted ascending by a normalized price:

```
normalizedPrice(cost) = cost.amount × tierWeight(cost.currency)
tierWeight: copper = 1, silver = 100, gold = 10_000  (mirrors 100:1 auto-convert ratios)
```

Currencies without a tier weight (e.g., food) sort by amount alone after the moneyed tiers, or are
not present among sellable items. Pure display change; no data persisted.

## 5. Cheat action — new

A new `GameAction` variant and reducer case. No new GameState fields.

**Type (added to `GameAction` union in `src/game/types.ts`):**

```ts
| { type: 'SET_CURRENCY'; currency: CurrencyKey; amount: number }
```

**Entity: Cheat input**
- `currency`: one of the existing `CurrencyKey` values.
- `amount`: target balance. Validation: must be a finite number ≥ 0; non-integers are floored;
  invalid (negative / NaN / Infinity) inputs are ignored (state unchanged).

**Reducer effect**: sets `currencies[currency] = normalizedAmount`, persists via `saveState`, and
otherwise leaves state untouched (no phase change, no auto-conversion). The cheat is a raw set, used
for testing.

## State transitions

No new phases or transitions. `SET_CURRENCY` is phase-agnostic (usable anytime) and does not alter
`phase`. The respin animation and lock/click-target work are component-local (React state in
`ReelColumn`/`SlotGrid`) and do not touch `GameState`.

## Validation summary (maps to requirements)

| Rule | Requirement |
|------|-------------|
| air/water cost = copper 1; earth = silver 1 | FR-008 |
| market sorted ascending by normalized price | FR-009 |
| new deck = 1 air, 1 water, 1 apple, 1 copper | FR-010 |
| start = 10 air, 10 water, 100 food | FR-011 |
| SET_CURRENCY sets a balance; ignores invalid input | FR-012, edge case |
| cheat hidden / inert unless triggered | FR-013 |
