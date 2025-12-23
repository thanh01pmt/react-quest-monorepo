// ============================================================================
// GEOMETRIC REASONING ENGINE & AI PLACER - COMPLETE IMPLEMENTATION
// ============================================================================
// Features:
// - 3-Phase Pipeline (Decomposition → Semantic Analysis → Placement)
// - Hole Detection for Areas
// - Performance Optimizations (Spatial Indexing, Caching, Early Termination)
// - Edge Case Handling (Min Area Size, Junction-Aware Chains)
// - Educational Placement Rules (6 core + extensions)
// ============================================================================

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export type Coord = [number, number, number]; // [x, y, z]
export type Coord2D = [number, number]; // [x, z]

interface Segment {
  id: string;
  type: 'path' | 'area' | 'boundary';
  coords: Coord[];
  vectorSequence?: Coord[]; // For paths only
  properties: {
    length?: number;
    shape?: 'straight' | 'staircase' | 'complex' | 'straight_chain' | 'macro_staircase' | 'spiral' | 'u_shape' | 'branching' | 'random';
    dimensions?: [number, number]; // width, depth for areas
    shapeType?: 'rectangle' | 'square' | 'circle';
    centroid?: Coord;
    holes?: Set<Coord2D>[]; // For areas with holes
    hasHoles?: boolean;
    holeCount?: number;
    holeCoords3D?: Set<Coord>[];
    gateways?: Gateway[];
    [key: string]: any;
  };
}

interface Gateway {
  coord: Coord;
  connectedPathId: string;
}

interface MetaPath {
  segments: Segment[];
  joints: Coord[]; // Corner points between segments
  structureType: 'straight_chain' | 'macro_staircase' | 'spiral' | 'u_shape' | 'branching' | 'random';
  isRegular: boolean; // True if segments have equal/pattern lengths
}

interface GeometricRelation {
  type: 'parallel' | 'symmetric_x' | 'symmetric_z' | 'perpendicular';
  sourceId: string;
  targetId: string;
  confidence: number; // 0.0 - 1.0
}

interface PathPattern {
  type: 'axis_parallel' | 'zigzag' | 'staircase';
  subtype: string;
  coords: Coord[];
  complexity: number;
}

interface Placement {
  type: string; // 'path_fill', 'corner_marker', 'gateway_signal', etc.
  coords: Coord[];
  item: 'crystal' | 'switch' | 'gate';
  reason: string;
  concept: string; // 'loop', 'nested_loop', 'function', etc.
  difficulty: number;
  strategy?: string;
}

interface PathInfo {
  startPos: Coord;
  targetPos: Coord;
  pathCoords: Coord[];
  placementCoords: Coord[];
  metadata: {
    topologyType: string;
    landmarks?: Record<string, Coord>;
    semanticPositions?: any;
    [key: string]: any;
  };
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

class Utils {
  static coordToString(coord: Coord): string {
    return `${coord[0]},${coord[1]},${coord[2]}`;
  }

  static coord2DToString(coord: Coord2D): string {
    return `${coord[0]},${coord[1]}`;
  }

  static stringToCoord(str: string): Coord {
    const parts = str.split(',').map(Number);
    return [parts[0], parts[1], parts[2]];
  }

  static stringToCoord2D(str: string): Coord2D {
    const parts = str.split(',').map(Number);
    return [parts[0], parts[1]];
  }

  static gcd(a: number, b: number): number {
    a = Math.abs(a);
    b = Math.abs(b);
    while (b !== 0) {
      const temp = b;
      b = a % b;
      a = temp;
    }
    return a;
  }

  static getCentroid(coords: Coord[]): Coord {
    if (coords.length === 0) return [0, 0, 0];
    const sum = coords.reduce((acc, c) => [acc[0] + c[0], acc[1] + c[1], acc[2] + c[2]], [0, 0, 0]);
    return [sum[0] / coords.length, sum[1] / coords.length, sum[2] / coords.length];
  }

  static deduplicateCoords(coords: Coord[]): Coord[] {
    const seen = new Set<string>();
    return coords.filter(c => {
      const key = this.coordToString(c);
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }
}

// ============================================================================
// SPATIAL INDEX (Performance Optimization)
// ============================================================================

class SpatialIndex {
  private grid: Map<string, Set<string>>; // cellKey -> Set of coord strings
  private cellSize: number;

  constructor(coords: Coord[], cellSize: number = 10) {
    this.cellSize = cellSize;
    this.grid = new Map();

    coords.forEach(coord => {
      const cellKey = this.getCellKey(coord);
      if (!this.grid.has(cellKey)) {
        this.grid.set(cellKey, new Set());
      }
      this.grid.get(cellKey)!.add(Utils.coordToString(coord));
    });
  }

  private getCellKey(coord: Coord): string {
    const cx = Math.floor(coord[0] / this.cellSize);
    const cz = Math.floor(coord[2] / this.cellSize);
    return `${cx},${cz}`;
  }

  contains(coord: Coord): boolean {
    const cellKey = this.getCellKey(coord);
    const cell = this.grid.get(cellKey);
    return cell ? cell.has(Utils.coordToString(coord)) : false;
  }

  getNearby(coord: Coord, radius: number = 1): Set<string> {
    const cx = Math.floor(coord[0] / this.cellSize);
    const cz = Math.floor(coord[2] / this.cellSize);
    const nearby = new Set<string>();

    for (let dx = -radius; dx <= radius; dx++) {
      for (let dz = -radius; dz <= radius; dz++) {
        const cellKey = `${cx + dx},${cz + dz}`;
        const cell = this.grid.get(cellKey);
        if (cell) {
          cell.forEach(c => nearby.add(c));
        }
      }
    }

    return nearby;
  }
}

// ============================================================================
// PHASE 1: GEOMETRIC DECOMPOSITION
// ============================================================================

class GeometricDecomposer {
  private coords: Set<string>;
  private grid2D: Set<string>;
  private yLevel: number;
  private directions: Coord2D[] = [[0, 1], [0, -1], [1, 0], [-1, 0]];
  private MIN_AREA_SIZE = 9; // Edge case handling

  constructor(placementCoords: Coord[]) {
    this.coords = new Set(placementCoords.map(Utils.coordToString));
    this.yLevel = placementCoords.length > 0 ? placementCoords[0][1] : 0;
    this.grid2D = new Set(placementCoords.map(c => `${c[0]},${c[2]}`));
  }

  // Layer 1: Segmentation (Path vs Area)
  segment(): { areas: Segment[]; paths: Segment[] } {
    // Step 1: Find core blocks (degree = 4)
    const coreBlocks = new Set<string>();

    this.grid2D.forEach(coordStr => {
      const [x, z] = Utils.stringToCoord2D(coordStr);
      let neighbors = 0;

      for (const [dx, dz] of this.directions) {
        if (this.grid2D.has(`${x + dx},${z + dz}`)) {
          neighbors++;
        }
      }

      if (neighbors === 4) {
        coreBlocks.add(coordStr);
      }
    });

    // Edge case: Minimum area size
    if (coreBlocks.size < this.MIN_AREA_SIZE) {
      // Everything is path
      const pathSegments = this.groupBlocks(this.grid2D, 'path');
      return { areas: [], paths: pathSegments };
    }

    // Step 2: Reconstruction (Flood fill from core)
    const areaBlocks2D = this.floodFillReconstruction(coreBlocks, this.grid2D);

    // Step 3: Path = Total - Area
    const pathBlocks2D = new Set<string>();
    this.grid2D.forEach(c => {
      if (!areaBlocks2D.has(c)) {
        pathBlocks2D.add(c);
      }
    });

    // Step 4: Group into segments
    const areaSegments = this.groupBlocks(areaBlocks2D, 'area');
    const pathSegments = this.groupBlocks(pathBlocks2D, 'path');

    return { areas: areaSegments, paths: pathSegments };
  }

  // Layer 2: Boundaries & Gateways
  analyzeBoundaries(areas: Segment[], paths: Segment[]): Segment[] {
    const boundaries: Segment[] = [];

    areas.forEach(area => {
      const boundaryCoords: Coord[] = [];
      const areaSet = new Set(area.coords.map(c => `${c[0]},${c[2]}`));
      const gateways: Gateway[] = [];

      areaSet.forEach(coordStr => {
        const [x, z] = Utils.stringToCoord2D(coordStr);
        let isBoundary = false;

        for (const [dx, dz] of this.directions) {
          const neighborKey = `${x + dx},${z + dz}`;
          if (!areaSet.has(neighborKey)) {
            isBoundary = true;

            // Check if this neighbor is a path endpoint (Gateway detection)
            paths.forEach(path => {
              const endpoints = [path.coords[0], path.coords[path.coords.length - 1]];
              endpoints.forEach(ep => {
                if (ep[0] === x + dx && ep[2] === z + dz) {
                  gateways.push({
                    coord: ep,
                    connectedPathId: path.id
                  });
                }
              });
            });
          }
        }

        if (isBoundary) {
          boundaryCoords.push([x, this.yLevel, z]);
        }
      });

      const boundary: Segment = {
        id: `boundary_${area.id}`,
        type: 'boundary',
        coords: boundaryCoords,
        properties: { gateways }
      };

      boundaries.push(boundary);
    });

    return boundaries;
  }

  // Hole Detection (NEW FEATURE)
  detectHoles(areaCoords2D: Set<string>): Set<Coord2D>[] {
    if (areaCoords2D.size === 0) return [];

    // Step 1: Find bounding box
    const coords = Array.from(areaCoords2D).map(Utils.stringToCoord2D);
    const xs = coords.map(c => c[0]);
    const zs = coords.map(c => c[1]);
    const minX = Math.min(...xs) - 1;
    const maxX = Math.max(...xs) + 1;
    const minZ = Math.min(...zs) - 1;
    const maxZ = Math.max(...zs) + 1;

    // Step 2: Flood fill from outside
    const outside = new Set<string>();
    const queue: Coord2D[] = [[minX, minZ]];

    while (queue.length > 0) {
      const [x, z] = queue.shift()!;
      const key = `${x},${z}`;

      if (outside.has(key) || areaCoords2D.has(key)) continue;
      if (x < minX || x > maxX || z < minZ || z > maxZ) continue;

      outside.add(key);

      for (const [dx, dz] of this.directions) {
        queue.push([x + dx, z + dz]);
      }
    }

    // Step 3: Find holes (empty cells not in area or outside)
    const allBBoxCells = new Set<string>();
    for (let x = minX; x <= maxX; x++) {
      for (let z = minZ; z <= maxZ; z++) {
        allBBoxCells.add(`${x},${z}`);
      }
    }

    const emptyCells = new Set<string>();
    allBBoxCells.forEach(cell => {
      if (!areaCoords2D.has(cell) && !outside.has(cell)) {
        emptyCells.add(cell);
      }
    });

    // Step 4: Group holes (connected components)
    const holes: Set<Coord2D>[] = [];
    const visitedEmpty = new Set<string>();

    emptyCells.forEach(cellStr => {
      if (visitedEmpty.has(cellStr)) return;

      const hole = new Set<Coord2D>();
      const holeQueue = [Utils.stringToCoord2D(cellStr)];

      while (holeQueue.length > 0) {
        const [x, z] = holeQueue.shift()!;
        const key = `${x},${z}`;

        if (visitedEmpty.has(key) || !emptyCells.has(key)) continue;

        visitedEmpty.add(key);
        hole.add([x, z]);

        for (const [dx, dz] of this.directions) {
          holeQueue.push([x + dx, z + dz]);
        }
      }

      if (hole.size > 0) {
        holes.push(hole);
      }
    });

    return holes;
  }

  // Attach holes to areas
  enrichAreasWithHoles(areas: Segment[]): void {
    areas.forEach(area => {
      const area2D = new Set(area.coords.map(c => `${c[0]},${c[2]}`));
      const holes = this.detectHoles(area2D);

      area.properties.holes = holes;
      area.properties.hasHoles = holes.length > 0;
      area.properties.holeCount = holes.length;

      // Convert holes to 3D coords
      area.properties.holeCoords3D = holes.map(hole =>
        new Set(Array.from(hole).map(([x, z]) => [x, this.yLevel, z] as Coord))
      );

      // Calculate area shape
      const xs = area.coords.map(c => c[0]);
      const zs = area.coords.map(c => c[2]);
      const width = Math.max(...xs) - Math.min(...xs) + 1;
      const depth = Math.max(...zs) - Math.min(...zs) + 1;
      const ratio = width / depth;

      area.properties.dimensions = [width, depth];
      area.properties.shapeType = (ratio >= 0.8 && ratio <= 1.2) ? 'square' : 'rectangle';
      area.properties.centroid = Utils.getCentroid(area.coords);
    });
  }

  // Helper: Flood fill reconstruction
  private floodFillReconstruction(seeds: Set<string>, validSpace: Set<string>): Set<string> {
    const result = new Set(seeds);
    const queue = Array.from(seeds).map(Utils.stringToCoord2D);

    while (queue.length > 0) {
      const [x, z] = queue.shift()!;

      for (const [dx, dz] of this.directions) {
        const neighbor: Coord2D = [x + dx, z + dz];
        const key = `${neighbor[0]},${neighbor[1]}`;

        if (validSpace.has(key) && !result.has(key)) {
          result.add(key);
          queue.push(neighbor);
        }
      }
    }

    return result;
  }

  // Helper: Group connected blocks into segments
  private groupBlocks(blockSet: Set<string>, type: 'path' | 'area'): Segment[] {
    const segments: Segment[] = [];
    const visited = new Set<string>();
    let idCounter = 0;

    blockSet.forEach(startStr => {
      if (visited.has(startStr)) return;

      const group: Coord[] = [];
      const queue = [Utils.stringToCoord2D(startStr)];

      while (queue.length > 0) {
        const [x, z] = queue.shift()!;
        const key = `${x},${z}`;

        if (visited.has(key) || !blockSet.has(key)) continue;

        visited.add(key);
        group.push([x, this.yLevel, z]);

        for (const [dx, dz] of this.directions) {
          queue.push([x + dx, z + dz]);
        }
      }

      if (group.length > 0) {
        segments.push({
          id: `${type}_${idCounter++}`,
          type,
          coords: group,
          properties: { length: group.length }
        });
      }
    });

    return segments;
  }
}

// ============================================================================
// PHASE 2: SEMANTIC ANALYSIS
// ============================================================================

class SemanticAnalyzer {
  private decomposer: GeometricDecomposer;
  private directions: Coord2D[] = [[0, 1], [0, -1], [1, 0], [-1, 0]];

  constructor(decomposer: GeometricDecomposer) {
    this.decomposer = decomposer;
  }

  // Layer 3: Meta-Path Analysis (Junction-Aware Chain Building)
  analyzeMetaPaths(paths: Segment[]): MetaPath[] {
    // Build adjacency graph
    const graph = new Map<string, Set<string>>();
    const allCoords = new Set<string>();

    paths.forEach(path => {
      path.coords.forEach(coord => {
        const key = Utils.coordToString(coord);
        allCoords.add(key);
        if (!graph.has(key)) {
          graph.set(key, new Set());
        }
      });

      // Connect adjacent coords
      for (let i = 0; i < path.coords.length - 1; i++) {
        const k1 = Utils.coordToString(path.coords[i]);
        const k2 = Utils.coordToString(path.coords[i + 1]);
        graph.get(k1)!.add(k2);
        graph.get(k2)!.add(k1);
      }
    });

    // Junction-aware chain building (DFS)
    const metaPaths: MetaPath[] = [];
    const visited = new Set<string>();

    graph.forEach((neighbors, startKey) => {
      if (visited.has(startKey)) return;

      const chain: Coord[] = [];
      const stack: Array<[string, string | null]> = [[startKey, null]]; // [node, parent]

      while (stack.length > 0) {
        const [nodeKey, parentKey] = stack.pop()!;
        if (visited.has(nodeKey)) continue;

        visited.add(nodeKey);
        chain.push(Utils.stringToCoord(nodeKey));

        const neighbors = graph.get(nodeKey);
        if (neighbors) {
          neighbors.forEach(neighborKey => {
            if (neighborKey !== parentKey && !visited.has(neighborKey)) {
              stack.push([neighborKey, nodeKey]);
            }
          });
        }
      }

      if (chain.length > 1) {
        const metaPath = this.classifyMetaPath(chain);
        metaPaths.push(metaPath);
      }
    });

    return metaPaths;
  }

  // Pattern Recognition for MetaPath
  private classifyMetaPath(chain: Coord[]): MetaPath {
    // Calculate vector sequence
    const deltas: Coord[] = [];
    for (let i = 0; i < chain.length - 1; i++) {
      const delta: Coord = [
        chain[i + 1][0] - chain[i][0],
        chain[i + 1][1] - chain[i][1],
        chain[i + 1][2] - chain[i][2]
      ];
      deltas.push(delta);
    }

    // Detect structure type
    const uniqueDeltas = new Set(deltas.map(Utils.coordToString));
    let structureType: MetaPath['structureType'] = 'random';
    let isRegular = false;

    if (uniqueDeltas.size === 1) {
      structureType = 'straight_chain';
      isRegular = true;
    } else {
      // Check for regular patterns (e.g., repeating deltas)
      const deltaLengths = deltas.map(d => Math.sqrt(d[0] ** 2 + d[1] ** 2 + d[2] ** 2));
      const lengthSet = new Set(deltaLengths.map(l => Math.round(l * 100)));

      if (lengthSet.size === 1) {
        isRegular = true;
        structureType = 'macro_staircase'; // Equal length segments
      } else if (this.isArithmeticProgression(deltaLengths)) {
        structureType = 'spiral';
        isRegular = true;
      }
    }

    // Build segments from chain (simplified: treat whole chain as one segment)
    const segment: Segment = {
      id: `metapath_seg`,
      type: 'path',
      coords: chain,
      vectorSequence: deltas,
      properties: { shape: structureType }
    };

    // Find joints (points where direction changes)
    const joints: Coord[] = [];
    for (let i = 1; i < deltas.length; i++) {
      if (Utils.coordToString(deltas[i]) !== Utils.coordToString(deltas[i - 1])) {
        joints.push(chain[i]);
      }
    }

    return {
      segments: [segment],
      joints,
      structureType,
      isRegular
    };
  }

  private isArithmeticProgression(arr: number[]): boolean {
    if (arr.length < 3) return false;
    const diffs = arr.slice(1).map((val, i) => val - arr[i]);
    const firstDiff = diffs[0];
    return diffs.every(d => Math.abs(d - firstDiff) < 0.1);
  }

  // Layer 4: Geometric Relations (Symmetry, Parallel)
  analyzeRelations(paths: Segment[]): GeometricRelation[] {
    const relations: GeometricRelation[] = [];

    for (let i = 0; i < paths.length; i++) {
      for (let j = i + 1; j < paths.length; j++) {
        const p1 = paths[i];
        const p2 = paths[j];

        // Check symmetry (simplified: compare centroids)
        const c1 = Utils.getCentroid(p1.coords);
        const c2 = Utils.getCentroid(p2.coords);

        // X-axis symmetry
        if (Math.abs(c1[0] + c2[0]) < 1 && Math.abs(c1[2] - c2[2]) < 1) {
          relations.push({
            type: 'symmetric_x',
            sourceId: p1.id,
            targetId: p2.id,
            confidence: 0.9
          });
        }

        // Z-axis symmetry
        if (Math.abs(c1[0] - c2[0]) < 1 && Math.abs(c1[2] + c2[2]) < 1) {
          relations.push({
            type: 'symmetric_z',
            sourceId: p1.id,
            targetId: p2.id,
            confidence: 0.9
          });
        }
      }
    }

    return relations;
  }
}

// ============================================================================
// STRUCTURED PATHFINDER (Generate & Validate)
// ============================================================================

class StructuredPathFinder {
  private spatialIndex: SpatialIndex;
  private cache: Map<string, PathPattern[]> = new Map();
  private MAX_CANDIDATES = 20; // Early termination

  constructor(placementCoords: Coord[]) {
    this.spatialIndex = new SpatialIndex(placementCoords);
  }

  findAllPaths(start: Coord, end: Coord): PathPattern[] {
    const cacheKey = `${Utils.coordToString(start)}_${Utils.coordToString(end)}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey)!;
    }

    const pathsFound: PathPattern[] = [];
    const [sx, sy, sz] = start;
    const [ex, ey, ez] = end;

    if (sy !== ey) return []; // No vertical movement support

    const dx = ex - sx;
    const dz = ez - sz;
    const stepX = dx > 0 ? 1 : -1;
    const stepZ = dz > 0 ? 1 : -1;

    // Strategy 1: Axis-Parallel (2 variants)
    const orders: Array<'X_THEN_Z' | 'Z_THEN_X'> = ['X_THEN_Z', 'Z_THEN_X'];
    for (const order of orders) {
      if (pathsFound.length >= this.MAX_CANDIDATES) break;

      const path = this.genAxisParallel(start, end, order);
      if (this.validatePath(path)) {
        pathsFound.push({
          type: 'axis_parallel',
          subtype: order.toLowerCase(),
          coords: path,
          complexity: 1
        });
      }
    }

    // Strategy 2 & 3: Zigzag & Staircase
    const absDx = Math.abs(dx);
    const absDz = Math.abs(dz);

    if (absDx > 0 && absDz > 0) {
      const gcd = Utils.gcd(absDx, absDz);
      const unitX = absDx / gcd;
      const unitZ = absDz / gcd;

      // Promising ratios (Early termination heuristic)
      const promisingRatios: Array<[number, number]> = [
        [unitX, unitZ], // Original GCD ratio
        [1, 1], // Zigzag 1:1
        absDx > absDz ? [2, 1] : [1, 2] // 2:1 or 1:2
      ];

      for (const [ux, uz] of promisingRatios.slice(0, 3)) {
        if (pathsFound.length >= this.MAX_CANDIDATES) break;

        for (const startAxis of ['X', 'Z'] as const) {
          if (pathsFound.length >= this.MAX_CANDIDATES) break;

          const path = this.genStaircase(start, end, ux, uz, stepX, stepZ, startAxis);
          if (this.validatePath(path)) {
            const tag = (ux === 1 && uz === 1) ? 'zigzag' : 'staircase';
            pathsFound.push({
              type: tag,
              subtype: `${ux}x_${uz}z_start${startAxis}`,
              coords: path,
              complexity: gcd
            });
          }
        }
      }
    }

    this.cache.set(cacheKey, pathsFound);
    return pathsFound;
  }

  private genAxisParallel(start: Coord, end: Coord, order: 'X_THEN_Z' | 'Z_THEN_X'): Coord[] {
    const path: Coord[] = [start];
    let [cx, cy, cz] = start;
    const [ex, ey, ez] = end;
    const stepX = ex > cx ? 1 : -1;
    const stepZ = ez > cz ? 1 : -1;

    if (order === 'X_THEN_Z') {
      while (cx !== ex) {
        cx += stepX;
        path.push([cx, cy, cz]);
      }
      while (cz !== ez) {
        cz += stepZ;
        path.push([cx, cy, cz]);
      }
    } else {
      while (cz !== ez) {
        cz += stepZ;
        path.push([cx, cy, cz]);
      }
      while (cx !== ex) {
        cx += stepX;
        path.push([cx, cy, cz]);
      }
    }

    return path;
  }

  private genStaircase(
    start: Coord,
    end: Coord,
    unitX: number,
    unitZ: number,
    dirX: number,
    dirZ: number,
    startAxis: 'X' | 'Z'
  ): Coord[] {
    const path: Coord[] = [start];
    let [cx, cy, cz] = start;
    const [ex, ey, ez] = end;
    const maxSteps = Math.abs(ex - cx) + Math.abs(ez - cz) + 10;
    let count = 0;

    while ((cx !== ex || cz !== ez) && count < maxSteps) {
      if (startAxis === 'X') {
        // Move X
        for (let i = 0; i < unitX; i++) {
          if (cx === ex) break;
          cx += dirX;
          path.push([cx, cy, cz]);
        }
        // Move Z
        for (let i = 0; i < unitZ; i++) {
          if (cz === ez) break;
          cz += dirZ;
          path.push([cx, cy, cz]);
        }
      } else {
        // Move Z
        for (let i = 0; i < unitZ; i++) {
          if (cz === ez) break;
          cz += dirZ;
          path.push([cx, cy, cz]);
        }
        // Move X
        for (let i = 0; i < unitX; i++) {
          if (cx === ex) break;
          cx += dirX;
          path.push([cx, cy, cz]);
        }
      }

      count++;
      if (cx === ex && cz === ez) break;
    }

    return path;
  }

  private validatePath(path: Coord[]): boolean {
    if (path.length === 0) return false;

    for (const coord of path) {
      if (!this.spatialIndex.contains(coord)) {
        return false; // Hole detected!
      }
    }

    return true;
  }
}

// ============================================================================
// PHASE 3: PEDAGOGICAL PLACEMENT
// ============================================================================

class PedagogicalPlacer {
  // 6 Core Rules + Extensions
  placeItems(
    metaPaths: MetaPath[],
    areas: Segment[],
    boundaries: Segment[],
    relations: GeometricRelation[],
    finder: StructuredPathFinder
  ): Placement[] {
    const placements: Placement[] = [];

    // Rule 1: Crystals on long/zigzag paths
    metaPaths.forEach(mp => {
      mp.segments.forEach(seg => {
        if ((seg.properties.length || 0) > 2) {
          const innerCoords = seg.coords.slice(1, -1); // Exclude endpoints
          placements.push({
            type: 'path_fill',
            coords: innerCoords,
            item: 'crystal',
            reason: `Path segment length ${seg.properties.length} > 2`,
            concept: 'loop_simple',
            difficulty: 1
          });
        }
      });

      // Regular staircase → Nested loop
      if (mp.structureType === 'macro_staircase' && mp.isRegular) {
        placements.push({
          type: 'pattern_fill',
          coords: mp.joints, // Place at joints
          item: 'crystal',
          reason: 'Regular macro pattern detected',
          concept: 'nested_loop',
          difficulty: 3,
          strategy: 'one_per_segment_center'
        });
      }
    });

    // Rule 2 & 3: Corners (Crystals + Switches)
    metaPaths.forEach(mp => {
      if (mp.isRegular || ['u_shape', 'macro_staircase'].includes(mp.structureType)) {
        mp.joints.forEach((joint, i) => {
          // Rule 2: Crystal near corner
          const prevSeg = mp.segments[Math.max(0, i)];
          if (prevSeg && prevSeg.coords.length >= 2) {
            const nearCorner = prevSeg.coords[prevSeg.coords.length - 2];
            placements.push({
              type: 'corner_marker',
              coords: [joint, nearCorner],
              item: 'crystal',
              reason: 'Critical turn point in regular path',
              concept: 'turn_logic',
              difficulty: 2
            });
          }

          // Rule 3: Switch at corner
          placements.push({
            type: 'turning_signal',
            coords: [joint],
            item: 'switch',
            reason: 'Signal for while/repeat_until loop turn',
            concept: 'sensor_loop',
            difficulty: 3
          });
        });
      }
    });

    // Rule 4: Switches at Gateways
    boundaries.forEach(boundary => {
      const gateways = boundary.properties.gateways || [];
      gateways.forEach(gw => {
        placements.push({
          type: 'area_entry_signal',
          coords: [gw.coord],
          item: 'switch',
          reason: 'Signal entering new algorithmic zone (Area)',
          concept: 'state_change',
          difficulty: 2
        });
      });
    });

    // Rule 5: Sub-patterns in Areas
    areas.forEach(area => {
      const [width, depth] = area.properties.dimensions || [0, 0];
      if (width >= 3 && depth >= 3) {
        const subPattern = this.generateSubPattern(area, 'cross');
        placements.push({
          type: 'area_sub_pattern',
          coords: subPattern,
          item: 'crystal',
          reason: 'Geometric pattern inside large area',
          concept: 'coordinate_math',
          difficulty: 4
        });
      }
    });

    // Rule 6: Boundary Patrol
    areas.forEach(area => {
      if (['rectangle', 'square'].includes(area.properties.shapeType || '')) {
        const boundary = boundaries.find(b => b.id === `boundary_${area.id}`);
        if (boundary) {
          const sparseBoundary = boundary.coords.filter((_, i) => i % 2 === 0);
          placements.push({
            type: 'boundary_patrol',
            coords: sparseBoundary,
            item: 'crystal',
            reason: 'Regular boundary traversal',
            concept: 'perimeter_walking',
            difficulty: 2
          });
        }
      }
    });

    // Extension: Holes handling
    areas.forEach(area => {
      if (area.properties.hasHoles) {
        const holeCount = area.properties.holeCount || 0;

        if (holeCount === 1) {
          const hole = area.properties.holeCoords3D![0];
          const isCentered = this.isCenteredHole(area, hole);

          if (isCentered) {
            const ringCoords = area.coords.filter(c => !hole.has(c));
            placements.push({
              type: 'ring_structure',
              coords: ringCoords,
              item: 'crystal',
              reason: 'Centered hole creates ring structure',
              concept: 'circular_loop',
              difficulty: 3,
              strategy: 'perimeter_patrol'
            });
          } else {
            placements.push({
              type: 'area_with_obstacle',
              coords: area.coords,
              item: 'crystal',
              reason: 'Navigate around off-center hole',
              concept: 'obstacle_avoidance',
              difficulty: 4,
              strategy: 'navigate_around_hole'
            });
          }
        } else if (holeCount > 1) {
          placements.push({
            type: 'complex_navigation',
            coords: area.coords,
            item: 'crystal',
            reason: 'Multiple holes require pathfinding',
            concept: 'pathfinding_with_constraints',
            difficulty: 5,
            strategy: 'multi_obstacle_maze'
          });
        }
      }
    });

    // Extension: Symmetric features (Functions)
    relations.forEach(rel => {
      if (rel.type.includes('symmetric')) {
        placements.push({
          type: 'symmetric_features',
          coords: [], // Would need to fetch actual coords from source/target
          item: 'switch',
          reason: `Symmetric relationship detected (${rel.type})`,
          concept: 'function_with_param',
          difficulty: 3,
          strategy: 'mirror_placement'
        });
      }
    });

    return placements;
  }

  private generateSubPattern(area: Segment, patternType: 'cross' | 'diagonal' | 'grid'): Coord[] {
    const centroid = area.properties.centroid || [0, 0, 0];
    const [cx, cy, cz] = centroid;

    // Simple cross pattern
    if (patternType === 'cross') {
      return [
        [Math.round(cx), cy, Math.round(cz)],
        [Math.round(cx) - 1, cy, Math.round(cz)],
        [Math.round(cx) + 1, cy, Math.round(cz)],
        [Math.round(cx), cy, Math.round(cz) - 1],
        [Math.round(cx), cy, Math.round(cz) + 1]
      ];
    }

    return [];
  }

  private isCenteredHole(area: Segment, hole: Set<Coord>): boolean {
    const areaCentroid = area.properties.centroid || [0, 0, 0];
    const holeCoords = Array.from(hole);
    const holeCentroid = Utils.getCentroid(holeCoords);

    const distance = Math.sqrt(
      (areaCentroid[0] - holeCentroid[0]) ** 2 +
      (areaCentroid[2] - holeCentroid[2]) ** 2
    );

    const [width, depth] = area.properties.dimensions || [1, 1];
    const areaSize = Math.max(width, depth);

    return distance < areaSize * 0.2;
  }
}

// ============================================================================
// TOPOLOGY GENERATORS
// ============================================================================

abstract class BaseTopology {
  abstract generatePathInfo(
    gridSize: [number, number, number],
    params: Record<string, any>
  ): PathInfo;
}

class ArrowShapeTopology extends BaseTopology {
  generatePathInfo(gridSize: [number, number, number], params: Record<string, any>): PathInfo {
    const shaftLen = params.shaftLength || Math.floor(Math.random() * 3) + 3;
    const headSize = params.headSize || Math.floor(Math.random() * 2) + 3;

    const startX = Math.floor(Math.random() * (gridSize[0] - headSize * 2 - 2)) + headSize + 1;
    const startZ = 1;
    const y = 0;
    const startPos: Coord = [startX, y, startZ];

    const placementCoords = new Set<string>([Utils.coordToString(startPos)]);
    let pathCoords: Coord[] = [startPos];

    // Shaft
    let currentPos = startPos;
    for (let i = 0; i < shaftLen; i++) {
      currentPos = [currentPos[0], currentPos[1], currentPos[2] + 1];
      pathCoords.push(currentPos);
      placementCoords.add(Utils.coordToString(currentPos));
    }
    const junctionPos = currentPos;

    // Head (triangle)
    for (let i = 1; i <= headSize; i++) {
      const currentZ = junctionPos[2] + i;
      const rowWidth = headSize - i;
      for (let j = -rowWidth; j <= rowWidth; j++) {
        const coord: Coord = [junctionPos[0] + j, y, currentZ];
        placementCoords.add(Utils.coordToString(coord));
        pathCoords.push(coord);
      }
    }

    pathCoords = Utils.deduplicateCoords(pathCoords);
    const targetPos: Coord = [junctionPos[0], y, junctionPos[2] + headSize];

    return {
      startPos,
      targetPos,
      pathCoords,
      placementCoords: Array.from(placementCoords).map(Utils.stringToCoord),
      metadata: {
        topologyType: 'arrow_shape',
        landmarks: { tail: startPos, junction: junctionPos, tip: targetPos }
      }
    };
  }
}

// NEW: Branching Topology (for Conditionals)
class BranchingTopology extends BaseTopology {
  generatePathInfo(gridSize: [number, number, number], params: Record<string, any>): PathInfo {
    const mainLen = params.mainLength || 5;
    const branchLen = params.branchLength || 3;
    const y = 0;

    const startX = Math.floor(gridSize[0] / 2);
    const startZ = 1;
    const startPos: Coord = [startX, y, startZ];

    const placementCoords = new Set<string>();
    const pathCoords: Coord[] = [];

    // Main path
    for (let i = 0; i < mainLen; i++) {
      const coord: Coord = [startX, y, startZ + i];
      pathCoords.push(coord);
      placementCoords.add(Utils.coordToString(coord));
    }

    const forkPoint: Coord = [startX, y, startZ + mainLen];
    pathCoords.push(forkPoint);
    placementCoords.add(Utils.coordToString(forkPoint));

    // Left branch
    for (let i = 1; i <= branchLen; i++) {
      const coord: Coord = [startX - i, y, forkPoint[2]];
      pathCoords.push(coord);
      placementCoords.add(Utils.coordToString(coord));
    }

    // Right branch
    for (let i = 1; i <= branchLen; i++) {
      const coord: Coord = [startX + i, y, forkPoint[2]];
      pathCoords.push(coord);
      placementCoords.add(Utils.coordToString(coord));
    }

    const targetPos: Coord = [startX + branchLen, y, forkPoint[2]];

    return {
      startPos,
      targetPos,
      pathCoords: Utils.deduplicateCoords(pathCoords),
      placementCoords: Array.from(placementCoords).map(Utils.stringToCoord),
      metadata: {
        topologyType: 'branching',
        landmarks: { start: startPos, fork: forkPoint, target: targetPos }
      }
    };
  }
}

// NEW: Spiral Topology (for Recursion/Nested Loops)
class SpiralTopology extends BaseTopology {
  generatePathInfo(gridSize: [number, number, number], params: Record<string, any>): PathInfo {
    const turns = params.turns || 4;
    const y = 0;
    const centerX = Math.floor(gridSize[0] / 2);
    const centerZ = Math.floor(gridSize[2] / 2);

    const startPos: Coord = [centerX, y, centerZ];
    const placementCoords = new Set<string>();
    const pathCoords: Coord[] = [startPos];
    placementCoords.add(Utils.coordToString(startPos));

    let [x, z] = [centerX, centerZ];
    let length = 1;
    const directions = [[1, 0], [0, 1], [-1, 0], [0, -1]]; // Right, Down, Left, Up

    for (let turn = 0; turn < turns * 4; turn++) {
      const [dx, dz] = directions[turn % 4];
      const steps = Math.floor(length);

      for (let i = 0; i < steps; i++) {
        x += dx;
        z += dz;
        const coord: Coord = [x, y, z];
        pathCoords.push(coord);
        placementCoords.add(Utils.coordToString(coord));
      }

      if (turn % 2 === 1) length += 1; // Increase length every 2 turns
    }

    const targetPos = pathCoords[pathCoords.length - 1];

    return {
      startPos,
      targetPos,
      pathCoords: Utils.deduplicateCoords(pathCoords),
      placementCoords: Array.from(placementCoords).map(Utils.stringToCoord),
      metadata: {
        topologyType: 'spiral',
        landmarks: { center: startPos, end: targetPos }
      }
    };
  }
}

// ============================================================================
// MAIN REASONING ENGINE
// ============================================================================

class ReasoningEngine {
  run(
    topologyType: string,
    gridSize: [number, number, number],
    params: Record<string, any>
  ) {
    console.log(`\n${'='.repeat(60)}`);
    console.log(`🚀 GEOMETRIC REASONING ENGINE - ${topologyType.toUpperCase()}`);
    console.log(`${'='.repeat(60)}\n`);

    // Step 1: Generate topology
    let topology: BaseTopology;
    switch (topologyType) {
      case 'arrow_shape':
        topology = new ArrowShapeTopology();
        break;
      case 'branching':
        topology = new BranchingTopology();
        break;
      case 'spiral':
        topology = new SpiralTopology();
        break;
      default:
        throw new Error(`Unknown topology: ${topologyType}`);
    }

    const pathInfo = topology.generatePathInfo(gridSize, params);
    console.log(`✅ Phase 0: Topology Generated`);
    console.log(`   - Type: ${pathInfo.metadata.topologyType}`);
    console.log(`   - Coords: ${pathInfo.placementCoords.length} blocks`);

    // Step 2: Phase 1 - Geometric Decomposition
    console.log(`\n📐 Phase 1: Geometric Decomposition`);
    const decomposer = new GeometricDecomposer(pathInfo.placementCoords);
    const { areas, paths } = decomposer.segment();
    console.log(`   - Areas: ${areas.length}`);
    console.log(`   - Paths: ${paths.length}`);

    // Enrich areas with holes
    decomposer.enrichAreasWithHoles(areas);
    areas.forEach(area => {
      if (area.properties.hasHoles) {
        console.log(`   - Area ${area.id}: ${area.properties.holeCount} hole(s) detected`);
      }
    });

    const boundaries = decomposer.analyzeBoundaries(areas, paths);
    console.log(`   - Boundaries: ${boundaries.length}`);
    boundaries.forEach(b => {
      const gwCount = (b.properties.gateways || []).length;
      if (gwCount > 0) {
        console.log(`   - ${b.id}: ${gwCount} gateway(s)`);
      }
    });

    // Step 3: Phase 2 - Semantic Analysis
    console.log(`\n🧠 Phase 2: Semantic Analysis`);
    const analyzer = new SemanticAnalyzer(decomposer);
    const metaPaths = analyzer.analyzeMetaPaths(paths);
    console.log(`   - Meta-Paths: ${metaPaths.length}`);
    metaPaths.forEach(mp => {
      console.log(`     * ${mp.structureType} (regular: ${mp.isRegular}, joints: ${mp.joints.length})`);
    });

    const relations = analyzer.analyzeRelations(paths);
    console.log(`   - Geometric Relations: ${relations.length}`);
    relations.forEach(rel => {
      console.log(`     * ${rel.type}: ${rel.sourceId} ↔ ${rel.targetId} (${rel.confidence})`);
    });

    // Step 4: Structured Pathfinding
    console.log(`\n🗺️  Structured Pathfinding (Sample)`);
    const finder = new StructuredPathFinder(pathInfo.placementCoords);
    if (pathInfo.metadata.landmarks) {
      const { tail, tip } = pathInfo.metadata.landmarks as any;
      if (tail && tip) {
        const patterns = finder.findAllPaths(tail, tip);
        console.log(`   - Valid patterns from tail→tip: ${patterns.length}`);
        patterns.slice(0, 3).forEach(p => {
          console.log(`     * ${p.type} (${p.subtype}): ${p.coords.length} steps`);
        });
      }
    }

    // Step 5: Phase 3 - Pedagogical Placement
    console.log(`\n🎓 Phase 3: Pedagogical Placement`);
    const placer = new PedagogicalPlacer();
    const placements = placer.placeItems(metaPaths, areas, boundaries, relations, finder);
    console.log(`   - Total Placements: ${placements.length}`);

    const conceptStats = new Map<string, number>();
    placements.forEach(p => {
      conceptStats.set(p.concept, (conceptStats.get(p.concept) || 0) + 1);
    });

    console.log(`\n📊 Concept Distribution:`);
    conceptStats.forEach((count, concept) => {
      console.log(`   - ${concept}: ${count} placement(s)`);
    });

    console.log(`\n${'='.repeat(60)}`);
    console.log(`✨ Analysis Complete!`);
    console.log(`${'='.repeat(60)}\n`);

    return {
      pathInfo,
      decomposition: { areas, paths, boundaries },
      semantics: { metaPaths, relations },
      placements
    };
  }
}

// ============================================================================
// EXAMPLE USAGE
// ============================================================================

const engine = new ReasoningEngine();

console.log('Example 1: Arrow Shape');
const arrowResult = engine.run('arrow_shape', [20, 1, 20], {
  shaftLength: 5,
  headSize: 4
});

console.log('\n\nExample 2: Branching (Conditionals)');
const branchResult = engine.run('branching', [20, 1, 20], {
  mainLength: 5,
  branchLength: 3
});

console.log('\n\nExample 3: Spiral (Recursion)');
const spiralResult = engine.run('spiral', [30, 1, 30], {
  turns: 3
});

// Export for use in other modules
export {
  ReasoningEngine,
  ArrowShapeTopology,
  BranchingTopology,
  SpiralTopology,
  GeometricDecomposer,
  SemanticAnalyzer,
  StructuredPathFinder,
  PedagogicalPlacer,
  Utils
};