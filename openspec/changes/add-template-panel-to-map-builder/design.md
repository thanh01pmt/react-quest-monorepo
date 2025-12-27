# Design: Add Template Panel to Map Builder App

## Context

Map Builder App hiện có 2 tabs chính:
- **Topology**: Chọn hình dạng, generate ground blocks
- **Placement**: Đặt items (crystals, switches, etc.)

Cần thêm tab thứ 3 **Template** để tích hợp Solution-Driven Generator.

## Goals

1. **Fast map creation** - Từ code → map trong < 5 clicks
2. **Non-disruptive** - Không ảnh hưởng workflow hiện tại
3. **Consistent UX** - Giống giao diện các tab khác
4. **Flexible** - Hỗ trợ cả preset templates và custom code

## Non-Goals

- Không implement full IDE (autocomplete, debugging)
- Không hỗ trợ TypeScript syntax (chỉ JavaScript ES6)
- Không hỗ trợ import/export code files

## Decisions

### Decision 1: Code Editor Implementation

**Options considered:**
1. Monaco Editor (VS Code core) - Full-featured but heavy (~2MB)
2. CodeMirror 6 - Modern, modular, ~200KB
3. react-simple-code-editor - Lightweight ~10KB
4. Plain textarea - 0KB

**Chosen:** Start with **plain textarea + CSS styling**, upgrade to monaco later if needed.

**Rationale:** 
- Minimize bundle size impact
- Faster time to market
- Users chỉ cần paste code, không cần full editing experience

### Decision 2: Template Presets Storage

**Options:**
1. Hardcoded trong component
2. JSON file trong `public/`
3. Fetch từ API

**Chosen:** **Hardcoded array** trong component.

**Rationale:**
- Templates ít thay đổi
- Không cần loading state
- Dễ maintain trong codebase

### Decision 3: Map State Handling

**When generating from template:**
1. **Replace** - Clear existing map, create new
2. **Append** - Add generated content to existing
3. **Ask user** - Prompt before replacing

**Chosen:** **Replace with confirmation** nếu map không empty.

**Rationale:**
- Template generates complete map, append không có ý nghĩa
- Confirmation ngăn mất work không mong muốn

### Decision 4: Preview Strategy

**Options:**
1. Real-time preview khi typing (debounced)
2. Manual "Preview" button
3. Inline preview in 3D view

**Chosen:** **Manual "Preview" button** với ASCII display.

**Rationale:**
- Real-time có thể lag với code dài
- ASCII hiển thị nhanh hơn 3D render
- Tách biệt preview và generate để user kiểm tra trước

### Decision 5: Tab Position

**Options:**
1. Third tab: `[Topology] [Placement] [Template]`
2. First tab (emphasize feature): `[Template] [Topology] [Placement]`
3. Separate section (accordion)

**Chosen:** **Third position** `[Topology] [Placement] [Template]`

**Rationale:**
- Không thay đổi vị trí các tab hiện có
- Users đã quen với Topology → Placement flow
- Template là "advanced" feature, đặt cuối hợp lý

### Decision 6: Command Compatibility with Quest Player

**Background:** Quest Player (`packages/quest-player`) sử dụng các lệnh cụ thể trong Blockly blocks. Template Interpreter cần tương thích.

**Quest Player Commands (từ `maze/blocks.ts`):**

| Category | Command | Status |
|----------|---------|--------|
| Movement | `moveForward()` | ✅ Supported |
| Movement | `jump()` | ✅ Supported |
| Movement | `turnLeft()` | ✅ Supported |
| Movement | `turnRight()` | ✅ Supported |
| Items | `collectItem()` | ✅ Supported |
| Switch | `toggleSwitch()` | ✅ Supported |
| Conditions | `isPathForward()` | ⚠️ For future IF/WHILE |
| Conditions | `isItemPresent()` | ⚠️ For future IF/WHILE |
| Conditions | `notDone()` | ⚠️ For future WHILE |

**Chosen:** Template Interpreter hỗ trợ **tất cả action commands** của Quest Player, với aliases cho backward compatibility.

**Aliases Supported:**
```javascript
// All these work the same
collectItem();  // Primary (Quest Player)
collect();      // Alias
pickCrystal();  // Alias (legacy)
```

## Architecture

### Component Hierarchy

```
MainLeftPanel
├── [Topology Tab]
├── [Placement Tab]  
└── [Template Tab]
    └── TemplatePanel
        ├── TemplateSelector (dropdown)
        ├── TemplateCodeEditor (textarea)
        ├── TemplatePreview (metrics + ASCII)
        └── TemplateActions (buttons)
```

### Data Flow

```
┌─────────────────┐
│ TemplateSelector│ ──onChange──┐
└─────────────────┘              │
                                 ▼
┌─────────────────┐     ┌───────────────┐
│TemplateCodeEditor│◄───│ preset.code   │
└─────────────────┘     └───────────────┘
         │
         │ code string
         ▼
┌─────────────────────────┐
│ SolutionDrivenGenerator │
│ (from academic-map-gen) │
└─────────────────────────┘
         │
         │ SolutionDrivenResult
         ▼
┌─────────────────────────┐
│ templateConverter.ts    │
│ - convertToBuilderFormat│
└─────────────────────────┘
         │
         │ BuilderMapData
         ▼
┌─────────────────────────┐
│ App.tsx state update    │
│ - setBlocks()           │
│ - setItems()            │
│ - setPlayerStart()      │
└─────────────────────────┘
```

### Type Definitions

```typescript
interface TemplatePreset {
  id: string;
  name: string;
  description: string;
  difficulty: 1 | 2 | 3 | 4 | 5;
  code: string;
}

interface TemplatePreviewResult {
  success: boolean;
  error?: string;
  metrics?: {
    pathLength: number;
    itemCount: number;
    loopIterations: number;
    complexity: number;
  };
  asciiMap?: string;
}

interface TemplatePanelProps {
  onGenerate: (result: GeneratedGameConfig) => void;
  existingMapNotEmpty: boolean;
}
```

## Risks / Trade-offs

### Risk 1: Bundle Size
- **Issue:** Monaco editor adds ~2MB
- **Mitigation:** Use textarea first, lazy-load monaco later if needed

### Risk 2: User Confusion
- **Issue:** 3 tabs may confuse new users
- **Mitigation:** Good naming, tooltip explanations, welcome modal update

### Risk 3: State Sync
- **Issue:** Template-generated map may conflict with Topology settings
- **Mitigation:** Clear topology state when generating from template

## Migration Plan

Không cần migration - đây là new feature.

## Open Questions

1. **Q:** Có cho phép edit template-generated map trong Topology tab không?
   - **A:** Có, sau khi generate thì map hoạt động như map thường

2. **Q:** Có cần undo sau khi generate không?
   - **A:** Phase 1 không, có thể thêm sau nếu cần

3. **Q:** Template panel có cần collapse/expand không?
   - **A:** Không trong Phase 1, giữ đơn giản
