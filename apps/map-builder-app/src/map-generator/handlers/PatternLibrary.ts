/**
 * Pattern Library
 * 
 * Defines placement patterns for segment-based item placement.
 * Ported from Python: pattern_library.py
 * 
 * KEY INSIGHT: Pattern = Encoded Solution
 * - `actions` defines the expected solution sequence
 * - `item_coord_offsets` defines where to place items in segment
 * - Items are placed to produce the expected solution
 */

import { Coord } from '../types';

export interface Pattern {
    id: string;
    /** Action sequence expected when walking this pattern */
    actions: string[];
    /** Positions within segment_coords to place items (0-indexed) */
    item_coord_offsets: number[];
    /** Type of item at each offset position */
    item_types: string[];
    /** Minimum segment length required for this pattern */
    min_segment_length: number;
    /** Number of distinct block types (higher = better for function_logic) */
    diversity_score: number;
    /** Action indices that are turns (for patterns with internal turns) */
    turn_positions?: number[];
    /** Turn type: 'any', 'left', or 'right' */
    turn_type?: 'any' | 'left' | 'right';
    /** Whether pattern needs a corner after segment */
    requires_corner?: boolean;
}

// ============================================================================
// BASIC PATTERNS (2 actions, diversity=2)
// ============================================================================

export const PATTERN_MOVE_COLLECT: Pattern = {
    id: 'move_collect_2',
    actions: ['move', 'collect'],
    item_coord_offsets: [1],
    item_types: ['crystal'],
    min_segment_length: 2,
    diversity_score: 2
};

export const PATTERN_MOVE_TOGGLE: Pattern = {
    id: 'move_toggle_2',
    actions: ['move', 'toggle'],
    item_coord_offsets: [1],
    item_types: ['switch'],
    min_segment_length: 2,
    diversity_score: 2
};

// ============================================================================
// DENSE PATTERNS (nhiều items liên tiếp - for loops với >= 3 iterations)
// ============================================================================

export const PATTERN_MOVE_COLLECT_COLLECT: Pattern = {
    id: 'move_collect_collect_3',
    actions: ['move', 'collect', 'collect'],
    item_coord_offsets: [1, 2],
    item_types: ['crystal', 'crystal'],
    min_segment_length: 3,
    diversity_score: 2
};

export const PATTERN_MOVE_MOVE_COLLECT_COLLECT: Pattern = {
    id: 'move_move_collect_collect_4',
    actions: ['move', 'move', 'collect', 'collect'],
    item_coord_offsets: [2, 3],
    item_types: ['crystal', 'crystal'],
    min_segment_length: 4,
    diversity_score: 2
};

export const PATTERN_MOVE_TOGGLE_TOGGLE: Pattern = {
    id: 'move_toggle_toggle_3',
    actions: ['move', 'toggle', 'toggle'],
    item_coord_offsets: [1, 2],
    item_types: ['switch', 'switch'],
    min_segment_length: 3,
    diversity_score: 2
};

// ============================================================================
// EXTENDED PATTERNS (3+ actions, diversity=3)
// ============================================================================

export const PATTERN_MCT_3: Pattern = {
    id: 'move_collect_toggle_3',
    actions: ['move', 'collect', 'toggle'],
    item_coord_offsets: [1, 2],
    item_types: ['crystal', 'switch'],
    min_segment_length: 3,
    diversity_score: 3
};

export const PATTERN_MCM_3: Pattern = {
    id: 'move_collect_move_3',
    actions: ['move', 'collect', 'move'],
    item_coord_offsets: [1],
    item_types: ['crystal'],
    min_segment_length: 3,
    diversity_score: 2
};

export const PATTERN_MMC_3: Pattern = {
    id: 'move_move_collect_3',
    actions: ['move', 'move', 'collect'],
    item_coord_offsets: [2],
    item_types: ['crystal'],
    min_segment_length: 3,
    diversity_score: 2
};

// ============================================================================
// COMPLEX PATTERNS (4+ actions, high diversity)
// ============================================================================

export const PATTERN_MCMC_4: Pattern = {
    id: 'move_collect_move_collect_4',
    actions: ['move', 'collect', 'move', 'collect'],
    item_coord_offsets: [1, 3],
    item_types: ['crystal', 'crystal'],
    min_segment_length: 4,
    diversity_score: 2
};

export const PATTERN_MCTC_4: Pattern = {
    id: 'move_collect_toggle_collect_4',
    actions: ['move', 'collect', 'toggle', 'collect'],
    item_coord_offsets: [1, 2, 3],
    item_types: ['crystal', 'switch', 'crystal'],
    min_segment_length: 4,
    diversity_score: 3
};

export const PATTERN_MMCCC_5: Pattern = {
    id: 'move_move_collect_collect_collect_5',
    actions: ['move', 'move', 'collect', 'collect', 'collect'],
    item_coord_offsets: [2, 3, 4],
    item_types: ['crystal', 'crystal', 'crystal'],
    min_segment_length: 5,
    diversity_score: 2
};

// ============================================================================
// SPARSE PATTERNS (Low density for large maps)
// ============================================================================

export const PATTERN_MMMC_4: Pattern = {
    id: 'move_move_move_collect_4',
    actions: ['move', 'move', 'move', 'collect'],
    item_coord_offsets: [3],
    item_types: ['crystal'],
    min_segment_length: 4,
    diversity_score: 1
};

// ============================================================================
// WHILE-LOOP PATTERNS (condition-based iteration)
// ============================================================================

export const PATTERN_WHILE_GEM: Pattern = {
    id: 'while_isOnGem_collect_move',
    actions: ['collect', 'move'],
    item_coord_offsets: [0],
    item_types: ['crystal'],
    min_segment_length: 2,
    diversity_score: 2
};

export const PATTERN_WHILE_SWITCH: Pattern = {
    id: 'while_isOnSwitch_toggle_move',
    actions: ['toggle', 'move'],
    item_coord_offsets: [0],
    item_types: ['switch'],
    min_segment_length: 2,
    diversity_score: 2
};

export const PATTERN_WHILE_COLLECT_TURN: Pattern = {
    id: 'while_collect_turn_move',
    actions: ['collect', 'turnRight', 'move'],
    item_coord_offsets: [0],
    item_types: ['crystal'],
    min_segment_length: 3,
    diversity_score: 3,
    turn_positions: [1],
    turn_type: 'right'
};

// ============================================================================
// VARIABLE-BASED PATTERNS (modulo/alternating)
// ============================================================================

export const PATTERN_ALTERNATING_CS: Pattern = {
    id: 'alternating_crystal_switch',
    actions: ['move', 'collect', 'move', 'toggle'],
    item_coord_offsets: [1, 3],
    item_types: ['crystal', 'switch'],
    min_segment_length: 4,
    diversity_score: 4
};

export const PATTERN_PERIODIC_3: Pattern = {
    id: 'periodic_3_cs_empty',
    actions: ['move', 'collect', 'move', 'toggle', 'move'],
    item_coord_offsets: [1, 3],
    item_types: ['crystal', 'switch'],
    min_segment_length: 5,
    diversity_score: 4
};

export const PATTERN_PROGRESSIVE_SPACING: Pattern = {
    id: 'progressive_spacing_1_2_3',
    actions: ['move', 'collect', 'move', 'move', 'collect', 'move', 'move', 'move', 'collect'],
    item_coord_offsets: [1, 4, 8],
    item_types: ['crystal', 'crystal', 'crystal'],
    min_segment_length: 9,
    diversity_score: 3
};

// ============================================================================
// PEDAGOGICAL-SPECIFIC PATTERNS
// ============================================================================

export const PATTERN_FUNCTION_REUSE: Pattern = {
    id: 'function_reuse_hub_spoke',
    actions: ['move', 'collect', 'move', 'toggle', 'collect'],
    item_coord_offsets: [1, 3, 4],
    item_types: ['crystal', 'switch', 'crystal'],
    min_segment_length: 5,
    diversity_score: 4
};

export const PATTERN_CONDITIONAL_BRANCH: Pattern = {
    id: 'conditional_branch_decoy',
    actions: ['move', 'collect', 'collect', 'move'],
    item_coord_offsets: [1, 2],
    item_types: ['crystal', 'crystal'],
    min_segment_length: 4,
    diversity_score: 3
};

export const PATTERN_DECREASING_LOOP: Pattern = {
    id: 'decreasing_loop_spiral',
    actions: ['move', 'collect', 'move', 'collect', 'move'],
    item_coord_offsets: [1, 3],
    item_types: ['crystal', 'crystal'],
    min_segment_length: 5,
    diversity_score: 3
};

export const PATTERN_RADIAL_ITERATION: Pattern = {
    id: 'radial_iteration_star',
    actions: ['move', 'collect', 'move', 'collect', 'collect'],
    item_coord_offsets: [1, 3, 4],
    item_types: ['crystal', 'crystal', 'crystal'],
    min_segment_length: 5,
    diversity_score: 3
};

// ============================================================================
// FALLBACK PATTERN
// ============================================================================

export const FALLBACK_PATTERN: Pattern = {
    id: 'fallback_collect_every_2',
    actions: ['move', 'collect'],
    item_coord_offsets: [1],
    item_types: ['crystal'],
    min_segment_length: 2,
    diversity_score: 2
};

/**
 * Pattern Library
 * Central repository of patterns organized by logic_type.
 * Patterns are ordered by priority: more complex/diverse patterns first.
 */
export class PatternLibrary {
    private patterns: Record<string, Pattern[]>;

    constructor() {
        this.patterns = {
            function_logic: [
                // Prioritize high diversity patterns first
                PATTERN_MCTC_4,       // diversity=3, len=4 (BEST for varied procedures)
                PATTERN_MCT_3,        // diversity=3, len=3
                
                // Pedagogical patterns
                PATTERN_FUNCTION_REUSE,    // For hub-spoke topologies
                PATTERN_ALTERNATING_CS,    // Alternating crystal/switch
                
                // Dense patterns (good for showing repetition)
                PATTERN_MMCCC_5,      // Dense collect, len=5
                PATTERN_MCMC_4,       // Alternating, len=4
                
                // Medium complexity
                PATTERN_MOVE_COLLECT_COLLECT,  // Dense, len=3
                PATTERN_MOVE_MOVE_COLLECT_COLLECT,  // Dense with spacing, len=4
                PATTERN_MOVE_TOGGLE_TOGGLE,    // Dense switches, len=3
                
                // Extended patterns
                PATTERN_MMC_3,        // Spacing pattern
                PATTERN_MCM_3,        // Classic
                
                // Basic patterns (fallback)
                PATTERN_MOVE_COLLECT,
                PATTERN_MOVE_TOGGLE,
                
                // Sparse Patterns for Large Maps (Max Density < 30%)
                PATTERN_MMMC_4,      // Density 0.25 (1/4)
            ],
            loop_logic: [
                // For loops prioritize patterns that create >= 3 iterations
                PATTERN_MMCCC_5,              // 3 items in 5 actions - BEST
                PATTERN_MOVE_COLLECT_COLLECT, // 2 items in 3 actions
                PATTERN_MOVE_MOVE_COLLECT_COLLECT,  // 2 items in 4 actions
                PATTERN_MCMC_4,               // 2 items alternating
                
                // Medium density
                PATTERN_MOVE_COLLECT,  // Classic simple repeat
                PATTERN_MMC_3,         // Spacing
                PATTERN_MCM_3,         // Classic with spacing
            ],
            while_loop_logic: [
                // While loops with condition-aware patterns
                PATTERN_WHILE_GEM,           // isOnGem() - collect/move
                PATTERN_WHILE_SWITCH,        // isOnSwitch() - toggle/move
                PATTERN_WHILE_COLLECT_TURN,  // Complex with turn
                
                // Legacy patterns
                PATTERN_MOVE_COLLECT,
                PATTERN_MOVE_TOGGLE,
                PATTERN_MMC_3,
            ],
            variable_logic: [
                // Variable-based patterns
                PATTERN_ALTERNATING_CS,      // i % 2 alternating
                PATTERN_PERIODIC_3,          // i % 3 periodic
                PATTERN_PROGRESSIVE_SPACING, // Increasing spacing
                
                // Fallback
                PATTERN_MOVE_COLLECT,
            ],
            conditional_logic: [
                // Conditional branching patterns
                PATTERN_CONDITIONAL_BRANCH,
                PATTERN_MCT_3,
                PATTERN_MCTC_4,
                PATTERN_MOVE_COLLECT,
            ],
            sequencing: [
                // Sequences just need basic patterns
                PATTERN_MOVE_COLLECT,
                PATTERN_MOVE_TOGGLE,
                PATTERN_MCM_3,
            ],
            default: [
                PATTERN_MOVE_COLLECT,
                PATTERN_MCM_3,
            ]
        };
    }

    /**
     * Get all patterns for a given logic type.
     */
    getPatterns(logicType: string): Pattern[] {
        return this.patterns[logicType] || this.patterns['default'];
    }

    /**
     * Filter patterns that can fit in the given segment length.
     */
    filterBySegmentLength(patterns: Pattern[], segmentLength: number): Pattern[] {
        return patterns.filter(p => p.min_segment_length <= segmentLength);
    }

    /**
     * Filter patterns based on corner requirements.
     */
    filterByCorner(patterns: Pattern[], hasCornerAfter: boolean): Pattern[] {
        return patterns.filter(p => !p.requires_corner || hasCornerAfter);
    }

    /**
     * Filter patterns by maximum density.
     */
    filterByDensity(patterns: Pattern[], maxDensity: number): Pattern[] {
        return patterns.filter(p => {
            const density = p.item_types.length / p.actions.length;
            return density <= maxDensity;
        });
    }

    /**
     * Select the best pattern for a segment using multi-criteria scoring.
     * Priority:
     * 1. diversity_score (higher = better)
     * 2. fit quality (less remainder = better)
     * 3. pattern length (shorter = more repeats)
     */
    selectBestPattern(validPatterns: Pattern[], segmentLength: number): Pattern {
        if (!validPatterns.length) {
            return FALLBACK_PATTERN;
        }

        const scored = validPatterns.map(pattern => {
            const remainder = segmentLength % pattern.actions.length;
            const numRepeats = Math.floor(segmentLength / pattern.actions.length);
            
            // Score: diversity * 1000 + fit-quality * 10 - length + repeat-bonus
            const score = 
                pattern.diversity_score * 1000 
                - remainder * 10 
                - pattern.actions.length 
                + numRepeats;
            
            return { pattern, score };
        });

        scored.sort((a, b) => b.score - a.score);
        return scored[0].pattern;
    }

    /**
     * Get pattern suitable for a pedagogical strategy.
     */
    getPatternForStrategy(strategy: string): Pattern {
        const strategyPatterns: Record<string, Pattern> = {
            'function_reuse': PATTERN_FUNCTION_REUSE,
            'conditional_branching': PATTERN_CONDITIONAL_BRANCH,
            'variable_rate_change': PATTERN_PROGRESSIVE_SPACING,
            'alternating_patterns': PATTERN_ALTERNATING_CS,
            'decreasing_loop': PATTERN_DECREASING_LOOP,
            'radial_iteration': PATTERN_RADIAL_ITERATION,
        };
        return strategyPatterns[strategy] || PATTERN_MOVE_COLLECT;
    }

    /**
     * Get pattern by ID.
     */
    getPatternById(patternId: string): Pattern | null {
        for (const patterns of Object.values(this.patterns)) {
            const found = patterns.find(p => p.id === patternId);
            if (found) return found;
        }
        return null;
    }
}

// Singleton instance
let libraryInstance: PatternLibrary | null = null;

export function getPatternLibrary(): PatternLibrary {
    if (!libraryInstance) {
        libraryInstance = new PatternLibrary();
    }
    return libraryInstance;
}
