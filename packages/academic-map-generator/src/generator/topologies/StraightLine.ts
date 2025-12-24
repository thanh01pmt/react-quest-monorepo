/**
 * StraightLine Topology (PORTED FROM PYTHON)
 * Creates a simple straight path on an axis.
 */

import { BaseTopology } from './BaseTopology';
import { IPathInfo, Coord } from '../types';

export class StraightLineTopology extends BaseTopology {
  *generatePathInfoVariants(
    gridSize: [number, number, number],
    params: Record<string, any>,
    maxVariants: number
  ): Generator<IPathInfo> {
    const baseLength = params.path_length || 5;
    const maxPossibleLength = Math.min(gridSize[0] - 4, gridSize[2] - 4);

    // 1. Yield base variant
    yield this.generatePathInfo(gridSize, params);

    // 2. Variants increasing length
    for (let i = 1; i < maxVariants; i++) {
        const newLength = baseLength + i;
        if (newLength > maxPossibleLength) break;
        
        const variantParams = { ...params };
        variantParams.path_length = newLength;
        yield this.generatePathInfo(gridSize, variantParams);
    }
  }

  generatePathInfo(
    gridSize: [number, number, number],
    params: Record<string, any>
  ): IPathInfo {
    console.log("    LOG: Generating 'straight_line' topology...");

    let pathLength = params.path_length || 5;
    const maxDim = Math.max(gridSize[0], gridSize[2]);
    if (pathLength >= maxDim - 2) pathLength = maxDim - 3;

    // Random choice
    const axis = Math.random() < 0.5 ? 'x' : 'z';
    const direction = Math.random() < 0.5 ? 1 : -1;

    // Start Pos
    const totalCellsNeeded = pathLength + 2;
    const y = 0;
    const startPosList: [number, number, number] = [0, y, 0];

    if (axis === 'x') {
        if (direction === 1) {
            startPosList[0] = Math.floor(Math.random() * (gridSize[0] - totalCellsNeeded + 1));
        } else {
            startPosList[0] = Math.floor(Math.random() * (gridSize[0] - totalCellsNeeded) + totalCellsNeeded - 1); // Python: randint(needed-1, size-1)
            // Fix: randint(a, b) includes b. 
            // Range: [total_cells_needed - 1, grid_size[0] - 1]
            const min = totalCellsNeeded - 1;
            const max = gridSize[0] - 1;
            startPosList[0] = Math.floor(Math.random() * (max - min + 1)) + min;
        }
        startPosList[2] = Math.floor(Math.random() * gridSize[2]);
    } else { // z
        if (direction === 1) {
            startPosList[2] = Math.floor(Math.random() * (gridSize[2] - totalCellsNeeded + 1));
        } else {
            const min = totalCellsNeeded - 1;
            const max = gridSize[2] - 1;
            startPosList[2] = Math.floor(Math.random() * (max - min + 1)) + min;
        }
        startPosList[0] = Math.floor(Math.random() * gridSize[0]);
    }

    const startPos: Coord = [startPosList[0], startPosList[1], startPosList[2]];
    const pathCoords: Coord[] = [startPos];
    const currentPos: Coord = [...startPos];

    // Create coords
    for (let i = 0; i < pathLength; i++) {
        if (axis === 'x') currentPos[0] += direction;
        else currentPos[2] += direction;
        pathCoords.push([...currentPos]);
    }

    const targetPos = pathCoords[pathCoords.length - 1];
    const midpoint = pathCoords[Math.floor(pathCoords.length / 2)];

    // Metadata
    // Python has: "segment": path_coords (single list)
    // NO "segments" key.
    
    const metadata = {
        topology_type: "straight_line",
        segment: pathCoords,
        path_length: pathLength,
        axis: axis,
        direction: direction,
        semantic_positions: {
            start: startPos,
            end: targetPos,
            midpoint: midpoint,
            optimal_start: 'start',
            optimal_end: 'end',
            valid_pairs: [
                {
                    name: 'full_line_easy',
                    start: 'start',
                    end: 'end',
                    path_type: 'full_traversal',
                    strategies: ['alternating_patterns', 'progressive_spacing'],
                    difficulty: 'EASY',
                    teaching_goal: 'Regular spacing along line'
                },
                {
                    name: 'half_line_medium',
                    start: 'start',
                    end: 'midpoint',
                    path_type: 'partial_traversal',
                    strategies: ['alternating_patterns', 'grouped_items'],
                    difficulty: 'MEDIUM',
                    teaching_goal: 'Grouped pattern in half'
                },
                {
                    name: 'variable_spacing_hard',
                    start: 'start',
                    end: 'end',
                    path_type: 'variable_spacing',
                    strategies: ['alternating_patterns', 'progressive_spacing'],
                    difficulty: 'HARD',
                    teaching_goal: 'Progressive item spacing'
                }
            ]
        }
    };

    return {
        start_pos: startPos,
        target_pos: targetPos,
        path_coords: pathCoords,
        placement_coords: pathCoords,
        obstacles: [],
        metadata: metadata
    };
  }
}
