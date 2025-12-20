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
                    max_length: Math.max(...lengths)
                }
            }
        };
    }
}
