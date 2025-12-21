/**
 * Fallback Handler
 * 
 * Provides fallback placement strategies when pattern matching fails.
 * Ported from Python: fallback_handler.py
 */

import { IPathInfo, Coord } from '../types';
import { ItemPlacement as PedagogicalItemPlacement, LayoutResult } from './PedagogicalStrategyHandler';

type BuildLayoutFn = (
    pathInfo: IPathInfo, 
    items: PedagogicalItemPlacement[], 
    logicType: string
) => LayoutResult;

/**
 * Fallback Handler
 * Implements fallback placement strategies when primary methods fail.
 */
export class FallbackHandler {

    /**
     * Simple distributed placement when segment metadata unavailable.
     */
    fallbackPlacement(
        pathInfo: IPathInfo,
        params: Record<string, any>,
        buildLayoutFn: BuildLayoutFn
    ): LayoutResult {
        const logicType = params.logic_type || 'function_logic';
        const pathCoords = pathInfo.path_coords || [];

        if (pathCoords.length < 4) {
            console.warn("[FallbackHandler] Path too short for placement");
            return buildLayoutFn(pathInfo, [], logicType);
        }

        const items: PedagogicalItemPlacement[] = [];
        const used = new Set<string>();
        used.add(this.coordToKey(pathInfo.start_pos));
        used.add(this.coordToKey(pathInfo.target_pos));

        const itemTypes = this.getItemTypes(params);
        
        // Calculate target density based on logic type
        const targetDensity = logicType === 'function_logic' ? 0.22 : 0.15;
        const minItems = logicType === 'function_logic' ? 5 : 3;
        
        // Available positions (exclude start and end)
        const available = pathCoords.filter((_, i) => i > 0 && i < pathCoords.length - 1);
        const targetCount = Math.max(minItems, Math.floor(available.length * targetDensity));

        // Distribute evenly
        const step = Math.max(1, Math.floor(available.length / targetCount));

        for (let i = 0; i < available.length && items.length < targetCount; i += step) {
            const pos = available[i];
            const key = this.coordToKey(pos);
            
            if (used.has(key)) continue;

            const itemType = itemTypes[items.length % itemTypes.length];
            items.push({
                type: itemType,
                pos: pos,
                position: [...pos],
                pattern_id: `fallback_${items.length}`,
                fallback: true
            });
            used.add(key);
        }

        // Ensure minimum items
        if (items.length < minItems) {
            // Add more items if possible
            for (let i = 1; i < available.length - 1 && items.length < minItems; i++) {
                const pos = available[i];
                const key = this.coordToKey(pos);
                
                if (used.has(key)) continue;

                const itemType = itemTypes[items.length % itemTypes.length];
                items.push({
                    type: itemType,
                    pos: pos,
                    position: [...pos],
                    pattern_id: `fallback_extra_${items.length}`,
                    fallback: true
                });
                used.add(key);
            }
        }

        const density = pathCoords.length > 0 
            ? ((items.length / pathCoords.length) * 100).toFixed(1) 
            : 0;
        console.log(`[FallbackHandler] Placed ${items.length} items (${density}% density)`);

        return buildLayoutFn(pathInfo, items, logicType);
    }

    /**
     * Random sparse placement for debugging.
     */
    randomSparsePlacement(
        pathInfo: IPathInfo,
        params: Record<string, any>,
        buildLayoutFn: BuildLayoutFn,
        count: number = 3
    ): LayoutResult {
        const logicType = params.logic_type || 'function_logic';
        const pathCoords = pathInfo.path_coords || [];

        const items: PedagogicalItemPlacement[] = [];
        const used = new Set<string>();
        used.add(this.coordToKey(pathInfo.start_pos));
        used.add(this.coordToKey(pathInfo.target_pos));

        const available = pathCoords.filter((_, i) => i > 0 && i < pathCoords.length - 1);
        const itemTypes = this.getItemTypes(params);

        // Shuffle and pick
        const shuffled = [...available].sort(() => Math.random() - 0.5);

        for (let i = 0; i < shuffled.length && items.length < count; i++) {
            const pos = shuffled[i];
            const key = this.coordToKey(pos);
            
            if (used.has(key)) continue;

            const itemType = itemTypes[items.length % itemTypes.length];
            items.push({
                type: itemType,
                pos: pos,
                position: [...pos],
                pattern_id: `random_${items.length}`
            });
            used.add(key);
        }

        return buildLayoutFn(pathInfo, items, logicType);
    }

    /**
     * Corner-based placement for L/T/S shaped paths.
     */
    cornerBasedPlacement(
        pathInfo: IPathInfo,
        params: Record<string, any>,
        buildLayoutFn: BuildLayoutFn
    ): LayoutResult {
        const logicType = params.logic_type || 'function_logic';
        const metadata = pathInfo.metadata || {};
        const corners = metadata.corners || [];
        const pathCoords = pathInfo.path_coords || [];

        const items: PedagogicalItemPlacement[] = [];
        const used = new Set<string>();
        used.add(this.coordToKey(pathInfo.start_pos));
        used.add(this.coordToKey(pathInfo.target_pos));

        const itemTypes = this.getItemTypes(params);

        // Place items near corners
        for (let i = 0; i < corners.length; i++) {
            const corner = corners[i];
            const key = this.coordToKey(corner);
            if (used.has(key)) continue;

            // Find positions adjacent to corner on path
            const cornerIdx = pathCoords.findIndex(p => this.coordsEqual(p, corner));
            if (cornerIdx === -1) continue;

            // Place before corner
            if (cornerIdx > 1) {
                const beforePos = pathCoords[cornerIdx - 1];
                const beforeKey = this.coordToKey(beforePos);
                if (!used.has(beforeKey)) {
                    items.push({
                        type: itemTypes[items.length % itemTypes.length],
                        pos: beforePos,
                        position: [...beforePos],
                        pattern_id: `corner_before_${i}`
                    });
                    used.add(beforeKey);
                }
            }

            // Place after corner
            if (cornerIdx < pathCoords.length - 2) {
                const afterPos = pathCoords[cornerIdx + 1];
                const afterKey = this.coordToKey(afterPos);
                if (!used.has(afterKey)) {
                    items.push({
                        type: itemTypes[items.length % itemTypes.length],
                        pos: afterPos,
                        position: [...afterPos],
                        pattern_id: `corner_after_${i}`
                    });
                    used.add(afterKey);
                }
            }
        }

        // If no corners, use fallback
        if (items.length === 0) {
            return this.fallbackPlacement(pathInfo, params, buildLayoutFn);
        }

        console.log(`[FallbackHandler] Corner-based: ${items.length} items near ${corners.length} corners`);
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

    private coordsEqual(a: Coord, b: Coord): boolean {
        return a[0] === b[0] && a[1] === b[1] && a[2] === b[2];
    }
}

// Singleton instance
let handlerInstance: FallbackHandler | null = null;

export function getFallbackHandler(): FallbackHandler {
    if (!handlerInstance) {
        handlerInstance = new FallbackHandler();
    }
    return handlerInstance;
}
