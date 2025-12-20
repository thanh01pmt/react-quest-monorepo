/**
 * Backtracking Strategy
 * 
 * Teaching Goal: Exploration and backtracking from dead ends
 * Pattern: Place items in dead-end branches to encourage exploration
 * Best for: Maze topologies with dead ends
 */

import { IPathInfo, Coord } from '../types';
import { BaseStrategy } from './BaseStrategy';
import { StrategyContext, StrategyResult, DensityMode, PedagogyStrategy } from './types';

export class BacktrackingStrategy extends BaseStrategy {
    constructor() {
        super(
            'Backtracking',
            'Teach exploration by placing items in dead-end branches'
        );
    }

    getDefaultDensityMode(): DensityMode {
        return DensityMode.CLUSTERED;
    }

    isCompatible(topologyType: string): boolean {
        const compatibleTypes = [
            'complex_maze_2d', 'ef_shape', 't_shape',
            'plus_shape', 'star_shape', 'grid_with_holes'
        ];
        return compatibleTypes.includes(topologyType);
    }

    apply(pathInfo: IPathInfo, context: StrategyContext): StrategyResult {
        console.log('[BacktrackingStrategy] Applying...');
        
        const objects = [...(context as any).existingObjects || []];
        let itemsPlaced = 0;
        const validationNotes: string[] = [];

        const branches: Coord[][] = pathInfo.metadata?.branches;
        const targetPos = pathInfo.target_pos;

        if (!branches || branches.length < 2) {
            validationNotes.push('Warning: Need branches for backtracking pattern');
            // Fallback: use path segments
            return this.applyToPath(pathInfo, context, objects, validationNotes);
        }

        // Identify goal branch (ends at target) vs dead-end branches
        const deadEndBranches: Coord[][] = [];
        let goalBranch: Coord[] | null = null as Coord[] | null;

        branches.forEach(branch => {
            if (branch.length > 0) {
                const lastPos = branch[branch.length - 1];
                if (lastPos[0] === targetPos[0] && lastPos[2] === targetPos[2]) {
                    goalBranch = branch;
                } else {
                    deadEndBranches.push(branch);
                }
            }
        });

        if (deadEndBranches.length === 0) {
            validationNotes.push('No dead-end branches found, using all branches');
            deadEndBranches.push(...branches.filter(b => b !== goalBranch));
        }

        const gemAsset = this.getAsset(context.assetMap, 'gem');
        const crystalAsset = this.getAsset(context.assetMap, 'crystal');
        if (!gemAsset && !crystalAsset) {
            validationNotes.push('Error: Could not find collectible assets');
            return this.createResult(objects, 0, 0, validationNotes);
        }

        // Place MORE items in dead-end branches (to encourage exploration)
        // Place FEWER items on main path (to not distract)
        
        // Dead ends: dense placement of valuable items
        deadEndBranches.forEach((branch, idx) => {
            const density = context.difficulty === 'complex' ? 0.8 : 0.6;
            branch.forEach((pos, i) => {
                if (i > 0 && Math.random() < density && !this.isOccupied(objects, pos)) {
                    // Alternate items to make dead ends visually distinct
                    const asset = i % 2 === 0 ? (crystalAsset || gemAsset!) : gemAsset!;
                    objects.push(this.createObject(pos, asset));
                    itemsPlaced++;
                }
            });
            validationNotes.push(`Dead-end branch ${idx}: placed items (density: ${density})`);
        });

        // Goal branch: sparse placement
        if (goalBranch && goalBranch.length > 0) {
            const sparseDensity = 0.2;
            const gb = goalBranch as Coord[];
            gb.forEach((pos: Coord, i: number) => {
                if (i > 0 && Math.random() < sparseDensity && !this.isOccupied(objects, pos)) {
                    objects.push(this.createObject(pos, gemAsset!));
                    itemsPlaced++;
                }
            });
            validationNotes.push('Goal branch: sparse placement to encourage exploration');
        }

        console.log(`[BacktrackingStrategy] Placed ${itemsPlaced} items (${deadEndBranches.length} dead ends)`);
        return this.createResult(objects, itemsPlaced, deadEndBranches.length, validationNotes);
    }

    private applyToPath(
        pathInfo: IPathInfo,
        context: StrategyContext,
        objects: any[],
        validationNotes: string[]
    ): StrategyResult {
        let itemsPlaced = 0;
        const gemAsset = this.getAsset(context.assetMap, 'gem');
        
        if (gemAsset) {
            const path = pathInfo.path_coords;
            // Place items with clustered pattern
            for (let i = 1; i < path.length - 1; i++) {
                const density = this.calculateDensity(DensityMode.CLUSTERED, i, path.length);
                if (Math.random() < density && !this.isOccupied(objects, path[i])) {
                    objects.push(this.createObject(path[i], gemAsset));
                    itemsPlaced++;
                }
            }
        }

        validationNotes.push('Fallback: Applied clustered placement to path');
        return this.createResult(objects, itemsPlaced, 0, validationNotes);
    }

    private createResult(objects: any[], itemsPlaced: number, deadEnds: number, notes: string[]): StrategyResult {
        return {
            objects,
            metadata: {
                strategy_applied: PedagogyStrategy.BACKTRACKING,
                items_placed: itemsPlaced,
                segments_processed: deadEnds,
                validation_notes: notes
            }
        };
    }
}
