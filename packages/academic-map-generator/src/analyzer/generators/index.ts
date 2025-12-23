/**
 * Generators Index
 * 
 * Central export for all academic placement generators.
 * Organized by difficulty from easy to hard.
 */

// Common utilities
export * from './common';

// Individual category generators
export { generateSequentialPlacements } from './SequentialGenerators';
export { 
  generateRepeatNPlacements,
  generateRepeatUntilPlacements,
  generateWhilePlacements,
  generateForEachPlacements,
  generateInfiniteLoopPlacements,
  generateNestedLoopPlacements,
  generateAllLoopPlacements
} from './LoopGenerators';

export {
  generateIfSimplePlacements,
  generateIfElsePlacements,
  generateIfElifElsePlacements,
  generateSwitchCasePlacements,
  generateNestedIfPlacements,
  generateAllConditionalPlacements
} from './ConditionalGenerators';

export {
  generateProcedureSimplePlacements,
  generateProcedureWithParamPlacements,
  generateFunctionReturnPlacements,
  generateFunctionComposePlacements,
  generateRecursionPlacements,
  generateAllFunctionPlacements
} from './FunctionGenerators';

export {
  generateCounterPlacements,
  generateStateTogglePlacements,
  generateAccumulatorPlacements,
  generateCollectionPlacements,
  generateFlagPlacements,
  generateAllVariablePlacements
} from './VariableGenerators';

export {
  generateRepeatNCounterPlacements,
  generateWhileCounterPlacements,
  generateRepeatUntilStatePlacements,
  generateForEachAccumulatorPlacements,
  generateLoopIfInsidePlacements,
  generateIfLoopInsidePlacements,
  generateLoopBreakPlacements,
  generateFunctionLoopInsidePlacements,
  generateLoopFunctionCallPlacements,
  generateFunctionIfInsidePlacements,
  generateConditionalFunctionCallPlacements,
  generateLoopIfFunctionPlacements,
  generateFunctionLoopIfPlacements,
  generateAllCombinationPlacements
} from './CombinationGenerators';

// Re-export types
export type {
  AcademicConcept,
  ItemType,
  ItemPlacement,
  AcademicPlacement
} from './common';

import type { PlacementContext, AcademicPlacement } from './common';
import { generateSequentialPlacements } from './SequentialGenerators';
import { generateAllLoopPlacements } from './LoopGenerators';
import { generateAllConditionalPlacements } from './ConditionalGenerators';
import { generateAllFunctionPlacements } from './FunctionGenerators';
import { generateAllVariablePlacements } from './VariableGenerators';
import { generateAllCombinationPlacements } from './CombinationGenerators';

/**
 * Generate ALL placements from all categories
 * Sorted by difficulty
 */
export function generateAllPlacements(context: PlacementContext): AcademicPlacement[] {
  const allPlacements = [
    ...generateSequentialPlacements(context),
    ...generateAllLoopPlacements(context),
    ...generateAllConditionalPlacements(context),
    ...generateAllVariablePlacements(context),
    ...generateAllFunctionPlacements(context),
    ...generateAllCombinationPlacements(context)
  ];
  
  // Sort by difficulty
  return allPlacements.sort((a, b) => a.difficulty - b.difficulty);
}

/**
 * Coverage statistics
 */
export const GENERATOR_COVERAGE = {
  // Category: [implemented, total]
  sequential: { implemented: 1, total: 1 },
  loop: { implemented: 6, total: 6 },
  conditional: { implemented: 5, total: 5 },
  function: { implemented: 5, total: 5 },
  variable: { implemented: 5, total: 5 },
  combination: { implemented: 15, total: 17 },
  
  // Totals
  get totalImplemented() {
    return this.sequential.implemented + 
           this.loop.implemented + 
           this.conditional.implemented + 
           this.function.implemented + 
           this.variable.implemented + 
           this.combination.implemented;
  },
  
  get totalConcepts() {
    return this.sequential.total + 
           this.loop.total + 
           this.conditional.total + 
           this.function.total + 
           this.variable.total + 
           this.combination.total;
  },
  
  get percentage() {
    return Math.round((this.totalImplemented / this.totalConcepts) * 100);
  }
};

export default generateAllPlacements;
