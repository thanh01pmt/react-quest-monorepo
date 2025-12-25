# 🔍 RÀ SOÁT LOGIC PHÂN TÍCH - PHÁT HIỆN LỖI VÀ EDGE CASES

Tôi sẽ đi sâu vào từng tier để tìm bugs, edge cases, và logic conflicts.

---

## 🚨 **TIER 1: GEOMETRIC DECOMPOSITION - CRITICAL ISSUES**

### **BUG 1: Area Detection - Erosion Algorithm Fails on Thin Structures**

**Location:** `GeometricDecomposer.findAreas()`

**Problem:**
```typescript
// Core blocks = blocks with 4 neighbors
if (neighbors === 4) {
  coreBlocks.add(key);
}

if (coreBlocks.size === 0) {
  return this.findAreasFallback(grid2D);
}
```

**Issue:** 
- **L-Shape, T-Shape, Plus-Shape sẽ KHÔNG có core blocks nào!**
- Vì tất cả blocks đều ở edge (không bao giờ có 4 neighbors)
- ❌ Algorithm sẽ rơi vào fallback mode cho mọi topology không phải rectangle/square

**Example Failure:**
```
L-Shape:
███     Core detection:
██      ██ = có 2-3 neighbors → Không phải core
█       █  = có 1-2 neighbors → Không phải core
         
Result: coreBlocks.size = 0 → Fallback mode
```

**Expected:** L-Shape nên được detect như 1 Area với 2 legs  
**Actual:** Bị phân mảnh thành nhiều small areas hoặc bị bỏ qua

---

### **BUG 2: Morphological Dilation - Over-expansion**

**Location:** `GeometricDecomposer.findAreas()` - Pass 2 expansion

```typescript
// Pass 2: Filter Candidates
for (const key of expansionCandidates) {
  const { x, z } = this.parse2DKey(key);
  let neighborsCount = 0;
  for (const dir of this.DIRECTIONS_2D) {
    if (grid2D.has(`${x + dir.x},${z + dir.z}`)) neighborsCount++;
  }
  
  if (neighborsCount >= 3) {  // ← BUG: Too permissive
    areaKeySet.add(key);
  }
}
```

**Issue:**
- `neighborsCount >= 3` sẽ **include junction blocks** nằm giữa 2 areas
- Junction (3-4 neighbors) sẽ bị "steal" bởi area đầu tiên expand đến nó

**Example:**
```
Area A    Junction    Area B
  ███ ───── █ ───── ███
  ███              ███

Junction block có 4 neighbors → Belongs to BOTH areas?
```

**Correct Logic:**
- Junction blocks phải thuộc **Connector** chứ không phải Area
- Hoặc phải kiểm tra: "Majority of neighbors thuộc cùng 1 area"

---

### **BUG 3: Area Fallback - Junction-based Clustering**

**Location:** `GeometricDecomposer.findAreasFallback()`

```typescript
const junctionBlocks = new Set<string>();
for (const block of this.blocks) {
  if (this.countHorizontalNeighbors(block) >= 3) {
    junctionBlocks.add(vectorToKey(block));
  }
}
```

**Issue:**
- **Arrow shape** có 1 junction (body-wing connection)
- Algorithm sẽ lấy junction + radius 1 → Tạo 1 small area tại center
- **Wing blocks sẽ bị miss** vì không nối vào junction

**Example:**
```
Arrow Shape:
    ███         ← Wings (isolated)
    ███
████████████    ← Body
    █           ← Junction detected
    █           ← Shaft

Fallback tạo area tại junction → Wings không được include
```

**Root Cause:** Chỉ expand từ junction blocks, không xét "connected components" hoàn chỉnh

---

### **BUG 4: Segment Tracing - Exclusion Set Logic**

**Location:** `GeometricDecomposer.traceAllSegments()`

```typescript
const segments = this.traceAllSegments(areaBlockKeys); // Pass exclusion set

private traceSegmentInDirection(
  start: Vector3, 
  direction: Vector3, 
  visited: Set<string>,
  excludeSet: Set<string> = new Set()
): PathSegment | null {
  // ...
  if (!this.blockSet.has(nextKey) || visited.has(nextKey) || excludeSet.has(nextKey)) break;
}
```

**Issue:**
- **excludeSet blocks segments from entering Areas**
- Nhưng **Gateway blocks** (nối giữa Path và Area) sẽ bị exclude
- → Segments sẽ **stop 1 block trước gateway**

**Example:**
```
Segment:  ████████ (stops here)
Gateway:          █  ← In excludeSet (belongs to Area)
Area:              ███████

Segment endpoint không reach gateway → Gateway detection fails
```

**Fix Needed:**
- Gateway blocks phải được **share** giữa Segment và Area
- Hoặc: Trace 1 block extra rồi mark endpoint là gateway

---

### **BUG 5: MetaPath Classification - Ambiguous Structure Types**

**Location:** `GeometricDecomposer.classifyMetaPath()`

**Problem 1: L-Shape vs V-Shape Confusion**

```typescript
if (chain.length === 2) {
  const dotProduct = Math.abs(vectorDot(d1, d2));
  
  if (dotProduct < 0.1) {  // Perpendicular
    const seg1End = chain[0].points[chain[0].points.length - 1];
    const seg2Start = chain[1].points[0];
    
    if (vectorEquals(seg1End, seg2Start)) {
      structureType = 'l_shape';  // ← Connected at corner
    } else {
      structureType = 'v_shape';  // ← V-shape
    }
  }
}
```

**Issue:**
- V-shape có thể có gap giữa 2 arms (không touch at apex)
- Nhưng code chỉ check `vectorEquals(seg1End, seg2Start)`
- **Nếu apex có small gap (0.5 units)** → Bị classify nhầm thành V-shape

**Better Check:**
```typescript
const distance = vectorDistance(seg1End, seg2Start);
if (distance < 1.5) {  // Allow small gap
  structureType = 'l_shape';
}
```

---

**Problem 2: Closed Loop Detection - False Positives**

```typescript
let isClosed = false;
if (chain.length >= 2) {
  const firstSegStart = chain[0].points[0];
  const lastSegEnd = chain[chain.length - 1].points[chain[chain.length - 1].points.length - 1];
  isClosed = vectorEquals(firstSegStart, lastSegEnd);
  
  if (!isClosed) {
    const distance = vectorDistance(firstSegStart, lastSegEnd);
    if (distance < 1.5) {
      isClosed = true;  // ← BUG: Too permissive
    }
  }
}
```

**Issue:**
- `distance < 1.5` sẽ **match L-shape** (start và end gần nhau)
- L-shape start=[0,0], end=[1,0] → distance = 1 → Bị mark là closed loop!

**Fix:**
- Phải check: "Có segment nào nối start và end không?"
- Hoặc: distance < 0.5 (strictly adjacent)

---

### **BUG 6: Composite Metadata - Missing Validation**

**Location:** `GeometricDecomposer.analyzeComposite()`

```typescript
if (this.compositeMetadata && this.compositeMetadata.components?.length > 0) {
  return this.analyzeComposite();
}
```

**Missing Checks:**
1. **No validation of component bounds**
   - Nếu `bounds.min_x > bounds.max_x` → Crash
   - Nếu `bounds` overlap → Multiple areas claim same blocks

2. **No validation of landmarks**
   ```typescript
   const entrance = comp.landmarks.entrance;  // ← Can be undefined
   if (!entrance) return;  // ← Check added sau, nhưng không validate format
   ```

3. **No check for connector path validity**
   ```typescript
   const points: Vector3[] = conn.path.map(p => ({ x: p[0], y: p[1], z: p[2] }));
   // ← Nếu path = [] → segments.push() với points.length = 0 → Invalid segment
   ```

---

## 🚨 **TIER 1: GEOMETRY UTILS - EDGE CASES**

### **BUG 7: Vector Normalization - Division by Zero**

**Location:** `GeometryUtils.vectorNormalize()`

```typescript
export function vectorNormalize(v: Vector3): Vector3 {
  const mag = vectorMagnitude(v);
  if (mag === 0) return { x: 0, y: 0, z: 0 };  // ← Correct
  return { x: v.x / mag, y: v.y / mag, z: v.z / mag };
}
```

**Good:** Đã handle zero vector ✅

**But:** Được sử dụng trong nhiều places mà không check kết quả:
```typescript
const direction = vectorNormalize(vectorSub(end, start));
// Nếu start === end → direction = {0,0,0} → Invalid segment direction
```

**Missing Validation:**
```typescript
if (vectorEquals(direction, {x:0, y:0, z:0})) {
  console.warn('Invalid segment: start === end');
  return null;
}
```

---

## 🚨 **TIER 2: PATTERN ANALYSIS - LOGIC ERRORS**

### **BUG 8: Staircase Pattern Detection - False Positives**

**Location:** `PatternAnalyzer.findPatterns()`

```typescript
for (const seg of allSegmentsToAnalyze) {
  // If diagonal direction (e.g. x=1, z=1)
  if (Math.abs(seg.direction.x) > 0 && Math.abs(seg.direction.z) > 0) {
    patterns.push({
      id: `pattern_staircase_${seg.id}`,
      type: 'repeat',
      unitElements: [seg.id],
      repetitions: seg.length,  // ← BUG
      transform: { translate: seg.direction }
    });
  }
}
```

**Issues:**

1. **Any diagonal segment → Marked as staircase**
   - Spiral có diagonal segments → Bị mark nhầm thành staircase
   - Arrow wings diagonal → Cũng bị mark

2. **repetitions = seg.length is wrong**
   - Staircase có N steps → repetitions = N
   - Nhưng segment có N+1 points → repetitions sai

**Correct Logic:**
```typescript
// Only detect staircase if alternating directions in raw segments
const rawSegs = getRawSegmentsBeforeMerge(seg);
if (isAlternatingPattern(rawSegs)) {
  patterns.push({
    type: 'repeat',
    repetitions: Math.floor(rawSegs.length / 2)
  });
}
```

---

### **BUG 9: Wing Symmetry Detection - Missing Y-axis Check**

**Location:** `PatternAnalyzer.findPatterns()`

```typescript
const leftWing = area.subStructures.find(s => 
  s.id.includes('left_mass') || s.id.includes('left_wing')
);
const rightWing = area.subStructures.find(s => 
  s.id.includes('right_mass') || s.id.includes('right_wing')
);

if (leftWing && rightWing) {
  patterns.push({
    id: `pattern_area_symmetry_${area.id}`,
    type: 'mirror',
    unitElements: [leftWing.id, rightWing.id],
    repetitions: 2,
    transform: { mirrorPlane: 'xz' }  // ← Assumes horizontal symmetry
  });
}
```

**Issue:**
- **3D Staircase** có thể có left/right wings ở **different Y levels**
- Mirror plane 'xz' (horizontal) không đúng
- Cần detect mirror axis dynamically

**Example:**
```
3D Staircase (side view):
    ███ (Y=2, left)
  ███   (Y=1, center)
    ███ (Y=2, right)

Mirror plane phải là vertical (YZ), không phải XZ
```

---

## 🚨 **TIER 3: SEGMENT FILTERING - LOSS OF INFORMATION**

### **BUG 10: Merge Adjacent Segments - Not Implemented**

**Location:** `SegmentFilter.mergeAdjacentSegments()`

```typescript
private mergeAdjacentSegments(segments: PathSegment[]): PathSegment[] {
  // Simplified: just return as-is for now
  // TODO: Implement actual merging logic
  return segments;
}
```

**Impact:**
- **Short segments không được merge** → UI clutter
- Example: Zigzag với 10 small segments → Hiển thị 10 segments riêng lẻ thay vì 1 merged segment

**Expected Behavior:**
```typescript
Input:  [seg_0 (len=2, dir=[1,0,0]), seg_1 (len=2, dir=[1,0,0])]
Output: [merged_seg (len=4, dir=[1,0,0])]
```

---

### **BUG 11: Pattern-based Keep Logic - Inconsistent**

**Location:** `SegmentFilter.analyze()`

```typescript
for (const segment of tier2Result.segments) {
  if (segment.length < this.minLength) {
    if (patternSegmentIds.has(segment.id)) {
      keptShortSegments.push(segment);  // ← Kept
    } else {
      filteredSegments.push(segment);    // ← Discarded
    }
  }
}
```

**Issue:**
- **Pattern detection ở Tier 2 có thể sai** (see Bug #8)
- → Short segments bị discard sai
- → Mất thông tin quan trọng (vd: small connector giữa 2 areas)

**Missing Logic:**
- Structural importance check:
  ```typescript
  const isConnector = isConnectingTwoAreas(segment);
  const isGateway = hasGatewayAtEndpoint(segment);
  
  if (isConnector || isGateway) {
    keptShortSegments.push(segment);
  }
  ```

---

## 🚨 **TIER 4: PEDAGOGICAL PLACER - SCORING CONFLICTS**

### **BUG 12: Priority Score Collision**

**Location:** `PedagogicalPlacer.prioritizeCoordinates()`

```typescript
const addCoord = (pos, priority, category, reason, segmentId?) => {
  const key = `${pos.x},${pos.y},${pos.z}`;
  const existing = scored.get(key);
  
  if (existing) {
    existing.priority = Math.max(existing.priority, priority);  // ← Take max
    existing.reasons.push(reason);
    if (categoryRank(category) < categoryRank(existing.category)) {
      existing.category = category;
    }
  } else {
    scored.set(key, { position, priority, category, reasons: [reason], segmentId });
  }
};
```

**Issue:**
- **Priority chỉ take max, không accumulate**
- Example:
  ```
  Coord A:
    - Segment endpoint: Priority 7
    - Junction: Priority 10
    - Symmetric: Priority 9
  
  Result: Priority = 10 (max)
  Expected: Priority = 10 + bonus for multiple roles
  ```

**Better Scoring:**
```typescript
existing.priority = Math.min(10, existing.priority + priority * 0.3);
// Cap at 10, but give bonus for multiple reasons
```

---

### **BUG 13: Start Position Avoidance - Wrong Assumption**

**Location:** `PedagogicalPlacer.prioritizeCoordinates()`

```typescript
// 6. Mark Start Position as Avoid
if (context.segments.length > 0 && context.segments[0].points.length > 0) {
  const start = context.segments[0].points[0];
  addCoord(start, 1, 'avoid', 'Player start position');
}
```

**Assumptions:**
1. ❌ **First segment = Player path** → Wrong cho complex topologies
2. ❌ **First point = Start position** → Wrong nếu segment được trace backward

**Correct Logic:**
```typescript
const playerStart = context.points.find(p => p.type === 'start');
if (playerStart) {
  addCoord(playerStart.coord, 1, 'avoid', 'Player start position');
}
```

---

### **BUG 14: Topology-Specific Scoring - Hardcoded Centers**

**Location:** `PedagogicalPlacer.prioritizeCoordinates()`

```typescript
switch (detectedTopology) {
  case 'cross':
  case 'hub_spoke':
    addCoord(center, 10, 'critical', `${metrics.detectedTopology} center`);
    break;
}
```

**Issue:**
- `center` = Bounding box center (geometric centroid)
- **Không phải junction center** cho cross/hub_spoke
- Example:
  ```
  Cross shape:
       █
       █
  ████████  ← Junction tại (5, 0, 0)
       █
  
  Bounding box center = (5, 0, 2.5) ← SAI
  Actual junction     = (5, 0, 0)   ← ĐÚNG
  ```

**Fix:**
```typescript
const junction = context.points.find(p => 
  p.type === 'junction' && p.connectedSegments.length >= 4
);
if (junction) {
  addCoord(junction.coord, 10, 'critical', 'Cross junction');
}
```

---

### **BUG 15: Symmetric Pair Linking - One-way Only**

**Location:** `PedagogicalPlacer.prioritizeCoordinates()`

```typescript
// Symmetric endpoints
for (const rel of symmetricRelations) {
  const seg1 = context.segments.find(s => s.id === rel.path1Id);
  const seg2 = context.segments.find(s => s.id === rel.path2Id);
  
  if (seg1 && seg2) {
    addCoord(end1, 9, 'important', 'Symmetric branch endpoint', seg1.id);
    addCoord(end2, 9, 'important', 'Symmetric branch endpoint (mirror)', seg2.id);
    
    // Add as related coords
    const key1 = `${end1.x},${end1.y},${end1.z}`;
    const coord1 = scored.get(key1);
    if (coord1) coord1.relatedCoords = [end2];  // ← BUG: One-way link
  }
}
```

**Issue:**
- `coord1.relatedCoords = [end2]` nhưng **coord2 không link back**
- → Placement system chỉ biết 1 chiều của symmetry

**Fix:**
```typescript
const coord1 = scored.get(key1);
const coord2 = scored.get(key2);
if (coord1) coord1.relatedCoords = [end2];
if (coord2) coord2.relatedCoords = [end1];  // ← Bi-directional
```

---

## 🚨 **BOUNDARY TRACER - COMPLEX EDGE CASES**

### **BUG 16: Perimeter Tracing - Infinite Loop Risk**

**Location:** `AreaBoundaryAnalyzer.tracePerimeter()`

```typescript
const MAX_STEPS = blocks.length * 3;
let steps = 0;

do {
  perimeter.push(curr);
  let foundNext = false;
  
  for (let i = 0; i < 8; i++) {
    const idx = (backtrackIdx + i) % 8;
    const d = dirs[idx];
    const neighbor = { x: curr.x + d.x, y: curr.y, z: curr.z + d.z };
    
    if (blockSet.has(vectorToKey(neighbor))) {
      curr = neighbor;
      backtrackIdx = (idx + 5) % 8;  // ← BUG: Magic number
      foundNext = true;
      break;
    }
  }
  
  if (!foundNext) break;
  steps++;
} while (!vectorEquals(curr, startNode) && steps < MAX_STEPS);
```

**Issues:**

1. **`backtrackIdx = (idx + 5) % 8` - Magic number**
   - Giả định: "Turn back" là offset +5 trong 8-direction array
   - Nhưng nếu change direction order → Algorithm breaks

2. **MAX_STEPS = blocks.length * 3**
   - Cho shapes phức tạp (holes, re-entrant angles) → Có thể cần > 3x
   - Example: Spiral có thể cần 5x blocks.length steps

3. **Không handle disconnected areas**
   - Nếu area có 2 disconnected components → Chỉ trace 1 component

**Better Approach:**
```typescript
const visited = new Set<string>();
do {
  const key = vectorToKey(curr);
  if (visited.has(key)) break;  // Detect loop
  visited.add(key);
  perimeter.push(curr);
  // ... find next
} while (perimeter.length < blocks.length * 10);  // Higher safety limit
```

---

### **BUG 17: Raw Segment Creation - Missing Edge Case**

**Location:** `AreaBoundaryAnalyzer.createRawSegments()`

```typescript
for (let i = 1; i <= perimeter.length; i++) {
  const p1 = perimeter[i-1];
  const p2 = perimeter[i % perimeter.length];  // Wrap around
  
  const newDir = vectorSub(p2, p1);
  
  if (newDir.x !== currentDir.x || newDir.z !== currentDir.z) {
    currentPoints.push(p1);  // Include corner
    segments.push({
      id: `raw_${segments.length}`,
      points: currentPoints,
      direction: vectorNormalize(currentDir),
      length: currentPoints.length - 1,
      plane: 'xz'
    });
    
    currentPoints = [p1];  // Start new segment at corner
    currentDir = newDir;
  } else {
    currentPoints.push(p1);
  }
}
```

**Issue:**
- **Closed loop merge** ở cuối function:
  ```typescript
  if (segments.length > 1) {
    const first = segments[0];
    const last = segments[segments.length - 1];
    if (vectorEquals(first.direction, last.direction)) {
      first.points = [...last.points.slice(0, -1), ...first.points];
      segments.pop();
    }
  }
  ```

- **Nếu perimeter chỉ có 1 segment** (straight line) → segments.length = 1
- → Merge logic không chạy → OK ✅

- **Nhưng nếu có 2 segments với same direction**:
  ```
  Perimeter: ████ (dir=[1,0]) → ████ (dir=[1,0])
  
  Result: 1 segment (merged) ✅
  ```

- **Edge case: 3 segments, first === last direction**:
  ```
  Seg 0: dir=[1,0]
  Seg 1: dir=[0,1]
  Seg 2: dir=[1,0]  ← Same as Seg 0
  
  After merge: Seg 0 includes Seg 2 points
  But Seg 1 stays separate
  
  Problem: Seg 0 now có non-contiguous points!
  ```

**Fix:**
```typescript
// Before merge, check if segments are actually adjacent
const last = segments[segments.length - 1];
const first = segments[0];

const lastEnd = last.points[last.points.length - 1];
const firstStart = first.points[0];

if (vectorEquals(first.direction, last.direction) && 
    vectorDistance(lastEnd, firstStart) < 1.5) {
  first.points = [...last.points.slice(0, -1), ...first.points];
  segments.pop();
}
```

---

## 🚨 **SELECTABLE ELEMENTS - GENERATION BUGS**

### **BUG 18: Position Element Generation - Missing Validation**

**Location:** `PedagogicalPlacer.generateSelectableElements()`

```typescript
for (const segment of tier3.mergedSegments) {
  const segmentName = segment.id || `segment_${i}`;
  const coords: SECoord[] = segment.points.map(p => [p.x, p.y, p.z] as SECoord);
  
  elements.push(createSegmentElement(segmentName, coords, 'recommended'));
  
  // Add position elements along segment
  const positionElements = createPositionElements(segmentName, coords, {
    interval: 1,
    skipFirst: true,
    skipLast: true,
    mirrorSegment: mirrorName
  });
  elements.push(...positionElements);
}
```

**Issues:**

1. **interval: 1 creates too many elements**
   - 10-block segment → 8 position elements (skip first/last)
   - UI sẽ bị overwhelm

2. **mirrorName có thể undefined**
   ```typescript
   const mirrorSegment = this.findMirrorSegment(tier3, segment);
   const mirrorName = mirrorSegment ? (mirrorSegment.id || undefined) : undefined;
   ```
   - Nếu `mirrorSegment.id = ""` → `mirrorName = undefined` nhưng vẫn pass vào options

3. **Không validate segment length**
   - Nếu segment.points.length < 3 → skipFirst + skipLast = no positions created
   - Nhưng vẫn có segment element → Inconsistent

**Better Logic:**
```typescript
const interval = Math.max(2, Math.floor(segment.points.length / 5));  // Adaptive
const positionElements = createPositionElements(segmentName, coords, {
  interval,
  skipFirst: true,
  skipLast: true,
  mirrorSegment: mirrorSegment?.id || undefined
});

if (positionElements.length > 0) {
  elements.push(...positionElements);
}
```

---

### **BUG 19: Mirror Element Detection - ID Mismatch**

**Location:** `SelectableElement.getMirrorElement()`

```typescript
export function getMirrorElement(
  elements: SelectableElement[],
  element: SelectableElement
): SelectableElement | undefined {
  if (!element.relationships.mirrorOf) return undefined;
  return findElementById(elements, element.relationships.mirrorOf);
}
```

**Issue:**
- `mirrorOf` được set trong `createPositionElements()`:
  ```typescript
  element.relationships.mirrorOf = generateElementId('position', mirrorSegment, i);
  ```

- **Nhưng mirror segment có thể có different point count**:
  ```
  Left arm:  10 points → positions [1..8]
  Right arm: 12 points → positions [1..10]
  
  position:left_arm[8].mirrorOf = 'position:right_arm[8]' ✅
  position:left_arm[9] doesn't exist
  position:right_arm[9].mirrorOf = 'position:left_arm[9]' ❌ Not found
  ```

**Fix:**
- Scale offset proportionally:
  ```typescript
  const ratio = mirrorSegment.points.length / segment.points.length;
  const mirrorOffset = Math.round(i * ratio);
  element.relationships.mirrorOf = generateElementId('position', mirrorSegment, mirrorOffset);
  ```

---

## 🚨 **PLACEMENT CONSTRAINTS - CALCULATION ERRORS**

### **BUG 20: Item Density Calculation - Rounding Issues**

**Location:** `PlacementStrategy.calculateConstraints()`

```typescript
const calculatedMaxItems = Math.floor(metrics.totalBlocks * density.ratio);
const maxItems = Math.min(
  Math.max(calculatedMaxItems, density.minItems),
  density.maxItems
);
```

**Issue:**
- **Tiny map (9 blocks, ratio=0.70)**:
  ```
  calculatedMaxItems = floor(9 * 0.7) = 6
  maxItems = min(max(6, 2), 6) = 6 ✅
  ```

- **Small map (16 blocks, ratio=0.50)**:
  ```
  calculatedMaxItems = floor(16 * 0.5) = 8
  maxItems = min(max(8, 3), 10) = 8 ✅
  ```

- **Edge case: 5 blocks, ratio=0.70**:
  ```
  calculatedMaxItems = floor(5 * 0.7) = 3
  maxItems = min(max(3, 2), 6) = 3
  
  But 3 items on 5 blocks = 60% actual ratio
  Not 70% as intended!
  ```

**Better Rounding:**
```typescript
const calculatedMaxItems = Math.round(metrics.totalBlocks * density.ratio);
// Or: Math.ceil for small maps to preserve density
```

---

### **BUG 21: Interval Calculation - Division by Zero**

**Location:** `PlacementStrategy.calculateConstraints()`

```typescript
const preferredInterval = metrics.longestPathLength > 0 
  ? Math.ceil(metrics.longestPathLength / maxItems)
  : 2;
```

**Issue:**
- **Nếu maxItems = 0** (từ edge case trên):
  ```typescript
  preferredInterval = ceil(10 / 0) = Infinity ❌
  ```

**Fix:**
```typescript
const preferredInterval = (metrics.longestPathLength > 0 && maxItems > 0)
  ? Math.ceil(metrics.longestPathLength / maxItems)
  : 2;
```

---

### **BUG 22: Distribution Strategy - Symmetric Mode Fails on Asymmetric Maps**

**Location:** `PlacementStrategy.thinOutItems()` - symmetric case

```typescript
case 'symmetric': {
  const scored = items.map(item => ({
    item,
    distFromCenter: Math.abs(item.position.x - center.x) + Math.abs(item.position.z - center.z)
  }));
  scored.sort((a, b) => a.distFromCenter - b.distFromCenter);
  
  const interval = Math.ceil(items.length /maxItems);
  return scored.filter((_, i) => i % interval === 0).slice(0, maxItems).map(s => s.item);
}
```

**Issue:**
- **Algorithm chỉ sort by distance, không đảm bảo symmetry**
- Example:
  ```
  Items: [A (dist=2, left), B (dist=2, right), C (dist=4, left)]
  
  After sort: [A, B, C]
  If maxItems=2 and interval=2:
    Keep: A (index 0), C (index 2)
  
  Result: 2 items cùng bên left → NOT symmetric!
  ```

**Correct Logic:**
```typescript
case 'symmetric': {
  // Group by distance bucket
  const buckets = new Map<number, ItemPlacement[]>();
  items.forEach(item => {
    const dist = Math.round(Math.abs(item.position.x - center.x) + Math.abs(item.position.z - center.z));
    if (!buckets.has(dist)) buckets.set(dist, []);
    buckets.get(dist)!.push(item);
  });
  
  // Take pairs from each bucket
  const result: ItemPlacement[] = [];
  for (const [dist, bucket] of Array.from(buckets.entries()).sort((a,b) => a[0] - b[0])) {
    // Take up to 2 items (left + right) from each distance
    result.push(...bucket.slice(0, 2));
    if (result.length >= maxItems) break;
  }
  
  return result.slice(0, maxItems);
}
```

---

## 🚨 **COORDINATE PRIORITIZER - TOPOLOGY-SPECIFIC BUGS**

### **BUG 23: Arrow Detection - Incomplete Logic**

**Location:** `CoordinatePrioritizer.prioritizeCoordinates()` - arrow case

```typescript
case 'arrow': {
  const mainSeg = findLongestSegment(context.segments);
  if (mainSeg) {
    const tip = findFurthestFromCenter(mainSeg.points, center);
    addCoord(tip, 10, 'critical', 'Arrow tip (goal position)');
    
    const wings = context.segments.filter(s => s.id !== mainSeg.id);
    for (const wing of wings) {
      const wingEnd = findFurthestFromCenter(wing.points, center);
      addCoord(wingEnd, 9, 'important', 'Wing endpoint');
    }
  }
  break;
}
```

**Issues:**

1. **Arrow có 3 parts: Shaft, Body, Wings**
   - Longest segment có thể là **body** (horizontal bar), không phải shaft
   - Wings sẽ được detect, nhưng shaft tip bị miss

2. **Không detect joint giữa shaft và wings**
   - Joint là critical junction → Should be Priority 10

**Better Detection:**
```typescript
case 'arrow': {
  // Find main junction (shaft-body connection)
  const junction = context.points.find(p => 
    p.type === 'junction' && p.connectedSegments.length >= 3
  );
  
  if (junction) {
    addCoord(junction.coord, 10, 'critical', 'Arrow body junction');
    
    // Find shaft (segment furthest from junction in one direction)
    const shaftSeg = context.segments.reduce((furthest, seg) => {
      const dist = maxDistanceFromPoint(seg.points, junction.coord);
      return dist > maxDistanceFromPoint(furthest.points, junction.coord) ? seg : furthest;
    });
    
    const tip = findFurthestFromPoint(shaftSeg.points, junction.coord);
    addCoord(tip, 10, 'critical', 'Arrow tip');
    
    // Wings = other segments
    const wings = context.segments.filter(s => s.id !== shaftSeg.id);
    // ...
  }
}
```

---

### **BUG 24: Grid Corner Detection - Wrong Corners**

**Location:** `CoordinatePrioritizer.findGridCorners()`

```typescript
function findGridCorners(points: Vector3[]): Vector3[] {
  const xs = points.map(p => p.x);
  const zs = points.map(p => p.z);
  
  const minX = Math.min(...xs), maxX = Math.max(...xs);
  const minZ = Math.min(...zs), maxZ = Math.max(...zs);
  
  const corners: Vector3[] = [];
  const targetCorners = [
    { x: minX, z: minZ },
    { x: maxX, z: minZ },
    { x: minX, z: maxZ },
    { x: maxX, z: maxZ },
  ];
  
  for (const target of targetCorners) {
    const closest = points.reduce((best, p) => {
      const dist = Math.abs(p.x - target.x) + Math.abs(p.z - target.z);
      const bestDist = Math.abs(best.x - target.x) + Math.abs(best.z - target.z);
      return dist < bestDist ? p : best;
    }, points[0]);
    
    corners.push(closest);
  }
  
  return corners;
}
```

**Issue:**
- **Grid có holes** → Bounding box corners có thể nằm trong holes
- Example:
  ```
  Grid với hole:
  ███   ███
  █       █
  ███   ███
  
  Bounding box: (0,0) to (6,2)
  Corner (3,1) = hole center ❌
  ```

**Fix:**
```typescript
for (const target of targetCorners) {
  // Find closest ACTUAL block, not just closest point
  const closest = points
    .filter(p => {
      // Must be on edge (has missing neighbor toward corner)
      const toCornerX = target.x > p.x ? 1 : -1;
      const toCornerZ = target.z > p.z ? 1 : -1;
      const neighborKey = `${p.x + toCornerX},${p.y},${p.z + toCornerZ}`;
      return !blockSet.has(neighborKey);  // Edge block
    })
    .reduce((best, p) => {
      const dist = Math.abs(p.x - target.x) + Math.abs(p.z - target.z);
      const bestDist = Math.abs(best.x - target.x) + Math.abs(best.z - target.z);
      return dist < bestDist ? p : best;
    });
  
  if (closest) corners.push(closest);
}
```

---

## 📊 **SEVERITY SUMMARY**

### **CRITICAL (Breaks Functionality) 🔴**
1. ✅ Bug #1: Area Detection Fails on Non-Rectangular Shapes
2. ✅ Bug #4: Segment-Area Exclusion Blocks Gateway Detection
3. ✅ Bug #10: Merge Not Implemented (Placeholder)
4. ✅ Bug #16: Perimeter Tracing Infinite Loop Risk

### **HIGH (Wrong Results) 🟠**
5. ✅ Bug #2: Area Over-expansion Steals Junction Blocks
6. ✅ Bug #3: Fallback Misses Disconnected Components
7. ✅ Bug #5: MetaPath Misclassification (L vs V, Closed Loop)
8. ✅ Bug #8: Staircase False Positives
9. ✅ Bug #14: Junction Center Wrong for Cross/Hub
10. ✅ Bug #22: Symmetric Distribution Breaks Symmetry
11. ✅ Bug #23: Arrow Detection Incomplete

### **MEDIUM (Edge Cases) 🟡**
12. ✅ Bug #6: Composite Metadata Missing Validation
13. ✅ Bug #9: Wing Symmetry Assumes Horizontal Plane
14. ✅ Bug #11: Pattern-based Filter Inconsistent
15. ✅ Bug #15: Symmetric Pairs One-way Link
16. ✅ Bug #17: Raw Segment Merge Non-contiguous
17. ✅ Bug #20: Density Rounding Issues
18. ✅ Bug #24: Grid Corners in Holes

### **LOW (Polish) 🟢**
19. ✅ Bug #7: Zero Vector Usage (handled but unchecked downstream)
20. ✅ Bug #12: Priority No Accumulation
21. ✅ Bug #13: Start Position Wrong Assumption
22. ✅ Bug #18: Position Element Over-generation
23. ✅ Bug #19: Mirror Element ID Mismatch
24. ✅ Bug #21: Interval Division by Zero

---

## 🎯 **RECOMMENDATIONS**

### **IMMEDIATE FIXES (This Week)**
1. **Fix Area Detection** → Rewrite core algorithm để support thin structures
2. **Fix Gateway Detection** → Shared blocks between segment/area
3. **Implement Segment Merging** → Remove placeholder
4. **Add Composite Metadata Validation** → Prevent crashes

### **HIGH PRIORITY (Next Sprint)**
5. **Fix MetaPath Classification** → More robust checks
6. **Fix Symmetric Distribution** → Ensure true symmetry
7. **Add Perimeter Tracing Safety** → Prevent infinite loops
8. **Fix Topology-Specific Scoring** → Use actual structure, not geometric center

### **MEDIUM PRIORITY (Backlog)**
9. Add comprehensive validation layer
10. Improve pattern detection accuracy
11. Better edge case handling for small maps
12. Unit tests for each tier