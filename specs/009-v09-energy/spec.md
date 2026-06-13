# Feature Specification: Version 0.9 — Energy

**Feature Branch**: `009-v09-energy`

**Created**: 2026-06-13

**Status**: Draft

**Input**: User description: "Version 0.9 — Energy icon with row expansion, auto-prestige on starvation, prestige copper start, and achievement bug fixes"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Energy Icon and Row Expansion (Priority: P1)

A player saves up resources (1 gold, 1 air, 1 water, 1 earth, 1 fire) and buys an Energy icon from the Market. When the Energy icon contributes to a spin payout, it generates energy for that spin. If the total energy gained in a single spin reaches 16, the slot machine permanently expands to 4 rows and the "Sweet" achievement unlocks. If it reaches 69, the slot machine permanently expands to 5 rows and the "Nice" achievement unlocks. Both row counts persist until the player prestiges, at which point the slot machine resets to 3 rows.

**Why this priority**: Energy is the headline feature of this version; the row expansion it enables directly affects all other gameplay. The "Sweet" and "Nice" achievements replace the former WIP placeholders.

**Independent Test**: Buy the Energy icon → spin until it contributes ≥ 16 energy in one spin → confirm the slot machine visually gains a 4th row → open Achievements tab → confirm "Sweet" is unlocked. Continue until ≥ 69 energy in a single spin → confirm 5th row and "Nice" achievement.

**Acceptance Scenarios**:

1. **Given** the player has 1 gold, 1 air, 1 water, 1 earth, and 1 fire, **When** they buy the Energy icon from the Market, **Then** the purchase succeeds, all five currencies are deducted, and the Energy icon appears in the reel.
2. **Given** the player has only 4 of the required 5 currencies, **When** they try to buy the Energy icon, **Then** the buy button is disabled.
3. **Given** the Energy icon is in the reel and contributes to a spin, **When** the player claims the result and total energy for that spin is ≥ 16 for the first time, **Then** the slot machine immediately displays 4 rows per column, the "Sweet" achievement dialog appears, and the 4-row state is saved.
4. **Given** the slot machine is at 4 rows, **When** the player claims a spin with ≥ 69 energy, **Then** the slot machine expands to 5 rows and the "Nice" achievement dialog appears.
5. **Given** the slot machine is at 4 or 5 rows, **When** the player prestiges, **Then** the slot machine resets to 3 rows on the next play session.
6. **Given** the player has never gained 16 energy in a single spin, **When** they claim a spin with 15 energy, **Then** no row expansion occurs and no "Sweet" dialog appears.

---

### User Story 2 - Auto-Prestige on Food Depletion (Priority: P2)

When a player claims a spin that leaves them with zero food, instead of the game ending in a loss, they are automatically prestiged — their reel resets to the four default starting icons (apple, copper, air, water) and their currencies reset to the standard prestige starting amounts. They continue playing without interruption.

**Why this priority**: Removes the frustrating hard stop of a game over from resource mismanagement; allows the game to continue indefinitely in the spirit of the v0.8 win-condition removal.

**Independent Test**: Reduce food to exactly 1, spin with a multiplier of 1 so food goes to 0 → confirm no Game Over screen → confirm reel now contains exactly {apple, copper, air, water} → confirm starting currencies are restored.

**Acceptance Scenarios**:

1. **Given** the player's food reaches exactly 0 after claiming a spin, **When** the claim resolves, **Then** the Game Over screen does NOT appear; instead the reel resets to {apple, copper, air, water} and currencies reset to prestige starting amounts.
2. **Given** the auto-prestige triggers, **When** the new state loads, **Then** the slot machine returns to 3 rows (regardless of prior row count).
3. **Given** the auto-prestige triggers, **When** the new state loads, **Then** a notification is displayed telling the player they ran out of food and the slot machine has been reset; normal play resumes after dismissing it.
4. **Given** the auto-prestige triggers, **When** the new state loads, **Then** all previously unlocked achievements remain unlocked.
5. **Given** the auto-prestige triggers, **When** the new state loads, **Then** no achievement unlock dialog appears for prestige achievements (auto-prestige does not trigger "I Understand It Now" or "Born with Diamond Spoon").

---

### User Story 3 - Prestige Starting Copper (Priority: P2)

When a player performs a regular (player-initiated) prestige, they now start with 10 copper in addition to the existing starting resources (10 food, 10 air, 10 water).

**Why this priority**: Quality-of-life improvement that reduces early-game friction after prestige; pairs with the bug fix that allows copper purchases to be funded by gold.

**Independent Test**: Prestige normally → confirm starting currencies include food=10, air=10, water=10, copper=10.

**Acceptance Scenarios**:

1. **Given** a player initiates a regular prestige, **When** the prestige completes, **Then** their currencies include copper=10, food=10, air=10, water=10 (and all others at 0).
2. **Given** the auto-prestige (from US2) triggers, **When** the new state loads, **Then** currencies also include copper=10 alongside the other starting amounts.

---

### User Story 4 - Bug Fixes (Priority: P3)

Four existing bugs are corrected:

1. **"Second Breakfast" achievement condition**: Currently triggers if any 2 apple-family icons appear anywhere in the spin grid. It should only trigger when the claimed spin payout includes ≥ 2 apple-currency (i.e., the apple icons formed a qualifying column group generating at least a 2×1×1×1×1 payout).
2. **"Master of Elements" achievement condition**: Currently triggers if 1 icon of each element appears anywhere in the spin grid. It should only trigger when the claimed spin payout includes ≥ 1 of each of air, water, earth, fire currency (i.e., each element formed a qualifying column group).
3. **Multi-level currency downgrade**: A player with 0 copper, 0 silver, and some gold cannot currently buy copper-cost items. The conversion chain gold → silver → copper must work in full, not just one level at a time.
4. **"I Understand It Now" condition and description**: Should trigger when the player prestiges while keeping any icon whose purchase price is at least 1 silver (i.e., the icon's market cost is in silver or gold currency). Description should reflect this.

**Why this priority**: These are correctness fixes. The game functions without them, but player trust and achievement accuracy depend on them.

**Independent Test**: (a) Spin with 1 apple in 4 columns and 0 in 1 column → confirm "Second Breakfast" does NOT fire; spin where apple payout ≥ 2 → confirm it DOES fire. (b) Same logic for Master of Elements. (c) With 0 copper and 0 silver but 1 gold, attempt to buy a copper item → confirm it succeeds. (d) Prestige keeping only copper-cost icons → confirm "I Understand It Now" does NOT fire; prestige keeping any silver/gold-cost icon → confirm it DOES fire.

**Acceptance Scenarios**:

1. **Given** a spin result where apple icons appear in 2 columns but the payout is 2 apple-food (e.g., 2 columns each with 1 apple each), **When** the player claims, **Then** "Second Breakfast" triggers (≥2 food earned from apple family).
2. **Given** a spin result where apple icons appear in only 1 column producing 1 food, **When** the player claims, **Then** "Second Breakfast" does NOT trigger.
3. **Given** a spin result where each of air, water, earth, fire elements produces ≥ 1 of its currency, **When** the player claims, **Then** "Master of Elements" triggers.
4. **Given** a spin result where only 3 of the 4 elements produce currency, **When** the player claims, **Then** "Master of Elements" does NOT trigger.
5. **Given** a player has 0 copper, 0 silver, and 2 gold, **When** they buy a 1-copper item, **Then** the purchase succeeds: gold converts to silver, then silver converts to copper to fund the cost.
6. **Given** a player prestiges keeping only 1 copper, air, water icons (all copper-cost), **When** prestige completes, **Then** "I Understand It Now" does NOT trigger.
7. **Given** a player prestiges keeping any icon that costs silver or gold (e.g., earth, fire, crown), **When** prestige completes, **Then** "I Understand It Now" triggers.

---

### Edge Cases

- What if the player gains exactly 69 energy in a single spin without ever having gained 16? Both "Sweet" and "Nice" achievements unlock simultaneously and rows jump directly to 5.
- What if the player already has 4 rows and gains 16 energy again? No change to rows; "Sweet" is already unlocked (no duplicate dialog).
- What if the player gains 69 energy when already at 5 rows? No change; "Nice" already unlocked.
- What if the auto-prestige triggers and the player had the "Out of Stock" achievement? Achievements always persist through prestige.
- What if the player has 0 food AND gains 0 food in a spin that includes other payouts? Auto-prestige triggers — the net food after the spin determines the outcome, not food before.
- What if the Energy icon appears in a blocked column? That column's count is excluded from the product — effectively its factor becomes 0, making total energy for the spin 0 unless the player has Energy icons in all remaining active columns.
- Can the Energy icon trigger the "Out of Stock" achievement? Yes — if the player accumulates enough Energy icons that a single icon type reaches 50% of the reel, "Out of Stock" unlocks normally.
- Can a player own multiple Energy icons? Yes, subject to the standard `qty × 2 < reel_size` market cap.

## Requirements *(mandatory)*

### Functional Requirements

**Energy Icon:**
- **FR-001**: The Market MUST offer an Energy icon purchasable for the combined cost of exactly 1 gold AND 1 air AND 1 water AND 1 earth AND 1 fire (all five currencies deducted simultaneously).
- **FR-002**: The Energy icon buy button MUST be disabled if the player lacks any of the five required currencies.
- **FR-003**: Energy generated by the Energy icon in a spin MUST NOT be added to the persistent currency bar; it exists only within the context of a single spin claim. The energy total for a spin is the product of the Energy icon count across each active column (e.g., column counts of 2, 2, 2, 2, 1 yield 2×2×2×2×1 = 16 energy). Any column with zero Energy icons makes the product zero — the icon must appear in every active column to generate any energy.
- **FR-004**: When the total energy for a single claimed spin first reaches or exceeds 16, the slot machine row count MUST increase to 4 and the "Sweet" achievement MUST unlock.
- **FR-005**: When the total energy for a single claimed spin first reaches or exceeds 69, the slot machine row count MUST increase to 5 and the "Nice" achievement MUST unlock.
- **FR-006**: If energy in a single spin reaches ≥ 69 without previously reaching 16, both "Sweet" and "Nice" MUST unlock and rows MUST be set to 5.
- **FR-007**: The row count (3, 4, or 5) MUST persist across spins until the player prestiges.
- **FR-008**: On any prestige (regular or auto), the slot machine row count MUST reset to 3.
- **FR-009**: "Sweet" and "Nice" MUST replace the "WIP1" and "WIP2" placeholder achievements respectively; they are no longer labeled "Coming Soon."

**Auto-Prestige on Starvation:**
- **FR-010**: When a player's food reaches 0 after claiming a spin result, the game MUST NOT transition to the Game Over state.
- **FR-010a**: The game MUST display a notification informing the player that they ran out of food and that the slot machine has been reset, before resuming play.
- **FR-011**: The game MUST automatically prestige the player with the reel reset to exactly the four icons: apple, copper, air, water (one of each).
- **FR-012**: Starting currencies after auto-prestige MUST be the same as regular prestige starting amounts (food=10, air=10, water=10, copper=10).
- **FR-013**: Auto-prestige MUST NOT trigger achievement checks for prestige-based achievements ("I Understand It Now", "Born with Diamond Spoon").
- **FR-014**: All previously unlocked achievements MUST remain unlocked after auto-prestige.

**Prestige Starting Copper:**
- **FR-015**: After any prestige (regular or auto), the player MUST start with copper=10 in addition to food=10, air=10, water=10.

**Bug Fixes:**
- **FR-016**: "Second Breakfast" MUST only unlock when the claimed spin payout includes food earned from apple-family icons totaling ≥ 2 (i.e., apple-family payout amount ≥ 2). Update the achievement description accordingly.
- **FR-017**: "Master of Elements" MUST only unlock when the claimed spin payout includes ≥ 1 currency earned from each of the four element families (air, water, earth, fire). Update the achievement description accordingly.
- **FR-018**: The multi-level currency conversion MUST support full chain traversal: a player with gold but no silver and no copper MUST be able to buy copper-cost items (gold converts to silver, then silver converts to copper).
- **FR-019**: "I Understand It Now" MUST only unlock when the player prestiges while keeping at least one icon whose Market purchase price is denominated in silver or gold. Update the achievement description to say "Prestige keeping an icon that costs at least 1 silver."

### Key Entities

- **Energy**: A transient spin-level value (not a persistent currency) equal to the product of the Energy icon count in each active column (same formula as other icon payouts). Exists only during the CLAIM evaluation phase; zero if the Energy icon is absent from any active column.
- **Energy Icon**: A new purchasable icon (multi-currency cost: 1 gold + 1 air + 1 water + 1 earth + 1 fire). Generates energy when it appears in an active spin column.
- **Row Count**: A persistent game-state value (3, 4, or 5) representing how many rows the slot machine displays per column. Defaults to 3; upgraded by energy thresholds; resets on prestige.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: The Energy icon buy button enables exactly when the player holds ≥ 1 of each of the five required currencies simultaneously; disabled otherwise.
- **SC-002**: Row expansion to 4 rows fires on 100% of spins that produce ≥ 16 energy (when not already at 4+ rows); no false positives on spins with < 16 energy.
- **SC-003**: Row expansion to 5 rows fires on 100% of spins that produce ≥ 69 energy (when not already at 5 rows).
- **SC-004**: Auto-prestige triggers on 100% of claims that result in food = 0; Game Over screen never appears in normal play.
- **SC-005**: Post-prestige (regular and auto) starting currencies always include copper = 10.
- **SC-006**: "Second Breakfast" achievement unlocks if and only if apple-family spin payout ≥ 2; zero false positives from grid icon counts.
- **SC-007**: "Master of Elements" achievement unlocks if and only if all four element families produce ≥ 1 currency in the claimed spin; zero false positives.
- **SC-008**: A player with 0 copper, 0 silver, and ≥ 1 gold successfully purchases any 1-copper-cost item in 100% of attempts.
- **SC-009**: "I Understand It Now" fires for silver/gold-cost icon prestiges and does not fire for copper-only prestiges — verified across all icon cost tiers in the catalog.

## Assumptions

- Energy follows the same product formula as other icon payouts: energy = count_in_col1 × count_in_col2 × count_in_col3 × count_in_col4 × count_in_col5 (for unblocked columns). For example, 2 Energy icons in each of four columns and 1 in the fifth yields 2×2×2×2×1 = 16. If any active column has 0 Energy icons, energy = 0.
- The slot machine width (number of columns) remains fixed at 5; only the row count per column changes.
- Regular prestige still requires the player to manually select ≥ 4 icons with ≥ 3 copies each; auto-prestige bypasses this requirement.
- The Energy icon is treated like any other icon for reel-cap and achievement purposes — it can trigger "Out of Stock" if it reaches 50% of the reel.
- Row count is part of `GameState` and is persisted in the same storage as other game state.
- Energy currency does not appear in the currency bar; it is not stored in `GameState.currencies`.
- Auto-prestige does not show a "you ran out of food" message — the transition is immediate with no intermediate screen.
- The multi-level currency conversion fix applies to all market purchases, not just the Energy icon.
