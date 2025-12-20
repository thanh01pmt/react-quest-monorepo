/**
 * Staircase Topology
 * Creates a staircase-like ascending path
 */

import { BaseTopology } from './BaseTopology';
import { IPathInfo, Coord } from '../types';

export class StaircaseTopology extends BaseTopology {
  *generatePathInfoVariants(
    gridSize: [number, number, number],
    params: Record<string, any>,
    maxVariants: number
  ): Generator<IPathInfo> {
    const baseSteps = params.steps || 5;
    const baseWidth = params.step_width || 2;
    
    for (let i = 0; i < maxVariants; i++) {
      yield this.generatePathInfo(gridSize, {
        ...params,
        steps: baseSteps + i,
        step_width: baseWidth + (i % 2)
      });
    }
  }

  generatePathInfo(gridSize: [number, number, number], params: Record<string, any>): IPathInfo {
    const steps = params.steps || 5;
    const stepWidth = params.step_width || 2;
    const startX = params.start_x || 2;
    const startZ = params.start_z || 2;
    let y = 0;

    const startPos: Coord = [startX, y, startZ];
    const pathCoords: Coord[] = [startPos];
    let current: Coord = [...startPos];

    for (let step = 0; step < steps; step++) {
      // Move forward on current level
      for (let w = 0; w < stepWidth; w++) {
        current = [current[0], current[1], current[2] + 1];
        pathCoords.push([...current]);
      }
      
      // Go up one level (if not last step)
      if (step < steps - 1) {
        current = [current[0], current[1] + 1, current[2]];
        pathCoords.push([...current]);
      }
    }

    const targetPos = pathCoords[pathCoords.length - 1];

    return {
      start_pos: startPos,
      target_pos: targetPos,
      path_coords: pathCoords,
      placement_coords: pathCoords.slice(1, -1),
      obstacles: [],
      metadata: {
        topology_type: 'staircase',
        steps: steps,
        step_width: stepWidth,
        height_change: steps - 1,
      },
    };
  }
}
