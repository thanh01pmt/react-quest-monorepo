/**
 * S Shape Topology (PORTED FROM PYTHON)
 * Creates an S-shaped path with two turns in opposite directions
 * Ideal for alternating patterns and segment-based learning
 */

import { BaseTopology } from './BaseTopology';
import { IPathInfo, Coord } from '../types';
import { addVectors, FORWARD_X, BACKWARD_X, FORWARD_Z, BACKWARD_Z, areVectorsEqual } from '../utils/geometry';

export class SShapeTopology extends BaseTopology {
  *generatePathInfoVariants(
    gridSize: [number, number, number],
    params: Record<string, any>,
    maxVariants: number
  ): Generator<IPathInfo> {
    const baseLeg1 = params.leg1_length || 2;
    const baseLeg2 = params.leg2_length || 3;
    const baseLeg3 = params.leg3_length || 2;

    for (let i = 0; i < maxVariants; i++) {
        const variantParams = { ...params };
        variantParams.leg1_length = baseLeg1 + i;
        variantParams.leg2_length = baseLeg2 + i;
        variantParams.leg3_length = baseLeg3 + i;
        yield this.generatePathInfo(gridSize, variantParams);
    }
  }

  generatePathInfo(
    gridSize: [number, number, number],
    params: Record<string, any>
  ): IPathInfo {
    console.log("    LOG: Generating 's_shape' topology...");

    // 1. Params
    // Python code uses random choice if not provided
    let leg1Len = params.leg1_length || (Math.floor(Math.random() * 3) + 2); // 2-4
    let leg2Len = params.leg2_length || (Math.floor(Math.random() * 2) + 3); // 3-4
    let leg3Len = params.leg3_length || (Math.floor(Math.random() * 3) + 2); // 2-4

    // 2. Calculations
    // Required width/depth estimate (assuming worst case or specific orientation? Python logic assumes Z start, X turn)
    // Python: required_width = leg2_len + 1, required_depth = leg1 + leg3 + 1
    const requiredWidth = leg2Len + 1;
    const requiredDepth = leg1Len + leg3Len + 1;

    // Boundary check
    if (requiredWidth > gridSize[0] - 2 || requiredDepth > gridSize[2] - 2) {
        leg2Len = Math.min(leg2Len, gridSize[0] - 3);
        leg1Len = Math.min(leg1Len, Math.floor((gridSize[2] - 3) / 2));
        leg3Len = Math.min(leg3Len, Math.floor((gridSize[2] - 3) / 2));
    }

    // 3. Start Position
    // Python: random.randint(1, grid_size[0] - required_width - 1)
    const maxX = Math.max(1, gridSize[0] - requiredWidth - 1);
    const maxZ = Math.max(1, gridSize[2] - requiredDepth - 1);
    
    const startX = Math.floor(Math.random() * maxX) + 1;
    const startZ = Math.floor(Math.random() * maxZ) + 1;
    const y = 0;
    const startPos: Coord = [startX, y, startZ];

    // 4. Directions
    const dirs = [FORWARD_Z, BACKWARD_Z, FORWARD_X, BACKWARD_X];
    const initialDir = dirs[Math.floor(Math.random() * dirs.length)];
    const turn1Choice = Math.random() < 0.5 ? 'right' : 'left';
    
    // Turn Map Logic
    const getTurnDir = (d: Coord, turn: string): Coord => {
        if (d[0]===1) return turn === 'right' ? FORWARD_Z : BACKWARD_Z;
        if (d[0]===-1) return turn === 'right' ? BACKWARD_Z : FORWARD_Z;
        if (d[2]===1) return turn === 'right' ? BACKWARD_X : FORWARD_X;
        if (d[2]===-1) return turn === 'right' ? FORWARD_X : BACKWARD_X;
        return FORWARD_X;
    };

    const dir1 = initialDir;
    const dir2 = getTurnDir(dir1, turn1Choice);
    // turn2 is opposite of turn1 to make 'S' (Python fixed this logic)
    const turn2Choice = turn1Choice === 'right' ? 'left' : 'right';
    const dir3 = getTurnDir(dir2, turn2Choice);

    // 5. Build Path
    const pathCoords: Coord[] = [startPos];
    let currentPos: Coord = [...startPos];

    // Leg 1
    for (let i = 0; i < leg1Len; i++) {
        currentPos = addVectors(currentPos, dir1);
        pathCoords.push(currentPos);
    }
    
    // Leg 2
    for (let i = 0; i < leg2Len; i++) {
        currentPos = addVectors(currentPos, dir2);
        pathCoords.push(currentPos);
    }

    // Leg 3
    for (let i = 0; i < leg3Len; i++) {
        currentPos = addVectors(currentPos, dir3);
        pathCoords.push(currentPos);
    }

    const targetPos = pathCoords[pathCoords.length - 1];

    // 6. Metadata
    // S-shape has 3 segments, 2 corners
    const seg1End = leg1Len + 1;
    const seg2End = seg1End + leg2Len;

    const seg1 = pathCoords.slice(0, seg1End);
    const seg2 = pathCoords.slice(seg1End - 1, seg2End);
    const seg3 = pathCoords.slice(seg2End - 1);

    const corner1 = pathCoords[seg1End - 1];
    const corner2 = pathCoords[seg2End - 1];

    const segments = [seg1, seg2, seg3];
    const lengths = segments.map(s => s.length);

    const metadata = {
        topology_type: "s_shape",
        segments: segments,
        corners: [corner1, corner2],
        segment_analysis: {
            count: segments.length,
            lengths: lengths,
            min_length: Math.min(...lengths),
            max_length: Math.max(...lengths),
            min_valid_range: Math.max(0, Math.min(...lengths) - 2),
            total_valid_slots: lengths.reduce((sum, l) => sum + Math.max(0, l - 2), 0),
        },
        semantic_positions: {
            start: startPos,
            end: targetPos,
            corner1: corner1,
            corner2: corner2,
            optimal_start: 'start',
            optimal_end: 'end',
            valid_pairs: [
                {
                    name: 'full_s_easy',
                    start: 'start',
                    end: 'end',
                    path_type: 'full_traversal',
                    strategies: ['alternating_patterns', 'segment_pattern_reuse'],
                    difficulty: 'EASY',
                    teaching_goal: 'Follow S-curve with alternating items'
                },
                {
                    name: 'corner_to_corner_medium',
                    start: 'corner1',
                    end: 'corner2',
                    path_type: 'middle_segment',
                    strategies: ['alternating_patterns', 'corner_logic'],
                    difficulty: 'MEDIUM',
                    teaching_goal: 'Navigate between corners with pattern'
                },
                {
                    name: 'reversed_s_hard',
                    start: 'end',
                    end: 'start',
                    path_type: 'reversed_traversal',
                    strategies: ['alternating_patterns', 'segment_pattern_reuse'],
                    difficulty: 'HARD',
                    teaching_goal: 'Reverse S-curve with hidden pattern'
                }
            ]
        }
    };

    // placement_coords same as path_coords
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
