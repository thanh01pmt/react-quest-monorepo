/**
 * Semantic Position Handler
 * 
 * Uses semantic positions from topology metadata to guide special item placements.
 * Ported from Python: semantic_position_handler.py
 */

import { Coord, IPathInfo } from '../types';
import { SemanticPair, StrategySelector, getStrategySelector } from './StrategySelector';

export interface ItemPlacement {
    type: string;
    pos?: Coord;
    position?: number[];
    pattern_id?: string;
    semantic_role?: string;
    [key: string]: any;
}

/**
 * Handles item placement using semantic positions from topology metadata.
 * Supports valid_pairs for difficulty-based start/end selection.
 */
export class SemanticPositionHandler {
    private strategySelector: StrategySelector;

    constructor() {
        this.strategySelector = getStrategySelector();
    }

    /**
     * Enhance item list with semantic position placements.
     */
    applySemanticPlacements(
        pathInfo: IPathInfo,
        items: ItemPlacement[],
        params: Record<string, any>
    ): ItemPlacement[] {
        const metadata = pathInfo.metadata || {};
        const semantic = metadata.semantic_positions || {};
        
        if (!semantic || Object.keys(semantic).length === 0) {
            return items;
        }
        
        // Track used positions
        const used = new Set<string>();
        items.forEach(item => {
            const pos = item.pos || item.position;
            if (pos) {
                used.add(this.coordToKey(pos as Coord));
            }
        });
        
        used.add(this.coordToKey(pathInfo.start_pos));
        used.add(this.coordToKey(pathInfo.target_pos));
        
        const newItems = [...items];
        
        // Rule 1: Place switch at center for hub-spoke topologies
        if (semantic.center) {
            const center = semantic.center as Coord;
            const centerKey = this.coordToKey(center);
            
            if (!used.has(centerKey)) {
                newItems.push({
                    type: 'switch',
                    pos: center,
                    position: Array.isArray(center) ? center : [center],
                    pattern_id: 'semantic_center',
                    semantic_role: 'hub_switch'
                });
                used.add(centerKey);
                console.log(`[SemanticPositionHandler] Placed switch at semantic center:`, center);
            }
        }
        
        // Rule 2: Place crystals near endpoints
        const endpointKeys = ['left_end', 'right_end', 'top_end', 'bottom_end'];
        let crystalsAtEndpoints = 0;
        
        for (const key of endpointKeys) {
            if (semantic[key] && crystalsAtEndpoints < 4) {
                const pos = semantic[key] as Coord;
                const posKey = this.coordToKey(pos);
                
                if (!used.has(posKey)) {
                    newItems.push({
                        type: 'crystal',
                        pos: pos,
                        position: Array.isArray(pos) ? pos : [pos],
                        pattern_id: `semantic_${key}`,
                        semantic_role: key
                    });
                    used.add(posKey);
                    crystalsAtEndpoints++;
                }
            }
        }
        
        if (crystalsAtEndpoints > 0) {
            console.log(`[SemanticPositionHandler] Placed ${crystalsAtEndpoints} crystals at semantic endpoints`);
        }
        
        return newItems;
    }

    /**
     * Select appropriate start/end pair based on difficulty and strategy.
     */
    selectStartEndPair(
        pathInfo: IPathInfo,
        params: Record<string, any>
    ): SemanticPair | null {
        const metadata = pathInfo.metadata || {};
        const semantic = metadata.semantic_positions || {};
        const topologyType = metadata.topology_type || '';
        
        return this.strategySelector.selectStartEndPair(topologyType, params, semantic);
    }

    /**
     * Get optimal start and end positions from semantic metadata.
     * @deprecated Use selectStartEndPair() with valid_pairs instead.
     */
    getOptimalPathPositions(metadata: Record<string, any>): [Coord | null, Coord | null] {
        const semantic = metadata.semantic_positions || {};
        
        const optimalStartKey = semantic.optimal_start;
        const optimalEndKey = semantic.optimal_end;
        
        let startPos: Coord | null = null;
        let endPos: Coord | null = null;
        
        if (optimalStartKey && semantic[optimalStartKey]) {
            startPos = semantic[optimalStartKey] as Coord;
        }
        
        if (optimalEndKey && semantic[optimalEndKey]) {
            endPos = semantic[optimalEndKey] as Coord;
        }
        
        return [startPos, endPos];
    }

    /**
     * Get all valid start/end pairs from metadata.
     */
    getValidPairs(metadata: Record<string, any>): SemanticPair[] {
        const semantic = metadata.semantic_positions || {};
        const validPairsData = semantic.valid_pairs || [];
        
        return validPairsData.map((p: any) => SemanticPair.fromDict(p));
    }

    /**
     * Get a pair matching the specified difficulty.
     */
    getPairForDifficulty(metadata: Record<string, any>, difficulty: string): SemanticPair | null {
        const pairs = this.getValidPairs(metadata);
        const difficultyUpper = (difficulty || 'MEDIUM').toUpperCase();
        
        const matching = pairs.filter(p => p.difficulty.toUpperCase() === difficultyUpper);
        
        if (matching.length) {
            return matching[0];
        }
        
        // Fallback to any pair
        return pairs.length > 0 ? pairs[0] : null;
    }

    /**
     * Extract all branch endpoint positions from semantic data.
     */
    getBranchEndpoints(metadata: Record<string, any>): Coord[] {
        const semantic = metadata.semantic_positions || {};
        const endpoints: Coord[] = [];
        
        const endpointKeys = [
            'left_end', 'right_end', 'top_end', 'bottom_end',
            'upper_left_point', 'upper_right_point',
            'bottom_left_point', 'bottom_right_point'
        ];
        
        for (const key of endpointKeys) {
            if (semantic[key]) {
                endpoints.push(semantic[key] as Coord);
            }
        }
        
        return endpoints;
    }

    /**
     * Check if topology has a hub center defined.
     */
    hasHubCenter(metadata: Record<string, any>): boolean {
        const semantic = metadata.semantic_positions || {};
        return semantic.center !== undefined && semantic.center !== null;
    }

    /**
     * Check if topology has valid_pairs defined.
     */
    hasValidPairs(metadata: Record<string, any>): boolean {
        const semantic = metadata.semantic_positions || {};
        const validPairs = semantic.valid_pairs || [];
        return validPairs.length > 0;
    }

    /**
     * Resolve semantic position key to actual coordinate.
     */
    resolvePosition(semantic: Record<string, any>, key: string): Coord | null {
        if (!key || !semantic) return null;
        
        // Direct lookup
        if (semantic[key]) {
            return semantic[key] as Coord;
        }
        
        return null;
    }

    private coordToKey(coord: Coord | number[]): string {
        if (!coord || coord.length < 3) return '';
        return `${coord[0]},${coord[1]},${coord[2]}`;
    }
}

// Singleton instance
let handlerInstance: SemanticPositionHandler | null = null;

export function getSemanticPositionHandler(): SemanticPositionHandler {
    if (!handlerInstance) {
        handlerInstance = new SemanticPositionHandler();
    }
    return handlerInstance;
}
