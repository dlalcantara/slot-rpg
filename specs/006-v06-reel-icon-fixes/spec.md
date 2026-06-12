# Feature Specification: v0.6 Reel Icon Controls, UI Layout & Bug Fixes

**Feature Branch**: `006-v06-reel-icon-fixes`

**Created**: 2026-06-12

**Status**: Draft

**Input**: User description: "@06spec"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Enable/Disable Reel Icons (Priority: P1)

A player wants to customise which icons appear when the reel spins. From the Reels tab they can toggle individual icons off so those icons are excluded from spin outcomes. The game protects a minimum of 12 active icons to keep the reel viable.

**Why this priority**: This is the primary new feature in v0.6 and directly affects gameplay strategy.

**Independent Test**: Navigate to the Reels tab, purchase enough icons to have 13+, then toggle individual icons off and confirm they no longer appear in spin results.

**Acceptance Scenarios**:

1. **Given** the player has 13 or more icons unlocked, **When** they click a toggle to disable an icon, **Then** that icon is marked as disabled and excluded from future spins.
2. **Given** the player has exactly 12 icons enabled, **When** they attempt to disable another icon, **Then** the toggle is inert and the icon remains enabled (cannot drop below 12 enabled).
3. **Given** the player has fewer than 13 icons total (reel starts at 4), **When** they view the Reels tab, **Then** disable toggles are not available (all icons must remain active).
4. **Given** an icon is disabled, **When** the player re-enables it via its toggle, **Then** it is included in future spins.

---

### User Story 2 - SPIN and CLAIM Same Screen Position (Priority: P2)

During a spin session the player should not need to move the mouse between the SPIN button and the CLAIM button. After spinning, the CLAIM button appears in the same location as SPIN. During the magic phase the control order is swapped so CLAIM occupies the SPIN position while magic-phase controls appear above it (matching the layout of the spin-phase toggles above SPIN).

**Why this priority**: Reduces friction during the core gameplay loop.

**Independent Test**: Perform a full spin-to-claim cycle and confirm the mouse does not need to move between SPIN and CLAIM.

**Acceptance Scenarios**:

1. **Given** no spin is in progress, **When** the player views the slot machine, **Then** the SPIN button occupies its standard position.
2. **Given** a spin has resolved and no magic phase is active, **When** the result is displayed, **Then** CLAIM occupies the exact pixel area previously occupied by SPIN, with no mouse movement required.
3. **Given** a magic phase is active, **When** the player views the controls, **Then** CLAIM is shown first (in the SPIN position) and magic phase controls are displayed above it, mirroring the toggle-above-SPIN layout used during the spin phase.

---

### User Story 3 - Accurate Boost Value Behaviour (Priority: P3)

The Boost Value ability should increase the value of only the specific clicked cell by exactly +1 per activation, and it should trigger the Master of Elements passive when appropriate.

**Why this priority**: Fixes multiple related bugs in a single core ability; all three sub-fixes are tested together.

**Independent Test**: Activate Boost Value on one cell, verify only that cell's value increases by 1, activate again and verify it increases by exactly 1 more, then confirm Master of Elements fires.

**Acceptance Scenarios**:

1. **Given** a results grid is displayed, **When** the player activates Boost Value on a specific cell, **Then** only that cell's displayed value increases; all other cells remain unchanged.
2. **Given** a cell has been boosted once (+1), **When** the player activates Boost Value on the same cell again, **Then** the cell value increases by exactly +1 (not +2 or more).
3. **Given** a boost activation qualifies for Master of Elements, **When** Boost Value is used, **Then** Master of Elements triggers as expected.

---

### User Story 4 - Stable Spin Animations (Priority: P4)

Visual animations during spinning must be consistent and correct. Air Spin results must not produce an expanding column. Locked columns must display no spin animation (they are frozen in place). The lock indicator must sit below its column without displacing adjacent columns.

**Why this priority**: Visual integrity bugs reduce perceived quality; grouping related animation/layout fixes.

**Independent Test**: Trigger an Air Spin and verify column widths stay constant. Lock a column and spin, verifying it does not animate. Lock multiple columns and verify layout is stable.

**Acceptance Scenarios**:

1. **Given** an Air Spin is triggered, **When** the spin animation plays, **Then** the affected column width remains constant throughout (no growing column artefact).
2. **Given** a column is locked, **When** the reels spin, **Then** the locked column displays no spin animation.
3. **Given** one or more columns are locked, **When** the player views the reel display, **Then** the lock indicator is positioned below its column, has a width ≤ the column icon width, and does not shift any column horizontally.

---

### User Story 5 - Currency Auto-Conversion for Purchases (Priority: P5)

When a player attempts to buy an item but lacks the exact currency denomination, the game automatically converts higher-denomination currency to cover the cost.

**Why this priority**: Fixes a blocking bug where players with value in higher denominations cannot spend it.

**Independent Test**: With 0 copper and some silver, attempt to purchase a copper-priced item and verify the purchase succeeds via automatic silver-to-copper conversion.

**Acceptance Scenarios**:

1. **Given** the player has 0 copper but has silver or gold, **When** they attempt to buy a copper-cost item, **Then** the purchase succeeds by converting the minimum required silver (or gold) into copper.
2. **Given** the player has 0 silver but has gold, **When** they attempt to buy a silver-cost item, **Then** the purchase succeeds by converting the minimum required gold into silver.
3. **Given** the player has insufficient total funds across all denominations, **When** they attempt a purchase, **Then** the purchase is declined with a clear message.

---

### Edge Cases

- What happens when the player has exactly 12 icons enabled and tries to disable one via keyboard or alternative input?
- How does the currency conversion handle fractional conversion (e.g., 1 silver = 10 copper: does buying a 3-copper item leave 7 copper change)?
- What happens if Boost Value is activated on a cell that is already at the display maximum?
- What if both a lock and an Air Spin are active on the same column simultaneously?

## Requirements *(mandatory)*

### Functional Requirements

**Icon Controls**

- **FR-001**: The Reels tab MUST display an enable/disable toggle for each unlocked icon.
- **FR-002**: The system MUST prevent disabling an icon when doing so would bring the enabled icon count below 12.
- **FR-003**: When a player has fewer than 13 total unlocked icons, all icon toggles MUST be non-interactive (disable action unavailable).
- **FR-004**: Disabled icons MUST be excluded from all spin outcomes while disabled.

**SPIN / CLAIM Layout**

- **FR-005**: The CLAIM button MUST occupy the same screen position as the SPIN button after a spin resolves (outside magic phase).
- **FR-006**: During the magic phase, the CLAIM button MUST appear in the SPIN button's position and magic phase controls MUST be displayed above it, retaining the same visual structure as the toggles-above-SPIN layout used during the spin phase.

**Boost Value**

- **FR-007**: Activating Boost Value on a cell MUST increase only that cell's value; no other cell values may change.
- **FR-008**: Each activation of Boost Value on a cell MUST increase its value by exactly +1, regardless of how many times it has previously been boosted.
- **FR-009**: Boost Value activations MUST trigger the Master of Elements passive when applicable.

**Animations & Layout**

- **FR-010**: The Air Spin animation MUST NOT cause any column to change width during playback.
- **FR-011**: Locked columns MUST display no spin animation when the reels spin.
- **FR-012**: The lock indicator MUST be placed below its column and MUST have a width ≤ the column icon width.
- **FR-013**: Displaying or hiding lock indicators MUST NOT shift any column's horizontal position.

**Currency**

- **FR-014**: When purchasing an item priced in copper and the player has 0 copper but sufficient silver or gold, the system MUST automatically convert the minimum amount of higher-denomination currency needed and complete the purchase.
- **FR-015**: When purchasing an item priced in silver and the player has 0 silver but sufficient gold, the system MUST automatically convert the minimum amount of gold needed and complete the purchase.

### Key Entities

- **Reel Icon**: An icon that may appear on the slot reel; has an enabled/disabled state independent of its unlocked status.
- **Spin Result Cell**: A single cell in the post-spin results grid; has an independent value that can be boosted.
- **Column Lock**: A per-column flag that freezes column state across spins; affects both animation and value persistence.
- **Currency Denomination**: Copper, silver, or gold; each has a conversion rate to the next denomination.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Players with 13+ icons can toggle any individual icon off within 1 interaction and have it excluded from the very next spin.
- **SC-002**: Players can complete a full spin-to-claim sequence without moving the mouse between the SPIN and CLAIM targets.
- **SC-003**: Boost Value applied N times to a single cell increases that cell's value by exactly N; no adjacent cells are affected.
- **SC-004**: Master of Elements triggers on 100% of qualifying Boost Value activations.
- **SC-005**: Air Spin, lock indicators, and column layouts render without any size or position artefacts across all supported screen sizes.
- **SC-006**: Players with 0 copper (but silver or gold) can successfully complete any copper-cost purchase without manual currency management.

## Assumptions

- Currency conversion ratios (e.g., silver-to-copper) are already defined in the game data; this feature reuses them without change.
- "At least 13 enabled icons" is the threshold for allowing disabling, meaning the player must have 13 icons enabled *after* any disable (i.e., they need 13 to start disabling, leaving 12 minimum).
- The magic phase control layout change applies only during an active magic phase; outside the magic phase the original SPIN button position and order are restored.
- "Same visual location" for SPIN and CLAIM means the buttons share the same bounding box / anchor point; size may vary but the top-left or centre anchor is identical.
- Boost Value's +1 increment applies to the displayed face value of the cell result, not an internal multiplier.
- Master of Elements eligibility is determined by existing game logic; this fix ensures Boost Value activations are passed through that logic correctly.
