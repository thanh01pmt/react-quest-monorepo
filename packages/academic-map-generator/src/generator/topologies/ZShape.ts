/**
 * Z Shape Topology
 * Creates a Z-shaped path with alternating patterns
 * Similar to S-shape but with different turn direction
 */

import { BaseTopology } from './BaseTopology';
import { IPathInfo, Coord } from '../types';

export class ZShapeTopology extends BaseTopology {
  *generatePathInfoVariants(
    gridSize: [number, number, number],
    params: Record<string, any>,
    maxVariants: number
  ): Generator<IPathInfo> {
    const baseTop = params.top_length || 4;
    const baseDiag = params.diagonal_length || 3;
    
    for (let i = 0; i < maxVariants; i++) {
      yield this.generatePathInfo(gridSize, {
        ...params,
        top_length: baseTop + i,
        diagonal_length: baseDiag + Math.floor(i / 2)
      });
    }
  }

  generatePathInfo(gridSize: [number, number, number], params: Record<string, any>): IPathInfo {
    const topLength = params.top_length || 4;
    const diagonalLength = params.diagonal_length || 3;
    const bottomLength = params.bottom_length || topLength;
    const startX = params.start_x || 2;
    const startZ = params.start_z || 2;
    const y = 0;

    const startPos: Coord = [startX, y, startZ];
    const pathCoords: Coord[] = [startPos];
    let current: Coord = [...startPos];

    // Segment 1: Top horizontal line (move right +X)
    const seg1: Coord[] = [startPos];
    for (let i = 0; i < topLength; i++) {
      current = [current[0] + 1, current[1], current[2]];
      pathCoords.push([...current]);
      seg1.push([...current]);
    }
    const corner1 = [...current] as Coord;

    // Segment 2: Diagonal (zigzag: +Z then -X)
    const seg2: Coord[] = [corner1];
    for (let i = 0; i < diagonalLength; i++) {
      current = [current[0], current[1], current[2] + 1];
      pathCoords.push([...current]);
      seg2.push([...current]);
      current = [current[0] - 1, current[1], current[2]];
      pathCoords.push([...current]);
      seg2.push([...current]);
    }
    const corner2 = [...current] as Coord;

    // Segment 3: Bottom horizontal line (move right +X)
    const seg3: Coord[] = [corner2];
    for (let i = 0; i < bottomLength; i++) {
      current = [current[0] + 1, current[1], current[2]];
      pathCoords.push([...current]);
      seg3.push([...current]);
    }

    const targetPos = pathCoords[pathCoords.length - 1];
    const segments = [seg1, seg2, seg3];
    const corners = [corner1, corner2];
    
    const lengths = segments.map(s => s.length);
    
    // Segment analysis
    const segment_analysis = {
      num_segments: segments.length,
      lengths: lengths,
      types: ['horizontal', 'diagonal', 'horizontal'],
      min_length: Math.min(...lengths),
      max_length: Math.max(...lengths),
      avg_length: lengths.reduce((a,b) => a+b, 0) / lengths.length,
      min_valid_range: Math.max(0, Math.min(...lengths) - 2),
      total_valid_slots: lengths.reduce((sum, l) => sum + Math.max(0, l - 2), 0)
    };

    // Semantic positions for alternating_patterns strategy
    const semantic_positions: Record<string, any> = {
      start: startPos,
      end: targetPos,
      corner1: corner1,
      corner2: corner2,
      optimal_start: 'start',
      optimal_end: 'end',
      valid_pairs: [
        {
          name: 'full_z_easy',
          start: 'start',
          end: 'end',
          path_type: 'full_traversal',
          strategies: ['alternating_patterns', 'segment_pattern_reuse'],
          difficulty: 'EASY',
          teaching_goal: 'Follow Z-curve with alternating items'
        },
        {
          name: 'corner_to_corner_medium',
          start: 'corner1',
          end: 'corner2',
          path_type: 'diagonal_segment',
          strategies: ['alternating_patterns', 'corner_logic'],
          difficulty: 'MEDIUM',
          teaching_goal: 'Navigate diagonal segment with pattern'
        },
        {
          name: 'reversed_z_hard',
          start: 'end',
          end: 'start',
          path_type: 'reversed_traversal',
          strategies: ['alternating_patterns', 'segment_pattern_reuse'],
          difficulty: 'HARD',
          teaching_goal: 'Reverse Z-curve with hidden pattern'
        }
      ]
    };

    return {
      start_pos: startPos,
      target_pos: targetPos,
      path_coords: pathCoords,
      placement_coords: pathCoords.slice(1, -1),
      obstacles: [],
      metadata: {
        topology_type: 'z_shape',
        top_length: topLength,
        diagonal_length: diagonalLength,
        bottom_length: bottomLength,
        segments: segments,
        corners: corners,
        segment_analysis: segment_analysis,
        semantic_positions: semantic_positions
      },
    };
  }
}
