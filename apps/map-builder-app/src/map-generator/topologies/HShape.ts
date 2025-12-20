/**
 * H Shape Topology
 * Creates an H-shaped path - ideal for function lessons
 */

import { BaseTopology } from './BaseTopology';
import { IPathInfo, Coord } from '../types';

export class HShapeTopology extends BaseTopology {
  *generatePathInfoVariants(
    gridSize: [number, number, number],
    params: Record<string, any>,
    maxVariants: number
  ): Generator<IPathInfo> {
    const baseColLen = params.column_length || 4;
    const baseSpacing = params.column_spacing || 2;
    
    for (let i = 0; i < maxVariants; i++) {
      yield this.generatePathInfo(gridSize, {
        ...params,
        column_length: baseColLen + Math.floor(i / 2),
        column_spacing: baseSpacing + (i % 2)
      });
    }
  }

  generatePathInfo(gridSize: [number, number, number], params: Record<string, any>): IPathInfo {
    const columnLength = params.column_length || 4;
    const columnSpacing = params.column_spacing || 2;
    const barOffset = Math.min(params.bar_position_offset || Math.floor(columnLength / 2), columnLength - 2);
    const startX = params.start_x || 2;
    const startZ = params.start_z || 2;
    const y = 0;

    // Create left column
    const leftColumn: Coord[] = [];
    for (let i = 0; i < columnLength; i++) {
      leftColumn.push([startX, y, startZ + i]);
    }

    // Create right column
    const rightColumn: Coord[] = [];
    const rightStartX = startX + columnSpacing + 1;
    for (let i = 0; i < columnLength; i++) {
      rightColumn.push([rightStartX, y, startZ + i]);
    }

    // Create horizontal bar
    const horizontalBar: Coord[] = [];
    for (let i = 0; i <= columnSpacing + 1; i++) {
      horizontalBar.push([startX + i, y, startZ + barOffset]);
    }

    // Combine all coordinates
    const allCoordsSet = new Set<string>();
    const allCoords: Coord[] = [];
    [...leftColumn, ...rightColumn, ...horizontalBar].forEach(coord => {
      const key = `${coord[0]},${coord[1]},${coord[2]}`;
      if (!allCoordsSet.has(key)) {
        allCoordsSet.add(key);
        allCoords.push(coord);
      }
    });

    // Path: bottom-left -> bar -> top-right
    const path: Coord[] = [];
    for (let i = 0; i <= barOffset; i++) {
      path.push(leftColumn[i]);
    }
    for (let i = 1; i < horizontalBar.length; i++) {
      path.push(horizontalBar[i]);
    }
    for (let i = barOffset + 1; i < rightColumn.length; i++) {
      path.push(rightColumn[i]);
    }

    return {
      start_pos: leftColumn[0],
      target_pos: rightColumn[rightColumn.length - 1],
      path_coords: path,
      placement_coords: allCoords,
      obstacles: [],
      metadata: {
        topology_type: 'h_shape',
        branches: [leftColumn, rightColumn, horizontalBar],
        left_column: leftColumn,
        right_column: rightColumn,
        horizontal_bar: horizontalBar,
      },
    };
  }
}
