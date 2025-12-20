/**
 * V Shape Topology
 * Creates a V-shaped path - ideal for sequential or simple function lessons
 */

import { BaseTopology } from './BaseTopology';
import { IPathInfo, Coord } from '../types';

export class VShapeTopology extends BaseTopology {
  *generatePathInfoVariants(
    gridSize: [number, number, number],
    params: Record<string, any>,
    maxVariants: number
  ): Generator<IPathInfo> {
    const baseArmLength = params.arm_length || 3;
    
    for (let i = 0; i < maxVariants; i++) {
      const armLength = baseArmLength + i;
      if (armLength > 6) break;
      yield this.generatePathInfo(gridSize, { ...params, arm_length: armLength });
    }
  }

  generatePathInfo(gridSize: [number, number, number], params: Record<string, any>): IPathInfo {
    const armLength = params.arm_length || 3;
    const startX = params.start_x || 2;
    const startZ = params.start_z || 2;
    const y = 0;

    const startPos: Coord = [startX, y, startZ];
    const pathCoords: Coord[] = [startPos];
    let current: Coord = [...startPos];

    // First arm of V: move forward (+Z) and right (+X) in zigzag
    for (let i = 0; i < armLength; i++) {
      current = [current[0], current[1], current[2] + 1];
      pathCoords.push([...current]);
      current = [current[0] + 1, current[1], current[2]];
      pathCoords.push([...current]);
    }

    // Second arm of V: move forward (+Z) and left (-X) in zigzag
    for (let i = 0; i < armLength; i++) {
      current = [current[0], current[1], current[2] + 1];
      pathCoords.push([...current]);
      current = [current[0] - 1, current[1], current[2]];
      pathCoords.push([...current]);
    }

    const targetPos = pathCoords[pathCoords.length - 1];
    const apexIdx = armLength * 2;
    const apex = pathCoords[apexIdx];

    return {
      start_pos: startPos,
      target_pos: targetPos,
      path_coords: pathCoords,
      placement_coords: pathCoords.slice(1, -1),
      obstacles: [],
      metadata: {
        topology_type: 'v_shape',
        segments: [pathCoords.slice(0, apexIdx + 1), pathCoords.slice(apexIdx)],
        corner: apex,
        arm_length: armLength,
      },
    };
  }
}
