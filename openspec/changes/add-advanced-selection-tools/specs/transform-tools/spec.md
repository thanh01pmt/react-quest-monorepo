# Transform Tools - New Capability Spec

## ADDED Requirements

### Requirement: Transform Gizmo Rendering
The system SHALL render interactive 3D gizmos for object transformation.

**Type:** Functional  
**Priority:** High

#### Scenario: Move Gizmo Display
- **GIVEN** 1 or more objects are selected
- **AND** Move tool is active
- **WHEN** rendering 3D scene
- **THEN** a 3-axis arrow gizmo SHALL appear at selection center
- **AND** X-axis arrow SHALL be red, pointing right
- **AND** Y-axis arrow SHALL be green, pointing up
- **AND** Z-axis arrow SHALL be blue, pointing forward

#### Scenario: Rotate Gizmo Display
- **GIVEN** objects are selected
- **AND** Rotate tool is active
- **WHEN** rendering scene
- **THEN** a circular ring gizmo SHALL appear
- **AND** ring SHALL be yellow colored
- **AND** ring radius SHALL be 1.5x selection bounding box radius

---

### Requirement: Move Tool
The system SHALL allow moving selected objects via gizmo interaction.

**Type:** Functional  
**Priority:** High

#### Scenario: Drag Along Axis
- **GIVEN** move gizmo is displayed
- **WHEN** user clicks and drags X-axis arrow
- **THEN** selection SHALL move along X-axis only
- **AND** Y and Z coordinates SHALL remain constant
- **AND** movement SHALL follow cursor position

#### Scenario: Snap to Grid
- **GIVEN** "Snap to Grid" option is enabled
- **WHEN** user drags objects via gizmo
- **THEN** positions SHALL be rounded to nearest integer
- **AND** objects SHALL only occupy grid cells
- **AND** smooth dragging SHALL still be visual, snapping happens on release

#### Scenario: Collision Detection
- **GIVEN** user is moving selected objects
- **WHEN** new position would overlap existing object (not in selection)
- **THEN** movement SHALL be blocked
- **AND** visual feedback SHALL indicate collision (red highlight)
- **AND** objects SHALL remain at last valid position

---

### Requirement: Rotate Tool
The system SHALL allow rotating selected objects around their center point.

**Type:** Functional  
**Priority:** High

#### Scenario: Free Rotation
- **GIVEN** rotate gizmo is active
- **WHEN** user drags the rotation ring
- **THEN** selection SHALL rotate around its center
- **AND** rotation angle SHALL be displayed (e.g., "45°")
- **AND** rotation SHALL update in real-time as mouse moves

#### Scenario: Snap Angle (90°)
- **GIVEN** angle snap is set to 90°
- **WHEN** user rotates selection
- **THEN** rotation SHALL snap to multiples of 90° (0°, 90°, 180°, 270°)
- **AND** visual feedback SHALL indicate snapped angle
- **AND** intermediate angles SHALL not be applied

#### Scenario: Rotation Around Center
- **GIVEN** 4 objects selected forming a square pattern
- **AND** center of selection is calculated at [5, 0, 5]
- **WHEN** user rotates 90° clockwise
- **THEN** all objects SHALL rotate around [5, 0, 5]
- **AND** relative positions SHALL be preserved
- **AND** final grid positions SHALL be integer coordinates

---

### Requirement: Transform Utilities
The system SHALL provide utility functions for geometric transformations.

**Type:** Functional  
**Priority:** High

#### Scenario: Offset Transformation
- **GIVEN** utility function `offset(objects, delta)`
- **WHEN** called with delta = [3, 0, -2]
- **THEN** all objects SHALL move +3 in X, 0 in Y, -2 in Z
- **AND** relative positions SHALL be maintained
- **AND** new objects with updated positions SHALL be returned

#### Scenario: Mirror Transformation
- **GIVEN** utility function `mirror(objects, axis, centerLine)`
- **WHEN** called with axis='x', centerLine=7
- **AND** object at position [5, 0, 5]
- **THEN** mirrored copy SHALL be at [9, 0, 5]
- **AND** distance from centerLine SHALL be equal on both sides

#### Scenario: Rotation Matrix Calculation
- **GIVEN** utility function `rotate(objects, degrees, pivot)`
- **WHEN** rotating object at [1, 0, 0] by 90° around [0, 0, 0]
- **THEN** new position SHALL be [0, 0, 1]
- **AND** rotation matrix SHALL be applied correctly
- **AND** result SHALL be rounded to nearest integer

---

### Requirement: Gizmo Interaction
Gizmos SHALL support mouse/touch interaction with visual feedback.

**Type:** Non-Functional (UX)  
**Priority:** High

#### Scenario: Hover Highlight
- **GIVEN** gizmo is displayed
- **WHEN** user hovers over X-axis arrow
- **THEN** arrow SHALL brighten (opacity increase to 1.0)
- **AND** other axes SHALL remain at normal opacity (0.8)
- **AND** cursor SHALL change to "grab" icon

#### Scenario: Active Drag State
- **GIVEN** user is dragging an axis
- **WHEN** drag is in progress
- **THEN** active axis SHALL be highlighted (brighter color)
- **AND** inactive axes SHALL be dimmed (opacity 0.3)
- **AND** cursor SHALL be "grabbing" icon

#### Scenario: Release Commit
- **GIVEN** user has dragged objects to new position
- **WHEN** user releases mouse button
- **THEN** transform SHALL be committed to state
- **AND** history entry SHALL be created (for undo)
- **AND** gizmo SHALL return to normal appearance

---

### Requirement: Multi-Object Transform
The system SHALL handle transformations on multiple selected objects.

**Type:** Functional  
**Priority:** High

#### Scenario: Group Move
- **GIVEN** 10 objects selected
- **WHEN** user moves selection via gizmo
- **THEN** all 10 objects SHALL move together
- **AND** relative positions between objects SHALL be preserved
- **AND** movement SHALL be a single atomic operation

#### Scenario: Group Rotate
- **GIVEN** 5 objects selected forming an L-shape
- **WHEN** user rotates 90°
- **THEN** all objects SHALL rotate around selection center
- **AND** L-shape SHALL remain intact but rotated
- **AND** individual object rotations SHALL also be updated

#### Scenario: Bounding Box Calculation
- **GIVEN** selection contains objects at [0,0,0], [5,0,0], [0,0,5]
- **WHEN** calculating center for gizmo placement
- **THEN** bounding box SHALL be min=[0,0,0], max=[5,0,5]
- **AND** center SHALL be [2.5, 0, 2.5]
- **AND** gizmo SHALL be placed at center

---

### Requirement: Keyboard Shortcuts for Transforms
The system SHALL support keyboard shortcuts for quick transformations.

**Type:** Non-Functional (UX)  
**Priority:** Medium

#### Scenario: Quick Rotate (R key)
- **GIVEN** objects are selected
- **WHEN** user presses 'R' key
- **THEN** rotate tool SHALL become active
- **AND** rotate gizmo SHALL appear
- **AND** mouse movement SHALL control rotation

#### Scenario: Quick Move (G key)
- **GIVEN** objects are selected
- **WHEN** user presses 'G' key
- **THEN** move tool SHALL become active
- **AND** objects SHALL follow cursor
- **AND** clicking SHALL confirm new position

#### Scenario: Precise Input (Tab for Numeric)
- **GIVEN** move tool is active
- **WHEN** user presses Tab key
- **THEN** numeric input dialog SHALL appear
- **AND** user can enter exact coordinates
- **AND** pressing Enter SHALL apply transform

---

### Requirement: Transform History
All transforms SHALL be recorded for undo/redo support.

**Type:** Functional  
**Priority:** High

#### Scenario: Undo Move
- **GIVEN** user has moved 5 objects from [0,0,0] to [3,0,0]
- **WHEN** user presses Ctrl+Z
- **THEN** objects SHALL return to [0,0,0]
- **AND** move gizmo SHALL update to original position
- **AND** redo SHALL be available

#### Scenario: Undo Rotate
- **GIVEN** user has rotated objects 90°
- **WHEN** user undoes the operation
- **THEN** objects SHALL return to pre-rotation state
- **AND** rotation gizmo angle SHALL reset to 0°

#### Scenario: History Entry Format
- **GIVEN** any transform operation
- **WHEN** added to history
- **THEN** entry SHALL contain transform type ('move' | 'rotate')
- **AND** entry SHALL contain before/after states
- **AND** entry SHALL be a single atomic operation

---

### Requirement: Transform Constraints
The system SHALL enforce constraints during transformations.

**Type:** Functional  
**Priority:** Medium

#### Scenario: Map Boundary Constraint
- **GIVEN** map has boundaries at [0,0,0] to [20,0,20]
- **WHEN** user tries to move objects outside boundaries
- **THEN** movement SHALL be clamped to boundary
- **AND** objects SHALL not exceed [20,0,20]
- **AND** user SHALL see boundary indicator (red line)

#### Scenario: Y-Axis Movement Constraint
- **GIVEN** grid-based editing mode
- **WHEN** user moves objects along Y-axis
- **THEN** Y positions SHALL snap to integer levels (0, 1, 2, ...)
- **AND** fractional Y values SHALL not be allowed
- **AND** vertical movement SHALL update height layer

---

### Requirement: Performance
Transform operations SHALL maintain 60 FPS during interaction.

**Type:** Non-Functional (Performance)  
**Priority:** High

#### Scenario: Real-Time Transform
- **GIVEN** 100 objects selected
- **WHEN** user drags move gizmo
- **THEN** all objects SHALL update position in real-time
- **AND** frame rate SHALL remain above 60 FPS
- **AND** no visual lag SHALL be perceptible

#### Scenario: Optimized Re-Rendering
- **GIVEN** transform in progress
- **WHEN** updating object positions
- **THEN** only affected objects SHALL re-render
- **AND** React re-renders SHALL be minimized via memoization
- **AND** Three.js matrix updates SHALL use in-place operations

---

## Technical Specifications

### Data Types

```typescript
interface TransformGizmo {
  type: 'move' | 'rotate' | 'scale';
  position: [number, number, number];
  visible: boolean;
  activeAxis: 'x' | 'y' | 'z' | null;
}

interface Transform {
  translation?: [number, number, number];
  rotation?: number; // radians around Y-axis
  scale?: [number, number, number];
}
```

### Gizmo Visual Specifications

**Move Gizmo:**
- Arrow length: 2 units
- Arrow head: Cone, height 0.3 units
- Arrow shaft: Cylinder, radius 0.05 units
- Colors: X=0xFF0000, Y=0x00FF00, Z=0x0000FF

**Rotate Gizmo:**
- Ring radius: 1.5x bounding box diagonal
- Ring thickness: 0.1 units
- Color: 0xFFFF00 (yellow)
- Segments: 64 (smooth circle)

### Performance Targets

| Operation | Target FPS | Max Objects |
|-----------|------------|-------------|
| Move (drag) | 60 | 200 |
| Rotate (drag) | 60 | 200 |
| Gizmo render | 60 | N/A |
