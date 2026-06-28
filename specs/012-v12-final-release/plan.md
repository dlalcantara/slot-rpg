# Implementation Plan: Version 1.2 Final Release

**Branch**: `012-v12-final-release` | **Date**: 2026-06-28 | **Spec**: [spec.md](./spec.md)

**Input**: Feature specification from `specs/012-v12-final-release/spec.md`

## Summary

Seven changes across help text, UI display, a bug fix, and a new auto-claim toggle. No new npm dependencies. No localStorage schema version bump. All changes are confined to `src/` (six modified files) and `tests/` (three modified + one new file).

## Technical Context

**Language/Version**: TypeScript 5.6 / React 18.3 (Vite 6, Tailwind CSS 3)

**Primary Dependencies**: React 18, Vite 6, Tailwind CSS 3, Vitest 2, @testing-library/react 16

**Storage**: localStorage via `src/game/persistence.ts` — version 6 schema; backward-compat patch for `autoClaim` field added to `loadState()`; no version bump

**Testing**: Vitest + @testing-library/react — existing suites in `tests/unit/` and `tests/integration/`

**Target Platform**: Browser (GitHub Pages CDN), mobile-first 720 × 1280 px

**Project Type**: Single-page web application — no backend, no external API

**Performance Goals**: Bundle ≤ 250 KB gzip; spin computation ≤ 16 ms; page load ≤ 3 s on Slow 3G

**Constraints**: No new npm dependencies; all changes are JSX/TypeScript only; no migration step beyond one in-place persistence patch

**Scale/Scope**: 6 modified source files, 4 test files (3 modified + 1 new)

## Constitution Check

- [x] **I. Code Quality** — TypeScript strict on. No `any` casts introduced. `autoClaim: boolean` typed in `PlayerSettings`. `onHelp?: () => void` typed in `MagicPhasePanel` props. Unused `sortedIcons` variable removed from `ReelView`.
- [x] **II. Test-First** — Tests written Red before implementation: `HelpModal` magic topic + updated topic content; `SpinControls` auto-claim checkbox; `ReelView` grouped display; `App` auto-claim flow end-to-end; currency display update-on-claim.
- [x] **III. UX Consistency** — 720 × 1280 px layout unaffected: icon-cell remains 48 × 48 px; count badge uses `absolute top-0 left-0` within cell; multiplier badge `absolute bottom-0.5 right-0.5` unchanged. Magic Phase `❓` button sits in existing panel header. New auto-claim checkbox uses same `accent-indigo-500` pattern as existing controls.
- [x] **IV. Performance** — No new dependencies. Auto-claim adds one `if` check in `handleSpinDone`; React 18 batches both dispatches so no extra re-render. `countByDefId` reuses already-computed map; no extra iteration. Currency fix removes a delayed `setDisplayedCurrencies` call; no extra work.
- [x] **V. Build Pipeline** — Existing GitHub Actions gates require no changes.

*All items pass. No complexity violations.*

## Project Structure

### Documentation (this feature)

```text
specs/012-v12-final-release/
├── plan.md              # This file
├── research.md          # Phase 0 output
├── data-model.md        # Phase 1 output
├── checklists/
│   └── requirements.md
└── tasks.md             # Phase 2 output (/speckit-tasks)
```

### Source Code

```text
src/
├── game/
│   ├── types.ts              # MODIFY: add autoClaim to PlayerSettings + DEFAULT_SETTINGS
│   └── persistence.ts        # MODIFY: patch autoClaim into loaded settings (no version bump)
├── components/
│   ├── HelpModal.tsx         # MODIFY: extend topic type; update game/spin/market; add magic topic
│   ├── MagicPhasePanel.tsx   # MODIFY: add onHelp prop + ❓ button in header
│   ├── ReelView.tsx          # MODIFY: replace per-icon display with grouped countByDefId display
│   └── SpinControls.tsx      # MODIFY: add autoClaim checkbox after autoConvert
└── App.tsx                   # MODIFY: HelpTopic type; currency fix; autoClaim dispatch; pass onHelp

tests/
├── unit/
│   ├── HelpModal.test.tsx    # MODIFY: add magic topic tests + updated content assertions
│   ├── SpinControls.test.tsx # MODIFY: add autoClaim checkbox tests
│   └── ReelView.test.tsx     # NEW: grouped display tests
└── integration/
    └── magicPhase.test.tsx   # MODIFY: add auto-claim flow + currency update tests
```

---

## Change-by-Change Implementation Guide

### Change 1 — `autoClaim` field in `PlayerSettings` (`types.ts`)

**File**: `src/game/types.ts`

Add `autoClaim: boolean` to the `PlayerSettings` interface and set it to `false` in `DEFAULT_SETTINGS`.

```typescript
export interface PlayerSettings {
  autoConvert: boolean
  animate: boolean
  spinMultiplier: SpinMultiplier
  autoClaim: boolean          // ADD
}

export const DEFAULT_SETTINGS: PlayerSettings = {
  autoConvert: true,
  animate: true,
  spinMultiplier: 1,
  autoClaim: false,           // ADD
}
```

**Test cases (unit — `SpinControls.test.tsx`)**:
- Render with `settings = { ...defaultSettings, autoClaim: false }` → auto-claim checkbox is unchecked
- Render with `settings = { ...defaultSettings, autoClaim: true }` → auto-claim checkbox is checked
- Check `onChange` fires `onSettingsChange({ autoClaim: true })` when user ticks the box

---

### Change 2 — Persistence patch for `autoClaim` (`persistence.ts`)

**File**: `src/game/persistence.ts`

In `loadState()`, after the existing `if (state.rowCount == null)` guard, add:

```typescript
if (!Object.prototype.hasOwnProperty.call(state.settings ?? {}, 'autoClaim')) {
  state.settings = { ...state.settings, autoClaim: false }
}
```

No version bump — this is a read-time patch only. Existing v6 saves without `autoClaim` will load correctly and default to `false`.

---

### Change 3 — Help text updates + magic topic (`HelpModal.tsx`)

**File**: `src/components/HelpModal.tsx`

**3a — Extend the topic union type**:

```typescript
interface Props {
  topic: 'game' | 'reel' | 'spin' | 'market' | 'achievements' | 'magic'
  onClose: () => void
}
```

**3b — Update `game` topic body**:

Add a sentence before the magic phase paragraph:
> "Slot RPG is a **non-idle** incremental game — you need to keep spinning to earn currencies. The **Feats** tab contains achievements that unlock automatically as you play."

Keep the existing "Slot RPG is a slot-machine game" opener and the AI attribution.

**3c — Update `spin` topic body**:

Replace the current body with:
1. Keep "Ways to Win" paragraph (unchanged).
2. Add a worked example block:

```
Example result:
  2×🍎  |  🟤  |  🍎  |  💨  |  🍎
  💨    |  💨   |  🍎  |  🟤  |  💨
  🟤    |  🍎   |  🟤  |  🍎  |  🟤

→ You earn 4 🍎 Apples  (2 × 1 × 2 × 1 × 1)
→ You earn 1 🟤 Copper  (1 × 1 × 1 × 1 × 1)
→ Air does not pay out — it is not in every column
```

3. Keep the Apple spin-cost sentence.
4. Add: "Buy icons from the Reels Store to increase your possible payouts."
5. Remove the optional-actions bullet list (Respin / Swap / Block / Increase Value) — that content moves to the `magic` topic.
6. Simplify the magic phase mention to: "After each spin you enter the **Magic Phase** — open its ❓ for details."

**3d — Update `market` topic body**:

Append after the existing paragraphs:
> "Visit the **Reel** tab to see all the icons currently in your slot machine."

**3e — Add `magic` topic**:

```typescript
magic: {
  heading: 'The Magic Phase',
  body: (
    <>
      <p>Spin the slot machine to earn elemental currencies (Air, Water, Earth, Fire) needed for Magic Phase actions.</p>
      <p>After each spin you can use these currencies before claiming your result:</p>
      <ul className="list-disc list-inside space-y-1 text-sm">
        <li><strong>Respin</strong> — spend Air to re-roll a column</li>
        <li><strong>Swap</strong> — spend Water to swap two adjacent cells</li>
        <li><strong>Block</strong> — spend Earth to exclude a column from the payout</li>
        <li><strong>Boost Value</strong> — spend Fire to double an icon's value</li>
      </ul>
      <p>Claim when you're happy with the result.</p>
    </>
  ),
},
```

**Test cases (unit — `HelpModal.test.tsx`)**:
- `topic="magic"` renders heading "The Magic Phase"
- `topic="magic"` contains the text "elemental currencies"
- `topic="magic"` contains list items for Respin, Swap, Block, Boost
- `topic="spin"` contains the text "4" and "2 × 1 × 2 × 1 × 1" (or similar phrasing from the example)
- `topic="spin"` does NOT contain "optional actions" bullet list text (e.g., "Respin a column to re-roll")
- `topic="spin"` contains "Reels Store"
- `topic="game"` contains "non-idle"
- `topic="game"` contains "Feats"
- `topic="market"` contains "Reel"

---

### Change 4 — Magic Phase help button (`MagicPhasePanel.tsx`)

**File**: `src/components/MagicPhasePanel.tsx`

Add `onHelp?: () => void` to the `Props` interface.

Wrap the existing `<h3>` in a flex row and add the help button:

```tsx
<div className="flex items-center justify-between">
  <h3 className="text-sm font-bold text-purple-300 uppercase tracking-wider">✨ Magic Phase</h3>
  {onHelp && (
    <button
      type="button"
      aria-label="Help: Magic Phase"
      onClick={onHelp}
      className="text-gray-400 hover:text-gray-200 text-sm px-1"
    >
      ❓
    </button>
  )}
</div>
```

The `onHelp` prop is optional so existing usages (tests) that don't pass it continue to work.

---

### Change 5 — Grouped icon display in Reels Tab (`ReelView.tsx`)

**File**: `src/components/ReelView.tsx`

In the non-prestige `return` block, replace the `sortedIcons.map(...)` section with iteration over `countByDefId`:

```tsx
<div className="flex flex-wrap gap-2">
  {[...countByDefId.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([defId, count]) => {
      const def = ICON_CATALOG[defId]
      return (
        <div key={defId} className="icon-cell relative">
          {def?.emoji ?? '?'}
          {def && def.valuePerColumn > 1 && (
            <span className="absolute bottom-0.5 right-0.5 text-xs text-gray-400 leading-none">
              ×{def.valuePerColumn}
            </span>
          )}
          <span className="absolute top-0 left-0 text-xs font-bold text-white bg-gray-900/70 rounded-br px-0.5 leading-none">
            {count}
          </span>
        </div>
      )
    })}
</div>
```

Remove the now-unused `sortedIcons` variable declaration.

**Test cases (unit — `tests/unit/ReelView.test.tsx`, new file)**:

```typescript
// Setup helper: build a minimal reel prop
function makeReel(defs: string[]): Reel {
  return { icons: defs.map((d, i) => ({ id: `i${i}`, definitionId: d })) }
}
```

- Reel with `['apple', 'apple', 'copper']` → renders 2 icon cells (not 3); apple cell shows count "2"; copper cell shows count "1"
- Reel with `['apple']` → single icon cell shows count "1"
- Reel with `['apple', 'copper']` → two icon cells, each showing count "1"
- Individual `icon.id` keys do NOT appear as cell keys (uses `defId` key — assert via aria or text queries, not internal React keys)

---

### Change 6 — Auto-claim checkbox (`SpinControls.tsx`)

**File**: `src/components/SpinControls.tsx`

Append a new `<label>` block after the existing `Auto-convert` label:

```tsx
<label className="flex items-center gap-1.5 text-sm text-gray-300 cursor-pointer select-none">
  <input
    type="checkbox"
    checked={settings.autoClaim ?? false}
    onChange={(e) => onSettingsChange({ autoClaim: e.target.checked })}
    disabled={spinning || isMagicPhase}
    className="accent-indigo-500"
    aria-label="Auto-claim"
  />
  Auto-claim
</label>
```

The `?? false` fallback ensures no crash if an old settings object without `autoClaim` is passed.

---

### Change 7 — Wire auto-claim, fix currency display, add magic help topic (`App.tsx`)

**File**: `src/App.tsx`

**7a — Extend `HelpTopic`**:

```typescript
type HelpTopic = 'game' | 'reel' | 'spin' | 'market' | 'achievements' | 'magic'
```

**7b — Fix `displayedCurrencies` update in toast effect**:

In the `useEffect` that depends on `[state.lastSpinResult]`, add `setDisplayedCurrencies(state.currencies)` right after `setToastResult`, and remove it from the timer callback:

```typescript
useEffect(() => {
  if (state.phase !== 'magic' && state.lastSpinResult) {
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current)
    setToastResult(state.lastSpinResult)
    setDisplayedCurrencies(state.currencies)          // ADD: update immediately
    toastTimerRef.current = setTimeout(() => {
      setToastResult(null)
      // REMOVE: setDisplayedCurrencies call here
    }, 3000)
  }
}, [state.lastSpinResult]) // eslint-disable-line react-hooks/exhaustive-deps
```

**7c — Auto-claim dispatch in `handleSpinDone`**:

```typescript
const handleSpinDone = useCallback(() => {
  setSpinning(false)
  setMagicMode(null)
  setSwapFrom(null)
  dispatch({ type: 'BEGIN_MAGIC_PHASE' })
  if (state.settings.autoClaim) {                    // ADD
    dispatch({ type: 'CLAIM' })                      // ADD
  }                                                  // ADD
}, [state.settings.autoClaim])                       // ADD to dep array
```

**7d — Pass `onHelp` to `MagicPhasePanel`**:

```tsx
<MagicPhasePanel
  currencies={state.currencies}
  magicCounters={state.magicCounters}
  blockedColumns={state.blockedColumns}
  multiplier={state.pendingMultiplier}
  magicMode={magicMode}
  swapFrom={swapFrom}
  onSelectMode={setMagicMode}
  onHelp={() => setHelpTopic('magic')}               // ADD
/>
```

**Test cases (integration — `tests/integration/magicPhase.test.tsx`)**:

Auto-claim flow:
- Load `App` with `autoClaim: true` in settings; spin → advance timers → assert magic phase panel is NOT rendered; assert `state.phase` is `'market'` (not `'magic'`); assert `lastSpinResult` is not null

Currency update fix:
- Load `App` with `animate: false`; spin, advance timers, click CLAIM; assert the currency display updates immediately without needing to wait for a 3-second timer

(Tests are added to the existing `magicPhase.test.tsx` file as new `describe` blocks.)

---

## Complexity Tracking

> No constitution violations — table omitted.
