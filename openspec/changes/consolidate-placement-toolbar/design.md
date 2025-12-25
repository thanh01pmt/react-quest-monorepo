# Design: Consolidated Viewport Toolbar

## Context

Current UI has Placement Mode controls (Navigate/Build/Select) in the Left Panel (`AssetPalette`), while transform tools (Move/Rotate) are in `SelectionToolbar`. This creates:
- Vertical space consumption in Left Panel
- Split tool locations (modes vs transforms)
- Extra mouse travel for frequent operations

## Goals

1. **Unified tool location** - All mode/tool switches in one floating toolbar
2. **Faster access** - Toolbar always visible on viewport
3. **Cleaner Left Panel** - More space for asset palette and properties
4. **Consistent UX** - Similar to professional tools (Blender, Unity, Figma)

## Non-Goals

- Replacing keyboard shortcuts
- Changing existing state management
- Modifying placement/selection logic

## Architecture Decisions

### Decision 1: Rename to ViewportToolbar

The `SelectionToolbar` component will be renamed to `ViewportToolbar` to reflect its expanded role as the primary tool switcher.

**Rationale**: The component now handles both mode switching AND tool selection.

### Decision 2: Section-based Layout

```
┌─────────────────┐
│ MODE            │  ← Section header
│ [N] [B] [S]     │  ← Navigate/Build/Select icons
├─────────────────┤
│ TOOLS           │  ← Section header
│ [Move] [Rotate] │  ← Transform tools (when selection exists)
│ [Box] [Smart]   │  ← Selection sub-mode (when Select active)
├─────────────────┤
│ ⌨ Shortcuts     │  ← Collapsed hints
└─────────────────┘
```

**Rationale**: Clear visual separation between modes and tools.

### Decision 3: Keep Selection Type in Toolbar (not Left Panel)

When Select mode is active, show Box/Smart toggle in toolbar instead of Left Panel.

**Rationale**: 
- Context-appropriate (only relevant when selecting)
- Reduces Left Panel complexity
- Faster switching during selection operations

### Decision 4: Props Interface

```typescript
interface ViewportToolbarProps {
  // Mode control
  activeMode: 'navigate' | 'build-single' | 'build-area';
  onModeChange: (mode: BuilderMode) => void;
  
  // Selection sub-mode
  selectionMode: 'box' | 'smart';
  onSelectionModeChange: (mode: SelectionMode) => void;
  
  // State indicators
  hasSelection: boolean;
  selectionCount?: number;
  
  // Transform tools (future)
  onMoveSelected?: () => void;
  onRotateSelected?: () => void;
}
```

## CSS Styling

```css
.viewport-toolbar {
  position: absolute;
  left: 16px;
  top: 50%;
  transform: translateY(-50%);
  
  /* Glassmorphism */
  background: rgba(30, 30, 35, 0.85);
  backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  
  /* Shadow */
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
  
  /* Layout */
  display: flex;
  flex-direction: column;
  padding: 8px;
  gap: 8px;
}
```

## Keyboard Shortcuts (unchanged)

| Key | Action |
|-----|--------|
| N / V | Navigate mode |
| B | Build mode |
| S | Select mode (cycles box ↔ smart) |
| G | Move tool |
| R | Rotate tool |
| Esc | Clear selection |

## Risks & Mitigations

### Risk: Toolbar overlaps 3D content
**Mitigation**: Semi-transparent background with blur allows seeing through. Draggable option for repositioning.

### Risk: Users expect Left Panel controls
**Mitigation**: Maintain keyboard shortcuts. Add tooltip explaining new location.

## Migration Plan

1. Create new `ViewportToolbar` component
2. Add to App.tsx alongside existing `SelectionToolbar`
3. Remove Placement Mode from AssetPalette
4. Delete old SelectionToolbar once stable
5. Update any documentation/tutorials
