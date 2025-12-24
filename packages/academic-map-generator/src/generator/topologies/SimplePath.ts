/**
 * Simple Path Topology (PORTED FROM PYTHON)
 * Creates a simple path (straight or corner) for introductory lessons.
 */

import { BaseTopology } from './BaseTopology';
import { IPathInfo, Coord } from '../types';

export class SimplePathTopology extends BaseTopology {
  *generatePathInfoVariants(
    gridSize: [number, number, number],
    params: Record<string, any>,
    maxVariants: number
  ): Generator<IPathInfo> {
    let count = 0;
    for (let length = 2; length < 10; length++) {
        if (count >= maxVariants) break;
        
        const variantParams = { ...params };
        variantParams.path_length = length;
        yield this.generatePathInfo(gridSize, variantParams);
        count++;
    }
  }

  generatePathInfo(
    gridSize: [number, number, number],
    params: Record<string, any>
  ): IPathInfo {
    console.log("    LOG: Generating 'simple_path' topology...");

    // Path Length
    let pathLength = 3;
    const lenParam = params.path_length || [3, 5];
    if (Array.isArray(lenParam)) {
        pathLength = Math.floor(Math.random() * (lenParam[1] - lenParam[0] + 1)) + lenParam[0];
    } else {
        pathLength = Number(lenParam);
    }

    // Pattern
    const numTurns = params.turns || 0;
    const pattern = numTurns > 0 ? 'corner' : 'straight';

    // Min/Max Checks
    const maxDim = Math.min(gridSize[0], gridSize[2]);
    if (pathLength >= maxDim - 3) pathLength = maxDim - 4;
    pathLength = Math.max(1, pathLength);

    // Start Pos
    const requiredSpace = numTurns > 0 ? Math.ceil(pathLength / 2) : pathLength;
    const startX = Math.floor(Math.random() * (gridSize[0] - requiredSpace - 2)) + 1;
    const startZ = Math.floor(Math.random() * (gridSize[2] - requiredSpace - 2)) + 1;
    
    // Fix Python: start_pos = (start_x, 0, start_z)
    // Python code logic ensures start position is valid.
    
    const startPos: Coord = [startX, 0, startZ];
    const pathCoords: Coord[] = [];
    let currentPos: Coord = [...startPos];
    let targetPos: Coord = [...startPos]; // placeholder

    if (pattern === 'straight') {
        for (let i = 0; i < pathLength; i++) {
            currentPos[0] += 1; // X+
            pathCoords.push([...currentPos]);
        }
        targetPos = [currentPos[0] + 1, currentPos[1], currentPos[2]];
    } else {
        // Corner
        let halfLen = 0;
        let remainingLen = 0;
        if (pathLength < 2) {
            halfLen = pathLength;
            remainingLen = 0;
        } else {
            halfLen = Math.floor(pathLength / 2);
            remainingLen = pathLength - halfLen;
        }

        for (let i = 0; i < halfLen; i++) {
            currentPos[0] += 1;
            pathCoords.push([...currentPos]);
        }

        for (let i = 0; i < remainingLen; i++) {
            currentPos[2] += 1;
            pathCoords.push([...currentPos]);
        }
        targetPos = [currentPos[0], currentPos[1], currentPos[2] + 1];
    }
    
    // Metadata
    const midpoint = pathCoords.length > 0 
        ? pathCoords[Math.floor(pathCoords.length / 2)] 
        : startPos;

    const metadata = {
        topology_type: "simple_path",
        segment: pathCoords, // Python uses 'segment'
        pattern: pattern,
        path_length: pathLength,
        semantic_positions: {
            start: startPos,
            end: targetPos,
            midpoint: midpoint,
            optimal_start: 'start',
            optimal_end: 'end',
            valid_pairs: [
                {
                    name: 'basic_traversal_easy',
                    start: 'start',
                    end: 'end',
                    path_type: 'full_path',
                    strategies: ['simple_progression', 'alternating_patterns'],
                    difficulty: 'EASY',
                    teaching_goal: 'Basic item collection'
                },
                {
                    name: 'halfway_challenge_medium',
                    start: 'start',
                    end: 'midpoint',
                    path_type: 'partial_path',
                    strategies: ['simple_progression'],
                    difficulty: 'MEDIUM',
                    teaching_goal: 'Partial navigation'
                },
                {
                    name: 'reverse_path_hard',
                    start: 'end',
                    end: 'start',
                    path_type: 'reversed',
                    strategies: ['simple_progression', 'corner_logic'],
                    difficulty: 'HARD',
                    teaching_goal: 'Reverse navigation'
                }
            ]
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
