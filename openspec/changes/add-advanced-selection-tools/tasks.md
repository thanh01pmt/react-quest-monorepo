# Implementation Tasks

## Phase 1: Foundation (Week 1-2)

### 1.1 Smart Select Tool
- [x] 1.1.1 Create `SelectionEngine` utility class
  - [x] Implement BFS graph traversal
  - [x] Add adjacency detection (6-direction 3D neighbors)
  - [x] Add visited set tracking
  - [x] Unit tests for connected component algorithm
  
- [ ] 1.1.2 Integrate Smart Select into UI
  - [ ] Add "Smart Select" button to Toolbar
  - [ ] Bind `S` keyboard shortcut
  - [ ] Visual feedback: Highlight connected tiles on hover
  - [ ] Click to execute selection
  
- [ ] 1.1.3 UX Polish
  - [ ] Loading indicator for large selections (>100 tiles)
  - [ ] Preview mode before confirming
  - [ ] Cancel with Esc key

### 1.2 Move Tool (Polish)
- [ ] 1.2.1 Add visual gizmo component
  - [ ] Create `TransformGizmo` React component
  - [ ] Render 3-axis arrows (X=red, Y=green, Z=blue)
  - [ ] Raycasting for axis selection
  
- [ ] 1.2.2 Add Move Mode to Toolbar
  - [ ] "Move" tool button with icon
  - [ ] Toggle active state
  - [ ] Bind `G` shortcut (Blender-style)
  
- [ ] 1.2.3 Snap to Grid option
  - [ ] Toggle button in toolbar
  - [ ] Round positions to nearest integer
  - [ ] Persistent setting (localStorage)

### 1.3 Rotate Tool (Polish)
- [ ] 1.3.1 Add rotation gizmo
  - [ ] Render circular ring around selection
  - [ ] Interactive drag to rotate
  - [ ] Visual angle indicator
  
- [ ] 1.3.2 Snap angle option
  - [ ] Dropdown: Free / 45° / 90°
  - [ ] Apply snapping during rotation
  
- [ ] 1.3.3 Fix center calculation
  - [ ] Verify rotation around selection center
  - [ ] Edge case: Single object vs multi-object
  - [ ] Test with asymmetric selections

---

## Phase 2: Smart Fill (Week 3)

### 2.1 Flood Fill Algorithm
- [ ] 2.1.1 Create `FloodFill` utility
  - [ ] Implement BFS-based flood fill
  - [ ] Respect wall/obstacle boundaries
  - [ ] Optimize for large areas (>1000 tiles)
  
- [ ] 2.1.2 Walkable tile detection
  - [ ] Check if tile has no obst object
  - [ ] Same Y-level constraint
  - [ ] Unit tests for edge cases
  
- [ ] 2.1.3 Batch placement optimization
  - [ ] Single history entry for entire fill
  - [ ] Efficient state update (avoid re-renders)

### 2.2 Fill Tool UI
- [ ] 2.2.1 Add Fill button to Toolbar
  - [ ] Paint bucket icon
  - [ ] Bind `F` keyboard shortcut
  
- [ ] 2.2.2 Fill preview
  - [ ] Hover to show fill area (yellow overlay)
  - [ ] Display tile count
  - [ ] Click to confirm
  
- [ ] 2.2.3 Undo/Redo integration
  - [ ] Test fill + undo
  - [ ] Test fill + redo
  - [ ] Performance with large fills

---

## Phase 3: Symmetry Mode (Week 4)

### 3.1 Symmetry Core Logic
- [ ] 3.1.1 Create `SymmetryMode` class
  - [ ] Mirror position calculator
  - [ ] Duplicate mode implementation
  - [ ] Axis selection (X, Z)
  - [ ] Configurable center line
  
- [ ] 3.1.2 Object mirroring
  - [ ] Mirror position across axis
  - [ ] Mirror rotation across axis
  - [ ] Handle special cases (portals, switches)

### 3.2 Symmetry UI
- [ ] 3.2.1 Symmetry panel (Right sidebar)
  - [ ] Enable/Disable toggle
  - [ ] Mode: Duplicate only (Phase 1)
  - [ ] Axis selector (X / Z)
  - [ ] Center line input
  
- [ ] 3.2.2 Visual indicators
  - [ ] Draw symmetry axis line on grid
  - [ ] Preview mirrored objects (semi-transparent)
  
- [ ] 3.2.3 Integration with placement
  - [ ] Hook into `handleAddObject`
  - [ ] Auto-create mirrored copy
  - [ ] Both added to history as single action

---

## Phase 4: Pattern Tool (Week 5)

### 4.1 Pattern Data Model
- [ ] 4.1.1 Define Pattern type
  ```typescript
  interface Pattern {
    id: string;
    name: string;
    size: { width: number; height: number; depth: number };
    objects: PlacedObject[];
    thumbnail?: string;
    createdAt: Date;
  }
  ```
  
- [ ] 4.1.2 Pattern storage
  - [ ] LocalStorage for patterns (<5MB limit)
  - [ ] Export pattern to JSON file
  - [ ] Import pattern from JSON file

### 4.2 Save Pattern Flow
- [ ] 4.2.1 "Save as Pattern" button
  - [ ] Right-click menu option
  - [ ] Only enabled when selection exists
  
- [ ] 4.2.2 Save dialog
  - [ ] Name input field
  - [ ] Category dropdown (optional)
  - [ ] Preview thumbnail generation
  - [ ] Save to library
  
- [ ] 4.2.3 Pattern validation
  - [ ] Check pattern size limits
  - [ ] Ensure unique name
  - [ ] Handle empty selections

### 4.3 Pattern Library UI
- [ ] 4.3.1 Pattern panel (Left sidebar tab)
  - [ ] Grid view of patterns
  - [ ] Filter by category
  - [ ] Search patterns
  
- [ ] 4.3.2 Pattern preview
  - [ ] Hover to preview
  - [ ] Click to select
  - [ ] Delete pattern button
  
- [ ] 4.3.3 Pattern placement
  - [ ] Follow cursor with preview
  - [ ] Rotate/flip before placing
  - [ ] Click to confirm placement

---

## Phase 5: Area Clone (Week 6)

### 5.1 Clone Core Logic
- [ ] 5.1.1 Enhanced copy logic
  - [ ] Deep clone selected objects
  - [ ] Preserve relative positions
  - [ ] Generate new IDs
  
- [ ] 5.1.2 Transform options
  - [ ] Offset (X, Y, Z)
  - [ ] Rotate (0°, 90°, 180°, 270°)
  - [ ] Flip (X, Z axes)

### 5.2 Clone UI
- [ ] 5.2.1 Keyboard shortcuts
  - [ ] Ctrl+C: Copy selection
  - [ ] Ctrl+V: Paste (simple)
  - [ ] Ctrl+Shift+V: Paste with options dialog
  
- [ ] 5.2.2 Paste Options Dialog
  - [ ] Offset inputs (X, Y, Z)
  - [ ] Rotation dropdown
  - [ ] Flip checkboxes
  - [ ] Multi-paste options
  - [ ] Preview button
  
- [ ] 5.2.3 Multi-paste (array)
  - [ ] Count input
  - [ ] Spacing input
  - [ ] Direction (X, Y, or Z)
  - [ ] Preview array

---

## Testing

### Integration Tests
- [ ] Test all tools with undo/redo
- [ ] Test tool combinations (e.g., Smart Select + Rotate)
- [ ] Test performance with 1000+ objects
- [ ] Test on different map sizes

### User Acceptance Tests
- [ ] Create test map using only new tools
- [ ] Measure time vs old workflow
- [ ] Collect user feedback (5-10 users)
- [ ] Iterate based on feedback

### Edge Cases
- [ ] Empty selection handling
- [ ] Out-of-bounds transforms
- [ ] Collision detection during moves
- [ ] Pattern with invalid objects
- [ ] Symmetry with odd-sized selections

---

## Documentation

- [ ] Update user guide with tool descriptions
- [ ] Create video tutorials (30-60s each)
- [ ] Add tooltips to all new buttons
- [ ] Update keyboard shortcut reference
- [ ] Write API docs for shared utilities

---

## Performance Optimization

- [ ] Profile Smart Select with 500+ tiles
- [ ] Optimize Fill algorithm for 1000+ tiles
- [ ] Pattern loading: Async + loading state
- [ ] Reduce re-renders during transform
- [ ] Memoize expensive calculations

---

## Rollout

### Alpha (Internal Testing)
- [ ] Deploy to staging
- [ ] Team members test for 1 week
- [ ] Fix critical bugs

### Beta (Limited Users)
- [ ] Release to 10-20 beta testers
- [ ] Collect feedback
- [ ] Iterate on UX

### Production Release
- [ ] Announce new features
- [ ] Create release notes
- [ ] Monitor error reports
- [ ] Plan follow-up improvements
