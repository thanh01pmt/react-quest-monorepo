/**
 * usePathTracer Hook
 * 
 * Traces a path from player_start to finish in Manual mode.
 * Uses BFS to find the shortest path through connected blocks.
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

    // Build walkable grid from block objects
    const blockObjects = placedObjects.filter(obj => obj.asset.type === 'block');
    const walkableSet = new Set<string>();
    
    blockObjects.forEach(obj => {
      // Consider the top of the block as walkable
      const walkableCoord: Coord = [
        obj.position[0],
        obj.position[1] + 1, // On top of block
        obj.position[2]
      ];
      walkableSet.add(coordToKey(walkableCoord));
      
      // Also consider the block position itself if items are placed at block level
      walkableSet.add(coordToKey(obj.position as Coord));
    });

    // Start and finish positions
    const startCoord: Coord = startObj.position as Coord;
    const finishCoord: Coord = finishObj.position as Coord;

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
      
      // Check if reached finish
      if (
        current.coord[0] === finishCoord[0] &&
        current.coord[2] === finishCoord[2] // Same x,z position (ignore y for walkability check)
      ) {
        foundPath = current.path;
        break;
      }
      
      // Explore neighbors
      for (const neighbor of getNeighbors(current.coord)) {
        const neighborKey = coordToKey(neighbor);
        
        // Check if this position is walkable (on a block)
        const atBlockLevel: Coord = [neighbor[0], neighbor[1], neighbor[2]];
        const onBlockLevel: Coord = [neighbor[0], neighbor[1] - 1, neighbor[2]];
        
        if (
          !visited.has(neighborKey) &&
          (walkableSet.has(coordToKey(atBlockLevel)) || 
           walkableSet.has(coordToKey(onBlockLevel)) ||
           (neighbor[0] === finishCoord[0] && neighbor[2] === finishCoord[2]))
        ) {
          queue.push({
            coord: neighbor,
            path: [...current.path, neighbor]
          });
        }
      }
    }

    const isReachable = foundPath.length > 0;

    // Determine accessible items (items on or adjacent to path)
    const items = placedObjects.filter(
      obj => obj.asset.type === 'collectible' || obj.asset.type === 'interactible'
    );

    const pathSet = new Set(foundPath.map(c => coordToKey(c)));
    
    const accessibleItems: PlacedObject[] = [];
    const inaccessibleItems: PlacedObject[] = [];

    items.forEach(item => {
      const itemCoord: Coord = item.position as Coord;
      const itemKey = coordToKey(itemCoord);
      
      // Item is accessible if it's on the path or adjacent to path
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
