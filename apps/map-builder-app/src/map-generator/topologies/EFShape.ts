/**
 * EF Shape Topology
 * Creates an E or F shaped path - ideal for nested loops or functions with parameters
 * E: 3 branches (top, middle, bottom) | F: 2 branches (top, middle)
 */

import { BaseTopology } from './BaseTopology';
import { IPathInfo, Coord } from '../types';

export class EFShapeTopology extends BaseTopology {
  *generatePathInfoVariants(
    gridSize: [number, number, number],
    params: Record<string, any>,
    maxVariants: number
  ): Generator<IPathInfo> {
    const baseStemLen = params.stem_length || 7;
    const baseBranchLen = params.branch_length || 3;
    
    for (let i = 0; i < maxVariants; i++) {
      yield this.generatePathInfo(gridSize, {
        ...params,
        stem_length: baseStemLen + Math.floor(i / 2),
        branch_length: baseBranchLen + (i % 2),
        num_branches: (i % 2 === 0) ? 3 : 2 // Alternate between E and F
      });
    }
  }

  generatePathInfo(gridSize: [number, number, number], params: Record<string, any>): IPathInfo {
    const stemLen = Math.max(7, params.stem_length || 7); // Ensure minimum stem length
    const numBranches = params.num_branches || 3; // 3 for E, 2 for F
    const branchLen = params.branch_length || 3;
    const startX = params.start_x || 2;
    const startZ = params.start_z || 2;
    const y = 0;

    const placementCoordsSet = new Set<string>();
    const stemCoords: Coord[] = [];

    // Draw stem (vertical line)
    for (let i = 0; i < stemLen; i++) {
      const coord: Coord = [startX, y, startZ + i];
      placementCoordsSet.add(`${coord[0]},${coord[1]},${coord[2]}`);
      stemCoords.push(coord);
    }

    // Determine branch positions
    const branchOffsets: number[] = [];
    const middleOffset = Math.floor((stemLen - 1) / 2);
    const topOffset = stemLen - 1;

    if (numBranches === 3) { // E shape: bottom, middle, top
      branchOffsets.push(0, middleOffset, topOffset);
    } else { // F shape: middle, top
      branchOffsets.push(middleOffset, topOffset);
    }

    // Draw branches and collect branch coords
    const allBranches: Coord[][] = [stemCoords]; // Stem is first "branch"
    const junctions: Coord[] = [];
    
    for (const offset of branchOffsets) {
      const branchStart: Coord = [startX, y, startZ + offset];
      junctions.push(branchStart);
      
      const branchCoords: Coord[] = [];
      for (let i = 1; i <= branchLen; i++) {
        const coord: Coord = [startX + i, y, startZ + offset];
        placementCoordsSet.add(`${coord[0]},${coord[1]},${coord[2]}`);
        branchCoords.push(coord);
      }
      allBranches.push(branchCoords);
    }

    // Convert set to array
    const placementCoords: Coord[] = [];
    placementCoordsSet.forEach(key => {
      const [x, yVal, z] = key.split(',').map(Number);
      placementCoords.push([x, yVal, z]);
    });

    // Define endpoints
    const tail = stemCoords[0];
    const stemTop = stemCoords[stemLen - 1];
    const topRightBranch = allBranches[allBranches.length - 1];
    const topRight = topRightBranch[topRightBranch.length - 1];
    const middleRightBranch = allBranches.length > 2 ? allBranches[allBranches.length - 2] : allBranches[1];
    const middleRight = middleRightBranch[middleRightBranch.length - 1];

    // Semantic positions for function_reuse strategy
    const semantic_positions: Record<string, any> = {
      tail: tail,
      stem_top: stemTop,
      top_left: stemTop,
      top_right: topRight,
      middle_right: middleRight,
      optimal_start: 'tail',
      optimal_end: 'top_right',
      valid_pairs: [
        {
          name: 'stem_traverse_easy',
          start: 'tail',
          end: 'stem_top',
          path_type: 'single_segment',
          strategies: ['segment_pattern_reuse', 'spine_branch'],
          difficulty: 'EASY',
          teaching_goal: 'Simple stem traversal'
        },
        {
          name: 'tail_to_top_medium',
          start: 'tail',
          end: 'top_right',
          path_type: 'stem_then_branch',
          strategies: ['function_reuse', 'conditional_branching'],
          difficulty: 'MEDIUM',
          teaching_goal: 'Stem then branch with repeated pattern'
        },
        {
          name: 'branch_to_branch_hard',
          start: 'middle_right',
          end: 'top_right',
          path_type: 'cross_stem',
          strategies: ['function_reuse', 'spine_branch'],
          difficulty: 'HARD',
          teaching_goal: 'Multiple branches with PROCEDURE reuse'
        }
      ]
    };

    // Get start/end positions
    const possibleEndpoints = [tail, stemTop, topRight, middleRight];
    const [startPos, targetPos] = this.getStartEndPositions(
      { semantic_positions },
      possibleEndpoints
    );

    // Build path with BFS if needed, or simple path from tail to top branch
    const pathCoords: Coord[] = [...stemCoords];
    // Add top branch to path
    if (branchOffsets.includes(topOffset)) {
      for (let i = 1; i <= branchLen; i++) {
        pathCoords.push([startX + i, y, startZ + topOffset]);
      }
    }

    // Calculate segments and corners from the path
    const segments: Coord[][] = [];
    const corners: Coord[] = [];
    
    if (pathCoords.length > 1) {
      let currentSegment: Coord[] = [pathCoords[0]];
      let lastDiff: [number, number] = [
        pathCoords[1][0] - pathCoords[0][0],
        pathCoords[1][2] - pathCoords[0][2]
      ];
      
      for (let i = 1; i < pathCoords.length; i++) {
        const curr = pathCoords[i];
        const prev = pathCoords[i - 1];
        const currDiff: [number, number] = [curr[0] - prev[0], curr[2] - prev[2]];
        
        if (currDiff[0] === lastDiff[0] && currDiff[1] === lastDiff[1]) {
          currentSegment.push(curr);
        } else {
          corners.push(prev);
          segments.push(currentSegment);
          currentSegment = [prev, curr];
          lastDiff = currDiff;
        }
      }
      segments.push(currentSegment);
    } else {
      segments.push(pathCoords);
    }

    // Segment analysis
    const segmentLengths = segments.map(s => s.length);
    const segment_analysis = {
      num_segments: segments.length,
      lengths: segmentLengths,
      types: segments.map((_, i) => i === 0 ? 'stem' : 'branch'),
      min_length: Math.min(...segmentLengths),
      max_length: Math.max(...segmentLengths),
      avg_length: segmentLengths.reduce((a, b) => a + b, 0) / segmentLengths.length
    };

    return {
      start_pos: startPos,
      target_pos: targetPos,
      path_coords: pathCoords,
      placement_coords: placementCoords,
      obstacles: [],
      metadata: {
        topology_type: numBranches === 3 ? 'e_shape' : 'f_shape',
        branches: allBranches,
        stem: stemCoords,
        num_branches: numBranches,
        branch_offsets: branchOffsets,
        junctions: junctions,
        segments: segments,
        corners: corners,
        segment_analysis: segment_analysis,
        semantic_positions: semantic_positions
      },
    };
  }
}
