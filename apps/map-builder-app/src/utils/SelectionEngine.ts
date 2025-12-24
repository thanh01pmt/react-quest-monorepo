import { PlacedObject } from '../types';

/**
 * Coordinate tuple [x, y, z]
 */
type Coord = [number, number, number];

/**
 * SelectionEngine - Handles smart selection using BFS graph traversal
 * 
 * @description
 * Implements connected component selection for map builder.
 * Uses BFS to find all tiles adjacent to a starting tile.
 * 
 * @example
 * const engine = new SelectionEngine();
 * const selectedIds = engine.selectConnected('obj-123', placedObjects);
 */
export class SelectionEngine {
  /**
   * Select all objects connected to the starting object
   * 
   * @param startId - ID of the starting object
   * @param objects - All placed objects in the scene
   * @returns Array of IDs of all connected objects
   * 
   * @complexity O(n) where n is number of connected objects
   */
  selectConnected(startId: string, objects: PlacedObject[]): string[] {
    const visited = new Set<string>();
    const queue = [startId];
    const result: string[] = [];
    
    // Build position map for O(1) lookup
    const positionMap = this.buildPositionMap(objects);
    const objectMap = new Map(objects.map(obj => [obj.id, obj]));
    
    // Get starting object
    const startObj = objectMap.get(startId);
    if (!startObj) return [];
    
    // BFS traversal
    while (queue.length > 0) {
      const currentId = queue.shift()!;
      
      if (visited.has(currentId)) continue;
      visited.add(currentId);
      result.push(currentId);
      
      const current = objectMap.get(currentId);
      if (!current) continue;
      
      // Find adjacent neighbors
      const neighbors = this.findAdjacent(current, objects, positionMap);
      
      // Filter neighbors: same asset type only, not yet visited
      const validNeighbors = neighbors.filter(neighbor => 
        !visited.has(neighbor.id) &&
        this.isSameType(current, neighbor)
      );
      
      queue.push(...validNeighbors.map(n => n.id));
    }
    
    return result;
  }
  
  /**
   * Find all objects adjacent to given object (6-connected in 3D)
   * 
   * @param obj - Object to find neighbors for
   * @param allObjects - All objects in scene
   * @param positionMap - Pre-built position lookup map
   * @returns Array of adjacent objects
   * 
   * @description
   * Checks all 6 directions in 3D space:
   * - +X (right), -X (left)
   * - +Y (up), -Y (down)
   * - +Z (forward), -Z (back)
   */
  private findAdjacent(
    obj: PlacedObject,
    allObjects: PlacedObject[],
    positionMap: Map<string, PlacedObject>
  ): PlacedObject[] {
    const [x, y, z] = obj.position;
    
    // 6 adjacent positions in 3D grid
    const adjacentPositions: Coord[] = [
      [x + 1, y, z],  // Right (+X)
      [x - 1, y, z],  // Left (-X)
      [x, y + 1, z],  // Up (+Y)
      [x, y - 1, z],  // Down (-Y)
      [x, y, z + 1],  // Forward (+Z)
      [x, y, z - 1],  // Back (-Z)
    ];
    
    const neighbors: PlacedObject[] = [];
    
    for (const pos of adjacentPositions) {
      const key = this.posToKey(pos);
      const neighbor = positionMap.get(key);
      
      if (neighbor) {
        neighbors.push(neighbor);
      }
    }
    
    return neighbors;
  }
  
  /**
   * Build a map from position string to object for fast lookup
   * 
   * @param objects - All objects to index
   * @returns Map keyed by "x,y,z" position string
   * 
   * @complexity O(n) where n is number of objects
   */
  private buildPositionMap(objects: PlacedObject[]): Map<string, PlacedObject> {
    const map = new Map<string, PlacedObject>();
    
    for (const obj of objects) {
      const key = this.posToKey(obj.position);
      map.set(key, obj);
    }
    
    return map;
  }
  
  /**
   * Convert position coordinates to string key
   * 
   * @param pos - Position tuple [x, y, z]
   * @returns String key "x,y,z"
   */
  private posToKey(pos: Coord): string {
    return `${pos[0]},${pos[1]},${pos[2]}`;
  }
  
  /**
   * Check if two objects are the same type (should be selected together)
   * 
   * @param obj1 - First object
   * @param obj2 - Second object
   * @returns True if objects should be selected together
   * 
   * @description
   * Objects are same type if they have the same asset key.
   * This prevents selecting walls when clicking floor tiles, etc.
   */
  private isSameType(obj1: PlacedObject, obj2: PlacedObject): boolean {
    return obj1.asset.key === obj2.asset.key;
  }
  
  /**
   * Get preview of what would be selected (without committing)
   * 
   * @param startId - ID of starting object
   * @param objects - All placed objects
   * @returns Array of IDs that would be selected
   * 
   * @description
   * Useful for showing hover preview before user clicks to confirm
   */
  getSelectionPreview(startId: string, objects: PlacedObject[]): string[] {
    // Same as selectConnected, but called for preview
    return this.selectConnected(startId, objects);
  }
}
