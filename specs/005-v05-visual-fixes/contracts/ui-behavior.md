# Contract: UI Behavior (v0.5)

Observable, testable UI contracts. "Rendered" means present in the DOM / visible text or attributes
queryable by @testing-library; visual styling specifics (exact colors) are verified manually per
quickstart but the presence of an indicator element is asserted in tests where practical.

## UC-1 — Spin settles on the real result (FR-001)

- **Given** animation on, **When** every column has stopped (`onSpinDone` fired), **Then** the grid
  text shows the freshly spun symbols (the same `magicGrid` the magic phase will use) and never an
  all-blank/placeholder column between the shuffle and the result.
- **Given** animation off, **When** the player spins, **Then** the result symbols render immediately
  with no placeholder frame.

## UC-2 — Magic edits re-render (FR-002, FR-003)

- **Given** the magic phase, **When** `MAGIC_RESPIN` updates a column, **Then** that column's rendered
  symbols change to the new column's symbols.
- **Given** the magic phase, **When** `MAGIC_SWAP` swaps two cells, **Then** the two cells render in
  their swapped positions.
- **Given** a boosted cell (`MAGIC_INCREASE_VALUE`), **When** applied, **Then** the displayed value
  override matches the value used at `CLAIM`.

## UC-3 — Respin animation (FR-004, FR-005)

- **Given** animation on, **When** the player respins column *i*, **Then** only column *i* shows the
  shuffle animation, after which it settles on the new symbols.
- **Given** animation off, **When** the player respins column *i*, **Then** column *i* updates
  immediately with no animation.
- During an active respin animation, input on that column is not accepted (consistent with the global
  spin behavior).

## UC-4 — Locked-column indicator (FR-006)

- **Given** a column is locked via Earth, **Then** that column renders a clear, persistent locked
  indicator (padlock badge + distinct border/label) distinguishable from unlocked columns without
  interaction.
- The indicator persists for as long as the column is locked.

## UC-5 — Column click target (FR-007)

- **Given** the respin or lock ability mode is active, **Then** each column renders a clear,
  emphasized click target indicating where to click to select it.
- **Given** a column-targeting mode is active, **When** the player hovers/focuses a column, **Then**
  that column's target is visually emphasized.
- The affordance is absent (or de-emphasized) when no column-targeting mode is active.

## UC-6 — Market ordering & prices (FR-008, FR-009)

- **Given** the market is open, **Then** Air shows cost "1 Copper", Water shows "1 Copper", Earth
  shows "1 Silver".
- **Given** the market is open, **Then** items are rendered in ascending normalized-price order
  (cheapest first).

## UC-7 — New-game deck & resources (FR-010, FR-011)

- **Given** a new game (`HARD_RESET` / fresh init), **Then** the reel contains exactly 1 Air, 1 Water,
  1 Apple (Food), 1 Copper.
- **Given** a new game, **Then** the currency display shows 10 Air, 10 Water, 100 Food.

## UC-9 — Unified magic action selector (FR-014, FR-015)

- **Given** the magic phase, **Then** action selection is presented in exactly one place — the magic
  guide rows — and the separate toggle button strip is not rendered.
- **Given** the magic phase, **When** the player clicks an ability's guide row, **Then** that ability
  becomes the active `magicMode` and the row is rendered as selected.
- **Given** an ability row is selected, **When** the player clicks a different row, **Then** the
  active mode moves to that ability; **When** they click the same row again, **Then** the mode clears.
- **Given** an ability is unaffordable/unavailable, **Then** its row is rendered as non-selectable and
  clicking it does not change the active mode.
- **Given** swap mode is active and the first cell is chosen, **Then** the "select 2nd cell" hint is
  rendered within the unified guide.
- The grid click-handling (respin/lock on column click, swap/boost on cell click) continues to work
  using the lifted `magicMode`.

## UC-8 — Cheat hidden & functional (FR-012, FR-013)

- **Given** normal play, **Then** no cheat control is visible and no cheat affordance is reachable
  without the secret trigger.
- **Given** the secret trigger is performed, **When** the player sets a resource amount, **Then** the
  currency display updates to the new amount.
- Invalid cheat input (negative / non-numeric) leaves balances unchanged.
