# Change: Add Solution-Driven Map Generator

## Why

Current map generation in `academic-map-generator` uses a **topology-first** approach - you pick a topology, then place items on it. The **Solution-Driven** approach inverts this: start with a code template (the expected student solution), and generate a map that is **guaranteed solvable** by that code.

This approach:
- Guarantees every generated map is solvable
- Tightly couples maps to specific programming concepts
- Enables procedural generation of curriculum-aligned challenges
- Supports random variations while maintaining pedagogical intent

## What Changes

### Phase 1: Core Infrastructure (Week 1-2)
- **[NEW]** `generator/solution-driven/types.ts` - Type definitions
- **[NEW]** `generator/solution-driven/TemplateInterpreter.ts` - Code execution engine
- **[NEW]** `generator/solution-driven/SolutionBuilder.ts` - Output formatting
- **[NEW]** `generator/solution-driven/SolutionDrivenGenerator.ts` - Main API
- **[MODIFY]** `generator/index.ts` - Add exports
- **[MODIFY]** `index.ts` - Add package exports

#### Supported Constructs (Phase 1):
- Simple FOR loops: `for i in 1 to $N { ... }`
- Movement: `moveForward()`, `turnLeft()`, `turnRight()`
- Items: `pickCrystal()`, `pickKey()`, `toggleSwitch()`
- Parameter substitution: `$N`, `$LENGTH`, etc.

### Phase 2: Complex Constructs (Week 3-4)
- **[MODIFY]** `TemplateInterpreter.ts` - Add nested loop support
- **[NEW]** `PathEnumerator.ts` - Enumerate all valid paths for conditionals

#### Supported Constructs (Phase 2):
- Nested FOR: `for i in 1 to $M { for j in 1 to $N { ... } }`
- Simple IF: `if condition { ... }`
- IF-ELSE: `if condition { ... } else { ... }`

### Phase 3: Advanced Features (Week 5-6)
- **[MODIFY]** `TemplateInterpreter.ts` - Add while loops, functions
- **[NEW]** `FunctionRegistry.ts` - User-defined functions

#### Supported Constructs (Phase 3):
- WHILE loops: `while !atPortal { ... }`
- Nested IF: `if c1 { if c2 { ... } }`
- Functions: `func name() { ... }` and `name()`

### Phase 4: Integration & Polish (Week 7-8)
- **[MODIFY]** `analyzer/MarkdownReporter.ts` - Add ASCII preview for templates
- **[NEW]** `generator/solution-driven/TemplateLibrary.ts` - Predefined templates
- **[NEW]** `scripts/test-solution-driven.ts` - Test script
- Documentation and examples

## Impact

- **Specs**: New `map-generator` capability
- **Code**: New `generator/solution-driven/` module (~800-1000 LOC)
- **API**: New `SolutionDrivenGenerator` class
- **Output**: Full `GameConfig` JSON format

## Dependencies

- Existing `core/types.ts` (Coord, PathInfo, Item)
- Existing `shared/app-types.ts` (BuildableAsset, PlacedObject)
- Existing `analyzer/concepts/` (AcademicConcept)
