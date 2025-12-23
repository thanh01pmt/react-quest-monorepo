/**
 * StraightLine Topology
 * Creates a simple straight path - ideal for basic loop/variable lessons
 */

import { BaseTopology } from './BaseTopology';
import { IPathInfo, Coord } from '../types';

export class StraightLineTopology extends BaseTopology {
    *generatePathInfoVariants(
        gridSize: [number, number, number],
        params: Record<string, any>,
        maxVariants: number
    ): Generator<IPathInfo> {
        const baseLength = params.path_length || 5;
        
        // First variant with original params
        yield this.generatePathInfo(gridSize, params);
        
        // Generate variants with different lengths
        for (let i = 1; i < maxVariants; i++) {
            const newLength = baseLength + i * 2;
            if (newLength >= gridSize[0] - 4) break;
            
            yield this.generatePathInfo(gridSize, { ...params, path_length: newLength });
        }
    }

    generatePathInfo(gridSize: [number, number, number], params: Record<string, any>): IPathInfo {
        const pathLength = params.path_length || 5;
        const axis: 'x' | 'z' = params.axis || (Math.random() > 0.5 ? 'x' : 'z');
        const direction = params.direction || (Math.random() > 0.5 ? 1 : -1);
        
        // Calculate safe starting position
        const y = 0;
        let startX = 1;
        let startZ = 1;
        
        if (axis === 'x') {
            startX = direction === 1 ? 1 : Math.min(gridSize[0] - 2, pathLength + 1);
            startZ = Math.floor(gridSize[2] / 2);
        } else {
            startZ = direction === 1 ? 1 : Math.min(gridSize[2] - 2, pathLength + 1);
            startX = Math.floor(gridSize[0] / 2);
        }
        
        const startPos: Coord = [startX, y, startZ];
        const pathCoords: Coord[] = [startPos];
        
        let currentPos: Coord = [...startPos];
        
        for (let i = 0; i < pathLength; i++) {
            if (axis === 'x') {
                currentPos = [currentPos[0] + direction, currentPos[1], currentPos[2]];
            } else {
                currentPos = [currentPos[0], currentPos[1], currentPos[2] + direction];
            }
            pathCoords.push(currentPos);
        }
        
        const targetPos = pathCoords[pathCoords.length - 1];
        
        // Semantic positions for linear_repeat strategy
        const semantic_positions = {
            start: startPos,
            end: targetPos,
            mid_point: pathCoords[Math.floor(pathCoords.length / 2)],
            optimal_start: 'start',
            optimal_end: 'end',
            valid_pairs: [
                {
                    name: 'full_line_easy',
                    start: 'start',
                    end: 'end',
                    path_type: 'full_traversal',
                    strategies: ['linear_repeat', 'segment_based'],
                    difficulty: 'EASY',
                    teaching_goal: 'Simple straight line with repeat pattern'
                },
                {
                    name: 'mid_to_end_medium',
                    start: 'mid_point',
                    end: 'end',
                    path_type: 'half_segment',
                    strategies: ['segment_based'],
                    difficulty: 'MEDIUM',
                    teaching_goal: 'Half traversal with counting'
                },
                {
                    name: 'reversed_hard',
                    start: 'end',
                    end: 'start',
                    path_type: 'reversed_traversal',
                    strategies: ['linear_repeat'],
                    difficulty: 'HARD',
                    teaching_goal: 'Reverse direction with pattern discovery'
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
                topology_type: 'straight_line',
                path_length: pathLength,
                axis,
                direction,
                segments: [pathCoords],
                segment_analysis: {
                    count: 1,
                    lengths: [pathCoords.length],
                    min_length: pathCoords.length,
                    max_length: pathCoords.length,
                    avg_length: pathCoords.length,
                    types: ['linear']
                },
                semantic_positions
            }
        };
    }
}
