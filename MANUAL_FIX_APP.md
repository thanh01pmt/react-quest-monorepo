# MANUAL FIX REQUIRED - App.tsx

## Lines to Remove/Fix:

### Line ~710-730: Fix handleObjectHover dependency
**Current:**
```tsx
}, [toolMode, selectionMode, placedObjects, activeLayer]);
```

**Change to:**
```tsx
}, [selectionMode, placedObjects, activeLayer]);
```

Also change the condition inside from:
```tsx
if (toolMode !== 'select' || selectionMode !== 'smart' || !objectId) {
```

To:
```tsx
if (selectionMode !== 'smart' || !objectId) {
```

---

### Line ~733-750: REMOVE handleToolModeChange function entirely

**Delete this entire function:**
```tsx
const handleToolModeChange = useCallback((mode: ToolMode) => {
  setToolMode(mode);
  
  // Clear selection when switching away from select mode
  if (mode !== 'select') {
    setSelectedObjectIds([]);
    setHoverPreviewIds([]);
  }
  
  // Update builderMode for compatibility
  if (mode === 'build') {
    setBuilderMode('build-single');
  } else if (mode === 'navigate') {
    setBuilderMode('navigate');
  }
}, []);
```

---

## Summary:
1. Remove `if (toolMode !== 'select' || ...)` check from handleObjectHover (line ~715)
2. Fix dependency array of handleObjectHover (line ~730)
3. Delete entire `handleToolModeChange` function (lines ~733-750)

After these fixes, there should be no more `toolMode` or `ToolMode` references!
