/**
 * Lake2 Topology (formerly Circle)
 * Creates a rounded lake-like shape using circle equation.
 * Uses stair-stepped orthogonal movements (walkable).
 */

import { BaseTopology } from './BaseTopology';
import { IPathInfo, Coord } from '../types';

export class Lake2Topology extends BaseTopology {
  *generatePathInfoVariants(
    gridSize: [number, number, number],
    params: Record<string, any>,
    maxVariants: number
  ): Generator<IPathInfo> {
    let count = 0;
    for (let radius = 3; radius <= 8; radius++) {
      if (count >= maxVariants) return;
      yield this.generatePathInfo(gridSize, { ...params, radius });
      count++;
    }
  }

  generatePathInfo(gridSize: [number, number, number], params: Record<string, any>): IPathInfo {
    console.log("    LOG: Generating 'lake2' topology...");

    let radius = params.radius || 4;
    radius = Math.max(2, Math.min(radius, Math.min(gridSize[0], gridSize[2]) / 2 - 2));

    const centerX = params.center_x || Math.floor(gridSize[0] / 2);
    const centerZ = params.center_z || Math.floor(gridSize[2] / 2);
    const y = 0;

    const pathCoords: Coord[] = [];

    // Bắt đầu từ điểm north
    let currentX = centerX;
    let currentZ = centerZ - radius;
    pathCoords.push([currentX, y, currentZ]);

    // Hàm helper để di chuyển đến targetX ở currentZ hiện tại
    const moveXTo = (targetX: number) => {
      const step = targetX > currentX ? 1 : -1;
      while (currentX !== targetX) {
        currentX += step;
        pathCoords.push([currentX, y, currentZ]);
      }
    };

    // 4 quadrants - mỗi quadrant di chuyển theo Z, rồi điều chỉnh X
    // Q1: North -> East (Z tăng, X tăng)
    for (let dz = -radius + 1; dz <= 0; dz++) {
      currentZ = centerZ + dz;  // di chuyển Z trước
      pathCoords.push([currentX, y, currentZ]);
      const targetX = centerX + Math.round(Math.sqrt(radius * radius - dz * dz));
      moveXTo(targetX);
    }

    // Q2: East -> South (Z tăng, X giảm)
    for (let dz = 1; dz <= radius; dz++) {
      currentZ = centerZ + dz;
      pathCoords.push([currentX, y, currentZ]);
      const targetX = centerX + Math.round(Math.sqrt(radius * radius - dz * dz));
      moveXTo(targetX);
    }

    // Q3: South -> West (Z giảm, X giảm)
    for (let dz = radius - 1; dz >= 0; dz--) {
      currentZ = centerZ + dz;
      pathCoords.push([currentX, y, currentZ]);
      const targetX = centerX - Math.round(Math.sqrt(radius * radius - dz * dz));
      moveXTo(targetX);
    }

    // Q4: West -> North (Z giảm, X tăng)
    for (let dz = -1; dz >= -radius; dz--) {  // đến -radius để đóng vòng
      currentZ = centerZ + dz;
      pathCoords.push([currentX, y, currentZ]);
      const targetX = centerX - Math.round(Math.sqrt(radius * radius - Math.abs(dz) * Math.abs(dz)));  // dùng abs(dz) vì đối xứng
      moveXTo(targetX);
    }

    // Cardinal points (chính xác hơn)
    const north: Coord = [centerX, y, centerZ - radius];
    const south: Coord = [centerX, y, centerZ + radius];
    const east: Coord = pathCoords.find(c => c[2] === centerZ && c[0] > centerX) || [centerX + radius, y, centerZ];
    const west: Coord = pathCoords.find(c => c[2] === centerZ && c[0] < centerX) || [centerX - radius, y, centerZ];

    // Filled nếu cần
    const placementCoords = [...pathCoords];
    if (params.filled) {
      for (let dx = -radius; dx <= radius; dx++) {
        for (let dz = -radius; dz <= radius; dz++) {
          if (dx * dx + dz * dz <= radius * radius) {
            const coord: Coord = [centerX + dx, y, centerZ + dz];
            if (!placementCoords.some(c => c[0] === coord[0] && c[2] === coord[2])) {
              placementCoords.push(coord);
            }
          }
        }
      }
    }

    // Segments (tái tính dựa trên path)
    const quarterApprox = Math.floor(pathCoords.length / 4);
    const segments = [
      pathCoords.slice(0, quarterApprox),
      pathCoords.slice(quarterApprox, 2 * quarterApprox),
      pathCoords.slice(2 * quarterApprox, 3 * quarterApprox),
      pathCoords.slice(3 * quarterApprox)
    ];

    const lengths = segments.map(s => s.length);

    const segment_analysis = {
      num_segments: segments.length,
      lengths,
      types: ['quadrant_1', 'quadrant_2', 'quadrant_3', 'quadrant_4'],
      min_length: Math.min(...lengths),
      max_length: Math.max(...lengths),
      avg_length: lengths.reduce((a, b) => a + b, 0) / lengths.length
    };

    // Break closed loop: ensures start ≠ target and removes bridge tile
    // Break closed loop: forceBreak: true because Lake2 path may not perfectly close
    const loopBreak = this.breakClosedLoop(pathCoords, true);
    const { startPos, targetPos, placementCoords: brokenPlacement, gapCoord } = loopBreak;

    // If filled param was used, we need to add back the filled tiles (excluding gap)
    let finalPlacement = brokenPlacement;
    if (params.filled) {
      const filledSet = new Set(brokenPlacement.map(c => `${c[0]},${c[1]},${c[2]}`));
      for (let dx = -radius; dx <= radius; dx++) {
        for (let dz = -radius; dz <= radius; dz++) {
          if (dx * dx + dz * dz <= radius * radius) {
            const coord: Coord = [centerX + dx, y, centerZ + dz];
            const key = `${coord[0]},${coord[1]},${coord[2]}`;
            // Exclude gap
            if (gapCoord && coord[0] === gapCoord[0] && coord[1] === gapCoord[1] && coord[2] === gapCoord[2]) {
              continue;
            }
            if (!filledSet.has(key)) {
              brokenPlacement.push(coord);
              filledSet.add(key);
            }
          }
        }
      }
      finalPlacement = brokenPlacement;
    }

    // Compute path_coords using the LONG path around the loop
    const computedPath = this.computeLoopPathCoords(startPos, targetPos, finalPlacement, pathCoords);

    // Semantic positions with new start/target
    const semantic_positions = {
      start: startPos,
      end: targetPos,
      center: [centerX, y, centerZ] as Coord,
      gap: gapCoord,
      north,
      east,
      south,
      west,
      optimal_start: 'start',
      optimal_end: 'end',
      valid_pairs: [
        {
          name: 'full_circle_easy',
          start: 'start',
          end: 'end',
          path_type: 'forced_perimeter',
          strategies: ['segment_pattern_reuse', 'radial_symmetry'],
          difficulty: 'EASY',
          teaching_goal: 'One-way traversal around circle'
        },
        {
          name: 'quadrant_based_medium',
          start: 'start',
          end: 'end',
          path_type: 'quadrant_based',
          strategies: ['quadrant_logic', 'curve_navigation'],
          difficulty: 'MEDIUM',
          teaching_goal: 'Pattern per quadrant'
        }
      ]
    };

    return {
      start_pos: startPos,
      target_pos: targetPos,
      path_coords: computedPath,          // DYNAMIC: long path around loop
      placement_coords: finalPlacement,   // STATIC: all walkable tiles (minus gap)
      obstacles: [],
      metadata: {
        topology_type: 'lake2',
        is_closed_loop: true,
        gap_coord: gapCoord,
        radius,
        center: [centerX, y, centerZ] as Coord,
        cardinal_points: { north, east, south, west },
        segments,
        segment_analysis,
        semantic_positions
      }
    };
  }
}