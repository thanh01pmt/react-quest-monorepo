/**
 * While Loop Decreasing Strategy
 * 
 * Teaching Goal: While loops with decrementing counter
 * Pattern: Decreasing density from start to end (3 items → 2 → 1 → finish)
 * Best for: Spiral, converging paths, any path toward goal
 */

import { IPathInfo } from '../types';
import { BaseStrategy } from './BaseStrategy';
import { StrategyContext, StrategyResult, DensityMode, PedagogyStrategy } from './types';

export class WhileLoopDecreasingStrategy extends BaseStrategy {
    constructor() {
        super(
            'While Loop Decreasing',
            'Teach while loops with decreasing counter by using density gradient'
        );
    }

    getDefaultDensityMode(): DensityMode {
        return DensityMode.DECREASING;
    }

    isCompatible(topologyType: string): boolean {
        // Best for converging/spiral paths
        const compatibleTypes = [
            'spiral', 'spiral_3d', 'staircase', 'staircase_3d',
            'straight_line', 'simple_path'
        ];
        return compatibleTypes.includes(topologyType);
    }

    apply(pathInfo: IPathInfo, context: StrategyContext): StrategyResult {
        console.log('[WhileLoopDecreasingStrategy] Applying...');
        
        const objects = [...(context as any).existingObjects || []];
        let itemsPlaced = 0;
        const validationNotes: string[] = [];

        // Use path_coords directly for gradient application
        const path = pathInfo.path_coords;
        
        if (path.length < 3) {
            validationNotes.push('Warning: Path too short for decreasing pattern');
            return {
                objects,
                metadata: {
                    strategy_applied: PedagogyStrategy.WHILE_LOOP_DECREASING,
                    items_placed: 0,
                    segments_processed: 0,
                    validation_notes: validationNotes
                }
            };
        }

        // Apply decreasing density along the entire path
        const asset = this.getAsset(context.assetMap, 'gem');
        if (!asset) {
            validationNotes.push('Error: Could not find gem asset');
            return {
                objects,
                metadata: {
                    strategy_applied: PedagogyStrategy.WHILE_LOOP_DECREASING,
                    items_placed: 0,
                    segments_processed: 0,
                    validation_notes: validationNotes
                }
            };
        }

        // Skip first (start) and last (finish) positions
        for (let i = 1; i < path.length - 1; i++) {
            const pos = path[i];
            const density = this.calculateDensity(DensityMode.DECREASING, i, path.length);
            
            if (Math.random() < density && !this.isOccupied(objects, pos)) {
                objects.push(this.createObject(pos, asset));
                itemsPlaced++;
            }
        }

        validationNotes.push(`Applied decreasing density: high at start, low at end`);
        console.log(`[WhileLoopDecreasingStrategy] Placed ${itemsPlaced} items with decreasing density`);

        return {
            objects,
            metadata: {
                strategy_applied: PedagogyStrategy.WHILE_LOOP_DECREASING,
                items_placed: itemsPlaced,
                segments_processed: 1,
                validation_notes: validationNotes
            }
        };
    }
}
