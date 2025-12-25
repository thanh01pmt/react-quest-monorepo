#!/bin/bash

# Script: merge-topology-files.sh
# Description: Merge all Topology Inspector analysis logic files into a single txt file
# Output: topology-inspector-merged.txt

OUTPUT_FILE="topology-inspector-merged.txt"
ROOT_DIR="$(cd "$(dirname "$0")/.." && pwd)"

# Clear/create output file
> "$OUTPUT_FILE"

echo "==================================================" >> "$OUTPUT_FILE"
echo "  TOPOLOGY INSPECTOR - MERGED SOURCE FILES" >> "$OUTPUT_FILE"
echo "  Generated: $(date '+%Y-%m-%d %H:%M:%S')" >> "$OUTPUT_FILE"
echo "==================================================" >> "$OUTPUT_FILE"
echo "" >> "$OUTPUT_FILE"

# Function to append a file with header
append_file() {
    local file_path="$1"
    local relative_path="${file_path#$ROOT_DIR/}"
    
    if [ -f "$file_path" ]; then
        echo "" >> "$OUTPUT_FILE"
        echo "##########################################################" >> "$OUTPUT_FILE"
        echo "# FILE: $relative_path" >> "$OUTPUT_FILE"
        echo "##########################################################" >> "$OUTPUT_FILE"
        echo "" >> "$OUTPUT_FILE"
        cat "$file_path" >> "$OUTPUT_FILE"
        echo "" >> "$OUTPUT_FILE"
        echo "# -------------------- END OF FILE ----------------------" >> "$OUTPUT_FILE"
        echo "" >> "$OUTPUT_FILE"
        echo "✓ Added: $relative_path"
    else
        echo "✗ Not found: $relative_path"
    fi
}

echo ""
echo "Merging Topology Inspector files..."
echo ""

# ==============================================================================
# SECTION 1: UI COMPONENTS (TopologyInspector & TopologyPanel)
# ==============================================================================
echo "" >> "$OUTPUT_FILE"
echo "╔══════════════════════════════════════════════════════════════════════════╗" >> "$OUTPUT_FILE"
echo "║  SECTION 1: UI COMPONENTS                                                ║" >> "$OUTPUT_FILE"
echo "╚══════════════════════════════════════════════════════════════════════════╝" >> "$OUTPUT_FILE"

append_file "$ROOT_DIR/apps/map-builder-app/src/components/TopologyInspector/index.tsx"
append_file "$ROOT_DIR/apps/map-builder-app/src/components/TopologyPanel/index.tsx"

# ==============================================================================
# SECTION 2: CORE ANALYZER TYPES & UTILITIES
# ==============================================================================
echo "" >> "$OUTPUT_FILE"
echo "╔══════════════════════════════════════════════════════════════════════════╗" >> "$OUTPUT_FILE"
echo "║  SECTION 2: CORE ANALYZER TYPES & UTILITIES                              ║" >> "$OUTPUT_FILE"
echo "╚══════════════════════════════════════════════════════════════════════════╝" >> "$OUTPUT_FILE"

append_file "$ROOT_DIR/packages/academic-map-generator/src/analyzer/core/types.ts"
append_file "$ROOT_DIR/packages/academic-map-generator/src/analyzer/core/GeometryUtils.ts"
append_file "$ROOT_DIR/packages/academic-map-generator/src/analyzer/index.ts"

# ==============================================================================
# SECTION 3: MAP ANALYZER (Main Entry Point)
# ==============================================================================
echo "" >> "$OUTPUT_FILE"
echo "╔══════════════════════════════════════════════════════════════════════════╗" >> "$OUTPUT_FILE"
echo "║  SECTION 3: MAP ANALYZER (Main Entry Point)                              ║" >> "$OUTPUT_FILE"
echo "╚══════════════════════════════════════════════════════════════════════════╝" >> "$OUTPUT_FILE"

append_file "$ROOT_DIR/packages/academic-map-generator/src/analyzer/MapAnalyzer.ts"

# ==============================================================================
# SECTION 4: TIER 1 - GEOMETRIC DECOMPOSITION
# ==============================================================================
echo "" >> "$OUTPUT_FILE"
echo "╔══════════════════════════════════════════════════════════════════════════╗" >> "$OUTPUT_FILE"
echo "║  SECTION 4: TIER 1 - GEOMETRIC DECOMPOSITION                             ║" >> "$OUTPUT_FILE"
echo "╚══════════════════════════════════════════════════════════════════════════╝" >> "$OUTPUT_FILE"

append_file "$ROOT_DIR/packages/academic-map-generator/src/analyzer/tiers/tier1-decomposition/GeometricDecomposer.ts"
append_file "$ROOT_DIR/packages/academic-map-generator/src/analyzer/tiers/tier1-decomposition/BoundaryTracer.ts"

# ==============================================================================
# SECTION 5: TIER 2 - PATTERN ANALYSIS
# ==============================================================================
echo "" >> "$OUTPUT_FILE"
echo "╔══════════════════════════════════════════════════════════════════════════╗" >> "$OUTPUT_FILE"
echo "║  SECTION 5: TIER 2 - PATTERN ANALYSIS                                    ║" >> "$OUTPUT_FILE"
echo "╚══════════════════════════════════════════════════════════════════════════╝" >> "$OUTPUT_FILE"

append_file "$ROOT_DIR/packages/academic-map-generator/src/analyzer/tiers/tier2-patterns/PatternAnalyzer.ts"

# ==============================================================================
# SECTION 6: TIER 3 - SEGMENT FILTERING
# ==============================================================================
echo "" >> "$OUTPUT_FILE"
echo "╔══════════════════════════════════════════════════════════════════════════╗" >> "$OUTPUT_FILE"
echo "║  SECTION 6: TIER 3 - SEGMENT FILTERING                                   ║" >> "$OUTPUT_FILE"
echo "╚══════════════════════════════════════════════════════════════════════════╝" >> "$OUTPUT_FILE"

append_file "$ROOT_DIR/packages/academic-map-generator/src/analyzer/tiers/tier3-filtering/SegmentFilter.ts"

# ==============================================================================
# SECTION 7: TIER 4 - PEDAGOGICAL PLACEMENT
# ==============================================================================
echo "" >> "$OUTPUT_FILE"
echo "╔══════════════════════════════════════════════════════════════════════════╗" >> "$OUTPUT_FILE"
echo "║  SECTION 7: TIER 4 - PEDAGOGICAL PLACEMENT                               ║" >> "$OUTPUT_FILE"
echo "╚══════════════════════════════════════════════════════════════════════════╝" >> "$OUTPUT_FILE"

append_file "$ROOT_DIR/packages/academic-map-generator/src/analyzer/tiers/tier4-placement/PedagogicalPlacer.ts"

# ==============================================================================
# SECTION 8: ACADEMIC CONCEPT TYPES & STRATEGIES
# ==============================================================================
echo "" >> "$OUTPUT_FILE"
echo "╔══════════════════════════════════════════════════════════════════════════╗" >> "$OUTPUT_FILE"
echo "║  SECTION 8: ACADEMIC CONCEPT TYPES & STRATEGIES                          ║" >> "$OUTPUT_FILE"
echo "╚══════════════════════════════════════════════════════════════════════════╝" >> "$OUTPUT_FILE"

append_file "$ROOT_DIR/packages/academic-map-generator/src/analyzer/AcademicConceptTypes.ts"
append_file "$ROOT_DIR/packages/academic-map-generator/src/analyzer/PlacementStrategy.ts"
append_file "$ROOT_DIR/packages/academic-map-generator/src/analyzer/PlacementTemplate.ts"
append_file "$ROOT_DIR/packages/academic-map-generator/src/analyzer/CoordinatePrioritizer.ts"

# ==============================================================================
# SECTION 9: SUPPORTING UTILITIES
# ==============================================================================
echo "" >> "$OUTPUT_FILE"
echo "╔══════════════════════════════════════════════════════════════════════════╗" >> "$OUTPUT_FILE"
echo "║  SECTION 9: SUPPORTING UTILITIES                                         ║" >> "$OUTPUT_FILE"
echo "╚══════════════════════════════════════════════════════════════════════════╝" >> "$OUTPUT_FILE"

append_file "$ROOT_DIR/packages/academic-map-generator/src/analyzer/AcademicPlacementGenerator.ts"
append_file "$ROOT_DIR/packages/academic-map-generator/src/analyzer/SelectableElement.ts"
append_file "$ROOT_DIR/packages/academic-map-generator/src/analyzer/MarkdownReporter.ts"

# ==============================================================================
# SUMMARY
# ==============================================================================
echo "" >> "$OUTPUT_FILE"
echo "##########################################################" >> "$OUTPUT_FILE"
echo "#                    END OF MERGED FILE                  #" >> "$OUTPUT_FILE"
echo "##########################################################" >> "$OUTPUT_FILE"

# Count total lines
TOTAL_LINES=$(wc -l < "$OUTPUT_FILE")
TOTAL_SIZE=$(du -h "$OUTPUT_FILE" | cut -f1)

echo ""
echo "=================================================="
echo "  MERGE COMPLETE"
echo "=================================================="
echo "  Output file: $OUTPUT_FILE"
echo "  Total lines: $TOTAL_LINES"
echo "  File size:   $TOTAL_SIZE"
echo "=================================================="
