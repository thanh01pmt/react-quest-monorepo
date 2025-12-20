import { PlacedObject, BuildableAsset } from '../types';
import { BaseTopology } from './topologies/BaseTopology';
import { IPathInfo, Coord } from './types';
import { v4 as uuidv4 } from 'uuid';

export enum PedagogyStrategy {
    NONE = 'none',
    LOOP_LOGIC = 'loop_logic',
    FUNCTION_LOGIC = 'function_logic'
}

export interface PlacementConfig {
    topology: BaseTopology;
    params: Record<string, any>;
    strategy: PedagogyStrategy;
    difficulty: 'intro' | 'simple' | 'complex'; // NEW
    assetMap: Map<string, BuildableAsset>;
}

export class PlacementService {
    
    /**
     * Main entry point to generate a map with specific pedagogical considerations.
     */
    public async generateMap(config: PlacementConfig): Promise<{ objects: PlacedObject[], pathInfo: IPathInfo }> {
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
                    defaultProperties: { color: type === 'wall' ? '#888888' : '#22aa22' },
                    thumbnail: '/assets/ui/unknown.png'
                 } as BuildableAsset;
             }
             if (asset) {
                objects.push({
                    id: uuidv4(),
                    position: pos,
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
        
        // B. Generate Wall Border around the placement area
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
        
        // C. Render Obstacles from pathInfo
        pathInfo.obstacles.forEach((obs: any) => {
             addObj(obs.pos, wallKey, 'wall'); // Use dynamic wall key
        });

        // 2. Apply Pedagogy Strategy
        if (strategy === PedagogyStrategy.LOOP_LOGIC) {
            this.applyLoopLogic(objects, pathInfo, assetMap, config);
        } else if (strategy === PedagogyStrategy.FUNCTION_LOGIC) {
            this.applyFunctionLogic(objects, pathInfo, assetMap, config);
        } else {
            this.applyRandomPlacement(objects, pathInfo, assetMap);
        }

        // 3. Add Start/Finish
        if (pathInfo.start_pos) addObj(pathInfo.start_pos, 'player_start', 'item');
        if (pathInfo.target_pos) addObj(pathInfo.target_pos, 'finish', 'item');

        // DEBUG: Final object count
        console.log(`[PlacementService] FINAL: Created ${objects.length} objects`, {
            sample: objects.slice(0, 3).map(o => ({ pos: o.position, asset: o.asset.key }))
        });

        return { objects, pathInfo };
    }

    private applyLoopLogic(objects: PlacedObject[], pathInfo: IPathInfo, assetMap: Map<string, BuildableAsset>, config: PlacementConfig) {
        console.log("Applying Loop Logic...");
        
        let segments: Coord[][] = pathInfo.metadata?.segments;
        if (!segments) {
            segments = this.computeSegments(pathInfo.path_coords);
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
        return objects.some(o => o.position[0] === pos[0] && o.position[1] === pos[1] && o.position[2] === pos[2] && (o.asset.type === 'collectible' || o.asset.type === 'interactible' || o.asset.type === 'block'));
    }

    private addObject(objects: PlacedObject[], pos: Coord, assetKey: string, assetMap: Map<string, BuildableAsset>) {
        const asset = assetMap.get(assetKey) || assetMap.get('crystal'); // Fallback
        if(asset) {
                objects.push({
                    id: uuidv4(),
                    position: pos,
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
        segments.forEach(segment => {
            const minLen = difficulty === 'intro' ? 2 : 3;
            if (segment.length >= minLen) {
                 const prob = difficulty === 'complex' ? 0.8 : 0.4;
                 for (let i = 0; i < segment.length; i++) {
                     if (Math.random() < prob) {
                         const pos = segment[i];
                         if (!this.isOccupied(objects, pos)) {
                             this.addObject(objects, pos, 'gem', assetMap); 
                         }
                     }
                 }
            }
        });
    }

    private applyFunctionLogicInternal(objects: PlacedObject[], segments: Coord[][], assetMap: Map<string, BuildableAsset>, difficulty: string) {
        // Group segments by length
        const segmentsByLen: Record<number, Coord[][]> = {};
        segments.forEach((seg: Coord[]) => {
            const len = seg.length;
            if(!segmentsByLen[len]) segmentsByLen[len] = [];
            segmentsByLen[len].push(seg);
        });

        // For lengths with multiple segments, apply same pattern
        Object.keys(segmentsByLen).forEach(lenStr => {
            const len = parseInt(lenStr);
            const segs = segmentsByLen[len];
            const complexity = difficulty === 'complex' ? 0.7 : 0.3;

            if (segs.length > 1 && len >= 3) {
                 // Create pattern
                 const patternPoints: number[] = [];
                 for(let i=0; i<len; i++) {
                    if (Math.random() < complexity) patternPoints.push(i);
                 }

                 segs.forEach(seg => {
                     patternPoints.forEach(idx => {
                         this.addObject(objects, seg[idx], 'crystal', assetMap);
                     });
                 });
            }
        });
    }

    private applyRandomPlacement(objects: PlacedObject[], pathInfo: IPathInfo, assetMap: Map<string, BuildableAsset>) {
        // ... (as before)
        const path = pathInfo.path_coords;
        for(let i=1; i<path.length-1; i++) {
            if (Math.random() < 0.2) { 
                 const asset = assetMap.get('crystal');
                 if(asset) {
                     objects.push({
                         id: uuidv4(),
                         position: path[i],
                         rotation: [0,0,0],
                         asset: asset,
                         properties: {}
                     });
                 }
            }
        }
    }
}
