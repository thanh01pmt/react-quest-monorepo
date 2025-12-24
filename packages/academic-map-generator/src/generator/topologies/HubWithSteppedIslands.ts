/**
 * Hub With Stepped Islands Topology (PORTED FROM PYTHON)
 * Creates a central hub island connected to satellite islands at different heights.
 * Islands are connected by staircases that go up or down.
 * Ideal for teaching functions with parameters and 3D navigation.
 */

import { BaseTopology } from './BaseTopology';
import { IPathInfo, Coord } from '../types';

// Direction vectors
const FORWARD_Z: [number, number, number] = [0, 0, 1];  // North
const FORWARD_X: [number, number, number] = [1, 0, 0];  // East
const BACKWARD_Z: [number, number, number] = [0, 0, -1]; // South
const BACKWARD_X: [number, number, number] = [-1, 0, 0]; // West

const addVectors = (a: Coord, b: [number, number, number]): Coord => 
  [a[0] + b[0], a[1] + b[1], a[2] + b[2]];

const scaleVector = (v: [number, number, number], s: number): [number, number, number] =>
  [v[0] * s, v[1] * s, v[2] * s];

export class HubWithSteppedIslandsTopology extends BaseTopology {
  *generatePathInfoVariants(
    gridSize: [number, number, number],
    params: Record<string, any>,
    maxVariants: number
  ): Generator<IPathInfo> {
    let count = 0;

    // Height scenarios: positive = up, negative = down
    const scenarios = [
      [3, -3],              // 2 islands: 1 up, 1 down
      [2, -2, 4],           // 3 islands: mixed heights
      [2, 3, 4],            // 3 islands: all up
      [2, -2, 3, -3],       // 4 islands
      [-2, -3, -4]          // 3 islands: all down
    ];

    for (const scenario of scenarios) {
      if (count >= maxVariants) return;
      yield this.generatePathInfo(gridSize, {
        ...params,
        height_options: scenario
      });
      count++;
    }
  }

  /**
   * Create a square platform centered at the given position.
   */
  private _createSquarePlatform(center: Coord, size: number): Coord[] {
    const [cx, cy, cz] = center;
    const half = Math.floor(size / 2);
    const coords: Coord[] = [];
    
    for (let xOffset = -half; xOffset <= half; xOffset++) {
      for (let zOffset = -half; zOffset <= half; zOffset++) {
        coords.push([cx + xOffset, cy, cz + zOffset]);
      }
    }
    return coords;
  }

  /**
   * Create a staircase from start_point in direction with height_diff.
   * Positive height_diff = going up, negative = going down.
   * Each step moves 1 horizontal unit and 1 vertical unit.
   * @param gapSize - Additional flat blocks at the end
   */
  private _createStaircase(
    startPoint: Coord, 
    direction: [number, number, number], 
    heightDiff: number, 
    gapSize: number
  ): { pathCoords: Coord[]; obstacles: any[] } {
    const pathCoords: Coord[] = [];
    const obstacles: any[] = [];
    let currentPos: Coord = [...startPoint];

    // Create staircase with 1-height steps (jumpable)
    const stepsNeeded = Math.abs(heightDiff);
    const yStep = heightDiff > 0 ? 1 : -1;

    for (let i = 0; i < stepsNeeded; i++) {
      // Move horizontally
      currentPos = addVectors(currentPos, direction);
      // Change height
      currentPos = [currentPos[0], currentPos[1] + yStep, currentPos[2]];
      pathCoords.push([...currentPos]);
    }

    // Add gap blocks at final height (no Y change)
    const remainingGap = gapSize - stepsNeeded;
    for (let i = 0; i < remainingGap && remainingGap > 0; i++) {
      currentPos = addVectors(currentPos, direction);
      pathCoords.push([...currentPos]);
    }

    return { pathCoords, obstacles };
  }

  generatePathInfo(gridSize: [number, number, number], params: Record<string, any>): IPathInfo {
    console.log("    LOG: Generating 'hub_with_stepped_islands' topology...");

    const hubSize = params.hub_size || 3;
    const islandSize = params.island_size || 3;
    const gapSize = params.gap_size || 3;
    
    // Height options: each value is the height difference for that island
    let heightOptions: number[] = params.height_options;
    if (!heightOptions || !Array.isArray(heightOptions) || heightOptions.length === 0) {
      heightOptions = [2, -2, 3, -3]; // Default: 4 islands with mixed heights
    }

    const numIslands = heightOptions.length;

    // Center the hub in the grid
    const centerX = params.center_x || Math.floor(gridSize[0] / 2);
    const centerZ = params.center_z || Math.floor(gridSize[2] / 2);

    const placementCoords: Coord[] = [];
    const obstacles: any[] = [];
    const branches: Coord[][] = [];

    // 1. Create central hub
    const hubCenter: Coord = [centerX, 0, centerZ];
    const startPos = hubCenter;
    const hubCoords = this._createSquarePlatform(hubCenter, hubSize);
    placementCoords.push(...hubCoords);

    // 2. Define directions for satellite islands (N, E, S, W)
    const allDirections = [FORWARD_Z, FORWARD_X, BACKWARD_Z, BACKWARD_X];
    
    // Shuffle height options for randomness
    const shuffledHeights = [...heightOptions].sort(() => Math.random() - 0.5);
    
    // Use only as many directions as we have islands
    const directions = numIslands < allDirections.length 
      ? this._shuffleArray([...allDirections]).slice(0, numIslands)
      : allDirections;

    // 3. Create staircases and islands
    const islandCenters: Coord[] = [];
    
    for (let i = 0; i < numIslands; i++) {
      const direction = directions[i % directions.length];
      const heightDiff = shuffledHeights[i];

      // Start point of staircase: edge of hub
      const stairStartPoint = addVectors(hubCenter, scaleVector(direction, Math.floor(hubSize / 2)));

      // Create staircase
      const { pathCoords: stairPath, obstacles: stairObstacles } = 
        this._createStaircase(stairStartPoint, direction, heightDiff, gapSize);
      obstacles.push(...stairObstacles);

      // Entry point of island (end of staircase)
      const islandEntryPoint = stairPath.length > 0 ? stairPath[stairPath.length - 1] : stairStartPoint;

      // Create satellite island
      const islandCenter = addVectors(islandEntryPoint, scaleVector(direction, Math.floor(islandSize / 2)));
      const islandCoords = this._createSquarePlatform(islandCenter, islandSize);
      islandCenters.push(islandCenter);

      // Add to placement coords
      placementCoords.push(...islandCoords);
      placementCoords.push(...stairPath);

      // Record branch for metadata
      const branchPath: Coord[] = [hubCenter, stairStartPoint, ...stairPath, islandCenter];
      branches.push(branchPath);
    }

    // Deduplicate placement_coords (all walkable tiles)
    const dedupedPlacement = this._deduplicateCoords(placementCoords);

    // Target is center of last island
    const targetPos = branches.length > 0 
      ? branches[branches.length - 1][branches[branches.length - 1].length - 1]
      : startPos;

    // Compute path_coords using BFS pathfinding
    // This is the SHORTEST path from start to target through walkable tiles
    const pathCoords = this.computePathCoords(startPos, targetPos, dedupedPlacement);

    // Semantic positions (matching Python)
    const semantic_positions: Record<string, any> = {
      hub_center: hubCenter,
      optimal_start: 'hub_center',
      optimal_end: islandCenters.length > 0 ? 'island_0' : 'hub_center',
      valid_pairs: [
        {
          name: 'hub_to_island_easy',
          start: 'hub_center',
          end: 'island_0',
          path_type: 'single_island',
          strategies: ['function_reuse', 'hub_spoke'],
          difficulty: 'EASY',
          teaching_goal: 'Simple hub to single island traversal'
        },
        {
          name: 'hub_to_far_island_medium',
          start: 'hub_center',
          end: 'island_last',
          path_type: 'cross_hub',
          strategies: ['function_reuse', 'island_replication'],
          difficulty: 'MEDIUM',
          teaching_goal: 'Visit multiple islands with PROCEDURE reuse'
        },
        {
          name: 'island_to_island_hard',
          start: 'island_0',
          end: 'island_last',
          path_type: 'full_traversal',
          strategies: ['function_reuse', 'hub_spoke'],
          difficulty: 'HARD',
          teaching_goal: 'Visit all islands with identical patterns'
        }
      ]
    };

    // Add island positions dynamically
    for (let i = 0; i < islandCenters.length; i++) {
      semantic_positions[`island_${i}`] = islandCenters[i];
    }
    if (islandCenters.length > 0) {
      semantic_positions['island_last'] = islandCenters[islandCenters.length - 1];
    }

    // Segments for analysis
    const allSegments: Coord[][] = [hubCoords, ...branches];
    const lengths = allSegments.map(s => s.length);
    const segment_analysis = {
      num_segments: allSegments.length,
      lengths,
      types: ['hub', ...branches.map((_, i) => `spoke_${i}`)],
      min_length: lengths.length > 0 ? Math.min(...lengths) : 0,
      max_length: lengths.length > 0 ? Math.max(...lengths) : 0,
      avg_length: lengths.length > 0 ? lengths.reduce((a, b) => a + b, 0) / lengths.length : 0
    };

    return {
      start_pos: startPos,
      target_pos: targetPos,
      path_coords: pathCoords,           // DYNAMIC: shortest path
      placement_coords: dedupedPlacement, // STATIC: all walkable tiles
      obstacles: obstacles,
      metadata: {
        topology_type: 'hub_with_stepped_islands',
        branches: branches,
        hub: hubCoords,
        hub_center: hubCenter,
        island_centers: islandCenters,
        height_options: heightOptions,
        num_spokes: numIslands,
        segments: allSegments,
        segment_analysis,
        semantic_positions
      }
    };
  }

}
