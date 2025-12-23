/**
 * Loop Logic Strategy
 * 
 * Teaching Goal: Iteration - use repeat/for loops to collect items
 * Pattern: Regular interval placement (every N steps)
 * Best for: Straight paths, spirals, zigzags with uniform segments
 */

import { IPathInfo } from '../types';
import { BaseStrategy } from './BaseStrategy';
import { StrategyContext, StrategyResult, DensityMode, PedagogyStrategy } from './types';

export class LoopLogicStrategy extends BaseStrategy {
    constructor() {
        super(
            'Loop Logic',
            'Teach iteration by placing items at regular intervals'
        );
    }

    getDefaultDensityMode(): DensityMode {
        return DensityMode.UNIFORM;
    }

    isCompatible(topologyType: string): boolean {
        // Good for linear and repetitive topologies
        const compatibleTypes = [
            'straight_line', 'simple_path', 'spiral', 'zigzag',
            'plowing_field', 'grid', 'square'
        ];
        return compatibleTypes.includes(topologyType);
    }

    apply(pathInfo: IPathInfo, context: StrategyContext): StrategyResult {
        console.log('[LoopLogicStrategy] Applying...');
        
        const objects = [...(context as any).existingObjects || []];
        let itemsPlaced = 0;
        const validationNotes: string[] = [];

        // Get segments from metadata or compute
        let segments: any[][] = pathInfo.metadata?.segments;
        if (!segments) {
            segments = this.computeSegments(pathInfo.path_coords);
        }

        console.log(`[LoopLogicStrategy] Processing ${segments.length} segments`);

        // Determine interval based on difficulty
        const interval = this.getIntervalForDifficulty(context.difficulty);
        validationNotes.push(`Using interval: ${interval} (difficulty: ${context.difficulty})`);

        // Apply to each segment
        segments.forEach((segment, idx) => {
            if (segment.length >= 2) {
                const added = this.placeAtIntervals(segment, context, objects, interval, 'gem');
                itemsPlaced += added;
                console.log(`  Segment ${idx}: length=${segment.length}, items=${added}`);
            }
        });

        console.log(`[LoopLogicStrategy] Total placed: ${itemsPlaced} items`);

        return {
            objects,
            metadata: {
                strategy_applied: PedagogyStrategy.LOOP_LOGIC,
                items_placed: itemsPlaced,
                segments_processed: segments.length,
                validation_notes: validationNotes
            }
        };
    }

    private getIntervalForDifficulty(difficulty: 'intro' | 'simple' | 'complex'): number {
        switch (difficulty) {
            case 'intro':
                return 1; // Item every step (very easy loop)
            case 'simple':
                return 1; // Item every step
            case 'complex':
                return 2; // Item every 2 steps
            default:
                return 1;
        }
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
