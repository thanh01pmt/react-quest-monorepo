/**
 * Nested Loops Strategy
 * 
 * Teaching Goal: Nested iteration (loop inside loop)
 * Pattern: Grid-like placement with clusters representing inner loops
 * Best for: Grid, Plowing Field, 2D Maze topologies
 */

import { IPathInfo, Coord } from '../types';
import { BaseStrategy } from './BaseStrategy';
import { StrategyContext, StrategyResult, DensityMode, PedagogyStrategy } from './types';

export class NestedLoopsStrategy extends BaseStrategy {
    constructor() {
        super(
            'Nested Loops',
            'Teach nested iteration by creating grid-like clusters of items'
        );
    }

    getDefaultDensityMode(): DensityMode {
        return DensityMode.CLUSTERED;
    }

    isCompatible(topologyType: string): boolean {
        const compatibleTypes = [
            'grid', 'plowing_field', 'grid_with_holes',
            'complex_maze_2d', 'square'
        ];
        return compatibleTypes.includes(topologyType);
    }

    apply(pathInfo: IPathInfo, context: StrategyContext): StrategyResult {
        console.log('[NestedLoopsStrategy] Applying...');
        
        const objects = [...(context as any).existingObjects || []];
        let itemsPlaced = 0;
        const validationNotes: string[] = [];

        // Get segments from metadata (each segment = one row/column for nested loop)
        let segments: Coord[][] = pathInfo.metadata?.segments;
        if (!segments || segments.length < 2) {
            // Compute segments from path
            segments = this.computeGridSegments(pathInfo.path_coords);
        }

        if (segments.length < 2) {
            validationNotes.push('Warning: Not enough segments for nested loops pattern');
            return this.createResult(objects, 0, validationNotes);
        }

        const asset = this.getAsset(context.assetMap, 'gem');
        const switchAsset = this.getAsset(context.assetMap, 'switch');
        if (!asset) {
            validationNotes.push('Error: Could not find gem asset');
            return this.createResult(objects, 0, validationNotes);
        }

        // For nested loops: 
        // - Outer loop = iterate through segments (rows)
        // - Inner loop = iterate through items in each segment
        
        // Place items in a pattern that suggests nested structure
        // E.g., place at every Nth position in every Mth segment
        const outerInterval = context.difficulty === 'complex' ? 1 : 2;
        const innerInterval = context.difficulty === 'intro' ? 1 : 2;

        segments.forEach((segment, segIdx) => {
            // Outer loop iteration
            if (segIdx % outerInterval === 0) {
                // Inner loop: place items along segment
                for (let i = 0; i < segment.length; i += innerInterval) {
                    const pos = segment[i];
                    if (!this.isOccupied(objects, pos)) {
                        // Alternate between gem and switch to make pattern visible
                        const itemAsset = (segIdx + i) % 3 === 0 && switchAsset ? switchAsset : asset;
                        objects.push(this.createObject(pos, itemAsset));
                        itemsPlaced++;
                    }
                }
            }
        });

        validationNotes.push(`Applied nested loops pattern: ${segments.length} outer iterations, ${innerInterval}-step inner loop`);
        console.log(`[NestedLoopsStrategy] Placed ${itemsPlaced} items in nested pattern`);
        
        return this.createResult(objects, itemsPlaced, validationNotes);
    }

    private computeGridSegments(pathCoords: Coord[]): Coord[][] {
        if (!pathCoords || pathCoords.length === 0) return [];
        
        const segments: Coord[][] = [];
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
        }
        
        return segments;
    }

    private createResult(objects: any[], itemsPlaced: number, notes: string[]): StrategyResult {
        return {
            objects,
            metadata: {
                strategy_applied: PedagogyStrategy.NESTED_LOOPS,
                items_placed: itemsPlaced,
                segments_processed: 0,
                validation_notes: notes
            }
        };
    }
}
