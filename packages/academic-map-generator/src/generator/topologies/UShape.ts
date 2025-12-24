/**
 * UShape Topology (PORTED FROM PYTHON)
 * Creates a U-shaped path - ideal for sequential or simple function lessons
 */

import { BaseTopology } from './BaseTopology';
import { IPathInfo, Coord } from '../types';
import { addVectors, FORWARD_X, FORWARD_Z, BACKWARD_X, BACKWARD_Z } from '../utils/geometry';

export class UShapeTopology extends BaseTopology {
  *generatePathInfoVariants(
    gridSize: [number, number, number],
    params: Record<string, any>,
    maxVariants: number
  ): Generator<IPathInfo> {
    const baseSideLen = params.side_legs_length || 3;
    const baseBaseLen = params.base_leg_length || 3;

    for (let i = 0; i < maxVariants; i++) {
        const variantParams = { ...params };
        // Increase side length every 2 steps
        variantParams.side_legs_length = baseSideLen + Math.floor(i / 2);
        // Increase base length every 2 steps, offset by 1
        variantParams.base_leg_length = baseBaseLen + Math.floor((i + 1) / 2);
        
        yield this.generatePathInfo(gridSize, variantParams);
    }
  }

  generatePathInfo(
    gridSize: [number, number, number],
    params: Record<string, any>
  ): IPathInfo {
    console.log("    LOG: Generating 'u_shape' topology...");

    // FIX: Accept both UI params (arm_length, base_length) and legacy params
    let sideLegsLen = params.arm_length || params.side_legs_length || (Math.floor(Math.random() * 2) + 3); // 3-4
    let baseLegLen = params.base_length || params.base_leg_length || (Math.floor(Math.random() * 2) + 3); // 3-4

    // Params for orientation check (assuming Z start, X turn)
    const requiredDepth = sideLegsLen + 1;
    const requiredWidth = baseLegLen + 1;

    // Constraints
    if (requiredWidth > gridSize[0] - 2 || requiredDepth > gridSize[2] - 2) {
        baseLegLen = Math.min(baseLegLen, gridSize[0] - 3);
        sideLegsLen = Math.min(sideLegsLen, gridSize[2] - 3);
    }

    // FIX: Use deterministic centered positioning instead of random
    // This ensures the shape stays within visible bounds and is predictable
    const centerX = Math.floor((gridSize[0] - requiredWidth) / 2);
    const centerZ = Math.floor((gridSize[2] - requiredDepth) / 2);
    const startX = params.start_x || Math.max(1, Math.min(gridSize[0] - requiredWidth - 1, centerX));
    const startZ = params.start_z || Math.max(1, Math.min(gridSize[2] - requiredDepth - 1, centerZ));
    const y = 0;
    const startPos: Coord = [startX, y, startZ];

    // Directions
    const dirs = [FORWARD_Z, BACKWARD_Z, FORWARD_X, BACKWARD_X];
    const initialDir = dirs[Math.floor(Math.random() * dirs.length)];
    const turnDirChoice = Math.random() < 0.5 ? 'right' : 'left';

    const getTurnDir = (d: Coord, turn: string): Coord => {
        if (d[0]===1) return turn === 'right' ? FORWARD_Z : BACKWARD_Z;
        if (d[0]===-1) return turn === 'right' ? BACKWARD_Z : FORWARD_Z;
        if (d[2]===1) return turn === 'right' ? BACKWARD_X : FORWARD_X;
        if (d[2]===-1) return turn === 'right' ? FORWARD_X : BACKWARD_X;
        return FORWARD_X;
    };

    const dir1 = initialDir;
    const dir2 = getTurnDir(dir1, turnDirChoice);
    // U Shape: third direction is reverse of first
    // Python: dir3 = (dir1[0] * -1, dir1[1], dir1[2] * -1)
    const dir3: Coord = [dir1[0] * -1, dir1[1], dir1[2] * -1];

    // Build Path
    const pathCoords: Coord[] = [startPos];
    let currentPos: Coord = [...startPos];

    // Leg 1
    for (let i = 0; i < sideLegsLen; i++) {
        currentPos = addVectors(currentPos, dir1);
        pathCoords.push(currentPos);
    }

    // Base Leg
    for (let i = 0; i < baseLegLen; i++) {
        currentPos = addVectors(currentPos, dir2);
        pathCoords.push(currentPos);
    }

    // Leg 2
    for (let i = 0; i < sideLegsLen; i++) {
        currentPos = addVectors(currentPos, dir3);
        pathCoords.push(currentPos);
    }

    const targetPos = pathCoords[pathCoords.length - 1];

    // Metadata
    const leg1End = sideLegsLen + 1;
    const baseEnd = leg1End + baseLegLen;

    const leftLeg = pathCoords.slice(0, leg1End);
    const bottomBase = pathCoords.slice(leg1End - 1, baseEnd);
    const rightLeg = pathCoords.slice(baseEnd - 1);

    const segments = [leftLeg, bottomBase, rightLeg];
    
    const corner1 = pathCoords[leg1End - 1];
    const corner2 = pathCoords[baseEnd - 1];

    const lengths = segments.map(s => s.length);

    const semanticPositions = {
        left_arm_start: startPos,
        left_corner: corner1,
        right_corner: corner2,
        right_arm_end: targetPos,
        bottom_center: bottomBase[Math.floor(bottomBase.length / 2)] || corner1,
        optimal_start: 'left_arm_start',
        optimal_end: 'right_arm_end',
        valid_pairs: [
            {
                name: 'full_u_easy',
                start: 'left_arm_start',
                end: 'right_arm_end',
                path_type: 'full_traversal',
                strategies: ['segment_pattern_reuse', 'symmetric_traversal'],
                difficulty: 'EASY',
                teaching_goal: 'Full U traversal with symmetric arm patterns'
            },
            {
                name: 'bottom_focus_medium',
                start: 'left_corner',
                end: 'right_corner',
                path_type: 'bottom_only',
                strategies: ['segment_pattern_reuse', 'function_reuse'],
                difficulty: 'MEDIUM',
                teaching_goal: 'Focus on bottom segment with corner handling'
            },
            {
                name: 'arm_hidden_symmetry_hard',
                start: 'left_arm_start',
                end: 'right_arm_end',
                path_type: 'hidden_symmetry',
                strategies: ['segment_pattern_reuse', 'function_reuse'],
                difficulty: 'HARD',
                teaching_goal: 'Discover symmetric arm patterns'
            }
        ]
    };

    const metadata = {
        topology_type: "u_shape",
        segments: segments,
        corners: [corner1, corner2],
        branches: [leftLeg, bottomBase, rightLeg],
        semantic_positions: semanticPositions,
        segment_analysis: {
            count: segments.length,
            lengths: lengths,
            min_length: Math.min(...lengths),
            max_length: Math.max(...lengths),
            min_valid_range: Math.max(0, Math.min(...lengths) - 2),
            total_valid_slots: lengths.reduce((sum, l) => sum + Math.max(0, l - 2), 0)
        }
    };

    // Deduplicate placement coords (all walkable tiles)
    const dedupedPlacement = this._deduplicateCoords(pathCoords);
    
    // Compute path_coords using BFS pathfinding
    const computedPath = this.computePathCoords(startPos, targetPos, dedupedPlacement);

    return {
        start_pos: startPos,
        target_pos: targetPos,
        path_coords: computedPath,          // DYNAMIC: shortest path
        placement_coords: dedupedPlacement, // STATIC: all walkable tiles
        obstacles: [],
        metadata: metadata
    };
  }
}
