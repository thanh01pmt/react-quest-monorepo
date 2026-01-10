# Template System: Academic Skeletons & Micro-Patterns

This document defines map "Skeletons" based on algorithmic patterns and documents the **micro-pattern mechanism** used for map generation.

## 📜 Changelog

| Date       | Change                                                              |
|------------|---------------------------------------------------------------------|
| 2026-01-10 | Added `turnStyle`: `uTurn`, `zTurn`, `randomLeftRight`, `null`      |
| 2026-01-10 | Added `turnStyle`: `uTurn`, `zTurn`, `randomLeftRight`, `null` |
| 2026-01-10 | Enforced `noConsecutiveTurns` constraint (Rule 7) |
| 2026-01-10 | Added universal `null` option for all filters |
| 2026-01-10 | Added `turnStyle`, `turnPoint` filters for single-turn patterns |
| 2026-01-10 | Added `hasJump` filter ('withJump', 'noJump', 'random', 'null') |
| 2026-01-10 | Added `noItemAt` filter ('start', 'end', 'both', 'random', 'null') |
| 2026-01-10 | Added `repeatLastPattern()` template function |
| 2026-01-10 | Added `interactionType`: `mixed` (random), `null` (no items) |
| 2026-01-10 | Added Auto-Adjust Length Logic (Min 5 for uTurn/zTurn, Min 3 for Turns/Jumps) |
| 2026-01-10 | Added `seed` parameter for reproducible patterns |

---

## 🔧 Micro-Pattern Mechanism (Implementation Rules)

### Parameter Declaration Pattern
All randomizable parameters MUST use this exact pattern:

```js
// Parameters
var _MIN_X_ = 3;      // Min value for parameter X
var _MAX_X_ = 6;      // Max value for parameter X
var X = random(_MIN_X_, _MAX_X_);  // Runtime random selection
```

**Why?** The `TemplateInterpreter` automatically extracts `_MIN_*` and `_MAX_*` variables and displays them as adjustable sliders in the UI.

### Available Commands

#### Movement Commands
| Command | Effect |
|---------|--------|
| `moveForward()` | Di chuyển 1 ô theo hướng hiện tại (cùng độ cao) |
| `turnLeft()` | Xoay trái 90° |
| `turnRight()` | Xoay phải 90° |
| `jump()` | Nhảy lên/xuống 1 ô (tự động detect: nếu có block phía trước thì nhảy lên, nếu trống thì nhảy xuống) |
| `jumpUp()` | **Template only** - Nhảy LÊN 1 ô (tạo block cao hơn) |
| `jumpDown()` | **Template only** - Nhảy XUỐNG 1 ô (tạo block thấp hơn) |

> **⚠️ Jump Rule for Templates**:
> - Trong **template code**: Dùng `jumpUp()` hoặc `jumpDown()` để hệ thống hiểu và tạo đúng độ cao block.
> - Trong **solution code** (output cho player): Tự động chuyển về `jump()` để tương thích ngược.

> **⚠️ Parser Limitations**:
> - **KHÔNG dùng** toán tử `<=` hoặc `>=`. Parser chỉ hỗ trợ `<`, `>`, `==`, `!=`.
> - Thay `i <= N` bằng `i < N + 1` hoặc đổi logic loop (bắt đầu từ 0).

#### Sensing Conditions (Item Generation)
Use these functions to dynamically generate items:

| Function | Effect |
|----------|--------|
| `isOnCrystal()` | 50% chance: places crystal at current position, returns `true` |
| `isOnSwitch()` | 50% chance: places switch at current position, returns `true` |
| `collectItem()` | Places crystal at current position (guaranteed) |
| `toggleSwitch()` | Places switch at current position (guaranteed) |

**Example (Conditional Item Placement):**
```js
for (let i = 0; i < PATH_LENGTH; i++) {
  if (isOnCrystal()) {
    collectItem();
  } else if (isOnSwitch()) {
    toggleSwitch();
  }
  moveForward();
}
```

### Random Mode Enforcement
**Rule**: Templates with **decision-making logic** MUST trigger Random Mode.

Auto-detected by tags/category:
- Category: `conditional` OR `logic`
- Tags containing: `if`, `else`, `detect`, `conditional`, `switch`
- Concepts containing: `conditional`, `sensing`

**Effect**: `gameConfig.mode = 'random'` hides a portion of items each run, preventing hardcoded solutions.

### Micro-Pattern Design Rules

#### 1. Spacing Pattern
Use `SPACE` to create variable distances between items:

```js
var _MIN_SPACE_ = 0;
var _MAX_SPACE_ = 2;
var SPACE = random(_MIN_SPACE_, _MAX_SPACE_);

// SPACE + 1 ensures at least 1 move between items
for (let s = 0; s < SPACE + 1; s++) {
  moveForward();
}
collectItem();
```

**Why `SPACE + 1`?** If `SPACE = 0`, we still move 1 step. If `SPACE = 2`, we move 3 steps. This prevents items from overlapping.

#### 2. Movement + Interaction Coordination
Templates should interleave movement and interaction in clear phases:

```js
// Pattern: [Move Phase] → [Interact Phase] → [Turn Phase]
for (let i = 0; i < REPEATS; i++) {
  // Phase 1: Movement with spacing
  for (let s = 0; s < SPACE_CRYSTAL + 1; s++) {
    moveForward();
  }
  collectItem();  // Interaction
  
  // Phase 2: Different spacing for switch
  for (let s = 0; s < SPACE_SWITCH + 1; s++) {
    moveForward();
  }
  toggleSwitch();  // Interaction
  
  turnRight();  // Direction change
}
```

#### 3. Segment-Based Patterns (Zigzag)
For zigzag/alternating paths, use paired segments:

```js
for (let p = 0; p < PAIRS; p++) {
  // Segment 1: Right direction
  for (let s = 0; s < SEGMENT_LENGTH; s++) {
    moveForward();
  }
  collectItem();
  turnRight(); moveForward(); turnRight();
  
  // Segment 2: Left direction (mirror)
  for (let s = 0; s < SEGMENT_LENGTH; s++) {
    moveForward();
  }
  collectItem();
  turnLeft(); moveForward(); turnLeft();
}
```

#### 4. Template Code Structure
Every template MUST follow this structure:

```js
// 1. PARAMETERS (always first)
var _MIN_X_ = 2;
var _MAX_X_ = 4;
var X = random(_MIN_X_, _MAX_X_);

// 2. INITIAL MOVE (enter the path)
moveForward();

// 3. MAIN LOOP (core pattern logic)
for (let i = 0; i < X; i++) {
  // Pattern body...
}

// 4. FINAL MOVE (exit the path)
moveForward();
```

**Why Initial/Final Move?** Creates buffer space before/after the pattern, ensuring player starts at spawn and ends at target.

#### 5. Avoid Circular Paths (Start ≠ Finish)
**Problem**: Nếu tổng số lần turn = 4 (hoặc bội của 4), nhân vật sẽ quay lại điểm xuất phát.

**Solutions**:
- **Zigzag Turn**: Xen kẽ `turnRight` và `turnLeft` để tránh vòng tròn.
- **Partial Loop**: Chỉ làm 3 sides của square, không làm side thứ 4.
- **Exit Segment**: Thêm đoạn thoát ra khỏi vùng trung tâm sau khi hoàn thành pattern.

---

## ⚠️ Known Issues & Fixes (Lessons Learned)

### 1. Switch Items Not Appearing
**Cause**: `convertToMapData()` only mapped `collectibles`, ignoring `interactibles`.  
**Fix**: Combine both arrays: `items: [...collectibles, ...interactibles]`

### 2. Random Mode Not Re-Randomizing on Reset
**Cause**: `MazeEngine` stored `originalConfig` by reference, which got mutated.  
**Fix**: Deep clone config at initialization: `this.originalConfig = JSON.parse(JSON.stringify(gameConfig))`

### 3. Toolbox Not Auto-Selected
**Cause**: No mapping from template tags to toolbox presets.  
**Fix**: `getToolboxFromTemplateTags()` maps tags → appropriate preset (e.g., `loops_l3` for loop templates).

### 4. Interactibles Missing from Game Config
**Cause**: `App.tsx` onGenerate handler didn't extract switches from `data.items`.  
**Fix**: Filter and convert switch items to `gameConfig.interactibles` with proper structure.

---

## 📊 Implementation Status

### Category: Progression (5/5 ✅)
| Template | Status | Uses Micro-Pattern |
|----------|--------|-------------------|
| `arithmetic-move.md` | ✅ Implemented | ✅ Yes |
| `arithmetic-collect.md` | ✅ Implemented | ✅ Yes |
| `geometric-spiral.md` | ✅ Implemented | ✅ Yes |
| `fibonacci-path.md` | ✅ Implemented | ✅ Yes |
| `decaying-path.md` | ✅ Implemented | ✅ Yes |

### Category: Logic & Parity (4/4 ✅)
| Template | Status | Forces Random Mode |
|----------|--------|-------------------|
| `alternating-move.md` | ✅ Implemented | ⚠️ Should verify |
| `alternating-interact.md` | ✅ Implemented | ⚠️ Should verify |
| `three-way-cycle.md` | ✅ Implemented | ⚠️ Should verify |
| `logic-checkerboard.md` | ✅ Implemented | ⚠️ Should verify |

### Category: Memory & Inverse (3/3 ✅)
| Template | Status |
|----------|--------|
| `path-return.md` | ✅ Implemented |
| `undo-operations.md` | ✅ Implemented |
| `palindrome-path.md` | ✅ Implemented |

### Category: Decomposition (3/4 ⚠️)
| Template | Status |
|----------|--------|
| `square-function.md` | ✅ Implemented |
| `staircase-function.md` | ✅ Implemented |
| `flower-pattern.md` | ✅ Implemented |
| **Decomp_Grid** | ❌ **Not implemented** |

### Category: Search & Optimization (0/3 ❌)
| Template | Status |
|----------|--------|
| **Search_Linear** | ❌ Not found in templates folder |
| **Search_Binary** | ❌ Not implemented |
| **Sort_Selection** | ❌ Not implemented |

### Additional Templates (Not in Original Design)
- **Conditional**: `crystal-or-switch.md`, `if-simple.md` ✅
- **Loop**: 9 templates covering basic to nested loops ✅
- **Sequential**: 4 templates for beginner level ✅
- **Variable**: `var-accumulator.md`, `var-counter.md` ✅
- **Function**: 3 templates ✅

---

## 🎯 Template Quality Checklist

Before marking a template as "complete", verify:

- [ ] Uses `var _MIN_X_` / `var _MAX_X_` / `random()` pattern
- [ ] Solution code is executable by `TemplateInterpreter`
- [ ] If uses conditionals/sensing → has correct tags for Random Mode auto-detection
- [ ] If uses `isOnSwitch()` → verify switches appear on generated map
- [ ] Category and concepts match actual template content
- [ ] Difficulty rating is appropriate (1-5 scale)

---

## 📝 Academic Skeletons Reference

### S1: Linear Arithmetic (Progression)
`for i=1 to M: repeat(i*step) { action }`

### S2: Geometric Spiral (Growth)
`len = 1; for i=1 to M: repeat(len) { action }; len *= 2; turn()`

### S3: Alternating Logic (Parity)
`for i=1 to N: if (i%2==0) { A } else { B }`

### S4: Backtracking (Stack)
Forward N, Turn, Back N (inverse operations)

### S5: State Machine (Sequence)
`while path: switch(read_state()): case R: A; case B: B`

### S6: Divide & Conquer (Fractal/Nested)
`function Line() {...}; function Square() { repeat(4) Line(); turn(); }`
