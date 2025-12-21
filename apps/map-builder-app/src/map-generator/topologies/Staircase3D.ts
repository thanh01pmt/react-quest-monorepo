/**
 * Staircase 3D Topology
 * Creates a 3D staircase that zigzags upward
 */

import { BaseTopology } from './BaseTopology';
import { IPathInfo, Coord } from '../types';

export class Staircase3DTopology extends BaseTopology {
  *generatePathInfoVariants(
    gridSize: [number, number, number],
    params: Record<string, any>,
    maxVariants: number
  ): Generator<IPathInfo> {
    const baseFlights = params.num_flights || 3;
    
    for (let i = 0; i < maxVariants; i++) {
      yield this.generatePathInfo(gridSize, {
        ...params,
        num_flights: baseFlights + i,
        steps_per_flight: 4 + (i % 3)
      });
    }
  }

  generatePathInfo(gridSize: [number, number, number], params: Record<string, any>): IPathInfo {
    const numFlights = params.num_flights || 3;
    const stepsPerFlight = params.steps_per_flight || 4;
    const startX = params.start_x || 2;
    const startZ = params.start_z || 2;
    let y = 0;

    const startPos: Coord = [startX, y, startZ];
    const pathCoords: Coord[] = [startPos];
    let current: Coord = [...startPos];
    let direction = 1; // 1 = +Z, -1 = -Z

    for (let flight = 0; flight < numFlights; flight++) {
      // Walk forward along Z
      for (let step = 0; step < stepsPerFlight; step++) {
        current = [current[0], current[1], current[2] + direction];
        pathCoords.push([...current]);
        
        // Go up every other step
        if (step % 2 === 0) {
          current = [current[0], current[1] + 1, current[2]];
          pathCoords.push([...current]);
        }
      }
      
      // Turn around (move in X then reverse Z direction)
      if (flight < numFlights - 1) {
        current = [current[0] + 2, current[1], current[2]];
        pathCoords.push([...current]);
        direction *= -1;
      }
    }

    const targetPos = pathCoords[pathCoords.length - 1];

    // Semantic positions
    const midPoint = pathCoords[Math.floor(pathCoords.length / 2)] || startPos;
    const semantic_positions = {
        start: startPos,
        end: targetPos,
        mid_flight: midPoint,
        optimal_start: 'start',
        optimal_end: 'end',
        valid_pairs: [
            {
                name: 'full_staircase_3d_easy',
                start: 'start',
                end: 'end',
                path_type: '3d_zigzag_climb',
                strategies: ['nested_loops', 'zigzag_pattern'],
                difficulty: 'EASY',
                teaching_goal: 'Zigzag staircase with flight repetition'
            },
            {
                name: 'single_flight_medium',
                start: 'start',
                end: 'mid_flight',
                path_type: 'partial_climb',
                strategies: ['repeating_step_pattern'],
                difficulty: 'MEDIUM',
                teaching_goal: 'Single flight of steps'
            }
        ]
    };

    // Segment analysis (each flight is a segment)
    const stepsPerFlightTotal = stepsPerFlight + Math.floor(stepsPerFlight / 2) + 1;
    const segment_analysis = {
        num_segments: numFlights,
        lengths: Array(numFlights).fill(stepsPerFlightTotal),
        types: Array(numFlights).fill('flight'),
        min_length: stepsPerFlightTotal,
        max_length: stepsPerFlightTotal,
        avg_length: stepsPerFlightTotal
    };

    return {
      start_pos: startPos,
      target_pos: targetPos,
      path_coords: pathCoords,
      placement_coords: pathCoords.slice(1, -1),
      obstacles: [],
      metadata: {
        topology_type: 'staircase_3d',
        num_flights: numFlights,
        steps_per_flight: stepsPerFlight,
        total_height: targetPos[1],
        segments: [pathCoords],
        segment_analysis,
        semantic_positions
      },
    };
  }
}
