# Research: Version 0.8 — Achievements

## Achievement State Storage

**Decision**: Add `unlockedAchievements: string[]` (typed as `AchievementId[]`) to `GameState`. Persist alongside all other game state in localStorage via the existing `persistence.ts` layer.

**Rationale**: Using the existing persistence mechanism keeps code uniform. A `string[]` is JSON-serialisable without a custom replacer, unlike `Set<AchievementId>`.

**Alternatives considered**:
- Separate `localStorage` key for achievements — rejected; would require a second persistence API and complicate `RESTORE_STATE`.
- `Set<AchievementId>` — rejected; `JSON.stringify(new Set())` produces `{}`, requiring custom replacer/reviver with no benefit.

---

## Achievement Check Placement

**Decision**: Call a pure `checkNewAchievements(prevState, newState, action)` function at the end of the relevant `gameReducer` case branches (`BUY_ICON`, `CLAIM`, `PRESTIGE`). The function returns an array of newly unlocked `AchievementId`s; the reducer appends them to `unlockedAchievements` and (if the "Happily Ever After" condition is now met) adds that too.

App.tsx detects newly unlocked achievements via a `useRef` snapshot of `state.unlockedAchievements` compared in a `useEffect`, then queues dialogs in local component state (`pendingDialogs: AchievementId[]`).

**Rationale**: Pure function is easy to unit-test in isolation. Keeping transient dialog queue in App.tsx avoids polluting game state with UI concerns.

**Alternatives considered**:
- `pendingAchievementDialogs` field in `GameState` — rejected; transient UI state belongs in the component layer.
- Custom middleware/hook around `dispatch` — more indirection, harder to test, no meaningful benefit here.

---

## "Be Water, My Friend" Detection

**Decision**: After `CLAIM`, check:
1. `prevState.magicCounters.swap > 0` — at least one swap occurred this magic phase, AND
2. `rawPayouts` contains entries from ≥ 2 distinct icon families.

**Rationale**: `magicCounters.swap` is already tracked and reset each magic phase. "SPIN rewards from two icons" means the final payout included ≥ 2 distinct families, readable directly from `rawPayouts` in the CLAIM handler.

---

## "WHY!!!" Detection

**Decision**: After `CLAIM`, check:
1. `prevState.blockedColumns.length > 0` — at least one block was applied, AND
2. Sum of `amount` across all payouts from `allIconColumns` (unblocked calculation) > sum from `activeIconColumns` (the actual blocked calculation).

**Rationale**: Both column sets are already computed inside the CLAIM handler. A simple `totalAmount` helper over payout arrays is sufficient.

---

## "Master of Elements" — Old Effect vs New Achievement

**Decision**: Remove `masterOfElements: boolean` from `GameState`. Delete `src/game/masterOfElements.ts`. In `achievements.ts`, add a new check: "at least 1 icon from each of the `air`, `water`, `earth`, `fire` families appears in the spin result columns after the magic phase."

**Rationale**: The old effect required ≥ 3 of each element (MIN_COUNT = 3 in the old file). The new achievement requires ≥ 1. These are different thresholds; a fresh implementation in `achievements.ts` is cleaner than patching the old file.

---

## Win Condition Removal

**Decision**: Set `crowns.winCondition` to `null` in `currencyRegistry.ts`. The `checkPhase` function in `reducer.ts` already short-circuits on `null` gracefully — no code change needed there. The `'win'` `GamePhase`, `CONTINUE_AFTER_WIN` action, and `WinModal` component are retained unchanged for backward compatibility (saved games with `phase: 'win'` still deserialise and display the modal).

**Rationale**: One-line data change. No logic changes to `checkPhase`.

---

## SpinMultiplier Removal

**Decision**: Narrow `SpinMultiplier = 1` (single-member literal). Change `SpinLogEntry.multiplier` from `SpinMultiplier` to `number` so historical log entries with value `10` or `100` remain valid for display. In the persistence migration, clamp loaded `settings.spinMultiplier` to `1` if it holds any other value.

**Rationale**: Historical log entries are read-only display data; preserving their multiplier value requires `number`. The active `settings.spinMultiplier` must be normalised on load so a stale x10/x100 from before this version cannot persist into the new code.

---

## Market Cap Formula Migration

**Decision**: In `reducer.ts`, change the `tryBuyIcon` guard from `if (ownedCount >= 3)` to `if (ownedCount * 2 >= state.reel.icons.length)`. In `Market.tsx`, compute `canBuyMore = ownedCount * 2 < reel.icons.length` per icon. Pass `canBuyMore: boolean` to `MarketItem` (replacing `remainingPurchasable: number`).

**Rationale**: The formula `qty * 2 < reel_size` is the single authoritative check per spec. Passing a boolean simplifies `MarketItem` — there is no fixed cap to count down to, so "N left" display is removed.
