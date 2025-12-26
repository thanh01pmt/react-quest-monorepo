
// ============================================================================
// GEOMETRIC DECOMPOSER (TIER 1)
// ============================================================================

import { 
  Block, Vector3, PathSegment, Area, Connector, PathRelation, SpecialPoint, Tier1Result, 
  Gateway, Hole, MetaPath, AreaSubStructure, CompositeMetadata, ComponentMetadata 
} from '../../core/types';
import { 
  vectorToKey, keyToVector, vectorEquals, vectorAdd, vectorSub, 
  vectorScale, vectorDot, vectorCross, vectorMagnitude, vectorNormalize, vectorDistance 
} from '../../core/GeometryUtils';
import { AreaBoundaryAnalyzer } from './BoundaryTracer';

export class GeometricDecomposer {
  private blocks: Vector3[];
  private blockSet: Set<string>;
  private visited: Set<string>;
  private compositeMetadata?: CompositeMetadata;  // [NEW] For Layout × Module recognition
  
  // NEW: Constants from Geometric Reasoning Engine
  private readonly MIN_AREA_SIZE = 5;  // Minimum blocks for a valid area (cross shape)
  private readonly DIRECTIONS_2D: Array<{x: number, z: number}> = [
    {x: 0, z: 1}, {x: 0, z: -1}, {x: 1, z: 0}, {x: -1, z: 0}
  ];

  constructor(blocks: Block[], compositeMetadata?: CompositeMetadata) {
    this.blocks = blocks.map(b => b.position);
    this.blockSet = new Set(this.blocks.map(vectorToKey));
    this.visited = new Set();
    this.compositeMetadata = compositeMetadata;
  }

  public analyze(): Tier1Result {
    // [NEW] Check for composite metadata first - use it instead of geometric analysis
    if (this.compositeMetadata && this.compositeMetadata.components?.length > 0) {
      return this.analyzeComposite();
    }
    
    // Phase 1: Core geometric decomposition (original path)
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
    
    // [NEW] PRIORITY: Detect staircases FIRST before general MetaPath analysis
    const { staircases, usedSegmentIds } = this.detectStaircases(segments);
    
    // Then analyze remaining segments for other MetaPath types
    const remainingSegments = segments.filter(s => !usedSegmentIds.has(s.id));
    const otherMetaPaths = this.analyzeMetaPaths(remainingSegments);
    
    // Combine: staircases first, then other patterns
    const metaPaths = [...staircases, ...otherMetaPaths];
    
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
   * [NEW] Analyze using composite metadata when available
   * This bypasses geometric analysis and uses topology-provided structure
   */
  private analyzeComposite(): Tier1Result {
    const metadata = this.compositeMetadata!;
    const areas: Area[] = [];
    const segments: PathSegment[] = [];
    const yLevel = this.blocks[0]?.y ?? 0;
    
    // Convert components to Areas
    for (const comp of metadata.components) {
      const center: Vector3 = { x: comp.center[0], y: comp.center[1], z: comp.center[2] };
      
      // Find all blocks within component bounds
      const compBlocks = this.blocks.filter(b => 
        b.x >= comp.bounds.min_x && b.x <= comp.bounds.max_x &&
        b.z >= comp.bounds.min_z && b.z <= comp.bounds.max_z
      );
      
      if (compBlocks.length > 0) {
        const area = this.createArea(comp.id, compBlocks);
        // Add component-specific metadata
        (area as any).moduleType = comp.module_type;
        (area as any).landmarks = comp.landmarks;
        (area as any).shapeType = comp.module_type === 'square' ? 'square' : 
                                   comp.module_type === 'triangle' ? 'irregular' : 'rectangle';
        
        // [NEW] Analyze square island boundary and parallel rows
        if (comp.module_type === 'square' && comp.landmarks?.entrance) {
          this.analyzeSquareIslandInternal(area, comp, yLevel);
        }
        
        areas.push(area);
      }
    }
    
    // Convert connectors to PathSegments
    for (let i = 0; i < metadata.connectors.length; i++) {
      const conn = metadata.connectors[i];
      const points: Vector3[] = conn.path.map(p => ({ x: p[0], y: p[1], z: p[2] }));
      
      if (points.length >= 2) {
        const direction = vectorNormalize(vectorSub(points[points.length - 1], points[0]));
        segments.push({
          id: `connector_${conn.from}_to_${conn.to}`,
          points,
          direction,
          length: points.length,
          plane: this.determinePlane(direction)
        });
      }
    }
    
    // Build remaining structures
    const areaBlockKeys = new Set<string>();
    areas.forEach(a => a.blocks.forEach(b => areaBlockKeys.add(vectorToKey(b))));
    
    const connectors = this.findConnectors(areas);
    const points = this.findSpecialPoints(segments);
    const relations = this.analyzeRelations(segments);
    const gateways = this.findGateways(areas, segments);
    const metaPaths = this.analyzeMetaPaths(segments);
    
    // Enrich areas
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
   * [NEW] Analyze internal structure of square islands
   * Detects boundary edges and parallel rows for algorithm placement
   */
  private analyzeSquareIslandInternal(area: Area, comp: ComponentMetadata, yLevel: number): void {
    const entrance = comp.landmarks.entrance;
    if (!entrance) return;

    const { min_x, max_x, min_z, max_z } = comp.bounds;
    const internalPaths: PathSegment[] = [];
    const subStructures: AreaSubStructure[] = [];
    
    // Determine gateway direction based on entrance position
    let gatewayDir: 'east' | 'west' | 'north' | 'south';
    if (entrance[0] === min_x) gatewayDir = 'west';
    else if (entrance[0] === max_x) gatewayDir = 'east';
    else if (entrance[2] === min_z) gatewayDir = 'north';
    else gatewayDir = 'south';

    // [NEW] Generate 4 boundary edges
    const edges: { id: string; points: Vector3[]; isGateway: boolean }[] = [];
    
    // North edge (z = min_z)
    const northEdge: Vector3[] = [];
    for (let x = min_x; x <= max_x; x++) {
      northEdge.push({ x, y: yLevel, z: min_z });
    }
    edges.push({ id: `${area.id}_edge_north`, points: northEdge, isGateway: gatewayDir === 'north' });
    
    // South edge (z = max_z)
    const southEdge: Vector3[] = [];
    for (let x = min_x; x <= max_x; x++) {
      southEdge.push({ x, y: yLevel, z: max_z });
    }
    edges.push({ id: `${area.id}_edge_south`, points: southEdge, isGateway: gatewayDir === 'south' });
    
    // West edge (x = min_x)
    const westEdge: Vector3[] = [];
    for (let z = min_z; z <= max_z; z++) {
      westEdge.push({ x: min_x, y: yLevel, z });
    }
    edges.push({ id: `${area.id}_edge_west`, points: westEdge, isGateway: gatewayDir === 'west' });
    
    // East edge (x = max_x)
    const eastEdge: Vector3[] = [];
    for (let z = min_z; z <= max_z; z++) {
      eastEdge.push({ x: max_x, y: yLevel, z });
    }
    edges.push({ id: `${area.id}_edge_east`, points: eastEdge, isGateway: gatewayDir === 'east' });

    // Convert edges to PathSegments
    for (const edge of edges) {
      if (edge.points.length >= 2) {
        const dir = vectorNormalize(vectorSub(edge.points[edge.points.length - 1], edge.points[0]));
        internalPaths.push({
          id: edge.id,
          points: edge.points,
          direction: dir,
          length: edge.points.length,
          plane: this.determinePlane(dir)
        });
      }
    }

    // [NEW] Generate parallel rows for loop patterns
    // Rows parallel to gateway edge are ideal for repeat algorithms
    const isHorizontalGateway = (gatewayDir === 'north' || gatewayDir === 'south');
    
    if (isHorizontalGateway) {
      // Generate rows parallel to X-axis
      for (let z = min_z; z <= max_z; z++) {
        const row: Vector3[] = [];
        for (let x = min_x; x <= max_x; x++) {
          row.push({ x, y: yLevel, z });
        }
        const rowId = z === entrance[2] ? `${area.id}_row_gateway` : 
                      z === (gatewayDir === 'north' ? max_z : min_z) ? `${area.id}_row_opposite` :
                      `${area.id}_row_${z}`;
        
        subStructures.push({
          type: z === entrance[2] ? 'wing_mass' as const : 'body_mass' as const,
          id: rowId,
          coords: row,
          description: z === entrance[2] ? 'Gateway Row (Entry)' : 
                       `Parallel Row (good for loops)`
        });
      }
    } else {
      // Generate rows parallel to Z-axis
      for (let x = min_x; x <= max_x; x++) {
        const row: Vector3[] = [];
        for (let z = min_z; z <= max_z; z++) {
          row.push({ x, y: yLevel, z });
        }
        const rowId = x === entrance[0] ? `${area.id}_row_gateway` : 
                      x === (gatewayDir === 'west' ? max_x : min_x) ? `${area.id}_row_opposite` :
                      `${area.id}_row_${x}`;
        
        subStructures.push({
          type: x === entrance[0] ? 'wing_mass' as const : 'body_mass' as const,
          id: rowId,
          coords: row,
          description: x === entrance[0] ? 'Gateway Row (Entry)' : 
                       `Parallel Row (good for loops)`
        });
      }
    }

    // Attach to area
    area.internalPaths = internalPaths;
    area.subStructures = subStructures;
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

    // Nếu không có lõi (không có block nào bị bao vây tứ phía):
    // → Đây là thin structure (Z-shape, S-shape, wide paths, etc.)
    // → KHÔNG tạo Area, để segment tracing xử lý như paths
    // → Các paths song song sẽ được detect bởi PatternAnalyzer (parallel relation)
    if (coreBlocks.size === 0) {
      // [FIX] Bỏ junction-based fallback để tránh false positive cho wide thin structures
      // traceAllSegments() sẽ xử lý tất cả blocks như segments
      return [];
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

    // Pass 2: Filter Candidates
    for (const key of expansionCandidates) {
      const { x, z } = this.parse2DKey(key);
      let neighborsCount = 0;
      for (const dir of this.DIRECTIONS_2D) {
        if (grid2D.has(`${x + dir.x},${z + dir.z}`)) neighborsCount++;
      }
      
      if (neighborsCount >= 3) { 
        areaKeySet.add(key);
      } else {
        // Edge case: Đỉnh nhọn (Wing Tip) chỉ có 1-2 hàng xóm
        let connectedToCore = false;
        for (const dir of this.DIRECTIONS_2D) {
          if (coreBlocks.has(`${x + dir.x},${z + dir.z}`)) {
            connectedToCore = true;
            break;
          }
        }
        
        if (connectedToCore) {
          const blocksAtZ = this.blocks.filter(b => b.z === z);
          const xValues = blocksAtZ.map(b => b.x);
          const width = xValues.length > 0 ? Math.max(...xValues) - Math.min(...xValues) + 1 : 0;

          if (width >= 2 || neighborsCount <= 1) {
            areaKeySet.add(key);
          }
        }
      }
    }

    // Pass 3: Thêm một lượt expansion nữa cho các ô viền còn lại
    const finalExpansion = new Set<string>();
    for (const key of areaKeySet) {
      const { x, z } = this.parse2DKey(key);
      for (const dir of this.DIRECTIONS_2D) {
        const nKey = `${x + dir.x},${z + dir.z}`;
        if (grid2D.has(nKey) && !areaKeySet.has(nKey)) {
          const { z: nz } = this.parse2DKey(nKey);
          const blocksAtZ = this.blocks.filter(b => b.z === nz);
          const xValues = blocksAtZ.map(b => b.x);
          const width = xValues.length > 0 ? Math.max(...xValues) - Math.min(...xValues) + 1 : 0;
          
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
    const yLevel = this.blocks[0]?.y ?? 0;

    // Strategy: Junction-based
    // FIX: Junction blocks can belong to MULTIPLE areas (shared ownership)
    const junctionBlocks = new Set<string>();
    for (const block of this.blocks) {
      if (this.countHorizontalNeighbors(block) >= 3) {
        junctionBlocks.add(vectorToKey(block));
      }
    }

    // Track which non-junction blocks have been assigned (junctions can be shared)
    const assignedNonJunction = new Set<string>();
    // Track which junction blocks have been "seeded" (to avoid duplicate area creation)
    const seededJunctions = new Set<string>();

    // Cluster adjacent junctions
    for (const junctionKey of junctionBlocks) {
      if (seededJunctions.has(junctionKey)) continue;

      const areaBlocks: Vector3[] = [];
      const block = this.findBlockByKey(junctionKey);
      if (!block) continue;
      
      const queue: Vector3[] = [block];
      seededJunctions.add(junctionKey);
      areaBlocks.push(block);

      // Expand to adjacent junctions and radius 1
      let qIndex = 0;
      while (qIndex < queue.length) {
        const current = queue[qIndex++];
        const neighbors = this.getHorizontalNeighbors(current);
        
        for (const n of neighbors) {
          const nKey = vectorToKey(n);
          if (!this.blockSet.has(nKey)) continue;
          
          const isJunction = junctionBlocks.has(nKey);
          
          if (isJunction) {
            // Junction blocks: can be added to multiple areas
            // Only add to queue if not yet seeded (to prevent infinite loop)
            if (!seededJunctions.has(nKey)) {
              seededJunctions.add(nKey);
              queue.push(n);
            }
            // Always add junction to this area's blocks (shared ownership)
            if (!areaBlocks.some(b => vectorToKey(b) === nKey)) {
              areaBlocks.push(n);
            }
          } else {
            // Non-junction blocks: can only belong to one area
            if (!assignedNonJunction.has(nKey)) {
              assignedNonJunction.add(nKey);
              areaBlocks.push(n);
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
   * Helper to find block object from key
   */
  private findBlockByKey(key: string): Vector3 | undefined {
    return this.blocks.find(b => vectorToKey(b) === key);
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

    // Find boundary blocks
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
   */
  private findGateways(areas: Area[], segments: PathSegment[]): Gateway[] {
    const gateways: Gateway[] = [];
    let gatewayId = 0;
    
    for (const area of areas) {
      const areaBoundarySet = new Set(area.boundary.map(b => vectorToKey(b)));
      
      for (const segment of segments) {
        const endpoints = [segment.points[0], segment.points[segment.points.length - 1]];
        
        for (const endpoint of endpoints) {
          const neighbors = this.getHorizontalNeighbors(endpoint);
          for (const neighbor of neighbors) {
            const neighborKey = vectorToKey(neighbor);
            if (areaBoundarySet.has(neighborKey)) {
              const direction = vectorNormalize(vectorSub(neighbor, endpoint));
              // FIX: Gateway coord should be the boundary block (neighbor), not segment endpoint
              // This allows placing switches at gateway to trigger function/loop when entering area
              const exists = gateways.some(g => 
                vectorEquals(g.coord, neighbor) && 
                g.connectedAreaId === area.id
              );
              
              if (!exists) {
                gateways.push({
                  id: `gateway_${gatewayId++}`,
                  coord: neighbor,  // FIX: Use boundary block, not endpoint
                  connectedPathId: segment.id,
                  connectedAreaId: area.id,
                  direction
                });
              }
              break; 
            }
          }
        }
      }
    }
    
    return gateways;
  }

  // ============================================================================
  // STAIRCASE DETECTION (Iterative Extraction Approach)
  // ============================================================================

  /**
   * [NEW] Detect macro staircases by grouping connected segments and iteratively 
   * extracting the most prominent zigzag/staircase patterns.
   */
  private detectStaircases(segments: PathSegment[]): { staircases: MetaPath[], usedSegmentIds: Set<string> } {
    const staircases: MetaPath[] = [];
    const usedSegmentIds = new Set<string>();
    
    if (segments.length < 2) return { staircases, usedSegmentIds };
    
    // 1. Group ALL segments into connected components (clusters) based on block adjacency
    const clusters = this.clusterConnectedSegments(segments);
    
    // 2. Process each cluster to iteratively extract staircases
    for (const cluster of clusters) {
      if (cluster.length < 2) continue;
      
      // We will work with a set of available blocks in this cluster
      const clusterBlocks = new Map<string, Vector3>();
      const blockToSegId = new Map<string, string>();
      
      cluster.forEach(s => {
        s.points.forEach(p => {
          const key = vectorToKey(p);
          clusterBlocks.set(key, p);
          blockToSegId.set(key, s.id);
        });
      });
      
      // Iteratively find and remove best staircases
      while (clusterBlocks.size > 0) {
        // Try to find best path in current pool of blocks
        // We check both orientations: along Z (X=perp) and along X (Z=perp)
        
        const currentBlocks = Array.from(clusterBlocks.values());
        if (currentBlocks.length === 0) break;
        
        const resultZ = this.findBestStaircaseInBlocks(currentBlocks, 'z'); // Perp=Z (X-moving flow? No, Perp=Z means varying Z. So flow is X?? Wait. findBestStaircaseInBlocks(perp='z') sorts by Z. So flow is X.) 
                                                                           // Actually let's stick to param name: "perpendicularAxis".
                                                                           // if perp='z', we sort by Z. The path moves along Z? No, path moves along Z if we sort by X??
                                                                           // Let's check logic: rows = map<perp, ...>. Step moves from row r to r+1 (perp increases).
                                                                           // So path progresses along Perpendicular Axis.
                                                                           // Width is along Parallel Axis.
                                                                           // Example: Normal stairs (moving up). Perp=Y (Height).
                                                                           // Here X-Z map.
                                                                           // If Perp=Z. Path moves from Z=1 to Z=10. This is "Z-moving" or "Vertical".
                                                                           // Width is along X.
        
        const resultX = this.findBestStaircaseInBlocks(currentBlocks, 'x'); // Path moves along X. Width along Z.
        
        // Choose the best one
        let bestResult = resultZ;
        let bestPerp: 'x' | 'z' = 'z';
         
        if (resultX && (!resultZ || resultX.path.length > resultZ.path.length)) {
          bestResult = resultX;
          bestPerp = 'x';
        }
         
        // Threshold: Staircase should have at least 2 steps (distinct rows) and reasonable length
        // Let's say at least 4 blocks or 3 rows?
        // With current data, length 3 is possible.
        if (!bestResult || bestResult.path.length < 3) {
           break; // No more significant patterns
        }
        
        // We found a staircase!
        const zigzagPath = bestResult.path;
        
        // Identify which segments are involved (for usedSegmentIds)
        // A segment is "used" if a significant portion of it is in the path?
        // Or if ANY block is used? 
        // Let's mark segments touching this path.
        const involvedSegIds = new Set<string>();
        for (const p of zigzagPath) {
          const key = vectorToKey(p);
          const segId = blockToSegId.get(key);
          if (segId) involvedSegIds.add(segId);
          
          // Remove from available blocks
          clusterBlocks.delete(key);
        }
        
        // Create MetaPath
        // We need to associate segments. We associate the ones we found.
        const metaPathSegs = cluster.filter(s => involvedSegIds.has(s.id));
        
        const metaPath: MetaPath = {
          id: `staircase_${staircases.length}`,
          segments: metaPathSegs,
          joints: [],
          structureType: 'macro_staircase',
          isRegular: true,
          isClosed: false,
          totalLength: zigzagPath.length // Approximation
        };
        (metaPath as any).zigzagPath = zigzagPath;
        
        staircases.push(metaPath);
        involvedSegIds.forEach(id => usedSegmentIds.add(id));
      }
    }
    
    return { staircases, usedSegmentIds };
  }

  /**
   * Group ALL segments into connected components using block adjacency.
   */
  private clusterConnectedSegments(segments: PathSegment[]): PathSegment[][] {
    const blockToSeg = new Map<string, string>();
    segments.forEach(s => {
      s.points.forEach(p => blockToSeg.set(vectorToKey(p), s.id));
    });

    const adj = new Map<string, Set<string>>(); // segId -> Set<segId>
    segments.forEach(s => adj.set(s.id, new Set()));

    // Build connections
    segments.forEach(s => {
      s.points.forEach(p => {
        // Check 4 neighbors (Manhattan)
        const neighbors = [
          {x: p.x+1, y: p.y, z: p.z}, {x: p.x-1, y: p.y, z: p.z},
          {x: p.x, y: p.y, z: p.z+1}, {x: p.x, y: p.y, z: p.z-1}
        ];
        neighbors.forEach(n => {
          const key = vectorToKey(n);
          if (blockToSeg.has(key)) {
            const otherId = blockToSeg.get(key)!;
            if (otherId !== s.id) {
              adj.get(s.id)!.add(otherId);
              adj.get(otherId)!.add(s.id);
            }
          }
        });
      });
    });

    // Extract components
    const clusters: PathSegment[][] = [];
    const visited = new Set<string>();

    for (const seg of segments) {
      if (visited.has(seg.id)) continue;
      
      const cluster: PathSegment[] = [];
      const queue = [seg.id];
      visited.add(seg.id);
      
      while (queue.length > 0) {
        const currId = queue.shift()!;
        cluster.push(segments.find(s => s.id === currId)!);
        
        adj.get(currId)!.forEach(neighborId => {
          if (!visited.has(neighborId)) {
            visited.add(neighborId);
            queue.push(neighborId);
          }
        });
      }
      clusters.push(cluster);
    }
    
    return clusters;
  }

  /**
   * Helper: Find best staircase in a raw set of blocks for a given orientation.
   */
  private findBestStaircaseInBlocks(
    blocks: Vector3[], 
    perpendicularAxis: 'x' | 'z'
  ): { path: Vector3[], direction: 1 | -1 } | null {
    // Organize blocks
    const getPerp = (p: Vector3) => perpendicularAxis === 'z' ? p.z : p.x;
    const getPar = (p: Vector3) => perpendicularAxis === 'z' ? p.x : p.z;
    
    const rows = new Map<number, Set<number>>();
    blocks.forEach(p => {
      const r = Math.round(getPerp(p));
      const c = Math.round(getPar(p));
      if (!rows.has(r)) rows.set(r, new Set());
      rows.get(r)!.add(c);
    });
    
    const sortedRowIndices = Array.from(rows.keys()).sort((a, b) => a - b);
    
    // Determine max width (heuristic)
    let maxWidth = 5; // Search range
    
    let bestPath: Vector3[] = [];
    let bestDirection = 0; // 0 for vertical, 1 for right, -1 for left
    let detectedSlope: number = 0; // Actual shift value
    
    // Try step widths from maxWidth down to 1
    for (let width = maxWidth; width >= 1; width--) {
      // Try specific consistent shifts.
      // Range: -5 to 5 heuristic.
      // Typically Shift is 0 (vert), 1 (diag), -1 (diag), 2 (shallow)...
      // Using specific shift enforces slope consistency.
      
      const shiftsToCheck = [0, 1, -1, 2, -2, 3, -3, 4, -4, 5, -5]; 
      
      for (const targetShift of shiftsToCheck) {
        const path = this.findLongestPathForWidth(sortedRowIndices, rows, width, perpendicularAxis, targetShift);
        
        if (path.length > bestPath.length) {
          bestPath = path;
          bestDirection = targetShift === 0 ? 0 : (targetShift > 0 ? 1 : -1);
          detectedSlope = targetShift;
        }
      }
    }
    
    if (bestPath.length < 2) return null;
    
    // Add endpoints using the detected slope
    bestPath = this.addEndpointsToPath(bestPath, rows, perpendicularAxis, detectedSlope);
    
    // Direction for meta path (-1 or 1). Map 0 to 1 (or handle properly?)
    const metaDir = detectedSlope === 0 ? 1 : (detectedSlope > 0 ? 1 : -1);
    
    return { path: bestPath, direction: metaDir as 1 | -1 };
  }
  
  /**
   * Find longest consistent zigzag path for a fixed step width and FIXED SHIFT slope.
   */
  private findLongestPathForWidth(
    sortedRows: number[],
    rowMap: Map<number, Set<number>>,
    stepWidth: number,
    perpAxis: 'x' | 'z',
    targetShift: number
  ): Vector3[] {
    // A "Step" is defined by (row, startCol). It covers [startCol, startCol + stepWidth - 1]
    type StepNode = { row: number, startCol: number, id: string };
    const nodes: StepNode[] = [];
    
    // 1. Identify all valid step nodes
    for (const r of sortedRows) {
      const cols = Array.from(rowMap.get(r)!);
      if (cols.length < stepWidth) continue;
      
      cols.sort((a, b) => a - b);
      
      // Find contiguous sequences of length stepWidth
      for (let i = 0; i <= cols.length - stepWidth; i++) {
        // Check connectivity
        let isContiguous = true;
        for (let j = 0; j < stepWidth - 1; j++) {
          if (cols[i+j+1] !== cols[i+j] + 1) {
            isContiguous = false;
            break;
          }
        }
        
        if (isContiguous) {
          nodes.push({ row: r, startCol: cols[i], id: `${r}_${cols[i]}` });
        }
      }
    }
    
    if (nodes.length === 0) return [];

    // 2. Build DAG edges enforcing STRICT SHIFT CONSISTENCY
    const adj = new Map<string, StepNode[]>();
    nodes.forEach(n => adj.set(n.id, []));
    
    for (const u of nodes) {
      for (const v of nodes) {
        if (v.row === u.row + 1) { // Physically adjacent rows
          
          const shift = v.startCol - u.startCol;
          
          // Strict Slope Consistency
          if (shift !== targetShift) continue;
          
          // Check overlap/touch strictness
          // u range: [u.startCol, uMax]
          // v range: [v.startCol, vMax]
          const uMax = u.startCol + stepWidth - 1;
          const vMax = v.startCol + stepWidth - 1;
          
          // Gap is strictly calculated as coordinate difference
          // Touching: max - min = 1.
          // Overlapping: max - min <= 0.
          // Disconnected: max - min > 1.
          const gap = Math.max(v.startCol - uMax, u.startCol - vMax);
          
          // Connect ONLY if they overlap or strictly touch (gap <= 1)
          // Relaxed to gap <= 2 to robustly handle slight irregularities IF shift is perfect.
          if (gap <= 2) {
             adj.get(u.id)!.push(v);
          }
        }
      }
    }
    
    // 3. Find Longest Path in DAG
    const memo = new Map<string, StepNode[]>();
    
    const getPath = (u: StepNode): StepNode[] => {
      if (memo.has(u.id)) return memo.get(u.id)!;
      
      let maxPath: StepNode[] = [];
      const neighbors = adj.get(u.id) || [];
      
      for (const v of neighbors) {
        const pathFromV = getPath(v);
        if (pathFromV.length > maxPath.length) {
          maxPath = pathFromV;
        }
      }
      
      const res = [u, ...maxPath];
      memo.set(u.id, res);
      return res;
    };
    
    let bestChain: StepNode[] = [];
    
    // Iteration order:
    // Shift < 0: Reverse (Prioritize large startCol)
    // Shift >= 0: Normal (Prioritize small startCol)
    const nodesToIterate = targetShift < 0 ? [...nodes].reverse() : nodes;
    
    for (const node of nodesToIterate) {
      const chain = getPath(node);
      if (chain.length > bestChain.length) {
        bestChain = chain;
      }
    }
    
    // 4. Convert chain to coordinates
    const zigzag: Vector3[] = [];
    for (const node of bestChain) {
      for (let k = 0; k < stepWidth; k++) {
        const c = node.startCol + k;
        zigzag.push(perpAxis === 'z' 
          ? { x: c, y: 0, z: node.row }  // Par=X, Perp=Z
          : { x: node.row, y: 0, z: c }  // Par=Z, Perp=X
        );
      }
    }
    
    return zigzag;
  }
  
  /**
   * Check start/end of path to add valid endpoints (Case A), respecting direction.
   * Enhanced to aggressively extend with full-width segments when possible.
   */
  private addEndpointsToPath(
    path: Vector3[], 
    rowMap: Map<number, Set<number>>, 
    perpAxis: 'x' | 'z',
    targetShift: number
  ): Vector3[] {
    if (path.length === 0) return path;
    const newPath = [...path];
    
    const getPerp = (p: Vector3) => perpAxis === 'z' ? p.z : p.x;
    const getPar = (p: Vector3) => perpAxis === 'z' ? p.x : p.z;
    const createVec = (r: number, c: number) => perpAxis === 'z' ? {x: c, y:0, z:r} : {x: r, y:0, z:c};
    
    // Detect current path width (from the last step)
    const pathWidth = this.detectPathStepWidth(newPath, perpAxis);
    
    // Check Top End (Last row + 1)
    const lastBlock = newPath[newPath.length - 1];
    const lastRow = getPerp(lastBlock);
    const lastPar = getPar(lastBlock);
    const nextRow = lastRow + 1;
    
    if (rowMap.has(nextRow)) {
      const candidates = Array.from(rowMap.get(nextRow)!).sort((a,b) => a-b);
      
      // Try to find a FULL-WIDTH segment first
      if (pathWidth >= 2) {
        for (let i = 0; i <= candidates.length - pathWidth; i++) {
          let isContiguous = true;
          for (let j = 0; j < pathWidth - 1; j++) {
            if (candidates[i+j+1] !== candidates[i+j] + 1) {
              isContiguous = false;
              break;
            }
          }
          
          if (isContiguous) {
            const segStart = candidates[i];
            const shift = segStart - lastPar;
            if (shift === targetShift) {
              // Add entire segment
              for (let k = 0; k < pathWidth; k++) {
                newPath.push(createVec(nextRow, segStart + k));
              }
              return newPath; // Early return after adding full segment
            }
          }
        }
      }
      
      // Fallback: Try single block endpoint
      const endpoint = candidates.find(c => {
         if (Math.abs(c - lastPar) > Math.abs(targetShift) + 3) return false; 
         const shift = c - lastPar;
         return shift === targetShift;
      });
      
      if (endpoint !== undefined) {
         newPath.push(createVec(nextRow, endpoint));
      }
    }
    
    // Check Bottom End (First row - 1)
    const firstBlock = newPath[0];
    const firstRow = getPerp(firstBlock);
    const firstPar = getPar(firstBlock);
    const prevRow = firstRow - 1;
    
     if (rowMap.has(prevRow)) {
      const candidates = Array.from(rowMap.get(prevRow)!).sort((a,b) => a-b);
      
      // Try to find a FULL-WIDTH segment first
      if (pathWidth >= 2) {
        for (let i = 0; i <= candidates.length - pathWidth; i++) {
          let isContiguous = true;
          for (let j = 0; j < pathWidth - 1; j++) {
            if (candidates[i+j+1] !== candidates[i+j] + 1) {
              isContiguous = false;
              break;
            }
          }
          
          if (isContiguous) {
            const segStart = candidates[i];
            const shift = firstPar - segStart;
            if (shift === targetShift) {
              // Add entire segment at beginning
              for (let k = pathWidth - 1; k >= 0; k--) {
                newPath.unshift(createVec(prevRow, segStart + k));
              }
              return newPath; // Early return after adding full segment
            }
          }
        }
      }
      
      // Fallback: Try single block endpoint
      const endpoint = candidates.find(c => {
         const shift = firstPar - c; 
         return shift === targetShift;
      });
      
      if (endpoint !== undefined) {
         newPath.unshift(createVec(prevRow, endpoint));
      }
    }
    
    return newPath;
  }
  
  /**
   * Detect the typical step width of a path by analyzing blocks at the same row.
   */
  private detectPathStepWidth(path: Vector3[], perpAxis: 'x' | 'z'): number {
    if (path.length === 0) return 1;
    
    const getPerp = (p: Vector3) => perpAxis === 'z' ? p.z : p.x;
    const getPar = (p: Vector3) => perpAxis === 'z' ? p.x : p.z;
    
    // Group blocks by row
    const rowMap = new Map<number, number[]>();
    path.forEach(p => {
      const r = Math.round(getPerp(p));
      const c = Math.round(getPar(p));
      if (!rowMap.has(r)) rowMap.set(r, []);
      rowMap.get(r)!.push(c);
    });
    
    // Calculate width for each row (contiguous span)
    const widths: number[] = [];
    rowMap.forEach(cols => {
      if (cols.length > 0) {
        cols.sort((a,b) => a-b);
        widths.push(cols[cols.length-1] - cols[0] + 1);
      }
    });
    
    // Return the most common width (mode) or max
    if (widths.length === 0) return 1;
    return Math.max(...widths);
  }

  /**
   * Find joint points (step transitions) in a staircase
   */
  private findStaircaseJoints(chain: PathSegment[], perpendicularAxis: 'x' | 'z'): Vector3[] {
    const joints: Vector3[] = [];
    const parallelAxis = perpendicularAxis === 'z' ? 'x' : 'z';
    
    for (let i = 0; i < chain.length - 1; i++) {
      const seg = chain[i];
      const nextSeg = chain[i + 1];
      
      // Find the step connection point (overlap region)
      const segCoords = seg.points.map(p => parallelAxis === 'x' ? p.x : p.z);
      const nextCoords = nextSeg.points.map(p => parallelAxis === 'x' ? p.x : p.z);
      
      const overlapMin = Math.max(Math.min(...segCoords), Math.min(...nextCoords));
      const overlapMax = Math.min(Math.max(...segCoords), Math.max(...nextCoords));
      
      if (overlapMax >= overlapMin) {
        // Find a point in the overlap region from current segment
        const stepPoint = seg.points.find(p => {
          const coord = parallelAxis === 'x' ? p.x : p.z;
          return coord >= overlapMin && coord <= overlapMax;
        });
        if (stepPoint) {
          joints.push(stepPoint);
        }
      }
    }
    
    return joints;
  }

  // ============================================================================
  // META-PATH ANALYSIS (For non-staircase patterns)
  // ============================================================================

  /**
   * Analyze MetaPaths - chains of connected path segments with pattern detection
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
      
      const chain: PathSegment[] = [];
      const stack = [segment.id];
      
      while (stack.length > 0) {
        const segId = stack.pop()!;
        if (visitedSegments.has(segId)) continue;
        
        visitedSegments.add(segId);
        const seg = segmentMap.get(segId)!;
        chain.push(seg);
        
        const startKey = vectorToKey(seg.points[0]);
        const endKey = vectorToKey(seg.points[seg.points.length - 1]);
        
        // [UPDATED] Check strict endpoints AND adjacent blocks for connectivity
        // This allows "stepped" paths (like Z-shape) where segments touch side-by-side to connect
        const keysToCheck = [startKey, endKey];
        
        // Add neighbors of endpoints to keysToCheck
        const startNeighbors = this.getHorizontalNeighbors(seg.points[0]);
        const endNeighbors = this.getHorizontalNeighbors(seg.points[seg.points.length - 1]);
        
        for (const n of [...startNeighbors, ...endNeighbors]) {
          keysToCheck.push(vectorToKey(n));
        }

        for (const key of keysToCheck) {
          const connectedSegIds = endpointToSegments.get(key) || [];
          for (const connectedId of connectedSegIds) {
            if (!visitedSegments.has(connectedId)) {
              stack.push(connectedId);
            }
          }
        }
      }
      
      if (chain.length > 0) {
        const metaPath = this.classifyMetaPath(chain, metaPathId++);
        metaPaths.push(metaPath);
      }
    }
    
    return metaPaths;
  }

  /**
   * Classify a chain of segments into a MetaPath with structure type
   * 
   * Detection logic for each structureType:
   * - straight_chain: 1 segment or all same direction
   * - macro_staircase: 2 alternating directions, equal lengths
   * - l_shape: 2 segments, 1 corner (90°)
   * - u_shape: 3 segments, 2 corners with same turn direction
   * - s_z_shape: 3 segments, 2 corners with opposite turn directions
   * - v_shape: 2 segments converging (directions point toward each other)
   * - closed_loop: First point == Last point
   * - spiral: 4+ directions, lengths progressively change
   * - spine_branch: Has a main axis with perpendicular branches
   * - cross: 4 branches from central point
   * - radial: 5+ branches from central point
   * - arrow: Main segment + expansion area at end
   * - branching: Generic multi-branch
   * - random: Unclassified
   */
  private classifyMetaPath(chain: PathSegment[], id: number): MetaPath {
    const joints: Vector3[] = [];
    
    for (let i = 0; i < chain.length; i++) {
        const seg = chain[i];
        if (i > 0) {
          const prevEnd = chain[i-1].points[chain[i-1].points.length - 1];
          const currStart = seg.points[0];
          
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
    
    const totalLength = chain.reduce((sum, s) => sum + s.length, 0) - (chain.length - 1);
    
    // Detect closed loop: first point of first segment == last point of last segment
    let isClosed = false;
    if (chain.length >= 2) {
      const firstSegStart = chain[0].points[0];
      const lastSegEnd = chain[chain.length - 1].points[chain[chain.length - 1].points.length - 1];
      isClosed = vectorEquals(firstSegStart, lastSegEnd);
      
      // Also check if last segment end connects to first segment start via neighbor
      if (!isClosed) {
        const distance = vectorDistance(firstSegStart, lastSegEnd);
        if (distance < 1.5) {
          isClosed = true;
        }
      }
    }
    
    let structureType: MetaPath['structureType'] = 'random';
    let isRegular = false;
    
    // Collect analysis data
    const directions = chain.map(s => s.direction);
    const directionKeys = chain.map(s => vectorToKey(s.direction));
    const uniqueDirections = new Set(directionKeys);
    const lengths = chain.map(s => s.length);
    const lengthSet = new Set(lengths);
    
    // ===== CLOSED LOOP =====
    if (isClosed) {
      structureType = 'closed_loop';
      isRegular = lengthSet.size === 1;
    }
    // ===== SINGLE SEGMENT =====
    else if (chain.length === 1) {
      structureType = 'straight_chain';
      isRegular = true;
    }
    // ===== CHAIN WITH SAME DIRECTION (Check Collinearity) =====
    else if (uniqueDirections.size === 1) {
      // Check if segments are collinear (share same axis line)
      let isCollinear = true;
      const firstDir = chain[0].direction;
      const firstStart = chain[0].points[0];
      
      for (let i = 1; i < chain.length; i++) {
        // Project start point of this segment onto the line of the first segment
        // If distance is > 0, they are offset (stepped)
        const currentStart = chain[i].points[0];
        const diff = vectorSub(currentStart, firstStart);
        
        // Remove component parallel to direction
        // v_perp = v - (v . d) * d
        const parallelComponent = vectorScale(firstDir, vectorDot(diff, firstDir));
        const perpendicularComponent = vectorSub(diff, parallelComponent);
        
        if (vectorMagnitude(perpendicularComponent) > 0.1) {
          isCollinear = false;
          break;
        }
      }
      
      if (isCollinear) {
        structureType = 'straight_chain';
        isRegular = true;
      } else {
        // Parallel but offset -> Stepped / Zigzag
        structureType = 'macro_staircase'; 
        isRegular = lengthSet.size <= 2; // Allow some variance
      }
    }
    // ===== 2 SEGMENTS =====
    else if (chain.length === 2) {
      // Check angle between segments
      const d1 = directions[0];
      const d2 = directions[1];
      const dotProduct = Math.abs(vectorDot(d1, d2));
      
      if (dotProduct < 0.1) {
        // Perpendicular (90°)
        // Check if they converge (V-shape) or form L
        const seg1End = chain[0].points[chain[0].points.length - 1];
        const seg2Start = chain[1].points[0];
        
        if (vectorEquals(seg1End, seg2Start)) {
          // Connected at corner -> L-shape
          structureType = 'l_shape';
          isRegular = lengths[0] === lengths[1];
        } else {
          // V-shape: two arms meeting at apex
          structureType = 'v_shape';
          isRegular = lengths[0] === lengths[1];
        }
      } else if (dotProduct > 0.9) {
        // Same or opposite direction
        structureType = 'straight_chain';
        isRegular = true;
      } else {
        // Diagonal angle
        structureType = 'l_shape';
        isRegular = false;
      }
    }
    // ===== 3 SEGMENTS =====
    else if (chain.length === 3) {
      // Analyze turn directions
      const turn1 = this.getTurnDirection(directions[0], directions[1]);
      const turn2 = this.getTurnDirection(directions[1], directions[2]);
      
      if (turn1 === turn2 && turn1 !== 'straight') {
        // Same turn direction both times -> U-shape
        structureType = 'u_shape';
        isRegular = lengths[0] === lengths[2];
      } else if (turn1 !== 'straight' && turn2 !== 'straight' && turn1 !== turn2) {
        // Opposite turn directions -> S/Z shape
        structureType = 's_z_shape';
        isRegular = lengths[0] === lengths[2];
      } else if (uniqueDirections.size === 2 && lengthSet.size === 1) {
        // Zigzag pattern
        structureType = 'macro_staircase';
        isRegular = true;
      } else if (uniqueDirections.size === 1) {
        // Check if segments are collinear (share same axis line)
        let isCollinear = true;
        const firstDir = chain[0].direction;
        const firstStart = chain[0].points[0];
        
        for (let i = 1; i < chain.length; i++) {
            const currentStart = chain[i].points[0];
            const diff = vectorSub(currentStart, firstStart);
            const parallelComponent = vectorScale(firstDir, vectorDot(diff, firstDir));
            const perpendicularComponent = vectorSub(diff, parallelComponent);
            if (vectorMagnitude(perpendicularComponent) > 0.1) {
                isCollinear = false;
                break;
            }
        }
        
        if (isCollinear) {
            structureType = 'straight_chain';
            isRegular = true;
        } else {
            const minLen = Math.min(...lengths);
            const maxLen = Math.max(...lengths);
            if (maxLen > minLen * 1.5) {
                structureType = 'branching';
                isRegular = false;
            } else {
                structureType = 'macro_staircase'; 
                isRegular = true;
            }
        }
      } else {
        // Check for spine_branch: middle segment perpendicular to first and last
        const dotFirst = Math.abs(vectorDot(directions[0], directions[1]));
        const dotLast = Math.abs(vectorDot(directions[1], directions[2]));
        
        if (dotFirst < 0.1 && dotLast < 0.1) {
          structureType = 'spine_branch';
          isRegular = false;
        } else {
          structureType = 'branching';
        }
      }
    }
    // ===== 4+ SEGMENTS =====
    else if (chain.length >= 4) {
      // Check for cross pattern (4 branches from center)
      if (chain.length === 4 && uniqueDirections.size === 4) {
        // Check if all segments meet at a common point
        const allEndpoints: Vector3[] = [];
        for (const seg of chain) {
          allEndpoints.push(seg.points[0]);
          allEndpoints.push(seg.points[seg.points.length - 1]);
        }
        
        // Find the most common point (center of cross)
        const pointCounts = new Map<string, number>();
        for (const p of allEndpoints) {
          const key = vectorToKey(p);
          pointCounts.set(key, (pointCounts.get(key) || 0) + 1);
        }
        
        const maxCount = Math.max(...pointCounts.values());
        if (maxCount >= 4) {
          structureType = 'cross';
          isRegular = lengthSet.size === 1;
        } else {
          structureType = 'branching';
        }
      }
      // Check for radial pattern (5+ branches)
      else if (chain.length >= 5 && uniqueDirections.size >= 4) {
        // Similar center detection
        const allEndpoints: Vector3[] = [];
        for (const seg of chain) {
          allEndpoints.push(seg.points[0]);
          allEndpoints.push(seg.points[seg.points.length - 1]);
        }
        
        const pointCounts = new Map<string, number>();
        for (const p of allEndpoints) {
          const key = vectorToKey(p);
          pointCounts.set(key, (pointCounts.get(key) || 0) + 1);
        }
        
        const maxCount = Math.max(...pointCounts.values());
        if (maxCount >= chain.length) {
          structureType = 'radial';
          isRegular = lengthSet.size === 1;
        } else {
          structureType = 'branching';
        }
      }
      // Check for spiral pattern
      else if (uniqueDirections.size >= 3) {
        const isIncreasing = lengths.every((len, i) => i === 0 || len >= lengths[i-1]);
        const isDecreasing = lengths.every((len, i) => i === 0 || len <= lengths[i-1]);
        
        if (isIncreasing || isDecreasing) {
          structureType = 'spiral';
          isRegular = true;
        } else {
          structureType = 'branching';
        }
      }
      // Check for macro_staircase (alternating 2 directions) or Stepped Collinear
      else if (uniqueDirections.size === 2 && lengthSet.size === 1) {
        structureType = 'macro_staircase';
        isRegular = true;
      }
      else if (uniqueDirections.size === 1) {
            // Check if segments are collinear (share same axis line)
            let isCollinear = true;
            const firstDir = chain[0].direction;
            const firstStart = chain[0].points[0];
            
            for (let i = 1; i < chain.length; i++) {
                // Project start point of this segment onto the line of the first segment
                // If distance is > 0, they are offset (stepped)
                const currentStart = chain[i].points[0];
                const diff = vectorSub(currentStart, firstStart);
                
                // Remove component parallel to direction
                // v_perp = v - (v . d) * d
                const parallelComponent = vectorScale(firstDir, vectorDot(diff, firstDir));
                const perpendicularComponent = vectorSub(diff, parallelComponent);
                
                if (vectorMagnitude(perpendicularComponent) > 0.1) {
                isCollinear = false;
                break;
                }
            }
            
            if (isCollinear) {
                structureType = 'straight_chain';
                isRegular = true;
            } else {
                // Parallel but offset -> Stepped / Zigzag
                // [UPDATED] Check for regularity in length
                const minLen = Math.min(...lengths);
                const maxLen = Math.max(...lengths);
                
                // If max length is significantly larger than min length (e.g., > 1.5x),
                // it's likely a mix of a thoroughfare (spine) and steps, not a regular staircase.
                if (maxLen > minLen * 1.5) {
                    structureType = 'branching'; // Or 'irregular_stepped'
                    isRegular = false;
                } else {
                    structureType = 'macro_staircase'; 
                    isRegular = true;
                }
            }
      }
      else {
        structureType = 'branching';
      }
    }
    
    return {
      id: `metapath_${id}`,
      segments: chain,
      joints,
      structureType,
      isRegular,
      isClosed,
      totalLength
    };
  }

  /**
   * Helper: Determine turn direction between two vectors
   * Returns 'left', 'right', or 'straight'
   */
  private getTurnDirection(from: Vector3, to: Vector3): 'left' | 'right' | 'straight' {
    // 2D cross product (using x and z for horizontal plane)
    const cross = from.x * to.z - from.z * to.x;
    
    if (Math.abs(cross) < 0.1) {
      return 'straight';
    } else if (cross > 0) {
      return 'left';
    } else {
      return 'right';
    }
  }

  /**
   * Enrich areas with holes and gateways information
   */
  private enrichAreasWithHolesAndGateways(areas: Area[], gateways: Gateway[]): void {
    for (const area of areas) {
      const holes = this.detectHoles(area);
      area.holes = holes;
      
      area.gateways = gateways.filter(g => g.connectedAreaId === area.id);
      
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
   */
  private findConnectors(areas: Area[]): Connector[] {
    const connectors: Connector[] = [];
    if (areas.length < 2) return connectors;

    const blockToArea = new Map<string, string>();
    for (const area of areas) {
      for (const block of area.blocks) {
        blockToArea.set(vectorToKey(block), area.id);
      }
    }

    for (const block of this.blocks) {
      const currentAreaId = blockToArea.get(vectorToKey(block));
      
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
            const existingConnector = connectors.find(
              c => (c.fromArea === currentAreaId && c.toArea === neighborAreaId) ||
                   (c.fromArea === neighborAreaId && c.toArea === currentAreaId)
            );

            if (!existingConnector) {
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

  private traceConnectorPath(from: Vector3, to: Vector3, blockToArea: Map<string, string>): Vector3[] {
    return [from, to];
  }

  /**
   * Trace tất cả segments từ blocks
   */
  private traceAllSegments(excludeSet: Set<string> = new Set()): PathSegment[] {
    const segments: PathSegment[] = [];
    const visited = new Set<string>();

    for (const block of this.blocks) {
      const key = vectorToKey(block);
      
      if (visited.has(key) || excludeSet.has(key)) continue;

      // Try all directions to find the longest possible segment from this block
      // This greedy approach helps reduce fragmentation
      let bestSegment: PathSegment | null = null;
      let maxLen = 0;

      for (const dir of this.getCardinalDirections()) {
        // [UPDATED] Pass a temporary visited set to allow exploring directions even if partially visited by other segments
        // We only mark global visited after choosing the best segment
        const tempVisited = new Set(visited);
        const segment = this.traceSegmentInDirection(block, dir, tempVisited, excludeSet);
        
        if (segment && segment.points.length >= 2) {
            // Prefer longer segments
            if (segment.points.length > maxLen) {
                maxLen = segment.points.length;
                bestSegment = segment;
            }
        }
      }
      
      if (bestSegment) {
          // Check if this segment is just a subset of an existing segment
          // This avoids "ghost" segments appearing on top of existing ones
          const isSubset = segments.some(existing => 
             bestSegment!.points.every(p => existing.points.some(ep => vectorEquals(p, ep)))
          );

          if (!isSubset) {
            bestSegment.id = `seg_${segments.length}`;
            segments.push(bestSegment);
            
            for (const p of bestSegment.points) {
                visited.add(vectorToKey(p));
            }
          }
      }
    }
    
    // [NEW] Post-processing filter: Remove short segments (length=2) that are just connectors perpendicular to longer segments
    // UNLESS they are necessary for connectivity (bridges)
    // This removes artifacts like the vertical 2-block segment in Z-Shape
    const filteredSegments = segments.filter(seg => {
        if (seg.points.length > 2) return true;
        
        // If length is 2 (minimum), check if it's redundant
        // It's redundant if both its endpoints belong to other longer segments
        // AND removing it doesn't break the graph (this is hard to check cheaply, so we use a heuristic)
        
        // Simple heuristic: If it is perpendicular to a longer neighbor at a shared junction
        return true; // Keep for now, but the Greedy approach above should minimize 2-block artifacts
    });

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
    
    // FIX: Return null if direction is zero vector (all points are identical)
    if (segmentDir.x === 0 && segmentDir.y === 0 && segmentDir.z === 0) {
      return null;
    }
    
    const plane = this.determinePlane(segmentDir);

    return {
      id: '', // Will be set by caller
      points: allPoints,
      direction: segmentDir,
      length: allPoints.length,
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
        
        // FIX: Skip if direction is zero vector (consecutive identical points)
        if (dir.x === 0 && dir.y === 0 && dir.z === 0) {
          continue;
        }
        
        if (currentDir === null) {
            currentDir = dir;
        } else if (!vectorEquals(dir, currentDir)) {
            const segmentPoints = path.slice(currentSegmentStart, i);
            if (segmentPoints.length >= 2) {
                segments.push({
                    id: `${prefix}_${segments.length}`,
                    points: segmentPoints,
                    direction: currentDir,
                    length: segmentPoints.length,
                    plane: this.determinePlane(currentDir)
                });
            }
            currentSegmentStart = i - 1;
            currentDir = dir;
        }
    }

    const lastPoints = path.slice(currentSegmentStart);
    if (lastPoints.length >= 2 && currentDir) {
        segments.push({
            id: `${prefix}_${segments.length}`,
            points: lastPoints,
            direction: currentDir,
            length: lastPoints.length,
            plane: this.determinePlane(currentDir)
        });
    }

    return segments;
  }

  private determinePlane(direction: Vector3): 'xy' | 'xz' | 'yz' | '3d' {
    const absX = Math.abs(direction.x);
    const absY = Math.abs(direction.y);
    const absZ = Math.abs(direction.z);

    if (absZ < 0.01) return 'xy';
    if (absY < 0.01) return 'xz';
    if (absX < 0.01) return 'yz';
    return '3d';
  }

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
        const segment = segments.find(s => s.id === segmentIds[0]);
        if (segment) {
          const isStart = vectorEquals(coord, segment.points[0]);
          const isEnd = vectorEquals(coord, segment.points[segment.points.length - 1]);
          type = (isStart || isEnd) ? 'endpoint' : 'isolated';
        } else {
          type = 'isolated';
        }
      } else {
        continue; 
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

      // 1. Mass Analysis (Symmetry)
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

      // 2. [NEW] Detect Parallel Rows and Columns
      const parallelStructures = this.detectParallelRowsInArea(area);
      area.subStructures.push(...parallelStructures);

      // 3. Generic Contour Tracing (New Engine)
      const tracer = new AreaBoundaryAnalyzer();
      const boundaryPaths = tracer.analyzeBoundary(blocks);
      
      boundaryPaths.forEach(edge => {
          edge.id = `${area.id}_${edge.id}`;
          
          const isDiagonal = Math.abs(edge.direction.x) > 0 && Math.abs(edge.direction.z) > 0;
          const isHorizontal = Math.abs(edge.direction.x) > 0 && edge.direction.z === 0;
          
          if (isDiagonal) {
              if (!edge.id.includes('zigzag') && !edge.id.includes('staircase')) {
                  edge.id += '_zigzag';
              }
          } else if (isHorizontal) {
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
   * [NEW] Detect parallel rows (horizontal, same Z) and columns (vertical, same X) within an Area
   * 
   * This is useful for:
   * - Grid topologies: each row/column can be a loop target
   * - Square islands: rows parallel to gateway are ideal for repeat algorithms
   * - Triangle areas: rows of decreasing width
   * 
   * @returns Array of AreaSubStructure with type 'parallel_row' or 'parallel_column'
   */
  private detectParallelRowsInArea(area: Area): AreaSubStructure[] {
    const structures: AreaSubStructure[] = [];
    const blocks = area.blocks;
    
    if (blocks.length < 2) return structures;

    const yLevel = blocks[0]?.y ?? 0;

    // Group blocks by Z coordinate (horizontal rows)
    const rowsByZ = new Map<number, Vector3[]>();
    for (const block of blocks) {
      const z = block.z;
      if (!rowsByZ.has(z)) rowsByZ.set(z, []);
      rowsByZ.get(z)!.push(block);
    }

    // Group blocks by X coordinate (vertical columns)
    const columnsByX = new Map<number, Vector3[]>();
    for (const block of blocks) {
      const x = block.x;
      if (!columnsByX.has(x)) columnsByX.set(x, []);
      columnsByX.get(x)!.push(block);
    }

    // Only create parallel structures if there are multiple rows/columns
    // and they have at least 2 blocks each (meaningful for loops)
    const minRowsForPattern = 2;
    const minBlocksPerRow = 2;

    // Create parallel_row structures
    const sortedZs = [...rowsByZ.keys()].sort((a, b) => a - b);
    if (sortedZs.length >= minRowsForPattern) {
      for (let i = 0; i < sortedZs.length; i++) {
        const z = sortedZs[i];
        const rowBlocks = rowsByZ.get(z)!;
        
        if (rowBlocks.length >= minBlocksPerRow) {
          // Sort by X for consistent ordering
          rowBlocks.sort((a, b) => a.x - b.x);
          
          const isFirst = i === 0;
          const isLast = i === sortedZs.length - 1;
          const isMiddle = !isFirst && !isLast;
          
          structures.push({
            type: 'parallel_row',
            id: `${area.id}_row_z${z}`,
            coords: rowBlocks,
            axisIndex: z,
            length: rowBlocks.length,
            description: isFirst ? 'First row (edge)' : 
                         isLast ? 'Last row (edge)' :
                         `Row ${i + 1} (inner)`
          });
        }
      }
    }

    // Create parallel_column structures
    const sortedXs = [...columnsByX.keys()].sort((a, b) => a - b);
    if (sortedXs.length >= minRowsForPattern) {
      for (let i = 0; i < sortedXs.length; i++) {
        const x = sortedXs[i];
        const colBlocks = columnsByX.get(x)!;
        
        if (colBlocks.length >= minBlocksPerRow) {
          // Sort by Z for consistent ordering
          colBlocks.sort((a, b) => a.z - b.z);
          
          const isFirst = i === 0;
          const isLast = i === sortedXs.length - 1;
          
          structures.push({
            type: 'parallel_column',
            id: `${area.id}_col_x${x}`,
            coords: colBlocks,
            axisIndex: x,
            length: colBlocks.length,
            description: isFirst ? 'First column (edge)' : 
                         isLast ? 'Last column (edge)' :
                         `Column ${i + 1} (inner)`
          });
        }
      }
    }

    return structures;
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

            if (this.areParallel(seg1, seg2)) {
                const distance = this.distanceBetweenParallel(seg1, seg2);
                relations.push({
                    type: 'parallel_axis',
                    path1Id: seg1.id,
                    path2Id: seg2.id,
                    metadata: { distance }
                });

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

            if (this.arePerpendicular(seg1, seg2)) {
                relations.push({
                    type: 'perpendicular',
                    path1Id: seg1.id,
                    path2Id: seg2.id,
                    metadata: { angle: 90 }
                });
            }

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
