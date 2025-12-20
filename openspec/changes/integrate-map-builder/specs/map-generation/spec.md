## ADDED Requirements

### Requirement: Pedagogical Strategy Enforcement
The system SHALL provide mechanisms to enforce specific pedagogical strategies on the generated map.

#### Scenario: Function Reuse Strategy
- **WHEN** the user selects "Function Reuse" strategy for a "Plus Shape" map
- **THEN** the system SHALL ensure all 4 arms have identical item patterns.
- **AND** the system SHALL validate that the optimal solution uses a function call at least 3 times.

#### Scenario: While Loop Decreasing Strategy
- **WHEN** the user selects "While Loop Decreasing"
- **THEN** the system SHALL generate item patterns with decreasing density (e.g., 3 gems, then 2, then 1) along the path.

### Requirement: Real-Time Pedagogy Validation
The system SHALL provide immediate feedback on whether the current map meets the selected learning objectives.

#### Scenario: Validation Warning
- **WHEN** the user selects "Apply" Bloom Level (requires complexity)
- **BUT** manually removes all decision points/branches
- **THEN** the system SHALL display a warning: "Map is too simple for 'Apply' level; consider adding decision points."

### Requirement: Topology Parameterization
The system SHALL allow precise configuration of topology geometry.

#### Scenario: Spiral Customization
- **WHEN** the user adjusts the "Number of Turns" slider for a Spiral map
- **THEN** the map visual SHALL update immediately to reflect the new geometry.
- **AND** the path connectivity SHALL remain valid.

### Requirement: Smart Placement Assistance
The system SHALL assist users in placing items in semantically valid and pedagogically appropriate positions.

#### Scenario: Pattern Application
- **WHEN** the user selects a path segment and clicks "Apply Pattern"
- **THEN** the system SHALL fill the segment with items matching the selected logic type (e.g., a repeating sequence for loops).
