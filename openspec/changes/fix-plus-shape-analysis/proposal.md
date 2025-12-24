# Change: Fix Plus Shape Islands Analysis (Proof of Concept)

## Why

The MapAnalyzer currently produces **incorrect results** for `plus_shape_islands` topology:
- Detects **1 large area with 4 holes** instead of **4 separate islands + 1 hub**.
- Metrics show `Total Blocks: 0`, `Segment Count: 0`, `Detected Topology: unknown`.
- Pattern detection operates on boundary edges, not component-level structures.

Additionally, **TypeScript porting is incomplete** - comparison shows:
- Python: 197 lines, 8800 bytes
- TypeScript: 149 lines, 4634 bytes (~47% smaller)

## Porting Issues Found

| Feature | Python | TypeScript | Status |
|---------|--------|------------|--------|
| Dynamic center calculation | ✅ Random within bounds | ❌ Hardcoded (10, 10) | **MISSING** |
| Grid size constraints | ✅ Uses effective_grid_size | ❌ Not implemented | **MISSING** |
| Arm length bounds check | ✅ max_arm_length calculated | ❌ Simple `> 8` check | **INCOMPLETE** |
| `semantic_positions.center` | ✅ `'center': center_pos` | ✅ Present | OK |
| `valid_pairs` structure | ✅ 3 pairs with full metadata | ⚠️ 2 pairs, less detail | **INCOMPLETE** |
| `branches` metadata | ✅ Full branch paths | ✅ Present | OK |
| `island_centers` | ❌ Computed but not stored | ✅ Stored | TS is better |

## What Changes

### Phase 0: Verify/Fix TypeScript Porting (NEW - First Priority)
- Fix `center` calculation to be dynamic instead of hardcoded
- Add grid size constraint logic
- Complete `valid_pairs` metadata parity

### Phase 1: Add Component Metadata
- Add `components[]` array to metadata describing each island
- Add `layout_pattern: "radial_4"` to top-level metadata
- Add `connectors[]` for hub-to-island bridge paths

### Phase 2: Analyzer Enhancement
- Add **Composite Detection Path** in `GeometricDecomposer`
- When `components[]` exists, use provided structure instead of geometric guessing

### Phase 3: Verification
- Re-run `analyze-plus-map.ts` and verify correct component detection

## Impact

- **Files Modified:**
  - `packages/academic-map-generator/src/generator/topologies/PlusShapeIslands.ts` - Fix porting issues
  - `packages/academic-map-generator/src/analyzer/tiers/tier1-decomposition/GeometricDecomposer.ts` - Add composite path
  - `packages/academic-map-generator/src/analyzer/core/types.ts` - Add `ComponentMetadata` interface
- **Scope:** POC for one topology
- **Backward Compatible:** Yes

## Success Criteria

1. TypeScript topology generates same structure as Python
2. `plus_analysis_report.md` shows:
   - `Areas: 4` (or `Components: 4`)
   - `Detected Topology: radial_4` or `plus_shape_islands`
   - Pattern: `repeat` with 4 repetitions of `square` module
3. Prioritized coords include island centers
