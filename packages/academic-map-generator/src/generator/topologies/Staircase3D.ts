/**
 * Staircase 3D Topology (PORTED FROM PYTHON)
 * Creates a 3D spiral staircase with steps that increase in length.
 * Forms a square spiral going upward with 4 sides per level.
 * Ideal for lessons on loops and 3D movement.
 */

import { BaseTopology } from './BaseTopology';
import { IPathInfo, Coord } from '../types';

// Direction vectors
const FORWARD_Z: [number, number, number] = [0, 0, 1];
const FORWARD_X: [number, number, number] = [1, 0, 0];
const BACKWARD_Z: [number, number, number] = [0, 0, -1];
const BACKWARD_X: [number, number, number] = [-1, 0, 0];
const UP_Y: [number, number, number] = [0, 1, 0];

const addVectors = (a: Coord, b: [number, number, number]): Coord => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];

export class Staircase3DTopology extends BaseTopology {
  *generatePathInfoVariants(
    gridSize: [number, number, number],
    params: Record<string, any>,
    maxVariants: number
  ): Generator<IPathInfo> {
    let count = 0;
    
    // Loop through possible configurations
    for (let levels = 2; levels <= 4; levels++) { // 2 to 4 levels
      for (let initialLen = 1; initialLen <= 2; initialLen++) { // Initial step length 1-2
        if (count >= maxVariants) return;
        yield this.generatePathInfo(gridSize, {
          ...params,
          num_levels: levels,
          initial_step_length: initialLen
        });
        count++;
      }
    }
  }

  generatePathInfo(gridSize: [number, number, number], params: Record<string, any>): IPathInfo {
    console.log("    LOG: Generating 'staircase_3d' topology...");

    // Read parameters (matching Python param names)
    const numLevels = params.num_levels || params.num_flights || 2;
    const initialStepLength = params.initial_step_length || params.steps_per_flight || 1;
    const stepIncrement = params.step_increment || 1;

    // Center the staircase in the grid
    const startX = params.start_x || Math.floor(gridSize[0] / 2);
    const startZ = params.start_z || Math.floor(gridSize[2] / 2);
    const startY = 0;
    const startPos: Coord = [startX, startY, startZ];

    const pathCoords: Coord[] = [startPos];
    const placementCoords: Coord[] = [startPos];
    let currentPos: Coord = [...startPos];

    // Rotating directions: Forward, Right, Back, Left
    const directions = [FORWARD_Z, FORWARD_X, BACKWARD_Z, BACKWARD_X];
    let currentStepLength = initialStepLength;

    for (let level = 0; level < numLevels; level++) {
      // Each level has 4 sides
      for (let i = 0; i < 4; i++) {
        // 1. Create a straight segment
        const moveDirection = directions[i % 4];
        for (let step = 0; step < currentStepLength; step++) {
          currentPos = addVectors(currentPos, moveDirection);
          pathCoords.push([...currentPos]);
        }

        // 2. Create an upward step at corner (except last corner of last level)
        if (level < numLevels - 1 || i < 3) {
          // Current position becomes the step support
          // Remove it from path_coords so the path jumps over it
          if (pathCoords.length > 0 && 
              pathCoords[pathCoords.length - 1][0] === currentPos[0] &&
              pathCoords[pathCoords.length - 1][1] === currentPos[1] &&
              pathCoords[pathCoords.length - 1][2] === currentPos[2]) {
            pathCoords.pop();
          }

          const stairBasePos = addVectors(currentPos, UP_Y);
          pathCoords.push([...stairBasePos]);
          currentPos = [...stairBasePos];
        }
      }

      // Increase length for next level
      currentStepLength += stepIncrement;
    }

    const targetPos = pathCoords[pathCoords.length - 1];

    // Group coords by Y level (platforms)
    const platformsDict: Record<number, Coord[]> = {};
    const stairs: Coord[] = [];
    
    for (let i = 0; i < pathCoords.length; i++) {
      const coord = pathCoords[i];
      const yLevel = coord[1];
      
      if (!platformsDict[yLevel]) platformsDict[yLevel] = [];
      platformsDict[yLevel].push(coord);

      // Detect stairs (Y changes)
      if (i > 0 && pathCoords[i - 1][1] !== coord[1]) {
        stairs.push(coord);
      }
    }
    
    const platforms = Object.values(platformsDict);

    // Semantic positions
    const groundPoint = pathCoords[0];
    const topPoint = pathCoords[pathCoords.length - 1];

    const semantic_positions = {
      ground_level: groundPoint,
      top_level: topPoint,
      stair_direction: 'ascending',
      optimal_start: 'ground_level',
      optimal_end: 'top_level',
      valid_pairs: [
        {
          name: 'climb_easy',
          start: 'ground_level',
          end: 'top_level',
          path_type: 'ascending',
          strategies: ['platform_based', 'step_climbing'],
          difficulty: 'EASY',
          teaching_goal: 'Item per platform'
        },
        {
          name: 'height_steps_medium',
          start: 'ground_level',
          end: 'top_level',
          path_type: 'step_groups',
          strategies: ['platform_based', 'height_variation'],
          difficulty: 'MEDIUM',
          teaching_goal: 'Items vary by height'
        },
        {
          name: 'descend_hard',
          start: 'top_level',
          end: 'ground_level',
          path_type: 'descending',
          strategies: ['platform_based', 'step_climbing'],
          difficulty: 'HARD',
          teaching_goal: 'Reverse climb pattern'
        }
      ]
    };

    // Extend placement_coords with pathCoords
    placementCoords.push(...pathCoords.slice(1));

    // Deduplicate placement_coords
    const uniquePlacement = this._deduplicateCoords(placementCoords);

    return {
      start_pos: startPos,
      target_pos: targetPos,
      path_coords: pathCoords,
      placement_coords: uniquePlacement,
      obstacles: [],
      metadata: {
        topology_type: 'staircase_3d',
        semantic_positions,
        segments: platforms,
        platforms: platforms,
        stairs: stairs,
        num_levels: numLevels,
        initial_step_length: initialStepLength,
        step_increment: stepIncrement
      },
    };
  }
}
