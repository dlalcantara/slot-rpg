# Research: Version 1.2 Final Release

**Branch**: `012-v12-final-release` | **Date**: 2026-06-28

## Decision Log

### Help Text Architecture

**Decision**: All help text lives in `src/components/HelpModal.tsx` as a `CONTENT` record keyed by topic. Adding `'magic'` as a new topic requires extending the union type on `Props['topic']` and the `CONTENT` record.

**Rationale**: Matches the existing pattern exactly. No new components needed.

**Alternatives considered**: A separate `MagicHelpModal` component — rejected because it duplicates the modal frame and makes maintaining help content harder.

---

### Magic Phase Help Button Placement

**Decision**: Add an `onHelp?: () => void` prop to `MagicPhasePanel`. The panel's header row (`✨ Magic Phase`) becomes a flex container holding the heading and a `❓` button. `App.tsx` passes `() => setHelpTopic('magic')`.

**Rationale**: The help entry point lives inside the panel that owns the magic phase UI, which is consistent with how other tabs expose their `❓` button. Keeps `App.tsx` uncluttered — no new JSX fragment needed outside the panel.

**Alternatives considered**: Adding the `❓` button directly in `App.tsx` next to the CLAIM button — rejected because it separates the button from the panel it describes.

---

### Auto-Claim Double Dispatch

**Decision**: In `handleSpinDone`, after dispatching `BEGIN_MAGIC_PHASE`, dispatch `CLAIM` immediately if `state.settings.autoClaim` is `true`. React 18 automatic batching ensures both actions are processed sequentially by the reducer before any re-render.

**Rationale**: `BEGIN_MAGIC_PHASE` creates `magicGrid` (phase: `spinning` → `magic`). `CLAIM` then consumes that `magicGrid` (phase: `magic` → `market`). Because React 18 batches all `useReducer` dispatches that occur in the same synchronous block, the component re-renders once at the final state — the magic phase UI is never painted.

**Alternatives considered**: A new `AUTO_CLAIM` reducer action that merges both steps — rejected because it duplicates reducer logic and adds complexity for no benefit.

---

### Currency Display Bug Root Cause

**Decision**: Fix by calling `setDisplayedCurrencies(state.currencies)` immediately inside the `state.lastSpinResult` useEffect, before starting the 3-second toast timer.

**Root cause**: `displayedCurrencies` is a separate React state used to freeze the currency display during spin animation. After CLAIM:
1. `setToastResult(state.lastSpinResult)` runs — `toastResult` becomes truthy.
2. The `state.currencies` effect fires, but the guard `if (!spinning && !toastResult)` blocks the update because `toastResult` is now set.
3. `displayedCurrencies` only updates when the 3-second toast timer fires.

With animations disabled, spins happen in rapid succession and players see stale totals until the timer clears. The fix: move the `setDisplayedCurrencies` call to the CLAIM effect, removing the dependency on the toast expiry.

**Rationale**: Minimal change — one line added to the existing effect. The `displayedCurrencies` pattern (freeze display during animation) is preserved; we just no longer delay the update past the toast start.

---

### Reel Tab Grouping Display

**Decision**: Replace the per-icon `sortedIcons.map()` loop in `ReelView.tsx` with iteration over `countByDefId.entries()` (sorted by `definitionId`). Each unique icon type renders once with an absolute-positioned count badge (`top-0 left-0`). The existing multiplier badge (`bottom-0.5 right-0.5`) is preserved. Delete the now-unused `sortedIcons` variable.

**Rationale**: `countByDefId` is already computed in `ReelView` for prestige eligibility. Reusing it avoids any extra computation. The icon-cell's 48×48 px bounding box accommodates both badges (count top-left, multiplier bottom-right) without overflow.

**Alternatives considered**: A separate `qty` label to the right of the icon cell (outside the cell) — rejected because it changes the flex layout and may cause layout issues at 720 px width with many icon types.

---

### Persistence Migration

**Decision**: No version bump. Add a backward-compat patch in `loadState()`:
```typescript
if (!Object.prototype.hasOwnProperty.call(state.settings ?? {}, 'autoClaim')) {
  state.settings = { ...state.settings, autoClaim: false }
}
```

**Rationale**: `autoClaim` defaults to `false`. An existing save without the field would treat it as `undefined` (falsy), which already gives correct behaviour — but being explicit avoids TypeScript narrowing issues. No schema change is required.

---

### No Contracts Required

This is a browser SPA with no external API, CLI, or library interface. The `/contracts/` section is omitted per plan template guidance ("Skip if project is purely internal").
