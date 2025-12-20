/**
 * Triangle Topology
 * Creates a triangular path
 */

import { BaseTopology } from './BaseTopology';
import { IPathInfo, Coord } from '../types';

export class TriangleTopology extends BaseTopology {
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

    // Side 2: Move up-left (zigzag)
    for (let i = 0; i < sideLength; i++) {
      current = [current[0], current[1], current[2] + 1];
      pathCoords.push([...current]);
      if (i < sideLength - 1) {
        current = [current[0] - 1, current[1], current[2]];
        pathCoords.push([...current]);
      }
    }

    // Side 3: Move down (-Z)
    const stepsBack = Math.floor(sideLength * 1.5);
    for (let i = 0; i < stepsBack && current[2] > startZ; i++) {
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
        topology_type: 'triangle',
        side_length: sideLength,
      },
    };
  }
}
