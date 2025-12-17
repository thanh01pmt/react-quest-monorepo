# L-Shape Map Variant Analysis

**Date**: 2024-12-17
**Test Configuration**: `instructions/test/test-l_shape.tsv`
**Sample Size**: 50 variants

---

## 📊 Overview

L-shaped maps sử dụng `SegmentPlacerStrategy` với 5 function patterns để tạo đa dạng biến thể. Mỗi pattern có cách đặt switches khác nhau, tạo ra các bài toán coding functions với độ khó và cấu trúc đa dạng.

---

## 🎯 Function Patterns

### 1. CORNER_CENTRIC (Pattern B)
**Mô tả**: Items được đặt đối xứng quanh góc cua (corner point)

```
          [S1]
           |
[S2]-----[C]-----[S3]
           |
          [S4]
```

**Đặc điểm**:
- Switches gần corner
- Giúp học sinh hiểu "rẽ góc" như một checkpoint
- Function pattern: `moveForward(); toggleSwitch(); turn(); toggleSwitch(); moveForward();`

---

### 2. SYMMETRIC (Pattern C)
**Mô tả**: Cùng số items ở cùng vị trí tương đối trên mỗi segment

```
Leg 1:  START ---[S1]---[S2]---[CORNER]
Leg 2:  [CORNER]---[S3]---[S4]--- FINISH
```

**Đặc điểm**:
- Items at equal distances from start/end of each leg
- Random mode: 'start' or 'end' anchoring
- Enables reusable loop: `repeat 2 { walkSegment(); toggleSwitch(); }`

**Hai modes**:
- `start` mode: Đếm từ đầu segment
- `end` mode: Đếm từ cuối segment

---

### 3. TURN_START (Pattern D)
**Mô tả**: Function bắt đầu với lệnh turn, sau đó là move + toggle

```
Leg 1:  START ---[empty]---[CORNER]
Leg 2:  [CORNER]---[S1]--- ---[S2]--- FINISH
```

**Đặc điểm**:
- Ít switches hơn (thường 2)
- Phù hợp cho bài học về control flow
- Function pattern: `turn(); repeat N { moveForward(); toggleSwitch(); }`

---

### 4. CORNER_CHECKPOINT (Pattern E)
**Mô tả**: Corner là điểm đánh dấu (checkpoint), có thể có switch tại đó

```
Leg 1:  START ---[S1]---[CORNER+S2]
Leg 2:  [CORNER+S2]---[S3]--- FINISH
```

**Đặc điểm**:
- Corner có thể có item
- Tối thiểu 1 item (tại corner)
- Giúp hiểu khái niệm checkpoint

---

### 5. PROPORTIONAL (Pattern F) - NEW
**Mô tả**: Số items tỷ lệ với độ dài segment, nhưng giữ CÙNG spacing

```
Short Leg:  START ---[S1]---[CORNER]
Long Leg:   [CORNER]---[S2]---[S3]---[S4]--- FINISH
```

**Đặc điểm**:
- Segment dài hơn có nhiều items hơn
- Spacing giữa items giống nhau trên mọi segment
- Enables parametric functions: `walkAndCollect(N)` với N khác nhau

---

## 📈 Distribution Results (50 variants)

### Switch Count Distribution

| Pattern Type | Switches | Count | Percentage |
|--------------|----------|-------|------------|
| Low density  | 2        | 20    | 40%        |
| Medium       | 3        | 10    | 20%        |
| High density | 4        | 20    | 40%        |

### Pattern Selection (AUTO mode - 20% each)

```
SYMMETRIC:        ~20%  → 3-4 switches
CORNER_CENTRIC:   ~20%  → 2-4 switches  
TURN_START:       ~20%  → 2 switches
CORNER_CHECKPOINT:~20%  → 1-3 switches
PROPORTIONAL:     ~20%  → 2-4 switches
```

---

## 🔧 Configuration Parameters

### TSV Configuration
```tsv
gen_map_type        l_shape
gen_logic_type      function_logic
items_to_place      ['switch']
solution_item_goals switch:all
leg1_length         4
leg2_length         4
```

### Key Parameters

| Parameter | Default | Description |
|-----------|---------|-------------|
| `leg1_length` | 5 | Length of first leg (blocks) |
| `leg2_length` | 5 | Length of second leg (blocks) |
| `items_to_place` | ['switch'] | Types of items to place |
| `quantity_mode` | 'auto' | auto/ratio/explicit |
| `function_pattern` | 'auto' | Specific pattern or auto-random |

---

## 📝 Sample Variants

### Variant 1: SYMMETRIC (4 switches)
```
Positions: [(16,1,19), (15,1,19), (13,1,18), (13,1,17)]
Pattern: 2 switches per segment, symmetric positioning
Function: repeat 2 { walkSegment(); collect(); collect(); }
```

### Variant 12: TURN_START (2 switches)
```
Positions: [(8,1,7), (4,1,4)]
Pattern: Minimal switches, function starts with turn
Function: turn(); moveForward(X); toggleSwitch(); ...
```

### Variant 16: CORNER_CENTRIC (3 switches)
```
Positions: [(13,1,3), (13,1,8), (16,1,3)]
Pattern: Switches clustered near corner
Function: approach(); toggleSwitch(); turn(); collect(); ...
```

---

## 🎮 Educational Value

### For Each Pattern:

| Pattern | Coding Concept | Bloom Level |
|---------|----------------|-------------|
| SYMMETRIC | Reusable loops with consistent structure | APPLY |
| CORNER_CENTRIC | Checkpoint-based navigation | APPLY |
| TURN_START | Control flow with conditionals | ANALYZE |
| CORNER_CHECKPOINT | State management at keypoints | APPLY |
| PROPORTIONAL | Parametric functions | CREATE |

### Recommended Difficulty Progression:
1. **Easy**: CORNER_CHECKPOINT (1-2 switches)
2. **Medium**: TURN_START, SYMMETRIC (2-3 switches)
3. **Hard**: PROPORTIONAL, CORNER_CENTRIC (3-4 switches)

---

## 📸 Visual Pattern Examples

### 2-Switch Pattern (TURN_START)
```
┌─────┐
│  S  │ Start
│  │  │
│  ▼  │
│  ·  │ Leg 1 (no switches)
│  │  │
│  ▼  │
│  ■──┼────────┐ Corner
│     │   ·    │
│     │   [1]  │ Switch 1
│     │   ·    │
│     │   [2]  │ Switch 2
│     │   ·    │
│     │   F    │ Finish
└─────┴────────┘
```

### 4-Switch Pattern (SYMMETRIC)
```
┌─────┐
│  S  │ Start
│  │  │
│ [1] │ Switch 1 (leg1, pos 2)
│  │  │
│ [2] │ Switch 2 (leg1, pos 3)
│  │  │
│  ■──┼────────┐ Corner
│     │  [3]   │ Switch 3 (leg2, pos 2)
│     │   │    │
│     │  [4]   │ Switch 4 (leg2, pos 3)
│     │   │    │
│     │   F    │ Finish
└─────┴────────┘
```

---

## 🔗 Related Files

- **Strategy**: `src/map_generator/placements/strategies/segment_placer_strategy.py`
- **Patterns Enum**: `FunctionPattern` (lines 24-40)
- **Pattern Implementations**:
  - `_place_symmetric()` (lines 195-280)
  - `_place_corner_centric()` (lines 143-195)
  - `_place_turn_start()` (lines 280-320)
  - `_place_corner_checkpoint()` (lines 320-360)
  - `_place_proportional()` (lines 360-395)
