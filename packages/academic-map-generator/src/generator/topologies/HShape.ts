/**
 * H Shape Topology (FIXED)
 * Creates an H-shaped path - ideal for function lessons
 * Ported from Python: h_shape.py
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
    const baseBarOffset = params.bar_position_offset || 1;
    
    for (let i = 0; i < maxVariants; i++) {
      const colLen = baseColLen + Math.floor(i / 2);
      const spacing = baseSpacing + (i % 2);
      const barOffset = Math.min(baseBarOffset, colLen - 2);
      
      yield this.generatePathInfo(gridSize, {
        ...params,
        column_length: colLen,
        column_spacing: spacing,
        bar_position_offset: Math.max(1, barOffset)
      });
    }
  }

  generatePathInfo(gridSize: [number, number, number], params: Record<string, any>): IPathInfo {
    const columnLength = Math.max(3, params.column_length || 4);
    const columnSpacing = Math.max(1, params.column_spacing || 2);
    const barOffset = Math.max(1, Math.min(
      params.bar_position_offset || Math.floor(columnLength / 2), 
      columnLength - 2
    ));
    
    // Calculate required size
    const requiredWidth = 2 + columnSpacing;
    const requiredDepth = columnLength;
    
    // Safe start position
    const startX = params.start_x || Math.max(1, Math.floor((gridSize[0] - requiredWidth) / 2));
    const startZ = params.start_z || Math.max(1, Math.floor((gridSize[2] - requiredDepth) / 2));
    const y = 0;

    // Create left column
    const leftColumn: Coord[] = [];
    for (let i = 0; i < columnLength; i++) {
      leftColumn.push([startX, y, startZ + i]);
    }

    // Create right column
    const rightStartX = startX + columnSpacing + 1;
    const rightColumn: Coord[] = [];
    for (let i = 0; i < columnLength; i++) {
      rightColumn.push([rightStartX, y, startZ + i]);
    }

    // Create horizontal bar
    const barZ = startZ + barOffset;
    const horizontalBar: Coord[] = [];
    for (let i = 0; i <= columnSpacing + 1; i++) {
      horizontalBar.push([startX + i, y, barZ]);
    }

    // Combine all coordinates (deduplicated)
    const allCoordsSet = new Set<string>();
    const allCoords: Coord[] = [];
    [...leftColumn, ...rightColumn, ...horizontalBar].forEach(coord => {
      const key = `${coord[0]},${coord[1]},${coord[2]}`;
      if (!allCoordsSet.has(key)) {
        allCoordsSet.add(key);
        allCoords.push(coord);
      }
    });

    // Define corner points
    const bottomLeft = leftColumn[0];
    const topLeft = leftColumn[columnLength - 1];
    const bottomRight = rightColumn[0];
    const topRight = rightColumn[columnLength - 1];
    const barStart: Coord = [startX, y, barZ];
    const barEnd: Coord = [startX + columnSpacing + 1, y, barZ];
    const barCenter: Coord = [startX + Math.floor((columnSpacing + 1) / 2), y, barZ];

    // Choose start/target - use BFS to find path
    // Default: bottom-left to top-right (diagonal traversal)
    const startPos = bottomLeft;
    const targetPos = topRight;

    // Find shortest path using BFS
    const pathCoords = this.findShortestPath(startPos, targetPos, allCoordsSet);

    return {
      start_pos: startPos,
      target_pos: targetPos,
      path_coords: pathCoords.length > 0 ? pathCoords : this.buildSimplePath(leftColumn, horizontalBar, rightColumn, barOffset),
      placement_coords: allCoords,
      obstacles: [],
      metadata: {
        topology_type: 'h_shape',
        branches: [leftColumn, rightColumn, horizontalBar],
        left_column: leftColumn,
        right_column: rightColumn,
        horizontal_bar: horizontalBar,
        corners: [barStart, barEnd],
        segments: [leftColumn, horizontalBar, rightColumn],
        semantic_positions: {
          left_bar_top: topLeft,
          left_bar_bottom: bottomLeft,
          right_bar_top: topRight,
          right_bar_bottom: bottomRight,
          bridge_left: barStart,
          bridge_right: barEnd,
          bridge_center: barCenter,
          optimal_start: 'left_bar_bottom',
          optimal_end: 'right_bar_bottom',
          valid_pairs: [
            {
              name: 'single_bar_easy',
              start: 'left_bar_bottom',
              end: 'left_bar_top',
              path_type: 'single_column',
              difficulty: 'EASY',
              teaching_goal: 'Simple single column traversal'
            },
            {
              name: 'cross_bridge_medium',
              start: 'left_bar_bottom',
              end: 'right_bar_bottom',
              path_type: 'cross_bridge',
              difficulty: 'MEDIUM',
              teaching_goal: 'Cross bridge, experience parallel columns'
            },
            {
              name: 'full_h_hard',
              start: 'left_bar_top',
              end: 'right_bar_bottom',
              path_type: 'full_traversal',
              difficulty: 'HARD',
              teaching_goal: 'Full H traversal with identical column patterns'
            }
          ]
        },
        segment_analysis: {
          num_segments: 3,
          lengths: [leftColumn.length, horizontalBar.length, rightColumn.length],
          types: ['vertical', 'horizontal', 'vertical']
        }
      },
    };
  }

  /**
   * Find shortest path between two points using BFS
   */
  private findShortestPath(start: Coord, end: Coord, gridSet: Set<string>): Coord[] {
    const startKey = `${start[0]},${start[1]},${start[2]}`;
    const endKey = `${end[0]},${end[1]},${end[2]}`;
    
    if (!gridSet.has(startKey) || !gridSet.has(endKey)) {
      return [];
    }
    
    const queue: { pos: Coord; path: Coord[] }[] = [{ pos: start, path: [start] }];
    const visited = new Set<string>([startKey]);
    
    const directions: [number, number, number][] = [
      [1, 0, 0], [-1, 0, 0], [0, 0, 1], [0, 0, -1]
    ];
    
    while (queue.length > 0) {
      const { pos, path } = queue.shift()!;
      const posKey = `${pos[0]},${pos[1]},${pos[2]}`;
      
      if (posKey === endKey) {
        return path;
      }
      
      for (const [dx, dy, dz] of directions) {
        const nextPos: Coord = [pos[0] + dx, pos[1] + dy, pos[2] + dz];
        const nextKey = `${nextPos[0]},${nextPos[1]},${nextPos[2]}`;
        
        if (gridSet.has(nextKey) && !visited.has(nextKey)) {
          visited.add(nextKey);
          queue.push({ pos: nextPos, path: [...path, nextPos] });
        }
      }
    }
    
    return [];
  }

  /**
   * Build simple path as fallback
   */
  private buildSimplePath(
    leftColumn: Coord[], 
    horizontalBar: Coord[],
    rightColumn: Coord[],
    barOffset: number
  ): Coord[] {
    const path: Coord[] = [];
    
    // Up left column to bar
    for (let i = 0; i <= barOffset; i++) {
      path.push(leftColumn[i]);
    }
    
    // Across bar
    for (let i = 1; i < horizontalBar.length; i++) {
      path.push(horizontalBar[i]);
    }
    
    // Up right column from bar
    for (let i = barOffset + 1; i < rightColumn.length; i++) {
      path.push(rightColumn[i]);
    }
    
    return path;
  }
}
