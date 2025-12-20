/**
 * S Shape Topology
 * Creates an S-shaped path with two turns in opposite directions
 */

import { BaseTopology } from './BaseTopology';
import { IPathInfo, Coord } from '../types';

export class SShapeTopology extends BaseTopology {
  *generatePathInfoVariants(
    gridSize: [number, number, number],
    params: Record<string, any>,
    maxVariants: number
  ): Generator<IPathInfo> {
    const baseLeg1 = params.leg1_length || 3;
    const baseLeg2 = params.leg2_length || 4;
    const baseLeg3 = params.leg3_length || 3;
    
    for (let i = 0; i < maxVariants; i++) {
      yield this.generatePathInfo(gridSize, {
        ...params,
        leg1_length: baseLeg1 + i,
        leg2_length: baseLeg2 + i,
        leg3_length: baseLeg3 + i
      });
    }
  }

  generatePathInfo(gridSize: [number, number, number], params: Record<string, any>): IPathInfo {
    const leg1Length = params.leg1_length || 3;
    const leg2Length = params.leg2_length || 4;
    const leg3Length = params.leg3_length || 3;
    const startX = params.start_x || 2;
    const startZ = params.start_z || 2;
    const y = 0;

    const startPos: Coord = [startX, y, startZ];
    const pathCoords: Coord[] = [startPos];
    let current: Coord = [...startPos];

    // Leg 1: Move forward (+Z)
    for (let i = 0; i < leg1Length; i++) {
      current = [current[0], current[1], current[2] + 1];
      pathCoords.push([...current]);
    }

    // Leg 2: Move right (+X)
    for (let i = 0; i < leg2Length; i++) {
      current = [current[0] + 1, current[1], current[2]];
      pathCoords.push([...current]);
    }

    // Leg 3: Move forward (+Z) again
    for (let i = 0; i < leg3Length; i++) {
      current = [current[0], current[1], current[2] + 1];
      pathCoords.push([...current]);
    }

    const targetPos = pathCoords[pathCoords.length - 1];

    const seg1End = leg1Length + 1;
    const seg2End = seg1End + leg2Length;
    const seg1 = pathCoords.slice(0, seg1End);
    const seg2 = pathCoords.slice(seg1End - 1, seg2End);
    const seg3 = pathCoords.slice(seg2End - 1);
    const corner1 = pathCoords[seg1End - 1];
    const corner2 = pathCoords[seg2End - 1];

    return {
      start_pos: startPos,
      target_pos: targetPos,
      path_coords: pathCoords,
      placement_coords: pathCoords.slice(1, -1),
      obstacles: [],
      metadata: {
        topology_type: 's_shape',
        segments: [seg1, seg2, seg3],
        corners: [corner1, corner2],
      },
    };
  }
}
