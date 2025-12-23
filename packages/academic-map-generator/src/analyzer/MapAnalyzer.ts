/**
 * MapAnalyzer - 4-Tier Map Analysis Pipeline
 * 
 * Phân tích cấu trúc hình học của map để phục vụ việc đặt item học thuật.
 * 
 * Usage:
 *   const analyzer = new MapAnalyzer(gameConfig);
 *   const result = analyzer.analyze();
 */

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface Vector3 {
  x: number;
  y: number;
  z: number;
}

export interface Block {
  modelKey: string;
  position: Vector3;
}

export interface GameConfig {
  type: string;
  blocks: Block[];
  players?: Array<{ id: string; start: Vector3 & { direction: number } }>;
  collectibles?: Array<{ id: string; type: string; position: Vector3 }>;
  interactibles?: Array<{ id: string; type: string; position: Vector3 }>;
  finish?: Vector3;
}

// Tier 1 Types
export type GeometricType = 
  | 'point'           // Điểm đặc biệt (junction, center, isolated)
  | 'line_2d'         // Đường thẳng 2D (trên 1 mặt phẳng)
  | 'line_3d'         // Đường thẳng 3D (chéo trong không gian)
  | 'parallel_axis'   // Cặp đường song song + đối xứng trục
  | 'axis_symmetric'  // Đối xứng trục
  | 'perpendicular'   // Vuông góc
  | 'point_symmetric' // Đối xứng tâm
  | 'area'            // Vùng (bounding box hoặc polygon)
  | 'connector';      // Đường nối giữa các vùng (polyline)

export interface PathSegment {
  id: string;
  points: Vector3[];
  direction: Vector3;  // Normalized direction vector
  length: number;
  plane?: 'xy' | 'xz' | 'yz' | '3d';  // Which plane it lies on
}

export interface Area {
  id: string;
  blocks: Vector3[];         // All blocks in this area
  boundary: Vector3[];       // Perimeter blocks (đường bao)
  center: Vector3;           // Centroid
  boundingBox: { min: Vector3; max: Vector3 };
  // NEW: Enhanced area properties from Geometric Reasoning Engine
  dimensions?: { width: number; depth: number };
  shapeType?: 'rectangle' | 'square' | 'irregular';
  holes?: Hole[];            // Internal holes
  gateways?: Gateway[];      // Entry/exit points connecting to paths
  // [NEW] Cấu trúc nội tại
  subStructures?: AreaSubStructure[]; // Internal components (wings, spine)
  internalPaths?: PathSegment[]; // Contour edges (zigzag, base)
}

export interface AreaSubStructure {
  type: 'wing_mass' | 'body_mass';
  id: string;
  coords: Vector3[];
  description?: string;
}

// NEW: Hole in an Area (empty space inside)
export interface Hole {
  id: string;
  coords: Vector3[];         // Coordinates of the hole
  size: number;              // Number of blocks in hole
  isCentered: boolean;       // Is the hole centered in the parent area?
}

// NEW: Gateway - connection point between Path and Area
export interface Gateway {
  id: string;
  coord: Vector3;            // Gateway position
  connectedPathId: string;   // ID of the connected path
  connectedAreaId: string;   // ID of the connected area
  direction: Vector3;        // Direction from path into area
}

// NEW: MetaPath - chain of connected path segments with pattern analysis
export interface MetaPath {
  id: string;
  segments: PathSegment[];   // Ordered list of connected segments
  joints: Vector3[];         // Corner points where direction changes
  structureType: 'straight_chain' | 'macro_staircase' | 'spiral' | 'u_shape' | 'branching' | 'random';
  isRegular: boolean;        // True if segments have equal/pattern lengths
  totalLength: number;
}

export interface Connector {
  id: string;
  fromArea: string;
  toArea: string;
  path: Vector3[];           // Polyline của đường nối
  segments: PathSegment[];   // Các đoạn thẳng tạo nên connector
}

export interface PathRelation {
  type: GeometricType;
  path1Id: string;
  path2Id: string;
  metadata: {
    axis?: Vector3;          // For axis_symmetric
    center?: Vector3;        // For point_symmetric
    distance?: number;       // For parallel
    angle?: number;          // For perpendicular (should be 90)
  };
}

export interface SpecialPoint {
  id: string;
  coord: Vector3;
  type: 'junction' | 'center' | 'endpoint' | 'isolated';
  connectedSegments: string[];
}

// Tier 1 Output
export interface Tier1Result {
  points: SpecialPoint[];
  segments: PathSegment[];
  areas: Area[];
  connectors: Connector[];
  relations: PathRelation[];
  // NEW: From Geometric Reasoning Engine
  metaPaths: MetaPath[];     // Connected path chains with pattern analysis
  gateways: Gateway[];       // Path-Area connection points
}

// Tier 2 Types
export interface Pattern {
  id: string;
  type: 'repeat' | 'mirror' | 'rotate' | 'scale';
  unitElements: string[];    // IDs of segments/areas that form the unit
  repetitions: number;
  transform: {
    translate?: Vector3;
    rotateAxis?: Vector3;
    rotateAngle?: number;
    scale?: number;
    mirrorPlane?: 'xy' | 'xz' | 'yz';
  };
}

export interface Tier2Result extends Tier1Result {
  patterns: Pattern[];
}

// Tier 3 Output (filtered)
export interface Tier3Result extends Tier2Result {
  filteredSegments: PathSegment[];
  mergedSegments: PathSegment[];
  keptShortSegments: PathSegment[];  // Short but kept due to pattern
}

// Prioritized Coordinate (from CoordinatePrioritizer)
export type CoordCategory = 
  | 'critical'      // Must have item (e.g., junction, goal)
  | 'important'     // Should have item (e.g., endpoints, symmetric points)
  | 'recommended'   // Good to have (e.g., regular intervals)
  | 'optional'      // Can have (e.g., filler positions)
  | 'avoid';        // Should NOT have item (e.g., start position, blocked)

export interface PrioritizedCoord {
  position: Vector3;
  priority: number;          // 1-10 (10 = highest priority)
  category: CoordCategory;
  reasons: string[];
  segmentId?: string;
  relatedCoords?: Vector3[]; // Other coords that form a pattern with this one
}

// Map Metrics
export interface MapMetrics {
  totalBlocks: number;
  boundingBox: { width: number; height: number; depth: number };
  area: number;
  estimatedSize: 'tiny' | 'small' | 'medium' | 'large' | 'huge';
  segmentCount: number;
  areaCount: number;
  junctionCount: number;
  longestPathLength: number;
  center: Vector3;
  detectedTopology?: string;
}

// Placement Constraints
export interface PlacementConstraints {
  maxItems: number;
  minItems: number;
  targetItemRatio: number;
  preferredConcepts: string[];
  avoidConcepts: string[];
  maxCodeBlocks: number;
  distribution: 'spread' | 'symmetric' | 'clustered' | 'endpoints' | 'alternating' | 'progressive';
  preferredInterval: number;
}

// Import SelectableElement types
import {
  SelectableElement,
  Coord as SECoord,
  createKeypointElement,
  createSegmentElement,
  createPositionElements
} from './SelectableElement';

// Re-export SelectableElement for consumers
export type { SelectableElement };

// Tier 4 Output (final)
export interface PlacementContext {
  // Tier 1 Core structure
  points: SpecialPoint[];        // Special points (junctions, endpoints, etc.)
  segments: PathSegment[];       // Path segments
  areas: Area[];                 // Connected areas
  connectors: Connector[];       // Connections between areas
  relations: PathRelation[];     // Geometric relations between paths
  
  // NEW: From Geometric Reasoning Engine
  metaPaths: MetaPath[];         // Connected path chains with pattern analysis
  gateways: Gateway[];           // Path-Area connection points
  
  // Tier 2 Patterns
  patterns: Pattern[];
  
  // Prioritized coordinates
  prioritizedCoords: PrioritizedCoord[];
  
  // Map metrics
  metrics: MapMetrics;
  
  // Constraints
  constraints: PlacementConstraints;
  
  // Selectable elements (NEW - for UI selection)
  selectableElements: SelectableElement[];
  
  // Legacy: suggested placements
  suggestedPlacements: Array<{
    segmentId?: string;
    areaId?: string;
    patternId?: string;
    positions: Vector3[];
    itemType: 'crystal' | 'switch' | 'gem' | 'goal';
    rule: string;
  }>;
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function vectorEquals(a: Vector3, b: Vector3): boolean {
  return a.x === b.x && a.y === b.y && a.z === b.z;
}

function vectorAdd(a: Vector3, b: Vector3): Vector3 {
  return { x: a.x + b.x, y: a.y + b.y, z: a.z + b.z };
}

function vectorSub(a: Vector3, b: Vector3): Vector3 {
  return { x: a.x - b.x, y: a.y - b.y, z: a.z - b.z };
}

function vectorScale(v: Vector3, s: number): Vector3 {
  return { x: v.x * s, y: v.y * s, z: v.z * s };
}

function vectorDot(a: Vector3, b: Vector3): number {
  return a.x * b.x + a.y * b.y + a.z * b.z;
}

function vectorCross(a: Vector3, b: Vector3): Vector3 {
  return {
    x: a.y * b.z - a.z * b.y,
    y: a.z * b.x - a.x * b.z,
    z: a.x * b.y - a.y * b.x
  };
}

function vectorMagnitude(v: Vector3): number {
  return Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z);
}

function vectorNormalize(v: Vector3): Vector3 {
  const mag = vectorMagnitude(v);
  if (mag === 0) return { x: 0, y: 0, z: 0 };
  return { x: v.x / mag, y: v.y / mag, z: v.z / mag };
}

function vectorDistance(a: Vector3, b: Vector3): number {
  return vectorMagnitude(vectorSub(b, a));
}

function vectorToKey(v: Vector3): string {
  return `${v.x},${v.y},${v.z}`;
}

function keyToVector(key: string): Vector3 {
  const [x, y, z] = key.split(',').map(Number);
  return { x, y, z };
}

// ============================================================================
// TIER 1: GEOMETRIC DECOMPOSITION
// ============================================================================

// ============================================================================
// GENERIC AREA BOUNDARY ANALYZER (Contour Tracing)
// ============================================================================

class AreaBoundaryAnalyzer {
  private blockSet: Set<string> = new Set();
  
  /**
   * Analyze boundary to find generic edges
   */
  public analyzeBoundary(areaBlocks: Vector3[]): PathSegment[] {
    // 1. Trace the contour (ordered list of boundary blocks)
    const boundaryPoints = this.traceContour(areaBlocks);
    if (boundaryPoints.length < 3) return [];

    // 2. Segment based on vector changes
    const segments = this.segmentContour(boundaryPoints);
    
    return segments;
  }

  /**
   * Moore-Neighbor Tracing Algorithm
   */
  private traceContour(blocks: Vector3[]): Vector3[] {
    if (blocks.length === 0) return [];
    
    // 1. Setup lookup
    this.blockSet.clear();
    blocks.forEach(b => this.blockSet.add(vectorToKey(b)));

    // 2. Find Start Point (Min X, then Min Z) -> Top-Leftmost
    // Sort logic: X ascending, then Z ascending
    const sorted = [...blocks].sort((a,b) => (a.x - b.x) || (a.z - b.z));
    const start = sorted[0];
    
    const contour: Vector3[] = [start];
    
    // 3. Moore-Neighbor Tracing
    const dirs = [
      {x:0, z:1},   // N
      {x:1, z:1},   // NE
      {x:1, z:0},   // E
      {x:1, z:-1},  // SE
      {x:0, z:-1},  // S
      {x:-1, z:-1}, // SW
      {x:-1, z:0},  // W
      {x:-1, z:1}   // NW
    ];

    let curr = start;
    let backtrackIdx = 6; // Start from West

    let loopSanity = 0;
    const MAX_LOOPS = blocks.length * 4; 

    while (loopSanity < MAX_LOOPS) {
      let foundNext = false;
      
      // Search 8 neighbors clockwise starting from backtrackIdx
      for (let i = 0; i < 8; i++) {
        const idx = (backtrackIdx + i) % 8;
        const dir = dirs[idx];
        const candidate = { x: curr.x + dir.x, y: curr.y, z: curr.z + dir.z };
        
        if (this.blockSet.has(vectorToKey(candidate))) {
          const next = candidate;
          
          if (vectorEquals(next, start) && contour.length > 2) {
             return contour;
          }
          
          contour.push(next);
          curr = next;
          backtrackIdx = (idx + 4) % 8; 
          foundNext = true;
          break;
        }
      }
      
      if (!foundNext) break;
      loopSanity++;
    }

    return contour;
  }

  private segmentContour(contour: Vector3[]): PathSegment[] {
    const segments: PathSegment[] = [];
    if (contour.length < 2) return segments;
    
    let currentSegment: Vector3[] = [contour[0]];
    let currentVector = this.getSlopeVector(contour[0], contour[1]); 

    for (let i = 1; i < contour.length; i++) {
      const p1 = contour[i-1];
      const p2 = contour[i];
      const newVector = this.getSlopeVector(p1, p2);

      if (!vectorEquals(currentVector, newVector)) {
        segments.push({
            id: `edge_${segments.length}`,
            points: currentSegment,
            direction: currentVector,
            length: currentSegment.length,
            plane: 'xz' as const
        });
        
        currentSegment = [p1, p2]; 
        currentVector = newVector;
      } else {
        currentSegment.push(p2);
      }
    }
    
    segments.push({
        id: `edge_${segments.length}`,
        points: currentSegment,
        direction: currentVector,
        length: currentSegment.length,
        plane: 'xz' as const
    });

    return this.mergeStaircaseSegments(segments);
  }

  private mergeStaircaseSegments(rawSegments: PathSegment[]): PathSegment[] {
    const merged: PathSegment[] = [];
    
    let i = 0;
    while (i < rawSegments.length) {
        // Detect Pattern Repetition (L=2 to 3)
        let bestPatternLen = 0;
        let bestPatternCount = 0;

        for (let L = 2; L <= 3; L++) {
            if (i + L * 2 <= rawSegments.length) {
                const pattern = rawSegments.slice(i, i + L);
                let count = 0;
                let k = i;
                let match = true;
                while (k + L <= rawSegments.length) {
                    for (let p = 0; p < L; p++) {
                        if (!vectorEquals(rawSegments[k+p].direction, pattern[p].direction)) {
                            match = false;
                            break;
                        }
                    }
                    if (!match) break;
                    count++;
                    k += L;
                }
                
                if (count >= 2 && count * L > bestPatternCount * bestPatternLen) {
                    bestPatternLen = L;
                    bestPatternCount = count;
                }
            }
        }
        
        if (bestPatternLen > 0) {
            const totalSegments = bestPatternLen * bestPatternCount;
            const segmentsToMerge = rawSegments.slice(i, i + totalSegments);
            const mergedPoints: Vector3[] = [];
            mergedPoints.push(segmentsToMerge[0].points[0]);
            
            for (const seg of segmentsToMerge) {
                for (let pi = 1; pi < seg.points.length; pi++) {
                    mergedPoints.push(seg.points[pi]);
                }
            }

            const startP = mergedPoints[0];
            const endP = mergedPoints[mergedPoints.length - 1];
            const trendVec = vectorNormalize(vectorSub(endP, startP));
            
            const dx = Math.abs(endP.x - startP.x);
            const dz = Math.abs(endP.z - startP.z);
            const gcd = (a: number, b: number): number => b === 0 ? a : gcd(b, a % b);
            const divisor = gcd(dx, dz);
            const slopeStr = divisor > 0 ? `${dx/divisor}:${dz/divisor}` : 'infinity';

            merged.push({
                id: `staircase_edge_${merged.length}_slope_${slopeStr}`,
                points: mergedPoints,
                direction: trendVec,
                length: mergedPoints.length,
                plane: 'xz' as const
            });
            
            i += totalSegments;
        } else {
            merged.push(rawSegments[i]);
            i++;
        }
    }
    
    return merged;
  }

  private getSlopeVector(p1: Vector3, p2: Vector3): Vector3 {
      return { x: p2.x - p1.x, y: p2.y - p1.y, z: p2.z - p1.z };
  }
}

class Tier1Analyzer {
  private blocks: Vector3[];
  private blockSet: Set<string>;
  private visited: Set<string>;
  
  // NEW: Constants from Geometric Reasoning Engine
  private readonly MIN_AREA_SIZE = 5;  // Minimum blocks for a valid area (cross shape)
  private readonly DIRECTIONS_2D: Array<{x: number, z: number}> = [
    {x: 0, z: 1}, {x: 0, z: -1}, {x: 1, z: 0}, {x: -1, z: 0}
  ];

  constructor(blocks: Block[]) {
    this.blocks = blocks.map(b => b.position);
    this.blockSet = new Set(this.blocks.map(vectorToKey));
    this.visited = new Set();
  }

  analyze(): Tier1Result {
    // Phase 1: Core geometric decomposition
    const areas = this.findAreas();
    
    // [FIX] Tạo mask để đánh dấu các block đã thuộc Area
    const areaBlockKeys = new Set<string>();
    areas.forEach(a => a.blocks.forEach(b => areaBlockKeys.add(vectorToKey(b))));
    
    const connectors = this.findConnectors(areas);
    const segments = this.traceAllSegments(areaBlockKeys); // Pass exclusion set
    const points = this.findSpecialPoints(segments);
    const relations = this.analyzeRelations(segments);
    
    // Phase 2: Enhanced analysis from Geometric Reasoning Engine
    const gateways = this.findGateways(areas, segments);
    
    // [NEW] Phân tích cấu trúc bên trong Area (tìm cánh, đối xứng)
    this.analyzeAreaInternals(areas);
    
    const metaPaths = this.analyzeMetaPaths(segments);
    
    // Enrich areas with holes and gateways
    this.enrichAreasWithHolesAndGateways(areas, gateways);

    return {
      points,
      segments,
      areas,
      connectors,
      relations,
      metaPaths,
      gateways
    };
  }
  
  /**
   * Helper: Convert Vector3 to 2D key (x,z)
   */
  private vector2DKey(v: Vector3): string {
    return `${v.x},${v.z}`;
  }
  
  /**
   * Helper: Parse 2D key back to x, z
   */
  private parse2DKey(key: string): {x: number, z: number} {
    const [x, z] = key.split(',').map(Number);
    return {x, z};
  }

  /**
   * Helper: Calculate degree (neighbor count) for a 2D position
   */
  private getDegree2D(x: number, z: number, grid2D: Set<string>): number {
    let count = 0;
    for (const dir of this.DIRECTIONS_2D) {
      if (grid2D.has(`${x + dir.x},${z + dir.z}`)) {
        count++;
      }
    }
    return count;
  }

  /**
   * [UPDATED] Tìm Area bằng thuật toán Morphological Erosion
   * Khắc phục lỗi: Area không còn "ăn" nhầm vào Shaft (Path)
   * 
   * Algorithm:
   * 1. EROSION: Tìm Lõi (Core) - block bị bao kín tứ phía (4 neighbors)
   * 2. EXPANSION Pass 1: Lấy neighbors trực tiếp của Core
   * 3. EXPANSION Pass 2: Filter - chỉ giữ ô có >=3 neighbors HOẶC connected to core
   * 4. Grouping & Create Area objects
   */
  private findAreas(): Area[] {
    const areas: Area[] = [];
    const grid2D = new Set<string>(); // Bản đồ 2D (x,z)
    
    // 1. Build 2D Grid
    for (const block of this.blocks) {
      grid2D.add(this.vector2DKey(block));
    }

    // 2. EROSION: Tìm Lõi (Core)
    // Core là những block bị bao vây tứ phía (4 hàng xóm)
    const coreBlocks = new Set<string>();
    for (const key of grid2D) {
      const { x, z } = this.parse2DKey(key);
      let neighbors = 0;
      for (const dir of this.DIRECTIONS_2D) {
        if (grid2D.has(`${x + dir.x},${z + dir.z}`)) neighbors++;
      }
      if (neighbors === 4) {
        coreBlocks.add(key);
      }
    }

    // Nếu không có lõi, chuyển sang fallback strategies
    if (coreBlocks.size === 0) {
      return this.findAreasFallback(grid2D);
    }

    // 3. RECONSTRUCTION (DILATION): Khôi phục Area từ Lõi
    const areaKeySet = new Set<string>(coreBlocks);
    
    // Pass 1: Lấy neighbors trực tiếp của Core
    const expansionCandidates = new Set<string>();
    for (const key of coreBlocks) {
      const { x, z } = this.parse2DKey(key);
      for (const dir of this.DIRECTIONS_2D) {
        const nKey = `${x + dir.x},${z + dir.z}`;
        if (grid2D.has(nKey) && !areaKeySet.has(nKey)) {
          expansionCandidates.add(nKey);
        }
      }
    }

    // Pass 2: Filter Candidates - Chỉ giữ lại ô thực sự thuộc về khối đặc
    for (const key of expansionCandidates) {
      const { x, z } = this.parse2DKey(key);
      let neighborsCount = 0;
      for (const dir of this.DIRECTIONS_2D) {
        if (grid2D.has(`${x + dir.x},${z + dir.z}`)) neighborsCount++;
      }
      
      // Rule: Một ô thuộc Area viền thường có 2-3 hàng xóm.
      // Shaft (Path) thường chỉ có 2 hàng xóm (trước/sau).
      if (neighborsCount >= 3) { 
        areaKeySet.add(key);
      } else {
        // Edge case: Đỉnh nhọn (Wing Tip) chỉ có 1-2 hàng xóm
        // Nhưng dính trực tiếp với Core -> cần kiểm tra kỹ
        let connectedToCore = false;
        for (const dir of this.DIRECTIONS_2D) {
          if (coreBlocks.has(`${x + dir.x},${z + dir.z}`)) {
            connectedToCore = true;
            break;
          }
        }
        
        if (connectedToCore) {
          // Chỉ thêm nếu nó KHÔNG phải là đường nối (connector) ra khỏi area
          // Kiểm tra chiều rộng tại Z-level hiện tại
          const blocksAtZ = this.blocks.filter(b => b.z === z);
          const xValues = blocksAtZ.map(b => b.x);
          const width = xValues.length > 0 ? Math.max(...xValues) - Math.min(...xValues) + 1 : 0;

          // Rule: Thêm vào nếu:
          // 1. Z-level rộng (>=2 blocks) -> Wing tip
          // 2. Hoặc là ngõ cụt (neighborsCount <= 1) -> Arrow tip
          // 3. Nếu width=1 và neighbors=2 -> Đây là Shaft connector -> BỎ QUA
          if (width >= 2 || neighborsCount <= 1) {
            areaKeySet.add(key);
          }
        }
      }
    }

    // Pass 3: Thêm một lượt expansion nữa cho các ô viền còn lại
    // Để bao gồm các đầu cánh (wing tips) và đỉnh mũi tên
    const finalExpansion = new Set<string>();
    for (const key of areaKeySet) {
      const { x, z } = this.parse2DKey(key);
      for (const dir of this.DIRECTIONS_2D) {
        const nKey = `${x + dir.x},${z + dir.z}`;
        if (grid2D.has(nKey) && !areaKeySet.has(nKey)) {
          // Chỉ thêm nếu ô này KHÔNG phải là phần của shaft (kiểm tra độ rộng Z-level)
          const { z: nz } = this.parse2DKey(nKey);
          const blocksAtZ = this.blocks.filter(b => b.z === nz);
          const xValues = blocksAtZ.map(b => b.x);
          const width = xValues.length > 0 ? Math.max(...xValues) - Math.min(...xValues) + 1 : 0;
          
          // Nếu Z-level này rộng (>=2 blocks) hoặc block kề với area block, thêm vào
          if (width >= 2 || blocksAtZ.length >= 2) {
            finalExpansion.add(nKey);
          }
        }
      }
    }
    for (const key of finalExpansion) {
      areaKeySet.add(key);
    }

    // 4. Grouping & Creating Area Objects
    if (areaKeySet.size >= this.MIN_AREA_SIZE) {
      const areaBlocks: Vector3[] = [];
      const yLevel = this.blocks[0]?.y ?? 0;
      
      for (const key of areaKeySet) {
        const { x, z } = this.parse2DKey(key);
        areaBlocks.push({ x, y: yLevel, z });
      }
      
      areas.push(this.createArea(`area_${areas.length}`, areaBlocks));
    }

    return areas;
  }

  /**
   * Fallback strategies khi không tìm thấy core blocks
   */
  private findAreasFallback(grid2D: Set<string>): Area[] {
    const areas: Area[] = [];
    const visitedInArea = new Set<string>();
    const yLevel = this.blocks[0]?.y ?? 0;

    // Strategy: Junction-based - dùng cho T-shape, cross-shape
    const junctionBlocks = new Set<string>();
    for (const block of this.blocks) {
      if (this.countHorizontalNeighbors(block) >= 3) {
        junctionBlocks.add(vectorToKey(block));
      }
    }

    // Cluster adjacent junctions
    for (const junctionKey of junctionBlocks) {
      if (visitedInArea.has(junctionKey)) continue;

      const areaBlocks: Vector3[] = [];
      const block = this.findBlockByKey(junctionKey);
      if (!block) continue;
      
      const queue: Vector3[] = [block];
      visitedInArea.add(junctionKey);
      areaBlocks.push(block);

      // Expand to adjacent junctions and radius 1
      let qIndex = 0;
      while (qIndex < queue.length) {
        const current = queue[qIndex++];
        const neighbors = this.getHorizontalNeighbors(current);
        
        for (const n of neighbors) {
          const nKey = vectorToKey(n);
          if (!visitedInArea.has(nKey) && this.blockSet.has(nKey)) {
            visitedInArea.add(nKey);
            areaBlocks.push(n);
            if (junctionBlocks.has(nKey)) {
              queue.push(n);
            }
          }
        }
      }

      if (areaBlocks.length >= this.MIN_AREA_SIZE) {
        areas.push(this.createArea(`area_${areas.length}`, areaBlocks));
      }
    }

    return areas;
  }

  /**
   * Find "Expansion Zones" - areas where the map suddenly widens
   * This detects arrow heads, T-bar tops, and other widening patterns.
   * 
   * Algorithm: Z-slice width profiling
   * 1. Group blocks by Z coordinate
   * 2. Find Z levels where width jumps significantly (ratio > 1.5x)
   * 3. Collect all blocks from the widened zone
   */
  private findExpansionZones(alreadyInArea: Set<string>): Vector3[][] {
    const zones: Vector3[][] = [];
    
    // Group blocks by Z coordinate (XZ plane analysis)
    const blocksByZ = new Map<number, Vector3[]>();
    for (const block of this.blocks) {
      const z = block.z;
      if (!blocksByZ.has(z)) {
        blocksByZ.set(z, []);
      }
      blocksByZ.get(z)!.push(block);
    }
    
    // Sort Z values
    const zValues = Array.from(blocksByZ.keys()).sort((a, b) => a - b);
    if (zValues.length < 2) return zones;
    
    // Calculate width at each Z level
    const widthProfile: { z: number; width: number; minX: number; maxX: number; blocks: Vector3[] }[] = [];
    for (const z of zValues) {
      const blocksAtZ = blocksByZ.get(z)!;
      const xValues = blocksAtZ.map(b => b.x);
      const minX = Math.min(...xValues);
      const maxX = Math.max(...xValues);
      const width = maxX - minX + 1;
      widthProfile.push({ z, width, minX, maxX, blocks: blocksAtZ });
    }
    
    // Find expansion points (where width increases significantly)
    const EXPANSION_RATIO = 1.5; // Width must increase by at least 50%
    const MIN_EXPANSION_WIDTH = 3; // Widened section must be at least 3 blocks wide
    
    let expansionStartIdx = -1;
    
    for (let i = 1; i < widthProfile.length; i++) {
      const prevWidth = widthProfile[i - 1].width;
      const currWidth = widthProfile[i].width;
      
      // Detect start of expansion
      if (expansionStartIdx === -1 && 
          currWidth >= prevWidth * EXPANSION_RATIO && 
          currWidth >= MIN_EXPANSION_WIDTH) {
        expansionStartIdx = i;
      }
      
      // Detect end of expansion (width decreases back or reaches end)
      if (expansionStartIdx !== -1) {
        const isEnd = i === widthProfile.length - 1 || 
                      (widthProfile[i + 1]?.width ?? 0) < currWidth * 0.8;
        
        if (isEnd) {
          // Collect all blocks in the expansion zone
          const zoneBlocks: Vector3[] = [];
          for (let j = expansionStartIdx; j <= i; j++) {
            for (const block of widthProfile[j].blocks) {
              const key = vectorToKey(block);
              if (!alreadyInArea.has(key)) {
                alreadyInArea.add(key);
                zoneBlocks.push(block);
              }
            }
          }
          
          if (zoneBlocks.length >= 3) { // MIN_AREA_SIZE
            zones.push(zoneBlocks);
          }
          
          expansionStartIdx = -1; // Reset for next potential zone
        }
      }
    }
    
    return zones;
  }

  /**
   * Helper to find block object from key
   */
  private findBlockByKey(key: string): Vector3 | undefined {
    // This is inefficient O(N), but given map size usually < 1000, acceptable.
    // Optimization: could Map<string, Vector3> in constructor if needed.
    return this.blocks.find(b => vectorToKey(b) === key);
  }

  /**
   * Trace a branch to see if it's a short spur or a long segment
   * MAX_SPUR_LEN = 2 (Wings, Tips usually 1-2 blocks)
   */
  private traceBranch(start: Vector3, from: Vector3, allSeeds: Set<string>): { 
    blocks: Vector3[], 
    isShort: boolean, 
    isSpur: boolean, // Endpoints
    targetSeed?: Vector3 // Connects to another junction
  } {
    const MAX_LEN = 2; // Threshold for "Feature" vs "Segment"
    const path: Vector3[] = [start];
    let curr = start;
    let prev = from;

    while (path.length <= MAX_LEN + 1) { // Look slightly ahead
      const nexts = this.getHorizontalNeighbors(curr).filter(n => {
        const k = vectorToKey(n);
        return this.blockSet.has(k) && vectorToKey(n) !== vectorToKey(prev);
      });

      if (nexts.length === 0) {
        // Enpoint reached
        return { blocks: path, isShort: path.length <= MAX_LEN, isSpur: true };
      }

      if (nexts.length > 1) {
        // Should not happen if non-seed (degree < 3), unless we missed a seed definition?
        // Or simply split path. Treat as endpoint for simplicity or seed.
        // Actually if degree >= 3 it would be in allSeeds.
        // So nexts must be length 1.
        return { blocks: path, isShort: path.length <= MAX_LEN, isSpur: true };
      }

      const next = nexts[0];
      const nKey = vectorToKey(next);

      // Hit a seed?
      if (allSeeds.has(nKey)) {
         return { blocks: path, isShort: path.length <= MAX_LEN, isSpur: false, targetSeed: next };
      }

      // Continue
      path.push(next);
      prev = curr;
      curr = next;
    }

    // Too long
    return { blocks: path, isShort: false, isSpur: false };
  }

  /**
   * Count horizontal neighbors (4-directional) that exist in blockSet
   */
  private countHorizontalNeighbors(block: Vector3): number {
    return this.getHorizontalNeighbors(block).filter(n => 
      this.blockSet.has(vectorToKey(n))
    ).length;
  }

  /**
   * Get 4-directional horizontal neighbors
   */
  private getHorizontalNeighbors(block: Vector3): Vector3[] {
    return [
      { x: block.x + 1, y: block.y, z: block.z },
      { x: block.x - 1, y: block.y, z: block.z },
      { x: block.x, y: block.y, z: block.z + 1 },
      { x: block.x, y: block.y, z: block.z - 1 },
    ];
  }

  /**
   * Check if block is adjacent to 2+ junction blocks
   */
  private isAdjacentToMultipleJunctions(block: Vector3, junctions: Vector3[]): boolean {
    const junctionSet = new Set(junctions.map(j => vectorToKey(j)));
    const neighbors = this.getHorizontalNeighbors(block);
    let adjacentJunctionCount = 0;
    for (const n of neighbors) {
      if (junctionSet.has(vectorToKey(n))) {
        adjacentJunctionCount++;
      }
    }
    return adjacentJunctionCount >= 2;
  }

  /**
   * Tạo Area object từ danh sách blocks
   */
  private createArea(id: string, blocks: Vector3[]): Area {
    // Calculate bounding box
    const min = { x: Infinity, y: Infinity, z: Infinity };
    const max = { x: -Infinity, y: -Infinity, z: -Infinity };
    
    for (const b of blocks) {
      min.x = Math.min(min.x, b.x);
      min.y = Math.min(min.y, b.y);
      min.z = Math.min(min.z, b.z);
      max.x = Math.max(max.x, b.x);
      max.y = Math.max(max.y, b.y);
      max.z = Math.max(max.z, b.z);
    }

    // Calculate center (centroid)
    const center = {
      x: blocks.reduce((sum, b) => sum + b.x, 0) / blocks.length,
      y: blocks.reduce((sum, b) => sum + b.y, 0) / blocks.length,
      z: blocks.reduce((sum, b) => sum + b.z, 0) / blocks.length
    };

    // Find boundary blocks (blocks có ít nhất 1 hướng không có neighbor)
    const blockKeySet = new Set(blocks.map(vectorToKey));
    const boundary = blocks.filter(b => {
      const neighbors = [
        { x: b.x + 1, y: b.y, z: b.z },
        { x: b.x - 1, y: b.y, z: b.z },
        { x: b.x, y: b.y, z: b.z + 1 },
        { x: b.x, y: b.y, z: b.z - 1 },
      ];
      return neighbors.some(n => !blockKeySet.has(vectorToKey(n)));
    });

    return {
      id,
      blocks,
      boundary,
      center,
      boundingBox: { min, max }
    };
  }

  // ============================================================================
  // NEW: GEOMETRIC REASONING ENGINE METHODS
  // ============================================================================

  /**
   * Detect holes inside an area using flood fill algorithm
   * Algorithm: 
   * 1. Find bounding box
   * 2. Flood fill from outside corner
   * 3. Any empty cell not reached by flood fill is a hole
   */
  private detectHoles(area: Area): Hole[] {
    const holes: Hole[] = [];
    const yLevel = area.blocks[0]?.y ?? 0;
    
    // Create 2D representation
    const areaSet2D = new Set<string>();
    for (const block of area.blocks) {
      areaSet2D.add(this.vector2DKey(block));
    }
    
    if (areaSet2D.size === 0) return holes;
    
    // Find bounding box (with 1-block padding)
    const xs = area.blocks.map(b => b.x);
    const zs = area.blocks.map(b => b.z);
    const minX = Math.min(...xs) - 1;
    const maxX = Math.max(...xs) + 1;
    const minZ = Math.min(...zs) - 1;
    const maxZ = Math.max(...zs) + 1;
    
    // Flood fill from outside corner
    const outside = new Set<string>();
    const queue: Array<{x: number, z: number}> = [{x: minX, z: minZ}];
    
    while (queue.length > 0) {
      const {x, z} = queue.shift()!;
      const key = `${x},${z}`;
      
      if (outside.has(key) || areaSet2D.has(key)) continue;
      if (x < minX || x > maxX || z < minZ || z > maxZ) continue;
      
      outside.add(key);
      
      for (const dir of this.DIRECTIONS_2D) {
        queue.push({x: x + dir.x, z: z + dir.z});
      }
    }
    
    // Find all empty cells within bounding box
    const emptyCells = new Set<string>();
    for (let x = minX; x <= maxX; x++) {
      for (let z = minZ; z <= maxZ; z++) {
        const key = `${x},${z}`;
        if (!areaSet2D.has(key) && !outside.has(key)) {
          emptyCells.add(key);
        }
      }
    }
    
    // Group connected empty cells into holes
    const visitedEmpty = new Set<string>();
    let holeId = 0;
    
    for (const cellKey of emptyCells) {
      if (visitedEmpty.has(cellKey)) continue;
      
      const holeCoords: Vector3[] = [];
      const holeQueue = [this.parse2DKey(cellKey)];
      
      while (holeQueue.length > 0) {
        const {x, z} = holeQueue.shift()!;
        const key = `${x},${z}`;
        
        if (visitedEmpty.has(key) || !emptyCells.has(key)) continue;
        
        visitedEmpty.add(key);
        holeCoords.push({x, y: yLevel, z});
        
        for (const dir of this.DIRECTIONS_2D) {
          holeQueue.push({x: x + dir.x, z: z + dir.z});
        }
      }
      
      if (holeCoords.length > 0) {
        // Check if hole is centered
        const holeCentroid = {
          x: holeCoords.reduce((s, c) => s + c.x, 0) / holeCoords.length,
          z: holeCoords.reduce((s, c) => s + c.z, 0) / holeCoords.length
        };
        const areaCentroid = {x: area.center.x, z: area.center.z};
        const distance = Math.sqrt(
          Math.pow(holeCentroid.x - areaCentroid.x, 2) + 
          Math.pow(holeCentroid.z - areaCentroid.z, 2)
        );
        const areaSize = Math.max(maxX - minX, maxZ - minZ);
        const isCentered = distance < areaSize * 0.2;
        
        holes.push({
          id: `hole_${area.id}_${holeId++}`,
          coords: holeCoords,
          size: holeCoords.length,
          isCentered
        });
      }
    }
    
    return holes;
  }

  /**
   * Find gateways - connection points between paths and areas
   * Gateway = where a path endpoint is adjacent to an area boundary
   */
  private findGateways(areas: Area[], segments: PathSegment[]): Gateway[] {
    const gateways: Gateway[] = [];
    let gatewayId = 0;
    
    for (const area of areas) {
      const areaBoundarySet = new Set(area.boundary.map(b => vectorToKey(b)));
      
      for (const segment of segments) {
        // Check both endpoints of the segment
        const endpoints = [segment.points[0], segment.points[segment.points.length - 1]];
        
        for (const endpoint of endpoints) {
          // Check if endpoint is adjacent to area boundary
          const neighbors = this.getHorizontalNeighbors(endpoint);
          
          for (const neighbor of neighbors) {
            const neighborKey = vectorToKey(neighbor);
            
            if (areaBoundarySet.has(neighborKey)) {
              // Found a gateway!
              // Calculate direction from path into area
              const direction = vectorNormalize(vectorSub(neighbor, endpoint));
              
              // Check if we already have this gateway
              const exists = gateways.some(g => 
                vectorEquals(g.coord, endpoint) && 
                g.connectedAreaId === area.id
              );
              
              if (!exists) {
                gateways.push({
                  id: `gateway_${gatewayId++}`,
                  coord: endpoint,
                  connectedPathId: segment.id,
                  connectedAreaId: area.id,
                  direction
                });
              }
              break; // Found gateway for this endpoint
            }
          }
        }
      }
    }
    
    return gateways;
  }

  /**
   * Analyze MetaPaths - chains of connected path segments with pattern detection
   * Uses junction-aware chain building (DFS) and pattern classification
   */
  private analyzeMetaPaths(segments: PathSegment[]): MetaPath[] {
    const metaPaths: MetaPath[] = [];
    
    if (segments.length === 0) return metaPaths;
    
    // Build adjacency graph based on shared endpoints
    const endpointToSegments = new Map<string, string[]>();
    
    for (const segment of segments) {
      const startKey = vectorToKey(segment.points[0]);
      const endKey = vectorToKey(segment.points[segment.points.length - 1]);
      
      if (!endpointToSegments.has(startKey)) endpointToSegments.set(startKey, []);
      if (!endpointToSegments.has(endKey)) endpointToSegments.set(endKey, []);
      
      endpointToSegments.get(startKey)!.push(segment.id);
      endpointToSegments.get(endKey)!.push(segment.id);
    }
    
    // Find connected chains
    const visitedSegments = new Set<string>();
    const segmentMap = new Map(segments.map(s => [s.id, s]));
    let metaPathId = 0;
    
    for (const segment of segments) {
      if (visitedSegments.has(segment.id)) continue;
      
      // DFS to find all connected segments
      const chain: PathSegment[] = [];
      const stack = [segment.id];
      
      while (stack.length > 0) {
        const segId = stack.pop()!;
        if (visitedSegments.has(segId)) continue;
        
        visitedSegments.add(segId);
        const seg = segmentMap.get(segId)!;
        chain.push(seg);
        
        // Find connected segments via shared endpoints
        const startKey = vectorToKey(seg.points[0]);
        const endKey = vectorToKey(seg.points[seg.points.length - 1]);
        
        for (const key of [startKey, endKey]) {
          const connectedSegIds = endpointToSegments.get(key) || [];
          for (const connectedId of connectedSegIds) {
            if (!visitedSegments.has(connectedId)) {
              stack.push(connectedId);
            }
          }
        }
      }
      
      if (chain.length > 0) {
        // Classify the meta-path structure
        const metaPath = this.classifyMetaPath(chain, metaPathId++);
        metaPaths.push(metaPath);
      }
    }
    
    return metaPaths;
  }

  /**
   * Classify a chain of segments into a MetaPath with structure type
   */
  private classifyMetaPath(chain: PathSegment[], id: number): MetaPath {
    // Collect all points and find joints (direction changes)
    const allPoints: Vector3[] = [];
    const joints: Vector3[] = [];
    
    for (let i = 0; i < chain.length; i++) {
      const seg = chain[i];
      allPoints.push(...seg.points);
      
      // Joint = connection point between segments
      if (i > 0) {
        const prevEnd = chain[i-1].points[chain[i-1].points.length - 1];
        const currStart = seg.points[0];
        
        // Check if they share a point (which is a joint)
        if (vectorEquals(prevEnd, currStart)) {
          joints.push(currStart);
        } else {
          const prevStart = chain[i-1].points[0];
          if (vectorEquals(prevStart, currStart)) {
            joints.push(currStart);
          }
        }
      }
    }
    
    // Calculate total length (Block Count)
    // Formula: Sum of segment lengths (blocks) - Number of joints (overlaps)
    // Assuming linear chain where Segments share 1 point at each joint: Overlaps = Segments - 1
    const totalLength = chain.reduce((sum, s) => sum + s.length, 0) - (chain.length - 1);
    
    // Determine structure type based on directions
    let structureType: MetaPath['structureType'] = 'random';
    let isRegular = false;
    
    if (chain.length === 1) {
      structureType = 'straight_chain';
      isRegular = true;
    } else {
      // Check if all segments have same direction (straight chain)
      const directions = chain.map(s => vectorToKey(s.direction));
      const uniqueDirections = new Set(directions);
      
      if (uniqueDirections.size === 1) {
        structureType = 'straight_chain';
        isRegular = true;
      } else if (uniqueDirections.size === 2) {
        // Could be staircase or U-shape
        const lengths = chain.map(s => s.length);
        const lengthSet = new Set(lengths);
        
        if (lengthSet.size === 1) {
          structureType = 'macro_staircase';
          isRegular = true;
        } else {
          // Check for U-shape pattern (long-short-long)
          if (chain.length >= 3 && 
              chain[0].length === chain[chain.length-1].length &&
              chain[0].length > chain[1].length) {
            structureType = 'u_shape';
            isRegular = true;
          }
        }
      } else if (uniqueDirections.size >= 3) {
        // Check for spiral (increasing lengths)
        const lengths = chain.map(s => s.length);
        const isIncreasing = lengths.every((len, i) => i === 0 || len >= lengths[i-1]);
        
        if (isIncreasing) {
          structureType = 'spiral';
          isRegular = true;
        } else {
          structureType = 'branching';
        }
      }
    }
    
    return {
      id: `metapath_${id}`,
      segments: chain,
      joints,
      structureType,
      isRegular,
      totalLength
    };
  }

  /**
   * Enrich areas with holes and gateways information
   */
  private enrichAreasWithHolesAndGateways(areas: Area[], gateways: Gateway[]): void {
    for (const area of areas) {
      // Detect and attach holes
      const holes = this.detectHoles(area);
      area.holes = holes;
      
      // Attach relevant gateways
      area.gateways = gateways.filter(g => g.connectedAreaId === area.id);
      
      // Calculate dimensions and shape type
      const xs = area.blocks.map(b => b.x);
      const zs = area.blocks.map(b => b.z);
      const width = Math.max(...xs) - Math.min(...xs) + 1;
      const depth = Math.max(...zs) - Math.min(...zs) + 1;
      const ratio = width / depth;
      
      area.dimensions = { width, depth };
      area.shapeType = (ratio >= 0.8 && ratio <= 1.2) ? 'square' : 
                       (Math.abs(ratio - 1) < 0.5) ? 'rectangle' : 'irregular';
    }
  }

  /**
   * Tìm connectors giữa các areas
   * Connector là đường đi (có thể leo/xuống) nối 2 areas khác nhau
   */
  private findConnectors(areas: Area[]): Connector[] {
    const connectors: Connector[] = [];
    
    if (areas.length < 2) return connectors;

    // Tạo map từ block key -> area id
    const blockToArea = new Map<string, string>();
    for (const area of areas) {
      for (const block of area.blocks) {
        blockToArea.set(vectorToKey(block), area.id);
      }
    }

    // Tìm các blocks là "bridge" - có thể đi tới từ area này sang area khác
    // Bridge là block có y khác với neighbors
    for (const block of this.blocks) {
      const currentAreaId = blockToArea.get(vectorToKey(block));
      
      // Check neighbors với y khác nhau (leo lên/xuống)
      const verticalNeighbors = [
        { x: block.x, y: block.y + 1, z: block.z },
        { x: block.x, y: block.y - 1, z: block.z },
        { x: block.x + 1, y: block.y + 1, z: block.z },
        { x: block.x - 1, y: block.y + 1, z: block.z },
        { x: block.x, y: block.y + 1, z: block.z + 1 },
        { x: block.x, y: block.y + 1, z: block.z - 1 },
      ];

      for (const neighbor of verticalNeighbors) {
        const neighborKey = vectorToKey(neighbor);
        if (this.blockSet.has(neighborKey)) {
          const neighborAreaId = blockToArea.get(neighborKey);
          
          if (neighborAreaId && neighborAreaId !== currentAreaId) {
            // Found connection between two areas
            const existingConnector = connectors.find(
              c => (c.fromArea === currentAreaId && c.toArea === neighborAreaId) ||
                   (c.fromArea === neighborAreaId && c.toArea === currentAreaId)
            );

            if (!existingConnector) {
              // Trace the path between areas
              const path = this.traceConnectorPath(block, neighbor, blockToArea);
              const segments = this.pathToSegments(`connector_${connectors.length}`, path);
              
              connectors.push({
                id: `connector_${connectors.length}`,
                fromArea: currentAreaId!,
                toArea: neighborAreaId,
                path,
                segments
              });
            }
          }
        }
      }
    }

    return connectors;
  }

  /**
   * Trace path giữa 2 blocks (cho connector)
   */
  private traceConnectorPath(from: Vector3, to: Vector3, blockToArea: Map<string, string>): Vector3[] {
    // Simple case: direct connection
    const path: Vector3[] = [from, to];
    
    // TODO: Implement A* or BFS để tìm full path nếu không direct
    // For now, return simple path
    
    return path;
  }

  /**
   * Trace tất cả segments từ blocks
   * [UPDATED] Thêm excludeSet để tránh trace vào Area
   */
  private traceAllSegments(excludeSet: Set<string> = new Set()): PathSegment[] {
    const segments: PathSegment[] = [];
    const visited = new Set<string>();

    for (const block of this.blocks) {
      const key = vectorToKey(block);
      
      // [FIX] Nếu block đã thuộc Area hoặc đã thăm -> Bỏ qua
      if (visited.has(key) || excludeSet.has(key)) continue;

      // Try to trace segment in each direction
      for (const dir of this.getCardinalDirections()) {
        const segment = this.traceSegmentInDirection(block, dir, visited, excludeSet);
        if (segment && segment.points.length >= 2) {
          segment.id = `seg_${segments.length}`;
          segments.push(segment);
          
          // Mark all points as visited
          for (const p of segment.points) {
            visited.add(vectorToKey(p));
          }
        }
      }
    }

    return segments;
  }

  /**
   * Trace segment theo 1 hướng
   */
  private traceSegmentInDirection(
    start: Vector3, 
    direction: Vector3, 
    visited: Set<string>,
    excludeSet: Set<string> = new Set()
  ): PathSegment | null {
    const points: Vector3[] = [start];
    let current = start;

    while (true) {
      const next = vectorAdd(current, direction);
      const nextKey = vectorToKey(next);

      if (!this.blockSet.has(nextKey) || visited.has(nextKey) || excludeSet.has(nextKey)) break;

      points.push(next);
      current = next;
    }

    // Also trace backwards
    current = start;
    const backDir = vectorScale(direction, -1);
    const backPoints: Vector3[] = [];

    while (true) {
      const next = vectorAdd(current, backDir);
      const nextKey = vectorToKey(next);

      if (!this.blockSet.has(nextKey) || visited.has(nextKey) || excludeSet.has(nextKey)) break;

      backPoints.unshift(next);
      current = next;
    }

    const allPoints = [...backPoints, ...points];
    if (allPoints.length < 2) return null;

    const segmentDir = vectorNormalize(vectorSub(allPoints[allPoints.length - 1], allPoints[0]));
    const plane = this.determinePlane(segmentDir);

    return {
      id: '', // Will be set by caller
      points: allPoints,
      direction: segmentDir,
      length: allPoints.length, // Block count (was -1 for edge count)
      plane
    };
  }

  /**
   * Convert path to segments
   */
  private pathToSegments(prefix: string, path: Vector3[]): PathSegment[] {
    if (path.length < 2) return [];

    const segments: PathSegment[] = [];
    let currentSegmentStart = 0;
    let currentDir: Vector3 | null = null;

    for (let i = 1; i < path.length; i++) {
      const dir = vectorNormalize(vectorSub(path[i], path[i - 1]));
      
      if (currentDir === null) {
        currentDir = dir;
      } else if (!vectorEquals(dir, currentDir)) {
        // Direction changed, end current segment
        const segmentPoints = path.slice(currentSegmentStart, i);
        if (segmentPoints.length >= 2) {
          segments.push({
            id: `${prefix}_${segments.length}`,
            points: segmentPoints,
            direction: currentDir,
            length: segmentPoints.length, // Block count
            plane: this.determinePlane(currentDir)
          });
        }
        currentSegmentStart = i - 1;
        currentDir = dir;
      }
    }

    // Add last segment
    const lastPoints = path.slice(currentSegmentStart);
    if (lastPoints.length >= 2 && currentDir) {
      segments.push({
        id: `${prefix}_${segments.length}`,
        points: lastPoints,
        direction: currentDir,
        length: lastPoints.length, // Block count
        plane: this.determinePlane(currentDir)
      });
    }

    return segments;
  }

  /**
   * Xác định plane của segment
   */
  private determinePlane(direction: Vector3): 'xy' | 'xz' | 'yz' | '3d' {
    const absX = Math.abs(direction.x);
    const absY = Math.abs(direction.y);
    const absZ = Math.abs(direction.z);

    if (absZ < 0.01) return 'xy';
    if (absY < 0.01) return 'xz';
    if (absX < 0.01) return 'yz';
    return '3d';
  }

  /**
   * Các hướng cardinal (6 hướng trong 3D)
   */
  private getCardinalDirections(): Vector3[] {
    return [
      { x: 1, y: 0, z: 0 },
      { x: 0, y: 1, z: 0 },
      { x: 0, y: 0, z: 1 },
    ];
  }

  /**
   * Tìm special points (junctions, endpoints, centers)
   */
  private findSpecialPoints(segments: PathSegment[]): SpecialPoint[] {
    const pointConnections = new Map<string, string[]>();

    // Count connections for each point
    for (const segment of segments) {
      for (const point of segment.points) {
        const key = vectorToKey(point);
        if (!pointConnections.has(key)) {
          pointConnections.set(key, []);
        }
        pointConnections.get(key)!.push(segment.id);
      }
    }

    const specialPoints: SpecialPoint[] = [];

    for (const [key, segmentIds] of pointConnections) {
      const coord = keyToVector(key);
      let type: SpecialPoint['type'];

      if (segmentIds.length >= 3) {
        type = 'junction';
      } else if (segmentIds.length === 1) {
        // Check if it's an endpoint of the segment
        const segment = segments.find(s => s.id === segmentIds[0]);
        if (segment) {
          const isStart = vectorEquals(coord, segment.points[0]);
          const isEnd = vectorEquals(coord, segment.points[segment.points.length - 1]);
          type = (isStart || isEnd) ? 'endpoint' : 'isolated';
        } else {
          type = 'isolated';
        }
      } else {
        continue; // Not special, skip
      }

      specialPoints.push({
        id: `point_${specialPoints.length}`,
        coord,
        type,
        connectedSegments: [...new Set(segmentIds)]
      });
    }

    return specialPoints;
  }

  // [NEW] Hàm tách cánh và cấu trúc con trong Area
  private analyzeAreaInternals(areas: Area[]) {
    for (const area of areas) {
      area.subStructures = [];
      area.internalPaths = [];
      const blocks = area.blocks;
      if (blocks.length < 3) continue;

      // ---------------------------------------------------------
      // 1. Mass Analysis (Symmetry)
      // ---------------------------------------------------------
      const xs = blocks.map(b => b.x);
      const minX = Math.min(...xs);
      const maxX = Math.max(...xs);
      const midX = (minX + maxX) / 2;

      const leftBlocks = blocks.filter(b => b.x < midX);
      const rightBlocks = blocks.filter(b => b.x > midX);

      if (leftBlocks.length > 0 && Math.abs(leftBlocks.length - rightBlocks.length) <= 1) {
        area.subStructures.push({ type: 'wing_mass', id: `${area.id}_left_mass`, coords: leftBlocks, description: "Left Wing Volume" });
        area.subStructures.push({ type: 'wing_mass', id: `${area.id}_right_mass`, coords: rightBlocks, description: "Right Wing Volume" });
      }

      // ---------------------------------------------------------
      // 2. Generic Contour Tracing (New Engine)
      // ---------------------------------------------------------
      const tracer = new AreaBoundaryAnalyzer();
      const boundaryPaths = tracer.analyzeBoundary(blocks);
      
      boundaryPaths.forEach(edge => {
          // Add prefix to make ID unique per area
          edge.id = `${area.id}_${edge.id}`;
          
          // Classify edge for UI/Optimization
          const isDiagonal = Math.abs(edge.direction.x) > 0 && Math.abs(edge.direction.z) > 0;
          const isHorizontal = Math.abs(edge.direction.x) > 0 && edge.direction.z === 0;
          
          if (isDiagonal) {
              // Ensure keyword 'zigzag' or 'staircase' allows Tier 4 detection
              if (!edge.id.includes('zigzag') && !edge.id.includes('staircase')) {
                  edge.id += '_zigzag';
              }
          } else if (isHorizontal) {
              // Identify potential Base edge (horizontal and reasonably long)
              if (edge.length >= 3) {
                  edge.id += '_base'; 
              } else {
                  edge.id += '_straight';
              }
          }
      });
       
      area.internalPaths = boundaryPaths;
    }
  }

  /**
   * Phân tích quan hệ giữa các segments
   */
  private analyzeRelations(segments: PathSegment[]): PathRelation[] {
    const relations: PathRelation[] = [];

    for (let i = 0; i < segments.length; i++) {
      for (let j = i + 1; j < segments.length; j++) {
        const seg1 = segments[i];
        const seg2 = segments[j];

        // Check parallel
        if (this.areParallel(seg1, seg2)) {
          const distance = this.distanceBetweenParallel(seg1, seg2);
          relations.push({
            type: 'parallel_axis',
            path1Id: seg1.id,
            path2Id: seg2.id,
            metadata: { distance }
          });

          // Also check axis symmetric
          const axisSymmetry = this.checkAxisSymmetry(seg1, seg2);
          if (axisSymmetry) {
            relations.push({
              type: 'axis_symmetric',
              path1Id: seg1.id,
              path2Id: seg2.id,
              metadata: { axis: axisSymmetry.axis }
            });
          }
        }

        // Check perpendicular
        if (this.arePerpendicular(seg1, seg2)) {
          relations.push({
            type: 'perpendicular',
            path1Id: seg1.id,
            path2Id: seg2.id,
            metadata: { angle: 90 }
          });
        }

        // Check point symmetric
        const pointSymmetry = this.checkPointSymmetry(seg1, seg2);
        if (pointSymmetry) {
          relations.push({
            type: 'point_symmetric',
            path1Id: seg1.id,
            path2Id: seg2.id,
            metadata: { center: pointSymmetry.center }
          });
        }
      }
    }

    return relations;
  }

  private areParallel(seg1: PathSegment, seg2: PathSegment): boolean {
    const cross = vectorCross(seg1.direction, seg2.direction);
    return vectorMagnitude(cross) < 0.01;
  }

  private arePerpendicular(seg1: PathSegment, seg2: PathSegment): boolean {
    const dot = Math.abs(vectorDot(seg1.direction, seg2.direction));
    return dot < 0.01;
  }

  private distanceBetweenParallel(seg1: PathSegment, seg2: PathSegment): number {
    const p1 = seg1.points[0];
    const p2 = seg2.points[0];
    const v = vectorSub(p2, p1);
    const d = seg1.direction;
    
    // Distance = |v - (v·d)d|
    const projection = vectorScale(d, vectorDot(v, d));
    const perpendicular = vectorSub(v, projection);
    return vectorMagnitude(perpendicular);
  }

  private checkAxisSymmetry(seg1: PathSegment, seg2: PathSegment): { axis: Vector3 } | null {
    // Simplified: check if midpoints are equidistant from a potential axis
    const mid1 = this.getMidpoint(seg1.points);
    const mid2 = this.getMidpoint(seg2.points);
    
    const axisMid = vectorScale(vectorAdd(mid1, mid2), 0.5);
    const dist1 = vectorDistance(mid1, axisMid);
    const dist2 = vectorDistance(mid2, axisMid);

    if (Math.abs(dist1 - dist2) < 0.01 && seg1.length === seg2.length) {
      const axisDir = vectorNormalize(vectorSub(mid2, mid1));
      return { axis: axisDir };
    }

    return null;
  }

  private checkPointSymmetry(seg1: PathSegment, seg2: PathSegment): { center: Vector3 } | null {
    const mid1 = this.getMidpoint(seg1.points);
    const mid2 = this.getMidpoint(seg2.points);
    const center = vectorScale(vectorAdd(mid1, mid2), 0.5);

    // Check if all points of seg1 have symmetric counterparts in seg2
    let matchCount = 0;
    for (const p1 of seg1.points) {
      const reflected = vectorSub(vectorScale(center, 2), p1);
      if (seg2.points.some(p2 => vectorDistance(p2, reflected) < 0.5)) {
        matchCount++;
      }
    }

    if (matchCount >= seg1.points.length * 0.8) {
      return { center };
    }

    return null;
  }

  private getMidpoint(points: Vector3[]): Vector3 {
    const sum = points.reduce((acc, p) => vectorAdd(acc, p), { x: 0, y: 0, z: 0 });
    return vectorScale(sum, 1 / points.length);
  }
}

// ============================================================================
// TIER 2: PATTERN EXTRAPOLATION
// ============================================================================

class Tier2Analyzer {
  analyze(tier1Result: Tier1Result): Tier2Result {
    const patterns = this.findPatterns(tier1Result);
    
    return {
      ...tier1Result,
      patterns
    };
  }

  private findPatterns(tier1: Tier1Result): Pattern[] {
    const patterns: Pattern[] = [];
    
    // 1. Internal Staircase/Zigzag Detection in Areas
    // Analyze both Main Segments and Area Internal Paths
    let allSegmentsToAnalyze = [...tier1.segments];
    tier1.areas.forEach(a => {
        if (a.internalPaths) allSegmentsToAnalyze.push(...a.internalPaths);
    });

    for (const seg of allSegmentsToAnalyze) {
        // If diagonal direction (e.g. x=1, z=1)
        if (Math.abs(seg.direction.x) > 0 && Math.abs(seg.direction.z) > 0) {
            patterns.push({
                id: `pattern_staircase_${seg.id}`,
                type: 'repeat', 
                unitElements: [seg.id],
                repetitions: seg.length,
                transform: { translate: seg.direction }
            });
        }
    }

    // 2. Area Symmetry (Wings)
    for (const area of tier1.areas) {
      if (area.subStructures) {
        const leftWing = area.subStructures.find(s => s.id.includes('left_mass') || s.id.includes('left_wing'));
        const rightWing = area.subStructures.find(s => s.id.includes('right_mass') || s.id.includes('right_wing'));

        if (leftWing && rightWing) {
          patterns.push({
            id: `pattern_area_symmetry_${area.id}`,
            type: 'mirror',
            unitElements: [leftWing.id, rightWing.id], 
            repetitions: 2,
            transform: {
              mirrorPlane: 'xz' 
            }
          });
        }
      }
    }


    // Find repeat patterns from relations
    const symmetricPairs = tier1.relations.filter(r => r.type === 'axis_symmetric');
    if (symmetricPairs.length >= 2) {
      // Multiple symmetric pairs might form a repeating pattern
      patterns.push({
        id: `pattern_${patterns.length}`,
        type: 'mirror',
        unitElements: symmetricPairs.slice(0, 2).map(r => r.path1Id),
        repetitions: symmetricPairs.length,
        transform: {
          mirrorPlane: 'xz' // Simplified
        }
      });
    }

    // Find translation patterns (same-length parallel segments)
    const parallelGroups = this.groupParallelSegments(tier1);
    for (const [key, group] of parallelGroups) {
      if (group.length >= 3) {
        const translateVector = this.findTranslationVector(group, tier1.segments);
        if (translateVector) {
          patterns.push({
            id: `pattern_${patterns.length}`,
            type: 'repeat',
            unitElements: [group[0].path1Id],
            repetitions: group.length,
            transform: {
              translate: translateVector
            }
          });
        }
      }
    }

    return patterns;
  }

  private groupParallelSegments(tier1: Tier1Result): Map<string, PathRelation[]> {
    const groups = new Map<string, PathRelation[]>();
    
    for (const relation of tier1.relations) {
      if (relation.type === 'parallel_axis') {
        const key = `${relation.metadata.distance?.toFixed(1)}`;
        if (!groups.has(key)) {
          groups.set(key, []);
        }
        groups.get(key)!.push(relation);
      }
    }

    return groups;
  }

  private findTranslationVector(group: PathRelation[], segments: PathSegment[]): Vector3 | null {
    if (group.length < 2) return null;

    const seg1 = segments.find(s => s.id === group[0].path1Id);
    const seg2 = segments.find(s => s.id === group[0].path2Id);

    if (!seg1 || !seg2) return null;

    return vectorSub(seg2.points[0], seg1.points[0]);
  }
}

// ============================================================================
// TIER 3: LENGTH FILTERING
// ============================================================================

class Tier3Analyzer {
  constructor(private minLength: number = 2) {}

  analyze(tier2Result: Tier2Result): Tier3Result {
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

  private mergeAdjacentSegments(segments: PathSegment[]): PathSegment[] {
    // Simplified: just return as-is for now
    // TODO: Implement actual merging logic
    return segments;
  }
}

// ============================================================================
// TIER 4: OUTPUT FOR ITEM PLACEMENT (with Prioritization & Metrics)
// ============================================================================

class Tier4Analyzer {
  constructor(private preferredInterval?: number) {}

  analyze(tier3Result: Tier3Result): PlacementContext {
    const suggestedPlacements = this.generateSuggestions(tier3Result);
    const metrics = this.computeMetrics(tier3Result);
    const constraints = this.computeConstraints(metrics);
    const prioritizedCoords = this.prioritizeCoordinates(tier3Result, metrics);
    const selectableElements = this.generateSelectableElements(tier3Result, metrics);

    return {
      points: tier3Result.points,
      segments: tier3Result.mergedSegments,
      areas: tier3Result.areas,
      connectors: tier3Result.connectors,
      patterns: tier3Result.patterns,
      relations: tier3Result.relations,
      metaPaths: tier3Result.metaPaths,
      gateways: tier3Result.gateways,
      prioritizedCoords,
      metrics,
      constraints,
      selectableElements,
      suggestedPlacements
    };
  }

  /**
   * Generate selectable elements from tier3 result
   */
  private generateSelectableElements(tier3: Tier3Result, metrics: MapMetrics): SelectableElement[] {
    const elements: SelectableElement[] = [];
    
    // 1. Generate segment elements
    for (let i = 0; i < tier3.mergedSegments.length; i++) {
      const segment = tier3.mergedSegments[i];
      const segmentName = segment.id || `segment_${i}`;
      
      // Convert Vector3[] to Coord[]
      const coords: SECoord[] = segment.points.map(p => [p.x, p.y, p.z] as SECoord);
      
      // Add segment element
      elements.push(createSegmentElement(segmentName, coords, 'recommended'));
      
      // Check for mirror relationship
      const mirrorSegment = this.findMirrorSegment(tier3, segment);
      const mirrorName = mirrorSegment ? (mirrorSegment.id || undefined) : undefined;
      
      // Add position elements along segment
      const positionElements = createPositionElements(segmentName, coords, {
        interval: 1,
        skipFirst: true,
        skipLast: true,
        mirrorSegment: mirrorName
      });
      elements.push(...positionElements);
    }
    
    // 1b. [NEW] Create selectable elements for Area Substructures & Internal Paths
    for (const area of tier3.areas) {
      if (area.subStructures) {
        for (const sub of area.subStructures) {
          elements.push({
            id: sub.id,
            type: 'segment', // Treat as segment for selection purposes
            coords: sub.coords.map(c => [c.x, c.y, c.z] as SECoord),
            metadata: { 
              role: sub.type,
              description: sub.description
            }
          } as any);
        }
      }

      // [NEW] Area Internal Paths (Edges)
      if (area.internalPaths) {
        for (const path of area.internalPaths) {
          const coords: SECoord[] = path.points.map(c => [c.x, c.y, c.z] as SECoord);
          
          let label = 'Internal Path';
          if (path.id.includes('zigzag')) label = 'Zigzag Edge (Staircase)';
          if (path.id.includes('base')) label = 'Base Edge (Parallel)';
          if (path.id.includes('spine')) label = 'Central Spine';

          elements.push({
            id: path.id,
            type: 'segment', 
            coords: coords,
            metadata: { role: 'boundary_edge', label }
          } as any);
        }
      }
    }

    // 2. Generate keypoint elements from special points
    // Endpoints
    const endpoints = new Set<string>();
    for (const segment of tier3.mergedSegments) {
      if (segment.points.length >= 2) {
        const start = segment.points[0];
        const end = segment.points[segment.points.length - 1];
        
        const startKey = `${start.x},${start.y},${start.z}`;
        const endKey = `${end.x},${end.y},${end.z}`;
        
        if (!endpoints.has(startKey)) {
          endpoints.add(startKey);
          elements.push(createKeypointElement(
            `endpoint_${endpoints.size}`,
            [start.x, start.y, start.z] as SECoord,
            'important',
            `Endpoint ${endpoints.size}`
          ));
        }
        
        if (!endpoints.has(endKey)) {
          endpoints.add(endKey);
          elements.push(createKeypointElement(
            `endpoint_${endpoints.size}`,
            [end.x, end.y, end.z] as SECoord,
            'important',
            `Endpoint ${endpoints.size}`
          ));
        }
      }
    }
    
    // 3. Add center as keypoint if map is not tiny
    if (metrics.estimatedSize !== 'tiny') {
      elements.push(createKeypointElement(
        'center',
        [metrics.center.x, metrics.center.y, metrics.center.z] as SECoord,
        'recommended',
        'Map Center'
      ));
    }
    
    // 4. Detect junctions (points where 3+ segments meet)
    const pointCount = new Map<string, { coord: SECoord; count: number }>();
    for (const segment of tier3.mergedSegments) {
      for (const p of [segment.points[0], segment.points[segment.points.length - 1]]) {
        const key = `${p.x},${p.y},${p.z}`;
        const existing = pointCount.get(key);
        if (existing) {
          existing.count++;
        } else {
          pointCount.set(key, { coord: [p.x, p.y, p.z] as SECoord, count: 1 });
        }
      }
    }
    
    let junctionIdx = 0;
    for (const [key, data] of Array.from(pointCount.entries())) {
      if (data.count >= 3) {
        elements.push(createKeypointElement(
          `junction_${junctionIdx}`,
          data.coord,
          'critical',
          `Junction ${junctionIdx + 1}`
        ));
        junctionIdx++;
      }
    }
    
    return elements;
  }

  /**
   * Find mirror segment based on symmetric relations
   */
  private findMirrorSegment(tier3: Tier3Result, segment: PathSegment): PathSegment | null {
    for (const relation of tier3.relations) {
      if (relation.type === 'axis_symmetric' || relation.type === 'point_symmetric') {
        if (relation.path1Id === segment.id) {
          return tier3.mergedSegments.find(s => s.id === relation.path2Id) || null;
        }
        if (relation.path2Id === segment.id) {
          return tier3.mergedSegments.find(s => s.id === relation.path1Id) || null;
        }
      }
    }
    return null;
  }

  /**
   * Compute map metrics
   */
  private computeMetrics(tier3: Tier3Result): MapMetrics {
    const allPoints = tier3.mergedSegments.flatMap(s => s.points);
    
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

    const minX = Math.min(...xs), maxX = Math.max(...xs);
    const minY = Math.min(...ys), maxY = Math.max(...ys);
    const minZ = Math.min(...zs), maxZ = Math.max(...zs);

    const width = maxX - minX + 1;
    const height = maxY - minY + 1;
    const depth = maxZ - minZ + 1;
    const area = width * depth;

    // Size category
    let estimatedSize: MapMetrics['estimatedSize'];
    if (area <= 9) estimatedSize = 'tiny';
    else if (area <= 25) estimatedSize = 'small';
    else if (area <= 49) estimatedSize = 'medium';
    else if (area <= 100) estimatedSize = 'large';
    else estimatedSize = 'huge';

    // Junction count
    const pointCounts = new Map<string, number>();
    for (const seg of tier3.mergedSegments) {
      for (const p of [seg.points[0], seg.points[seg.points.length - 1]]) {
        const key = `${p.x},${p.y},${p.z}`;
        pointCounts.set(key, (pointCounts.get(key) || 0) + 1);
      }
    }
    const junctionCount = Array.from(pointCounts.values()).filter(c => c >= 3).length;

    // Longest path (Block count)
    const longestPathLength = tier3.mergedSegments.reduce((max, s) => Math.max(max, s.points.length), 0);

    // Detect topology
    const detectedTopology = this.detectTopology(tier3, junctionCount);

    return {
      totalBlocks: tier3.areas.reduce((sum, a) => sum + a.blocks.length, 0) + allPoints.length,
      boundingBox: { width, height, depth },
      area,
      estimatedSize,
      segmentCount: tier3.mergedSegments.length,
      areaCount: tier3.areas.length,
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
   * Detect topology type
   */
  private detectTopology(tier3: Tier3Result, junctionCount: number): string {
    const segments = tier3.mergedSegments;
    const areas = tier3.areas;
    const relations = tier3.relations;

    // Logic nhận diện Arrow/Key (1 Path nối vào 1 Area rộng)
    if (segments.length === 1 && areas.length === 1) {
      const areaWidth = areas[0].dimensions?.width || 0;
      // Nếu Area rộng hơn Path đáng kể -> Arrow hoặc Spoon
      if (areaWidth >= 3) return 'arrow_shape'; 
      return 'key_shape';
    }

    if (segments.length === 1 && junctionCount === 0) return 'linear';

    const symmetricCount = relations.filter(r => r.type === 'axis_symmetric' || r.type === 'point_symmetric').length;
    const perpendicularCount = relations.filter(r => r.type === 'perpendicular').length;
    const parallelCount = relations.filter(r => r.type === 'parallel_axis').length;

    if (parallelCount >= 4) return 'grid';
    if (symmetricCount >= 2 && perpendicularCount >= 4) return segments.length >= 4 ? 'cross' : 'arrow';
    if (junctionCount === 1 && segments.length === 3) return 't_shape';
    if (symmetricCount === 1 && segments.length === 3) return 'u_shape';
    if (segments.length === 2 && perpendicularCount === 1) return 'l_shape';
    if (junctionCount === 1 && segments.length >= 4) return 'hub_spoke';
    if (junctionCount >= 3) return 'complex_maze';

    const longest = segments.reduce((max, s) => s.length > max.length ? s : max, segments[0]);
    if (longest && longest.length >= 15 && junctionCount === 0) return 'spiral';

    return 'unknown';
  }

  /**
   * Compute placement constraints
   */
  private computeConstraints(metrics: MapMetrics): PlacementConstraints {
    const DENSITY = {
      tiny: { ratio: 0.70, min: 2, max: 6 },
      small: { ratio: 0.50, min: 3, max: 10 },
      medium: { ratio: 0.35, min: 4, max: 15 },
      large: { ratio: 0.25, min: 4, max: 20 },
      huge: { ratio: 0.15, min: 4, max: 25 }
    };

    const TOPO_PREFS: Record<string, { preferred: string[]; avoid: string[]; dist: PlacementConstraints['distribution'] }> = {
      linear: { preferred: ['sequential', 'repeat_n'], avoid: ['nested_loop'], dist: 'spread' },
      l_shape: { preferred: ['sequential', 'procedure_simple'], avoid: ['for_each'], dist: 'endpoints' },
      u_shape: { preferred: ['procedure_simple', 'loop_function_call'], avoid: ['nested_if'], dist: 'symmetric' },
      t_shape: { preferred: ['if_else', 'procedure_simple'], avoid: [], dist: 'symmetric' },
      cross: { preferred: ['procedure_simple', 'loop_function_call'], avoid: [], dist: 'symmetric' },
      arrow: { preferred: ['procedure_simple', 'repeat_n'], avoid: [], dist: 'symmetric' },
      spiral: { preferred: ['while_condition', 'counter'], avoid: [], dist: 'progressive' },
      grid: { preferred: ['nested_loop', 'for_each'], avoid: ['recursion'], dist: 'spread' },
      hub_spoke: { preferred: ['procedure_simple', 'for_each'], avoid: [], dist: 'symmetric' },
      complex_maze: { preferred: ['recursion', 'if_else'], avoid: ['repeat_n'], dist: 'clustered' },
      unknown: { preferred: ['sequential', 'repeat_n'], avoid: [], dist: 'spread' }
    };

    const d = DENSITY[metrics.estimatedSize];
    const topo = TOPO_PREFS[metrics.detectedTopology || 'unknown'] || TOPO_PREFS.unknown;

    const calculatedMax = Math.floor(metrics.totalBlocks * d.ratio);
    const maxItems = Math.min(Math.max(calculatedMax, d.min), d.max);
    
    // Use preferredInterval if provided, otherwise auto-calculate
    const preferredInterval = this.preferredInterval ?? (
      metrics.longestPathLength > 0 ? Math.ceil(metrics.longestPathLength / maxItems) : 2
    );

    return {
      maxItems,
      minItems: d.min,
      targetItemRatio: d.ratio,
      preferredConcepts: topo.preferred,
      avoidConcepts: topo.avoid,
      maxCodeBlocks: 30,
      distribution: topo.dist,
      preferredInterval
    };
  }

  /**
   * Prioritize coordinates based on topology and structure
   */
  private prioritizeCoordinates(tier3: Tier3Result, metrics: MapMetrics): PrioritizedCoord[] {
    const scored = new Map<string, PrioritizedCoord>();
    const center = metrics.center;

    const addCoord = (pos: Vector3, priority: number, category: CoordCategory, reason: string, segmentId?: string) => {
      const key = `${pos.x},${pos.y},${pos.z}`;
      const existing = scored.get(key);
      if (existing) {
        existing.priority = Math.max(existing.priority, priority);
        existing.reasons.push(reason);
      } else {
        scored.set(key, { position: { ...pos }, priority, category, reasons: [reason], segmentId });
      }
    };

    // 1. Segment endpoints
    for (const seg of tier3.mergedSegments) {
      if (seg.points.length >= 2) {
        addCoord(seg.points[0], 7, 'important', 'Segment endpoint (start)', seg.id);
        addCoord(seg.points[seg.points.length - 1], 7, 'important', 'Segment endpoint (end)', seg.id);
      }
    }

    // [NEW] Quét Area Extremities (Tìm cánh và đỉnh)
    for (const area of tier3.areas) {
      const blocks = area.blocks;
      if (blocks.length === 0) continue;

      // Tìm min/max X (Cánh) và max Z (Đỉnh)
      // Group by Z first to find wideness
      const blocksByZ = new Map<number, Vector3[]>();
      blocks.forEach(b => {
        if (!blocksByZ.has(b.z)) blocksByZ.set(b.z, []);
        blocksByZ.get(b.z)!.push(b);
      });

      // Tìm row rộng nhất
      let maxRowWidth = 0;
      let widestRowZ = -1;
      blocksByZ.forEach((row, z) => {
        if (row.length > maxRowWidth) {
          maxRowWidth = row.length;
          widestRowZ = z;
        }
      });

      // Nếu row rộng nhất >= 3 blocks, lấy 2 đầu mút
      if (maxRowWidth >= 3 && widestRowZ !== -1) {
        const row = blocksByZ.get(widestRowZ)!;
        row.sort((a, b) => a.x - b.x);
        addCoord(row[0], 9, 'critical', 'Left Wing Tip (Area Extremity)');
        addCoord(row[row.length - 1], 9, 'critical', 'Right Wing Tip (Area Extremity)');
      }

      // Tìm đỉnh cao nhất (Apex)
      const maxZ = Math.max(...blocks.map(b => b.z));
      const apexBlock = blocks.find(b => b.z === maxZ);
      if (apexBlock) {
        addCoord(apexBlock, 10, 'critical', 'Area Apex (Goal Position)');
      }
    }

    // 2. Junctions
    const junctionCounts = new Map<string, { pos: Vector3; count: number }>();
    for (const seg of tier3.mergedSegments) {
      for (const p of [seg.points[0], seg.points[seg.points.length - 1]]) {
        const key = `${p.x},${p.y},${p.z}`;
        const existing = junctionCounts.get(key);
        if (existing) existing.count++;
        else junctionCounts.set(key, { pos: p, count: 1 });
      }
    }
    for (const [, data] of Array.from(junctionCounts)) {
      if (data.count >= 3) addCoord(data.pos, 10, 'critical', `Junction (${data.count} segments)`);
      else if (data.count >= 2) addCoord(data.pos, 8, 'important', `Connection point`);
    }

    // 3. Symmetric endpoints
    for (const rel of tier3.relations.filter(r => r.type === 'axis_symmetric' || r.type === 'point_symmetric')) {
      const seg1 = tier3.mergedSegments.find(s => s.id === rel.path1Id);
      const seg2 = tier3.mergedSegments.find(s => s.id === rel.path2Id);
      if (seg1 && seg2) {
        addCoord(seg1.points[seg1.points.length - 1], 9, 'important', 'Symmetric branch endpoint', seg1.id);
        addCoord(seg2.points[seg2.points.length - 1], 9, 'important', 'Symmetric branch endpoint (mirror)', seg2.id);
      }
    }

    // 4. Topology-specific
    switch (metrics.detectedTopology) {
      case 'cross':
      case 'hub_spoke':
        addCoord(center, 10, 'critical', `${metrics.detectedTopology} center`);
        break;
      case 'grid': {
        const allPts = tier3.mergedSegments.flatMap(s => s.points);
        const xs = allPts.map(p => p.x), zs = allPts.map(p => p.z);
        for (const corner of [
          { x: Math.min(...xs), z: Math.min(...zs) },
          { x: Math.max(...xs), z: Math.min(...zs) },
          { x: Math.min(...xs), z: Math.max(...zs) },
          { x: Math.max(...xs), z: Math.max(...zs) }
        ]) {
          const closest = allPts.reduce((best, p) => 
            (Math.abs(p.x - corner.x) + Math.abs(p.z - corner.z)) < 
            (Math.abs(best.x - corner.x) + Math.abs(best.z - corner.z)) ? p : best
          );
          addCoord(closest, 9, 'important', 'Grid corner');
        }
        break;
      }
    }

    // 5. Interval points
    for (const seg of tier3.mergedSegments) {
      const interval = this.preferredInterval ?? Math.max(2, Math.floor(seg.points.length / 4));
      for (let i = interval; i < seg.points.length - 1; i += interval) {
        const key = `${seg.points[i].x},${seg.points[i].y},${seg.points[i].z}`;
        if (!scored.has(key)) {
          addCoord(seg.points[i], 4, 'optional', `Interval point (every ${interval} steps)`, seg.id);
        }
      }
    }

    // 6. Segment midpoints
    for (const seg of tier3.mergedSegments) {
      if (seg.points.length >= 3) {
        const mid = seg.points[Math.floor(seg.points.length / 2)];
        const key = `${mid.x},${mid.y},${mid.z}`;
        if (!scored.has(key)) {
          addCoord(mid, 6, 'recommended', 'Segment midpoint', seg.id);
        }
      }
    }

    return Array.from(scored.values()).sort((a, b) => b.priority - a.priority);
  }

  private generateSuggestions(tier3: Tier3Result): PlacementContext['suggestedPlacements'] {
    const suggestions: PlacementContext['suggestedPlacements'] = [];

    // Suggest items at endpoints
    for (const point of tier3.points) {
      if (point.type === 'endpoint') {
        suggestions.push({
          positions: [point.coord],
          itemType: 'crystal',
          rule: 'ENDPOINT_PLACEMENT'
        });
      }
    }

    // Suggest items for patterns (symmetric placement)
    for (const pattern of tier3.patterns) {
      if (pattern.type === 'mirror') {
        const relatedSegments = tier3.mergedSegments.filter(s => 
          pattern.unitElements.includes(s.id)
        );
        
        for (const segment of relatedSegments) {
          const endpoints = [
            segment.points[0],
            segment.points[segment.points.length - 1]
          ];
          
          suggestions.push({
            patternId: pattern.id,
            positions: endpoints,
            itemType: 'switch',
            rule: 'SYMMETRIC_PATTERN'
          });
        }
      }
    }

    // Suggest items for connectors
    for (const connector of tier3.connectors) {
      if (connector.path.length > 0) {
        const midIndex = Math.floor(connector.path.length / 2);
        suggestions.push({
          positions: [connector.path[midIndex]],
          itemType: 'gem',
          rule: 'CONNECTOR_MIDPOINT'
        });
      }
    }

    return suggestions;
  }
}

// ============================================================================
// MAIN ANALYZER CLASS
// ============================================================================

export interface AnalyzerOptions {
  minLength?: number;
  preferredInterval?: number;
}

export class MapAnalyzer {
  private config: GameConfig;
  private minLength: number;
  private preferredInterval?: number;

  constructor(config: { gameConfig: GameConfig }, options?: AnalyzerOptions) {
    this.config = config.gameConfig;
    this.minLength = options?.minLength ?? 2;
    this.preferredInterval = options?.preferredInterval;
  }

  /**
   * Create PlacementContext from Topology IPathInfo output
   * This is the bridge method that connects Topology output to MapAnalyzer analysis
   * 
   * @param pathInfo - Output from Topology.generatePathInfo()
   * @returns PlacementContext with selectableElements
   */
  static fromTopology(pathInfo: {
    start_pos: [number, number, number];
    target_pos: [number, number, number];
    path_coords: [number, number, number][];
    placement_coords: [number, number, number][];
    metadata: {
      topology_type?: string;
      segments?: [number, number, number][][];
      semantic_positions?: Record<string, any>;
      segment_analysis?: { count?: number; lengths?: number[] };
      [key: string]: any;
    };
  }): PlacementContext {
    // Convert path_coords to blocks format
    const blocks: Block[] = pathInfo.path_coords.map((coord, idx) => ({
      modelKey: 'block',
      position: { x: coord[0], y: coord[1], z: coord[2] }
    }));

    // If topology provides segments, build PathSegments directly
    const topoSegments = pathInfo.metadata.segments || [];
    const prebuiltSegments: PathSegment[] = topoSegments.map((segCoords, idx) => {
      const points: Vector3[] = segCoords.map(c => ({ x: c[0], y: c[1], z: c[2] }));
      
      // Calculate direction
      let direction: Vector3 = { x: 0, y: 0, z: 1 };
      if (points.length >= 2) {
        const first = points[0];
        const last = points[points.length - 1];
        const dx = last.x - first.x;
        const dy = last.y - first.y;
        const dz = last.z - first.z;
        const mag = Math.sqrt(dx*dx + dy*dy + dz*dz) || 1;
        direction = { x: dx/mag, y: dy/mag, z: dz/mag };
      }

      return {
        id: `seg_${idx}`,
        points,
        direction,
        length: points.length, // Block count
        plane: 'xz' as const
      };
    });

    // Extract keypoints from semantic_positions
    const semanticPositions = pathInfo.metadata.semantic_positions || {};
    const selectableElements: SelectableElement[] = [];

    // Add segments and their positions
    for (let i = 0; i < prebuiltSegments.length; i++) {
      const seg = prebuiltSegments[i];
      const segmentName = seg.id;
      const coords: SECoord[] = seg.points.map(p => [p.x, p.y, p.z] as SECoord);

      // Add segment element
      selectableElements.push(createSegmentElement(segmentName, coords, 'recommended'));

      // Add position elements
      const positions = createPositionElements(segmentName, coords, {
        interval: 1,
        skipFirst: true,
        skipLast: true
      });
      selectableElements.push(...positions);
    }

    // Add semantic keypoints
    const excludeKeys = ['optimal_start', 'optimal_end', 'valid_pairs'];
    for (const [key, value] of Object.entries(semanticPositions)) {
      if (excludeKeys.includes(key)) continue;
      if (Array.isArray(value) && value.length === 3 && typeof value[0] === 'number') {
        const category = key.includes('apex') || key.includes('center') 
          ? 'critical' as const 
          : 'important' as const;
        selectableElements.push(createKeypointElement(
          key,
          value as SECoord,
          category
        ));
      }
    }

    // Add start and end as keypoints
    selectableElements.push(createKeypointElement(
      'start',
      pathInfo.start_pos,
      'avoid' as any, // Start position - should not place items
      'Start Position'
    ));
    selectableElements.push(createKeypointElement(
      'end',
      pathInfo.target_pos,
      'critical',
      'Goal Position'
    ));

    // Calculate metrics
    const allPoints = prebuiltSegments.flatMap(s => s.points);
    const xs = allPoints.map(p => p.x);
    const zs = allPoints.map(p => p.z);
    const minX = Math.min(...xs), maxX = Math.max(...xs);
    const minZ = Math.min(...zs), maxZ = Math.max(...zs);
    const width = maxX - minX + 1;
    const depth = maxZ - minZ + 1;
    const area = width * depth;

    let estimatedSize: MapMetrics['estimatedSize'] = 'small';
    if (area <= 9) estimatedSize = 'tiny';
    else if (area <= 25) estimatedSize = 'small';
    else if (area <= 49) estimatedSize = 'medium';
    else if (area <= 100) estimatedSize = 'large';
    else estimatedSize = 'huge';

    const metrics: MapMetrics = {
      totalBlocks: pathInfo.path_coords.length,
      boundingBox: { width, height: 1, depth },
      area,
      estimatedSize,
      segmentCount: prebuiltSegments.length,
      areaCount: 1,
      junctionCount: 0, // TODO: detect from semantic_positions
      longestPathLength: prebuiltSegments.reduce((max, s) => Math.max(max, s.length), 0),
      center: {
        x: Math.round((minX + maxX) / 2),
        y: pathInfo.start_pos[1],
        z: Math.round((minZ + maxZ) / 2)
      },
      detectedTopology: pathInfo.metadata.topology_type
    };

    // Compute constraints
    const constraints: PlacementConstraints = {
      maxItems: Math.max(3, Math.floor(pathInfo.path_coords.length * 0.5)),
      minItems: 1,
      targetItemRatio: 0.3,
      preferredConcepts: [],
      avoidConcepts: [],
      maxCodeBlocks: 15,
      distribution: 'spread',
      preferredInterval: Math.max(2, Math.floor(metrics.longestPathLength / 4))
    };

    // Build minimal PlacementContext
    return {
      points: [],
      segments: prebuiltSegments,
      areas: [],
      connectors: [],
      patterns: [],
      relations: [],
      metaPaths: [],
      gateways: [],
      prioritizedCoords: [],
      metrics,
      constraints,
      selectableElements,
      suggestedPlacements: []
    };
  }

  analyze(): PlacementContext {
    // Tier 1: Geometric Decomposition
    const tier1 = new Tier1Analyzer(this.config.blocks);
    const tier1Result = tier1.analyze();

    // Tier 2: Pattern Extrapolation
    const tier2 = new Tier2Analyzer();
    const tier2Result = tier2.analyze(tier1Result);

    // Tier 3: Length Filtering
    const tier3 = new Tier3Analyzer(this.minLength);
    const tier3Result = tier3.analyze(tier2Result);

    // Tier 4: Final Output
    const tier4 = new Tier4Analyzer(this.preferredInterval);
    const result = tier4.analyze(tier3Result);

    return result;
  }

  /**
   * Analyze and return intermediate results for debugging
   */
  analyzeWithDetails(): {
    tier1: Tier1Result;
    tier2: Tier2Result;
    tier3: Tier3Result;
    tier4: PlacementContext;
  } {
    const tier1 = new Tier1Analyzer(this.config.blocks);
    const tier1Result = tier1.analyze();

    const tier2 = new Tier2Analyzer();
    const tier2Result = tier2.analyze(tier1Result);

    const tier3 = new Tier3Analyzer(this.minLength);
    const tier3Result = tier3.analyze(tier2Result);

    const tier4 = new Tier4Analyzer();
    const tier4Result = tier4.analyze(tier3Result);

    return {
      tier1: tier1Result,
      tier2: tier2Result,
      tier3: tier3Result,
      tier4: tier4Result
    };
  }
}

// ============================================================================
// TEST FUNCTION
// ============================================================================

export function testMapAnalyzer(jsonConfig: { gameConfig: GameConfig }): void {
  console.log('='.repeat(60));
  console.log('MAP ANALYZER TEST');
  console.log('='.repeat(60));

  const analyzer = new MapAnalyzer(jsonConfig, { minLength: 2 });
  const details = analyzer.analyzeWithDetails();

  console.log('\n📊 TIER 1: Geometric Decomposition');
  console.log('-'.repeat(40));
  console.log(`  Points:     ${details.tier1.points.length}`);
  console.log(`  Segments:   ${details.tier1.segments.length}`);
  console.log(`  Areas:      ${details.tier1.areas.length}`);
  console.log(`  Connectors: ${details.tier1.connectors.length}`);
  console.log(`  Relations:  ${details.tier1.relations.length}`);

  if (details.tier1.areas.length > 0) {
    console.log('\n  Areas:');
    for (const area of details.tier1.areas) {
      console.log(`    - ${area.id}: ${area.blocks.length} blocks, center: (${area.center.x.toFixed(1)}, ${area.center.y.toFixed(1)}, ${area.center.z.toFixed(1)})`);
    }
  }

  if (details.tier1.relations.length > 0) {
    console.log('\n  Relations:');
    const grouped = new Map<string, number>();
    for (const rel of details.tier1.relations) {
      grouped.set(rel.type, (grouped.get(rel.type) || 0) + 1);
    }
    for (const [type, count] of grouped) {
      console.log(`    - ${type}: ${count}`);
    }
  }

  console.log('\n📊 TIER 2: Pattern Extrapolation');
  console.log('-'.repeat(40));
  console.log(`  Patterns found: ${details.tier2.patterns.length}`);
  
  for (const pattern of details.tier2.patterns) {
    console.log(`    - ${pattern.id}: ${pattern.type}, ${pattern.repetitions} repetitions`);
  }

  console.log('\n📊 TIER 3: Length Filtering (minLength=${this.minLength})');
  console.log('-'.repeat(40));
  console.log(`  Merged segments:     ${details.tier3.mergedSegments.length}`);
  console.log(`  Filtered (too short): ${details.tier3.filteredSegments.length}`);
  console.log(`  Kept short (pattern): ${details.tier3.keptShortSegments.length}`);

  console.log('\n📊 TIER 4: Placement Context');
  console.log('-'.repeat(40));
  console.log(`  Suggested placements: ${details.tier4.suggestedPlacements.length}`);
  
  for (const suggestion of details.tier4.suggestedPlacements) {
    console.log(`    - ${suggestion.itemType} at ${suggestion.positions.length} positions (${suggestion.rule})`);
  }

  console.log('\n' + '='.repeat(60));
  console.log('ANALYSIS COMPLETE');
  console.log('='.repeat(60));
}

// Export for use in other modules
export default MapAnalyzer;
