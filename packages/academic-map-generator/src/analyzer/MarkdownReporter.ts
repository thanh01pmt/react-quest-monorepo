/**
 * MarkdownReporter - Generates readable analysis reports
 * 
 * Creates ASCII map visualizations and structured Markdown reports
 * from MapAnalyzer output.
 */

import { MapAnalyzer } from './MapAnalyzer';
import type { 
  Vector3, 
  GameConfig, 
  Area, 
  PathSegment, 
  MetaPath,
  Gateway,
  PathRelation,
  PlacementContext,
  Pattern
} from './MapAnalyzer';

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

function vectorToKey(v: Vector3): string {
  return `${v.x},${v.y},${v.z}`;
}

// ============================================================================
// MARKDOWN REPORTER CLASS
// ============================================================================

export class MarkdownReporter {
  private buffer: string[] = [];
  private allBlocks: Vector3[] = [];
  private allBlocksSet: Set<string> = new Set();

  constructor() {}

  // --- Formatting Helpers ---
  private h1(text: string) { this.buffer.push(`\n# ${text}\n`); }
  private h2(text: string) { this.buffer.push(`\n## ${text}\n`); }
  private h3(text: string) { this.buffer.push(`\n### ${text}\n`); }
  private line(text: string) { this.buffer.push(text); }
  private list(items: string[]) { items.forEach(i => this.buffer.push(`- ${i}`)); }

  /**
   * Draw an ASCII map visualization:
   * - Target (focused blocks): Dark (██)
   * - Context (other blocks): Light (░░)
   * - Empty: Dot (.)
   */
  private drawFragmentMap(targetBlocks: Vector3[], label: string = "") {
    // Calculate bounds based on ALL map blocks for stable framing
    const xs = this.allBlocks.map(c => c.x);
    const zs = this.allBlocks.map(c => c.z);
    
    if (xs.length === 0) return;

    const minX = Math.min(...xs), maxX = Math.max(...xs);
    const minZ = Math.min(...zs), maxZ = Math.max(...zs);

    // Create Set for target blocks for fast lookup
    const targetSet = new Set(targetBlocks.map(vectorToKey));

    this.buffer.push(`\n**Visualization: ${label}**`);
    this.buffer.push("```text");
    
    // X-axis header
    let axis = "    ";
    for(let x = minX; x <= maxX; x++) axis += `${x.toString().padEnd(2)} `;
    this.buffer.push(axis);
    this.buffer.push("    " + "-".repeat((maxX - minX + 1) * 3));

    // Draw each row (Z from high to low)
    for (let z = maxZ; z >= minZ; z--) {
      let row = `${z.toString().padEnd(2)} |`;
      for (let x = minX; x <= maxX; x++) {
        // Check if there's any block at this x,z position (2D projection)
        const hasBlock = this.allBlocks.some(c => c.x === x && c.z === z);
        const isTarget = targetBlocks.some(c => c.x === x && c.z === z);
        
        if (isTarget) row += "██ ";      // Target Focus
        else if (hasBlock) row += "░░ "; // Context
        else row += " . ";               // Void
      }
      this.buffer.push(row);
    }
    this.buffer.push("```");
  }

  /**
   * Generate a full analysis report from GameConfig and PlacementContext
   */
  public generate(config: GameConfig, context: PlacementContext): string {
    // Reset buffer
    this.buffer = [];
    
    // Cache all blocks for context visualization
    this.allBlocks = config.blocks.map(b => b.position);
    this.allBlocksSet = new Set(this.allBlocks.map(vectorToKey));
    
    this.h1(`MAP ANALYSIS REPORT: ${config.type.toUpperCase()}`);
    this.line(`**Created:** ${new Date().toISOString()} | **Total Blocks:** ${config.blocks.length}`);
    
    // 1. GLOBAL MAP
    this.h2("1. 🗺️ Global Map Structure");
    this.drawFragmentMap(this.allBlocks, "Full Map Overview");
    
    // Metrics summary
    if (context.metrics) {
      this.h3("Map Metrics");
      this.list([
        `Size: ${context.metrics.estimatedSize}`,
        `Total Blocks: ${context.metrics.totalBlocks}`,
        `Longest Path: ${context.metrics.longestPathLength} blocks`,
        `Segment Count: ${context.metrics.segmentCount}`,
        `Area Count: ${context.metrics.areaCount}`,
        `Detected Topology: ${context.metrics.detectedTopology || 'unknown'}`
      ]);
    }

    // 2. GEOMETRIC DECOMPOSITION
    this.h2("2. 📐 Geometric Decomposition");
    
    // Areas
    if (context.areas && context.areas.length > 0) {
      this.h3(`Areas (${context.areas.length})`);
      context.areas.forEach((area: Area, i: number) => {
        this.line(`**Area #${i}** (ID: ${area.id})`);
        this.drawFragmentMap(area.blocks, `Area #${i}`);
        this.list([
          `Size: ${area.blocks.length} blocks`,
          `Shape: ${area.shapeType || 'irregular'}`,
          `Holes: ${area.holes?.length || 0}`,
          `Gateways: ${area.gateways?.length || 0}`
        ]);
      });
    } else {
      this.line("> No Areas detected. Map consists entirely of Paths.");
    }

    // Path Segments
    if (context.segments && context.segments.length > 0) {
      this.h3(`Path Segments (${context.segments.length})`);
      context.segments.slice(0, 10).forEach((seg: PathSegment, i: number) => {
        this.line(`**Segment #${i}** (ID: ${seg.id})`);
        this.drawFragmentMap(seg.points, `Segment #${i}`);
        this.list([
          `Length: ${seg.length} blocks`,
          `Direction: [${seg.direction.x}, ${seg.direction.y}, ${seg.direction.z}]`,
          `Plane: ${seg.plane || '2D'}`
        ]);
      });
      if (context.segments.length > 10) {
        this.line(`_...and ${context.segments.length - 10} more segments_`);
      }
    }

    // MetaPaths
    if (context.metaPaths && context.metaPaths.length > 0) {
      this.h3(`Meta-Paths (${context.metaPaths.length})`);
      context.metaPaths.forEach((mp: MetaPath, i: number) => {
        this.line(`**Meta-Path #${i}:** \`${mp.structureType.toUpperCase()}\``);
        
        // Collect all coords from segments
        const mpBlocks: Vector3[] = [];
        mp.segments.forEach(seg => mpBlocks.push(...seg.points));
        
        this.drawFragmentMap(mpBlocks, `Meta-Path #${i}`);
        this.list([
          `Pattern Regularity: ${mp.isRegular ? "✅ Yes" : "❌ No"}`,
          `Segments: ${mp.segments.length}`,
          `Joints (Turns): ${mp.joints.length}`,
          `Total Length: ${mp.totalLength}`
        ]);
      });
    }

    // Gateways
    if (context.gateways && context.gateways.length > 0) {
      this.h3("Gateways");
      context.gateways.forEach((gw: Gateway) => {
        this.line(`- **Gateway ${gw.id}:** At [${gw.coord.x}, ${gw.coord.y}, ${gw.coord.z}] → Path: ${gw.connectedPathId}, Area: ${gw.connectedAreaId}`);
      });
    }

    // Relations
    if (context.relations && context.relations.length > 0) {
      this.h3("Geometric Relations");
      context.relations.forEach((rel: PathRelation) => {
        this.line(`- **${rel.type}**: ${rel.path1Id} ↔ ${rel.path2Id}`);
      });
    }

    // 3. PATTERNS
    this.h2("3. 🔄 Pattern Analysis");
    if (context.patterns && context.patterns.length > 0) {
      context.patterns.forEach((pattern: Pattern, i: number) => {
        this.line(`**Pattern #${i}:** \`${pattern.type}\``);
        this.list([
          `Unit Elements: ${pattern.unitElements.join(', ')}`,
          `Repetitions: ${pattern.repetitions}`
        ]);
      });
    } else {
      this.line("_No repeating patterns detected._");
    }

    // 4. PRIORITIZED COORDINATES
    this.h2("4. 📍 Prioritized Coordinates");
    if (context.prioritizedCoords && context.prioritizedCoords.length > 0) {
      const topCoords = context.prioritizedCoords.slice(0, 15);
      const criticalBlocks = topCoords.map(pc => pc.position);
      
      this.drawFragmentMap(criticalBlocks, "Top Priority Positions");
      
      this.line("| Priority | Position | Category | Reasons |");
      this.line("|----------|----------|----------|---------|");
      
      topCoords.forEach(pc => {
        const pos = `[${pc.position.x}, ${pc.position.y}, ${pc.position.z}]`;
        const reasons = pc.reasons.slice(0, 2).join('; ');
        this.line(`| ${pc.priority} | ${pos} | ${pc.category} | ${reasons} |`);
      });
      
      if (context.prioritizedCoords.length > 15) {
        this.line(`_...and ${context.prioritizedCoords.length - 15} more coordinates_`);
      }
    }

    // 5. SELECTABLE ELEMENTS
    this.h2("5. 🎛️ Selectable Elements");
    if (context.selectableElements && context.selectableElements.length > 0) {
      const byType = new Map<string, number>();
      context.selectableElements.forEach(el => {
        byType.set(el.type, (byType.get(el.type) || 0) + 1);
      });
      
      this.line("**Element Distribution:**");
      byType.forEach((count, type) => {
        this.line(`- ${type}: ${count}`);
      });
    }

    // Footer
    this.h2("📊 Summary");
    this.line("```");
    this.line(`Total Blocks: ${this.allBlocks.length}`);
    this.line(`Areas: ${context.areas?.length || 0}`);
    this.line(`Path Segments: ${context.segments?.length || 0}`);
    this.line(`Meta-Paths: ${context.metaPaths?.length || 0}`);
    this.line(`Patterns: ${context.patterns?.length || 0}`);
    this.line(`Priority Coords: ${context.prioritizedCoords?.length || 0}`);
    this.line(`Selectable Elements: ${context.selectableElements?.length || 0}`);
    this.line("```");

    return this.buffer.join("\n");
  }

  /**
   * Generate report directly from GameConfig (convenience method)
   */
  public generateFromConfig(config: GameConfig): string {
    const analyzer = new MapAnalyzer({ gameConfig: config });
    const context = analyzer.analyze();
    return this.generate(config, context);
  }
}

// ============================================================================
// QUICK ANALYSIS SERVICE
// ============================================================================

/**
 * Quick analysis service that wraps MapAnalyzer with report generation
 */
export class MapAnalysisService {
  private reporter: MarkdownReporter;
  
  constructor() {
    this.reporter = new MarkdownReporter();
  }

  /**
   * Analyze a map and return both context and report
   */
  public analyze(config: GameConfig): {
    context: PlacementContext;
    report: string;
  } {
    const analyzer = new MapAnalyzer({ gameConfig: config });
    const context = analyzer.analyze();
    const report = this.reporter.generate(config, context);
    
    return { context, report };
  }

  /**
   * Get just the PlacementContext
   */
  public getContext(config: GameConfig): PlacementContext {
    const analyzer = new MapAnalyzer({ gameConfig: config });
    return analyzer.analyze();
  }

  /**
   * Get just the Markdown report
   */
  public getReport(config: GameConfig): string {
    return this.reporter.generateFromConfig(config);
  }
}
