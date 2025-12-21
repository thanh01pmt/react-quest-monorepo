# Academic Concept Curriculum Map

## Concept Taxonomy Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                          ACADEMIC CONCEPTS                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────┐                                                            │
│  │ SEQUENTIAL  │  Difficulty: 1                                             │
│  │ (Tuần tự)   │  Blocks: moveForward, turnLeft, turnRight                  │
│  └──────┬──────┘                                                            │
│         │                                                                   │
│         ▼                                                                   │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                           LOOP                                       │   │
│  ├─────────────────────────────────────────────────────────────────────┤   │
│  │                                                                      │   │
│  │  repeat_n (2) ──────┬──────────────────────────────────────────────▶│   │
│  │       │             │                                               │   │
│  │       │     ┌───────┴───────┐                                       │   │
│  │       ▼     ▼               ▼                                       │   │
│  │  repeat_until (4)    while_condition (5)    for_each (6)            │   │
│  │       │                     │                    │                  │   │
│  │       │                     └──────┬─────────────┘                  │   │
│  │       │                            ▼                                │   │
│  │       │                    infinite_loop (7)                        │   │
│  │       │                                                             │   │
│  └───────┼─────────────────────────────────────────────────────────────┘   │
│          │                                                                  │
│          ▼                                                                  │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                        CONDITIONAL                                   │   │
│  ├─────────────────────────────────────────────────────────────────────┤   │
│  │                                                                      │   │
│  │  if_simple (3) ─────┬──────────────────────────────────────────────▶│   │
│  │       │             │                                               │   │
│  │       ▼             ▼                                               │   │
│  │  if_else (4)   nested_if (6)                                        │   │
│  │       │                                                             │   │
│  │       ▼                                                             │   │
│  │  if_elif_else (5)                                                   │   │
│  │       │                                                             │   │
│  │       ▼                                                             │   │
│  │  switch_case (6)                                                    │   │
│  │                                                                      │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                         FUNCTION                                     │   │
│  ├─────────────────────────────────────────────────────────────────────┤   │
│  │                                                                      │   │
│  │  procedure_simple (4) ─────┬──────────────────────────────────────▶ │   │
│  │       │                    │                                        │   │
│  │       ▼                    ▼                                        │   │
│  │  procedure_with_param (6)  function_compose (7)                     │   │
│  │       │                                                             │   │
│  │       ▼                                                             │   │
│  │  function_return (7)                                                │   │
│  │                                                                      │   │
│  │  recursion (9) ◀──── procedure_simple + if_simple                   │   │
│  │                                                                      │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                         VARIABLE                                     │   │
│  ├─────────────────────────────────────────────────────────────────────┤   │
│  │                                                                      │   │
│  │  counter (3) ◀──── repeat_n                                         │   │
│  │       │                                                             │   │
│  │       ├──────────────┬──────────────────────────────────────────▶   │   │
│  │       ▼              ▼                                              │   │
│  │  accumulator (5)   collection (6)                                   │   │
│  │                                                                      │   │
│  │  state_toggle (4) ◀──── if_simple                                   │   │
│  │       │                                                             │   │
│  │       ▼                                                             │   │
│  │  flag (5)                                                           │   │
│  │                                                                      │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Concept Combinations

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                        CONCEPT COMBINATIONS                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                    LOOP + VARIABLE                                   │   │
│  ├─────────────────────────────────────────────────────────────────────┤   │
│  │                                                                      │   │
│  │  repeat_n + counter ──────▶ repeat_n_counter (4)                    │   │
│  │                             "Loop n lần, đếm số vòng"               │   │
│  │                                                                      │   │
│  │  while + counter ─────────▶ while_counter (6)                       │   │
│  │                             "Lặp đến khi counter = target"          │   │
│  │                                                                      │   │
│  │  repeat_until + state ────▶ repeat_until_state (5)                  │   │
│  │                             "Lặp đến khi switch được bật"           │   │
│  │                                                                      │   │
│  │  for_each + accumulator ──▶ for_each_accumulator (7)                │   │
│  │                             "Tính tổng qua collection"              │   │
│  │                                                                      │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                   LOOP + CONDITIONAL                                 │   │
│  ├─────────────────────────────────────────────────────────────────────┤   │
│  │                                                                      │   │
│  │  repeat_n + if ───────────▶ loop_if_inside (5)                      │   │
│  │                             "Repeat 5: if crystal → collect"        │   │
│  │                                                                      │   │
│  │  if + repeat_n ───────────▶ if_loop_inside (5)                      │   │
│  │                             "If path_ahead → repeat 3"              │   │
│  │                                                                      │   │
│  │  while + if + break ──────▶ loop_break (6)                          │   │
│  │                             "While true: if goal → break"           │   │
│  │                                                                      │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                   FUNCTION + LOOP                                    │   │
│  ├─────────────────────────────────────────────────────────────────────┤   │
│  │                                                                      │   │
│  │  procedure + repeat ──────▶ function_loop_inside (5)                │   │
│  │                             "Procedure chứa repeat 3"               │   │
│  │                                                                      │   │
│  │  repeat + procedure ──────▶ loop_function_call (5)                  │   │
│  │                             "Repeat 4: call processBranch()"        │   │
│  │                                                                      │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                   NESTED STRUCTURES                                  │   │
│  ├─────────────────────────────────────────────────────────────────────┤   │
│  │                                                                      │   │
│  │  repeat + repeat ─────────▶ nested_loop (7)                         │   │
│  │                             "Outer 3 × Inner 4 = 12 iterations"     │   │
│  │                                                                      │   │
│  │  if + if ─────────────────▶ nested_conditional (6)                  │   │
│  │                             "If path → if crystal → collect"        │   │
│  │                                                                      │   │
│  │  procedure + procedure ───▶ nested_function (6)                     │   │
│  │                             "processArea() calls moveToBranch()"    │   │
│  │                                                                      │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
│  ┌─────────────────────────────────────────────────────────────────────┐   │
│  │                   TRIPLE COMBINATIONS                                │   │
│  ├─────────────────────────────────────────────────────────────────────┤   │
│  │                                                                      │   │
│  │  repeat + if + call ──────▶ loop_if_function (8)                    │   │
│  │                             "Repeat 4: if hasBranch → process()"    │   │
│  │                                                                      │   │
│  │  procedure(repeat(if)) ───▶ function_loop_if (8)                    │   │
│  │                             "Procedure chứa loop chứa if"           │   │
│  │                                                                      │   │
│  └─────────────────────────────────────────────────────────────────────┘   │
│                                                                             │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Difficulty Progression

| Level | Concepts | Map Features |
|-------|----------|--------------|
| 1 | `sequential` | Straight line, no turns |
| 2 | `repeat_n` | Straight line, regular crystals |
| 3 | `counter`, `if_simple`, `pattern_recognition` | Line with conditions |
| 4 | `if_else`, `state_toggle`, `procedure_simple`, `repeat_n_counter` | Branching paths |
| 5 | `repeat_until`, `if_elif_else`, `accumulator`, `loop_if_inside`, `loop_function_call` | Complex paths |
| 6 | `while_condition`, `for_each`, `procedure_with_param`, `nested_conditional` | Multiple areas |
| 7 | `nested_loop`, `function_compose`, `function_return` | Grid patterns |
| 8 | `loop_if_function`, `function_loop_if` | Complex combinations |
| 9 | `recursion` | Fractal/self-similar |

## Map Feature ↔ Concept Mapping

| Map Feature | Best Concepts | Pattern |
|-------------|---------------|---------|
| **Đường thẳng dài** | `repeat_n`, `repeat_until` | Loop đơn |
| **Crystal cách đều** | `repeat_n_counter` | Loop + đếm |
| **Nhánh đối xứng** | `procedure_simple`, `loop_function_call` | Function reuse |
| **Nhánh không đều** | `if_else`, `if_elif_else` | Conditional |
| **Grid 2D** | `nested_loop` | Loop lồng |
| **Switch xen kẽ crystal** | `loop_if_inside`, `state_toggle` | Loop + conditional + variable |
| **Đường zigzag** | `repeat_n` với `turnLeft`/`turnRight` | Loop với pattern xoay |
| **Spiral** | `while_counter` | While + đếm giảm |
| **Cross/Plus shape** | `loop_function_call` (4 branches) | Function × 4 |
| **Arrow shape** | `procedure_simple` (wings đối xứng) | Function reuse |

## Usage Example

```typescript
import { 
  CONCEPT_CURRICULUM, 
  getNextConcepts, 
  checkPrerequisites,
  AcademicConcept 
} from './AcademicConceptTypes';

// Student đã học các concepts này
const masteredConcepts: AcademicConcept[] = [
  'sequential',
  'repeat_n',
  'if_simple'
];

// Tìm concepts có thể học tiếp
const nextConcepts = getNextConcepts(masteredConcepts);
// Result: ['repeat_until', 'if_else', 'procedure_simple', 'counter', ...]

// Kiểm tra có thể học nested_loop chưa
const canLearnNestedLoop = checkPrerequisites('nested_loop', masteredConcepts);
// Result: true (vì chỉ cần repeat_n)

// Lấy metadata của concept
const loopMeta = CONCEPT_CURRICULUM['repeat_n'];
// Result: { difficulty: 2, blockTypes: ['repeat_times'], ... }
```
