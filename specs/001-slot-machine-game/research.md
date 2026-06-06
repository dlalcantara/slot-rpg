# Research: Slot Machine RPG — MVP

**Branch**: `001-slot-machine-game` | **Date**: 2026-06-06

## Decision 1: Framework — React + TypeScript via Vite

**Decision**: React 18 with TypeScript (strict mode), bundled by Vite, deployed to GitHub Pages.

**Rationale**:
- The spec explicitly prefers React. TypeScript strict mode is required by the constitution.
- Vite produces a minimal production bundle (React 18 + ReactDOM ≈ 45 KB gzipped) well inside the 250 KB constitution limit, leaving ≈ 200 KB headroom for game logic and styles.
- Vite's `base` config option + `vite-plugin-gh-pages` (or the `gh-pages` npm package) makes GitHub Pages deployment a single `npm run deploy` command.
- Alternative (vanilla JS + TypeScript): saves the React runtime (~45 KB) but adds significant manual DOM wiring for reactive state — not worth the complexity given the interactive UI requirements.

**Alternatives considered**:
- Preact: smaller runtime, but React ecosystem (Testing Library, DevTools) is more ergonomic for test-first development.
- Svelte: excellent bundle size but heavier tooling setup; team familiarity lower than React.
- Vue 3: similar tradeoffs to React but ecosystem fit weaker for a game project of this scope.

---

## Decision 2: State Management — React `useReducer` + Context (no external library)

**Decision**: All game state lives in a single `useReducer` at the root, passed down via Context. No Redux, Zustand, or other library.

**Rationale**:
- Game state is a single flat object (reel, currencies, crowns, phase). A reducer with named actions (SPIN, BUY_ICON, HARD_RESET, RESTORE_STATE) is the clearest model.
- A pure reducer function is trivially unit-testable without mounting any React component.
- The constitution's ≤ 250 KB bundle constraint rules out Zustand (~3 KB) only marginally — it's omitted for simplicity, not size. Redux is overkill.
- Alternative (prop drilling): rejected because Market, SpinButton, and CurrencyDisplay are all sibling subtrees needing shared state.

---

## Decision 3: Persistence — `localStorage` with JSON serialization

**Decision**: After every state change (spin resolve, market purchase), serialize the full game state to `localStorage` under a single key (`slot-rpg-state`). On mount, attempt to read and deserialize; fall back to initial state if absent or invalid.

**Rationale**:
- The spec explicitly requires browser local storage persistence.
- A single JSON blob per save is simplest to implement, test, and reset. Versioning the schema (adding a `version` field) makes future migrations safe.
- Hard Reset dispatches `HARD_RESET` action → reducer returns `INITIAL_STATE` → `useEffect` writes `INITIAL_STATE` to localStorage (overwriting the save).
- Alternative (IndexedDB): unnecessary complexity for the data volume (< 1 KB per save state).
- Alternative (sessionStorage): rejected — would not survive browser close.

---

## Decision 4: Animation — CSS keyframe columns with JS offset control

**Decision**: Each reel column is a vertically scrolling list of icon cells animated via a CSS `transform: translateY()` transition. JavaScript controls the start offset, duration (≈ 5 s staggered per column), and final stopping offset.

**Rationale**:
- Pure CSS transitions run off the main thread (compositor layer), satisfying the constitution's "no synchronous blocking on main thread during spin" requirement.
- The reel model (shuffled array + offset) maps directly to a `translateY` value; no canvas or WebGL needed.
- Spin computation (shuffle + pick offsets) completes in < 1 ms for reel sizes up to ~1000 icons, well within the 16 ms frame budget.
- Alternative (CSS animation + keyframes generated at runtime): more complex keyframe injection; no meaningful benefit.
- Alternative (canvas rendering): overkill; harder to test; loses CSS layout flexibility.

**Stagger pattern**: columns 0–4 stop at +0 s, +0.3 s, +0.6 s, +0.9 s, +1.2 s delays, giving a cascading "thunk" feel within the 5 s window.

---

## Decision 5: Testing — Vitest + React Testing Library

**Decision**: Vitest for unit and integration tests; React Testing Library (RTL) for component-level integration tests; no Cypress/Playwright for MVP.

**Rationale**:
- Vitest is Vite-native — zero additional config; shares the same transform pipeline as the build. Run time for a full suite on this project will be < 5 s.
- RTL's "render + query + assert" model tests user-visible behavior, not implementation details, matching the constitution's test-first requirement.
- Pure reducer logic (reel shuffle, payout calculation, currency conversion, win detection) tested as plain functions — no DOM at all.
- E2E (Playwright) deferred to post-MVP; the integration tests cover the full spin→currency→UI flow mandated by the constitution.

---

## Decision 6: CI / GitHub Actions pipeline

**Decision**: Single workflow file `.github/workflows/ci.yml` running the six ordered constitution gates on every push and PR. Deploy step runs only on merge to `main` using `peaceiris/actions-gh-pages`.

**Gate order** (constitution-mandated):
1. `npm run typecheck` — `tsc --noEmit`
2. `npm run lint` — ESLint + `@typescript-eslint`
3. `npm run test:unit` — Vitest unit suite
4. `npm run test:integration` — Vitest integration suite (RTL)
5. `npm run build` — Vite production build
6. Bundle size check — `bundlesize` or inline `du -sh dist/assets/*.js | awk` asserting ≤ 250 KB gzipped

---

## Decision 7: Icon representation — Discriminated union type

**Decision**: Icons are represented as a TypeScript discriminated union: `{ family: 'apple' | 'copper' | 'silver' | 'gold' | 'crown' | 'blank', value: number }`. Apple variants share `family: 'apple'` with different `value` fields (1, 3, 12). Matching logic groups by `family`; payout multiplies `value` per column.

**Rationale**:
- Directly models the spec rule: "all Apple variants match each other; column value is the sum of their individual values."
- `family` determines alignment matching; `value` determines the per-column count fed into the product formula.
- Blank icons: `family: 'blank'`, `value: 0`. They can never form an alignment (a blank never appears in all 5 columns unless the reel contains only blanks, which produces no payout).

---

## Decision 8: GitHub Pages Subdirectory Routing & Asset Paths

**Decision**: Set `base` in `vite.config.ts` to the repo name (e.g., `'/slot-rpg/'`). All asset imports go through Vite's module system — no hardcoded absolute paths in source. The `gh-pages` npm package deploys the `dist/` folder to the `gh-pages` branch.

**Rationale**:
- GitHub Pages serves project repos at `https://<user>.github.io/<repo>/`, not at the domain root. Without `base`, all asset and chunk URLs break (404s on JS, CSS, images).
- Vite's `base` rewrites all `import`-resolved asset URLs at build time, so source code never needs to know the deploy subdirectory.
- The `gh-pages` package is the simplest deploy path: `npm run deploy` = `vite build && gh-pages -d dist`. No GitHub Actions deploy step needed for manual deploys; CI can also run it via the same command.
- Alternative (manual `<base>` tag in `index.html`): fragile — only affects HTML href/src, not JS dynamic imports or CSS `url()`.

**Config**:
```ts
// vite.config.ts
export default defineConfig({
  base: '/slot-rpg/',   // replace with actual repo name at scaffold time
  plugins: [react()],
})
```

---

## Decision 9: Offline Support — Static PWA (no Service Worker for MVP)

**Decision**: The app works offline by default because it is a fully static bundle — once the GitHub Pages CDN delivers the assets, the browser cache keeps them available. No Service Worker or `manifest.json` for MVP.

**Rationale**:
- A Service Worker adds non-trivial complexity (cache invalidation, update lifecycle) that is out of scope for MVP.
- Vite's production build emits hashed filenames; browsers cache them indefinitely until the hash changes, providing effectively offline-capable behavior for repeat visitors.
- `localStorage` persistence means game state survives offline sessions without any network dependency.
- PWA/Service Worker can be added post-MVP with `vite-plugin-pwa` in a single config change.

---

## Decision 10: UI Aesthetic — Modern Clean with Micro-interactions

**Decision**: Tailwind CSS for utility-first styling. Custom CSS variables for the game's color palette and animation durations. CSS transitions and keyframe animations for micro-interactions (spin, buy confirmation, payout flash, win modal entrance).

**Rationale**:
- Tailwind adds ≈ 8–15 KB gzipped (with PurgeCSS/tree-shaking enabled by default in Vite) — well within budget.
- "Modern clean" aesthetic: card-based layout, subtle shadows, rounded corners, a dark-neutral background with accent colors per currency type (amber for food, copper/silver/gold tones for money, purple for crowns).
- Micro-interaction checklist: spin button press feedback (scale down + release), column settle animation (ease-out bounce), currency increment flash (color pulse), WIN modal entrance (scale-up fade-in), purchase confirmation (brief green flash on buy button).
- All animations respect `prefers-reduced-motion` media query — disabled or instant for users who opt out.
- Alternative (CSS Modules or styled-components): more boilerplate for what is essentially a single-screen app.

---

## Decision 11: Extensible Icon Effect Architecture

**Decision**: Icon effects are described by a data structure (`IconEffect`), not by hardcoded switch statements in the reducer. The `IconDefinition` in the catalog carries an `effect` field that declaratively describes what happens when that icon family aligns. The reducer interprets effects generically.

**Rationale**:
- The explicit architecture requirement is that "Icons and their effects can be modified in the future." A switch on `family` inside the reducer makes adding a new icon type a reducer edit; a declarative effect descriptor makes it a catalog edit only.
- MVP effect types needed: `{ type: 'add_currency', currency: CurrencyKey, valuePerColumn: number }`. Future effects (e.g., `multiply_currency`, `add_to_reel`, `remove_food`) are new `type` variants — zero reducer changes required.
- The reducer's payout loop iterates over aligned families, looks up the `IconDefinition` by family, reads `effect`, and dispatches the generic `applyCurrencyEffect` function. Adding a new family = adding a row to the catalog.
- Alternative (switch/case): simpler to write initially but closes the open/closed principle — every new icon type requires a reducer change and a test update.

**Effect type structure** (illustrative):
```ts
type IconEffect =
  | { type: 'add_currency'; currency: CurrencyKey; valuePerColumn: number }
  | { type: 'none' }  // Blank
```

---

## Decision 12: Extensible Currency Registry

**Decision**: Currencies are defined in a `CurrencyDefinition` registry (`src/game/currencyRegistry.ts`), analogous to the icon catalog. The reducer reads win/loss conditions, auto-conversion rules, and downward-conversion rates from the registry at runtime. Adding a new currency requires only a new registry entry — no reducer changes.

**Rationale**:
- The explicit requirement is that currencies and their effects must be extensible without code changes to game logic.
- A `Record<string, number>` balance map (keyed by `CurrencyDefinition.key`) replaces the fixed `{ food, copper, silver, gold, crowns }` struct. The map is serialized to localStorage by key, so adding a currency with a `startingAmount` of 0 is backwards-compatible with existing saves (missing key = default to 0).
- Win/loss conditions on the registry replace hardcoded `crowns >= 100` and `food === 0` checks in the reducer — the reducer iterates registry entries to evaluate them generically.
- Alternative (hardcoded currency fields): simpler for MVP but violates the stated extensibility requirement.

---

## Decision 13: On-Demand Downward Currency Conversion at Purchase Time

**Decision**: When a player attempts to buy an icon and lacks the exact cost currency, the game automatically converts the minimum whole units from the next higher tier to cover the shortfall. The conversion is defined in the `CurrencyDefinition` via `convertibleFrom` and is applied in a single atomic step inside the BUY_ICON reducer branch.

**Rationale**:
- The requirement is explicit: "if player has no copper but has 1 silver, they can convert 1 silver into 100 copper to buy a 1 copper item."
- Making conversion automatic (no separate player action) keeps the UX simple. The overshoot (99 copper remainder in the example) stays in the player's balance — it is a feature, not waste.
- Conversion only goes downward (gold→silver→copper) and only on demand at purchase time. It does not go upward (that is auto-conversion post-spin) and does not apply to currencies without a `convertibleFrom` definition (Food, Crowns).
- The `ceil(shortfall / rate)` formula ensures the minimum number of conversions — no more than needed.
- Alternative (explicit "convert currency" UI button): adds UI complexity and extra player friction for a routine action; rejected.

---

## Resolved Clarifications

All NEEDS CLARIFICATION items from the spec were pre-resolved during specification. No open items remain.
