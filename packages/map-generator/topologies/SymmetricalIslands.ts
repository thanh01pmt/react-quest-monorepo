/**
 * Symmetrical Islands Topology
 * Creates symmetrical floating island platforms connected by bridges
 */

import { BaseTopology } from './BaseTopology';
import { IPathInfo, Coord } from '../types';

export class SymmetricalIslandsTopology extends BaseTopology {
  *generatePathInfoVariants(
    gridSize: [number, number, number],
    params: Record<string, any>,
    maxVariants: number
  ): Generator<IPathInfo> {
    const baseIslands = params.num_islands || 4;
    
    for (let i = 0; i < maxVariants; i++) {
      yield this.generatePathInfo(gridSize, {
        ...params,
        num_islands: baseIslands + i * 2,
        island_size: 2 + (i % 2)
      });
    }
  }

  generatePathInfo(gridSize: [number, number, number], params: Record<string, any>): IPathInfo {
    const numIslands = params.num_islands || 4;
    const islandSize = params.island_size || 2;
    const spacing = params.spacing || 3;
    const startX = params.start_x || 3;
    const startZ = params.start_z || 3;
    const y = 0;

    const placementCoords: Coord[] = [];
    const islands: Coord[][] = [];
    const bridges: Coord[][] = [];

    // Create islands in a grid pattern (2x2 or larger)
    const cols = Math.ceil(Math.sqrt(numIslands));
    const rows = Math.ceil(numIslands / cols);

    let islandIndex = 0;
    for (let row = 0; row < rows && islandIndex < numIslands; row++) {
      for (let col = 0; col < cols && islandIndex < numIslands; col++) {
        const islandCoords: Coord[] = [];
        const baseX = startX + col * (islandSize + spacing);
        const baseZ = startZ + row * (islandSize + spacing);

        // Create square island
        for (let dx = 0; dx < islandSize; dx++) {
          for (let dz = 0; dz < islandSize; dz++) {
            const coord: Coord = [baseX + dx, y, baseZ + dz];
            islandCoords.push(coord);
            placementCoords.push(coord);
          }
        }
        islands.push(islandCoords);
        islandIndex++;
      }
    }

    // Create bridges between adjacent islands
    for (let i = 0; i < islands.length; i++) {
      const island = islands[i];
      const centerX = island[0][0] + Math.floor(islandSize / 2);
      const centerZ = island[0][2] + Math.floor(islandSize / 2);

      // Connect to next island in row (if exists)
      if ((i + 1) % cols !== 0 && i + 1 < islands.length) {
        const nextIsland = islands[i + 1];
        const nextCenterX = nextIsland[0][0];
        const bridgeCoords: Coord[] = [];
        
        for (let x = centerX + islandSize; x < nextCenterX; x++) {
          const coord: Coord = [x, y, centerZ];
          bridgeCoords.push(coord);
          placementCoords.push(coord);
        }
        bridges.push(bridgeCoords);
      }

      // Connect to island in next row (if exists)
      if (i + cols < islands.length) {
        const belowIsland = islands[i + cols];
        const belowCenterZ = belowIsland[0][2];
        const bridgeCoords: Coord[] = [];
        
        for (let z = centerZ + islandSize; z < belowCenterZ; z++) {
          const coord: Coord = [centerX, y, z];
          bridgeCoords.push(coord);
          placementCoords.push(coord);
        }
        bridges.push(bridgeCoords);
      }
    }

    // Path from first island to last island
    const pathCoords: Coord[] = [];
    if (islands.length > 0) {
      pathCoords.push(...islands[0]);
      for (let i = 0; i < bridges.length; i++) {
        pathCoords.push(...bridges[i]);
        if (i + 1 < islands.length) {
          pathCoords.push(...islands[i + 1]);
        }
      }
    }

    const startPos = islands[0]?.[0] || [startX, y, startZ];
    const lastIsland = islands[islands.length - 1];
    const targetPos = lastIsland?.[lastIsland.length - 1] || [startX + 5, y, startZ + 5];

    // Semantic positions
    const semantic_positions = {
        start: startPos,
        end: targetPos,
        first_island: islands[0] ? islands[0][Math.floor(islands[0].length / 2)] : startPos,
        last_island: lastIsland ? lastIsland[Math.floor(lastIsland.length / 2)] : targetPos,
        optimal_start: 'start',
        optimal_end: 'end',
        valid_pairs: [
            {
                name: 'island_hopping_easy',
                start: 'start',
                end: 'end',
                path_type: 'island_traversal',
                strategies: ['function_reuse', 'symmetric_pattern'],
                difficulty: 'EASY',
                teaching_goal: 'Navigate symmetric islands with repeated pattern'
            },
            {
                name: 'bridge_crossing_medium',
                start: 'first_island',
                end: 'last_island',
                path_type: 'bridge_navigation',
                strategies: ['segment_pattern_reuse'],
                difficulty: 'MEDIUM',
                teaching_goal: 'Cross bridges between islands'
            }
        ]
    };

    // Segment analysis: islands + bridges
    const allSegments = [...islands, ...bridges];
    const lengths = allSegments.map(s => s.length);
    const segment_analysis = {
        num_segments: allSegments.length,
        lengths,
        types: [...islands.map(() => 'island'), ...bridges.map(() => 'bridge')],
        min_length: lengths.length > 0 ? Math.min(...lengths) : 0,
        max_length: lengths.length > 0 ? Math.max(...lengths) : 0,
        avg_length: lengths.length > 0 ? lengths.reduce((a,b) => a+b, 0) / lengths.length : 0
    };

    return {
      start_pos: startPos,
      target_pos: targetPos,
      path_coords: pathCoords,
      placement_coords: placementCoords,
      obstacles: [],
      metadata: {
        topology_type: 'symmetrical_islands',
        islands: islands,
        bridges: bridges,
        num_islands: islands.length,
        segments: allSegments,
        segment_analysis,
        semantic_positions
      },
    };
  }
}
