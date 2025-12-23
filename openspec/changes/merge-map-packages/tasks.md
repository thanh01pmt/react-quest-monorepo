# Tasks: Merge Map Packages

## Phase 1: Package Setup

- [ ] 1.1 Create `packages/academic-map-generator` directory structure
  - [ ] Create `src/core/`
  - [ ] Create `src/generator/`
  - [ ] Create `src/analyzer/`
  
- [ ] 1.2 Create `package.json` with name `@repo/academic-map-generator`

- [ ] 1.3 Create `tsconfig.json` with proper path mappings

## Phase 2: Core Types & Utilities

- [ ] 2.1 Create `src/core/types.ts` with unified types
  - [ ] Define `Coord = [number, number, number]`
  - [ ] Define `Direction = Coord`
  - [ ] Define `Segment` interface (merge from both)
  - [ ] Define `PathInfo` interface
  - [ ] Define `Area` interface

- [ ] 2.2 Create `src/core/geometry.ts` with vector operations
  - [ ] Copy from `map-generator/utils/geometry.ts`
  - [ ] Update to use `Coord` type
  - [ ] Add converters: `objectToCoord()`, `coordToObject()`

- [ ] 2.3 Create `src/core/segment-utils.ts`
  - [ ] Extract shared segment analysis logic
  - [ ] `computeSegments()` - from PlacementService
  - [ ] `analyzeSegments()` - segment_analysis metadata

## Phase 3: Generator Module

- [ ] 3.1 Copy topology files
  - [ ] Copy `map-generator/topologies/` → `src/generator/topologies/`
  - [ ] Update imports to use `../../core/types`

- [ ] 3.2 Copy handlers
  - [ ] Copy `map-generator/handlers/` → `src/generator/handlers/`
  - [ ] Update type imports

- [ ] 3.3 Copy synthesizers
  - [ ] Copy `map-generator/synthesizers/` → `src/generator/synthesizers/`
  - [ ] Update type imports

- [ ] 3.4 Copy strategies
  - [ ] Copy `map-generator/strategies/` → `src/generator/strategies/`
  - [ ] Update type imports

- [ ] 3.5 Copy validation
  - [ ] Copy `map-generator/validation/` → `src/generator/validation/`
  - [ ] Update type imports

- [ ] 3.6 Move main service files
  - [ ] Copy `PlacementService.ts` → `src/generator/`
  - [ ] Copy `TopologyRegistry.ts` → `src/generator/`
  - [ ] Update imports

- [ ] 3.7 Create `src/generator/index.ts` with exports

## Phase 4: Analyzer Module

- [ ] 4.1 Copy core analyzer
  - [ ] Copy `MapAnalyzer.ts` → `src/analyzer/`
  - [ ] **IMPORTANT**: Convert `Vector3` interface usage to `Coord` tuple
  - [ ] Add conversion helpers for GameConfig input

- [ ] 4.2 Copy academic types
  - [ ] Copy `AcademicConceptTypes.ts` → `src/analyzer/`
  - [ ] Update Vector3 → Coord

- [ ] 4.3 Copy generators
  - [ ] Copy `generators/` → `src/analyzer/generators/`
  - [ ] Update type imports

- [ ] 4.4 Copy supporting files
  - [ ] Copy `AcademicPlacementGenerator.ts`
  - [ ] Copy `CoordinatePrioritizer.ts`
  - [ ] Copy `PlacementStrategy.ts`
  - [ ] Copy `PlacementTemplate.ts`
  - [ ] Copy `SelectableElement.ts`

- [ ] 4.5 Create `src/analyzer/index.ts` with exports

## Phase 5: Main Index & Build

- [ ] 5.1 Create `src/index.ts` with all public exports
  - [ ] Re-export core types
  - [ ] Re-export generator module
  - [ ] Re-export analyzer module

- [ ] 5.2 Verify TypeScript compiles
  ```bash
  cd packages/academic-map-generator
  pnpm exec tsc --noEmit
  ```

## Phase 6: Update Consumers

- [ ] 6.1 Update `apps/map-builder-app` imports
  - [ ] Find all imports from `map-generator`
  - [ ] Find all imports from `academic-map-engine` / `academic-placer`
  - [ ] Update to `@repo/academic-map-generator`

- [ ] 6.2 Verify app builds
  ```bash
  cd apps/map-builder-app
  pnpm build
  ```

- [ ] 6.3 Run existing tests
  ```bash
  cd apps/map-builder-app
  pnpm test
  ```

## Phase 7: Cleanup

- [ ] 7.1 Update workspace `pnpm-workspace.yaml` if needed

- [ ] 7.2 Remove old packages
  - [ ] Delete `packages/academic-map-engine`
  - [ ] Delete `packages/map-generator`

- [ ] 7.3 Update any remaining references

## Estimated Effort

| Phase | Effort | Risk |
|-------|--------|------|
| Phase 1 | 0.5h | Low |
| Phase 2 | 1h | Medium |
| Phase 3 | 2h | Low |
| Phase 4 | 2h | Medium (type conversion) |
| Phase 5 | 0.5h | Low |
| Phase 6 | 1h | High (breaking changes) |
| Phase 7 | 0.5h | Low |
| **Total** | **~8h** | |
