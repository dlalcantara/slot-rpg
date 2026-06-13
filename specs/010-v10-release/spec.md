# Feature Specification: Version 1.0 Release Polish

**Feature Branch**: `010-v10-release`

**Created**: 2026-06-14

**Status**: Draft

**Input**: User description: "Version 1.0 Release — help modals, emoji icons, bug fixes, UI renames and reordering"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - New Player Seeks Game Help (Priority: P1)

A player who is new to Slot RPG wants to understand how the game works and what each tab does before committing to a play session. They notice a help icon next to the game title and another on each tab, click them, and read clear explanations.

**Why this priority**: Without onboarding guidance, new players may not understand the scoring system or tab purposes, leading to confusion and abandonment. This is the highest-value improvement for player retention.

**Independent Test**: Can be fully tested by clicking the help icon next to the Slot RPG logo and each tab help icon independently, confirming a modal appears with relevant explanations each time.

**Acceptance Scenarios**:

1. **Given** a player is on any screen, **When** they click the help icon next to the Slot RPG logo, **Then** a modal appears explaining how to play the game along with the AI attribution statement.
2. **Given** a player is viewing any tab, **When** they click the help icon on that tab, **Then** a modal appears explaining what that tab is for.
3. **Given** a player is viewing the Spin Tab, **When** they click the Spin Tab help icon, **Then** the modal includes a clear explanation of the slot machine scoring system.
4. **Given** a help modal is open, **When** the player dismisses it, **Then** they return to the game in the same state they left.

---

### User Story 2 - Player Views Currency Panel (Priority: P2)

A player checking their currency holdings wants to see all currencies at a glance in a logical, organized layout using recognizable emoji icons instead of text placeholders.

**Why this priority**: The currency panel is visible during every play session. A clear, organized two-row layout with emoji icons improves readability and overall polish, making the game feel more complete.

**Independent Test**: Can be tested by opening the game and inspecting the currency panel for layout, emoji display, and correct ordering without any interaction required.

**Acceptance Scenarios**:

1. **Given** the game is open, **When** the player views the currency panel, **Then** it displays two rows of five currencies each.
2. **Given** the currency panel is visible, **When** the player reads the first row, **Then** it shows Apple, Copper, Silver, Gold, Crowns in that order with matching emoji icons.
3. **Given** the currency panel is visible, **When** the player reads the second row, **Then** it shows Air, Water, Earth, Fire, Spins in that order with matching emoji icons.
4. **Given** any currency is displayed anywhere in the game, **When** the player sees it, **Then** it uses the emoji icon consistent with the reel icons.

---

### User Story 3 - Player Reads Achievement Descriptions (Priority: P3)

A player reviewing the Feats/Achievements list wants accurate descriptions so they know exactly what they need to do to unlock each achievement, particularly "Second breakfast" and "Master of Elements."

**Why this priority**: Inaccurate achievement descriptions erode player trust. Fixing these bugs ensures the game communicates honestly with players about unlock conditions.

**Independent Test**: Can be tested by opening the Feats tab and reading the listed descriptions for the two affected achievements.

**Acceptance Scenarios**:

1. **Given** the player opens the Feats tab, **When** they find "Second breakfast," **Then** the description reads "Earn >= 2 Apple in one spin."
2. **Given** the player opens the Feats tab, **When** they find "Master of Elements," **Then** the description reads "Earn all four elements in one spin."
3. **Given** the Feats list is displayed, **When** the player scans the order, **Then** "Blow It Up" appears before "Be Water, My Friend."

---

### User Story 4 - Player Uses Renamed and Reorganized UI (Priority: P4)

A returning player notices consistent terminology and a cleaned-up Spin Tab, including the renamed "Reels Store" and the removal of the x1 button.

**Why this priority**: Consistent naming and removal of unnecessary controls reduce cognitive overhead and polish the overall experience for v1.0.

**Independent Test**: Can be tested by navigating to the Spin Tab, Store, and verifying labels and button presence independently.

**Acceptance Scenarios**:

1. **Given** the player opens what was previously called "Market," **Then** it is now labeled "Reels Store."
2. **Given** the player is in the Spin Tab, **When** they view the spin controls, **Then** the x1 button is not present.
3. **Given** any screen that previously referenced "Food" as a currency name, **Then** it now displays "Apple."

---

### Edge Cases

- What happens when a player opens a help modal on mobile-sized viewports — does it remain readable?
Yes help modal should be readable on mobile.
- How does the currency panel handle display if a currency has a zero balance — does the emoji still appear?
Yes, displayed with the zero balance.
- What if a player has saved progress that references "Food" — does the rename display consistently with their existing data?
Yes, it is only a label change.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: A help icon MUST be displayed on each tab.
- **FR-002**: Clicking a tab help icon MUST open a modal describing that tab's purpose.
- **FR-003**: The Spin Tab help modal MUST include an explanation of the slot machine scoring system.
- **FR-004**: A help icon MUST be displayed adjacent to the Slot RPG game logo.
- **FR-005**: Clicking the logo help icon MUST open a modal explaining the overall game.
- **FR-006**: The game help modal MUST include the following AI attribution text verbatim: "AI & Attribution — Claude (an AI assistant) was used only for programming this game. The design is original and no AI-generated art assets were used."
- **FR-007**: All icon placeholder text MUST be replaced with appropriate emoji icons.
- **FR-008**: The "Second breakfast" achievement description MUST read "Earn >= 2 Apple in one spin."
- **FR-009**: The "Master of Elements" achievement description MUST read "Earn all four elements in one spin."
- **FR-010**: The currency previously called "Food" MUST be renamed to "Apple" in all locations.
- **FR-011**: The currency panel MUST display in exactly two rows of five currencies each.
- **FR-012**: The first row of the currency panel MUST contain, in order: Apple, Copper, Silver, Gold, Crowns.
- **FR-013**: The second row of the currency panel MUST contain, in order: Air, Water, Earth, Fire, Spins.
- **FR-014**: Each currency in the panel MUST be represented by the same emoji used for that currency's reel icon.
- **FR-015**: The x1 button MUST be removed from the Spin Tab.
- **FR-016**: The section previously labeled "Market" MUST be renamed "Reels Store."
- **FR-017**: In the Feats list, "Blow It Up" MUST appear before "Be Water, My Friend."

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A new player can access a help explanation for any tab or the overall game within 2 clicks from any screen.
- **SC-002**: All tab help modals and the game help modal are present and contain non-empty, relevant content.
- **SC-003**: Zero icon placeholder text strings remain visible anywhere in the game.
- **SC-004**: Both corrected achievement descriptions exactly match their specified wording.
- **SC-005**: The currency panel consistently shows two rows of five, in the specified order, using emoji icons, across all screen sizes where the panel is visible.
- **SC-006**: The label "Market" does not appear anywhere in the game UI.
- **SC-007**: The label "Food" does not appear anywhere in the game UI.
- **SC-008**: The x1 button is absent from the Spin Tab.
- **SC-009**: "Blow It Up" appears above "Be Water, My Friend" in the Feats list.

## Assumptions

- The game already has a tab-based navigation structure; the help icons will be added to the existing tab headers.
- The Slot RPG logo is already present in the UI; the help icon will be placed adjacent to it without replacing or obscuring it.
- Emoji icons appropriate for each currency type (Apple, Copper, Silver, Gold, Crowns, Air, Water, Earth, Fire, Spins) are already in use on the reels and will be reused for the currency panel.
- The "Food" rename to "Apple" is purely a display/label change; underlying game logic referencing this currency will be updated to match.
- The x1 button removal does not require any functional replacement — x1 spins are either the default behavior or the feature is being removed entirely.
- Help modal content for non-Spin tabs will be concise explanations (one to three sentences) describing what the tab contains.
- Mobile viewport support for modals follows existing modal patterns already in the game.
