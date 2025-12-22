/**
 * PlacementStrategy - Smart Placement Constraints System
 * 
 * Xử lý các ràng buộc:
 * 1. Kích thước map → Pattern density
 * 2. Topology type → Academic priority
 * 3. Item/Block ratio
 * 4. Max code blocks limit
 * 5. Distribution strategy (spread, symmetric, clustered)
 */

import type { Vector3, PlacementContext, PathSegment } from './MapAnalyzer';
import type { AcademicPlacement, ItemPlacement, AcademicConcept } from './AcademicConceptTypes';

// ============================================================================
// TYPES
// ============================================================================

export interface MapMetrics {
  // Size metrics
  totalBlocks: number;
  boundingBox: { width: number; height: number; depth: number };
  area: number;           // width * depth
  estimatedSize: 'tiny' | 'small' | 'medium' | 'large' | 'huge';
  
  // Structure metrics
  segmentCount: number;
  areaCount: number;
  junctionCount: number;
  longestPathLength: number;
  
  // Center of map
  center: Vector3;
  
  // Topology hints (if detected)
  detectedTopology?: TopologyType;
}

export interface PlacementConstraints {
  // From map size
  maxItems: number;
  minItems: number;
  targetItemRatio: number;    // % of blocks that should have items
  
  // From topology
  preferredConcepts: AcademicConcept[];
  avoidConcepts: AcademicConcept[];
  
  // From block limit
  maxCodeBlocks: number;
  targetCodeBlocks: number;
  
  // Distribution strategy
  distribution: DistributionStrategy;
  
  // Interval constraints
  minInterval: number;        // Minimum steps between items
  maxInterval: number;        // Maximum steps between items
  preferredInterval: number;  // Optimal interval
}

export type TopologyType = 
  | 'linear'           // Straight line
  | 'l_shape'          // L-shape
  | 'u_shape'          // U-shape
  | 't_shape'          // T-shape
  | 'cross'            // + shape
  | 'arrow'            // Arrow with wings
  | 'spiral'           // Spiral
  | 'grid'             // 2D grid
  | 'hub_spoke'        // Central hub with branches
  | 'complex_maze'     // Complex branching
  | 'unknown';

export type DistributionStrategy =
  | 'spread'           // Evenly distributed across map
  | 'symmetric'        // Symmetric around center
  | 'clustered'        // Grouped in specific areas
  | 'endpoints'        // At segment endpoints
  | 'alternating'      // Alternating pattern
  | 'progressive';     // Density increases toward goal

export interface PlacementConfig {
  metrics: MapMetrics;
  constraints: PlacementConstraints;
}

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * Item density by map size
 */
const DENSITY_BY_SIZE = {
  tiny:   { ratio: 0.70, minItems: 2, maxItems: 6 },   // 3x3
  small:  { ratio: 0.50, minItems: 3, maxItems: 10 },  // 4x4-5x5
  medium: { ratio: 0.35, minItems: 4, maxItems: 15 },  // 6x6-7x7
  large:  { ratio: 0.25, minItems: 4, maxItems: 20 },  // 8x8-10x10
  huge:   { ratio: 0.15, minItems: 4, maxItems: 25 },  // 10x10+
};

/**
 * Topology academic characteristics
 */
const TOPOLOGY_CHARACTERISTICS: Record<TopologyType, {
  preferredConcepts: AcademicConcept[];
  avoidConcepts: AcademicConcept[];
  distribution: DistributionStrategy;
  description: string;
}> = {
  linear: {
    preferredConcepts: ['sequential', 'repeat_n', 'while_condition'],
    avoidConcepts: ['nested_loop', 'if_elif_else'],
    distribution: 'spread',
    description: 'Đường thẳng - tốt cho loop và sequential'
  },
  l_shape: {
    preferredConcepts: ['sequential', 'repeat_n', 'procedure_simple'],
    avoidConcepts: ['nested_loop', 'for_each'],
    distribution: 'endpoints',
    description: 'L-shape - tốt cho sequential và simple procedures'
  },
  u_shape: {
    preferredConcepts: ['procedure_simple', 'repeat_n', 'loop_function_call'],
    avoidConcepts: ['nested_if', 'for_each'],
    distribution: 'symmetric',
    description: 'U-shape - 2 nhánh đối xứng, tốt cho function reuse'
  },
  t_shape: {
    preferredConcepts: ['if_else', 'procedure_simple', 'conditional_function_call'],
    avoidConcepts: ['nested_loop'],
    distribution: 'symmetric',
    description: 'T-shape - có 3 nhánh, tốt cho conditional'
  },
  cross: {
    preferredConcepts: ['if_else', 'procedure_simple', 'loop_function_call', 'repeat_n'],
    avoidConcepts: ['for_each'],
    distribution: 'symmetric',
    description: 'Cross - 4 nhánh đối xứng, lý tưởng cho function reuse'
  },
  arrow: {
    preferredConcepts: ['procedure_simple', 'loop_function_call', 'repeat_n'],
    avoidConcepts: ['nested_loop', 'for_each'],
    distribution: 'symmetric',
    description: 'Arrow - thân + 2-4 cánh, tốt cho procedure + loop'
  },
  spiral: {
    preferredConcepts: ['while_condition', 'repeat_until', 'counter', 'while_counter'],
    avoidConcepts: ['procedure_simple', 'if_elif_else'],
    distribution: 'progressive',
    description: 'Spiral - đường xoắn, tốt cho while loops'
  },
  grid: {
    preferredConcepts: ['nested_loop', 'repeat_n', 'for_each'],
    avoidConcepts: ['recursion'],
    distribution: 'spread',
    description: 'Grid - lưới 2D, lý tưởng cho nested loops'
  },
  hub_spoke: {
    preferredConcepts: ['procedure_simple', 'loop_function_call', 'for_each'],
    avoidConcepts: ['nested_loop'],
    distribution: 'symmetric',
    description: 'Hub & Spoke - trung tâm + các nhánh, tốt cho function'
  },
  complex_maze: {
    preferredConcepts: ['recursion', 'if_else', 'while_condition', 'flag'],
    avoidConcepts: ['repeat_n'],
    distribution: 'clustered',
    description: 'Complex maze - nhiều nhánh, tốt cho recursion/DFS'
  },
  unknown: {
    preferredConcepts: ['sequential', 'repeat_n'],
    avoidConcepts: [],
    distribution: 'spread',
    description: 'Unknown topology'
  }
};

/**
 * Estimated code blocks per concept (after optimization)
 */
const CODE_BLOCKS_ESTIMATE: Record<AcademicConcept, { min: number; max: number; avg: number }> = {
  // Sequential
  sequential: { min: 3, max: 10, avg: 5 },
  
  // Loop
  repeat_n: { min: 3, max: 6, avg: 4 },
  repeat_until: { min: 4, max: 8, avg: 6 },
  while_condition: { min: 4, max: 8, avg: 6 },
  for_each: { min: 5, max: 10, avg: 7 },
  infinite_loop: { min: 5, max: 10, avg: 7 },
  nested_loop: { min: 6, max: 12, avg: 8 },
  
  // Conditional
  if_simple: { min: 3, max: 6, avg: 4 },
  if_else: { min: 4, max: 8, avg: 6 },
  if_elif_else: { min: 6, max: 12, avg: 9 },
  switch_case: { min: 6, max: 14, avg: 10 },
  nested_if: { min: 6, max: 12, avg: 9 },
  
  // Variable
  counter: { min: 4, max: 8, avg: 6 },
  state_toggle: { min: 4, max: 8, avg: 6 },
  accumulator: { min: 5, max: 10, avg: 7 },
  flag: { min: 4, max: 8, avg: 6 },
  collection: { min: 6, max: 12, avg: 9 },
  
  // Function
  procedure_simple: { min: 5, max: 10, avg: 7 },
  procedure_with_param: { min: 7, max: 14, avg: 10 },
  function_return: { min: 8, max: 16, avg: 12 },
  function_compose: { min: 10, max: 20, avg: 15 },
  recursion: { min: 6, max: 12, avg: 8 },
  
  // Advanced
  pattern_recognition: { min: 3, max: 8, avg: 5 },
  optimization: { min: 4, max: 10, avg: 6 },
  abstraction: { min: 5, max: 12, avg: 8 },
  decomposition: { min: 6, max: 14, avg: 10 },
  
  // Combinations
  repeat_n_counter: { min: 5, max: 10, avg: 7 },
  while_counter: { min: 6, max: 12, avg: 8 },
  repeat_until_state: { min: 6, max: 12, avg: 8 },
  for_each_accumulator: { min: 8, max: 14, avg: 10 },
  loop_if_inside: { min: 5, max: 10, avg: 7 },
  if_loop_inside: { min: 6, max: 12, avg: 8 },
  loop_break: { min: 5, max: 10, avg: 7 },
  function_loop_inside: { min: 7, max: 14, avg: 10 },
  loop_function_call: { min: 6, max: 12, avg: 8 },
  function_if_inside: { min: 7, max: 14, avg: 10 },
  conditional_function_call: { min: 8, max: 16, avg: 12 },
  nested_conditional: { min: 8, max: 16, avg: 12 },
  nested_function: { min: 10, max: 18, avg: 14 },
  loop_if_function: { min: 10, max: 18, avg: 14 },
  function_loop_if: { min: 10, max: 18, avg: 14 },
};

// ============================================================================
// ANALYSIS FUNCTIONS
// ============================================================================

/**
 * Analyze map and compute metrics
 */
export function analyzeMapMetrics(context: PlacementContext): MapMetrics {
  // Calculate bounding box
  const allPoints = context.segments.flatMap(s => s.points);
  
  if (allPoints.length === 0) {
    return {
      totalBlocks: 0,
      boundingBox: { width: 0, height: 0, depth: 0 },
      area: 0,
      estimatedSize: 'tiny',
      segmentCount: 0,
      areaCount: 0,
      junctionCount: 0,
      longestPathLength: 0,
      center: { x: 0, y: 0, z: 0 }
    };
  }
  
  const xs = allPoints.map(p => p.x);
  const ys = allPoints.map(p => p.y);
  const zs = allPoints.map(p => p.z);
  
  const minX = Math.min(...xs);
  const maxX = Math.max(...xs);
  const minY = Math.min(...ys);
  const maxY = Math.max(...ys);
  const minZ = Math.min(...zs);
  const maxZ = Math.max(...zs);
  
  const width = maxX - minX + 1;
  const height = maxY - minY + 1;
  const depth = maxZ - minZ + 1;
  const area = width * depth;
  
  // Estimate size category based on total blocks (not just dimension)
  let estimatedSize: MapMetrics['estimatedSize'];
  
  if (area <= 9) estimatedSize = 'tiny';           // 3x3 = 9
  else if (area <= 25) estimatedSize = 'small';    // 4x4-5x5 = 16-25
  else if (area <= 49) estimatedSize = 'medium';   // 6x6-7x7 = 36-49
  else if (area <= 100) estimatedSize = 'large';   // 8x8-10x10 = 64-100
  else estimatedSize = 'huge';                     // 10x10+
  
  // Count junctions
  const pointCounts = new Map<string, number>();
  for (const segment of context.segments) {
    for (const point of [segment.points[0], segment.points[segment.points.length - 1]]) {
      const key = `${point.x},${point.y},${point.z}`;
      pointCounts.set(key, (pointCounts.get(key) || 0) + 1);
    }
  }
  const junctionCount = Array.from(pointCounts.values()).filter(c => c >= 3).length;
  
  // Find longest path
  const longestPathLength = context.segments.reduce(
    (max, s) => Math.max(max, s.length), 0
  );
  
  // Detect topology
  const detectedTopology = detectTopology(context, junctionCount);
  
  // Calculate total blocks (approximate from segments)
  const totalBlocks = context.areas.reduce((sum, a) => sum + a.blocks.length, 0) 
    || allPoints.length;
  
  return {
    totalBlocks,
    boundingBox: { width, height, depth },
    area,
    estimatedSize,
    segmentCount: context.segments.length,
    areaCount: context.areas.length,
    junctionCount,
    longestPathLength,
    center: {
      x: Math.round((minX + maxX) / 2),
      y: Math.round((minY + maxY) / 2),
      z: Math.round((minZ + maxZ) / 2)
    },
    detectedTopology
  };
}

/**
 * Detect topology type from context
 */
function detectTopology(context: PlacementContext, junctionCount: number): TopologyType {
  const segments = context.segments;
  const relations = context.relations;
  
  // Single segment = linear
  if (segments.length === 1 && junctionCount === 0) {
    return 'linear';
  }
  
  // Check for symmetric patterns
  const symmetricCount = relations.filter(
    r => r.type === 'axis_symmetric' || r.type === 'point_symmetric'
  ).length;
  
  const perpendicularCount = relations.filter(r => r.type === 'perpendicular').length;
  const parallelCount = relations.filter(r => r.type === 'parallel_axis').length;
  
  // Grid detection
  if (parallelCount >= 4 && segments.length >= 4) {
    return 'grid';
  }
  
  // Cross/Arrow detection
  if (symmetricCount >= 2 && perpendicularCount >= 4) {
    if (segments.length >= 4) return 'cross';
    if (segments.length >= 3) return 'arrow';
  }
  
  // T-shape detection
  if (junctionCount === 1 && segments.length === 3) {
    return 't_shape';
  }
  
  // U-shape detection
  if (symmetricCount === 1 && segments.length === 3) {
    return 'u_shape';
  }
  
  // L-shape detection
  if (segments.length === 2 && perpendicularCount === 1) {
    return 'l_shape';
  }
  
  // Hub and spoke detection
  if (junctionCount === 1 && segments.length >= 4) {
    return 'hub_spoke';
  }
  
  // Complex maze
  if (junctionCount >= 3 || segments.length >= 6) {
    return 'complex_maze';
  }
  
  // Spiral detection (long winding path)
  const longestPath = segments.reduce((max, s) => s.length > max.length ? s : max, segments[0]);
  if (longestPath && longestPath.length >= 15 && junctionCount === 0) {
    return 'spiral';
  }
  
  return 'unknown';
}

/**
 * Calculate placement constraints from metrics
 */
export function calculateConstraints(metrics: MapMetrics): PlacementConstraints {
  const density = DENSITY_BY_SIZE[metrics.estimatedSize];
  const topoChar = TOPOLOGY_CHARACTERISTICS[metrics.detectedTopology || 'unknown'];
  
  // Calculate max items based on total blocks and ratio
  const calculatedMaxItems = Math.floor(metrics.totalBlocks * density.ratio);
  const maxItems = Math.min(
    Math.max(calculatedMaxItems, density.minItems),
    density.maxItems
  );
  
  // Calculate interval based on longest path and max items
  const preferredInterval = metrics.longestPathLength > 0 
    ? Math.ceil(metrics.longestPathLength / maxItems)
    : 2;
  
  return {
    maxItems,
    minItems: density.minItems,
    targetItemRatio: density.ratio,
    
    preferredConcepts: topoChar.preferredConcepts,
    avoidConcepts: topoChar.avoidConcepts,
    
    maxCodeBlocks: 30,
    targetCodeBlocks: 20,
    
    distribution: topoChar.distribution,
    
    minInterval: Math.max(1, preferredInterval - 1),
    maxInterval: preferredInterval + 2,
    preferredInterval
  };
}

/**
 * Create full placement config
 */
export function createPlacementConfig(context: PlacementContext): PlacementConfig {
  const metrics = analyzeMapMetrics(context);
  const constraints = calculateConstraints(metrics);
  return { metrics, constraints };
}

// ============================================================================
// FILTERING / OPTIMIZATION FUNCTIONS
// ============================================================================

/**
 * Filter and optimize placements based on constraints
 */
export function filterPlacements(
  placements: AcademicPlacement[],
  config: PlacementConfig
): AcademicPlacement[] {
  const { metrics, constraints } = config;
  
  // Step 1: Filter by preferred/avoided concepts
  let filtered = placements.filter(p => {
    // Boost preferred concepts
    const isPreferred = constraints.preferredConcepts.includes(p.primaryConcept);
    const isAvoided = constraints.avoidConcepts.includes(p.primaryConcept);
    
    if (isAvoided) return false;
    return true;
  });
  
  // Step 2: Filter by estimated code blocks
  filtered = filtered.filter(p => {
    const estimate = CODE_BLOCKS_ESTIMATE[p.primaryConcept];
    if (!estimate) return true;
    return estimate.avg <= constraints.maxCodeBlocks;
  });
  
  // Step 3: Sort by relevance
  filtered.sort((a, b) => {
    // Preferred concepts first
    const aPreferred = constraints.preferredConcepts.includes(a.primaryConcept) ? -10 : 0;
    const bPreferred = constraints.preferredConcepts.includes(b.primaryConcept) ? -10 : 0;
    
    // Then by difficulty (appropriate for map size)
    const targetDifficulty = metrics.estimatedSize === 'tiny' ? 2 
      : metrics.estimatedSize === 'small' ? 3
      : metrics.estimatedSize === 'medium' ? 5
      : 6;
    
    const aDiffScore = Math.abs(a.difficulty - targetDifficulty);
    const bDiffScore = Math.abs(b.difficulty - targetDifficulty);
    
    return (aPreferred + aDiffScore) - (bPreferred + bDiffScore);
  });
  
  return filtered;
}

/**
 * Adjust item positions to meet density constraints
 */
export function adjustItemDensity(
  placement: AcademicPlacement,
  config: PlacementConfig
): AcademicPlacement {
  const { constraints } = config;
  
  // If items within limits, return as-is
  if (placement.items.length <= constraints.maxItems && 
      placement.items.length >= constraints.minItems) {
    return placement;
  }
  
  let adjustedItems = [...placement.items];
  
  // Too many items - thin out
  if (adjustedItems.length > constraints.maxItems) {
    adjustedItems = thinOutItems(adjustedItems, constraints.maxItems, config);
  }
  
  // Too few items - handled by generator (can't add items without map knowledge)
  
  return {
    ...placement,
    items: adjustedItems
  };
}

/**
 * Thin out items to meet max limit while maintaining distribution
 */
function thinOutItems(
  items: ItemPlacement[],
  maxItems: number,
  config: PlacementConfig
): ItemPlacement[] {
  if (items.length <= maxItems) return items;
  
  const { distribution } = config.constraints;
  const { center } = config.metrics;
  
  switch (distribution) {
    case 'symmetric': {
      // Keep items symmetric around center
      const scored = items.map(item => ({
        item,
        distFromCenter: Math.abs(item.position.x - center.x) + Math.abs(item.position.z - center.z)
      }));
      scored.sort((a, b) => a.distFromCenter - b.distFromCenter);
      
      // Keep every nth item, prioritizing center
      const interval = Math.ceil(items.length / maxItems);
      return scored.filter((_, i) => i % interval === 0).slice(0, maxItems).map(s => s.item);
    }
    
    case 'spread': {
      // Keep items evenly distributed
      const interval = Math.ceil(items.length / maxItems);
      return items.filter((_, i) => i % interval === 0).slice(0, maxItems);
    }
    
    case 'endpoints': {
      // Keep first and last, then evenly space the rest
      if (items.length <= 2) return items;
      
      const result = [items[0], items[items.length - 1]];
      const middle = items.slice(1, -1);
      const interval = Math.ceil(middle.length / (maxItems - 2));
      
      for (let i = 0; i < middle.length && result.length < maxItems; i += interval) {
        result.push(middle[i]);
      }
      
      return result;
    }
    
    case 'progressive': {
      // Keep more items toward the end (goal)
      const result: ItemPlacement[] = [];
      const total = items.length;
      
      for (let i = 0; i < total && result.length < maxItems; i++) {
        // Progressive probability: more likely to keep later items
        const keepProbability = (i + 1) / total;
        if (Math.random() < keepProbability || result.length < 2) {
          result.push(items[i]);
        }
      }
      
      return result;
    }
    
    case 'clustered':
    case 'alternating':
    default: {
      // Default: evenly space
      const interval = Math.ceil(items.length / maxItems);
      return items.filter((_, i) => i % interval === 0).slice(0, maxItems);
    }
  }
}

/**
 * Validate placement meets all constraints
 */
export function validatePlacement(
  placement: AcademicPlacement,
  config: PlacementConfig
): { valid: boolean; issues: string[] } {
  const issues: string[] = [];
  const { metrics, constraints } = config;
  
  // Check item count
  if (placement.items.length > constraints.maxItems) {
    issues.push(`Too many items: ${placement.items.length} > ${constraints.maxItems}`);
  }
  if (placement.items.length < constraints.minItems) {
    issues.push(`Too few items: ${placement.items.length} < ${constraints.minItems}`);
  }
  
  // Check estimated code blocks
  const codeEstimate = CODE_BLOCKS_ESTIMATE[placement.primaryConcept];
  if (codeEstimate && codeEstimate.avg > constraints.maxCodeBlocks) {
    issues.push(`Code blocks too high: ~${codeEstimate.avg} > ${constraints.maxCodeBlocks}`);
  }
  
  // Check concept appropriateness
  if (constraints.avoidConcepts.includes(placement.primaryConcept)) {
    issues.push(`Concept not recommended for this topology: ${placement.primaryConcept}`);
  }
  
  return {
    valid: issues.length === 0,
    issues
  };
}

// ============================================================================
// INTERVAL CALCULATION
// ============================================================================

/**
 * Calculate optimal interval for items based on constraints
 */
export function calculateOptimalInterval(
  pathLength: number,
  config: PlacementConfig
): number {
  const { constraints } = config;
  
  // Calculate based on max items
  const fromMaxItems = Math.ceil(pathLength / constraints.maxItems);
  
  // Clamp to min/max interval
  return Math.min(
    Math.max(fromMaxItems, constraints.minInterval),
    constraints.maxInterval
  );
}

/**
 * Generate item positions with optimal spacing
 */
export function generateSpacedPositions(
  segment: PathSegment,
  config: PlacementConfig
): Vector3[] {
  const interval = calculateOptimalInterval(segment.length, config);
  const positions: Vector3[] = [];
  
  for (let i = 0; i < segment.points.length; i += interval) {
    positions.push(segment.points[i]);
  }
  
  // Ensure we have at least minItems if path is long enough
  if (positions.length < config.constraints.minItems && 
      segment.points.length >= config.constraints.minItems) {
    // Recalculate with smaller interval
    const newInterval = Math.floor(segment.points.length / config.constraints.minItems);
    positions.length = 0;
    for (let i = 0; i < segment.points.length; i += newInterval) {
      positions.push(segment.points[i]);
    }
  }
  
  return positions.slice(0, config.constraints.maxItems);
}

// ============================================================================
// EXPORTS
// ============================================================================

export {
  DENSITY_BY_SIZE,
  TOPOLOGY_CHARACTERISTICS,
  CODE_BLOCKS_ESTIMATE
};

