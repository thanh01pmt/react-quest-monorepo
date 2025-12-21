/**
 * Plus Shape Islands Topology
 * Creates 4 islands arranged in a plus pattern with bridges to center
 */

import { BaseTopology } from './BaseTopology';
import { IPathInfo, Coord } from '../types';

export class PlusShapeIslandsTopology extends BaseTopology {
  *generatePathInfoVariants(
    gridSize: [number, number, number],
    params: Record<string, any>,
    maxVariants: number
  ): Generator<IPathInfo> {
    const baseArmLength = params.arm_length || 4;
    
    for (let i = 0; i < maxVariants; i++) {
      const armLength = baseArmLength + i;
      if (armLength > 8) break;
      yield this.generatePathInfo(gridSize, {
        ...params,
        arm_length: armLength
      });
    }
  }

  generatePathInfo(gridSize: [number, number, number], params: Record<string, any>): IPathInfo {
    const armLength = params.arm_length || 4;
    const islandSize = params.island_size || 2;
    const centerX = params.center_x || 10;
    const centerZ = params.center_z || 10;
    const y = 0;

    const placementCoords: Coord[] = [];
    const branches: Coord[][] = [];

    // Center hub
    const centerPos: Coord = [centerX, y, centerZ];
    placementCoords.push(centerPos);

    // Cardinal directions
    const directions: [number, number][] = [
      [1, 0],   // East
      [-1, 0],  // West
      [0, 1],   // North  
      [0, -1]   // South
    ];

    const islandCenters: Coord[] = [];

    for (const [dx, dz] of directions) {
      const branchCoords: Coord[] = [centerPos];

      // Create bridge from center to island
      for (let step = 1; step < armLength; step++) {
        const coord: Coord = [centerX + dx * step, y, centerZ + dz * step];
        branchCoords.push(coord);
        placementCoords.push(coord);
      }

      // Create island at the end
      const islandCenterX = centerX + dx * armLength;
      const islandCenterZ = centerZ + dz * armLength;
      islandCenters.push([islandCenterX, y, islandCenterZ]);

      const half = Math.floor(islandSize / 2);
      for (let ix = -half; ix <= half; ix++) {
        for (let iz = -half; iz <= half; iz++) {
          const coord: Coord = [islandCenterX + ix, y, islandCenterZ + iz];
          branchCoords.push(coord);
          placementCoords.push(coord);
        }
      }

      branches.push(branchCoords);
    }

    // Start from one island, end at opposite
    const startPos = islandCenters[0]; // East
    const targetPos = islandCenters[1]; // West

    // Path: East island -> center -> West island
    const pathCoords: Coord[] = [];
    pathCoords.push(...branches[0].slice().reverse()); // East to center
    pathCoords.push(...branches[1].slice(1)); // Center to West

    // Semantic positions
    const semantic_positions = {
        start: startPos,
        end: targetPos,
        center: centerPos,
        island_east: islandCenters[0],
        island_west: islandCenters[1],
        island_north: islandCenters[2],
        island_south: islandCenters[3],
        optimal_start: 'start',
        optimal_end: 'end',
        valid_pairs: [
            {
                name: 'island_to_island_easy',
                start: 'island_east',
                end: 'island_west',
                path_type: 'hub_traversal',
                strategies: ['radial_iteration', 'function_reuse'],
                difficulty: 'EASY',
                teaching_goal: 'Navigate through center hub'
            },
            {
                name: 'visit_all_medium',
                start: 'start',
                end: 'end',
                path_type: 'full_exploration',
                strategies: ['radial_iteration', 'branch_exploration'],
                difficulty: 'MEDIUM',
                teaching_goal: 'Visit all islands using symmetric pattern'
            }
        ]
    };

    // Segment analysis based on branches
    const lengths = branches.map(b => b.length);
    const segment_analysis = {
        num_segments: branches.length,
        lengths,
        types: ['branch_east', 'branch_west', 'branch_north', 'branch_south'],
        min_length: Math.min(...lengths),
        max_length: Math.max(...lengths),
        avg_length: lengths.reduce((a,b) => a+b, 0) / lengths.length
    };

    return {
      start_pos: startPos,
      target_pos: targetPos,
      path_coords: pathCoords,
      placement_coords: placementCoords,
      obstacles: [],
      metadata: {
        topology_type: 'plus_shape_islands',
        branches: branches,
        hub: [centerPos],
        island_centers: islandCenters,
        segments: branches,
        segment_analysis,
        semantic_positions
      },
    };
  }
}
