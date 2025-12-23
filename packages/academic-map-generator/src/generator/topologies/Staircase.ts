/**
 * Staircase Topology
 * Creates a staircase-like ascending path
 */

import { BaseTopology } from './BaseTopology';
import { IPathInfo, Coord } from '../types';

export class StaircaseTopology extends BaseTopology {
  *generatePathInfoVariants(
    gridSize: [number, number, number],
    params: Record<string, any>,
    maxVariants: number
  ): Generator<IPathInfo> {
    const baseSteps = params.steps || 5;
    const baseWidth = params.step_width || 2;
    
    for (let i = 0; i < maxVariants; i++) {
      yield this.generatePathInfo(gridSize, {
        ...params,
        steps: baseSteps + i,
        step_width: baseWidth + (i % 2)
      });
    }
  }

  generatePathInfo(gridSize: [number, number, number], params: Record<string, any>): IPathInfo {
    const steps = params.steps || 5;
    const stepWidth = params.step_width || 2;
    const startX = params.start_x || 2;
    const startZ = params.start_z || 2;
    let y = 0;

    const startPos: Coord = [startX, y, startZ];
    const pathCoords: Coord[] = [startPos];
    let current: Coord = [...startPos];

    for (let step = 0; step < steps; step++) {
      // Move forward on current level
      for (let w = 0; w < stepWidth; w++) {
        current = [current[0], current[1], current[2] + 1];
        pathCoords.push([...current]);
      }
      
      // Go up one level (if not last step)
      if (step < steps - 1) {
        current = [current[0], current[1] + 1, current[2]];
        pathCoords.push([...current]);
      }
    }

    const targetPos = pathCoords[pathCoords.length - 1];

    // Calculate steps as segments (each step is a segment)
    const segments: Coord[][] = [];
    let idx = 0;
    for (let step = 0; step < steps; step++) {
        const stepStart = idx;
        const stepEnd = stepStart + stepWidth + (step < steps - 1 ? 1 : 0) + 1;
        segments.push(pathCoords.slice(stepStart, Math.min(stepEnd, pathCoords.length)));
        idx = stepEnd - 1;
    }
    const lengths = segments.map(s => s.length).filter(l => l > 0);

    // Semantic positions
    const midStep = Math.floor(steps / 2);
    const midPoint = pathCoords[midStep * (stepWidth + 1)] || pathCoords[Math.floor(pathCoords.length / 2)];

    const semantic_positions = {
        start: startPos,
        end: targetPos,
        mid_step: midPoint,
        optimal_start: 'start',
        optimal_end: 'end',
        valid_pairs: [
            {
                name: 'full_staircase_easy',
                start: 'start',
                end: 'end',
                path_type: 'full_traversal',
                strategies: ['repeating_step_pattern', 'nested_loops'],
                difficulty: 'EASY',
                teaching_goal: 'Navigate staircase with repeated step pattern'
            },
            {
                name: 'half_staircase_medium',
                start: 'start',
                end: 'mid_step',
                path_type: 'half_traversal',
                strategies: ['counting_loops'],
                difficulty: 'MEDIUM',
                teaching_goal: 'Partial staircase with counting'
            }
        ]
    };

    const segment_analysis = {
        num_segments: segments.length,
        lengths,
        types: segments.map(() => 'step'),
        min_length: lengths.length > 0 ? Math.min(...lengths) : 0,
        max_length: lengths.length > 0 ? Math.max(...lengths) : 0,
        avg_length: lengths.length > 0 ? lengths.reduce((a,b) => a+b, 0) / lengths.length : 0
    };

    return {
      start_pos: startPos,
      target_pos: targetPos,
      path_coords: pathCoords,
      placement_coords: pathCoords.slice(1, -1),
      obstacles: [],
      metadata: {
        topology_type: 'staircase',
        steps: steps,
        step_width: stepWidth,
        height_change: steps - 1,
        segments,
        segment_analysis,
        semantic_positions
      },
    };
  }
}
