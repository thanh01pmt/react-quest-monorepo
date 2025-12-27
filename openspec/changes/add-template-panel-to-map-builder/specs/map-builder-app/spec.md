# Specification: Map Builder App - Template Panel

## ADDED Requirements

### Requirement: Template Tab Navigation

The Map Builder App SHALL provide a "Template" tab alongside existing Topology and Placement tabs.

#### Scenario: User accesses Template tab
- **WHEN** user clicks on "Template" tab in the left panel
- **THEN** the Template Panel is displayed with code editor and controls
- **AND** other tabs (Topology, Placement) remain accessible

#### Scenario: Tab state persistence
- **WHEN** user switches from Template tab to another tab
- **THEN** the code in the Template editor is preserved
- **AND** switching back shows the same code

---

### Requirement: Template Preset Selection

The Template Panel SHALL provide a dropdown selector with preset code templates.

#### Scenario: User selects preset template
- **WHEN** user selects a preset from the dropdown (e.g., "Simple FOR Loop")
- **THEN** the code editor is populated with the corresponding template code
- **AND** the preview is automatically updated

#### Scenario: Available presets
- **WHEN** the Template Panel is loaded
- **THEN** the following presets SHALL be available:
  - Simple Sequence (sequential commands)
  - Simple FOR Loop (5 iterations)
  - FOR Loop with Turns (L-shape)
  - Square Pattern (4-sided loop)
  - Nested FOR Loops (grid pattern)
  - Function Pattern (define and call function)
  - Custom Code (empty editor)

---

### Requirement: Code Editor

The Template Panel SHALL provide a code editor for entering JavaScript ES6 code.

#### Scenario: User enters custom code
- **WHEN** user types or pastes code into the editor
- **THEN** the code is stored in component state
- **AND** line numbers are displayed alongside the code

#### Scenario: Code syntax support
- **WHEN** user enters valid JavaScript ES6 code including:
  - `for (let i = 0; i < N; i++) { ... }`
  - `function name() { ... }`
  - `moveForward()`, `turnLeft()`, `turnRight()`, `pickCrystal()`
  - `// single-line comments`
- **THEN** the code SHALL be accepted and parseable

---

### Requirement: Template Preview

The Template Panel SHALL provide a preview of the generated map before applying.

#### Scenario: Valid code preview
- **WHEN** user clicks "Preview" button with valid code
- **THEN** an ASCII map visualization is displayed
- **AND** metrics are shown: path length, item count, loop iterations

#### Scenario: Invalid code preview
- **WHEN** user clicks "Preview" button with invalid code
- **THEN** an error message is displayed
- **AND** the error includes helpful information (e.g., expected token)

---

### Requirement: Map Generation

The Template Panel SHALL generate a complete map from the template code.

#### Scenario: Generate map from template
- **WHEN** user clicks "Generate Map" button with valid code
- **THEN** the existing map is replaced with the generated map
- **AND** ground blocks are placed according to the path
- **AND** crystals/items are placed at collection points
- **AND** player start position is set
- **AND** finish/portal position is set at the end

#### Scenario: Confirmation before replacing
- **WHEN** user clicks "Generate Map" and the current map is not empty
- **THEN** a confirmation dialog is shown
- **AND** user can choose to proceed or cancel

#### Scenario: Generated map editing
- **WHEN** a map is generated from template
- **THEN** the map can be viewed and edited in the 3D viewer
- **AND** the map can be further modified in Topology/Placement tabs

---

### Requirement: Export Generated Map

The Template Panel SHALL support exporting the generated map configuration.

#### Scenario: Copy JSON to clipboard
- **WHEN** user clicks "Copy JSON" button after generating
- **THEN** the complete GameConfig JSON is copied to clipboard
- **AND** a success toast/notification is shown

#### Scenario: Download JSON file
- **WHEN** user clicks "Download JSON" button after generating
- **THEN** a JSON file is downloaded with the map configuration
- **AND** the filename includes the template ID and timestamp

---

## UI/UX Requirements

### Requirement: Visual Consistency

The Template Panel SHALL match the visual style of existing panels.

#### Scenario: Panel styling
- **WHEN** Template Panel is rendered
- **THEN** it uses the same color scheme as Topology/Placement panels
- **AND** buttons and inputs match existing component styles
- **AND** spacing and typography are consistent

### Requirement: Responsive Layout

The Template Panel SHALL be usable on various screen sizes.

#### Scenario: Small screen display
- **WHEN** the browser window is narrow (< 1200px)
- **THEN** the code editor remains usable
- **AND** the preview section collapses or scrolls appropriately
