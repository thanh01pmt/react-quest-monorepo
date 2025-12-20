/**
 * Z Shape Topology
 * Creates a Z-shaped path
 */

import { BaseTopology } from './BaseTopology';
import { IPathInfo, Coord } from '../types';

export class ZShapeTopology extends BaseTopology {
  *generatePathInfoVariants(
    gridSize: [number, number, number],
    params: Record<string, any>,
    maxVariants: number
  ): Generator<IPathInfo> {
    const baseTop = params.top_length || 4;
    const baseDiag = params.diagonal_length || 3;
    
    for (let i = 0; i < maxVariants; i++) {
      yield this.generatePathInfo(gridSize, {
        ...params,
        top_length: baseTop + i,
        diagonal_length: baseDiag + Math.floor(i / 2)
      });
    }
  }

  generatePathInfo(gridSize: [number, number, number], params: Record<string, any>): IPathInfo {
    const topLength = params.top_length || 4;
    const diagonalLength = params.diagonal_length || 3;
    const bottomLength = params.bottom_length || topLength;
    const startX = params.start_x || 2;
    const startZ = params.start_z || 2;
    const y = 0;

    const startPos: Coord = [startX, y, startZ];
    const pathCoords: Coord[] = [startPos];
    let current: Coord = [...startPos];

    // Top horizontal line (move right +X)
    for (let i = 0; i < topLength; i++) {
      current = [current[0] + 1, current[1], current[2]];
      pathCoords.push([...current]);
    }

    // Diagonal (zigzag: +Z then -X)
    for (let i = 0; i < diagonalLength; i++) {
      current = [current[0], current[1], current[2] + 1];
      pathCoords.push([...current]);
      current = [current[0] - 1, current[1], current[2]];
      pathCoords.push([...current]);
    }

    // Bottom horizontal line (move right +X)
    for (let i = 0; i < bottomLength; i++) {
      current = [current[0] + 1, current[1], current[2]];
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
        topology_type: 'z_shape',
        top_length: topLength,
        diagonal_length: diagonalLength,
        bottom_length: bottomLength,
      },
    };
  }
}
