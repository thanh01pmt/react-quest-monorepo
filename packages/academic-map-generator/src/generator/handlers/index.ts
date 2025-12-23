/**
 * Handlers Index
 * 
 * Re-exports all handler modules for easy importing.
 */

// Strategy Selection
export {
    StrategySelector,
    getStrategySelector,
    SemanticPair,
    StrategyConfig,
    ENHANCED_TOPOLOGY_STRATEGIES
} from './StrategySelector';

export type {
    SemanticPairData,
    StrategyConfigData
} from './StrategySelector';

// Semantic Position Handling
export {
    SemanticPositionHandler,
    getSemanticPositionHandler
} from './SemanticPositionHandler';

export type {
    ItemPlacement as SemanticItemPlacement
} from './SemanticPositionHandler';

// Pedagogical Strategy
export {
    PedagogicalStrategyHandler,
    getPedagogicalStrategyHandler
} from './PedagogicalStrategyHandler';

export type {
    ItemPlacement as PedagogicalItemPlacement,
    LayoutResult
} from './PedagogicalStrategyHandler';

// Pattern Complexity
export {
    PatternComplexityModifier,
    getPatternComplexityModifier,
    applyDifficultyToItems
} from './PatternComplexityModifier';

export type {
    ItemPlacement as PatternItemPlacement
} from './PatternComplexityModifier';

// Pattern Library
export {
    PatternLibrary,
    getPatternLibrary,
    FALLBACK_PATTERN
} from './PatternLibrary';

export type {
    Pattern
} from './PatternLibrary';

// Placement Calculator
export {
    PlacementCalculator,
    getPlacementCalculator
} from './PlacementCalculator';

// Symmetric Placer
export {
    SymmetricPlacer,
    getSymmetricPlacer
} from './SymmetricPlacer';

// Fallback Handler
export {
    FallbackHandler,
    getFallbackHandler
} from './FallbackHandler';

// Solution First Placer (Main Orchestrator)
export {
    SolutionFirstPlacer,
    getSolutionFirstPlacer
} from './SolutionFirstPlacer';

export type {
    PlacementResult,
    PlannedSolution
} from './SolutionFirstPlacer';
