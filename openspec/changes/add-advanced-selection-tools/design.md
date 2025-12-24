# Design Document: Advanced Selection & Transform Tools

## Context

Map Builder currently has minimal editing tools:
- Single-click placement only
- Box selection only  
- Basic move (arrow keys)
- Basic rotate (around individual objects)

Professional 3D editors (Blender, Unity, Unreal) offer:
- Smart selection (flood select, similar materials, etc.)
- Transform gizmos (visual manipulation)
- Symmetry/mirror modes
- Copy/paste with transforms
- Brush/fill painting tools

**Gap:** Our tool is 10-20x slower for large map creation.

---

## Goals

### Must-Have (MVP)
1. **Smart Select:** Select connected geometry in 1 click
2. **Move Tool:** Visual gizmo + snap-to-grid
3. **Rotate Tool:** Visual gizmo + angle snapping
4. **Fill Tool:** Flood fill for terrain

### Should-Have (v1.1)
5. **Symmetry Mode:** Create symmetric structures
6. **Pattern Tool:** Save/reuse common structures
7. **Area Clone:** Advanced copy/paste

### Non-Goals
- Scale tool (conflicts with grid system - see Trade-offs)
- Brush tool (deferred to future)
- Multi-user collaboration
- Animation/keyframes

---

## Architecture

### Core Components

#### 1. SelectionEngine
**Purpose:** Centralized selection logic

```typescript
class SelectionEngine {
  // Smart selection
  selectConnected(startId: string, objects: PlacedObject[]): string[] {
    // BFS graph traversal
    const visited = new Set<string>();
    const queue = [startId];
    
    while (queue.length > 0) {
      const id = queue.shift()!;
      if (visited.has(id)) continue;
      
      visited.add(id);
      const neighbors = this.findAdjacent(id, objects);
      queue.push(...neighbors.map(n => n.id));
    }
    
    return Array.from(visited);
  }
  
  // Find adjacent objects (6-connected in 3D)
  private findAdjacent(id: string, objects: PlacedObject[]): PlacedObject[] {
    const obj = objects.find(o => o.id === id);
    if (!obj) return [];
    
    const [x, y, z] = obj.position;
    const adjacentPositions = [
      [x+1, y, z], [x-1, y, z],  // X-axis
      [x, y+1, z], [x, y-1, z],  // Y-axis
      [x, y, z+1], [x, y, z-1],  // Z-axis
    ];
    
    return objects.filter(o => 
      adjacentPositions.some(pos => 
        o.position[0] === pos[0] &&
        o.position[1] === pos[1] &&
        o.position[2] === pos[2]
      )
    );
  }
}
```

---

#### 2. TransformUtil
**Purpose:** Geometric transformations

```typescript
class TransformUtil {
  // Rotate objects around pivot point
  static rotate(
    objects: PlacedObject[],
    degrees: number,
    pivot: Coord
  ): PlacedObject[] {
    const radians = (degrees * Math.PI) / 180;
    
    return objects.map(obj => {
      // Translate to origin
      const dx = obj.position[0] - pivot[0];
      const dz = obj.position[2] - pivot[2];
      
      // Rotate
      const newDx = dx * Math.cos(radians) - dz * Math.sin(radians);
      const newDz = dx * Math.sin(radians) + dz * Math.cos(radians);
      
      // Translate back
      const newPos: [number, number, number] = [
        Math.round(pivot[0] + newDx),
        obj.position[1], // Y unchanged
        Math.round(pivot[2] + newDz)
      ];
      
      return {
        ...obj,
        position: newPos,
        rotation: [
          obj.rotation[0],
          obj.rotation[1] + radians,
          obj.rotation[2]
        ]
      };
    });
  }
  
  // Mirror objects across axis
  static mirror(
    objects: PlacedObject[],
    axis: 'x' | 'z',
    centerLine: number
  ): PlacedObject[] {
    return objects.map(obj => {
      const newPos = [...obj.position] as [number, number, number];
      
      if (axis === 'x') {
        const dist = obj.position[0] - centerLine;
        newPos[0] = centerLine - dist;
      } else {
        const dist = obj.position[2] - centerLine;
        newPos[2] = centerLine - dist;
      }
      
      return {
        ...obj,
        id: uuidv4(), // New ID for mirrored copy
        position: newPos
      };
    });
  }
  
  // Offset objects by delta
  static offset(
    objects: PlacedObject[],
    delta: Coord
  ): PlacedObject[] {
    return objects.map(obj => ({
      ...obj,
      position: [
        obj.position[0] + delta[0],
        obj.position[1] + delta[1],
        obj.position[2] + delta[2]
      ] as [number, number, number]
    }));
  }
}
```

---

#### 3. FloodFill
**Purpose:** Smart fill algorithm

```typescript
class FloodFill {
  static fill(
    startPos: Coord,
    targetAsset: BuildableAsset,
    existingObjects: PlacedObject[]
  ): Coord[] {
    const toFill: Coord[] = [];
    const visited = new Set<string>();
    const queue = [startPos];
    
    // Build position map for O(1) lookup
    const posMap = new Map<string, PlacedObject>();
    existingObjects.forEach(obj => {
      const key = obj.position.join(',');
      posMap.set(key, obj);
    });
    
    while (queue.length > 0) {
      const pos = queue.shift()!;
      const key = pos.join(',');
      
      if (visited.has(key)) continue;
      
      const existing = posMap.get(key);
      
      // Stop at walls/obstacles
      if (existing && existing.asset.type === 'block') {
        continue;
      }
      
      visited.add(key);
      toFill.push(pos);
      
      // Add 4-connected neighbors (XZ plane)
      const [x, y, z] = pos;
      queue.push(
        [x+1, y, z],
        [x-1, y, z],
        [x, y, z+1],
        [x, y, z-1]
      );
    }
    
    return toFill;
  }
}
```

---

#### 4. PatternManager
**Purpose:** Pattern storage & retrieval

```typescript
interface Pattern {
  id: string;
  name: string;
  size: { width: number; height: number; depth: number };
  objects: PlacedObject[];
  thumbnail?: string;
  createdAt: Date;
}

class PatternManager {
  private static STORAGE_KEY = 'map-builder-patterns';
  
  static save(pattern: Pattern): void {
    const patterns = this.loadAll();
    patterns.push(pattern);
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(patterns));
  }
  
  static loadAll(): Pattern[] {
    const data = localStorage.getItem(this.STORAGE_KEY);
    return data ? JSON.parse(data) : [];
  }
  
  static delete(id: string): void {
    const patterns = this.loadAll().filter(p => p.id !== id);
    localStorage.setItem(this.STORAGE_KEY, JSON.stringify(patterns));
  }
  
  static export(pattern: Pattern): string {
    return JSON.stringify(pattern, null, 2);
  }
  
  static import(json: string): Pattern {
    return JSON.parse(json);
  }
  
  // Generate thumbnail (could use canvas rendering)
  static async generateThumbnail(objects: PlacedObject[]): Promise<string> {
    // TODO: Render mini scene to canvas, convert to data URL
    return 'data:image/png;base64,...';
  }
}
```

---

## State Management

### New State Variables

```typescript
// In App.tsx
const [activeToolMode, setActiveToolMode] = useState<'select' | 'move' | 'rotate' | 'fill'>('select');
const [symmetryEnabled, setSymmetryEnabled] = useState(false);
const [symmetryAxis, setSymmetryAxis] = useState<'x' | 'z'>('x');
const [symmetryCenterLine, setSymmetryCenterLine] = useState(7);
const [patternLibrary, setPatternLibrary] = useState<Pattern[]>([]);
const [selectedPattern, setSelectedPattern] = useState<Pattern | null>(null);
```

### State Flow

```
User Action → Tool Handler → Transform Logic → State Update → Re-render
                ↓
          History Entry
```

**Example: Rotate Flow**
```typescript
User clicks Rotate button
  → setActiveToolMode('rotate')
  → Render RotateGizmo
  → User drags gizmo
  → onRotate(angle)
  → TransformUtil.rotate(objects, angle, pivot)
  → setPlacedObjectsWithHistory(rotated)
  → History.push({ type: 'rotate', ... })
```

---

## UI/UX Design

### Toolbar Layout

```
┌────────────────────────────────────────────────┐
│ [Select] [Move] [Rotate] [Fill] [Pattern]     │
│    ↑       ↑      ↑       ↑        ↑          │
│  Current  New    New     New      New         │
└────────────────────────────────────────────────┘
```

### Gizmo Design

**Move Gizmo:**
```
      ↑ Y (Green arrow)
      |
      |
 ←────┼────→ X (Red arrow)
     /
    / Z (Blue arrow)
   ↙
```

**Rotate Gizmo:**
```
    ___
   /   \
  |  ●  |  ← Center pivot
   \___/

Drag ring to rotate
Angle display: 45°
```

---

## Performance Considerations

### Smart Select Optimization

```typescript
// Bad: O(n²) for each selection
function selectConnected(startId) {
  objects.forEach(obj => {
    objects.forEach(other => {
      if (isAdjacent(obj, other)) { /* ... */ }
    });
  });
}

// Good: O(n) with spatial hashing
class SpatialGrid {
  private grid = new Map<string, PlacedObject[]>();
  
  insert(obj: PlacedObject) {
    const key = this.getGridKey(obj.position);
    if (!this.grid.has(key)) this.grid.set(key, []);
    this.grid.get(key)!.push(obj);
  }
  
  getNeighbors(pos: Coord): PlacedObject[] {
    // Only check adjacent grid cells
    // ~27 cells max in 3D
  }
}
```

### Fill Tool Optimization

```typescript
// Limit fill area to prevent browser freeze
const MAX_FILL_SIZE = 1000;

function fill(startPos, targetAsset) {
  const toFill = [];
  let count = 0;
  
  while (queue.length > 0 && count < MAX_FILL_SIZE) {
    // BFS logic
    count++;
  }
  
  if (count >= MAX_FILL_SIZE) {
    showWarning('Fill area too large, limited to 1000 tiles');
  }
  
  return toFill;
}
```

---

## Trade-offs

### Decision 1: Skip Scale Tool

**Options:**
1. Add scale support → Requires multi-cell objects
2. Visual-only scale → Doesn't affect logic
3. Skip for now → Revisit in v2.0

**Choice:** Option 3 (Skip)

**Rationale:**
- Grid system assumes 1 object = 1 cell
- Multi-cell support requires major refactor
- Alternative: Use duplicate + manual placement

**Impact:**
- ❌ No pinch-to-scale UX
- ✅ Avoid 2-3 weeks of refactoring
- ✅ Can add later without breaking changes

---

### Decision 2: Symmetry - Duplicate Only First

**Options:**
1. Full mirror mode (linked objects)
2. Duplicate mode only (independent)
3. Both modes from day 1

**Choice:** Option 2 (Duplicate only)

**Rationale:**
- Mirror mode adds complexity to all placement operations
- Need to track linked pairs
- Risk of bugs with undo/redo

**Impact:**
- ❌ Can't move both sides simultaneously
- ✅ Simpler implementation
- ✅ Lower risk
- ✅ Can add mirror mode in Phase 2

---

### Decision 3: Pattern Storage

**Options:**
1. LocalStorage (5MB limit)
2. IndexedDB (unlimited)
3. Server-side storage

**Choice:** Option 1 + Option 2 (Hybrid)

**Rationale:**
- LocalStorage: Simple, works offline
- IndexedDB: Fallback for large libraries
- Server: Adds complexity, needs auth

**Implementation:**
```typescript
class PatternStorage {
  async save(pattern: Pattern) {
    try {
      // Try LocalStorage first
      localStorage.setItem(key, JSON.stringify(pattern));
    } catch (e) {
      // Fallback to IndexedDB if quota exceeded
      await indexedDB.put('patterns', pattern);
    }
  }
}
```

---

## Risks & Mitigation

### Risk 1: Performance with Large Selections
**Impact:** High (tool becomes unusable)  
**Probability:** Medium (maps can have 1000+ tiles)

**Mitigation:**
- Implement spatial grid for O(1) neighbor lookup
- Add loading indicator for operations >100ms
- Limit max selection size (e.g., 500 objects)
- Background processing for large fills

---

### Risk 2: Undo/Redo Complexity
**Impact:** High (data loss if bugs)  
**Probability:** Medium (many new state changes)

**Mitigation:**
- All tools use existing `setPlacedObjectsWithHistory`
- Add integration tests for undo/redo with each tool
- Limit history depth to prevent memory issues

---

### Risk 3: Grid Coordinate Rounding Errors
**Impact:** Medium (objects misaligned)  
**Probability:** Low (but critical if happens)

**Mitigation:**
```typescript
// Always round after transforms
const newPos = [
  Math.round(calculatedX),
  Math.round(calculatedY),
  Math.round(calculatedZ)
] as [number, number, number];

// Validate positions before adding
function validatePosition(pos: Coord): boolean {
  return pos.every(coord => Number.isInteger(coord));
}
```

---

## Migration Plan

### Phase 1: Additive Only
- All new tools are optional
- Existing workflows unchanged
- No data migration needed

### Phase 2: Gradual Adoption
- Tutorial highlights new tools
- "Tool of the Week" spotlight
- Keyboard shortcut guide

### Phase 3: Metrics
- Track tool usage (analytics)
- A/B test: With/without new tools
- Measure time to create test map

---

## Testing Strategy

### Unit Tests
```typescript
describe('SelectionEngine', () => {
  it('selects all connected tiles', () => {
    const objects = createTestGrid(5, 5);
    const selected = engine.selectConnected(objects[0].id, objects);
    expect(selected).toHaveLength(25);
  });
  
  it('stops at walls', () => {
    const objects = createRoomWithWalls();
    const selected = engine.selectConnected('floor-0-0', objects);
    expect(selected).not.toContain(wallIds);
  });
});

describe('TransformUtil', () => {
  it('rotates 90° correctly', () => {
    const obj = { position: [1, 0, 0] };
    const rotated = TransformUtil.rotate([obj], 90, [0, 0, 0]);
    expect(rotated[0].position).toEqual([0, 0, 1]);
  });
});
```

### Integration Tests
```typescript
describe('Tool Integration', () => {
  it('smart select + rotate workflow', async () => {
    // Setup
    const map = await createTestMap();
    
    // Smart select
    const selected = smartSelect(map.startTile);
    
    // Rotate
    const rotated = rotate(selected, 90);
    
    // Verify
    expect(rotated).toMatchSnapshot();
  });
});
```

---

## Open Questions

1. **Q:** Should patterns sync across devices?  
   **A:** Deferred to future. Start with local-only.

2. **Q:** How to handle pattern versioning?  
   **A:** Add `version` field to Pattern interface. Migrate on load if needed.

3. **Q:** Max patterns per library?  
   **A:** 100 patterns limit for MVP. Add pagination later if needed.

4. **Q:** Should fill respect locked regions?  
   **A:** Yes, if we add lock feature. For now, fill ignores locks.

5. **Q:** Keyboard shortcut conflicts with browser?  
   **A:** Use Cmd/Ctrl modifiers. Document shortcuts clearly.

---

## Success Metrics

### Development
- [ ] All 7 tools implemented
- [ ] <5 bugs per tool on average
- [ ] Code coverage >80%

### Performance
- [ ] Smart Select: <1s for 500 tiles
- [ ] Fill: <2s for 1000 tiles
- [ ] Pattern load: <500ms

### User Adoption
- [ ] 80% try at least 3 tools in first week
- [ ] 50% save at least 1 pattern
- [ ] 30% use smart select as primary method

### Quality
- [ ] Zero crashes from new tools
- [ ] Average map creation time reduced 50%
- [ ] User satisfaction >4/5 stars

---

## Future Enhancements (Post-MVP)

1. **Brush Tool** - Paint tiles like Photoshop
2. **AI-assisted placement** - Suggest object positions
3. **Symmetry mirror mode** - Linked mirrored objects
4. **Pattern marketplace** - Share patterns with community
5. **Macro recording** - Record & replay action sequences
6. **Multi-user collaboration** - Real-time co-editing

---

**Document Status:** Draft for Review  
**Last Updated:** 2025-12-25  
**Author:** AI Assistant  
**Reviewers:** TBD
