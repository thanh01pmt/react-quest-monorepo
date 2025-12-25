# Tasks: Consolidate Placement Mode into Floating Toolbar

## 1. Create ViewportToolbar Component

### 1.1 Core Structure
- [x] 1.1.1 Create new `ViewportToolbar` component (compact mode)
- [x] 1.1.2 Merge Navigate + Select into unified "Select" mode (S)
- [x] 1.1.3 Keep Build mode (B)
- [x] 1.1.4 Show selection type toggle (Box/Smart) when expanded
- [x] 1.1.5 Add keyboard shortcut hints (S, B)

### 1.2 Compact/Expand Behavior
- [x] 1.2.1 Default: Show only S/B letters (like PTFS icons)
- [x] 1.2.2 Hover: Expand to show icons + labels
- [x] 1.2.3 Show "Shift+Drag: Area" hint in Select mode

### 1.3 Styling
- [x] 1.3.1 Apply glassmorphism effect (semi-transparent, blur)
- [x] 1.3.2 Add hover states and active mode highlighting
- [x] 1.3.3 Ensure dark theme consistency
- [ ] 1.3.4 Make toolbar draggable (optional enhancement)

## 2. Update AssetPalette Component

### 2.1 Remove Placement Mode Section
- [x] 2.1.1 Remove "Placement Mode" section from AssetPalette
- [ ] 2.1.2 Remove unused props: `currentMode`, `onModeChange` (optional cleanup)
- [x] 2.1.3 Keep Selection Type in ViewportToolbar instead

### 2.2 Verify Layout
- [x] 2.2.1 Ensure Build Area section remains accessible
- [x] 2.2.2 Verify asset groups still display correctly
- [x] 2.2.3 Verify Selection Volume controls work

## 3. Update App.tsx Integration

### 3.1 Toolbar Integration
- [x] 3.1.1 Import and use new `ViewportToolbar` component
- [x] 3.1.2 Pass placement mode state to toolbar
- [x] 3.1.3 Update keyboard shortcut handlers (S = Select mode, B = Build)
- [ ] 3.1.4 Clean up removed props from AssetPalette (optional)

### 3.2 Mode Logic
- [x] 3.2.1 Verify mode state flows correctly to toolbar
- [x] 3.2.2 Ensure selection mode (Box/Smart) works from toolbar
- [x] 3.2.3 Implement Shift+Drag for area selection in Select mode

### 3.3 Camera Controls
- [x] 3.3.1 Disable camera left-click when Shift is held (for area selection)
- [x] 3.3.2 Verify right-click still controls camera

## 4. Testing & Polish

### 4.1 Functional Testing
- [ ] 4.1.1 Test Select mode: Click to select objects
- [ ] 4.1.2 Test Select mode: Shift+Drag for area selection
- [ ] 4.1.3 Test Build mode: Place objects
- [ ] 4.1.4 Test Box vs Smart selection
- [ ] 4.1.5 Test keyboard shortcuts S/B

### 4.2 Visual Testing
- [ ] 4.2.1 Verify compact mode shows S/B only
- [ ] 4.2.2 Verify expanded mode shows icons + labels
- [ ] 4.2.3 Check glassmorphism effect
- [ ] 4.2.4 Test active state indication

### 4.3 Regression Testing
- [ ] 4.3.1 Verify Left Panel still functions correctly
- [ ] 4.3.2 Verify Selection Volume controls work
- [ ] 4.3.3 Verify import/export still accessible
