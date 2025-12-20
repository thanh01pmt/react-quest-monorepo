/**
 * Square Topology
 * Creates a square-shaped path
 */

import { BaseTopology } from './BaseTopology';
import { IPathInfo, Coord } from '../types';

export class SquareTopology extends BaseTopology {
  *generatePathInfoVariants(
    gridSize: [number, number, number],
    params: Record<string, any>,
    maxVariants: number
  ): Generator<IPathInfo> {
    const baseSide = params.side_length || 4;
    
    for (let i = 0; i < maxVariants; i++) {
      yield this.generatePathInfo(gridSize, {
        ...params,
        side_length: baseSide + i
      });
    }
  }

  generatePathInfo(gridSize: [number, number, number], params: Record<string, any>): IPathInfo {
    const sideLength = params.side_length || 4;
    const startX = params.start_x || 2;
    const startZ = params.start_z || 2;
    const y = 0;

    const startPos: Coord = [startX, y, startZ];
    const pathCoords: Coord[] = [startPos];
    let current: Coord = [...startPos];

    // Side 1: Move right (+X)
    for (let i = 0; i < sideLength; i++) {
      current = [current[0] + 1, current[1], current[2]];
      pathCoords.push([...current]);
    }

    // Side 2: Move forward (+Z)
    for (let i = 0; i < sideLength; i++) {
      current = [current[0], current[1], current[2] + 1];
      pathCoords.push([...current]);
    }

    // Side 3: Move left (-X)
    for (let i = 0; i < sideLength; i++) {
      current = [current[0] - 1, current[1], current[2]];
      pathCoords.push([...current]);
    }

    // Side 4: Move back (-Z) - stop before start
    for (let i = 0; i < sideLength - 1; i++) {
      current = [current[0], current[1], current[2] - 1];
      pathCoords.push([...current]);
    }

    const targetPos = pathCoords[pathCoords.length - 1];

    return {
      start_pos: startPos,
      target_pos: targetPos,
      path_coords: pathCoords,
      placement_coords: pathCoords.slice(1, -1),
      obstacles: [],
      metadata: {
        topology_type: 'square',
        side_length: sideLength,
        is_closed: false,
      },
    };
  }
}
