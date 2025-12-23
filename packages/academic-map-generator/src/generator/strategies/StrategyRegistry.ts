/**
 * Strategy Registry
 * 
 * Central registry for all pedagogical strategies
 * Handles strategy selection, instantiation, and application
 */

import { IPathInfo } from '../types';
import { PlacedObject, BuildableAsset } from '../../shared/app-types';
import { BaseStrategy } from './BaseStrategy';
import { 
    PedagogyStrategy, 
    DensityMode, 
    StrategyContext, 
    StrategyResult,
    StrategyConfig,
    AcademicParams,
    STRATEGY_TO_DENSITY,
    BLOOM_TO_COMPLEXITY
} from './types';

// Import all strategy implementations
import { FunctionReuseStrategy } from './FunctionReuseStrategy';
import { LoopLogicStrategy } from './LoopLogicStrategy';
import { WhileLoopDecreasingStrategy } from './WhileLoopDecreasingStrategy';
import { ConditionalBranchingStrategy } from './ConditionalBranchingStrategy';
import { VariableRateChangeStrategy } from './VariableRateChangeStrategy';
import { NestedLoopsStrategy } from './NestedLoopsStrategy';
import { PatternRecognitionStrategy } from './PatternRecognitionStrategy';
import { BacktrackingStrategy } from './BacktrackingStrategy';

/**
 * Strategy Registry - manages all available strategies
 */
export class StrategyRegistry {
    private strategies: Map<PedagogyStrategy, BaseStrategy>;

    constructor() {
        this.strategies = new Map();
        this.registerDefaultStrategies();
    }

    private registerDefaultStrategies(): void {
        // Core strategies
        this.register(PedagogyStrategy.FUNCTION_LOGIC, new FunctionReuseStrategy());
        this.register(PedagogyStrategy.LOOP_LOGIC, new LoopLogicStrategy());
        this.register(PedagogyStrategy.WHILE_LOOP_DECREASING, new WhileLoopDecreasingStrategy());
        this.register(PedagogyStrategy.CONDITIONAL_BRANCHING, new ConditionalBranchingStrategy());
        
        // Advanced strategies
        this.register(PedagogyStrategy.VARIABLE_RATE_CHANGE, new VariableRateChangeStrategy());
        this.register(PedagogyStrategy.NESTED_LOOPS, new NestedLoopsStrategy());
        this.register(PedagogyStrategy.PATTERN_RECOGNITION, new PatternRecognitionStrategy());
        this.register(PedagogyStrategy.BACKTRACKING, new BacktrackingStrategy());
    }

    register(strategyType: PedagogyStrategy, strategy: BaseStrategy): void {
        this.strategies.set(strategyType, strategy);
    }

    get(strategyType: PedagogyStrategy): BaseStrategy | undefined {
        return this.strategies.get(strategyType);
    }

    has(strategyType: PedagogyStrategy): boolean {
        return this.strategies.has(strategyType);
    }

    getAll(): PedagogyStrategy[] {
        return Array.from(this.strategies.keys());
    }

    /**
     * Select the best strategy based on topology and academic params
     */
    selectStrategy(
        topologyType: string,
        academicParams?: AcademicParams
    ): StrategyConfig {
        // Default configuration
        let primaryStrategy = PedagogyStrategy.LOOP_LOGIC;
        let teachingGoal = 'Basic iteration practice';
        
        // Topology-based selection
        const hubSpokeTypes = ['plus_shape', 'star_shape', 'h_shape', 'ef_shape'];
        const branchingTypes = ['t_shape', 'l_shape', 'y_shape'];
        const spiralTypes = ['spiral', 'spiral_3d', 'staircase'];
        const gridTypes = ['grid', 'plowing_field', 'grid_with_holes'];

        if (hubSpokeTypes.includes(topologyType)) {
            primaryStrategy = PedagogyStrategy.FUNCTION_LOGIC;
            teachingGoal = 'Procedural abstraction - create and reuse functions';
        } else if (branchingTypes.includes(topologyType)) {
            primaryStrategy = PedagogyStrategy.CONDITIONAL_BRANCHING;
            teachingGoal = 'Decision making - if/else branching';
        } else if (spiralTypes.includes(topologyType)) {
            primaryStrategy = PedagogyStrategy.WHILE_LOOP_DECREASING;
            teachingGoal = 'While loops with decrementing counter';
        } else if (gridTypes.includes(topologyType)) {
            primaryStrategy = PedagogyStrategy.LOOP_LOGIC;
            teachingGoal = 'Nested iteration for grid traversal';
        }

        // Determine complexity from Bloom level
        let patternComplexity: 'simple' | 'moderate' | 'complex' = 'moderate';
        if (academicParams?.bloom_level_codes?.length) {
            const highestBloom = academicParams.bloom_level_codes[0];
            patternComplexity = BLOOM_TO_COMPLEXITY[highestBloom] || 'moderate';
        }

        // Get density mode for selected strategy
        const densityMode = STRATEGY_TO_DENSITY[primaryStrategy] || DensityMode.UNIFORM;

        // Should patterns be identical across branches?
        const forceIdenticalPatterns = primaryStrategy === PedagogyStrategy.FUNCTION_LOGIC;

        return {
            primary_strategy: primaryStrategy,
            density_mode: densityMode,
            pattern_complexity: patternComplexity,
            force_identical_patterns: forceIdenticalPatterns,
            teaching_goal: teachingGoal,
            recommended_items: this.getRecommendedItems(primaryStrategy)
        };
    }

    /**
     * Apply a strategy to generate item placements
     */
    applyStrategy(
        strategyType: PedagogyStrategy,
        pathInfo: IPathInfo,
        assetMap: Map<string, BuildableAsset>,
        difficulty: 'intro' | 'simple' | 'complex' = 'simple',
        existingObjects: PlacedObject[] = [],
        academicParams?: AcademicParams
    ): StrategyResult {
        const strategy = this.get(strategyType);
        
        if (!strategy) {
            console.warn(`[StrategyRegistry] Strategy ${strategyType} not found, using LoopLogic`);
            return this.applyStrategy(
                PedagogyStrategy.LOOP_LOGIC, 
                pathInfo, 
                assetMap, 
                difficulty, 
                existingObjects,
                academicParams
            );
        }

        const densityMode = STRATEGY_TO_DENSITY[strategyType] || DensityMode.UNIFORM;

        const context: StrategyContext = {
            strategy: strategyType,
            difficulty,
            densityMode,
            academicParams,
            assetMap,
            // Pass existing objects for strategies to build upon
            ...({ existingObjects } as any)
        };

        console.log(`[StrategyRegistry] Applying ${strategyType} with density=${densityMode}, difficulty=${difficulty}`);

        return strategy.apply(pathInfo, context);
    }

    private getRecommendedItems(strategy: PedagogyStrategy): string[] {
        switch (strategy) {
            case PedagogyStrategy.FUNCTION_LOGIC:
                return ['crystal', 'gem']; // Consistent items across branches
            case PedagogyStrategy.LOOP_LOGIC:
                return ['gem']; // Simple collectibles
            case PedagogyStrategy.WHILE_LOOP_DECREASING:
                return ['gem']; // Decreasing count
            case PedagogyStrategy.CONDITIONAL_BRANCHING:
                return ['crystal', 'gem', 'switch']; // Different items for different branches
            case PedagogyStrategy.VARIABLE_RATE_CHANGE:
                return ['gem']; // Simple items with variable spacing
            case PedagogyStrategy.NESTED_LOOPS:
                return ['gem', 'switch']; // Grid pattern items
            case PedagogyStrategy.PATTERN_RECOGNITION:
                return ['gem', 'crystal']; // Items to recognize patterns
            case PedagogyStrategy.BACKTRACKING:
                return ['crystal', 'gem']; // Valuable items in dead ends
            default:
                return ['gem'];
        }
    }
}

// Singleton instance
let registryInstance: StrategyRegistry | null = null;

export function getStrategyRegistry(): StrategyRegistry {
    if (!registryInstance) {
        registryInstance = new StrategyRegistry();
    }
    return registryInstance;
}
