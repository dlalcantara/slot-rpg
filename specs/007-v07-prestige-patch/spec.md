# Feature Specification: Version 0.7 Prestige Patch

**Feature Branch**: `007-v07-prestige-patch`

**Created**: 2026-06-12

**Status**: Draft

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Block Column Ability (Priority: P1)

During the Magic Phase of a spin, a player wants to strategically remove an unfavorable column from the result to improve their chances of completing a winning combination.

**Why this priority**: This is a core mechanical change that replaces an existing ability (Lock Column → Block Column). It changes the fundamental gameplay loop and affects how the spin results are evaluated.

**Independent Test**: Open the Spin tab, enter the Magic Phase, and use the Block Column action. Verify the targeted column disappears from the result set and is not counted toward winning combination requirements.

**Acceptance Scenarios**:

1. **Given** the Magic Phase is active and no columns have been blocked, **When** the player uses Block Column on a column, **Then** all icons in that column are removed from the spin result and that column is no longer required for rewards, costing 1 Earth.
2. **Given** one column has already been blocked, **When** the player uses Block Column again, **Then** a second column is removed at a cost of 2 Earth.
3. **Given** four columns have been blocked, **When** the player views the Block Column action, **Then** the action is disabled/unavailable (maximum reached).
4. **Given** a column has been blocked during a spin, **When** the player clicks Claim, **Then** the blocked state resets so all columns are active for the next spin.
5. **Given** the multiplier is set to x10 during the Magic Phase, **When** the player uses Block Column, **Then** the Earth cost is multiplied: first block costs 10 Earth, second costs 20 Earth, etc.

---

### User Story 2 - Magic Phase Visual Feedback (Priority: P1)

During the Magic Phase, a player wants to immediately see which icons are close to completing a winning combination so they can make informed decisions about respins and column blocking.

**Why this priority**: Color-coded feedback is tightly coupled with the Magic Phase interaction loop — players need this information to decide whether to respin or block columns.

**Independent Test**: Trigger the Magic Phase after a spin. Verify that icons appearing in every column get a green border and icons missing from exactly one column get a yellow border.

**Acceptance Scenarios**:

1. **Given** an icon appears in all active (non-blocked) columns after a spin, **When** the Magic Phase displays, **Then** every cell containing that icon has a green border.
2. **Given** an icon appears in all active columns except exactly one, **When** the Magic Phase displays, **Then** every cell containing that icon has a yellow border.
3. **Given** an icon appears in fewer active columns than "all minus one," **When** the Magic Phase displays, **Then** no color border is applied to that icon.
4. **Given** the Magic Phase is active, **When** the player performs a respin or blocks a column, **Then** the color borders update to reflect the new effective result.

---

### User Story 3 - Multiplier Lock During Magic Phase (Priority: P2)

During the Magic Phase, the player cannot accidentally change the x1/x10/x100 multiplier toggle, preventing unintended cost escalation for abilities.

**Why this priority**: This is a safeguard to prevent accidental high-cost ability usage during the sensitive Magic Phase.

**Independent Test**: Enter the Magic Phase and attempt to click the multiplier toggle. Verify it cannot be changed.

**Acceptance Scenarios**:

1. **Given** the Magic Phase is active, **When** the player clicks the x1|x10|x100 toggle, **Then** the toggle does not change its value.
2. **Given** the Magic Phase is active with multiplier at x10, **When** the player uses a respin, **Then** the respin costs the x10-multiplied amount of Air.
3. **Given** the Magic Phase ends (player claims), **When** the player views the multiplier toggle, **Then** the toggle is interactive again.

---

### User Story 4 - Claim Toast Notification (Priority: P2)

When a player claims their spin result, they see a brief, unobtrusive toast notification instead of a modal results dialog, keeping the game flow fast and smooth.

**Why this priority**: UI polish that reduces friction in the core gameplay loop.

**Independent Test**: Complete a spin and click Claim. Verify a toast notification appears briefly and the results dialog is gone.

**Acceptance Scenarios**:

1. **Given** the player has completed a spin, **When** the player clicks Claim, **Then** a small toast notification appears summarizing the reward and automatically dismisses after a short duration.
2. **Given** the toast notification appears, **When** it is displayed, **Then** it does not block interaction with the rest of the game UI.
3. **Given** the player claims a spin with no reward, **When** the toast appears, **Then** it indicates no reward was earned.

---

### User Story 5 - Market Purchase Limits (Priority: P2)

A player browsing the market cannot buy more than 3 total copies of any given icon across their reel and market purchases combined, preventing over-stacking of any single icon.

**Why this priority**: Core balance change that caps collection depth.

**Independent Test**: Open the Market tab. Verify that icons the player already has 3 copies of show as unavailable to purchase. Verify starting icons (apple, air, water, copper) show only 2 copies available for purchase.

**Acceptance Scenarios**:

1. **Given** the player already owns 3 copies of the Copper icon, **When** the player views Copper in the market, **Then** Copper is unavailable for purchase.
2. **Given** a player starts a new game (with 1 Apple, 1 Air, 1 Water, 1 Copper in their starting reel), **When** the player opens the Market, **Then** Apple, Air, Water, and Copper each show a maximum of 2 purchasable copies; all other icons show 3 purchasable copies.
3. **Given** the player has purchased 2 of their allotted copies of an icon, **When** 1 purchase remains, **Then** the market allows exactly 1 more purchase of that icon.

---

### User Story 6 - Apple Market Pricing Rebalance (Priority: P2)

A player buying Apple combinations from the market sees updated pricing: 2x Apple costs 1 silver, and 3x Apple costs 1 gold.

**Why this priority**: Balance adjustment tied to the purchase limit changes.

**Independent Test**: Open the Market tab and locate Apple bundle listings. Verify the price and quantity of each Apple listing.

**Acceptance Scenarios**:

1. **Given** the player views the Market, **When** looking at Apple offerings, **Then** there is a "2x Apple" listing priced at 1 silver.
2. **Given** the player views the Market, **When** looking at Apple offerings, **Then** there is a "3x Apple" listing priced at 1 gold.
3. **Given** previous listings for other Apple bundle sizes existed, **When** the player views the Market, **Then** those old listings no longer appear.

---

### User Story 7 - Starting Currency Rebalance (Priority: P2)

A new game starts with 10 food, 10 air, 10 water, and 0 of all other currencies, establishing a consistent baseline for resource availability.

**Why this priority**: Starting state change that affects all early-game balance.

**Independent Test**: Start a new game and check all currency balances.

**Acceptance Scenarios**:

1. **Given** a new game is started, **When** the player checks their currencies, **Then** food = 10, air = 10, water = 10, and all other currencies = 0.

---

### User Story 8 - Reel Icon Grouping Display (Priority: P3)

In the Reel tab, icons are displayed grouped by type so the player can easily see how many copies of each icon they own.

**Why this priority**: Visual improvement to the Reel tab that supports the prestige mechanic by making copy counts obvious.

**Independent Test**: Open the Reel tab with a reel containing multiple copies of at least one icon. Verify identical icons are grouped together.

**Acceptance Scenarios**:

1. **Given** the player has 3 copies of Fire in their reel, **When** viewing the Reel tab, **Then** all 3 Fire icons appear consecutively, not scattered randomly.
2. **Given** the player has icons of multiple types, **When** viewing the Reel tab, **Then** all copies of each icon type are grouped together.

---

### User Story 9 - Enable/Disable Icons Removed (Priority: P3)

The ability to enable or disable individual icons in the Reel tab is removed, simplifying the interface.

**Why this priority**: Cleanup that simplifies the UI before the prestige mechanic is added.

**Independent Test**: Open the Reel tab. Verify there are no enable/disable toggles for individual icons.

**Acceptance Scenarios**:

1. **Given** the player opens the Reel tab, **When** viewing their icons, **Then** no enable/disable toggle or control is visible for any icon.

---

### User Story 10 - Prestige System (Priority: P3)

A player who has accumulated 4 or more icon types with 3 copies each can trigger Prestige: they select which icons to carry forward (minimum 4), reset their currency and reel, and continue with a leaner deck and retained spin counter.

**Why this priority**: The headline feature of this patch, but depends on grouped display, copy-count visibility, and purchase limits being in place first.

**Independent Test**: Accumulate 4 icon types with 3 copies each. Verify the Prestige button becomes available. Trigger prestige, select 4 icons, and verify the reel resets to 1 copy of each selected icon, currency resets, and the spin counter is preserved.

**Acceptance Scenarios**:

1. **Given** the player has exactly 3 icon types with 3 copies each, **When** viewing the Reel tab, **Then** the Prestige button is disabled/hidden.
2. **Given** the player has 4 or more icon types with 3 copies each, **When** viewing the Reel tab, **Then** the Prestige button is enabled.
3. **Given** the Prestige button is clicked, **When** the selection UI appears, **Then** the player can select from icons they have 3 copies of, and must select at least 4.
4. **Given** the player selects 5 icons and confirms Prestige, **When** the prestige completes, **Then** the reel contains exactly 1 copy of each of those 5 icons and no other icons.
5. **Given** prestige completes, **When** the player checks currencies, **Then** food = 10, air = 10, water = 10, and all other currencies = 0.
6. **Given** the player had a spin counter of 47 before prestige, **When** prestige completes, **Then** the spin counter still shows 47.
7. **Given** the Reel tab is visible, **When** the player reads the tab, **Then** a brief explanation of how prestige works is visible.

---

### Edge Cases

- When the player has insufficient Earth (accounting for the active multiplier) to pay for the next Block Column, the Block Column action is disabled.
- The spin reward is calculated as the product of each winning icon's count across all non-blocked columns. For example, if an icon appears 1×1×1×3 in four columns and is absent from the fifth, blocking the fifth column yields a reward of 3; without blocking, the reward is 0 because not all required columns are satisfied. A player may also choose to block a column that has a high icon count, accepting a reduced reward.
- When multiple claims occur in rapid succession, only the most recent toast notification is shown; earlier ones are replaced.

## Requirements *(mandatory)*

### Functional Requirements

**Market**

- **FR-001**: The market MUST limit purchases of any single icon to a maximum of 3 total copies owned (reel + market purchases combined).
- **FR-002**: Icons in the starting reel (apple, air, water, copper) MUST have only 2 copies available for purchase in the market (since 1 is already owned at start).
- **FR-003**: All other icons MUST have 3 copies available for purchase in the market.
- **FR-004**: The Apple bundle listing of "2x Apple" MUST be priced at 1 silver.
- **FR-005**: The Apple bundle listing of "3x Apple" MUST be priced at 1 gold.
- **FR-006**: Any previously existing Apple bundle listings at other quantities or prices MUST be removed.

**Starting Currency**

- **FR-007**: A new game MUST start with exactly 10 food, 10 air, 10 water, and 0 of all other currency types.

**Spin Tab — Magic Phase Visual Feedback**

- **FR-008**: During the Magic Phase, any icon that appears in every active (non-blocked) column MUST display a green border around all its cells.
- **FR-009**: During the Magic Phase, any icon that appears in all active columns except exactly one MUST display a yellow border around all its cells.
- **FR-010**: Color borders MUST update whenever the effective spin result changes, including after a respin, after a column is blocked, or after any other Magic Phase action that alters the active columns or icons.

**Spin Tab — Multiplier Lock**

- **FR-011**: During the Magic Phase, the x1|x10|x100 multiplier toggle MUST be non-interactive (locked).
- **FR-012**: All Magic Phase ability costs MUST be multiplied by the active multiplier value (x1, x10, or x100).

**Spin Tab — Block Column**

- **FR-013**: The "Lock Column" Earth ability MUST be replaced with "Block Column."
- **FR-014**: When Block Column is used, the targeted column's icons MUST be excluded from the spin result.
- **FR-015**: A blocked column MUST NOT be counted as a required column for determining winning combinations, and its icons MUST NOT contribute to the reward calculation.
- **FR-016**: The first Block Column action in a spin MUST cost 1 Earth; each subsequent use MUST cost 1 additional Earth (2nd = 2, 3rd = 3, 4th = 4).
- **FR-017**: Block Column costs MUST be multiplied by the active multiplier (x1, x10, x100).
- **FR-018**: A maximum of 4 columns may be blocked per spin.
- **FR-019**: All blocked columns MUST reset (unblock) when the player claims the spin result.
- **FR-020**: The Block Column action MUST be disabled when the player has insufficient Earth to cover the next Block Column cost (base cost × active multiplier).

**Spin Tab — Claim**

- **FR-021**: Upon claiming a spin result, the results dialog MUST be replaced with a toast notification.
- **FR-022**: The toast notification MUST be small, temporary, and non-blocking (does not prevent interaction with other UI elements).
- **FR-023**: The toast notification MUST automatically dismiss after a short duration.
- **FR-024**: If a new claim occurs while a toast is still visible, the existing toast MUST be replaced by the new one.

**Reel Tab — Display**

- **FR-025**: Icons in the Reel tab MUST be displayed grouped by icon type so that identical icons appear consecutively.
- **FR-026**: The per-icon enable/disable control MUST be removed from the Reel tab.

**Reel Tab — Prestige**

- **FR-027**: A Prestige button MUST be displayed in the Reel tab.
- **FR-028**: The Prestige button MUST only be active/enabled when the player owns 4 or more distinct icon types with exactly 3 copies each.
- **FR-029**: Upon activating Prestige, the player MUST be presented with a selection interface showing only icons they currently have 3 copies of.
- **FR-030**: The player MUST select a minimum of 4 icons to proceed with Prestige; they MAY select more.
- **FR-031**: Upon confirming Prestige, the player's reel MUST reset to exactly 1 copy of each selected icon.
- **FR-032**: Upon confirming Prestige, all currencies MUST reset to: food = 10, air = 10, water = 10, all others = 0.
- **FR-033**: Upon confirming Prestige, the spin counter MUST retain its current value (not reset).
- **FR-034**: The Reel tab MUST include a brief, visible explanation of what Prestige is and how it works.

### Key Entities

- **Reel**: The player's current set of icons used in spins; has a count per icon type.
- **Market Listing**: An available purchase in the market; has icon type, quantity bundle, and price.
- **Currency**: A named resource (food, air, water, earth, etc.) with a current balance.
- **Spin Result**: The set of icons across all columns produced by a spin, potentially with some columns blocked.
- **Prestige Selection**: A transient user choice of which icons to retain when triggering prestige.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A player can identify which icons are close to winning during the Magic Phase at a glance, without counting columns manually.
- **SC-002**: A player cannot accidentally purchase more than 3 copies of any icon in a single session.
- **SC-003**: A player can execute a full Prestige cycle (meet requirement, select icons, confirm) in under 60 seconds.
- **SC-004**: After Prestige, all currency and reel state correctly reflect the reset values with no leftover data from before prestige.
- **SC-005**: The claim flow completes without displaying a blocking modal, keeping the pace of gameplay uninterrupted.
- **SC-006**: A player spending Earth on Block Column under the x100 multiplier sees the exact multiplied cost deducted correctly.

## Assumptions

- The game already has 5 columns in the reel/spin display; "all columns" refers to all 5.
- The starting reel always contains exactly 1 copy each of apple, air, water, and copper; this does not change.
- The spin counter is a session-wide tally of total spins taken; it is not per-prestige.
- "Toast notification" is a brief on-screen message that appears and fades/dismisses automatically without requiring user interaction.
- Apple bundles in the market are listed separately (e.g., a "2x Apple" listing and a "3x Apple" listing), not as a configurable quantity selector.
- The prestige selection UI allows the player to confirm or cancel before any changes are applied.
- Icons that are not at 3 copies cannot be selected during the prestige icon selection step.
