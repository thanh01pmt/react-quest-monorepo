
// ============================================================================
// SEGMENT FILTER (TIER 3)
// ============================================================================

import { Tier2Result, Tier3Result, PathSegment, Vector3 } from '../../core/types';
import { vectorEquals, vectorToKey, vectorNormalize, vectorDistance } from '../../core/GeometryUtils';

export class SegmentFilter {
  constructor(private minLength: number = 2) {}

  public analyze(tier2Result: Tier2Result): Tier3Result {
    const patternSegmentIds = new Set(
      tier2Result.patterns.flatMap(p => p.unitElements)
    );

    const filteredSegments: PathSegment[] = [];
    const keptShortSegments: PathSegment[] = [];
    const normalSegments: PathSegment[] = [];

    for (const segment of tier2Result.segments) {
      if (segment.length < this.minLength) {
        if (patternSegmentIds.has(segment.id)) {
          keptShortSegments.push(segment);
        } else {
          filteredSegments.push(segment);
        }
      } else {
        normalSegments.push(segment);
      }
    }

    // Merge adjacent segments if possible
    const mergedSegments = this.mergeAdjacentSegments([...normalSegments, ...keptShortSegments]);

    return {
      ...tier2Result,
      filteredSegments,
      mergedSegments,
      keptShortSegments
    };
  }

  /**
   * Merge adjacent collinear segments into longer segments.
   * Two segments are mergeable if:
   * 1. They share an endpoint (adjacent)
   * 2. They have the same direction (collinear)
   */
  private mergeAdjacentSegments(segments: PathSegment[]): PathSegment[] {
    if (segments.length <= 1) return segments;

    // Build adjacency map: endpoint -> list of segment indices that touch it
    const endpointToSegments = new Map<string, number[]>();
    
    for (let i = 0; i < segments.length; i++) {
      const seg = segments[i];
      const startKey = vectorToKey(seg.points[0]);
      const endKey = vectorToKey(seg.points[seg.points.length - 1]);
      
      if (!endpointToSegments.has(startKey)) endpointToSegments.set(startKey, []);
      if (!endpointToSegments.has(endKey)) endpointToSegments.set(endKey, []);
      
      endpointToSegments.get(startKey)!.push(i);
      endpointToSegments.get(endKey)!.push(i);
    }

    const merged: PathSegment[] = [];
    const usedIndices = new Set<number>();

    for (let i = 0; i < segments.length; i++) {
      if (usedIndices.has(i)) continue;

      // Start a chain from this segment
      let chain = this.buildMergeChain(i, segments, endpointToSegments, usedIndices);
      
      if (chain.length === 1) {
        // No merge possible, keep original
        merged.push(segments[chain[0]]);
      } else {
        // Merge the chain into one segment
        const mergedSegment = this.mergeChain(chain, segments);
        merged.push(mergedSegment);
      }
    }

    return merged;
  }

  /**
   * Build a chain of mergeable segment indices starting from startIdx
   */
  private buildMergeChain(
    startIdx: number, 
    segments: PathSegment[], 
    endpointMap: Map<string, number[]>,
    usedIndices: Set<number>
  ): number[] {
    const chain: number[] = [startIdx];
    usedIndices.add(startIdx);

    const startSeg = segments[startIdx];
    const direction = startSeg.direction;

    // Try to extend from both ends of the segment
    let currentStart = startSeg.points[0];
    let currentEnd = startSeg.points[startSeg.points.length - 1];

    // Extend forward (from end)
    let extended = true;
    while (extended) {
      extended = false;
      const endKey = vectorToKey(currentEnd);
      const candidates = endpointMap.get(endKey) || [];
      
      for (const candidateIdx of candidates) {
        if (usedIndices.has(candidateIdx)) continue;
        
        const candidate = segments[candidateIdx];
        
        // Check if collinear (same or opposite direction)
        if (this.isCollinear(direction, candidate.direction)) {
          // Check which end connects
          const candStart = candidate.points[0];
          const candEnd = candidate.points[candidate.points.length - 1];
          
          if (vectorEquals(currentEnd, candStart)) {
            chain.push(candidateIdx);
            usedIndices.add(candidateIdx);
            currentEnd = candEnd;
            extended = true;
            break;
          } else if (vectorEquals(currentEnd, candEnd)) {
            // Need to reverse this segment's points when merging
            chain.push(candidateIdx);
            usedIndices.add(candidateIdx);
            currentEnd = candStart;
            extended = true;
            break;
          }
        }
      }
    }

    // Extend backward (from start)
    extended = true;
    while (extended) {
      extended = false;
      const startKey = vectorToKey(currentStart);
      const candidates = endpointMap.get(startKey) || [];
      
      for (const candidateIdx of candidates) {
        if (usedIndices.has(candidateIdx)) continue;
        
        const candidate = segments[candidateIdx];
        
        if (this.isCollinear(direction, candidate.direction)) {
          const candStart = candidate.points[0];
          const candEnd = candidate.points[candidate.points.length - 1];
          
          if (vectorEquals(currentStart, candEnd)) {
            chain.unshift(candidateIdx);
            usedIndices.add(candidateIdx);
            currentStart = candStart;
            extended = true;
            break;
          } else if (vectorEquals(currentStart, candStart)) {
            chain.unshift(candidateIdx);
            usedIndices.add(candidateIdx);
            currentStart = candEnd;
            extended = true;
            break;
          }
        }
      }
    }

    return chain;
  }

  /**
   * Check if two directions are collinear (same or opposite)
   */
  private isCollinear(d1: Vector3, d2: Vector3): boolean {
    // Dot product of normalized vectors should be ±1 for collinear
    const dot = d1.x * d2.x + d1.y * d2.y + d1.z * d2.z;
    return Math.abs(Math.abs(dot) - 1) < 0.01;
  }

  /**
   * Merge a chain of segment indices into a single PathSegment
   */
  private mergeChain(chain: number[], segments: PathSegment[]): PathSegment {
    const allPoints: Vector3[] = [];
    const seenPoints = new Set<string>();

    for (let i = 0; i < chain.length; i++) {
      const seg = segments[chain[i]];
      
      // Determine if we need to reverse this segment
      let points = [...seg.points];
      
      if (i > 0 && allPoints.length > 0) {
        const lastPoint = allPoints[allPoints.length - 1];
        const segStart = points[0];
        const segEnd = points[points.length - 1];
        
        // If segment end connects to our chain, reverse it
        if (vectorEquals(lastPoint, segEnd)) {
          points = points.reverse();
        }
      }
      
      // Add points, avoiding duplicates
      for (const p of points) {
        const key = vectorToKey(p);
        if (!seenPoints.has(key)) {
          seenPoints.add(key);
          allPoints.push(p);
        }
      }
    }

    // Compute direction from first to last point
    const direction = allPoints.length >= 2
      ? vectorNormalize({
          x: allPoints[allPoints.length - 1].x - allPoints[0].x,
          y: allPoints[allPoints.length - 1].y - allPoints[0].y,
          z: allPoints[allPoints.length - 1].z - allPoints[0].z
        })
      : segments[chain[0]].direction;

    return {
      id: `merged_${chain.map(i => segments[i].id).join('_')}`,
      points: allPoints,
      direction,
      length: allPoints.length,
      plane: segments[chain[0]].plane
    };
  }
}
