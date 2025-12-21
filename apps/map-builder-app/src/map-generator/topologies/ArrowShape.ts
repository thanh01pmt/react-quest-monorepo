/**
 * Arrow Shape Topology (FIXED)
 * Creates an arrow-shaped path with triangular head
 * Ported from Python: arrow_shape.py
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
    for (let shaft = 3; shaft <= 8 && count < maxVariants; shaft++) {
      for (let head = 2; head <= 4 && count < maxVariants; head++) {
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
    const shaftLen = params.shaft_length || 5;
    const headSize = params.head_size || 3;
    
    // Calculate required space
    const requiredWidth = headSize * 2 + 1;
    const requiredDepth = shaftLen + headSize;
    
    // Safe start position - center the arrow in grid
    const startX = Math.max(headSize + 1, Math.min(gridSize[0] - headSize - 2, 
                   Math.floor(gridSize[0] / 2)));
    const startZ = params.start_z || Math.max(1, Math.floor((gridSize[2] - requiredDepth) / 2));
    const y = 0;

    // Start position (bottom of shaft)
    const startPos: Coord = [startX, y, startZ];
    
    const placementCoords: Set<string> = new Set();
    const pathCoords: Coord[] = [];
    
    const addToPlacement = (coord: Coord) => {
      placementCoords.add(`${coord[0]},${coord[1]},${coord[2]}`);
    };
    
    // 1. Create shaft (vertical line going +Z)
    const shaft: Coord[] = [];
    let currentPos: Coord = [...startPos];
    
    for (let i = 0; i < shaftLen; i++) {
      shaft.push([...currentPos]);
      addToPlacement(currentPos);
      if (i < shaftLen - 1) {
        currentPos = [currentPos[0], currentPos[1], currentPos[2] + 1];
      }
    }
    
    // Junction point (top of shaft)
    const junctionPos: Coord = [...shaft[shaft.length - 1]];
    
    // 2. Create triangular head
    // Head has headSize rows, each row has decreasing width
    const headRows: Coord[][] = [];
    
    for (let row = 1; row <= headSize; row++) {
      const currentZ = junctionPos[2] + row;
      const rowWidth = headSize - row; // Width decreases as we go up
      const rowCoords: Coord[] = [];
      
      for (let dx = -rowWidth; dx <= rowWidth; dx++) {
        const coord: Coord = [junctionPos[0] + dx, y, currentZ];
        rowCoords.push(coord);
        addToPlacement(coord);
      }
      
      headRows.push(rowCoords);
    }
    
    // 3. Build connected path through the arrow
    // APPROACH: Use Z-shape diagonal pattern - step-by-step movement
    // Each step moves exactly 1 cell in X OR Z (never both)
    //
    // For arrow head traversal:
    // From junction, zig-zag through head rows like Z-shape diagonal
    // Row 1: wider, Row 2: narrower, ... until tip
    
    // Add shaft to path
    pathCoords.push(...shaft);
    
    // The junction is the last point of shaft
    // Now we need to traverse the triangular head
    // 
    // Strategy: Traverse each row, then step +Z to next row at the OVERLAP point
    // Like Z-shape: for each "diagonal" transition, alternate +Z and ±X steps
    
    // Start from junction, step into first head row
    let currentX = junctionPos[0];
    let currentZ = junctionPos[2];
    
    for (let rowIdx = 0; rowIdx < headRows.length; rowIdx++) {
      const rowZ = junctionPos[2] + 1 + rowIdx;
      const rowWidth = headSize - (rowIdx + 1); // Half-width from center
      
      // Step forward into this row (Z+1)
      if (rowIdx === 0) {
        // First step from junction into head
        currentZ = rowZ;
        pathCoords.push([currentX, y, currentZ]);
      }
      
      // Determine direction for this row (zig-zag like Z-shape)
      // Even rows: go to positive X edge
      // Odd rows: go to negative X edge
      if (rowIdx % 2 === 0) {
        // Move right (+X) to edge
        const targetX = junctionPos[0] + rowWidth;
        while (currentX < targetX) {
          currentX++;
          pathCoords.push([currentX, y, currentZ]);
        }
      } else {
        // Move left (-X) to edge
        const targetX = junctionPos[0] - rowWidth;
        while (currentX > targetX) {
          currentX--;
          pathCoords.push([currentX, y, currentZ]);
        }
      }
      
      // Now connect to next row (or finish at tip)
      if (rowIdx < headRows.length - 1) {
        // Calculate next row's width
        const nextRowWidth = headSize - (rowIdx + 2);
        
        // We need to step-by-step like Z-shape diagonal:
        // Alternate between +Z and ±X until we're at a position within next row
        // Next row's X range: [junctionPos[0] - nextRowWidth, junctionPos[0] + nextRowWidth]
        
        // First, step into next Z level
        currentZ++;
        pathCoords.push([currentX, y, currentZ]);
        
        // Now, if current X is outside next row's range, step towards center
        if (rowIdx % 2 === 0) {
          // We're at positive edge, next row is narrower
          // Need to step left until within next row range
          const nextRowMaxX = junctionPos[0] + nextRowWidth;
          while (currentX > nextRowMaxX) {
            currentX--;
            pathCoords.push([currentX, y, currentZ]);
          }
        } else {
          // We're at negative edge, need to step right
          const nextRowMinX = junctionPos[0] - nextRowWidth;
          while (currentX < nextRowMinX) {
            currentX++;
            pathCoords.push([currentX, y, currentZ]);
          }
        }
      }
    }
    
    // Final step to tip if not already there
    const targetPos: Coord = [junctionPos[0], y, junctionPos[2] + headSize];
    const uniquePathCoords = this.removeDuplicates(pathCoords);
    
    // Convert placement set back to coords
    const allPlacementCoords: Coord[] = [];
    placementCoords.forEach(key => {
      const [x, yy, z] = key.split(',').map(Number);
      allPlacementCoords.push([x, yy, z]);
    });
    
    // Calculate wing tips for semantic positions
    const baseRowZ = junctionPos[2] + 1;
    const maxWidth = headSize - 1;
    const leftWingTip: Coord = [junctionPos[0] - maxWidth, y, baseRowZ];
    const rightWingTip: Coord = [junctionPos[0] + maxWidth, y, baseRowZ];
    
    // Calculate wing paths
    const wingLeftPath: Coord[] = [];
    const wingRightPath: Coord[] = [];
    for (let i = 1; i <= maxWidth; i++) {
      wingLeftPath.push([junctionPos[0] - i, y, baseRowZ]);
      wingRightPath.push([junctionPos[0] + i, y, baseRowZ]);
    }

    return {
      start_pos: startPos,
      target_pos: targetPos,
      path_coords: uniquePathCoords,
      placement_coords: allPlacementCoords,
      obstacles: [],
      metadata: {
        topology_type: 'arrow_shape',
        shaft: shaft,
        head_rows: headRows,
        junction: junctionPos,
        tip: targetPos,
        segments: [shaft, ...headRows],
        branches: [shaft, headRows.flat()],
        corners: [junctionPos],
        landmarks: {
          tail: startPos,
          junction: junctionPos,
          tip: targetPos,
          wing_left: leftWingTip,
          wing_right: rightWingTip,
          wing_left_path: wingLeftPath,
          wing_right_path: wingRightPath
        },
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
              difficulty: 'EASY'
            },
            {
              name: 'wing_to_wing_medium',
              start: 'wing_left',
              end: 'wing_right',
              path_type: 'parallel_wings',
              difficulty: 'MEDIUM'
            }
          ]
        },
        segment_analysis: {
          num_segments: 1 + headRows.length,
          lengths: [shaft.length, ...headRows.map(r => r.length)],
          types: ['linear', ...headRows.map(() => 'horizontal')]
        }
      },
    };
  }
  
  private removeDuplicates(coords: Coord[]): Coord[] {
    const seen = new Set<string>();
    const result: Coord[] = [];
    
    for (const coord of coords) {
      const key = `${coord[0]},${coord[1]},${coord[2]}`;
      if (!seen.has(key)) {
        seen.add(key);
        result.push(coord);
      }
    }
    
    return result;
  }
}
