
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
    
    // Add valid_pairs for difficulty-based selection
    semanticPositions.valid_pairs = [
        {
            name: 'center_outward_easy',
            start: 'center',
            end: 'arm_0_end',
            path_type: 'single_arm',
            strategies: ['radial_iteration', 'function_reuse'],
            difficulty: 'EASY',
            teaching_goal: 'Traverse one arm with simple pattern'
        },
        {
            name: 'arm_to_arm_medium',
            start: 'arm_0_end',
            end: 'arm_2_end',
            path_type: 'cross_center',
            strategies: ['radial_iteration', 'function_reuse'],
            difficulty: 'MEDIUM',
            teaching_goal: 'Cross through center, experience arm symmetry'
        },
        {
            name: 'full_star_hard',
            start: 'start_point',
            end: 'end_point',
            path_type: 'full_traversal',
            strategies: ['radial_iteration', 'segment_pattern_reuse'],
            difficulty: 'HARD',
            teaching_goal: 'Complete star traversal with all arms'
        }
    ];
    
    // Segment analysis
    const segmentLengths = straightSegments.map(s => s.length);
    const segment_analysis = {
        num_segments: straightSegments.length,
        lengths: segmentLengths,
        types: segmentLengths.map(() => 'star_segment'),
        min_length: segmentLengths.length > 0 ? Math.min(...segmentLengths) : 0,
        max_length: segmentLengths.length > 0 ? Math.max(...segmentLengths) : 0,
        avg_length: segmentLengths.length > 0 ? segmentLengths.reduce((a,b) => a+b, 0) / segmentLengths.length : 0,
        min_valid_range: segmentLengths.length > 0 ? Math.max(0, Math.min(...segmentLengths) - 2) : 0,
        total_valid_slots: segmentLengths.reduce((sum, l) => sum + Math.max(0, l - 2), 0)
    };
    
    const metadata = {
        topology_type: 'star_shape',
        segments: straightSegments,
        branches: branches,
        corners: corners,
        star_size: size,
        semantic_positions: semanticPositions,
        segment_analysis: segment_analysis
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
