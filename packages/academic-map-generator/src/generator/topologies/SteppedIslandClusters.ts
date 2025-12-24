/**
 * Stepped Island Clusters Topology (PORTED FROM PYTHON)
 * Creates clusters of islands at different heights connected by staircases.
 * Ideal for teaching nested loops and height-based navigation.
 */

import { BaseTopology } from './BaseTopology';
import { IPathInfo, Coord } from '../types';

// Direction vectors
const FORWARD_X: [number, number, number] = [1, 0, 0];
const UP_Y: [number, number, number] = [0, 1, 0];

const addVectors = (a: Coord, b: [number, number, number]): Coord => 
  [a[0] + b[0], a[1] + b[1], a[2] + b[2]];

export class SteppedIslandClustersTopology extends BaseTopology {
  *generatePathInfoVariants(
    gridSize: [number, number, number],
    params: Record<string, any>,
    maxVariants: number
  ): Generator<IPathInfo> {
    let count = 0;
    
    // Loop through possible configurations
    for (let numClusters = 2; numClusters <= 3; numClusters++) {
      for (let islandsPerCluster = 2; islandsPerCluster <= 3; islandsPerCluster++) {
        if (count >= maxVariants) return;
        yield this.generatePathInfo(gridSize, {
          ...params,
          num_clusters: numClusters,
          islands_per_cluster: islandsPerCluster
        });
        count++;
      }
    }
  }

  /**
   * Create a square island at the given top-left corner.
   */
  private _createIsland(topLeftCorner: Coord, size: number = 2): Coord[] {
    const [x, y, z] = topLeftCorner;
    const coords: Coord[] = [];
    for (let i = 0; i < size; i++) {
      for (let j = 0; j < size; j++) {
        coords.push([x + i, y, z + j]);
      }
    }
    return coords;
  }

  /**
   * Create a staircase going up in the given direction.
   * Returns path_coords, surface_coords (for placement), and obstacle_coords.
   */
  private _createStaircase(
    startPoint: Coord, 
    direction: [number, number, number], 
    numSteps: number
  ): {
    pathCoords: Coord[];
    surfaceCoords: Coord[];
    obstacleCoords: Coord[];
  } {
    const pathCoords: Coord[] = [];
    const surfaceCoords: Coord[] = [];
    const obstacleCoords: Coord[] = [];
    let currentPos: Coord = [...startPoint];

    for (let step = 0; step < numSteps; step++) {
      // Step 1: Move horizontally (this becomes the obstacle to jump from)
      currentPos = addVectors(currentPos, direction);
      pathCoords.push([...currentPos]);
      obstacleCoords.push([...currentPos]);

      // Step 2: Landing position after jump (move up)
      currentPos = addVectors(currentPos, UP_Y);
      pathCoords.push([...currentPos]);
      surfaceCoords.push([...currentPos]); // Only the top surface is physical
    }

    return { pathCoords, surfaceCoords, obstacleCoords };
  }

  /**
   * Create a flat bridge from start to end along X axis.
   */
  private _createBridge(startPoint: Coord, endPoint: Coord): Coord[] {
    const path: Coord[] = [];
    let currX = startPoint[0];
    const y = startPoint[1];
    const z = startPoint[2];
    const endX = endPoint[0];
    const step = endX > currX ? 1 : -1;

    // Skip first point as it already exists
    while (currX !== endX) {
      currX += step;
      path.push([currX, y, z]);
    }
    return path;
  }

  generatePathInfo(gridSize: [number, number, number], params: Record<string, any>): IPathInfo {
    console.log("    LOG: Generating 'stepped_island_clusters' topology...");

    const numClusters = params.num_clusters || 2;
    const islandsPerCluster = params.islands_per_cluster || 2;
    const clusterSpacing = params.cluster_spacing || 8;
    const heightStep = params.height_step || 2;

    const startX = params.start_x || 2;
    const startZ = params.start_z || Math.floor(gridSize[2] / 2) - islandsPerCluster;
    let y = 0;

    const pathCoords: Coord[] = [];
    const placementCoords: Coord[] = [];
    const obstacles: any[] = [];
    const islandsList: Coord[][] = [];

    // Create first island as starting point
    const firstIsland = this._createIsland([startX, y, startZ], 2);
    placementCoords.push(...firstIsland);
    islandsList.push(firstIsland);
    
    const startPos: Coord = [startX, y, startZ];
    pathCoords.push(startPos);
    
    let lastExitPoint: Coord = [startX + 1, y, startZ + 1]; // Bottom-right corner of first island
    pathCoords.push(lastExitPoint);

    for (let cluster = 0; cluster < numClusters; cluster++) {
      // Calculate base Y for this cluster
      const islandBaseY = y + cluster * heightStep;

      for (let island = 0; island < islandsPerCluster; island++) {
        // Entry point of next island
        const nextIslandEntry: Coord = [lastExitPoint[0] + 3, islandBaseY, lastExitPoint[2]];

        // Create bridge to next island
        const bridge = this._createBridge(lastExitPoint, nextIslandEntry);
        pathCoords.push(...bridge);
        placementCoords.push(...bridge);

        // Create island
        const islandCoords = this._createIsland(nextIslandEntry, 2);
        pathCoords.push(nextIslandEntry);
        placementCoords.push(...islandCoords);
        islandsList.push(islandCoords);

        // Update exit point for next island/bridge
        lastExitPoint = [nextIslandEntry[0] + 1, islandBaseY, nextIslandEntry[2] + 1];
        pathCoords.push(lastExitPoint);
      }

      // Create staircase to next cluster (if not last cluster)
      if (cluster < numClusters - 1) {
        const { pathCoords: stairPath, surfaceCoords, obstacleCoords } = 
          this._createStaircase(lastExitPoint, FORWARD_X, heightStep);

        pathCoords.push(...stairPath);
        placementCoords.push(...surfaceCoords);
        
        // Add obstacles with proper structure
        for (const pos of obstacleCoords) {
          obstacles.push({ pos, is_surface_obstacle: false });
        }

        // Update exit point to end of staircase
        lastExitPoint = stairPath.length > 0 ? stairPath[stairPath.length - 1] : lastExitPoint;
      }
    }

    const targetPos = lastExitPoint;

    // Calculate island centers for semantic positions
    const islandCenters: Coord[] = islandsList.map(island => island[0]);

    // Semantic positions (matching Python)
    const semantic_positions: Record<string, any> = {
      start_island: startPos,
      end_island: targetPos,
      optimal_start: 'start_island',
      optimal_end: 'end_island',
      valid_pairs: [
        {
          name: 'island_hop_easy',
          start: 'start_island',
          end: 'end_island',
          path_type: 'linear_islands',
          strategies: ['segment_based', 'island_replication'],
          difficulty: 'EASY',
          teaching_goal: 'Simple island-to-island traversal'
        },
        {
          name: 'cluster_traverse_medium',
          start: 'start_island',
          end: 'end_island',
          path_type: 'cluster_based',
          strategies: ['segment_based', 'height_variation'],
          difficulty: 'MEDIUM',
          teaching_goal: 'Traverse clusters with height awareness'
        },
        {
          name: 'all_islands_hard',
          start: 'start_island',
          end: 'end_island',
          path_type: 'full_traversal',
          strategies: ['segment_based', 'island_replication'],
          difficulty: 'HARD',
          teaching_goal: 'Visit all islands with identical patterns'
        }
      ]
    };

    // Add island positions dynamically
    for (let i = 0; i < islandCenters.length; i++) {
      semantic_positions[`island_${i}`] = islandCenters[i];
    }

    // Deduplicate placement coords
    const uniquePlacement = this._deduplicateCoords(placementCoords);
    
    // Use the manually built pathCoords which includes all valid steps and jumps
    // BFS fails here because staircase "jumps" create gaps in the walkable grid
    const uniquePath = this._deduplicateCoords(pathCoords);

    // Use original Y coordinates as requested (aligning with block surface)
    // The visualization engine handles the rendering offset if needed
    const finalPath: Coord[] = uniquePath;
    const finalStart: Coord = startPos;
    const finalTarget: Coord = targetPos;

    // Segment analysis
    const segments = islandsList.map(island => [...island]);
    const lengths = segments.map(s => s.length);
    const segment_analysis = {
      num_segments: segments.length,
      lengths,
      types: segments.map(() => 'island'),
      min_length: lengths.length > 0 ? Math.min(...lengths) : 0,
      max_length: lengths.length > 0 ? Math.max(...lengths) : 0,
      avg_length: lengths.length > 0 ? lengths.reduce((a, b) => a + b, 0) / lengths.length : 0
    };

    return {
      start_pos: finalStart,
      target_pos: finalTarget,
      path_coords: finalPath,        // DYNAMIC: manually constructed path including jumps
      placement_coords: uniquePlacement, // STATIC: all walkable tiles
      obstacles: obstacles,
      metadata: {
        topology_type: 'stepped_island_clusters',
        islands: islandsList,
        num_clusters: numClusters,
        islands_per_cluster: islandsPerCluster,
        height_step: heightStep,
        cluster_spacing: clusterSpacing,
        segments: segments,
        segment_analysis,
        semantic_positions
      }
    };
  }
}
