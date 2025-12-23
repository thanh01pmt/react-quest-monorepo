# Change: Merge academic-map-engine and map-generator Packages

## Why

Hiện tại có 2 packages riêng biệt xử lý map:

1. **`academic-map-engine`** (`@repo/academic-placer`): Phân tích map có sẵn → Đề xuất cách đặt items học thuật
2. **`map-generator`**: Tạo map mới từ topology → Đặt items và tổng hợp solution

Vấn đề:
- **Trùng lặp types**: `Vector3` (interface) vs `Coord` (tuple) - cùng mục đích
- **Trùng lặp logic**: Segment analysis, pattern detection tồn tại ở cả hai
- **Khó bảo trì**: Thay đổi ở một nơi không đồng bộ với nơi khác
- **Dependency phức tạp**: Không clear package nào phụ thuộc package nào

## What Changes

### Phase 1: Tạo package mới `academic-map-generator`

- Tạo package structure mới với phân chia rõ ràng:
  - `core/` - Types và utilities dùng chung
  - `generator/` - Logic tạo map từ topology (từ `map-generator`)
  - `analyzer/` - Logic phân tích map có sẵn (từ `academic-map-engine`)

### Phase 2: Unified Types (`core/types.ts`)

| Old Type | Location | New Type | Decision |
|----------|----------|----------|----------|
| `Vector3` interface | academic-map-engine | `Coord` tuple | Dùng tuple `[x, y, z]` - nhẹ hơn, dễ serialize |
| `Coord` tuple | map-generator | `Coord` | Giữ nguyên |
| `PathSegment` | cả hai | `Segment` | Merge, lấy version đầy đủ hơn từ academic-map-engine |
| `IPathInfo` | map-generator | `PathInfo` | Giữ nguyên, chuẩn hóa prefix |
| `Area` | academic-map-engine | `Area` | Giữ nguyên, generator có thể dùng |

### Phase 3: Phân loại và Di chuyển Code

#### **Generator Module** (`generator/`)
> Nguồn: `map-generator`

- `TopologyRegistry.ts` - Quản lý topology
- `topologies/` (31 files) - Các hình dạng map
- `PlacementService.ts` - Main entry để tạo map
- `handlers/` - Placement handlers (SolutionFirstPlacer, etc.)
- `synthesizers/` - Solution synthesis (FunctionSynthesizer, etc.)
- `strategies/` - Pedagogical strategies
- `validation/` - PathVerifier, ValidationPipeline

#### **Analyzer Module** (`analyzer/`)
> Nguồn: `academic-map-engine`

- `MapAnalyzer.ts` - 4-Tier analysis pipeline
- `AcademicPlacementGenerator.ts` - Đề xuất placement từ analysis
- `generators/` - Concept-based generators (Loop, Function, etc.)
- `CoordinatePrioritizer.ts` - Ưu tiên vị trí đặt item
- `PlacementTemplate.ts` - Template patterns
- `SelectableElement.ts` - UI selection support

#### **Shared Utilities** (`core/utils/`)
> Extract từ cả hai

- `geometry.ts` - Vector math (từ map-generator/utils/geometry.ts)
- `coordUtils.ts` - Coordinate helpers (extract từ MapAnalyzer)
- `segmentUtils.ts` - Segment operations (merge từ cả hai)

### Phase 4: Update Imports

- Cập nhật tất cả imports trong `apps/map-builder-app`
- Cập nhật re-exports trong package mới

## Impact

- **Packages affected:**
  - `packages/academic-map-engine` - **DELETE** sau khi migrate
  - `packages/map-generator` - **DELETE** sau khi migrate
  - `packages/academic-map-generator` - **NEW**
  - `apps/map-builder-app` - Update imports

- **Breaking changes:**
  - `Vector3` interface → `Coord` tuple (cần migration)
  - Import paths thay đổi hoàn toàn
  - Package name `@repo/academic-placer` → `@repo/academic-map-generator`

> [!CAUTION]
> Breaking changes yêu cầu cập nhật tất cả consumers. Cần kiểm tra `apps/map-builder-app` và bất kỳ external consumers nào.

## Verification Plan

### Automated Tests

1. **TypeScript compilation check:**
   ```bash
   cd packages/academic-map-generator
   pnpm exec tsc --noEmit
   ```

2. **Run existing tests từ map-generator:**
   ```bash
   cd apps/map-builder-app
   pnpm test src/map-generator/__tests__/
   ```

3. **Run analyzer scripts:**
   ```bash
   cd packages/academic-map-generator
   pnpm run analyze examples/mapconfig.json
   ```

### Manual Verification

1. **Verify map-builder-app builds:**
   ```bash
   cd apps/map-builder-app
   pnpm build
   ```

2. **Test map generation trong UI:**
   - Mở map-builder-app
   - Generate một map với LShape topology
   - Verify objects được đặt đúng

3. **Test analysis trong UI:**
   - Load một existing map config
   - Verify TopologyInspector hiển thị đúng segments/areas
