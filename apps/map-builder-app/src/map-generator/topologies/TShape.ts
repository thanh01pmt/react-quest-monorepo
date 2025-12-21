/**
 * TShape Topology (FIXED)
 * Creates a T-shaped path with branching options
 * Ideal for conditional branching and function lessons
 * Ported from Python: t_shape.py
 */

import { BaseTopology } from './BaseTopology';
import { IPathInfo, Coord } from '../types';

export class TShapeTopology extends BaseTopology {
    *generatePathInfoVariants(
        gridSize: [number, number, number],
        params: Record<string, any>,
        maxVariants: number
    ): Generator<IPathInfo> {
        let count = 0;
        
        for (let stem = 2; stem <= 6 && count < maxVariants; stem++) {
            for (let bar = 3; bar <= 7 && count < maxVariants; bar += 2) {
                yield this.generatePathInfo(gridSize, {
                    ...params,
                    stem_length: stem,
                    bar_length: bar
                });
                count++;
            }
        }
    }

    generatePathInfo(gridSize: [number, number, number], params: Record<string, any>): IPathInfo {
        const stemLength = params.stem_length || 4;
        let barLength = params.bar_length || 5;
        if (barLength % 2 === 0) barLength++; // Ensure odd for center
        
        const barSideLength = Math.floor(barLength / 2);
        const y = 0;
        
        // Position T safely in grid
        const startX = Math.max(barSideLength + 1, Math.min(
            gridSize[0] - barSideLength - 2,
            Math.floor(gridSize[0] / 2)
        ));
        const startZ = Math.max(2, Math.floor((gridSize[2] - stemLength) / 2));
        
        const startPos: Coord = [startX, y, startZ];
        const placementCoords: Set<string> = new Set();
        placementCoords.add(startPos.join(','));
        
        // Build stem (going Z+)
        const stemCoords: Coord[] = [startPos];
        let currentPos: Coord = [...startPos];
        
        for (let i = 0; i < stemLength; i++) {
            currentPos = [currentPos[0], currentPos[1], currentPos[2] + 1];
            stemCoords.push(currentPos);
            placementCoords.add(currentPos.join(','));
        }
        
        const junction: Coord = [...currentPos];
        const center = junction;
        const bottomEnd = startPos;
        
        // Build right branch
        const rightBranch: Coord[] = [junction];
        currentPos = [...junction];
        for (let i = 0; i < barSideLength; i++) {
            currentPos = [currentPos[0] + 1, currentPos[1], currentPos[2]];
            rightBranch.push(currentPos);
            placementCoords.add(currentPos.join(','));
        }
        const rightEnd: Coord = [...currentPos];
        
        // Build left branch
        const leftBranch: Coord[] = [junction];
        currentPos = [...junction];
        for (let i = 0; i < barSideLength; i++) {
            currentPos = [currentPos[0] - 1, currentPos[1], currentPos[2]];
            leftBranch.push(currentPos);
            placementCoords.add(currentPos.join(','));
        }
        const leftEnd: Coord = [...currentPos];
        
        const targetPos = rightEnd; // Default target
        
        // Build main path (stem + right branch)
        const pathCoords: Coord[] = [...stemCoords];
        rightBranch.slice(1).forEach(c => pathCoords.push(c));
        
        // Segments
        const segments = [stemCoords, rightBranch, leftBranch];
        const segmentLengths = segments.map(s => s.length);
        
        return {
            start_pos: startPos,
            target_pos: targetPos,
            path_coords: pathCoords,
            placement_coords: [...placementCoords].map(s => s.split(',').map(Number) as Coord),
            obstacles: [],
            metadata: {
                topology_type: 't_shape',
                stem_length: stemLength,
                bar_length: barLength,
                junction,
                stem: stemCoords,
                left_branch: leftBranch,
                right_branch: rightBranch,
                segments: segments,
                corners: [junction],
                branches: [
                    { name: 'stem', coords: stemCoords, endpoint: bottomEnd },
                    { name: 'left', coords: leftBranch, endpoint: leftEnd },
                    { name: 'right', coords: rightBranch, endpoint: rightEnd }
                ],
                semantic_positions: {
                    bottom_end: bottomEnd,
                    center: center,
                    left_end: leftEnd,
                    right_end: rightEnd,
                    optimal_start: 'bottom_end',
                    optimal_end: 'right_end',
                    valid_pairs: [
                        {
                            name: 'stem_to_right_easy',
                            start: 'bottom_end',
                            end: 'right_end',
                            path_type: 'single_decision',
                            difficulty: 'EASY',
                            teaching_goal: 'Simple path with one direction choice'
                        },
                        {
                            name: 'stem_to_left_medium',
                            start: 'bottom_end',
                            end: 'left_end',
                            path_type: 'alternate_decision',
                            difficulty: 'MEDIUM',
                            teaching_goal: 'Alternate path with decoy on wrong branch'
                        },
                        {
                            name: 'left_to_right_hard',
                            start: 'left_end',
                            end: 'right_end',
                            path_type: 'cross_junction',
                            difficulty: 'HARD',
                            teaching_goal: 'Cross through center with items on both branches'
                        }
                    ]
                },
                segment_analysis: {
                    num_segments: 3,
                    count: 3,
                    lengths: segmentLengths,
                    types: ['stem', 'branch_right', 'branch_left'],
                    min_length: Math.min(...segmentLengths),
                    max_length: Math.max(...segmentLengths),
                    avg_length: segmentLengths.reduce((a, b) => a + b, 0) / segmentLengths.length
                }
            }
        };
    }
}
