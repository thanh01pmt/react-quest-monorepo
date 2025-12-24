# Map Builder - Spec Delta

## ADDED Requirements

### Requirement: Smart Selection Tool
The map builder SHALL provide a smart selection tool that selects all connected objects in a single click.

**Type:** Functional  
**Priority:** High

#### Scenario: Select Connected Floor Tiles
- **GIVEN** a map with 20 connected floor tiles forming a room
- **AND** user has smart select tool active
- **WHEN** user clicks on any floor tile
- **THEN** all 20 connected floor tiles SHALL be selected
- **AND** selection SHALL complete in less than 1 second

#### Scenario: Smart Select Stops at Walls
- **GIVEN** a room with floor tiles surrounded by wall blocks
- **AND** user clicks on a floor tile
- **WHEN** smart selection algorithm runs
- **THEN** only floor tiles SHALL be selected
- **AND** wall blocks SHALL NOT be included in selection
- **AND** result SHALL respect tile connectivity (adjacent tiles only)

---

### Requirement: Visual Transform Gizmos
The map builder SHALL display visual manipulation gizmos when objects are selected.

**Type:** Functional  
**Priority:** High

#### Scenario: Move Gizmo Display
- **GIVEN** user has selected 1 or more objects
- **AND** move tool is active
- **WHEN** rendering the 3D scene
- **THEN** a 3-axis arrow gizmo SHALL appear at selection center
- **AND** arrows SHALL be colored: X=red, Y=green, Z=blue
- **AND** gizmo SHALL be interactive (draggable)

#### Scenario: Rotate Gizmo Display  
- **GIVEN** user has selected objects
- **AND** rotate tool is active
- **WHEN** rendering the scene
- **THEN** a circular ring gizmo SHALL appear
- **AND** ring SHALL be centered on selection bounding box
- **AND** dragging ring SHALL rotate selection
- **AND** current angle SHALL be displayed

---

### Requirement: Smart Fill Tool
The map builder SHALL provide a flood fill tool for rapid terrain creation.

**Type:** Functional  
**Priority:** High

#### Scenario: Fill Enclosed Room
- **GIVEN** user has selected a ground tile asset
- **AND** flood fill tool is active
- **AND** map contains an empty room (no floor tiles) surrounded by walls
- **WHEN** user clicks inside the room
- **THEN** entire room area SHALL be filled with selected ground tile
- **AND** filling SHALL stop at wall boundaries
- **AND** operation SHALL complete in less than 2 seconds for 1000 tiles

#### Scenario: Fill Preview Before Commit
- **GIVEN** fill tool is active
- **WHEN** user hovers over a fillable area
- **THEN** a semi-transparent yellow overlay SHALL show the fill area
- **AND** tile count SHALL be displayed
- **AND** clicking SHALL confirm the fill
- **AND** pressing Esc SHALL cancel

---

### Requirement: Symmetry Mode
The map builder SHALL support creating symmetric structures across configurable axes.

**Type:** Functional  
**Priority:** Medium

#### Scenario: Duplicate Mode Symmetry
- **GIVEN** symmetry mode is enabled with "duplicate" mode
- **AND** symmetry axis is set to X with center line at 7
- **AND** user places a block at position [5, 0, 5]
- **WHEN** the block is added to the scene
- **THEN** a mirrored copy SHALL be created at position [9, 0, 5]
- **AND** both blocks SHALL be independent (can be moved separately)

#### Scenario: Symmetry Axis Visualization
- **GIVEN** symmetry mode is enabled
- **WHEN** viewing the 3D scene
- **THEN** the symmetry axis line SHALL be visible on the grid
- **AND** line SHALL be colored based on axis (X=red, Z=blue)
- **AND** mirrored preview objects SHALL be semi-transparent

---

### Requirement: Pattern Library
The map builder SHALL allow users to save and reuse common structure patterns.

**Type:** Functional  
**Priority:** Medium

#### Scenario: Save Selection as Pattern
- **GIVEN** user has selected 10 objects forming an L-corridor
- **WHEN** user clicks "Save as Pattern"
- **AND** enters name "L-Corridor-5x5"
- **THEN** pattern SHALL be saved to local storage
- **AND** pattern SHALL appear in pattern library
- **AND** pattern data SHALL include all object positions, assets, and properties

#### Scenario: Load and Place Pattern
- **GIVEN** user has saved patterns in library
- **WHEN** user selects "L-Corridor-5x5" pattern
- **THEN** pattern preview SHALL follow cursor
- **AND** user can rotate pattern before placing (0°, 90°, 180°, 270°)
- **AND** user can flip pattern before placing (X or Z axis)
- **AND** clicking SHALL place pattern at cursor position

#### Scenario: Pattern Export/Import
- **GIVEN** user has a saved pattern
- **WHEN** user clicks "Export Pattern"
- **THEN** a JSON file SHALL be downloaded
- **AND** file SHALL contain all pattern data
- **AND** user SHALL be able to re-import pattern from JSON file
- **AND** imported pattern SHALL function identically to original

---

### Requirement: Advanced Area Clone
The map builder SHALL support copying selections with transform options.

**Type:** Functional  
**Priority:** Medium

#### Scenario: Clone with Offset
- **GIVEN** user has selected a 5x5 room structure
- **AND** user presses Ctrl+Shift+V (paste with options)
- **WHEN** user sets offset to [10, 0, 0]
- **AND** confirms paste
- **THEN** copied objects SHALL be placed 10 units to the right
- **AND** all relative positions SHALL be preserved
- **AND** new objects SHALL have unique IDs

#### Scenario: Multi-Paste Array
- **GIVEN** user has copied a single column structure
- **WHEN** user opens paste options
- **AND** sets multi-paste count to 5
- **AND** sets spacing to 3 units along X-axis
- **THEN** 5 copies SHALL be created
- **AND** copies SHALL be evenly spaced (0, 3, 6, 9, 12 units)
- **AND** all copies SHALL be added in single undo step

---

## MODIFIED Requirements

### Requirement: Selection System (Enhanced)
The map builder SHALL support multiple selection methods including box selection and smart selection.

**Previous:** The map builder SHALL support box selection of multiple objects.

**Changes:** Added smart selection (flood select) as an alternative to box selection.


#### Scenario: Box Selection Unchanged
- **GIVEN** original box selection still works as before
- **WHEN** user Shift+drags to create selection box
- **THEN** all objects within box SHALL be selected
- **(No changes to existing behavior)**

#### Scenario: Smart Selection as Alternative
- **GIVEN** user can toggle between box and smart select
- **WHEN** smart select mode is active
- **THEN** clicking selects connected components
- **WHEN** box select mode is active  
- **THEN** clicking selects nothing (must drag box)

---

### Requirement: Transform Operations (Expanded)
The map builder SHALL support object transformation using visual gizmos, keyboard shortcuts, and arrow keys.

**Previous:** Objects can be moved using arrow keys (±1 unit per press).

**Changes:** Added visual gizmos and keyboard shortcuts for more intuitive transformation.


#### Scenario: Move with Gizmo
- **GIVEN** move gizmo is displayed
- **WHEN** user drags X-axis arrow
- **THEN** selection SHALL move along X-axis only
- **AND** Y and Z coordinates SHALL remain unchanged

#### Scenario: Move with Arrow Keys (Existing)
- **GIVEN** objects are selected
- **WHEN** user presses arrow key
- **THEN** objects SHALL move ±1 unit as before
- **(Existing behavior preserved)**

---

## REMOVED Requirements

### Requirement: Single-Click Placement Only
**Reason:** Replaced by multi-tool system (single-click is now one of many modes)

**Migration:** Users can still use single-click via "Build" mode (existing functionality). No breaking changes.

---

## NEW Capabilities Introduced

This change introduces two new sub-capabilities:

1. **Selection System** (`specs/selection-system/spec.md`)
   - Smart select (flood select)
   - Box select (enhanced from main spec)
   - Selection visualization

2. **Transform Tools** (`specs/transform-tools/spec.md`)
   - Move tool with gizmo
   - Rotate tool with gizmo
   - Transform utilities (offset, flip, etc.)
