/**
 * Loop Structures Layer (L2)
 * 
 * Defines loop structure types that can be combined with micro-patterns (L1).
 * This layer handles: single loops, nested loops, variable counts.
 * 
 * =============================================================================
 * ARCHITECTURE
 * =============================================================================
 * L0: Actions         → moveForward, collectItem, turnLeft...
 * L1: Micro-Patterns  → M_C, M_M_C, L_M_R_C... (atomic sequences)
 * L2: Loop Structures → single, nested, variable count (this file)
 * L3: Templates       → Combines L1 + L2 + metadata
 * =============================================================================
 */

import type { MicroPattern } from './micro-patterns';

// =============================================================================
// TYPES
// =============================================================================

/** Count modes for inner loops */
export type CountMode = 
  | { type: 'fixed'; value: number }
  | { type: 'linear'; base: number; step: number }  // base + step * i
  | { type: 'fibonacci'; terms: number }
  | { type: 'custom'; fn: (iteration: number) => number };

/** Single loop structure: repeat pattern N times */
export interface SingleLoopStructure {
  type: 'single';
  /** Number of iterations */
  count: number;
  /** Pattern to repeat */
  pattern: MicroPattern;
  /** Optional prefix actions before loop */
  prefix?: MicroPattern;
  /** Optional suffix actions after loop */
  suffix?: MicroPattern;
}

/** Nested loop structure: outer loop with inner loop + transition */
export interface NestedLoopStructure {
  type: 'nested';
  /** Outer loop count */
  outerCount: number;
  /** Inner loop count (can be variable) */
  innerCount: CountMode;
  /** Inner pattern (must be nestedLoopCompatible = true) */
  innerPattern: MicroPattern;
  /** Transition pattern between outer iterations */
  transitionPattern: MicroPattern;
  /** Optional prefix before outer loop */
  prefix?: MicroPattern;
  /** Optional suffix after outer loop */
  suffix?: MicroPattern;
}

/** While loop structure: repeat until condition */
export interface WhileLoopStructure {
  type: 'while';
  /** Condition type */
  condition: 'notAtEnd' | 'hasItem' | 'customCount';
  /** Max iterations (safety limit) */
  maxIterations: number;
  /** Pattern to repeat */
  pattern: MicroPattern;
}

export type LoopStructure = SingleLoopStructure | NestedLoopStructure | WhileLoopStructure;

// =============================================================================
// COUNT CALCULATORS
// =============================================================================

/**
 * Calculate inner count for a given iteration
 */
export function calculateCount(mode: CountMode, iteration: number): number {
  switch (mode.type) {
    case 'fixed':
      return mode.value;
    
    case 'linear':
      return mode.base + mode.step * iteration;
    
    case 'fibonacci': {
      // Generate Fibonacci sequence up to iteration
      if (iteration === 0) return 1;
      if (iteration === 1) return 1;
      let a = 1, b = 1;
      for (let i = 2; i <= iteration; i++) {
        const next = a + b;
        a = b;
        b = next;
      }
      return b;
    }
    
    case 'custom':
      return mode.fn(iteration);
  }
}

/**
 * Calculate total actions for a loop structure (for block count estimation)
 */
export function estimateTotalActions(structure: LoopStructure): number {
  const prefixLen = structure.type !== 'while' && structure.prefix?.actionCount || 0;
  const suffixLen = structure.type !== 'while' && structure.suffix?.actionCount || 0;
  
  switch (structure.type) {
    case 'single':
      return prefixLen + (structure.pattern.actionCount * structure.count) + suffixLen;
    
    case 'nested': {
      let total = prefixLen + suffixLen;
      for (let outer = 0; outer < structure.outerCount; outer++) {
        const innerCount = calculateCount(structure.innerCount, outer);
        total += structure.innerPattern.actionCount * innerCount;
        if (outer < structure.outerCount - 1) {
          total += structure.transitionPattern.actionCount;
        }
      }
      return total;
    }
    
    case 'while':
      // Estimate based on max iterations
      return structure.pattern.actionCount * structure.maxIterations;
  }
}

/**
 * Estimate solution blocks based on toolbox preset
 */
export function estimateSolutionBlocks(
  structure: LoopStructure, 
  hasLoopBlocks: boolean,
  hasNestedLoopBlocks: boolean
): number {
  const totalActions = estimateTotalActions(structure);
  
  if (structure.type === 'single') {
    if (hasLoopBlocks) {
      // for (i=0; i<N; i++) { pattern } → 3 + patternLen
      return 3 + structure.pattern.actionCount;
    }
    return totalActions;
  }
  
  if (structure.type === 'nested') {
    if (hasNestedLoopBlocks) {
      // Nested loops available → 6 + inner + transition
      return 6 + structure.innerPattern.actionCount + structure.transitionPattern.actionCount;
    }
    if (hasLoopBlocks) {
      // Only single loop → outer loop + expanded inner
      const innerCount = calculateCount(structure.innerCount, 0); // use first iteration
      return 3 + (structure.innerPattern.actionCount * innerCount) + structure.transitionPattern.actionCount;
    }
    return totalActions;
  }
  
  if (structure.type === 'while') {
    if (hasLoopBlocks) {
      return 3 + structure.pattern.actionCount;
    }
    return totalActions;
  }
  
  return totalActions;
}

// =============================================================================
// STRUCTURE GENERATORS
// =============================================================================

/**
 * Create a simple single loop structure
 */
export function createSingleLoop(
  pattern: MicroPattern, 
  count: number,
  options?: { prefix?: MicroPattern; suffix?: MicroPattern }
): SingleLoopStructure {
  return {
    type: 'single',
    count,
    pattern,
    prefix: options?.prefix,
    suffix: options?.suffix,
  };
}

/**
 * Create a nested loop structure
 */
export function createNestedLoop(
  innerPattern: MicroPattern,
  transitionPattern: MicroPattern,
  outerCount: number,
  innerCount: CountMode,
  options?: { prefix?: MicroPattern; suffix?: MicroPattern }
): NestedLoopStructure {
  if (!innerPattern.nestedLoopCompatible) {
    console.warn(`Inner pattern ${innerPattern.id} has netTurn=${innerPattern.netTurn}, may cause issues in nested loop`);
  }
  
  return {
    type: 'nested',
    outerCount,
    innerCount,
    innerPattern,
    transitionPattern,
    prefix: options?.prefix,
    suffix: options?.suffix,
  };
}

/**
 * Create common count modes
 */
export const CountModes = {
  fixed: (value: number): CountMode => ({ type: 'fixed', value }),
  linear: (base: number, step: number): CountMode => ({ type: 'linear', base, step }),
  fibonacci: (terms: number): CountMode => ({ type: 'fibonacci', terms }),
  triangular: (): CountMode => ({ type: 'linear', base: 1, step: 1 }), // 1, 2, 3, 4...
  doubling: (): CountMode => ({ type: 'custom', fn: (i) => Math.pow(2, i) }), // 1, 2, 4, 8...
};

// =============================================================================
// STRUCTURE PRESETS
// =============================================================================

export type StructurePreset = 
  | 'simple_loop'      // Single loop with fixed count
  | 'square_pattern'   // Nested loop, same inner/outer count
  | 'staircase'        // Nested loop, linear inner count
  | 'fibonacci_spiral' // Nested loop, fibonacci inner count
  | 'zigzag';          // Single loop with alternating transition

/**
 * Get recommended structure for a preset
 */
export function getStructurePreset(preset: StructurePreset): Partial<LoopStructure> {
  switch (preset) {
    case 'simple_loop':
      return { type: 'single' };
    
    case 'square_pattern':
      return { 
        type: 'nested', 
        innerCount: CountModes.fixed(4) 
      };
    
    case 'staircase':
      return { 
        type: 'nested', 
        innerCount: CountModes.triangular() 
      };
    
    case 'fibonacci_spiral':
      return { 
        type: 'nested', 
        innerCount: CountModes.fibonacci(5) 
      };
    
    case 'zigzag':
      return { type: 'single' };
    
    default:
      return { type: 'single' };
  }
}
