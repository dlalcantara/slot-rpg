# Developer Quickstart: Slot Machine RPG — MVP

**Branch**: `001-slot-machine-game` | **Date**: 2026-06-06

## Prerequisites

- Node.js ≥ 20 (LTS)
- npm ≥ 10

## Setup

```sh
# Clone and install
git clone <repo-url>
cd slot-rpg
npm install
```

## Development

```sh
npm run dev        # Vite dev server at http://localhost:5173 (hot reload)
```

Open a second terminal and keep tests running in watch mode:

```sh
npm run test       # Vitest watch mode
```

## Key scripts

| Script                   | What it does                                              |
|--------------------------|-----------------------------------------------------------|
| `npm run dev`            | Start Vite dev server at `http://localhost:5173`          |
| `npm run typecheck`      | `tsc --noEmit` — catches type errors without building     |
| `npm run lint`           | ESLint with `@typescript-eslint`                          |
| `npm run test`           | Vitest in watch mode (unit + integration)                 |
| `npm run test:run`       | Vitest single-pass (used in CI)                           |
| `npm run build`          | Vite production build → `dist/` (uses `base: '/slot-rpg/'`) |
| `npm run preview`        | Serve `dist/` locally for a pre-deploy smoke test         |
| `npm run deploy`         | `vite build && gh-pages -d dist` — pushes to `gh-pages` branch |

> **Deployment note**: `vite.config.ts` sets `base: '/slot-rpg/'` to match the GitHub Pages subdirectory. Update this to match the actual repo name before first deploy. Asset paths in source code must always use Vite imports (not hardcoded strings) so the base is applied automatically at build time.

## Full CI gate sequence (run locally before pushing)

```sh
npm run typecheck && npm run lint && npm run test:run && npm run build
```

## Project structure (post-scaffold)

```text
slot-rpg/
├── src/
│   ├── main.tsx              # React entry point
│   ├── App.tsx               # Root component + useReducer + Context provider
│   ├── game/
│   │   ├── types.ts          # Icon, Reel, Currencies, GameState, SpinResult, Payout
│   │   ├── initialState.ts   # INITIAL_STATE constant
│   │   ├── reducer.ts        # Pure reducer: SPIN, BUY_ICON, HARD_RESET, etc.
│   │   ├── spinLogic.ts      # Reel shuffle, column extraction, payout calculation
│   │   ├── catalog.ts           # Icon definitions & effects — add new icons here
│   │   ├── currencyRegistry.ts  # Currency definitions & conversion rules — add new currencies here
│   │   └── persistence.ts       # localStorage read/write/clear helpers
│   ├── components/
│   │   ├── SlotGrid.tsx      # 3×5 icon display
│   │   ├── ReelColumn.tsx    # Single animated column
│   │   ├── CurrencyDisplay.tsx
│   │   ├── Market.tsx        # Icon shop panel
│   │   ├── MarketItem.tsx    # Single purchasable icon row
│   │   ├── SpinButton.tsx
│   │   ├── HardResetButton.tsx
│   │   ├── GameOverScreen.tsx
│   │   └── WinModal.tsx
│   └── styles/
│       └── index.css         # Global styles; 720×1280 mobile breakpoint
├── tests/
│   ├── unit/
│   │   ├── reducer.test.ts        # All action contracts
│   │   ├── spinLogic.test.ts      # Payout math, edge cases
│   │   └── persistence.test.ts    # localStorage read/write/fallback
│   └── integration/
│       ├── fullSpinFlow.test.tsx  # Spin → currency update → UI re-render
│       ├── marketFlow.test.tsx    # Buy → reel update → balance deducted
│       └── persistenceFlow.test.tsx # Save → reload → state restored
├── .github/
│   └── workflows/
│       └── ci.yml                 # Six-gate pipeline + deploy
├── index.html
├── vite.config.ts
├── tsconfig.json                  # strict: true
└── package.json
```

## State architecture summary

```
App.tsx
  └─ useReducer(gameReducer, loadOrInitialState())
       └─ GameContext.Provider
            ├─ SlotGrid
            ├─ CurrencyDisplay
            ├─ Market
            ├─ SpinButton
            ├─ HardResetButton
            ├─ GameOverScreen    (rendered only when phase === 'gameover')
            └─ WinModal          (rendered only when phase === 'win')
```

State is serialized to `localStorage` inside a `useEffect` that runs after every dispatch.

## Constitution compliance checklist (pre-PR)

- [ ] `npm run typecheck` exits 0 (no `any` casts without inline justification)
- [ ] `npm run lint` exits 0
- [ ] All unit and integration tests pass; coverage ≥ 80% on changed files
- [ ] Manual smoke test at 720×1280 px (screenshot in PR description)
- [ ] Bundle size ≤ 250 KB gzipped (reported in PR description)
