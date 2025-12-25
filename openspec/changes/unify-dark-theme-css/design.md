# Design: Dark Theme CSS Unification

## Context

The map-builder-app was developed incrementally, resulting in CSS inconsistencies across 20+ component files. Analysis identified:
- 8+ different background color variations
- 5+ different border color patterns
- 6+ non-standard border radius values
- 2 competing accent color schemes (Bootstrap blue vs Indigo)
- 150+ inline styles in TSX files

## Goals

1. **Single Source of Truth**: All colors, spacing, and radii defined in `theme.css`
2. **Consistency**: Visual uniformity across all components
3. **Maintainability**: Easy theme updates by changing CSS variables
4. **Reduced Inline Styles**: Move 80%+ of inline styles to CSS classes

## Non-Goals

- Complete redesign of component layouts
- Adding new visual features
- Changing functionality

## Decisions

### D1: Unified Color Palette

| Token | Old Values | New Value |
|-------|------------|-----------|
| Panel background | `#2a2a2e`, `#2a2a2a`, `#252525` | `var(--bg-secondary)` = `#1e1e28` |
| Input background | `#1e1e1e`, `#1a1a1a`, `#252528` | `var(--bg-input)` = `#1a1a22` |
| Hover background | `#3c3c41`, `#333338` | `var(--bg-hover)` = `#2a2a38` |
| Primary border | `#444`, `#555`, `#3c3c41` | `var(--border-solid)` = `#3a3a45` |
| Primary accent | `#007bff`, `#4a9eff` | `var(--accent-primary)` = `#6366f1` |
| Label text | `#888`, `#999` | `var(--text-label)` = `#888888` |

### D2: Unified Border Radius Scale

| Token | Value | Usage |
|-------|-------|-------|
| `--radius-xs` | 4px | Badges, small buttons |
| `--radius-sm` | 6px | Inputs, buttons |
| `--radius-md` | 8px | Cards, panels |
| `--radius-lg` | 12px | Sidebars, floating toolbars |
| `--radius-xl` | 16px | Modals |

### D3: Floating Toolbar Glass Effect (Standardized)

```css
background: rgba(30, 30, 36, 0.95);
backdrop-filter: blur(10px);
border: 1px solid var(--border-default);
border-radius: var(--radius-lg);
box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
```

### D4: Inline Style Extraction Pattern

Before (TSX):
```tsx
<div style={{ background: '#333', padding: '8px', borderRadius: '4px' }}>
```

After (TSX + CSS):
```tsx
<div className="control-group">
```
```css
.control-group {
  background: var(--bg-tertiary);
  padding: var(--spacing-sm);
  border-radius: var(--radius-xs);
}
```

## Risks / Trade-offs

| Risk | Mitigation |
|------|------------|
| Accent color change affects user expectation | Keep gradient style for buttons, only change base color |
| CSS variable browser support | All modern browsers supported, no IE11 requirement |
| Inline style removal may miss edge cases | Incremental approach, test each component |

## Migration Plan

1. **Phase 1**: Update `theme.css` with new tokens (backward compatible)
2. **Phase 2**: Update CSS files one by one, verify visually
3. **Phase 3**: Extract inline styles to classes
4. **Phase 4**: Final visual QA

## Open Questions

1. Should we add a light theme option in the future? (Out of scope, but CSS variables make this possible)
