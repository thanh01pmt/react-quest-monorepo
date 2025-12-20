## ADDED Requirements

### Requirement: Pattern Library System
The system SHALL provide a registry of pedagogically-designed item placement patterns.

#### Scenario: Pattern Selection for Loop Logic
- **WHEN** generating a map with `logic_type = loop_logic` and segment length ≥ 5
- **THEN** the system SHALL select patterns that create regular, repeating sequences
- **AND** items SHALL be placed at consistent intervals (e.g., every 1 or 2 steps)

#### Scenario: Pattern Selection for Function Logic  
- **WHEN** generating a map with `logic_type = function_logic` and multiple similar branches
- **THEN** the system SHALL apply IDENTICAL patterns across all branches
- **AND** diversity score between branches SHALL be 0 (perfect match)

### Requirement: Density Control System
The system SHALL support multiple density distribution modes for item placement.

#### Scenario: Decreasing Density for While Loop
- **WHEN** user selects "While Loop Decreasing" strategy
- **THEN** the system SHALL place more items at the start of the path
- **AND** density SHALL decrease progressively toward the goal
- **AND** pattern MAY be: 3 gems → 2 gems → 1 gem → finish

#### Scenario: Uniform Density for Function Reuse
- **WHEN** user selects "Function Reuse" strategy
- **THEN** all branches SHALL have the same item count
- **AND** item positions within each branch SHALL match

### Requirement: Seven Pedagogical Strategies
The system SHALL implement all 7 core pedagogical strategies from the Python reference.

#### Scenario: Conditional Branching Strategy
- **WHEN** user selects "Conditional Branching" strategy for a T/F/Y shaped topology
- **THEN** the system SHALL create:
  - One "correct" branch with goal items (e.g., crystals leading to finish)
  - One or more "decoy" branches with fewer/no items
- **AND** the decision point SHALL be clearly identifiable

#### Scenario: Variable Rate Change Strategy
- **WHEN** user selects "Variable Rate" strategy for V/S/Zigzag topology
- **THEN** item spacing SHALL change progressively (e.g., [1, 2, 3] or [3, 2, 1] gaps)
- **AND** this SHALL teach students to recognize non-constant patterns

#### Scenario: Backtracking Strategy
- **WHEN** user selects "Backtracking" strategy for a maze topology
- **THEN** dead-end branches SHALL contain collectible items
- **AND** the optimal solution SHALL require visiting dead ends before reaching goal

### Requirement: Academic Parameters Integration
The system SHALL accept academic metadata to auto-configure generation complexity.

#### Scenario: Bloom Level Affects Complexity
- **WHEN** user selects Bloom level "REMEMBER"
- **THEN** generated patterns SHALL be simple (single action repeated)
- **AND** no conditionals or complex structures SHALL be required

#### Scenario: Bloom Level "APPLY" Requires Functions
- **WHEN** user selects Bloom level "APPLY" with function_logic
- **THEN** the optimal solution MUST include at least 1 PROCEDURE definition
- **AND** PROCEDURE MUST be called at least 2 times

### Requirement: Item Goals Configuration
The system SHALL allow specifying exact item requirements for the map.

#### Scenario: Explicit Item Counts
- **WHEN** user specifies `items_to_place: [{type: "gem", count: 5}, {type: "switch", count: 2}]`
- **THEN** the generated map SHALL contain exactly 5 gems and 2 switches
- **AND** items SHALL be placed according to the selected strategy

#### Scenario: Solution Item Goals
- **WHEN** user specifies `solution_item_goals: "gem:5,switch:all"`
- **THEN** the solver SHALL require collecting all 5 gems and all switches
- **AND** validation SHALL fail if any required items are unreachable

### Requirement: Multi-Tier Validation
The system SHALL validate generated maps across 3 tiers of checks.

#### Scenario: Tier 1 Basic Validation
- **WHEN** a map is generated
- **THEN** the system SHALL verify:
  - Start position exists
  - Finish position exists
  - A valid path connects start to finish
  - All items are on walkable tiles

#### Scenario: Tier 2 Logic Compliance
- **WHEN** logic_type is "function_logic"
- **THEN** validation SHALL verify:
  - Solution contains PROCEDURE definitions
  - PROCEDURE is called at least once
  - Pattern diversity matches strategy requirements

#### Scenario: Tier 3 Pedagogy Validation
- **WHEN** a specific strategy is selected
- **THEN** validation SHALL verify:
  - Strategy is correctly implemented (e.g., identical branches for Function Reuse)
  - Teaching concepts are present
  - Complexity matches selected Bloom level
