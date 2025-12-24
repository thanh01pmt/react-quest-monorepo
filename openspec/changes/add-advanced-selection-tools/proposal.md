# Change: Add Advanced Selection & Transform Tools

## Why

Map Builder hiện tại chỉ hỗ trợ manual placement cơ bản (click-to-place) và box selection đơn giản. Người dùng phải:
- Place từng tile một → Tốn thời gian cho large maps
- Không có cách select connected structures → Khó chọn complex geometry
- Không có transform tools → Phải rebuild thay vì transform
- Không có symmetry support → Tạo symmetric maps rất khó

Điều này làm giảm productivity 10-20x so với professional 3D editors.

## What Changes

Thêm **7 công cụ mới** để cải thiện selection & transform workflow:

### 1. Smart Select Tool
- Select connected components (flood select)
- Traversal algorithm: BFS through adjacent tiles
- UI: "Smart Select" button in toolbar
- Shortcut: `S` key

### 2. Move Tool (Polish existing)
- Visual gizmo (3-axis arrows)
- Snap to grid toggle
- Already 90% complete, chỉ cần UI

### 3. Rotate Tool (Polish existing)  
- Rotation gizmo (circular ring)
- Snap angles (45°, 90°)
- Already 70% complete, improve UX

### 4. Smart Fill Tool
- Flood fill enclosed areas
- Works like Photoshop bucket tool
- Algorithm: BFS-based flood fill
- Shortcut: `F` key

### 5. Symmetry Mode
- Two modes: Mirror (linked) & Duplicate (independent)
- Symmetry axes: X, Z
- Configurable center line
- Phase 1: Duplicate mode only (lower risk)

### 6. Pattern Tool
- Save selection as reusable pattern
- Pattern library UI (left panel)
- Rotate/flip before placing
- Export/import patterns (JSON)

### 7. Area Clone Tool
- Enhanced copy/paste with transforms
- Offset, rotate, flip options
- Multi-paste (array duplication)
- Dialog UI for advanced options

## Impact

### Specifications Affected
- `specs/map-builder/spec.md` - Main capability
- `specs/selection-system/spec.md` - **NEW** capability
- `specs/transform-tools/spec.md` - **NEW** capability

### Code Changes
Primary files:
- `apps/map-builder-app/src/App.tsx` - Add tool handlers
- `apps/map-builder-app/src/components/Toolbar/` - **NEW** component
- `apps/map-builder-app/src/utils/SelectionEngine.ts` - **NEW** utility
- `apps/map-builder-app/src/utils/TransformUtil.ts` - **NEW** utility
- `apps/map-builder-app/src/utils/FloodFill.ts` - **NEW** algorithm

### User Impact
- **Productivity:** 5-10x faster map creation
- **Quality:** Better symmetric designs, reusable patterns
- **Learning Curve:** Moderate (familiar from other 3D tools)

### Technical Risk
- **Medium:** Smart Select & Fill require graph algorithms
- **Low:** Move/Rotate are refinements of existing code
- **High:** Symmetry mirror mode (deferred to Phase 2)
- **Medium:** Pattern storage & serialization

### Breaking Changes
**None.** All features are additive, backward compatible.

## Implementation Phases

### Phase 1: Foundation (Week 1-2)
- Smart Select
- Move Tool (polish)
- Rotate Tool (polish)

### Phase 2: Fill & Clone (Week 3)
- Smart Fill Tool

### Phase 3: Advanced (Week 4-6)
- Symmetry Mode (duplicate only)
- Pattern Tool  
- Area Clone Tool

## Success Criteria

- ✅ Smart Select can select 100+ connected tiles in <1s
- ✅ Fill Tool fills 500-tile room in <2s
- ✅ Pattern library can store 50+ patterns
- ✅ Average map creation time reduced by 50%
- ✅ Zero crashes from new tools
- ✅ Undo/Redo works perfectly with all tools

## Dependencies

- Requires: React Three Fiber, Three.js (already in use)
- No new external dependencies
- Internal dependencies: Existing `PlacedObject` system

## Alternatives Considered

### Alternative 1: Third-party editor integration
- Use Blender/Unity for editing
- **Rejected:** Too heavy, poor UX for our use case

### Alternative 2: Template-only workflow
- No manual tools, only templates
- **Rejected:** Not flexible enough for custom designs

### Alternative 3: AI-assisted generation
- AI suggests placements
- **Deferred:** Future enhancement, not MVP
