# Map Analyzer - Composite Structure Detection

## ADDED Requirements

### Requirement: Composite Metadata Recognition
The Analyzer SHALL recognize `components[]` metadata in input GameConfig when present and use it to identify discrete sub-structures instead of geometric decomposition.

#### Scenario: Plus Shape Islands with Components Metadata
- **GIVEN** a GameConfig with `metadata.components` array containing 4 square island definitions
- **AND** `metadata.layout_pattern` equals `"radial_4"`
- **WHEN** the Analyzer processes this map
- **THEN** the output SHALL contain 4 separate Area structures (one per component)
- **AND** `detectedTopology` SHALL be `"radial_4"` or `"plus_shape_islands"`
- **AND** each Area SHALL include `landmarks` from the component metadata

### Requirement: Component-Level Pattern Detection
The PatternAnalyzer SHALL detect repetition patterns at the component level when `components[]` metadata is present.

#### Scenario: Identical Module Repetition
- **GIVEN** 4 components with identical `module_type: "square"`
- **WHEN** pattern analysis runs
- **THEN** the output SHALL include a `repeat` pattern with `repetitions: 4`
- **AND** `unitElements` SHALL reference the component IDs

### Requirement: Connector Path Recognition
The Analyzer SHALL recognize `connectors[]` metadata as bridge paths between components.

#### Scenario: Hub-Spoke Connectors
- **GIVEN** `metadata.connectors` array with 4 entries from `"hub"` to island components
- **WHEN** the Analyzer processes this map
- **THEN** the output SHALL include 4 path segments representing the bridges
- **AND** each segment SHALL have correct start/end coordinates from connector data

## MODIFIED Requirements

### Requirement: Topology Detection Fallback
The topology detection logic SHALL prioritize `metadata.layout_pattern` when present, falling back to geometric inference only when metadata is absent.

#### Scenario: Explicit Layout Pattern
- **GIVEN** a GameConfig with `metadata.layout_pattern: "radial_4"`
- **WHEN** topology detection runs
- **THEN** `detectedTopology` SHALL equal `"radial_4"`
- **AND** geometric inference SHALL be skipped for topology classification
