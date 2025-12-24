/**
 * Lake1 Topology (formerly Hexagon)
 * Creates a lake-like shape with 6 sides.
 * Uses stepped zigzag for diagonal edges (walkable).
 */

import { BaseTopology } from './BaseTopology';
import { IPathInfo, Coord } from '../types';

export class Lake1Topology extends BaseTopology {
  *generatePathInfoVariants(
    gridSize: [number, number, number],
    params: Record<string, any>,
    maxVariants: number
  ): Generator<IPathInfo> {
    let count = 0;
    
    for (let sideLength = 2; sideLength <= 6; sideLength++) {
      if (count >= maxVariants) return;
      yield this.generatePathInfo(gridSize, { ...params, side_length: sideLength });
      count++;
    }
  }

  generatePathInfo(gridSize: [number, number, number], params: Record<string, any>): IPathInfo {
    console.log("    LOG: Generating 'lake1' topology...");

    let sideLength = params.side_length || 3;
    sideLength = Math.max(2, Math.min(sideLength, Math.min(gridSize[0], gridSize[2]) / 4));

    // Center position
    const centerX = params.center_x || Math.floor(gridSize[0] / 2);
    const centerZ = params.center_z || Math.floor(gridSize[2] / 2);
    const y = 0;

    // PROPER HEXAGON GEOMETRY (flat-topped):
    // - Height (Z) = sqrt(3) * sideLength ≈ 1.73 * sideLength
    // - Width (X) = 2 * sideLength
    // - Top/bottom edge length = sideLength
    // - Diagonal edge "steps" = sideLength (in zigzag form)
    
    const halfHeight = Math.round(sideLength * 0.866); // sin(60°) ≈ 0.866
    const halfWidth = sideLength; // Half of total width
    const horizontalEdgeLength = sideLength; // Top and bottom edges

    // 6 corners of proper hexagon (flat-topped, starting from right)
    const corners: Coord[] = [
      [centerX + halfWidth, y, centerZ],                              // 0: Right
      [centerX + Math.floor(horizontalEdgeLength / 2), y, centerZ - halfHeight],  // 1: Top-Right
      [centerX - Math.floor(horizontalEdgeLength / 2), y, centerZ - halfHeight],  // 2: Top-Left
      [centerX - halfWidth, y, centerZ],                              // 3: Left
      [centerX - Math.floor(horizontalEdgeLength / 2), y, centerZ + halfHeight],  // 4: Bottom-Left
      [centerX + Math.floor(horizontalEdgeLength / 2), y, centerZ + halfHeight],  // 5: Bottom-Right
    ];

    const pathCoords: Coord[] = [];
    const segments: Coord[][] = [];

    let current: Coord = [...corners[0]];
    pathCoords.push([...current]);

    // Edge 0: Right -> Top-Right (diagonal zigzag: -Z alternating with -X)
    const edge0: Coord[] = [[...current]];
    const diag0Steps = halfHeight; // Number of Z steps
    const diag0XSteps = Math.abs(corners[1][0] - corners[0][0]); // X steps
    for (let i = 0; i < diag0Steps; i++) {
      // Move -Z (north)
      current = [current[0], y, current[2] - 1];
      pathCoords.push([...current]);
      edge0.push([...current]);
      // Move -X (occasionally, based on ratio)
      if (i < diag0XSteps) {
        current = [current[0] - 1, y, current[2]];
        pathCoords.push([...current]);
        edge0.push([...current]);
      }
    }
    segments.push(edge0);

    // Edge 1: Top-Right -> Top-Left (HORIZONTAL: -X for sideLength steps)
    const edge1: Coord[] = [[...current]];
    for (let i = 0; i < horizontalEdgeLength; i++) {
      current = [current[0] - 1, y, current[2]];
      pathCoords.push([...current]);
      edge1.push([...current]);
    }
    segments.push(edge1);

    // Edge 2: Top-Left -> Left (diagonal zigzag: +Z alternating with -X)
    const edge2: Coord[] = [[...current]];
    const diag2XSteps = Math.abs(corners[3][0] - corners[2][0]);
    for (let i = 0; i < halfHeight; i++) {
      // Move +Z (south)
      current = [current[0], y, current[2] + 1];
      pathCoords.push([...current]);
      edge2.push([...current]);
      // Move -X (occasionally)
      if (i < diag2XSteps) {
        current = [current[0] - 1, y, current[2]];
        pathCoords.push([...current]);
        edge2.push([...current]);
      }
    }
    segments.push(edge2);

    // Edge 3: Left -> Bottom-Left (diagonal zigzag: +Z alternating with +X)
    const edge3: Coord[] = [[...current]];
    const diag3XSteps = Math.abs(corners[4][0] - corners[3][0]);
    for (let i = 0; i < halfHeight; i++) {
      // Move +Z (south)
      current = [current[0], y, current[2] + 1];
      pathCoords.push([...current]);
      edge3.push([...current]);
      // Move +X (occasionally)
      if (i < diag3XSteps) {
        current = [current[0] + 1, y, current[2]];
        pathCoords.push([...current]);
        edge3.push([...current]);
      }
    }
    segments.push(edge3);

    // Edge 4: Bottom-Left -> Bottom-Right (HORIZONTAL: +X for sideLength steps)
    const edge4: Coord[] = [[...current]];
    for (let i = 0; i < horizontalEdgeLength; i++) {
      current = [current[0] + 1, y, current[2]];
      pathCoords.push([...current]);
      edge4.push([...current]);
    }
    segments.push(edge4);

    // Edge 5: Bottom-Right -> Right (diagonal zigzag: -Z alternating with +X)
    const edge5: Coord[] = [[...current]];
    const diag5XSteps = Math.abs(corners[0][0] - corners[5][0]);
    for (let i = 0; i < halfHeight; i++) {
      // Move -Z (north)
      current = [current[0], y, current[2] - 1];
      pathCoords.push([...current]);
      edge5.push([...current]);
      // Move +X (occasionally, but not on last to avoid duplicate)
      if (i < diag5XSteps && i < halfHeight - 1) {
        current = [current[0] + 1, y, current[2]];
        pathCoords.push([...current]);
        edge5.push([...current]);
      }
    }
    segments.push(edge5);

    // lengths for segment_analysis
    const lengths = segments.map(s => s.length);

    const segment_analysis = {
      num_segments: segments.length,
      lengths,
      types: ['diagonal', 'horizontal', 'diagonal', 'diagonal', 'horizontal', 'diagonal'],
      min_length: Math.min(...lengths),
      max_length: Math.max(...lengths),
      avg_length: lengths.reduce((a, b) => a + b, 0) / lengths.length
    };


    // Break closed loop: ensures start ≠ target and removes bridge tile
    // forceBreak: true because Lake1 path may not perfectly close (last != first)
    const loopBreak = this.breakClosedLoop(pathCoords, true);
    const { startPos, targetPos, placementCoords: brokenPlacement, gapCoord } = loopBreak;

    // Compute path_coords using the LONG path around the loop
    const computedPath = this.computeLoopPathCoords(startPos, targetPos, brokenPlacement, pathCoords);

    // Update semantic positions with the new start/target
    const semantic_positions = {
      start: startPos,
      end: targetPos,
      center: [centerX, y, centerZ] as Coord,
      gap: gapCoord, // The removed tile
      corner_right: corners[0],
      corner_top_right: corners[1],
      corner_top_left: corners[2],
      corner_left: corners[3],
      corner_bottom_left: corners[4],
      corner_bottom_right: corners[5],
      optimal_start: 'start',
      optimal_end: 'end',
      valid_pairs: [
        {
          name: 'full_hexagon_easy',
          start: 'start',
          end: 'end',
          path_type: 'forced_perimeter',
          strategies: ['segment_pattern_reuse', 'six_sides_pattern'],
          difficulty: 'EASY',
          teaching_goal: 'One-way traversal around hexagon'
        },
        {
          name: 'corner_focused_medium',
          start: 'start',
          end: 'end',
          path_type: 'corner_based',
          strategies: ['segment_based', 'corner_logic'],
          difficulty: 'MEDIUM',
          teaching_goal: 'Special actions at corners'
        },
        {
          name: 'alternating_sides_hard',
          start: 'start',
          end: 'end',
          path_type: 'side_based',
          strategies: ['alternating_patterns'],
          difficulty: 'HARD',
          teaching_goal: 'Alternating patterns on diagonals vs horizontals'
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
        topology_type: 'lake1',
        is_closed_loop: true,
        gap_coord: gapCoord,
        side_length: sideLength,
        center: [centerX, y, centerZ] as Coord,
        corners,
        segments,
        segment_analysis,
        semantic_positions
      }
    };
  }
}
