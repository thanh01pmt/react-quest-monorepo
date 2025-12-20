/**
 * UShape Topology
 * Creates a U-shaped path - good for function reuse lessons
 */

import { BaseTopology } from './BaseTopology';
import { IPathInfo, Coord } from '../types';

export class UShapeTopology extends BaseTopology {
    *generatePathInfoVariants(
        gridSize: [number, number, number],
        params: Record<string, any>,
        maxVariants: number
    ): Generator<IPathInfo> {
        let count = 0;
        
        for (let arm = 3; arm <= 6 && count < maxVariants; arm++) {
            for (let base = 2; base <= 5 && count < maxVariants; base++) {
                yield this.generatePathInfo(gridSize, {
                    ...params,
                    arm_length: arm,
                    base_length: base
                });
                count++;
            }
        }
    }

    generatePathInfo(gridSize: [number, number, number], params: Record<string, any>): IPathInfo {
        const armLength = params.arm_length || 4;
        const baseLength = params.base_length || 3;
        
        const y = 0;
        const startX = 2;
        const startZ = 2;
        
        const startPos: Coord = [startX, y, startZ];
        const pathCoords: Coord[] = [startPos];
        
        let currentPos: Coord = [...startPos];
        
        // Left arm (going down/Z+)
        const leftArm: Coord[] = [startPos];
        for (let i = 0; i < armLength; i++) {
            currentPos = [currentPos[0], currentPos[1], currentPos[2] + 1];
            pathCoords.push(currentPos);
            leftArm.push(currentPos);
        }
        
        const corner1: Coord = [...currentPos];
        
        // Base (going right/X+)
        const baseCoords: Coord[] = [corner1];
        for (let i = 0; i < baseLength; i++) {
            currentPos = [currentPos[0] + 1, currentPos[1], currentPos[2]];
            pathCoords.push(currentPos);
            baseCoords.push(currentPos);
        }
        
        const corner2: Coord = [...currentPos];
        
        // Right arm (going up/Z-)
        const rightArm: Coord[] = [corner2];
        for (let i = 0; i < armLength; i++) {
            currentPos = [currentPos[0], currentPos[1], currentPos[2] - 1];
            pathCoords.push(currentPos);
            rightArm.push(currentPos);
        }
        
        const targetPos = pathCoords[pathCoords.length - 1];
        
        return {
            start_pos: startPos,
            target_pos: targetPos,
            path_coords: pathCoords,
            placement_coords: [...pathCoords],
            obstacles: [],
            metadata: {
                topology_type: 'u_shape',
                arm_length: armLength,
                base_length: baseLength,
                left_arm: leftArm,
                right_arm: rightArm,
                base: baseCoords,
                corners: [corner1, corner2],
                segments: [leftArm, baseCoords, rightArm],
                segment_analysis: {
                    count: 3,
                    lengths: [leftArm.length, baseCoords.length, rightArm.length],
                    min_length: Math.min(leftArm.length, baseCoords.length),
                    max_length: Math.max(leftArm.length, rightArm.length)
                }
            }
        };
    }
}
