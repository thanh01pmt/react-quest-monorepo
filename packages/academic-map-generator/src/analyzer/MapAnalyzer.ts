
// ============================================================================
// MAP ANALYZER FAÇADE (ORCHESTRATOR)
// ============================================================================

import { 
  GameConfig, AnalyzerOptions, PlacementContext, Block, PathSegment, Vector3, 
  createSegmentElement, SECoord 
} from './core/types';
import { GeometricDecomposer } from './tiers/tier1-decomposition/GeometricDecomposer';
import { PatternAnalyzer } from './tiers/tier2-patterns/PatternAnalyzer';
import { SegmentFilter } from './tiers/tier3-filtering/SegmentFilter';
import { PedagogicalPlacer } from './tiers/tier4-placement/PedagogicalPlacer';

export * from './core/types';

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
   * Main analysis pipeline
   */
  public analyze(): PlacementContext {
    // 1. Geometric Decomposition (Core Structure)
    // [NEW] Pass composite metadata if available for Layout × Module recognition
    const tier1Analyzer = new GeometricDecomposer(this.config.blocks, this.config.metadata);
    const tier1Result = tier1Analyzer.analyze();

    // 2. Pattern Recognition (Symmetry, repetition)
    const tier2Analyzer = new PatternAnalyzer();
    const tier2Result = tier2Analyzer.analyze(tier1Result);

    // 3. Filtering & Simplification
    const tier3Analyzer = new SegmentFilter(this.minLength);
    const tier3Result = tier3Analyzer.analyze(tier2Result);

    // 4. Pedagogical Placement (Items, Keypoints)
    const tier4Analyzer = new PedagogicalPlacer(this.preferredInterval);
    const result = tier4Analyzer.analyze(tier3Result);

    return result;
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
        const mag = Math.sqrt(dx*dx + dy*dy + dz*dz);
        if (mag > 0) direction = { x: dx/mag, y: dy/mag, z: dz/mag };
      }

      return {
        id: `topo_seg_${idx}`,
        points,
        direction,
        length: points.length,
        plane: '3d' // Simplified
      };
    });

    // Create a minimal analyzer to use its helpers if needed
    // But since we are static, we just construct basic context
    
    // Create elements
    const elements = prebuiltSegments.map(seg => {
        const coords: SECoord[] = seg.points.map(p => [p.x, p.y, p.z]);
        return createSegmentElement(seg.id, coords, 'recommended');
    });

    return {
      points: [],
      segments: prebuiltSegments,
      areas: [], // Topology doesn't output areas yet
      connectors: [],
      patterns: [],
      relations: [],
      metaPaths: [],
      gateways: [],
      prioritizedCoords: [],
      metrics: {
        totalBlocks: blocks.length,
        boundingBox: { width: 0, height: 0, depth: 0 },
        area: 0,
        estimatedSize: 'medium',
        segmentCount: prebuiltSegments.length,
        areaCount: 0,
        junctionCount: 0,
        longestPathLength: Math.max(...prebuiltSegments.map(s => s.length), 0),
        center: { x: 0, y: 0, z: 0 },
        detectedTopology: pathInfo.metadata.topology_type || 'unknown'
      },
      constraints: {
        maxItems: 5,
        minItems: 1,
        targetItemRatio: 0.1,
        preferredConcepts: [],
        avoidConcepts: [], 
        maxCodeBlocks: 20,
        distribution: 'spread',
        preferredInterval: 2
      },
      selectableElements: elements,
      suggestedPlacements: []
    };
  }
}
