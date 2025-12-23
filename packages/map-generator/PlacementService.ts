import { PlacedObject, BuildableAsset } from '../../apps/map-builder-app/src/types';
import { BaseTopology } from './topologies/BaseTopology';
import { IPathInfo, Coord } from './types';
import { v4 as uuidv4 } from 'uuid';
import { 
    PedagogyStrategy, 
    DensityMode, 
    AcademicParams, 
    ItemGoals,
    StrategyConfig 
} from './strategies/types';
import { getStrategyRegistry } from './strategies/StrategyRegistry';
import { 
    getSemanticPositionHandler, 
    getPedagogicalStrategyHandler,
    getStrategySelector,
    getSolutionFirstPlacer
} from './handlers';
import { PlannedSolution } from './handlers/SolutionFirstPlacer';

// Re-export for backward compatibility
export { PedagogyStrategy } from './strategies/types';

export interface PlacementConfig {
    topology: BaseTopology;
    params: Record<string, any>;
    strategy: PedagogyStrategy;
    difficulty: 'intro' | 'simple' | 'complex';
    assetMap: Map<string, BuildableAsset>;
    // New fields
    densityMode?: DensityMode;
    academicParams?: AcademicParams;
    itemGoals?: ItemGoals;
    // Enable Solution-First placement approach
    useSolutionFirst?: boolean;
}

export class PlacementService {
    
    /**
     * Main entry point to generate a map with specific pedagogical considerations.
     */
    public async generateMap(config: PlacementConfig): Promise<{ 
        objects: PlacedObject[], 
        pathInfo: IPathInfo,
        plannedSolution?: PlannedSolution 
    }> {
        const { topology, params, strategy, difficulty, assetMap } = config;

        // DYNAMIC ASSET LOOKUP
        // Helper to find valid asset key if default missing
        const findAssetKey = (prefix: string, defaultKey: string): string => {
             if (assetMap.has(defaultKey)) return defaultKey;
             const lowerPrefix = prefix.toLowerCase();
             for (const key of assetMap.keys()) {
                 if (key.toLowerCase().includes(lowerPrefix)) return key;
             }
             // Last resort: find ANY block if looking for ground/wall
             if (lowerPrefix.includes('ground') || lowerPrefix.includes('wall')) {
                 for (const [key, asset] of assetMap.entries()) {
                     if (asset.type === 'block') return key;
                 }
             }
             console.warn(`[PlacementService] Could not find asset with prefix ${prefix}, defaulting to ${defaultKey}`);
             return defaultKey; 
        };

        const groundKey = findAssetKey('ground.', 'ground.checker');
        const wallKey = findAssetKey('wall.', 'wall.brick02');
        console.log(`[PlacementService] Asset Lookup -> Ground: ${groundKey} (Found: ${assetMap.has(groundKey)}), Wall: ${wallKey} (Found: ${assetMap.has(wallKey)})`);

        // 1. Generate Base Geometry (Ground & Walls) from Topology
        const gridSize: [number, number, number] = [20, 10, 20]; // Default grid size, maybe pass in config?
        const pathInfo = topology.generatePathInfo(gridSize, params); 
        
        // DEBUG: Log pathInfo
        console.log(`[PlacementService] PathInfo generated:`, {
            path_coords_count: pathInfo.path_coords?.length || 0,
            placement_coords_count: pathInfo.placement_coords?.length || 0,
            start_pos: pathInfo.start_pos,
            target_pos: pathInfo.target_pos,
            metadata: pathInfo.metadata
        });
        
        // Convert pathInfo coords to Ground/Wall Objects
        let objects: PlacedObject[] = [];
        
        // Helper to add object
        const addObj = (pos: Coord, assetKey: string, type: 'ground' | 'wall' | 'item' = 'ground') => {
             let asset = assetMap.get(assetKey);
             if (!asset) {
                 // FALLBACK: Create a placeholder asset on the fly
                 // This ensures the map is not empty even if assets are missing
                 console.warn(`[PlacementService] Creating placeholder for missing asset: ${assetKey}`);
                 asset = {
                    key: assetKey,
                    name: `Placeholder (${assetKey})`,
                    type: type === 'wall' ? 'block' : (type === 'ground' ? 'block' : 'collectible'),
                    primitiveShape: 'box', 
                    defaultProperties: { color: type === 'wall' ? '#888888' : (type === 'item' ? '#ff00ff' : '#22aa22') },
                    thumbnail: '/assets/ui/unknown.png'
                 } as BuildableAsset;
             }
             if (asset) {
                // FIX: Items should be placed ON TOP of ground (y+1), not inside it
                const adjustedPos: Coord = type === 'item' 
                    ? [pos[0], pos[1] + 1, pos[2]]  // Raise items by 1 level
                    : pos;
                    
                objects.push({
                    id: uuidv4(),
                    position: adjustedPos,
                    rotation: [0, 0, 0],
                    asset: asset,
                    properties: { ...asset.defaultProperties }
                });
             }
        };

        // Render Ground
        // Use placement_coords as the full walkable area (these are the ground tiles)
        // path_coords represents the solution path, but all placement_coords should be ground
        
        // Create a Set for quick lookup of placement coords
        const placementSet = new Set<string>();
        if (pathInfo.placement_coords && pathInfo.placement_coords.length > 0) {
            pathInfo.placement_coords.forEach((c: Coord) => {
                placementSet.add(`${c[0]},${c[1]},${c[2]}`);
            });
        }
        
        // A. Render Ground for all placement_coords (if available)
        // This is the main walkable area of the map
        if (pathInfo.placement_coords && pathInfo.placement_coords.length > 0) {
            pathInfo.placement_coords.forEach((c: Coord) => addObj(c, groundKey));
        } else {
            // Fallback: Use path_coords as ground if no placement_coords
            pathInfo.path_coords.forEach((c: Coord) => addObj(c, groundKey));
        }
        
        
        // B. Wall Border Generation - DISABLED
        // Uncomment below if you want walls around the map perimeter
        /*
        // Calculate bounding box of placement/path coords
        const allCoords = pathInfo.placement_coords && pathInfo.placement_coords.length > 0 
            ? pathInfo.placement_coords 
            : pathInfo.path_coords;
        
        if (allCoords.length > 0) {
            let minX = Infinity, maxX = -Infinity;
            let minZ = Infinity, maxZ = -Infinity;
            
            allCoords.forEach((c: Coord) => {
                minX = Math.min(minX, c[0]);
                maxX = Math.max(maxX, c[0]);
                minZ = Math.min(minZ, c[2]);
                maxZ = Math.max(maxZ, c[2]);
            });
            
            // Add wall blocks around the perimeter (one tile outside the bounding box)
            const wallY = 1; // Walls are one level above ground
            
            // Top and bottom walls
            for (let x = minX - 1; x <= maxX + 1; x++) {
                const topPos: Coord = [x, wallY, minZ - 1];
                const bottomPos: Coord = [x, wallY, maxZ + 1];
                // Only add if not overlapping with placement area
                if (!placementSet.has(`${topPos[0]},0,${topPos[2]}`)) {
                    addObj(topPos, wallKey, 'wall');
                }
                if (!placementSet.has(`${bottomPos[0]},0,${bottomPos[2]}`)) {
                    addObj(bottomPos, wallKey, 'wall');
                }
            }
            
            // Left and right walls (excluding corners already added)
            for (let z = minZ; z <= maxZ; z++) {
                const leftPos: Coord = [minX - 1, wallY, z];
                const rightPos: Coord = [maxX + 1, wallY, z];
                if (!placementSet.has(`${leftPos[0]},0,${leftPos[2]}`)) {
                    addObj(leftPos, wallKey, 'wall');
                }
                if (!placementSet.has(`${rightPos[0]},0,${rightPos[2]}`)) {
                    addObj(rightPos, wallKey, 'wall');
                }
            }
        }
        */
        
        // C. Render Obstacles from pathInfo
        pathInfo.obstacles.forEach((obs: any) => {
             addObj(obs.pos, wallKey, 'wall'); // Use dynamic wall key
        });

        // 2. Apply Pedagogy Strategy
        // Track plannedSolution for return
        let plannedSolution: PlannedSolution | undefined;
        
        // PRIORITY 1: Use SolutionFirstPlacer by default (Solution-First architecture)
        // This generates a planned solution FIRST, then places elements according to that plan.
        const useSolutionFirst = config.useSolutionFirst !== false; // Default to TRUE
        
        if (useSolutionFirst) {
            console.log(`[PlacementService] Using SolutionFirstPlacer (priority: solution-first)`);
            const solutionPlacer = getSolutionFirstPlacer();
            
            // Build topology structure for placer
            const topologyInfo = {
                type: pathInfo.metadata?.topology_type || 'unknown',
                structure: pathInfo.path_coords,
                semanticPositions: pathInfo.metadata?.semantic_positions,
                segments: pathInfo.metadata?.segments
            };
            
            // Map strategy to logic_type
            const logicTypeMap: Record<string, 'function_logic' | 'loop_logic' | 'sequencing' | 'conditional'> = {
                [PedagogyStrategy.FUNCTION_LOGIC]: 'function_logic',
                [PedagogyStrategy.LOOP_LOGIC]: 'loop_logic',
                [PedagogyStrategy.CONDITIONAL_BRANCHING]: 'conditional',
                [PedagogyStrategy.NONE]: 'sequencing'
            };
            
            // Build item goals from config
            const itemGoalsConfig = config.itemGoals?.items_to_place?.reduce((acc, item) => {
                acc[item.type] = item.count;
                return acc;
            }, {} as Record<string, number>) || { crystal: 3 };
            
            // Build academic config for SolutionFirstPlacer
            const academicConfig = {
                logic_type: logicTypeMap[strategy] || 'sequencing',
                difficulty_code: (config.academicParams?.difficulty_code || 'MEDIUM') as 'EASY' | 'MEDIUM' | 'HARD',
                item_goals: itemGoalsConfig,
                force_function: strategy === PedagogyStrategy.FUNCTION_LOGIC
            };
            
            const placementResult = solutionPlacer.generateMap(
                topologyInfo,
                academicConfig,
                assetMap
            );
            
            if (placementResult.success) {
                // Save plannedSolution
                plannedSolution = placementResult.plannedSolution;
                
                // Add ground blocks (only if not already placed)
                if (placementResult.groundBlocks) {
                    placementResult.groundBlocks.forEach((obj: PlacedObject) => {
                        if (!objects.some(o => 
                            o.position[0] === obj.position[0] && 
                            o.position[1] === obj.position[1] && 
                            o.position[2] === obj.position[2]
                        )) {
                            objects.push(obj);
                        }
                    });
                }
                
                // Add collectibles
                if (placementResult.collectibles) {
                    placementResult.collectibles.forEach((obj: PlacedObject) => {
                        if (!objects.some(o => o.id === obj.id)) {
                            objects.push(obj);
                        }
                    });
                }
                
                // Add interactibles
                if (placementResult.interactibles) {
                    placementResult.interactibles.forEach((obj: PlacedObject) => {
                        if (!objects.some(o => o.id === obj.id)) {
                            objects.push(obj);
                        }
                    });
                }
                
                console.log(`[PlacementService] SolutionFirstPlacer: ${placementResult.plannedSolution?.path?.length || 0} path steps, ${placementResult.collectibles?.length || 0} collectibles`);
            } else {
                console.warn(`[PlacementService] SolutionFirstPlacer failed: ${placementResult.errors.join(', ')}`);
            }
        }
        // PRIORITY 2: Use StrategyRegistry if available
        else {
            const registry = getStrategyRegistry();
            
            // Check if strategy is supported by new registry
            if (registry.has(strategy)) {
                console.log(`[PlacementService] Using StrategyRegistry for ${strategy}`);
                const result = registry.applyStrategy(
                    strategy,
                    pathInfo,
                    assetMap,
                    difficulty,
                    objects,
                    config.academicParams
                );
                // Merge result objects (items placed by strategy)
                result.objects.forEach(obj => {
                    // Only add if not already in objects (avoid duplicates)
                    if (!objects.some(o => o.id === obj.id)) {
                        objects.push(obj);
                    }
                });
                console.log(`[PlacementService] Strategy placed ${result.metadata.items_placed} items`);
            } else if (strategy === PedagogyStrategy.NONE) {
                // Legacy random placement
                this.applyRandomPlacement(objects, pathInfo, assetMap);
            } else {
                console.warn(`[PlacementService] Unknown strategy ${strategy}, using random placement`);
                this.applyRandomPlacement(objects, pathInfo, assetMap);
            }
        }

        // 3. Add Start/Finish
        if (pathInfo.start_pos) addObj(pathInfo.start_pos, 'player_start', 'item');
        if (pathInfo.target_pos) addObj(pathInfo.target_pos, 'finish', 'item');

        // DEBUG: Final object count
        console.log(`[PlacementService] FINAL: Created ${objects.length} objects`, {
            sample: objects.slice(0, 3).map(o => ({ pos: o.position, asset: o.asset.key }))
        });

        return { objects, pathInfo, plannedSolution };
    }

    private applyLoopLogic(objects: PlacedObject[], pathInfo: IPathInfo, assetMap: Map<string, BuildableAsset>, config: PlacementConfig) {
        console.log("Applying Loop Logic...");
        
        let segments: Coord[][] = pathInfo.metadata?.segments;
        console.log(`[applyLoopLogic] Metadata segments: ${segments ? segments.length : 'none'}`);
        
        if (!segments) {
            segments = this.computeSegments(pathInfo.path_coords);
            console.log(`[applyLoopLogic] Computed ${segments.length} segments from ${pathInfo.path_coords.length} path coords`);
            segments.forEach((seg, i) => console.log(`  Segment ${i}: length = ${seg.length}`));
        }
        
        this.applyLoopLogicInternal(objects, segments, assetMap, config.difficulty);
    }

    private applyFunctionLogic(objects: PlacedObject[], pathInfo: IPathInfo, assetMap: Map<string, BuildableAsset>, config?: PlacementConfig) {
         console.log("Applying Function Logic...");
         
         const branches: Coord[][] = pathInfo.metadata?.branches;
         if (branches && branches.length > 1) {
             // ... [Logic for branches stays specific here for now] ...
             // Reusing the internal method for the fallback part or implementing custom branch logic
             // Actually, for consistency, let's keep the branch specific logic here or move one day.
             // For now, let's just use the fallback part via internal method if branches fail, 
             // but `FunctionLogic` on topology is specific.
             
             // Define a pattern for the first branch
             const patternPoints: number[] = []; 
             const branchLen = branches[0].length;
             const complexity = config?.difficulty === 'complex' ? 0.7 : 0.3;
             
             for(let i=1; i<branchLen; i++) {
                 if (Math.random() < complexity) patternPoints.push(i);
             }

             // Apply pattern to ALL branches
             branches.forEach(branch => {
                 patternPoints.forEach(idx => {
                     if (idx < branch.length) {
                         this.addObject(objects, branch[idx], 'crystal', assetMap);
                     }
                 });
             });
         } else {
             // Fallback: Use internal function logic which finds segments by length
             let segments = pathInfo.metadata?.segments;
             if (!segments) segments = this.computeSegments(pathInfo.path_coords);
             
             this.applyFunctionLogicInternal(objects, segments, assetMap, config?.difficulty || 'simple');
         }
    }

    private computeSegments(pathCoords: Coord[]): Coord[][] {
        if (!pathCoords || pathCoords.length === 0) return [];
        const segments: Coord[][] = [];
        let currentSegment = [pathCoords[0]];
        
        if (pathCoords.length > 1) {
            let lastDiff: [number, number] = [
                pathCoords[1][0] - pathCoords[0][0],
                pathCoords[1][2] - pathCoords[0][2]
            ];
            
            for (let i=1; i<pathCoords.length; i++) {
                const curr = pathCoords[i];
                const prev = pathCoords[i-1];
                const currDiff: [number, number] = [curr[0] - prev[0], curr[2] - prev[2]];

                if (currDiff[0] === lastDiff[0] && currDiff[1] === lastDiff[1]) {
                    currentSegment.push(curr);
                } else {
                    segments.push(currentSegment);
                    currentSegment = [prev, curr];
                    lastDiff = currDiff;
                }
            }
            segments.push(currentSegment);
        } else {
            segments.push(currentSegment);
        }
        return segments;
    }

    private isOccupied(objects: PlacedObject[], pos: Coord): boolean {
        // Check at y+1 since items are placed above ground
        const itemY = pos[1] + 1;
        return objects.some(o => o.position[0] === pos[0] && o.position[1] === itemY && o.position[2] === pos[2] && (o.asset.type === 'collectible' || o.asset.type === 'interactible'));
    }

    private addObject(objects: PlacedObject[], pos: Coord, assetKey: string, assetMap: Map<string, BuildableAsset>) {
        const asset = assetMap.get(assetKey) || assetMap.get('crystal'); // Fallback
        if(asset) {
                // FIX: Items should be placed ON TOP of ground (y+1), not inside it
                const adjustedPos: Coord = [pos[0], pos[1] + 1, pos[2]];
                objects.push({
                    id: uuidv4(),
                    position: adjustedPos,
                    rotation: [0,0,0],
                    asset: asset,
                    properties: { ...asset.defaultProperties }
                });
        }
    }

    /**
     * Suggests items to place on a specific set of coordinates (e.g. user selection).
     */
    public suggestPlacement(coords: Coord[], config: Partial<PlacementConfig>): PlacedObject[] {
        const { strategy = PedagogyStrategy.LOOP_LOGIC, difficulty = 'simple', assetMap } = config;
        
        if (!assetMap) {
            console.error("AssetMap required for suggestPlacement");
            return [];
        }

        const objects: PlacedObject[] = [];
        
        // Treat the selection as a set of segments
        const segments = this.computeSegments(coords);

        if (strategy === PedagogyStrategy.LOOP_LOGIC || strategy === PedagogyStrategy.NONE) {
             // For suggestion, we force Loop Logic "filling" behavior
             this.applyLoopLogicInternal(objects, segments, assetMap, difficulty);
        } else if (strategy === PedagogyStrategy.FUNCTION_LOGIC) {
            // Try to find identical segments
             this.applyFunctionLogicInternal(objects, segments, assetMap, difficulty);
        }

        return objects;
    }

    private applyLoopLogicInternal(objects: PlacedObject[], segments: Coord[][], assetMap: Map<string, BuildableAsset>, difficulty: string) {
        console.log(`[applyLoopLogicInternal] Processing ${segments.length} segments, difficulty: ${difficulty}`);
        let itemsAdded = 0;
        
        // For Loop Logic: Place items at REGULAR intervals to encourage loop usage
        // - intro: item every 1 step (very simple loop)
        // - simple: item every 1-2 steps  
        // - complex: item every 2-3 steps
        const interval = difficulty === 'intro' ? 1 : (difficulty === 'simple' ? 1 : 2);
        
        segments.forEach((segment, segIdx) => {
            // For loop logic, we want segments with at least 2 items to make loops worthwhile
            if (segment.length >= 2) {
                // Place items at regular intervals along the segment
                for (let i = 0; i < segment.length; i += interval) {
                    const pos = segment[i];
                    if (!this.isOccupied(objects, pos)) {
                        this.addObject(objects, pos, 'gem', assetMap); 
                        itemsAdded++;
                    }
                }
            }
        });
        
        console.log(`[applyLoopLogicInternal] Added ${itemsAdded} items at interval ${interval}`);
    }

    private applyFunctionLogicInternal(objects: PlacedObject[], segments: Coord[][], assetMap: Map<string, BuildableAsset>, difficulty: string) {
        console.log(`[applyFunctionLogicInternal] Processing ${segments.length} segments, difficulty: ${difficulty}`);
        // Group segments by length
        const segmentsByLen: Record<number, Coord[][]> = {};
        segments.forEach((seg: Coord[]) => {
            const len = seg.length;
            if(!segmentsByLen[len]) segmentsByLen[len] = [];
            segmentsByLen[len].push(seg);
        });

        let itemsAdded = 0;
        // For lengths with multiple segments OR single segments >= 2, apply pattern
        Object.keys(segmentsByLen).forEach(lenStr => {
            const len = parseInt(lenStr);
            const segs = segmentsByLen[len];
            const complexity = difficulty === 'complex' ? 0.7 : 0.5; // Increased from 0.3

            // Relaxed condition: apply to segments >= 2 length (was >= 3 and multiple)
            if (len >= 2) {
                 // Create pattern
                 const patternPoints: number[] = [];
                 for(let i=0; i<len; i++) {
                    if (Math.random() < complexity) patternPoints.push(i);
                 }
                 // Ensure at least 1 point
                 if (patternPoints.length === 0 && len > 0) patternPoints.push(0);

                 segs.forEach(seg => {
                     patternPoints.forEach(idx => {
                         if (idx < seg.length) {
                             this.addObject(objects, seg[idx], 'crystal', assetMap);
                             itemsAdded++;
                         }
                     });
                 });
            }
        });
        console.log(`[applyFunctionLogicInternal] Added ${itemsAdded} items`);
    }

    private applyRandomPlacement(objects: PlacedObject[], pathInfo: IPathInfo, assetMap: Map<string, BuildableAsset>) {
        const path = pathInfo.path_coords;
        // Place items on path with random probability
        for(let i=1; i<path.length-1; i++) {
            if (Math.random() < 0.3) { // 30% chance per tile
                 const asset = assetMap.get('crystal') || assetMap.get('gem');
                 if(asset) {
                     // FIX: Items should be placed ON TOP of ground (y+1)
                     const pos = path[i];
                     objects.push({
                         id: uuidv4(),
                         position: [pos[0], pos[1] + 1, pos[2]],
                         rotation: [0,0,0],
                         asset: asset,
                         properties: { ...asset.defaultProperties }
                     });
                 }
            }
        }
        console.log(`[applyRandomPlacement] Added items on ${objects.filter(o => o.asset.key === 'crystal' || o.asset.key === 'gem').length} tiles`);
    }
}
