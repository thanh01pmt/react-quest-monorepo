/**
 * Triangle Topology
 * Creates a triangular path
 */

import { BaseTopology } from './BaseTopology';
import { IPathInfo, Coord } from '../types';

export class TriangleTopology extends BaseTopology {
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

    // Side 2: Move up-left (zigzag)
    for (let i = 0; i < sideLength; i++) {
      current = [current[0], current[1], current[2] + 1];
      pathCoords.push([...current]);
      if (i < sideLength - 1) {
        current = [current[0] - 1, current[1], current[2]];
        pathCoords.push([...current]);
      }
    }

    // Side 3: Move down (-Z)
    const stepsBack = Math.floor(sideLength * 1.5);
    for (let i = 0; i < stepsBack && current[2] > startZ; i++) {
      current = [current[0], current[1], current[2] - 1];
      pathCoords.push([...current]);
    }

    const targetPos = pathCoords[pathCoords.length - 1];

    // Calculate corners based on triangle vertices
    const corner1 = pathCoords[sideLength]; // End of side 1
    const corner2 = pathCoords[sideLength + sideLength * 2 - 1] || pathCoords[Math.floor(pathCoords.length * 0.7)];

    // Semantic positions
    const semantic_positions = {
        start: startPos,
        end: targetPos,
        corner1,
        corner2,
        optimal_start: 'start',
        optimal_end: 'end',
        valid_pairs: [
            {
                name: 'full_triangle_easy',
                start: 'start',
                end: 'end',
                path_type: 'full_traversal',
                strategies: ['segment_pattern_reuse', 'turning_patterns'],
                difficulty: 'EASY',
                teaching_goal: 'Navigate triangle perimeter'
            },
            {
                name: 'corners_medium',
                start: 'corner1',
                end: 'corner2',
                path_type: 'partial_traversal',
                strategies: ['corner_logic'],
                difficulty: 'MEDIUM',
                teaching_goal: 'Navigate between corners'
            }
        ]
    };

    // Segment analysis (3 sides)
    const seg1 = pathCoords.slice(0, sideLength + 1);
    const seg2 = pathCoords.slice(sideLength, sideLength * 3);
    const seg3 = pathCoords.slice(sideLength * 3 - 1);
    const segments = [seg1, seg2, seg3].filter(s => s.length > 0);
    const lengths = segments.map(s => s.length);

    const segment_analysis = {
        num_segments: segments.length,
        lengths,
        types: ['horizontal', 'diagonal', 'vertical'],
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
        topology_type: 'triangle',
        side_length: sideLength,
        segments,
        corners: [corner1, corner2],
        segment_analysis,
        semantic_positions
      },
    };
  }
}
