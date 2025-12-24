/**
 * Core Types - Unified type definitions for the academic-map-generator package
 * 
 * This module provides the foundation types used by both the generator and analyzer modules.
 * All coordinates use the Coord tuple format [x, y, z] for consistency and easy serialization.
 */

// ============================================================================
// COORDINATE TYPES
// ============================================================================

/**
 * 3D coordinate as a tuple [x, y, z]
 * x: horizontal position (left/right)
 * y: vertical position (up/down, typically height level)
 * z: depth position (forward/backward)
 */
export type Coord = [number, number, number];

/**
 * Alias for Coord when semantically representing direction
 */
export type Direction = Coord;

/**
 * Legacy Vector3 interface for backward compatibility with GameConfig
 */
export interface Vector3Object {
  x: number;
  y: number;
  z: number;
}

// ============================================================================
// PATH & SEGMENT TYPES
// ============================================================================

/**
 * A contiguous path segment with direction information
 */
export interface Segment {
  id: string;
  points: Coord[];                 // Ordered list of coordinates
  direction: Coord;                // Normalized direction vector
  length: number;                  // Number of points
  plane?: 'xy' | 'xz' | 'yz' | '3d';  // Which plane it lies on
  type?: string;                   // Segment type (e.g., 'straight', 'corner')
}

/**
 * Path information for a generated or analyzed map
 * 
 * IMPORTANT DISTINCTION:
 * - placement_coords: STATIC - All walkable tiles created by the topology (the "ground")
 * - path_coords: DYNAMIC - Computed by GameSolver after items are placed
 *   If no items placed yet, this should be the shortest path from start to target.
 */
export interface PathInfo {
  start_pos: Coord;
  target_pos: Coord;
  
  /**
   * DYNAMIC: The actual walking path from start → collectibles → goal
   * Computed by GameSolver's pathfinding algorithm after items are placed.
   * Each step must be adjacent (Manhattan distance = 1).
   * Initially (before items): shortest path from start_pos to target_pos.
   */
  path_coords: Coord[];
  
  /**
   * STATIC: All walkable tiles created by the topology.
   * This is the "ground" or "surface" that the character can walk on.
   * Does NOT need to be in any particular order.
   * Created once by the topology and doesn't change.
   */
  placement_coords: Coord[];
  
  obstacles: Obstacle[];
  metadata: Record<string, any>;
}

/**
 * Alias for backward compatibility
 */
export type IPathInfo = PathInfo;

// ============================================================================
// MAP STRUCTURE TYPES
// ============================================================================

/**
 * An obstacle on the map
 */
export interface Obstacle {
  pos: Coord;
  modelKey?: string;
  is_surface_obstacle?: boolean;
  [key: string]: any;
}

/**
 * An item placed on the map
 */
export interface Item {
  type: string;
  pos: Coord;
  initial_state?: string;         // For switches
  pattern_id?: string;
  segment_idx?: number;
  [key: string]: any;
}

/**
 * Complete map data structure
 */
export interface MapData {
  grid_size: [number, number, number];
  start_pos: Coord;
  target_pos: Coord;
  items: Item[];
  obstacles: Obstacle[];
  placement_coords: Coord[];
  params: Record<string, any>;
  map_type: string;
  logic_type: string;
  path_coords: Coord[];
  branch_coords: Coord[][];
  metadata: Record<string, any>;
}

// ============================================================================
// AREA TYPES (from analyzer)
// ============================================================================

/**
 * A connected area (block cluster) on the map
 */
export interface Area {
  id: string;
  blocks: Coord[];                // All blocks in this area
  boundary: Coord[];              // Perimeter blocks
  center: Coord;                  // Centroid
  boundingBox: { min: Coord; max: Coord };
  dimensions?: { width: number; depth: number };
  shapeType?: 'rectangle' | 'square' | 'irregular';
  holes?: Hole[];                 // Internal holes
  gateways?: Gateway[];           // Entry/exit points
}

/**
 * An empty space inside an Area
 */
export interface Hole {
  id: string;
  coords: Coord[];
  size: number;
  isCentered: boolean;
}

/**
 * Connection point between Path and Area
 */
export interface Gateway {
  id: string;
  coord: Coord;
  connectedPathId: string;
  connectedAreaId: string;
  direction: Coord;
}

/**
 * Connected path segments with pattern analysis
 */
export interface MetaPath {
  id: string;
  segments: Segment[];
  joints: Coord[];
  structureType: 'straight_chain' | 'macro_staircase' | 'spiral' | 'u_shape' | 'branching' | 'random';
  isRegular: boolean;
  totalLength: number;
}

// ============================================================================
// ANALYSIS TYPES
// ============================================================================

/**
 * Segment analysis metadata
 */
export interface SegmentAnalysis {
  count: number;
  lengths: number[];
  min_length: number;
  max_length: number;
  min_valid_range: number;
  total_valid_slots: number;
  types?: string[];
  avg_length?: number;
}

/**
 * Geometric relation types
 */
export type GeometricType = 
  | 'point'
  | 'line_2d'
  | 'line_3d'
  | 'parallel_axis'
  | 'axis_symmetric'
  | 'perpendicular'
  | 'point_symmetric'
  | 'area'
  | 'connector';

/**
 * Relation between two path segments
 */
export interface PathRelation {
  type: GeometricType;
  path1Id: string;
  path2Id: string;
  metadata: {
    axis?: Coord;
    center?: Coord;
    distance?: number;
    angle?: number;
  };
}

/**
 * Special point on the map (junction, endpoint, etc)
 */
export interface SpecialPoint {
  id: string;
  coord: Coord;
  type: 'junction' | 'center' | 'endpoint' | 'isolated';
  connectedSegments: string[];
}

/**
 * Connector between two areas
 */
export interface Connector {
  id: string;
  fromArea: string;
  toArea: string;
  path: Coord[];
  segments: Segment[];
}

// ============================================================================
// PATTERN TYPES
// ============================================================================

/**
 * A detected pattern (repeat, mirror, etc)
 */
export interface Pattern {
  id: string;
  type: 'repeat' | 'mirror' | 'rotate' | 'scale';
  unitElements: string[];
  repetitions: number;
  transform: {
    translate?: Coord;
    rotateAxis?: Coord;
    rotateAngle?: number;
    scale?: number;
    mirrorPlane?: 'xy' | 'xz' | 'yz';
  };
}

// ============================================================================
// COORDINATE PRIORITY TYPES
// ============================================================================

/**
 * Priority category for coordinate placement
 */
export type CoordCategory = 
  | 'critical'      // Must have item (e.g., junction, goal)
  | 'important'     // Should have item (e.g., endpoints)
  | 'recommended'   // Good to have (e.g., regular intervals)
  | 'optional'      // Can have (e.g., filler positions)
  | 'avoid';        // Should NOT have item

/**
 * A coordinate with priority information
 */
export interface PrioritizedCoord {
  position: Coord;
  priority: number;               // 1-10 (10 = highest)
  category: CoordCategory;
  reasons: string[];
  segmentId?: string;
  relatedCoords?: Coord[];
}

// ============================================================================
// BLOCK & GAME CONFIG (for GameConfig input compatibility)
// ============================================================================

/**
 * A block in the game config (uses Vector3Object for legacy compat)
 */
export interface Block {
  modelKey: string;
  position: Vector3Object;
}

/**
 * Game configuration input format (uses Vector3Object)
 * This is the format saved in JSON files
 */
export interface GameConfig {
  type: string;
  blocks: Block[];
  players?: Array<{ id: string; start: Vector3Object & { direction: number } }>;
  collectibles?: Array<{ id: string; type: string; position: Vector3Object }>;
  interactibles?: Array<{ id: string; type: string; position: Vector3Object }>;
  finish?: Vector3Object;
}

// ============================================================================
// LEGACY TYPE ALIASES (for backward compatibility)
// ============================================================================

/**
 * @deprecated Use Segment instead
 */
export type PathSegment = Segment;

/**
 * @deprecated Use Obstacle instead
 */
export type IObstacle = Obstacle;

/**
 * @deprecated Use Item instead
 */
export type IItem = Item;

/**
 * @deprecated Use MapData instead
 */
export type IMapData = MapData;

/**
 * @deprecated Use SegmentAnalysis instead
 */
export type ISegmentAnalysis = SegmentAnalysis;
