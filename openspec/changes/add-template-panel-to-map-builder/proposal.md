# Change: Add Template Panel to Map Builder App

## Why

Hiện tại Map Builder App sử dụng workflow **Topology-First**: chọn hình dạng → generate ground → đặt items thủ công. Workflow này phù hợp cho việc thiết kế map tự do nhưng **không tận dụng được Solution-Driven Generator** mới đã implement.

Giáo viên và content creator cần một cách **nhanh chóng tạo map từ code solution** (output của Blockly) mà không cần trải qua nhiều bước. Điều này đặc biệt hữu ích khi:
- Muốn tạo map từ bài giải mẫu có sẵn
- Cần generate nhiều variations từ cùng một code template
- Muốn đảm bảo map luôn solvable (vì được tạo từ solution)

## What Changes

### New Components

1. **`TemplatePanel` component**
   - Tab mới trong `MainLeftPanel` cạnh Topology và Placement
   - Chứa code editor, template selector, và controls

2. **`TemplateCodeEditor` component**  
   - Monaco-based hoặc simple textarea code editor
   - Syntax highlighting cho JavaScript
   - Line numbers và basic editing features

3. **`TemplateSelector` component**
   - Dropdown với các preset templates (Simple FOR, Nested Loop, Function...)
   - Khi chọn template, code được populate vào editor

4. **`TemplatePreview` component**
   - ASCII map preview trước khi generate
   - Hiển thị metrics (path length, items, complexity)

### Integration Points

- **App.tsx**: Thêm `activeTab` state cho "template" mode
- **MainLeftPanel**: Thêm tab "Template" và render `TemplatePanel`
- **State sync**: Kết quả generate được convert sang existing map format

### UI Flow

```
[Topology] [Placement] [Template]  ← Click Template tab
                          ↓
┌─────────────────────────────────────┐
│ 📝 Template Generator               │
├─────────────────────────────────────┤
│ Select Template: [Simple FOR Loop ▼]│
├─────────────────────────────────────┤
│ Code:                               │
│ ┌─────────────────────────────────┐ │
│ │ for (let i = 0; i < 5; i++) {  │ │
│ │   moveForward();                │ │
│ │   pickCrystal();                │ │
│ │ }                               │ │
│ └─────────────────────────────────┘ │
├─────────────────────────────────────┤
│ Preview:                            │
│   Path: 6 blocks                    │
│   Items: 5 crystals                 │
│   Complexity: ⭐⭐                   │
├─────────────────────────────────────┤
│ [▶ Generate Map]  [📋 Copy Config]  │
└─────────────────────────────────────┘
```

### Non-Breaking Changes

- Existing Topology/Placement workflow không bị ảnh hưởng
- Tab Template là optional, người dùng có thể không dùng
- Map format output tương thích với existing viewer

## Impact

### Specs Affected
- `map-builder-app`: New capability (Template tab)

### Code Affected
- `apps/map-builder-app/src/App.tsx` - Add tab state
- `apps/map-builder-app/src/components/MainLeftPanel/` - Add Template tab
- **New files:**
  - `apps/map-builder-app/src/components/TemplatePanel/`
  - `apps/map-builder-app/src/components/TemplateCodeEditor/`
  - `apps/map-builder-app/src/components/TemplateSelector/`
  - `apps/map-builder-app/src/components/TemplatePreview/`
  - `apps/map-builder-app/src/utils/templateConverter.ts`

### Dependencies
- `@repo/academic-map-generator` (existing) - SolutionDrivenGenerator
- Optional: `monaco-editor` hoặc `react-simple-code-editor`

## Success Criteria

1. User có thể paste JavaScript code và generate map trong < 5 clicks
2. Generated map hiển thị chính xác trong 3D viewer
3. Map có thể export ra JSON format tương thích với game
4. Không làm hỏng existing Topology/Placement workflow
