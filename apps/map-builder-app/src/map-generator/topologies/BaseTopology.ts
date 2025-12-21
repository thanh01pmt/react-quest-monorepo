
import { IPathInfo } from '../types';

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
}
