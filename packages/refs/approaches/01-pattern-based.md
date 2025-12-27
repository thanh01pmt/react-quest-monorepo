# Pattern-Based Map Generation (Bottom-Up Approach)

## 1. Tổng quan

Phương pháp Pattern-Based xây dựng map từ dưới lên (bottom-up):
- Bắt đầu từ mặt phẳng vô hạn (infinite plane)
- Nhân vật di chuyển và đặt vật phẩm theo các **pattern** định sẵn
- Map hình thành dần từ tập hợp các pattern được ghép nối

### Workflow

```
┌─────────────────────────────────────────────────────────────┐
│  Start: Empty infinite plane, character at (0,0)           │
│                                                             │
│  Loop:                                                      │
│    1. Select pattern from library                           │
│    2. Check collision with existing placements              │
│    3. If valid: execute pattern, update coords              │
│    4. If invalid: try different pattern or direction        │
│                                                             │
│  End: When target item count reached                        │
│                                                             │
│  Post-processing:                                           │
│    - Add ground blocks under path_coord                     │
│    - Add scenery around path                                │
│    - Crop to bounding box                                   │
└─────────────────────────────────────────────────────────────┘
```

## 2. Pattern Definition

### Ký hiệu Pattern

| Symbol | Meaning | Action |
|--------|---------|--------|
| `-` | Ô trống | moveForward() |
| `C` | Crystal | placeCrystal() |
| `K` | Key | placeKey() |
| `S` | Switch | placeSwitch() |
| `P` | Portal | placePortal() |
| `G` | Gate | placeGate() |
| `>` | Quẹo phải | turnRight() |
| `<` | Quẹo trái | turnLeft() |

### Ví dụ Pattern

```
Pattern: C-
Length: 2 steps
Action: Đặt crystal, đi thẳng 1 bước
Result: [Crystal at (0,0), empty at (1,0)]

Pattern: ->C
Length: 3 steps
Action: Đi thẳng, quẹo phải, đặt crystal
Result: Path bends right, crystal at end

Pattern: C---
Length: 4 steps
Action: Đặt crystal, đi thẳng 3 bước
Result: Crystal followed by 3 empty spaces

Pattern: {C->}*4
Length: 8 steps (loop pattern)
Action: Lặp 4 lần: đặt crystal, quẹo phải
Result: Square with crystals at corners
```

## 3. Pattern Library

### TypeScript Definition

```typescript
interface Pattern {
  id: string;
  sequence: string;           // "C->-" format
  length: number;             // Total steps
  items: PatternItem[];       // Items to place
  exitDirection: DirectionDelta; // same | left | right | back
  
  // Metadata
  category: PatternCategory;
  difficulty: 1 | 2 | 3 | 4 | 5;
  teaches?: PedagogyConcept[];
}

interface PatternItem {
  type: ItemType;
  relativePosition: Vector2;  // Relative to pattern start
  stepIndex: number;          // Which step places this item
}

enum PatternCategory {
  STRAIGHT = 'straight',      // Linear patterns
  TURN = 'turn',              // Single turn patterns
  ZIGZAG = 'zigzag',          // Staircase patterns
  SPIRAL = 'spiral',          // Spiral/square patterns
  COMPLEX = 'complex'         // Multi-turn patterns
}
```

### Pattern Constraints

```typescript
const PATTERN_CONSTRAINTS = {
  maxLength: 10,              // Max steps per pattern
  maxTurns: 4,               // Max turns per pattern
  maxItems: 3,               // Max items per pattern
  minItems: 1                // Must have at least 1 item
};
```

## 4. Generation Algorithm

### Core Algorithm

```typescript
class PatternBasedGenerator {
  private pathCoords: Set<string> = new Set();
  private placementCoords: Map<string, ItemType> = new Map();
  private position: Vector2 = { x: 0, y: 0 };
  private direction: Direction = Direction.NORTH;
  
  generate(config: GenerationConfig): GeneratedMap {
    const { targetItems, maxRetries, patternLibrary } = config;
    
    let itemCount = 0;
    let consecutiveFailures = 0;
    
    while (itemCount < targetItems && consecutiveFailures < maxRetries) {
      // 1. Select candidate pattern
      const pattern = this.selectPattern(patternLibrary, config);
      
      // 2. Simulate pattern to check collision
      const simulation = this.simulatePattern(pattern);
      
      if (this.isValidPlacement(simulation)) {
        // 3. Execute pattern
        this.executePattern(pattern);
        itemCount += pattern.items.length;
        consecutiveFailures = 0;
      } else {
        // 4. Try alternative: rotate or pick different pattern
        const resolved = this.tryAlternatives(pattern, patternLibrary);
        
        if (!resolved) {
          consecutiveFailures++;
          
          // 5. Fallback: move straight to expand space
          if (consecutiveFailures >= 3) {
            this.expandSpace(5);
            consecutiveFailures = 0;
          }
        }
      }
    }
    
    return this.buildFinalMap();
  }
  
  private simulatePattern(pattern: Pattern): SimulationResult {
    const simPos = { ...this.position };
    const simDir = this.direction;
    const itemPositions: Vector2[] = [];
    
    for (const char of pattern.sequence) {
      switch (char) {
        case '-':
          simPos = this.moveInDirection(simPos, simDir);
          break;
        case '>':
          simDir = this.rotateRight(simDir);
          break;
        case '<':
          simDir = this.rotateLeft(simDir);
          break;
        case 'C': case 'K': case 'S': case 'P': case 'G':
          itemPositions.push({ ...simPos });
          break;
      }
    }
    
    return { endPosition: simPos, endDirection: simDir, itemPositions };
  }
  
  private isValidPlacement(sim: SimulationResult): boolean {
    // Check no item overlaps with existing placements
    for (const pos of sim.itemPositions) {
      const key = `${pos.x},${pos.y}`;
      if (this.placementCoords.has(key)) {
        return false;
      }
    }
    return true;
  }
  
  private expandSpace(steps: number): void {
    // Move forward without placing items to create space
    for (let i = 0; i < steps; i++) {
      this.position = this.moveInDirection(this.position, this.direction);
      this.pathCoords.add(`${this.position.x},${this.position.y}`);
    }
  }
}
```

### Collision Detection với Spatial Hashing

```typescript
class SpatialGrid {
  private cellSize = 10;
  private grid: Map<string, Set<string>> = new Map();
  
  private getCellKey(pos: Vector2): string {
    const cx = Math.floor(pos.x / this.cellSize);
    const cy = Math.floor(pos.y / this.cellSize);
    return `${cx},${cy}`;
  }
  
  add(pos: Vector2): void {
    const cellKey = this.getCellKey(pos);
    if (!this.grid.has(cellKey)) {
      this.grid.set(cellKey, new Set());
    }
    this.grid.get(cellKey)!.add(`${pos.x},${pos.y}`);
  }
  
  hasCollision(pos: Vector2): boolean {
    const cellKey = this.getCellKey(pos);
    const cell = this.grid.get(cellKey);
    return cell ? cell.has(`${pos.x},${pos.y}`) : false;
  }
  
  // O(1) average collision check instead of O(n)
  checkPatternCollision(itemPositions: Vector2[]): boolean {
    return itemPositions.some(pos => this.hasCollision(pos));
  }
}
```

## 5. Movement Strategies

### 5.1 Straight (Linear)

```
Pattern sequence: C-C-C-C
Result:
  Start → C → C → C → C → End
         ─────────────────→
```

### 5.2 Zigzag (Staircase)

```
Pattern sequence: C->C->C->C
Result:
  C
  ↓
  → C
    ↓
    → C
      ↓
      → C
```

### 5.3 Macro-Staircase

```
Pattern sequence: C---> C---> C--->
Result:
  C───→ C───→ C───→
  ↓     ↓     ↓
  (longer segments with turns)
```

### 5.4 Spiral (Square)

```
Pattern sequence: {C->}*4
Result:
  C → C
  ↑   ↓
  C ← C
  (square spiral)
```

## 6. Dependency Handling

### Item Dependencies

```typescript
const ITEM_DEPENDENCIES: Record<ItemType, ItemType[]> = {
  [ItemType.CRYSTAL]: [],           // No dependencies
  [ItemType.KEY]: [],               // No dependencies
  [ItemType.SWITCH]: [],            // No dependencies
  [ItemType.GATE]: [ItemType.KEY],  // Requires Key before
  [ItemType.PORTAL]: []             // No dependencies
};

class DependencyChecker {
  canPlace(itemType: ItemType, placedItems: Map<string, ItemType>): boolean {
    const required = ITEM_DEPENDENCIES[itemType];
    
    for (const req of required) {
      const hasRequired = Array.from(placedItems.values()).includes(req);
      if (!hasRequired) return false;
    }
    
    return true;
  }
}
```

### Placement Order Strategy

```typescript
const PLACEMENT_PRIORITY = [
  ItemType.CRYSTAL,  // Place collectibles first
  ItemType.KEY,      // Then keys
  ItemType.SWITCH,   // Then switches
  ItemType.GATE,     // Gates need keys
  ItemType.PORTAL    // Portals last (usually termination)
];
```

## 7. Post-Processing

### Ground Block Generation

```typescript
function generateGroundBlocks(pathCoords: Set<string>): GroundBlock[] {
  const blocks: GroundBlock[] = [];
  
  for (const coord of pathCoords) {
    const [x, y] = coord.split(',').map(Number);
    blocks.push({
      position: { x, y, z: 0 },  // Ground level
      type: 'walkable'
    });
  }
  
  return blocks;
}
```

### Scenery Generation

```typescript
function generateScenery(pathCoords: Set<string>, config: SceneryConfig): SceneryBlock[] {
  // Get bounding box
  const bounds = getBoundingBox(pathCoords);
  
  // Expand bounds for scenery margin
  const expandedBounds = expandBounds(bounds, config.margin);
  
  const sceneryBlocks: SceneryBlock[] = [];
  
  // Fill non-path areas with scenery
  for (let x = expandedBounds.minX; x <= expandedBounds.maxX; x++) {
    for (let y = expandedBounds.minY; y <= expandedBounds.maxY; y++) {
      const key = `${x},${y}`;
      
      if (!pathCoords.has(key)) {
        // Add wall, decoration, or obstacle
        sceneryBlocks.push({
          position: { x, y, z: 0 },
          type: selectSceneryType(x, y, config)
        });
      }
    }
  }
  
  return sceneryBlocks;
}
```

## 8. Điểm mạnh và Điểm yếu

### ✅ Điểm mạnh

1. **Procedural & Scalable**: Tạo vô số map đa dạng
2. **Dense Items**: Dễ tạo map giàu vật phẩm
3. **Flexible**: Dễ mở rộng pattern library
4. **No Code Dependency**: Không cần code mẫu trước

### ⚠️ Điểm yếu

1. **Pedagogy Risk**: Map có thể không dạy đúng concept
2. **Collision Complexity**: Cần xử lý chồng lấn cẩn thận
3. **Deadlock Risk**: Có thể không tìm được pattern hợp lệ
4. **Random Quality**: Chất lượng map không đồng đều

## 9. Khi nào Sử dụng

| Use Case | Phù hợp | Lý do |
|----------|---------|-------|
| Adventure levels | ✅ | Cần exploration, dense items |
| Tutorial levels | ❌ | Cần control sát code mẫu |
| Challenge modes | ✅ | Random thú vị cho replayability |
| Assessment | ❌ | Cần đảm bảo concept cụ thể |

## 10. Tích hợp với Pedagogy

```typescript
interface PedagogyConfig {
  targetConcept: PedagogyConcept;
  patternFilter: (pattern: Pattern) => boolean;
}

// Filter patterns dạy concept cụ thể
const FOR_LOOP_FILTER = (p: Pattern) => 
  p.teaches?.includes(PedagogyConcept.FOR_COUNTED) ?? false;

// Usage
const loopPatterns = patternLibrary.filter(FOR_LOOP_FILTER);
const map = generator.generate({ 
  patternLibrary: loopPatterns,
  targetItems: 10
});
```
