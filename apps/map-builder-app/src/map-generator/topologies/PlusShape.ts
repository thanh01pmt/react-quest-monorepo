
import { BaseTopology } from './BaseTopology';
import { IPathInfo, Coord } from '../types';
import { FORWARD_X, BACKWARD_X, FORWARD_Z, BACKWARD_Z, addVectors, areVectorsEqual, vectorToString } from '../utils/geometry';

export class PlusShapeTopology extends BaseTopology {
  *generatePathInfoVariants(
    gridSize: [number, number, number],
    params: Record<string, any>,
    maxVariants: number
  ): Generator<IPathInfo> {
    const baseArmLen = params.arm_length || 5;

    for (let i = 0; i < maxVariants; i++) {
        const variantParams = { ...params };
        variantParams.arm_length = baseArmLen + i;
        
        if (variantParams.path_length) {
            variantParams.path_length = (params.path_length || 5) + i;
        }

        yield this.generatePathInfo(gridSize, variantParams);
    }
  }

  generatePathInfo(
    gridSize: [number, number, number],
    params: Record<string, any>
  ): IPathInfo {
    const [gridW, , gridD] = gridSize;
    const armLength = params.arm_length || 5;

    const centerX = Math.floor(gridW / 2);
    const centerZ = Math.floor(gridD / 2);

    // 1. Generate all coordinates
    const placementCoordsSet = new Set<string>();
    const placementCoords: Coord[] = [];

    const addCoord = (x: number, y: number, z: number) => {
        const c: Coord = [x, y, z];
        const key = vectorToString(c);
        if (!placementCoordsSet.has(key)) {
            placementCoordsSet.add(key);
            placementCoords.push(c);
        }
    };

    // Horizontal arm
    for (let i = -armLength; i <= armLength; i++) {
        addCoord(centerX + i, 0, centerZ);
    }
    // Vertical arm
    for (let i = -armLength; i <= armLength; i++) {
        addCoord(centerX, 0, centerZ + i);
    }

    // 2. Identify endpoints
    const endpointsH: Coord[] = [
        [centerX - armLength, 0, centerZ],
        [centerX + armLength, 0, centerZ]
    ];
    const endpointsV: Coord[] = [
        [centerX, 0, centerZ - armLength],
        [centerX, 0, centerZ + armLength]
    ];

    // 3. Semantic Positions
    const validPairs = [
        {
            name: 'center_to_right_easy',
            start: 'center',
            end: 'right_end',
            path_type: 'single_branch',
            strategies: ['function_reuse', 'hub_spoke'],
            difficulty: 'EASY',
            teaching_goal: 'Simple single branch traversal'
        },
        {
            name: 'left_to_right_medium',
            start: 'left_end',
            end: 'right_end',
            path_type: 'traverse_hub',
            strategies: ['function_reuse', 'l_shape_logic'],
            difficulty: 'MEDIUM',
            teaching_goal: 'Cross through center, two branches'
        },
        {
            name: 'corner_all_branches_hard',
            start: 'left_end',
            end: 'bottom_end',
            path_type: 'full_traversal',
            strategies: ['function_reuse', 'radial_symmetry'],
            difficulty: 'HARD',
            teaching_goal: 'Visit all 4 branches with identical pattern'
        }
    ];

    const semanticPositions: Record<string, any> = {
        center: [centerX, 0, centerZ],
        left_end: endpointsH[0],
        right_end: endpointsH[1],
        top_end: endpointsV[0],
        bottom_end: endpointsV[1],
        optimal_start: 'center',
        optimal_end: 'right_end',
        valid_pairs: validPairs
    };

    const allPotentialPoints = [...endpointsH, ...endpointsV, [centerX, 0, centerZ] as Coord];
    const [startPos, targetPos] = this.getStartEndPositions(
        { semantic_positions: semanticPositions },
        allPotentialPoints
    );

    // 4. Define Branches
    const center: Coord = [centerX, 0, centerZ];

    const branchRight: Coord[] = [center];
    for(let i=1; i<=armLength; i++) branchRight.push([centerX + i, 0, centerZ]);

    const branchLeft: Coord[] = [center];
    for(let i=1; i<=armLength; i++) branchLeft.push([centerX - i, 0, centerZ]);
    
    const branchDown: Coord[] = [center];
    for(let i=1; i<=armLength; i++) branchDown.push([centerX, 0, centerZ + i]);

    const branchUp: Coord[] = [center];
    for(let i=1; i<=armLength; i++) branchUp.push([centerX, 0, centerZ - i]);

    const branchMap: Record<string, {name: string, coords: Coord[]}> = {
        [vectorToString([centerX + armLength, 0, centerZ])]: {name: 'right', coords: branchRight},
        [vectorToString([centerX - armLength, 0, centerZ])]: {name: 'left', coords: branchLeft},
        [vectorToString([centerX, 0, centerZ + armLength])]: {name: 'down', coords: branchDown},
        [vectorToString([centerX, 0, centerZ - armLength])]: {name: 'up', coords: branchUp},
    };
    if (!branchMap[vectorToString(center)]) {
        branchMap[vectorToString(center)] = {name: 'center', coords: [center]};
    }

    // 5. Generate Path
    let pathCoords: Coord[] = [];
    const visitedBranches = new Set<string>();

    // Start -> Center
    const startBranchInfo = branchMap[vectorToString(startPos)] || {name: 'unknown', coords: []};
    visitedBranches.add(startBranchInfo.name);

    if (areVectorsEqual(startPos, center)) {
        pathCoords.push(center);
    } else {
        // Go from endpoint to center (reverse of branch which is center->out)
        pathCoords.push(...[...startBranchInfo.coords].reverse());
    }

    // Visit OTHER branches
    const targetBranchInfo = branchMap[vectorToString(targetPos)] || {name: 'unknown', coords: []};
    if (!areVectorsEqual(targetPos, center)) {
        visitedBranches.add(targetBranchInfo.name);
    }

    const allBranches = [
        {name: 'right', coords: branchRight},
        {name: 'left', coords: branchLeft},
        {name: 'down', coords: branchDown},
        {name: 'up', coords: branchUp}
    ];

    for (const b of allBranches) {
        if (!visitedBranches.has(b.name)) {
             // Go out (skip center)
             pathCoords.push(...b.coords.slice(1));
             // Come back (reverse, skip endpoint)
             pathCoords.push(...[...b.coords.slice(1, -1)].reverse());
             // Back at center
             pathCoords.push(center);
        }
    }

    // Center -> Target
    if (!areVectorsEqual(targetPos, center)) {
        // Center to target endpoint (skip center)
        pathCoords.push(...targetBranchInfo.coords.slice(1));
    }

    // Clean up duplicates
    const cleanedPath: Coord[] = [pathCoords[0]];
    for(let i=1; i<pathCoords.length; i++) {
        if (!areVectorsEqual(pathCoords[i], cleanedPath[cleanedPath.length-1])) {
             cleanedPath.push(pathCoords[i]);
        }
    }
    pathCoords = cleanedPath;

    // Metadata Construction
    const segments: Coord[][] = [];
    const corners: Coord[] = [];

    if (pathCoords.length > 0) {
        let currentSegment = [pathCoords[0]];
        if (pathCoords.length > 1) {
            let lastDiff: [number, number] = [
                pathCoords[1][0] - pathCoords[0][0],
                pathCoords[1][2] - pathCoords[0][2]
            ];
            
            for (let i=1; i<pathCoords.length; i++) {
                const curr = pathCoords[i];
                const prev = pathCoords[i-1];
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
            segments.push(currentSegment);
        }
    }

    const metadata = {
        topology_type: "plus_shape",
        semantic_positions: semanticPositions,
        center: center,
        branches: [branchRight, branchLeft, branchDown, branchUp],
        // segments, corners analysis
        segments: segments,
        corners: corners
    };

    return {
        start_pos: startPos,
        target_pos: targetPos,
        path_coords: pathCoords.length > 0 ? pathCoords : [startPos, targetPos],
        placement_coords: placementCoords,
        obstacles: [],
        metadata: metadata
    };
  }
}
