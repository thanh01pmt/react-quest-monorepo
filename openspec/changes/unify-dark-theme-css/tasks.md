# Tasks: Unify Dark Theme CSS

## 1. Update Core Theme Files
- [ ] 1.1 Add missing CSS variables to `theme.css` (--bg-input, --bg-hover, --border-solid, --radius-xs, --radius-xl, --text-label)
- [ ] 1.2 Update `index.css` root background to use CSS variable

## 2. Update Main Layout Styles
- [ ] 2.1 Replace hardcoded colors in `App.css` with CSS variables
- [ ] 2.2 Update accent color from `#007bff` to `var(--accent-primary)` in `App.css`

## 3. Update Panel Styles
- [ ] 3.1 Update `MainLeftPanel.css` - normalize border radius values
- [ ] 3.2 Update `PropertiesPanel.css` - replace hardcoded colors with variables
- [ ] 3.3 Update `QuestDetailsPanel.css` - unify backgrounds, borders, and add utility classes
- [ ] 3.4 Update `TopologyPanel.css` - replace `#007bff` with accent, unify borders
- [ ] 3.5 Update `JsonOutputPanel.css` - replace Bootstrap colors with theme colors

## 4. Update Toolbar Styles
- [ ] 4.1 Update `CenterToolbar.css` - add classes for symmetry popup inline styles
- [ ] 4.2 Update `ActionBar.css` - replace `#007bff` with `var(--accent-primary)`
- [ ] 4.3 Update `SelectionToolbar.css` - unify background colors
- [ ] 4.4 Update `ViewportToolbar.css` - align with MainLeftPanel glass effect

## 5. Update Tab and Section Styles
- [ ] 5.1 Update `RightPanelTabs.css` - use theme background variables
- [ ] 5.2 Update `CollapsibleSection.css` - replace hardcoded colors

## 6. Update Modal and Component Styles
- [ ] 6.1 Normalize `WelcomeModal.css` border radius to theme tokens
- [ ] 6.2 Update `TemplateManager.css` - already uses CSS vars, verify consistency
- [ ] 6.3 Update `ValidationReport.css` - already uses CSS vars, verify consistency
- [ ] 6.4 Update `Tooltip.css` - minor adjustments if needed

## 7. Reduce Inline CSS in TSX Files
- [ ] 7.1 Extract inline styles from `CenterToolbar/index.tsx` to CSS classes
- [ ] 7.2 Extract inline styles from `SolutionDebugPanel/index.tsx` to CSS classes  
- [ ] 7.3 Extract inline styles from `QuestDetailsPanel/index.tsx` to CSS classes

## 8. Verification
- [ ] 8.1 Visual inspection of all components in browser
- [ ] 8.2 Verify no CSS compilation errors
- [ ] 8.3 Check dark theme consistency across all panels
