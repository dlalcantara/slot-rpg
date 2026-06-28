# Feature Specification: Version 1.2 Final Release

**Feature Branch**: `012-v12-final-release`

**Created**: 2026-06-28

**Status**: Draft

**Input**: User description: "Version 1.2 Final Release — help text improvements across Spin Tab, Magic Phase, Reels Store, and main help; grouped icon display in Reels Tab; currency update bug fix; auto-claim toggle"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Understand Spin Results from Help Text (Priority: P1)

A new player reads the Spin Tab help text to understand how the slot machine pays out. The help text shows a worked example grid and explains the multiplier logic so the player understands why they earn some icons but not others.

**Why this priority**: Players who don't understand payout rules will feel confused or cheated. Clear examples in the help text are the primary onboarding tool for the spin mechanic.

**Independent Test**: Open the Spin Tab help panel; confirm the example grid, multiplier explanation for Apples, and Air exclusion explanation are present and accurate.

**Acceptance Scenarios**:

1. **Given** the player opens the Spin Tab help, **When** they read the help text, **Then** they see an example spin result showing the 5-column grid (e.g., `2xApple | Copper | Apple | Air | Apple`)
2. **Given** the player reads the example, **When** they review the explanation, **Then** the text explains that the player earns 4 Apples (2×1×2×1×1) and 1 Copper (1×1×1×1×1)
3. **Given** the player reads the example, **When** they review the explanation, **Then** the text explains that Air is not earned because it does not appear in every column
4. **Given** the player reads the help text, **When** they reach the end of the Spin Tab section, **Then** the text includes a prompt to buy icons from the Reels Store to increase possible spin payouts

---

### User Story 2 - Access Magic Phase Guidance (Priority: P2)

A player entering the Magic Phase for the first time opens the help panel within that tab and finds clear guidance on what actions are available and how elemental currency is earned.

**Why this priority**: The Magic Phase is a secondary game system. Players need in-context guidance rather than having to switch back to the Spin Tab help.

**Independent Test**: Open the Magic Phase help panel; confirm it contains the optional actions descriptions and the elemental currency earning explanation.

**Acceptance Scenarios**:

1. **Given** the player is in the Magic Phase, **When** they open the help panel, **Then** they see descriptions of the optional actions available in that phase
2. **Given** the player reads the Magic Phase help, **When** they review it, **Then** the text explains that elemental currency required for Magic is earned by spinning the slot machine
3. **Given** the Spin Tab help has been updated, **When** the player reads it, **Then** the optional actions descriptions have been removed from the Spin Tab help (they now live in the Magic Phase help only)

---

### User Story 3 - Understand Reels Store and Reel Tab Relationship (Priority: P3)

A player visits the Reels Store and reads the help text to understand how purchasing icons affects their slot machine and where they can see their current icon set.

**Why this priority**: Players need to understand the connection between the store and the Reel Tab to make informed purchasing decisions.

**Independent Test**: Open the Reels Store help panel; confirm the new statement about the Reel Tab showing current slot-machine icons is present.

**Acceptance Scenarios**:

1. **Given** the player opens the Reels Store help, **When** they read it, **Then** the text includes a statement explaining that the Reel Tab shows the current icons in their slot machine

---

### User Story 4 - Understand the Game Type from Main Help (Priority: P3)

A new player reads the main help text and immediately understands that this is a non-idle incremental game and that the Feats Tab contains achievements to unlock.

**Why this priority**: Setting correct expectations early prevents confusion and improves retention.

**Independent Test**: Open the main help panel; confirm the non-idle incremental game description and Feats Tab explanation are present.

**Acceptance Scenarios**:

1. **Given** the player opens the main help, **When** they read the overview, **Then** the text states this is a non-idle incremental game
2. **Given** the player reads the main help, **When** they review the section on tabs, **Then** the text explains that the Feats Tab contains achievements to unlock

---

### User Story 5 - View Grouped Icons in the Reels Tab (Priority: P2)

A player opens the Reels Tab and sees their icons grouped by type with a quantity indicator, rather than a long list of individual icon entries.

**Why this priority**: As players acquire many icons the Reels Tab becomes cluttered. Grouping makes the display readable and informative.

**Independent Test**: Add multiple copies of the same icon; open the Reels Tab and confirm they appear as a single entry with the correct quantity shown.

**Acceptance Scenarios**:

1. **Given** the player has multiple copies of the same icon type, **When** they open the Reels Tab, **Then** each icon type appears once with the quantity displayed next to it
2. **Given** the player has one copy of each icon type, **When** they open the Reels Tab, **Then** each icon type appears once with quantity 1 shown
3. **Given** the player has zero copies of a particular icon type, **When** they open the Reels Tab, **Then** that icon type does not appear in the list

---

### User Story 6 - Currency Tab Updates Immediately After Claim (Priority: P1)

A player who has disabled spin animations spins repeatedly and claims results quickly. The currency tab reflects the updated totals immediately after each claim, without any perceptible delay.

**Why this priority**: This is a bug fix. Incorrect currency display after rapid claiming breaks player trust and may cause confusion about whether claims registered.

**Independent Test**: Disable spin animation, spin and claim several times in rapid succession; confirm the currency tab updates correctly after each individual claim with no delay.

**Acceptance Scenarios**:

1. **Given** spin animations are disabled, **When** the player clicks Claim after a spin, **Then** the currency tab updates to reflect the new totals immediately
2. **Given** spin animations are disabled and the player spins and claims multiple times rapidly, **When** they check the currency tab, **Then** each individual claim is reflected without lag or batching
3. **Given** spin animations are enabled, **When** the player claims normally, **Then** currency tab behaviour is unchanged from before

---

### User Story 7 - Auto-Claim Toggle Skips Magic Phase (Priority: P2)

A player who wants a faster play loop enables auto-claim. From that point, completing a spin automatically delivers the spin result to their currency totals, bypassing the Magic Phase entirely.

**Why this priority**: Players who have established their strategy may find the Magic Phase an unwanted interrupt. Auto-claim provides a quality-of-life shortcut without removing the feature for others.

**Independent Test**: Enable auto-claim, spin the slot machine, and confirm the result is applied to currency without the Magic Phase appearing.

**Acceptance Scenarios**:

1. **Given** the auto-claim toggle is visible next to the auto-convert toggle, **When** the player views the UI, **Then** auto-claim is unticked by default
2. **Given** auto-claim is disabled, **When** the player completes a spin, **Then** the Magic Phase proceeds as normal
3. **Given** auto-claim is enabled, **When** the player completes a spin, **Then** the Magic Phase is skipped and the spin result is applied directly to the player's currency
4. **Given** auto-claim is enabled, **When** the player toggles it off, **Then** subsequent spins return to the normal Magic Phase flow

---

### Edge Cases

- What happens to the Magic Phase help icon if the player has never entered the Magic Phase yet?
The help icon is only displayed when the Magic Phase is displayed.
- How does auto-claim interact with the auto-convert toggle — are both toggles independent?
Yes.
- If a player has exactly one of each icon in the Reels Tab, does the quantity indicator still display (showing "1") or is it hidden?
Yes show 1.
- Does the currency tab update fix apply when animations are partially enabled (e.g., reduced speed)?
Yes the currency tab fix should apply such that when the user presses claim (or the spin is auto-claimed) the currency reflects correctly immediately.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The Spin Tab help text MUST display a worked example spin result grid showing at least 5 columns with mixed icon types
- **FR-002**: The Spin Tab help text MUST explain how payout multipliers are calculated across columns for each icon type
- **FR-003**: The Spin Tab help text MUST explain that icons not present in every column are not paid out
- **FR-004**: The Spin Tab help text MUST include a prompt directing players to buy icons from the Reels Store to increase spin payouts
- **FR-005**: The optional actions descriptions MUST be removed from the Spin Tab help text and relocated to the Magic Phase help
- **FR-006**: The Magic Phase section MUST display a help text icon that opens a help panel
- **FR-007**: The Magic Phase help text MUST include the optional actions descriptions (previously in Spin Tab help)
- **FR-008**: The Magic Phase help text MUST state that elemental currency required for Magic is earned by spinning the slot machine
- **FR-009**: The Reels Store help text MUST include a statement explaining that the Reel Tab shows the current icons in the player's slot machine
- **FR-010**: The main help text MUST state that this is a non-idle incremental game
- **FR-011**: The main help text MUST explain that the Feats Tab contains achievements to unlock
- **FR-012**: The Reels Tab MUST group icons of the same type and display the quantity of each type rather than listing each icon individually
- **FR-013**: After clicking Claim (with animations disabled), the currency tab MUST update immediately without delay
- **FR-014**: An auto-claim toggle MUST appear in the UI adjacent to the auto-convert toggle
- **FR-015**: The auto-claim toggle MUST default to unticked (off)
- **FR-016**: When auto-claim is enabled, completing a spin MUST skip the Magic Phase and apply the spin result directly to the player's currency

### Key Entities

- **Spin Result**: The outcome of a single slot machine spin; an ordered set of icon columns used to calculate payouts
- **Icon**: A symbol that can appear on a reel; has a type and a payout multiplier; multiple copies of the same type may be owned
- **Reel Inventory**: The collection of icons currently installed in the player's slot machine, grouped by icon type with a quantity per type
- **Currency**: The earned resource totals displayed in the currency tab; updated after each claim
- **Auto-Claim Toggle**: A player-controlled switch that, when enabled, bypasses the Magic Phase and auto-applies spin results

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A new player reading only the Spin Tab help text can correctly predict the payout of a given spin example without additional guidance
- **SC-002**: A player in the Magic Phase can find and open in-context help without leaving the Magic Phase tab
- **SC-003**: The Reels Tab correctly displays grouped icons with accurate quantities for all icon types owned by the player
- **SC-004**: After claiming a spin result with animations disabled, the currency tab reflects the correct updated total within one rendering frame (no perceptible delay)
- **SC-005**: The auto-claim toggle is visible, defaults to off, and when enabled causes zero Magic Phase screens to appear across 10 consecutive spins
- **SC-006**: The auto-claim and auto-convert toggles operate independently — enabling one does not affect the other

## Assumptions

- The existing help panel system (used by other tabs) will be reused for the new Magic Phase help icon; no new help UI framework is needed
- "Optional actions descriptions" refers to the text in the current Spin Tab help that describes what the player can do during the Magic Phase; this content moves intact to the Magic Phase help
- The Reels Tab grouping change is a display-only change; the underlying data model (individual icon entries) is unchanged
- The currency update bug is specific to the no-animation path and does not affect the animated spin flow.  Please check during Planning
- Auto-claim only bypasses the Magic Phase interaction; all other post-spin logic (currency calculation, reel spin animation if enabled) runs as normal
- The auto-claim toggle state is persisted across sessions (consistent with the existing auto-convert toggle behaviour)
