
// ============================================================================
// PEDAGOGICAL PLACER (TIER 4)
// ============================================================================

import { 
  Tier3Result, PlacementContext, MapMetrics, SelectableElement, SECoord, PlacementConstraints,
  createKeypointElement, createSegmentElement, createPositionElements,
  PathSegment, Vector3, PrioritizedCoord, CoordCategory
} from '../../core/types';

export class PedagogicalPlacer {
  constructor(private preferredInterval?: number) {}

  public analyze(tier3Result: Tier3Result): PlacementContext {
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

    // [UPDATED] Quét Area Extremities - composite-aware
    for (const area of tier3.areas) {
      const blocks = area.blocks;
      if (blocks.length === 0) continue;

      // Check if this is a composite component (has moduleType from metadata)
      const moduleType = (area as any).moduleType;
      const landmarks = (area as any).landmarks;
      
      if (moduleType && landmarks) {
        // [NEW] Use provided landmarks for composite components
        if (landmarks.center) {
          const [x, y, z] = landmarks.center;
          addCoord({ x, y, z }, 10, 'critical', `Island Center (${area.id})`);
        }
        if (landmarks.entrance) {
          const [x, y, z] = landmarks.entrance;
          addCoord({ x, y, z }, 8, 'important', `Island Entrance (${area.id})`);
        }
        // Skip generic apex detection for composite components
        continue;
      }

      // Fallback: Generic extremity detection for non-composite areas
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
