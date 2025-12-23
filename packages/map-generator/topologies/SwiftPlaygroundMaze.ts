/**
 * Swift Playground Maze Topology
 * Creates a multi-level maze with platforms connected by staircases
 * Inspired by Apple's Swift Playgrounds
 */

import { BaseTopology } from './BaseTopology';
import { IPathInfo, Coord } from '../types';

export class SwiftPlaygroundMazeTopology extends BaseTopology {
  private mazeWidth = 20;
  private mazeDepth = 20;

  *generatePathInfoVariants(
    gridSize: [number, number, number],
    params: Record<string, any>,
    maxVariants: number
  ): Generator<IPathInfo> {
    let count = 0;
    for (let numPlatforms = 3; numPlatforms <= 8; numPlatforms++) {
      for (const platformSize of [3, 5]) {
        if (count >= maxVariants) return;
        yield this.generatePathInfo(gridSize, {
          ...params,
          num_platforms: numPlatforms,
          platform_size: platformSize
        });
        count++;
      }
    }
  }

  generatePathInfo(gridSize: [number, number, number], params: Record<string, any>): IPathInfo {
    const numPlatforms = params.num_platforms || 5;
    const platformSize = Math.max(3, params.platform_size || 3);
    const heightIncrease = params.height_increase || 2;
    const stepDistance = params.step_distance || platformSize + 2;
    const y = 0;

    const platformRadius = Math.floor(platformSize / 2);
    const placementCoords: Coord[] = [];
    const pathCoords: Coord[] = [];
    const waypoints: Coord[] = [];

    // Generate waypoints for platforms
    let currentPos: Coord = [1 + platformRadius, 0, 1 + platformRadius];
    waypoints.push([...currentPos]);

    const directions: [number, number][] = [[1, 0], [-1, 0], [0, 1], [0, -1]];
    let lastAxis = -1;

    for (let i = 0; i < numPlatforms - 1; i++) {
      let moved = false;
      
      // Shuffle directions for randomness
      const shuffled = [...directions].sort(() => Math.random() - 0.5);

      for (const [dx, dz] of shuffled) {
        const axis = dx !== 0 ? 0 : 1;
        if (axis === lastAxis) continue;

        const nextX = currentPos[0] + dx * stepDistance;
        const nextZ = currentPos[2] + dz * stepDistance;
        const nextY = currentPos[1] + heightIncrease;

        if (nextX >= 1 + platformRadius && nextX <= this.mazeWidth - platformRadius &&
            nextZ >= 1 + platformRadius && nextZ <= this.mazeDepth - platformRadius) {
          currentPos = [nextX, nextY, nextZ];
          waypoints.push([...currentPos]);
          lastAxis = axis;
          moved = true;
          break;
        }
      }

      if (!moved) break;
    }

    // Create platforms and connect them
    const startPos = waypoints[0];
    pathCoords.push(startPos);
    this.addPlatform(placementCoords, startPos[0], startPos[2], startPos[1], platformSize);

    for (let i = 0; i < waypoints.length - 1; i++) {
      const p1 = waypoints[i];
      const p2 = waypoints[i + 1];

      const dx = p2[0] > p1[0] ? 1 : p2[0] < p1[0] ? -1 : 0;
      const dz = p2[2] > p1[2] ? 1 : p2[2] < p1[2] ? -1 : 0;
      const yStep = p2[1] > p1[1] ? 1 : -1;
      const numSteps = Math.abs(p2[1] - p1[1]);

      let current: Coord = [...p1];

      // Edge step
      current = [current[0] + dx, current[1], current[2] + dz];
      placementCoords.push([...current]);
      pathCoords.push([...current]);

      // Staircase steps
      for (let step = 0; step < numSteps; step++) {
        current = [current[0] + dx, current[1] + yStep, current[2] + dz];
        placementCoords.push([...current]);
        pathCoords.push([...current]);
      }

      // Add destination platform
      this.addPlatform(placementCoords, p2[0], p2[2], p2[1], platformSize);

      // Connect to platform center
      while ((dx !== 0 && current[0] !== p2[0]) || (dz !== 0 && current[2] !== p2[2])) {
        if (dx !== 0 && current[0] !== p2[0]) current = [current[0] + dx, current[1], current[2]];
        else if (dz !== 0 && current[2] !== p2[2]) current = [current[0], current[1], current[2] + dz];
        placementCoords.push([...current]);
        pathCoords.push([...current]);
      }
    }

    const targetPos = waypoints[waypoints.length - 1];

    // Deduplicate coords
    const uniquePlacement = this.deduplicateCoords(placementCoords);
    const uniquePath = this.deduplicateCoords(pathCoords);

    // Semantic positions
    const semantic_positions = {
        start: startPos,
        end: targetPos,
        waypoints: waypoints,
        mid_waypoint: waypoints[Math.floor(waypoints.length / 2)] || startPos,
        optimal_start: 'start',
        optimal_end: 'end',
        valid_pairs: [
            {
                name: 'platform_hopping_easy',
                start: 'start',
                end: 'end',
                path_type: 'platform_traversal',
                strategies: ['level_progression', 'height_navigation'],
                difficulty: 'EASY',
                teaching_goal: 'Navigate between platforms using stairs'
            },
            {
                name: 'multi_level_medium',
                start: 'start',
                end: 'end',
                path_type: '3d_navigation',
                strategies: ['3d_movement', 'platform_logic'],
                difficulty: 'MEDIUM',
                teaching_goal: 'Complex 3D navigation with height changes'
            }
        ]
    };

    // Segment analysis based on path between platforms
    const segment_analysis = {
        num_segments: waypoints.length,
        lengths: [uniquePath.length],
        types: ['platform_path'],
        min_length: uniquePath.length,
        max_length: uniquePath.length,
        avg_length: uniquePath.length
    };

    return {
      start_pos: startPos,
      target_pos: targetPos,
      path_coords: uniquePath,
      placement_coords: uniquePlacement,
      obstacles: [],
      metadata: {
        topology_type: 'swift_playground_maze',
        waypoints: waypoints,
        num_platforms: waypoints.length,
        platform_size: platformSize,
        segments: [uniquePath],
        segment_analysis,
        semantic_positions
      },
    };
  }

  private addPlatform(coords: Coord[], cx: number, cz: number, y: number, size: number): void {
    const radius = Math.floor(size / 2);
    for (let dx = -radius; dx <= radius; dx++) {
      for (let dz = -radius; dz <= radius; dz++) {
        const x = cx + dx;
        const z = cz + dz;
        if (x >= 0 && x < this.mazeWidth && z >= 0 && z < this.mazeDepth) {
          coords.push([x, y, z]);
        }
      }
    }
  }

  private deduplicateCoords(coords: Coord[]): Coord[] {
    const seen = new Set<string>();
    return coords.filter(coord => {
      const key = `${coord[0]},${coord[1]},${coord[2]}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }
}
