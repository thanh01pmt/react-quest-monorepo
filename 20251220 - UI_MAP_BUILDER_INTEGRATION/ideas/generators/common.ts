/**
 * Common Types and Helpers for all generators
 */

import type { Vector3, PathSegment, PlacementContext, PathRelation } from '../MapAnalyzer';
import type { 
  AcademicConcept, 
  ItemType, 
  ItemPlacement, 
  AcademicPlacement, 
  ExpectedSolution 
} from '../AcademicConceptTypes';
import { CONCEPT_CURRICULUM, createDefaultSolution } from '../AcademicConceptTypes';

// Re-export types
export type { 
  Vector3, 
  PathSegment, 
  PlacementContext, 
  PathRelation,
  AcademicConcept, 
  ItemType, 
  ItemPlacement, 
  AcademicPlacement, 
  ExpectedSolution 
};

export { CONCEPT_CURRICULUM, createDefaultSolution };

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

export function vectorEquals(a: Vector3, b: Vector3): boolean {
  return a.x === b.x && a.y === b.y && a.z === b.z;
}

export function vectorKey(v: Vector3): string {
  return `${v.x},${v.y},${v.z}`;
}

export function vectorDistance(a: Vector3, b: Vector3): number {
  return Math.sqrt(
    Math.pow(a.x - b.x, 2) + 
    Math.pow(a.y - b.y, 2) + 
    Math.pow(a.z - b.z, 2)
  );
}

export function getPointsOnSegment(segment: PathSegment, interval: number, offset: number = 0): Vector3[] {
  const result: Vector3[] = [];
  for (let i = offset; i < segment.points.length; i += interval) {
    result.push(segment.points[i]);
  }
  return result;
}

export function getEndpoints(segment: PathSegment): [Vector3, Vector3] {
  return [segment.points[0], segment.points[segment.points.length - 1]];
}

export function getMainSegment(context: PlacementContext): PathSegment | undefined {
  if (context.segments.length === 0) return undefined;
  return context.segments.reduce((max, s) => s.length > max.length ? s : max, context.segments[0]);
}

export function getMidpoint(points: Vector3[]): Vector3 {
  if (points.length === 0) return { x: 0, y: 0, z: 0 };
  const sum = points.reduce((acc, p) => ({ 
    x: acc.x + p.x, 
    y: acc.y + p.y, 
    z: acc.z + p.z 
  }), { x: 0, y: 0, z: 0 });
  return {
    x: Math.round(sum.x / points.length),
    y: Math.round(sum.y / points.length),
    z: Math.round(sum.z / points.length)
  };
}

export function getSegmentById(context: PlacementContext, id: string): PathSegment | undefined {
  return context.segments.find(s => s.id === id);
}

export function getRelatedSegments(
  context: PlacementContext, 
  segmentId: string, 
  relationType: string
): PathSegment[] {
  const relations = context.relations.filter(
    r => r.type === relationType && (r.path1Id === segmentId || r.path2Id === segmentId)
  );
  
  return relations.map(r => {
    const otherId = r.path1Id === segmentId ? r.path2Id : r.path1Id;
    return context.segments.find(s => s.id === otherId);
  }).filter((s): s is PathSegment => s !== undefined);
}

export function getSymmetricPairs(context: PlacementContext): [PathSegment, PathSegment][] {
  const pairs: [PathSegment, PathSegment][] = [];
  const usedIds = new Set<string>();
  
  for (const rel of context.relations) {
    if (rel.type !== 'axis_symmetric' && rel.type !== 'point_symmetric') continue;
    if (usedIds.has(rel.path1Id) || usedIds.has(rel.path2Id)) continue;
    
    const seg1 = context.segments.find(s => s.id === rel.path1Id);
    const seg2 = context.segments.find(s => s.id === rel.path2Id);
    
    if (seg1 && seg2) {
      pairs.push([seg1, seg2]);
      usedIds.add(rel.path1Id);
      usedIds.add(rel.path2Id);
    }
  }
  
  return pairs;
}

export function getParallelGroups(context: PlacementContext): PathSegment[][] {
  const groups: PathSegment[][] = [];
  const usedIds = new Set<string>();
  
  for (const rel of context.relations) {
    if (rel.type !== 'parallel_axis') continue;
    
    const seg1 = context.segments.find(s => s.id === rel.path1Id);
    const seg2 = context.segments.find(s => s.id === rel.path2Id);
    
    if (!seg1 || !seg2) continue;
    if (usedIds.has(seg1.id) && usedIds.has(seg2.id)) continue;
    
    // Find or create group
    let foundGroup = false;
    for (const group of groups) {
      if (group.some(s => s.id === seg1.id || s.id === seg2.id)) {
        if (!group.some(s => s.id === seg1.id)) group.push(seg1);
        if (!group.some(s => s.id === seg2.id)) group.push(seg2);
        usedIds.add(seg1.id);
        usedIds.add(seg2.id);
        foundGroup = true;
        break;
      }
    }
    
    if (!foundGroup) {
      groups.push([seg1, seg2]);
      usedIds.add(seg1.id);
      usedIds.add(seg2.id);
    }
  }
  
  return groups;
}

export function getPerpendicularBranches(
  context: PlacementContext, 
  mainSegmentId: string
): PathSegment[] {
  return context.relations
    .filter(r => 
      r.type === 'perpendicular' && 
      (r.path1Id === mainSegmentId || r.path2Id === mainSegmentId)
    )
    .map(r => {
      const otherId = r.path1Id === mainSegmentId ? r.path2Id : r.path1Id;
      return context.segments.find(s => s.id === otherId);
    })
    .filter((s): s is PathSegment => s !== undefined);
}

export function findJunctionPoints(context: PlacementContext): Map<string, string[]> {
  const junctions = new Map<string, string[]>();
  
  for (const segment of context.segments) {
    const [start, end] = getEndpoints(segment);
    const startKey = vectorKey(start);
    const endKey = vectorKey(end);
    
    if (!junctions.has(startKey)) junctions.set(startKey, []);
    if (!junctions.has(endKey)) junctions.set(endKey, []);
    
    junctions.get(startKey)!.push(segment.id);
    junctions.get(endKey)!.push(segment.id);
  }
  
  // Filter to only branching points (3+ segments)
  const result = new Map<string, string[]>();
  Array.from(junctions.entries()).forEach(([key, ids]) => {
    if (ids.length >= 3) {
      result.set(key, ids);
    }
  });
  
  return result;
}

export function parseVectorKey(key: string): Vector3 {
  const [x, y, z] = key.split(',').map(Number);
  return { x, y, z };
}
