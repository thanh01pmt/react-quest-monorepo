/**
 * Solution-First Placer (Pattern-Based Approach)
 * 
 * ARCHITECTURE (Ported from Python):
 * ==================================
 * 
 * KEY INSIGHT: Pattern = Encoded Solution
 * The solution is "designed" by choosing a Pattern, which defines:
 * - `actions`: The expected solution sequence (moveForward, collect, turnRight...)
 * - `item_coord_offsets`: Where to place items in segment
 * - `item_types`: What type of items to place
 * 
 * FLOW:
 * 1. Get segments from topology metadata
 * 2. For each segment: match a Pattern based on segment length + logic_type
 * 3. Pattern provides:
 *    - Expected actions for this segment
 *    - Item positions within segment (offsets)
 * 4. Place items at offset positions
 * 5. Combine all segment patterns → full solution
 * 
 * This is different from solver-based approach where you:
 * - Place items randomly, then use A* to find solution
 * 
 * Here: Pattern IS the solution. Items are placed to PRODUCE that solution.
 */

import { IPathInfo, Coord } from '../types';
import { PlacedObject, BuildableAsset } from '../../../apps/map-builder-app/src/types';
import { v4 as uuidv4 } from 'uuid';
import { getSynthesizerRegistry, SynthesisResult } from '../synthesizers';
import { 
    Pattern, 
    getPatternLibrary, 
    FALLBACK_PATTERN,
    PATTERN_FUNCTION_REUSE,
    PATTERN_DECREASING_LOOP,
    PATTERN_WHILE_GEM,
    PATTERN_MOVE_COLLECT
} from './PatternLibrary';

// Academic configuration
export interface AcademicConfig {
    logic_type: 'function_logic' | 'loop_logic' | 'sequencing' | 'conditional' | 'while_loop_logic';
    difficulty_code: 'EASY' | 'MEDIUM' | 'HARD';
    item_goals: {
        crystal?: number;
        switch?: number;
        gem?: number;
    };
    force_function?: boolean;
    force_loop?: boolean;
}

// Planned solution output
export interface PlannedSolution {
    // The path (sequence of coordinates player walks)
    path: Coord[];
    // Raw actions sequence
    rawActions: string[];
    // Structured solution (with loops/procedures)
    structuredSolution: SynthesisResult;
    // Item placements
    itemPlacements: ItemPlacement[];
    // Pattern matches used (for debugging)
    patternMatches: PatternMatch[];
    // Metadata
    metadata: {
        logic_type: string;
        optimal_blocks: number;
        path_length: number;
        planning_strategy: string;
        detected_patterns: string[];
    };
}

export interface ItemPlacement {
    type: 'crystal' | 'switch' | 'gem' | 'goal';
    position: Coord;
    action: 'collect' | 'toggle' | 'reach';
    step_index: number;  // Which step in the path
    pattern_id?: string;  // Which pattern placed this
}

export interface PatternMatch {
    segment_index: number;
    pattern: Pattern;
    segment_coords: Coord[];
    expected_actions: string[];
    item_placements: ItemPlacement[];
}

export interface PlacementResult {
    groundBlocks: PlacedObject[];
    collectibles: PlacedObject[];
    interactibles: PlacedObject[];
    plannedSolution: PlannedSolution;
    success: boolean;
    errors: string[];
}

/**
 * Direction utilities
 */
const DIRECTION_DELTAS: Record<string, { dx: number; dz: number }> = {
    'north': { dx: 0, dz: -1 },
    'east': { dx: 1, dz: 0 },
    'south': { dx: 0, dz: 1 },
    'west': { dx: -1, dz: 0 }
};

const DIRECTION_ORDER = ['north', 'east', 'south', 'west'];

function getDirection(from: Coord, to: Coord): string {
    const dx = Math.sign(to[0] - from[0]);
    const dz = Math.sign(to[2] - from[2]);
    if (dz < 0) return 'north';
    if (dz > 0) return 'south';
    if (dx > 0) return 'east';
    if (dx < 0) return 'west';
    return 'none';
}

function getTurnAction(fromDir: string, toDir: string): string[] {
    const fromIdx = DIRECTION_ORDER.indexOf(fromDir);
    const toIdx = DIRECTION_ORDER.indexOf(toDir);
    if (fromIdx === -1 || toIdx === -1) return [];
    
    const diff = (toIdx - fromIdx + 4) % 4;
    if (diff === 0) return [];
    if (diff === 1) return ['turnRight'];
    if (diff === 3) return ['turnLeft'];
    if (diff === 2) return ['turnRight', 'turnRight'];
    return [];
}

/**
 * Solution-First Placer
 */
export class SolutionFirstPlacer {
    private patternLibrary = getPatternLibrary();
    
    /**
     * Main entry: Plan solution using pattern matching, then place map elements
     */
    generateMap(
        topology: {
            type: string;
            structure: Coord[];  // Available walkable positions
            semanticPositions?: Record<string, Coord>;
            segments?: Coord[][];
        },
        academicConfig: AcademicConfig,
        assetMap: Map<string, BuildableAsset>
    ): PlacementResult {
        console.log(`[SolutionFirstPlacer] Planning for ${topology.type}, logic: ${academicConfig.logic_type}`);
        
        try {
            // ================================================================
            // PHASE 1: PATTERN-BASED PLANNING
            // ================================================================
            const plannedSolution = this.planSolutionWithPatterns(topology, academicConfig);
            
            if (!plannedSolution.path.length) {
                return this.errorResult('Planning failed: no path generated');
            }
            
            console.log(`[SolutionFirstPlacer] Planned: ${plannedSolution.path.length} steps, ` +
                `${plannedSolution.itemPlacements.length} items, ` +
                `${plannedSolution.patternMatches.length} patterns used`);
            
            // ================================================================
            // PHASE 2: PLACEMENT - Build map according to plan
            // ================================================================
            const result = this.placeMapElements(plannedSolution, assetMap);
            
            return result;
            
        } catch (error) {
            console.error('[SolutionFirstPlacer] Error:', error);
            return this.errorResult(`Planning error: ${error}`);
        }
    }
    
    /**
     * PHASE 1: Plan solution using pattern matching
     * 
     * Flow:
     * 1. Get segments from topology (or create single segment from structure)
     * 2. For each segment, match best pattern
     * 3. Pattern provides: expected_actions + item_offsets
     * 4. Place items at offsets, collect all actions
     */
    private planSolutionWithPatterns(
        topology: { 
            type: string;
            structure: Coord[];
            semanticPositions?: Record<string, Coord>;
            segments?: Coord[][];
        },
        config: AcademicConfig
    ): PlannedSolution {
        const { logic_type } = config;
        
        // 1. Get or create segments
        let segments = topology.segments || [];
        if (!segments.length) {
            // Create single segment from structure
            segments = [topology.structure];
        }
        
        // 2. Match patterns to segments
        const patternMatches = this.matchPatternsToSegments(segments, logic_type);
        
        // 3. Build path from segments (walkable order)
        const path = this.buildPathFromSegments(segments, topology.structure);
        
        // 4. Collect all actions and item placements from patterns
        const { rawActions, itemPlacements } = this.combinePatternResults(
            patternMatches, 
            segments,
            path
        );
        
        // 5. Use Synthesizer to create structured solution
        const synthesizer = getSynthesizerRegistry();
        const world = {
            available_blocks: this.getAvailableBlocks(logic_type),
            solution_config: { 
                logic_type, 
                force_function: config.force_function,
                force_loop: config.force_loop
            }
        };
        const structuredSolution = synthesizer.synthesize(rawActions, world);
        
        // 6. Collect pattern IDs for display
        const detectedPatterns = patternMatches.map(pm => pm.pattern.id);
        
        return {
            path,
            rawActions,
            structuredSolution,
            itemPlacements,
            patternMatches,
            metadata: {
                logic_type,
                optimal_blocks: this.countBlocks(structuredSolution),
                path_length: path.length,
                planning_strategy: this.getPlanningStrategy(logic_type),
                detected_patterns: detectedPatterns
            }
        };
    }
    
    /**
     * Match patterns to each segment
     */
    private matchPatternsToSegments(
        segments: Coord[][],
        logicType: string
    ): PatternMatch[] {
        const matches: PatternMatch[] = [];
        const availablePatterns = this.patternLibrary.getPatterns(logicType);
        
        for (let segIdx = 0; segIdx < segments.length; segIdx++) {
            const segment = segments[segIdx];
            const segmentLength = segment.length;
            
            // Filter patterns by segment length
            let validPatterns = this.patternLibrary.filterBySegmentLength(
                availablePatterns, 
                segmentLength
            );
            
            // Select best pattern
            const pattern = validPatterns.length > 0
                ? this.patternLibrary.selectBestPattern(validPatterns, segmentLength)
                : FALLBACK_PATTERN;
            
            // Calculate item placements for this segment
            const itemPlacements = this.calculateItemPlacements(segment, pattern, segIdx);
            
            // Calculate expected actions for this segment
            const expectedActions = this.calculateExpectedActions(
                segment, 
                pattern, 
                itemPlacements,
                segIdx > 0 ? segments[segIdx - 1] : null
            );
            
            matches.push({
                segment_index: segIdx,
                pattern,
                segment_coords: segment,
                expected_actions: expectedActions,
                item_placements: itemPlacements
            });
            
            console.log(`[SolutionFirstPlacer] Segment ${segIdx}: len=${segmentLength}, pattern=${pattern.id}`);
        }
        
        return matches;
    }
    
    /**
     * Calculate item placements from pattern offsets
     */
    private calculateItemPlacements(
        segment: Coord[],
        pattern: Pattern,
        segmentIndex: number
    ): ItemPlacement[] {
        const placements: ItemPlacement[] = [];
        
        for (let i = 0; i < pattern.item_coord_offsets.length; i++) {
            const offset = pattern.item_coord_offsets[i];
            
            // Ensure offset is within segment
            if (offset >= 0 && offset < segment.length) {
                const coord = segment[offset];
                const itemType = pattern.item_types[i] || 'crystal';
                
                placements.push({
                    type: itemType as 'crystal' | 'switch' | 'gem',
                    position: [coord[0], coord[1] + 1, coord[2]], // Y+1 above ground
                    action: itemType === 'switch' ? 'toggle' : 'collect',
                    step_index: offset,
                    pattern_id: pattern.id
                });
            }
        }
        
        return placements;
    }
    
    /**
     * Calculate expected actions from pattern + segment
     * Includes turns when direction changes
     */
    private calculateExpectedActions(
        segment: Coord[],
        pattern: Pattern,
        itemPlacements: ItemPlacement[],
        previousSegment: Coord[] | null
    ): string[] {
        const actions: string[] = [];
        
        // Determine initial direction
        let currentDir = 'south'; // Default
        if (previousSegment && previousSegment.length >= 2) {
            const lastCoord = previousSegment[previousSegment.length - 1];
            currentDir = getDirection(previousSegment[previousSegment.length - 2], lastCoord);
        }
        
        // Map offset -> action
        const offsetActions = new Map<number, string>();
        for (const placement of itemPlacements) {
            if (placement.action === 'collect') {
                offsetActions.set(placement.step_index, 'collect');
            } else if (placement.action === 'toggle') {
                offsetActions.set(placement.step_index, 'toggleSwitch');
            }
        }
        
        // Walk through segment
        for (let i = 1; i < segment.length; i++) {
            const prev = segment[i - 1];
            const curr = segment[i];
            
            // Calculate direction
            const moveDir = getDirection(prev, curr);
            
            // Add turns if needed
            if (moveDir !== 'none' && moveDir !== currentDir) {
                const turns = getTurnAction(currentDir, moveDir);
                actions.push(...turns);
                currentDir = moveDir;
            }
            
            // Move forward
            actions.push('moveForward');
            
            // Add interaction if item at this position
            const interaction = offsetActions.get(i);
            if (interaction) {
                actions.push(interaction);
            }
        }
        
        return actions;
    }
    
    /**
     * Build walkable path from segments
     */
    private buildPathFromSegments(segments: Coord[][], structure: Coord[]): Coord[] {
        const path: Coord[] = [];
        const seen = new Set<string>();
        
        for (const segment of segments) {
            for (const coord of segment) {
                const key = `${coord[0]},${coord[1]},${coord[2]}`;
                if (!seen.has(key)) {
                    path.push(coord);
                    seen.add(key);
                }
            }
        }
        
        // If no segments, use structure
        if (path.length === 0) {
            return structure;
        }
        
        return path;
    }
    
    /**
     * Combine all pattern results into final solution
     * 
     * KEY FIX: Generate rawActions from the full walkable PATH (includes backtracking)
     * instead of concatenating pattern expected_actions (which don't include backtrack)
     */
    private combinePatternResults(
        patternMatches: PatternMatch[],
        segments: Coord[][],
        path: Coord[]
    ): { rawActions: string[]; itemPlacements: ItemPlacement[] } {
        // 1. Collect all item placements from patterns
        const itemPlacements: ItemPlacement[] = [];
        
        for (const match of patternMatches) {
            for (const placement of match.item_placements) {
                itemPlacements.push(placement);
            }
        }
        
        // 2. Build map of positions with items for quick lookup
        const itemPositionMap = new Map<string, ItemPlacement>();
        for (const placement of itemPlacements) {
            // Item position is at Y+1 above ground, so ground position is Y-1
            const groundPos: Coord = [placement.position[0], placement.position[1] - 1, placement.position[2]];
            const key = `${groundPos[0]},${groundPos[1]},${groundPos[2]}`;
            itemPositionMap.set(key, placement);
        }
        
        // 3. Generate rawActions by walking through the FULL path
        //    This correctly handles backtracking, turns, etc.
        const rawActions: string[] = [];
        let currentDir = 'south'; // Default facing direction
        
        for (let i = 1; i < path.length; i++) {
            const prev = path[i - 1];
            const curr = path[i];
            
            // Calculate direction of movement
            const moveDir = getDirection(prev, curr);
            
            // Add turns if direction changed
            if (moveDir !== 'none' && moveDir !== currentDir) {
                const turns = getTurnAction(currentDir, moveDir);
                rawActions.push(...turns);
                currentDir = moveDir;
            }
            
            // Move forward
            rawActions.push('moveForward');
            
            // Check if current position has an item
            const currKey = `${curr[0]},${curr[1]},${curr[2]}`;
            const item = itemPositionMap.get(currKey);
            if (item) {
                if (item.action === 'collect') {
                    rawActions.push('collect');
                } else if (item.action === 'toggle') {
                    rawActions.push('toggleSwitch');
                }
                // Remove from map so we don't collect same item twice when backtracking
                itemPositionMap.delete(currKey);
            }
        }
        
        // 4. Add goal at end of path
        if (path.length > 0) {
            const lastCoord = path[path.length - 1];
            itemPlacements.push({
                type: 'goal',
                position: [lastCoord[0], lastCoord[1] + 1, lastCoord[2]],
                action: 'reach',
                step_index: path.length - 1
            });
        }
        
        return { rawActions, itemPlacements };
    }
    
    /**
     * Get available blocks based on logic type
     */
    private getAvailableBlocks(logicType: string): Set<string> {
        const blocks = new Set(['maze_moveForward', 'maze_turn', 'maze_collect']);
        
        if (logicType === 'loop_logic' || logicType === 'function_logic') {
            blocks.add('maze_repeat');
        }
        
        if (logicType === 'function_logic') {
            blocks.add('PROCEDURE');
        }
        
        if (logicType === 'while_loop_logic') {
            blocks.add('maze_forever');
            blocks.add('maze_ifCondition');
        }
        
        return blocks;
    }
    
    /**
     * Count total blocks in structured solution
     */
    private countBlocks(solution: SynthesisResult): number {
        let count = 0;
        
        const countInArray = (arr: any[]): number => {
            let c = 0;
            for (const item of arr) {
                c++;
                if (item.body) c += countInArray(item.body);
                if (item.actions) c += countInArray(item.actions);
            }
            return c;
        };
        
        count += countInArray(solution.main);
        for (const proc of Object.values(solution.procedures)) {
            count += countInArray(proc);
        }
        
        return count;
    }
    
    /**
     * Get planning strategy name
     */
    private getPlanningStrategy(logicType: string): string {
        switch (logicType) {
            case 'function_logic': return 'pattern_function_reuse';
            case 'loop_logic': return 'pattern_repeat';
            case 'while_loop_logic': return 'pattern_while_condition';
            case 'conditional': return 'pattern_conditional_branch';
            default: return 'pattern_sequential';
        }
    }
    
    /**
     * PHASE 2: Place map elements according to plan
     */
    private placeMapElements(
        solution: PlannedSolution,
        assetMap: Map<string, BuildableAsset>
    ): PlacementResult {
        const groundBlocks: PlacedObject[] = [];
        const collectibles: PlacedObject[] = [];
        const interactibles: PlacedObject[] = [];
        
        // 1. Place ground blocks along path
        const groundAsset = this.findAsset('ground', assetMap) || this.findAsset('block', assetMap);
        if (groundAsset) {
            for (const coord of solution.path) {
                groundBlocks.push({
                    id: uuidv4(),
                    asset: groundAsset,
                    position: coord,
                    rotation: [0, 0, 0],
                    properties: {}
                });
            }
        }
        
        // 2. Place items at planned positions
        for (const placement of solution.itemPlacements) {
            if (placement.type === 'goal') continue; // Skip goal, handled elsewhere
            
            const asset = this.findAsset(placement.type, assetMap);
            if (!asset) {
                console.warn(`[SolutionFirstPlacer] Asset not found: ${placement.type}`);
                continue;
            }
            
            const placedObj: PlacedObject = {
                id: uuidv4(),
                asset,
                position: placement.position,
                rotation: [0, 0, 0],
                properties: { pattern_id: placement.pattern_id }
            };
            
            if (asset.type === 'collectible') {
                collectibles.push(placedObj);
            } else if (asset.type === 'interactible') {
                interactibles.push(placedObj);
            }
        }
        
        return {
            groundBlocks,
            collectibles,
            interactibles,
            plannedSolution: solution,
            success: true,
            errors: []
        };
    }
    
    /**
     * Find asset in asset map
     */
    private findAsset(itemType: string, assetMap: Map<string, BuildableAsset>): BuildableAsset | null {
        // Direct lookup
        if (assetMap.has(itemType)) return assetMap.get(itemType)!;
        
        // Case-insensitive
        const lower = itemType.toLowerCase();
        for (const [key, asset] of assetMap) {
            if (key.toLowerCase() === lower) return asset;
        }
        
        // Partial match
        for (const [key, asset] of assetMap) {
            if (key.toLowerCase().includes(lower)) return asset;
        }
        
        return null;
    }
    
    /**
     * Create error result
     */
    private errorResult(message: string): PlacementResult {
        return {
            groundBlocks: [],
            collectibles: [],
            interactibles: [],
            plannedSolution: {
                path: [],
                rawActions: [],
                structuredSolution: { main: [], procedures: {} },
                itemPlacements: [],
                patternMatches: [],
                metadata: {
                    logic_type: 'error',
                    optimal_blocks: 0,
                    path_length: 0,
                    planning_strategy: 'none',
                    detected_patterns: []
                }
            },
            success: false,
            errors: [message]
        };
    }
}

// Singleton
let instance: SolutionFirstPlacer | null = null;

export function getSolutionFirstPlacer(): SolutionFirstPlacer {
    if (!instance) {
        instance = new SolutionFirstPlacer();
    }
    return instance;
}

export default SolutionFirstPlacer;
