/**
 * Plus Shape Islands Topology
 * Creates 4 islands arranged in a plus pattern with bridges to center
 * 
 * Ported from Python: plus_shape_islands.py
 */

import { BaseTopology } from './BaseTopology';
import { IPathInfo, Coord } from '../types';

export class PlusShapeIslandsTopology extends BaseTopology {
  /**
   * Create a square island with center at given position
   */
  private createSquareIsland(center: Coord, size: number): Coord[] {
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

  *generatePathInfoVariants(
    gridSize: [number, number, number],
    params: Record<string, any>,
    maxVariants: number
  ): Generator<IPathInfo> {
    // [PORTED] Calculate max arm length based on effective grid size
    const islandSize = typeof params.island_size === 'number' ? params.island_size : 2;
    const effectiveGridSize = 25;
    
    const maxArmLengthX = Math.floor((effectiveGridSize - islandSize - 4) / 2);
    const maxArmLengthZ = Math.floor((effectiveGridSize - islandSize - 4) / 2);
    const maxArmLength = Math.min(maxArmLengthX, maxArmLengthZ, 6);
    
    let count = 0;
    for (let armLen = 3; armLen <= maxArmLength; armLen++) {
      if (count >= maxVariants) return;
      
      yield this.generatePathInfo(gridSize, {
        ...params,
        arm_length: armLen
      });
      count++;
    }
  }

  generatePathInfo(gridSize: [number, number, number], params: Record<string, any>): IPathInfo {
    // [PORTED] Use effective grid size of 25x25x25
    const effectiveGridSize: [number, number, number] = [25, 25, 25];
    
    // [PORTED] Parse island_size with fallback
    const islandSize = typeof params.island_size === 'number' ? params.island_size : 2;
    
    // [PORTED] Calculate max arm length based on grid constraints
    const maxArmLengthX = Math.floor((effectiveGridSize[0] - islandSize - 4) / 2);
    const maxArmLengthZ = Math.floor((effectiveGridSize[2] - islandSize - 4) / 2);
    const maxArmLength = Math.min(maxArmLengthX, maxArmLengthZ);
    
    // [PORTED] Get arm length with bounds checking
    const armLengthParam = params.arm_length ?? Math.floor(3 + Math.random() * (maxArmLength - 3 + 1));
    const armLength = Math.min(armLengthParam, maxArmLength);
    
    // [PORTED] Calculate safe center position - DYNAMIC, not hardcoded!
    const minCenter = armLength + islandSize;
    const maxCenterX = effectiveGridSize[0] - armLength - islandSize - 2;
    const maxCenterZ = effectiveGridSize[2] - armLength - islandSize - 2;
    
    const centerX = params.center_x ?? Math.floor(minCenter + Math.random() * (maxCenterX - minCenter + 1));
    const centerZ = params.center_z ?? Math.floor(minCenter + Math.random() * (maxCenterZ - minCenter + 1));
    const y = 0;
    
    const centerPos: Coord = [centerX, y, centerZ];
    
    const allPathCoords: Coord[] = [centerPos];
    const islandPlacementCoords: Coord[] = [];
    const branches: Coord[][] = [];
    
    // Cardinal directions: East, West, South, North
    const directions: [number, number, number][] = [
      [1, 0, 0],   // East
      [-1, 0, 0],  // West
      [0, 0, 1],   // South (in original Python: (0, 0, 1))
      [0, 0, -1]   // North (in original Python: (0, 0, -1))
    ];
    const directionNames = ['east', 'west', 'south', 'north'];
    
    const islandStarts: Coord[] = [];
    const islandCenters: Coord[] = [];

    // [PORTED] Create 4 islands and bridges
    for (let i = 0; i < directions.length; i++) {
      const [dx, dy, dz] = directions[i];
      
      // Calculate island center position
      const islandCenterPos: Coord = [
        centerX + dx * armLength,
        y,
        centerZ + dz * armLength
      ];
      islandStarts.push(islandCenterPos);
      islandCenters.push(islandCenterPos);
      
      // Create island
      const islandPath = this.createSquareIsland(islandCenterPos, islandSize);
      islandPlacementCoords.push(...islandPath);
      
      // [PORTED] Record branch with bridge path
      const branchPath: Coord[] = [centerPos];
      
      // Create bridge from island back to center
      let currentBridgePos: Coord = [...islandCenterPos];
      for (let step = 0; step < armLength; step++) {
        // Move backwards toward center
        currentBridgePos = [
          currentBridgePos[0] - dx,
          currentBridgePos[1],
          currentBridgePos[2] - dz
        ];
        // Check if not already in path
        const key = `${currentBridgePos[0]},${currentBridgePos[1]},${currentBridgePos[2]}`;
        const existsInPath = allPathCoords.some(
          c => c[0] === currentBridgePos[0] && c[1] === currentBridgePos[1] && c[2] === currentBridgePos[2]
        );
        if (!existsInPath) {
          branchPath.push([...currentBridgePos]);
        }
      }
      
      branchPath.push(...islandPath);
      allPathCoords.push(...branchPath);
      branches.push(branchPath);
    }

    // [PORTED] Shuffle and pick start/end from islands
    const shuffledStarts = [...islandStarts].sort(() => Math.random() - 0.5);
    const startPos = shuffledStarts[0];
    const targetPos = shuffledStarts[1];

    // Combine all coords and de-duplicate
    const fullPath = this.deduplicateCoords([...allPathCoords, ...islandPlacementCoords]);

    // [PORTED] Semantic positions - FULL 3 pairs like Python
    const semantic_positions: Record<string, any> = {
      center: centerPos,
      optimal_start: 'center',
      optimal_end: 'island_east',
      valid_pairs: [
        {
          name: 'center_to_island_easy',
          start: 'center',
          end: 'island_east',
          path_type: 'single_island',
          strategies: ['function_reuse', 'hub_spoke'],
          difficulty: 'EASY',
          teaching_goal: 'Simple center to single island traversal'
        },
        {
          name: 'island_to_opposite_medium',
          start: 'island_east',
          end: 'island_west',
          path_type: 'cross_center',
          strategies: ['function_reuse', 'island_replication'],
          difficulty: 'MEDIUM',
          teaching_goal: 'Cross through center with PROCEDURE reuse'
        },
        {
          name: 'all_islands_hard',
          start: 'island_north',
          end: 'island_south',
          path_type: 'full_traversal',
          strategies: ['function_reuse', 'radial_symmetry'],
          difficulty: 'HARD',
          teaching_goal: 'Visit all 4 islands with identical patterns'
        }
      ]
    };
    
    // Add island positions to semantic_positions
    for (let i = 0; i < directionNames.length; i++) {
      semantic_positions[`island_${directionNames[i]}`] = islandCenters[i];
    }

    // [NEW] Component metadata for composite analysis
    const components = islandCenters.map((center, i) => {
      const half = Math.floor(islandSize / 2);
      return {
        id: `island_${directionNames[i]}`,
        module_type: 'square',
        center: center,
        bounds: {
          min_x: center[0] - half,
          max_x: center[0] + half,
          min_z: center[2] - half,
          max_z: center[2] + half
        },
        landmarks: {
          center: center,
          entrance: [
            center[0] - directions[i][0] * half,
            center[1],
            center[2] - directions[i][2] * half
          ] as Coord
        }
      };
    });

    // [FIXED] Connector metadata - from hub through bridge (excludes entrance)
    const connectors = directionNames.map((name, i) => {
      const [dx, dy, dz] = directions[i];
      const connectorPath: Coord[] = [centerPos]; // Start with hub
      
      // Add bridge blocks from hub toward island (stopping before entrance)
      for (let step = 1; step < armLength; step++) {
        connectorPath.push([
          centerX + dx * step,
          y,
          centerZ + dz * step
        ]);
      }
      
      return {
        from: 'hub',
        to: `island_${name}`,
        path: connectorPath
      };
    });

    // Segment analysis
    const lengths = branches.map(b => b.length);
    const segment_analysis = {
      num_segments: branches.length,
      lengths,
      types: directionNames.map(d => `branch_${d}`),
      min_length: Math.min(...lengths),
      max_length: Math.max(...lengths),
      avg_length: lengths.reduce((a, b) => a + b, 0) / lengths.length
    };

    return {
      start_pos: startPos,
      target_pos: targetPos,
      path_coords: fullPath,
      placement_coords: fullPath,
      obstacles: [],
      metadata: {
        topology_type: 'plus_shape_islands',
        layout_pattern: 'radial_4',  // [NEW] For composite analysis
        branches,
        hub: [centerPos],
        center: centerPos,
        island_centers: islandCenters,
        components,           // [NEW] Component metadata
        connectors,           // [NEW] Connector metadata
        segments: branches,
        segment_analysis,
        semantic_positions
      }
    };
  }

  /**
   * Remove duplicate coordinates preserving order
   */
  private deduplicateCoords(coords: Coord[]): Coord[] {
    const seen = new Set<string>();
    const result: Coord[] = [];
    
    for (const coord of coords) {
      const key = `${coord[0]},${coord[1]},${coord[2]}`;
      if (!seen.has(key)) {
        seen.add(key);
        result.push(coord);
      }
    }
    
    return result;
  }
}

