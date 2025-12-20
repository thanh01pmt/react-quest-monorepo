/**
 * Plowing Field Topology
 * Creates a back-and-forth "plowing" pattern like plowing a field
 * Ideal for nested loop lessons
 */

import { BaseTopology } from './BaseTopology';
import { IPathInfo, Coord } from '../types';

export class PlowingFieldTopology extends BaseTopology {
  *generatePathInfoVariants(
    gridSize: [number, number, number],
    params: Record<string, any>,
    maxVariants: number
  ): Generator<IPathInfo> {
    const baseRows = params.rows || 4;
    const baseRowLength = params.row_length || 5;
    
    for (let i = 0; i < maxVariants; i++) {
      yield this.generatePathInfo(gridSize, {
        ...params,
        rows: baseRows + Math.floor(i / 2),
        row_length: baseRowLength + (i % 2)
      });
    }
  }

  generatePathInfo(gridSize: [number, number, number], params: Record<string, any>): IPathInfo {
    const rows = params.rows || 4;
    const rowLength = params.row_length || 5;
    const startX = params.start_x || 2;
    const startZ = params.start_z || 2;
    const y = 0;

    const startPos: Coord = [startX, y, startZ];
    const pathCoords: Coord[] = [startPos];
    let current: Coord = [...startPos];
    let direction = 1; // 1 = forward (+Z), -1 = backward (-Z)

    for (let row = 0; row < rows; row++) {
      // Move across the row
      for (let col = 0; col < rowLength; col++) {
        current = [current[0], current[1], current[2] + direction];
        pathCoords.push([...current]);
      }
      
      // Move to next row (if not last row)
      if (row < rows - 1) {
        current = [current[0] + 1, current[1], current[2]];
        pathCoords.push([...current]);
        direction *= -1; // Reverse direction
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
        topology_type: 'plowing_field',
        rows: rows,
        row_length: rowLength,
        pattern: 'boustrophedon',
      },
    };
  }
}
