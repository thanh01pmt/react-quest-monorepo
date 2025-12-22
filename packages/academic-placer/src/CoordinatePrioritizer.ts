/**
 * CoordinatePrioritizer - Priority Scoring for Map Coordinates
 * 
 * Đánh ưu tiên các coords dựa trên:
 * 1. Topology type → Key positions đặc trưng
 * 2. MapAnalyzer output → Segment relations, junctions
 * 3. Structural importance → Endpoints, centers, symmetry points
 * 
 * Kết quả: Mỗi coord có priority score + reason
 */

import type { Vector3, PlacementContext, PathSegment } from './MapAnalyzer';
import type { TopologyType } from './PlacementStrategy';
import { analyzeMapMetrics } from './PlacementStrategy';

// ============================================================================
// TYPES
// ============================================================================

export interface PrioritizedCoord {
  position: Vector3;
  priority: number;          // 1-10 (10 = highest priority)
  category: CoordCategory;
  reasons: string[];
  segmentId?: string;
  relatedCoords?: Vector3[]; // Other coords that form a pattern with this one
}

export type CoordCategory = 
  | 'critical'      // Must have item (e.g., junction, goal)
  | 'important'     // Should have item (e.g., endpoints, symmetric points)
  | 'recommended'   // Good to have (e.g., regular intervals)
  | 'optional'      // Can have (e.g., filler positions)
  | 'avoid';        // Should NOT have item (e.g., start position, blocked)

export interface TopologyKeyPoints {
  topology: TopologyType;
  description: string;
  keyPositionRules: KeyPositionRule[];
}

export interface KeyPositionRule {
  name: string;
  category: CoordCategory;
  basePriority: number;
  description: string;
  matcher: (context: PlacementContext, center: Vector3) => Vector3[];
}

// ============================================================================
// TOPOLOGY-SPECIFIC KEY POINTS
// ============================================================================

/**
 * Key positions by topology type
 */
const TOPOLOGY_KEY_POINTS: Record<TopologyType, {
  description: string;
  criticalPoints: string[];
  importantPoints: string[];
  patternHint: string;
}> = {
  linear: {
    description: 'Đường thẳng - ưu tiên đầu/cuối và khoảng cách đều',
    criticalPoints: ['endpoint_goal'],
    importantPoints: ['interval_points'],
    patternHint: 'Đặt crystal cách đều dọc đường'
  },
  l_shape: {
    description: 'L-shape - ưu tiên góc và 2 đầu',
    criticalPoints: ['corner_point', 'endpoint_1', 'endpoint_2'],
    importantPoints: ['mid_segment_1', 'mid_segment_2'],
    patternHint: 'Đặt tại góc L và 2 điểm cuối'
  },
  u_shape: {
    description: 'U-shape - ưu tiên 2 đầu đối xứng và đáy',
    criticalPoints: ['symmetric_endpoint_1', 'symmetric_endpoint_2', 'bottom_center'],
    importantPoints: ['arm_midpoints'],
    patternHint: 'Đặt đối xứng qua đáy U'
  },
  t_shape: {
    description: 'T-shape - ưu tiên junction và 3 đầu',
    criticalPoints: ['junction', 'endpoint_1', 'endpoint_2', 'endpoint_3'],
    importantPoints: ['branch_midpoints'],
    patternHint: 'Đặt switch tại junction, crystal ở 3 đầu'
  },
  cross: {
    description: 'Cross/+ - ưu tiên tâm và 4 đầu',
    criticalPoints: ['center_junction'],
    importantPoints: ['endpoint_north', 'endpoint_south', 'endpoint_east', 'endpoint_west'],
    patternHint: 'Đặt switch tại tâm, crystal đối xứng ở 4 hướng'
  },
  arrow: {
    description: 'Arrow - ưu tiên tip, wing ends, shaft',
    criticalPoints: ['arrow_tip', 'wing_end_left', 'wing_end_right'],
    importantPoints: ['shaft_center', 'wing_joint'],
    patternHint: 'Crystal ở tip và 2 cánh, switch tại joint'
  },
  spiral: {
    description: 'Spiral - ưu tiên tâm và điểm đầu xoắn',
    criticalPoints: ['spiral_center', 'spiral_outer_end'],
    importantPoints: ['spiral_turns'],
    patternHint: 'Goal ở tâm, crystal theo vòng xoắn'
  },
  grid: {
    description: 'Grid 2D - ưu tiên 4 góc và tâm',
    criticalPoints: ['corner_tl', 'corner_tr', 'corner_bl', 'corner_br', 'grid_center'],
    importantPoints: ['edge_midpoints', 'row_ends', 'col_ends'],
    patternHint: 'Crystal ở các góc và theo pattern nested loop'
  },
  hub_spoke: {
    description: 'Hub & Spoke - ưu tiên hub và đầu các spoke',
    criticalPoints: ['hub_center'],
    importantPoints: ['spoke_ends'],
    patternHint: 'Switch tại hub, crystal ở cuối mỗi spoke'
  },
  complex_maze: {
    description: 'Complex maze - ưu tiên các junction và dead ends',
    criticalPoints: ['main_junctions'],
    importantPoints: ['dead_ends', 'branch_points'],
    patternHint: 'Switch tại junction, crystal ở dead ends'
  },
  unknown: {
    description: 'Unknown - dùng heuristics chung',
    criticalPoints: ['endpoints', 'junctions'],
    importantPoints: ['segment_midpoints'],
    patternHint: 'Phân bố đều theo segments'
  }
};

// ============================================================================
// PRIORITY CALCULATION
// ============================================================================

/**
 * Calculate priority for all coords in the map
 */
export function prioritizeCoordinates(
  context: PlacementContext,
  topology?: TopologyType
): PrioritizedCoord[] {
  const metrics = analyzeMapMetrics(context);
  const detectedTopology = topology || metrics.detectedTopology || 'unknown';
  const center = metrics.center;
  
  const prioritized: PrioritizedCoord[] = [];
  const scored = new Map<string, PrioritizedCoord>(); // key: "x,y,z"
  
  // Helper to add/update coord
  const addCoord = (
    pos: Vector3, 
    priority: number, 
    category: CoordCategory, 
    reason: string,
    segmentId?: string
  ) => {
    const key = `${pos.x},${pos.y},${pos.z}`;
    const existing = scored.get(key);
    
    if (existing) {
      // Take max priority, upgrade category if needed
      existing.priority = Math.max(existing.priority, priority);
      existing.reasons.push(reason);
      if (categoryRank(category) < categoryRank(existing.category)) {
        existing.category = category;
      }
    } else {
      scored.set(key, {
        position: { ...pos },
        priority,
        category,
        reasons: [reason],
        segmentId
      });
    }
  };
  
  // ========== 1. Endpoint Analysis ==========
  for (const segment of context.segments) {
    if (segment.points.length < 2) continue;
    
    const start = segment.points[0];
    const end = segment.points[segment.points.length - 1];
    
    // Segment endpoints are important
    addCoord(start, 7, 'important', 'Segment endpoint (start)', segment.id);
    addCoord(end, 7, 'important', 'Segment endpoint (end)', segment.id);
  }
  
  // ========== 2. Junction Analysis ==========
  const junctionCounts = new Map<string, { pos: Vector3; count: number; segments: string[] }>();
  
  for (const segment of context.segments) {
    if (segment.points.length < 2) continue;
    
    for (const point of [segment.points[0], segment.points[segment.points.length - 1]]) {
      const key = `${point.x},${point.y},${point.z}`;
      const existing = junctionCounts.get(key);
      
      if (existing) {
        existing.count++;
        existing.segments.push(segment.id);
      } else {
        junctionCounts.set(key, { pos: point, count: 1, segments: [segment.id] });
      }
    }
  }
  
  // Junctions (3+ segments meeting) are critical
  for (const [key, data] of junctionCounts) {
    if (data.count >= 3) {
      addCoord(data.pos, 10, 'critical', `Junction (${data.count} segments meet)`);
    } else if (data.count >= 2) {
      addCoord(data.pos, 8, 'important', `Connection point (${data.count} segments)`);
    }
  }
  
  // ========== 3. Symmetric Points ==========
  const symmetricRelations = context.relations.filter(
    r => r.type === 'axis_symmetric' || r.type === 'point_symmetric'
  );
  
  for (const rel of symmetricRelations) {
    const seg1 = context.segments.find(s => s.id === rel.path1Id);
    const seg2 = context.segments.find(s => s.id === rel.path2Id);
    
    if (seg1 && seg2) {
      // Endpoints of symmetric branches are important
      const end1 = seg1.points[seg1.points.length - 1];
      const end2 = seg2.points[seg2.points.length - 1];
      
      addCoord(end1, 9, 'important', 'Symmetric branch endpoint', seg1.id);
      addCoord(end2, 9, 'important', 'Symmetric branch endpoint (mirror)', seg2.id);
      
      // Add as related coords
      const key1 = `${end1.x},${end1.y},${end1.z}`;
      const coord1 = scored.get(key1);
      if (coord1) coord1.relatedCoords = [end2];
    }
  }
  
  // ========== 4. Topology-Specific Points ==========
  switch (detectedTopology) {
    case 'arrow': {
      // Arrow tip = furthest point from center on main segment
      const mainSeg = findLongestSegment(context.segments);
      if (mainSeg) {
        const tip = findFurthestFromCenter(mainSeg.points, center);
        addCoord(tip, 10, 'critical', 'Arrow tip (goal position)');
        
        // Wing ends
        const wings = context.segments.filter(s => s.id !== mainSeg.id);
        for (const wing of wings) {
          const wingEnd = findFurthestFromCenter(wing.points, center);
          addCoord(wingEnd, 9, 'important', 'Wing endpoint');
        }
      }
      break;
    }
    
    case 'cross': {
      // Center is critical
      addCoord(center, 10, 'critical', 'Cross center (junction)');
      
      // 4 endpoints
      for (const seg of context.segments) {
        const end = findFurthestFromCenter(seg.points, center);
        addCoord(end, 8, 'important', 'Cross arm endpoint');
      }
      break;
    }
    
    case 'u_shape': {
      // Bottom center
      const mainSeg = findLongestSegment(context.segments);
      if (mainSeg) {
        const midIdx = Math.floor(mainSeg.points.length / 2);
        addCoord(mainSeg.points[midIdx], 9, 'important', 'U-shape bottom center');
      }
      break;
    }
    
    case 't_shape': {
      // Find the junction (should already be marked)
      // Mark the 3 endpoints
      for (const seg of context.segments) {
        const end = findFurthestFromCenter(seg.points, center);
        addCoord(end, 8, 'important', 'T-shape branch endpoint');
      }
      break;
    }
    
    case 'grid': {
      // Find corners of bounding box
      const allPoints = context.segments.flatMap(s => s.points);
      const corners = findGridCorners(allPoints);
      for (const corner of corners) {
        addCoord(corner, 9, 'important', 'Grid corner');
      }
      // Grid center
      addCoord(center, 8, 'important', 'Grid center');
      break;
    }
    
    case 'spiral': {
      // Spiral center and outer end
      const mainSeg = findLongestSegment(context.segments);
      if (mainSeg) {
        // Inner end (closest to center)
        const inner = findClosestToCenter(mainSeg.points, center);
        addCoord(inner, 10, 'critical', 'Spiral center (goal)');
        
        // Outer end
        const outer = findFurthestFromCenter(mainSeg.points, center);
        addCoord(outer, 8, 'important', 'Spiral outer end (start)');
      }
      break;
    }
    
    case 'hub_spoke': {
      // Hub center
      addCoord(center, 10, 'critical', 'Hub center');
      
      // Spoke ends
      for (const seg of context.segments) {
        const end = findFurthestFromCenter(seg.points, center);
        addCoord(end, 8, 'important', 'Spoke endpoint');
      }
      break;
    }
    
    case 'complex_maze': {
      // Dead ends are important
      for (const seg of context.segments) {
        const start = seg.points[0];
        const end = seg.points[seg.points.length - 1];
        
        const startKey = `${start.x},${start.y},${start.z}`;
        const endKey = `${end.x},${end.y},${end.z}`;
        
        const startJunction = junctionCounts.get(startKey);
        const endJunction = junctionCounts.get(endKey);
        
        // If one end is not a junction, it's a dead end
        if (startJunction && startJunction.count === 1) {
          addCoord(start, 8, 'important', 'Dead end');
        }
        if (endJunction && endJunction.count === 1) {
          addCoord(end, 8, 'important', 'Dead end');
        }
      }
      break;
    }
    
    default: {
      // Linear and unknown - use segment midpoints
      for (const seg of context.segments) {
        if (seg.points.length >= 3) {
          const midIdx = Math.floor(seg.points.length / 2);
          addCoord(seg.points[midIdx], 6, 'recommended', 'Segment midpoint');
        }
      }
    }
  }
  
  // ========== 5. Interval Points (lower priority) ==========
  for (const seg of context.segments) {
    const interval = Math.max(2, Math.floor(seg.points.length / 4));
    for (let i = interval; i < seg.points.length - 1; i += interval) {
      const pos = seg.points[i];
      const key = `${pos.x},${pos.y},${pos.z}`;
      if (!scored.has(key)) {
        addCoord(pos, 4, 'optional', `Interval point (every ${interval} steps)`, seg.id);
      }
    }
  }
  
  // ========== 6. Mark Start Position as Avoid ==========
  // First point of first segment (assuming player starts here)
  if (context.segments.length > 0 && context.segments[0].points.length > 0) {
    const start = context.segments[0].points[0];
    addCoord(start, 1, 'avoid', 'Player start position');
  }
  
  // Convert to array and sort by priority
  prioritized.push(...scored.values());
  prioritized.sort((a, b) => b.priority - a.priority);
  
  return prioritized;
}

/**
 * Get top N priority coords
 */
export function getTopPriorityCoords(
  context: PlacementContext,
  maxCoords: number,
  topology?: TopologyType
): PrioritizedCoord[] {
  const all = prioritizeCoordinates(context, topology);
  
  // Filter out 'avoid' and take top N
  return all
    .filter(c => c.category !== 'avoid')
    .slice(0, maxCoords);
}

/**
 * Get coords by category
 */
export function getCoordsByCategory(
  context: PlacementContext,
  category: CoordCategory,
  topology?: TopologyType
): PrioritizedCoord[] {
  const all = prioritizeCoordinates(context, topology);
  return all.filter(c => c.category === category);
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function categoryRank(category: CoordCategory): number {
  const ranks: Record<CoordCategory, number> = {
    critical: 1,
    important: 2,
    recommended: 3,
    optional: 4,
    avoid: 5
  };
  return ranks[category];
}

function findLongestSegment(segments: PathSegment[]): PathSegment | undefined {
  return segments.reduce(
    (longest, seg) => seg.length > (longest?.length || 0) ? seg : longest,
    undefined as PathSegment | undefined
  );
}

function findFurthestFromCenter(points: Vector3[], center: Vector3): Vector3 {
  let maxDist = -1;
  let furthest = points[0];
  
  for (const p of points) {
    const dist = Math.abs(p.x - center.x) + Math.abs(p.z - center.z);
    if (dist > maxDist) {
      maxDist = dist;
      furthest = p;
    }
  }
  
  return furthest;
}

function findClosestToCenter(points: Vector3[], center: Vector3): Vector3 {
  let minDist = Infinity;
  let closest = points[0];
  
  for (const p of points) {
    const dist = Math.abs(p.x - center.x) + Math.abs(p.z - center.z);
    if (dist < minDist) {
      minDist = dist;
      closest = p;
    }
  }
  
  return closest;
}

function findGridCorners(points: Vector3[]): Vector3[] {
  if (points.length === 0) return [];
  
  const xs = points.map(p => p.x);
  const zs = points.map(p => p.z);
  
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minZ = Math.min(...zs);
  const maxZ = Math.max(...zs);
  const y = points[0].y;
  
  // Find actual points closest to corners
  const corners: Vector3[] = [];
  const targetCorners = [
    { x: minX, z: minZ }, // TL
    { x: maxX, z: minZ }, // TR  
    { x: minX, z: maxZ }, // BL
    { x: maxX, z: maxZ }, // BR
  ];
  
  for (const target of targetCorners) {
    const closest = points.reduce((best, p) => {
      const dist = Math.abs(p.x - target.x) + Math.abs(p.z - target.z);
      const bestDist = Math.abs(best.x - target.x) + Math.abs(best.z - target.z);
      return dist < bestDist ? p : best;
    }, points[0]);
    
    corners.push(closest);
  }
  
  return corners;
}

// ============================================================================
// EXPORTS
// ============================================================================

export { TOPOLOGY_KEY_POINTS };
