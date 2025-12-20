/**
 * Conditional Branching Strategy
 * 
 * Teaching Goal: If/else decision making
 * Pattern: Creates "correct" branch with items, "decoy" branches with fewer/no items
 * Best for: T, F, Y shapes with decision points
 */

import { IPathInfo } from '../types';
import { BaseStrategy } from './BaseStrategy';
import { StrategyContext, StrategyResult, DensityMode, PedagogyStrategy } from './types';

export class ConditionalBranchingStrategy extends BaseStrategy {
    constructor() {
        super(
            'Conditional Branching',
            'Teach if/else by creating goal and decoy branches'
        );
    }

    getDefaultDensityMode(): DensityMode {
        return DensityMode.CLUSTERED;
    }

    isCompatible(topologyType: string): boolean {
        // Best for branching topologies
        const compatibleTypes = [
            't_shape', 'ef_shape', 'plus_shape', 'star_shape',
            'l_shape', 'y_shape'
        ];
        return compatibleTypes.includes(topologyType);
    }

    apply(pathInfo: IPathInfo, context: StrategyContext): StrategyResult {
        console.log('[ConditionalBranchingStrategy] Applying...');
        
        const objects = [...(context as any).existingObjects || []];
        let itemsPlaced = 0;
        const validationNotes: string[] = [];

        // Get branches from metadata
        const branches: any[][] = pathInfo.metadata?.branches;
        
        if (!branches || branches.length < 2) {
            validationNotes.push('Warning: Need at least 2 branches for conditional logic');
            // Fallback to random placement
            return this.fallbackPlacement(pathInfo, context, objects, validationNotes);
        }

        // Identify goal branch (the one leading to target)
        const targetPos = pathInfo.target_pos;
        let goalBranchIndex = -1;
        
        branches.forEach((branch, idx) => {
            if (branch.length > 0) {
                const lastPos = branch[branch.length - 1];
                if (lastPos[0] === targetPos[0] && lastPos[2] === targetPos[2]) {
                    goalBranchIndex = idx;
                }
            }
        });

        if (goalBranchIndex === -1) {
            // Can't determine goal branch, use first one
            goalBranchIndex = 0;
            validationNotes.push('Could not determine goal branch, using first branch');
        }

        const crystalAsset = this.getAsset(context.assetMap, 'crystal');
        const gemAsset = this.getAsset(context.assetMap, 'gem');

        // Place MORE items on goal branch (crystals)
        branches.forEach((branch, idx) => {
            if (idx === goalBranchIndex) {
                // Goal branch: dense crystal placement
                const density = context.difficulty === 'complex' ? 0.8 : 0.6;
                branch.forEach((pos, i) => {
                    if (i > 0 && Math.random() < density && !this.isOccupied(objects, pos)) {
                        if (crystalAsset) {
                            objects.push(this.createObject(pos, crystalAsset));
                            itemsPlaced++;
                        }
                    }
                });
                validationNotes.push(`Goal branch (${idx}): Dense crystal placement`);
            } else {
                // Decoy branches: sparse gem placement (or none)
                const decoyDensity = context.difficulty === 'complex' ? 0.2 : 0.1;
                branch.forEach((pos, i) => {
                    if (i > 0 && Math.random() < decoyDensity && !this.isOccupied(objects, pos)) {
                        if (gemAsset) {
                            objects.push(this.createObject(pos, gemAsset));
                            itemsPlaced++;
                        }
                    }
                });
                validationNotes.push(`Decoy branch (${idx}): Sparse placement`);
            }
        });

        console.log(`[ConditionalBranchingStrategy] Placed ${itemsPlaced} items`);

        return {
            objects,
            metadata: {
                strategy_applied: PedagogyStrategy.CONDITIONAL_BRANCHING,
                items_placed: itemsPlaced,
                segments_processed: branches.length,
                validation_notes: validationNotes
            }
        };
    }

    private fallbackPlacement(
        pathInfo: IPathInfo,
        context: StrategyContext,
        objects: any[],
        validationNotes: string[]
    ): StrategyResult {
        let itemsPlaced = 0;
        const gemAsset = this.getAsset(context.assetMap, 'gem');
        
        if (gemAsset) {
            const path = pathInfo.path_coords;
            for (let i = 1; i < path.length - 1; i++) {
                if (Math.random() < 0.3 && !this.isOccupied(objects, path[i])) {
                    objects.push(this.createObject(path[i], gemAsset));
                    itemsPlaced++;
                }
            }
        }

        validationNotes.push('Fallback: Random placement applied');

        return {
            objects,
            metadata: {
                strategy_applied: PedagogyStrategy.CONDITIONAL_BRANCHING,
                items_placed: itemsPlaced,
                segments_processed: 1,
                validation_notes: validationNotes
            }
        };
    }
}
