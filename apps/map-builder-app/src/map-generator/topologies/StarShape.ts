
import { BaseTopology } from './BaseTopology';
import { IPathInfo, Coord } from '../types';
import { addVectors, FORWARD_X, FORWARD_Z, BACKWARD_X, BACKWARD_Z } from '../utils/geometry';

export class StarShapeTopology extends BaseTopology {
  *generatePathInfoVariants(
    gridSize: [number, number, number],
    params: Record<string, any>,
    maxVariants: number
  ): Generator<IPathInfo> {
    const baseSize = params.star_size || 2;

    for (let i = 0; i < maxVariants; i++) {
        const variantParams = { ...params };
        variantParams.star_size = baseSize + i;
        if (params.path_length) {
             variantParams.path_length = (params.path_length || 3) + i;
        }
        yield this.generatePathInfo(gridSize, variantParams);
    }
  }

  generatePathInfo(
    gridSize: [number, number, number],
    params: Record<string, any>
  ): IPathInfo {
    let size = params.star_size || 3;
    const pathMode = params.path_mode || 'full_outline';
    if (size < 2) size = 2;

    const centerX = Math.floor(gridSize[0] / 2);
    const centerZ = Math.floor(gridSize[2] / 2);

    let currentPos: Coord = [centerX, 0, centerZ - size * 2];
    const pathCoords: Coord[] = [currentPos];

    // Map strings to vectors
    const directionMap: Record<string, Coord> = {
        'right': FORWARD_X,
        'down': FORWARD_Z,
        'left': BACKWARD_X,
        'up': BACKWARD_Z,
    };

    const straightSegments: Coord[][] = [];
    
    // Star outline logic
    const segmentsDef = [
        {dir: 'right', steps: size},
        {dir: 'down', steps: size},
        {dir: 'left', steps: size},
        {dir: 'down', steps: size}, // right-bottom corner
        {dir: 'left', steps: size}, // bottom peak
        {dir: 'up', steps: size},   // left-bottom corner
        {dir: 'left', steps: size}, // left arm
        {dir: 'up', steps: size},   // left-top corner
        {dir: 'right', steps: size}, // top-left inward
        {dir: 'up', steps: size - 1}, // connect back
    ];

    for (const def of segmentsDef) {
        const moveVector = directionMap[def.dir];
        const currentSegment = [currentPos];
        for (let i = 0; i < def.steps; i++) {
            currentPos = addVectors(currentPos, moveVector);
            pathCoords.push(currentPos);
            currentSegment.push(currentPos);
        }
        straightSegments.push(currentSegment);
    }

    // Deduplicate
    const uniqueCoordsSet = new Set<string>();
    const placementCoords: Coord[] = [];
    for(const c of pathCoords) {
        const key = c.join(',');
        if(!uniqueCoordsSet.has(key)) {
            uniqueCoordsSet.add(key);
            placementCoords.push(c);
        }
    }

    // Path selection logic
    let finalPath: Coord[];
    if (pathMode === 'straight_segment') {
        const longSegments = straightSegments.filter(s => s.length === size + 1);
        if (longSegments.length > 0) {
            finalPath = longSegments[Math.floor(Math.random() * longSegments.length)];
        } else if (straightSegments.length > 0) {
            finalPath = straightSegments[Math.floor(Math.random() * straightSegments.length)];
        } else {
             finalPath = placementCoords;
        }
    } else {
        finalPath = placementCoords;
    }

    // Metadata
    const corners: Coord[] = [];
    for(const seg of straightSegments) {
        if(seg.length > 0) corners.push(seg[0]);
    }

    const branches: Coord[][] = [];
    for(let i=0; i<straightSegments.length - 1; i+=2) {
        // combine seg[i] and seg[i+1] skipping join point
        const arm = [...straightSegments[i], ...straightSegments[i+1].slice(1)];
        branches.push(arm);
    }

    const semanticPositions: Record<string, any> = {
        center: [centerX, 0, centerZ],
        start_point: finalPath[0],
        end_point: finalPath[finalPath.length - 1],
    };
    
    // Arm endpoints
    branches.forEach((branch, i) => {
        if (branch.length > 0) {
            const tipIdx = Math.floor(branch.length / 2);
            semanticPositions[`arm_${i}_end`] = branch[Math.min(tipIdx, branch.length - 1)];
        }
    });

    semanticPositions.optimal_start = 'center';
    semanticPositions.optimal_end = 'arm_0_end';
    
    const metadata = {
        topology_type: 'star_shape',
        segments: straightSegments,
        branches: branches,
        corners: corners,
        star_size: size,
        semantic_positions: semanticPositions
    };

    return {
        start_pos: finalPath[0],
        target_pos: finalPath[finalPath.length - 1],
        path_coords: finalPath,
        placement_coords: placementCoords,
        obstacles: [],
        metadata: metadata
    };
  }
}
