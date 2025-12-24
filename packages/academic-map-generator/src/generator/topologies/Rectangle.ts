/**
 * Rectangle Topology
 * Creates a rectangular path with configurable width and height.
 * Unlike Square, allows for non-equal sides.
 * Ideal for teaching loops with different iteration counts.
 */

import { BaseTopology } from './BaseTopology';
import { IPathInfo, Coord } from '../types';

const FORWARD_X: [number, number, number] = [1, 0, 0];
const FORWARD_Z: [number, number, number] = [0, 0, 1];
const BACKWARD_X: [number, number, number] = [-1, 0, 0];
const BACKWARD_Z: [number, number, number] = [0, 0, -1];

const addVectors = (a: Coord, b: [number, number, number]): Coord => 
  [a[0] + b[0], a[1] + b[1], a[2] + b[2]];

export class RectangleTopology extends BaseTopology {
  *generatePathInfoVariants(
    gridSize: [number, number, number],
    params: Record<string, any>,
    maxVariants: number
  ): Generator<IPathInfo> {
    let count = 0;
    
    // Generate variants with different width/height ratios
    const ratios = [
      [3, 5], [4, 6], [5, 3], [6, 4], [4, 8], [8, 4]
    ];
    
    for (const [w, h] of ratios) {
      if (count >= maxVariants) return;
      yield this.generatePathInfo(gridSize, { ...params, width: w, height: h });
      count++;
    }
  }

  generatePathInfo(gridSize: [number, number, number], params: Record<string, any>): IPathInfo {
    console.log("    LOG: Generating 'rectangle' topology...");

    let width = params.width || 4;
    let height = params.height || 6;

    // Ensure minimum size
    width = Math.max(2, Math.min(width, gridSize[0] - 4));
    height = Math.max(2, Math.min(height, gridSize[2] - 4));

    // Centered position
    const startX = params.start_x || Math.max(1, Math.floor((gridSize[0] - width) / 2));
    const startZ = params.start_z || Math.max(1, Math.floor((gridSize[2] - height) / 2));
    const y = 0;

    // Define corners
    const c1: Coord = [startX, y, startZ];
    const c2: Coord = [startX + width, y, startZ];
    const c3: Coord = [startX + width, y, startZ + height];
    const c4: Coord = [startX, y, startZ + height];

    // Build path: C1 -> C2 -> C3 -> C4 -> C1
    const pathCoords: Coord[] = [];
    let currentPos: Coord = [...c1];
    pathCoords.push([...currentPos]);

    // Side 1: C1 -> C2 (X+)
    for (let i = 0; i < width; i++) {
      currentPos = addVectors(currentPos, FORWARD_X);
      pathCoords.push([...currentPos]);
    }

    // Side 2: C2 -> C3 (Z+)
    for (let i = 0; i < height; i++) {
      currentPos = addVectors(currentPos, FORWARD_Z);
      pathCoords.push([...currentPos]);
    }

    // Side 3: C3 -> C4 (X-)
    for (let i = 0; i < width; i++) {
      currentPos = addVectors(currentPos, BACKWARD_X);
      pathCoords.push([...currentPos]);
    }

    // Side 4: C4 -> C1 (Z-) - Partial to avoid duplicate
    for (let i = 0; i < height - 1; i++) {
      currentPos = addVectors(currentPos, BACKWARD_Z);
      pathCoords.push([...currentPos]);
    }

    const corners = [c1, c2, c3, c4];

    // Segments
    const seg1: Coord[] = [];
    for (let i = 0; i <= width; i++) seg1.push([c1[0] + i, y, c1[2]]);
    
    const seg2: Coord[] = [];
    for (let i = 0; i <= height; i++) seg2.push([c2[0], y, c2[2] + i]);
    
    const seg3: Coord[] = [];
    for (let i = 0; i <= width; i++) seg3.push([c3[0] - i, y, c3[2]]);
    
    const seg4: Coord[] = [];
    for (let i = 0; i <= height; i++) seg4.push([c4[0], y, c4[2] - i]);

    const segments = [seg1, seg2, seg3, seg4];
    const lengths = segments.map(s => s.length);

    const segment_analysis = {
      num_segments: segments.length,
      lengths,
      types: ['width_side', 'height_side', 'width_side', 'height_side'],
      min_length: Math.min(...lengths),
      max_length: Math.max(...lengths),
      avg_length: lengths.reduce((a, b) => a + b, 0) / lengths.length
    };

    // Break closed loop: ensures start ≠ target and removes bridge tile
    // Break closed loop: forceBreak: true because Rectangle path is meant to be a closed loop
    const loopBreak = this.breakClosedLoop(pathCoords, true);
    const { startPos, targetPos, placementCoords: brokenPlacement, gapCoord } = loopBreak;

    // Compute path_coords using the LONG path around the loop
    const computedPath = this.computeLoopPathCoords(startPos, targetPos, brokenPlacement, pathCoords);

    // Updated semantic positions
    const semantic_positions = {
      start: startPos,
      end: targetPos,
      gap: gapCoord,
      c1, c2, c3, c4,
      optimal_start: 'start',
      optimal_end: 'end',
      valid_pairs: [
        {
          name: 'full_rectangle_easy',
          start: 'start',
          end: 'end',
          path_type: 'forced_perimeter',
          strategies: ['segment_pattern_reuse', 'alternating_sides'],
          difficulty: 'EASY',
          teaching_goal: 'One-way traversal around rectangle'
        },
        {
          name: 'width_height_medium',
          start: 'start',
          end: 'end',
          path_type: 'side_based',
          strategies: ['segment_based', 'size_awareness'],
          difficulty: 'MEDIUM',
          teaching_goal: 'Different counts for width/height'
        },
        {
          name: 'corners_only_hard',
          start: 'start',
          end: 'end',
          path_type: 'corner_based',
          strategies: ['corner_logic', 'perimeter_pattern'],
          difficulty: 'HARD',
          teaching_goal: 'Corner-specific actions'
        }
      ]
    };

    return {
      start_pos: startPos,
      target_pos: targetPos,
      path_coords: computedPath,          // DYNAMIC: long path around loop
      placement_coords: brokenPlacement,  // STATIC: all walkable tiles (minus gap)
      obstacles: [],
      metadata: {
        topology_type: 'rectangle',
        is_closed_loop: true,
        gap_coord: gapCoord,
        width,
        height,
        corners,
        segments,
        segment_analysis,
        semantic_positions
      }
    };
  }
}
