# Feature Specification: Version 0.5 Visual Fixes

**Feature Branch**: `005-v05-visual-fixes`

**Created**: 2026-06-12

**Status**: Draft

**Input**: User description: "Version 0.5 Visual Fixes — fix slot animation ending on empty cells, make magic ability results (air/water) visible, animate respin, clarify locked columns and click targets, rebalance and reorder market element costs, update starting deck and resources, and add a developer cheat to modify resources."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Slot animation ends on the real result (Priority: P1)

A player spins the reels. As each column stops, it lands directly on its final symbols. The player
never sees a flash of empty cells between the spinning animation and the result.

**Why this priority**: This is the most visible and most frequently encountered defect — every spin
exhibits it. A spin that flashes empty cells looks broken and undermines trust in every payout that
follows.

**Independent Test**: Spin with animation enabled and confirm that, at the moment each column stops,
it shows its final symbols with no intermediate empty/blank frame.

**Acceptance Scenarios**:

1. **Given** animation is enabled, **When** the player spins and the columns stop, **Then** each
   column transitions straight from spinning symbols to its final result with no empty-cell frame.
2. **Given** animation is disabled, **When** the player spins, **Then** the result symbols appear
   immediately with no empty-cell frame.

---

### User Story 2 - Magic ability results are shown on the grid (Priority: P1)

During the Magic Phase a player uses an ability that changes the grid (for example respin via Air, or
swap via Water). The grid on screen immediately updates to reflect the new contents so the player can
see the outcome of the ability they just paid for.

**Why this priority**: The abilities already compute correct results internally, but the player cannot
see them. Without visible feedback the abilities feel non-functional and the player cannot make
informed decisions before claiming.

**Independent Test**: Enter the Magic Phase, use Air (respin) on a column and Water (swap) on two
cells, and confirm the displayed grid changes to match the new contents each time.

**Acceptance Scenarios**:

1. **Given** the player is in the Magic Phase, **When** they respin a column with Air, **Then** the
   displayed grid updates to show that column's new symbols.
2. **Given** the player is in the Magic Phase, **When** they swap two cells with Water, **Then** the
   displayed grid updates to show the cells in their swapped positions.
3. **Given** any grid-changing ability is used, **When** the change is applied, **Then** the value
   shown to the player matches what will be used when they claim.

---

### User Story 3 - Respin is animated when animation is on (Priority: P2)

When the player uses the respin (Air) ability and animation is enabled, the selected column visibly
respins before settling on its new symbols, matching the feel of a normal spin.

**Why this priority**: Reinforces that the ability did something and keeps the visual language
consistent with the main spin. Lower priority than simply showing the result (Story 2), which must
work regardless of the animation setting.

**Independent Test**: Enable animation, enter the Magic Phase, respin a column, and confirm that
column animates before showing its new result. Disable animation and confirm the result appears
instantly.

**Acceptance Scenarios**:

1. **Given** animation is enabled and the player is in the Magic Phase, **When** they respin a
   column, **Then** only that column animates and then settles on its new symbols.
2. **Given** animation is disabled, **When** the player respins a column, **Then** the new symbols
   appear immediately without animation.

---

### User Story 4 - Locked columns are clearly indicated (Priority: P2)

When the player locks a column using the Earth ability, the column is visibly marked as locked so the
player understands at a glance which columns will not change on the next spin.

**Why this priority**: Locking is a paid action whose effect is otherwise invisible until the next
spin; players need confirmation that the lock took effect and which column it applies to.

**Independent Test**: Lock a column with Earth and confirm a clear, persistent locked indication
appears on that column.

**Acceptance Scenarios**:

1. **Given** the player uses Earth to lock a column, **When** the lock is applied, **Then** that
   column shows a clear, distinct locked indication.
2. **Given** a column is locked, **When** the player views the grid, **Then** the locked state is
   distinguishable from unlocked columns without additional interaction.

---

### User Story 5 - Clear click targets for column abilities (Priority: P2)

When the player is using an ability that targets a whole column (respin via Air, lock via Earth), the
game clearly indicates where to click to affect a column, so selecting a column is easy and
unambiguous.

**Why this priority**: Players currently find it hard to click a column. Clear affordances reduce
mis-clicks and frustration, improving the core Magic Phase interaction.

**Independent Test**: Activate the respin (or lock) ability and confirm there is a clear, obvious
target indication for each selectable column before clicking.

**Acceptance Scenarios**:

1. **Given** the respin or lock ability is active, **When** the player looks at the grid, **Then**
   each column presents a clear indication of where to click to select it.
2. **Given** a column-targeting ability is active, **When** the player hovers or focuses a column,
   **Then** the selectable target is visually emphasized.

---

### User Story 6 - Rebalanced and ordered market (Priority: P2)

The market sells elements at revised prices and lists items in ascending price order, so the cheaper
elements are easy to find and buy.

**Why this priority**: A balance and usability change that affects the economy the player interacts
with on every market visit, but it does not block the core spin/magic loop.

**Independent Test**: Open the market and confirm Air costs 1 copper, Water costs 1 copper, Earth
costs 1 silver, and all items are listed cheapest-first.

**Acceptance Scenarios**:

1. **Given** the player opens the market, **When** the items are displayed, **Then** Air is priced at
   1 copper, Water at 1 copper, and Earth at 1 silver.
2. **Given** the player opens the market, **When** the items are displayed, **Then** items appear in
   ascending order of price.

---

### User Story 7 - Updated starting deck and resources (Priority: P2)

A new game begins with a defined starting deck and starting resource balances, giving the player an
immediate ability to engage with elemental mechanics.

**Why this priority**: Sets the opening experience and ensures new players can use elemental abilities
right away, but it is a one-time setup rather than an ongoing interaction.

**Independent Test**: Start a fresh game and confirm the deck contains exactly 1 Air, 1 Water, 1 Food,
and 1 Copper, and that resources start at 10 Air, 10 Water, and 100 Food.

**Acceptance Scenarios**:

1. **Given** a new game, **When** it begins, **Then** the starting deck contains exactly 1 Air, 1
   Water, 1 Food, and 1 Copper symbol.
2. **Given** a new game, **When** it begins, **Then** the player has 10 Air, 10 Water, and 100 Food.

---

### User Story 8 - Developer cheat to modify resources (Priority: P3)

A hidden developer cheat lets a tester directly set or adjust resource balances, for use during
development and as a retained easter egg.

**Why this priority**: A development/testing convenience and easter egg; valuable but not part of the
normal player journey, so it ranks lowest.

**Independent Test**: Trigger the cheat, set a resource to a chosen amount, and confirm the displayed
balance updates accordingly.

**Acceptance Scenarios**:

1. **Given** the player triggers the hidden cheat, **When** they set a resource amount, **Then** that
   resource balance updates to the chosen value.
2. **Given** the cheat is not triggered, **When** the player plays normally, **Then** the cheat is not
   visible and does not interfere with normal play.

---

### User Story 9 - Unified magic action selector (Priority: P2)

During the Magic Phase the player selects which ability to perform by clicking directly on the
ability's row in the magic guide (the row that shows the ability, its cost, and availability). There
is a single place to choose an action, rather than a separate set of toggle buttons duplicating the
guide.

**Why this priority**: The Magic Phase currently presents two parallel controls — a row of action
toggle buttons and a separate informational rules guide — with no visual link between them, which
confuses players about how to pick an action. Merging them into one clickable guide removes the
duplication and makes selection obvious. It improves the core Magic Phase interaction but does not
block the spin/claim loop.

**Independent Test**: Enter the Magic Phase and confirm that clicking an ability row in the guide
selects that ability (highlighted as active), that clicking it again or choosing another row changes
the selection, and that the separate duplicate toggle buttons no longer exist.

**Acceptance Scenarios**:

1. **Given** the player is in the Magic Phase, **When** they click an ability's row in the guide,
   **Then** that ability becomes the active selection and is visually indicated as selected.
2. **Given** an ability row is selected, **When** the player clicks a different ability's row, **Then**
   the selection moves to that ability.
3. **Given** an ability row is selected, **When** the player clicks the same row again, **Then** the
   selection is cleared (no ability active).
4. **Given** an ability is unaffordable or unavailable, **When** the player views its row, **Then**
   the row indicates it cannot be selected and selecting it has no effect.
5. **Given** the swap ability is active and one cell is chosen, **When** the player needs to pick the
   second cell, **Then** the in-progress hint (e.g., "select 2nd cell") is shown within the unified
   guide.

---

### Edge Cases

- What happens when a respin lands on the same symbols it started with? The animation/result still
  completes cleanly with no empty-cell frame.
- How does the grid display behave when an ability is used on a locked column? Locked columns remain
  unchanged and continue to show their locked indication.
- What happens when the player disables animation mid-session? Both the main spin and the respin
  ability show results instantly, still without empty-cell frames.
- How does the cheat behave with invalid input (negative or non-numeric amount)? The cheat rejects or
  ignores invalid input and leaves balances unchanged.
- What happens to an existing saved game when starting values change? Saved games retain their stored
  balances; only newly started games use the new starting deck and resources.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The slot spin animation MUST end with each column displaying its final result symbols,
  with no intermediate empty/blank cell frame between the spinning animation and the result.
- **FR-002**: When a Magic Phase ability changes grid contents, the displayed grid MUST update to
  reflect the new contents so the result is visible to the player before claiming.
- **FR-003**: The grid value shown to the player after an ability is applied MUST match the value used
  when computing the claimed payout.
- **FR-004**: When animation is enabled, using the respin (Air) ability MUST visibly animate the
  selected column before it settles on its new symbols; only the targeted column animates.
- **FR-005**: When animation is disabled, ability results (including respin) MUST appear immediately
  without animation and without empty-cell frames.
- **FR-006**: A locked column (via Earth) MUST display a clear, persistent indication that it is
  locked, distinguishable from unlocked columns.
- **FR-007**: When a column-targeting ability (respin or lock) is active, the game MUST clearly
  indicate where the player should click to select each column.
- **FR-008**: The market MUST price Air at 1 copper, Water at 1 copper, and Earth at 1 silver.
- **FR-009**: The market MUST list purchasable items in ascending order of price.
- **FR-010**: A new game MUST start with a deck containing exactly 1 Air, 1 Water, 1 Food, and 1
  Copper symbol.
- **FR-011**: A new game MUST start with resource balances of 10 Air, 10 Water, and 100 Food.
- **FR-012**: The game MUST provide a hidden cheat that lets the player set or modify resource
  balances.
- **FR-013**: The cheat MUST remain hidden and inactive during normal play and MUST NOT affect the
  normal player experience unless deliberately triggered.
- **FR-014**: The Magic Phase MUST present a single action selector: clicking an ability's row in the
  magic guide MUST select that ability, with the active ability clearly indicated. Separate duplicate
  action toggle controls MUST NOT be presented.
- **FR-015**: In the unified selector, clicking the active ability's row again MUST clear the
  selection, and an unaffordable/unavailable ability's row MUST not be selectable; in-progress hints
  (such as the swap "select 2nd cell" prompt) MUST appear within the unified guide.

### Key Entities *(include if feature involves data)*

- **Starting Deck**: The set of symbols a new game begins with — for v0.5: 1 Air, 1 Water, 1 Food, 1
  Copper.
- **Starting Resources**: Initial currency balances for a new game — 10 Air, 10 Water, 100 Food (other
  currencies start at their existing defaults).
- **Market Item**: A purchasable element with a price; v0.5 sets Air = 1 copper, Water = 1 copper,
  Earth = 1 silver, and orders items cheapest-first.
- **Magic Grid**: The on-screen grid shown during the Magic Phase, which must reflect the current
  contents after each ability is applied.
- **Locked Column**: A column marked as not changing on the next spin, requiring a clear visual
  indication.
- **Cheat Input**: A hidden mechanism for entering resource adjustments used during development.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of spins (animation on or off) end with the final result visible and zero
  empty-cell frames observed.
- **SC-002**: 100% of grid-changing abilities (respin, swap) produce a visible grid update matching
  the value used at claim time.
- **SC-003**: With animation enabled, a respin visibly animates only the targeted column in 100% of
  uses.
- **SC-004**: A first-time observer can correctly identify every locked column without prompting.
- **SC-005**: A first-time observer can identify where to click to select a column when a
  column-targeting ability is active, with no mis-clicks needed before selecting the intended column.
- **SC-006**: The market displays Air at 1 copper, Water at 1 copper, Earth at 1 silver, ordered
  cheapest-first, on 100% of market views.
- **SC-007**: 100% of new games start with the specified deck (1 Air, 1 Water, 1 Food, 1 Copper) and
  resources (10 Air, 10 Water, 100 Food).
- **SC-008**: A developer can change any resource balance via the cheat within 15 seconds, and the
  cheat is not discoverable during normal play without knowing the trigger.
- **SC-009**: The Magic Phase presents exactly one action-selection control; a first-time player can
  select an ability by clicking its guide row on the first attempt, with no duplicate toggle controls
  present.

## Assumptions

- "1 Food" in the starting deck refers to the existing food-producing symbol (the Apple icon), which
  awards Food; no new "Food" symbol type is introduced.
- The starting-resource change applies only to newly started games; existing saved games keep their
  stored balances (the new values take effect after a hard reset / new game).
- Currencies not mentioned (Copper, Silver, Gold, Crowns, Earth, Fire) keep their current starting
  amounts; only Air, Water, and Food starting balances are changed.
- "Ascending order" in the market means lowest total price first, comparing across currency tiers
  (Copper < Silver < Gold), with elements appearing among existing items in that order.
- The cheat is triggered by a deliberate hidden action (e.g., a key sequence or hidden control) and
  presents a simple way to set resource amounts; exact trigger and presentation are left to design as
  long as it stays hidden during normal play and is retainable as an easter egg.
- Existing Magic Phase mechanics (costs, counters, lock limits, Master of Elements) are unchanged
  except where this spec adds visual feedback; this feature is visual/configuration-focused and does
  not alter payout math.
- The mobile-first single-screen layout and existing tabs (Reel, Spin, Market) are retained.
