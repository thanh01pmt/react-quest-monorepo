# Map Builder Tools Proposal

**Date:** 2025-12-25  
**Purpose:** Propose new tools to accelerate manual map design and enable hybrid manual-topology workflows  
**Status:** Design Phase

---

## 📋 Executive Summary

Current map builder has two workflows:
- **Manual Mode:** Click-to-place, tedious for large maps
- **Topology Mode:** Auto-generate complete maps, all-or-nothing

**Gap:** No tools for rapid manual building or hybrid workflows.

**Proposal:** Add 11 new tools in 3 tiers to improve productivity by 5-10x.

---

## 🛠️ Tool Catalog

### Tier 1: Quick Wins (High Priority, Easy Implementation)

#### 1. Brush Tool 🖌️

**Problem:** Placing 100+ tiles one-by-one is tedious  
**Solution:** Click & drag to paint multiple tiles

**Features:**
- Adjustable brush size (1x1, 3x3, 5x5, 7x7)
- Works with any asset (ground, walls, items)
- Optional: Randomize rotation per tile
- Shortcut: `B` to activate

**UI Mockup:**
```
┌─────────────────────────┐
│ [🖌️] Brush Tool         │
├─────────────────────────┤
│ Brush Size: [●●○○○] 3   │
│ ☐ Randomize Rotation    │
│ ☑ Preview on Hover      │
└─────────────────────────┘
```

**Use Cases:**
- Paint large floor areas in seconds
- Create walls by dragging along edges
- Place decorative items in patterns

**Expected Impact:** 10x faster terrain creation

---

#### 2. Smart Fill Tool 🪣

**Problem:** Filling enclosed areas requires many clicks  
**Solution:** Flood fill like Photoshop bucket tool

**Features:**
- Click enclosed area to fill with selected asset
- Respects walls and obstacles
- Optional: Fill with pattern (checkerboard, stripes)
- Shortcut: `F` for fill mode

**Algorithm:**
```typescript
function floodFill(startPos: Coord, asset: BuildableAsset) {
  const toFill = findEnclosedArea(startPos);
  batchPlaceAssets(toFill, asset);
}

function findEnclosedArea(pos: Coord): Coord[] {
  // BFS to find all connected walkable tiles
  // Stop at walls/obstacles
}
```

**Use Cases:**
- Fill room floors instantly
- Fill corridors with ground tiles  
- Replace entire terrain type (e.g., all dirt → grass)

**Expected Impact:** Instant terrain layouts, 20x faster for rooms

---

#### 3. Symmetry Mode ↔️

**Problem:** Creating symmetric maps requires manual mirroring  
**Solution:** Auto-mirror placements across axes

**Features:**
- Toggle X-axis symmetry
- Toggle Z-axis symmetry  
- Set custom symmetry center point
- Works with all placement tools (even Brush)
- Shortcut: `M` to toggle

**UI:**
```
┌─────────────────────────┐
│ [↔️] Symmetry Mode       │
├─────────────────────────┤
│ ☑ Mirror X-axis         │
│ ☑ Mirror Z-axis         │
│ Center: [7, 0, 7]       │
│ [Set Center from Cursor]│
└─────────────────────────┘
```

**Implementation:**
```typescript
class SymmetryMode {
  mirrorX: boolean;
  mirrorZ: boolean;
  center: Coord;
  
  onPlace(pos: Coord, asset: BuildableAsset) {
    const placements = [pos];
    
    if (this.mirrorX) {
      placements.push(this.mirrorAcrossX(pos));
    }
    if (this.mirrorZ) {
      placements.push(this.mirrorAcrossZ(pos));
    }
    if (this.mirrorX && this.mirrorZ) {
      placements.push(this.mirrorAcrossBoth(pos));
    }
    
    placements.forEach(p => placeAsset(p, asset));
  }
}
```

**Use Cases:**
- Build perfectly symmetric mazes
- Create balanced challenge maps
- Design aesthetic structures

**Expected Impact:** Perfect symmetry, 2x productivity for symmetric maps

---

#### 4. Pattern Tool 🔲

**Problem:** No way to reuse custom structures  
**Solution:** Save & stamp patterns

**Features:**
- Box select area → Save as pattern
- Library of saved patterns
- Stamp anywhere with rotation/flip
- Export/import patterns as JSON

**Workflow:**
```
1. Box select area (Shift+Drag)
2. Right-click → "Save as Pattern"
3. Name pattern: "L-Corridor"
4. Click Pattern tool → Select pattern → Stamp
```

**UI:**
```
┌─────────────────────────┐
│ [🔲] Pattern Library    │
├─────────────────────────┤
│ ┌─────┐ ┌─────┐ ┌─────┐│
│ │L-Cor│ │Room │ │Stair││
│ │ridor│ │ 3x3 │ │case ││
│ └─────┘ └─────┘ └─────┘│
│                         │
│ Selected: L-Corridor    │
│ [Rotate 90°] [Flip X]   │
│ [Stamp] [Delete]        │
└─────────────────────────┘
```

**Data Format:**
```json
{
  "name": "L-Corridor",
  "size": {"width": 5, "depth": 5},
  "objects": [
    {"asset": "ground.normal", "pos": [0,0,0]},
    {"asset": "wall.brick02", "pos": [0,0,1]}
  ]
}
```

**Use Cases:**
- Repeat room layouts across map
- Build modular dungeon sections
- Share patterns between projects

**Expected Impact:** Reusable structures, 5x faster for repetitive designs

---

### Tier 2: Power User Tools (Medium Priority)

#### 5. Prefab Library 📚

**Problem:** Building from scratch every time  
**Solution:** Pre-built structure templates

**Categories:**
- **Rooms:** Empty, Furnished, Challenge Room, Boss Room
- **Corridors:** Straight, L-shape, T-junction, Cross
- **Puzzles:** Switch Puzzle, Key Puzzle, Portal Maze
- **Decorations:** Fountain, Garden, Rock Formation

**UI:**
```
New Left Panel Tab: "Prefabs"

┌─────────────────────────┐
│ 🔍 Search prefabs...    │
├─────────────────────────┤
│ ▼ Rooms                 │
│   - Empty Room 5x5      │
│   - Challenge Room      │
│   - Boss Arena          │
├─────────────────────────┤
│ ▼ Corridors             │
│   - Straight (5 tiles)  │
│   - L-Corner            │
│   - T-Junction          │
├─────────────────────────┤
│ ▼ Puzzles               │
│   - Switch + Door       │
│   - Key Hunt            │
├─────────────────────────┤
│ ▼ Custom (User-saved)   │
│   - My Puzzle Room      │
└─────────────────────────┘
```

**Features:**
- Drag to canvas to place
- Preview on hover
- Save custom prefabs
- Export/import library

**Starter Pack (20 prefabs):**
```
Rooms:
- Empty_3x3.json
- Empty_5x5.json
- Empty_10x10.json
- Challenge_Room_Switch.json
- Boss_Arena.json

Corridors:
- Straight_3.json
- Straight_5.json
- L_Corner.json
- T_Junction.json
- Cross_Junction.json

Puzzles:
- Switch_Door_Simple.json
- Switch_Door_Multiple.json
- Key_Chest.json
- Portal_Pair.json
- Maze_Cell_4x4.json

Decorations:
- Fountain_Center.json
- Garden_3x3.json
- Rock_Cluster.json
- Tree_Grove.json
- Bridge_5_tiles.json
```

**Expected Impact:** Start designs 10x faster with building blocks

---

#### 6. Area Clone Tool 📋

**Problem:** Copy/paste doesn't preserve 3D structure well  
**Solution:** Enhanced copy with offset & transform

**Features:**
- Copy selected 3D region
- Paste with offset (X, Y, Z)
- Rotate 0°/90°/180°/270° before paste
- Flip X/Z before paste
- Multi-paste (array duplication)

**Shortcuts:**
```
Ctrl+C: Copy selection
Ctrl+V: Paste (follows cursor)
Ctrl+Shift+V: Paste with options dialog
```

**Paste Options Dialog:**
```
┌─────────────────────────┐
│ Paste Options           │
├─────────────────────────┤
│ Offset:                 │
│   X: [+5]  Y: [0]  Z: [0]│
│                         │
│ Transform:              │
│   Rotate: [90° ▼]       │
│   ☐ Flip X  ☐ Flip Z    │
│                         │
│ Multi-Paste:            │
│   Count: [1]            │
│   Spacing: [5] tiles    │
│                         │
│ [Preview] [Paste] [Cancel]│
└─────────────────────────┘
```

**Use Cases:**
- Duplicate complex puzzle rooms
- Create symmetric wings (copy + flip)
- Build repeating corridor sections

**Expected Impact:** Duplicate structures 10x faster

---

#### 7. Quick Terrain Generator 🏔️

**Problem:** Starting with empty canvas is slow  
**Solution:** Generate basic layouts in 1 click

**Presets:**
- **Open Room:** Floor + 4 walls
- **Hallway:** Long straight corridor
- **Arena:** Large open space, no walls
- **Maze Cell:** Room with 4 door openings

**UI (Modal):**
```
┌─────────────────────────┐
│ Quick Terrain Generator │
├─────────────────────────┤
│ Type: [Open Room ▼]     │
│                         │
│ Dimensions:             │
│   Width:  [10]          │
│   Height: [1]           │
│   Depth:  [10]          │
│                         │
│ Materials:              │
│   Ground: [ground.normal▼]│
│   Walls:  [wall.brick02▼] │
│                         │
│ Options:                │
│   ☑ Center on origin    │
│   ☐ Add entrance/exit   │
│                         │
│ [Preview] [Generate]    │
└─────────────────────────┘
```

**Presets Configuration:**
```typescript
const presets = {
  openRoom: {
    description: "Floor with 4 walls",
    generate: (w, h, d, ground, wall) => {
      // Floor
      fillArea([0,0,0], [w,0,d], ground);
      // Walls
      buildWallsAround([0,0,0], [w,h,d], wall);
    }
  },
  hallway: {
    description: "Long straight corridor",
    generate: (length, ground, wall) => {
      // 3-wide corridor
      fillArea([0,0,0], [3,0,length], ground);
      // Side walls
      buildLine([0,0,0], [0,0,length], wall);
      buildLine([2,0,0], [2,0,length], wall);
    }
  }
};
```

**Use Cases:**
- Jump-start new map design
- Create test environments quickly
- Generate base before manual detail work

**Expected Impact:** Save 5-10 minutes per new map

---

#### 8. Item Distribution Tool 🎲

**Problem:** Manually balancing item placement is tedious  
**Solution:** Auto-distribute items based on rules

**Features:**
- Select item type & quantity
- Distribution modes: Random, Evenly Spaced, Path-based
- Constraints: Walkable only, Min distance, Avoid start/end
- Preview before applying

**UI:**
```
┌─────────────────────────┐
│ Distribute Items        │
├─────────────────────────┤
│ Item: [Crystal ▼]       │
│ Count: [5]              │
│                         │
│ Mode:                   │
│  ⦿ Random               │
│  ○ Evenly Spaced        │
│  ○ Along Path           │
│  ○ In Selected Area     │
│                         │
│ Constraints:            │
│  ☑ Only walkable tiles  │
│  ☑ Min distance: [3]    │
│  ☑ Avoid start/finish   │
│  ☐ Prefer dead ends     │
│                         │
│ [Preview] [Apply] [Reset]│
└─────────────────────────┘
```

**Algorithms:**
```typescript
function randomDistribution(item, count, constraints) {
  const candidates = findWalkableTiles()
    .filter(constraints.walkableOnly)
    .filter(tile => distanceToStartFinish(tile) > constraints.minDist);
  
  return selectRandom(candidates, count);
}

function evenlySpaced(item, count, constraints) {
  const candidates = findWalkableTiles();
  const spacing = Math.floor(candidates.length / count);
  
  return candidates.filter((_, i) => i % spacing === 0).slice(0, count);
}

function alongPath(item, count) {
  const pathCoords = getSolutionPath();
  const spacing = Math.floor(pathCoords.length / count);
  
  return pathCoords.filter((_, i) => i % spacing === 0);
}
```

**Use Cases:**
- Balance collectible distribution
- Place enemies evenly
- Ensure items aren't clustered

**Expected Impact:** Perfect item balance in seconds

---

### Tier 3: Advanced Features (Low Priority, High Complexity)

#### 9. Constraint-Based Generation 🎯

**Problem:** Topology generates entire map, can't preserve custom areas  
**Solution:** Hybrid manual + auto workflow

**Concept:**
- Generate base structure with topology
- Manually design key areas (entrance, boss room, puzzle)
- Lock those regions
- Regenerate rest of map for variety
- Locked regions remain untouched

**Workflow:**
```
1. Generate Spiral 3D topology
2. Manually design entrance area (5x5 region)
3. Right-click → "Lock Region"
4. Manually design boss room at top (8x8 region)
5. Lock that region too
6. Click "Regenerate (Preserve Locks)"
7. System generates new spiral path, but keeps locked areas
```

**UI:**
```
Topology Panel:
┌─────────────────────────┐
│ Topology: Spiral 3D     │
│ [Configure...]          │
├─────────────────────────┤
│ Locked Regions: 2       │
│ ┌─────────────────────┐ │
│ │ - Entrance (5x5)    │ │
│ │ - Boss Room (8x8)   │ │
│ └─────────────────────┘ │
├─────────────────────────┤
│ ☑ Preserve Locked Regions│
│ [Generate] [Clear Locks]│
└─────────────────────────┘

Context Menu (Right-click):
│ Lock Region          │
│ Unlock Region        │
│ Lock All Selected    │
```

**Implementation:**
```typescript
class ConstraintBasedGenerator {
  lockedRegions: BoundingBox[] = [];
  
  generate(topology: Topology, config: Config) {
    // 1. Generate full map
    const fullMap = topology.generate(config);
    
    // 2. Preserve locked regions
    const preservedObjects = this.getObjectsInLockedRegions();
    
    // 3. Remove generated objects in locked areas
    const filteredMap = fullMap.filter(obj => 
      !this.isInLockedRegion(obj.position)
    );
    
    // 4. Merge preserved + new
    return [...preservedObjects, ...filteredMap];
  }
}
```

**Use Cases:**
- Regenerate map but keep hand-crafted entrance
- Iterate on topology while preserving key puzzles
- Best of both worlds: speed + control

**Expected Impact:** 10x iteration speed for hybrid designs

---

#### 10. Measurement & Guide Tools 📏

**Problem:** Hard to judge distances and align objects  
**Solution:** Visual measurement and snapping tools

**Features:**

**10.1 Distance Ruler**
- Click 2 points to measure distance
- Shows grid units and visual line
- Shortcut: `R` for ruler mode

**10.2 Path Length Counter**
- Select path → Shows total length
- Useful for balancing map difficulty

**10.3 Grid Overlays**
- Toggle coordinate labels
- Custom grid sizes (0.5, 1.0, 2.0 units)
- Color-coded height levels

**10.4 Object Snapping**
- Snap to nearest object edge (not just grid)
- Align to object centers
- Useful for precise alignment

**UI:**
```
View Menu:
┌─────────────────────────┐
│ 📏 Measurement Tools    │
├─────────────────────────┤
│ ☑ Show Grid Coords      │
│ ☑ Distance Ruler (R)    │
│ ☐ Path Length Counter   │
├─────────────────────────┤
│ Grid Size: [1.0 ▼]      │
│   - 0.5 units (fine)    │
│   - 1.0 units (default) │
│   - 2.0 units (coarse)  │
├─────────────────────────┤
│ Snapping:               │
│ ☑ Snap to Grid          │
│ ☐ Snap to Objects       │
└─────────────────────────┘
```

**Use Cases:**
- Ensure puzzle room is exact size
- Verify corridor width consistency
- Align decorative elements precisely

**Expected Impact:** Precision building, fewer mistakes

---

#### 11. Multi-Generation Preview 🔄

**Problem:** Topology generates 1 result, might not be ideal  
**Solution:** Generate 3-5 variants, choose best

**Features:**
- Generate multiple topology variants at once
- Thumbnail preview of each
- Click to load variant into scene
- Saves generation time via parallel processing

**UI:**
```
┌─────────────────────────────────────┐
│ Topology: Spiral 3D                 │
│ [Configure...] [Generate Variants]  │
├─────────────────────────────────────┤
│ Generating 5 variants...            │
│ [████████████████████] 100%         │
├─────────────────────────────────────┤
│ ┌────┐ ┌────┐ ┌────┐ ┌────┐ ┌────┐ │
│ │ V1 │ │ V2 │ │ V3 │ │ V4 │ │ V5 │ │
│ │★★★│ │★★☆│ │★★★│ │★☆☆│ │★★★│ │
│ └────┘ └────┘ └────┘ └────┘ └────┘ │
│   ↑ Complexity rating               │
│                                     │
│ Selected: Variant 1                 │
│ - Path Length: 45 tiles             │
│ - Collectibles: 8                   │
│ - Difficulty: ★★★☆☆                │
│                                     │
│ [Load Variant] [Regenerate]         │
└─────────────────────────────────────┘
```

**Metrics for Comparison:**
```typescript
interface VariantMetrics {
  pathLength: number;
  collectibleCount: number;
  interactibleCount: number;
  complexity: 1-5; // Calculated from path complexity
  solvability: boolean;
  optimalMoves: number;
}
```

**Use Cases:**
- Explore different map layouts quickly
- Choose most interesting variant
- Find balance between simple/complex

**Expected Impact:** More creative options, better maps

---

## 🔗 Tool Relationships & Dependencies

### Core Infrastructure (All tools depend on these)

```
┌─────────────────────────────────────┐
│   CORE INFRASTRUCTURE               │
├─────────────────────────────────────┤
│ 1. Grid System & Coordinate Logic  │
│ 2. Asset Selection State            │
│ 3. PlacedObject Management          │
│ 4. History/Undo System              │
│ 5. Raycasting & Position Detection  │
└─────────────────────────────────────┘
```

### Tool Dependency Graph

```
Box Select (existing)
  ↓
Pattern Tool (save selection)
  ↓
Area Clone (copy + transform)
  ↓
Prefab Library (pattern storage)


Brush Tool (independent)
  ↓
Fill Tool (uses placement logic from Brush)
  ↓
Item Distribution (uses walkable detection from Fill)


Symmetry Mode (wraps all placement tools)
  ↓
Brush + Symmetry = Symmetric painting
Manual Place + Symmetry = Mirrored building


Quick Terrain Gen (independent)
  ↓
Can become Pattern (save output)


Topology System (existing)
  ↓
Constraint-Based Gen (topology + lock regions)
  ↓
Multi-Generation Preview (batched constraint-based)
```

### Shared Components

#### 1. SelectionManager
**Used by:** Pattern Tool, Area Clone, Prefab System, Constraint-Based Gen

```typescript
class SelectionManager {
  getSelectionBounds(): BoundingBox;
  getObjectsInBounds(bounds: BoundingBox): PlacedObject[];
  transformSelection(
    objects: PlacedObject[], 
    transform: Transform
  ): PlacedObject[];
}
```

---

#### 2. PlacementEngine
**Used by:** Brush, Fill, Quick Terrain, Item Distribution

```typescript
class PlacementEngine {
  validatePosition(pos: Coord): boolean;
  canPlaceAsset(
    asset: BuildableAsset, 
    pos: Coord
  ): boolean;
  batchPlace(placements: Placement[]): void;
  replaceAsset(pos: Coord, newAsset: BuildableAsset): void;
}
```

---

#### 3. TerrainAnalyzer
**Used by:** Fill Tool, Item Distribution, Constraint-Based Gen

```typescript
class TerrainAnalyzer {
  findWalkableTiles(): Coord[];
  findEnclosedArea(startPos: Coord): Coord[];
  getAdjacentTiles(pos: Coord): Coord[];
  getSolutionPath(): Coord[];
  calculatePathLength(): number;
}
```

---

#### 4. TransformUtil
**Used by:** Symmetry Mode, Area Clone, Pattern Tool, Prefab System

```typescript
class TransformUtil {
  mirror(
    objects: PlacedObject[], 
    axis: 'x' | 'z',
    center: Coord
  ): PlacedObject[];
  
  rotate(
    objects: PlacedObject[], 
    degrees: number,
    pivot: Coord
  ): PlacedObject[];
  
  offset(
    objects: PlacedObject[], 
    delta: Coord
  ): PlacedObject[];
}
```

---

### Dependency Matrix

| Tool | Selection | Placement | Terrain | Transform |
|------|-----------|-----------|---------|-----------|
| Brush | | ✓ | | |
| Fill | | ✓ | ✓ | |
| Symmetry | | | | ✓ |
| Pattern | ✓ | ✓ | | ✓ |
| Clone | ✓ | ✓ | | ✓ |
| Quick Terrain | | ✓ | | |
| Item Distribution | | ✓ | ✓ | |
| Prefab | ✓ | ✓ | | ✓ |
| Constraint-Based | ✓ | ✓ | ✓ | ✓ |
| Measurement | | | ✓ | |
| Multi-Preview | ✓ | ✓ | ✓ | |

---

## 📈 Implementation Roadmap

### Phase 1: Foundation (Week 1-2)
**Goal:** Core tools for rapid building

**Deliverables:**
1. ✅ **Brush Tool** - Drag to paint tiles
   - PlacementEngine utility (shared)
   - Brush size selector
   - Preview on hover
   
2. ✅ **Smart Fill** - Flood fill enclosed areas
   - TerrainAnalyzer utility (shared)
   - Flood fill algorithm
   - Preview before fill

3. ✅ **Symmetry Mode** - Mirror placements
   - TransformUtil utility (shared)
   - Toggle for X/Z axes
   - Visual symmetry preview

**Success Metrics:**
- Terrain creation 10x faster
- All shared utilities in place for Phase 2

---

### Phase 2: Productivity (Week 3-4)
**Goal:** Advanced building tools

**Deliverables:**
4. ✅ **Pattern Tool** - Save & stamp structures
   - SelectionManager utility (shared)
   - Pattern library UI
   - Export/import patterns

5. ✅ **Area Clone** - Enhanced copy/paste
   - Paste with offset & rotation
   - Multi-paste support

6. ✅ **Quick Terrain Generator** - 1-click base layouts
   - Preset library (5 presets)
   - Configuration dialog

**Success Metrics:**
- 5x faster for repetitive structures
- Pattern library with 10+ user patterns

---

### Phase 3: Content (Week 5-6)
**Goal:** Prefabs and smart distribution

**Deliverables:**
7. ✅ **Prefab Library** - Pre-built structures
   - 20 starter prefabs
   - Category organization
   - User custom prefabs

8. ✅ **Item Distribution** - Smart item placement
   - Distribution algorithms (random, even, path)
   - Constraint system
   - Preview feature

**Success Metrics:**
- Maps start 10x faster with prefabs
- Perfect item balance in 30 seconds

---

### Phase 4: Advanced (Week 7-8)
**Goal:** Hybrid workflows and refinement

**Deliverables:**
9. ✅ **Constraint-Based Generation** - Lock + regenerate
   - Lock region system
   - Integration with topology
   
10. ✅ **Measurement Tools** - Precision building
    - Distance ruler
    - Grid overlays
    - Object snapping

11. ✅ **Multi-Generation Preview** - Choose best variant
    - Parallel generation
    - Variant comparison UI

**Success Metrics:**
- Hybrid workflow adopted by 50%+ users
- Iteration time reduced 10x

---

## 🎯 Implementation Strategy

### Approach: Hybrid (Bottom-Up + Top-Down)

**Week 1: Prototypes**
- Implement Brush Tool standalone (inline)
- Implement Fill Tool standalone (inline)
- User testing & feedback

**Week 2: Refactor**
- Extract PlacementEngine from Brush/Fill
- Extract TerrainAnalyzer from Fill
- Add Symmetry Mode (uses TransformUtil)

**Week 3-8: Build on Foundation**
- All remaining tools use shared utilities
- Faster development due to reuse
- Consistent behavior across tools

**Benefits:**
- Quick user feedback (Week 1)
- Solid foundation (Week 2)
- Rapid feature development (Week 3+)

---

## 💡 Priority Recommendations

### Must-Have (Before Launch)
1. Brush Tool
2. Fill Tool
3. Symmetry Mode

**Rationale:** These solve the biggest pain points (tedious tile placement) with minimal complexity.

### Should-Have (Version 1.1)
4. Pattern Tool
5. Quick Terrain Generator
6. Prefab Library

**Rationale:** Unlock new workflows, major productivity gains.

### Nice-to-Have (Version 1.2+)
7. Area Clone
8. Item Distribution
9. Measurement Tools

**Rationale:** Polish and advanced features for power users.

### Future (Version 2.0)
10. Constraint-Based Generation
11. Multi-Generation Preview

**Rationale:** Complex features requiring mature topology system.

---

## 📊 Expected Impact Summary

| Tool | Time Saved | Complexity | User Benefit |
|------|------------|------------|--------------|
| Brush | 10x | Low | ⭐⭐⭐⭐⭐ |
| Fill | 20x | Low | ⭐⭐⭐⭐⭐ |
| Symmetry | 2x | Low | ⭐⭐⭐⭐ |
| Pattern | 5x | Medium | ⭐⭐⭐⭐⭐ |
| Clone | 10x | Medium | ⭐⭐⭐⭐ |
| Quick Terrain | 5min/map | Medium | ⭐⭐⭐⭐ |
| Item Distribution | 30sec | Medium | ⭐⭐⭐ |
| Prefab | 10x | High | ⭐⭐⭐⭐⭐ |
| Constraint-Based | 10x iterations | High | ⭐⭐⭐⭐ |
| Measurement | Precision | Low | ⭐⭐⭐ |
| Multi-Preview | Creativity | High | ⭐⭐⭐ |

---

## 🔍 Technical Considerations

### Performance
- **Brush/Fill:** Batch operations for 100+ tiles
- **Pattern/Prefab:** Async loading for large structures
- **Multi-Preview:** Web Workers for parallel generation

### Storage
- **Patterns:** LocalStorage (< 5MB per pattern)
- **Prefabs:** Static JSON files in `/public/prefabs/`
- **User Prefabs:** IndexedDB (unlimited storage)

### Undo/Redo
- All tools must integrate with existing history system
- Batch operations = single undo step
- Pattern placement = single undo step

### Accessibility
- Keyboard shortcuts for all tools
- Visual feedback for active tool
- Tutorial tooltips on first use

---

## 🎨 UI/UX Guidelines

### Tool Activation
```
Primary: Click tool icon in toolbar
Secondary: Keyboard shortcut
Indicator: Active tool highlighted + cursor change
```

### Tool Panels
```
Location: Left sidebar (below Asset Palette)
Behavior: Collapsible, remember state
Max height: 400px (scrollable if needed)
```

### Preview System
```
All placement tools show preview before commit
Preview opacity: 50%
Preview color: Yellow (#FFD700)
Confirm: Left-click
Cancel: Right-click or Esc
```

---

## 📝 Documentation Requirements

### For Each Tool
1. **Purpose:** What problem does it solve?
2. **How to Use:** Step-by-step guide
3. **Shortcuts:** Keyboard shortcuts
4. **Tips & Tricks:** Pro user techniques
5. **Video Tutorial:** 30-60 second demo

### User Onboarding
- Interactive tutorial for new users
- Tooltip hints on first use
- "Tool of the Week" spotlight

---

## 🚀 Success Criteria

### Development
- ✅ All Tier 1 tools working by Week 2
- ✅ All shared utilities tested & documented
- ✅ No regressions in existing features

### User Adoption
- ✅ 80% of users try Brush within first session
- ✅ 50% of users save at least 1 pattern
- ✅ Average map creation time reduced by 50%

### Quality
- ✅ Zero crashes from new tools
- ✅ Undo/Redo works perfectly
- ✅ Performance: 60 FPS with 1000+ objects

---

## 📅 Milestones

| Date | Milestone | Deliverable |
|------|-----------|-------------|
| Week 2 | Tier 1 Complete | Brush, Fill, Symmetry |
| Week 4 | Tier 2 Complete | Pattern, Clone, Quick Terrain |
| Week 6 | Tier 3 Partial | Prefab, Item Distribution |
| Week 8 | Polish & Launch | All tools stable, documented |

---

## 🔄 Next Steps

1. **Review & Approval:** Stakeholder review of proposal
2. **Prototype:** Build Brush Tool proof-of-concept
3. **User Testing:** Test with 5-10 beta users
4. **Iterate:** Refine based on feedback
5. **Full Implementation:** Follow roadmap

---

## 📚 References

- [Current Map Builder App](../apps/map-builder-app/)
- [Topology System](../packages/academic-map-generator/src/generator/topologies/)
- [UI/UX Best Practices](./20251220 - UI_MAP_BUILDER_INTEGRATION.md)

---

**Document Version:** 1.0  
**Last Updated:** 2025-12-25  
**Author:** AI Assistant  
**Status:** Pending Review
