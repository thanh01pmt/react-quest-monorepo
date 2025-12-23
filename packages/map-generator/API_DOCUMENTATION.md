# Map Generator API Documentation

## Overview

The Map Generator provides a comprehensive system for generating educational game maps with pedagogical considerations. It supports various topologies, placement strategies, and solution synthesis for Blockly-based coding education.

## Table of Contents

1. [Quick Start](#quick-start)
2. [PlacementService API](#placementservice-api)
3. [Handlers](#handlers)
4. [Topologies](#topologies)
5. [Synthesizers](#synthesizers)
6. [Examples](#examples)

---

## Quick Start

```typescript
import { PlacementService, PedagogyStrategy } from './PlacementService';
import { StraightLineTopology } from './topologies/StraightLine';

// Create service and topology
const service = new PlacementService();
const topology = new StraightLineTopology();

// Generate map with Solution-First approach
const result = await service.generateMap({
    topology,
    params: { length: 10 },
    strategy: PedagogyStrategy.FUNCTION_LOGIC,
    difficulty: 'simple',
    assetMap: yourAssetMap,
    useSolutionFirst: true  // Enable advanced placement
});

console.log('Generated objects:', result.objects.length);
console.log('Path info:', result.pathInfo);
```

---

## PlacementService API

### `PlacementConfig`

```typescript
interface PlacementConfig {
    // Required
    topology: BaseTopology;           // Topology instance
    params: Record<string, any>;      // Topology parameters
    strategy: PedagogyStrategy;       // Placement strategy
    difficulty: 'intro' | 'simple' | 'complex';
    assetMap: Map<string, BuildableAsset>;
    
    // Optional
    densityMode?: DensityMode;        // Item density control
    academicParams?: AcademicParams;  // Academic parameters
    itemGoals?: ItemGoals;            // Target item counts
    useSolutionFirst?: boolean;       // Enable SolutionFirstPlacer
}
```

### `generateMap(config: PlacementConfig)`

Main entry point for map generation.

**Returns:** `Promise<{ objects: PlacedObject[], pathInfo: IPathInfo }>`

**Example:**
```typescript
const result = await service.generateMap({
    topology: new LShapeTopology(),
    params: { arm_length: 5 },
    strategy: PedagogyStrategy.LOOP_LOGIC,
    difficulty: 'simple',
    assetMap,
    academicParams: {
        logic_type: 'loop_logic',
        difficulty_code: 'MEDIUM'
    }
});
```

---

## Handlers

### SolutionFirstPlacer

Main orchestrator for pedagogically-aware placement.

```typescript
import { getSolutionFirstPlacer } from './handlers';

const placer = getSolutionFirstPlacer();

const result = placer.placeItems(
    pathInfo,           // IPathInfo from topology
    params,             // Placement parameters
    assetMap,           // Asset lookup map
    gridSize            // Optional grid size
);

// Result structure
interface PlacementResult {
    items: PedagogicalItemPlacement[];
    collectibles: PlacedObject[];
    interactibles: PlacedObject[];
    metadata?: Record<string, any>;
    expected_solution?: Record<string, any>;
}
```

### PatternLibrary

Provides patterns for item placement on segments.

```typescript
import { getPatternLibrary } from './handlers';

const library = getPatternLibrary();

// Get patterns for logic type
const patterns = library.getPatterns('function_logic');

// Filter by segment length
const filtered = library.filterBySegmentLength(patterns, 8);

// Select best pattern
const best = library.selectBestPattern(filtered, 8);
```

### PlacementCalculator

Calculates exact item positions from patterns.

```typescript
import { getPlacementCalculator } from './handlers';

const calculator = getPlacementCalculator();

// Calculate for all segments
const placements = calculator.calculateForAllSegments(segments, patternMatches);

// Filter invalid
const valid = calculator.filterInvalidPlacements(
    placements, startPos, targetPos, pathCoords
);

// Verify
const { success, errors } = calculator.verifyPlacements(
    valid, pathCoords, startPos, targetPos
);
```

### SymmetricPlacer

Handles symmetric topologies (hub-spoke, islands).

```typescript
import { getSymmetricPlacer } from './handlers';

const placer = getSymmetricPlacer();

// Check topology type
if (placer.isHubSpoke(metadata)) {
    const result = placer.symmetricHubSpokePlacement(
        pathInfo, params, buildLayoutFn
    );
}

if (placer.isIslandArray(metadata)) {
    const result = placer.symmetricIslandPlacement(
        pathInfo, params, buildLayoutFn
    );
}
```

### PedagogicalStrategyHandler

Implements pedagogical placement strategies.

```typescript
import { getPedagogicalStrategyHandler } from './handlers';

const handler = getPedagogicalStrategyHandler();

// Available strategies:
// - linear_repeat
// - corner_turn
// - segment_based
// - function_reuse
// - branch_exploration
// - nested_loops
// - conditional_branching

const result = handler.applyStrategy(pathInfo, params, buildLayoutFn);
```

---

## Topologies

All topologies provide:
- `generatePathInfo(gridSize, params)` - Generate path information
- `generatePathInfoVariants(gridSize, params, maxVariants)` - Generate variants

### Topology Metadata Structure

```typescript
metadata: {
    topology_type: string,
    segments: Coord[][],
    segment_analysis: {
        num_segments: number,
        lengths: number[],
        types: string[],
        min_length: number,
        max_length: number,
        avg_length: number
    },
    semantic_positions: {
        start: Coord,
        end: Coord,
        // Named positions (corners, centers, etc.)
        optimal_start: string,
        optimal_end: string,
        valid_pairs: ValidPair[]
    }
}
```

### Available Topologies

| Topology | Best For | Key Features |
|----------|----------|--------------|
| `StraightLine` | Intro | Linear path |
| `LShape` | Loops | Single corner |
| `UShape` | Functions | U-turn pattern |
| `TShape` | Conditionals | Branch selection |
| `HShape` | Functions | Parallel segments |
| `EFShape` | Nested loops | Multiple branches |
| `Spiral` | Loops | Turn repetition |
| `PlowingField` | Nested loops | Boustrophedon |
| `Grid` | Loops | Row/column patterns |
| `PlusShape` | Functions | Hub-spoke |
| `StarShape` | Functions | Radial branches |
| `ComplexMaze` | Advanced | Backtracking |

---

## Synthesizers

Convert raw actions into structured Blockly programs.

### Usage

```typescript
import { getSynthesizerRegistry } from './synthesizers';

const registry = getSynthesizerRegistry();

// Synthesize actions
const result = registry.synthesize(actions, world);

// Result structure
interface SynthesisResult {
    main: StructuredBlock[];
    procedures: Record<string, StructuredBlock[]>;
}
```

### FunctionSynthesizer

Extracts PROCEDURE blocks from repeating sequences.

```typescript
import { getFunctionSynthesizer } from './synthesizers';

const synthesizer = getFunctionSynthesizer();

// Check if applicable
if (synthesizer.canHandle('function_logic', world)) {
    const result = synthesizer.synthesize(actions, world);
    console.log('Procedures found:', Object.keys(result.procedures));
}
```

### DefaultSynthesizer

Fallback with basic loop compression.

```typescript
import { getDefaultSynthesizer } from './synthesizers';

const synthesizer = getDefaultSynthesizer();
const result = synthesizer.synthesize(actions, world);
```

---

## Examples

### Generate Function Logic Map

```typescript
const service = new PlacementService();

const result = await service.generateMap({
    topology: new HShapeTopology(),
    params: { arm_length: 4, bar_length: 6 },
    strategy: PedagogyStrategy.FUNCTION_LOGIC,
    difficulty: 'simple',
    assetMap,
    useSolutionFirst: true,
    academicParams: {
        logic_type: 'function_logic',
        force_function: true
    }
});
```

### Generate Loop Logic Map

```typescript
const result = await service.generateMap({
    topology: new PlowingFieldTopology(),
    params: { rows: 4, row_length: 5 },
    strategy: PedagogyStrategy.LOOP_LOGIC,
    difficulty: 'complex',
    assetMap,
    useSolutionFirst: true,
    academicParams: {
        logic_type: 'loop_logic'
    }
});
```

### Use PatternLibrary Directly

```typescript
import { getPatternLibrary, getPlacementCalculator } from './handlers';

const library = getPatternLibrary();
const calculator = getPlacementCalculator();

// Define segments
const segments: Coord[][] = [
    [[0,0,0], [1,0,0], [2,0,0], [3,0,0]],
    [[3,0,0], [3,0,1], [3,0,2], [3,0,3]]
];

// Match patterns
const patterns = library.getPatterns('function_logic');
const matches = segments.map((seg, idx) => {
    const filtered = library.filterBySegmentLength(patterns, seg.length);
    const best = library.selectBestPattern(filtered, seg.length);
    return { segmentIdx: idx, pattern: best };
}).filter(m => m.pattern);

// Calculate placements
const placements = calculator.calculateForAllSegments(segments, matches);
```

### Synthesize Solution

```typescript
import { getSynthesizerRegistry } from './synthesizers';

const registry = getSynthesizerRegistry();

const actions = [
    'moveForward', 'moveForward', 'turnLeft',
    'moveForward', 'moveForward', 'turnLeft',
    'moveForward', 'moveForward', 'turnLeft',
    'moveForward', 'moveForward'
];

const world = {
    available_blocks: new Set([
        'maze_moveForward', 
        'maze_turn', 
        'maze_repeat',
        'PROCEDURE'
    ]),
    solution_config: { 
        logic_type: 'function_logic',
        force_function: true
    }
};

const result = registry.synthesize(actions, world);

console.log('Main program:', result.main);
console.log('Procedures:', result.procedures);
```

---

## Testing

Run tests with Vitest:

```bash
cd apps/map-builder-app
pnpm test src/map-generator/__tests__/
```

Individual test files:
- `handlers.test.ts` - Handler tests
- `synthesizers.test.ts` - Synthesizer tests

---

## Architecture

```
map-generator/
├── PlacementService.ts      # Main entry point
├── TopologyRegistry.ts      # Topology management
├── types.ts                 # Core types
├── handlers/                # Placement handlers
│   ├── PatternLibrary.ts
│   ├── PlacementCalculator.ts
│   ├── SymmetricPlacer.ts
│   ├── FallbackHandler.ts
│   ├── SolutionFirstPlacer.ts
│   └── index.ts
├── synthesizers/            # Solution synthesis
│   ├── BaseSynthesizer.ts
│   ├── FunctionSynthesizer.ts
│   ├── DefaultSynthesizer.ts
│   ├── SynthesizerRegistry.ts
│   └── index.ts
├── topologies/              # 30+ topology types
│   ├── BaseTopology.ts
│   ├── StraightLine.ts
│   ├── LShape.ts
│   └── ...
├── strategies/              # Legacy strategies
└── __tests__/               # Unit tests
```
