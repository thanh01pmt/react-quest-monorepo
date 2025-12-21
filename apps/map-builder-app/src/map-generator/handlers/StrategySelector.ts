/**
 * Semantic Pair - Valid start/end pair with associated metadata
 * Ported from Python: strategy_selector.py
 */

import { Coord } from '../types';

export interface SemanticPairData {
    name: string;
    start: string;
    end: string;
    path_type?: string;
    strategies?: string[];
    difficulty?: string;
    teaching_goal?: string;
}

export class SemanticPair {
    name: string;
    start: string;
    end: string;
    pathType: string;
    strategies: string[];
    difficulty: string;
    teachingGoal: string;

    constructor(
        name: string,
        start: string,
        end: string,
        pathType: string = 'default',
        strategies: string[] = [],
        difficulty: string = 'MEDIUM',
        teachingGoal: string = ''
    ) {
        this.name = name;
        this.start = start;
        this.end = end;
        this.pathType = pathType;
        this.strategies = strategies;
        this.difficulty = difficulty;
        this.teachingGoal = teachingGoal;
    }

    static fromDict(data: SemanticPairData): SemanticPair {
        return new SemanticPair(
            data.name || 'default',
            data.start || '',
            data.end || '',
            data.path_type || 'default',
            data.strategies || [],
            data.difficulty || 'MEDIUM',
            data.teaching_goal || ''
        );
    }
}

/**
 * Strategy Configuration for a topology
 */
export interface StrategyConfigData {
    primary: string;
    secondary?: string[];
    inherits_from?: string[];
    difficulty_patterns?: Record<string, string>;
}

export class StrategyConfig {
    primary: string;
    secondary: string[];
    inheritsFrom: string[];
    difficultyPatterns: Record<string, string>;

    constructor(
        primary: string,
        secondary: string[] = [],
        inheritsFrom: string[] = [],
        difficultyPatterns: Record<string, string> = {}
    ) {
        this.primary = primary;
        this.secondary = secondary;
        this.inheritsFrom = inheritsFrom;
        this.difficultyPatterns = difficultyPatterns;
    }

    static fromDict(data: StrategyConfigData): StrategyConfig {
        return new StrategyConfig(
            data.primary || 'segment_based',
            data.secondary || [],
            data.inherits_from || [],
            data.difficulty_patterns || {}
        );
    }

    static fromString(strategy: string): StrategyConfig {
        return new StrategyConfig(strategy);
    }
}

/**
 * Enhanced Topology Strategies Configuration
 * Ported from Python: strategy_selector.py
 */
export const ENHANCED_TOPOLOGY_STRATEGIES: Record<string, StrategyConfigData> = {
    // Hub-Spoke family
    plus_shape: {
        primary: 'function_reuse',
        secondary: ['l_shape_logic', 'radial_symmetry', 'hub_spoke'],
        inherits_from: ['l_shape'],
        difficulty_patterns: {
            EASY: 'identical_per_branch',
            MEDIUM: 'mostly_identical_with_exception',
            HARD: 'hidden_progressive_pattern'
        }
    },
    star_shape: {
        primary: 'radial_iteration',
        secondary: ['function_reuse', 'hub_spoke'],
        inherits_from: ['plus_shape'],
        difficulty_patterns: {
            EASY: 'identical_per_arm',
            MEDIUM: 'varied_arm_lengths',
            HARD: 'progressive_arm_pattern'
        }
    },
    
    // Branch family
    t_shape: {
        primary: 'conditional_branching',
        secondary: ['function_reuse', 'l_shape_logic'],
        inherits_from: ['l_shape'],
        difficulty_patterns: {
            EASY: 'clear_branch_choice',
            MEDIUM: 'branch_with_decoy',
            HARD: 'multi_path_optimization'
        }
    },
    h_shape: {
        primary: 'function_reuse',
        secondary: ['parallel_bars', 'bridge_crossing'],
        inherits_from: ['straight_line'],
        difficulty_patterns: {
            EASY: 'identical_bars',
            MEDIUM: 'varied_bar_patterns',
            HARD: 'cross_bar_pattern'
        }
    },
    ef_shape: {
        primary: 'function_reuse',
        secondary: ['conditional_branching', 'spine_branch'],
        inherits_from: ['t_shape'],
        difficulty_patterns: {
            EASY: 'identical_per_branch',
            MEDIUM: 'branch_length_variation',
            HARD: 'nested_patterns'
        }
    },
    
    // Corner family
    l_shape: {
        primary: 'segment_pattern_reuse',
        secondary: ['corner_logic', 'alternating_patterns'],
        inherits_from: [],
        difficulty_patterns: {
            EASY: 'identical_segments',
            MEDIUM: 'segment_with_corner_special',
            HARD: 'progressive_segment_pattern'
        }
    },
    u_shape: {
        primary: 'segment_pattern_reuse',
        secondary: ['symmetric_traversal', 'function_reuse'],
        inherits_from: ['l_shape'],
        difficulty_patterns: {
            EASY: 'symmetric_arms',
            MEDIUM: 'arm_variation',
            HARD: 'hidden_symmetry'
        }
    },
    v_shape: {
        primary: 'variable_rate_change',
        secondary: ['convergence_point', 'symmetric_arms'],
        inherits_from: [],
        difficulty_patterns: {
            EASY: 'clear_apex',
            MEDIUM: 'variable_spacing',
            HARD: 'fibonacci_spacing'
        }
    },
    s_shape: {
        primary: 'alternating_patterns',
        secondary: ['segment_pattern_reuse', 'zigzag_logic'],
        inherits_from: ['zigzag'],
        difficulty_patterns: {
            EASY: 'clear_alternation',
            MEDIUM: 'grouped_alternation',
            HARD: 'hidden_alternation'
        }
    },
    
    // Spiral family
    spiral: {
        primary: 'decreasing_loop',
        secondary: ['ring_iteration', 'progressive_spacing'],
        inherits_from: [],
        difficulty_patterns: {
            EASY: 'items_decrease_per_layer',
            MEDIUM: 'items_with_layer_skips',
            HARD: 'non_obvious_decrease'
        }
    },
    spiral_3d: {
        primary: 'decreasing_loop',
        secondary: ['height_variation', 'ring_iteration'],
        inherits_from: ['spiral'],
        difficulty_patterns: {
            EASY: 'per_level_pattern',
            MEDIUM: 'cross_level_pattern',
            HARD: 'spiral_up_pattern'
        }
    },
    
    // Arrow family
    arrow_shape: {
        primary: 'strategic_zones',
        secondary: ['v_shape_convergence', 'parallel_wings'],
        inherits_from: ['v_shape'],
        difficulty_patterns: {
            EASY: 'zone_based_simple',
            MEDIUM: 'wing_symmetry',
            HARD: 'optimization_paths'
        }
    },
    
    // Path family
    straight_line: {
        primary: 'alternating_patterns',
        secondary: ['progressive_spacing', 'segment_based'],
        inherits_from: [],
        difficulty_patterns: {
            EASY: 'regular_spacing',
            MEDIUM: 'grouped_items',
            HARD: 'variable_spacing'
        }
    },
    zigzag: {
        primary: 'segment_pattern_reuse',
        secondary: ['alternating_patterns', 'corner_logic'],
        inherits_from: ['l_shape'],
        difficulty_patterns: {
            EASY: 'identical_segments',
            MEDIUM: 'direction_based',
            HARD: 'progressive_segment'
        }
    },
    
    // Grid family
    grid: {
        primary: 'row_column_iteration',
        secondary: ['alternating_patterns', 'diagonal_patterns'],
        inherits_from: [],
        difficulty_patterns: {
            EASY: 'row_based',
            MEDIUM: 'diagonal_pattern',
            HARD: 'checkerboard_complex'
        }
    },
    plowing_field: {
        primary: 'row_based',
        secondary: ['alternating_rows', 'serpentine'],
        inherits_from: ['grid'],
        difficulty_patterns: {
            EASY: 'row_by_row',
            MEDIUM: 'alternating_direction',
            HARD: 'spiral_plow'
        }
    }
};

/**
 * Strategy Selector - Context-aware strategy selection
 * Ported from Python: strategy_selector.py
 */
export class StrategySelector {
    private strategies: Record<string, StrategyConfigData>;

    constructor() {
        this.strategies = ENHANCED_TOPOLOGY_STRATEGIES;
    }

    getConfig(topologyType: string): StrategyConfig {
        const configData = this.strategies[topologyType];
        
        if (!configData) {
            return new StrategyConfig('segment_based');
        }
        
        return StrategyConfig.fromDict(configData);
    }

    selectStrategy(topologyType: string, params: Record<string, any>): StrategyConfig {
        const config = this.getConfig(topologyType);
        
        // Extract context
        let bloomLevels = params.bloom_level_codes || [];
        if (typeof bloomLevels === 'string') {
            bloomLevels = bloomLevels.split(',').map((b: string) => b.trim());
        }
        
        let contextCodes = params.context_codes || [];
        if (typeof contextCodes === 'string') {
            contextCodes = contextCodes.split(',').map((c: string) => c.trim());
        }
        
        // Check if context suggests a specific secondary strategy
        const preferredStrategy = this.selectByContext(config, bloomLevels, contextCodes);
        
        if (preferredStrategy && config.secondary.includes(preferredStrategy)) {
            console.log(`[StrategySelector] Context-based strategy: ${preferredStrategy} for ${topologyType}`);
            return new StrategyConfig(
                preferredStrategy,
                [config.primary, ...config.secondary.filter(s => s !== preferredStrategy)],
                config.inheritsFrom,
                config.difficultyPatterns
            );
        }
        
        return config;
    }

    private selectByContext(
        config: StrategyConfig,
        bloomLevels: string[],
        contextCodes: string[]
    ): string | null {
        // High-level cognitive tasks may prefer function abstraction
        const highLevelBloom = new Set(['CREATE', 'EVALUATE', 'ANALYZE']);
        if (bloomLevels.some(b => highLevelBloom.has(b.toUpperCase()))) {
            if (config.secondary.includes('function_reuse')) {
                return 'function_reuse';
            }
        }
        
        // Context-based hints
        const contextStrategyMap: Record<string, string> = {
            'OPTIMIZATION': 'strategic_zones',
            'PATTERN_RECOGNITION': 'alternating_patterns',
            'FUNCTION_USAGE': 'function_reuse',
            'LOOP_ITERATION': 'decreasing_loop',
            'CONDITIONAL_LOGIC': 'conditional_branching'
        };
        
        for (const context of contextCodes) {
            const strategy = contextStrategyMap[context.toUpperCase()];
            if (strategy && (config.secondary.includes(strategy) || strategy === config.primary)) {
                return strategy;
            }
        }
        
        return null;
    }

    selectStartEndPair(
        topologyType: string,
        params: Record<string, any>,
        semanticPositions: Record<string, any>
    ): SemanticPair | null {
        const validPairs = semanticPositions.valid_pairs || [];
        
        if (!validPairs.length) {
            // Fallback to legacy format
            const optimalStart = semanticPositions.optimal_start;
            const optimalEnd = semanticPositions.optimal_end;
            
            if (optimalStart && optimalEnd) {
                return new SemanticPair('legacy_default', optimalStart, optimalEnd, 'default', [], 'MEDIUM');
            }
            return null;
        }
        
        // Get difficulty
        const difficulty = (params.difficulty_code || 'MEDIUM').toUpperCase();
        
        // Filter by difficulty
        let matchingPairs = validPairs
            .filter((p: any) => (p.difficulty || 'MEDIUM').toUpperCase() === difficulty)
            .map((p: any) => SemanticPair.fromDict(p));
        
        if (!matchingPairs.length) {
            matchingPairs = validPairs.map((p: any) => SemanticPair.fromDict(p));
        }
        
        // Get strategy to filter further
        const config = this.getConfig(topologyType);
        const strategy = config.primary;
        
        // Filter by compatible strategy
        const strategyMatching = matchingPairs.filter(
            (p: SemanticPair) => !p.strategies.length || p.strategies.includes(strategy)
        );
        
        if (strategyMatching.length) {
            matchingPairs = strategyMatching;
        }
        
        // Select randomly from matching
        if (matchingPairs.length) {
            const selected = matchingPairs[Math.floor(Math.random() * matchingPairs.length)];
            console.log(`[StrategySelector] Selected pair '${selected.name}' for ${topologyType} (difficulty=${difficulty})`);
            return selected;
        }
        
        return null;
    }

    getDifficultyPattern(topologyType: string, difficultyCode: string): string {
        const config = this.getConfig(topologyType);
        const difficulty = (difficultyCode || 'MEDIUM').toUpperCase();
        return config.difficultyPatterns[difficulty] || 'default';
    }

    getAllStrategiesForTopology(topologyType: string): string[] {
        const config = this.getConfig(topologyType);
        const strategies = [config.primary, ...config.secondary];
        
        // Add inherited strategies
        for (const inherited of config.inheritsFrom) {
            const inheritedConfig = this.getConfig(inherited);
            strategies.push(inheritedConfig.primary);
            strategies.push(...inheritedConfig.secondary);
        }
        
        // Deduplicate
        return [...new Set(strategies)];
    }
}

// Singleton instance
let selectorInstance: StrategySelector | null = null;

export function getStrategySelector(): StrategySelector {
    if (!selectorInstance) {
        selectorInstance = new StrategySelector();
    }
    return selectorInstance;
}
