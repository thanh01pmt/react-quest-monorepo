/**
 * Symmetric Placer
 * 
 * Handles symmetric placement for hub-spoke and island-based topologies.
 * Ported from Python: symmetric_placer.py
 */

import { IPathInfo, Coord } from '../types';
import { ItemPlacement as PedagogicalItemPlacement, LayoutResult } from './PedagogicalStrategyHandler';

type BuildLayoutFn = (
    pathInfo: IPathInfo, 
    items: PedagogicalItemPlacement[], 
    logicType: string
) => LayoutResult;

/**
 * Symmetric Placer
 * Implements symmetric placement strategies for hub-spoke and island topologies.
 */
export class SymmetricPlacer {
    
    /**
     * Check if topology is hub-spoke type.
     */
    isHubSpoke(metadata: Record<string, any>): boolean {
        const topologyType = metadata.topology_type || '';
        const hubTypes = ['plus_shape', 'star_shape', 'plus_shape_islands'];
        return hubTypes.includes(topologyType) && metadata.branches && metadata.branches.length >= 3;
    }

    /**
     * Check if topology is island array type.
     */
    isIslandArray(metadata: Record<string, any>): boolean {
        const topologyType = metadata.topology_type || '';
        const islandTypes = ['symmetrical_islands', 'stepped_island_clusters', 'hub_with_stepped_islands'];
        return islandTypes.includes(topologyType) && metadata.islands && metadata.islands.length >= 2;
    }

    /**
     * Apply symmetric hub-spoke placement.
     * Places identical patterns on each branch emanating from center.
     */
    symmetricHubSpokePlacement(
        pathInfo: IPathInfo,
        params: Record<string, any>,
        buildLayoutFn: BuildLayoutFn
    ): LayoutResult | null {
        const metadata = pathInfo.metadata || {};
        const branches = metadata.branches || [];
        const center = metadata.center;
        const logicType = params.logic_type || 'function_logic';

        if (branches.length < 3 || !center) {
            return null;
        }

        const items: PedagogicalItemPlacement[] = [];
        const used = new Set<string>();
        used.add(this.coordToKey(pathInfo.start_pos));
        used.add(this.coordToKey(pathInfo.target_pos));
        used.add(this.coordToKey(center));

        // Find minimum branch length (excluding center)
        const branchLengths = branches.map((b: Coord[]) => b.length - 1); // -1 for center
        const minBranchLen = Math.min(...branchLengths.filter((l: number) => l > 0));
        
        // Pattern: place items at same relative positions on each branch
        const itemsPerBranch = Math.min(2, Math.max(1, Math.floor(minBranchLen / 2)));
        const itemTypes = this.getItemTypes(params);

        for (let branchIdx = 0; branchIdx < branches.length; branchIdx++) {
            const branch = branches[branchIdx];
            if (!branch || branch.length <= 1) continue;

            for (let itemIdx = 0; itemIdx < itemsPerBranch; itemIdx++) {
                // Skip center (index 0), start from 1
                const posIdx = itemIdx + 1;
                if (posIdx >= branch.length) continue;

                const pos = branch[posIdx];
                const key = this.coordToKey(pos);
                if (used.has(key)) continue;

                const itemType = itemTypes[itemIdx % itemTypes.length];
                items.push({
                    type: itemType,
                    pos: pos,
                    position: [...pos],
                    pattern_id: `hub_spoke_${branchIdx}_${itemIdx}`,
                    segment_idx: branchIdx,
                    identical_pattern: true
                });
                used.add(key);
            }
        }

        if (items.length < 3) {
            return null;
        }

        console.log(`[SymmetricPlacer] Hub-spoke: ${items.length} items across ${branches.length} branches`);
        return buildLayoutFn(pathInfo, items, logicType);
    }

    /**
     * Apply symmetric island placement.
     * Places identical patterns on each island.
     */
    symmetricIslandPlacement(
        pathInfo: IPathInfo,
        params: Record<string, any>,
        buildLayoutFn: BuildLayoutFn
    ): LayoutResult | null {
        const metadata = pathInfo.metadata || {};
        const islands = metadata.islands || [];
        const logicType = params.logic_type || 'function_logic';

        if (islands.length < 2) {
            return null;
        }

        const items: PedagogicalItemPlacement[] = [];
        const used = new Set<string>();
        used.add(this.coordToKey(pathInfo.start_pos));
        used.add(this.coordToKey(pathInfo.target_pos));

        // Find minimum island size
        const islandSizes = islands.map((island: Coord[]) => island.length);
        const minSize = Math.min(...islandSizes.filter((s: number) => s > 0));
        
        // Pattern: place items at same relative positions on each island
        const itemsPerIsland = Math.min(2, Math.max(1, Math.floor(minSize / 3)));
        const itemTypes = this.getItemTypes(params);

        for (let islandIdx = 0; islandIdx < islands.length; islandIdx++) {
            const island = islands[islandIdx];
            if (!island || island.length < 2) continue;

            for (let itemIdx = 0; itemIdx < itemsPerIsland; itemIdx++) {
                const posIdx = (itemIdx + 1) * 2;
                if (posIdx >= island.length) continue;

                const pos = island[posIdx];
                const key = this.coordToKey(pos);
                if (used.has(key)) continue;

                const itemType = itemTypes[itemIdx % itemTypes.length];
                items.push({
                    type: itemType,
                    pos: pos,
                    position: [...pos],
                    pattern_id: `island_${islandIdx}_${itemIdx}`,
                    segment_idx: islandIdx,
                    identical_pattern: true
                });
                used.add(key);
            }
        }

        if (items.length < 2) {
            return null;
        }

        console.log(`[SymmetricPlacer] Island array: ${items.length} items across ${islands.length} islands`);
        return buildLayoutFn(pathInfo, items, logicType);
    }

    /**
     * Get item types from params or use defaults.
     */
    private getItemTypes(params: Record<string, any>): string[] {
        let itemsToPlace = params.items_to_place || [];
        
        if (typeof itemsToPlace === 'string') {
            itemsToPlace = itemsToPlace.replace(/[\[\]']/g, '').split(',').map((s: string) => s.trim());
        }

        const validTypes = ['crystal', 'switch', 'gem'];
        itemsToPlace = itemsToPlace.filter((i: string) => validTypes.includes(i));

        return itemsToPlace.length > 0 ? itemsToPlace : ['crystal', 'switch'];
    }

    private coordToKey(coord: Coord): string {
        if (!coord || coord.length < 3) return '';
        return `${coord[0]},${coord[1]},${coord[2]}`;
    }
}

// Singleton instance
let placerInstance: SymmetricPlacer | null = null;

export function getSymmetricPlacer(): SymmetricPlacer {
    if (!placerInstance) {
        placerInstance = new SymmetricPlacer();
    }
    return placerInstance;
}
