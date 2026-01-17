/**
 * Post-Processor Module
 * 
 * Modifies generated maps after initial path creation.
 * Supports: Fill Bounding Box, Extend Shape, and future processors.
 */

// ============================================================================
// TYPES
// ============================================================================

export type ShapeType = 'square' | 'rectangle' | 'circle' | 'mountain';
export type BiasDirection = 'center' | 'left' | 'right';
export type LevelMode = 'same' | 'stepDown';

export interface FillBoundingBoxConfig {
  type: 'fillBoundingBox';
  offset?: number;       // Default: 0
  material?: string;     // Default: 'grass'
  walkable?: boolean;    // Default: true
}

export interface ExtendShapeConfig {
  type: 'extendShape';
  shape?: ShapeType;     // Default: 'square'
  size?: number | [number, number] | { width: number; height: number }; // Default: 3, or [min, max] for random
  bias?: BiasDirection;  // Default: 'center'
  levelMode?: LevelMode; // Default: 'same'
  material?: string;     // Default: 'grass'
  connectPath?: boolean; // Default: false
  height?: number | [number, number]; // Default: 3-5
}

// Future processors (documented, not yet implemented)
export interface SidewalkConfig {
  type: 'sidewalk';
  width?: number;
  material?: string;
}

export interface ColumnSupportConfig {
  type: 'columnSupport';
  material?: string;
  hollow?: boolean;
}

export interface WallExtrusionConfig {
  type: 'wallExtrusion';
  height?: number;
  material?: string;
}

export interface AddTreesConfig {
  type: 'addTrees';
  count?: number | [number, number];  // Default: [3, 5] - min and max tree count
  treeTypes?: string[];               // Default: ['tree01', 'tree02', 'tree03', 'tree04', 'tree05']
  excludePath?: boolean;              // Default: true - don't place on path
}

export type PostProcessorConfig = 
  | FillBoundingBoxConfig 
  | ExtendShapeConfig
  | SidewalkConfig
  | ColumnSupportConfig
  | WallExtrusionConfig
  | AddTreesConfig;

export interface Coord3D {
  x: number;
  y: number;
  z: number;
}

export interface GeneratedBlock {
  x: number;
  y: number;
  z: number;
  model: string;
  walkable?: boolean;
}

export interface BoundingBox {
  minX: number;
  maxX: number;
  minY: number;
  maxY: number;
  minZ: number;
  maxZ: number;
}

// Direction vectors for perpendicular calculations
export const DIRECTION_VECTORS: Record<number, Coord3D> = {
  0: { x: 0, y: 0, z: -1 },  // NORTH (negative Z)
  90: { x: 1, y: 0, z: 0 },   // EAST (positive X)
  180: { x: 0, y: 0, z: 1 },  // SOUTH (positive Z)
  270: { x: -1, y: 0, z: 0 }, // WEST (negative X)
};

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Calculate bounding box from path coordinates
 */
export function calculateBoundingBox(pathCoords: Coord3D[]): BoundingBox {
  if (pathCoords.length === 0) {
    return { minX: 0, maxX: 0, minY: 0, maxY: 0, minZ: 0, maxZ: 0 };
  }

  let minX = Infinity, maxX = -Infinity;
  let minY = Infinity, maxY = -Infinity;
  let minZ = Infinity, maxZ = -Infinity;

  for (const coord of pathCoords) {
    minX = Math.min(minX, coord.x);
    maxX = Math.max(maxX, coord.x);
    minY = Math.min(minY, coord.y);
    maxY = Math.max(maxY, coord.y);
    minZ = Math.min(minZ, coord.z);
    maxZ = Math.max(maxZ, coord.z);
  }

  return { minX, maxX, minY, maxY, minZ, maxZ };
}

/**
 * Get perpendicular direction (left/right) relative to movement direction
 */
export function getPerpendicularDirection(
  movementAngle: number, 
  bias: 'left' | 'right'
): Coord3D {
  // Normalize angle to 0, 90, 180, 270
  const normalizedAngle = ((movementAngle % 360) + 360) % 360;
  
  // Left is -90 degrees, Right is +90 degrees
  const perpendicularAngle = bias === 'left' 
    ? (normalizedAngle - 90 + 360) % 360 
    : (normalizedAngle + 90) % 360;
  
  return DIRECTION_VECTORS[perpendicularAngle] || { x: 0, y: 0, z: 0 };
}

/**
 * Get movement direction from path at given index
 * Uses the INCOMING direction (from previous point) which is more reliable for switches at turns
 */
export function getMovementDirection(
  pathCoords: Coord3D[], 
  index: number
): number {
  if (pathCoords.length < 2) {
    return 90; // Default: EAST
  }
  
  // Clamp index
  const safeIndex = Math.min(index, pathCoords.length - 1);

  // If at start, use next point (Outgoing direction)
  if (safeIndex === 0) {
    const current = pathCoords[0];
    const next = pathCoords[1];
    const dx = next.x - current.x;
    const dz = next.z - current.z;
    
    if (Math.abs(dx) > Math.abs(dz)) {
      return dx > 0 ? 90 : 270;
    } else {
      return dz > 0 ? 180 : 0;
    }
  }

  // Use previous point for incoming direction (more reliable at turns)
  const current = pathCoords[safeIndex];
  const prev = pathCoords[safeIndex - 1];
  
  // Calculate direction FROM prev TO current
  const dx = current.x - prev.x;
  const dz = current.z - prev.z;

  // Determine angle based on delta
  if (Math.abs(dx) > Math.abs(dz)) {
    return dx > 0 ? 90 : 270; // EAST or WEST
  } else {
    return dz > 0 ? 180 : 0; // SOUTH or NORTH
  }
}

/**
 * Generate coordinates for a shape centered at a point
 * For 'mountain' shape, creates 3D pyramid with multiple Y levels
 */
export function generateShapeCoords(
  shape: ShapeType,
  size: number | [number, number] | { width: number; height: number },
  center: Coord3D,
  bias: BiasDirection,
  movementDirection: number,
  heightConfig?: number | [number, number],
  rng?: () => number
): Coord3D[] {
  const random = rng || Math.random;
  const coords: Coord3D[] = [];
  const baseY = center.y;
  
  // Special handling for mountain shape (3D pyramid) - pass size as-is for random support
  if (shape === 'mountain') {
    const mountainSize = Array.isArray(size) ? size : (typeof size === 'number' ? size : size.width);
    return generateMountainCoords(center, mountainSize, bias, movementDirection, heightConfig, rng);
  }
  
  // For other shapes, convert size to number
  const sizeNum = Array.isArray(size) 
    ? Math.floor(random() * (size[1] - size[0] + 1)) + size[0]
    : (typeof size === 'number' ? size : size.width);
  
  if (bias === 'center') {
    // Center: shape is centered on the path point
    const half = Math.floor((sizeNum - 1) / 2);
    for (let dx = 0; dx < sizeNum; dx++) {
      for (let dz = 0; dz < sizeNum; dz++) {
        const x = center.x - half + dx;
        const z = center.z - half + dz;
        coords.push({ x, y: baseY, z });
      }
    }
  } else {
    // Biased: shape extends 1 unit away from path, then continues outward
    const perpDir = getPerpendicularDirection(movementDirection, bias);
    
    // Shape starts 1 unit away from path and extends outward
    // For perpendicular direction: start at center + perpDir*1, extend for 'size' units
    for (let d = 1; d <= sizeNum; d++) {
      // For each layer away from path
      const baseX = center.x + perpDir.x * d;
      const baseZ = center.z + perpDir.z * d;
      
      // Extend shape along the movement axis (parallel to path)
      const moveDir = DIRECTION_VECTORS[movementDirection] || { x: 0, y: 0, z: 0 };
      const halfParallel = Math.floor((sizeNum - 1) / 2);
      
      for (let p = -halfParallel; p < sizeNum - halfParallel; p++) {
        const x = baseX + moveDir.x * p;
        const z = baseZ + moveDir.z * p;
        coords.push({ x, y: baseY, z });
      }
    }
  }

  return coords;
}

/**
 * Generate mountain/pyramid coordinates with multiple Y levels
 * Creates a stepped pyramid where each higher layer is smaller
 * @param center - Base center position
 * @param size - Base size of the mountain (can be number or [min, max] for random)
 * @param bias - Bias direction
 * @param movementDirection - Movement direction for biased positioning
 */
function generateMountainCoords(
  center: Coord3D,
  size: number | [number, number],
  bias: BiasDirection,
  movementDirection: number,
  heightConfig?: number | [number, number],
  rng?: () => number
): Coord3D[] {
  const random = rng || Math.random;
  const coords: Coord3D[] = [];
  
  // Handle size: if array [min, max], randomize. Otherwise use as-is.
  let baseSize: number;
  if (Array.isArray(size)) {
    const [minSize, maxSize] = size;
    baseSize = Math.floor(random() * (maxSize - minSize + 1)) + minSize;
  } else {
    baseSize = size;
  }
  
  // Random mountain height 
  let minHeight = 3;
  let maxHeight = 5;
  
  if (heightConfig !== undefined) {
    if (Array.isArray(heightConfig)) {
      [minHeight, maxHeight] = heightConfig;
    } else {
      minHeight = maxHeight = heightConfig;
    }
  }
  
  
  const height = Math.floor(random() * (maxHeight - minHeight + 1)) + minHeight;

  // Calculate center position for the mountain
  let mountainCenterX = center.x;
  let mountainCenterZ = center.z;

  if (bias !== 'center') {
    const perpDir = getPerpendicularDirection(movementDirection, bias);
    // Offset calculation to ensure gap
    // Gap = 1 unit (ADJACENT/TOUCHING) from path to the closest edge of the base
    // Center needs to be at: Gap + HalfBase
    const halfBase = Math.floor((baseSize - 1) / 2);
    const offsetAmount = 1 + halfBase;
    
    mountainCenterX += perpDir.x * offsetAmount;
    mountainCenterZ += perpDir.z * offsetAmount;
  }

  // Generate Symmetric Pyramid
  for (let layer = 0; layer < height; layer++) {
    const layerY = center.y + layer;
    
    // Layer size shrinks as we go up
    const shrinkRate = Math.max(1, Math.floor(baseSize / (height - 1)) || 1);
    const layerSize = Math.max(1, baseSize - layer * shrinkRate);
    const half = Math.floor((layerSize - 1) / 2);

    for (let dx = 0; dx < layerSize; dx++) {
      for (let dz = 0; dz < layerSize; dz++) {
        const x = mountainCenterX - half + dx;
        const z = mountainCenterZ - half + dz;
        coords.push({ x, y: layerY, z });
      }
    }
  }
  
  return coords;
}

/**
 * Generate connector path from origin to shape edge
 */
export function generateConnectorCoords(
  origin: Coord3D,
  shapeCoords: Coord3D[],
  movementDirection: number,
  bias: BiasDirection
): Coord3D[] {
  if (bias === 'center' || shapeCoords.length === 0) {
    return []; // No connector needed if centered
  }

  const connector: Coord3D[] = [];
  const perpDir = getPerpendicularDirection(movementDirection, bias);
  
  // Find the closest point in shapeCoords to origin
  let closestDist = Infinity;
  let closestPoint = shapeCoords[0];
  for (const coord of shapeCoords) {
    const dist = Math.abs(coord.x - origin.x) + Math.abs(coord.z - origin.z);
    if (dist < closestDist) {
      closestDist = dist;
      closestPoint = coord;
    }
  }

  // Generate line from origin to closest point
  let current = { ...origin };
  while (current.x !== closestPoint.x || current.z !== closestPoint.z) {
    if (current.x !== closestPoint.x) {
      current.x += Math.sign(closestPoint.x - current.x);
    } else if (current.z !== closestPoint.z) {
      current.z += Math.sign(closestPoint.z - current.z);
    }
    // Don't include points already in shape
    if (!shapeCoords.some(c => c.x === current.x && c.z === current.z)) {
      connector.push({ ...current });
    }
  }

  return connector;
}

/**
 * Create a coordinate key for Set operations
 */
export function coordKey(coord: Coord3D): string {
  return `${coord.x},${coord.y},${coord.z}`;
}
