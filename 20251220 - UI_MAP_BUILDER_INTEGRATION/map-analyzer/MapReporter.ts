import { 
    GeometricDecomposer, 
    SemanticAnalyzer, 
    StructuredPathFinder, 
    PedagogicalPlacer, 
    Utils, 
    Coord 
} from './GeometricEngine';

// ============================================================================
// 1. MARKDOWN REPORTER CLASS (Visualization & Formatting)
// ============================================================================

export class MarkdownReporter {
    private buffer: string[] = [];
    private allCoords: Coord[] = [];
    private allCoordsSet: Set<string> = new Set();

    constructor() {}

    // --- Formatting Helpers ---
    private h1(text: string) { this.buffer.push(`\n# ${text}\n`); }
    private h2(text: string) { this.buffer.push(`\n## ${text}\n`); }
    private h3(text: string) { this.buffer.push(`\n### ${text}\n`); }
    private line(text: string) { this.buffer.push(text); }
    private list(items: string[]) { items.forEach(i => this.buffer.push(`- ${i}`)); }

    /**
     * Vẽ bản đồ ASCII thông minh:
     * - Target (đang được focus): Hiển thị đậm (██)
     * - Context (các block khác): Hiển thị mờ (░░)
     * - Empty: Hiển thị dấu chấm (.)
     */
    private drawFragmentMap(targetCoords: Coord[], label: string = "") {
        // Tính toán biên dựa trên TOÀN BỘ map để khung hình ổn định
        const xs = this.allCoords.map(c => c[0]);
        const zs = this.allCoords.map(c => c[2]);
        
        if (xs.length === 0) return;

        const minX = Math.min(...xs), maxX = Math.max(...xs);
        const minZ = Math.min(...zs), maxZ = Math.max(...zs);

        // Tạo Set cho target để tra cứu nhanh
        const targetSet = new Set(targetCoords.map(Utils.coordToString));

        this.buffer.push(`\n**Visualization: ${label}**`);
        this.buffer.push("```text");
        
        // Header trục X
        let axis = "    ";
        for(let x = minX; x <= maxX; x++) axis += `${x.toString().padEnd(2)} `;
        this.buffer.push(axis);
        this.buffer.push("    " + "-".repeat((maxX - minX + 1) * 3));

        // Vẽ từng hàng (Z từ lớn xuống nhỏ)
        for (let z = maxZ; z >= minZ; z--) {
            let row = `${z.toString().padEnd(2)} |`;
            for (let x = minX; x <= maxX; x++) {
                const key = `${x},0,${z}`; // Giả sử view 2D tại y=0 hoặc chiếu xuống
                // Cần check kỹ hơn nếu map có nhiều tầng y, ở đây đơn giản hóa check x,z
                // Check trong allCoords xem có block nào tại x,z này không
                const hasBlock = this.allCoords.some(c => c[0] === x && c[2] === z);
                const isTarget = targetCoords.some(c => c[0] === x && c[2] === z);
                
                if (isTarget) row += "██ ";      // Target Focus
                else if (hasBlock) row += "░░ "; // Context
                else row += " . ";               // Void
            }
            this.buffer.push(row);
        }
        this.buffer.push("```");
    }

    /**
     * Hàm chính để tạo báo cáo
     */
    public generate(jsonInput: any, result: any): string {
        const config = jsonInput.gameConfig;
        // Cache toàn bộ coords để làm context
        this.allCoords = config.blocks.map((b: any) => [b.position.x, b.position.y, b.position.z]);
        this.allCoordsSet = new Set(this.allCoords.map(Utils.coordToString));
        
        this.h1(`MAP ANALYSIS REPORT: ${config.type.toUpperCase()}`);
        this.line(`**Created:** ${new Date().toISOString()} | **Total Blocks:** ${config.blocks.length}`);
        
        // 1. GLOBAL MAP
        this.h2("1. 🗺️ Global Map Structure");
        this.drawFragmentMap(this.allCoords, "Full Map Overview");

        // 2. DECOMPOSITION
        this.h2("2. 📐 Geometric Decomposition (Phase 1)");
        
        // Areas
        if (result.decomposition.areas.length > 0) {
            this.h3(`Areas (${result.decomposition.areas.length})`);
            result.decomposition.areas.forEach((area: any, i: number) => {
                this.line(`**Area #${i}** (ID: ${area.id})`);
                this.drawFragmentMap(area.coords, `Area #${i}`);
                this.list([
                    `Size: ${area.coords.length} blocks`,
                    `Shape: ${area.properties.shapeType}`,
                    `Holes: ${area.properties.holeCount || 0}`
                ]);
            });
        } else {
            this.line("> No Areas detected. Map consists entirely of Paths.");
        }

        // Paths
        if (result.decomposition.paths.length > 0) {
            this.h3(`Paths (${result.decomposition.paths.length})`);
            result.decomposition.paths.forEach((path: any, i: number) => {
                this.line(`**Path #${i}** (ID: ${path.id})`);
                this.drawFragmentMap(path.coords, `Path #${i}`);
                this.list([
                    `Length: ${path.coords.length} blocks`,
                    `Start: [${path.coords[0]}]`,
                    `End: [${path.coords[path.coords.length-1]}]`
                ]);
            });
        }

        // Boundaries & Gateways
        this.h3("Gateways & Connections");
        let gwCount = 0;
        result.decomposition.boundaries.forEach((b: any) => {
            if (b.properties.gateways?.length) {
                b.properties.gateways.forEach((gw: any) => {
                    this.line(`- **Gateway:** At [${gw.coord}] (Connects Path to Area)`);
                    gwCount++;
                });
            }
        });
        if (gwCount === 0) this.line("_No gateways detected._");

        // 3. SEMANTICS
        this.h2("3. 🧠 Semantic Patterns (Phase 2)");
        result.semantics.metaPaths.forEach((mp: any, i: number) => {
            this.line(`**Meta-Path #${i}:** \`${mp.structureType.toUpperCase()}\``);
            
            // Gom coords để visualize meta-path
            let mpCoords: Coord[] = [];
            mp.segments.forEach((seg: any) => mpCoords.push(...seg.coords));
            
            this.drawFragmentMap(mpCoords, `Meta-Path #${i}`);
            this.list([
                `Pattern Regularity: ${mp.isRegular ? "✅ Yes" : "❌ No"}`,
                `Composition: ${mp.segments.length} segments joined`,
                `Joints (Turns): ${mp.joints.length}`
            ]);
        });

        if (result.semantics.relations.length > 0) {
            this.h3("Geometric Relations");
            result.semantics.relations.forEach((rel: any) => {
                this.line(`- **${rel.type}**: ${rel.sourceId} <--> ${rel.targetId} (Confidence: ${rel.confidence})`);
            });
        }

        // 4. PLACEMENTS
        this.h2("4. 🎓 Pedagogical Placements (Phase 3)");
        // Vẽ toàn bộ placement lên 1 map
        const allPlacementCoords = result.placements.flatMap((p: any) => p.coords);
        this.drawFragmentMap(allPlacementCoords, "All Suggested Items");

        this.line("| Item | Concept | Difficulty | Coordinates | Logic/Reason |");
        this.line("|---|---|---|---|---|");
        
        result.placements.forEach((p: any) => {
            const coordStr = p.coords.map((c: any) => `[${c.join(',')}]`).join(' ');
            this.line(`| **${p.item.toUpperCase()}** | ${p.concept} | ${p.difficulty}/5 | ${coordStr} | ${p.reason} |`);
        });

        return this.buffer.join("\n");
    }
}

// ============================================================================
// 2. MAP ANALYZER SERVICE (Wrapper for the Engine)
// ============================================================================

/**
 * Service này đóng vai trò thay thế cho hàm `run()` của engine gốc.
 * Thay vì generate map từ tham số, nó nhận map thô (JSON) và chạy pipeline phân tích.
 */
export class MapAnalyzerService {
    public analyze(inputJson: any) {
        // 1. Data Transformation (JSON -> Coord[])
        const rawCoords: Coord[] = inputJson.gameConfig.blocks.map((b: any) => [
            b.position.x, b.position.y, b.position.z
        ]);

        console.log("Running analysis pipeline on raw coordinates...");

        // 2. PHASE 1: Geometric Decomposition
        const decomposer = new GeometricDecomposer(rawCoords);
        const { areas, paths } = decomposer.segment();
        decomposer.enrichAreasWithHoles(areas);
        const boundaries = decomposer.analyzeBoundaries(areas, paths);

        // 3. PHASE 2: Semantic Analysis
        const analyzer = new SemanticAnalyzer(decomposer);
        const metaPaths = analyzer.analyzeMetaPaths(paths);
        const relations = analyzer.analyzeRelations(paths);

        // 4. PHASE 3: Pedagogical Placement
        const finder = new StructuredPathFinder(rawCoords);
        const placer = new PedagogicalPlacer();
        const placements = placer.placeItems(metaPaths, areas, boundaries, relations, finder);

        return {
            decomposition: { areas, paths, boundaries },
            semantics: { metaPaths, relations },
            placements: placements
        };
    }
}

// ============================================================================
// 3. MAIN EXECUTION (Sample Data)
// ============================================================================

// Dữ liệu JSON bạn cung cấp
const SAMPLE_ARROW_MAP = {
  "gameConfig": {
    "type": "maze",
    "renderer": "3d",
    "blocks": [
      {"modelKey": "ground.checker","position": {"x": 10,"y": 0,"z": 6}},
      {"modelKey": "ground.checker","position": {"x": 10,"y": 0,"z": 7}},
      {"modelKey": "ground.checker","position": {"x": 10,"y": 0,"z": 8}},
      {"modelKey": "ground.checker","position": {"x": 10,"y": 0,"z": 9}},
      {"modelKey": "ground.checker","position": {"x": 10,"y": 0,"z": 10}},
      {"modelKey": "ground.checker","position": {"x": 10,"y": 0,"z": 11}}, // Shaft ends
      {"modelKey": "ground.checker","position": {"x": 8,"y": 0,"z": 12}},  // Left wing
      {"modelKey": "ground.checker","position": {"x": 9,"y": 0,"z": 12}},
      {"modelKey": "ground.checker","position": {"x": 10,"y": 0,"z": 12}}, // Junction
      {"modelKey": "ground.checker","position": {"x": 11,"y": 0,"z": 12}},
      {"modelKey": "ground.checker","position": {"x": 12,"y": 0,"z": 12}}, // Right wing
      {"modelKey": "ground.checker","position": {"x": 9,"y": 0,"z": 13}},
      {"modelKey": "ground.checker","position": {"x": 10,"y": 0,"z": 13}},
      {"modelKey": "ground.checker","position": {"x": 11,"y": 0,"z": 13}},
      {"modelKey": "ground.checker","position": {"x": 10,"y": 0,"z": 14}}  // Tip
    ],
    "finish": {"x": 10,"y": 1,"z": 14}
  }
};

// Main function to run the process
function main() {
    try {
        // 1. Analyze
        const service = new MapAnalyzerService();
        const analysisResult = service.analyze(SAMPLE_ARROW_MAP);

        // 2. Report
        const reporter = new MarkdownReporter();
        const report = reporter.generate(SAMPLE_ARROW_MAP, analysisResult);

        // 3. Output
        console.log(report);
    } catch (error) {
        console.error("Error during map analysis:", error);
    }
}

// Execute
main();