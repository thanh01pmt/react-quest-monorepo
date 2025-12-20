# Changelog

All notable changes to the Map Builder application will be documented in this file.

## [2.0.0] - 2025-12-21

### 🎉 Major Release: Unified UI & Topology Expansion

This release brings significant improvements to the Map Builder with a unified mode architecture, expanded topology library, and enhanced user experience.

### ✨ New Features

#### Topology Expansion (30 Topologies!)
- **Basic (4)**: Simple Path, Straight Line, Zigzag, Staircase
- **Letters (8)**: L, T, U, V, S, H, Z, E/F Shape
- **Symbols (3)**: Plus, Star, Arrow
- **Geometric (2)**: Triangle, Square
- **Complex 2D (6)**: Spiral, Grid, Plowing Field, Grid with Holes, Complex Maze, Interspersed Path
- **Islands (4)**: Plus Islands, Symmetrical Islands, Stepped Clusters, Hub + Islands
- **3D Multi-Level (3)**: Spiral 3D, Staircase 3D, Swift Playground Maze

#### Mode Architecture
- **BuilderModeContext**: Unified state management for manual/auto modes
- **Mode-aware components**: Components respond to current editing mode
- Tab-based mode switching (Assets = Manual, Topology = Auto)

#### Validation System
- **useMapValidation hook**: Real-time validation with debounce
- **usePathTracer hook**: BFS path tracing for manual mode
- **ValidationBadge**: Visual status indicator (✅ Valid / ⚠️ Issues / ❌ Invalid)
- Click-to-expand detailed validation report

#### UI/UX Polish
- **Unified Dark Theme**: 50+ CSS variables for consistent styling
- **Smooth Transitions**: CSS animations for all interactive elements
- **Keyboard Shortcuts**: Global shortcuts with `?` key to view all
- **Tooltip Component**: Reusable tooltips with shortcut display
- **HelpButton**: Floating help button (bottom-right corner)
- **KeyboardShortcutsPanel**: Full reference for all shortcuts

### 🔧 Improvements

#### New Components
- `src/store/builderModeContext.tsx` - Mode context & state management
- `src/components/CommonControls/` - Mode toggle, Layer, Theme, Smart Snap
- `src/components/ActionBar/` - Unified action buttons
- `src/components/BuilderControlPanel/` - Unified left panel container
- `src/components/ValidationBadge/` - Click-to-expand validation badge
- `src/components/CollapsibleSection/` - Reusable collapsible wrapper
- `src/components/Tooltip/` - Tooltip with keyboard shortcuts
- `src/components/KeyboardShortcutsPanel/` - Shortcuts reference panel
- `src/components/HelpButton/` - Floating help button

#### New Hooks
- `src/hooks/useMapValidation.ts` - Unified validation with debounce
- `src/hooks/usePathTracer.ts` - BFS path tracing for manual mode
- `src/hooks/useKeyboardShortcuts.ts` - Global keyboard shortcuts

#### Updated Components
- `WelcomeModal` - Redesigned with new features, mode cards, shortcuts grid
- `TopologyPanel` - Refactored with collapsible sections & post-generate options
- `AssetPalette` - Refactored with collapsible groups
- `MapInspector` - Support for both manual and auto modes

### ⌨️ Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `?` | Show keyboard shortcuts |
| `⌘Z` | Undo |
| `⌘⇧Z` | Redo |
| `Delete` | Delete selected |
| `⌘A` | Select all |
| `R` | Rotate selection |
| `C` | Copy selected |
| `V` | Pointer tool |
| `B` | Brush tool |
| `E` | Eraser tool |
| `G` | Fill tool |
| `⌘Enter` | Generate Map |
| `⇧Enter` | Validate Map |
| `⌘P` | Solve & Preview |

### 📁 File Structure

```
src/
├── components/
│   ├── ActionBar/
│   ├── BuilderControlPanel/
│   ├── CollapsibleSection/
│   ├── CommonControls/
│   ├── HelpButton/
│   ├── KeyboardShortcutsPanel/
│   ├── Tooltip/
│   ├── ValidationBadge/
│   └── WelcomeModal/ (updated)
├── hooks/
│   ├── useKeyboardShortcuts.ts
│   ├── useMapValidation.ts
│   └── usePathTracer.ts
├── map-generator/
│   └── topologies/ (21 new files)
├── store/
│   └── builderModeContext.tsx
└── styles/
    └── theme.css
```

### 🐛 Bug Fixes
- Fixed abstract method implementation in topology classes
- Fixed lint errors in keyboard shortcuts panel

---

## [1.0.0] - Previous Version

Initial release of Map Builder with basic functionality.
