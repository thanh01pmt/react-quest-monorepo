# Selection System - New Capability Spec

## ADDED Requirements

### Requirement: Smart Selection Algorithm
The selection system SHALL use BFS graph traversal to select connected components.

**Type:** Functional  
**Priority:** High

#### Scenario: BFS Traversal Correctness
- **GIVEN** a graph of 50 connected tiles
- **AND** 10 isolated tiles (not connected)
- **WHEN** user smart-selects one of the connected tiles
- **THEN** all 50 connected tiles SHALL be returned
- **AND** the 10 isolated tiles SHALL NOT be included
- **AND** traversal SHALL visit each tile exactly once

#### Scenario: Performance with Large Selections
- **GIVEN** a map with 500 connected floor tiles
- **WHEN** user smart-selects one tile
- **THEN** selection SHALL complete in less than 1 second
- **AND** algorithm SHALL use spatial indexing for O(1) neighbor lookup
- **AND** visited set SHALL prevent duplicate processing

---

### Requirement: 6-Connected Adjacency
The system SHALL consider two tiles adjacent if they share a face in 3D grid (6-connected).

**Type:** Functional  
**Priority:** High

#### Scenario: Horizontal Adjacency
- **GIVEN** tile A at [5, 0, 5]
- **AND** tile B at [6, 0, 5] (X+1)
- **WHEN** checking adjacency
- **THEN** tiles SHALL be considered adjacent

#### Scenario: Vertical Adjacency
- **GIVEN** tile A at [5, 0, 5]
- **AND** tile B at [5, 1, 5] (Y+1)
- **WHEN** checking adjacency
- **THEN** tiles SHALL be considered adjacent

#### Scenario: Diagonal Not Adjacent
- **GIVEN** tile A at [5, 0, 5]
- **AND** tile B at [6, 0, 6] (diagonal)
- **WHEN** checking adjacency
- **THEN** tiles SHALL NOT be considered adjacent

---

### Requirement: Selection Boundaries
Smart selection SHALL respect obstacle boundaries and different tile types.

**Type:** Functional  
**Priority:** High

#### Scenario: Stop at Walls
- **GIVEN** a room with floor tiles and wall blocks
- **WHEN** user selects a floor tile
- **THEN** selection SHALL include only floor tiles
- **AND** selection SHALL stop when encountering wall blocks
- **AND** walls SHALL NOT be selected even if adjacent

#### Scenario: Same Asset Type Only
- **GIVEN** mixed tiles: ground.normal and ground.mud
- **WHEN** user selects a ground.normal tile
- **THEN** only ground.normal tiles SHALL be selected
- **AND** ground.mud tiles SHALL be excluded
- **AND** selection SHALL treat different assets as boundaries

---

### Requirement: Selection Visualization
Selected objects SHALL be clearly visible with visual indicators.

**Type:** Non-Functional (UX)  
**Priority:** High

#### Scenario: Selection Highlight
- **GIVEN** objects are selected via smart select
- **WHEN** rendering the 3D scene
- **THEN** selected objects SHALL have orange highlight overlay
- **AND** highlight opacity SHALL be 0.6
- **AND** highlight SHALL scale 1.02x to avoid z-fighting

#### Scenario: Selection Count Display
- **GIVEN** user has selected objects
- **WHEN** viewing the UI
- **THEN** selection count SHALL be displayed in Properties Panel
- **AND** count SHALL show format "X items selected"
- **AND** count SHALL update in real-time as selection changes

---

### Requirement: Selection Preview
The system SHALL show preview before confirming selection.

**Type:** Non-Functional (UX)  
**Priority:** Medium

#### Scenario: Hover Preview
- **GIVEN** smart select tool is active
- **WHEN** user hovers over a tile
- **THEN** all connected tiles SHALL be highlighted in yellow (opacity 0.3)
- **AND** preview SHALL update as cursor moves
- **AND** clicking SHALL confirm selection

#### Scenario: Cancel Preview
- **GIVEN** preview is showing
- **WHEN** user moves cursor away
- **THEN** preview SHALL be removed
- **AND** no objects SHALL be selected

---

### Requirement: Multi-Selection Support
The system SHALL allow combining selections using keyboard modifiers.

**Type:** Functional  
**Priority:** Medium

#### Scenario: Additive Selection
- **GIVEN** user has selected 10 tiles using smart select
- **AND** user holds Shift key
- **WHEN** user smart-selects another group
- **THEN** new group SHALL be added to existing selection
- **AND** total selection SHALL be the union of both groups

#### Scenario: Subtractive Selection
- **GIVEN** user has selected 20 tiles
- **AND** user holds Alt key
- **WHEN** user smart-selects a subgroup
- **THEN** subgroup SHALL be removed from selection
- **AND** remaining selection SHALL exclude subgroup

---

### Requirement: Selection Performance
The system SHALL handle large selections efficiently.

**Type:** Non-Functional (Performance)  
**Priority:** High

#### Scenario: Large Map Performance
- **GIVEN** a map with 1000 total objects
- **WHEN** user smart-selects largest connected component (500 objects)
- **THEN** selection SHALL complete in less than 1 second
- **AND** UI SHALL remain responsive during selection
- **AND** memory usage SHALL not exceed 50MB increase

#### Scenario: Spatial Indexing
- **GIVEN** selection algorithm uses spatial grid
- **WHEN** looking up neighbors for any tile
- **THEN** lookup SHALL be O(1) time complexity
- **AND** spatial grid SHALL partition space into cells
- **AND** each cell SHALL contain at most 10 objects on average

---

### Requirement: Selection State Persistence
Selection state SHALL be maintained during most operations.

**Type:** Functional  
**Priority:** Medium

#### Scenario: Selection Survives Property Edits
- **GIVEN** user has selected 5 objects
- **WHEN** user edits a property of one object
- **THEN** all 5 objects SHALL remain selected
- **AND** property panel SHALL update to show edited value

#### Scenario: Selection Cleared on Mode Change
- **GIVEN** user has selected objects
- **WHEN** user switches from Select mode to Build mode
- **THEN** selection SHALL be cleared
- **AND** build cursor SHALL become active

---

### Requirement: Keyboard Shortcuts
The system SHALL support keyboard shortcuts for selection operations.

**Type:** Non-Functional (UX)  
**Priority:** Medium

#### Scenario: Select All
- **GIVEN** user has objects on the map
- **WHEN** user presses Ctrl+A (or Cmd+A on Mac)
- **THEN** all objects on current layer SHALL be selected
- **AND** selection count SHALL update accordingly

#### Scenario: Deselect All
- **GIVEN** user has selected objects
- **WHEN** user presses Esc key
- **THEN** all objects SHALL be deselected
- **AND** selection count SHALL show 0

#### Scenario: Invert Selection
- **GIVEN** user has 20 objects selected out of 50 total
- **WHEN** user presses Ctrl+Shift+I
- **THEN** the other 30 objects SHALL be selected
- **AND** originally selected 20 objects SHALL be deselected

---

## Technical Specifications

### Data Structures

```typescript
interface SelectionState {
  selectedIds: Set<string>;
  mode: 'box' | 'smart';
  previewIds: Set<string> | null;
}

interface SpatialGrid {
  cellSize: number;
  cells: Map<string, PlacedObject[]>;
}
```

### Performance Targets

| Operation | Target Time | Max Objects |
|-----------|-------------|-------------|
| Smart Select | <1s | 500 |
| Box Select | <500ms | 1000 |
| Preview Update | <100ms | 200 |
| Select All | <2s | 2000 |

### Browser Compatibility

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+
