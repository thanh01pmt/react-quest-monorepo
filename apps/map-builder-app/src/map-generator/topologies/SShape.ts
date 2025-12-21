/**
 * S Shape Topology
 * Creates an S-shaped path with two turns in opposite directions
 * Ideal for alternating patterns and segment-based learning
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

    // Leg 3: Move forward (+Z) again - this makes the S shape
    for (let i = 0; i < leg3Length; i++) {
      current = [current[0], current[1], current[2] + 1];
      pathCoords.push([...current]);
    }

    const targetPos = pathCoords[pathCoords.length - 1];

    // Calculate segment boundaries
    const seg1End = leg1Length + 1;
    const seg2End = seg1End + leg2Length;
    
    const seg1 = pathCoords.slice(0, seg1End);
    const seg2 = pathCoords.slice(seg1End - 1, seg2End);
    const seg3 = pathCoords.slice(seg2End - 1);
    
    const corner1 = pathCoords[seg1End - 1];
    const corner2 = pathCoords[seg2End - 1];
    
    const segments = [seg1, seg2, seg3];
    const lengths = segments.map(s => s.length);
    
    // Segment analysis
    const segment_analysis = {
      count: segments.length,
      lengths: lengths,
      min_length: Math.min(...lengths),
      max_length: Math.max(...lengths),
      min_valid_range: Math.max(0, Math.min(...lengths) - 2),
      total_valid_slots: lengths.reduce((sum, l) => sum + Math.max(0, l - 2), 0),
      types: ['vertical', 'horizontal', 'vertical']
    };

    // Semantic positions for alternating_patterns strategy
    const semantic_positions = {
      start: startPos,
      end: targetPos,
      corner1: corner1,
      corner2: corner2,
      optimal_start: 'start',
      optimal_end: 'end',
      valid_pairs: [
        {
          name: 'full_s_easy',
          start: 'start',
          end: 'end',
          path_type: 'full_traversal',
          strategies: ['alternating_patterns', 'segment_pattern_reuse'],
          difficulty: 'EASY',
          teaching_goal: 'Follow S-curve with alternating items'
        },
        {
          name: 'corner_to_corner_medium',
          start: 'corner1',
          end: 'corner2',
          path_type: 'middle_segment',
          strategies: ['alternating_patterns', 'corner_logic'],
          difficulty: 'MEDIUM',
          teaching_goal: 'Navigate between corners with pattern'
        },
        {
          name: 'reversed_s_hard',
          start: 'end',
          end: 'start',
          path_type: 'reversed_traversal',
          strategies: ['alternating_patterns', 'segment_pattern_reuse'],
          difficulty: 'HARD',
          teaching_goal: 'Reverse S-curve with hidden pattern'
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
        topology_type: 's_shape',
        segments: segments,
        corners: [corner1, corner2],
        segment_analysis: segment_analysis,
        semantic_positions: semantic_positions
      },
    };
  }
}
