
import { BaseTopology } from './BaseTopology';
import { IPathInfo, Coord } from '../types';
import { FORWARD_X, BACKWARD_X, FORWARD_Z, BACKWARD_Z, addVectors, areVectorsEqual } from '../utils/geometry';

export class SpiralTopology extends BaseTopology {
  *generatePathInfoVariants(
    gridSize: [number, number, number],
    params: Record<string, any>,
    maxVariants: number
  ): Generator<IPathInfo> {
    const baseTurns = params.num_turns || 4;
    const baseStartAtCenter = params.start_at_center || false;
    const maxGridDim = Math.min(gridSize[0], gridSize[2]) - 4;

    let i = 0;
    let variantsGenerated = 0;

    while (variantsGenerated < maxVariants) {
        const currentTurns = baseTurns + Math.floor(i / 2);
        const currentStartAtCenter = (i % 2 !== 0) ? !baseStartAtCenter : baseStartAtCenter;

        const requiredDim = Math.floor(currentTurns / 2) * 2 + 3;
        
        if (requiredDim > maxGridDim) {
            console.log(`Spiral Variants: Stopped at num_turns=${currentTurns} (Size > ${maxGridDim})`);
            break;
        }

        const variantParams = { ...params };
        variantParams.num_turns = currentTurns;
        variantParams.start_at_center = currentStartAtCenter;
        
        if (variantParams.path_length) {
             variantParams.path_length = (parseInt(params.path_length) || 5) + i;
        }

        yield this.generatePathInfo(gridSize, variantParams);
        i++;
        variantsGenerated++;
    }
  }

  generatePathInfo(
    gridSize: [number, number, number],
    params: Record<string, any>
  ): IPathInfo {
    let numTurns = parseInt(params.num_turns) || 8;
    const startAtCenter = params.start_at_center || false;
    const pathMode = params.path_mode || 'full_path';

    let maxSideLen = Math.ceil(numTurns);
    if (maxSideLen * 2 > Math.min(gridSize[0], gridSize[2]) - 4) {
        numTurns = Math.min(numTurns, 6);
        maxSideLen = Math.ceil(numTurns / 2) + 1;
    }

    const centerX = Math.floor(gridSize[0] / 2);
    const centerZ = Math.floor(gridSize[2] / 2);
    const y = 0;

    const startX = centerX - Math.floor(maxSideLen / 2);
    const startZ = centerZ - Math.floor(maxSideLen / 2);

    let currentPos: Coord = [startX, y, startZ];
    const pathCoords: Coord[] = [currentPos];
    const straightSegments: Coord[][] = [];
    
    // directions: Right (+X), Down (+Z), Left (-X), Up (-Z)
    const directions = [FORWARD_X, FORWARD_Z, BACKWARD_X, BACKWARD_Z];
    let sideLength = maxSideLen;

    for (let i = 0; i < numTurns; i++) {
        const currentSegment = [currentPos];
        const moveDirection = directions[i % 4];

        if (i > 0) sideLength -= 1;

        for (let j = 0; j < sideLength; j++) {
            currentPos = addVectors(currentPos, moveDirection);
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

    let finalPath: Coord[];
    if (pathMode === 'straight_segment') {
        if (straightSegments.length > 0) {
            // Sort by length desc
            const sorted = [...straightSegments].sort((a, b) => b.length - a.length);
            // Pick rand from top 2
            const top2 = sorted.slice(0, 2);
            finalPath = top2[Math.floor(Math.random() * top2.length)];
        } else {
            finalPath = placementCoords;
        }
    } else {
        finalPath = placementCoords;
    }

    const outerPoint = placementCoords[0];
    const innerPoint = placementCoords[placementCoords.length - 1];

    // Layers logic
    const layers: Coord[][] = [];
    let currentLayer: Coord[] = [];
    for (let i = 0; i < straightSegments.length; i++) {
        const segment = straightSegments[i];
        // extend, avoiding duplicate start if continuing
        currentLayer.push(...(currentLayer.length > 0 ? segment.slice(1) : segment));
        
        if (i % 2 === 1) { // Layer complete
            layers.push(currentLayer);
            currentLayer = [];
        }
    }
    if (currentLayer.length > 0) layers.push(currentLayer);

    const validPairs = [
        {
            name: 'outer_inward_easy',
            start: 'outer_start',
            end: 'inner_end',
            path_type: 'inward_spiral',
            strategies: ['decreasing_loop', 'ring_iteration'],
            difficulty: 'EASY',
            teaching_goal: 'Spiral inward with decreasing items per ring'
        },
        {
            name: 'inner_outward_medium',
            start: 'inner_end',
            end: 'outer_start',
            path_type: 'outward_spiral',
            strategies: ['decreasing_loop', 'progressive_spacing'],
            difficulty: 'MEDIUM',
            teaching_goal: 'Spiral outward with increasing items per ring'
        },
        {
            name: 'segment_focus_hard',
            start: 'outer_start',
            end: 'inner_end',
            path_type: 'segment_aware',
            strategies: ['segment_pattern_reuse', 'decreasing_loop'],
            difficulty: 'HARD',
            teaching_goal: 'Recognize segment patterns within spiral'
        }
    ];

    const semanticPositions: Record<string, any> = {
        outer_start: outerPoint,
        inner_end: innerPoint,
        spiral_direction: 'inward',
        optimal_start: 'outer_start',
        optimal_end: 'inner_end',
        valid_pairs: validPairs
    };

    const [startPos, targetPos] = this.getStartEndPositions(
        { semantic_positions: semanticPositions },
        [outerPoint, innerPoint]
    );

    if (areVectorsEqual(startPos, innerPoint)) {
        finalPath = [...finalPath].reverse();
    } else {
        finalPath = [...finalPath];
    }

    // Metadata
    const corners: Coord[] = [];
    for (let i = 0; i < straightSegments.length - 1; i++) {
        if (straightSegments[i].length > 0) {
            corners.push(straightSegments[i][straightSegments[i].length - 1]);
        }
    }

    // Segment analysis
    const segmentLengths = straightSegments.map(s => s.length);
    const segment_analysis = {
        num_segments: straightSegments.length,
        lengths: segmentLengths,
        types: segmentLengths.map(() => 'spiral_segment'),
        min_length: segmentLengths.length > 0 ? Math.min(...segmentLengths) : 0,
        max_length: segmentLengths.length > 0 ? Math.max(...segmentLengths) : 0,
        avg_length: segmentLengths.length > 0 ? segmentLengths.reduce((a,b) => a+b, 0) / segmentLengths.length : 0
    };

    const metadata = {
        topology_type: "spiral_path",
        semantic_positions: semanticPositions,
        rings: straightSegments,
        layers: layers,
        num_turns: numTurns,
        start_at_center: areVectorsEqual(startPos, innerPoint),
        segments: straightSegments,
        corners: corners,
        segment_analysis: segment_analysis
    };

    return {
        start_pos: startPos,
        target_pos: targetPos,
        path_coords: finalPath,
        placement_coords: placementCoords,
        obstacles: [],
        metadata: metadata
    };
  }
}
