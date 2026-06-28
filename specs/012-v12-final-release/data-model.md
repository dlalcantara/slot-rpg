# Data Model: Version 1.2 Final Release

**Branch**: `012-v12-final-release` | **Date**: 2026-06-28

## Changed Entities

### PlayerSettings (extended)

`src/game/types.ts` — `PlayerSettings` interface

| Field | Type | Default | Notes |
|-------|------|---------|-------|
| `autoConvert` | `boolean` | `true` | Existing — unchanged |
| `animate` | `boolean` | `true` | Existing — unchanged |
| `spinMultiplier` | `SpinMultiplier` | `1` | Existing — unchanged |
| `autoClaim` | `boolean` | `false` | **NEW** — when true, `BEGIN_MAGIC_PHASE` + `CLAIM` are dispatched together in `handleSpinDone`, bypassing the Magic Phase UI |

`DEFAULT_SETTINGS` updated to include `autoClaim: false`.

### Persistence Schema (version 6, unchanged)

No schema version bump. `loadState()` patches the loaded settings object to add `autoClaim: false` if the field is absent — backward compatible with all existing saves at version 6.

## Unchanged Entities

All other game state entities (`GameState`, `Currencies`, `Reel`, `Icon`, `MagicCell`, `SpinResult`, etc.) are unchanged.

## UI State Changes (component-level, not persisted)

| Component | State Change | Purpose |
|-----------|-------------|---------|
| `HelpModal` | `Props['topic']` union extended to include `'magic'` | New in-context help panel for Magic Phase |
| `App.tsx` | `HelpTopic` type extended to include `'magic'` | Matches modal extension |
| `MagicPhasePanel` | New `onHelp?: () => void` prop | Triggers magic help from within the panel |

## State Transition: Auto-Claim Flow

```
[handleSpinDone called]
  ↓
dispatch BEGIN_MAGIC_PHASE   → state: phase='magic', magicGrid=[...]
dispatch CLAIM (if autoClaim) → state: phase='market', magicGrid=null, lastSpinResult=[...]
  ↓
React 18 batches both dispatches → single re-render at final state
Magic Phase UI never rendered
```

## State Transition: Currency Display Fix

```
[CLAIM dispatched]
  ↓
state.lastSpinResult changes (CLAIM effect fires)
  → setToastResult(state.lastSpinResult)
  → setDisplayedCurrencies(state.currencies)   ← NEW: update immediately
  → setTimeout(3000, () => setToastResult(null))
```
