/**
 * TShape Topology
 * Creates a T-shaped path with branching options
 * Ideal for conditional branching and function lessons
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
        
        // Position T in center of grid
        const startX = Math.floor(gridSize[0] / 2);
        const startZ = 2;
        
        const startPos: Coord = [startX, y, startZ];
        const pathCoords: Coord[] = [startPos];
        const placementCoords: Set<string> = new Set();
        placementCoords.add(startPos.join(','));
        
        // Build stem (going Z+)
        const stemCoords: Coord[] = [startPos];
        let currentPos: Coord = [...startPos];
        
        for (let i = 0; i < stemLength; i++) {
            currentPos = [currentPos[0], currentPos[1], currentPos[2] + 1];
            pathCoords.push(currentPos);
            stemCoords.push(currentPos);
            placementCoords.add(currentPos.join(','));
        }
        
        const junction: Coord = [...currentPos];
        
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
        
        // Add branches to path (right side as main path)
        rightBranch.slice(1).forEach(c => pathCoords.push(c));
        
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
                segments: [stemCoords, rightBranch, leftBranch],
                corners: [junction],
                branches: [
                    { name: 'left', coords: leftBranch, endpoint: leftEnd },
                    { name: 'right', coords: rightBranch, endpoint: rightEnd }
                ],
                segment_analysis: {
                    count: 3,
                    lengths: [stemCoords.length, rightBranch.length, leftBranch.length],
                    min_length: Math.min(stemCoords.length, barSideLength + 1),
                    max_length: Math.max(stemCoords.length, barSideLength + 1)
                }
            }
        };
    }
}
