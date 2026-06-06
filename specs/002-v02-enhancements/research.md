# Research: Slot Machine RPG v0.2 Enhancements

## Spin Animation Architecture

**Decision**: Use `setInterval` (200 ms) inside `ReelColumn` to cycle display icons while spinning; a single `setTimeout` per column determines when that column stops.

**Rationale**: All columns start simultaneously (no `colIndex * 300` stagger delay). Each column independently manages its stop time. `setInterval` is sufficient for 5 fps icon cycling — no RAF needed at this rate.

**Alternatives considered**: `requestAnimationFrame` loop — unnecessary overhead for a 200 ms update rate; CSS keyframe animation — cannot easily swap discrete icon content on a frame schedule.

**Implementation notes**:
- On `spinning` prop → `true`: clear any existing interval, start a new `setInterval(200ms)` immediately (no delay), pick a random icon from the reel on each tick
- On column stop: clear interval, display the final resolved icon from `lastSpinResult`
- Stop timing: column `i` stops after `1500 + i * 600` ms (columns stagger their *stops*, not their starts), giving columns 0–4 stop times of 1500, 2100, 2700, 3300, 3900 ms

## Spinning Visual State

**Decision**: Apply a distinct background color + blur or brightness filter to a spinning column (e.g., `bg-blue-900 brightness-150 blur-[1px]`), reverting to the default `bg-gray-800` when stopped.

**Rationale**: Opacity reduction alone (current approach) is too subtle and makes a spinning column look like a dimmed stopped column. A color shift + filter makes the spinning state visually obvious.

**Alternatives considered**: CSS `@keyframes` flash — adds complexity; border pulse — too subtle alongside cycling icons.

## Tab Layout

**Decision**: Implement tabs as controlled state in `App.tsx` (`activeTab: 'reel' | 'spin' | 'market'`). Render all three tab panels but toggle `hidden` class to avoid remounting.

**Rationale**: No router needed; state is trivial; keeping panels mounted preserves React state across tab switches without lifting everything to the reducer.

**Alternatives considered**: Conditional rendering (`&&`) — causes component unmount/remount on every switch, resetting local animation state mid-spin.

## Spins Counter

**Decision**: Add `spinCount: number` to `GameState` (persisted to localStorage). Increment in the `SPIN` reducer case alongside existing currency math.

**Rationale**: Persisting the spin count matches the existing persistence pattern; it survives page reload and lets the player compare runs without resetting.

**Alternatives considered**: Local `useState` in `App.tsx` — not persisted, resets on reload, inconsistent with other game state.

## Currency Display Order

**Decision**: Change `CURRENCY_ORDER` in `currencyRegistry.ts` from `['food', 'copper', 'silver', 'gold', 'crowns']` to `['food', 'gold', 'silver', 'copper', 'crowns']`.

**Rationale**: Spec requires Gold > Silver > Copper ordering. Food and Crowns are not reordered relative to each other. `CurrencyDisplay` already iterates `CURRENCY_ORDER`, so this is a one-line change.

## Result Modal

**Decision**: `SpinResultModal` renders as a fixed overlay (not a dialog element) shown when `spinDone && lastSpinResult !== null`. Dismissed by a single "Continue" button that calls `onDismiss`.

**Rationale**: Keeps it simple — no focus trap library needed for a single-button modal in a game context. `onDismiss` clears `spinDone` state in `App.tsx`.

**Content**: List each payout from `lastSpinResult.payouts` (family + amount + currency). If payouts is empty, show "No match — better luck next time."

## Starting Reel

**Decision**: Change `makeInitialState` to: 2 × blank, 1 × apple, 1 × copper (remove one blank, total 4 icons down from 5).

**Rationale**: Spec explicitly states this composition. Fewer starting icons means faster early cycling.
