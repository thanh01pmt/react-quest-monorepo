# Spec: Map Generator

## ADDED Requirements

### Requirement: Solution-Driven Generation
The system SHALL provide a Solution-Driven map generator that creates maps from code templates.

#### Scenario: Generate map from simple FOR loop
- **GIVEN** a code template `for i in 1 to 5 { moveForward(); pickCrystal() }`
- **WHEN** the generator executes the template
- **THEN** it MUST produce a linear path of 6 blocks with 5 crystals placed

#### Scenario: Generate map with parameter substitution
- **GIVEN** a code template with parameter `$N` and parameter config `{ min: 3, max: 8 }`
- **WHEN** the generator executes with resolved parameter value 5
- **THEN** the resulting map MUST have path length matching the loop count

### Requirement: Template Interpreter
The system SHALL interpret code templates and track execution state (position, direction, items).

#### Scenario: Track movement and direction
- **GIVEN** an initial position `[0, 1, 0]` and direction `East`
- **WHEN** executing `moveForward(); turnRight(); moveForward()`
- **THEN** the final position MUST be `[1, 1, -1]` and direction MUST be `South`

#### Scenario: Track item placements
- **GIVEN** a template with `pickCrystal()` actions
- **WHEN** the interpreter executes the action
- **THEN** a crystal item MUST be recorded at the current position

### Requirement: Nested Loop Support
The system SHALL support nested FOR loops with correct execution order.

#### Scenario: Execute nested FOR creating grid
- **GIVEN** a template `for row in 1 to 3 { for col in 1 to 4 { moveForward(); pickCrystal() } turnRight(); moveForward(); turnRight() }`
- **WHEN** the generator executes
- **THEN** 12 crystals (3 rows × 4 columns) MUST be placed

### Requirement: Conditional Support
The system SHALL support IF and IF-ELSE statements with condition evaluation.

#### Scenario: Conditional item collection
- **GIVEN** a template with `if crystalAhead { pickCrystal() }`
- **WHEN** executed on a path with crystals at specific positions
- **THEN** crystals MUST only be collected where the condition is true

### Requirement: WHILE Loop Support
The system SHALL support WHILE loops with termination analysis.

#### Scenario: WHILE loop with portal terminator
- **GIVEN** a template `while !atPortal { moveForward(); pickCrystal() }`
- **WHEN** the generator executes
- **THEN** a portal MUST be placed at the end position to ensure termination

### Requirement: Function Definition Support
The system SHALL support user-defined functions (procedures).

#### Scenario: Function definition and call
- **GIVEN** a template with `func clearBranch() { ... }` and 3 calls to `clearBranch()`
- **WHEN** the generator produces structured solution
- **THEN** the output MUST include `procedures.clearBranch` containing the function body

### Requirement: Full GameConfig Output
The system SHALL output complete GameConfig JSON matching the game format.

#### Scenario: Output includes all required sections
- **GIVEN** a generated map result
- **WHEN** serialized to JSON
- **THEN** the output MUST include: `id`, `gameType`, `translations`, `blocklyConfig`, `gameConfig`, `solution`, `sounds`

#### Scenario: gameConfig includes correct structure
- **GIVEN** a generated map result  
- **WHEN** accessing `result.gameConfig`
- **THEN** it MUST include: `type`, `renderer`, `blocks`, `players`, `collectibles`, `interactibles`, `finish`

### Requirement: ASCII Preview Integration
The system SHALL integrate template preview into MarkdownReporter.

#### Scenario: Generate ASCII visualization
- **GIVEN** a code template and resolved parameters
- **WHEN** calling `reporter.generateTemplatePreview(template, params)`
- **THEN** the output MUST include ASCII map visualization with path and items

### Requirement: Template Validation
The system SHALL validate templates before generation.

#### Scenario: Reject invalid template syntax
- **GIVEN** a template with syntax error
- **WHEN** attempting to generate
- **THEN** the system MUST return validation errors with line numbers

#### Scenario: Reject infinite loop templates
- **GIVEN** a WHILE loop template without termination condition
- **WHEN** validating
- **THEN** the system MUST warn about potential infinite loop
