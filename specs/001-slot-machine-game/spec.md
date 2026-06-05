# Feature Specification: Slot Machine RPG — MVP

**Feature Branch**: `001-slot-machine-game`

**Created**: 2026-06-06

**Status**: Draft

**Input**: User description: "A slot machine game where players generate different currencies from icons in the machine. Each currency has a different effect on the game, eventually reaching a win condition."

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Spin the Slot Machine and Earn Currency (Priority: P1)

A player opens the game and sees a 3-row × 5-column slot machine. They press SPIN and the reels animate, then stop to reveal icons. If any icon appears across all 5 columns, the player earns the corresponding currency, calculated as the product of that icon's count in each column. The game deducts 1 Food per spin. If Food hits zero after the spin, the game ends.

**Why this priority**: This is the entire core loop. Nothing else in the game functions without a working spin mechanic and currency system.

**Independent Test**: Load the game, press SPIN five times — verify Food decrements from 100, currency is awarded when icons align across all 5 columns, and the game ends when Food reaches 0.

**Acceptance Scenarios**:

1. **Given** the player has Food > 0, **When** they press SPIN, **Then** each column independently randomizes and displays 3 icons from the reel, Food decreases by 1, and any full-row alignment pays out the correct currency amount.
2. **Given** an icon appears in all 5 columns with counts [2,3,1,2,1], **When** the spin resolves, **Then** that icon's currency is awarded in the amount of 2×3×1×2×1 = 12.
3. **Given** the player has exactly 1 Food, **When** they press SPIN, **Then** Food drops to 0 and the game-over state is shown.

---

### User Story 2 — Buy Icons from the Market (Priority: P2)

Between spins, the player visits the Market and spends Money (Copper, Silver, or Gold) to buy icons. Each purchased icon is permanently added to their base Reel, improving future spin outcomes. The Market is available before and after every spin.

**Why this priority**: The Market is the core progression mechanic. Without it, the game has no decision-making or strategic depth.

**Independent Test**: Start a game with seeded currency, open the Market, buy one Apple (1 Copper), spin once — verify 1 Copper is deducted from the player's balance and the purchased Apple now appears in the reel pool (no immediate currency gain from the purchase itself).

**Acceptance Scenarios**:

1. **Given** the player has ≥ 1 Copper, **When** they buy an Apple from the Market, **Then** 1 Copper is deducted and an Apple icon is added to their base Reel.
2. **Given** the player has 0 Copper, **When** they attempt to buy a Copper icon (cost: 1 Copper), **Then** the purchase is rejected and their balance is unchanged.
3. **Given** the player buys 3 Copper icons, **When** they spin, **Then** Copper appears more frequently across columns than before the purchases.

---

### User Story 3 — Win the Game by Collecting 100 Crowns (Priority: P3)

The player accumulates Crowns by landing Crown icons on the slot machine or purchasing Crown icons with Gold. When Crowns reach 100, a WIN modal appears. The player may choose to continue playing beyond the win condition.

**Why this priority**: This is the goal state of the game. Without it the game has no conclusion, but it depends on the core loop (P1) and market (P2) working first.

**Independent Test**: Use a debug/cheat mode or scripted currency injection to give the player 10 Gold → buy 1 Crown icon → spin until 100 Crowns → verify WIN modal appears and the player can dismiss it to continue playing.

**Acceptance Scenarios**:

1. **Given** the player's Crown count is 99 and a Crown icon aligns across all 5 columns awarding ≥ 1 Crown, **When** the spin resolves, **Then** a WIN modal is displayed.
2. **Given** the WIN modal is shown, **When** the player chooses to continue, **Then** the modal is dismissed and the game remains playable.
3. **Given** the player has ≥ 10 Gold, **When** they buy a Crown icon from the Market, **Then** 10 Gold is deducted and the Crown icon is added to their Reel.

---

### User Story 4 — Resume Play After Closing the Browser (Priority: P4)

A player who closes the browser or refreshes the page returns to exactly the state they left — same reel, same balances, same spin count. They can also press Hard Reset at any time to wipe their progress and start from scratch. If they lost the game, the game-over screen invites them to reset and try again.

**Why this priority**: Persistence makes the game feel complete and prevents frustrating data loss; the reset path ensures no player is stuck at a dead end.

**Independent Test**: Start a game, buy two icons, spin three times, refresh the page — verify all state is restored. Then press Hard Reset and verify the game returns to the exact initial state.

**Acceptance Scenarios**:

1. **Given** the player has purchased icons and spun several times, **When** they refresh the page, **Then** all currency balances, reel contents, and crown count are exactly as they were before the refresh.
2. **Given** the player presses Hard Reset mid-game, **When** the reset is confirmed, **Then** the game returns to the initial state: 3 Blank icons, 1 Apple, 1 Copper in the reel; 100 Food; 0 of all money; 0 Crowns.
3. **Given** the player has lost (Food = 0), **When** the game-over screen is shown, **Then** a prominent call-to-action encourages them to reset and play again, and activating it triggers Hard Reset.

---

### User Story 5 — Automatic Currency Conversion (Priority: P5)

The game automatically converts Copper to Silver and Silver to Gold at defined thresholds (100 Copper → 1 Silver; 100 Silver → 1 Gold), so the player never needs to manually manage currency tiers.

**Why this priority**: Supporting mechanic that makes the economy functional; must be correct but is entirely automatic and not user-interactive.

**Independent Test**: Start with 99 Copper, earn 1 more Copper via spin — verify balance reads 0 Copper, 1 Silver (net gain).

**Acceptance Scenarios**:

1. **Given** the player has 99 Copper and earns 1 Copper, **When** the currency total is evaluated, **Then** Copper resets to 0 and Silver increases by 1.
2. **Given** the player has 99 Silver and earns 1 Silver, **When** the currency total is evaluated, **Then** Silver resets to 0 and Gold increases by 1.
3. **Given** the player has 99 Copper and earns 2 Copper, **When** the currency total is evaluated, **Then** Copper reads 1 and Silver increases by 1.

---

### Edge Cases

- What happens when all reel icons are Blank? The spin still resolves normally but no currency is awarded since Blank icons have no effect and will never produce a payout alignment.
- How does icon matching work when an icon type has variants with different values (Apple vs. Triple Apple vs. Dozen Apples)? All Apple variants are treated as the same icon for matching purposes — an Apple, a Triple Apple, and a Dozen Apple in the same column all count toward the Apple alignment. The per-column count is the sum of the values of all Apple variants visible in that column (e.g., one Triple Apple contributes 3 to the column count).
- What is the maximum payout? There is no hard cap. The product of per-column counts can exceed 243 when high-value icon variants (Triple Apple, Dozen Apple) are purchased and concentrated in the reel. The payout is the true mathematical product of the five column counts.
- What happens if Food hits zero mid-session with unsaved progress? Game ends immediately after the spin; no partial saves are needed for MVP.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST display a 3-row × 5-column slot machine grid on the main screen.
- **FR-002**: System MUST populate each column on SPIN by drawing from a randomly shuffled copy of the player's base Reel and displaying 3 consecutive icons (with wrap-around).
- **FR-003**: System MUST deduct 1 Food from the player's total after every SPIN.
- **FR-004**: System MUST end the game when the player's Food reaches 0 after a SPIN.
- **FR-005**: System MUST calculate currency payout as the product of per-column value counts when an Apple-family icon (or any icon type) appears in all 5 columns. Apple, Triple Apple, and Dozen Apple are treated as the same icon for matching; each variant contributes its value (1, 3, or 12) to that column's count. The product has no cap and may exceed 243.
- **FR-006**: System MUST apply currency payouts to the player's balance immediately after each spin resolves.
- **FR-007**: System MUST automatically convert 100 Copper to 1 Silver and 100 Silver to 1 Gold whenever thresholds are reached.
- **FR-008**: System MUST display the Market before and after each SPIN, listing all purchasable icons with their costs.
- **FR-009**: System MUST add a purchased icon to the player's base Reel when a valid purchase is confirmed. Purchasing an icon has no immediate effect on currency balances — only future spins are affected.
- **FR-010**: System MUST reject purchases when the player lacks sufficient funds of the required currency type.
- **FR-011**: System MUST display a WIN modal when the player's Crown total reaches 100.
- **FR-012**: The WIN modal MUST offer the player the option to continue playing after winning.
- **FR-013**: System MUST support mobile screen resolution of 720×1280 px.
- **FR-014**: System MUST use placeholder text icons for the MVP, with layout sized to accept 16×16 or 32×32 px PNG images as a drop-in replacement.
- **FR-015**: System MUST animate the spin reels for approximately 5 seconds before displaying the final icons (animation is desired but may be simplified if needed).
- **FR-016**: System MUST automatically save the full game state (reel contents, currency balances, crown count) to browser local storage after every spin and every market purchase.
- **FR-017**: System MUST restore the saved game state from local storage when the page is loaded, so the player resumes exactly where they left off.
- **FR-018**: System MUST provide a visible Hard Reset button that clears local storage and immediately restores the initial game state (3 Blank icons, 1 Apple, 1 Copper; 100 Food; 0 Copper, 0 Silver, 0 Gold; 0 Crowns).
- **FR-019**: The game-over screen (shown when Food reaches 0) MUST encourage the player to hard reset and play again, with a prominent call-to-action that triggers the same Hard Reset flow.

### Key Entities

- **Reel**: The player's personal collection of icons that is shuffled per-column on each spin. Starts with 3 Blank icons, 1 Apple, and 1 Copper (5 icons total).
- **Blank**: A special icon with no currency effect. Does not contribute to any alignment payout.
- **Icon**: A named symbol with a currency effect and optional value (e.g., Apple = 1 Food, Triple Apple = 3 Food). Apple variants (Apple, Triple Apple, Dozen Apple) share the same icon family and match each other during payout calculation.
- **Currency**: Four types — Food (survival resource), Copper/Silver/Gold (economy, with auto-conversion tiers), and Crowns (win resource).
- **Market**: The shop listing of purchasable icons with associated costs, always available between spins.
- **Spin Result**: The 3×5 matrix of resolved icons after a spin, used to calculate payouts.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A player can complete a full game session (from start to win or loss) without any unhandled errors or UI breakage.
- **SC-002**: The spin result is displayed within 6 seconds of pressing SPIN (including animation), on both desktop and mobile viewports.
- **SC-003**: Currency balances are always accurate — no rounding errors, missed conversions, or off-by-one miscounts — verifiable through automated or manual test runs of 50+ spins.
- **SC-004**: The Market correctly prevents purchases when the player has insufficient funds in 100% of tested cases.
- **SC-005**: The WIN modal appears within 1 spin of the player's Crowns reaching or exceeding 100.
- **SC-006**: The layout renders without horizontal scroll or broken elements on a 720×1280 px mobile screen.
- **SC-007**: Game state is fully restored after a page refresh in 100% of tested cases, with no loss of reel contents, currency, or crown count.
- **SC-008**: Hard Reset returns the game to the exact initial state (3 Blank, 1 Apple, 1 Copper; 100 Food; 0 money; 0 Crowns) in 100% of tested cases.
- **SC-009**: The game-over screen presents a clear and accessible call-to-action to reset and replay, reachable within one interaction from the loss state.

## Assumptions

- Starting Reel composition: The player begins with 3 Blank icons (no effect), 1 Apple, and 1 Copper pre-loaded in the reel (5 icons total).
- Icon matching rule: Apple, Triple Apple, and Dozen Apple are all members of the Apple icon family and are treated as the same icon for column-alignment matching. A column's Apple value is the sum of the values of all Apple-family icons visible in that column.
- Currency display: Copper, Silver, and Gold are shown as separate numeric balances rather than a single converted total.
- Game state is persisted automatically in the browser's local storage so that refreshing or closing the tab resumes from where the player left off.
- A Hard Reset button is always visible during play. Activating it wipes local storage and restores the exact initial game state (3 Blank, 1 Apple, 1 Copper reel; 100 Food; 0 Money; 0 Crowns).
- When the player loses (Food reaches 0), the game-over screen encourages the player to hard reset and play again rather than simply ending the session.
- No sound: Audio is out of scope for MVP.
- No multiplayer: Single-player only.
- Deployment target: GitHub Pages (static site, no server-side logic).
- The game is self-contained in a single HTML/CSS/JS bundle for easy GitHub Pages deployment.
