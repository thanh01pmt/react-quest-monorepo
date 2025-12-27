# Design: Solution-Driven Map Generator

## Context

The `academic-map-generator` package currently provides topology-based map generation. This change adds an alternative **solution-driven** approach where maps are generated from code templates.

## Goals

1. Create maps from code templates that are guaranteed solvable
2. Support all academic concepts (loops, conditionals, functions)
3. Output full GameConfig JSON compatible with game engine
4. Integrate ASCII preview into existing MarkdownReporter
5. Phased implementation for incremental delivery

## Non-Goals

- Replacing existing topology-based generation
- Visual editor for templates
- Real-time code execution

## Decisions

### 1. Architecture Pattern

**Decision:** Follow the existing generator handler pattern (`handlers/` structure).

**Rationale:** Consistency with codebase. Existing patterns like `SolutionFirstPlacer` provide good reference.

### 2. Interpreter Design

**Decision:** Simple AST-based interpreter with separate Lexer/Parser/Executor phases.

**Rationale:** 
- Clean separation of concerns
- Easy to extend with new constructs
- Debuggable execution trace

```
Code String → Lexer → Tokens → Parser → AST → Interpreter → ExecutionTrace
```

### 3. Coordinate System

**Decision:** Use existing `Coord` type `[x, y, z]` from `core/types.ts`.

**Rationale:** Consistency with existing codebase. Direct compatibility with `PathInfo`.

### 4. Direction Representation

**Decision:** Use numeric direction (0-3) matching game format: 0=North(+Z), 1=East(+X), 2=South(-Z), 3=West(-X).

**Rationale:** Direct compatibility with game engine. Match existing `GameConfig.players[].start.direction`.

### 5. Output Format

**Decision:** Generate full `GameConfig` JSON, not just `PathInfo`.

**Rationale:** User requirement. Enables direct use as game level without post-processing.

### 6. MarkdownReporter Integration

**Decision:** Add `generateTemplatePreview()` method to existing `MarkdownReporter` class.

**Rationale:** Reuse existing ASCII drawing logic. Single source for visualization.

### 7. Parameter Resolution

**Decision:** Use `$NAME` syntax for parameters, resolved before execution.

**Rationale:** 
- Clear visual distinction in templates
- Simple implementation (string replace before parse)
- Familiar syntax

### 8. Phased Delivery

**Decision:** 4 phases with increasing complexity.

| Phase | Constructs | Weeks |
|-------|------------|-------|
| 1 | Simple FOR, movement, items | 2 |
| 2 | Nested FOR, IF, IF-ELSE | 2 |
| 3 | WHILE, nested IF, functions | 2 |
| 4 | Integration, templates, docs | 2 |

**Rationale:** 
- Enables early testing and feedback
- Each phase is independently usable
- Risk reduction through incremental complexity

## Risks / Trade-offs

### Risk: Complex path enumeration for conditionals

**Mitigation:** Phase 2 starts with deterministic conditionals (pre-placed items). Full path enumeration deferred if needed.

### Risk: Infinite loops in WHILE templates

**Mitigation:** 
- Hard iteration limit (1000)
- `TerminationAnalyzer` validates termination is reachable
- Generator auto-places terminator (portal) if needed

### Risk: Large AST for complex templates

**Mitigation:** Template complexity limits per grade level. Validation rejects templates exceeding limits.

## Open Questions

1. ~~Output format: GameConfig or PathInfo?~~ → **Resolved: GameConfig**
2. ~~ASCII preview integration~~ → **Resolved: Into MarkdownReporter**
3. Template library: Should predefined templates be in code or JSON?

## Migration Plan

No migration needed - this is a new capability. Existing generators remain unchanged.
