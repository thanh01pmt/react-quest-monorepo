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

// Tier 4 Output (final)
export interface PlacementContext {
  segments: PathSegment[];
  areas: Area[];
  connectors: Connector[];
  patterns: Pattern[];
  relations: PathRelation[];
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

class Tier1Analyzer {
  private blocks: Vector3[];
  private blockSet: Set<string>;
  private visited: Set<string>;

  constructor(blocks: Block[]) {
    this.blocks = blocks.map(b => b.position);
    this.blockSet = new Set(this.blocks.map(vectorToKey));
    this.visited = new Set();
  }

  analyze(): Tier1Result {
    const areas = this.findAreas();
    const connectors = this.findConnectors(areas);
    const segments = this.traceAllSegments();
    const points = this.findSpecialPoints(segments);
    const relations = this.analyzeRelations(segments);

    return {
      points,
      segments,
      areas,
      connectors,
      relations
    };
  }

  /**
   * Tìm các vùng (areas) - các cluster blocks liền kề
   * Một area là một tập hợp blocks có thể đi tới nhau mà không cần nhảy
   */
  private findAreas(): Area[] {
    const areas: Area[] = [];
    const visited = new Set<string>();

    for (const block of this.blocks) {
      const key = vectorToKey(block);
      if (visited.has(key)) continue;

      // BFS để tìm tất cả blocks liền kề (chỉ xét kề ngang, không xét kề dọc y)
      const areaBlocks: Vector3[] = [];
      const queue: Vector3[] = [block];
      
      while (queue.length > 0) {
        const current = queue.shift()!;
        const currentKey = vectorToKey(current);
        
        if (visited.has(currentKey)) continue;
        visited.add(currentKey);
        areaBlocks.push(current);

        // Check 4 hướng ngang (không check y vì đó là độ cao)
        const neighbors = [
          { x: current.x + 1, y: current.y, z: current.z },
          { x: current.x - 1, y: current.y, z: current.z },
          { x: current.x, y: current.y, z: current.z + 1 },
          { x: current.x, y: current.y, z: current.z - 1 },
        ];

        for (const neighbor of neighbors) {
          const neighborKey = vectorToKey(neighbor);
          if (this.blockSet.has(neighborKey) && !visited.has(neighborKey)) {
            queue.push(neighbor);
          }
        }
      }

      if (areaBlocks.length > 0) {
        areas.push(this.createArea(`area_${areas.length}`, areaBlocks));
      }
    }

    return areas;
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
   */
  private traceAllSegments(): PathSegment[] {
    const segments: PathSegment[] = [];
    const visited = new Set<string>();

    for (const block of this.blocks) {
      const key = vectorToKey(block);
      if (visited.has(key)) continue;

      // Try to trace segment in each direction
      for (const dir of this.getCardinalDirections()) {
        const segment = this.traceSegmentInDirection(block, dir, visited);
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
  private traceSegmentInDirection(start: Vector3, direction: Vector3, visited: Set<string>): PathSegment | null {
    const points: Vector3[] = [start];
    let current = start;

    while (true) {
      const next = vectorAdd(current, direction);
      const nextKey = vectorToKey(next);

      if (!this.blockSet.has(nextKey) || visited.has(nextKey)) break;

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

      if (!this.blockSet.has(nextKey) || visited.has(nextKey)) break;

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
      length: allPoints.length - 1,
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
            length: segmentPoints.length - 1,
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
        length: lastPoints.length - 1,
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
// TIER 4: OUTPUT FOR ITEM PLACEMENT
// ============================================================================

class Tier4Analyzer {
  analyze(tier3Result: Tier3Result): PlacementContext {
    const suggestedPlacements = this.generateSuggestions(tier3Result);

    return {
      segments: tier3Result.mergedSegments,
      areas: tier3Result.areas,
      connectors: tier3Result.connectors,
      patterns: tier3Result.patterns,
      relations: tier3Result.relations,
      suggestedPlacements
    };
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

export class MapAnalyzer {
  private config: GameConfig;
  private minLength: number;

  constructor(config: { gameConfig: GameConfig }, options?: { minLength?: number }) {
    this.config = config.gameConfig;
    this.minLength = options?.minLength ?? 2;
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
    const tier4 = new Tier4Analyzer();
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
