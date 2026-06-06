# Feature Specification: Version 0.3 Enhancements

**Feature Branch**: `003-v03-enhancements`

**Created**: 2026-06-06

**Status**: Draft

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Spin Multiplier Control (Priority: P1)

As a player, I want to be able to multiply a spin's result by 10x or 100x with a single button press so that I can wager more and gain more in a single action.

**Why this priority**: Core gameplay mechanic that directly affects how players engage with risk and reward. Enables high-stakes play without repetitive clicking.

**Independent Test**: Can be tested by toggling to x10, pressing SPIN, and verifying 10 apples are deducted, one result is shown in the game log labeled x10, and rewards are 10× the base spin outcome.

**Acceptance Scenarios**:

1. **Given** the spin multiplier is set to x1, **When** the player presses SPIN, **Then** 1 apple is deducted and the spin result is added to the game log.
2. **Given** the spin multiplier is set to x10, **When** the player presses SPIN, **Then** 10 apples are deducted, one spin is resolved, rewards are multiplied by 10, and one game log entry appears labeled x10.
3. **Given** the spin multiplier is set to x100, **When** the player presses SPIN, **Then** 100 apples are deducted, one spin is resolved, rewards are multiplied by 100, and one game log entry appears labeled x100.
4. **Given** the player has fewer apples than the multiplier cost, **When** the player attempts to spin, **Then** the spin is blocked and the player sees an appropriate message.
5. **Given** the player has exactly the multiplier cost in apples (e.g., exactly 10 for x10), **When** the player presses SPIN, **Then** the spin proceeds; if no food is earned the player loses.

---

### User Story 2 - Game Log in Spin Tab (Priority: P1)

As a player, I want to see a running log of my recent spins directly in the Spin tab so that I can review my spin history without interrupting gameplay.

**Why this priority**: Replaces the always-on results modal, which interrupted flow. The log provides context without blocking the player.

**Independent Test**: Can be tested by performing 3+ spins and verifying up to 10 results appear in the log, ordered most-recent-first.

**Acceptance Scenarios**:

1. **Given** a spin completes, **When** the result is non-notable (no large gain, no crown), **Then** the spin result is added to the game log without a modal appearing.
2. **Given** the game log has 10 entries, **When** a new spin completes, **Then** the oldest entry is removed and the new result is shown at the top.
3. **Given** a spin completes with a notable result (>20% currency/food gain or crown), **When** the result is processed, **Then** one result modal is displayed (regardless of multiplier) AND the result is also added to the game log.
4. **Given** the player views the Spin tab, **Then** up to 10 most recent spins are displayed showing the spin number and outcome.

---

### User Story 3 - Animate Toggle (Priority: P2)

As a player, I want to be able to disable the spinning animation so that I can spin faster and see results immediately.

**Why this priority**: Improves quality of life for experienced players or those using high multipliers where animation becomes tedious.

**Independent Test**: Can be tested by disabling animate, pressing SPIN, and verifying the result matrix appears instantly with the game log updated.

**Acceptance Scenarios**:

1. **Given** animate is enabled (default), **When** the player spins, **Then** the slot columns animate before revealing the result.
2. **Given** animate is disabled, **When** the player spins, **Then** the result matrix is displayed immediately with no animation, the game log updates, and the currency bar updates.
3. **Given** animate is toggled off, **When** the page is reloaded, **Then** the animate setting remains off.

---

### User Story 4 - Currency Bar Timing & Auto-Convert Toggle (Priority: P2)

As a player, I want the currency bar to update only after I've seen my result so that I always understand what I gained, and I want control over automatic currency conversion.

**Why this priority**: Provides clarity around reward timing and gives players agency over how their currency is managed.

**Independent Test**: Can be tested by spinning with auto-convert off and verifying copper accumulates beyond 99 without converting to silver.

**Acceptance Scenarios**:

1. **Given** a modal is displayed after a spin, **When** the player confirms/dismisses the modal, **Then** the currency bar updates.
2. **Given** no modal is displayed after a spin, **When** all columns finish spinning, **Then** the currency bar updates.
3. **Given** auto-convert is enabled (default), **When** the player accumulates 100 copper, **Then** it automatically converts to 1 silver.
4. **Given** auto-convert is disabled, **When** the player accumulates 100+ copper, **Then** copper continues to increase without converting.
5. **Given** auto-convert is toggled off, **When** the page is reloaded, **Then** the setting remains off.

---

### User Story 5 - Market Pricing Updates (Priority: P3)

As a player, I want to see accurate pricing including alternative currency denominations in the market so that I can make informed purchasing decisions.

**Why this priority**: Quality-of-life improvement. Crowns being acquirable makes their cost clarity important; alternate pricing is helpful but cosmetic.

**Independent Test**: Can be tested by opening the Market tab and verifying crowns cost 100 gold and items show alternate cost display.

**Acceptance Scenarios**:

1. **Given** the player views the Market tab, **When** they look at the Crown listing, **Then** the price shows 100 gold.
2. **Given** an item costs 1 silver, **When** the player views its listing, **Then** it also displays the equivalent cost in copper (100 copper).
3. **Given** an item costs 1 gold, **When** the player views its listing, **Then** it also displays the equivalent cost in silver (100 silver) or copper (10,000 copper).

---

### User Story 6 - Settings & Game Log Persistence (Priority: P2)

As a player, I want my settings and recent spin history to persist across page reloads so that I don't have to reconfigure my preferences every session.

**Why this priority**: Without persistence, the other toggle features lose much of their value. Session continuity is a basic expectation.

**Independent Test**: Can be tested by changing toggles and performing spins, reloading, and verifying settings and last 10 spins are restored.

**Acceptance Scenarios**:

1. **Given** the player has changed toggle settings, **When** the page is reloaded, **Then** all toggle states (auto-convert, animate, spin multiplier) are restored.
2. **Given** the player has performed spins, **When** the page is reloaded, **Then** the last 10 spins are shown in the game log.
3. **Given** a fresh session with no stored data, **When** the page loads, **Then** default settings apply (auto-convert on, animate on, multiplier x1, empty game log).

---

### Edge Cases

- A player with exactly the multiplier cost in apples (e.g., exactly 10 for x10) may spin; if no food is earned, the player loses.
- A multiplied spin (x10 or x100) is still one spin action — one modal is shown if the result is notable, and one game log entry is added indicating the multiplier used.
- If local storage is unavailable or full, the game proceeds normally using in-memory state with no error shown to the player.
- Each spin action (regardless of multiplier) counts as one entry in the game log; the multiplier is displayed in the entry so the player understands the scale of the wager and reward.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The currency bar MUST update only after all columns finish spinning, and only after the player confirms/dismisses the modal if one is displayed.
- **FR-002**: The Spin tab MUST display a game log showing the spin number and result of each spin, limited to the 10 most recent entries.
- **FR-003**: The results modal MUST only appear when a spin yields more than 20% of the player's current food or any currency type (gold, silver, copper), or when a crown is gained.
- **FR-004**: A spin multiplier toggle (x1, x10, x100) MUST be displayed next to the SPIN button; x1 is the default.
- **FR-005**: Selecting x10 MUST deduct 10 apples and multiply the result of one spin by 10; x100 MUST deduct 100 apples and multiply the result of one spin by 100. Each multiplied spin produces one game log entry indicating the multiplier used.
- **FR-006**: An "animate" toggle MUST be displayed near the matrix; enabled by default.
- **FR-007**: When animate is disabled, the result matrix MUST appear immediately, bypassing the spinning animation, and the game log and currency bar MUST update instantly.
- **FR-008**: An "auto-convert money" toggle MUST be displayed; enabled by default. Currency conversion rates are: 100 copper = 1 silver; 100 silver = 1 gold (i.e., 1 gold = 10,000 copper).
- **FR-009**: When auto-convert is disabled, copper, silver, and gold MUST accumulate independently without automatic denomination conversion.
- **FR-010**: Crowns in the Market MUST cost 100 gold.
- **FR-011**: Market item listings MUST display the purchase cost in at least two currency denominations where applicable (e.g., 1 silver / 100 copper).
- **FR-012**: The following settings MUST be persisted in local storage: auto-convert toggle state, animate toggle state, spin multiplier selection.
- **FR-013**: The last 10 spin results MUST be persisted in local storage and restored on page load.

### Key Entities

- **Spin Result**: A record of a single spin outcome including spin number, symbols landed, and rewards gained.
- **Game Log**: An ordered list of up to 10 most recent spin results, displayed in the Spin tab.
- **Player Settings**: Persisted toggle states — auto-convert, animate, spin multiplier.
- **Currency**: Copper, silver, gold — convertible denominations; crown is a separate premium currency.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Players can complete a 100-spin session without being interrupted by a modal more than 20% of the time (only notable results trigger modals).
- **SC-002**: With animate disabled, each spin completes and the result is visible in under 100ms of the player pressing SPIN.
- **SC-003**: All toggle settings and the last 10 spins are restored correctly on every page reload with no data loss.
- **SC-004**: Market crown pricing and alternate denomination display are accurate 100% of the time across all currency conversions.
- **SC-005**: Players can execute x10 and x100 spins and the apple deduction and game log entries match the multiplier selected with no discrepancy.

## Assumptions

- The existing spin logic and reward system remain unchanged; only the UI flow and triggering rules for the modal change.
- For x10 and x100 spins, the spin result is multiplied (not repeated); one modal is shown if the multiplied result is notable, and one game log entry is recorded with the multiplier indicated.
- Spin numbers in the game log are sequential and global (not reset per session).
- The alternate currency display in the Market is read-only informational; purchasing still uses the primary listed price.
- Local storage is available in the target environment; if unavailable, the game continues to function using in-memory state only.
- The existing crown-gain mechanic still triggers the results modal regardless of other thresholds.
