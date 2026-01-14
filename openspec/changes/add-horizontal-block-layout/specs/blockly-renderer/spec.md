# Blockly Renderer Capability

The Quest Player SHALL support multiple block rendering modes for different age groups and learning contexts.

## ADDED Requirements

### Requirement: Horizontal Block Layout Mode

The system SHALL provide a "Junior Mode" horizontal block layout option for the Blockly workspace, designed for younger learners (ages 5-7).

#### Scenario: Junior Mode Initialization
- **GIVEN** a QuestPlayer instance with `mode="junior"` prop
- **WHEN** the workspace initializes
- **THEN** blocks SHALL render horizontally (left-to-right) instead of vertically
- **AND** a custom horizontal renderer SHALL be used
- **AND** block connectors SHALL appear on left/right sides instead of top/bottom

#### Scenario: Icon-Only Blocks in Junior Mode
- **GIVEN** a QuestPlayer in Junior Mode
- **WHEN** blocks are displayed in the workspace
- **THEN** blocks SHALL show only icons (40x40px minimum) without text labels
- **AND** icons SHALL be clearly distinguishable for young children

### Requirement: Junior Block Set

The system SHALL provide a simplified set of blocks for Junior Mode.

#### Scenario: Available Junior Blocks
- **GIVEN** Junior Mode is active
- **WHEN** the flyout displays available blocks
- **THEN** only these blocks SHALL be available:
  - `junior_start` (rabbit icon, teal color)
  - `junior_moveForward` (arrow icon, green color)
  - `junior_turnLeft` (left curve arrow, blue color)
  - `junior_turnRight` (right curve arrow, blue color)
  - `junior_repeat` (loop icon with number input, orange color)

#### Scenario: Junior Block Code Generation
- **GIVEN** a Junior Mode workspace with connected blocks
- **WHEN** code is generated
- **THEN** the output SHALL be equivalent to standard maze blocks
- **AND** the code SHALL be executable by the existing game engine

### Requirement: Pill-Shaped Workspace Container

The system SHALL display Junior Mode blocks in a horizontal pill-shaped container.

#### Scenario: Workspace Visual Appearance
- **GIVEN** Junior Mode is active
- **WHEN** the workspace is rendered
- **THEN** the main workspace SHALL have rounded corners (pill shape)
- **AND** the background color SHALL be a soft teal (`#72D4C8`)
- **AND** blocks SHALL flow horizontally within the container

### Requirement: Bottom Flyout

The system SHALL position the block flyout at the bottom of the workspace in Junior Mode.

#### Scenario: Flyout Position
- **GIVEN** Junior Mode is active
- **WHEN** available blocks are displayed
- **THEN** the flyout SHALL appear below the main workspace
- **AND** blocks in the flyout SHALL be arranged horizontally
- **AND** the flyout SHALL scroll horizontally if blocks exceed container width

### Requirement: Mode Switching

The system SHALL allow switching between standard and junior modes.

#### Scenario: Mode Toggle
- **GIVEN** a QuestPlayer instance
- **WHEN** the mode prop changes from "standard" to "junior" (or vice versa)
- **THEN** the workspace SHALL re-render with the appropriate layout
- **AND** existing blocks SHALL be preserved (converted to equivalent block type)

### Requirement: Touch Optimization

The system SHALL optimize Junior Mode for touch-based devices.

#### Scenario: Touch Interaction
- **GIVEN** Junior Mode on a touch device
- **WHEN** a user drags a block
- **THEN** the hit area SHALL be at least 64x64 pixels
- **AND** snap-to-connect assistance SHALL be provided
- **AND** visual feedback SHALL indicate valid connection points
