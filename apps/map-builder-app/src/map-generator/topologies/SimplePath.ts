/**
 * Simple Path Topology
 * Creates a simple straight path - most basic topology
 */

import { BaseTopology } from './BaseTopology';
import { IPathInfo, Coord } from '../types';

export class SimplePathTopology extends BaseTopology {
  *generatePathInfoVariants(
    gridSize: [number, number, number],
    params: Record<string, any>,
    maxVariants: number
  ): Generator<IPathInfo> {
    const baseLength = params.path_length || 6;
    const directions = ['forward', 'right', 'backward', 'left'];
    
    for (let i = 0; i < maxVariants; i++) {
      yield this.generatePathInfo(gridSize, {
        ...params,
        path_length: baseLength + i,
        direction: directions[i % directions.length]
      });
    }
  }

  generatePathInfo(gridSize: [number, number, number], params: Record<string, any>): IPathInfo {
    const pathLength = params.path_length || 6;
    const direction = params.direction || 'forward';
    const startX = params.start_x || 5;
    const startZ = params.start_z || 2;
    const y = 0;

    const startPos: Coord = [startX, y, startZ];
    const pathCoords: Coord[] = [startPos];
    let current: Coord = [...startPos];

    const dirVectors: Record<string, [number, number, number]> = {
      'forward': [0, 0, 1],
      'right': [1, 0, 0],
      'backward': [0, 0, -1],
      'left': [-1, 0, 0],
    };

    const dir = dirVectors[direction] || dirVectors['forward'];

    for (let i = 0; i < pathLength; i++) {
      current = [current[0] + dir[0], current[1] + dir[1], current[2] + dir[2]];
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
        topology_type: 'simple_path',
        direction: direction,
        path_length: pathLength,
      },
    };
  }
}
