# Quickstart: Version 1.0 Release Polish

**Branch**: `010-v10-release`

## Prerequisites

- Node.js ≥ 18
- npm

## Setup

```bash
npm install
```

## Development

```bash
npm run dev        # Vite dev server at http://localhost:5173
```

## Verify changes manually

| Change               | How to verify |
|----------------------|---------------|
| Emoji icons          | Open game; icons on reel and in Reels Store should show emoji, not text |
| Currency panel       | Panel shows 2 rows of 5; order is Apple, Copper, Silver, Gold, Crowns / Air, Water, Earth, Fire, Spins |
| Food → Apple         | Currency panel, Reels Store cost labels, and achievement descriptions all say "Apple" |
| Help modals          | Click ❓ next to "Slot RPG" title; click ❓ on each tab |
| x1 button removed    | Spin tab: only Animate and Auto-convert controls remain |
| Market → Reels Store | Tab label and heading both read "Reels Store" |
| Feats order          | "Blow It Up" appears above "Be Water, My Friend" |
| Achievement fixes    | "Second breakfast" and "Master of Elements" descriptions match spec |

## Quality gates

```bash
npm run typecheck   # Must exit 0
npm run lint        # Must exit 0 (zero errors)
npm run test:run    # All tests pass
npm run build       # Bundle compiles; check gzip size ≤ 250 KB
```

## Mobile check

Open at 720 × 1280 px (Chrome DevTools responsive mode). Verify:
- Help modals are readable and fully visible
- Currency panel 2×5 grid is not clipped
- Reel icons (emoji) fit within 48 × 48 px bounding boxes
