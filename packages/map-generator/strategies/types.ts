/**
 * Strategy Types and Interfaces for Pedagogical Placement
 * Ported from Python: placements/solution_first/pedagogical_strategy_handler.py
 */

import { Coord } from '../types';
import { PlacedObject, BuildableAsset } from '../../../apps/map-builder-app/src/types';

/**
 * All 7 pedagogical strategies from Python implementation
 */
export enum PedagogyStrategy {
    NONE = 'none',
    
    // Basic strategies (already implemented)
    LOOP_LOGIC = 'loop_logic',
    FUNCTION_LOGIC = 'function_logic',
    
    // Advanced strategies (to be implemented)
    CONDITIONAL_BRANCHING = 'conditional_branching',
    WHILE_LOOP_DECREASING = 'while_loop_decreasing',
    VARIABLE_RATE_CHANGE = 'variable_rate_change',
    NESTED_LOOPS = 'nested_loops',
    PATTERN_RECOGNITION = 'pattern_recognition',
    BACKTRACKING = 'backtracking'
}

/**
 * Density distribution modes for item placement
 */
export enum DensityMode {
    UNIFORM = 'uniform',           // Same density everywhere
    DECREASING = 'decreasing',     // High → Low (for while loops)
    INCREASING = 'increasing',     // Low → High
    ZIGZAG = 'zigzag',             // Alternating high-low
    CLUSTERED = 'clustered'        // Groups of items with gaps
}

/**
 * Academic difficulty levels
 */
export type DifficultyCode = 'EASY' | 'MEDIUM' | 'HARD';

/**
 * Bloom's Taxonomy levels
 */
export type BloomLevel = 'REMEMBER' | 'UNDERSTAND' | 'APPLY' | 'ANALYZE' | 'EVALUATE' | 'CREATE';

/**
 * Academic parameters for intelligent generation
 */
export interface AcademicParams {
    difficulty_code: DifficultyCode;
    bloom_level_codes: BloomLevel[];
    core_skill_codes?: ('problem_solving' | 'logical_thinking' | 'pattern_recognition' | 'decomposition')[];
    context_codes?: ('GAME_BASED' | 'REAL_WORLD' | 'ABSTRACT' | 'VISUAL')[];
}

/**
 * Item configuration for placement
 */
export interface ItemConfig {
    type: 'gem' | 'switch' | 'crystal' | 'key' | 'coin';
    count: number;
    placement_hint?: 'start' | 'middle' | 'end' | 'corners' | 'segments' | 'branches';
}

/**
 * Item goals for solution validation
 */
export interface ItemGoals {
    items_to_place: ItemConfig[];
    solution_item_goals?: string; // "gem:5,switch:2,crystal:all"
}

/**
 * Strategy configuration returned by strategy selector
 */
export interface StrategyConfig {
    primary_strategy: PedagogyStrategy;
    density_mode: DensityMode;
    pattern_complexity: 'simple' | 'moderate' | 'complex';
    force_identical_patterns: boolean;
    teaching_goal: string;
    min_diversity?: number;
    recommended_items: string[];
}

/**
 * Context passed to strategy handlers
 */
export interface StrategyContext {
    strategy: PedagogyStrategy;
    difficulty: 'intro' | 'simple' | 'complex';
    densityMode: DensityMode;
    academicParams?: AcademicParams;
    itemGoals?: ItemGoals;
    assetMap: Map<string, BuildableAsset>;
}

/**
 * Result of applying a strategy
 */
export interface StrategyResult {
    objects: PlacedObject[];
    metadata: {
        strategy_applied: PedagogyStrategy;
        items_placed: number;
        segments_processed: number;
        validation_notes: string[];
    };
}

/**
 * Maps logic types to default strategies
 */
export const LOGIC_TYPE_TO_STRATEGY: Record<string, PedagogyStrategy> = {
    'function_logic': PedagogyStrategy.FUNCTION_LOGIC,
    'loop_logic': PedagogyStrategy.LOOP_LOGIC,
    'for_loop_logic': PedagogyStrategy.LOOP_LOGIC,
    'while_loop_logic': PedagogyStrategy.WHILE_LOOP_DECREASING,
    'conditional_logic': PedagogyStrategy.CONDITIONAL_BRANCHING,
    'algorithm_logic': PedagogyStrategy.PATTERN_RECOGNITION,
    'path_searching': PedagogyStrategy.BACKTRACKING
};

/**
 * Maps strategies to recommended density modes
 */
export const STRATEGY_TO_DENSITY: Record<PedagogyStrategy, DensityMode> = {
    [PedagogyStrategy.NONE]: DensityMode.UNIFORM,
    [PedagogyStrategy.LOOP_LOGIC]: DensityMode.UNIFORM,
    [PedagogyStrategy.FUNCTION_LOGIC]: DensityMode.UNIFORM,
    [PedagogyStrategy.CONDITIONAL_BRANCHING]: DensityMode.CLUSTERED,
    [PedagogyStrategy.WHILE_LOOP_DECREASING]: DensityMode.DECREASING,
    [PedagogyStrategy.VARIABLE_RATE_CHANGE]: DensityMode.ZIGZAG,
    [PedagogyStrategy.NESTED_LOOPS]: DensityMode.CLUSTERED,
    [PedagogyStrategy.PATTERN_RECOGNITION]: DensityMode.UNIFORM,
    [PedagogyStrategy.BACKTRACKING]: DensityMode.CLUSTERED
};

/**
 * Maps Bloom levels to pattern complexity
 */
export const BLOOM_TO_COMPLEXITY: Record<BloomLevel, 'simple' | 'moderate' | 'complex'> = {
    'REMEMBER': 'simple',
    'UNDERSTAND': 'simple',
    'APPLY': 'moderate',
    'ANALYZE': 'moderate',
    'EVALUATE': 'complex',
    'CREATE': 'complex'
};
