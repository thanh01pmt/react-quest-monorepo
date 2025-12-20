/**
 * Interspersed Path Topology
 * Creates a main path with side branches - ideal for function lessons
 */

import { BaseTopology } from './BaseTopology';
import { IPathInfo, Coord } from '../types';

export class InterspersedPathTopology extends BaseTopology {
  *generatePathInfoVariants(
    gridSize: [number, number, number],
    params: Record<string, any>,
    maxVariants: number
  ): Generator<IPathInfo> {
    const baseNumBranches = params.num_branches || 2;
    const baseBranchLength = params.branch_length || 2;
    
    let count = 0;
    for (let numB = 2; numB <= 4; numB++) {
      for (let lenB = 2; lenB <= 4; lenB++) {
        if (count >= maxVariants) return;
        yield this.generatePathInfo(gridSize, {
          ...params,
          num_branches: numB,
          branch_length: lenB
        });
        count++;
      }
    }
  }

  generatePathInfo(gridSize: [number, number, number], params: Record<string, any>): IPathInfo {
    const mainPathLength = params.main_path_length || 9;
    const numBranches = params.num_branches || 2;
    const branchLength = params.branch_length || 2;
    const startX = params.start_x || 2;
    const startZ = params.start_z || Math.floor(gridSize[2] / 2);
    const y = 0;

    const startPos: Coord = [startX, y, startZ];
    const mainPathCoords: Coord[] = [startPos];
    const branchCoordsList: Coord[][] = [];
    
    let current: Coord = [...startPos];

    // Choose branch points along main path
    const branchIndices: number[] = [];
    for (let i = 1; i < mainPathLength - 1 && branchIndices.length < numBranches; i += 2) {
      branchIndices.push(i);
    }

    let branchDirection = 1; // 1 = +Z, -1 = -Z

    // Build main path and branches
    for (let i = 0; i < mainPathLength; i++) {
      current = [current[0] + 1, current[1], current[2]];
      mainPathCoords.push([...current]);

      // If this is a branch point
      if (branchIndices.includes(i + 1)) {
        const branchCoords: Coord[] = [];
        let branchPos: Coord = [...current];
        
        for (let b = 0; b < branchLength; b++) {
          branchPos = [branchPos[0], branchPos[1], branchPos[2] + branchDirection];
          branchCoords.push([...branchPos]);
        }
        
        branchCoordsList.push(branchCoords);
        branchDirection *= -1; // Alternate sides
      }
    }

    const targetPos = mainPathCoords[mainPathCoords.length - 1];

    // Combine all coords
    const allCoordsSet = new Set<string>();
    const allCoords: Coord[] = [];
    
    [...mainPathCoords, ...branchCoordsList.flat()].forEach(coord => {
      const key = `${coord[0]},${coord[1]},${coord[2]}`;
      if (!allCoordsSet.has(key)) {
        allCoordsSet.add(key);
        allCoords.push(coord);
      }
    });

    return {
      start_pos: startPos,
      target_pos: targetPos,
      path_coords: mainPathCoords,
      placement_coords: allCoords,
      obstacles: [],
      metadata: {
        topology_type: 'interspersed_path',
        main_path: mainPathCoords,
        branches: branchCoordsList,
      },
    };
  }
}
