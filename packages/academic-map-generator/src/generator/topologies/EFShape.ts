/**
 * EF Shape Topology (PORTED FROM PYTHON)
 * Creates an E or F shaped path.
 * Ideal for nested loops or functions with parameters.
 */

import { BaseTopology } from './BaseTopology';
import { IPathInfo, Coord } from '../types';
import { addVectors, FORWARD_X, BACKWARD_X, FORWARD_Z, BACKWARD_Z, areVectorsEqual } from '../utils/geometry';

export class EFShapeTopology extends BaseTopology {
  *generatePathInfoVariants(
    gridSize: [number, number, number],
    params: Record<string, any>,
    maxVariants: number
  ): Generator<IPathInfo> {
    const baseStemLen = params.stem_length || 5;
    const baseBranchLen = params.branch_length || 2;
    const baseNumBranches = params.num_branches || 3;

    for (let i = 0; i < maxVariants; i++) {
        const variantParams = { ...params };
        variantParams.stem_length = baseStemLen + Math.floor(i / 2);
        variantParams.branch_length = baseBranchLen + (i % 2);
        // Alternate between 2 and 3 branches
        variantParams.num_branches = ((baseNumBranches + i) % 2 === 0) ? 2 : 3;

        yield this.generatePathInfo(gridSize, variantParams);
    }
  }

  generatePathInfo(
    gridSize: [number, number, number],
    params: Record<string, any>
  ): IPathInfo {
    console.log("    LOG: Generating 'ef_shape' topology...");

    let stemLen = params.stem_length || (Math.floor(Math.random() * 3) + 7);
    let numBranches = params.num_branches;
    if (numBranches === undefined) numBranches = Math.random() < 0.5 ? 2 : 3;
    let branchLen = params.branch_length || (Math.floor(Math.random() * 3) + 3);

    // Min safety
    if (stemLen < 7) stemLen = 7;

    let requiredWidth = branchLen + 1;
    let requiredDepth = stemLen;

    if (requiredWidth > gridSize[0] - 2) requiredWidth = gridSize[0] - 2;
    if (requiredDepth > gridSize[2] - 2) requiredDepth = gridSize[2] - 2;

    const startX = Math.floor(Math.random() * (gridSize[0] - requiredWidth - 1)) + 1;
    const startZ = Math.floor(Math.random() * (gridSize[2] - requiredDepth - 1)) + 1;
    const y = 0;
    
    // -- SHAPE GENERATION --
    const placementCoordsSet = new Set<string>();
    const stemCoords: Coord[] = [];

    // 1. Stem
    for (let i = 0; i < stemLen; i++) {
        const c: Coord = [startX, y, startZ + i];
        placementCoordsSet.add(c.join(','));
        stemCoords.push(c);
    }

    const tail = stemCoords[0];
    const stemTop = stemCoords[stemCoords.length - 1];
    const endpoints: Coord[] = [tail, stemTop];

    // 2. Branch Offsets
    const middleOffset = Math.floor((stemLen - 1) / 2);
    const topOffset = stemLen - 1;
    let branchOffsets: number[] = [];

    if (numBranches === 3) branchOffsets = [0, middleOffset, topOffset]; // E
    else branchOffsets = [middleOffset, topOffset]; // F

    // 3. Branches
    const allBranches: Coord[][] = [stemCoords]; // First element is stem
    const junctions: Coord[] = [];

    let topRight: Coord = stemTop; // Placeholder
    let middleRight: Coord = stemCoords[middleOffset]; // Placeholder

    for (let offset of branchOffsets) {
        const branchStart: Coord = [startX, y, startZ + offset];
        junctions.push(branchStart);
        
        const branchCoords: Coord[] = [];
        let curr = branchStart;
        for (let i = 1; i <= branchLen; i++) {
            curr = [branchStart[0] + i, y, branchStart[2]];
            placementCoordsSet.add(curr.join(','));
            branchCoords.push(curr);
        }
        allBranches.push(branchCoords);

        const branchEnd = curr;
        if (offset !== 0 && offset !== topOffset) endpoints.push(branchEnd);
        
        if (offset === topOffset) topRight = branchEnd;
        if (offset === middleOffset) middleRight = branchEnd;
    }

    // -- SEMANTIC POSITIONS --
    const semanticPositions = {
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

    // Determine Start/End
    // Use helper to select logic based on semantic positions or valid pairs
    // Since this method isn't in BaseTopology in TS yet, we implement valid pair selection manually or use default.
    // Defaulting to "tail" -> "top_right" (medium/standard) if not specified via params?
    // Or implementing Python's `_get_start_end_positions` which picks a random valid pair if requested?
    // We will pick the "optimal" pair by default.
    
    let startPos = tail;
    let targetPos = topRight;
    
    // -- PATH FINDING (BFS) --
    const placementList: Coord[] = [];
    placementCoordsSet.forEach(s => placementList.push(s.split(',').map(Number) as Coord));

    const pathCoords = this.findShortestPath(startPos, targetPos, placementCoordsSet);

    // Metadata Construction
    const segments: Coord[][] = [];
    const corners: Coord[] = [];

    if (pathCoords.length > 0) {
        let currentSeg: Coord[] = [pathCoords[0]];
        if (pathCoords.length > 1) {
             let lastDiff = [pathCoords[1][0] - pathCoords[0][0], pathCoords[1][1] - pathCoords[0][1], pathCoords[1][2] - pathCoords[0][2]];
             for (let i = 1; i < pathCoords.length; i++) {
                 const curr = pathCoords[i];
                 const prev = pathCoords[i-1];
                 const diff = [curr[0] - prev[0], curr[1] - prev[1], curr[2] - prev[2]];
                 
                 if (diff[0]===lastDiff[0] && diff[1]===lastDiff[1] && diff[2]===lastDiff[2]) {
                     currentSeg.push(curr);
                 } else {
                     corners.push(prev);
                     segments.push(currentSeg);
                     currentSeg = [prev, curr];
                     lastDiff = diff;
                 }
             }
             segments.push(currentSeg);
        } else {
            segments.push(currentSeg);
        }
    }

    const segmentLengths = segments.map(s => s.length);
    const segment_analysis = {
            num_segments: segments.length,
            lengths: segmentLengths,
            types: segments.map(() => 'ef_segment'),
            min_length: Math.min(...segmentLengths),
            max_length: Math.max(...segmentLengths),
            avg_length: segmentLengths.reduce((a,b)=>a+b,0)/segmentLengths.length || 0
    };

    const metadata = {
        topology_type: numBranches === 3 ? "e_shape" : "f_shape",
        branches: allBranches,
        stem: stemCoords,
        num_branches: numBranches,
        branch_offsets: branchOffsets,
        junctions: junctions,
        segments: segments,
        corners: corners,
        segment_analysis: segment_analysis,
        semantic_positions: semanticPositions
    };

    return {
        start_pos: startPos,
        target_pos: targetPos,
        path_coords: pathCoords,
        placement_coords: placementList,
        obstacles: [],
        metadata: metadata
    };
  }

  // BFS Helper
  findShortestPath(start: Coord, end: Coord, validSet: Set<string>): Coord[] {
      const queue: { pos: Coord, path: Coord[] }[] = [{ pos: start, path: [start] }];
      const visited = new Set<string>();
      visited.add(start.join(','));
      
      while (queue.length > 0) {
          const { pos, path } = queue.shift()!;
          if (pos[0] === end[0] && pos[1] === end[1] && pos[2] === end[2]) {
              return path;
          }
          
          const neighbors = [
              addVectors(pos, FORWARD_X),
              addVectors(pos, BACKWARD_X),
              addVectors(pos, FORWARD_Z),
              addVectors(pos, BACKWARD_Z)
          ];
          
          for (const next of neighbors) {
              const key = next.join(',');
              if (validSet.has(key) && !visited.has(key)) {
                  visited.add(key);
                  queue.push({
                      pos: next,
                      path: [...path, next]
                  });
              }
          }
      }
      return []; // Failed
  }
}
