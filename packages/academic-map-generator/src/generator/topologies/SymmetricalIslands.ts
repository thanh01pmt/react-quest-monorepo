/**
 * Symmetrical Islands Topology (PORTED FROM PYTHON)
 * Creates identical island structures connected by bridges.
 * Ideal for teaching about pattern recognition and function reuse.
 */

import { BaseTopology } from './BaseTopology';
import { IPathInfo, Coord } from '../types';

export class SymmetricalIslandsTopology extends BaseTopology {
  /**
   * Create an island pattern at the given corner.
   * Supports: 'u_shape', 'l_shape', 'plus_shape', 'square_shape'
   */
  private _createIslandPattern(topLeftCorner: Coord, patternName: string): { 
    path: Coord[]; 
    size: [number, number] 
  } {
    const [x, y, z] = topLeftCorner;
    let path: Coord[] = [];
    let size: [number, number] = [0, 0];

    switch (patternName) {
      case 'l_shape':
        // L-shape, 3x3
        path = [
          [x, y, z], [x, y, z + 1], [x, y, z + 2],
          [x + 1, y, z + 2], [x + 2, y, z + 2]
        ];
        size = [3, 3];
        break;
      case 'plus_shape':
        // Plus shape, 3x3
        path = [
          [x + 1, y, z],
          [x, y, z + 1], [x + 1, y, z + 1], [x + 2, y, z + 1],
          [x + 1, y, z + 2]
        ];
        size = [3, 3];
        break;
      case 'square_shape':
        // Hollow square, 3x3
        path = [
          [x, y, z], [x + 1, y, z], [x + 2, y, z],
          [x + 2, y, z + 1], [x + 2, y, z + 2],
          [x + 1, y, z + 2], [x, y, z + 2], [x, y, z + 1]
        ];
        size = [3, 3];
        break;
      case 'u_shape':
      default:
        // U-shape, 2x2
        path = [
          [x, y, z], [x + 1, y, z],
          [x + 1, y, z + 1], [x, y, z + 1]
        ];
        size = [2, 2];
        break;
    }

    return { path, size };
  }

  *generatePathInfoVariants(
    gridSize: [number, number, number],
    params: Record<string, any>,
    maxVariants: number
  ): Generator<IPathInfo> {
    let count = 0;
    
    // Loop through possible island counts
    for (let numIslands = 2; numIslands <= 5; numIslands++) {
      if (count >= maxVariants) return;
      yield this.generatePathInfo(gridSize, { ...params, num_islands: numIslands });
      count++;
    }
  }

  generatePathInfo(gridSize: [number, number, number], params: Record<string, any>): IPathInfo {
    console.log("    LOG: Generating 'symmetrical_islands' topology...");

    // Parse num_islands (supports both number and range array)
    let numIslands: number;
    const numIslandsParam = params.num_islands || 2;
    if (Array.isArray(numIslandsParam) && numIslandsParam.length === 2) {
      numIslands = Math.floor(numIslandsParam[0] + Math.random() * (numIslandsParam[1] - numIslandsParam[0] + 1));
    } else {
      numIslands = numIslandsParam;
    }

    // Get island pattern
    const islandPatternName = params.island_pattern || 'u_shape';

    // Calculate island size
    const { size: islandSize } = this._createIslandPattern([0, 0, 0], islandPatternName);
    const islandWidth = islandSize[0];
    const islandDepth = islandSize[1];

    // Calculate spacing
    let islandSpacing: number;
    if ('island_gap' in params) {
      const islandGap = parseInt(params.island_gap);
      islandSpacing = islandWidth + islandGap;
    } else {
      const totalIslandsWidth = numIslands * islandWidth;
      const availableSpacing = gridSize[0] - totalIslandsWidth - 2;
      islandSpacing = numIslands > 1 
        ? islandWidth + Math.floor(availableSpacing / (numIslands - 1))
        : 0;
    }

    // Calculate safe start position
    const startX = params.start_x || 1;
    const startZ = params.start_z || Math.max(1, Math.floor(Math.random() * (gridSize[2] - islandDepth - 2)) + 1);
    const y = 0;

    const startPos: Coord = [startX, y, startZ];
    const allPathCoords: Coord[] = [startPos];
    const islandPlacementCoords: Coord[] = [];
    const islandsList: Coord[][] = [];
    const bridges: Coord[][] = [];

    // Create islands
    for (let i = 0; i < numIslands; i++) {
      // Calculate island corner position
      const islandCorner: Coord = i > 0 
        ? [startX + i * islandSpacing, y, startZ]
        : startPos;

      // Create island path
      const { path: islandPath } = this._createIslandPattern(islandCorner, islandPatternName);
      islandPlacementCoords.push(...islandPath);
      islandsList.push(islandPath);

      // Add island path to all_path_coords (avoiding duplicates)
      for (const p of islandPath) {
        if (!allPathCoords.some(c => c[0] === p[0] && c[1] === p[1] && c[2] === p[2])) {
          allPathCoords.push(p);
        }
      }

      // Create bridge to next island (if not last island)
      if (i < numIslands - 1) {
        const bridgeStart = allPathCoords[allPathCoords.length - 1];
        const bridgeEndX = startX + (i + 1) * islandSpacing;
        const bridgeCoords: Coord[] = [];

        // Step 1: Go back to base Z (start_z) along Z axis
        let currentZ = bridgeStart[2];
        while (currentZ > startZ) {
          currentZ--;
          const coord: Coord = [bridgeStart[0], y, currentZ];
          allPathCoords.push(coord);
          bridgeCoords.push(coord);
        }

        // Step 2: Go forward along X axis
        let currentX = bridgeStart[0];
        while (currentX < bridgeEndX) {
          currentX++;
          const coord: Coord = [currentX, y, startZ];
          allPathCoords.push(coord);
          bridgeCoords.push(coord);
        }

        bridges.push(bridgeCoords);
      }
    }

    const targetPos = allPathCoords[allPathCoords.length - 1];

    // Semantic positions (matching Python)
    const semantic_positions = {
      start: startPos,
      end: targetPos,
      optimal_start: 'start',
      optimal_end: 'end',
      valid_pairs: [
        {
          name: 'identical_islands_easy',
          start: 'start',
          end: 'end',
          path_type: 'island_traversal',
          strategies: ['island_replication', 'function_reuse'],
          difficulty: 'EASY',
          teaching_goal: 'Identical items per island'
        },
        {
          name: 'varied_island_sizes_medium',
          start: 'start',
          end: 'end',
          path_type: 'progressive_islands',
          strategies: ['island_replication', 'symmetric_traversal'],
          difficulty: 'MEDIUM',
          teaching_goal: 'Pattern varies by island'
        },
        {
          name: 'cross_island_pattern_hard',
          start: 'start',
          end: 'end',
          path_type: 'cross_island',
          strategies: ['island_replication', 'function_reuse'],
          difficulty: 'HARD',
          teaching_goal: 'Cross-island pattern recognition'
        }
      ]
    };

    // Segment analysis
    const allSegments = [...islandsList, ...bridges];
    const lengths = allSegments.map(s => s.length);
    const segment_analysis = {
      num_segments: allSegments.length,
      lengths,
      types: [...islandsList.map(() => 'island'), ...bridges.map(() => 'bridge')],
      min_length: lengths.length > 0 ? Math.min(...lengths) : 0,
      max_length: lengths.length > 0 ? Math.max(...lengths) : 0,
      avg_length: lengths.length > 0 ? lengths.reduce((a, b) => a + b, 0) / lengths.length : 0
    };

    // Deduplicate placement coords (all walkable tiles)
    const dedupedPlacement = this._deduplicateCoords(allPathCoords);
    
    // Compute path_coords using BFS pathfinding
    const computedPath = this.computePathCoords(startPos, targetPos, dedupedPlacement);

    return {
      start_pos: startPos,
      target_pos: targetPos,
      path_coords: computedPath,          // DYNAMIC: shortest path
      placement_coords: dedupedPlacement, // STATIC: all walkable tiles
      obstacles: [],
      metadata: {
        topology_type: 'symmetrical_islands',
        islands: islandsList,
        bridges: bridges,
        num_islands: numIslands,
        island_pattern: islandPatternName,
        segments: allSegments,
        segment_analysis,
        semantic_positions
      }
    };
  }
}
