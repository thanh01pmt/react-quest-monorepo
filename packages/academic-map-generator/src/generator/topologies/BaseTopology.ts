
import { IPathInfo, Coord, findShortestPath, coordToKey } from '../types';

export abstract class BaseTopology {
  /**
   * Generates raw path information based on the grid size and parameters.
   * @param gridSize The size of the grid [width, height, depth]
   * @param params Additional parameters for generation
   */
  abstract generatePathInfo(gridSize: [number, number, number], params: Record<string, any>): IPathInfo;

  /**
   * Generates multiple variants of path information.
   * @param gridSize The size of the grid [width, height, depth]
   * @param params Base parameters
   * @param maxVariants Maximum number of variants to generate
   */
  abstract generatePathInfoVariants(
    gridSize: [number, number, number],
    params: Record<string, any>,
    maxVariants: number
  ): Generator<IPathInfo>;

  protected manhattanDistance3d(p1: [number, number, number], p2: [number, number, number]): number {
    return Math.abs(p1[0] - p2[0]) + Math.abs(p1[1] - p2[1]) + Math.abs(p1[2] - p2[2]);
  }

  /**
   * Finds the two endpoints that are farthest apart.
   * @param endpoints List of endpoints
   */
  protected getFarthestEndpoints(endpoints: [number, number, number][]): [[number, number, number], [number, number, number]] {
    if (endpoints.length < 2) {
      const defaultPt: [number, number, number] = endpoints[0] || [0, 0, 0];
      return [defaultPt, defaultPt];
    }

    let maxDist = 0;
    let bestPair: [[number, number, number], [number, number, number]] = [endpoints[0], endpoints[1]];

    for (let i = 0; i < endpoints.length; i++) {
      for (let j = i + 1; j < endpoints.length; j++) {
        const dist = this.manhattanDistance3d(endpoints[i], endpoints[j]);
        if (dist > maxDist) {
          maxDist = dist;
          bestPair = [endpoints[i], endpoints[j]];
        }
      }
    }

    return bestPair;
  }

  /**
   * Gets optimal start/end positions based on semantic metadata or falls back to farthest endpoints.
   * @param metadata Topology metadata
   * @param allEndpoints List of all potential endpoints
   */
  protected getStartEndPositions(
    metadata: Record<string, any>,
    allEndpoints: [number, number, number][]
  ): [[number, number, number], [number, number, number]] {
    const semantic = metadata.semantic_positions || {};

    if (semantic.optimal_start && semantic.optimal_end) {
      const startKey = semantic.optimal_start;
      const endKey = semantic.optimal_end;
      
      // Check if keys exist in semantic map (which might store Coords)
      // Note: In TS/JS we need to be careful about object keys.
      // Assuming semantic_positions values can be looked up.
       if (semantic[startKey] && semantic[endKey]) {
           return [semantic[startKey], semantic[endKey]];
       }
    }

    return this.getFarthestEndpoints(allEndpoints);
  }

  /**
   * Builds segment analysis metadata from segments array.
   * @param segments Array of segment coordinates
   * @param segmentTypes Optional array of segment type strings
   */
  protected buildSegmentAnalysis(
    segments: [number, number, number][][],
    segmentTypes?: string[]
  ): Record<string, any> {
    if (!segments || segments.length === 0) {
      return {
        num_segments: 0,
        lengths: [],
        types: [],
        min_length: 0,
        max_length: 0,
        avg_length: 0
      };
    }

    const lengths = segments.map(s => s.length);
    const types = segmentTypes || segments.map(() => 'segment');
    
    return {
      num_segments: segments.length,
      lengths: lengths,
      types: types,
      min_length: Math.min(...lengths),
      max_length: Math.max(...lengths),
      avg_length: lengths.reduce((a, b) => a + b, 0) / lengths.length
    };
  }

  /**
   * Builds default semantic positions from start/end.
   */
  protected buildDefaultSemanticPositions(
    startPos: [number, number, number],
    targetPos: [number, number, number],
    additionalPositions?: Record<string, [number, number, number]>
  ): Record<string, any> {
    const basePositions: Record<string, any> = {
      start: startPos,
      end: targetPos,
      optimal_start: 'start',
      optimal_end: 'end',
      valid_pairs: [
        {
          name: 'full_path_easy',
          start: 'start',
          end: 'end',
          path_type: 'full_traversal',
          strategies: ['segment_based'],
          difficulty: 'EASY',
          teaching_goal: 'Complete path traversal'
        }
      ]
    };

    // Merge additional positions
    if (additionalPositions) {
      Object.assign(basePositions, additionalPositions);
    }

    return basePositions;
  }

  /**
   * Computes the shortest path from start to target through placement_coords.
   * Uses BFS pathfinding algorithm.
   * 
   * @param startPos Starting position
   * @param targetPos Target/goal position
   * @param placementCoords All walkable tiles (the ground)
   * @returns Array of coordinates representing the shortest path
   */
  protected computePathCoords(
    startPos: [number, number, number],
    targetPos: [number, number, number],
    placementCoords: [number, number, number][]
  ): [number, number, number][] {
    // Use imported findShortestPath and coordToKey from '../types'
    // Create a Set of walkable tiles for O(1) lookup
    const walkableSet = new Set<string>(
      placementCoords.map(c => coordToKey(c))
    );
    
    // Add start and target to walkable set if not already present
    walkableSet.add(coordToKey(startPos));
    walkableSet.add(coordToKey(targetPos));
    
    // Find shortest path using BFS
    const path = findShortestPath(startPos, targetPos, walkableSet, true);
    
    // If no path found, return start and target as fallback
    if (path.length === 0) {
      console.warn('    WARN: No path found from start to target. Returning direct fallback.');
      return [startPos, targetPos];
    }
    
    return path;
  }

  /**
   * Deduplicates coordinates while preserving order.
   */
  protected _deduplicateCoords(coords: [number, number, number][]): [number, number, number][] {
    const seen = new Set<string>();
    return coords.filter(coord => {
      const key = `${coord[0]},${coord[1]},${coord[2]}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  /**
   * Shuffles an array randomly.
   */
  protected _shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  /**
   * Check if two coordinates are equal.
   */
  protected _coordsEqual(a: Coord, b: Coord): boolean {
    return a[0] === b[0] && a[1] === b[1] && a[2] === b[2];
  }

  /**
   * For closed-loop topologies: ensures start and target are not the same,
   * places them at least 2 tiles apart, and removes the "bridge" tile between
   * them to force one-way traversal.
   * 
   * @param pathCoords Ordered loop path (first and last should be adjacent or same in closed loop)
   * @param forceBreak If true, always break the loop even if first-last are not adjacent
   * @returns Object with startPos, targetPos, and modified placementCoords with gap REMOVED
   */
  protected breakClosedLoop(
    pathCoords: Coord[],
    forceBreak: boolean = false
  ): { startPos: Coord; targetPos: Coord; placementCoords: Coord[]; gapCoord: Coord | null } {
    if (pathCoords.length < 4) {
      // Not enough points for a meaningful loop
      return {
        startPos: pathCoords[0],
        targetPos: pathCoords[pathCoords.length - 1],
        placementCoords: [...pathCoords],
        gapCoord: null
      };
    }

    // Check if this is a closed loop (first and last are same or adjacent)
    const first = pathCoords[0];
    const last = pathCoords[pathCoords.length - 1];
    const distFirstLast = this.manhattanDistance3d(first, last);

    // Only skip breaking if NOT forced AND not a closed loop
    if (!forceBreak && distFirstLast > 1) {
      // Not a closed loop and not forced, return as-is
      return {
        startPos: first,
        targetPos: last,
        placementCoords: [...pathCoords],
        gapCoord: null
      };
    }

    // This is a closed loop - break it!
    // Strategy: 
    //   - Start at index 0
    //   - Gap at index 1 (REMOVED from placement - player cannot walk here)
    //   - Target at index 2
    // This forces the player to go the "long way" around the loop

    const startPos = pathCoords[0];
    const gapCoord = pathCoords[1];  // This tile will be DELETED
    const targetPos = pathCoords[2]; // Target is just after the gap

    // Create key for the gap coordinate to filter it out
    const gapKey = `${gapCoord[0]},${gapCoord[1]},${gapCoord[2]}`;

    // Create placement coords WITHOUT the gap coordinate
    // Filter by coordinate VALUE (not just index) to remove ALL occurrences
    const placementCoords: Coord[] = [];
    const seen = new Set<string>();

    for (const coord of pathCoords) {
      const key = `${coord[0]},${coord[1]},${coord[2]}`;
      
      // Skip if it's the gap coordinate OR if we've already added this coordinate
      if (key === gapKey) {
        continue; // REMOVE the gap tile completely
      }
      
      if (seen.has(key)) {
        continue; // Skip duplicates
      }
      
      seen.add(key);
      placementCoords.push(coord);
    }

    console.log(`    LOG: Breaking closed loop - REMOVED gap tile at [${gapCoord.join(',')}]`);
    console.log(`    LOG: Start=[${startPos.join(',')}], Target=[${targetPos.join(',')}]`);
    console.log(`    LOG: Placement tiles: ${placementCoords.length} (was ${pathCoords.length})`);

    return {
      startPos,
      targetPos,
      placementCoords,
      gapCoord
    };
  }

  /**
   * For closed loops: Given start/target on a loop, compute the LONG path
   * (going the opposite direction from the gap).
   */
  protected computeLoopPathCoords(
    startPos: Coord,
    targetPos: Coord,
    placementCoords: Coord[],
    originalLoopOrder: Coord[]
  ): Coord[] {
    // Find start and target indices in original loop
    const startIdx = originalLoopOrder.findIndex(c => this._coordsEqual(c, startPos));
    const targetIdx = originalLoopOrder.findIndex(c => this._coordsEqual(c, targetPos));

    if (startIdx === -1 || targetIdx === -1) {
      // Fallback to BFS
      return this.computePathCoords(startPos, targetPos, placementCoords);
    }

    // Path from startIdx going forward (skipping gap at idx 1) to wrap around to targetIdx
    // The gap is at index 1, so we go from 0 -> 2 -> 3 -> ... -> n-1 -> 0 (but stop at target)
    const path: Coord[] = [];
    const n = originalLoopOrder.length;
    
    // Start at startIdx (which is 0 after break)
    // Go backwards (or forwards the long way) to reach targetIdx (which is 2)
    // Since gap is at 1, we go: 0 -> n-1 -> n-2 -> ... -> 3 -> 2
    
    let idx = startIdx;
    const visited = new Set<number>();
    
    while (!visited.has(idx)) {
      visited.add(idx);
      
      // Skip gap index (1)
      if (idx !== 1 || this._coordsEqual(originalLoopOrder[idx], startPos) || this._coordsEqual(originalLoopOrder[idx], targetPos)) {
        if (idx !== 1) {
          path.push(originalLoopOrder[idx]);
        }
      }
      
      if (idx === targetIdx && path.length > 1) {
        break; // Reached target
      }
      
      // Move backwards in the loop (away from gap direction)
      idx = (idx - 1 + n) % n;
    }

    if (path.length < 2) {
      // Fallback to BFS
      return this.computePathCoords(startPos, targetPos, placementCoords);
    }

    return path;
  }
}
