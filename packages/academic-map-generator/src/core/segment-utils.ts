/**
 * Segment Utilities
 * 
 * Functions for analyzing and manipulating path segments.
 */

import type { Coord, Segment, SegmentAnalysis } from './types';
import { coordsEqual, coordToKey, manhattanDistance, subCoords, normalize } from './geometry';

// ============================================================================
// SEGMENT DETECTION
// ============================================================================

/**
 * Compute segments from a path of coordinates
 * Segments are created when direction changes
 * 
 * @param pathCoords - Ordered list of path coordinates
 * @returns Array of segments where each segment is an array of coordinates
 */
export function computeSegments(pathCoords: Coord[]): Coord[][] {
  if (pathCoords.length < 2) {
    return pathCoords.length === 1 ? [[pathCoords[0]]] : [];
  }

  const segments: Coord[][] = [];
  let currentSegment: Coord[] = [pathCoords[0]];
  let currentDir = getDirection(pathCoords[0], pathCoords[1]);

  for (let i = 1; i < pathCoords.length; i++) {
    const coord = pathCoords[i];
    
    if (i < pathCoords.length - 1) {
      const nextDir = getDirection(coord, pathCoords[i + 1]);
      
      if (!coordsEqual(currentDir, nextDir)) {
        // Direction change - end current segment
        currentSegment.push(coord);
        segments.push(currentSegment);
        
        // Start new segment from this point
        currentSegment = [coord];
        currentDir = nextDir;
      } else {
        currentSegment.push(coord);
      }
    } else {
      // Last point
      currentSegment.push(coord);
    }
  }

  if (currentSegment.length > 0) {
    segments.push(currentSegment);
  }

  return segments;
}

/**
 * Get normalized direction from point a to point b
 */
function getDirection(a: Coord, b: Coord): Coord {
  const diff = subCoords(b, a);
  return normalize(diff);
}

/**
 * Convert raw coordinate arrays to Segment objects with metadata
 */
export function createSegments(rawSegments: Coord[][]): Segment[] {
  return rawSegments.map((points, idx) => {
    const direction = points.length >= 2 
      ? getDirection(points[0], points[1])
      : [0, 0, 0] as Coord;
    
    const plane = detectPlane(points);
    
    return {
      id: `seg_${idx}`,
      points,
      direction,
      length: points.length,
      plane
    };
  });
}

/**
 * Detect which plane a segment lies on
 */
function detectPlane(points: Coord[]): 'xy' | 'xz' | 'yz' | '3d' {
  if (points.length < 2) return 'xz';
  
  let xVaries = false, yVaries = false, zVaries = false;
  
  for (let i = 1; i < points.length; i++) {
    if (points[i][0] !== points[0][0]) xVaries = true;
    if (points[i][1] !== points[0][1]) yVaries = true;
    if (points[i][2] !== points[0][2]) zVaries = true;
  }
  
  if (xVaries && yVaries && zVaries) return '3d';
  if (!zVaries) return 'xy';
  if (!yVaries) return 'xz';
  if (!xVaries) return 'yz';
  return '3d';
}

// ============================================================================
// SEGMENT ANALYSIS
// ============================================================================

/**
 * Analyze segments to produce segment analysis metadata
 */
export function analyzeSegments(segments: Coord[][]): SegmentAnalysis {
  if (segments.length === 0) {
    return {
      count: 0,
      lengths: [],
      min_length: 0,
      max_length: 0,
      min_valid_range: 0,
      total_valid_slots: 0
    };
  }

  const lengths = segments.map(s => s.length);
  const minLength = Math.min(...lengths);
  const maxLength = Math.max(...lengths);
  const avgLength = lengths.reduce((a, b) => a + b, 0) / lengths.length;
  
  // Valid slots: positions that can have items (exclude start/end of each segment)
  const validSlots = segments.reduce((total, seg) => {
    return total + Math.max(0, seg.length - 2);
  }, 0);

  return {
    count: segments.length,
    lengths,
    min_length: minLength,
    max_length: maxLength,
    min_valid_range: minLength >= 2 ? 2 : minLength,
    total_valid_slots: validSlots,
    types: segments.map(s => s.length === 1 ? 'point' : 'line'),
    avg_length: avgLength
  };
}

/**
 * Find segments that are symmetric (same length, parallel)
 */
export function findSymmetricSegments(segments: Segment[]): Array<[string, string]> {
  const pairs: Array<[string, string]> = [];
  
  for (let i = 0; i < segments.length; i++) {
    for (let j = i + 1; j < segments.length; j++) {
      const a = segments[i];
      const b = segments[j];
      
      // Same length
      if (a.length !== b.length) continue;
      
      // Same or opposite direction (parallel)
      if (coordsEqual(a.direction, b.direction) ||
          coordsEqual(a.direction, [-b.direction[0], -b.direction[1], -b.direction[2]])) {
        pairs.push([a.id, b.id]);
      }
    }
  }
  
  return pairs;
}

// ============================================================================
// SEGMENT MERGING
// ============================================================================

/**
 * Merge short segments that are collinear
 * 
 * @param segments - List of segments
 * @param minLength - Minimum length to keep as separate segment
 */
export function mergeShortSegments(segments: Segment[], minLength: number = 2): {
  merged: Segment[];
  kept: Segment[];
} {
  const merged: Segment[] = [];
  const kept: Segment[] = [];
  
  let i = 0;
  while (i < segments.length) {
    const seg = segments[i];
    
    if (seg.length >= minLength) {
      merged.push(seg);
      i++;
      continue;
    }
    
    // Try to merge with next segment if collinear
    if (i + 1 < segments.length) {
      const next = segments[i + 1];
      
      if (coordsEqual(seg.direction, next.direction)) {
        // Merge: combine points
        const combinedPoints = [...seg.points];
        // Skip first point of next to avoid duplicate
        for (let j = 1; j < next.points.length; j++) {
          combinedPoints.push(next.points[j]);
        }
        
        merged.push({
          id: `${seg.id}_${next.id}`,
          points: combinedPoints,
          direction: seg.direction,
          length: combinedPoints.length,
          plane: seg.plane
        });
        
        i += 2; // Skip both segments
        continue;
      }
    }
    
    // Keep short segment as is (might be important corner)
    kept.push(seg);
    merged.push(seg);
    i++;
  }
  
  return { merged, kept };
}

// ============================================================================
// SEGMENT FILTERING
// ============================================================================

/**
 * Get valid placement positions within segments
 * Excludes start and end positions (typically occupied by player/goal)
 */
export function getPlacementPositions(
  segments: Coord[][],
  startPos: Coord,
  targetPos: Coord
): Coord[] {
  const positions: Coord[] = [];
  const startKey = coordToKey(startPos);
  const targetKey = coordToKey(targetPos);
  
  for (const segment of segments) {
    for (const coord of segment) {
      const key = coordToKey(coord);
      if (key !== startKey && key !== targetKey) {
        positions.push(coord);
      }
    }
  }
  
  return positions;
}

/**
 * Get interval positions (every N steps)
 */
export function getIntervalPositions(segment: Coord[], interval: number, offset: number = 0): Coord[] {
  const positions: Coord[] = [];
  
  for (let i = offset; i < segment.length; i += interval) {
    positions.push(segment[i]);
  }
  
  return positions;
}
