# Implementation Tasks

## Phase 1: Foundation (Week 1-2)

### 1.1 Smart Select Tool
- [x] 1.1.1 Create `SelectionEngine` utility class
  - [x] Implement BFS graph traversal
  - [x] Add adjacency detection (6-direction 3D neighbors)
  - [x] Add visited set tracking
  - [x] Unit tests for connected component algorithm
  
- [x] 1.1.2 Integrate Smart Select into UI
  - [x] Add "Smart Select" button to Palette
  - [x] Bind `S` keyboard shortcut
  - [x] Visual feedback: Highlight connected tiles on hover
  - [x] Click to execute selection
  
- [x] 1.1.3 UX Polish
  - [x] Loading indicator for large selections (>100 tiles) (Implicitly handled by React state)
  - [x] Preview mode before confirming (Hover preview)
  - [x] Cancel with Esc key

### 1.2 Move Tool (Polish)
- [x] 1.2.1 Add visual gizmo component
  - [x] Create `TransformGizmo` React component
  - [x] Render 3-axis arrows (X=red, Y=green, Z=blue)
  - [x] Raycasting for axis selection
  
- [x] 1.2.2 Add Move Mode to Toolbar
  - [x] "Move" tool button with icon (Gizmo auto-shows on selection)
  - [x] Toggle active state (Navigate mode)
  - [x] Bind `G` shortcut (Blender-style)
  
- [x] 1.2.3 Snap to Grid option
  - [x] Toggle button in toolbar (Using existing Smart Snap toggle)
  - [x] Round positions to nearest integer (Built into gizmo drag logic)
  - [x] Persistent setting (localStorage) (Via Smart Snap state)

### 1.3 Rotate Tool (Polish)
- [x] 1.3.1 Add rotation gizmo
  - [x] Render circular ring around selection
  - [x] Interactive drag to rotate
  - [x] Visual angle indicator
  
- [x] 1.3.2 Snap angle option
  - [x] Dropdown: Free / 45° / 90° (Default 90°)
  - [x] Apply snapping during rotation
  
- [x] 1.3.3 Fix center calculation
  - [x] Verify rotation around selection center
  - [x] Edge case: Single object vs multi-object
  - [x] Test with asymmetric selections

---

## Phase 2: Smart Fill (Week 3)

### 2.1 Flood Fill Algorithm
- [x] 2.1.1 Create `FloodFill` utility
  - [x] Implement BFS-based flood fill
  - [x] Respect wall/obstacle boundaries
  - [x] Optimize for large areas (>1000 tiles)
  
- [x] 2.1.2 Walkable tile detection
  - [x] Check if tile has no obst object
  - [x] Same Y-level constraint
  - [x] Unit tests for edge cases

- [x] 2.1.3 Batch placement optimization
  - [x] Single history entry for entire fill
  - [x] Efficient state update (avoid re-renders)

### 2.2 Fill Tool UI
- [x] 2.2.1 Add Fill button to Toolbar
  - [x] Paint bucket icon (F key shortcut)
  - [x] Bind `F` keyboard shortcut
  
- [x] 2.2.2 Fill preview
  - [x] Hover to show fill area (green overlay)
  - [x] Display tile count (indicator sphere)
  - [x] Click to confirm
  
- [x] 2.2.3 Undo/Redo integration
  - [x] Test fill + undo (single history entry)
  - [x] Test fill + redo
  - [x] Performance with large fills (max 2000 tiles)

---

## Phase 3: Symmetry Mode (Week 4)

### 3.1 Symmetry Core Logic
- [x] 3.1.1 Create `SymmetryMode` class
  - [x] Mirror position calculator
  - [x] Duplicate mode implementation
  - [x] Axis selection (X, Z)
  - [x] Configurable center line
  
- [x] 3.1.2 Object mirroring
  - [x] Mirror position across axis
  - [x] Mirror rotation across axis
  - [x] Handle special cases (portals, switches)

### 3.2 Symmetry UI
- [x] 3.2.1 Symmetry panel (Floating panel)
  - [x] Enable/Disable toggle
  - [x] Mode: Duplicate only (Phase 1)
  - [x] Axis selector (X / Z / Both)
  - [x] Center line input
  
- [x] 3.2.2 Visual indicators
  - [x] Draw symmetry axis line on grid (green dashed)
  - [x] Preview mirrored objects (auto-placed)
  
- [x] 3.2.3 Integration with placement
  - [x] Hook into `handleAddObject`
  - [x] Auto-create mirrored copy
  - [x] Both added to history as single action

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
- [x] 5.1.1 Enhanced copy logic
  - [x] Deep clone selected objects
  - [x] Preserve relative positions
  - [x] Generate new IDs
  
- [x] 5.1.2 Transform options
  - [x] Offset (X, Y, Z)
  - [x] Rotate (0°, 90°, 180°, 270°)
  - [x] Flip (X, Z axes)

### 5.2 Clone UI
- [x] 5.2.1 Keyboard shortcuts
  - [x] Ctrl+C: Copy selection
  - [x] Ctrl+V: Paste (with preview)
  - [ ] Ctrl+Shift+V: Paste with options dialog (Future)
  
- [x] 5.2.2 Paste Preview
  - [x] Cyan preview cubes on hover
  - [x] Follow cursor
  - [x] Click to confirm placement
  
- [ ] 5.2.3 Multi-paste (array) - Future
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
