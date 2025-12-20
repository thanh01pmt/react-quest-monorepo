/**
 * Variable Rate Change Strategy
 * 
 * Teaching Goal: Variable spacing patterns that require variable tracking
 * Pattern: Items with changing gaps [1,2,3] or [3,2,1]
 * Best for: V, S, Zigzag shapes with changing segments
 */

import { IPathInfo, Coord } from '../types';
import { BaseStrategy } from './BaseStrategy';
import { StrategyContext, StrategyResult, DensityMode, PedagogyStrategy } from './types';

export class VariableRateChangeStrategy extends BaseStrategy {
    constructor() {
        super(
            'Variable Rate Change',
            'Teach variable tracking by using changing spacing patterns'
        );
    }

    getDefaultDensityMode(): DensityMode {
        return DensityMode.ZIGZAG;
    }

    isCompatible(topologyType: string): boolean {
        const compatibleTypes = [
            'v_shape', 's_shape', 'z_shape', 'zigzag',
            'simple_path', 'straight_line'
        ];
        return compatibleTypes.includes(topologyType);
    }

    apply(pathInfo: IPathInfo, context: StrategyContext): StrategyResult {
        console.log('[VariableRateChangeStrategy] Applying...');
        
        const objects = [...(context as any).existingObjects || []];
        let itemsPlaced = 0;
        const validationNotes: string[] = [];

        const path = pathInfo.path_coords;
        if (path.length < 5) {
            validationNotes.push('Warning: Path too short for variable rate pattern');
            return this.createResult(objects, 0, validationNotes);
        }

        const asset = this.getAsset(context.assetMap, 'gem');
        if (!asset) {
            validationNotes.push('Error: Could not find gem asset');
            return this.createResult(objects, 0, validationNotes);
        }

        // Choose pattern direction based on difficulty
        // Increasing gap: easier to follow (1,2,3)
        // Decreasing gap: requires more tracking (3,2,1)
        const isIncreasing = context.difficulty !== 'complex';
        const pattern = isIncreasing ? [1, 2, 3, 4] : [4, 3, 2, 1];
        
        validationNotes.push(`Using ${isIncreasing ? 'increasing' : 'decreasing'} gap pattern: [${pattern.join(',')}]`);

        // Apply variable spacing pattern
        let position = 1; // Start after first position (start point)
        let patternIndex = 0;

        while (position < path.length - 1) {
            const pos = path[position];
            if (!this.isOccupied(objects, pos)) {
                objects.push(this.createObject(pos, asset));
                itemsPlaced++;
            }

            // Move by current gap in pattern
            const gap = pattern[patternIndex % pattern.length];
            position += gap;
            patternIndex++;
        }

        console.log(`[VariableRateChangeStrategy] Placed ${itemsPlaced} items with variable gaps`);
        return this.createResult(objects, itemsPlaced, validationNotes);
    }

    private createResult(objects: any[], itemsPlaced: number, notes: string[]): StrategyResult {
        return {
            objects,
            metadata: {
                strategy_applied: PedagogyStrategy.VARIABLE_RATE_CHANGE,
                items_placed: itemsPlaced,
                segments_processed: 1,
                validation_notes: notes
            }
        };
    }
}
