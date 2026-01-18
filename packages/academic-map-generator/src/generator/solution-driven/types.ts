/**
 * Solution-Driven Generator Types
 * 
 * Type definitions for the solution-driven map generation approach.
 */

import { Coord as CoreCoord, Item, PathInfo, GameConfig, Block, Vector3Object } from '../../core';
import { AcademicConcept } from '../../analyzer';

// Re-export Coord for use in this module
export type Coord = CoreCoord;

// ============================================================================
// GRADE LEVELS
// ============================================================================

export type GradeLevel = 'K-2' | '3-5' | '6-8' | '9-12';

// ============================================================================
// TEMPLATE TYPES
// ============================================================================

/**
 * Parameter configuration for template variables
 */
export interface ParameterConfig {
  name: string; // Added name for array usage
  type: 'int' | 'float' | 'boolean';
  min?: number;
  max?: number;
  default?: number;
  step?: number;
  description?: string;
  minRef?: string;
  maxRef?: string;
}

/**
 * Code template for solution-driven generation
 */
export interface CodeTemplate {
  /** Unique identifier */
  id: string;
  
  /** Template code with $PARAM placeholders */
  code: string;
  
  /** Parameter definitions */
  parameters: ParameterConfig[];
  
  /** Primary concept this template teaches */
  concept: AcademicConcept;
  
  /** Target grade level */
  gradeLevel: GradeLevel;
  
  /** Optional constraints */
  constraints?: GenerationConstraints;
  
  /** Optional metadata */
  meta?: TemplateMeta;
}

export type TemplateConfig = CodeTemplate;

/**
 * Template metadata for display
 */
export interface TemplateMeta {
  name?: string;
  topic?: string;
  titleVi?: string;
  titleEn?: string;
  descVi?: string;
  descEn?: string;
  /** Tags for toolbox preset selection (e.g., 'moveForward', 'turnLeft', 'jump', 'loop') */
  tags?: string[];
}

/**
 * Generation constraints
 */
export interface GenerationConstraints {
  maxPathLength?: number;
  maxItems?: number;
  maxIterations?: number;
  noiseLevel?: 'none' | 'low' | 'medium' | 'high';
}

// ============================================================================
// EXECUTION TYPES
// ============================================================================

/**
 * Direction values (matching game format)
 */
export type Direction = 0 | 1 | 2 | 3;

export const DIRECTION_NAMES: Record<Direction, string> = {
  0: 'South',
  1: 'East', 
  2: 'North',
  3: 'West'
};

export const DIRECTION_DELTAS: Record<Direction, { x: number; z: number }> = {
  0: { x: 0, z: -1 },  // South (-Z)
  1: { x: 1, z: 0 },   // East (+X)
  2: { x: 0, z: 1 },   // North (+Z)
  3: { x: -1, z: 0 }   // West (-X)
};

/**
 * Execution context during template interpretation
 */
export interface ExecutionContext {
  /** Current position [x, y, z] */
  position: Coord;
  
  /** Current facing direction */
  direction: Direction;
  
  /** Variable values (loop counters, etc.) */
  variables: Map<string, number>;
  
  /** Loop stack for nested loops */
  loopStack: LoopFrame[];
  
  /** Collected items count */
  inventory: {
    crystals: number;
    keys: number;
  };
}

/**
 * Loop frame for tracking nested loops
 */
export interface LoopFrame {
  variable: string;
  currentValue: number;
  maxValue: number;
  bodyStartPosition: Coord;
  bodyStartDirection: Direction;
}

/**
 * Single action during execution
 */
export interface ExecutionAction {
  type: 'move' | 'jump' | 'turn_left' | 'turn_right' | 'collect' | 'interact';
  position: Coord;
  direction: Direction;
  item?: string;
}

/**
 * Complete execution trace
 */
export interface ExecutionTrace {
  /** All positions visited (path) - UNIQUE coordinates only */
  pathCoords: Coord[];
  
  /** Full sequential movement path (may contain duplicates for patterns that revisit tiles) */
  movementSequence: Coord[];
  
  /** Items placed with their positions */
  items: Array<{ type: string; position: Coord }>;
  
  /** Sequence of actions taken */
  actions: ExecutionAction[];
  
  /** Starting state */
  startPosition: Coord;
  startDirection: Direction;
  
  /** Ending state */
  endPosition: Coord;
  endDirection: Direction;
  
  /** Stats */
  totalMoves: number;
  totalCollects: number;
  loopIterations: number;
  
  /** Post-processor configurations for deferred execution */
  postProcessConfigs?: import('./post-processor').PostProcessorConfig[];
}

// ============================================================================
// AST TYPES
// ============================================================================

export type ASTNode =
  | BlockNode
  | ForLoopNode
  | FunctionCallNode
  | IfStatementNode
  | WhileLoopNode
  | FunctionDefNode
  | VariableDeclNode
  | AssignmentNode;

export interface BlockNode {
  type: 'Block';
  statements: ASTNode[];
}

export interface ForLoopNode {
  type: 'ForLoop';
  variable: string;
  start: any; // Expression
  end: any;   // Expression
  body: BlockNode;
}

export interface FunctionCallNode {
  type: 'FunctionCall';
  name: string;
  arguments: any[];
}

export interface IfStatementNode {
  type: 'IfStatement';
  condition: any; // ConditionNode | Expression
  thenBranch: BlockNode;
  elseBranch?: BlockNode;
}

export interface WhileLoopNode {
  type: 'WhileLoop';
  condition: any; // ConditionNode | Expression
  body: BlockNode;
}

export interface FunctionDefNode {
  type: 'FunctionDef';
  name: string;
  parameters: string[];
  body: BlockNode;
}

export interface VariableDeclNode {
  type: 'VariableDecl';
  name: string;
  value: any; // Expression
}

export interface AssignmentNode {
  type: 'Assignment';
  name: string;
  value: any; // Expression
}

export interface ConditionNode {
  type: 'Condition';
  conditionType: ConditionType;
  negated?: boolean;
  /** Argument for functions like isItemPresent('crystal') */
  argument?: string;
}

export type ConditionType = 
  // Legacy (deprecated, kept for backward compatibility)
  | 'isOnCrystal'
  | 'isOnSwitch'
  | 'hasKey'
  // Standard Blockly API
  | 'isItemPresent'   // isItemPresent('crystal'|'switch'|'key'|'any')
  | 'isSwitchState'   // isSwitchState('on'|'off') 
  | 'isPathForward'   // isPathForward()
  | 'isPathLeft'      // isPathLeft()
  | 'isPathRight'     // isPathRight()
  | 'notDone';        // notDone() / atFinish()

// ============================================================================
// OUTPUT TYPES
// ============================================================================

/**
 * Block action for structured solution
 */
export interface BlockAction {
  type: string;
  direction?: 'turnLeft' | 'turnRight';
  times?: number;
  do?: BlockAction[];
  else?: BlockAction[];  // For if-else blocks
  mutation?: { name: string };
  name?: string;  // For procedure calls (procedures_callnoreturn)
}

/**
 * Structured solution with procedures
 */
export interface StructuredSolution {
  main: BlockAction[];
  procedures: Record<string, BlockAction[]>;
}

/**
 * Solution configuration
 */
export interface SolutionConfig {
  type: 'reach_target';
  itemGoals: Record<string, number>;
  optimalBlocks: number;
  optimalLines: number;
  rawActions: string[];
  structuredSolution: StructuredSolution;
  basicSolution: StructuredSolution;
}

/**
 * Complete result from solution-driven generation
 */
export interface SolutionDrivenResult {
  /** Generated path info */
  pathInfo: PathInfo;
  
  /** Placed items */
  items: Item[];
  
  /** Execution trace for debugging */
  trace: ExecutionTrace;
  
  /** Solution configuration */
  solution: SolutionConfig;
  
  /** Full game config (ready to use) */
  gameConfig: GeneratedGameConfig;
  
  /** Generation metadata */
  metadata: GenerationMetadata;
}

/**
 * Generated game configuration (full JSON format)
 */
export interface GeneratedGameConfig {
  id: string;
  gameType: 'maze';
  topic: string;
  level: number;
  titleKey: string;
  questTitleKey: string;
  descriptionKey: string;
  translations: {
    vi: Record<string, string>;
    en: Record<string, string>;
  };
  supportedEditors: ('blockly' | 'monaco')[];
  blocklyConfig: {
    toolbox: any;
    maxBlocks?: number;
    startBlocks?: string;
  };
  gameConfig: {
    type: 'maze';
    renderer: '3d';
    blocks: Block[];
    players: Array<{
      id: string;
      start: Vector3Object & { direction: number };
    }>;
    collectibles: Array<{
      id: string;
      type: string;
      position: Vector3Object;
    }>;
    interactibles: Array<{
      id: string;
      type: string;
      position: Vector3Object;
    }>;
    fogZones?: Array<{
      position: Vector3Object;
      scale: Vector3Object;
      color: string;
      density: number;
      opacity: number;
      noiseSpeed: number;
    }>;
    finish: Vector3Object;
  };
  solution: SolutionConfig;
  sounds: {
    win: string;
    fail: string;
  };
}

/**
 * Generation metadata
 */
export interface GenerationMetadata {
  templateId: string;
  concept: AcademicConcept;
  gradeLevel: GradeLevel;
  seed: string;
  generatedAt: string;
  resolvedParams: Record<string, number>;
  complexity: number;
  pathLength: number;
  itemCount: number;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Turn right (clockwise)
 */
export function turnRight(dir: Direction): Direction {
  return ((dir + 1) % 4) as Direction;
}

/**
 * Turn left (counter-clockwise)
 */
export function turnLeft(dir: Direction): Direction {
  return ((dir + 3) % 4) as Direction;
}

/**
 * Move forward in current direction
 */
export function moveForward(pos: Coord, dir: Direction): Coord {
  const delta = DIRECTION_DELTAS[dir];
  return [pos[0] + delta.x, pos[1], pos[2] + delta.z];
}

/**
 * Convert Coord to key string
 */
export function coordToKey(coord: Coord): string {
  return `${coord[0]},${coord[1]},${coord[2]}`;
}

/**
 * Convert Coord to Vector3Object
 */
export function coordToVector3(coord: Coord): Vector3Object {
  return { x: coord[0], y: coord[1], z: coord[2] };
}

/**
 * Create initial execution context
 */
export function createInitialContext(
  startPos: Coord = [0, 1, 0],
  startDir: Direction = 1  // Default to West (+X) per COORDINATE_SYSTEM.md
): ExecutionContext {
  return {
    position: [...startPos] as Coord,
    direction: startDir,
    variables: new Map(),
    loopStack: [],
    inventory: { crystals: 0, keys: 0 }
  };
}
