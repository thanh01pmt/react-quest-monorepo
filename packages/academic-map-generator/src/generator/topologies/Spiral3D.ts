/**
 * Spiral 3D Topology (PORTED FROM PYTHON)
 * Creates a 3D spiral path that ascends/descends in the Y direction.
 * Each turn increases the side length, creating an expanding spiral.
 * Ideal for lessons on loops with changing variables.
 */

import { BaseTopology } from './BaseTopology';
import { IPathInfo, Coord } from '../types';

// Direction vectors
const FORWARD_X: [number, number, number] = [1, 0, 0];
const FORWARD_Z: [number, number, number] = [0, 0, 1];
const BACKWARD_X: [number, number, number] = [-1, 0, 0];
const BACKWARD_Z: [number, number, number] = [0, 0, -1];
const UP_Y: [number, number, number] = [0, 1, 0];
const DOWN_Y: [number, number, number] = [0, -1, 0];

const addVectors = (a: Coord, b: [number, number, number]): Coord => [a[0] + b[0], a[1] + b[1], a[2] + b[2]];

export class Spiral3DTopology extends BaseTopology {
  *generatePathInfoVariants(
    gridSize: [number, number, number],
    params: Record<string, any>,
    maxVariants: number
  ): Generator<IPathInfo> {
    let count = 0;
    
    // Only override num_turns if not already set
    if (!('num_turns' in params)) {
      // Loop through turn counts (every 4 turns is 1 level)
      for (let numTurns = 4; numTurns <= 16; numTurns += 4) {
        if (count >= maxVariants) return;
        yield this.generatePathInfo(gridSize, { ...params, num_turns: numTurns });
        count++;
      }
    } else {
      // Params already has num_turns → only generate 1 variant
      yield this.generatePathInfo(gridSize, params);
    }
  }

  generatePathInfo(gridSize: [number, number, number], params: Record<string, any>): IPathInfo {
    console.log("    LOG: Generating 'spiral_3d' topology...");

    const numTurns = params.num_turns || 12; // Default 12 turns = 3 levels
    const reverse = params.reverse || false;

    // Center the spiral in the grid
    const startX = params.start_x || Math.floor(gridSize[0] / 2);
    const startZ = params.start_z || Math.floor(gridSize[2] / 2);

    let pathCoords: Coord[];
    let placementCoords: Set<string>;

    if (!reverse) {
      // FORWARD MODE: Go from bottom up, expanding outward
      const result = this._generateForwardSpiral(startX, startZ, numTurns);
      pathCoords = result.pathCoords;
      placementCoords = result.placementCoords;
    } else {
      // REVERSE MODE: Go from top down, shrinking inward
      console.log("    LOG: Generating REVERSED spiral (top-down, shrinking)...");
      const result = this._generateReverseSpiral(startX, startZ, numTurns);
      pathCoords = result.pathCoords;
      placementCoords = result.placementCoords;
    }

    const startPos = pathCoords[0];
    const targetPos = pathCoords[pathCoords.length - 1];

    // Group coords by Y level (platforms)
    const platformsDict: Record<number, Coord[]> = {};
    for (const coord of pathCoords) {
      const yLevel = coord[1];
      if (!platformsDict[yLevel]) platformsDict[yLevel] = [];
      platformsDict[yLevel].push(coord);
    }
    const platforms = Object.values(platformsDict);

    // Semantic positions
    const semantic_positions = {
      start: startPos,
      end: targetPos,
      optimal_start: 'start',
      optimal_end: 'end',
      valid_pairs: [
        {
          name: 'level_by_level_easy',
          start: 'start',
          end: 'end',
          path_type: 'level_traversal',
          strategies: ['platform_based', 'height_progression'],
          difficulty: 'EASY',
          teaching_goal: 'Items per level'
        },
        {
          name: 'ring_pattern_medium',
          start: 'start',
          end: 'end',
          path_type: 'ring_based',
          strategies: ['platform_based', 'radial_iteration'],
          difficulty: 'MEDIUM',
          teaching_goal: 'Ring-based patterns'
        },
        {
          name: 'progressive_spiral_hard',
          start: 'start',
          end: 'end',
          path_type: 'progressive',
          strategies: ['platform_based', 'height_progression'],
          difficulty: 'HARD',
          teaching_goal: 'Progressive spiral pattern'
        }
      ]
    };

    // Convert Set to Coord array
    const placementCoordsArray: Coord[] = [];
    placementCoords.forEach(key => {
      const [x, y, z] = key.split(',').map(Number);
      placementCoordsArray.push([x, y, z]);
    });

    return {
      start_pos: startPos,
      target_pos: targetPos,
      path_coords: pathCoords,
      placement_coords: placementCoordsArray,
      obstacles: [],
      metadata: {
        topology_type: 'spiral_3d',
        platforms: platforms,
        rings: platforms, // In spiral, each level is a ring
        num_turns: numTurns,
        reverse: reverse,
        segments: [pathCoords],
        semantic_positions
      },
    };
  }

  /**
   * Generate spiral path going UP (expanding outward).
   * Matches Python _generate_forward_spiral logic.
   */
  private _generateForwardSpiral(startX: number, startZ: number, numTurns: number): {
    pathCoords: Coord[];
    placementCoords: Set<string>;
  } {
    let y = 0;
    const startPos: Coord = [startX, y, startZ];
    const pathCoords: Coord[] = [startPos];
    const placementCoords = new Set<string>();
    placementCoords.add(`${startPos[0]},${startPos[1]},${startPos[2]}`);
    let currentPos: Coord = [...startPos];

    const directions = [FORWARD_X, FORWARD_Z, BACKWARD_X, BACKWARD_Z];
    let sideLength = 1;

    for (let i = 0; i < numTurns; i++) {
      // Increase side length every 2 turns (Python: i > 0 and i % 2 == 0)
      if (i > 0 && i % 2 === 0) {
        sideLength += 1;
      }

      const moveDirection = directions[i % 4];
      
      // Move along this side
      for (let step = 0; step < sideLength; step++) {
        currentPos = addVectors(currentPos, moveDirection);
        pathCoords.push([...currentPos]);
        placementCoords.add(`${currentPos[0]},${currentPos[1]},${currentPos[2]}`);
      }

      // Corner turn (UP) - except for the last turn
      if (i < numTurns - 1) {
        const nextTurnDirection = directions[(i + 1) % 4];

        // Logic: Jump from Current (Y) -> Landing (Y+1)
        // Step position and landing position
        const stepPos = addVectors(currentPos, nextTurnDirection);
        const landingPos = addVectors(stepPos, UP_Y);

        // Add block at step_pos (support for landing)
        placementCoords.add(`${stepPos[0]},${stepPos[1]},${stepPos[2]}`);

        // Add landing block (Y+1)
        placementCoords.add(`${landingPos[0]},${landingPos[1]},${landingPos[2]}`);

        // Path: Direct connection Current -> Landing (skip step_pos)
        pathCoords.push([...landingPos]);
        currentPos = [...landingPos];
      }
    }

    return { pathCoords, placementCoords };
  }

  /**
   * Generate spiral path going DOWN (shrinking inward).
   * Matches Python _generate_reverse_spiral logic.
   */
  private _generateReverseSpiral(startX: number, startZ: number, numTurns: number): {
    pathCoords: Coord[];
    placementCoords: Set<string>;
  } {
    // Start high
    let y = numTurns;
    let sideLength = Math.floor(numTurns / 2) + 1;

    // Calculate start position (top outer corner) by reverse-tracing
    const startPosCalc: [number, number, number] = [startX, y, startZ];
    let tempSideLength = sideLength;
    for (let i = 0; i < numTurns; i++) {
      if (i > 0 && i % 2 === 0) {
        tempSideLength -= 1;
      }
      const moveDirection = [FORWARD_X, FORWARD_Z, BACKWARD_X, BACKWARD_Z][i % 4];
      for (let step = 0; step < tempSideLength; step++) {
        startPosCalc[0] -= moveDirection[0];
        startPosCalc[2] -= moveDirection[2];
      }
    }

    const startPos: Coord = [...startPosCalc];
    const pathCoords: Coord[] = [startPos];
    const placementCoords = new Set<string>();
    placementCoords.add(`${startPos[0]},${startPos[1]},${startPos[2]}`);
    let currentPos: Coord = [...startPos];

    const directions = [BACKWARD_X, BACKWARD_Z, FORWARD_X, FORWARD_Z];
    sideLength = Math.floor(numTurns / 2) + 1;

    for (let i = 0; i < numTurns; i++) {
      const moveDirection = directions[i % 4];
      
      // Move along this side
      for (let step = 0; step < sideLength; step++) {
        currentPos = addVectors(currentPos, moveDirection);
        pathCoords.push([...currentPos]);
        placementCoords.add(`${currentPos[0]},${currentPos[1]},${currentPos[2]}`);
      }

      // Corner turn (DOWN) - except for the last turn
      if (i < numTurns - 1) {
        const nextTurnDirection = directions[(i + 1) % 4];

        // Logic: Jump DOWN from Current (Y) -> Landing (Y-1)
        const stepPos = addVectors(currentPos, nextTurnDirection);
        const landingPos = addVectors(stepPos, DOWN_Y);

        // Add landing block (Y-1)
        placementCoords.add(`${landingPos[0]},${landingPos[1]},${landingPos[2]}`);

        // Path: Direct connection Current -> Landing
        pathCoords.push([...landingPos]);
        currentPos = [...landingPos];
      }

      // Decrease side length for shrinking spiral
      if (i > 0 && i % 2 !== 0) {
        sideLength -= 1;
      }
    }

    return { pathCoords, placementCoords };
  }
}
