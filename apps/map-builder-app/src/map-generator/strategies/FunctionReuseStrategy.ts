/**
 * Function Reuse Strategy
 * 
 * Teaching Goal: Procedural abstraction - create a function and call it multiple times
 * Pattern: Identical item placement across all branches
 * Best for: Plus, Star, H, EF shapes with multiple similar branches
 */

import { IPathInfo } from '../types';
import { BaseStrategy } from './BaseStrategy';
import { StrategyContext, StrategyResult, DensityMode, PedagogyStrategy } from './types';

export class FunctionReuseStrategy extends BaseStrategy {
    constructor() {
        super(
            'Function Reuse',
            'Teach procedural abstraction by placing identical patterns across branches'
        );
    }

    getDefaultDensityMode(): DensityMode {
        return DensityMode.UNIFORM;
    }

    isCompatible(topologyType: string): boolean {
        // Best for multi-branch topologies
        const compatibleTypes = [
            'plus_shape', 'star_shape', 'h_shape', 'ef_shape',
            't_shape', 'plus_shape_islands'
        ];
        return compatibleTypes.includes(topologyType);
    }

    apply(pathInfo: IPathInfo, context: StrategyContext): StrategyResult {
        console.log('[FunctionReuseStrategy] Applying...');
        
        const objects = [...(context as any).existingObjects || []];
        let itemsPlaced = 0;
        const validationNotes: string[] = [];

        // Get branches from metadata
        const branches: any[][] = pathInfo.metadata?.branches;
        
        if (!branches || branches.length < 2) {
            validationNotes.push('Warning: Less than 2 branches found, falling back to segment-based placement');
            
            // Fallback: use segments
            const segments = pathInfo.metadata?.segments || this.computeSegments(pathInfo.path_coords);
            if (segments.length >= 2) {
                itemsPlaced = this.applyToSegments(segments, context, objects);
            }
        } else {
            // Apply identical pattern to all branches
            itemsPlaced = this.applyToBranches(branches, context, objects);
            validationNotes.push(`Applied identical pattern to ${branches.length} branches`);
        }

        console.log(`[FunctionReuseStrategy] Placed ${itemsPlaced} items`);

        return {
            objects,
            metadata: {
                strategy_applied: PedagogyStrategy.FUNCTION_LOGIC,
                items_placed: itemsPlaced,
                segments_processed: branches?.length || 0,
                validation_notes: validationNotes
            }
        };
    }

    private applyToBranches(branches: any[][], context: StrategyContext, objects: any[]): number {
        if (branches.length === 0) return 0;

        // Find the minimum branch length
        const minLength = Math.min(...branches.map(b => b.length));
        
        // Generate a pattern based on difficulty
        const pattern = this.generatePattern(minLength, context.difficulty);
        
        console.log(`[FunctionReuseStrategy] Pattern for ${branches.length} branches: [${pattern.join(',')}]`);

        // Apply pattern to all branches
        return this.applyIdenticalPattern(branches, context, objects, pattern, 'crystal');
    }

    private applyToSegments(segments: any[][], context: StrategyContext, objects: any[]): number {
        // Group segments by length
        const segmentsByLen: Record<number, any[][]> = {};
        segments.forEach(seg => {
            const len = seg.length;
            if (!segmentsByLen[len]) segmentsByLen[len] = [];
            segmentsByLen[len].push(seg);
        });

        let total = 0;

        // For each group with multiple segments, apply identical pattern
        Object.entries(segmentsByLen).forEach(([lenStr, segs]) => {
            const len = parseInt(lenStr);
            if (segs.length >= 2 && len >= 2) {
                const pattern = this.generatePattern(len, context.difficulty);
                total += this.applyIdenticalPattern(segs, context, objects, pattern, 'crystal');
            }
        });

        return total;
    }

    private generatePattern(length: number, difficulty: 'intro' | 'simple' | 'complex'): number[] {
        const pattern: number[] = [];
        
        // Complexity affects how many items per segment
        const complexity = difficulty === 'complex' ? 0.6 : 
                          (difficulty === 'simple' ? 0.4 : 0.3);

        // Skip first position (usually center/junction)
        for (let i = 1; i < length; i++) {
            if (Math.random() < complexity) {
                pattern.push(i);
            }
        }

        // Ensure at least 1 item if length allows
        if (pattern.length === 0 && length > 1) {
            pattern.push(Math.floor(length / 2));
        }

        return pattern;
    }

    private computeSegments(pathCoords: any[]): any[][] {
        if (!pathCoords || pathCoords.length === 0) return [];
        
        const segments: any[][] = [];
        let currentSegment = [pathCoords[0]];
        
        if (pathCoords.length > 1) {
            let lastDiff = [
                pathCoords[1][0] - pathCoords[0][0],
                pathCoords[1][2] - pathCoords[0][2]
            ];
            
            for (let i = 1; i < pathCoords.length; i++) {
                const curr = pathCoords[i];
                const prev = pathCoords[i-1];
                const currDiff = [curr[0] - prev[0], curr[2] - prev[2]];

                if (currDiff[0] === lastDiff[0] && currDiff[1] === lastDiff[1]) {
                    currentSegment.push(curr);
                } else {
                    segments.push(currentSegment);
                    currentSegment = [prev, curr];
                    lastDiff = currDiff;
                }
            }
            segments.push(currentSegment);
        } else {
            segments.push(currentSegment);
        }
        
        return segments;
    }
}
