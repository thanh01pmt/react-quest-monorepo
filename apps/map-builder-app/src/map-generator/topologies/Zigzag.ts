/**
 * Zigzag Topology
 * Creates a zigzag pattern - ideal for loops with alternating directions
 */

import { BaseTopology } from './BaseTopology';
import { IPathInfo, Coord } from '../types';

export class ZigzagTopology extends BaseTopology {
    *generatePathInfoVariants(
        gridSize: [number, number, number],
        params: Record<string, any>,
        maxVariants: number
    ): Generator<IPathInfo> {
        let count = 0;
        
        for (let numSegments = 3; numSegments <= 7 && count < maxVariants; numSegments++) {
            for (let segmentLength = 2; segmentLength <= 4 && count < maxVariants; segmentLength++) {
                yield this.generatePathInfo(gridSize, {
                    ...params,
                    num_segments: numSegments,
                    segment_length: segmentLength
                });
                count++;
            }
        }
    }

    generatePathInfo(gridSize: [number, number, number], params: Record<string, any>): IPathInfo {
        const numSegments = params.num_segments || 4;
        const segmentLength = params.segment_length || 3;
        
        const y = 0;
        const startX = 2;
        const startZ = 2;
        
        const startPos: Coord = [startX, y, startZ];
        const pathCoords: Coord[] = [startPos];
        const segments: Coord[][] = [];
        const corners: Coord[] = [];
        
        let currentPos: Coord = [...startPos];
        
        // Alternate between Z and X directions
        const directions: Array<[number, number, number]> = [
            [0, 0, 1],  // Forward Z
            [1, 0, 0]   // Forward X
        ];
        
        for (let i = 0; i < numSegments; i++) {
            const dir = directions[i % 2];
            const segmentCoords: Coord[] = [currentPos];
            
            for (let j = 0; j < segmentLength; j++) {
                currentPos = [
                    currentPos[0] + dir[0],
                    currentPos[1] + dir[1],
                    currentPos[2] + dir[2]
                ];
                pathCoords.push(currentPos);
                segmentCoords.push(currentPos);
            }
            
            segments.push(segmentCoords);
            
            // Mark corner (except for last segment)
            if (i < numSegments - 1) {
                corners.push(currentPos);
            }
        }
        
        const targetPos = pathCoords[pathCoords.length - 1];
        
        const lengths = segments.map(s => s.length);
        
        // Semantic positions for segment_pattern_reuse strategy
        const semantic_positions = {
            start: startPos,
            end: targetPos,
            first_corner: corners.length > 0 ? corners[0] : startPos,
            last_corner: corners.length > 0 ? corners[corners.length - 1] : targetPos,
            optimal_start: 'start',
            optimal_end: 'end',
            valid_pairs: [
                {
                    name: 'full_zigzag_easy',
                    start: 'start',
                    end: 'end',
                    path_type: 'full_traversal',
                    strategies: ['segment_pattern_reuse', 'alternating_patterns'],
                    difficulty: 'EASY',
                    teaching_goal: 'Follow zigzag with repeated segment pattern'
                },
                {
                    name: 'corner_sequence_medium',
                    start: 'first_corner',
                    end: 'last_corner',
                    path_type: 'inner_segments',
                    strategies: ['segment_pattern_reuse'],
                    difficulty: 'MEDIUM',
                    teaching_goal: 'Navigate between corners with pattern recognition'
                },
                {
                    name: 'reversed_hard',
                    start: 'end',
                    end: 'start',
                    path_type: 'reversed_traversal',
                    strategies: ['segment_pattern_reuse'],
                    difficulty: 'HARD',
                    teaching_goal: 'Reverse zigzag with hidden regularity'
                }
            ]
        };
        
        return {
            start_pos: startPos,
            target_pos: targetPos,
            path_coords: pathCoords,
            placement_coords: [...pathCoords],
            obstacles: [],
            metadata: {
                topology_type: 'zigzag',
                num_segments: numSegments,
                segment_length: segmentLength,
                segments,
                corners,
                segment_analysis: {
                    count: segments.length,
                    lengths,
                    min_length: Math.min(...lengths),
                    max_length: Math.max(...lengths),
                    avg_length: lengths.reduce((a,b) => a+b, 0) / lengths.length,
                    types: lengths.map((_, i) => i % 2 === 0 ? 'forward_z' : 'forward_x')
                },
                semantic_positions
            }
        };
    }
}
