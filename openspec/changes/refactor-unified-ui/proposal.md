# Change: Refactor Unified UI for Manual/Auto Mode Parity

## Why

Hiện tại, Map Builder có 2 chế độ hoạt động tách biệt hoàn toàn:
- **Manual Mode (Assets tab)**: Người dùng đặt từng block/item thủ công → chỉ có thể validate thông qua nút "Solve Maze" ẩn sâu trong QuestDetailsPanel.
- **Auto Mode (Topology tab)**: Generator tự động tạo map theo topology → có validation ngay trong MapInspector nhưng thiếu khả năng customize chi tiết.

Vấn đề:
1. **Không thống nhất về UX**: Hai chế độ có workflow hoàn toàn khác nhau, gây khó hiểu cho người dùng.
2. **Thiếu validation ở Manual**: Không có visual feedback về tính hợp lệ của map khi edit thủ công.
3. **Thiếu customization ở Auto**: Không thể tinh chỉnh kết quả generate (chỉ có Generate hoặc không).
4. **Function phân tán**: Validation, Solve, Export nằm rải rác ở nhiều panels khác nhau.

## What Changes

### 1. Unified Mode Architecture
- **[REMOVED] Tab "Assets"/"Topology" cứng nhắc** → Thay bằng workflow liền mạch.
- **[NEW] Mode Toggle**: "Manual First" vs "Auto First" workflow selector.
- **[NEW] Unified Control Bar**: Thanh điều khiển chung với các chức năng chính (Validate, Solve, Generate, Export).

### 2. Left Panel Redesign: "Builder Options"
```
┌──────────────────────────────────────┐
│  🗺️  MAP BUILDER                     │
├──────────────────────────────────────┤
│  ┌──────────┐ ┌──────────────────┐   │
│  │ MANUAL   │ │   AUTO           │   │
│  │ (Build)  │ │  (Generate)      │   │
│  └──────────┘ └──────────────────┘   │
├──────────────────────────────────────┤
│  [Common Controls Section]           │
│  • Layer: [All ▼]  ☑️ Smart Snap     │
│  • Theme: [Space ▼]                  │
├──────────────────────────────────────┤
│  [Mode-Specific Content]             │
│                                      │
│  ┌ IF MANUAL MODE ─────────────────┐ │
│  │ Asset Palette (grouped blocks)  │ │
│  │ Placement modes (Place/Select)  │ │
│  │ Fill Options / Selection Bounds │ │
│  └─────────────────────────────────┘ │
│                                      │
│  ┌ IF AUTO MODE ───────────────────┐ │
│  │ Topology Selector               │ │
│  │ Topology Parameters             │ │
│  │ Strategy Selector               │ │
│  │ Academic Parameters (Bloom...)  │ │
│  │ Item Goals                      │ │
│  └─────────────────────────────────┘ │
├──────────────────────────────────────┤
│  [📋 Generate] [🔍 Validate] [🧩 Solve]  │
│  (Actions khả dụng ở CẢ 2 chế độ)    │
└──────────────────────────────────────┘
```

### 3. Right Panel Consolidation: "Properties & Output"
```
┌──────────────────────────────────────┐
│  PROPERTIES                          │
│  • Object Properties (khi chọn)      │
│  • Theme Selector                    │
├──────────────────────────────────────┤
│  QUEST DETAILS (collapsible)         │
│  • Metadata, Toolbox, etc.           │
├──────────────────────────────────────┤
│  JSON OUTPUT (collapsible)           │
│  • Preview + Edit + Export           │
└──────────────────────────────────────┘
```

### 4. Unified Validation System
- **[NEW] Live Validation Badge**: Hiển thị trong cả 2 modes, update realtime.
- **[MODIFIED] MapInspector**: Nhúng trực tiếp vào scene, không phụ thuộc vào pathInfo từ generate.
- **[NEW] Manual Mode Validation**: 
  - Tự động truy vết path từ `player_start` → `finish`.
  - Kiểm tra solvability + item accessibility.
- **[NEW] Post-Generate Edit Mode**: Sau khi Generate, chuyển sang hybrid state cho phép điều chỉnh thủ công và re-validate.

### 5. Action Bar (Bottom/Floating)
- **[NEW] Primary Actions**: Luôn visible, bao gồm:
  - 🔍 **Validate Map**: Chạy 3-tier validation (available in both modes).
  - 🧩 **Solve & Preview**: Run solver và show optimal path.
  - 📋 **Generate/Regenerate**: (Auto mode) hoặc **Clear All** (Manual mode).
  - 💾 **Export JSON**: Download map file.
  - 🔄 **Undo/Redo**: Với indicator số bước.

### 6. Enhanced Auto Mode Customization
- **[NEW] Post-Generate Editing**: Sau generate, items có thể được di chuyển/xóa/thêm.
- **[NEW] "Lock Ground"** toggle: Khóa path topology, chỉ cho phép edit items.
- **[NEW] Regenerate Options**: 
  - "Regenerate All": Tạo lại hoàn toàn.
  - "Regenerate Items Only": Giữ path, chỉ re-generate item placement.
- **[NEW] Parameter Presets**: Save/Load presets cho topology+strategy configs.

## Impact

### Specs Affected
- `specs/map-builder-ui/spec.md`: **MODIFIED** - New unified architecture requirements.

### Code Changes
- **Files to Create:**
  - `components/BuilderControlPanel/index.tsx`: Unified left panel component.
  - `components/ActionBar/index.tsx`: Floating action bar component.
  - `components/ValidationBadge/index.tsx`: Realtime validation indicator.
  - `hooks/useMapValidation.ts`: Hook for live validation logic.
  - `hooks/usePathTracer.ts`: Hook for manual mode path tracing.
  - `store/builderModeContext.tsx`: Context for mode state management.

- **Files to Modify:**
  - `App.tsx`: Restructure layout, integrate new components.
  - `components/AssetPalette/index.tsx`: Simplify, move common controls out.
  - `components/TopologyPanel/index.tsx`: Simplify, move actions out.
  - `components/MapInspector/index.tsx`: Make mode-agnostic.
  - `components/PropertiesPanel/index.tsx`: Consolidate with right sidebar.

- **Files to Delete/Merge:**
  - Tab switching logic in `App.tsx` (replace with mode toggle).

## Design Decisions

1. **Single Panel Architecture**: Thay vì 2 tabs tách biệt, sử dụng 1 panel với content thay đổi theo mode nhưng controls chung ở cố định.

2. **Actions Always Available**: Validate, Solve, Export luôn accessible ở cả 2 modes.

3. **Hybrid State After Generate**: Auto mode generate xong → chuyển sang "Edit Generated Map" state, vẫn giữ pathInfo nhưng cho phép manual adjustments.

4. **Path Tracing for Manual**: Implement A* or BFS từ start→finish để validate maps được build thủ công.

5. **Progressive Disclosure**: Các options nâng cao (Strategy, Academic Params) được collapse/expand để không overwhelm new users.

## Non-Goals (Out of Scope)
- Full undo/redo history visualization.
- Multi-user collaboration features.
- Cloud save/sync functionality.
