/**
 * usePathTracer Hook
 * 
 * Traces a path from player_start to finish in Manual mode.
 * Uses BFS to find the shortest path through connected blocks.
 * 
 * Coordinate convention:
 * - Blocks are placed at position (x, y, z)
 * - Player/Items stand ON TOP of blocks, so they are at (x, y+1, z)
 * - Path is traced at the "walkable" level (y+1 of blocks)
 */

import { useMemo } from 'react';
import { PlacedObject } from '../types';

export interface TracedPath {
  /** Whether finish is reachable from start */
  isReachable: boolean;
  /** The traced path coordinates */
  path: [number, number, number][];
  /** Items that are accessible from the path */
  accessibleItems: PlacedObject[];
  /** Items that are NOT accessible from the path */
  inaccessibleItems: PlacedObject[];
  /** Start position found */
  startFound: boolean;
  /** Finish position found */
  finishFound: boolean;
}

type Coord = [number, number, number];

function coordToKey(coord: Coord): string {
  return `${coord[0]},${coord[1]},${coord[2]}`;
}

function getNeighbors(coord: Coord): Coord[] {
  const [x, y, z] = coord;
  // Only horizontal movement (same Y level)
  return [
    [x + 1, y, z],
    [x - 1, y, z],
    [x, y, z + 1],
    [x, y, z - 1],
  ] as Coord[];
}

/**
 * Hook to trace path from start to finish in manual mode
 */
export function usePathTracer(placedObjects: PlacedObject[]): TracedPath {
  return useMemo(() => {
    // Find start and finish objects
    const startObj = placedObjects.find(
      obj => obj.asset.key === 'player_start'
    );
    const finishObj = placedObjects.find(
      obj => obj.asset.key === 'finish' || obj.asset.key === 'goal'
    );

    const startFound = !!startObj;
    const finishFound = !!finishObj;

    if (!startObj || !finishObj) {
      return {
        isReachable: false,
        path: [],
        accessibleItems: [],
        inaccessibleItems: placedObjects.filter(
          obj => obj.asset.type === 'collectible' || obj.asset.type === 'interactible'
        ),
        startFound,
        finishFound,
      };
    }

    // Build walkable positions from block objects
    // Blocks are at (x, y, z), walkable surface is at (x, y+1, z)
    const blockObjects = placedObjects.filter(obj => obj.asset.type === 'block');
    const walkableSet = new Set<string>();
    
    blockObjects.forEach(obj => {
      const [x, y, z] = obj.position;
      // The walkable position is ON TOP of the block
      const walkableCoord: Coord = [x, y + 1, z];
      walkableSet.add(coordToKey(walkableCoord));
    });

    // Start and finish positions (they should already be at walkable level, i.e., Y+1 of blocks)
    const startCoord: Coord = startObj.position as Coord;
    const finishCoord: Coord = finishObj.position as Coord;

    // Also add start/finish positions as walkable (in case they weren't on a block)
    walkableSet.add(coordToKey(startCoord));
    walkableSet.add(coordToKey(finishCoord));

    // BFS to find path
    const visited = new Set<string>();
    const queue: { coord: Coord; path: Coord[] }[] = [
      { coord: startCoord, path: [startCoord] }
    ];
    
    let foundPath: Coord[] = [];
    
    while (queue.length > 0) {
      const current = queue.shift()!;
      const key = coordToKey(current.coord);
      
      if (visited.has(key)) continue;
      visited.add(key);
      
      // Check if reached finish (exact match including Y)
      if (
        current.coord[0] === finishCoord[0] &&
        current.coord[1] === finishCoord[1] &&
        current.coord[2] === finishCoord[2]
      ) {
        foundPath = current.path;
        break;
      }
      
      // Explore neighbors (same Y level)
      for (const neighbor of getNeighbors(current.coord)) {
        const neighborKey = coordToKey(neighbor);
        
        // Check if this position is walkable
        if (!visited.has(neighborKey) && walkableSet.has(neighborKey)) {
          queue.push({
            coord: neighbor,
            path: [...current.path, neighbor]
          });
        }
      }
    }

    const isReachable = foundPath.length > 0;

    // Create a set of path positions for quick lookup
    const pathSet = new Set(foundPath.map(c => coordToKey(c)));

    // Determine accessible items
    // Items are also placed at Y+1 (on top of blocks), same as player
    const items = placedObjects.filter(
      obj => obj.asset.type === 'collectible' || obj.asset.type === 'interactible'
    );

    const accessibleItems: PlacedObject[] = [];
    const inaccessibleItems: PlacedObject[] = [];

    items.forEach(item => {
      const itemCoord: Coord = item.position as Coord;
      const itemKey = coordToKey(itemCoord);
      
      // Item is accessible if:
      // 1. It's exactly on the path, OR
      // 2. It's horizontally adjacent to a path position (same Y)
      const isOnPath = pathSet.has(itemKey);
      const isAdjacent = getNeighbors(itemCoord).some(n => pathSet.has(coordToKey(n)));
      
      if (isOnPath || isAdjacent) {
        accessibleItems.push(item);
      } else {
        inaccessibleItems.push(item);
      }
    });

    return {
      isReachable,
      path: foundPath,
      accessibleItems,
      inaccessibleItems,
      startFound,
      finishFound,
    };
  }, [placedObjects]);
}

export default usePathTracer;
