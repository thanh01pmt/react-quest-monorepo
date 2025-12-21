/**
 * Square Topology
 * Creates a square-shaped path
 */

import { BaseTopology } from './BaseTopology';
import { IPathInfo, Coord } from '../types';

export class SquareTopology extends BaseTopology {
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

    // Side 2: Move forward (+Z)
    for (let i = 0; i < sideLength; i++) {
      current = [current[0], current[1], current[2] + 1];
      pathCoords.push([...current]);
    }

    // Side 3: Move left (-X)
    for (let i = 0; i < sideLength; i++) {
      current = [current[0] - 1, current[1], current[2]];
      pathCoords.push([...current]);
    }

    // Side 4: Move back (-Z) - stop before start
    for (let i = 0; i < sideLength - 1; i++) {
      current = [current[0], current[1], current[2] - 1];
      pathCoords.push([...current]);
    }

    const targetPos = pathCoords[pathCoords.length - 1];

    // Calculate corners
    const corner1 = pathCoords[sideLength]; // End of side 1
    const corner2 = pathCoords[sideLength * 2]; // End of side 2
    const corner3 = pathCoords[sideLength * 3]; // End of side 3

    // Segments (4 sides)
    const seg1 = pathCoords.slice(0, sideLength + 1);
    const seg2 = pathCoords.slice(sideLength, sideLength * 2 + 1);
    const seg3 = pathCoords.slice(sideLength * 2, sideLength * 3 + 1);
    const seg4 = pathCoords.slice(sideLength * 3);
    const segments = [seg1, seg2, seg3, seg4].filter(s => s.length > 0);
    const lengths = segments.map(s => s.length);

    // Semantic positions
    const semantic_positions = {
        start: startPos,
        end: targetPos,
        corner1,
        corner2,
        corner3,
        optimal_start: 'start',
        optimal_end: 'end',
        valid_pairs: [
            {
                name: 'full_square_easy',
                start: 'start',
                end: 'end',
                path_type: 'full_perimeter',
                strategies: ['segment_pattern_reuse', 'turning_patterns'],
                difficulty: 'EASY',
                teaching_goal: 'Navigate square perimeter with 4 turns'
            },
            {
                name: 'half_perimeter_medium',
                start: 'start',
                end: 'corner2',
                path_type: 'half_traversal',
                strategies: ['segment_pattern_reuse'],
                difficulty: 'MEDIUM',
                teaching_goal: 'Half square with 2 identical segments'
            }
        ]
    };

    const segment_analysis = {
        num_segments: segments.length,
        lengths,
        types: ['right', 'forward', 'left', 'back'],
        min_length: Math.min(...lengths),
        max_length: Math.max(...lengths),
        avg_length: lengths.reduce((a,b) => a+b, 0) / lengths.length
    };

    return {
      start_pos: startPos,
      target_pos: targetPos,
      path_coords: pathCoords,
      placement_coords: pathCoords.slice(1, -1),
      obstacles: [],
      metadata: {
        topology_type: 'square',
        side_length: sideLength,
        is_closed: false,
        segments,
        corners: [corner1, corner2, corner3],
        segment_analysis,
        semantic_positions
      },
    };
  }
}
