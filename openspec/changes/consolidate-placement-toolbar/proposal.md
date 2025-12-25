# Change: Consolidate Placement Mode into Floating Toolbar

## Why

The current Left Panel has a "Placement Mode" section (Navigate/Build/Select) that takes up vertical space and requires users to scroll. Since mode switching is a frequent operation, moving these controls to a floating toolbar over the viewport provides faster access and better UX.

## What Changes

- **Move Placement Mode controls** from `AssetPalette` (Left Panel) to viewport floating toolbar
- **Enhance `SelectionToolbar`** component to include placement modes (Navigate/Build/Select)
- **Consolidate tools** in one floating toolbar with two sections: Modes + Tools
- **Remove** Placement Mode section from `AssetPalette`
- **Keep** Selection Type (Box/Smart), Build Area, Manual assets, Quick Actions in Left Panel

## Impact

### UI Components Affected:
- `AssetPalette/index.tsx` - Remove Placement Mode section (~30 lines)
- `SelectionToolbar/index.tsx` - Already has most functionality, minor consolidation
- `App.tsx` - Update toolbar integration

### State Changes:
- No state migration needed - using existing state management
- Keyboard shortcuts remain the same (N=Navigate, B=Build, S=Select)

### Visual Changes:
- Floating toolbar position: Left edge of viewport
- Glassmorphism styling for dark theme consistency
- Compact icons with keyboard shortcut hints

## Non-Goals

- This change does NOT alter placement logic
- This change does NOT modify the P/T/F/S tools (existing functionality)
- This change does NOT affect Topology or Placement tabs
