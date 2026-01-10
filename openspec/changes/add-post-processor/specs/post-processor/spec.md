# Post-Processor Capability Specification

> System for modifying generated maps after initial path creation.

## ADDED Requirements

### Requirement: Post-Processor Pipeline
The system SHALL execute post-processing operations after path generation and before final output.

#### Scenario: Single Post-Processor
- **GIVEN** a template with one `postProcess()` call
- **WHEN** the template is executed
- **THEN** the post-processor modifies the generated map
- **AND** the modified map is returned as output

#### Scenario: Multiple Post-Processors
- **GIVEN** a template with multiple `postProcess()` calls
- **WHEN** the template is executed
- **THEN** post-processors execute in order of definition
- **AND** each processor receives the result of the previous

---

### Requirement: Fill Bounding Box Processor
The system SHALL fill empty cells within the path's bounding box with blocks.

#### Scenario: Basic Fill
- **GIVEN** a path with coordinates forming a bounding box
- **WHEN** `fillBoundingBox({ offset: 0, material: 'grass' })` is called
- **THEN** all empty cells within the box are filled with 'grass' blocks
- **AND** existing path blocks are preserved

#### Scenario: Fill with Offset
- **GIVEN** a path with bounding box `{minX: 0, maxX: 4, minZ: 0, maxZ: 4}`
- **WHEN** `fillBoundingBox({ offset: 2 })` is called
- **THEN** the fill region expands to `{minX: -2, maxX: 6, minZ: -2, maxZ: 6}`

#### Scenario: Walkable Parameter
- **GIVEN** a `fillBoundingBox` call with `walkable: false`
- **WHEN** the map is generated
- **THEN** filled blocks have `walkable: false` property
- **AND** only original path blocks are traversable

---

### Requirement: Extend Shape Processor
The system SHALL create shape extensions at switch positions.

#### Scenario: Square at Switch
- **GIVEN** a map with a switch at position `(3, 0, 3)`
- **WHEN** `extendShape({ shape: 'square', size: 3, bias: 'center' })` is called
- **THEN** a 3x3 square of blocks is created centered on `(3, 0, 3)`

#### Scenario: Rectangle at Switch
- **GIVEN** a map with a switch
- **WHEN** `extendShape({ shape: 'rectangle', size: { width: 4, height: 2 } })` is called
- **THEN** a 4x2 rectangle of blocks is created

#### Scenario: Circle at Switch
- **GIVEN** a map with a switch at `(5, 0, 5)`
- **WHEN** `extendShape({ shape: 'circle', size: 3 })` is called
- **THEN** all blocks within radius 3 of `(5, 0, 5)` are filled

#### Scenario: Bias Left/Right
- **GIVEN** a switch at `(3, 0, 3)` with movement direction EAST (+X)
- **WHEN** `extendShape({ bias: 'left' })` is called
- **THEN** the shape is offset NORTH (-Z direction, perpendicular left)

#### Scenario: Level Mode Same
- **GIVEN** a switch at `(3, 2, 3)` (elevated)
- **WHEN** `extendShape({ levelMode: 'same' })` is called
- **THEN** extended blocks are placed at Y=2

#### Scenario: Level Mode Step Down
- **GIVEN** a switch at `(3, 2, 3)` (elevated)
- **WHEN** `extendShape({ levelMode: 'stepDown' })` is called
- **THEN** extended blocks are placed at Y=1

#### Scenario: Connect Path Bridge
- **GIVEN** a switch with `bias: 'left'` and `connectPath: true`
- **WHEN** `extendShape()` is called
- **THEN** a line of blocks connects the switch to the nearest edge of the shape
- **AND** the connector is perpendicular to the main path direction

---

### Requirement: Traversability Validation
Extended areas SHALL be accessible from the main path.

#### Scenario: Adjacent Access
- **GIVEN** an extended shape adjacent to the main path
- **WHEN** the character is at the adjacent path position
- **THEN** the character can `moveForward()` onto the extended area

#### Scenario: Step Down Access
- **GIVEN** an extended shape one Y-level below the path
- **WHEN** the character is at the edge of the path
- **THEN** the character can `moveForward()` to step down onto the area

#### Scenario: Jump Access
- **GIVEN** an extended shape with a gap from the path
- **WHEN** `connectPath: false`
- **THEN** the character requires `jump()` to access the area

---

## Future Requirements (Not Yet Implemented)

### Requirement: Sidewalk Processor
The system SHALL expand the path edges with additional blocks.

### Requirement: Column Support Processor  
The system SHALL add support pillars under elevated blocks.

### Requirement: Wall Extrusion Processor
The system SHALL create vertical walls along path edges.

### Requirement: Stair Fill Processor
The system SHALL create stairs where path has Y-level changes.

### Requirement: Terrain Sculpting Processor
The system SHALL modify Y-levels around the path based on distance gradient.

### Requirement: Item Scatter Processor
The system SHALL randomly place items on post-processed areas.
