/**
 * Template Generator Layer (L3)
 * 
 * Combines L1 Micro-Patterns + L2 Loop Structures to generate map data.
 * This is the highest level abstraction for dynamic map generation.
 * 
 * =============================================================================
 * ARCHITECTURE
 * =============================================================================
 * L3: Template Generator  [template-generator.ts] ← THIS FILE
 *     Input: GeneratorConfig
 *     Output: GeneratedMap (coords, items, solution)
 * 
 * L2: Loop Structures     [loop-structures.ts]
 *     Defines: single, nested, while loops with count modes
 * 
 * L1: Micro-Patterns      [micro-patterns.ts]
 *     Defines: atomic action sequences (M_C, M_M_C...)
 * =============================================================================
 */

import type { MicroPattern, ActionType } from './micro-patterns';
import { getRandomPattern, patternToCode } from './micro-patterns';
import type { LoopStructure, SingleLoopStructure, NestedLoopStructure, WhileLoopStructure, CountMode } from './loop-structures';
import { createSingleLoop, createNestedLoop, createWhileLoop, CountModes, calculateCount, estimateTotalActions, estimateSolutionBlocks } from './loop-structures';

// =============================================================================
// TYPES
// =============================================================================

/** Direction facing */
export type Direction = 'north' | 'east' | 'south' | 'west';

/** 3D coordinate */
export interface Coord {
  x: number;
  y: number;
  z: number;
}

/** Placed item on map */
export interface PlacedItem {
  type: 'crystal' | 'switch' | 'key';
  coord: Coord;
  /** Switch initial state (only for switch type) */
  state?: 'on' | 'off';
}

/** Generated map output */
export interface GeneratedMap {
  /** All walkable coordinates (path) */
  pathCoords: Coord[];
  /** Placed items (crystals, switches) */
  items: PlacedItem[];
  /** Start position */
  startPos: Coord;
  /** Start direction */
  startDirection: Direction;
  /** End position (target) */
  endPos: Coord;
  /** Raw solution actions */
  rawSolution: ActionType[];
  /** Estimated block count with different presets */
  blockEstimates: {
    raw: number;
    withLoop: number;
    withNestedLoop: number;
  };
  /** Structure metadata */
  structure: LoopStructure;
}

/** Conditional configuration for sensor-based maps */
export interface ConditionalConfig {
  /** Use pathAhead checks? → Random block placement */
  usePathAhead?: boolean;
  /** Probability of path existing (0-1) when usePathAhead is true */
  pathAheadProbability?: number;
  
  /** Use switch state checks? → Random switch state placement */
  useSwitchState?: boolean;
  
  /** Use key checks? → Random key placement */
  useKeyPlacement?: boolean;
  /** Probability of key existing (0-1) when useKeyPlacement is true */
  keyProbability?: number;
}

/** Generator configuration */
export interface GeneratorConfig {
  /** Target structure type */
  structureType: 'single' | 'nested' | 'while';

  /** Extract inner loops to helper functions? */
  useHelperFunctions?: boolean;
  
  /** Loop counts */
  outerCount?: number;
  innerCount?: CountMode;
  
  /** Pattern constraints */
  patternMaxLength?: number;
  patternInteractionType?: 'crystal' | 'switch' | 'key' | 'mixed';
  includeJumpActions?: boolean;
  
  /** Map constraints */
  mapWidth?: number;
  mapHeight?: number;
  
  /** Starting position and direction */
  startX?: number;
  startZ?: number;
  startDirection?: Direction;
  
  /** Target block count range (for validation) */
  targetBlockRange?: [number, number];
  
  /** Conditional configuration for sensor-based generation */
  conditionalConfig?: ConditionalConfig;
  
  /** Random seed for reproducibility */
  seed?: number;
}

// =============================================================================
// DIRECTION UTILITIES
// =============================================================================

const DIRECTION_VECTORS: Record<Direction, { dx: number; dz: number }> = {
  north: { dx: 0, dz: -1 },
  east: { dx: 1, dz: 0 },
  south: { dx: 0, dz: 1 },
  west: { dx: -1, dz: 0 },
};

const DIRECTION_ORDER: Direction[] = ['north', 'east', 'south', 'west'];

function turnLeft(dir: Direction): Direction {
  const idx = DIRECTION_ORDER.indexOf(dir);
  return DIRECTION_ORDER[(idx + 3) % 4];
}

function turnRight(dir: Direction): Direction {
  const idx = DIRECTION_ORDER.indexOf(dir);
  return DIRECTION_ORDER[(idx + 1) % 4];
}

function moveForward(pos: Coord, dir: Direction): Coord {
  const vec = DIRECTION_VECTORS[dir];
  return { x: pos.x + vec.dx, y: pos.y, z: pos.z + vec.dz };
}

// =============================================================================
// ACTION EXECUTOR
// =============================================================================

interface ExecutionState {
  pos: Coord;
  dir: Direction;
  path: Coord[];
  items: PlacedItem[];
  actions: ActionType[];
  /** Random number generator */
  rng: () => number;
  /** Conditional config */
  conditionalConfig?: ConditionalConfig;
}

/**
 * Execute a single action and update state
 */
function executeAction(state: ExecutionState, action: ActionType): void {
  state.actions.push(action);
  
  switch (action) {
    case 'moveForward':
      state.pos = moveForward(state.pos, state.dir);
      state.path.push({ ...state.pos });
      break;
    
    case 'jump':
      // Jump = move forward (same as move for path purposes)
      state.pos = moveForward(state.pos, state.dir);
      state.path.push({ ...state.pos });
      break;
    
    case 'jumpUp':
      state.pos = { ...state.pos, y: state.pos.y + 1 };
      state.pos = moveForward(state.pos, state.dir);
      state.path.push({ ...state.pos });
      break;
    
    case 'jumpDown':
      state.pos = { ...state.pos, y: state.pos.y - 1 };
      state.pos = moveForward(state.pos, state.dir);
      state.path.push({ ...state.pos });
      break;
    
    case 'turnLeft':
      state.dir = turnLeft(state.dir);
      break;
    
    case 'turnRight':
      state.dir = turnRight(state.dir);
      break;
    
    case 'collectItem': {
      // Check for random key placement mode
      const cc = state.conditionalConfig;
      if (cc?.useKeyPlacement) {
        const prob = cc.keyProbability ?? 0.5;
        if (state.rng() < prob) {
          state.items.push({ type: 'key', coord: { ...state.pos } });
        } else {
          state.items.push({ type: 'crystal', coord: { ...state.pos } });
        }
      } else {
        state.items.push({ type: 'crystal', coord: { ...state.pos } });
      }
      break;
    }
    
    case 'toggleSwitch': {
      // Check for random switch state mode
      const cc = state.conditionalConfig;
      if (cc?.useSwitchState) {
        const initialState = state.rng() < 0.5 ? 'on' : 'off';
        state.items.push({ type: 'switch', coord: { ...state.pos }, state: initialState });
      } else {
        state.items.push({ type: 'switch', coord: { ...state.pos } });
      }
      break;
    }
    
    case 'pickUpKey':
      state.items.push({ type: 'key', coord: { ...state.pos } });
      break;
  }
}

/**
 * Execute a pattern (sequence of actions)
 */
function executePattern(state: ExecutionState, pattern: MicroPattern): void {
  for (const action of pattern.actions) {
    executeAction(state, action);
  }
}

// =============================================================================
// STRUCTURE EXECUTORS
// =============================================================================

/**
 * Execute a single loop structure
 */
function executeSingleLoop(structure: SingleLoopStructure, state: ExecutionState): void {
  // Execute prefix
  if (structure.prefix) {
    executePattern(state, structure.prefix);
  }
  
  // Execute main loop
  for (let i = 0; i < structure.count; i++) {
    executePattern(state, structure.pattern);
  }
  
  // Execute suffix
  if (structure.suffix) {
    executePattern(state, structure.suffix);
  }
}

/**
 * Execute a nested loop structure
 */
function executeNestedLoop(structure: NestedLoopStructure, state: ExecutionState): void {
  // Execute prefix
  if (structure.prefix) {
    executePattern(state, structure.prefix);
  }
  
  // Execute outer loop
  for (let outer = 0; outer < structure.outerCount; outer++) {
    // Calculate inner count for this iteration
    const innerCount = calculateCount(structure.innerCount, outer);
    
    // Execute inner loop
    for (let inner = 0; inner < innerCount; inner++) {
      executePattern(state, structure.innerPattern);
    }
    
    // Execute transition (except after last outer iteration)
    if (outer < structure.outerCount - 1) {
      executePattern(state, structure.transitionPattern);
    }
  }
  
  // Execute suffix
  if (structure.suffix) {
    executePattern(state, structure.suffix);
  }
}

/**
 * Execute any loop structure
 */
function executeStructure(structure: LoopStructure, state: ExecutionState): void {
  switch (structure.type) {
    case 'single':
      executeSingleLoop(structure, state);
      break;
    case 'nested':
      executeNestedLoop(structure, state);
      break;

    case 'while':
      // While loop simulation: execute pattern random times (between min and max)
      // This creates a valid path for "while not done"
      const w = structure as WhileLoopStructure;
      const iterations = Math.floor(state.rng() * (w.maxIterations - w.minIterations + 1)) + w.minIterations;
      for (let i = 0; i < iterations; i++) {
        executePattern(state, w.pattern);
      }
      break;
  }
}

// =============================================================================
// MAP GENERATOR
// =============================================================================

/**
 * Generate a map from configuration
 */
export function generateMap(config: GeneratorConfig): GeneratedMap {
  const {
    structureType,
    outerCount = 4,
    innerCount = CountModes.fixed(3),
    patternMaxLength = 3,
    patternInteractionType = 'crystal',
    includeJumpActions = false,
    startX = 0,
    startZ = 0,
    startDirection = 'east',
    seed = Date.now(),
    conditionalConfig,
  } = config;
  
  // Create seeded RNG (Mulberry32)
  const createRng = (s: number) => {
    return () => {
      let t = s += 0x6D2B79F5;
      t = Math.imul(t ^ t >>> 15, t | 1);
      t ^= t + Math.imul(t ^ t >>> 7, t | 61);
      return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
  };
  
  // Create initial state
  const startPos: Coord = { x: startX, y: 0, z: startZ };
  const state: ExecutionState = {
    pos: { ...startPos },
    dir: startDirection,
    path: [{ ...startPos }],
    items: [],
    actions: [],
    rng: createRng(seed + 1000),  // Different seed for conditional randomization
    conditionalConfig,
  };
  
  // Generate structure based on type
  let structure: LoopStructure;
  
  if (structureType === 'single') {
    const pattern = getRandomPattern({
      maxLength: patternMaxLength,
      interactionType: patternInteractionType,
      includeTemplateActions: includeJumpActions,
      seed,
    });
    
    if (!pattern) {
      throw new Error('Could not generate valid pattern');
    }
    
    structure = createSingleLoop(pattern, outerCount);
  } else if (structureType === 'nested') {
    // Nested loop
    const innerPattern = getRandomPattern({
      nestedLoopCompatible: true,
      maxLength: patternMaxLength,
      interactionType: patternInteractionType,
      includeTemplateActions: includeJumpActions,
      seed,
    });
    
    const transitionPattern = getRandomPattern({
      nestedLoopCompatible: false,
      maxLength: patternMaxLength,
      interactionType: patternInteractionType,
      includeTemplateActions: includeJumpActions,
      seed: seed + 1,
    });
    
    if (!innerPattern || !transitionPattern) {
      throw new Error('Could not generate valid patterns for nested loop');
    }
    
    structure = createNestedLoop(
      innerPattern,
      transitionPattern,
      outerCount,
      innerCount
    );
  } else {
    // While loop
    const pattern = getRandomPattern({
      maxLength: patternMaxLength,
      interactionType: patternInteractionType,
      includeTemplateActions: includeJumpActions,
      seed,
    });
    
    if (!pattern) throw new Error('Could not generate valid pattern for while loop');

    structure = createWhileLoop(pattern, 'notAtEnd', 4, outerCount || 10);
  }
  
  // Execute structure to generate path and items
  executeStructure(structure, state);
  
  // Calculate block estimates
  const rawBlocks = state.actions.length;
  const withLoop = estimateSolutionBlocks(structure, true, false);
  const withNestedLoop = estimateSolutionBlocks(structure, true, true);
  
  return {
    pathCoords: state.path,
    items: state.items,
    startPos,
    startDirection,
    endPos: state.pos,
    rawSolution: state.actions,
    blockEstimates: {
      raw: rawBlocks,
      withLoop,
      withNestedLoop,
    },
    structure,
  };
}

// =============================================================================
// VALIDATION
// =============================================================================

/**
 * Check if generated map fits within bounds
 */
export function validateMapBounds(map: GeneratedMap, width: number, height: number): boolean {
  for (const coord of map.pathCoords) {
    if (coord.x < 0 || coord.x >= width || coord.z < 0 || coord.z >= height) {
      return false;
    }
  }
  return true;
}

/**
 * Check if solution block count is within target range
 */
export function validateBlockCount(
  map: GeneratedMap, 
  targetRange: [number, number],
  preset: 'raw' | 'withLoop' | 'withNestedLoop'
): boolean {
  const blocks = map.blockEstimates[preset];
  return blocks >= targetRange[0] && blocks <= targetRange[1];
}

/**
 * Generate map with retry until valid
 */
export function generateValidMap(
  config: GeneratorConfig,
  maxRetries: number = 10
): GeneratedMap | null {
  const { mapWidth = 20, mapHeight = 20, targetBlockRange } = config;
  
  for (let attempt = 0; attempt < maxRetries; attempt++) {
    const configWithSeed = {
      ...config,
      seed: (config.seed ?? Date.now()) + attempt,
    };
    
    try {
      const map = generateMap(configWithSeed);
      
      // Validate bounds
      if (!validateMapBounds(map, mapWidth, mapHeight)) {
        continue;
      }
      
      // Validate block count if specified
      if (targetBlockRange && !validateBlockCount(map, targetBlockRange, 'withLoop')) {
        continue;
      }
      
      return map;
    } catch (e) {
      // Pattern generation failed, try again
      continue;
    }
  }
  
  return null;
}

// =============================================================================
// CODE GENERATION
// =============================================================================

/**
 * Generate JavaScript solution code from structure
 */
export function generateSolutionCode(structure: LoopStructure, options?: { useHelperFunctions?: boolean }): string {
  const lines: string[] = [];
  
  if (structure.type === 'single') {
    const s = structure as SingleLoopStructure;
    
    // Prefix
    if (s.prefix) {
      lines.push(`// Prefix`);
      lines.push(patternToCode(s.prefix));
    }
    
    // Main loop
    lines.push(`for (let i = 0; i < ${s.count}; i++) {`);
    for (const action of s.pattern.actions) {
      lines.push(`  ${action}();`);
    }
    lines.push(`}`);
    
    // Suffix
    if (s.suffix) {
      lines.push(`// Suffix`);
      lines.push(patternToCode(s.suffix));
    }
  } else if (structure.type === 'nested') {
    const s = structure as NestedLoopStructure;
    
    // Prefix
    if (s.prefix) {
      lines.push(`// Prefix`);
      lines.push(patternToCode(s.prefix));
    }
    
    // Outer loop
    lines.push(`for (let outer = 0; outer < ${s.outerCount}; outer++) {`);
    
    // Inner loop
    const innerCountExpr = getCountExpression(s.innerCount);
    
    if (options?.useHelperFunctions) {
      // Function Extraction Strategy
      lines.unshift(`function processSegment() {`);
      for (const action of s.innerPattern.actions) {
        lines.splice(1, 0, `  ${action}();`);
      }
      lines.splice(1 + s.innerPattern.actions.length, 0, `}`);
      lines.splice(2 + s.innerPattern.actions.length, 0, ``); // Empty line
      
      lines.push(`  for (let inner = 0; inner < ${innerCountExpr}; inner++) {`);
      lines.push(`    processSegment();`);
      lines.push(`  }`);
    } else {
      // Inline generation
      lines.push(`  for (let inner = 0; inner < ${innerCountExpr}; inner++) {`);
        for (const action of s.innerPattern.actions) {
          lines.push(`    ${action}();`);
        }
      lines.push(`  }`);
    }
    
    // Transition (with condition to skip last)
    lines.push(`  if (outer < ${s.outerCount - 1}) {`);
    for (const action of s.transitionPattern.actions) {
      lines.push(`    ${action}();`);
    }
    lines.push(`  }`);
    
    lines.push(`}`);
    
    // Suffix
    if (s.suffix) {
      lines.push(`// Suffix`);
      lines.push(patternToCode(s.suffix));
    }
  } else if (structure.type === 'while') {
    const s = structure as WhileLoopStructure;
    lines.push(`while (notDone()) {`);
    for (const action of s.pattern.actions) {
      lines.push(`  ${action}();`);
    }
    lines.push(`}`);
  }
  
  return lines.join('\n');
}

/**
 * Convert CountMode to code expression
 */
function getCountExpression(mode: CountMode): string {
  switch (mode.type) {
    case 'fixed':
      return `${mode.value}`;
    case 'linear':
      if (mode.step === 1 && mode.base === 1) {
        return `outer + 1`;
      }
      return `${mode.base} + ${mode.step} * outer`;
    case 'fibonacci':
      return `fibonacci(outer)`;
    case 'custom':
      return `customCount(outer)`;
  }
}
