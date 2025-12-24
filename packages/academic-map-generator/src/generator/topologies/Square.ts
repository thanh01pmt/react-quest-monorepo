/**
 * Square Topology (PORTED FROM PYTHON)
 * Creates a square path using 'Open Loop' logic.
 * Path Start/End are outside the square loop.
 */

import { BaseTopology } from './BaseTopology';
import { IPathInfo, Coord } from '../types';
import { addVectors, FORWARD_X, FORWARD_Z, BACKWARD_X } from '../utils/geometry';

export class SquareTopology extends BaseTopology {
  *generatePathInfoVariants(
    gridSize: [number, number, number],
    params: Record<string, any>,
    maxVariants: number
  ): Generator<IPathInfo> {
    let count = 0;
    for (let side = 3; side < 9; side++) {
        if (count >= maxVariants) return;
        const variantParams = { ...params };
        variantParams.side_length = side;
        yield this.generatePathInfo(gridSize, variantParams);
        count++;
    }
  }

  generatePathInfo(
    gridSize: [number, number, number],
    params: Record<string, any>
  ): IPathInfo {
    console.log("    LOG: Generating 'square_shape' topology...");

    let sideLength = 4; // Default
    const sideParam = params.side_length || [4, 6];
    if (Array.isArray(sideParam)) {
        sideLength = Math.floor(Math.random() * (sideParam[1] - sideParam[0] + 1)) + sideParam[0];
    } else {
        sideLength = Number(sideParam);
    }

    const maxSize = Math.min(gridSize[0], gridSize[2]) - 2;
    if (sideLength > maxSize) sideLength = maxSize;
    if (sideLength < 2) sideLength = 2;

    const startX = Math.floor(Math.random() * (gridSize[0] - sideLength - 2)) + 1;
    const startZ = Math.floor(Math.random() * (gridSize[2] - sideLength - 2)) + 1;
    const y = 0;

    // Open Loop Logic
    // Start is outside (left of C1)
    // C1 is (startX, y, startZ)
    const startPos: Coord = [startX - 1, y, startZ];
    const targetPos: Coord = [startX - 1, y, startZ + sideLength];

    const pathCoords: Coord[] = [];
    
    // 1. Start Point
    pathCoords.push(startPos);

    // 2. Square Loop 4 Sides (Partial)
    let currentPos: Coord = [startX, y, startZ];
    pathCoords.push([...currentPos]); // C1
    const c1 = [...currentPos];

    // Side 1 (X+)
    for (let i = 0; i < sideLength; i++) {
        currentPos = addVectors(currentPos, FORWARD_X);
        pathCoords.push(currentPos);
    }
    const c2 = [...currentPos];

    // Side 2 (Z+)
    for (let i = 0; i < sideLength; i++) {
        currentPos = addVectors(currentPos, FORWARD_Z);
        pathCoords.push(currentPos);
    }
    const c3 = [...currentPos];

    // Side 3 (X-)
    for (let i = 0; i < sideLength; i++) {
        currentPos = addVectors(currentPos, BACKWARD_X);
        pathCoords.push(currentPos);
    }
    const c4 = [...currentPos];

    // Side 4 (Z-) - Not fully traversed in Python!
    // Python Square code: Segments 1, 2, 3... and seg 4.
    // Wait, Python code has:
    // for _ in range(side_length): FORWARD_X
    // for _ in range(side_length): FORWARD_Z
    // for _ in range(side_length): BACKWARD_X
    // Then append target_pos.
    // It DOES NOT do the 4th side (Z-)!
    // It creates a U-shape square (3 sides) and then jumps to target?
    // Target pos: (start_x - 1, y, start_z + side_length) -> This is near C4?
    // C4 is (startX, y, startZ + side.length).
    // Target is (startX - 1, --). So it's just to the left of C4.
    // So distinct segments are 3 sides.
    
    pathCoords.push(targetPos);

    // Python Metadata includes seg4 (c4->c1) as optional closed square
    // seg4 = [(c4[0], y, c4[2] - i) ...]
    // But path_coords doesn't include it. 
    // Wait, Python code Line 114: `seg4` is created in metadata list but NOT in `path_coords` loop.
    
    // Placement Coords: Python uses `list(dict.fromkeys(path_coords))`
    // So placement is just the path (U shape).

    // --- RECONSTRUCT METADATA ---
    const corners = [c1, c2, c3, c4];
    
    // Segments for metadata (Python constructs them mathematically in metadata block)
    const segments: Coord[][] = [];
    
    // Seg 1: C1 -> C2
    const seg1: Coord[] = [];
    for(let i=0; i<=sideLength; i++) seg1.push([c1[0]+i, y, c1[2]]);
    segments.push(seg1);

    // Seg 2: C2 -> C3
    const seg2: Coord[] = [];
    for(let i=0; i<=sideLength; i++) seg2.push([c2[0], y, c2[2]+i]);
    segments.push(seg2);

    // Seg 3: C3 -> C4
    const seg3: Coord[] = [];
    for(let i=0; i<=sideLength; i++) seg3.push([c3[0]-i, y, c3[2]]);
    segments.push(seg3);

    // Seg 4: C4 -> C1 (Ghost segment for metadata)
    const seg4: Coord[] = [];
    for(let i=0; i<=sideLength; i++) seg4.push([c4[0], y, c4[2]-i]);
    segments.push(seg4);

    const lengths = segments.map(s => s.length);

    const metadata = {
        topology_type: "square_shape", // Python says 'square_shape'
        segments: segments,
        corners: corners,
        side_length: sideLength,
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
            c1: c1,
            c2: c2,
            c3: c3,
            c4: c4,
            optimal_start: 'start',
            optimal_end: 'end',
            valid_pairs: [
                {
                    name: 'full_square_easy',
                    start: 'start',
                    end: 'end',
                    path_type: 'full_traversal',
                    strategies: ['segment_pattern_reuse', 'corner_based'],
                    difficulty: 'EASY',
                    teaching_goal: 'Identical items per side'
                },
                {
                    name: 'corner_emphasis_medium',
                    start: 'c1',
                    end: 'c3',
                    path_type: 'diagonal_corners',
                    strategies: ['segment_pattern_reuse', 'corner_logic'],
                    difficulty: 'MEDIUM',
                    teaching_goal: 'Special corner items'
                },
                {
                    name: 'progressive_sides_hard',
                    start: 'start',
                    end: 'end',
                    path_type: 'progressive_sides',
                    strategies: ['segment_pattern_reuse', 'side_identical'],
                    difficulty: 'HARD',
                    teaching_goal: 'Progressive pattern per side'
                }
            ]
        }
    };

    return {
        start_pos: startPos,
        target_pos: targetPos,
        path_coords: Array.from(new Set(pathCoords.map(c => c.join(',')))).map(s => s.split(',').map(Number) as Coord),
        placement_coords: Array.from(new Set(pathCoords.map(c => c.join(',')))).map(s => s.split(',').map(Number) as Coord),
        obstacles: [],
        metadata: metadata
    };
  }
}


