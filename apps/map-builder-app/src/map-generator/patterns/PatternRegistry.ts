/**
 * Pattern Library - Pedagogically-designed placement patterns
 * Ported from Python: placements/solution_first/patterns.py
 */

import { Coord } from '../types';

/**
 * Pattern definition for item placement
 */
export interface PatternDefinition {
    name: string;
    sequence: string[];  // Item types in sequence, e.g., ['gem', 'gem', 'crystal']
    minLength: number;   // Minimum segment length for this pattern
    logicTypes: string[]; // Compatible logic types
    diversityScore: number; // 1-10, higher = more diverse
    description: string;
}

/**
 * Pattern matching result
 */
export interface PatternMatch {
    pattern: PatternDefinition;
    score: number; // How well it fits (0-1)
    positions: number[]; // Indices in segment where items should go
}

/**
 * Core patterns ported from Python implementation
 */
export const PATTERNS: Record<string, PatternDefinition> = {
    // Simple patterns for loops
    PATTERN_EVERY_STEP: {
        name: 'Every Step',
        sequence: ['gem'],
        minLength: 2,
        logicTypes: ['loop_logic', 'for_loop_logic'],
        diversityScore: 1,
        description: 'Item at every step - teaches simple loops'
    },
    
    PATTERN_ALTERNATING: {
        name: 'Alternating',
        sequence: ['gem', 'crystal'],
        minLength: 4,
        logicTypes: ['loop_logic', 'pattern_recognition'],
        diversityScore: 3,
        description: 'Alternating items - teaches pattern recognition'
    },
    
    PATTERN_EVERY_2: {
        name: 'Every 2 Steps',
        sequence: ['gem', null, 'gem', null] as any,
        minLength: 4,
        logicTypes: ['for_loop_logic', 'loop_logic'],
        diversityScore: 2,
        description: 'Item every 2 steps - teaches loop with step count'
    },
    
    // Function-oriented patterns
    PATTERN_BRANCH_END: {
        name: 'Branch End',
        sequence: ['crystal'],
        minLength: 3,
        logicTypes: ['function_logic'],
        diversityScore: 2,
        description: 'Single item at branch end - encourages function calls'
    },
    
    PATTERN_START_MIDDLE_END: {
        name: 'Start-Middle-End',
        sequence: ['gem', 'switch', 'crystal'],
        minLength: 5,
        logicTypes: ['function_logic', 'algorithm_logic'],
        diversityScore: 5,
        description: 'Items at segment start, middle, and end'
    },
    
    // Advanced patterns
    PATTERN_DECREASING: {
        name: 'Decreasing Density',
        sequence: ['gem', 'gem', 'gem', null, 'gem', 'gem', null, null, 'gem'] as any,
        minLength: 8,
        logicTypes: ['while_loop_logic', 'while_loop_decreasing'],
        diversityScore: 6,
        description: 'Decreasing density - teaches while loops with counter'
    },
    
    PATTERN_VARIABLE_SPACING: {
        name: 'Variable Spacing',
        sequence: ['gem', null, 'gem', null, null, 'gem', null, null, null, 'gem'] as any,
        minLength: 10,
        logicTypes: ['variable_rate_change'],
        diversityScore: 7,
        description: 'Increasing gaps - teaches variable tracking'
    },
    
    PATTERN_CLUSTER_3: {
        name: 'Cluster of 3',
        sequence: ['gem', 'gem', 'gem', null, null, null] as any,
        minLength: 6,
        logicTypes: ['nested_loops', 'backtracking'],
        diversityScore: 4,
        description: 'Clusters of 3 items - teaches nested structures'
    },
    
    PATTERN_CONDITIONAL: {
        name: 'Conditional Branch',
        sequence: ['crystal', 'crystal', 'switch'],
        minLength: 4,
        logicTypes: ['conditional_logic', 'conditional_branching'],
        diversityScore: 5,
        description: 'Crystals leading to switch - teaches conditionals'
    },
    
    PATTERN_DEAD_END: {
        name: 'Dead End Reward',
        sequence: ['gem', 'gem', 'crystal', 'crystal'],
        minLength: 4,
        logicTypes: ['backtracking'],
        diversityScore: 4,
        description: 'Valuable items in dead ends - teaches exploration'
    }
};

/**
 * Pattern Registry - manages pattern selection and application
 */
export class PatternRegistry {
    private patterns: Map<string, PatternDefinition>;
    
    constructor() {
        this.patterns = new Map();
        this.registerDefaultPatterns();
    }
    
    private registerDefaultPatterns(): void {
        Object.entries(PATTERNS).forEach(([key, pattern]) => {
            this.patterns.set(key, pattern);
        });
    }
    
    /**
     * Get a specific pattern by name
     */
    getPattern(name: string): PatternDefinition | undefined {
        return this.patterns.get(name);
    }
    
    /**
     * Get all patterns
     */
    getAllPatterns(): PatternDefinition[] {
        return Array.from(this.patterns.values());
    }
    
    /**
     * Find patterns compatible with given logic type
     */
    getPatternsForLogicType(logicType: string): PatternDefinition[] {
        return this.getAllPatterns().filter(p => 
            p.logicTypes.includes(logicType) || p.logicTypes.includes('*')
        );
    }
    
    /**
     * Suggest best patterns for a segment
     */
    suggestPatterns(
        segmentLength: number,
        logicType: string,
        maxSuggestions: number = 3
    ): PatternMatch[] {
        const compatiblePatterns = this.getPatternsForLogicType(logicType)
            .filter(p => p.minLength <= segmentLength);
        
        // Score each pattern
        const scored = compatiblePatterns.map(pattern => {
            // Score based on:
            // - Length fit (closer to minLength = better)
            // - Diversity score
            const lengthFit = 1 - Math.abs(segmentLength - pattern.minLength * 1.5) / segmentLength;
            const diversityFit = pattern.diversityScore / 10;
            const score = (lengthFit * 0.6) + (diversityFit * 0.4);
            
            // Calculate positions
            const positions = this.calculatePositions(pattern, segmentLength);
            
            return {
                pattern,
                score: Math.max(0, Math.min(1, score)),
                positions
            };
        });
        
        // Sort by score and return top N
        return scored
            .sort((a, b) => b.score - a.score)
            .slice(0, maxSuggestions);
    }
    
    /**
     * Calculate positions for placing pattern items in a segment
     */
    calculatePositions(pattern: PatternDefinition, segmentLength: number): number[] {
        const positions: number[] = [];
        const sequence = pattern.sequence;
        
        // Distribute pattern across segment
        if (sequence.length === 1) {
            // Single item - distribute evenly
            const step = Math.floor(segmentLength / 3) || 1;
            for (let i = step; i < segmentLength; i += step) {
                positions.push(i);
            }
        } else {
            // Multiple items - map sequence to segment positions
            const step = Math.floor(segmentLength / sequence.length);
            sequence.forEach((item, idx) => {
                if (item !== null) {
                    const pos = Math.min(idx * step, segmentLength - 1);
                    if (!positions.includes(pos)) {
                        positions.push(pos);
                    }
                }
            });
        }
        
        return positions;
    }
    
    /**
     * Apply a pattern to create item placements
     */
    applyPattern(
        pattern: PatternDefinition,
        segment: Coord[],
        defaultItem: string = 'gem'
    ): { position: Coord; itemType: string }[] {
        const placements: { position: Coord; itemType: string }[] = [];
        const positions = this.calculatePositions(pattern, segment.length);
        
        positions.forEach((pos, idx) => {
            if (pos < segment.length) {
                const itemType = pattern.sequence[idx % pattern.sequence.length] || defaultItem;
                if (itemType) {
                    placements.push({
                        position: segment[pos],
                        itemType
                    });
                }
            }
        });
        
        return placements;
    }
}

// Singleton
let patternRegistryInstance: PatternRegistry | null = null;

export function getPatternRegistry(): PatternRegistry {
    if (!patternRegistryInstance) {
        patternRegistryInstance = new PatternRegistry();
    }
    return patternRegistryInstance;
}
