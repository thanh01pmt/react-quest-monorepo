/**
 * Triangle Topology (PORTED FROM PYTHON)
 * Creates a filled right-angled triangle area with a path along 2 legs.
 * Ideal for nested loops or coordinate lessons.
 */

import { BaseTopology } from './BaseTopology';
import { IPathInfo, Coord } from '../types';
import { addVectors, FORWARD_X, FORWARD_Z, BACKWARD_X } from '../utils/geometry';

export class TriangleTopology extends BaseTopology {
  *generatePathInfoVariants(
    gridSize: [number, number, number],
    params: Record<string, any>,
    maxVariants: number
  ): Generator<IPathInfo> {
    let count = 0;
    // Loop sizes 4..9
    for (let size = 4; size < 10; size++) {
        if (count >= maxVariants) return;
        
        const variantParams = { ...params };
        variantParams.leg_a_length = size;
        variantParams.leg_b_length = size;
        yield this.generatePathInfo(gridSize, variantParams);
        count++;
    }
  }

  generatePathInfo(
    gridSize: [number, number, number],
    params: Record<string, any>
  ): IPathInfo {
    console.log("    LOG: Generating 'triangle' topology...");

    let width = params.leg_a_length || (Math.floor(Math.random() * 3) + 5); // 5-7
    let depth = params.leg_b_length || (Math.floor(Math.random() * 3) + 5); // 5-7

    // Min safety
    width = Math.max(2, width);
    depth = Math.max(2, depth);

    // Centered position (instead of random)
    const baseX = params.start_x || Math.max(1, Math.floor((gridSize[0] - width) / 2));
    const baseZ = params.start_z || Math.max(1, Math.floor((gridSize[2] - depth) / 2));
    const y = 0;

    // --- PART 1: PLACEMENT (Filled Triangle) ---
    const placementCoords = new Set<string>();
    for (let zOffset = 0; zOffset <= depth; zOffset++) {
        const rowWidth = Math.floor(width * (1 - zOffset / depth));
        for (let xOffset = 0; xOffset <= rowWidth; xOffset++) {
            const coord: Coord = [baseX + xOffset, y, baseZ + zOffset];
            placementCoords.add(`${coord[0]},${coord[1]},${coord[2]}`);
        }
    }

    // --- PART 2: PATH (Border 2 Legs) ---
    // C(Right) -> A(Corner) -> B(Top)
    // A = (baseX, baseZ)
    // B = (baseX, baseZ + depth)
    // C = (baseX + width, baseZ)

    const startPos: Coord = [baseX + width, y, baseZ]; // Corner C
    const pathCoords: Coord[] = [startPos];
    let currentPos: Coord = [...startPos];

    // 1. Horizontal Leg (C -> A) (BACKWARD_X)
    for (let i = 0; i < width; i++) {
        currentPos = addVectors(currentPos, BACKWARD_X);
        pathCoords.push(currentPos);
    }
    const cornerA: Coord = [...currentPos]; // Should be (baseX, y, baseZ)

    // 2. Vertical Leg (A -> B) (FORWARD_Z)
    for (let i = 0; i < depth; i++) {
        currentPos = addVectors(currentPos, FORWARD_Z);
        pathCoords.push(currentPos);
    }
    
    const targetPos = currentPos; // Corner B

    // Metadata
    const cornerB = targetPos;
    const cornerC = startPos;
    const corners = [cornerA, cornerB, cornerC];

    // Segments
    // Horizontal: C->A
    const segHorizontal = pathCoords.slice(0, width + 1);
    // Vertical: A->B
    const segVertical = pathCoords.slice(width);

    const segments = [segHorizontal, segVertical];
    const lengths = segments.map(s => s.length);

    const placementList: Coord[] = [];
    placementCoords.forEach(str => {
        placementList.push(str.split(',').map(Number) as Coord);
    });

    const metadata = {
        topology_type: "triangle",
        segments: segments,
        corners: corners,
        width: width,
        depth: depth,
        segment_analysis: {
            count: len(segments),
            lengths: lengths,
            min_length: Math.min(...lengths),
            max_length: Math.max(...lengths),
            min_valid_range: Math.max(0, Math.min(...lengths) - 2),
            total_valid_slots: lengths.reduce((sum, l) => sum + Math.max(0, l - 2), 0),
        },
        semantic_positions: {
            start: startPos,
            end: targetPos,
            corner_a: cornerA,
            corner_b: cornerB,
            corner_c: cornerC,
            optimal_start: 'start',
            optimal_end: 'end',
            valid_pairs: [
                {
                    name: 'side_based_easy',
                    start: 'corner_c',
                    end: 'corner_b',
                    path_type: 'two_sides',
                    strategies: ['segment_based', 'layer_based'],
                    difficulty: 'EASY',
                    teaching_goal: 'Items along two sides'
                },
                {
                    name: 'corner_emphasis_medium',
                    start: 'corner_c',
                    end: 'corner_a',
                    path_type: 'one_side',
                    strategies: ['segment_based', 'corner_logic'],
                    difficulty: 'MEDIUM',
                    teaching_goal: 'Items with corner special'
                },
                {
                    name: 'height_progression_hard',
                    start: 'start',
                    end: 'end',
                    path_type: 'progressive_height',
                    strategies: ['segment_based', 'layer_based'],
                    difficulty: 'HARD',
                    teaching_goal: 'Progressive pattern per level'
                }
            ]
        }
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
}

// Helper for len
function len(arr: any[]) { return arr.length; }
