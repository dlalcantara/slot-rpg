# Feature Specification: Version 0.8 — Achievements

**Feature Branch**: `008-v08-achievements`

**Created**: 2026-06-13

**Status**: Draft

**Input**: User description: "Version 0.8 — Remove x10/x100 multipliers, expand market purchase limits, add Achievements tab with 15 achievements and unlock notifications"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Unlock and View Achievements (Priority: P1)

A player performs in-game actions that satisfy achievement conditions. When an achievement is triggered, a dialog appears announcing the unlock. The player can open the Achievements tab at any time to see all achievements and their unlock status.

**Why this priority**: Achievements are the headline feature of this version and the primary source of new player engagement. Every other change feeds into achievement triggers.

**Independent Test**: Open the game, perform the action for any single achievement (e.g., buy one apple from the market), observe the unlock dialog, then open the Achievements tab and confirm that achievement is highlighted as unlocked.

**Acceptance Scenarios**:

1. **Given** a player has not yet unlocked any achievements, **When** they buy one apple icon from the market, **Then** an achievement dialog appears with the title "How do you like them Apples" and the achievement is shown as unlocked in the Achievements tab.
2. **Given** a player has already unlocked an achievement, **When** the unlock condition is met again, **Then** no duplicate dialog appears and the achievement remains unlocked.
3. **Given** a player opens the Achievements tab, **When** they view the list, **Then** all 15 achievements are visible, unlocked ones are visually highlighted, and locked ones are shown in a neutral/dimmed state.

---

### User Story 2 - Expanded Market Purchasing (Priority: P2)

A player visiting the Market can purchase more icons than before. Instead of being limited to 3 of any item, they can buy up to 50% of their current reel size. The purchase button becomes unavailable once this cap is reached.

**Why this priority**: This directly affects core gameplay loop balance and feeds into achievements like "Out of Stock."

**Independent Test**: Go to the Market tab, purchase an icon repeatedly and confirm purchases succeed up to the 50%-of-reel cap and are blocked beyond it.

**Acceptance Scenarios**:

1. **Given** a player has 3 of icon X in a reel of 7 (`3 × 2 = 6 < 7`), **When** they buy one more, **Then** the purchase succeeds and the reel becomes 4 of icon X in a reel of 8 — at which point `4 × 2 = 8 < 8` is false and the buy button is disabled.
2. **Given** a player has 3 of icon X in a reel of 6 (`3 × 2 = 6 < 6` is false), **When** they view the Market, **Then** the buy button for icon X is already disabled.
3. **Given** a player buys an icon from the Market, **When** the purchase completes, **Then** the reel size increases by 1 and the Market re-evaluates the buy button state against the new reel size.

---

### User Story 3 - Remove Multipliers (Priority: P2)

The x10 and x100 coin multiplier options are removed from the game. Players no longer see these options in any UI area where they previously appeared.

**Why this priority**: Required for balance; must be done before achievements referencing coin/currency totals are meaningful.

**Independent Test**: Load the game and confirm no x10 or x100 multiplier controls exist anywhere in the UI.

**Acceptance Scenarios**:

1. **Given** a player loads the game, **When** they inspect all tabs and controls, **Then** no x10 or x100 multiplier buttons or labels are present.
2. **Given** existing saved state that may reference multipliers, **When** the game loads, **Then** it handles the absence of multipliers gracefully without errors.

---

### User Story 4 - Win Condition and Currency Achievements (Priority: P3)

The former win condition (100 Crowns) is replaced by the "This is Sparta" achievement (300 Crowns). A further milestone achievement "Ancient Civilization" is awarded at 5000 Crowns. The game continues beyond these thresholds rather than ending.

**Why this priority**: Changes the endgame objective, but the game remains playable without this; depends on the achievement system (P1) being in place first.

**Independent Test**: Accumulate 300 Crowns in currency and confirm the "This is Sparta" achievement unlocks via the dialog; continue to 5000 Crowns and confirm "Ancient Civilization" unlocks.

**Acceptance Scenarios**:

1. **Given** a player reaches 300 Crowns, **When** the currency total hits that threshold, **Then** the "This is Sparta" achievement dialog appears and the achievement is marked unlocked.
2. **Given** a player reaches 5000 Crowns, **When** the currency total hits that threshold, **Then** the "Ancient Civilization" achievement dialog appears.
3. **Given** the former 100-Crown win screen or end state existed, **When** a player accumulates 100 Crowns, **Then** no win screen or premature game-end occurs.

---

### User Story 5 - "Happily Ever After" Meta-Achievement (Priority: P3)

A special 15th achievement, "Happily Ever After," is automatically awarded when all other 14 achievements have been unlocked.

**Why this priority**: Depends on all other achievements being implemented (P1); pure reward for completion.

**Independent Test**: Manually trigger or simulate the unlock of all 14 other achievements and confirm "Happily Ever After" is awarded immediately after the last one.

**Acceptance Scenarios**:

1. **Given** 13 of 14 non-meta achievements are unlocked, **When** the player unlocks the 14th, **Then** the "Happily Ever After" dialog appears after the 14th achievement dialog.
2. **Given** "Happily Ever After" is already unlocked, **When** no condition check is made, **Then** it remains unlocked permanently.

---

### Edge Cases

- What happens when two achievement conditions are satisfied by the same action (e.g., a SPIN that simultaneously triggers "Second Breakfast" and "Be Water, My Friend")? Both dialogs should display in sequence.
- How does the system handle a WIP achievement entry ("WIP1", "WIP2")? They appear in the list as locked and labeled "Coming Soon" or equivalent — no unlock condition is active.
- What if a player's reel size is odd (e.g., 7 icons)? A player with 3 of an icon in a reel of 7 can still buy one more (`3 × 2 = 6 < 7`), resulting in 4 of that icon in a reel of 8 (exactly 50%). The condition is `qty × 2 < reel_size`, checked before purchase against the current reel size.
- What if the player already has achievements data from a prior save? The achievement state persists; already-earned unlocks remain highlighted.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The game MUST remove all x10 and x100 multiplier controls from the UI.
- **FR-002**: Buying an icon from the Market adds it directly to the reel (reel size increases by 1). A purchase is permitted when the player's current count of that icon satisfies `qty × 2 < reel_size` (replacing the previous hard limit of 3). This ensures the icon never exceeds 50% of the resulting reel — e.g., buying when at 3/7 yields 4/8 (exactly 50%), and buying when at 3/6 is blocked because 3/6 is already at 50%.
- **FR-003**: The Market MUST disable the purchase control for an icon when the player's current count of that icon already satisfies `qty × 2 ≥ reel_size`.
- **FR-004**: The game MUST add a fourth tab labeled "Achievements" to the main tab navigation.
- **FR-005**: The Achievements tab MUST display all 15 achievements, each showing a title and unlock condition description.
- **FR-006**: Unlocked achievements MUST be visually distinguished from locked ones (e.g., highlighted, colored, or badged) in the Achievements list.
- **FR-007**: When a player's action satisfies an achievement's unlock condition for the first time, the game MUST display an achievement unlock dialog/notification.
- **FR-008**: Once an achievement is unlocked, it MUST remain unlocked regardless of subsequent game state (no backward locking).
- **FR-009**: The 15 achievements and their unlock conditions MUST be exactly as specified:
  - "How do you like them Apples" — Buy one apple icon from the Market
  - "Second Breakfast" — Gain at least 2 Apples in one SPIN
  - "Out of Stock" — 50% of the reel is the same icon
  - "SSS" — Have 3 silver coins in the reel
  - "I understand it now" — Prestige with an icon worth 1 silver or more
  - "Coin Collector" — Have one of each coin (copper, silver, gold) in the reel
  - "Be Water, My Friend" — Swap cells resulting in SPIN rewards from two icons
  - "WHY!!!" — Block a column resulting in fewer SPIN rewards
  - "Born with a Diamond Spoon" — Prestige with Crown
  - "This is Sparta" — Reach 300 Crowns in currency
  - "Ancient Civilization" — Reach 5000 Crowns in currency
  - "WIP1" — Placeholder; will be unlocked in a future version
  - "WIP2" — Placeholder; will be unlocked in a future version
  - "Master of Elements" — Gain at least 1 of each element (air, water, earth, fire) in one SPIN
  - "Happily Ever After" — Unlock the other 14 achievements
- **FR-010**: "This is Sparta" (300 Crowns) MUST replace the former win condition of 100 Crowns; reaching 100 Crowns MUST NOT trigger a game-ending win state.
- **FR-011**: "Master of Elements" MUST replace the prior "Master of Elements" special effect (if any existed).
- **FR-012**: WIP achievements MUST appear in the list in a locked, inactive state with no active unlock detection.
- **FR-013**: When multiple achievements are unlocked by the same action, each MUST be shown via its own sequential dialog.
- **FR-014**: "Happily Ever After" MUST be awarded automatically when all other 14 achievements are unlocked, without requiring a separate player action.
- **FR-015**: Achievement unlock state MUST persist across game sessions (saved with game state).

### Key Entities

- **Achievement**: Has a title, a description of its unlock condition, a locked/unlocked boolean, and a WIP flag. WIP achievements have no active unlock logic.
- **Reel**: The collection of icons currently in the player's slot machine. Grows by 1 each time an icon is purchased from the Market. Its current size determines whether a purchase is allowed via `qty × 2 < reel_size`.
- **SPIN Result**: The outcome of one spin, listing which icons contributed rewards. Used to evaluate per-spin achievement conditions.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: All 15 achievements are visible in the Achievements tab on first load, with 0 unlocked.
- **SC-002**: Every defined achievement unlock condition, when triggered, produces a dialog within the same game action (no delayed display).
- **SC-003**: The Market purchase button is enabled when `current_qty × 2 < reel_size` and disabled when `current_qty × 2 ≥ reel_size`; after a successful purchase the reel size is 1 larger and the button state is re-evaluated correctly. Validated across reel states from size 5 to 50.
- **SC-004**: No x10 or x100 multiplier controls are present anywhere in the UI after the change.
- **SC-005**: "Happily Ever After" is awarded in 100% of test cases where all 14 other achievements are unlocked in sequence.
- **SC-006**: Achievement unlock state is preserved after the browser tab is closed and reopened (persistence check).
- **SC-007**: Reaching 100 Crowns does not trigger any win screen or game-end state.

## Assumptions

- The game already has a tab-based navigation system that supports adding a fourth tab without major restructuring.
- The reel size is always a positive integer of at least 5; the purchase condition `qty × 2 < reel_size` will always permit at least 2 of any icon (since 2×2=4 < 5).
- Achievement state is stored in the same persistence layer (e.g., localStorage) as the rest of game state.
- "Master of Elements" previously referred to a spin effect, not an achievement; that effect is removed and replaced by this achievement.
- WIP achievements are shown in the list but have no functional unlock path; they serve as teasers for future content.
- The 100-Crown win condition previously ended the game; this version removes that endpoint entirely — the game continues indefinitely.
- Multiple achievement dialogs triggered by one action are shown in a sequential queue, not simultaneously.
