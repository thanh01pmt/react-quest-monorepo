# Change: Enhance PlacementService Parity with Python Implementation

## Why
The current TypeScript `PlacementService` implementation is missing critical features from the Python `map_generator/service.py` and related modules. After comparing the implementations, there are significant gaps in:
1. **Pattern Library System**: Python has sophisticated pattern selection and application
2. **Density Control**: Python implements smart density modes (uniform, decreasing, zigzag)
3. **Strategy Handler**: Python has 7 pedagogical strategies vs only 3 in TS (Loop/Function/Random)
4. **Validation Pipeline**: Python has multi-tier validation (Tier1/2/3 pedagogy checks)
5. **Item Goals System**: Python supports complex item placement configurations

## What Changes

### 1. Pattern Library Integration
- **[NEW] Pattern Registry**: Port `PATTERNS` dictionary from Python with configurable item sequences
- **[NEW] Pattern Matching**: Auto-select patterns based on segment length and logic type
- **[NEW] Pattern Application**: Apply patterns consistently across segments/branches

### 2. Smart Density Control
- **[NEW] Density Modes**:
    - `uniform`: Same density across all segments
    - `decreasing`: Higher density at start, lower at end (for while loops)
    - `increasing`: Lower at start, higher at end
    - `zigzag`: Alternating high-low density
- **[MODIFIED] PlacementConfig**: Add `densityMode` parameter

### 3. Full Strategy Implementation
- **[NEW] Strategies to port**:
    - `conditional_branching`: Creates decoy vs goal branches with different items
    - `while_loop_decreasing`: Density gradient patterns
    - `variable_rate_change`: Variable spacing patterns [1,2,3] or [3,2,1]
    - `nested_loops`: Higher density in sub-grids
    - `pattern_recognition`: Identical patterns across segments
    - `backtracking`: Items on dead ends to teach exploration
- **[MODIFIED] PedagogyStrategy enum**: Expand from 3 to 7+ strategies

### 4. Academic Parameters Integration
- **[NEW] AcademicParams interface**: Port from Python
    - `difficulty_code`: EASY | MEDIUM | HARD
    - `bloom_level_codes`: REMEMBER | UNDERSTAND | APPLY | ANALYZE | EVALUATE | CREATE
    - `core_skill_codes`: problem_solving | logical_thinking | pattern_recognition
- **[NEW] Auto-adjust complexity**: Bloom level affects pattern complexity

### 5. Item Placement Configuration
- **[NEW] ItemConfig interface**: 
    - `type`: gem | switch | crystal | key
    - `count`: number
    - `placement_hint`: start | middle | end | corners | segments
- **[NEW] ItemGoals system**: Support for `solution_item_goals` string format

### 6. Validation Integration
- **[NEW] Real-time pedagogy validation**:
    - Tier 1 (Basic): Path connectivity, start/end defined
    - Tier 2 (Logic): Strategy correctly implemented
    - Tier 3 (Pattern): Pattern consistency, diversity score
- **[NEW] Validation Report**: Show pass/fail for each tier

## Impact
- **Specs**: `openspec/changes/enhance-placement-parity/specs/`
- **Code**:
    - `apps/map-builder-app/src/map-generator/PlacementService.ts`: Major enhancement
    - `apps/map-builder-app/src/map-generator/patterns/`: New pattern library
    - `apps/map-builder-app/src/map-generator/strategies/`: Strategy handler files
    - `apps/map-builder-app/src/components/TopologyPanel/index.tsx`: UI for new parameters
