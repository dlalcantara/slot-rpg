# Feature Specification: Magic Elements (v0.4)

**Feature Branch**: `004-magic-elements`

**Created**: 2026-06-07

**Status**: Draft

**Input**: User description: "Version 0.4 Magic - Add elemental currencies, magic actions on spin, special win condition, and results modal improvements"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Add Elemental Icons to Reels and Earn Currencies (Priority: P1)

The player spends money in the Market to add elemental icons (Air, Water, Earth, Fire) to their reel pool. When those icons appear on the reels during a spin, the player earns the corresponding elemental currency. The player then spends that earned currency on magic actions.

**Why this priority**: Elemental currencies are the foundation for all magic actions; without them the magic system cannot be used. The market purchase flow is the only way to introduce elemental icons to the reels.

**Independent Test**: Can be fully tested by purchasing an Air icon in the Market, spinning until Air appears, and verifying the Air currency balance increases.

**Acceptance Scenarios**:

1. **Given** the player has enough copper, **When** they purchase an Air icon from the market (10 copper), **Then** an Air icon is added to their reel pool and copper decreases by 10. Their Air currency balance does NOT increase yet.
2. **Given** an Air icon is in the player's reel pool, **When** it appears in the slot result after a spin, **Then** the player's Air currency increases by 1 (or the amount determined by the win computation).
3. **Given** the player has enough silver/gold, **When** they purchase Water (1 silver), Earth (10 silver), or Fire (1 gold), **Then** the respective icon is added to the reel pool.
4. **Given** the Currency tab is open, **When** the player views it, **Then** all seven currencies (Copper, Silver, Gold, Air, Water, Earth, Fire) are visible with correct balances.

---

### User Story 2 - Perform Magic Actions After Spin (Priority: P1)

After the slot machine reels stop spinning, the player can perform one or more magic actions (respin column, swap adjacent cells, lock column, increase card value) before claiming their result.

**Why this priority**: This is the primary gameplay mechanic of v0.4 — interactive decision-making between spin and payout.

**Independent Test**: Can be fully tested by spinning, using at least one magic action with the appropriate currency, then pressing CLAIM.

**Acceptance Scenarios**:

1. **Given** reels have stopped and the player has Air, **When** they select a column and respin it, **Then** the column respins, 1 Air is deducted (2nd respin costs 2, etc.), and the new result is shown.
2. **Given** reels have stopped and the player has Water, **When** they select two adjacent cells and swap them, **Then** icons swap, 1 Water is deducted (2nd swap costs 2, etc.).
3. **Given** reels have stopped and the player has Earth, **When** they lock a column (up to 3 columns total), **Then** that column is marked locked (costs 1 Earth for 1st lock, 2 for 2nd, 3 for 3rd) and will not spin on the next SPIN.
4. **Given** reels have stopped and the player has Fire, **When** they select a card and increase its value, **Then** the card value increases, 1 Fire is deducted (2nd increase costs 2, etc.).
5. **Given** the player has insufficient currency for an action, **When** they attempt the action, **Then** the action is rejected with a clear message and no currency is deducted.
6. **Given** the player is satisfied with the result, **When** they press CLAIM, **Then** the slot result is computed and earnings are awarded as normal.

---

### User Story 3 - Lock Columns for the Next Spin (Priority: P2)

During the Magic Phase the player can spend Earth to lock up to 3 columns. Locked columns are skipped during the next SPIN, preserving their icons. Locks clear automatically after each SPIN; the player must re-apply them each round.

**Why this priority**: Adds depth to the magic system but depends on the lock action from User Story 2.

**Independent Test**: Can be tested by spending Earth to lock a column, pressing SPIN, verifying the locked column holds its icons, then verifying the lock is gone at the start of the next Magic Phase.

**Acceptance Scenarios**:

1. **Given** one or more columns are locked, **When** the player presses SPIN, **Then** locked columns retain their icons while unlocked columns spin normally.
2. **Given** a column is locked and the spin completes, **When** the Magic Phase begins for the new spin, **Then** all column locks are cleared and must be re-applied by spending Earth again.
3. **Given** three columns are already locked, **When** the player attempts to lock a fourth, **Then** the lock is rejected with a message indicating the maximum is 3.

---

### User Story 4 - Master of Elements Win Condition (Priority: P2)

If the visible slot grid contains exactly 3 Air, 3 Water, 3 Earth, and 3 Fire icons simultaneously, the player receives a "Master of Elements" notification. Play continues normally afterward.

**Why this priority**: Provides a meaningful long-term goal that rewards mastery of the magic system.

**Independent Test**: Can be tested by arranging the correct icons (via magic actions or natural spin) and verifying the notification appears.

**Acceptance Scenarios**:

1. **Given** the slot grid contains at least 3 Air, at least 3 Water, at least 3 Earth, and at least 3 Fire icons, **When** CLAIM is pressed, **Then** a "Master of Elements" notification is displayed.
2. **Given** the win condition is met, **When** the player dismisses the notification, **Then** they can continue playing normally.
3. **Given** the grid has fewer than 3 of any element (e.g., 4 Air, 4 Water, 4 Earth, 2 Fire), **When** CLAIM is pressed, **Then** no special notification is shown.

---

### User Story 5 - Results Modal Threshold (Priority: P3)

The results modal only appears when the player earns more than 20% of their current total holdings in a single spin. For money currencies (Gold, Silver, Copper), a combined value is used to determine the threshold.

**Why this priority**: Reduces notification fatigue and makes the modal feel more rewarding.

**Independent Test**: Can be tested by earning varying amounts and verifying the modal appears/doesn't appear at the correct threshold.

**Acceptance Scenarios**:

1. **Given** a player has 1 Gold (combined money = 10000), **When** they earn 99 copper (0.99% of 10000), **Then** the results modal does NOT appear.
2. **Given** a player has 100 copper (combined money = 100), **When** they earn 21 copper (21% of 100), **Then** the results modal DOES appear.
3. **Given** a player has 10 Air, **When** they earn 3 Air (30% of 10), **Then** the results modal appears for Air.
4. **Given** a player has 0 of a currency and earns any amount, **Then** the modal is shown (any gain on zero is treated as exceeding 20%).

---

### Edge Cases

- What happens when a player has 0 elemental currency and tries to perform a magic action?
Disable that magic action
- How does the respin cost counter reset — does it reset each new spin or persist across spins?
Resets for a new SPIN
- What happens when all three locked columns are locked and the player tries to spin — do locked columns display a visual indicator?
During the spin animation, locked columns should be seen visually locked, no spinning animation.
- If a swap would place identical icons in both cells, does it still proceed?
Yes, its the player's choice.
- What if the player has 0 of all currencies when CLAIM is shown — is magic UI still visible but actions disabled?
Yes

## Requirements *(mandatory)*

### Functional Requirements

**Currency System**
- **FR-001**: System MUST add four elemental currencies: Air, Water, Earth, and Fire, displayed in the Currency tab alongside existing currencies.
- **FR-002**: System MUST add four market items: Air (10 copper), Water (1 silver), Earth (10 silver), Fire (1 gold). Purchasing an item adds the corresponding elemental icon to the player's reel pool; it does NOT directly grant elemental currency.
- **FR-003**: The starting reel pool MUST contain exactly 4 icons: 1 Blank, 1 Apple, 1 Copper, 1 Air.

**Magic Action Phase**
- **FR-003**: System MUST display a CLAIM button in the Spin tab, positioned between the SPIN button and the Log, visible after the spin animation completes.
- **FR-004**: After the spin animation completes, the system MUST enter a "Magic Phase" where the player can perform magic actions before pressing CLAIM.
- **FR-005**: System MUST allow the player to respin a selected column during the Magic Phase; cost is N Air where N is the respin count for this Magic Phase (1st = 1, 2nd = 2, etc.).
- **FR-006**: System MUST allow the player to swap icons between two adjacent selected cells during the Magic Phase; cost is N Water where N is the swap count for this Magic Phase (1st = 1, 2nd = 2, etc.).
- **FR-007**: System MUST allow the player to lock a selected column during the Magic Phase; cost is N Earth where N equals the total number of columns currently locked + 1 (1st lock = 1 Earth, 2nd = 2 Earth, 3rd = 3 Earth). Maximum 3 columns may be locked at once.
- **FR-007a**: All column locks MUST be cleared when the player presses SPIN. Locks do not persist across spins; the player must spend Earth to re-lock each spin.
- **FR-007b**: During the spin animation, locked columns MUST display a visual locked state and show no spinning animation.
- **FR-008**: System MUST allow the player to increase the value of a selected card during the Magic Phase; cost is N Fire where N is the increase-value count for this Magic Phase (1st = 1, 2nd = 2, etc.).
- **FR-009**: Magic action controls MUST be visually disabled when the player has insufficient currency to perform them. The magic action UI remains visible at all times during the Magic Phase even if the player has no currency at all.
- **FR-010**: System MUST compute the slot result and award earnings only when the player presses CLAIM.
- **FR-011**: Locked columns MUST be excluded from the next SPIN's randomization and display a visual locked indicator.
- **FR-012**: The magic action cost counters (respin, swap, increase-value) MUST reset at the start of each new Magic Phase. The lock cost is based on total currently-locked columns, not a per-phase counter.

**Special Win Condition**
- **FR-013**: System MUST detect when the visible slot grid contains at least 3 Air, at least 3 Water, at least 3 Earth, and at least 3 Fire icons at CLAIM time.
- **FR-014**: Upon detecting the "Master of Elements" condition, system MUST display a notification to the player. Play continues normally after dismissal.

**Results Modal**
- **FR-015**: The results modal MUST only appear when a single CLAIM awards the player more than 20% of their current holdings for any individual currency.
- **FR-016**: For Gold, Silver, and Copper currencies, the system MUST compute a combined money value (10000 × Gold + 100 × Silver + Copper) and apply the 20% threshold against that combined value rather than each denomination separately.
- **FR-017**: If a player has 0 of a currency and earns any amount, the results modal MUST appear for that currency.

### Key Entities

- **Elemental Icon**: One of Air, Water, Earth, Fire — an icon added to the player's reel pool by purchasing it in the Market. When it lands in a spin result, it awards the corresponding elemental currency.
- **Elemental Currency**: One of Air, Water, Earth, Fire — a resource earned when the matching elemental icon appears in a spin result; spent on magic actions.
- **Magic Phase**: The window between the end of the spin animation and the press of CLAIM during which the player may perform magic actions.
- **Locked Column**: A slot column that is protected from randomization on the next spin; maximum 3 can be locked simultaneously.
- **Combined Money Value**: A computed value of 10000 × Gold + 100 × Silver + Copper used for the results modal threshold calculation.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Purchasing an elemental icon from the Market deducts the correct money cost and adds the icon to the reel pool. Elemental currency balances only increase when the matching icon lands in a spin result.
- **SC-002**: Each magic action (respin, swap, lock, increase value) correctly deducts the appropriate escalating cost and produces the expected change to the slot grid.
- **SC-003**: The CLAIM button appears after every spin animation and the result is not computed until CLAIM is pressed.
- **SC-004**: Locked columns correctly retain their icons across spins and are excluded from randomization.
- **SC-005**: The "Master of Elements" notification appears when the grid contains at least 3 of every elemental icon at claim time, and does not appear if any element has fewer than 3.
- **SC-006**: The results modal does not appear when earnings are ≤ 20% of current holdings (using combined money for Gold/Silver/Copper), and does appear when earnings exceed 20%.

## Assumptions

- The starting reel pool contains exactly 4 icons: 1 Blank, 1 Apple, 1 Copper, 1 Air.
- Elemental icons beyond the starting Air are added to the reel pool only by purchasing them in the Market.
- The "increase card value" action applies to the point/multiplier value associated with an icon, following the same value system already in the game.
- Magic action cost counters (respin, swap, increase-value) reset every time a new spin starts (i.e., each spin's Magic Phase starts fresh at cost 1).
- Column locks are temporary: they hold only for the current spin and are automatically cleared when the player presses SPIN. Locking costs Earth each time.
- Only one elemental icon type per cell (no stacking).
- The results modal enhancement applies to all currencies including the four new elemental ones.
- The existing slot result computation (lines, combinations) remains unchanged — magic actions only modify the grid state before computation.
