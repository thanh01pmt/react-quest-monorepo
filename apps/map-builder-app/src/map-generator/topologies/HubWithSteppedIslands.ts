/**
 * Hub With Stepped Islands Topology
 * Creates a central hub connected to stepped islands around it
 */

import { BaseTopology } from './BaseTopology';
import { IPathInfo, Coord } from '../types';

export class HubWithSteppedIslandsTopology extends BaseTopology {
  *generatePathInfoVariants(
    gridSize: [number, number, number],
    params: Record<string, any>,
    maxVariants: number
  ): Generator<IPathInfo> {
    const baseSpokes = params.num_spokes || 4;
    
    for (let i = 0; i < maxVariants; i++) {
      yield this.generatePathInfo(gridSize, {
        ...params,
        num_spokes: baseSpokes + i,
        spoke_length: 3 + (i % 2)
      });
    }
  }

  generatePathInfo(gridSize: [number, number, number], params: Record<string, any>): IPathInfo {
    const numSpokes = params.num_spokes || 4;
    const spokeLength = params.spoke_length || 3;
    const hubSize = params.hub_size || 3;
    const centerX = params.center_x || 7;
    const centerZ = params.center_z || 7;
    const y = 0;

    const placementCoords: Coord[] = [];

    // Create central hub
    const hubCoords: Coord[] = [];
    for (let dx = -Math.floor(hubSize / 2); dx <= Math.floor(hubSize / 2); dx++) {
      for (let dz = -Math.floor(hubSize / 2); dz <= Math.floor(hubSize / 2); dz++) {
        const coord: Coord = [centerX + dx, y, centerZ + dz];
        hubCoords.push(coord);
        placementCoords.push(coord);
      }
    }

    // Create spokes with stepped islands
    const spokes: Coord[][] = [];
    const directions = [
      [1, 0],   // East
      [-1, 0],  // West
      [0, 1],   // North
      [0, -1],  // South
      [1, 1],   // NE
      [-1, 1],  // NW
      [1, -1],  // SE
      [-1, -1], // SW
    ];

    for (let i = 0; i < Math.min(numSpokes, directions.length); i++) {
      const [dx, dz] = directions[i];
      const spokeCoords: Coord[] = [];
      let currentY = y;

      // Create stepped spoke
      for (let step = 1; step <= spokeLength; step++) {
        const x = centerX + Math.floor(hubSize / 2) * dx + step * dx * 2;
        const z = centerZ + Math.floor(hubSize / 2) * dz + step * dz * 2;
        
        // Add platform at this step
        for (let px = 0; px <= 1; px++) {
          for (let pz = 0; pz <= 1; pz++) {
            const coord: Coord = [x + px, currentY, z + pz];
            spokeCoords.push(coord);
            placementCoords.push(coord);
          }
        }
        
        // Add step up
        if (step < spokeLength) {
          currentY++;
          const stepCoord: Coord = [x + dx, currentY, z + dz];
          spokeCoords.push(stepCoord);
          placementCoords.push(stepCoord);
        }
      }
      spokes.push(spokeCoords);
    }

    // Create path visiting hub then first spoke
    const pathCoords: Coord[] = [...hubCoords];
    if (spokes.length > 0) {
      pathCoords.push(...spokes[0]);
    }

    const startPos = hubCoords[0];
    const lastSpoke = spokes[spokes.length - 1];
    const targetPos = lastSpoke?.[lastSpoke.length - 1] || hubCoords[hubCoords.length - 1];

    // Semantic positions
    const centerPos: Coord = [centerX, y, centerZ];
    const semantic_positions = {
        start: startPos,
        end: targetPos,
        center: centerPos,
        optimal_start: 'start',
        optimal_end: 'end',
        valid_pairs: [
            {
                name: 'hub_to_spoke_easy',
                start: 'center',
                end: 'end',
                path_type: 'radial_outward',
                strategies: ['radial_iteration', 'height_navigation'],
                difficulty: 'EASY',
                teaching_goal: 'Navigate from hub to spoke with steps'
            },
            {
                name: 'full_exploration_medium',
                start: 'start',
                end: 'end',
                path_type: 'full_traversal',
                strategies: ['function_reuse', 'radial_iteration'],
                difficulty: 'MEDIUM',
                teaching_goal: 'Explore all stepped islands'
            }
        ]
    };

    // Segment analysis based on hub + spokes
    const allSegments = [hubCoords, ...spokes];
    const lengths = allSegments.map(s => s.length);
    const segment_analysis = {
        num_segments: allSegments.length,
        lengths,
        types: ['hub', ...spokes.map(() => 'spoke')],
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
        topology_type: 'hub_with_stepped_islands',
        hub: hubCoords,
        spokes: spokes,
        num_spokes: spokes.length,
        segments: allSegments,
        segment_analysis,
        semantic_positions
      },
    };
  }
}
