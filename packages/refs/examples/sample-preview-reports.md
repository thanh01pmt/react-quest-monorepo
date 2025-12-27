
# 📋 TEMPLATE PREVIEW REPORT

**Template ID:** `FOR_G35_LOOPS_BASIC_C1`
**Concept:** `for_counted`
**Grade Level:** 3-5
**Generated:** 2025-12-27T09:30:00Z

## 1. 📥 Input Template

### Code Template
```
for i in 1 to $N { moveForward(); pickCrystal() }
```

### Parameters
| Parameter | Range | Resolved Value |
|-----------|-------|----------------|
| `$N` | 3 - 8 | **5** |

### Resolved Code
```
for i in 1 to 5 { moveForward(); pickCrystal() }
```

## 2. 🗺️ Generated Map Preview

**Map Layout (ASCII)**
```text
    -1  0  1  2  3  4  5  6 
    ------------------------
 1 | .  S ██ ██ ██ ██ ██  . 
 0 | .  .  .  .  .  .  .  . 
-1 | .  .  .  .  .  .  .  . 
```

**Legend:** S=Start, E=End, ██=Path, C=Crystal, K=Key, W=Switch, G=Gate

**Map Layout với Items**
```text
    -1  0  1  2  3  4  5  6 
    ------------------------
 1 | .  S  C  C  C  C  C  . 
 0 | .  .  .  .  .  .  .  . 
-1 | .  .  .  .  .  .  .  . 
```

**Legend:** S=Start (→East), C=Crystal, E=End/Goal

## 3. 🔄 Execution Trace

### Statistics
- Total Path Length: 6 blocks
- Total Moves: 5
- Total Collects: 5
- Loop Iterations: 5
- Start Position: [0, 1, 1]
- Start Direction: East (+X) (1)
- End Position: [5, 1, 1]

### Action Sequence (rawActions)
```json
[
  "moveForward",
  "collect",
  "moveForward",
  "collect",
  "moveForward",
  "collect",
  "moveForward",
  "collect",
  "moveForward",
  "collect"
]
```

## 4. 📦 Items Placed

| Type | Position (x, y, z) |
|------|-------------------|
| crystal | [1, 1, 1] |
| crystal | [2, 1, 1] |
| crystal | [3, 1, 1] |
| crystal | [4, 1, 1] |
| crystal | [5, 1, 1] |

### Item Goals
```json
{
  "crystal": 5
}
```

## 5. 🧱 Ground Blocks

Total ground blocks needed: **6**

```json
[
  { "modelKey": "ground.earthChecker", "position": { "x": 0, "y": 0, "z": 1 } },
  { "modelKey": "ground.earthChecker", "position": { "x": 1, "y": 0, "z": 1 } },
  { "modelKey": "ground.earthChecker", "position": { "x": 2, "y": 0, "z": 1 } },
  { "modelKey": "ground.earthChecker", "position": { "x": 3, "y": 0, "z": 1 } },
  { "modelKey": "ground.earthChecker", "position": { "x": 4, "y": 0, "z": 1 } },
  { "modelKey": "ground.earthChecker", "position": { "x": 5, "y": 0, "z": 1 } }
]
```

## 6. 📤 Output Preview

### gameConfig Structure
```json
{
  "type": "maze",
  "renderer": "3d",
  "blocks": "[6 ground blocks]",
  "players": [
    {
      "id": "player1",
      "start": { "x": 0, "y": 1, "z": 1, "direction": 1 }
    }
  ],
  "collectibles": [
    { "id": "c1", "type": "crystal", "position": { "x": 1, "y": 1, "z": 1 } },
    { "id": "c2", "type": "crystal", "position": { "x": 2, "y": 1, "z": 1 } },
    { "id": "c3", "type": "crystal", "position": { "x": 3, "y": 1, "z": 1 } },
    { "id": "c4", "type": "crystal", "position": { "x": 4, "y": 1, "z": 1 } },
    { "id": "c5", "type": "crystal", "position": { "x": 5, "y": 1, "z": 1 } }
  ],
  "interactibles": [],
  "finish": { "x": 5, "y": 1, "z": 1 }
}
```

## 📊 Summary
```
Template: FOR_G35_LOOPS_BASIC_C1
Concept: for_counted
Grade Level: 3-5
Parameters: N=5
---
Path Length: 6 blocks
Items: 5 crystals
Actions: 10
Loop Iterations: 5
```

---

# 📋 TEMPLATE PREVIEW REPORT #2: Nested FOR Loop

**Template ID:** `NESTED_FOR_G68_GRID_C1`
**Concept:** `nested_for`
**Grade Level:** 6-8
**Generated:** 2025-12-27T09:30:00Z

## 1. 📥 Input Template

### Code Template
```
for row in 1 to $ROWS { 
  for col in 1 to $COLS { 
    moveForward(); pickCrystal() 
  } 
  turnRight(); moveForward(); turnRight() 
}
```

### Parameters
| Parameter | Range | Resolved Value |
|-----------|-------|----------------|
| `$ROWS` | 2 - 4 | **3** |
| `$COLS` | 3 - 5 | **4** |

### Resolved Code
```
for row in 1 to 3 { 
  for col in 1 to 4 { 
    moveForward(); pickCrystal() 
  } 
  turnRight(); moveForward(); turnRight() 
}
```

## 2. 🗺️ Generated Map Preview

**Map Layout (ASCII)**
```text
    -1  0  1  2  3  4  5 
    ---------------------
 4 | .  .  .  .  .  .  . 
 3 | .  S  C  C  C  C  . 
 2 | .  .  C  C  C  C  . 
 1 | .  .  C  C  C  C  . 
 0 | .  .  .  .  .  .  . 
```

**Boustrophedon Pattern (Zigzag rows):**
```text
    -1  0  1  2  3  4  5 
    ---------------------
 3 | .  S →→→→→→→→→→→ ↓ 
 2 | .  ↓ ←←←←←←←←←←← ↓ 
 1 | .  E →→→→→→→→→→→   
 0 | .  .  .  .  .  .  . 
```

**Legend:** 
- S = Start (facing East)
- → = Moving East, ← = Moving West
- ↓ = Turn + Move down
- C = Crystal position
- E = End position

## 3. 🔄 Execution Trace

### Statistics
- Total Path Length: 17 blocks
- Total Moves: 14 (12 horizontal + 2 row transitions)
- Total Collects: 12
- Loop Iterations: 12 (3 rows × 4 cols)
- Start Position: [0, 1, 3]
- Start Direction: East (+X) (1)
- End Position: [4, 1, 1]

### Action Sequence (rawActions)
```json
[
  // Row 1 (going East)
  "moveForward", "collect", "moveForward", "collect", 
  "moveForward", "collect", "moveForward", "collect",
  "turnRight", "moveForward", "turnRight",
  
  // Row 2 (going West)
  "moveForward", "collect", "moveForward", "collect",
  "moveForward", "collect", "moveForward", "collect",
  "turnRight", "moveForward", "turnRight",
  
  // Row 3 (going East)
  "moveForward", "collect", "moveForward", "collect",
  "moveForward", "collect", "moveForward", "collect"
]
```

## 4. 📦 Items Placed

### Item Goals
```json
{
  "crystal": 12
}
```

### Item Distribution
```
Row 3 (z=3): C at x=1,2,3,4
Row 2 (z=2): C at x=4,3,2,1
Row 1 (z=1): C at x=1,2,3,4
```

## 5. 🧱 Ground Blocks

Total ground blocks needed: **17**

```json
[
  // Row 3
  { "modelKey": "ground.earthChecker", "position": { "x": 0, "y": 0, "z": 3 } },
  { "modelKey": "ground.earthChecker", "position": { "x": 1, "y": 0, "z": 3 } },
  { "modelKey": "ground.earthChecker", "position": { "x": 2, "y": 0, "z": 3 } },
  { "modelKey": "ground.earthChecker", "position": { "x": 3, "y": 0, "z": 3 } },
  { "modelKey": "ground.earthChecker", "position": { "x": 4, "y": 0, "z": 3 } },
  
  // Transition column
  { "modelKey": "ground.earthChecker", "position": { "x": 4, "y": 0, "z": 2 } },
  
  // Row 2
  { "modelKey": "ground.earthChecker", "position": { "x": 3, "y": 0, "z": 2 } },
  { "modelKey": "ground.earthChecker", "position": { "x": 2, "y": 0, "z": 2 } },
  { "modelKey": "ground.earthChecker", "position": { "x": 1, "y": 0, "z": 2 } },
  { "modelKey": "ground.earthChecker", "position": { "x": 0, "y": 0, "z": 2 } },
  
  // Transition column
  { "modelKey": "ground.earthChecker", "position": { "x": 0, "y": 0, "z": 1 } },
  
  // Row 1
  { "modelKey": "ground.earthChecker", "position": { "x": 1, "y": 0, "z": 1 } },
  { "modelKey": "ground.earthChecker", "position": { "x": 2, "y": 0, "z": 1 } },
  { "modelKey": "ground.earthChecker", "position": { "x": 3, "y": 0, "z": 1 } },
  { "modelKey": "ground.earthChecker", "position": { "x": 4, "y": 0, "z": 1 } }
]
```

## 6. 📤 Output Preview

### gameConfig Structure
```json
{
  "type": "maze",
  "renderer": "3d",
  "blocks": "[17 ground blocks]",
  "players": [
    {
      "id": "player1",
      "start": { "x": 0, "y": 1, "z": 3, "direction": 1 }
    }
  ],
  "collectibles": [
    { "id": "c1", "type": "crystal", "position": { "x": 1, "y": 1, "z": 3 } },
    { "id": "c2", "type": "crystal", "position": { "x": 2, "y": 1, "z": 3 } },
    { "id": "c3", "type": "crystal", "position": { "x": 3, "y": 1, "z": 3 } },
    { "id": "c4", "type": "crystal", "position": { "x": 4, "y": 1, "z": 3 } },
    { "id": "c5", "type": "crystal", "position": { "x": 4, "y": 1, "z": 2 } },
    { "id": "c6", "type": "crystal", "position": { "x": 3, "y": 1, "z": 2 } },
    { "id": "c7", "type": "crystal", "position": { "x": 2, "y": 1, "z": 2 } },
    { "id": "c8", "type": "crystal", "position": { "x": 1, "y": 1, "z": 2 } },
    { "id": "c9", "type": "crystal", "position": { "x": 1, "y": 1, "z": 1 } },
    { "id": "c10", "type": "crystal", "position": { "x": 2, "y": 1, "z": 1 } },
    { "id": "c11", "type": "crystal", "position": { "x": 3, "y": 1, "z": 1 } },
    { "id": "c12", "type": "crystal", "position": { "x": 4, "y": 1, "z": 1 } }
  ],
  "interactibles": [],
  "finish": { "x": 4, "y": 1, "z": 1 }
}
```

## 📊 Summary
```
Template: NESTED_FOR_G68_GRID_C1
Concept: nested_for
Grade Level: 6-8
Parameters: ROWS=3, COLS=4
---
Path Length: 17 blocks
Items: 12 crystals
Actions: 26 (14 moves + 12 collects)
Loop Iterations: 12
```

---

# 📋 TEMPLATE PREVIEW REPORT #3: Function Refactoring

**Template ID:** `FUNC_G34_REFACTOR_C3`
**Concept:** `function_definition`
**Grade Level:** 3-4
**Generated:** 2025-12-27T09:30:00Z

## 1. 📥 Input Template

### Code Template
```
func clearBranch() { 
  moveForward(); moveForward(); pickCrystal(); 
  turnLeft(); turnLeft(); 
  moveForward(); moveForward() 
}

moveForward(); moveForward(); moveForward();
turnRight(); clearBranch(); turnRight();
moveForward();
turnLeft(); clearBranch(); turnLeft();
moveForward();
turnRight(); clearBranch(); turnRight();
moveForward(); moveForward(); moveForward()
```

### Parameters
(None - Fixed template)

## 2. 🗺️ Generated Map Preview

**Map Layout (ASCII) - 3 Branches Pattern**
```text
        0  1  2  3  4  5  6  7  8  9 
       ------------------------------
    6 | .  .  .  .  C  .  C  .  .  . 
    5 | .  .  .  .  ██ .  ██ .  .  . 
    4 | .  S ██ ██ ██ ██ ██ ██ ██ E 
    3 | .  .  .  .  ██ .  ██ .  .  . 
    2 | .  .  .  .  C  .  C  .  .  . 
    1 | .  .  .  .  .  .  .  .  .  . 
```

**Execution Path:**
```text
Start → → → ↑ ↑ C ↓ ↓ → ↓ ↓ C ↑ ↑ → ↑ ↑ C ↓ ↓ → → → End
              Branch1     Branch2     Branch3
```

**Legend:** 
- S = Start, E = End
- ██ = Path blocks
- C = Crystal (at end of each branch)
- Arrows show movement direction

## 3. 🔄 Execution Trace

### Statistics
- Total Path Length: 14 blocks (main path) + 6 blocks (3 branches × 2)
- Total Moves: 34
- Total Collects: 3
- Function Calls: 3 (clearBranch called 3 times)
- Start Position: [1, 1, 4]
- Start Direction: East (+X) (1)
- End Position: [9, 1, 4]

### rawActions (Expanded)
```json
[
  "moveForward", "moveForward", "moveForward",
  "turnRight",
  "moveForward", "moveForward", "collect", "turnLeft", "turnLeft", "moveForward", "moveForward",
  "turnRight",
  "moveForward",
  "turnLeft",
  "moveForward", "moveForward", "collect", "turnLeft", "turnLeft", "moveForward", "moveForward",
  "turnLeft",
  "moveForward",
  "turnRight",
  "moveForward", "moveForward", "collect", "turnLeft", "turnLeft", "moveForward", "moveForward",
  "turnRight",
  "moveForward", "moveForward", "moveForward"
]
```

### structuredSolution (With Function)
```json
{
  "main": [
    { "type": "maze_moveForward" },
    { "type": "maze_moveForward" },
    { "type": "maze_moveForward" },
    { "type": "maze_turn", "direction": "turnRight" },
    { "type": "procedures_callnoreturn", "mutation": { "name": "clearBranch" } },
    { "type": "maze_turn", "direction": "turnRight" },
    { "type": "maze_moveForward" },
    { "type": "maze_turn", "direction": "turnLeft" },
    { "type": "procedures_callnoreturn", "mutation": { "name": "clearBranch" } },
    { "type": "maze_turn", "direction": "turnLeft" },
    { "type": "maze_moveForward" },
    { "type": "maze_turn", "direction": "turnRight" },
    { "type": "procedures_callnoreturn", "mutation": { "name": "clearBranch" } },
    { "type": "maze_turn", "direction": "turnRight" },
    { "type": "maze_moveForward" },
    { "type": "maze_moveForward" },
    { "type": "maze_moveForward" }
  ],
  "procedures": {
    "clearBranch": [
      { "type": "maze_moveForward" },
      { "type": "maze_moveForward" },
      { "type": "maze_collect" },
      { "type": "maze_turn", "direction": "turnLeft" },
      { "type": "maze_turn", "direction": "turnLeft" },
      { "type": "maze_moveForward" },
      { "type": "maze_moveForward" }
    ]
  }
}
```

## 4. 📦 Items Placed

| Type | Position (x, y, z) | Branch |
|------|-------------------|--------|
| crystal | [4, 1, 6] | Branch 1 (North) |
| crystal | [6, 1, 2] | Branch 2 (South) |
| crystal | [4, 1, 2] | Branch 3 (North) |

### Item Goals
```json
{
  "crystal": 3
}
```

## 📊 Summary
```
Template: FUNC_G34_REFACTOR_C3
Concept: function_definition
Grade Level: 3-4
Parameters: (none)
---
Path Length: 20 blocks
Items: 3 crystals
Actions: 37 (34 moves + 3 collects)
Function Calls: 3
Optimal Blocks: 17 (with function reuse)
Basic Blocks: 37 (without function)
```

---

## Comparison: Solution Types

| Metric | Basic (Expanded) | Optimal (With Function) | Savings |
|--------|------------------|------------------------|---------|
| Block Count | 37 | 17 | 54% reduction |
| Code Lines | 37 | 24 | 35% reduction |
| Repetition | 3× same code | 1 definition + 3 calls | ✓ DRY principle |
