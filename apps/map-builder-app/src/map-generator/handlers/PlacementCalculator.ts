/**
 * Placement Calculator
 * 
 * Calculates item positions from patterns and segments.
 * Ported from Python: placement_calculator.py
 */

import { Coord } from '../types';
import { Pattern } from './PatternLibrary';
import { ItemPlacement as PedagogicalItemPlacement } from './PedagogicalStrategyHandler';

export interface ItemPlacement {
    type: string;
    pos: Coord;
    pattern_id: string;
    segment_idx: number;
    offset_in_segment: number;
}

interface PatternMatch {
    segmentIdx: number;
    pattern: Pattern;
}

/**
 * Placement Calculator
 * Handles position calculations for pattern-based placement.
 */
export class PlacementCalculator {
    
    /**
     * Calculate placements for all segments based on pattern matches.
     */
    calculateForAllSegments(
        segments: Coord[][],
        patternMatches: PatternMatch[]
    ): ItemPlacement[] {
        const placements: ItemPlacement[] = [];

        for (const match of patternMatches) {
            const segment = segments[match.segmentIdx];
            if (!segment || segment.length === 0) continue;

            const segmentPlacements = this.calculateForSegment(
                segment,
                match.pattern,
                match.segmentIdx
            );
            placements.push(...segmentPlacements);
        }

        return placements;
    }

    /**
     * Calculate placements for a single segment.
     */
    calculateForSegment(
        segment: Coord[],
        pattern: Pattern,
        segmentIdx: number
    ): ItemPlacement[] {
        const placements: ItemPlacement[] = [];
        const segmentLength = segment.length;

        // Scale offsets to fit segment
        const scaleFactor = segmentLength / pattern.min_segment_length;

        for (let i = 0; i < pattern.item_coord_offsets.length; i++) {
            const offset = pattern.item_coord_offsets[i];
            const itemType = pattern.item_types[i % pattern.item_types.length];

            // Calculate actual position in segment
            let scaledOffset = Math.floor(offset * scaleFactor);
            scaledOffset = Math.min(scaledOffset, segmentLength - 1);
            scaledOffset = Math.max(scaledOffset, 0);

            if (scaledOffset < segment.length) {
                placements.push({
                    type: itemType,
                    pos: segment[scaledOffset],
                    pattern_id: pattern.id,
                    segment_idx: segmentIdx,
                    offset_in_segment: scaledOffset
                });
            }
        }

        return placements;
    }

    /**
     * Filter out invalid placements (start, target, off-path).
     */
    filterInvalidPlacements(
        placements: ItemPlacement[],
        startPos: Coord,
        targetPos: Coord,
        pathCoords: Coord[]
    ): ItemPlacement[] {
        const pathSet = new Set(pathCoords.map(c => this.coordToKey(c)));
        const startKey = this.coordToKey(startPos);
        const targetKey = this.coordToKey(targetPos);

        return placements.filter(p => {
            const key = this.coordToKey(p.pos);
            // Not at start or target
            if (key === startKey || key === targetKey) return false;
            // Must be on path
            if (!pathSet.has(key)) return false;
            return true;
        });
    }

    /**
     * Verify placements meet requirements.
     */
    verifyPlacements(
        placements: ItemPlacement[],
        pathCoords: Coord[],
        startPos: Coord,
        targetPos: Coord
    ): { success: boolean; errors: string[] } {
        const errors: string[] = [];

        if (placements.length === 0) {
            errors.push('No placements generated');
        }

        // Check for duplicates
        const posSet = new Set<string>();
        for (const p of placements) {
            const key = this.coordToKey(p.pos);
            if (posSet.has(key)) {
                errors.push(`Duplicate placement at ${key}`);
            }
            posSet.add(key);
        }

        // Minimum items check
        if (placements.length < 3) {
            errors.push(`Too few placements: ${placements.length} (min: 3)`);
        }

        return {
            success: errors.length === 0,
            errors
        };
    }

    /**
     * Convert placements to item dicts for layout.
     */
    toItemDicts(placements: ItemPlacement[]): PedagogicalItemPlacement[] {
        return placements.map(p => ({
            type: p.type,
            pos: p.pos,
            position: [...p.pos],
            pattern_id: p.pattern_id,
            segment_idx: p.segment_idx
        }));
    }

    /**
     * Remove duplicate positions, keeping first occurrence.
     */
    removeDuplicates(placements: ItemPlacement[]): ItemPlacement[] {
        const seen = new Set<string>();
        return placements.filter(p => {
            const key = this.coordToKey(p.pos);
            if (seen.has(key)) return false;
            seen.add(key);
            return true;
        });
    }

    private coordToKey(coord: Coord): string {
        return `${coord[0]},${coord[1]},${coord[2]}`;
    }
}

// Singleton instance
let calculatorInstance: PlacementCalculator | null = null;

export function getPlacementCalculator(): PlacementCalculator {
    if (!calculatorInstance) {
        calculatorInstance = new PlacementCalculator();
    }
    return calculatorInstance;
}
