# FINAL INTEGRATION STEPS

## ✅ COMPLETED:
1. Removed SelectionToolbar component
2. Fixed toolMode references in App.tsx
3. Added Smart Select toggle to AssetPalette component  
4. Added CSS styling for toggle buttons

## ⏳ REMAINING - Manual Edits Needed:

### 1. Add props to AssetPalette in App.tsx (line ~2134-2136)

Add these two lines before the closing `/>`:
```tsx
                onImportMap={handleImportMap}
                // Smart selection
                selectionMode={selectionMode}
                onSelectionModeChange={handleSelectionModeChange}
              />
```

### 2. Integrate smart select click into BuilderScene

Need to pass handleSmartSelect to BuilderScene and update click logic.

**In App.tsx,** find where BuilderScene is rendered (line ~2230) and add:
```tsx
<BuilderScene
  // ... existing props
  onSmartSelect={handleSmartSelect}  // ADD THIS
  onObjectHover={handleObjectHover}  // ADD THIS  
  hoverPreviewIds={hoverPreviewIds}  // ADD THIS
  selectionMode={selectionMode}      // ADD THIS
/>
```

**In BuilderScene/index.tsx:**
1. Add to BuilderSceneProps interface:
```tsx
onSmartSelect?: (objectId: string) => void;
onObjectHover?: (objectId: string | null) => void;
hoverPreviewIds?: string[];
selectionMode?: 'box' | 'smart';
```

2. Update click handler to use smart select when mode is 'smart':
```tsx
onClick={(e) => {
  if (selectionMode === 'smart' && onSmartSelect) {
    onSmartSelect(objectId);
  } else {
    onSelectObject(objectId, e.shiftKey);
  }
}}
```

3. Add onPointerMove for hover preview:
```tsx
onPointerMove={(e) => {
  if (selectionMode === 'smart' && onObjectHover) {
    const objectId = getObjectIdFromEvent(e);
    onObjectHover(objectId);
  }
}}
```

## 🎯 EXPECTED RESULT:

1. Toggle appears in AssetPalette when "Navigate" mode active
2. Click "Smart" → selectionMode = 'smart'  
3. Press S key → selectionMode = 'smart'
4. Click on tile → All connected tiles selected
5. Hover on tile → Preview connected tiles (yellow)

## 📝 Testing Checklist:

- [ ] Smart Select toggle visible in Manual panel
- [ ] S key activates Smart Select
- [ ] Click selects all connected tiles
- [ ] Hover shows preview (yellow overlay)
- [ ] Works with layer filtering (ground vs items)
- [ ] Esc clears selection
