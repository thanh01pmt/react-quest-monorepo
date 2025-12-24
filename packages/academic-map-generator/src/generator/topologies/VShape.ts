/**
 * V Shape Topology (FIXED)
 * Creates a V-shaped path - ideal for sequential or simple function lessons
 * Ported from Python: v_shape.py
 */

import { BaseTopology } from './BaseTopology';
import { IPathInfo, Coord } from '../types';

export class VShapeTopology extends BaseTopology {
  *generatePathInfoVariants(
    gridSize: [number, number, number],
    params: Record<string, any>,
    maxVariants: number
  ): Generator<IPathInfo> {
    const baseArmLength = params.arm_length || 3;
    
    for (let i = 0; i < maxVariants; i++) {
      const armLength = baseArmLength + i;
      if (armLength > 6) break;
      yield this.generatePathInfo(gridSize, { ...params, arm_length: armLength });
    }
  }

  generatePathInfo(gridSize: [number, number, number], params: Record<string, any>): IPathInfo {
    const armLength = params.arm_length || 3;
    const y = 0;

    // Calculate required size
    const requiredWidth = armLength * 2;
    const requiredDepth = armLength * 2;

    // Safe start position
    const startX = params.start_x || Math.max(1, Math.floor((gridSize[0] - requiredWidth) / 2));
    const startZ = params.start_z || Math.max(1, Math.floor((gridSize[2] - requiredDepth) / 2));

    const startPos: Coord = [startX, y, startZ];
    const pathCoords: Coord[] = [startPos];
    let current: Coord = [...startPos];

    // First arm of V: move forward (+Z) and right (+X) in zigzag
    for (let i = 0; i < armLength; i++) {
      current = [current[0], current[1], current[2] + 1];
      pathCoords.push([...current]);
      current = [current[0] + 1, current[1], current[2]];
      pathCoords.push([...current]);
    }

    // Second arm of V: move forward (+Z) and left (-X) in zigzag
    for (let i = 0; i < armLength; i++) {
      current = [current[0], current[1], current[2] + 1];
      pathCoords.push([...current]);
      current = [current[0] - 1, current[1], current[2]];
      pathCoords.push([...current]);
    }

    const targetPos = pathCoords[pathCoords.length - 1];
    const apexIdx = armLength * 2;
    const apex = pathCoords[apexIdx];

    // Create segments
    const segment1 = pathCoords.slice(0, apexIdx + 1); // Left arm including apex
    const segment2 = pathCoords.slice(apexIdx); // Right arm including apex
    const segments = [segment1, segment2];
    const lengths = [segment1.length, segment2.length];

    // Deduplicate placement coords (all walkable tiles)
    const dedupedPlacement = this._deduplicateCoords(pathCoords);
    
    // Compute path_coords using BFS pathfinding
    const computedPath = this.computePathCoords(startPos, targetPos, dedupedPlacement);

    return {
      start_pos: startPos,
      target_pos: targetPos,
      path_coords: computedPath,          // DYNAMIC: shortest path
      placement_coords: dedupedPlacement, // STATIC: all walkable tiles
      obstacles: [],
      metadata: {
        topology_type: 'v_shape',
        segments: segments,
        corners: [apex],
        arm_length: armLength,
        branches: segments,
        semantic_positions: {
          left_end: startPos,
          apex: apex,
          right_end: targetPos,
          optimal_start: 'left_end',
          optimal_end: 'right_end',
          valid_pairs: [
            {
              name: 'left_to_right_easy',
              start: 'left_end',
              end: 'right_end',
              path_type: 'full_v',
              difficulty: 'EASY',
              teaching_goal: 'Simple V traversal with clear apex'
            },
            {
              name: 'apex_to_end_medium',
              start: 'apex',
              end: 'right_end',
              path_type: 'single_arm',
              difficulty: 'MEDIUM',
              teaching_goal: 'Single arm with variable spacing'
            },
            {
              name: 'fibonacci_spacing_hard',
              start: 'left_end',
              end: 'right_end',
              path_type: 'hidden_pattern',
              difficulty: 'HARD',
              teaching_goal: 'Discover Fibonacci-like spacing pattern'
            }
          ]
        },
        segment_analysis: {
          num_segments: 2,
          count: 2,
          lengths: lengths,
          min_length: Math.min(...lengths),
          max_length: Math.max(...lengths),
          types: ['diagonal', 'diagonal'],
          total_valid_slots: lengths.reduce((sum, l) => sum + Math.max(0, l - 2), 0)
        }
      },
    };
  }
}
