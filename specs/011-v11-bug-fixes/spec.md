# Feature Specification: Version 1.1 Bug Fixes

**Feature Branch**: `011-v11-bug-fixes`

**Created**: 2026-06-14

**Status**: Draft

**Input**: User description: "Version 1.1 Bug Fixes — Apple family icon border colors, multiplier display, Magic Boost visual, Reels Store purchase feedback, unclaimed spin gating, SSS feat description update"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Apple Family Icon Border Colors (Priority: P1)

A player spins the reels and has a mix of Apple, 2xApple, and 3xApple icons across columns. The color-highlight system should treat all Apple-family icons as matching variants of the same icon family for purposes of green/yellow border logic. Currently, the system only matches exact icons, so a reel with Apple, 2xApple, and 3xApple across three columns does not light up green even though the player has an Apple-family icon in every column.

**Why this priority**: The color-coding system is the primary visual feedback mechanism for winning combinations. When it silently fails for the Apple family, players are confused and lose trust in the game feedback.

**Independent Test**: Spin until Apple, 2xApple, and 3xApple each appear in separate columns. The border should turn green. Can be tested with a known seed or by manually setting reel state.

**Acceptance Scenarios**:

1. **Given** Apple appears in column 1, 2xApple in column 2, and 3xApple in column 3, **When** the spin result is evaluated, **Then** all three cells receive a green border.
2. **Given** Apple appears in column 1 and 3xApple in column 2 but column 3 has no Apple-family icon, **When** the spin result is evaluated, **Then** those two Apple-family cells receive a yellow border.
3. **Given** only one column contains any Apple-family icon, **When** the spin result is evaluated, **Then** no border highlight is applied to Apple-family cells.

---

### User Story 2 - Multiplier Icon Display Fix (Priority: P1)

A player's reel contains 2xApple or 3xApple icons. These icons should display both the base Apple image and an integer multiplier label, similar to how Magic Boost overlays work. Currently the multiplier integer is visually cut off (cropped or overflowing), making it difficult to read.

**Why this priority**: The multiplier value directly communicates payout magnitude. A player who cannot read the multiplier cannot make informed decisions about their reel composition.

**Independent Test**: Navigate to the Spin tab with a reel containing 2xApple or 3xApple. The "2" or "3" label must be fully visible alongside the Apple icon without clipping.

**Acceptance Scenarios**:

1. **Given** a reel cell displays a 2xApple icon, **When** the cell is rendered, **Then** both the Apple icon and the label "2" are fully visible without any clipping or overflow.
2. **Given** a reel cell displays a 3xApple icon, **When** the cell is rendered, **Then** both the Apple icon and the label "3" are fully visible without any clipping or overflow.
3. **Given** a Magic Boost is applied to a 2xApple icon, **When** the cell is rendered, **Then** the multiplier is displayed exactly once — not twice — alongside the icon.

---

### User Story 3 - Reels Store Purchase Feedback (Priority: P2)

A player taps "Buy" on a reel in the Reels Store. After the purchase completes, the UI should provide clear, immediate visual confirmation that the transaction succeeded — e.g., a brief animation, color change, checkmark, or toast notification. Currently, the UI does not change noticeably after purchase, leaving players uncertain whether the action succeeded.

**Why this priority**: Lack of purchase feedback creates uncertainty and may lead to accidental duplicate purchase attempts or perceived bugs.

**Independent Test**: Open the Reels Store with sufficient currency and purchase one reel. Observable confirmation must appear within 1 second of tapping Buy.

**Acceptance Scenarios**:

1. **Given** a player has enough currency to buy a reel, **When** they tap Buy, **Then** a visible success indicator appears within 1 second.
2. **Given** a reel was just purchased, **When** the player looks at the store, **Then** the purchased reel is visually distinguished from unpurchased reels.

---

### User Story 4 - Unclaimed Spin Gating (Priority: P2)

A player has an unclaimed spin result on the Spin tab. If the player tries to navigate to the Reels Store to buy something, or attempts to prestige, the game should block those actions and notify the player to claim their current spin first. Currently, players can prestige or purchase without claiming, which can cause state inconsistencies.

**Why this priority**: Allowing purchases or prestige while a spin is unclaimed can lead to incorrect reward calculations or corrupted game state.

**Independent Test**: Spin the reels and do not claim. Attempt to purchase a reel from the Reels Store and attempt to prestige. Both actions should be blocked with a user-facing message.

**Acceptance Scenarios**:

1. **Given** a spin result is unclaimed, **When** the player attempts to prestige, **Then** the prestige action is blocked and a message informs the player to claim their spin first.
2. **Given** a spin result is unclaimed, **When** the player attempts to buy a reel in the Reels Store, **Then** the purchase is blocked and a message informs the player to claim their spin first.
3. **Given** the player claims their spin, **When** they then attempt to prestige or purchase, **Then** the actions proceed normally without any blocking message.

---

### User Story 5 - SSS Feat Description Update (Priority: P3)

The "SSS" feat currently has an unclear or incorrect description. It should be updated to read: "Have at least 3 silver icons in your reel."

**Why this priority**: Accuracy of feat descriptions affects player understanding of progression requirements.

**Independent Test**: Open the Feats tab and locate the SSS feat. The description text should match exactly: "Have at least 3 silver icons in your reel."

**Acceptance Scenarios**:

1. **Given** a player opens the Feats tab, **When** they view the SSS feat, **Then** the description reads "Have at least 3 silver icons in your reel."

---

### Edge Cases

- What happens when all three columns show the same multiplied Apple variant (e.g., all 3xApple)? The green border should still apply and the multiplier renders correctly.
- What happens if a Magic Boost is applied to a 3xApple — does the multiplier display stack incorrectly? It should show the combined multiplier exactly once, in this case it should now display a 4xApple.
- What if a player rapidly attempts to prestige while a spin animation is in progress (spin not yet claimed)? The gate should still block prestige.
- What if the store has no affordable reels — does the unclaimed spin message still appear when the player navigates to the store? For consistency, yes.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The border color system MUST treat Apple, 2xApple, and 3xApple as members of the same icon family when evaluating green and yellow borders.
- **FR-002**: A green border MUST appear on all Apple-family cells when at least one Apple-family icon appears in every column.
- **FR-003**: A yellow border MUST appear on Apple-family cells when Apple-family icons appear in all columns except exactly one.
- **FR-004**: Cells displaying 2xApple or 3xApple MUST render both the Apple icon and the integer multiplier label without visual clipping.
- **FR-005**: The multiplier label on 2xApple and 3xApple icons MUST display the integer exactly once regardless of whether a Magic Boost is active.
- **FR-006**: After purchasing a reel in the Reels Store, the UI MUST display a visible success indicator within 1 second.
- **FR-007**: Purchased reels MUST be visually distinguished from unpurchased reels in the store view.
- **FR-008**: When a spin result is unclaimed, the prestige action MUST be disabled and MUST display a message directing the player to claim their spin.
- **FR-009**: When a spin result is unclaimed, reel purchases in the Reels Store MUST be disabled and MUST display a message directing the player to claim their spin.
- **FR-010**: The SSS feat description MUST read exactly: "Have at least 3 silver icons in your reel."

### Key Entities

- **Icon Family**: A grouping of related icons (e.g., Apple, 2xApple, 3xApple) that share border-highlight logic.
- **Spin Result**: The outcome of a spin that remains "unclaimed" until the player explicitly claims rewards.
- **Reel Cell**: The individual grid cell displaying an icon on the Spin tab.
- **Feat**: A named achievement with a description and completion condition shown on the Feats tab.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of Apple-family border scenarios (green/yellow/none) produce the correct border color across all test spin combinations.
- **SC-002**: The 2xApple and 3xApple multiplier label is fully readable in all reel cell sizes with zero clipping in any tested viewport.
- **SC-003**: A Magic Boost applied to any Apple-family multiplier icon displays the multiplier exactly once — zero regressions in a test suite of boosted spins.
- **SC-004**: Players receive a visible purchase confirmation within 1 second of completing a reel purchase in 100% of test cases.
- **SC-005**: Prestige and reel purchase are blocked 100% of the time when a spin is unclaimed, with a user-facing message present each time.
- **SC-006**: The SSS feat description matches the specified string exactly in all locales/display sizes tested.

## Assumptions

- Apple-family icon grouping logic already exists or can be introduced without requiring a full icon system refactor.
- "Claiming a spin" is a discrete player action already implemented — this feature adds gating logic that checks that state before allowing other actions.
- The Reels Store and prestige flow are separate UI surfaces that both need to check the unclaimed-spin gate independently.
- No new icons or icon families are being added in this release; only existing Apple-family icons are affected.
- The SSS feat description change is a text-only update with no change to the underlying achievement condition logic.
- Visual feedback for reel purchase (SC-004) can be implemented using existing UI animation or notification primitives already in the project.
