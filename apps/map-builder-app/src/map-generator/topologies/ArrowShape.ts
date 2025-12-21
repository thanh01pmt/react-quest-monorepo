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
    // Path: Start -> along shaft -> through head in zig-zag pattern
    
    // Add shaft to path
    pathCoords.push(...shaft);
    
    // Add head rows in zig-zag pattern for continuous connectivity
    for (let rowIdx = 0; rowIdx < headRows.length; rowIdx++) {
      const row = headRows[rowIdx];
      const sortedRow = [...row].sort((a, b) => a[0] - b[0]);
      
      // For zig-zag: alternate direction each row
      if (rowIdx % 2 === 0) {
        // Left to right
        pathCoords.push(...sortedRow);
      } else {
        // Right to left
        pathCoords.push(...sortedRow.reverse());
      }
    }
    
    // Target position is the tip of the arrow
    const targetPos: Coord = [junctionPos[0], y, junctionPos[2] + headSize];
    
    // Remove duplicates while preserving order
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
