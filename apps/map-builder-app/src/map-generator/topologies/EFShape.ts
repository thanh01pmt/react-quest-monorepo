/**
 * EF Shape Topology
 * Creates an E or F shaped path - ideal for nested loops or functions with parameters
 */

import { BaseTopology } from './BaseTopology';
import { IPathInfo, Coord } from '../types';

export class EFShapeTopology extends BaseTopology {
  *generatePathInfoVariants(
    gridSize: [number, number, number],
    params: Record<string, any>,
    maxVariants: number
  ): Generator<IPathInfo> {
    const baseStemLen = params.stem_length || 5;
    const baseBranchLen = params.branch_length || 2;
    
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
    const stemLen = params.stem_length || 5;
    const numBranches = params.num_branches || 3; // 3 for E, 2 for F
    const branchLen = params.branch_length || 2;
    const startX = params.start_x || 2;
    const startZ = params.start_z || 2;
    const y = 0;

    const placementCoordsSet = new Set<string>();
    const stemCoords: Coord[] = [];

    // Draw stem
    for (let i = 0; i < stemLen; i++) {
      const coord: Coord = [startX, y, startZ + i];
      placementCoordsSet.add(`${coord[0]},${coord[1]},${coord[2]}`);
      stemCoords.push(coord);
    }

    // Determine branch positions
    const branchOffsets: number[] = [];
    const middleOffset = Math.floor((stemLen - 1) / 2);
    const topOffset = stemLen - 1;

    if (numBranches === 3) { // E shape
      branchOffsets.push(0, middleOffset, topOffset);
    } else { // F shape
      branchOffsets.push(middleOffset, topOffset);
    }

    // Draw branches
    const allBranches: Coord[][] = [stemCoords];
    for (const offset of branchOffsets) {
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
      const [x, y, z] = key.split(',').map(Number);
      placementCoords.push([x, y, z]);
    });

    // Path from bottom of stem to top branch tip
    const pathCoords: Coord[] = [...stemCoords];
    if (branchOffsets.includes(topOffset)) {
      for (let i = 1; i <= branchLen; i++) {
        pathCoords.push([startX + i, y, startZ + topOffset]);
      }
    }

    const startPos = stemCoords[0];
    const targetPos = pathCoords[pathCoords.length - 1];

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
      },
    };
  }
}
