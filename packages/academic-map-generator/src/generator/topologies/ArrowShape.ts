/**
 * Arrow Shape Topology (PORTED FROM PYTHON)
 * Creates an arrow-shaped path with triangular head
 * 
 * ARCHITECTURE:
 * - placement_coords: Full arrow shape (all tiles for ground rendering)
 * - path_coords: Unique walkable tiles in "Row Scan" order for placer
 * - segments: [shaft_segment, head_segment] for segment-based placement
 * - semantic_positions: Key points (tail, junction, tip, wings) for strategy
 */

import { BaseTopology } from './BaseTopology';
import { IPathInfo, Coord } from '../types';

export class ArrowShapeTopology extends BaseTopology {
  *generatePathInfoVariants(
    gridSize: [number, number, number],
    params: Record<string, any>,
    maxVariants: number
  ): Generator<IPathInfo> {
    let count = 0;
    // Python ranges: shaft 3..9 (exclusive 9 -> 3..8), head 3..5 (exclusive 5 -> 3..4)
    for (let shaft = 3; shaft < 9 && count < maxVariants; shaft++) {
      for (let head = 3; head < 5 && count < maxVariants; head++) {
        yield this.generatePathInfo(gridSize, {
          ...params,
          shaft_length: shaft,
          head_size: head
        });
        count++;
      }
    }
  }

  generatePathInfo(gridSize: [number, number, number], params: Record<string, any>): IPathInfo {
    console.log("    LOG: Generating 'arrow_shape' topology...");

    const shaftLen = params.shaft_length || 5; 
    // FIX: Accept both 'wing_length' (from UI) and 'head_size' (legacy) 
    // wing_length maps to the triangular head size
    const headSize = params.wing_length || params.head_size || 3;
    
    // Calculate required space
    const requiredWidth = headSize * 2 + 1;
    const requiredDepth = shaftLen + headSize;
    
    // FIX: Use deterministic centered positioning instead of random
    // This ensures the shape stays within visible bounds and is predictable
    // Center the arrow in the grid, accounting for required space
    const gridCenterX = Math.floor(gridSize[0] / 2);
    const gridCenterZ = Math.floor(gridSize[2] / 2);
    
    // Start position: center X, and Z positioned so arrow fits from startZ to startZ + requiredDepth
    const startX = params.start_x || Math.max(headSize + 1, Math.min(gridSize[0] - headSize - 2, gridCenterX));
    const startZ = params.start_z || Math.max(1, Math.min(gridSize[2] - requiredDepth - 1, Math.floor((gridSize[2] - requiredDepth) / 2)));
    const y = 0;

    const startPos: Coord = [startX, y, startZ];
    
    // Data structures matching Python
    const placementCoords: Set<string> = new Set();
    let pathCoords: Coord[] = [startPos];
    const straightPathCoords: Coord[] = [startPos];
    
    const addToPlacement = (coord: Coord) => {
      placementCoords.add(`${coord[0]},${coord[1]},${coord[2]}`);
    };
    addToPlacement(startPos);
    
    // 1. Shaft (Vertical line +Z)
    let currentPos: Coord = [...startPos];
    for (let i = 0; i < shaftLen; i++) {
        currentPos = [currentPos[0], currentPos[1], currentPos[2] + 1];
        pathCoords.push(currentPos);
        addToPlacement(currentPos);
        straightPathCoords.push(currentPos);
    }
    
    const junctionPos: Coord = [...currentPos];
    
    // 2. Head (Triangle) construction
    const headRows: Coord[][] = [];
    const centerX = junctionPos[0];
    
    // Build rows logic
    for (let i = 1; i <= headSize; i++) {
        const currentZ = junctionPos[2] + i;
        const rowWidth = headSize - i;
        const rowCoords: Coord[] = [];
        for (let j = -rowWidth; j <= rowWidth; j++) {
            const coord: Coord = [centerX + j, y, currentZ];
            rowCoords.push(coord);
            addToPlacement(coord);
        }
        headRows.push(rowCoords);
    }
    
    // 3. Zig-Zag Path Logic (Python Port)
    // "Row Scan with Backtracking"
    
    headRows.forEach((row) => {
        const currentZ = row[0][2];
        const centerNode: Coord = [centerX, y, currentZ];
        
        pathCoords.push(centerNode);
        
        const leftSide = row.filter(c => c[0] < centerX);
        const rightSide = row.filter(c => c[0] > centerX);
        
        // Sort Left: Descending X (Closest to Center first)
        leftSide.sort((a, b) => b[0] - a[0]); 
        
        // Sort Right: Ascending X (Closest to Center first)
        rightSide.sort((a, b) => a[0] - b[0]);
        
        // Traverse Left -> Backtrack
        leftSide.forEach(c => pathCoords.push(c));
        [...leftSide].reverse().forEach(c => pathCoords.push(c));
        
        // Center (Implicit return)
        pathCoords.push(centerNode);
        
        // Traverse Right -> Backtrack
        rightSide.forEach(c => pathCoords.push(c));
        [...rightSide].reverse().forEach(c => pathCoords.push(c));
        
        pathCoords.push(centerNode);
    });
    
    // Deduplicate pathCoords
    const seen = new Set<string>();
    const uniquePathCoords: Coord[] = [];
    for (const c of pathCoords) {
        const key = `${c[0]},${c[1]},${c[2]}`;
        if (!seen.has(key)) {
            seen.add(key);
            uniquePathCoords.push(c);
        }
    }
    pathCoords = uniquePathCoords;
    
    // Target Pos (Tip)
    const targetPos: Coord = [junctionPos[0], y, junctionPos[2] + headSize];
    
    // Ensure target is in path
    const targetKey = `${targetPos[0]},${targetPos[1]},${targetPos[2]}`;
    if (!seen.has(targetKey)) {
        pathCoords.push(targetPos);
    }
    
    // Metadata Construction
    
    // Segments: Shaft + Head (spine only)
    const shaftSegment = straightPathCoords.slice(0, shaftLen + 1);
    const headSegment = straightPathCoords.slice(shaftLen); // Remaining straight path
    const segments = [shaftSegment, headSegment];
    
    const baseRowZ = junctionPos[2] + 1;
    const maxWidth = headSize - 1;
    const leftWingTip: Coord = [centerX - maxWidth, y, baseRowZ];
    const rightWingTip: Coord = [centerX + maxWidth, y, baseRowZ];
    
    const wingLeftPath: Coord[] = [];
    const wingRightPath: Coord[] = [];
    for(let i=1; i <= maxWidth; i++) {
        wingLeftPath.push([centerX - i, y, baseRowZ]);
        wingRightPath.push([centerX + i, y, baseRowZ]);
    }
    
    // Convert placement set back to array
    const allPlacementCoords: Coord[] = [];
    placementCoords.forEach(key => {
        const [px, py, pz] = key.split(',').map(Number);
        allPlacementCoords.push([px, py, pz]);
    });

    return {
      start_pos: startPos,
      target_pos: targetPos,
      path_coords: pathCoords,
      placement_coords: allPlacementCoords,
      obstacles: [],
      metadata: {
        topology_type: 'arrow_shape',
        segments: segments,
        corners: [junctionPos],
        semantic_positions: {
            tail: startPos,
            junction: junctionPos,
            tip: targetPos,
            wing_left: leftWingTip,
            wing_right: rightWingTip,
            optimal_start: 'tail',
            optimal_end: 'tip',
            valid_pairs: [
                {
                    name: 'tail_to_tip_easy',
                    start: 'tail',
                    end: 'tip',
                    path_type: 'shaft_then_head',
                    strategies: ['strategic_zones', 'segment_based'],
                    difficulty: 'EASY',
                    teaching_goal: 'Simple arrow traversal through shaft to tip'
                },
                {
                    name: 'wing_to_wing_medium',
                    start: 'wing_left',
                    end: 'wing_right',
                    path_type: 'parallel_wings',
                    strategies: ['strategic_zones', 'v_shape_convergence'],
                    difficulty: 'MEDIUM',
                    teaching_goal: 'Cross arrow head through junction'
                },
                {
                    name: 'tail_all_zones_hard',
                    start: 'tail',
                    end: 'wing_right',
                    path_type: 'full_traversal',
                    strategies: ['strategic_zones', 'parallel_wings'],
                    difficulty: 'HARD',
                    teaching_goal: 'Visit all zones: shaft, wings, tip'
                }
            ]
        },
        segment_analysis: {
             landmarks: {
                tail: startPos,
                junction: junctionPos,
                tip: targetPos,
                wing_left: leftWingTip,
                wing_right: rightWingTip,
                wing_left_path: wingLeftPath,
                wing_right_path: wingRightPath
             },
             suggested_patterns: ['interval_fill', 'corner_checkpoints', 'parallel_climb']
        }
      }
    };
  }
}
