# Tasks: Add Post-Processor System

## Phase 1: Core Infrastructure

- [x] 1.1 Create `PostProcessor` module in `@repo/academic-map-generator`
- [x] 1.2 Define `PostProcessorConfig` interface with type discriminator
- [x] 1.3 Add `postProcess()` function to Template DSL interpreter
- [x] 1.4 Integrate PostProcessor into `generateFromCode()` pipeline

## Phase 2: Fill Bounding Box

- [x] 2.1 Implement `calculateBoundingBox(pathCoords)` utility
- [x] 2.2 Implement `fillBoundingBox(config)` processor
- [x] 2.3 Add `walkable` property support to block generation
- [ ] 2.4 Write unit tests for bounding box calculation
- [ ] 2.5 Write integration test with template

## Phase 3: Extend Shape

- [x] 3.1 Implement `findSwitchPositions(map)` utility
- [x] 3.2 Implement `getMovementDirection(pathCoords, index)` utility
- [x] 3.3 Implement `generateShapeCoords(shape, size, center)` for square/rectangle/circle
- [x] 3.4 Implement `calculateBias(direction, bias)` for left/right/center offset
- [x] 3.5 Implement `extendShape(config)` processor
- [x] 3.6 Handle `levelMode: 'same' | 'stepDown'` for 3D maps
- [x] 3.7 Implement `connectPath` bridge generation
- [ ] 3.8 Write unit tests for shape generation
- [ ] 3.9 Write integration tests with flat and 3D templates

## Phase 4: Template Integration

- [x] 4.1 Create example template using `fillBoundingBox`
- [x] 4.2 Create example template using `extendShape`
- [ ] 4.3 Update TEMPLATE_STRUCTURE.md with postProcess documentation
- [ ] 4.4 Update MICRO_PATTERN.md with post-processor reference

## Phase 5: Visual Verification

- [ ] 5.1 Test in Map Builder with flat map
- [ ] 5.2 Test in Map Builder with 3D map (Y changes)
- [ ] 5.3 Verify traversability of filled/extended areas
- [ ] 5.4 Take screenshots for walkthrough

---

## Future Phases (Not in scope)

### Phase 6: Sidewalk
- [ ] 6.1 Implement path edge detection
- [ ] 6.2 Implement `expandSidewalk(config)` processor

### Phase 7: 3D Features
- [ ] 7.1 Implement `addColumnSupport(config)`
- [ ] 7.2 Implement `extrudeWalls(config)`
- [ ] 7.3 Implement `fillStairs(config)`

### Phase 8: Advanced Features
- [ ] 8.1 Implement `sculptTerrain(config)`
- [ ] 8.2 Implement `fillBridge(config)`
- [ ] 8.3 Implement `scatterItems(config)`
