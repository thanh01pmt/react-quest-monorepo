# Micro-Pattern System Documentation

> **Tài liệu kỹ thuật** cho hệ thống tạo màn chơi động dựa trên micro-patterns và loop structures.

---

## 1. Tổng quan kiến trúc

### 1.1. Phân tầng (Layers)

```
┌─────────────────────────────────────────────────────────────┐
│ L3: Template Generator                                       │
│     Kết hợp L1 + L2 + metadata → Map data                   │
├─────────────────────────────────────────────────────────────┤
│ L2: Loop Structures          [loop-structures.ts]           │
│     Single, Nested, While loops, Variable count modes       │
├─────────────────────────────────────────────────────────────┤
│ L1: Micro-Patterns           [micro-patterns.ts]            │
│     Atomic action sequences: M_C, M_M_C, L_M_R_C...         │
├─────────────────────────────────────────────────────────────┤
│ L0: Actions                                                  │
│     moveForward, collectItem, turnLeft, jump...             │
└─────────────────────────────────────────────────────────────┘
```

### 1.2. Files trong package

| File | Chức năng |
|------|-----------|
| `micro-patterns.ts` | L1: Định nghĩa và generate micro-patterns |
| `loop-structures.ts` | L2: Cấu trúc loop và count modes |
| `index.ts` | Export public API |

---

## 2. L1: Micro-Patterns

### 2.1. Định nghĩa

**Micro-Pattern** là một chuỗi atomic các actions được lặp lại trong vòng lặp để tạo map.

```typescript
interface MicroPattern {
  id: string;                    // "M_C", "M_M_C", "L_M_R_C"
  actions: ActionType[];         // ['moveForward', 'collectItem']
  actionCount: number;           // 2
  interactionType: 'crystal' | 'switch' | 'key' | 'mixed';
  movementStyle: 'straight' | 'turn' | 'jump' | 'mixed';
  netTurn: 0 | 90 | -90 | 180;  // Hướng thay đổi sau pattern
  nestedLoopCompatible: boolean; // true nếu netTurn === 0
  
  // New: Turn metadata
  turnCount: number;             // Số lượng turn trong pattern
  turnStyle: 'turnLeft' | 'straight' | 'turnRight' | 'uTurn' | 'zTurn';  // Loại turn (nếu turnCount <= 1 hoặc exception)
  turnPoint: 'start' | 'end' | 'mid' | 'null';       // Vị trí turn (nếu turnCount <= 1)
  
  // New: Jump and interaction metadata
  hasJump: boolean;              // Có chứa jump actions?
  startsWithItem: boolean;       // Bắt đầu bằng interaction action?
  endsWithItem: boolean;         // Kết thúc bằng interaction action?
}
```

### 2.2. Action Types

| Category | Actions | Ký hiệu |
|----------|---------|---------|
| **Position-changing** | `moveForward`, `jump`, `jumpUp`, `jumpDown` | M, J, U, D |
| **Direction-only** | `turnLeft`, `turnRight` | L, R |
| **Interaction** | `collectItem`, `toggleSwitch`, `pickUpKey` | C, T, K |

### 2.3. Quy tắc hợp lệ (9 Rules)

#### Rule 1: Position-Changing Requirement
Pattern phải có ≥1 action thay đổi vị trí.
```
✅ M_C (có moveForward)
❌ L_R_C (chỉ có turn, không đổi vị trí)
```

#### Rule 2: Interaction Requirement
Pattern phải có ≥1 action tương tác (collect hoặc toggle).
```
✅ M_C (có collectItem)
❌ M_M_L (không có interaction)
```

#### Rule 3: Direction-Only Constraint
Các turn actions phải đi kèm position action.
```
✅ L_M_C (turn + move)
❌ L_R_C (chỉ turn, không move)
```

#### Rule 4: Action Count
Pattern phải có 2-10 actions.
```
✅ M_C (2 actions)
✅ M_M_M_C_M (5 actions)
❌ C (1 action - quá ngắn)
```

#### Rule 5: Order Matters
Thứ tự actions ảnh hưởng đến vị trí đặt item trên map.
```
M_C ≠ C_M
M_C: di chuyển rồi mới nhặt → item ở vị trí mới
C_M: nhặt rồi mới di chuyển → item ở vị trí cũ
```

#### Rule 6: Atomicity Rule (CRITICAL)
Pattern không được là N × pattern nhỏ hơn hợp lệ.
```
❌ M_C_M_C (= 2 × M_C) - không atomic
✅ M_C (atomic)
✅ M_M_C (không thể chia)
```

#### Rule 7: No Consecutive Turns
Không có 2 direction actions liên tiếp nhau (để tránh lãng phí step hoặc self-intersection).
```
❌ L_L_M_C (2 turns liên tiếp)
❌ R_L_M_C (2 turns liên tiếp)
✅ L_M_R_C (Left và Right cách nhau bởi Move)
```

#### Rule 8: Max Consecutive Position Actions
Tối đa 4 position actions liên tiếp cùng loại (configurable).
```
✅ M_M_M_M_C (4 move liên tiếp)
❌ M_M_M_M_M_C (5 move liên tiếp - vượt limit)
```

#### Rule 9: Position Between Interactions (CRITICAL)
Giữa 2 interaction actions phải có ≥1 position-changing action.

**Lý do:** Mỗi ô trên map chỉ có thể đặt 1 crystal HOẶC 1 switch.
```
❌ M_C_T (collect và toggle cùng 1 ô - impossible)
❌ M_C_L_T (direction không đổi vị trí, vẫn cùng ô)
✅ M_C_M_T (collect ở ô X, toggle ở ô Y)
```

#### Rule 10: Auto-Adjust Length (System Limit)
Hệ thống sẽ tự động tăng `maxLength` nếu style yêu cầu độ phức tạp cao hơn:
- `uTurn`, `zTurn` -> `maxLength` tối thiểu là **5**.
- `turnLeft`, `turnRight`, `hasJump` -> `maxLength` tối thiểu là **3**.
- Nếu `maxLength` người dùng nhập vào nhỏ hơn mức này, hệ thống sẽ tự động override.

### 2.4. Net Turn Calculation

`netTurn` = tổng độ thay đổi hướng sau khi hoàn thành pattern.

```typescript
function calculateNetTurn(actions: ActionType[]): 0 | 90 | -90 | 180 {
  let net = 0;
  for (const a of actions) {
    if (a === 'turnLeft') net -= 90;
    if (a === 'turnRight') net += 90;
  }
  return normalize(net);  // -180 to 180
}
```

| Pattern | Turns | netTurn | nestedLoopCompatible |
|---------|-------|---------|---------------------|
| M_C | 0 | 0 | ✅ true |
| M_M_C | 0 | 0 | ✅ true |
| L_M_R_C | L(−90) + R(+90) | 0 | ✅ true |
| L_M_C | L(−90) | −90 | ❌ false |
| R_M_C | R(+90) | +90 | ❌ false |

### 2.5. Generator API

```typescript
import { 
  getAllPatterns, 
  getRandomPattern, 
  getRandomPatterns 
} from '@repo/shared-templates';

// Lấy tất cả patterns (cho testing)
const all = getAllPatterns({
  minLength: 2,
  maxLength: 4,
  interactionType: 'crystal',
  movementStyle: 'straight',
  nestedLoopCompatible: true,
  includeTemplateActions: false,  // không có jumpUp/jumpDown
  maxConsecutivePosition: 4,
});

// Lấy 1 pattern ngẫu nhiên
const random = getRandomPattern({
  nestedLoopCompatible: true,
  maxLength: 3,
  seed: 12345,  // reproducible
});

// Lấy nhiều patterns không trùng
const multiple = getRandomPatterns(5, { maxLength: 4 });
```

### 2.6. Generator Options

| Option | Type | Default | Mô tả |
|--------|------|---------|-------|
| `minLength` | number | 2 | Độ dài pattern tối thiểu |
| `maxLength` | number | 5 | Độ dài pattern tối đa |
| `interactionType` | string | - | Filter: 'crystal', 'switch', 'key', 'mixed', 'null' |
| `movementStyle` | string | - | Filter: 'straight', 'turn', 'jump', 'mixed' |
| `nestedLoopCompatible` | boolean | - | Filter: netTurn = 0 |
| `netTurn` | number | - | Filter: 0, 90, -90, 180 |
| `turnStyle` | string | - | Filter: 'straight', 'turnLeft', 'turnRight', 'uTurn', 'zTurn', 'randomLeftRight', 'null' |
| `turnPoint` | string | - | Filter: 'null', 'start', 'mid', 'end', 'random' |
| `hasJump` | boolean | - | Filter: có/không có jump actions |
| `noItemAt` | string | - | Filter: 'start', 'end', 'both' (không có item ở vị trí đó) |
| `includeTemplateActions` | boolean | false | Bao gồm jumpUp/jumpDown |
| `maxConsecutivePosition` | number | 4 | Max same position action liên tiếp |
| `seed` | number | Date.now() | Seed cho RNG (reproducible) |

### 2.7. Template Functions (for Builder Templates)

Dùng trong Template DSL của Quest Builder:

```javascript
// Signature đầy đủ
randomPattern(maxLength, interactionType, turnStyle, turnPoint, hasJump, noItemAt, seed);

// Ví dụ
randomPattern(6, 'crystal', 'straight', 'null', 'noJump');
randomPattern(4, 'switch', 'turnRight', 'mid', 'noJump', 'noItemEnd');
randomPattern(5, 'crystal', 'straight', 'null', 'noJump', 'noItemBoth', 12345);

// Lặp lại pattern trước đó
repeatLastPattern();
```

| Argument | Values | Mô tả |
|----------|--------|-------|
| `maxLength` | number | Độ dài tối đa |
| `interactionType` | `'crystal'`, `'switch'`, `'key'`, `'mixed'`, `'null'` | Loại item ('mixed': random types, 'null': no items) |
| `turnStyle` | `'straight'`, `'turnLeft'`, `'turnRight'`, `'uTurn'`, `'zTurn'`, `'randomLeftRight'`, `'random'`, `'null'` | Kiểu rẽ |
| `turnPoint` | `'null'`, `'start'`, `'mid'`, `'end'`, `'random'` | Vị trí rẽ |
| `hasJump` | `'noJump'`, `'withJump'`, `'random'`, `'null'` | Có/không có nhảy |
| `noItemAt` | `'noItemStart'`, `'noItemEnd'`, `'noItemBoth'`, `'random'`, `'null'` | Không item ở đầu/cuối |
| `seed` | number > 180 | Seed cho reproducible patterns |

---

## 3. L2: Loop Structures

### 3.1. Định nghĩa

**Loop Structure** định nghĩa cách micro-patterns được lặp lại.

### 3.2. Structure Types

#### Single Loop
```typescript
interface SingleLoopStructure {
  type: 'single';
  count: number;           // Số lần lặp
  pattern: MicroPattern;
  prefix?: MicroPattern;   // Actions trước loop
  suffix?: MicroPattern;   // Actions sau loop
}
```

```javascript
// Code tương đương
prefix();
for (let i = 0; i < count; i++) {
  pattern();
}
suffix();
```

#### Nested Loop
```typescript
interface NestedLoopStructure {
  type: 'nested';
  outerCount: number;
  innerCount: CountMode;         // Có thể thay đổi theo iteration
  innerPattern: MicroPattern;    // nestedLoopCompatible = true
  transitionPattern: MicroPattern;
  prefix?: MicroPattern;
  suffix?: MicroPattern;
}
```

```javascript
// Code tương đương
prefix();
for (let outer = 0; outer < outerCount; outer++) {
  for (let inner = 0; inner < calculateCount(innerCount, outer); inner++) {
    innerPattern();  // Giữ nguyên hướng
  }
  transitionPattern();  // Đổi hướng
}
suffix();
```

#### While Loop
```typescript
interface WhileLoopStructure {
  type: 'while';
  condition: 'notAtEnd' | 'hasItem' | 'customCount';
  minIterations: number;      // Random hóa độ dài đường đi
  maxIterations: number;      // Safety limit
  pattern: MicroPattern;
}
```

```javascript
// Code tương đương
while (notDone()) {
  pattern();
}
```
```

### 3.3. Count Modes

```typescript
type CountMode = 
  | { type: 'fixed'; value: number }        // Cố định
  | { type: 'linear'; base: number; step: number }  // base + step*i
  | { type: 'fibonacci'; terms: number }    // 1, 1, 2, 3, 5...
  | { type: 'custom'; fn: (i: number) => number }; // Custom function
```

```typescript
import { CountModes } from '@repo/shared-templates';

CountModes.fixed(4)        // → 4, 4, 4, 4
CountModes.linear(1, 1)    // → 1, 2, 3, 4 (triangular)
CountModes.linear(2, 2)    // → 2, 4, 6, 8
CountModes.fibonacci(5)    // → 1, 1, 2, 3, 5
CountModes.triangular()    // → 1, 2, 3, 4 (shortcut)
CountModes.doubling()      // → 1, 2, 4, 8
```

### 3.4. Block Estimation

```typescript
import { estimateSolutionBlocks } from '@repo/shared-templates';

// Ước lượng số blocks trong solution dựa trên toolbox
const blocks = estimateSolutionBlocks(
  structure,
  hasLoopBlocks: true,      // Có block for/repeat
  hasNestedLoopBlocks: true // Có block nested loop
);
```

| Structure | No Loops | Single Loop | Nested Loops |
|-----------|----------|-------------|--------------|
| Single × 4 | 8 blocks | 5 blocks | - |
| Nested 3×4 | 27 blocks | 12 blocks | 9 blocks |

### 3.5. Structure Creation API

```typescript
import { 
  createSingleLoop, 
  createNestedLoop,
  CountModes 
} from '@repo/shared-templates';

// Single loop
const single = createSingleLoop(pattern, 5);

// Nested loop with triangular inner count
const nested = createNestedLoop(
  innerPattern,       // nestedLoopCompatible = true
  transitionPattern,  // nestedLoopCompatible = false
  4,                  // outer count
  CountModes.triangular()  // inner: 1, 2, 3, 4
);
```

---

## 4. Thiết kế cho Nested Loops

### 4.1. Quy tắc chọn pattern

| Role | Filter | Ví dụ |
|------|--------|-------|
| **Inner Pattern** | `nestedLoopCompatible: true` | M_C, M_M_C, L_M_R_C |
| **Transition Pattern** | `nestedLoopCompatible: false` | R_M_C, L_M_C |

### 4.2. Ví dụ: Square Pattern

```
Inner: M_C (netTurn=0)
Transition: R_M_C (netTurn=+90)
Outer: 4
Inner: 4 (fixed)

→ 4 rows × 4 columns, turn right after each row
```

```javascript
for (let row = 0; row < 4; row++) {
  for (let col = 0; col < 4; col++) {
    moveForward(); collectItem();  // M_C
  }
  turnRight(); moveForward(); collectItem();  // R_M_C (transition)
}
```

### 4.3. Ví dụ: Staircase Pattern

```
Inner: M_C (netTurn=0)
Transition: L_M_L_C (netTurn=-180 → turn back)
Outer: 4
Inner: CountModes.triangular() → 1, 2, 3, 4

→ Row 0: 1 crystal, Row 1: 2 crystals...
```

---

## 5. Ràng buộc thực tế

### 5.1. Max Solution Blocks

Dù ở độ khó nào, solution không nên quá dài:
- **Target range:** 8-25 blocks
- **Over 30 blocks:** Không phù hợp cho học sinh

### 5.2. Toolbox Preset Dependency

Solution length phụ thuộc vào blocks available:

| Preset | Available Blocks | M_C × 10 = ? blocks |
|--------|-----------------|---------------------|
| Sequential | move, turn, collect | 20 blocks (raw) |
| With Loops | + repeat, for | 5 blocks (loop) |
| With Nested | + nested loops | varies |

### 5.3. Map Size ↔ Pattern Size

Map nhỏ không thể chứa pattern lớn:

| Map Size | Max Pattern Length | Lý do |
|----------|-------------------|-------|
| 5×5 | 3-4 actions | ~20 cells available |
| 10×10 | 5-7 actions | ~80 cells available |
| 15×15 | 7-10 actions | ~200 cells available |

---

## 6. Usage Examples

### 6.1. Generate Simple Loop Map

```typescript
import { getRandomPattern, createSingleLoop } from '@repo/shared-templates';

const pattern = getRandomPattern({ 
  maxLength: 3, 
  interactionType: 'crystal' 
});

const structure = createSingleLoop(pattern, 5);
// → Loop 5 lần với pattern ngẫu nhiên
```

### 6.2. Generate Nested Loop Map

```typescript
import { 
  getRandomPattern, 
  createNestedLoop, 
  CountModes 
} from '@repo/shared-templates';

const inner = getRandomPattern({ 
  nestedLoopCompatible: true,
  maxLength: 2
});

const transition = getRandomPattern({ 
  nestedLoopCompatible: false,
  maxLength: 3
});

const structure = createNestedLoop(
  inner, 
  transition, 
  4, 
  CountModes.fixed(3)
);
// → 4 rows × 3 columns
```

### 6.3. Generate Progression Map

```typescript
import { createNestedLoop, CountModes } from '@repo/shared-templates';

// Fibonacci progression
const fibStructure = createNestedLoop(
  innerPattern,
  transitionPattern,
  5,
  CountModes.fibonacci(5)  // 1, 1, 2, 3, 5
);

// Triangular progression (staircase)
const stairStructure = createNestedLoop(
  innerPattern,
  transitionPattern,
  4,
  CountModes.triangular()  // 1, 2, 3, 4
);
```

---

## 7. Template Replacement Analysis

### Templates có thể thay thế bằng dynamic generation

| Category | Templates | Structure Type |
|----------|-----------|---------------|
| sequential | simple-sequence, crystal-trail-basic | Single loop |
| loop | simple-for-loop, micro-loop-collect | Single loop |
| loop | nested-loops, square-pattern | Nested loop (fixed) |
| loop | staircase-climb, staircase-jump | Nested loop (linear) |
| variable | var-counter, var-accumulator | Single loop |
| progression | arithmetic-move/collect | Nested loop (linear) |
| progression | fibonacci-path | Nested loop (fibonacci) |
| loop | while-loop-basic | While loop (new) |
| function | simple-function, flower-pattern | Nested loop + helper function |

### Templates cần giữ static (tính năng đặc biệt)

| Category | Templates | Lý do |
|----------|-----------|-------|
| conditional | if-simple, crystal-or-switch | Cần `isOnCrystal()` sensor |
| conditional | if-simple, crystal-or-switch | Cần `isOnCrystal()` sensor |
| memory | palindrome-path | Symmetric pattern logic |
| decomposition | staircase-function | Complex logic + function |

---

## 8. L3: Template Generator

### 8.1. Tổng quan

L3 kết hợp L1 + L2 để generate map data hoàn chỉnh.

```typescript
import { generateMap, generateValidMap, CountModes } from '@repo/shared-templates';

const map = generateMap({
  structureType: 'nested',
  outerCount: 4,
  innerCount: CountModes.triangular(),
  patternMaxLength: 3,
});
```

### 8.2. GeneratedMap Output

```typescript
interface GeneratedMap {
  pathCoords: Coord[];      // All walkable positions
  items: PlacedItem[];      // Crystals, switches, keys
  startPos: Coord;
  startDirection: Direction;
  endPos: Coord;
  rawSolution: ActionType[];
  blockEstimates: { raw, withLoop, withNestedLoop };
  structure: LoopStructure;
}
```

### 8.3. Item Types

```typescript
interface PlacedItem {
  type: 'crystal' | 'switch' | 'key';
  coord: Coord;
  state?: 'on' | 'off';  // For switches only
}
```

### 8.4. Conditional Config (Sensor-based maps)

Cho phép generate map yêu cầu player sử dụng sensors.

```typescript
interface ConditionalConfig {
  /** pathAhead → Random block placement */
  usePathAhead?: boolean;
  pathAheadProbability?: number;  // 0-1
  
  /** switchAtCurrentLocation → Random switch state */
  useSwitchState?: boolean;
  
  /** hasKeyAtCurrentLocation → Random key placement */
  useKeyPlacement?: boolean;
  keyProbability?: number;  // 0-1
}
```

**Usage:**
```typescript
const map = generateMap({
  structureType: 'single',
  outerCount: 5,
  conditionalConfig: {
    useKeyPlacement: true,
    keyProbability: 0.3,  // 30% chance of key, 70% crystal
  },
});
```

**Behavior:**
- `usePathAhead: true` → Random có/không có block phía trước
- `useSwitchState: true` → Switch với random state (on/off)
- `useKeyPlacement: true` → Random key thay vì crystal

### 8.5. Function Extraction Support

Cho phép tự động tạo hàm phụ để phân rã bài toán (Decomposition).

```typescript
const map = generateMap({
  structureType: 'nested',
  useHelperFunctions: true,  // <-- Enable function extraction
  // ...
});
```

**Output Code:**
```javascript
function processSegment() {
  moveForward();
  collectItem();
}

for (let i = 0; i < 4; i++) {
  processSegment();
}
```

---

## 9. Future Enhancements

### 9.1. Difficulty Auto-Calculation
```typescript
difficulty = f(
  patternComplexity,
  loopNesting,
  rawBlocks / optimalBlocks,
  conceptDepth
)
```

### 9.2. Toolbox-Aware Generation
- Input: toolbox preset + target block range
- Output: Valid structure that produces solution in range

### 9.3. Path-ahead Random Block Placement
- Implement random block placement in path based on pathAhead probability
- Creates maze-like structures requiring `if (pathAhead())` checks

---

## Changelog

| Date | Changes |
|------|---------|
| 2026-01-10 | Added `turnStyle`, `turnPoint` filters for single-turn patterns |
| 2026-01-10 | Added `hasJump` filter ('withJump', 'noJump') |
| 2026-01-10 | Added `noItemAt` filter ('start', 'end', 'both') |
| 2026-01-10 | Added `repeatLastPattern()` template function |
| 2026-01-10 | Added `seed` parameter for reproducible patterns |
| 2026-01-10 | Removed auto-added start block (all blocks explicit) |
| 2026-01-09 | Initial implementation of L1 micro-patterns |
| 2026-01-09 | Added 9 validation rules |
| 2026-01-09 | Added `netTurn` and `nestedLoopCompatible` |
| 2026-01-09 | Created L2 loop-structures layer |
| 2026-01-09 | Added CountModes: fixed, linear, fibonacci |
| 2026-01-09 | Added block estimation functions |
| 2026-01-09 | Created L3 template-generator layer |
| 2026-01-09 | Added `pickUpKey` action (K) |
| 2026-01-09 | Added key item type and switch state |
| 2026-01-09 | Added ConditionalConfig for sensor-based maps |
| 2026-01-09 | Added While Loop support (random iterations) |
| 2026-01-09 | Add Function Extraction strategy (Decomposition) |

