# Feature Specification: Slot Machine RPG v0.2 Enhancements

**Feature Branch**: `002-v02-enhancements`

**Created**: 2026-06-06

**Status**: Draft

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Tab Navigation Layout (Priority: P1)

Players can navigate between three dedicated tabs: Reel, Spin, and Market. Each tab provides focused access to a specific area of gameplay.

**Why this priority**: The tab layout is the structural foundation all other v0.2 enhancements depend on. Without it, the larger slot machine grid and organized UI improvements have no home.

**Independent Test**: Can be tested by loading the game and verifying three tabs appear and each shows distinct content when selected.

**Acceptance Scenarios**:

1. **Given** the game is loaded, **When** the player views the UI, **Then** three tabs are visible: "Reel", "Spin", and "Market"
2. **Given** the player is on any tab, **When** they click a different tab, **Then** that tab's content is shown and the previous tab's content is hidden
3. **Given** the Reel tab is active, **When** viewed, **Then** the player's current reel icons are displayed
4. **Given** the Spin tab is active, **When** viewed, **Then** the slot machine grid and Spin button are displayed
5. **Given** the Market tab is active, **When** viewed, **Then** the icon purchase interface is displayed

---

### User Story 2 - Always-Visible Currency Bar with Spin Counter (Priority: P2)

The currency bar is always visible regardless of which tab is active. It shows all currencies (Food, Gold, Silver, Copper, Crowns), reordered so Gold appears before Silver before Copper. The Spins counter also appears in the bar and increments each time the player spins.

**Why this priority**: Persistent game state visibility (currency and spin count) helps players track progress without switching tabs. The spin counter helps compare efficiency toward the win condition.

**Independent Test**: Can be tested by performing several spins across different tabs and confirming the currency bar and spin count update correctly throughout.

**Acceptance Scenarios**:

1. **Given** the game is on any tab, **When** viewed, **Then** the currency bar is always visible
2. **Given** the currency bar is visible, **When** viewed, **Then** all currencies are shown and Gold appears before Silver, which appears before Copper (Food and Crowns positions are unchanged)
3. **Given** the player has not yet spun, **When** viewing the currency bar, **Then** the Spins counter shows 0
4. **Given** the player presses Spin, **When** the spin completes, **Then** the Spins counter increments by 1
5. **Given** multiple spins have occurred, **When** viewed, **Then** the Spins counter reflects the total number of spins performed

---

### User Story 3 - Improved Spin Animation (Priority: P3)

While spinning, all columns animate immediately and change their displayed icons every 0.2 seconds. Columns stop individually with a clear visual indicator. When all columns stop, a modal summarizes the spin result and currencies earned.

**Why this priority**: Animation polish improves the game feel and the result modal provides clear feedback, which together enhance the core gameplay loop.

**Independent Test**: Can be tested by pressing Spin and observing all columns animate, stop distinctly, and a modal appears with results.

**Acceptance Scenarios**:

1. **Given** the player presses Spin, **When** spinning begins, **Then** all columns enter the spinning state immediately (no stagger delay)
2. **Given** a column is spinning, **When** viewed, **Then** its displayed icons change every 0.2 seconds
3. **Given** a column is spinning, **When** viewed, **Then** it looks clearly different from its default/stopped appearance (the spinning state must be visually obvious, not a subtle change)
4. **Given** all columns have stopped, **When** the spin resolves, **Then** a modal appears showing the spin result and currencies earned
5. **Given** the result modal is displayed, **When** the player dismisses it, **Then** the game returns to the normal Spin tab state

---

### User Story 4 - Updated Starting Reel and Larger Icon Size (Priority: P4)

New players start with a reel of 2 blanks, 1 apple, and 1 copper icon. All icons are displayed at 128×128 pixels throughout the game.

**Why this priority**: Starting reel balance and icon sizing affect first impressions and readability. These are low-risk visual changes with clear specifications.

**Independent Test**: Can be tested by starting a new game and confirming the reel contents and icon sizes match the specification.

**Acceptance Scenarios**:

1. **Given** a new game is started, **When** the Reel tab is viewed, **Then** the reel contains exactly: 2 blank icons, 1 apple icon, 1 copper icon
2. **Given** any icon is displayed anywhere in the game, **When** rendered, **Then** the icon is 128×128 pixels

---

### Edge Cases

- What happens when the player dismisses the result modal quickly — does it interrupt the next spin if pressed rapidly?  Player is allowed to dismiss the modal quickly.
- How does the currency bar display when values reach large numbers (e.g., overflow)?

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The UI MUST display a persistent currency bar visible on all tabs showing all currencies (Food, Gold, Silver, Copper, Crowns) plus a Spins counter, with Gold displayed before Silver, and Silver before Copper
- **FR-002**: The Spins counter MUST increment by 1 each time the player completes a spin
- **FR-003**: The layout MUST be organized into three tabs: Reel (index 0), Spin (index 1), and Market (index 2)
- **FR-004**: The Reel tab MUST display the contents of the player's current reel
- **FR-005**: The Spin tab MUST display the slot machine grid and the Spin button
- **FR-006**: The Market tab MUST display the icon purchase interface
- **FR-007**: The slot machine grid MUST be larger than the pre-tab layout (utilizing space freed by the tab structure)
- **FR-008**: When the Spin button is pressed, ALL columns MUST enter the spinning state simultaneously
- **FR-009**: While spinning, each column MUST update its displayed icon every 0.2 seconds
- **FR-010**: A spinning column MUST be visually obviously distinct from its default/stopped state (the spinning appearance must be clearly different, not a subtle variation)
- **FR-011**: When all columns have stopped, a modal MUST appear showing the spin result and currencies earned
- **FR-012**: All icons throughout the game MUST be displayed at 48×48 pixels
- **FR-013**: A new game MUST begin with a reel of exactly 2 blank icons, 1 apple icon, and 1 copper icon
- **FR-014**: The Spin button MUST be disabled and non-interactive while a spin is in progress

### Key Entities

- **Currency Bar**: Persistent UI element displaying all currency balances (Food, Gold, Silver, Copper, Crowns) and Spins counter; always visible above or outside the tab area; ordered so Gold precedes Silver precedes Copper
- **Spin Counter**: Integer tracking total number of spins performed; resets with a new game
- **Tab**: A named view (Reel, Spin, Market) that shows distinct game content; only one tab is active at a time
- **Spin Result Modal**: A temporary overlay that appears after all slot columns stop; displays matched icons and currency earned; dismissed by player

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: All three tabs (Reel, Spin, Market) are accessible and display the correct content 100% of the time
- **SC-002**: The currency bar and Spins counter are visible on every tab without requiring any navigation
- **SC-003**: All slot columns begin animating within one frame of pressing the Spin button (no perceptible delay between columns)
- **SC-004**: Each spinning column visually updates at a rate of 5 times per second (every 0.2 seconds)
- **SC-005**: The result modal appears within 0.5 seconds of the last column stopping
- **SC-006**: A new game consistently starts with exactly 4 reel icons: 2 blanks, 1 apple, 1 copper
- **SC-007**: Every icon renders at exactly 128×128 pixels across all tabs and game states

## Assumptions

- The existing win condition logic and market purchasing logic remain unchanged; only UI layout and animation are being modified
- The "larger grid" for the Spin tab means more visible rows/columns of the slot machine display, not a larger reel size
- The result modal is dismissible by the player (button click or similar); it does not auto-dismiss
- Currency bar positioning (above or overlaid on tabs) is left to implementation judgment as long as it is always visible
- The Spins counter persists only for the current game session; it is not stored between sessions
