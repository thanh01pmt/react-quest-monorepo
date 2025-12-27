/**
 * Core Types for Procedural Map Generation
 * 
 * This file defines the fundamental types used across all map generation approaches.
 */

// ============================================================================
// BASIC TYPES
// ============================================================================

/**
 * 2D Vector for positions
 */
export interface Vector2 {
  x: number;
  y: number;
}

/**
 * 3D Vector for 3D map positions
 */
export interface Vector3 {
  x: number;
  y: number;
  z: number;
}

/**
 * Cardinal directions
 */
export enum Direction {
  NORTH = 'NORTH',
  EAST = 'EAST',
  SOUTH = 'SOUTH',
  WEST = 'WEST'
}

/**
 * Direction deltas for movement
 */
export const DIRECTION_DELTAS: Record<Direction, Vector2> = {
  [Direction.NORTH]: { x: 0, y: 1 },
  [Direction.EAST]: { x: 1, y: 0 },
  [Direction.SOUTH]: { x: 0, y: -1 },
  [Direction.WEST]: { x: -1, y: 0 }
};

/**
 * Turn directions
 */
export type Turn = 'left' | 'right' | 'none';

// ============================================================================
// ITEM TYPES
// ============================================================================

/**
 * Types of items that can be placed on map
 */
export enum ItemType {
  // Collectibles
  CRYSTAL = 'crystal',
  KEY = 'key',
  
  // Interactibles
  SWITCH = 'switch',
  PORTAL = 'portal',
  GATE = 'gate',
  
  // Special
  PLAYER_START = 'player_start',
  GOAL = 'goal'
}

/**
 * Item categories
 */
export enum ItemCategory {
  COLLECTIBLE = 'collectible',
  INTERACTIBLE = 'interactible',
  SPECIAL = 'special'
}

/**
 * Map from item type to category
 */
export const ITEM_CATEGORIES: Record<ItemType, ItemCategory> = {
  [ItemType.CRYSTAL]: ItemCategory.COLLECTIBLE,
  [ItemType.KEY]: ItemCategory.COLLECTIBLE,
  [ItemType.SWITCH]: ItemCategory.INTERACTIBLE,
  [ItemType.PORTAL]: ItemCategory.INTERACTIBLE,
  [ItemType.GATE]: ItemCategory.INTERACTIBLE,
  [ItemType.PLAYER_START]: ItemCategory.SPECIAL,
  [ItemType.GOAL]: ItemCategory.SPECIAL
};

/**
 * Item dependencies (what must be placed before)
 */
export const ITEM_DEPENDENCIES: Partial<Record<ItemType, ItemType[]>> = {
  [ItemType.GATE]: [ItemType.KEY],        // Gate requires Key before
  [ItemType.PORTAL]: [],                   // Portal destination is another Portal
};

// ============================================================================
// PEDAGOGY TYPES
// ============================================================================

/**
 * Programming concepts that can be taught
 */
export enum PedagogyConcept {
  // Basic
  SEQUENCE = 'sequence',
  MOVE = 'move',
  TURN = 'turn',
  COLLECT = 'collect',
  
  // Loops
  FOR_COUNTED = 'for_counted',
  FOR_EACH = 'for_each',
  NESTED_FOR = 'nested_for',
  WHILE_CONDITION = 'while_condition',
  REPEAT_UNTIL = 'repeat_until',
  
  // Conditionals
  IF_SIMPLE = 'if_simple',
  IF_ELSE = 'if_else',
  NESTED_IF = 'nested_if',
  SENSING = 'sensing',
  CONDITIONAL_LOGIC = 'conditional_logic',
  
  // Functions
  FUNCTION_DEFINITION = 'function_definition',
  FUNCTION_CALL = 'function_call',
  FUNCTION_PARAMETER = 'function_parameter',
  
  // Advanced
  OPTIMIZATION = 'optimization',
  ALGORITHM_DESIGN = 'algorithm_design',
  DEBUGGING = 'debugging'
}

/**
 * Grade levels for pedagogy configuration
 */
export type GradeLevel = 'K-2' | '3-5' | '6-8' | '9-12';

/**
 * Bloom's Taxonomy levels
 */
export type BloomLevel = 
  | 'Remember' 
  | 'Understand' 
  | 'Apply' 
  | 'Analyze' 
  | 'Evaluate' 
  | 'Create';

/**
 * Difficulty levels (1-5 scale)
 */
export type DifficultyLevel = 1 | 2 | 3 | 4 | 5;

// ============================================================================
// PATTERN TYPES
// ============================================================================

/**
 * Pattern categories
 */
export enum PatternCategory {
  STRAIGHT = 'straight',
  TURN = 'turn',
  ZIGZAG = 'zigzag',
  SPIRAL = 'spiral',
  COMPLEX = 'complex'
}

/**
 * Pattern definition
 */
export interface Pattern {
  id: string;
  sequence: string;               // e.g., "C->-C"
  length: number;                 // Number of steps
  items: PatternItem[];           // Items placed by this pattern
  exitDirection: Turn;            // Direction change after pattern
  
  // Metadata
  category: PatternCategory;
  difficulty: DifficultyLevel;
  teaches?: PedagogyConcept[];
}

/**
 * Item within a pattern
 */
export interface PatternItem {
  type: ItemType;
  relativePosition: Vector2;      // Relative to pattern start
  stepIndex: number;              // Which step places this item
}

/**
 * Loop pattern for repeated structures
 */
export interface LoopPattern {
  body: string;                   // Pattern body to repeat
  iterations: number;             // Number of repetitions (for-counted)
  iterationRange?: [number, number]; // Random range for iterations
  teaches: PedagogyConcept;
}

// ============================================================================
// EXECUTION TYPES
// ============================================================================

/**
 * Character inventory
 */
export interface Inventory {
  keys: number;
  crystals: number;
}

/**
 * Character state during execution
 */
export interface CharacterState {
  position: Vector2;
  direction: Direction;
  inventory: Inventory;
}

/**
 * Execution context for interpreter
 */
export interface ExecutionContext extends CharacterState {
  variables: Map<string, number>;
  loopStack: LoopFrame[];
  switchStates: Map<string, boolean>;
}

/**
 * Loop stack frame
 */
export interface LoopFrame {
  variable: string;
  currentValue: number;
  maxValue: number;
  bodyStartPosition: Vector2;
}

/**
 * Condition types for conditionals
 */
export enum ConditionType {
  CRYSTAL_AHEAD = 'crystalAhead',
  KEY_AHEAD = 'keyAhead',
  BLOCKED_AHEAD = 'blockedAhead',
  AT_PORTAL = 'atPortal',
  AT_GOAL = 'atGoal',
  HAS_KEY = 'hasKey',
  SWITCH_ON = 'switchOn'
}

// ============================================================================
// MAP GENERATION TYPES
// ============================================================================

/**
 * Generation modes
 */
export type GenerationMode = 'PURE_SOLUTION' | 'HYBRID' | 'PURE_PROCEDURAL';

/**
 * Noise levels for hybrid generation
 */
export type NoiseLevel = 'none' | 'low' | 'medium' | 'high';

/**
 * Noise configuration
 */
export interface NoiseConfig {
  noiseType: 'none' | 'visual_only' | 'collectible' | 'full';
  maxNoisePaths: number;
  maxExtraItems: number;
  allowDeadEnds: boolean;
  allowDecoys: boolean;
}

/**
 * Generation constraints
 */
export interface GenerationConstraints {
  maxNestingDepth: number;
  maxComplexityScore: number;
  maxPathLength: number;
  maxItems: number;
  requiredItems: ItemType[];
  forbiddenItems: ItemType[];
  noiseLevel: NoiseLevel;
}

/**
 * Generation configuration
 */
export interface GenerationConfig {
  mode: GenerationMode;
  constraints: GenerationConstraints;
  noiseConfig: NoiseConfig;
  seed?: string;                  // For deterministic generation
}

/**
 * Metrics range for expected outputs
 */
export interface MetricsRange {
  pathLengthRange: [number, number];
  itemCountRange: [number, number];
  branchCountRange: [number, number];
  estimatedTimeMinutes: number;
}

// ============================================================================
// GENERATED MAP TYPES
// ============================================================================

/**
 * Placed item on map
 */
export interface PlacedItem {
  type: ItemType;
  position: Vector2;
  isCore: boolean;                // true = from solution, false = from noise
  state?: any;                    // e.g., switch on/off
}

/**
 * Ground block
 */
export interface GroundBlock {
  position: Vector3;
  type: 'walkable' | 'wall' | 'decoration';
}

/**
 * Visual hint on map
 */
export interface VisualHint {
  position: Vector2;
  type: 'branch_point' | 'optional_path' | 'danger' | 'bonus';
  message?: string;
}

/**
 * Generated map
 */
export interface GeneratedMap {
  // Identity
  id: string;
  templateId?: string;
  seed: string;
  
  // Geometry
  pathCoords: Set<string>;        // All walkable coordinates
  placementCoords: Map<string, ItemType>;
  groundBlocks: GroundBlock[];
  
  // Items
  items: PlacedItem[];
  coreItems: PlacedItem[];        // Items from solution
  noiseItems: PlacedItem[];       // Items from noise
  
  // Player
  startPosition: Vector2;
  startDirection: Direction;
  goalPosition?: Vector2;
  
  // Metadata
  optimalPathLength: number;
  complexity: number;
  bounds: {
    min: Vector2;
    max: Vector2;
  };
  
  // Noise info
  noisePaths: Vector2[][];
  visualHints: VisualHint[];
}

// ============================================================================
// VALIDATION TYPES
// ============================================================================

/**
 * Validation result
 */
export interface ValidationResult {
  valid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  complexity: number;
  suggestions?: string[];
}

/**
 * Validation error
 */
export interface ValidationError {
  code: string;
  message: string;
  position?: Vector2;
  severity: 'error' | 'critical';
}

/**
 * Validation warning
 */
export interface ValidationWarning {
  code: string;
  message: string;
  position?: Vector2;
}

// ============================================================================
// PLAYTEST TYPES
// ============================================================================

/**
 * Playtest result
 */
export interface PlaytestResult {
  success: boolean;
  reachedGoal: boolean;
  itemsCollected: number;
  coreItemsCollected: number;
  bonusItemsCollected: number;
  stepsUsed: number;
  errors: string[];
  path: Vector2[];
}

/**
 * Scoring result
 */
export interface ScoringResult {
  totalScore: number;
  baseScore: number;
  itemScore: number;
  bonusScore: number;
  penaltyScore: number;
  optimalBonus: number;
  isOptimal: boolean;
}

// ============================================================================
// DEPENDENCY TYPES
// ============================================================================

/**
 * Dependency placement strategies
 */
export enum DependencyStrategy {
  BALANCED = 'balanced',          // Spread evenly
  EXPLORATORY = 'exploratory',    // Hidden in detours
  PROGRESSIVE = 'progressive',    // Early to late difficulty
  PUZZLE = 'puzzle'               // Requires backtracking
}

/**
 * Backtrack mitigation for puzzle strategy
 */
export enum BacktrackMitigation {
  SHORTCUT = 'shortcut',          // Shortcut path back
  TELEPORT = 'teleport',          // Portal to return
  FUNCTION_HINT = 'function_hint', // Hint to use function
  OPTIONAL = 'optional'           // Gate is optional
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Convert Vector2 to string key
 */
export function vectorToKey(v: Vector2): string {
  return `${v.x},${v.y}`;
}

/**
 * Convert string key to Vector2
 */
export function keyToVector(key: string): Vector2 {
  const [x, y] = key.split(',').map(Number);
  return { x, y };
}

/**
 * Rotate direction left
 */
export function rotateLeft(dir: Direction): Direction {
  const order = [Direction.NORTH, Direction.WEST, Direction.SOUTH, Direction.EAST];
  const idx = order.indexOf(dir);
  return order[(idx + 1) % 4];
}

/**
 * Rotate direction right
 */
export function rotateRight(dir: Direction): Direction {
  const order = [Direction.NORTH, Direction.EAST, Direction.SOUTH, Direction.WEST];
  const idx = order.indexOf(dir);
  return order[(idx + 1) % 4];
}

/**
 * Move position in direction
 */
export function moveInDirection(pos: Vector2, dir: Direction): Vector2 {
  const delta = DIRECTION_DELTAS[dir];
  return {
    x: pos.x + delta.x,
    y: pos.y + delta.y
  };
}

/**
 * Calculate Manhattan distance
 */
export function manhattanDistance(a: Vector2, b: Vector2): number {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}
