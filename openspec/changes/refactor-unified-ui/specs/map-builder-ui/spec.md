# Map Builder UI Specification (Delta)

## ADDED Requirements

### Requirement: Unified Mode Architecture
The Map Builder SHALL provide a unified interface that supports both Manual (Build) and Auto (Generate) workflows within a single cohesive panel, rather than separate tabs.

#### Scenario: User switches between modes
- **WHEN** user clicks the Mode Toggle button
- **THEN** the mode-specific content area updates to show the appropriate controls
- **AND** all common controls (Layer, Theme, Smart Snap) remain visible and functional
- **AND** all existing placed objects are preserved

#### Scenario: User accesses validation in Manual mode
- **WHEN** user is in Manual mode with objects placed on the canvas
- **THEN** the Validate button in the Action Bar is enabled
- **AND** clicking it runs the validation pipeline
- **AND** results are displayed in the ValidationBadge

---

### Requirement: Common Controls Section
The Map Builder SHALL have a Common Controls section that is accessible in both Manual and Auto modes.

#### Scenario: Common controls visibility
- **WHEN** the left panel is visible
- **THEN** the Common Controls section is always displayed at the top
- **AND** it contains: Mode Toggle, Layer Selector, Smart Snap toggle

#### Scenario: Theme selector accessibility
- **WHEN** the Map Builder is open
- **THEN** the Theme selector is accessible from Common Controls
- **AND** changing theme updates all relevant objects on canvas

---

### Requirement: Unified Action Bar
The Map Builder SHALL provide an Action Bar with primary actions accessible in both modes.

#### Scenario: Action bar visibility
- **WHEN** the left panel is visible
- **THEN** the Action Bar is displayed at the bottom of the panel
- **AND** it contains: Validate, Solve, Generate/Clear (mode-dependent), Export buttons

#### Scenario: Validate action in both modes
- **WHEN** user clicks Validate in Manual mode
- **THEN** the system traces path from player_start to finish
- **AND** runs validation on traced path and objects
- **AND** displays results in ValidationBadge

- **WHEN** user clicks Validate in Auto mode (after generate)
- **THEN** the system uses stored pathInfo for validation
- **AND** displays results in ValidationBadge

#### Scenario: Solve action availability
- **WHEN** user has a valid map with start and finish positions
- **THEN** the Solve button is enabled
- **AND** clicking it runs the solver and displays optimal path

---

### Requirement: Manual Mode Path Tracing
The system SHALL automatically trace a path from player_start to finish when validating a manually-built map.

#### Scenario: Reachable finish
- **WHEN** user validates a map with connected blocks from start to finish
- **THEN** the system identifies the shortest path
- **AND** calculates which items are accessible from this path
- **AND** validation passes the reachability check

#### Scenario: Unreachable finish
- **WHEN** user validates a map where finish is not reachable from start
- **THEN** the validation fails with "Finish not reachable" error
- **AND** ValidationBadge shows ❌ Invalid status

---

### Requirement: Post-Generate Editing
After generating a map in Auto mode, the user SHALL be able to edit the generated objects while retaining validation capability.

#### Scenario: Edit after generate
- **WHEN** user generates a map in Auto mode
- **THEN** the app enters "Editing Generated Map" state
- **AND** user can select, move, delete, or add items
- **AND** pathInfo is preserved for validation

#### Scenario: Lock Ground toggle
- **WHEN** "Lock Ground" is enabled after generating
- **THEN** ground/block objects cannot be selected, moved, or deleted
- **AND** only items (collectibles, interactibles) can be edited
- **AND** topology integrity is preserved

#### Scenario: Regenerate Items Only
- **WHEN** user clicks "Regenerate Items Only"
- **THEN** all items are removed
- **AND** new items are generated based on current strategy settings
- **AND** ground blocks are preserved

---

### Requirement: Live Validation Badge
The Map Builder SHALL display a validation status badge that updates in real-time as the map changes.

#### Scenario: Validation badge updates
- **WHEN** user adds, moves, or removes an object
- **THEN** the validation badge updates within 500ms
- **AND** displays current validation status (✅ Valid / ⚠️ Issues / ❌ Invalid)

#### Scenario: Expand validation details
- **WHEN** user clicks on the ValidationBadge
- **THEN** a detailed ValidationReport panel appears
- **AND** shows tier-by-tier breakdown with suggestions

---

### Requirement: Collapsible Right Panel Sections
The right panel sections (Properties, Quest Details, JSON Output) SHALL be collapsible to maximize screen space.

#### Scenario: Collapse section
- **WHEN** user clicks on a section header
- **THEN** the section content collapses with smooth animation
- **AND** only the header remains visible
- **AND** collapse state is preserved across sessions

#### Scenario: Expand section
- **WHEN** user clicks on a collapsed section header
- **THEN** the section expands to show full content
- **AND** other sections remain in their current state

---

## MODIFIED Requirements

### Requirement: Left Panel Structure
The left panel PREVIOUSLY contained two tabs (Assets/Topology). It SHALL now contain a unified BuilderControlPanel.

#### Scenario: Left panel layout
- **WHEN** the left panel is visible
- **THEN** it displays: Common Controls → Mode Content → Action Bar
- **AND** no tabs are present
- **AND** total width remains approximately 300px

---

### Requirement: MapInspector Independence
MapInspector PREVIOUSLY required pathInfo from Auto mode to function. It SHALL now work in both modes.

#### Scenario: MapInspector in Manual mode
- **WHEN** user is in Manual mode with objects on canvas
- **THEN** MapInspector displays: Path Steps (traced), Items count, Complexity
- **AND** Validation status based on traced path

#### Scenario: MapInspector in Auto mode
- **WHEN** user is in Auto mode with generated map
- **THEN** MapInspector displays: Path Steps (from pathInfo), Items count, Complexity
- **AND** Validation status based on pathInfo

---

## REMOVED Requirements

_(None)_

---

## RENAMED Requirements

_(None)_
