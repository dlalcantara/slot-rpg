# Implementation Plan: v0.6 Reel Icon Controls, UI Layout & Bug Fixes

**Branch**: `006-v06-reel-icon-fixes` | **Date**: 2026-06-12 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/006-v06-reel-icon-fixes/spec.md`

## Summary

v0.6 adds one new feature (per-icon enable/disable toggles in the Reels tab with a 12-icon minimum), one UI layout fix (CLAIM occupies the same screen position as SPIN to minimise mouse movement), and six bug fixes: Boost Value cross-column contamination caused by shared `icon.id` references in the magic grid; Boost Value increment accumulating incorrectly (+N instead of +1); Master of Elements not triggering (caused by the icon-id contamination); Air Spin animation growing the column by mapping over the reel pool instead of the column; locked columns animating on the next spin because `SPIN` cleared `lockedColumns` too early; lock indicator offsetting the column layout by appearing above icons; and currency conversion not handling multi-level denomination gaps (0 copper + 0 silver + gold cannot buy a copper item). The fixes are confined to `reducer.ts`, `spinLogic.ts`, `ReelColumn.tsx`, `ReelView.tsx`, and `App.tsx`, plus new test coverage in the existing suite. A state `version` bump (4 → 5) with a backward-compatible migration covers the new `disabledIconIds` field.

## Technical Context

**Language/Version**: TypeScript 5.6 (strict mode) + React 18.3

**Primary Dependencies**: Vite 6, Tailwind CSS 3, Vitest 2, @testing-library/react 16 (no new runtime dependencies)

**Storage**: `localStorage` via `src/game/persistence.ts`; state serialised as JSON. `version` bumped 4 → 5 with in-place v4 → v5 migration (adds `disabledIconIds: []` to existing saves).

**Testing**: Vitest + @testing-library/react + user-event; jsdom environment. Existing suites: `tests/unit/*`, `tests/integration/*`.

**Target Platform**: Browser (GitHub Pages); mobile-first at 720 × 1280 px.

**Project Type**: Single-page React application; single `src/` tree.

**Performance Goals**: Spin computation ≤ 16 ms; bundle ≤ 250 KB gzipped; page load ≤ 3 s on Slow 3G. No new dependencies added.

**Constraints**: No new runtime dependencies; all changes extend existing patterns. Icon slots keep their 48 × 48 px bounding boxes. `disabledIconIds` filter adds one `Array.filter` call per spin — negligible for reel sizes of < 50 icons.

**Scale/Scope**: Single-player browser game; all state in memory + localStorage. ~8 source files touched plus tests.

## Root-Cause Notes

Full analysis in [research.md](./research.md). Condensed:

- **Bug 1 (cross-column boost)**: `drawColumn` returns references to reel `Icon` objects. Duplicate appearances share `icon.id`, so `buildOverridesMap` spreads a single boost override across all cells with that id. Fix: clone each icon with a fresh UUID in `iconsToMagicCells`.
- **Bug 2 (wrong increment)**: `valueOverride: currentValue + cost` — `cost` is the escalating fire cost, not 1. Fix: use `currentValue + 1`.
- **Bug 3 (MoE)**: Downstream of Bug 1; grid state is unreliable with shared ids. Resolved by Bug 1 fix.
- **Bug 4 (Air Spin height)**: Respin animation maps over `pool` (full reel) instead of `icons` (column). Fix: `icons.map(() => pool[...])`.
- **Bug 5 (locked animate)**: `SPIN` clears `lockedColumns: []` before the animation fires. Fix: keep `lockedColumns` in SPIN, clear only in `BEGIN_MAGIC_PHASE`.
- **Bug 6 (lock layout)**: Lock indicator is first flex child, pushing icons down on locked columns only. Fix: move indicator below icons inside a fixed-height wrapper present on all columns.
- **Bug 7 (currency)**: `tryBuyIcon` only does one level of `convertibleFrom` lookup. Fix: walk the chain a second level (gold → silver → copper).
- **Enhancement 1 (icon toggles)**: Add `disabledIconIds: string[]` to `GameState`; `TOGGLE_ICON` action; filter pool in `drawColumn`.
- **Enhancement 2 (SPIN/CLAIM position)**: Always render `SpinControls`; during magic phase, render CLAIM immediately below `SpinControls` (SPIN slot), then `MagicPhasePanel` below CLAIM.

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

- [x] **I. Code Quality** — TypeScript strict mode already enabled; no `any` planned. All new types are fully typed (`TOGGLE_ICON`, `disabledIconIds`). Functions remain < 40 lines; `tryBuyIcon` refactor stays within limit.
- [x] **II. Test-First** — Unit tests written first for: `TOGGLE_ICON` (enable/disable, 12-icon floor), `MAGIC_INCREASE_VALUE` increment fix, `SPIN` lock-preservation, `tryBuyIcon` multi-level conversion. Integration test for Boost Value + MoE path. Component test for `ReelColumn` respin height.
- [x] **III. UX Consistency** — 720 × 1280 px verified at plan time: SPIN/CLAIM same anchor point; lock indicator fixed-height wrapper (h-6) below icons applies to all columns equally; icon toggle buttons in `ReelView` use existing `icon-cell` sizing.
- [x] **IV. Performance** — No new dependencies; `Array.filter` for disabled icons is O(n) with n < 50; respin animation fix removes a hot-path per-frame allocation; no new timers.
- [x] **V. Build Pipeline** — No changes to CI config. Existing gates: `tsc --noEmit → lint → unit → integration → build → bundle size`.

## Project Structure

### Documentation (this feature)

```text
specs/006-v06-reel-icon-fixes/
├── plan.md              # This file
├── research.md          # Root-cause analysis and design decisions
├── data-model.md        # GameState changes, new action, migration
├── checklists/
│   └── requirements.md
└── tasks.md             # Generated by /speckit-tasks
```

### Source Code (repository root)

```text
src/
├── App.tsx                        # SPIN/CLAIM layout fix; pass disabledIconIds; dispatch TOGGLE_ICON
├── components/
│   ├── ReelColumn.tsx             # Air Spin height fix; lock indicator placement fix
│   └── ReelView.tsx               # Icon enable/disable toggle UI
└── game/
    ├── types.ts                   # +disabledIconIds on GameState; +TOGGLE_ICON action
    ├── initialState.ts            # +disabledIconIds: []; version 4→5
    ├── persistence.ts             # CURRENT_VERSION 5; v4→v5 migration
    ├── reducer.ts                 # All bug fixes + TOGGLE_ICON handler
    └── spinLogic.ts               # drawColumn accepts disabledIconIds param

tests/
├── unit/
│   ├── reducer.test.ts            # TOGGLE_ICON, MAGIC_INCREASE_VALUE, SPIN lock, tryBuyIcon
│   └── spinLogic.test.ts          # drawColumn excludes disabled ids
└── integration/
    └── magicPhase.test.tsx        # Boost Value + MoE scenario
```

**Structure Decision**: Single-project, existing layout. No new directories. No new dependencies.

## Detailed Change Specifications

### 1. `src/game/types.ts`

Add `disabledIconIds: string[]` to `GameState` interface.

Add to `GameAction` union:
```ts
| { type: 'TOGGLE_ICON'; iconId: string }
```

### 2. `src/game/initialState.ts`

Add `disabledIconIds: []` to the object returned by `makeInitialState()`. Bump `version: 5`.

### 3. `src/game/persistence.ts`

Bump `CURRENT_VERSION = 5`.

In `loadState()`, add v4→v5 migration before the version equality check:
```ts
if (parsed.version === 4) {
  return { ...(parsed as unknown as GameState), version: 5, disabledIconIds: [] }
}
```

### 4. `src/game/spinLogic.ts`

Change `drawColumn` signature:
```ts
export function drawColumn(reel: Reel, disabledIconIds: string[] = []): Icon[]
```

Inside, filter the pool before shuffling:
```ts
const eligible = reel.icons.filter((icon) => !disabledIconIds.includes(icon.id))
const pool = eligible.length > 0 ? eligible : reel.icons  // safety fallback
const shuffled = shuffle(pool)
```

Update `computeSpin` to also accept and forward `disabledIconIds` (used by tests; not called by the reducer).

### 5. `src/game/reducer.ts`

**`iconsToMagicCells`** (Bug 1 + Bug 3):
```ts
function iconsToMagicCells(icons: Icon[]): MagicCell[] {
  return icons.map((icon) => ({
    icon: { ...icon, id: crypto.randomUUID() },
    valueOverride: null,
  }))
}
```

**`SPIN` case** (Bug 5): Remove `lockedColumns: []` from the returned state — keep existing `state.lockedColumns` so that previously locked columns are visible and non-animating during the next spin.

**`SPIN` case** (Enhancement 1): Pass `state.disabledIconIds` to `drawColumn`:
```ts
newColumns.push(drawColumn(state.reel, state.disabledIconIds))
```

**`MAGIC_RESPIN` case** (Enhancement 1): Also pass `state.disabledIconIds` to `drawColumn`.

**`MAGIC_INCREASE_VALUE` case** (Bug 2):
```ts
// was: valueOverride: currentValue + cost
valueOverride: currentValue + 1
```

**`TOGGLE_ICON` case** (Enhancement 1):
```ts
case 'TOGGLE_ICON': {
  if (state.phase !== 'market') return state
  const { iconId } = action
  const isDisabled = state.disabledIconIds.includes(iconId)
  if (isDisabled) {
    // Re-enable
    const newState = {
      ...state,
      disabledIconIds: state.disabledIconIds.filter((id) => id !== iconId),
    }
    saveState(newState)
    return newState
  }
  // Disable: enforce 12-icon floor
  const enabledCount = state.reel.icons.length - state.disabledIconIds.length
  if (enabledCount <= 12) return state
  const newState = { ...state, disabledIconIds: [...state.disabledIconIds, iconId] }
  saveState(newState)
  return newState
}
```

**`tryBuyIcon`** (Bug 7): Refactor the shortfall branch to walk the `convertibleFrom` chain two levels:
```ts
function ensureLiquidity(
  currencies: Currencies,
  currency: string,
  amount: number,
): Currencies | null {
  if ((currencies[currency] ?? 0) >= amount) return currencies

  const def = CURRENCY_REGISTRY[currency]
  if (!def?.convertibleFrom) return null

  const { currency: src, rate } = def.convertibleFrom
  const unitsNeeded = Math.ceil((amount - (currencies[currency] ?? 0)) / rate)

  // Recurse one level to ensure the source currency is available
  const funded = ensureLiquidity(currencies, src, unitsNeeded)
  if (!funded) return null

  return {
    ...funded,
    [src]: funded[src] - unitsNeeded,
    [currency]: (funded[currency] ?? 0) + unitsNeeded * rate,
  }
}

function tryBuyIcon(state: GameState, iconDefinitionId: string): GameState {
  const def = ICON_CATALOG[iconDefinitionId]
  if (!def || !def.cost) return state

  const { currency: costCurrency, amount: costAmount } = def.cost
  const funded = ensureLiquidity({ ...state.currencies }, costCurrency, costAmount)
  if (!funded) return state

  const currencies = { ...funded, [costCurrency]: funded[costCurrency] - costAmount }
  const newIcon = { id: crypto.randomUUID(), definitionId: iconDefinitionId }
  const newState: GameState = {
    ...state,
    currencies,
    reel: { icons: [...state.reel.icons, newIcon] },
  }
  saveState(newState)
  return newState
}
```

### 6. `src/components/ReelColumn.tsx`

**Bug 4 fix** (respin height): In the `respinToken` effect, change:
```ts
// was: pool.map(() => pool[...])
setDisplayIcons(icons.map(() => pool[Math.floor(Math.random() * pool.length)]))
```

**Bug 5 fix** (locked animate): No code change needed in `ReelColumn` — the existing locked guard already short-circuits animation. The fix is in the reducer (SPIN no longer clearing `lockedColumns`).

**Bug 6 fix** (lock indicator below icons): Restructure JSX:

Before (indicator is first child, above icons):
```tsx
{locked && <div ...>🔒 Locked</div>}
{displayIcons.map(...)}
```

After (indicator below icons, fixed-height wrapper on all columns):
```tsx
{displayIcons.map(...)}
<div className="h-6 flex items-center justify-center">
  {locked && (
    <span
      role="status"
      aria-label="locked"
      className="text-xs text-amber-300 font-bold"
    >
      🔒
    </span>
  )}
</div>
```

The `h-6` (24 px) wrapper is always rendered, making locked and unlocked columns identical in total height. The emoji alone is ≤ column icon width.

Also remove the `isTargetingMode` overlay button that references the old lock indicator (the overlay `absolute inset-0` button for column targeting remains correct and unaffected).

### 7. `src/components/ReelView.tsx`

Add per-icon toggle buttons and the 12-icon constraint UI:

```tsx
interface Props {
  reel: Reel
  disabledIconIds: string[]
  onToggleIcon: (iconId: string) => void
}

export function ReelView({ reel, disabledIconIds, onToggleIcon }: Props) {
  const enabledCount = reel.icons.length - disabledIconIds.length
  const canDisable = enabledCount > 12

  return (
    <div className="p-4 bg-gray-800 rounded-xl border border-gray-700 space-y-3">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold text-gray-400">
          Your Reel ({reel.icons.length} icons, {enabledCount} enabled)
        </h2>
        {!canDisable && reel.icons.length >= 13 && (
          <span className="text-xs text-amber-400">Min 12 enabled</span>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        {reel.icons.map((icon) => {
          const def = ICON_CATALOG[icon.definitionId]
          const disabled = disabledIconIds.includes(icon.id)
          return (
            <button
              key={icon.id}
              onClick={() => onToggleIcon(icon.id)}
              disabled={!disabled && !canDisable}
              aria-pressed={!disabled}
              aria-label={`${def?.label ?? '?'} — ${disabled ? 'disabled, click to enable' : 'enabled, click to disable'}`}
              className={`icon-cell transition-opacity ${
                disabled ? 'opacity-40 line-through' : ''
              } ${!disabled && !canDisable ? 'cursor-not-allowed' : 'cursor-pointer'}`}
            >
              {def?.label ?? '?'}
            </button>
          )
        })}
      </div>
    </div>
  )
}
```

### 8. `src/App.tsx`

**Enhancement 1**: Pass `disabledIconIds` and `onToggleIcon` to `ReelView`:
```tsx
<ReelView
  reel={state.reel}
  disabledIconIds={state.disabledIconIds}
  onToggleIcon={(iconId) => dispatch({ type: 'TOGGLE_ICON', iconId })}
/>
```

**Enhancement 2**: Restructure the Spin tab controls:
```tsx
<div className="mt-3 space-y-2">
  {/* SpinControls always visible — SPIN and CLAIM share the same anchor below it */}
  <SpinControls
    settings={state.settings}
    spinning={spinning}
    onSettingsChange={(patch) => dispatch({ type: 'UPDATE_SETTINGS', patch })}
  />
  {isMagicPhase ? (
    <>
      <button
        onClick={handleClaim}
        className="w-full py-4 text-2xl font-bold rounded-xl bg-emerald-600 hover:bg-emerald-500 active:scale-95 transition-all"
        aria-label="Claim spin result"
      >
        ✨ CLAIM
      </button>
      <MagicPhasePanel
        currencies={state.currencies}
        magicCounters={state.magicCounters}
        lockedColumns={state.lockedColumns}
        magicMode={magicMode}
        swapFrom={swapFrom}
        onSelectMode={setMagicMode}
      />
    </>
  ) : (
    <SpinButton
      phase={state.phase}
      currencies={state.currencies}
      spinning={spinning}
      multiplier={state.settings.spinMultiplier}
      onSpin={handleSpin}
    />
  )}
</div>
```

## Complexity Tracking

> No constitution violations. All functions remain within 40-line / complexity-10 limits. No new dependencies. `tryBuyIcon` is refactored, not grown — the `ensureLiquidity` helper extracts the conversion logic cleanly.

## Test Plan Summary

| Test file | New cases |
|-----------|-----------|
| `tests/unit/reducer.test.ts` | `TOGGLE_ICON`: enable/disable round-trip; 12-icon floor enforcement; phase guard (magic phase no-op); `MAGIC_INCREASE_VALUE`: first activation +1, second activation +1 (not +2); `SPIN`: `lockedColumns` preserved in spinning phase; `tryBuyIcon`: 0 copper + silver → success; 0 copper + 0 silver + gold → success; 0 all → failure |
| `tests/unit/spinLogic.test.ts` | `drawColumn` with disabled ids excludes those icons from result |
| `tests/unit/ReelColumn.test.tsx` | Respin animation: displayed icon count equals column length (not reel length) |
| `tests/integration/magicPhase.test.tsx` | Full: spin → magic → MAGIC_INCREASE_VALUE on a grid with ≥3 of each elemental → CLAIM → `state.masterOfElements === true` |
