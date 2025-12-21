/**
 * Grid With Holes Topology
 * Creates a rectangular grid area with random holes
 */

import { BaseTopology } from './BaseTopology';
import { IPathInfo, Coord } from '../types';

export class GridWithHolesTopology extends BaseTopology {
  *generatePathInfoVariants(
    gridSize: [number, number, number],
    params: Record<string, any>,
    maxVariants: number
  ): Generator<IPathInfo> {
    const sizes = [6, 7, 8, 9, 10];
    const holes = [0.15, 0.25, 0.35];
    let count = 0;
    
    for (const size of sizes) {
      for (const holeChance of holes) {
        if (count >= maxVariants) return;
        yield this.generatePathInfo(gridSize, {
          ...params,
          grid_width: size,
          grid_depth: size,
          hole_chance: holeChance
        });
        count++;
      }
    }
  }

  generatePathInfo(gridSize: [number, number, number], params: Record<string, any>): IPathInfo {
    const width = Math.min(params.grid_width || 8, gridSize[0] - 2);
    const depth = Math.min(params.grid_depth || 8, gridSize[2] - 2);
    const holeChance = params.hole_chance || 0.25;
    const startXOffset = params.start_x || 1;
    const startZOffset = params.start_z || 1;
    const y = 0;

    // Create full grid
    const allGridCoords = new Set<string>();
    for (let x = 0; x < width; x++) {
      for (let z = 0; z < depth; z++) {
        allGridCoords.add(`${startXOffset + x},${y},${startZOffset + z}`);
      }
    }

    // Pick random start and target
    const coordsList = Array.from(allGridCoords);
    const startKey = coordsList[Math.floor(Math.random() * coordsList.length)];
    let targetKey = coordsList[Math.floor(Math.random() * coordsList.length)];
    while (targetKey === startKey) {
      targetKey = coordsList[Math.floor(Math.random() * coordsList.length)];
    }

    // Create holes (except at start and target)
    const holes = new Set<string>();
    for (const key of coordsList) {
      if (key !== startKey && key !== targetKey && Math.random() < holeChance) {
        holes.add(key);
      }
    }

    // Walkable coords
    const walkableSet = new Set<string>();
    for (const key of coordsList) {
      if (!holes.has(key)) {
        walkableSet.add(key);
      }
    }

    const parseKey = (key: string): Coord => {
      const [x, y, z] = key.split(',').map(Number);
      return [x, y, z];
    };

    const startPos = parseKey(startKey);
    const targetPos = parseKey(targetKey);

    // Find path using BFS
    const pathCoords = this.findPath(startPos, targetPos, walkableSet);

    // If no path found, create a direct path
    if (pathCoords.length === 0) {
      const directPath = this.createDirectPath(startPos, targetPos);
      for (const coord of directPath) {
        const key = `${coord[0]},${coord[1]},${coord[2]}`;
        holes.delete(key);
        walkableSet.add(key);
      }
      pathCoords.push(...directPath);
    }

    const placementCoords: Coord[] = Array.from(walkableSet).map(parseKey);

    // Semantic positions
    const semantic_positions = {
        start: startPos,
        end: targetPos,
        optimal_start: 'start',
        optimal_end: 'end',
        valid_pairs: [
            {
                name: 'avoid_holes_easy',
                start: 'start',
                end: 'end',
                path_type: 'obstacle_avoidance',
                strategies: ['conditional_branching', 'path_planning'],
                difficulty: 'EASY',
                teaching_goal: 'Navigate around holes to reach goal'
            },
            {
                name: 'complex_route_hard',
                start: 'start',
                end: 'end',
                path_type: 'complex_navigation',
                strategies: ['backtracking', 'maze_solving'],
                difficulty: 'HARD',
                teaching_goal: 'Find optimal path through holes'
            }
        ]
    };

    // Segment analysis based on path
    const segment_analysis = {
        num_segments: 1,
        lengths: [pathCoords.length],
        types: ['grid_path'],
        min_length: pathCoords.length,
        max_length: pathCoords.length,
        avg_length: pathCoords.length
    };

    return {
      start_pos: startPos,
      target_pos: targetPos,
      path_coords: pathCoords,
      placement_coords: placementCoords,
      obstacles: [],
      metadata: {
        topology_type: 'grid_with_holes',
        holes: Array.from(holes).map(parseKey),
        width: width,
        depth: depth,
        segments: [pathCoords],
        segment_analysis,
        semantic_positions
      },
    };
  }

  private findPath(start: Coord, end: Coord, walkable: Set<string>): Coord[] {
    const startKey = `${start[0]},${start[1]},${start[2]}`;
    const endKey = `${end[0]},${end[1]},${end[2]}`;
    
    const queue: { pos: Coord; path: Coord[] }[] = [{ pos: start, path: [start] }];
    const visited = new Set<string>([startKey]);

    while (queue.length > 0) {
      const { pos, path } = queue.shift()!;
      const posKey = `${pos[0]},${pos[1]},${pos[2]}`;

      if (posKey === endKey) return path;

      for (const [dx, dz] of [[0, 1], [0, -1], [1, 0], [-1, 0]]) {
        const next: Coord = [pos[0] + dx, pos[1], pos[2] + dz];
        const nextKey = `${next[0]},${next[1]},${next[2]}`;

        if (walkable.has(nextKey) && !visited.has(nextKey)) {
          visited.add(nextKey);
          queue.push({ pos: next, path: [...path, next] });
        }
      }
    }
    return [];
  }

  private createDirectPath(start: Coord, end: Coord): Coord[] {
    const path: Coord[] = [start];
    let [x, y, z] = start;

    // Move along X
    const stepX = end[0] > x ? 1 : -1;
    while (x !== end[0]) {
      x += stepX;
      path.push([x, y, z]);
    }

    // Move along Z
    const stepZ = end[2] > z ? 1 : -1;
    while (z !== end[2]) {
      z += stepZ;
      path.push([x, y, z]);
    }

    return path;
  }
}
