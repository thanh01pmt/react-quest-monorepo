/**
 * Arrow Shape Topology
 * Creates an arrow-shaped path pointing in a direction
 */

import { BaseTopology } from './BaseTopology';
import { IPathInfo, Coord } from '../types';

export class ArrowShapeTopology extends BaseTopology {
  *generatePathInfoVariants(
    gridSize: [number, number, number],
    params: Record<string, any>,
    maxVariants: number
  ): Generator<IPathInfo> {
    const baseShaft = params.shaft_length || 5;
    const baseWing = params.wing_length || 2;
    
    for (let i = 0; i < maxVariants; i++) {
      yield this.generatePathInfo(gridSize, {
        ...params,
        shaft_length: baseShaft + i,
        wing_length: baseWing + Math.floor(i / 2)
      });
    }
  }

  generatePathInfo(gridSize: [number, number, number], params: Record<string, any>): IPathInfo {
    const shaftLength = params.shaft_length || 5;
    const wingLength = params.wing_length || 2;
    const startX = params.start_x || 5;
    const startZ = params.start_z || 2;
    const y = 0;

    // Create shaft (vertical line going up +Z)
    const shaft: Coord[] = [];
    for (let i = 0; i < shaftLength; i++) {
      shaft.push([startX, y, startZ + i]);
    }

    // Create left wing (diagonal going up-left from tip)
    const tipZ = startZ + shaftLength - 1;
    const leftWing: Coord[] = [];
    for (let i = 1; i <= wingLength; i++) {
      leftWing.push([startX - i, y, tipZ - i]);
    }

    // Create right wing (diagonal going up-right from tip)
    const rightWing: Coord[] = [];
    for (let i = 1; i <= wingLength; i++) {
      rightWing.push([startX + i, y, tipZ - i]);
    }

    // Combine all parts
    const allCoords: Coord[] = [...shaft, ...leftWing, ...rightWing];

    // Path: left wing tip -> shaft top -> shaft bottom
    const leftWingReversed = [...leftWing].reverse();
    const pathCoords: Coord[] = [...leftWingReversed, ...shaft.slice().reverse()];

    const startPos = leftWing.length > 0 ? leftWing[leftWing.length - 1] : shaft[shaft.length - 1];
    const targetPos = shaft[0];

    return {
      start_pos: startPos,
      target_pos: targetPos,
      path_coords: pathCoords,
      placement_coords: allCoords,
      obstacles: [],
      metadata: {
        topology_type: 'arrow_shape',
        shaft: shaft,
        left_wing: leftWing,
        right_wing: rightWing,
        tip: shaft[shaft.length - 1],
      },
    };
  }
}
