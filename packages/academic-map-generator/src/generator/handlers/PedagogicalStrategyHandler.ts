/**
 * Pedagogical Strategy Handler
 * 
 * Maps topology types to pedagogical strategies and implements strategy-specific
 * placement logic based on teaching concepts.
 * Ported from Python: pedagogical_strategy_handler.py
 */

import { Coord, IPathInfo } from '../types';
import { PlacedObject, BuildableAsset } from '../../shared/app-types';
import { v4 as uuidv4 } from 'uuid';
import { 
    StrategySelector, 
    getStrategySelector, 
    ENHANCED_TOPOLOGY_STRATEGIES 
} from './StrategySelector';
import { PatternComplexityModifier, getPatternComplexityModifier } from './PatternComplexityModifier';

export interface ItemPlacement {
    type: string;
    pos?: Coord;
    position?: number[];
    pattern_id?: string;
    segment_idx?: number;
    identical_pattern?: boolean;
    [key: string]: any;
}

export interface LayoutResult {
    items: ItemPlacement[];
    collectibles?: any[];
    interactibles?: any[];
    metadata?: Record<string, any>;
}

/**
 * Legacy topology strategies mapping
 */
const TOPOLOGY_STRATEGIES: Record<string, string> = {
    // Hub-Spoke family
    'plus_shape': 'function_reuse',
    'star_shape': 'radial_iteration',
    'plus_shape_islands': 'function_reuse',
    
    // Branch family
    't_shape': 'conditional_branching',
    'h_shape': 'function_reuse',
    'ef_shape': 'conditional_branching',
    
    // Shape family
    'v_shape': 'variable_rate_change',
    'u_shape': 'function_reuse',
    's_shape': 'alternating_patterns',
    'z_shape': 'alternating_patterns',
    'l_shape': 'segment_based',
    
    // Linear family
    'spiral': 'decreasing_loop',
    'spiral_3d': 'decreasing_loop',
    'zigzag': 'segment_pattern_reuse',
    'staircase': 'segment_pattern_reuse',
    'straight_line': 'linear_repeat',
    
    // Default
    'default': 'segment_based'
};

type BuildLayoutFn = (
    pathInfo: IPathInfo, 
    items: ItemPlacement[], 
    logicType: string
) => LayoutResult;

/**
 * Pedagogical Strategy Handler
 * Handles placement based on pedagogical strategies derived from topology type.
 */
export class PedagogicalStrategyHandler {
    private strategySelector: StrategySelector;
    private complexityModifier: PatternComplexityModifier;

    constructor() {
        this.strategySelector = getStrategySelector();
        this.complexityModifier = getPatternComplexityModifier();
    }

    /**
     * Apply difficulty-based pattern modifications to placed items.
     */
    private applyDifficultyModifications(
        items: ItemPlacement[],
        params: Record<string, any>,
        topologyType: string
    ): ItemPlacement[] {
        const difficultyCode = params.difficulty_code || 'MEDIUM';
        const patternType = this.strategySelector.getDifficultyPattern(topologyType, difficultyCode);
        return this.complexityModifier.applyDifficulty(items, difficultyCode, patternType);
    }

    /**
     * Get the pedagogical strategy for a topology type.
     */
    getStrategyForTopology(topologyType: string, params?: Record<string, any>): string {
        if (params) {
            const config = this.strategySelector.selectStrategy(topologyType, params);
            return config.primary;
        }
        return TOPOLOGY_STRATEGIES[topologyType] || TOPOLOGY_STRATEGIES['default'];
    }

    /**
     * Get item types to place from params.
     */
    private getItemTypes(params: Record<string, any>): string[] {
        let itemsToPlace = params.items_to_place || [];
        
        if (typeof itemsToPlace === 'string') {
            itemsToPlace = itemsToPlace.replace(/[\[\]']/g, '').split(',').map((s: string) => s.trim());
        }
        
        const validTypes = ['crystal', 'switch', 'gem'];
        itemsToPlace = itemsToPlace.filter((i: string) => validTypes.includes(i));
        
        if (!itemsToPlace.length) {
            itemsToPlace = ['crystal', 'switch'];
        }
        
        return itemsToPlace;
    }

    private getNextItemType(itemTypes: string[], index: number): string {
        if (!itemTypes.length) return 'crystal';
        return itemTypes[index % itemTypes.length];
    }

    /**
     * Apply pedagogical strategy to placement.
     */
    applyStrategy(
        pathInfo: IPathInfo,
        params: Record<string, any>,
        buildLayoutFn: BuildLayoutFn
    ): LayoutResult | null {
        const metadata = pathInfo.metadata || {};
        const topologyType = metadata.topology_type || '';
        
        const strategy = metadata.pedagogical_strategy || this.getStrategyForTopology(topologyType, params);
        
        if (!strategy) {
            return null;
        }
        
        const difficultyCode = params.difficulty_code || 'N/A';
        console.log(
            `[PedagogicalStrategyHandler] Applying '${strategy}' for topology '${topologyType}' ` +
            `[difficulty=${difficultyCode}]`
        );
        
        // Dispatch to strategy handler
        switch (strategy) {
            case 'function_reuse':
                return this.applyFunctionReuse(pathInfo, params, buildLayoutFn);
            case 'conditional_branching':
                return this.applyConditionalBranching(pathInfo, params, buildLayoutFn);
            case 'variable_rate_change':
                return this.applyVariableRateChange(pathInfo, params, buildLayoutFn);
            case 'alternating_patterns':
                return this.applyAlternatingPatterns(pathInfo, params, buildLayoutFn);
            case 'decreasing_loop':
                return this.applyDecreasingLoop(pathInfo, params, buildLayoutFn);
            case 'radial_iteration':
                return this.applyRadialIteration(pathInfo, params, buildLayoutFn);
            case 'segment_based':
            case 'segment_pattern_reuse':
                return this.applySegmentBased(pathInfo, params, buildLayoutFn);
            default:
                return null;
        }
    }

    /**
     * Function Reuse: All segments have IDENTICAL patterns.
     * Teaches PROCEDURE reuse.
     */
    private applyFunctionReuse(
        pathInfo: IPathInfo,
        params: Record<string, any>,
        buildLayoutFn: BuildLayoutFn
    ): LayoutResult | null {
        const metadata = pathInfo.metadata || {};
        const segments = metadata.segments || [];
        const logicType = params.logic_type || 'function_logic';
        
        if (segments.length < 2) {
            return null;
        }
        
        const items: ItemPlacement[] = [];
        const used = new Set<string>();
        used.add(this.coordToKey(pathInfo.start_pos));
        used.add(this.coordToKey(pathInfo.target_pos));
        
        // Find minimum segment length
        const minLen = Math.min(...segments.map((s: Coord[]) => s.length).filter((l: number) => l > 0));
        const itemsPerSegment = Math.min(3, Math.max(1, Math.floor(minLen / 2)));
        
        // Apply IDENTICAL pattern to all segments
        for (let segIdx = 0; segIdx < segments.length; segIdx++) {
            const segment = segments[segIdx];
            if (!segment || segment.length === 0) continue;
            
            for (let itemIdx = 0; itemIdx < itemsPerSegment; itemIdx++) {
                const posIdx = (itemIdx + 1) * 2 - 1;  // 1, 3, 5...
                if (posIdx >= segment.length) continue;
                
                const pos = segment[posIdx];
                const posKey = this.coordToKey(pos);
                
                if (used.has(posKey)) continue;
                
                const itemTypes = this.getItemTypes(params);
                const itemType = this.getNextItemType(itemTypes, itemIdx);
                
                items.push({
                    type: itemType,
                    pos: pos,
                    position: [...pos],
                    pattern_id: `function_reuse_${segIdx}_${itemIdx}`,
                    segment_idx: segIdx,
                    identical_pattern: true
                });
                used.add(posKey);
            }
        }
        
        if (items.length < 3) {
            return null;
        }
        
        const modifiedItems = this.applyDifficultyModifications(items, params, metadata.topology_type || '');
        console.log(`[PedagogicalStrategyHandler] function_reuse: ${modifiedItems.length} items across ${segments.length} segments`);
        
        return buildLayoutFn(pathInfo, modifiedItems, logicType);
    }

    /**
     * Conditional Branching: Place decoy items on wrong branches.
     */
    private applyConditionalBranching(
        pathInfo: IPathInfo,
        params: Record<string, any>,
        buildLayoutFn: BuildLayoutFn
    ): LayoutResult | null {
        const metadata = pathInfo.metadata || {};
        const branches = metadata.branches || [];
        const logicType = params.logic_type || 'function_logic';
        
        if (!branches.length || branches.length < 2) {
            return null;
        }
        
        const items: ItemPlacement[] = [];
        const used = new Set<string>();
        used.add(this.coordToKey(pathInfo.start_pos));
        used.add(this.coordToKey(pathInfo.target_pos));
        
        // Find which branch leads to goal
        const goalPos = this.coordToKey(pathInfo.target_pos);
        let goalBranchIdx = -1;
        
        for (let idx = 0; idx < branches.length; idx++) {
            const branch = branches[idx];
            if (branch && branch.length > 0) {
                const lastPos = branch.coords ? branch.coords[branch.coords.length - 1] : branch[branch.length - 1];
                if (this.coordToKey(lastPos) === goalPos) {
                    goalBranchIdx = idx;
                    break;
                }
            }
        }
        
        for (let idx = 0; idx < branches.length; idx++) {
            const branchData = branches[idx];
            const branch = branchData.coords || branchData;
            
            if (!branch || branch.length < 2) continue;
            
            const isWrongBranch = idx !== goalBranchIdx && goalBranchIdx >= 0;
            
            for (let i = 1; i < branch.length; i++) {
                const pos = branch[i];
                const posKey = this.coordToKey(pos);
                
                if (used.has(posKey)) continue;
                
                if (isWrongBranch && i === branch.length - 1) {
                    // Place decoy switch at end of wrong branch
                    items.push({
                        type: 'switch',
                        pos: pos,
                        position: [...pos],
                        pattern_id: `decoy_branch_${idx}`,
                        decoy: true
                    });
                } else {
                    items.push({
                        type: 'crystal',
                        pos: pos,
                        position: [...pos],
                        pattern_id: `branch_${idx}_${i}`
                    });
                }
                used.add(posKey);
            }
        }
        
        if (items.length < 2) {
            return null;
        }
        
        const modifiedItems = this.applyDifficultyModifications(items, params, metadata.topology_type || '');
        console.log(`[PedagogicalStrategyHandler] conditional_branching: ${modifiedItems.length} items with decoys`);
        
        return buildLayoutFn(pathInfo, modifiedItems, logicType);
    }

    /**
     * Variable Rate Change: Spacing increases then decreases (1→2→3→2→1).
     */
    private applyVariableRateChange(
        pathInfo: IPathInfo,
        params: Record<string, any>,
        buildLayoutFn: BuildLayoutFn
    ): LayoutResult | null {
        const metadata = pathInfo.metadata || {};
        const segments = metadata.segments || [];
        const logicType = params.logic_type || 'function_logic';
        
        if (!segments.length) {
            return null;
        }
        
        const items: ItemPlacement[] = [];
        const used = new Set<string>();
        used.add(this.coordToKey(pathInfo.start_pos));
        used.add(this.coordToKey(pathInfo.target_pos));
        
        // Flatten segments
        const allCoords: Coord[] = [];
        for (const seg of segments) {
            if (seg) allCoords.push(...seg);
        }
        
        // Variable spacing: 1, 2, 3, ...
        let spacing = 1;
        let i = 1;
        let phase: 'increasing' | 'decreasing' = 'increasing';
        const midPoint = Math.floor(allCoords.length / 2);
        
        while (i < allCoords.length - 1) {
            const pos = allCoords[i];
            const posKey = this.coordToKey(pos);
            
            if (!used.has(posKey)) {
                const itemTypes = this.getItemTypes(params);
                const itemType = this.getNextItemType(itemTypes, items.length);
                
                items.push({
                    type: itemType,
                    pos: pos,
                    position: [...pos],
                    pattern_id: `var_spacing_${spacing}`,
                    spacing: spacing
                });
                used.add(posKey);
            }
            
            i += spacing;
            
            if (i >= midPoint && phase === 'increasing') {
                phase = 'decreasing';
            }
            
            if (phase === 'increasing' && spacing < 3) {
                spacing++;
            } else if (phase === 'decreasing' && spacing > 1) {
                spacing--;
            }
        }
        
        if (items.length < 3) {
            return null;
        }
        
        const modifiedItems = this.applyDifficultyModifications(items, params, metadata.topology_type || '');
        console.log(`[PedagogicalStrategyHandler] variable_rate_change: ${modifiedItems.length} items`);
        
        return buildLayoutFn(pathInfo, modifiedItems, logicType);
    }

    /**
     * Alternating Patterns: Crystal at even, switch at odd positions.
     */
    private applyAlternatingPatterns(
        pathInfo: IPathInfo,
        params: Record<string, any>,
        buildLayoutFn: BuildLayoutFn
    ): LayoutResult | null {
        const metadata = pathInfo.metadata || {};
        const segments = metadata.segments || [];
        const logicType = params.logic_type || 'function_logic';
        
        const items: ItemPlacement[] = [];
        const used = new Set<string>();
        used.add(this.coordToKey(pathInfo.start_pos));
        used.add(this.coordToKey(pathInfo.target_pos));
        
        let itemCount = 0;
        
        for (let segIdx = 0; segIdx < segments.length; segIdx++) {
            const segment = segments[segIdx];
            if (!segment) continue;
            
            for (let posIdx = 0; posIdx < segment.length; posIdx++) {
                const pos = segment[posIdx];
                const posKey = this.coordToKey(pos);
                
                if (used.has(posKey)) continue;
                
                // Every 2nd position gets an item
                if (posIdx % 2 === 1) {
                    const itemType = itemCount % 2 === 0 ? 'crystal' : 'switch';
                    items.push({
                        type: itemType,
                        pos: pos,
                        position: [...pos],
                        pattern_id: `alternating_${segIdx}_${posIdx}`,
                        alternating_idx: itemCount
                    });
                    used.add(posKey);
                    itemCount++;
                }
            }
        }
        
        if (items.length < 2) {
            return null;
        }
        
        const modifiedItems = this.applyDifficultyModifications(items, params, metadata.topology_type || '');
        console.log(`[PedagogicalStrategyHandler] alternating_patterns: ${modifiedItems.length} items`);
        
        return buildLayoutFn(pathInfo, modifiedItems, logicType);
    }

    /**
     * Decreasing Loop: Items decrease per layer/ring.
     */
    private applyDecreasingLoop(
        pathInfo: IPathInfo,
        params: Record<string, any>,
        buildLayoutFn: BuildLayoutFn
    ): LayoutResult | null {
        const metadata = pathInfo.metadata || {};
        const segments = metadata.segments || [];
        const logicType = params.logic_type || 'function_logic';
        
        if (!segments.length) {
            return null;
        }
        
        const items: ItemPlacement[] = [];
        const used = new Set<string>();
        used.add(this.coordToKey(pathInfo.start_pos));
        used.add(this.coordToKey(pathInfo.target_pos));
        
        // Items per segment decreases: 3, 2, 1, 1, ...
        let itemsPerSegment = 3;
        
        for (let segIdx = 0; segIdx < segments.length; segIdx++) {
            const segment = segments[segIdx];
            if (!segment) continue;
            
            const step = Math.max(1, Math.floor(segment.length / (itemsPerSegment + 1)));
            
            for (let i = 0; i < itemsPerSegment; i++) {
                const posIdx = (i + 1) * step;
                if (posIdx >= segment.length) continue;
                
                const pos = segment[posIdx];
                const posKey = this.coordToKey(pos);
                
                if (used.has(posKey)) continue;
                
                const itemTypes = this.getItemTypes(params);
                const itemType = this.getNextItemType(itemTypes, items.length);
                
                items.push({
                    type: itemType,
                    pos: pos,
                    position: [...pos],
                    pattern_id: `layer_${segIdx}_item_${i}`,
                    layer: segIdx,
                    items_in_layer: itemsPerSegment
                });
                used.add(posKey);
            }
            
            if (itemsPerSegment > 1) {
                itemsPerSegment--;
            }
        }
        
        if (items.length < 3) {
            return null;
        }
        
        const modifiedItems = this.applyDifficultyModifications(items, params, metadata.topology_type || '');
        console.log(`[PedagogicalStrategyHandler] decreasing_loop: ${modifiedItems.length} items`);
        
        return buildLayoutFn(pathInfo, modifiedItems, logicType);
    }

    /**
     * Radial Iteration: Identical pattern on each radial arm.
     */
    private applyRadialIteration(
        pathInfo: IPathInfo,
        params: Record<string, any>,
        buildLayoutFn: BuildLayoutFn
    ): LayoutResult | null {
        const metadata = pathInfo.metadata || {};
        const branches = metadata.branches || [];
        const logicType = params.logic_type || 'function_logic';
        
        if (branches.length < 3) {
            return null;
        }
        
        const items: ItemPlacement[] = [];
        const used = new Set<string>();
        used.add(this.coordToKey(pathInfo.start_pos));
        used.add(this.coordToKey(pathInfo.target_pos));
        
        // Identical pattern for each arm
        const minArmLen = Math.min(...branches.map((b: any) => (b.coords || b).length).filter((l: number) => l > 0));
        const itemsPerArm = Math.min(2, Math.max(1, minArmLen - 1));
        
        for (let armIdx = 0; armIdx < branches.length; armIdx++) {
            const armData = branches[armIdx];
            const arm = armData.coords || armData;
            
            if (!arm || arm.length < 2) continue;
            
            for (let itemIdx = 0; itemIdx < itemsPerArm; itemIdx++) {
                const posIdx = itemIdx + 1;  // Skip center
                if (posIdx >= arm.length) continue;
                
                const pos = arm[posIdx];
                const posKey = this.coordToKey(pos);
                
                if (used.has(posKey)) continue;
                
                const itemTypes = this.getItemTypes(params);
                const itemType = this.getNextItemType(itemTypes, items.length);
                
                items.push({
                    type: itemType,
                    pos: pos,
                    position: [...pos],
                    pattern_id: `arm_${armIdx}_item_${itemIdx}`,
                    arm_idx: armIdx,
                    radial_pattern: true
                });
                used.add(posKey);
            }
        }
        
        if (items.length < 3) {
            return null;
        }
        
        const modifiedItems = this.applyDifficultyModifications(items, params, metadata.topology_type || '');
        console.log(`[PedagogicalStrategyHandler] radial_iteration: ${modifiedItems.length} items across ${branches.length} arms`);
        
        return buildLayoutFn(pathInfo, modifiedItems, logicType);
    }

    /**
     * Segment Based: Distribute items across path with target density.
     */
    private applySegmentBased(
        pathInfo: IPathInfo,
        params: Record<string, any>,
        buildLayoutFn: BuildLayoutFn
    ): LayoutResult | null {
        const metadata = pathInfo.metadata || {};
        const segments = metadata.segments || [];
        const logicType = params.logic_type || 'function_logic';
        
        const placementCoords = pathInfo.placement_coords || pathInfo.path_coords || [];
        const totalBlocks = placementCoords.length;
        
        const allCoords: Coord[] = [];
        if (segments.length) {
            for (const seg of segments) {
                if (seg) allCoords.push(...seg);
            }
        } else {
            allCoords.push(...(pathInfo.path_coords || []));
        }
        
        if (allCoords.length < 4) {
            return null;
        }
        
        const items: ItemPlacement[] = [];
        const used = new Set<string>();
        used.add(this.coordToKey(pathInfo.start_pos));
        used.add(this.coordToKey(pathInfo.target_pos));
        
        const itemTypes = this.getItemTypes(params);
        
        // Target density: 22% for function_logic
        const targetDensity = logicType === 'function_logic' ? 0.22 : 0.15;
        const minItems = logicType === 'function_logic' ? 5 : 3;
        const targetCount = Math.max(minItems, Math.floor(totalBlocks * targetDensity));
        
        const availablePositions = allCoords.length - 2;
        const step = targetCount > 0 ? Math.max(1, Math.floor(availablePositions / targetCount)) : 2;
        
        let placedCount = 0;
        for (let i = 0; i < allCoords.length; i++) {
            const pos = allCoords[i];
            const posKey = this.coordToKey(pos);
            
            if (used.has(posKey)) continue;
            
            if (placedCount >= targetCount) break;
            
            if (i % step !== 1 && placedCount < targetCount - 2) continue;
            
            const itemType = this.getNextItemType(itemTypes, items.length);
            
            items.push({
                type: itemType,
                pos: pos,
                position: [...pos],
                pattern_id: `segment_${placedCount}`,
                segment_based: true
            });
            used.add(posKey);
            placedCount++;
        }
        
        if (items.length < minItems) {
            return null;
        }
        
        const modifiedItems = this.applyDifficultyModifications(items, params, metadata.topology_type || '');
        const actualDensity = totalBlocks > 0 ? (modifiedItems.length / totalBlocks * 100).toFixed(1) : 0;
        console.log(`[PedagogicalStrategyHandler] segment_based: ${modifiedItems.length} items (${actualDensity}% density)`);
        
        return buildLayoutFn(pathInfo, modifiedItems, logicType);
    }

    private coordToKey(coord: Coord): string {
        if (!coord || coord.length < 3) return '';
        return `${coord[0]},${coord[1]},${coord[2]}`;
    }
}

// Singleton instance
let handlerInstance: PedagogicalStrategyHandler | null = null;

export function getPedagogicalStrategyHandler(): PedagogicalStrategyHandler {
    if (!handlerInstance) {
        handlerInstance = new PedagogicalStrategyHandler();
    }
    return handlerInstance;
}
