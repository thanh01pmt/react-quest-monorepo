/**
 * Spiral 3D Topology
 * Creates a 3D spiral path that ascends in the Y direction
 */

import { BaseTopology } from './BaseTopology';
import { IPathInfo, Coord } from '../types';

export class Spiral3DTopology extends BaseTopology {
  *generatePathInfoVariants(
    gridSize: [number, number, number],
    params: Record<string, any>,
    maxVariants: number
  ): Generator<IPathInfo> {
    const baseTurns = params.num_turns || 3;
    
    for (let i = 0; i < maxVariants; i++) {
      yield this.generatePathInfo(gridSize, {
        ...params,
        num_turns: baseTurns + i,
        height_per_turn: 1 + (i % 2)
      });
    }
  }

  generatePathInfo(gridSize: [number, number, number], params: Record<string, any>): IPathInfo {
    const numTurns = params.num_turns || 3;
    const heightPerTurn = params.height_per_turn || 1;
    const stepsPerSide = params.steps_per_side || 3;
    const startX = params.start_x || 5;
    const startZ = params.start_z || 5;
    let y = 0;

    const startPos: Coord = [startX, y, startZ];
    const pathCoords: Coord[] = [startPos];
    let current: Coord = [...startPos];

    // Direction vectors for spiral (clockwise)
    const directions: [number, number][] = [
      [1, 0],   // +X
      [0, 1],   // +Z
      [-1, 0],  // -X
      [0, -1]   // -Z
    ];

    for (let turn = 0; turn < numTurns; turn++) {
      for (let side = 0; side < 4; side++) {
        const [dx, dz] = directions[side];
        
        // Move along this side
        for (let step = 0; step < stepsPerSide; step++) {
          current = [current[0] + dx, current[1], current[2] + dz];
          pathCoords.push([...current]);
        }
        
        // Go up after completing 2 sides (half turn)
        if (side === 1 || side === 3) {
          for (let h = 0; h < heightPerTurn; h++) {
            current = [current[0], current[1] + 1, current[2]];
            pathCoords.push([...current]);
          }
        }
      }
    }

    const targetPos = pathCoords[pathCoords.length - 1];

    // Semantic positions
    const midPoint = pathCoords[Math.floor(pathCoords.length / 2)] || startPos;
    const semantic_positions = {
        start: startPos,
        end: targetPos,
        mid_spiral: midPoint,
        optimal_start: 'start',
        optimal_end: 'end',
        valid_pairs: [
            {
                name: 'spiral_climb_easy',
                start: 'start',
                end: 'end',
                path_type: '3d_spiral',
                strategies: ['nested_loops', 'spiral_pattern'],
                difficulty: 'EASY',
                teaching_goal: 'Ascending spiral with repeated turn pattern'
            },
            {
                name: 'half_spiral_medium',
                start: 'start',
                end: 'mid_spiral',
                path_type: 'partial_spiral',
                strategies: ['counting_loops'],
                difficulty: 'MEDIUM',
                teaching_goal: 'First half of spiral climb'
            }
        ]
    };

    // Segment analysis (each turn is a segment)
    const stepsPerTurn = stepsPerSide * 4 + heightPerTurn * 2;
    const segment_analysis = {
        num_segments: numTurns,
        lengths: Array(numTurns).fill(stepsPerTurn),
        types: Array(numTurns).fill('spiral_turn'),
        min_length: stepsPerTurn,
        max_length: stepsPerTurn,
        avg_length: stepsPerTurn
    };

    return {
      start_pos: startPos,
      target_pos: targetPos,
      path_coords: pathCoords,
      placement_coords: pathCoords.slice(1, -1),
      obstacles: [],
      metadata: {
        topology_type: 'spiral_3d',
        num_turns: numTurns,
        height_per_turn: heightPerTurn,
        total_height: targetPos[1],
        segments: [pathCoords],
        segment_analysis,
        semantic_positions
      },
    };
  }
}
