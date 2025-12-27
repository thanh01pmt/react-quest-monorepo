# Solution-Driven Output Specification

## 1. Overview

Output của Solution-Driven generator phải khớp với cấu trúc map hiện tại của game để có thể load trực tiếp.

## 2. Complete Output Schema

Dựa trên format hiện tại (ví dụ: `FUNCTIONS_G34.CODING_FUNCTIONS_REFACTORING.REFACTOR.C3-var1.json`):

```typescript
interface GeneratedMapOutput {
  // === IDENTIFICATION ===
  id: string;                    // e.g., "FOR_G35.LOOPS_BASIC.C1-var1"
  gameType: 'maze';
  topic: string;                 // e.g., "topic-title-loops_basic"
  level: number;                 // 1-10
  
  // === LOCALIZATION ===
  titleKey: string;              // Translation key for title
  questTitleKey: string;         // Translation key for quest
  descriptionKey: string;        // Translation key for description
  translations: {
    vi: Record<string, string>;
    en: Record<string, string>;
  };
  
  // === EDITOR CONFIG ===
  supportedEditors: ('blockly' | 'monaco')[];
  blocklyConfig: BlocklyConfig;
  
  // === GAME CONFIG ===
  gameConfig: GameConfig;
  
  // === SOLUTION ===
  solution: SolutionConfig;
  
  // === ASSETS ===
  sounds: {
    win: string;
    fail: string;
  };
}
```

---

## 3. GameConfig Details

```typescript
interface GameConfig {
  type: 'maze';
  renderer: '3d';
  
  // Ground blocks (walkable tiles)
  blocks: GroundBlock[];
  
  // Player start position(s)
  players: Player[];
  
  // Items to collect
  collectibles: Collectible[];
  
  // Interactive objects
  interactibles: Interactible[];
  
  // Goal position
  finish: Vector3;
}

interface GroundBlock {
  modelKey: string;              // e.g., "ground.earthChecker"
  position: Vector3;             // { x, y, z } where y=0 for ground
}

interface Player {
  id: string;                    // e.g., "player1"
  start: {
    x: number;
    y: number;                   // Typically 1 (above ground)
    z: number;
    direction: 0 | 1 | 2 | 3;    // 0=North, 1=East, 2=South, 3=West
  };
}

interface Collectible {
  id: string;                    // e.g., "c1", "c2"
  type: 'crystal' | 'key';
  position: Vector3;             // { x, y, z } where y=1 (on ground)
}

interface Interactible {
  id: string;                    // e.g., "switch1", "gate1"
  type: 'switch' | 'gate' | 'portal';
  position: Vector3;
  state?: any;                   // Initial state (on/off, open/closed)
  linkedTo?: string;             // ID of linked object (switch → gate)
}

interface Vector3 {
  x: number;
  y: number;
  z: number;
}
```

---

## 4. Solution Details

```typescript
interface SolutionConfig {
  type: 'reach_target';
  
  // Required item counts
  itemGoals: {
    crystal?: number;
    key?: number;
  };
  
  // Optimal metrics
  optimalBlocks: number;         // Minimum blocks for optimal solution
  optimalLines: number;          // Minimum lines of code
  
  // Raw action sequence (flat list)
  rawActions: string[];          // ["moveForward", "turnRight", "collect", ...]
  
  // Structured solution (with procedures)
  structuredSolution: {
    main: BlockAction[];         // Main program blocks
    procedures: Record<string, BlockAction[]>;  // Function definitions
  };
  
  // Basic solution (no procedures, fully expanded)
  basicSolution: {
    main: BlockAction[];
    procedures: {};
  };
}

interface BlockAction {
  type: string;                  // Block type: "maze_moveForward", "maze_turn", etc.
  direction?: 'turnLeft' | 'turnRight';  // For turn blocks
  mutation?: {                   // For procedure calls
    name: string;
  };
}
```

---

## 5. Blockly Config Details

```typescript
interface BlocklyConfig {
  toolbox: ToolboxConfig;
  maxBlocks?: number;            // Block limit for challenge
  startBlocks?: string;          // Initial XML blocks
  toolboxPresetKey?: string;     // Preset key for toolbox
}

interface ToolboxConfig {
  kind: 'categoryToolbox';
  contents: ToolboxCategory[];
}

interface ToolboxCategory {
  kind: 'category' | 'sep';
  name?: string;                 // e.g., "%{BKY_GAMES_CATMOVEMENT}"
  categorystyle?: string;        // e.g., "movement_category"
  custom?: string;               // e.g., "PROCEDURE" for dynamic
  contents?: ToolboxBlock[];
}

interface ToolboxBlock {
  kind: 'block';
  type: string;                  // e.g., "maze_moveForward", "controls_repeat"
}
```

---

## 6. Concrete Example: Input → Output

### Input (Standard Format):

```json
{
  "id": "FOR_G35_LOOPS_BASIC_C1",
  "concept": "for_counted",
  "gradeLevel": "3-5",
  "code": "for i in 1 to $N { moveForward(); pickCrystal() }",
  "parameters": {
    "N": { "min": 3, "max": 8 }
  },
  "meta": {
    "topic": "loops_basic",
    "titleVi": "Thu thập pha lê",
    "titleEn": "Collect Crystals",
    "descVi": "Sử dụng vòng lặp để thu thập tất cả pha lê",
    "descEn": "Use a loop to collect all crystals"
  }
}
```

### Output (when N=5):

```json
{
  "id": "FOR_G35.LOOPS_BASIC.C1-var1",
  "gameType": "maze",
  "topic": "topic-title-loops_basic",
  "level": 1,
  "titleKey": "Challenge.FOR_G35.LOOPS_BASIC.C1.Title",
  "questTitleKey": "Challenge.FOR_G35.LOOPS_BASIC.C1.Description",
  "descriptionKey": "Challenge.FOR_G35.LOOPS_BASIC.C1.Description",
  "translations": {
    "vi": {
      "Challenge.FOR_G35.LOOPS_BASIC.C1.Title": "Thu thập pha lê",
      "Challenge.FOR_G35.LOOPS_BASIC.C1.Description": "Sử dụng vòng lặp để thu thập tất cả pha lê",
      "topic-title-loops_basic": "Vòng lặp cơ bản"
    },
    "en": {
      "Challenge.FOR_G35.LOOPS_BASIC.C1.Title": "Collect Crystals",
      "Challenge.FOR_G35.LOOPS_BASIC.C1.Description": "Use a loop to collect all crystals",
      "topic-title-loops_basic": "Basic Loops"
    }
  },
  "supportedEditors": ["blockly", "monaco"],
  "blocklyConfig": {
    "toolbox": {
      "kind": "categoryToolbox",
      "contents": [
        {
          "kind": "category",
          "name": "%{BKY_GAMES_CATMOVEMENT}",
          "categorystyle": "movement_category",
          "contents": [
            { "kind": "block", "type": "maze_moveForward" },
            { "kind": "block", "type": "maze_turn" }
          ]
        },
        {
          "kind": "category",
          "name": "%{BKY_GAMES_CATACTIONS}",
          "categorystyle": "actions_category",
          "contents": [
            { "kind": "block", "type": "maze_collect" }
          ]
        },
        { "kind": "sep" },
        {
          "kind": "category",
          "name": "%{BKY_GAMES_CATLOOPS}",
          "categorystyle": "loop_category",
          "contents": [
            { "kind": "block", "type": "controls_repeat_ext" }
          ]
        }
      ]
    },
    "maxBlocks": 10
  },
  "gameConfig": {
    "type": "maze",
    "renderer": "3d",
    "blocks": [
      { "modelKey": "ground.earthChecker", "position": { "x": 0, "y": 0, "z": 0 } },
      { "modelKey": "ground.earthChecker", "position": { "x": 1, "y": 0, "z": 0 } },
      { "modelKey": "ground.earthChecker", "position": { "x": 2, "y": 0, "z": 0 } },
      { "modelKey": "ground.earthChecker", "position": { "x": 3, "y": 0, "z": 0 } },
      { "modelKey": "ground.earthChecker", "position": { "x": 4, "y": 0, "z": 0 } },
      { "modelKey": "ground.earthChecker", "position": { "x": 5, "y": 0, "z": 0 } }
    ],
    "players": [
      {
        "id": "player1",
        "start": { "x": 0, "y": 1, "z": 0, "direction": 1 }
      }
    ],
    "collectibles": [
      { "id": "c1", "type": "crystal", "position": { "x": 1, "y": 1, "z": 0 } },
      { "id": "c2", "type": "crystal", "position": { "x": 2, "y": 1, "z": 0 } },
      { "id": "c3", "type": "crystal", "position": { "x": 3, "y": 1, "z": 0 } },
      { "id": "c4", "type": "crystal", "position": { "x": 4, "y": 1, "z": 0 } },
      { "id": "c5", "type": "crystal", "position": { "x": 5, "y": 1, "z": 0 } }
    ],
    "interactibles": [],
    "finish": { "x": 5, "y": 1, "z": 0 }
  },
  "solution": {
    "type": "reach_target",
    "itemGoals": {
      "crystal": 5
    },
    "optimalBlocks": 4,
    "optimalLines": 4,
    "rawActions": [
      "moveForward", "collect",
      "moveForward", "collect",
      "moveForward", "collect",
      "moveForward", "collect",
      "moveForward", "collect"
    ],
    "structuredSolution": {
      "main": [
        {
          "type": "controls_repeat_ext",
          "times": 5,
          "do": [
            { "type": "maze_moveForward" },
            { "type": "maze_collect" }
          ]
        }
      ],
      "procedures": {}
    },
    "basicSolution": {
      "main": [
        { "type": "maze_moveForward" },
        { "type": "maze_collect" },
        { "type": "maze_moveForward" },
        { "type": "maze_collect" },
        { "type": "maze_moveForward" },
        { "type": "maze_collect" },
        { "type": "maze_moveForward" },
        { "type": "maze_collect" },
        { "type": "maze_moveForward" },
        { "type": "maze_collect" }
      ],
      "procedures": {}
    }
  },
  "sounds": {
    "win": "/assets/maze/win.mp3",
    "fail": "/assets/maze/fail_pegman.mp3"
  }
}
```

---

## 7. Visual Representation

```
MAP LAYOUT (Top View, Z-axis is vertical on screen):
       z
       ↑
       │
   ────┼────────────────→ x
       │
       0   1   2   3   4   5
     ┌───┬───┬───┬───┬───┬───┐
   0 │ S │ C │ C │ C │ C │ C │
     │ → │   │   │   │   │ F │
     └───┴───┴───┴───┴───┴───┘

S = Start (Player, facing East, direction=1)
C = Crystal (collectible)
F = Finish

3D Coordinates:
- x: horizontal position (0-5)
- y: vertical height (0=ground, 1=on ground)
- z: depth position (0 for this linear map)

Direction values:
- 0 = North (+Z)
- 1 = East  (+X)
- 2 = South (-Z)
- 3 = West  (-X)
```

---

## 8. Block Type Reference

```typescript
// Movement blocks
'maze_moveForward'  // Move one cell forward
'maze_turn'         // Turn left or right
'maze_jump'         // Jump over obstacle

// Action blocks  
'maze_collect'      // Pick up collectible
'maze_toggle_switch' // Toggle switch

// Control blocks
'controls_repeat_ext'     // For loop with number
'controls_whileUntil'     // While loop
'controls_if'             // If statement
'controls_ifelse'         // If-else statement

// Procedure blocks
'procedures_defnoreturn'  // Function definition
'procedures_callnoreturn' // Function call
```

---

## 9. Direction Mapping

```typescript
enum Direction {
  NORTH = 0,  // +Z direction
  EAST = 1,   // +X direction  
  SOUTH = 2,  // -Z direction
  WEST = 3    // -X direction
}

// Turn effects:
// turnRight: direction = (direction + 1) % 4
// turnLeft:  direction = (direction + 3) % 4
```

---

## 10. Generator Flow

```
┌─────────────────┐
│  Standard Input │
│  (code + params)│
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Parse Template │
│  Resolve $PARAMS│
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   Interpreter   │
│  Execute code   │
│  Track path     │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Map Builder    │
│  - Ground blocks│
│  - Collectibles │
│  - Player start │
│  - Finish pos   │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Solution Builder│
│  - rawActions   │
│  - structured   │
│  - basic        │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Output JSON    │
│  (Full map file)│
└─────────────────┘
```

---

## 11. Key Differences from Previous Spec

| Field | Previous | Actual (Current Game) |
|-------|----------|----------------------|
| Position | 2D `{ x, y }` | 3D `{ x, y, z }` |
| Direction | String `'NORTH'` | Number `0-3` |
| Player height | Implicit | `y: 1` (above ground) |
| Ground height | Implicit | `y: 0` |
| Solution | Single format | `rawActions` + `structuredSolution` + `basicSolution` |
| Translations | Inline | Keyed with `translations` object |
| Toolbox | Simple | Full Blockly category structure |
