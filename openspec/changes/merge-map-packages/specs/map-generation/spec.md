# Map Generation Capability

## MODIFIED Requirements

### Requirement: Package Structure
The map generation system SHALL provide a unified package structure that clearly separates generation (creating maps from topologies) and analysis (analyzing existing maps) concerns. The package SHALL use consistent coordinate types throughout.

#### Scenario: Import from unified package
- **WHEN** a consumer imports map generation functionality
- **THEN** they import from `@repo/academic-map-generator`
- **AND** all types use `Coord` tuple format `[x, y, z]`

#### Scenario: Generator module access
- **WHEN** a consumer needs to generate maps from topology
- **THEN** they access `PlacementService`, `TopologyRegistry`, and topology classes from the generator module
- **AND** the API remains compatible with existing usage patterns

#### Scenario: Analyzer module access  
- **WHEN** a consumer needs to analyze existing map configs
- **THEN** they access `MapAnalyzer`, `AcademicPlacementGenerator` from the analyzer module
- **AND** the 4-tier analysis pipeline remains fully functional

### Requirement: Shared Utilities
The package SHALL extract shared utilities (geometry operations, segment analysis) into a core module that both generator and analyzer can use.

#### Scenario: Geometry utilities
- **WHEN** both generator and analyzer need vector operations
- **THEN** they import from `core/geometry.ts`
- **AND** functions include `addVectors`, `areVectorsEqual`, `vectorToString`

#### Scenario: Segment utilities
- **WHEN** both modules need segment analysis
- **THEN** they import from `core/segment-utils.ts`
- **AND** functions include `computeSegments`, `analyzeSegments`

## REMOVED Requirements

### Requirement: Separate Package Imports
**Reason**: Consolidating into single package for better maintainability
**Migration**: Update imports from `@repo/academic-placer` or `map-generator` to `@repo/academic-map-generator`

#### Scenario: N/A - Removed
- **WHEN** this requirement is removed
- **THEN** consumers must migrate to new import paths
