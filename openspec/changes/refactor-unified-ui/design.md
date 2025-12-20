# Design: Unified UI Architecture

## Context

Map Builder App hiện tại có 2 chế độ hoạt động được triển khai như 2 tabs độc lập:
- **Assets tab**: Manual mode - Người dùng tự đặt từng object.
- **Topology tab**: Auto mode - Generator tự động tạo map.

Điều này dẫn đến inconsistency trong UX và thiếu khả năng:
1. Validate map ở Manual mode (phải "Solve Maze" trong right panel).
2. Customize kết quả ở Auto mode sau khi generate.
3. Hybrid workflow: Generate → Edit → Re-validate.

## Goals

1. **Unified Access**: Validate, Solve, Export accessible ở cả 2 modes.
2. **Flexible Workflow**: Hỗ trợ Manual-first, Auto-first, và Hybrid workflows.
3. **Maximum Customization**: Auto mode cho phép edit sau generate.
4. **Live Feedback**: Validation realtime ở cả 2 modes.

## Non-Goals

- Full undo/redo with visual history.
- Multi-user collaboration.
- Cloud storage integration.

## Architecture Decisions

### Decision 1: Mode as Context, Not Tab

**Decision**: Sử dụng React Context để quản lý mode thay vì tab switching.

**Rationale**: 
- Cho phép preserve state khi switch modes.
- Cho phép components subscribe to mode changes.
- Cho phép partial UI updates thay vì full remount.

```tsx
// BuilderModeContext
interface BuilderState {
  mode: 'manual' | 'auto';
  isEditing: boolean;        // True after generate (hybrid mode)
  isPathLocked: boolean;     // Lock ground topology
  lastConfig: GenerateConfig | null;
}
```

### Decision 2: Separation of Controls

**Decision**: Tách UI thành 3 layers:
1. **Common Controls**: Mode toggle, Layer, Theme - shared by both modes.
2. **Mode Content**: AssetPalette (manual) hoặc TopologyOptions (auto).
3. **Actions**: Validate, Solve, Generate/Clear, Export - unified bar.

**Rationale**:
- Common controls eliminate duplication.
- Mode content is swappable without touching container.
- Actions are always visible/accessible.

```
┌─────────────────────────────┐
│ [Common Controls]           │  ← Fixed position
├─────────────────────────────┤
│                             │
│ [Mode-Specific Content]     │  ← Scrollable
│                             │
├─────────────────────────────┤
│ [Action Bar]                │  ← Fixed position
└─────────────────────────────┘
```

### Decision 3: Manual Mode Path Tracing

**Decision**: Implement BFS path tracing cho Manual mode validation.

**Rationale**:
- Không có pathInfo từ topology generator.
- Cần xác định reachability từ start → finish.
- Cần biết items nào accessible.

**Algorithm**:
```typescript
function tracePath(objects: PlacedObject[]): TracedPath {
  const blocks = objects.filter(o => o.asset.type === 'block');
  const start = objects.find(o => o.asset.key === 'player_start');
  const finish = objects.find(o => o.asset.key === 'finish');
  
  if (!start || !finish) return { reachable: false, path: [] };
  
  // BFS on block grid
  const visited = new Set<string>();
  const queue: Coord[][] = [[[start.x, start.y, start.z]]];
  
  while (queue.length > 0) {
    const path = queue.shift()!;
    const current = path[path.length - 1];
    const key = current.join(',');
    
    if (isAtFinish(current, finish)) return { reachable: true, path };
    if (visited.has(key)) continue;
    visited.add(key);
    
    for (const neighbor of getNeighbors(current, blocks)) {
      queue.push([...path, neighbor]);
    }
  }
  
  return { reachable: false, path: [] };
}
```

### Decision 4: Post-Generate Editing Flow

**Decision**: Sau generate, app enters "Editing Generated Map" state.

**States**:
- `mode: 'auto', isEditing: false`: Chọn options, chưa generate.
- `mode: 'auto', isEditing: true`: Đã generate, đang edit.
- `mode: 'manual', isEditing: false`: New/loaded map.
- `mode: 'manual', isEditing: true`: Map được sửa đổi.

**Flow**:
```
[Auto Mode] → Generate → [isEditing: true] 
                         ├─→ Edit items → Re-validate
                         ├─→ Regenerate Items → Keep path, new items
                         ├─→ Regenerate All → Fresh generate
                         └─→ Switch to Manual → Keep objects
```

### Decision 5: Action Bar Positioning

**Decision**: Action Bar docked at bottom of left panel.

**Alternatives Considered**:
- Floating center-bottom: Occludes scene.
- In right panel: Too far from controls.
- Top toolbar: Inconsistent with dark sidebar.

**Final Layout**:
```
Left Panel (300px)         │ Scene (flexible)        │ Right Panel (resizable)
───────────────────────────│─────────────────────────│─────────────────────────
[Mode Toggle]              │                         │ [Properties]
[Common Controls]          │     3D Canvas           │  └─ Object details
[Mode Content]             │                         │ [Quest Details]
          ↕ scroll         │  [MapInspector]         │  └─ Metadata
[Action Bar]               │  [ValidationBadge]      │ [JSON Output]
```

## Component Architecture

```
App
├── BuilderModeProvider
│   ├── BuilderControlPanel (left)
│   │   ├── CommonControls
│   │   │   ├── ModeToggle
│   │   │   ├── LayerSelector
│   │   │   └── ThemeSelector
│   │   ├── ModeContent
│   │   │   ├── AssetPalette (if manual)
│   │   │   └── TopologyOptions (if auto)
│   │   └── ActionBar
│   │       ├── ValidateButton
│   │       ├── SolveButton
│   │       ├── GenerateButton / ClearButton
│   │       └── ExportButton
│   ├── BuilderScene (center)
│   │   ├── Canvas3D
│   │   ├── MapInspector
│   │   └── ValidationBadge
│   └── RightSidebar
│       ├── PropertiesPanel (collapsible)
│       ├── QuestDetailsPanel (collapsible)
│       └── JsonOutputPanel (collapsible)
```

## Risks & Trade-offs

| Risk | Mitigation |
|------|------------|
| Mode switching loses state | Preserve all objects in shared state |
| Path tracing performance | Debounce + cache results |
| UI complexity increase | Progressive disclosure (collapsed sections) |
| Breaking existing workflows | Keep core interactions familiar |

## Migration Strategy

1. **Phase 1**: Create new components alongside existing.
2. **Phase 2**: Feature-flag switch between old/new UI.
3. **Phase 3**: Migrate users, deprecate old UI.
4. **Phase 4**: Remove old components.

## Open Questions

1. **Save presets**: Should presets include full config or just topology params?
   - **Tentative**: Full config (topology + strategy + academic params).

2. **Lock Ground granularity**: Lock all blocks, or allow path extension?
   - **Tentative**: Lock all blocks (simpler first iteration).

3. **Keyboard shortcuts**: Which actions get shortcuts?
   - **Tentative**: V=Validate, S=Solve, G=Generate, Cmd+E=Export.
