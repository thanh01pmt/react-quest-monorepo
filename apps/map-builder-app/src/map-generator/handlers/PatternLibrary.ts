/**
 * Pattern Library
 * 
 * Defines placement patterns for segment-based item placement.
 * Ported from Python: pattern_library.py
 */

import { Coord } from '../types';

export interface Pattern {
    id: string;
    length: number;
    item_types: string[];
    offsets: number[];  // Positions within segment
    has_corner?: boolean;
    density?: number;
}

/**
 * Fallback pattern for when no match found
 */
export const FALLBACK_PATTERN: Pattern = {
    id: 'fallback_sparse',
    length: 3,
    item_types: ['crystal'],
    offsets: [1],
    density: 0.33
};

/**
 * Pattern Library
 * Contains predefined patterns for different logic types.
 */
export class PatternLibrary {
    private patterns: Record<string, Pattern[]>;

    constructor() {
        this.patterns = {
            function_logic: [
                // Identical patterns for PROCEDURE reuse
                { id: 'func_dense_3', length: 3, item_types: ['crystal', 'crystal'], offsets: [1, 2], density: 0.67 },
                { id: 'func_dense_4', length: 4, item_types: ['crystal', 'switch'], offsets: [1, 2], density: 0.50 },
                { id: 'func_dense_5', length: 5, item_types: ['crystal', 'crystal', 'switch'], offsets: [1, 2, 3], density: 0.60 },
                { id: 'func_standard_5', length: 5, item_types: ['crystal', 'switch'], offsets: [1, 3], density: 0.40 },
                { id: 'func_dense_6', length: 6, item_types: ['crystal', 'crystal', 'switch'], offsets: [1, 3, 5], density: 0.50 },
                { id: 'func_standard_7', length: 7, item_types: ['crystal', 'switch', 'crystal'], offsets: [1, 3, 5], density: 0.43 },
            ],
            loop_logic: [
                // Regular spacing for counting loops
                { id: 'loop_every2_4', length: 4, item_types: ['crystal', 'crystal'], offsets: [1, 3], density: 0.50 },
                { id: 'loop_every2_6', length: 6, item_types: ['crystal', 'crystal', 'crystal'], offsets: [1, 3, 5], density: 0.50 },
                { id: 'loop_every3_6', length: 6, item_types: ['crystal', 'crystal'], offsets: [2, 5], density: 0.33 },
                { id: 'loop_every3_9', length: 9, item_types: ['crystal', 'crystal', 'crystal'], offsets: [2, 5, 8], density: 0.33 },
            ],
            conditional_logic: [
                // Patterns with decision points
                { id: 'cond_branch_4', length: 4, item_types: ['switch', 'crystal'], offsets: [1, 2], density: 0.50 },
                { id: 'cond_branch_5', length: 5, item_types: ['switch', 'crystal', 'gem'], offsets: [1, 2, 4], density: 0.60 },
            ],
            default: [
                { id: 'default_sparse_3', length: 3, item_types: ['crystal'], offsets: [1], density: 0.33 },
                { id: 'default_sparse_4', length: 4, item_types: ['crystal', 'crystal'], offsets: [1, 2], density: 0.50 },
                { id: 'default_sparse_5', length: 5, item_types: ['crystal', 'switch'], offsets: [1, 3], density: 0.40 },
            ]
        };
    }

    /**
     * Get patterns for a specific logic type.
     */
    getPatterns(logicType: string): Pattern[] {
        return this.patterns[logicType] || this.patterns['default'];
    }

    /**
     * Filter patterns by minimum segment length.
     */
    filterBySegmentLength(patterns: Pattern[], segmentLength: number): Pattern[] {
        return patterns.filter(p => p.length <= segmentLength);
    }

    /**
     * Filter patterns based on corner presence.
     */
    filterByCorner(patterns: Pattern[], hasCorner: boolean): Pattern[] {
        if (hasCorner) {
            // Prefer patterns that don't place items right at corners
            return patterns.filter(p => {
                const lastOffset = Math.max(...p.offsets);
                return lastOffset < p.length - 1;
            });
        }
        return patterns;
    }

    /**
     * Filter patterns by maximum density.
     */
    filterByDensity(patterns: Pattern[], maxDensity: number): Pattern[] {
        return patterns.filter(p => (p.density || p.item_types.length / p.length) <= maxDensity);
    }

    /**
     * Select best pattern for a segment.
     */
    selectBestPattern(patterns: Pattern[], segmentLength: number): Pattern | null {
        if (!patterns.length) return FALLBACK_PATTERN;

        // Score patterns: prefer those that match segment length closely
        const scored = patterns.map(p => ({
            pattern: p,
            score: 1.0 - Math.abs(p.length - segmentLength) / segmentLength
        }));

        scored.sort((a, b) => b.score - a.score);
        return scored[0]?.pattern || FALLBACK_PATTERN;
    }

    /**
     * Add custom pattern.
     */
    addPattern(logicType: string, pattern: Pattern): void {
        if (!this.patterns[logicType]) {
            this.patterns[logicType] = [];
        }
        this.patterns[logicType].push(pattern);
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
