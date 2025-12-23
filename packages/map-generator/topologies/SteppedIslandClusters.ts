/**
 * Stepped Island Clusters Topology
 * Creates clusters of islands at different heights connected by stairs
 */

import { BaseTopology } from './BaseTopology';
import { IPathInfo, Coord } from '../types';

export class SteppedIslandClustersTopology extends BaseTopology {
  *generatePathInfoVariants(
    gridSize: [number, number, number],
    params: Record<string, any>,
    maxVariants: number
  ): Generator<IPathInfo> {
    let count = 0;
    for (let numClusters = 2; numClusters <= 4; numClusters++) {
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

  generatePathInfo(gridSize: [number, number, number], params: Record<string, any>): IPathInfo {
    const numClusters = params.num_clusters || 2;
    const islandsPerCluster = params.islands_per_cluster || 2;
    const heightStep = params.height_step || 2;
    const startX = params.start_x || 2;
    const startZ = params.start_z || Math.floor(gridSize[2] / 2);
    let y = 0;

    const pathCoords: Coord[] = [];
    const placementCoords: Coord[] = [];

    // Create first island
    const firstIsland = this.createIsland([startX, y, startZ], 2);
    placementCoords.push(...firstIsland);
    const startPos: Coord = [startX, y, startZ];
    pathCoords.push(startPos);

    let lastExitPoint: Coord = [startX + 1, y, startZ + 1];
    pathCoords.push(lastExitPoint);

    for (let cluster = 0; cluster < numClusters; cluster++) {
      const clusterY = y + cluster * heightStep;

      for (let island = 0; island < islandsPerCluster; island++) {
        // Bridge to next island
        const nextEntry: Coord = [lastExitPoint[0] + 3, clusterY, lastExitPoint[2]];
        
        // Create bridge
        for (let bx = lastExitPoint[0] + 1; bx < nextEntry[0]; bx++) {
          const bridgeCoord: Coord = [bx, clusterY, lastExitPoint[2]];
          pathCoords.push(bridgeCoord);
          placementCoords.push(bridgeCoord);
        }

        // Create island
        const islandCoords = this.createIsland(nextEntry, 2);
        pathCoords.push(nextEntry);
        placementCoords.push(...islandCoords);

        lastExitPoint = [nextEntry[0] + 1, clusterY, nextEntry[2] + 1];
        pathCoords.push(lastExitPoint);
      }

      // Staircase to next cluster
      if (cluster < numClusters - 1) {
        for (let step = 0; step < heightStep; step++) {
          // Step forward and up
          const stepCoord: Coord = [lastExitPoint[0] + 1, lastExitPoint[1] + 1, lastExitPoint[2]];
          pathCoords.push(stepCoord);
          placementCoords.push(stepCoord);
          lastExitPoint = stepCoord;
        }
      }
    }

    const targetPos = lastExitPoint;

    // Semantic positions
    const midPoint = pathCoords[Math.floor(pathCoords.length / 2)] || startPos;
    const semantic_positions = {
        start: startPos,
        end: targetPos,
        mid_cluster: midPoint,
        optimal_start: 'start',
        optimal_end: 'end',
        valid_pairs: [
            {
                name: 'cluster_climb_easy',
                start: 'start',
                end: 'end',
                path_type: 'vertical_progression',
                strategies: ['height_navigation', 'cluster_traversal'],
                difficulty: 'EASY',
                teaching_goal: 'Navigate between island clusters'
            },
            {
                name: 'stair_pattern_medium',
                start: 'start',
                end: 'mid_cluster',
                path_type: 'partial_climb',
                strategies: ['nested_loops', 'stepping_pattern'],
                difficulty: 'MEDIUM',
                teaching_goal: 'Repeated stair climbing pattern'
            }
        ]
    };

    // Segment analysis
    const segment_analysis = {
        num_segments: numClusters,
        lengths: [pathCoords.length],
        types: ['cluster_path'],
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
        topology_type: 'stepped_island_clusters',
        num_clusters: numClusters,
        islands_per_cluster: islandsPerCluster,
        height_step: heightStep,
        segments: [pathCoords],
        segment_analysis,
        semantic_positions
      },
    };
  }

  private createIsland(topLeft: Coord, size: number): Coord[] {
    const coords: Coord[] = [];
    const [x, y, z] = topLeft;
    for (let dx = 0; dx < size; dx++) {
      for (let dz = 0; dz < size; dz++) {
        coords.push([x + dx, y, z + dz]);
      }
    }
    return coords;
  }
}
