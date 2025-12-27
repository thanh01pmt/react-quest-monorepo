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
        
        // For macro_staircase: use zigzagPath if available for accurate visualization
        // Otherwise: collect all coords from segments
        let mpBlocks: Vector3[] = [];
        const zigzagPath = (mp as any).zigzagPath;
        
        if (mp.structureType === 'macro_staircase' && zigzagPath && zigzagPath.length > 0) {
          mpBlocks = zigzagPath;
        } else {
          mp.segments.forEach(seg => mpBlocks.push(...seg.points));
        }
        
        this.drawFragmentMap(mpBlocks, `Meta-Path #${i}`);
        
        // Show zigzag-specific info for staircases
        if (mp.structureType === 'macro_staircase' && zigzagPath) {
          this.list([
            `Pattern Regularity: ${mp.isRegular ? "✅ Yes" : "❌ No"}`,
            `Segments: ${mp.segments.length}`,
            `Joints (Turns): ${mp.joints.length}`,
            `Zigzag Path Length: ${zigzagPath.length} blocks`,
            `Total Segment Blocks: ${mp.totalLength}`
          ]);
        } else {
          this.list([
            `Pattern Regularity: ${mp.isRegular ? "✅ Yes" : "❌ No"}`,
            `Segments: ${mp.segments.length}`,
            `Joints (Turns): ${mp.joints.length}`,
            `Total Length: ${mp.totalLength}`
          ]);
        }
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
      
      // Detailed Table
      this.h3("Detailed Element List");
      this.line("| ID | Type | Role | Label | Coordinates |");
      this.line("|----|------|------|-------|-------------|");
      
      // Limit detailed output to avoid huge files
      const detailedList = context.selectableElements.slice(0, 50); 
      
      detailedList.forEach(element => {
          const el = element as any;
          const role = el.metadata?.role || 'N/A';
          const label = el.metadata?.label || 'N/A';
          
          let coordsStr = '-';
          if (el.coords && el.coords.length > 0) {
              if (el.coords.length <= 12) { // Show up to 12 coords (~3-4 blocks) inline
                  coordsStr = el.coords.map((c: any) => `[${c[0]},${c[1]},${c[2]}]`).join(', ');
              } else {
                  coordsStr = `${el.coords.length} coords (See Map)`;
              }
          }
          
          this.line(`| **${el.id}** | ${el.type} | ${role} | ${label} | \`${coordsStr}\` |`);
      });
      
      if (context.selectableElements.length > 50) {
         this.line(`\n_...and ${context.selectableElements.length - 50} more elements..._`);
      }

      // Visual Gallery for Important Elements
      const visualElements = detailedList.filter(e => {
          const el = e as any;
          return el.coords && el.coords.length > 0 && (el.coords.length > 1 || el.metadata?.role);
      });

      if (visualElements.length > 0) {
          this.h3("Element Visualizations");
          visualElements.forEach(element => {
              const el = element as any;
              const blocks: Vector3[] = el.coords.map((c: any) => ({x: c[0], y: c[1], z: c[2]}));
              this.line(`**${el.id}** (${el.metadata?.label || el.type})`);
              this.drawFragmentMap(blocks, el.id);
          });
      }
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

  /**
   * Generate a preview report for a Solution-Driven template result
   */
  public generateTemplatePreview(
    result: {
      trace: {
        pathCoords: [number, number, number][];
        items: Array<{ type: string; position: [number, number, number] }>;
        startPosition: [number, number, number];
        endPosition: [number, number, number];
        startDirection: number;
        endDirection: number;
        totalMoves: number;
        totalCollects: number;
        loopIterations: number;
      };
      solution: {
        rawActions: string[];
        itemGoals: Record<string, number>;
      };
      metadata: {
        templateId: string;
        concept: string;
        gradeLevel: string;
        resolvedParams: Record<string, number>;
        pathLength: number;
        itemCount: number;
      };
    }
  ): string {
    this.buffer = [];
    
    const { trace, solution, metadata } = result;

    this.h1(`Template Preview: ${metadata.templateId}`);
    
    this.h2('Template Info');
    this.line(`- **Concept:** ${metadata.concept}`);
    this.line(`- **Grade Level:** ${metadata.gradeLevel}`);
    this.line(`- **Parameters:** ${JSON.stringify(metadata.resolvedParams)}`);
    
    this.h2('Execution Summary');
    this.line(`- **Path Length:** ${metadata.pathLength} blocks`);
    this.line(`- **Items Placed:** ${metadata.itemCount}`);
    this.line(`- **Total Moves:** ${trace.totalMoves}`);
    this.line(`- **Loop Iterations:** ${trace.loopIterations}`);
    
    // Draw ASCII Map
    this.h2('Map Visualization');
    this.drawTemplateMap(trace);
    
    // Item Goals
    this.h2('Item Goals');
    for (const [type, count] of Object.entries(solution.itemGoals)) {
      this.line(`- ${type}: ${count}`);
    }
    
    // Raw Actions (first 20)
    this.h2('Raw Actions (first 20)');
    this.buffer.push('```');
    solution.rawActions.slice(0, 20).forEach((action, i) => {
      this.line(`${(i + 1).toString().padStart(2)}. ${action}`);
    });
    if (solution.rawActions.length > 20) {
      this.line(`... and ${solution.rawActions.length - 20} more`);
    }
    this.buffer.push('```');

    return this.buffer.join('\n');
  }

  /**
   * Draw ASCII map for template result
   */
  private drawTemplateMap(trace: {
    pathCoords: [number, number, number][];
    items: Array<{ type: string; position: [number, number, number] }>;
    startPosition: [number, number, number];
    endPosition: [number, number, number];
  }) {
    const { pathCoords, items, startPosition, endPosition } = trace;

    if (pathCoords.length === 0) {
      this.line('*No path generated*');
      return;
    }

    // Calculate bounds
    const xs = pathCoords.map(c => c[0]);
    const zs = pathCoords.map(c => c[2]);
    const minX = Math.min(...xs) - 1;
    const maxX = Math.max(...xs) + 1;
    const minZ = Math.min(...zs) - 1;
    const maxZ = Math.max(...zs) + 1;

    // Create lookups
    const pathSet = new Set(pathCoords.map(c => `${c[0]},${c[2]}`));
    const itemMap = new Map<string, string>();
    items.forEach(item => {
      itemMap.set(`${item.position[0]},${item.position[2]}`, item.type);
    });
    const startKey = `${startPosition[0]},${startPosition[2]}`;
    const endKey = `${endPosition[0]},${endPosition[2]}`;

    this.buffer.push('```text');

    // Header
    let header = '    ';
    for (let x = minX; x <= maxX; x++) {
      header += `${x.toString().padStart(2)} `;
    }
    this.buffer.push(header);
    this.buffer.push('    ' + '-'.repeat((maxX - minX + 1) * 3));

    // Rows
    for (let z = maxZ; z >= minZ; z--) {
      let row = `${z.toString().padStart(2)} |`;
      for (let x = minX; x <= maxX; x++) {
        const key = `${x},${z}`;
        const isStart = key === startKey;
        const isEnd = key === endKey;
        const item = itemMap.get(key);
        const isPath = pathSet.has(key);

        if (isStart) {
          row += ' S ';
        } else if (isEnd && !item) {
          row += ' E ';
        } else if (item) {
          const symbols: Record<string, string> = {
            'crystal': 'C',
            'key': 'K',
            'switch': 'W',
            'portal': 'P'
          };
          row += ` ${symbols[item] || '?'} `;
        } else if (isPath) {
          row += '██ ';
        } else {
          row += ' . ';
        }
      }
      this.buffer.push(row);
    }

    this.buffer.push('```');
    this.line('');
    this.line('Legend: S=Start, E=End, ██=Path, C=Crystal, K=Key, W=Switch, P=Portal');
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
