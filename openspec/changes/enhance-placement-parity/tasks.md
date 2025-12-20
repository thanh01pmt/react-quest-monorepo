# Implementation Tasks

## Phase 1: Pattern Library System
- [x] **1.1 Create Pattern Registry**
    - [x] Define `PatternDefinition` interface (sequence, minLength, logicType, diversityScore)
    - [x] Port core patterns from Python: 10+ patterns including EVERY_STEP, ALTERNATING, DECREASING, etc.
    - [x] Create `PatternRegistry.ts` with `getPattern()`, `suggestPatterns()`, `applyPattern()` methods

- [x] **1.2 Pattern Matcher**
    - [x] Implement `suggestPatterns(segmentLength, logicType)` function
    - [x] Auto-select based on segment length and current strategy
    - [x] Implement `applyPattern(pattern, segment)` function

## Phase 2: Density Control System
- [x] **2.1 Density Mode Implementation**
    - [x] Add `DensityMode` enum: uniform, decreasing, increasing, zigzag, clustered
    - [x] Implement `calculateDensityForPosition(mode, index, total)` function
    - [x] Map logic_type to default density mode

- [x] **2.2 PlacementConfig Enhancement**
    - [x] Add `densityMode?: DensityMode` to PlacementConfig interface
    - [x] Add `itemGoals?: ItemGoals` to PlacementConfig interface
    - [x] Add `academicParams?: AcademicParams` to PlacementConfig interface

## Phase 3: Full Strategy System
- [x] **3.1 Strategy Handler Architecture**
    - [x] Create `strategies/BaseStrategy.ts` abstract class
    - [x] Create `strategies/StrategyRegistry.ts` for registration
    - [x] Create individual strategy files:
        - [x] `FunctionReuseStrategy.ts`
        - [x] `ConditionalBranchingStrategy.ts`
        - [x] `WhileLoopDecreasingStrategy.ts`
        - [x] `VariableRateChangeStrategy.ts`
        - [x] `NestedLoopsStrategy.ts`
        - [x] `PatternRecognitionStrategy.ts`
        - [x] `BacktrackingStrategy.ts`
    - [x] Create `LoopLogicStrategy.ts`

- [x] **3.2 Strategy Application**
    - [x] Implement `applyStrategy(strategy, pathInfo, assetMap, config)` in PlacementService
    - [x] Ensure each strategy produces pedagogically valid item placement
    - [x] Add strategy-specific logging for debugging

## Phase 4: Academic Parameters
- [x] **4.1 Type Definitions**
    - [x] Create `types/AcademicParams.ts` interface (in strategies/types.ts)
    - [x] Create `types/ItemConfig.ts` interface (in strategies/types.ts)
    - [x] Create `types/ItemGoals.ts` interface (in strategies/types.ts)

- [x] **4.2 UI Integration**
    - [x] Add Bloom Level selector to TopologyPanel
    - [x] Add Difficulty selector (EASY/MEDIUM/HARD) - via existing dropdown (intro/simple/complex)
    - [x] Add Item Goals configuration section (Gems, Crystals, Switches)
    - [ ] Add Core Skills multi-select
    - [x] Add all 8 strategies to Strategy dropdown

- [ ] **4.3 Auto-Adjustment Logic**
    - [x] Map Bloom level to pattern complexity
    - [ ] Map difficulty to density and path length
    - [ ] Validate academic params against strategy requirements

## Phase 5: Validation Pipeline
- [x] **5.1 Validation Tiers**
    - [x] Implement `validateTier1(mapData)`: Basic solvability checks
    - [x] Implement `validateTier2(mapData, logicType)`: Logic type compliance
    - [x] Implement `validateTier3(mapData, strategy)`: Pattern/pedagogy checks

- [x] **5.2 Validation UI**
    - [x] Create `ValidationReport` component
    - [x] Display tier pass/fail with icons
    - [x] Show specific failures with fix suggestions
    - [x] Integrate with MapInspector (shows validation status + expandable report)

## Phase 6: Testing & Verification
- [ ] **6.1 Unit Tests**
    - [ ] Test each strategy produces expected pattern
    - [ ] Test density modes generate correct gradients
    - [ ] Test pattern matching selects appropriate patterns

- [ ] **6.2 Integration Tests**
    - [ ] Test full generation flow with academic params
    - [ ] Test validation pipeline catches invalid maps
    - [ ] Compare output with Python implementation samples

---

## Progress Summary

### ✅ Completed (Core Features)
- **8 Pedagogical Strategies** fully implemented
- **5 Density Modes** with calculation functions
- **10+ Placement Patterns** in PatternRegistry
- **3-Tier Validation Pipeline** with detailed checks
- **Type System** for AcademicParams, ItemConfig, ItemGoals
- **UI Integration** - all strategies in dropdown

### ✅ Completed (UI Enhancements - Phase 4 & 5)
- **Bloom Level Selector** - 6 levels (Remember → Create)
- **Difficulty Selector** - already present (intro/simple/complex)
- **Item Goals UI** - Gems, Crystals, Switches input fields
- **ValidationReport Component** - displays 3-tier results with icons
- **MapInspector Integration** - shows validation status, click to expand details

### ✅ Completed (Topology Expansion)
- **4 New Topologies Added:** StraightLine, Zigzag, TShape, UShape
- **Grouped Topology Selector** - categorized as Basic/Shapes/Complex
- **Display Names** - human-readable names in dropdown
- **Dark Theme Styling** - TopologyPanel now matches app theme
- **Parameter Inputs** - each topology has specific params (path_length, num_segments, etc.)

### ⏳ Remaining (Lower Priority)
- Core Skills multi-select UI
- Difficulty-to-density mapping logic
- Academic params validation logic
- Unit and integration tests
- Python parity verification

