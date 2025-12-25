/**
 * FloodFill Utility
 * 
 * Implements BFS-based flood fill for the map builder.
 * Features:
 * - Flood fill starting from a position
 * - Respect wall/obstacle boundaries
 * - Same Y-level constraint
 * - Optimized for large areas (>1000 tiles)
 * - Configurable boundary detection
 */

import type { PlacedObject } from '../types';

// Types
export interface FloodFillOptions {
  /** Maximum number of tiles to fill (performance limit) */
  maxTiles?: number;
  /** Whether to constrain to same Y level */
  sameYLevel?: boolean;
  /** Custom boundary check function */
  isBoundary?: (position: [number, number, number], objects: PlacedObject[]) => boolean;
}

export interface FloodFillResult {
  /** Positions that can be filled */
  positions: [number, number, number][];
  /** Whether the fill hit the max tiles limit */
  hitLimit: boolean;
  /** Total tiles found */
  count: number;
}

// Constants
const DEFAULT_MAX_TILES = 2000;

// 4-connected adjacency on XZ plane (no diagonal, no vertical)
const ADJACENCY_XZ: [number, number, number][] = [
  [1, 0, 0],   // +X
  [-1, 0, 0],  // -X
  [0, 0, 1],   // +Z
  [0, 0, -1],  // -Z
];

// 6-connected adjacency (includes vertical)
const ADJACENCY_3D: [number, number, number][] = [
  [1, 0, 0],   // +X
  [-1, 0, 0],  // -X
  [0, 1, 0],   // +Y
  [0, -1, 0],  // -Y
  [0, 0, 1],   // +Z
  [0, 0, -1],  // -Z
];

/**
 * FloodFill class for flood-filling empty areas
 */
export class FloodFill {
  private positionMap: Map<string, PlacedObject>;
  private groundMap: Set<string>; // Positions that have ground tiles
  
  constructor() {
    this.positionMap = new Map();
    this.groundMap = new Set();
  }
  
  /**
   * Build position map for O(1) lookup
   */
  private buildPositionMap(objects: PlacedObject[]): void {
    this.positionMap.clear();
    this.groundMap.clear();
    
    for (const obj of objects) {
      const key = this.posKey(obj.position);
      this.positionMap.set(key, obj);
      
      // Track ground tiles separately
      if (obj.asset.key.includes('ground')) {
        this.groundMap.add(key);
      }
    }
  }
  
  /**
   * Convert position to string key
   */
  private posKey(pos: [number, number, number]): string {
    return `${pos[0]},${pos[1]},${pos[2]}`;
  }
  
  /**
   * Check if position is walkable (has ground but no obstacle)
   */
  private isWalkable(pos: [number, number, number]): boolean {
    const key = this.posKey(pos);
    const obj = this.positionMap.get(key);
    
    // Has ground at this position
    if (!this.groundMap.has(key)) return false;
    
    // Check if there's an obstacle/item on top
    const aboveKey = this.posKey([pos[0], pos[1] + 1, pos[2]]);
    const aboveObj = this.positionMap.get(aboveKey);
    
    // If there's something above that's not ground, it's blocked
    if (aboveObj && !aboveObj.asset.key.includes('ground')) {
      return false;
    }
    
    return true;
  }
  
  /**
   * Check if position is empty (no object at all)
   */
  private isEmpty(pos: [number, number, number]): boolean {
    const key = this.posKey(pos);
    return !this.positionMap.has(key);
  }
  
  /**
   * Check if position has a blocking obstacle (wall, etc)
   */
  private isBlocked(pos: [number, number, number]): boolean {
    const key = this.posKey(pos);
    const obj = this.positionMap.get(key);
    
    if (!obj) return false;
    
    // Walls and obstacles are blocking
    if (obj.asset.key.includes('wall') || obj.asset.key.includes('obstacle')) {
      return true;
    }
    
    return false;
  }
  
  /**
   * Flood fill to find all empty positions connected to start
   * Used for filling empty areas with ground tiles
   */
  floodFillEmpty(
    startPos: [number, number, number],
    objects: PlacedObject[],
    bounds: { min: [number, number, number], max: [number, number, number] },
    options: FloodFillOptions = {}
  ): FloodFillResult {
    const { maxTiles = DEFAULT_MAX_TILES, sameYLevel = true } = options;
    
    this.buildPositionMap(objects);
    
    const visited = new Set<string>();
    const result: [number, number, number][] = [];
    const queue: [number, number, number][] = [startPos];
    
    // Start position must be empty or valid
    const startKey = this.posKey(startPos);
    if (this.positionMap.has(startKey)) {
      return { positions: [], hitLimit: false, count: 0 };
    }
    
    visited.add(startKey);
    
    while (queue.length > 0 && result.length < maxTiles) {
      const current = queue.shift()!;
      
      // Add to result
      result.push(current);
      
      // Check neighbors
      const adjacency = sameYLevel ? ADJACENCY_XZ : ADJACENCY_3D;
      
      for (const [dx, dy, dz] of adjacency) {
        const neighbor: [number, number, number] = [
          current[0] + dx,
          current[1] + dy,
          current[2] + dz
        ];
        
        const neighborKey = this.posKey(neighbor);
        
        // Skip if already visited
        if (visited.has(neighborKey)) continue;
        
        // Check bounds
        if (
          neighbor[0] < bounds.min[0] || neighbor[0] > bounds.max[0] ||
          neighbor[1] < bounds.min[1] || neighbor[1] > bounds.max[1] ||
          neighbor[2] < bounds.min[2] || neighbor[2] > bounds.max[2]
        ) continue;
        
        // Check if blocked
        if (this.isBlocked(neighbor)) continue;
        
        // Check if empty (for filling)
        if (!this.isEmpty(neighbor)) continue;
        
        visited.add(neighborKey);
        queue.push(neighbor);
      }
    }
    
    return {
      positions: result,
      hitLimit: result.length >= maxTiles,
      count: result.length,
    };
  }
  
  /**
   * Flood fill walkable area (for item placement preview)
   */
  floodFillWalkable(
    startPos: [number, number, number],
    objects: PlacedObject[],
    options: FloodFillOptions = {}
  ): FloodFillResult {
    const { maxTiles = DEFAULT_MAX_TILES } = options;
    
    this.buildPositionMap(objects);
    
    const visited = new Set<string>();
    const result: [number, number, number][] = [];
    const queue: [number, number, number][] = [startPos];
    
    // Start position must be walkable ground
    if (!this.isWalkable(startPos)) {
      return { positions: [], hitLimit: false, count: 0 };
    }
    
    const startKey = this.posKey(startPos);
    visited.add(startKey);
    
    while (queue.length > 0 && result.length < maxTiles) {
      const current = queue.shift()!;
      
      // Add to result
      result.push(current);
      
      // Check XZ neighbors only (same Y level)
      for (const [dx, , dz] of ADJACENCY_XZ) {
        const neighbor: [number, number, number] = [
          current[0] + dx,
          current[1],
          current[2] + dz
        ];
        
        const neighborKey = this.posKey(neighbor);
        
        if (visited.has(neighborKey)) continue;
        if (!this.isWalkable(neighbor)) continue;
        
        visited.add(neighborKey);
        queue.push(neighbor);
      }
    }
    
    return {
      positions: result,
      hitLimit: result.length >= maxTiles,
      count: result.length,
    };
  }
  
  /**
   * Get fill preview (positions that would be filled)
   */
  getPreview(
    startPos: [number, number, number],
    objects: PlacedObject[],
    bounds: { min: [number, number, number], max: [number, number, number] },
    options: FloodFillOptions = {}
  ): FloodFillResult {
    return this.floodFillEmpty(startPos, objects, bounds, options);
  }
}

export default FloodFill;
