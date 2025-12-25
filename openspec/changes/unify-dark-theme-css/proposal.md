# Change: Unify Dark Theme CSS for Map Builder App

## Why

The map-builder-app has accumulated CSS inconsistencies during development. Multiple components use hardcoded color values instead of CSS variables, and there are variations in background colors, border colors, border radius, and accent colors across the application. This creates visual dissonance and makes theme maintenance difficult.

## What Changes

### 1. Enhance `theme.css` Design Tokens
- Add missing CSS variables for common patterns:
  - `--bg-input` for input fields
  - `--bg-hover` for hover states  
  - `--border-solid` for non-transparent borders
  - `--radius-xs` (4px) and `--radius-xl` (16px)
  - `--text-label` for label colors

### 2. Unify Background Colors
- Standardize panel backgrounds to use `--bg-secondary` or defined variables
- Replace hardcoded values: `#1e1e1e`, `#252525`, `#252528`, `#2a2a2a` → CSS variables
- Unify floating toolbar backgrounds: `rgba(30, 30, 36, 0.95)`

### 3. Unify Border Colors
- Replace hardcoded `#444`, `#555`, `#333`, `#3c3c41` with `--border-default` or `--border-solid`
- Standardize border-bottom for sections

### 4. Unify Accent Colors
- **BREAKING**: Replace Bootstrap blue (`#007bff`) with theme accent (`#6366f1`)
- Affected components: TopologyPanel, ActionBar, JsonOutputPanel, App.css toggles
- Replace `#4a9eff` (tabs) with consistent accent variant

### 5. Unify Border Radius  
- Remove non-standard values: `14px`, `10px`, `16px`
- Map to theme tokens: `--radius-sm (6px)`, `--radius-md (8px)`, `--radius-lg (12px)`

### 6. Reduce Inline CSS
- Extract common inline styles to CSS classes
- Focus on high-usage components: `CenterToolbar`, `SolutionDebugPanel`, `QuestDetailsPanel`

## Impact

### Files to Modify

| Category | Files |
|----------|-------|
| **Core Theme** | `styles/theme.css`, `index.css` |
| **Main Layout** | `App.css` |
| **Panels** | `MainLeftPanel.css`, `PropertiesPanel.css`, `QuestDetailsPanel.css`, `TopologyPanel.css`, `JsonOutputPanel.css` |
| **Toolbars** | `CenterToolbar.css`, `ActionBar.css`, `SelectionToolbar.css`, `ViewportToolbar.css` |
| **Tabs/Sections** | `RightPanelTabs.css`, `CollapsibleSection.css` |
| **Modals** | `WelcomeModal.css` |
| **Components** | `TemplateManager.css`, `ValidationReport.css`, `Tooltip.css` |
| **TSX (inline)** | `CenterToolbar/index.tsx`, `SolutionDebugPanel/index.tsx`, `QuestDetailsPanel/index.tsx` |

### Visual Changes
- Accent color shift from blue (#007bff) to indigo (#6366f1) for primary buttons
- More consistent panel and card backgrounds
- Unified border appearance

## Risks

- **Visual regression**: Color changes may affect readability in some components
- **Specificity conflicts**: Some overrides may not apply if specificity is lower
