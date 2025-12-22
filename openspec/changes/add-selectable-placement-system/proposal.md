# Change: Add Selectable Placement System

## Why

Hiện tại `SolutionFirstPlacer` sử dụng `PatternLibrary` để đặt items theo patterns cứng (hardcoded offsets). User không thể:
1. **Thấy** được các vị trí có thể đặt item (keypoints, segments)
2. **Chọn** cụ thể vị trí nào đặt item nào
3. **Lưu lại** pattern đặt item để áp dụng cho các map cùng topology

Điều này dẫn đến:
- Thiếu flexibility trong việc customize placements
- Không thể tái sử dụng placement patterns
- Khó debug tại sao item được đặt ở đâu

## What Changes

### Phase 1: MapAnalyzer Bridge
- Thêm `MapAnalyzer.fromTopology(pathInfo)` method để chuyển đổi Topology output sang PlacementContext
- PlacementContext bổ sung `selectableElements[]` - danh sách các điểm/segments có thể chọn
- Không sửa đổi Topology classes

### Phase 2: Selectable Elements Interface
- Định nghĩa `SelectableElement` interface (points, segments, positions)
- Thêm display metadata (name, icon, color) cho UI
- Thêm relationship info (mirrorOf, partOf)

### Phase 3: Placement Template System
- `PlacementRule` - định nghĩa rule đặt item theo selector
- `PlacementTemplate` - collection of rules cho một topology
- `PlacementTemplateRegistry` - lưu trữ và lookup templates

### Phase 4: UI Integration
- UI hiển thị selectable elements từ PlacementContext
- User chọn elements và assign item types
- Save/Load templates

## Impact

- **Packages affected:**
  - `packages/academic-placer` - new bridge method, template system
  - `apps/map-builder-app` - UI integration, template UI
  
- **Files to modify:**
  - `packages/academic-placer/src/MapAnalyzer.ts` - add fromTopology()
  - `packages/academic-placer/src/index.ts` - export new types
  
- **New files:**
  - `packages/academic-placer/src/SelectableElement.ts`
  - `packages/academic-placer/src/PlacementTemplate.ts`
  - `packages/academic-placer/src/PlacementTemplateRegistry.ts`
  - `apps/map-builder-app/src/components/PlacementSelector.tsx`
  - `apps/map-builder-app/src/components/TemplateManager.tsx`

- **Breaking changes:** None - additive only
