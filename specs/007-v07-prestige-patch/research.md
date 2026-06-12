# Research: v0.7 Prestige Patch

**Branch**: `007-v07-prestige-patch` | **Phase**: 0 | **Plan**: [plan.md](./plan.md)

## Summary

All unknowns are resolvable from the existing codebase. No new runtime dependencies needed. Every decision below documents the approach chosen and why.

---

## Decision 1: `lockedColumns` → `blockedColumns` (state rename)

**Decision**: Rename `GameState.lockedColumns: number[]` to `GameState.blockedColumns: number[]` and change its semantics.

**Old semantics**: Columns locked during the magic phase are *carried forward* to the next spin (SPIN preserves those columns' icons). Cleared at `BEGIN_MAGIC_PHASE`.

**New semantics** (Block Column): Columns blocked during the magic phase are *excluded from the current spin's reward calculation only*. Cleared at `CLAIM`. The next SPIN always draws all 5 columns fresh.

**Rationale**: Lock Column is fully replaced by Block Column; no backward-compatibility needed. Renaming via state version migration (v5 → v6) is cleaner than keeping a dead `lockedColumns` field alongside a new `blockedColumns` field.

**Alternatives considered**: Add new `blockedColumns` field and deprecate `lockedColumns` — rejected because it adds dead state that confuses future readers.

---

## Decision 2: `disabledIconIds` removal

**Decision**: Remove `GameState.disabledIconIds: string[]` and the `TOGGLE_ICON` action entirely.

**Rationale**: The Reel tab's enable/disable feature is explicitly removed in the spec. The field is orphaned; keeping it wastes memory and complicates migration.

**Migration**: v5 → v6 strips `disabledIconIds` and `lockedColumns`, adds `blockedColumns: []`.

---

## Decision 3: Magic phase color coding placement

**Decision**: Compute the `definitionId → 'green' | 'yellow'` highlight map inside `SlotGrid`, derived from `magicGrid` + `blockedColumns`. Pass it down to each `ReelColumn` as a `highlights: Map<string, 'green' | 'yellow'>` prop.

**Rationale**: `SlotGrid` already has access to both `magicGrid` and `blockedColumns` (via props). It's the natural place to derive display-only computed state without lifting into `App.tsx` or the reducer.

**Algorithm**:
1. For each non-blocked column `i`, collect all unique `definitionId`s present.
2. For each `definitionId`, count how many active (non-blocked) columns contain it: `columnCount`.
3. `activeColumns = 5 - blockedColumns.length`.
4. If `columnCount === activeColumns` → `'green'`; if `columnCount === activeColumns - 1` → `'yellow'`.

`ReelColumn` applies border classes to each cell based on `highlights.get(cell.icon.definitionId)`.

**Alternatives considered**: Compute in reducer and store on state — rejected because it is pure display logic with no game-mechanic side effects.

---

## Decision 4: Toast notification implementation

**Decision**: Implement as React local state in `App.tsx`: `toastResult: SpinResult | null` + `toastTimerRef: React.MutableRefObject<ReturnType<typeof setTimeout> | null>`. On `CLAIM`, set `toastResult` and schedule a 3-second auto-dismiss. If a second claim fires while toast is visible, clear the existing timer and start a new one (natural replacement).

**Rationale**: Minimal surface area — no new component library, no external dependency. A `useEffect` cleanup on unmount handles timer leakage.

**Toast content**: Mirror existing `SpinResultModal` copy ("No match — better luck next time!" / "+N Currency") but rendered as a small fixed bottom-right card, not a blocking overlay.

**Alternatives considered**: New `useToast` hook — overkill for a single use-case in a single component.

---

## Decision 5: Prestige selection UI

**Decision**: Implement the selection UI as local state inside `ReelView.tsx`. A boolean `prestigeSelecting` controls whether the normal reel grid or the prestige icon picker is shown. Selected `definitionId`s are tracked with `Set<string>`. Confirm/Cancel buttons complete or abort the flow.

**Rationale**: Prestige is entirely Reel-tab-scoped. Putting the selection state in `App.tsx` or a separate modal adds unnecessary prop drilling. The prestige action itself (`PRESTIGE`) is dispatched to the reducer from `ReelView` via an existing `onPrestige` callback.

**Alternatives considered**: Separate `PrestigeModal.tsx` overlay — rejected because the Reel tab already has space and a modal adds z-index complexity.

---

## Decision 6: Market purchase limits

**Decision**: Enforce the 3-copy cap at two levels:
1. **UI** (`Market.tsx`): compute `ownedCount = reel.icons.filter(i => i.definitionId === defId).length`. Pass `remainingPurchasable = Math.max(0, 3 - ownedCount)` to `MarketItem`. Disable the buy button when `remainingPurchasable === 0`.
2. **Reducer** (`BUY_ICON` / `tryBuyIcon`): add guard before adding icon to reel: if `countInReel(definitionId) >= 3`, return `state` unchanged.

**Rationale**: Dual enforcement prevents any race condition where a fast click bypasses the UI guard.

---

## Decision 7: Ability cost multiplication

**Decision**: All magic phase ability costs (respin, swap, boost value, block column) are multiplied by `state.pendingMultiplier` in the reducer. `MagicPhasePanel` receives `multiplier: SpinMultiplier` as a new prop and displays the scaled costs.

**Rationale**: `pendingMultiplier` is set at `SPIN` dispatch and never changes during the magic phase (the toggle is locked). Using `pendingMultiplier` rather than `settings.spinMultiplier` keeps the reducer self-consistent even if the toggle were somehow changed.

---

## Decision 8: `calculatePayouts` win condition

**Decision**: Change `calculatePayouts` in `spinLogic.ts` to accept an optional `requiredColumnCount` parameter (defaulting to `columns.length`). The win check becomes `colValues.length < requiredColumnCount` instead of `colValues.length < 5`.

**Caller in CLAIM**: pass `columns.length` (the number of non-blocked columns) as `requiredColumnCount`. This naturally handles the 0-through-4 blocked column cases.

**Rationale**: Hardcoding 5 was already a latent bug for any future game mode with fewer columns. Removing the magic constant makes the function self-describing.

**Alternatives considered**: Filter to only non-blocked columns before passing to `calculatePayouts` — this would also work, but passing the count is more explicit and avoids slicing the array.

---

## Decision 9: Apple catalog rebalance

**Decision**: Update existing catalog entries in-place (no definitionId change):
- `triple-apple`: `valuePerColumn 3 → 2`, `label "3× Apple" → "2× Apple"`. Cost remains `silver: 1`.
- `dozen-apple`: `valuePerColumn 12 → 3`, `label "12× Apple" → "3× Apple"`. Cost remains `gold: 1`.

**Rationale**: Existing saved games with these icons in their reel automatically see the new values — no migration needed, and this is intentional (a game balance change).

---

## Decision 10: `MagicMode` type update

**Decision**: Change `'lock'` to `'block'` in the `MagicMode` union type. Update all references in `SlotGrid`, `MagicPhasePanel`, and `App.tsx`.

**Rationale**: Naming consistency with the renamed action.
