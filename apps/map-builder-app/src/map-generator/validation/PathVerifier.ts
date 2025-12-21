/**
 * Path Verifier
 * 
 * Verifies that a path is walkable and solvable using BFS/validation logic.
 * Used by SolutionFirstPlacer to pre-validate paths before item placement.
 */

import { Coord, IPathInfo } from '../types';
import { PlacedObject } from '../../types';

export interface PathVerificationResult {
    isValid: boolean;
    canReachFinish: boolean;
    pathLength: number;
    errors: string[];
    suggestions: string[];
}

/**
 * Convert Coord to string key
 */
function coordKey(c: Coord): string {
    return `${c[0]},${c[1]},${c[2]}`;
}

/**
 * Check if two coordinates are adjacent (can move from one to other in 1 step)
 */
function areAdjacent(a: Coord, b: Coord): boolean {
    const dx = Math.abs(a[0] - b[0]);
    const dy = Math.abs(a[1] - b[1]);
    const dz = Math.abs(a[2] - b[2]);
    
    // Adjacent if moving by 1 in exactly one axis
    // Or just height change (Y axis) while staying in same X,Z
    if (dx === 0 && dz === 0 && dy === 1) return true;  // Vertical step
    if (dx === 1 && dz === 0 && dy === 0) return true;  // X direction
    if (dx === 0 && dz === 1 && dy === 0) return true;  // Z direction
    if (dx === 0 && dz === 0 && dy === 0) return true;  // Same position (shouldn't happen but handle)
    
    return false;
}

/**
 * Verify that the path_coords form a connected, walkable path
 */
export function verifyPathConnectivity(pathCoords: Coord[]): { isConnected: boolean; gaps: number[] } {
    if (!pathCoords || pathCoords.length < 2) {
        return { isConnected: pathCoords?.length === 1 || false, gaps: [] };
    }
    
    const gaps: number[] = [];
    
    for (let i = 1; i < pathCoords.length; i++) {
        if (!areAdjacent(pathCoords[i - 1], pathCoords[i])) {
            gaps.push(i);
        }
    }
    
    return {
        isConnected: gaps.length === 0,
        gaps
    };
}

/**
 * BFS to verify that target is reachable from start given walkable tiles
 */
export function verifyPathReachability(
    startPos: Coord,
    targetPos: Coord,
    walkableTiles: Set<string>
): { canReach: boolean; shortestPath: Coord[] | null } {
    const startKey = coordKey(startPos);
    const targetKey = coordKey(targetPos);
    
    // If start or target not in walkable, fail immediately
    if (!walkableTiles.has(startKey)) {
        console.warn('[PathVerifier] Start position not in walkable tiles');
        return { canReach: false, shortestPath: null };
    }
    if (!walkableTiles.has(targetKey)) {
        console.warn('[PathVerifier] Target position not in walkable tiles');
        return { canReach: false, shortestPath: null };
    }
    
    // BFS
    const queue: { pos: Coord; path: Coord[] }[] = [{ pos: startPos, path: [startPos] }];
    const visited = new Set<string>([startKey]);
    
    const directions: [number, number, number][] = [
        [1, 0, 0], [-1, 0, 0],  // X
        [0, 0, 1], [0, 0, -1],  // Z
        [0, 1, 0], [0, -1, 0],  // Y (for stairs)
    ];
    
    while (queue.length > 0) {
        const current = queue.shift()!;
        const currentKey = coordKey(current.pos);
        
        if (currentKey === targetKey) {
            return { canReach: true, shortestPath: current.path };
        }
        
        for (const [dx, dy, dz] of directions) {
            const neighbor: Coord = [
                current.pos[0] + dx,
                current.pos[1] + dy,
                current.pos[2] + dz
            ];
            const neighborKey = coordKey(neighbor);
            
            if (!visited.has(neighborKey) && walkableTiles.has(neighborKey)) {
                visited.add(neighborKey);
                queue.push({ pos: neighbor, path: [...current.path, neighbor] });
            }
        }
    }
    
    return { canReach: false, shortestPath: null };
}

/**
 * Full path verification combining connectivity and reachability
 */
export function verifyPath(pathInfo: IPathInfo): PathVerificationResult {
    const errors: string[] = [];
    const suggestions: string[] = [];
    
    // 1. Check basic structure
    if (!pathInfo.start_pos || pathInfo.start_pos.length !== 3) {
        errors.push('Missing or invalid start position');
    }
    if (!pathInfo.target_pos || pathInfo.target_pos.length !== 3) {
        errors.push('Missing or invalid target position');
    }
    if (!pathInfo.path_coords || pathInfo.path_coords.length < 2) {
        errors.push('Path too short (need at least 2 coordinates)');
    }
    
    if (errors.length > 0) {
        return {
            isValid: false,
            canReachFinish: false,
            pathLength: pathInfo.path_coords?.length || 0,
            errors,
            suggestions
        };
    }
    
    // 2. Check path connectivity
    const { isConnected, gaps } = verifyPathConnectivity(pathInfo.path_coords);
    if (!isConnected) {
        errors.push(`Path has ${gaps.length} gap(s) at indices: ${gaps.join(', ')}`);
        suggestions.push('Ensure each step in path_coords moves only 1 cell in X, Y, or Z');
    }
    
    // 3. Build walkable tile set from placement_coords or path_coords
    const walkableTiles = new Set<string>();
    const tilesSource = pathInfo.placement_coords?.length > 0 
        ? pathInfo.placement_coords 
        : pathInfo.path_coords;
    tilesSource.forEach(c => walkableTiles.add(coordKey(c)));
    
    // 4. Verify reachability using BFS
    const { canReach, shortestPath } = verifyPathReachability(
        pathInfo.start_pos,
        pathInfo.target_pos,
        walkableTiles
    );
    
    if (!canReach) {
        errors.push('Target position is not reachable from start position');
        suggestions.push('Check that all tiles between start and target are in placement_coords');
    }
    
    return {
        isValid: errors.length === 0,
        canReachFinish: canReach,
        pathLength: shortestPath?.length || pathInfo.path_coords.length,
        errors,
        suggestions
    };
}

/**
 * Verify path after objects are placed
 */
export function verifyPathWithObjects(
    pathInfo: IPathInfo,
    objects: PlacedObject[]
): PathVerificationResult {
    // First do basic verification
    const baseResult = verifyPath(pathInfo);
    
    // Then check that no blocking objects are on the path
    const groundTiles = objects.filter(o => 
        o.asset.type === 'block' || 
        o.asset.key.includes('ground') ||
        o.asset.key.includes('stone')
    );
    
    // Build walkable set from actual placed ground tiles
    const walkableTiles = new Set<string>();
    groundTiles.forEach(o => {
        walkableTiles.add(coordKey(o.position as Coord));
    });
    
    // If we have ground tiles, verify against them
    if (walkableTiles.size > 0) {
        const { canReach } = verifyPathReachability(
            pathInfo.start_pos,
            pathInfo.target_pos,
            walkableTiles
        );
        
        if (!canReach && baseResult.isValid) {
            baseResult.isValid = false;
            baseResult.canReachFinish = false;
            baseResult.errors.push('Target not reachable through placed ground tiles');
        }
    }
    
    return baseResult;
}

// Singleton exports
let verifierInstance = {
    verifyPath,
    verifyPathConnectivity,
    verifyPathReachability,
    verifyPathWithObjects
};

export function getPathVerifier() {
    return verifierInstance;
}

export default verifierInstance;
