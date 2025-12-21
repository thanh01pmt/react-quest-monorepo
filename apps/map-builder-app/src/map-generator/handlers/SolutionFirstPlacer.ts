/**
 * Solution-First Placer (Refactored)
 * 
 * ARCHITECTURE:
 * ============
 * 1. PLANNING PHASE (Create solution first)
 *    - Analyze topology structure + academic requirements
 *    - Determine optimal academic start point
 *    - Generate algorithm with patterns (loops, functions)
 *    - Decompose into basic actions (moveForward, turnLeft, collect, etc.)
 *    - Output: Optimal Path + Actions sequence + Item positions
 * 
 * 2. PLACEMENT PHASE (Build map according to solution)
 *    - Place ground blocks along planned path
 *    - Place items (crystal, switch) at planned positions
 *    - Items are "just enough" - exact count per requirements
 * 
 * The solution is "optimal" because we create the solution FIRST,
 * then create the map to match it.
 * 
 * This is different from:
 * - Solver: Post-solve verification after map is created
 * - Synthesizer: Optimize raw actions into structured blocks
 */

import { IPathInfo, Coord } from '../types';
import { PlacedObject, BuildableAsset } from '../../types';
import { v4 as uuidv4 } from 'uuid';
import { getSynthesizerRegistry, SynthesisResult } from '../synthesizers';

// Academic configuration
export interface AcademicConfig {
    logic_type: 'function_logic' | 'loop_logic' | 'sequencing' | 'conditional';
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
    // Metadata
    metadata: {
        logic_type: string;
        optimal_blocks: number;
        path_length: number;
        planning_strategy: string;
    };
}

export interface ItemPlacement {
    type: 'crystal' | 'switch' | 'gem' | 'goal';
    position: Coord;
    action: 'collect' | 'toggle' | 'reach';
    step_index: number;  // Which step in the path
}

export interface PlacementResult {
    // Ground blocks to place
    groundBlocks: PlacedObject[];
    // Collectible items
    collectibles: PlacedObject[];
    // Interactible items
    interactibles: PlacedObject[];
    // The planned solution
    plannedSolution: PlannedSolution;
    // Whether planning succeeded
    success: boolean;
    errors: string[];
}

/**
 * Direction utilities
 */
const DIRECTIONS = {
    NORTH: { dx: 0, dz: -1, name: 'north' },  // -Z
    EAST: { dx: 1, dz: 0, name: 'east' },     // +X
    SOUTH: { dx: 0, dz: 1, name: 'south' },   // +Z
    WEST: { dx: -1, dz: 0, name: 'west' }     // -X
};

function getDirection(from: Coord, to: Coord): string {
    const dx = to[0] - from[0];
    const dz = to[2] - from[2];
    if (dz < 0) return 'north';
    if (dz > 0) return 'south';
    if (dx > 0) return 'east';
    if (dx < 0) return 'west';
    return 'none';
}

function getTurnAction(fromDir: string, toDir: string): string | null {
    const dirs = ['north', 'east', 'south', 'west'];
    const fromIdx = dirs.indexOf(fromDir);
    const toIdx = dirs.indexOf(toDir);
    if (fromIdx === -1 || toIdx === -1) return null;
    
    const diff = (toIdx - fromIdx + 4) % 4;
    if (diff === 1) return 'turnRight';
    if (diff === 3) return 'turnLeft';
    if (diff === 2) return 'turnRight'; // or turnLeft twice, use right
    return null;
}

/**
 * Solution-First Placer
 */
export class SolutionFirstPlacer {
    
    /**
     * Main entry: Plan solution first, then place map elements
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
            // PHASE 1: PLANNING - Create optimal solution
            // ================================================================
            const plannedSolution = this.planSolution(topology, academicConfig);
            
            if (!plannedSolution.path.length) {
                return this.errorResult('Planning failed: empty path');
            }
            
            console.log(`[SolutionFirstPlacer] Planned: ${plannedSolution.path.length} steps, ${plannedSolution.itemPlacements.length} items`);
            
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
     * PHASE 1: Plan the optimal solution
     */
    private planSolution(
        topology: { 
            type: string;
            structure: Coord[];
            semanticPositions?: Record<string, Coord>;
            segments?: Coord[][];
        },
        config: AcademicConfig
    ): PlannedSolution {
        const { logic_type, difficulty_code, item_goals } = config;
        
        // 1. Determine start and end points based on academic requirements
        const { start, end } = this.determineAcademicPositions(topology, logic_type);
        
        // 2. Plan the path through topology structure
        const path = this.planPath(topology, start, end, logic_type);
        
        // 3. Plan item placements along path
        const itemPlacements = this.planItemPlacements(path, item_goals, logic_type);
        
        // 4. Convert path to raw actions
        const rawActions = this.pathToRawActions(path, itemPlacements, start);
        
        // 5. Use Synthesizer to create structured solution
        const synthesizer = getSynthesizerRegistry();
        const world = {
            available_blocks: this.getAvailableBlocks(logic_type),
            solution_config: { logic_type, force_function: config.force_function }
        };
        const structuredSolution = synthesizer.synthesize(rawActions, world);
        
        return {
            path,
            rawActions,
            structuredSolution,
            itemPlacements,
            metadata: {
                logic_type,
                optimal_blocks: this.countBlocks(structuredSolution),
                path_length: path.length,
                planning_strategy: this.getPlanningStrategy(logic_type)
            }
        };
    }
    
    /**
     * Determine academic start/end based on logic type and topology
     */
    private determineAcademicPositions(
        topology: { type: string; structure: Coord[]; semanticPositions?: Record<string, Coord>; segments?: Coord[][] },
        logicType: string
    ): { start: Coord; end: Coord } {
        const semantic = topology.semanticPositions || {};
        
        // Use semantic positions if available
        if (semantic.optimal_start && semantic.optimal_end) {
            const startKey = semantic.optimal_start as unknown as string;
            const endKey = semantic.optimal_end as unknown as string;
            if (semantic[startKey] && semantic[endKey]) {
                return { start: semantic[startKey], end: semantic[endKey] };
            }
        }
        
        // For function_logic: prefer positions that allow reusable patterns
        if (logicType === 'function_logic' && topology.segments?.length && topology.segments.length >= 2) {
            // Start at beginning of first segment, end at end of last segment
            const firstSeg = topology.segments[0];
            const lastSeg = topology.segments[topology.segments.length - 1];
            return {
                start: firstSeg[0],
                end: lastSeg[lastSeg.length - 1]
            };
        }
        
        // Default: use first and last positions in structure
        if (topology.structure.length >= 2) {
            return {
                start: topology.structure[0],
                end: topology.structure[topology.structure.length - 1]
            };
        }
        
        // Fallback
        return {
            start: [0, 0, 0],
            end: [0, 0, 1]
        };
    }
    
    /**
     * Plan path through topology based on logic type
     */
    private planPath(
        topology: { type: string; structure: Coord[]; segments?: Coord[][] },
        start: Coord,
        end: Coord,
        logicType: string
    ): Coord[] {
        // For topologies with explicit segments, use them to build path
        if (topology.segments?.length) {
            return this.planPathThroughSegments(topology.segments, start, end, logicType);
        }
        
        // Otherwise use the structure directly
        return this.planPathThroughStructure(topology.structure, start, end);
    }
    
    /**
     * Plan path through segments - respects segment boundaries for pattern matching
     */
    private planPathThroughSegments(
        segments: Coord[][],
        start: Coord,
        end: Coord,
        logicType: string
    ): Coord[] {
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
        
        // For function_logic, try to order path to maximize pattern repetition
        if (logicType === 'function_logic') {
            return this.optimizePathForFunctions(path, segments);
        }
        
        return path;
    }
    
    /**
     * Plan path through flat structure
     */
    private planPathThroughStructure(structure: Coord[], start: Coord, end: Coord): Coord[] {
        // Simple: use structure as-is if starts with start
        if (this.coordsEqual(structure[0], start)) {
            return [...structure];
        }
        
        // Otherwise, BFS to find path
        return this.bfsPath(structure, start, end);
    }
    
    /**
     * BFS pathfinding
     */
    private bfsPath(walkable: Coord[], start: Coord, end: Coord): Coord[] {
        const walkableSet = new Set(walkable.map(c => `${c[0]},${c[1]},${c[2]}`));
        const startKey = `${start[0]},${start[1]},${start[2]}`;
        const endKey = `${end[0]},${end[1]},${end[2]}`;
        
        const queue: { pos: Coord; path: Coord[] }[] = [{ pos: start, path: [start] }];
        const visited = new Set([startKey]);
        
        while (queue.length > 0) {
            const { pos, path } = queue.shift()!;
            const posKey = `${pos[0]},${pos[1]},${pos[2]}`;
            
            if (posKey === endKey) {
                return path;
            }
            
            // Check neighbors
            for (const [dx, dy, dz] of [[1,0,0], [-1,0,0], [0,0,1], [0,0,-1], [0,1,0], [0,-1,0]]) {
                const neighbor: Coord = [pos[0] + dx, pos[1] + dy, pos[2] + dz];
                const nKey = `${neighbor[0]},${neighbor[1]},${neighbor[2]}`;
                
                if (!visited.has(nKey) && walkableSet.has(nKey)) {
                    visited.add(nKey);
                    queue.push({ pos: neighbor, path: [...path, neighbor] });
                }
            }
        }
        
        // Fallback: return start only
        console.warn('[SolutionFirstPlacer] BFS could not find path');
        return [start];
    }
    
    /**
     * Optimize path order for function_logic (maximize reusable patterns)
     */
    private optimizePathForFunctions(path: Coord[], segments: Coord[][]): Coord[] {
        // For function logic, we want segments traversed in order that creates patterns
        // This is already handled by segment order, so just return path as-is
        // Future: could reorder to maximize pattern repetition
        return path;
    }
    
    /**
     * Plan item placements along path
     */
    private planItemPlacements(
        path: Coord[],
        itemGoals: { crystal?: number; switch?: number; gem?: number },
        logicType: string
    ): ItemPlacement[] {
        const placements: ItemPlacement[] = [];
        const crystalCount = itemGoals.crystal || 0;
        const switchCount = itemGoals.switch || 0;
        const gemCount = itemGoals.gem || 0;
        const totalItems = crystalCount + switchCount + gemCount;
        
        if (totalItems === 0 || path.length < 3) {
            return placements;
        }
        
        // Calculate spacing for even distribution
        const availableSteps = path.length - 2; // Exclude start and end
        const spacing = Math.floor(availableSteps / totalItems);
        
        let currentStep = Math.max(1, spacing);
        
        // Place crystals
        for (let i = 0; i < crystalCount && currentStep < path.length - 1; i++) {
            placements.push({
                type: 'crystal',
                position: [path[currentStep][0], path[currentStep][1] + 1, path[currentStep][2]], // Y+1 above ground
                action: 'collect',
                step_index: currentStep
            });
            currentStep += spacing || 2;
        }
        
        // Place switches
        for (let i = 0; i < switchCount && currentStep < path.length - 1; i++) {
            placements.push({
                type: 'switch',
                position: [path[currentStep][0], path[currentStep][1] + 1, path[currentStep][2]],
                action: 'toggle',
                step_index: currentStep
            });
            currentStep += spacing || 2;
        }
        
        // Place gems
        for (let i = 0; i < gemCount && currentStep < path.length - 1; i++) {
            placements.push({
                type: 'gem',
                position: [path[currentStep][0], path[currentStep][1] + 1, path[currentStep][2]],
                action: 'collect',
                step_index: currentStep
            });
            currentStep += spacing || 2;
        }
        
        // Add goal at end
        placements.push({
            type: 'goal',
            position: [path[path.length - 1][0], path[path.length - 1][1] + 1, path[path.length - 1][2]],
            action: 'reach',
            step_index: path.length - 1
        });
        
        return placements;
    }
    
    /**
     * Convert path to raw action sequence
     */
    private pathToRawActions(
        path: Coord[],
        itemPlacements: ItemPlacement[],
        start: Coord
    ): string[] {
        const actions: string[] = [];
        let currentDir = 'south'; // Default facing +Z
        
        // Create a map of step_index -> action
        const stepActions = new Map<number, string>();
        for (const placement of itemPlacements) {
            if (placement.action === 'collect') {
                stepActions.set(placement.step_index, 'collect');
            } else if (placement.action === 'toggle') {
                stepActions.set(placement.step_index, 'toggleSwitch');
            }
        }
        
        for (let i = 1; i < path.length; i++) {
            const prev = path[i - 1];
            const curr = path[i];
            
            // Determine direction of movement
            const moveDir = getDirection(prev, curr);
            
            // Turn if needed
            if (moveDir !== currentDir && moveDir !== 'none') {
                const turn = getTurnAction(currentDir, moveDir);
                if (turn) {
                    // May need multiple turns
                    if (turn === 'turnRight' || turn === 'turnLeft') {
                        actions.push(turn);
                        currentDir = moveDir;
                    }
                }
            }
            
            // Move forward
            actions.push('moveForward');
            
            // Interact if there's an item at this step
            const interaction = stepActions.get(i);
            if (interaction) {
                actions.push(interaction);
            }
        }
        
        return actions;
    }
    
    /**
     * Get available blocks based on logic type
     */
    private getAvailableBlocks(logicType: string): Set<string> {
        const blocks = new Set(['maze_moveForward', 'maze_turn']);
        
        if (logicType === 'loop_logic' || logicType === 'function_logic') {
            blocks.add('maze_repeat');
        }
        
        if (logicType === 'function_logic') {
            blocks.add('PROCEDURE');
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
            case 'function_logic': return 'function_reuse_pattern';
            case 'loop_logic': return 'repeat_pattern';
            default: return 'sequential';
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
                properties: {}
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
     * Check coordinate equality
     */
    private coordsEqual(a: Coord, b: Coord): boolean {
        return a[0] === b[0] && a[1] === b[1] && a[2] === b[2];
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
                metadata: {
                    logic_type: 'error',
                    optimal_blocks: 0,
                    path_length: 0,
                    planning_strategy: 'none'
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
