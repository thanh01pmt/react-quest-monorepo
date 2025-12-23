/**
 * Strategy Module - Export all strategy components
 */

// Types
export * from './types';

// Base class
export { BaseStrategy } from './BaseStrategy';

// Strategy implementations
export { FunctionReuseStrategy } from './FunctionReuseStrategy';
export { LoopLogicStrategy } from './LoopLogicStrategy';
export { WhileLoopDecreasingStrategy } from './WhileLoopDecreasingStrategy';
export { ConditionalBranchingStrategy } from './ConditionalBranchingStrategy';
export { VariableRateChangeStrategy } from './VariableRateChangeStrategy';
export { NestedLoopsStrategy } from './NestedLoopsStrategy';
export { PatternRecognitionStrategy } from './PatternRecognitionStrategy';
export { BacktrackingStrategy } from './BacktrackingStrategy';

// Registry
export { StrategyRegistry, getStrategyRegistry } from './StrategyRegistry';
