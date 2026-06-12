# Quickstart: Verifying Version 0.5 Visual Fixes

Manual verification at the target mobile resolution (720 × 1280 px). Run after implementation; pair
with the automated suites.

## Setup

```bash
npm install            # if needed
npm run dev            # start Vite dev server
```

Open the app, set the browser/devtools viewport to 720 × 1280 px. To get a clean new game, use the
Hard Reset control (this adopts the new deck/resources).

## Automated gates (must pass)

```bash
npm run typecheck
npm run lint
npm run test:unit
npm run test:integration
npm run build          # includes bundle; confirm ≤ 250 KB gzipped
```

## Manual checks (map to user stories)

1. **US1 — no empty-cell flash**: With animation on, spin several times. Each column must land
   straight on its final symbols — no blank frame before the result. Toggle animation off and confirm
   the result appears instantly with no blank frame.

2. **US2 — magic edits visible**: Start a game (you have 10 Air, 10 Water). Spin → magic phase.
   - Respin (Air): the targeted column's symbols change on screen.
   - Swap (Water): the two chosen cells visibly trade places.
   - Boost (Fire, if available): the cell shows its increased value, matching the claimed payout.

3. **US3 — respin animates**: Animation on → respin a column → only that column shuffles, then
   settles. Animation off → the column updates instantly.

4. **US4 — locked column clear**: Lock a column with Earth → a clear, persistent locked indicator
   appears on that column, obviously different from unlocked columns.

5. **US5 — column click target**: Activate Respin (or Lock) mode → each column shows an obvious place
   to click; hovering/focusing emphasizes it; clicking selects the intended column on the first try.

6. **US6 — market**: Open Market → Air = 1 Copper, Water = 1 Copper, Earth = 1 Silver; items listed
   cheapest-first.

7. **US7 — starting state**: After Hard Reset → Reel tab shows 1 Air, 1 Water, 1 Apple, 1 Copper;
   currency display shows 10 Air, 10 Water, 100 Food.

8. **US8 — cheat**: Perform the secret trigger → cheat panel opens → set a resource (e.g., Gold = 50)
   → currency display updates. Confirm the cheat is invisible/unreachable during normal play and that
   invalid input (negative/non-numeric) is ignored.

9. **US9 — unified action selector**: In the magic phase, confirm there is only one place to pick an
   action — the magic guide rows. Click a row → it becomes the active selection (highlighted); click
   another → selection moves; click the active row again → selection clears. An unaffordable row is
   not selectable. With swap active and one cell chosen, the "select 2nd cell" hint shows in the
   guide. Confirm the old separate toggle button strip is gone.

## Constitution spot-checks

- Layout intact at 720 × 1280 px; no overflow/clipping from new indicators.
- No input accepted during an active spin or respin.
- Currency display updates atomically.
- Bundle delta reported (before/after gzipped) in the PR.
