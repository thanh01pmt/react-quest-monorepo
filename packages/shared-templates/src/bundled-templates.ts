/**
 * Auto-generated file. Do not edit directly.
 * Generated from templates/*.md
 */
import type { TemplateConfig } from './types';

export const BUNDLED_TEMPLATES: TemplateConfig[] = [
  {
    "metadata": {
      "id": "crystal-or-switch",
      "name": "Crystal or Switch",
      "category": "conditional",
      "concepts": [
        "if_else"
      ],
      "difficulty": 4,
      "tags": [
        "if",
        "else",
        "detect"
      ],
      "author": "system",
      "version": 2,
      "description": "Decide whether to collect crystal or activate switch"
    },
    "parameters": [
      {
        "name": "_MIN_PATH_LENGTH_",
        "displayName": "Min Path Length",
        "type": "number",
        "defaultValue": 3
      },
      {
        "name": "_MAX_PATH_LENGTH_",
        "displayName": "Max Path Length",
        "type": "number",
        "defaultValue": 5
      },
      {
        "name": "_INTERACTION_",
        "displayName": "Interaction",
        "type": "string",
        "defaultValue": "crystal"
      },
      {
        "name": "_TURN_STYLE_",
        "displayName": "Turn Style",
        "type": "string",
        "defaultValue": "straight"
      },
      {
        "name": "_TURN_POINT_",
        "displayName": "Turn Point",
        "type": "string",
        "defaultValue": "null"
      },
      {
        "name": "_HAS_JUMP_",
        "displayName": "Has Jump",
        "type": "string",
        "defaultValue": "noJump"
      },
      {
        "name": "_NO_ITEM_AT_",
        "displayName": "No Item At",
        "type": "string",
        "defaultValue": "null"
      },
      {
        "name": "_SEED_",
        "displayName": "Seed",
        "type": "int",
        "defaultValue": 1,
        "min": 1,
        "max": 99999
      }
    ],
    "solutionCode": "// Parameters\nvar _MIN_PATH_LENGTH_ = 3;\nvar _MAX_PATH_LENGTH_ = 5;\nvar PATH_LENGTH = random(_MIN_PATH_LENGTH_, _MAX_PATH_LENGTH_);\n\n// Full Parameter Set (Standardized)\nvar _INTERACTION_ = 'crystal'; // OPTIONS: crystal, switch, key, mixed, null\nvar _TURN_STYLE_ = 'straight'; // OPTIONS: straight, turnLeft, turnRight, uTurn, zTurn, randomLeftRight, random, null\nvar _TURN_POINT_ = 'null'; // OPTIONS: null, start, end, mid, random, null\nvar _HAS_JUMP_ = 'noJump'; // OPTIONS: random, withJump, noJump, null\nvar _NO_ITEM_AT_ = 'null'; // OPTIONS: null, noItemStart, noItemEnd, noItemBoth, null\nvar _SEED_ = random(1, 99999);\n\n// Solution\nfor (let i = 0; i < PATH_LENGTH; i++) {\n  // Generate 1-step segments.\n  // We want EITHER crystal OR switch (or nothing). \n  // randomPattern 'interactionType' is usually fixed per call.\n  // To mix types, we might need a workaround or just rely on 'random' noItemAt\n  // However, randomPattern currently generates ONE type of item if item is placed.\n  // Strategy: Alternating calls or multiple random calls doesn't work well for \"OR\" logic in one spot easily without strict control.\n  // BUT, let's use a trick: \n  // We can't easily swap interaction type per step in one loop purely with these params unless we have a 'mixed' type.\n  // For now, let's assume we stick to one primary type for simplicity, or if the system supports 'mixed', we use that.\n  // Checking docs: randomPattern takes 'interactionType'. \n  // workaround: Use a custom seed to decide what to call.\n  \n  if (random(0, 100) < 50) {\n     randomPattern(1, 'crystal', true, 0, 'straight', _TURN_STYLE_, _TURN_POINT_, _HAS_JUMP_, _NO_ITEM_AT_, _SEED_ + i);\n  } else {\n     randomPattern(1, 'switch', true, 0, 'straight', _TURN_STYLE_, _TURN_POINT_, _HAS_JUMP_, _NO_ITEM_AT_, _SEED_ + i);\n  }\n}",
    "descriptionMarkdown": "# Crystal or Switch\n\nLearn to make decisions based on what's in front of you.\n\n## Learning Goals\n- Use if-else for decision making\n- Detect items in the environment\n- Choose correct action based on condition\n\n## Features\n- **Conditional Logic**: Requires checking `isItemPresent` to react correctly.\n- **Random Environment**: Items are placed randomly, forcing the use of logic over rote memorization.\n\n## Solution & Parameters",
    "rawContent": "---\nid: crystal-or-switch\nname: \"Crystal or Switch\"\ncategory: conditional\nconcepts: [\"if_else\"]\ndifficulty: 4\ntags: [\"if\", \"else\", \"detect\"]\nauthor: system\nversion: 2\ndescription: \"Decide whether to collect crystal or activate switch\"\n---\n\n# Crystal or Switch\n\nLearn to make decisions based on what's in front of you.\n\n## Learning Goals\n- Use if-else for decision making\n- Detect items in the environment\n- Choose correct action based on condition\n\n## Features\n- **Conditional Logic**: Requires checking `isItemPresent` to react correctly.\n- **Random Environment**: Items are placed randomly, forcing the use of logic over rote memorization.\n\n## Solution & Parameters\n\n```js\n// Parameters\nvar _MIN_PATH_LENGTH_ = 3;\nvar _MAX_PATH_LENGTH_ = 5;\nvar PATH_LENGTH = random(_MIN_PATH_LENGTH_, _MAX_PATH_LENGTH_);\n\n// Full Parameter Set (Standardized)\nvar _INTERACTION_ = 'crystal'; // OPTIONS: crystal, switch, key, mixed, null\nvar _TURN_STYLE_ = 'straight'; // OPTIONS: straight, turnLeft, turnRight, uTurn, zTurn, randomLeftRight, random, null\nvar _TURN_POINT_ = 'null'; // OPTIONS: null, start, end, mid, random, null\nvar _HAS_JUMP_ = 'noJump'; // OPTIONS: random, withJump, noJump, null\nvar _NO_ITEM_AT_ = 'null'; // OPTIONS: null, noItemStart, noItemEnd, noItemBoth, null\nvar _SEED_ = random(1, 99999);\n\n// Solution\nfor (let i = 0; i < PATH_LENGTH; i++) {\n  // Generate 1-step segments.\n  // We want EITHER crystal OR switch (or nothing). \n  // randomPattern 'interactionType' is usually fixed per call.\n  // To mix types, we might need a workaround or just rely on 'random' noItemAt\n  // However, randomPattern currently generates ONE type of item if item is placed.\n  // Strategy: Alternating calls or multiple random calls doesn't work well for \"OR\" logic in one spot easily without strict control.\n  // BUT, let's use a trick: \n  // We can't easily swap interaction type per step in one loop purely with these params unless we have a 'mixed' type.\n  // For now, let's assume we stick to one primary type for simplicity, or if the system supports 'mixed', we use that.\n  // Checking docs: randomPattern takes 'interactionType'. \n  // workaround: Use a custom seed to decide what to call.\n  \n  if (random(0, 100) < 50) {\n     randomPattern(1, 'crystal', true, 0, 'straight', _TURN_STYLE_, _TURN_POINT_, _HAS_JUMP_, _NO_ITEM_AT_, _SEED_ + i);\n  } else {\n     randomPattern(1, 'switch', true, 0, 'straight', _TURN_STYLE_, _TURN_POINT_, _HAS_JUMP_, _NO_ITEM_AT_, _SEED_ + i);\n  }\n}\n```\n\n",
    "hints": {
      "title": "Crystal or Switch",
      "description": "Learn to make decisions based on what's in front of you.",
      "learningGoals": "- Use if-else for decision making",
      "goalDetails": [
        "Detect items in the environment",
        "Choose correct action based on condition"
      ]
    }
  },
  {
    "metadata": {
      "id": "if-simple",
      "name": "Simple If",
      "category": "conditional",
      "concepts": [
        "if_simple"
      ],
      "difficulty": 2,
      "tags": [
        "conditional",
        "if",
        "decision"
      ],
      "author": "system",
      "version": 3,
      "description": "Use simple if statement to collect crystals"
    },
    "parameters": [
      {
        "name": "_MIN_PATH_",
        "displayName": "Min Path",
        "type": "number",
        "defaultValue": 3
      },
      {
        "name": "_MAX_PATH_",
        "displayName": "Max Path",
        "type": "number",
        "defaultValue": 6
      },
      {
        "name": "_INTERACTION_",
        "displayName": "Interaction",
        "type": "string",
        "defaultValue": "crystal"
      },
      {
        "name": "_TURN_STYLE_",
        "displayName": "Turn Style",
        "type": "string",
        "defaultValue": "straight"
      },
      {
        "name": "_TURN_POINT_",
        "displayName": "Turn Point",
        "type": "string",
        "defaultValue": "null"
      },
      {
        "name": "_HAS_JUMP_",
        "displayName": "Has Jump",
        "type": "string",
        "defaultValue": "noJump"
      },
      {
        "name": "_NO_ITEM_AT_",
        "displayName": "No Item At",
        "type": "string",
        "defaultValue": "null"
      },
      {
        "name": "_SEED_",
        "displayName": "Seed",
        "type": "int",
        "defaultValue": 1,
        "min": 1,
        "max": 99999
      }
    ],
    "solutionCode": "// Parameters\nvar _MIN_PATH_ = 3;\nvar _MAX_PATH_ = 6;\nvar PATH_LEN = random(_MIN_PATH_, _MAX_PATH_);\n\n// Full Parameter Set (Standardized)\nvar _INTERACTION_ = 'crystal'; // OPTIONS: crystal, switch, key, mixed, null\nvar _TURN_STYLE_ = 'straight'; // OPTIONS: straight, turnLeft, turnRight, uTurn, zTurn, randomLeftRight, random, null\nvar _TURN_POINT_ = 'null'; // OPTIONS: null, start, end, mid, random, null\nvar _HAS_JUMP_ = 'noJump'; // OPTIONS: random, withJump, noJump, null\nvar _NO_ITEM_AT_ = 'null'; // OPTIONS: null, noItemStart, noItemEnd, noItemBoth, null\nvar _SEED_ = random(1, 99999);\n\n// Solution\n// Random Mode (activated by 'conditional' tag) will hide items at runtime\nfor (let i = 0; i < PATH_LEN; i++) {\n  randomPattern(1, _INTERACTION_, true, 0, 'straight', _TURN_STYLE_, _TURN_POINT_, _HAS_JUMP_, _NO_ITEM_AT_, _SEED_ + i);\n}",
    "descriptionMarkdown": "# Simple If\n\nLearn to use a simple if statement to make decisions.\n\n## Learning Goals\n- Understand if statement\n- Make conditional decisions\n- Check conditions\n\n## Features\n- **Simple Decision**: Introduces the `if` block.\n- **Random Placement**: Items may or may not be present, requiring the conditional check.\n\n## Solution & Parameters",
    "rawContent": "---\nid: if-simple\nname: \"Simple If\"\ncategory: conditional\nconcepts: [\"if_simple\"]\ndifficulty: 2\ntags: [\"conditional\", \"if\", \"decision\"]\nauthor: system\nversion: 3\ndescription: \"Use simple if statement to collect crystals\"\n---\n\n# Simple If\n\nLearn to use a simple if statement to make decisions.\n\n## Learning Goals\n- Understand if statement\n- Make conditional decisions\n- Check conditions\n\n## Features\n- **Simple Decision**: Introduces the `if` block.\n- **Random Placement**: Items may or may not be present, requiring the conditional check.\n\n## Solution & Parameters\n\n```js\n// Parameters\nvar _MIN_PATH_ = 3;\nvar _MAX_PATH_ = 6;\nvar PATH_LEN = random(_MIN_PATH_, _MAX_PATH_);\n\n// Full Parameter Set (Standardized)\nvar _INTERACTION_ = 'crystal'; // OPTIONS: crystal, switch, key, mixed, null\nvar _TURN_STYLE_ = 'straight'; // OPTIONS: straight, turnLeft, turnRight, uTurn, zTurn, randomLeftRight, random, null\nvar _TURN_POINT_ = 'null'; // OPTIONS: null, start, end, mid, random, null\nvar _HAS_JUMP_ = 'noJump'; // OPTIONS: random, withJump, noJump, null\nvar _NO_ITEM_AT_ = 'null'; // OPTIONS: null, noItemStart, noItemEnd, noItemBoth, null\nvar _SEED_ = random(1, 99999);\n\n// Solution\n// Random Mode (activated by 'conditional' tag) will hide items at runtime\nfor (let i = 0; i < PATH_LEN; i++) {\n  randomPattern(1, _INTERACTION_, true, 0, 'straight', _TURN_STYLE_, _TURN_POINT_, _HAS_JUMP_, _NO_ITEM_AT_, _SEED_ + i);\n}\n```\n\n",
    "hints": {
      "title": "Simple If",
      "description": "Learn to use a simple if statement to make decisions.",
      "learningGoals": "- Understand if statement",
      "goalDetails": [
        "Make conditional decisions",
        "Check conditions"
      ]
    }
  },
  {
    "metadata": {
      "id": "decomp-flower",
      "name": "Flower Pattern",
      "category": "decomposition",
      "concepts": [
        "function",
        "geometry",
        "nested_loop"
      ],
      "difficulty": 5,
      "tags": [
        "function",
        "pattern",
        "radial"
      ],
      "author": "system",
      "version": 2,
      "description": "Draw petals around a center point"
    },
    "parameters": [
      {
        "name": "_MIN_LEN_",
        "displayName": "Min Len",
        "type": "number",
        "defaultValue": 3
      },
      {
        "name": "_MAX_LEN_",
        "displayName": "Max Len",
        "type": "number",
        "defaultValue": 5
      },
      {
        "name": "_INTERACTION_",
        "displayName": "Interaction",
        "type": "string",
        "defaultValue": "crystal"
      },
      {
        "name": "_TURN_STYLE_",
        "displayName": "Turn Style",
        "type": "string",
        "defaultValue": "straight"
      },
      {
        "name": "_TURN_POINT_",
        "displayName": "Turn Point",
        "type": "string",
        "defaultValue": "null"
      },
      {
        "name": "_HAS_JUMP_",
        "displayName": "Has Jump",
        "type": "string",
        "defaultValue": "noJump"
      },
      {
        "name": "_NO_ITEM_AT_",
        "displayName": "No Item At",
        "type": "string",
        "defaultValue": "null"
      },
      {
        "name": "_SEED_",
        "displayName": "Seed",
        "type": "int",
        "defaultValue": 1,
        "min": 1,
        "max": 99999
      }
    ],
    "solutionCode": "// Parameters\nvar _MIN_LEN_ = 3;\nvar _MAX_LEN_ = 5;\nvar LEN = random(_MIN_LEN_, _MAX_LEN_);\n\n// Full Parameter Set (Standardized)\nvar _INTERACTION_ = 'crystal'; // OPTIONS: crystal, switch, key, mixed, null\nvar _TURN_STYLE_ = 'straight'; // OPTIONS: straight, turnLeft, turnRight, uTurn, zTurn, randomLeftRight, random, null\nvar _TURN_POINT_ = 'null'; // OPTIONS: null, start, end, mid, random, null\nvar _HAS_JUMP_ = 'noJump'; // OPTIONS: random, withJump, noJump, null\nvar _NO_ITEM_AT_ = 'null'; // OPTIONS: null, noItemStart, noItemEnd, noItemBoth, null\nvar _SEED_ = random(1, 99999);\n\n// Solution\nfunction turnAround() {\n  turnRight();\n  turnRight();\n}\n\nfunction drawPetal() {\n  // Go out: Use randomPattern to generate the petal \"stem\"\n  randomPattern(LEN, _INTERACTION_, true, 0, 'straight', _TURN_STYLE_, _TURN_POINT_, _HAS_JUMP_, _NO_ITEM_AT_, _SEED_);\n  \n  // Return to center\n  turnAround();\n  // Retrace steps (simple move forward loop to return, matching length)\n  // Note: We don't use randomPattern for *retracing* blindly unless we want new items. \n  // For simplicity, we just walk back.\n  for (let i = 0; i < LEN; i++) {\n     moveForward();\n  }\n  \n  // Face next petal direction (total 180 turned + 90 turn = 270 relative to start, or effectively 90 right)\n  turnAround();\n  turnRight();\n}\n\n// Draw 4 petals\nfor (let k = 0; k < 4; k++) {\n  drawPetal();\n}",
    "descriptionMarkdown": "# Flower Pattern\n\nA radial pattern where the code draws a \"petal\" and returns to center.\n\n## Academic Concept: Radial Symmetry / Reset State\n- Function must Perform Action AND Return to initial state (Center, Facing Out) to be reusable in a loop.\n\n## Features\n- **Functional Decomposition**: Breaks down a complex shape into a repeatable `drawPetal` function.\n- **State Restoration**: Crucial concept where the function must return the agent to the starting position/orientation to allow looping.\n\n## Solution & Parameters",
    "rawContent": "---\nid: decomp-flower\nname: \"Flower Pattern\"\ncategory: decomposition\nconcepts: [\"function\", \"geometry\", \"nested_loop\"]\ndifficulty: 5\ntags: [\"function\", \"pattern\", \"radial\"]\nauthor: system\nversion: 2\ndescription: \"Draw petals around a center point\"\n---\n\n# Flower Pattern\n\nA radial pattern where the code draws a \"petal\" and returns to center.\n\n## Academic Concept: Radial Symmetry / Reset State\n- Function must Perform Action AND Return to initial state (Center, Facing Out) to be reusable in a loop.\n\n## Features\n- **Functional Decomposition**: Breaks down a complex shape into a repeatable `drawPetal` function.\n- **State Restoration**: Crucial concept where the function must return the agent to the starting position/orientation to allow looping.\n\n## Solution & Parameters\n\n```js\n// Parameters\nvar _MIN_LEN_ = 3;\nvar _MAX_LEN_ = 5;\nvar LEN = random(_MIN_LEN_, _MAX_LEN_);\n\n// Full Parameter Set (Standardized)\nvar _INTERACTION_ = 'crystal'; // OPTIONS: crystal, switch, key, mixed, null\nvar _TURN_STYLE_ = 'straight'; // OPTIONS: straight, turnLeft, turnRight, uTurn, zTurn, randomLeftRight, random, null\nvar _TURN_POINT_ = 'null'; // OPTIONS: null, start, end, mid, random, null\nvar _HAS_JUMP_ = 'noJump'; // OPTIONS: random, withJump, noJump, null\nvar _NO_ITEM_AT_ = 'null'; // OPTIONS: null, noItemStart, noItemEnd, noItemBoth, null\nvar _SEED_ = random(1, 99999);\n\n// Solution\nfunction turnAround() {\n  turnRight();\n  turnRight();\n}\n\nfunction drawPetal() {\n  // Go out: Use randomPattern to generate the petal \"stem\"\n  randomPattern(LEN, _INTERACTION_, true, 0, 'straight', _TURN_STYLE_, _TURN_POINT_, _HAS_JUMP_, _NO_ITEM_AT_, _SEED_);\n  \n  // Return to center\n  turnAround();\n  // Retrace steps (simple move forward loop to return, matching length)\n  // Note: We don't use randomPattern for *retracing* blindly unless we want new items. \n  // For simplicity, we just walk back.\n  for (let i = 0; i < LEN; i++) {\n     moveForward();\n  }\n  \n  // Face next petal direction (total 180 turned + 90 turn = 270 relative to start, or effectively 90 right)\n  turnAround();\n  turnRight();\n}\n\n// Draw 4 petals\nfor (let k = 0; k < 4; k++) {\n  drawPetal();\n}\n```\n",
    "hints": {
      "title": "Flower Pattern",
      "description": "A radial pattern where the code draws a \"petal\" and returns to center.",
      "learningGoals": "Radial Symmetry / Reset State",
      "goalDetails": [
        "Function must Perform Action AND Return to initial state (Center, Facing Out) to be reusable in a loop."
      ]
    }
  },
  {
    "metadata": {
      "id": "decomp-square",
      "name": "Square Function",
      "category": "decomposition",
      "concepts": [
        "function",
        "geometry"
      ],
      "difficulty": 3,
      "tags": [
        "function",
        "reuse",
        "square"
      ],
      "author": "system",
      "version": 2,
      "description": "Use a 'Side' function to draw a square"
    },
    "parameters": [
      {
        "name": "_MIN_LEN_",
        "displayName": "Min Len",
        "type": "number",
        "defaultValue": 3
      },
      {
        "name": "_MAX_LEN_",
        "displayName": "Max Len",
        "type": "number",
        "defaultValue": 5
      },
      {
        "name": "_INTERACTION_",
        "displayName": "Interaction",
        "type": "string",
        "defaultValue": "crystal"
      },
      {
        "name": "_TURN_STYLE_",
        "displayName": "Turn Style",
        "type": "string",
        "defaultValue": "straight"
      },
      {
        "name": "_TURN_POINT_",
        "displayName": "Turn Point",
        "type": "string",
        "defaultValue": "null"
      },
      {
        "name": "_HAS_JUMP_",
        "displayName": "Has Jump",
        "type": "string",
        "defaultValue": "noJump"
      },
      {
        "name": "_NO_ITEM_AT_",
        "displayName": "No Item At",
        "type": "string",
        "defaultValue": "null"
      },
      {
        "name": "_SEED_",
        "displayName": "Seed",
        "type": "int",
        "defaultValue": 1,
        "min": 1,
        "max": 99999
      }
    ],
    "solutionCode": "// Parameters\nvar _MIN_LEN_ = 3;\nvar _MAX_LEN_ = 5;\nvar LEN = random(_MIN_LEN_, _MAX_LEN_);\n\n// Full Parameter Set (Standardized)\nvar _INTERACTION_ = 'crystal'; // OPTIONS: crystal, switch, key, mixed, null\nvar _TURN_STYLE_ = 'straight'; // OPTIONS: straight, turnLeft, turnRight, uTurn, zTurn, randomLeftRight, random, null\nvar _TURN_POINT_ = 'null'; // OPTIONS: null, start, end, mid, random, null\nvar _HAS_JUMP_ = 'noJump'; // OPTIONS: random, withJump, noJump, null\nvar _NO_ITEM_AT_ = 'null'; // OPTIONS: null, noItemStart, noItemEnd, noItemBoth, null\nvar _SEED_ = random(1, 99999);\n\n// Solution\nfunction drawSide() {\n  // Generate one side of the square\n  randomPattern(LEN, _INTERACTION_, true, 0, 'straight', _TURN_STYLE_, _TURN_POINT_, _HAS_JUMP_, _NO_ITEM_AT_, _SEED_);\n  \n  // Turn to prepare for next side\n  turnRight();\n}\n\n// Main: Draw 4 sides\nfor (let k = 0; k < 4; k++) {\n  drawSide();\n}",
    "descriptionMarkdown": "# Square Function\n\nDecompose the square into 4 identical sides.\n\n## Academic Concept: Decomposition\n- Complex Task: Draw Square\n- Sub-Task: Draw Line + Turn\n- Composition: Repeat(Sub-Task, 4)\n\n## Features\n- **Component Reuse**: Defines `drawSide` once and uses it multiple times.\n- **Decomposition**: Solves a complex problem (Square) by solving a simpler one (Side) first.\n\n## Solution & Parameters",
    "rawContent": "---\nid: decomp-square\nname: \"Square Function\"\ncategory: decomposition\nconcepts: [\"function\", \"geometry\"]\ndifficulty: 3\ntags: [\"function\", \"reuse\", \"square\"]\nauthor: system\nversion: 2\ndescription: \"Use a 'Side' function to draw a square\"\n---\n\n# Square Function\n\nDecompose the square into 4 identical sides.\n\n## Academic Concept: Decomposition\n- Complex Task: Draw Square\n- Sub-Task: Draw Line + Turn\n- Composition: Repeat(Sub-Task, 4)\n\n## Features\n- **Component Reuse**: Defines `drawSide` once and uses it multiple times.\n- **Decomposition**: Solves a complex problem (Square) by solving a simpler one (Side) first.\n\n## Solution & Parameters\n\n```js\n// Parameters\nvar _MIN_LEN_ = 3;\nvar _MAX_LEN_ = 5;\nvar LEN = random(_MIN_LEN_, _MAX_LEN_);\n\n// Full Parameter Set (Standardized)\nvar _INTERACTION_ = 'crystal'; // OPTIONS: crystal, switch, key, mixed, null\nvar _TURN_STYLE_ = 'straight'; // OPTIONS: straight, turnLeft, turnRight, uTurn, zTurn, randomLeftRight, random, null\nvar _TURN_POINT_ = 'null'; // OPTIONS: null, start, end, mid, random, null\nvar _HAS_JUMP_ = 'noJump'; // OPTIONS: random, withJump, noJump, null\nvar _NO_ITEM_AT_ = 'null'; // OPTIONS: null, noItemStart, noItemEnd, noItemBoth, null\nvar _SEED_ = random(1, 99999);\n\n// Solution\nfunction drawSide() {\n  // Generate one side of the square\n  randomPattern(LEN, _INTERACTION_, true, 0, 'straight', _TURN_STYLE_, _TURN_POINT_, _HAS_JUMP_, _NO_ITEM_AT_, _SEED_);\n  \n  // Turn to prepare for next side\n  turnRight();\n}\n\n// Main: Draw 4 sides\nfor (let k = 0; k < 4; k++) {\n  drawSide();\n}\n```\n",
    "hints": {
      "title": "Square Function",
      "description": "Decompose the square into 4 identical sides.",
      "learningGoals": "Decomposition",
      "goalDetails": [
        "Complex Task: Draw Square",
        "Sub-Task: Draw Line + Turn",
        "Composition: Repeat(Sub-Task, 4)"
      ]
    }
  },
  {
    "metadata": {
      "id": "decomp-stair",
      "name": "Staircase Function",
      "category": "decomposition",
      "concepts": [
        "function",
        "procedure"
      ],
      "difficulty": 3,
      "tags": [
        "function",
        "staircase",
        "automation"
      ],
      "author": "system",
      "version": 2,
      "description": "Use a 'Step' function to climb a staircase"
    },
    "parameters": [
      {
        "name": "_MIN_HEIGHT_",
        "displayName": "Min Height",
        "type": "number",
        "defaultValue": 3
      },
      {
        "name": "_MAX_HEIGHT_",
        "displayName": "Max Height",
        "type": "number",
        "defaultValue": 5
      },
      {
        "name": "_INTERACTION_",
        "displayName": "Interaction",
        "type": "string",
        "defaultValue": "crystal"
      },
      {
        "name": "_TURN_STYLE_",
        "displayName": "Turn Style",
        "type": "string",
        "defaultValue": "straight"
      },
      {
        "name": "_TURN_POINT_",
        "displayName": "Turn Point",
        "type": "string",
        "defaultValue": "null"
      },
      {
        "name": "_HAS_JUMP_",
        "displayName": "Has Jump",
        "type": "string",
        "defaultValue": "withJump"
      },
      {
        "name": "_NO_ITEM_AT_",
        "displayName": "No Item At",
        "type": "string",
        "defaultValue": "null"
      },
      {
        "name": "_SEED_",
        "displayName": "Seed",
        "type": "int",
        "defaultValue": 1,
        "min": 1,
        "max": 99999
      }
    ],
    "solutionCode": "// Parameters\nvar _MIN_HEIGHT_ = 3;\nvar _MAX_HEIGHT_ = 5;\nvar HEIGHT = random(_MIN_HEIGHT_, _MAX_HEIGHT_);\n\n// Full Parameter Set (Standardized)\nvar _INTERACTION_ = 'crystal'; // OPTIONS: crystal, switch, key, mixed, null\nvar _TURN_STYLE_ = 'straight'; // OPTIONS: straight, turnLeft, turnRight, uTurn, zTurn, randomLeftRight, random, null\nvar _TURN_POINT_ = 'null'; // OPTIONS: null, start, end, mid, random, null\nvar _HAS_JUMP_ = 'withJump'; // OPTIONS: random, withJump, noJump, null\nvar _NO_ITEM_AT_ = 'null'; // OPTIONS: null, noItemStart, noItemEnd, noItemBoth, null\nvar _SEED_ = random(1, 99999);\n\n// Solution\nfunction climbStep() {\n   // Use randomPattern to generate one valid step segment with jump\n   // length 1 implies basically just the jump/landing logic if configured right\n   randomPattern(1, _INTERACTION_, true, 0, 'straight', _TURN_STYLE_, _TURN_POINT_, _HAS_JUMP_, _NO_ITEM_AT_, _SEED_);\n}\n\n// Main: Climb the staircase\nfor(let i = 0; i < HEIGHT; i++) {\n  climbStep();\n}",
    "descriptionMarkdown": "# Staircase Function\n\nDecompose climbing into a single \"Step Up\" action.\n\n## Academic Concept: Procedural Abstraction\n- Abstract \"Move, Jump, Move\" into \"ClimbStep()\"\n\n## Features\n- **Procedure Call**: Encapsulates logic in `climbStep`.\n- **Abstraction**: Hides the complexity of climbing behind a simple function name.\n\n## Solution & Parameters",
    "rawContent": "---\nid: decomp-stair\nname: \"Staircase Function\"\ncategory: decomposition\nconcepts: [\"function\", \"procedure\"]\ndifficulty: 3\ntags: [\"function\", \"staircase\", \"automation\"]\nauthor: system\nversion: 2\ndescription: \"Use a 'Step' function to climb a staircase\"\n---\n\n# Staircase Function\n\nDecompose climbing into a single \"Step Up\" action.\n\n## Academic Concept: Procedural Abstraction\n- Abstract \"Move, Jump, Move\" into \"ClimbStep()\"\n\n## Features\n- **Procedure Call**: Encapsulates logic in `climbStep`.\n- **Abstraction**: Hides the complexity of climbing behind a simple function name.\n\n## Solution & Parameters\n\n```js\n// Parameters\nvar _MIN_HEIGHT_ = 3;\nvar _MAX_HEIGHT_ = 5;\nvar HEIGHT = random(_MIN_HEIGHT_, _MAX_HEIGHT_);\n\n// Full Parameter Set (Standardized)\nvar _INTERACTION_ = 'crystal'; // OPTIONS: crystal, switch, key, mixed, null\nvar _TURN_STYLE_ = 'straight'; // OPTIONS: straight, turnLeft, turnRight, uTurn, zTurn, randomLeftRight, random, null\nvar _TURN_POINT_ = 'null'; // OPTIONS: null, start, end, mid, random, null\nvar _HAS_JUMP_ = 'withJump'; // OPTIONS: random, withJump, noJump, null\nvar _NO_ITEM_AT_ = 'null'; // OPTIONS: null, noItemStart, noItemEnd, noItemBoth, null\nvar _SEED_ = random(1, 99999);\n\n// Solution\nfunction climbStep() {\n   // Use randomPattern to generate one valid step segment with jump\n   // length 1 implies basically just the jump/landing logic if configured right\n   randomPattern(1, _INTERACTION_, true, 0, 'straight', _TURN_STYLE_, _TURN_POINT_, _HAS_JUMP_, _NO_ITEM_AT_, _SEED_);\n}\n\n// Main: Climb the staircase\nfor(let i = 0; i < HEIGHT; i++) {\n  climbStep();\n}\n```\n",
    "hints": {
      "title": "Staircase Function",
      "description": "Decompose climbing into a single \"Step Up\" action.",
      "learningGoals": "Procedural Abstraction",
      "goalDetails": [
        "Abstract \"Move, Jump, Move\" into \"ClimbStep()\""
      ]
    }
  },
  {
    "metadata": {
      "id": "collect-procedure",
      "name": "Collect Procedure",
      "category": "function",
      "concepts": [
        "procedure_simple"
      ],
      "difficulty": 4,
      "tags": [
        "procedure",
        "function",
        "reuse"
      ],
      "author": "system",
      "version": 1,
      "description": "Create and use a procedure for collecting items"
    },
    "parameters": [
      {
        "name": "_MIN_COLLECTION_COUNT_",
        "displayName": "Min Collection Count",
        "type": "number",
        "defaultValue": 3
      },
      {
        "name": "_MAX_COLLECTION_COUNT_",
        "displayName": "Max Collection Count",
        "type": "number",
        "defaultValue": 6
      },
      {
        "name": "_INTERACTION_",
        "displayName": "Interaction",
        "type": "string",
        "defaultValue": "crystal"
      },
      {
        "name": "_TURN_STYLE_",
        "displayName": "Turn Style",
        "type": "string",
        "defaultValue": "straight"
      },
      {
        "name": "_TURN_POINT_",
        "displayName": "Turn Point",
        "type": "string",
        "defaultValue": "null"
      },
      {
        "name": "_HAS_JUMP_",
        "displayName": "Has Jump",
        "type": "string",
        "defaultValue": "noJump"
      },
      {
        "name": "_NO_ITEM_AT_",
        "displayName": "No Item At",
        "type": "string",
        "defaultValue": "null"
      },
      {
        "name": "_SEED_",
        "displayName": "Seed",
        "type": "int",
        "defaultValue": 1,
        "min": 1,
        "max": 99999
      }
    ],
    "solutionCode": "// Parameters\nvar _MIN_COLLECTION_COUNT_ = 3;\nvar _MAX_COLLECTION_COUNT_ = 6;\nvar COLLECTION_COUNT = random(_MIN_COLLECTION_COUNT_, _MAX_COLLECTION_COUNT_);\n\n// Full Parameter Set (Standardized)\nvar _INTERACTION_ = 'crystal'; // OPTIONS: crystal, switch, key, mixed, null\nvar _TURN_STYLE_ = 'straight'; // OPTIONS: straight, turnLeft, turnRight, uTurn, zTurn, randomLeftRight, random, null\nvar _TURN_POINT_ = 'null'; // OPTIONS: null, start, end, mid, random, null\nvar _HAS_JUMP_ = 'noJump'; // OPTIONS: random, withJump, noJump, null\nvar _NO_ITEM_AT_ = 'null'; // OPTIONS: null, noItemStart, noItemEnd, noItemBoth, null\nvar _SEED_ = random(1, 99999);\n\n// Solution\nfunction collectAndMove() {\n  // Use randomPattern for the action unit\n  randomPattern(1, _INTERACTION_, true, 0, 'straight', _TURN_STYLE_, _TURN_POINT_, _HAS_JUMP_, _NO_ITEM_AT_, _SEED_);\n}\n\n// Use the procedure\nfor (let i = 0; i < COLLECTION_COUNT; i++) {\n  collectAndMove();\n  // Ensure we move forward seed to differentiate steps if we wanted variety, \n  // but here reusing the exact same \"procedure\" conceptually usually implies identical action.\n  // However, randomPattern handles placement logic.\n}",
    "descriptionMarkdown": "# Collect Procedure\n\nCreate a reusable procedure for the collect-and-move pattern.\n\n## Learning Goals\n- Define custom procedures\n- Call procedures to reduce code\n- Understand code reuse\n\n## Features\n- **Procedure**: Defines a `collectAndMove` function.\n- **Reuse**: Calls the function multiple times in a loop.\n\n## Solution & Parameters",
    "rawContent": "---\nid: collect-procedure\nname: \"Collect Procedure\"\ncategory: function\nconcepts: [\"procedure_simple\"]\ndifficulty: 4\ntags: [\"procedure\", \"function\", \"reuse\"]\nauthor: system\nversion: 1\ndescription: \"Create and use a procedure for collecting items\"\n---\n\n# Collect Procedure\n\nCreate a reusable procedure for the collect-and-move pattern.\n\n## Learning Goals\n- Define custom procedures\n- Call procedures to reduce code\n- Understand code reuse\n\n## Features\n- **Procedure**: Defines a `collectAndMove` function.\n- **Reuse**: Calls the function multiple times in a loop.\n\n## Solution & Parameters\n\n```js\n// Parameters\nvar _MIN_COLLECTION_COUNT_ = 3;\nvar _MAX_COLLECTION_COUNT_ = 6;\nvar COLLECTION_COUNT = random(_MIN_COLLECTION_COUNT_, _MAX_COLLECTION_COUNT_);\n\n// Full Parameter Set (Standardized)\nvar _INTERACTION_ = 'crystal'; // OPTIONS: crystal, switch, key, mixed, null\nvar _TURN_STYLE_ = 'straight'; // OPTIONS: straight, turnLeft, turnRight, uTurn, zTurn, randomLeftRight, random, null\nvar _TURN_POINT_ = 'null'; // OPTIONS: null, start, end, mid, random, null\nvar _HAS_JUMP_ = 'noJump'; // OPTIONS: random, withJump, noJump, null\nvar _NO_ITEM_AT_ = 'null'; // OPTIONS: null, noItemStart, noItemEnd, noItemBoth, null\nvar _SEED_ = random(1, 99999);\n\n// Solution\nfunction collectAndMove() {\n  // Use randomPattern for the action unit\n  randomPattern(1, _INTERACTION_, true, 0, 'straight', _TURN_STYLE_, _TURN_POINT_, _HAS_JUMP_, _NO_ITEM_AT_, _SEED_);\n}\n\n// Use the procedure\nfor (let i = 0; i < COLLECTION_COUNT; i++) {\n  collectAndMove();\n  // Ensure we move forward seed to differentiate steps if we wanted variety, \n  // but here reusing the exact same \"procedure\" conceptually usually implies identical action.\n  // However, randomPattern handles placement logic.\n}\n```\n",
    "hints": {
      "title": "Collect Procedure",
      "description": "Create a reusable procedure for the collect-and-move pattern.",
      "learningGoals": "- Define custom procedures",
      "goalDetails": [
        "Call procedures to reduce code",
        "Understand code reuse"
      ]
    }
  },
  {
    "metadata": {
      "id": "simple-function",
      "name": "Simple Function",
      "category": "function",
      "concepts": [
        "procedure_simple"
      ],
      "difficulty": 3,
      "tags": [
        "function",
        "procedure",
        "reuse",
        "define"
      ],
      "author": "system",
      "version": 2,
      "description": "Define and call a simple function"
    },
    "parameters": [
      {
        "name": "_MIN_PER_CALL_",
        "displayName": "Min Per Call",
        "type": "number",
        "defaultValue": 2
      },
      {
        "name": "_MAX_PER_CALL_",
        "displayName": "Max Per Call",
        "type": "number",
        "defaultValue": 4
      },
      {
        "name": "_MIN_CALLS_",
        "displayName": "Min Calls",
        "type": "number",
        "defaultValue": 3
      },
      {
        "name": "_MAX_CALLS_",
        "displayName": "Max Calls",
        "type": "number",
        "defaultValue": 5
      },
      {
        "name": "_INTERACTION_",
        "displayName": "Interaction",
        "type": "string",
        "defaultValue": "crystal"
      },
      {
        "name": "_TURN_STYLE_",
        "displayName": "Turn Style",
        "type": "string",
        "defaultValue": "straight"
      },
      {
        "name": "_TURN_POINT_",
        "displayName": "Turn Point",
        "type": "string",
        "defaultValue": "null"
      },
      {
        "name": "_HAS_JUMP_",
        "displayName": "Has Jump",
        "type": "string",
        "defaultValue": "noJump"
      },
      {
        "name": "_NO_ITEM_AT_",
        "displayName": "No Item At",
        "type": "string",
        "defaultValue": "null"
      },
      {
        "name": "_SEED_",
        "displayName": "Seed",
        "type": "int",
        "defaultValue": 1,
        "min": 1,
        "max": 99999
      }
    ],
    "solutionCode": "// Parameters\nvar _MIN_PER_CALL_ = 2;\nvar _MAX_PER_CALL_ = 4;\nvar _MIN_CALLS_ = 3;\nvar _MAX_CALLS_ = 5;\nvar PER_CALL = random(_MIN_PER_CALL_, _MAX_PER_CALL_);\nvar CALLS = random(_MIN_CALLS_, _MAX_CALLS_);\n\n// Full Parameter Set (Standardized)\nvar _INTERACTION_ = 'crystal'; // OPTIONS: crystal, switch, key, mixed, null\nvar _TURN_STYLE_ = 'straight'; // OPTIONS: straight, turnLeft, turnRight, uTurn, zTurn, randomLeftRight, random, null\nvar _TURN_POINT_ = 'null'; // OPTIONS: null, start, end, mid, random, null\nvar _HAS_JUMP_ = 'noJump'; // OPTIONS: random, withJump, noJump, null\nvar _NO_ITEM_AT_ = 'null'; // OPTIONS: null, noItemStart, noItemEnd, noItemBoth, null\nvar _SEED_ = random(1, 99999);\n\n// Solution\nfunction collectItems() {\n  // Generate a straight segment of collection\n  randomPattern(PER_CALL, _INTERACTION_, true, 0, 'straight', _TURN_STYLE_, _TURN_POINT_, _HAS_JUMP_, _NO_ITEM_AT_, _SEED_);\n}\n\n// Zigzag pattern to avoid circular path\nfor (let c = 0; c < CALLS; c++) {\n  collectItems();\n  \n  if (c % 2 == 0) {\n    turnRight();\n  } else {\n    turnLeft();\n  }\n}",
    "descriptionMarkdown": "# Simple Function\n\nLearn to define and call functions to organize your code.\n\n## Learning Goals\n- Define a function\n- Call a function multiple times\n- Understand code reuse\n\n## Features\n- **Function Definition**: Groups actions into `collectItems`.\n- **Complex Pattern**: Uses the function to build a zigzag path.\n\n## Solution & Parameters",
    "rawContent": "---\nid: simple-function\nname: \"Simple Function\"\ncategory: function\nconcepts: [\"procedure_simple\"]\ndifficulty: 3\ntags: [\"function\", \"procedure\", \"reuse\", \"define\"]\nauthor: system\nversion: 2\ndescription: \"Define and call a simple function\"\n---\n\n# Simple Function\n\nLearn to define and call functions to organize your code.\n\n## Learning Goals\n- Define a function\n- Call a function multiple times\n- Understand code reuse\n\n## Features\n- **Function Definition**: Groups actions into `collectItems`.\n- **Complex Pattern**: Uses the function to build a zigzag path.\n\n## Solution & Parameters\n\n```js\n// Parameters\nvar _MIN_PER_CALL_ = 2;\nvar _MAX_PER_CALL_ = 4;\nvar _MIN_CALLS_ = 3;\nvar _MAX_CALLS_ = 5;\nvar PER_CALL = random(_MIN_PER_CALL_, _MAX_PER_CALL_);\nvar CALLS = random(_MIN_CALLS_, _MAX_CALLS_);\n\n// Full Parameter Set (Standardized)\nvar _INTERACTION_ = 'crystal'; // OPTIONS: crystal, switch, key, mixed, null\nvar _TURN_STYLE_ = 'straight'; // OPTIONS: straight, turnLeft, turnRight, uTurn, zTurn, randomLeftRight, random, null\nvar _TURN_POINT_ = 'null'; // OPTIONS: null, start, end, mid, random, null\nvar _HAS_JUMP_ = 'noJump'; // OPTIONS: random, withJump, noJump, null\nvar _NO_ITEM_AT_ = 'null'; // OPTIONS: null, noItemStart, noItemEnd, noItemBoth, null\nvar _SEED_ = random(1, 99999);\n\n// Solution\nfunction collectItems() {\n  // Generate a straight segment of collection\n  randomPattern(PER_CALL, _INTERACTION_, true, 0, 'straight', _TURN_STYLE_, _TURN_POINT_, _HAS_JUMP_, _NO_ITEM_AT_, _SEED_);\n}\n\n// Zigzag pattern to avoid circular path\nfor (let c = 0; c < CALLS; c++) {\n  collectItems();\n  \n  if (c % 2 == 0) {\n    turnRight();\n  } else {\n    turnLeft();\n  }\n}\n```\n",
    "hints": {
      "title": "Simple Function",
      "description": "Learn to define and call functions to organize your code.",
      "learningGoals": "- Define a function",
      "goalDetails": [
        "Call a function multiple times",
        "Understand code reuse"
      ]
    }
  },
  {
    "metadata": {
      "id": "zigzag-procedure",
      "name": "Zigzag Procedure",
      "category": "function",
      "concepts": [
        "procedure_simple"
      ],
      "difficulty": 4,
      "tags": [
        "procedure",
        "function",
        "zigzag"
      ],
      "author": "system",
      "version": 1,
      "description": "Create a reusable function to move in a zigzag"
    },
    "parameters": [],
    "solutionCode": "## Features\n- **Complex Function**: The `zigZagStep` function contains a multi-step maneuver.\n- **Pattern Repetition**: Repeats the function to create a saw-tooth path.\n\n## Solution & Parameters",
    "descriptionMarkdown": "# Zigzag Procedure\n\nDefine a function for a complex movement pattern and reuse it.\n\n## Solution & Parameters\n\njs\n// Parameters\nvar _MIN_COUNT_ = 3;\nvar _MAX_COUNT_ = 5;\nvar COUNT = random(_MIN_COUNT_, _MAX_COUNT_);\n\n// Full Parameter Set (Standardized)\nvar _INTERACTION_ = 'crystal'; // OPTIONS: crystal, switch, key, mixed, null\nvar _TURN_STYLE_ = 'straight'; // OPTIONS: straight, turnLeft, turnRight, uTurn, zTurn, randomLeftRight, random, null\nvar _TURN_POINT_ = 'null'; // OPTIONS: null, start, end, mid, random, null\nvar _HAS_JUMP_ = 'noJump'; // OPTIONS: random, withJump, noJump, null\nvar _NO_ITEM_AT_ = 'null'; // OPTIONS: null, noItemStart, noItemEnd, noItemBoth, null\nvar _SEED_ = random(1, 99999);\n\n// Solution\nfunction zigZagStep() {\n  // A zigzag step is: M, R, M, L\n  // We can simulate this with randomPattern for M and explicit turns\n  randomPattern(1, _INTERACTION_, true, 0, 'straight', _TURN_STYLE_, _TURN_POINT_, _HAS_JUMP_, _NO_ITEM_AT_, _SEED_);\n  turnRight();\n  randomPattern(1, _INTERACTION_, true, 0, 'straight', _TURN_STYLE_, _TURN_POINT_, _HAS_JUMP_, _NO_ITEM_AT_, _SEED_ + 1);\n  turnLeft();\n}\n\nfor (let i = 0; i < COUNT; i++) {\n  zigZagStep();\n}\n```",
    "rawContent": "---\nid: zigzag-procedure\nname: \"Zigzag Procedure\"\ncategory: function\nconcepts: [\"procedure_simple\"]\ndifficulty: 4\ntags: [\"procedure\", \"function\", \"zigzag\"]\nauthor: system\nversion: 1\ndescription: \"Create a reusable function to move in a zigzag\"\n---\n\n# Zigzag Procedure\n\nDefine a function for a complex movement pattern and reuse it.\n\n## Solution & Parameters\n\n```js\n## Features\n- **Complex Function**: The `zigZagStep` function contains a multi-step maneuver.\n- **Pattern Repetition**: Repeats the function to create a saw-tooth path.\n\n## Solution & Parameters\n\n```js\n// Parameters\nvar _MIN_COUNT_ = 3;\nvar _MAX_COUNT_ = 5;\nvar COUNT = random(_MIN_COUNT_, _MAX_COUNT_);\n\n// Full Parameter Set (Standardized)\nvar _INTERACTION_ = 'crystal'; // OPTIONS: crystal, switch, key, mixed, null\nvar _TURN_STYLE_ = 'straight'; // OPTIONS: straight, turnLeft, turnRight, uTurn, zTurn, randomLeftRight, random, null\nvar _TURN_POINT_ = 'null'; // OPTIONS: null, start, end, mid, random, null\nvar _HAS_JUMP_ = 'noJump'; // OPTIONS: random, withJump, noJump, null\nvar _NO_ITEM_AT_ = 'null'; // OPTIONS: null, noItemStart, noItemEnd, noItemBoth, null\nvar _SEED_ = random(1, 99999);\n\n// Solution\nfunction zigZagStep() {\n  // A zigzag step is: M, R, M, L\n  // We can simulate this with randomPattern for M and explicit turns\n  randomPattern(1, _INTERACTION_, true, 0, 'straight', _TURN_STYLE_, _TURN_POINT_, _HAS_JUMP_, _NO_ITEM_AT_, _SEED_);\n  turnRight();\n  randomPattern(1, _INTERACTION_, true, 0, 'straight', _TURN_STYLE_, _TURN_POINT_, _HAS_JUMP_, _NO_ITEM_AT_, _SEED_ + 1);\n  turnLeft();\n}\n\nfor (let i = 0; i < COUNT; i++) {\n  zigZagStep();\n}\n```\n",
    "hints": {
      "title": "Zigzag Procedure",
      "description": "Define a function for a complex movement pattern and reuse it.",
      "goalDetails": []
    }
  },
  {
    "metadata": {
      "id": "logic-alt-interact",
      "name": "Alternating Interaction",
      "category": "logic",
      "concepts": [
        "loop",
        "conditional",
        "modulo"
      ],
      "difficulty": 4,
      "tags": [
        "logic",
        "parity",
        "switch",
        "collect"
      ],
      "author": "system",
      "version": 2,
      "description": "Alternate between collecting Item and toggling Switch"
    },
    "parameters": [
      {
        "name": "_MIN_PAIRS_",
        "displayName": "Min Pairs",
        "type": "number",
        "defaultValue": 2
      },
      {
        "name": "_MAX_PAIRS_",
        "displayName": "Max Pairs",
        "type": "number",
        "defaultValue": 4
      },
      {
        "name": "_TURN_STYLE_",
        "displayName": "Turn Style",
        "type": "string",
        "defaultValue": "straight"
      },
      {
        "name": "_TURN_POINT_",
        "displayName": "Turn Point",
        "type": "string",
        "defaultValue": "null"
      },
      {
        "name": "_HAS_JUMP_",
        "displayName": "Has Jump",
        "type": "string",
        "defaultValue": "noJump"
      },
      {
        "name": "_NO_ITEM_AT_",
        "displayName": "No Item At",
        "type": "string",
        "defaultValue": "null"
      },
      {
        "name": "_SEED_",
        "displayName": "Seed",
        "type": "int",
        "defaultValue": 1,
        "min": 1,
        "max": 99999
      }
    ],
    "solutionCode": "// Parameters\nvar _MIN_PAIRS_ = 2;\nvar _MAX_PAIRS_ = 4;\nvar PAIRS = random(_MIN_PAIRS_, _MAX_PAIRS_);\n\n// Full Parameter Set (Standardized)\nvar _TURN_STYLE_ = 'straight'; // OPTIONS: straight, turnLeft, turnRight, uTurn, zTurn, randomLeftRight, random, null\nvar _TURN_POINT_ = 'null'; // OPTIONS: null, start, end, mid, random, null\nvar _HAS_JUMP_ = 'noJump'; // OPTIONS: random, withJump, noJump, null\nvar _NO_ITEM_AT_ = 'null'; // OPTIONS: null, noItemStart, noItemEnd, noItemBoth, null\nvar _SEED_ = random(1, 99999);\n\n// Solution\nfor (let i = 0; i < PAIRS; i++) {\n  // Step 1: Crystal\n  randomPattern(2, 'crystal', true, 0, 'straight', _TURN_STYLE_, _TURN_POINT_, _HAS_JUMP_, _NO_ITEM_AT_, _SEED_ + (i*2));\n  \n  // Step 2: Switch\n  randomPattern(2, 'switch', true, 0, 'straight', _TURN_STYLE_, _TURN_POINT_, _HAS_JUMP_, _NO_ITEM_AT_, _SEED_ + (i*2) + 1);\n}",
    "descriptionMarkdown": "# Alternating Interaction\n\nA complex task requiring the student to recognize two interleaved patterns.\n\n## Academic Concept: Parity (Modulo 2)\n- Even steps: Collect Crystal\n- Odd steps: Toggle Switch\n\n## Features\n- **Complex Pattern**: Alternates between two different actions (Collect vs Toggle).\n- **Modulo Logic**: Uses `%` operator to determine the current state.\n\n## Solution & Parameters",
    "rawContent": "---\nid: logic-alt-interact\nname: \"Alternating Interaction\"\ncategory: logic\nconcepts: [\"loop\", \"conditional\", \"modulo\"]\ndifficulty: 4\ntags: [\"logic\", \"parity\", \"switch\", \"collect\"]\nauthor: system\nversion: 2\ndescription: \"Alternate between collecting Item and toggling Switch\"\n---\n\n# Alternating Interaction\n\nA complex task requiring the student to recognize two interleaved patterns.\n\n## Academic Concept: Parity (Modulo 2)\n- Even steps: Collect Crystal\n- Odd steps: Toggle Switch\n\n## Features\n- **Complex Pattern**: Alternates between two different actions (Collect vs Toggle).\n- **Modulo Logic**: Uses `%` operator to determine the current state.\n\n## Solution & Parameters\n\n```js\n// Parameters\nvar _MIN_PAIRS_ = 2;\nvar _MAX_PAIRS_ = 4;\nvar PAIRS = random(_MIN_PAIRS_, _MAX_PAIRS_);\n\n// Full Parameter Set (Standardized)\nvar _TURN_STYLE_ = 'straight'; // OPTIONS: straight, turnLeft, turnRight, uTurn, zTurn, randomLeftRight, random, null\nvar _TURN_POINT_ = 'null'; // OPTIONS: null, start, end, mid, random, null\nvar _HAS_JUMP_ = 'noJump'; // OPTIONS: random, withJump, noJump, null\nvar _NO_ITEM_AT_ = 'null'; // OPTIONS: null, noItemStart, noItemEnd, noItemBoth, null\nvar _SEED_ = random(1, 99999);\n\n// Solution\nfor (let i = 0; i < PAIRS; i++) {\n  // Step 1: Crystal\n  randomPattern(2, 'crystal', true, 0, 'straight', _TURN_STYLE_, _TURN_POINT_, _HAS_JUMP_, _NO_ITEM_AT_, _SEED_ + (i*2));\n  \n  // Step 2: Switch\n  randomPattern(2, 'switch', true, 0, 'straight', _TURN_STYLE_, _TURN_POINT_, _HAS_JUMP_, _NO_ITEM_AT_, _SEED_ + (i*2) + 1);\n}\n```\n",
    "hints": {
      "title": "Alternating Interaction",
      "description": "A complex task requiring the student to recognize two interleaved patterns.",
      "learningGoals": "Parity (Modulo 2)",
      "goalDetails": [
        "Even steps: Collect Crystal",
        "Odd steps: Toggle Switch"
      ]
    }
  },
  {
    "metadata": {
      "id": "logic-alt-move",
      "name": "Alternating Move",
      "category": "logic",
      "concepts": [
        "loop",
        "conditional",
        "modulo"
      ],
      "difficulty": 3,
      "tags": [
        "logic",
        "parity",
        "even_odd"
      ],
      "author": "system",
      "version": 2,
      "description": "Alternate between walking and jumping, collecting crystals"
    },
    "parameters": [
      {
        "name": "_MIN_PAIRS_",
        "displayName": "Min Pairs",
        "type": "number",
        "defaultValue": 3
      },
      {
        "name": "_MAX_PAIRS_",
        "displayName": "Max Pairs",
        "type": "number",
        "defaultValue": 5
      },
      {
        "name": "_INTERACTION_",
        "displayName": "Interaction",
        "type": "string",
        "defaultValue": "crystal"
      },
      {
        "name": "_TURN_STYLE_",
        "displayName": "Turn Style",
        "type": "string",
        "defaultValue": "straight"
      },
      {
        "name": "_TURN_POINT_",
        "displayName": "Turn Point",
        "type": "string",
        "defaultValue": "null"
      },
      {
        "name": "_HAS_JUMP_",
        "displayName": "Has Jump",
        "type": "string",
        "defaultValue": "noJump"
      },
      {
        "name": "_NO_ITEM_AT_",
        "displayName": "No Item At",
        "type": "string",
        "defaultValue": "null"
      },
      {
        "name": "_SEED_",
        "displayName": "Seed",
        "type": "int",
        "defaultValue": 1,
        "min": 1,
        "max": 99999
      }
    ],
    "solutionCode": "// Parameters\nvar _MIN_PAIRS_ = 3;\nvar _MAX_PAIRS_ = 5;\nvar PAIRS = random(_MIN_PAIRS_, _MAX_PAIRS_);\n\n// Full Parameter Set (Standardized)\nvar _INTERACTION_ = 'crystal'; // OPTIONS: crystal, switch, key, mixed, null\nvar _TURN_STYLE_ = 'straight'; // OPTIONS: straight, turnLeft, turnRight, uTurn, zTurn, randomLeftRight, random, null\nvar _TURN_POINT_ = 'null'; // OPTIONS: null, start, end, mid, random, null\nvar _HAS_JUMP_ = 'noJump'; // OPTIONS: random, withJump, noJump, null\nvar _NO_ITEM_AT_ = 'null'; // OPTIONS: null, noItemStart, noItemEnd, noItemBoth, null\nvar _SEED_ = random(1, 99999);\n\n// Solution\nfor (let i = 0; i < PAIRS; i++) {\n  // Even: Walk (Normal move)\n  // Use randomPattern to generate a simple move-collect segment\n  randomPattern(1, _INTERACTION_, true, 0, 'straight', _TURN_STYLE_, _TURN_POINT_, 'noJump', _NO_ITEM_AT_, _SEED_ + (i*2));\n  \n  // Odd: Jump Up\n  // Use randomPattern to generate a jump-collect segment\n  randomPattern(1, _INTERACTION_, true, 0, 'straight', _TURN_STYLE_, _TURN_POINT_, 'withJump', _NO_ITEM_AT_, _SEED_ + (i*2) + 1);\n}",
    "descriptionMarkdown": "# Alternating Move\n\nA pattern that changes action based on whether the step count is Odd or Even.\n\n## Academic Concept: Parity (Modulo 2)\n- Logic: `if (i % 2 == 0) ActionA else ActionB`\n\n## Features\n- **Alternating Actions**: Switches between walking and jumping every step.\n- **Parity Logic**: Uses odd/even checks to decide action.\n\n## Solution & Parameters",
    "rawContent": "---\nid: logic-alt-move\nname: \"Alternating Move\"\ncategory: logic\nconcepts: [\"loop\", \"conditional\", \"modulo\"]\ndifficulty: 3\ntags: [\"logic\", \"parity\", \"even_odd\"]\nauthor: system\nversion: 2\ndescription: \"Alternate between walking and jumping, collecting crystals\"\n---\n\n# Alternating Move\n\nA pattern that changes action based on whether the step count is Odd or Even.\n\n## Academic Concept: Parity (Modulo 2)\n- Logic: `if (i % 2 == 0) ActionA else ActionB`\n\n## Features\n- **Alternating Actions**: Switches between walking and jumping every step.\n- **Parity Logic**: Uses odd/even checks to decide action.\n\n## Solution & Parameters\n\n```js\n// Parameters\nvar _MIN_PAIRS_ = 3;\nvar _MAX_PAIRS_ = 5;\nvar PAIRS = random(_MIN_PAIRS_, _MAX_PAIRS_);\n\n// Full Parameter Set (Standardized)\nvar _INTERACTION_ = 'crystal'; // OPTIONS: crystal, switch, key, mixed, null\nvar _TURN_STYLE_ = 'straight'; // OPTIONS: straight, turnLeft, turnRight, uTurn, zTurn, randomLeftRight, random, null\nvar _TURN_POINT_ = 'null'; // OPTIONS: null, start, end, mid, random, null\nvar _HAS_JUMP_ = 'noJump'; // OPTIONS: random, withJump, noJump, null\nvar _NO_ITEM_AT_ = 'null'; // OPTIONS: null, noItemStart, noItemEnd, noItemBoth, null\nvar _SEED_ = random(1, 99999);\n\n// Solution\nfor (let i = 0; i < PAIRS; i++) {\n  // Even: Walk (Normal move)\n  // Use randomPattern to generate a simple move-collect segment\n  randomPattern(1, _INTERACTION_, true, 0, 'straight', _TURN_STYLE_, _TURN_POINT_, 'noJump', _NO_ITEM_AT_, _SEED_ + (i*2));\n  \n  // Odd: Jump Up\n  // Use randomPattern to generate a jump-collect segment\n  randomPattern(1, _INTERACTION_, true, 0, 'straight', _TURN_STYLE_, _TURN_POINT_, 'withJump', _NO_ITEM_AT_, _SEED_ + (i*2) + 1);\n}\n```\n",
    "hints": {
      "title": "Alternating Move",
      "description": "A pattern that changes action based on whether the step count is Odd or Even.",
      "learningGoals": "Parity (Modulo 2)",
      "goalDetails": [
        "Logic: `if (i % 2 == 0) ActionA else ActionB`"
      ]
    }
  },
  {
    "metadata": {
      "id": "logic-checkerboard",
      "name": "Logic Checkerboard",
      "category": "logic",
      "concepts": [
        "nested_loop",
        "conditional",
        "coordinates"
      ],
      "difficulty": 5,
      "tags": [
        "logic",
        "grid",
        "checkerboard",
        "2d_array"
      ],
      "author": "system",
      "version": 2,
      "description": "Traverse a grid and interact only on 'Black' squares (checkerboard pattern)"
    },
    "parameters": [
      {
        "name": "_MIN_SIZE_",
        "displayName": "Min Size",
        "type": "number",
        "defaultValue": 2
      },
      {
        "name": "_MAX_SIZE_",
        "displayName": "Max Size",
        "type": "number",
        "defaultValue": 3
      },
      {
        "name": "_INTERACTION_",
        "displayName": "Interaction",
        "type": "string",
        "defaultValue": "crystal"
      },
      {
        "name": "_TURN_STYLE_",
        "displayName": "Turn Style",
        "type": "string",
        "defaultValue": "straight"
      },
      {
        "name": "_TURN_POINT_",
        "displayName": "Turn Point",
        "type": "string",
        "defaultValue": "null"
      },
      {
        "name": "_HAS_JUMP_",
        "displayName": "Has Jump",
        "type": "string",
        "defaultValue": "noJump"
      },
      {
        "name": "_NO_ITEM_AT_",
        "displayName": "No Item At",
        "type": "string",
        "defaultValue": "null"
      },
      {
        "name": "_SEED_",
        "displayName": "Seed",
        "type": "int",
        "defaultValue": 1,
        "min": 1,
        "max": 99999
      }
    ],
    "solutionCode": "// Parameters\nvar _MIN_SIZE_ = 2;\nvar _MAX_SIZE_ = 3;\nvar SIZE = random(_MIN_SIZE_, _MAX_SIZE_);\n\n// Full Parameter Set (Standardized)\nvar _INTERACTION_ = 'crystal'; // OPTIONS: crystal, switch, key, mixed, null\nvar _TURN_STYLE_ = 'straight'; // OPTIONS: straight, turnLeft, turnRight, uTurn, zTurn, randomLeftRight, random, null\nvar _TURN_POINT_ = 'null'; // OPTIONS: null, start, end, mid, random, null\nvar _HAS_JUMP_ = 'noJump'; // OPTIONS: random, withJump, noJump, null\nvar _NO_ITEM_AT_ = 'null'; // OPTIONS: null, noItemStart, noItemEnd, noItemBoth, null\nvar _SEED_ = random(1, 99999);\n\n// Helper function\nfunction turnAround() {\n  turnRight();\n  turnRight();\n}\n\n// Solution\nmoveForward();\n\nfor (let row = 0; row < SIZE; row++) {\n  for (let col = 0; col < SIZE; col++) {\n    // Checkerboard logic: collect only on \"black\" squares\n    if ((row + col) % 2 == 1) {\n      collectItem();\n    }\n    \n    if (col < SIZE - 1) {\n      moveForward();\n    }\n  }\n  \n  // Move to next row (if not last)\n  if (row < SIZE - 1) {\n    // Raster scan: return to start of row, then go up\n    turnAround();\n    for (let k = 0; k < SIZE - 1; k++) {\n      moveForward();\n    }\n    turnLeft();\n    moveForward();\n    turnLeft();\n  }\n}\n\nmoveForward();",
    "descriptionMarkdown": "# Logic Checkerboard\n\nTraverse a 2D grid, but only act when the coordinate sum (row + col) satisfies a parity condition.\n\n## Academic Concept: 2D Parity\n- White square: `(row + col) % 2 == 0`\n- Black square: `(row + col) % 2 == 1`\n\n## Features\n- **Grid Traversal**: Scanning a 2D space (rows and cols).\n- **Conditional Logic**: Only acting on specific coordinates (Checkerboard pattern).\n\n## Solution & Parameters",
    "rawContent": "---\nid: logic-checkerboard\nname: \"Logic Checkerboard\"\ncategory: logic\nconcepts: [\"nested_loop\", \"conditional\", \"coordinates\"]\ndifficulty: 5\ntags: [\"logic\", \"grid\", \"checkerboard\", \"2d_array\"]\nauthor: system\nversion: 2\ndescription: \"Traverse a grid and interact only on 'Black' squares (checkerboard pattern)\"\n---\n\n# Logic Checkerboard\n\nTraverse a 2D grid, but only act when the coordinate sum (row + col) satisfies a parity condition.\n\n## Academic Concept: 2D Parity\n- White square: `(row + col) % 2 == 0`\n- Black square: `(row + col) % 2 == 1`\n\n## Features\n- **Grid Traversal**: Scanning a 2D space (rows and cols).\n- **Conditional Logic**: Only acting on specific coordinates (Checkerboard pattern).\n\n## Solution & Parameters\n\n```js\n// Parameters\nvar _MIN_SIZE_ = 2;\nvar _MAX_SIZE_ = 3;\nvar SIZE = random(_MIN_SIZE_, _MAX_SIZE_);\n\n// Full Parameter Set (Standardized)\nvar _INTERACTION_ = 'crystal'; // OPTIONS: crystal, switch, key, mixed, null\nvar _TURN_STYLE_ = 'straight'; // OPTIONS: straight, turnLeft, turnRight, uTurn, zTurn, randomLeftRight, random, null\nvar _TURN_POINT_ = 'null'; // OPTIONS: null, start, end, mid, random, null\nvar _HAS_JUMP_ = 'noJump'; // OPTIONS: random, withJump, noJump, null\nvar _NO_ITEM_AT_ = 'null'; // OPTIONS: null, noItemStart, noItemEnd, noItemBoth, null\nvar _SEED_ = random(1, 99999);\n\n// Helper function\nfunction turnAround() {\n  turnRight();\n  turnRight();\n}\n\n// Solution\nmoveForward();\n\nfor (let row = 0; row < SIZE; row++) {\n  for (let col = 0; col < SIZE; col++) {\n    // Checkerboard logic: collect only on \"black\" squares\n    if ((row + col) % 2 == 1) {\n      collectItem();\n    }\n    \n    if (col < SIZE - 1) {\n      moveForward();\n    }\n  }\n  \n  // Move to next row (if not last)\n  if (row < SIZE - 1) {\n    // Raster scan: return to start of row, then go up\n    turnAround();\n    for (let k = 0; k < SIZE - 1; k++) {\n      moveForward();\n    }\n    turnLeft();\n    moveForward();\n    turnLeft();\n  }\n}\n\nmoveForward();\n```\n",
    "hints": {
      "title": "Logic Checkerboard",
      "description": "Traverse a 2D grid, but only act when the coordinate sum (row + col) satisfies a parity condition.",
      "learningGoals": "2D Parity",
      "goalDetails": [
        "White square: `(row + col) % 2 == 0`",
        "Black square: `(row + col) % 2 == 1`"
      ]
    }
  },
  {
    "metadata": {
      "id": "micro-mixed-interact",
      "name": "Micro Mixed Interact",
      "category": "logic",
      "concepts": [
        "micropattern",
        "crystal",
        "switch",
        "mixed"
      ],
      "difficulty": 4,
      "tags": [
        "logic",
        "crystal",
        "switch",
        "interact"
      ],
      "author": "system",
      "version": 5,
      "description": "Collect crystals AND toggle switches with different spacing"
    },
    "parameters": [],
    "solutionCode": "## Solution & Parameters",
    "descriptionMarkdown": "# Micro Mixed Interact\n\nCollect crystals and toggle switches.\n\n## Solution & Parameters\n\njs\nvar _MIN_REPEATS_ = 2;\nvar _MAX_REPEATS_ = 3;\nvar _MIN_SPACE_CRYSTAL_ = 0;\nvar _MAX_SPACE_CRYSTAL_ = 2;\nvar _MIN_SPACE_SWITCH_ = 0;\nvar _MAX_SPACE_SWITCH_ = 1;\n\nvar REPEATS = random(_MIN_REPEATS_, _MAX_REPEATS_);\nvar SPACE_CRYSTAL = random(_MIN_SPACE_CRYSTAL_, _MAX_SPACE_CRYSTAL_);\nvar SPACE_SWITCH = random(_MIN_SPACE_SWITCH_, _MAX_SPACE_SWITCH_);\n\n// Full Parameter Set (Standardized)\nvar _INTERACTION_ = 'crystal'; // OPTIONS: crystal, switch, key, mixed, null\nvar _TURN_STYLE_ = 'straight'; // OPTIONS: straight, turnLeft, turnRight, uTurn, zTurn, randomLeftRight, random, null\nvar _TURN_POINT_ = 'null'; // OPTIONS: null, start, end, mid, random, null\nvar _HAS_JUMP_ = 'noJump'; // OPTIONS: random, withJump, noJump, null\nvar _NO_ITEM_AT_ = 'null'; // OPTIONS: null, noItemStart, noItemEnd, noItemBoth, null\nvar _SEED_ = random(1, 99999);\n\nmoveForward();\n\n// Zigzag pattern to avoid circular path\nfor (let i = 0; i < REPEATS; i++) {\n  // Phase 1: Crystal Spacing\n  for (let c = 0; c < SPACE_CRYSTAL + 1; c++) {\n    moveForward();\n  }\n  collectItem();\n  \n  // Phase 2: Switch Spacing\n  for (let s = 0; s < SPACE_SWITCH + 1; s++) {\n    moveForward();\n  }\n  toggleSwitch();\n  \n  // Alternate turn direction\n  if (i % 2 == 0) {\n    turnRight();\n    moveForward();\n    turnRight();\n  } else {\n    turnLeft();\n    moveForward();\n    turnLeft();\n  }\n}\n\n// Final exit\ncollectItem();\nmoveForward();\n```",
    "rawContent": "---\nid: micro-mixed-interact\nname: \"Micro Mixed Interact\"\ncategory: logic\nconcepts: [\"micropattern\", \"crystal\", \"switch\", \"mixed\"]\ndifficulty: 4\ntags: [\"logic\", \"crystal\", \"switch\", \"interact\"]\nauthor: system\nversion: 5\ndescription: \"Collect crystals AND toggle switches with different spacing\"\n---\n\n# Micro Mixed Interact\n\nCollect crystals and toggle switches.\n\n## Solution & Parameters\n\n```js\n## Solution & Parameters\n\n```js\nvar _MIN_REPEATS_ = 2;\nvar _MAX_REPEATS_ = 3;\nvar _MIN_SPACE_CRYSTAL_ = 0;\nvar _MAX_SPACE_CRYSTAL_ = 2;\nvar _MIN_SPACE_SWITCH_ = 0;\nvar _MAX_SPACE_SWITCH_ = 1;\n\nvar REPEATS = random(_MIN_REPEATS_, _MAX_REPEATS_);\nvar SPACE_CRYSTAL = random(_MIN_SPACE_CRYSTAL_, _MAX_SPACE_CRYSTAL_);\nvar SPACE_SWITCH = random(_MIN_SPACE_SWITCH_, _MAX_SPACE_SWITCH_);\n\n// Full Parameter Set (Standardized)\nvar _INTERACTION_ = 'crystal'; // OPTIONS: crystal, switch, key, mixed, null\nvar _TURN_STYLE_ = 'straight'; // OPTIONS: straight, turnLeft, turnRight, uTurn, zTurn, randomLeftRight, random, null\nvar _TURN_POINT_ = 'null'; // OPTIONS: null, start, end, mid, random, null\nvar _HAS_JUMP_ = 'noJump'; // OPTIONS: random, withJump, noJump, null\nvar _NO_ITEM_AT_ = 'null'; // OPTIONS: null, noItemStart, noItemEnd, noItemBoth, null\nvar _SEED_ = random(1, 99999);\n\nmoveForward();\n\n// Zigzag pattern to avoid circular path\nfor (let i = 0; i < REPEATS; i++) {\n  // Phase 1: Crystal Spacing\n  for (let c = 0; c < SPACE_CRYSTAL + 1; c++) {\n    moveForward();\n  }\n  collectItem();\n  \n  // Phase 2: Switch Spacing\n  for (let s = 0; s < SPACE_SWITCH + 1; s++) {\n    moveForward();\n  }\n  toggleSwitch();\n  \n  // Alternate turn direction\n  if (i % 2 == 0) {\n    turnRight();\n    moveForward();\n    turnRight();\n  } else {\n    turnLeft();\n    moveForward();\n    turnLeft();\n  }\n}\n\n// Final exit\ncollectItem();\nmoveForward();\n```\n",
    "hints": {
      "title": "Micro Mixed Interact",
      "description": "Collect crystals and toggle switches.",
      "goalDetails": []
    }
  },
  {
    "metadata": {
      "id": "logic-simple-parity",
      "name": "Simple Parity",
      "category": "logic",
      "concepts": [
        "conditional",
        "modulo"
      ],
      "difficulty": 2,
      "tags": [
        "logic",
        "parity",
        "even_odd"
      ],
      "author": "system",
      "version": 2,
      "description": "Simple alternating pattern - collect every other step"
    },
    "parameters": [
      {
        "name": "_MIN_PAIRS_",
        "displayName": "Min Pairs",
        "type": "number",
        "defaultValue": 3
      },
      {
        "name": "_MAX_PAIRS_",
        "displayName": "Max Pairs",
        "type": "number",
        "defaultValue": 5
      },
      {
        "name": "_INTERACTION_",
        "displayName": "Interaction",
        "type": "string",
        "defaultValue": "crystal"
      },
      {
        "name": "_TURN_STYLE_",
        "displayName": "Turn Style",
        "type": "string",
        "defaultValue": "straight"
      },
      {
        "name": "_TURN_POINT_",
        "displayName": "Turn Point",
        "type": "string",
        "defaultValue": "null"
      },
      {
        "name": "_HAS_JUMP_",
        "displayName": "Has Jump",
        "type": "string",
        "defaultValue": "noJump"
      },
      {
        "name": "_NO_ITEM_AT_",
        "displayName": "No Item At",
        "type": "string",
        "defaultValue": "null"
      },
      {
        "name": "_SEED_",
        "displayName": "Seed",
        "type": "int",
        "defaultValue": 1,
        "min": 1,
        "max": 99999
      }
    ],
    "solutionCode": "// Parameters\nvar _MIN_PAIRS_ = 3;\nvar _MAX_PAIRS_ = 5;\nvar PAIRS = random(_MIN_PAIRS_, _MAX_PAIRS_);\n\n// Full Parameter Set (Standardized)\nvar _INTERACTION_ = 'crystal'; // OPTIONS: crystal, switch, key, mixed, null\nvar _TURN_STYLE_ = 'straight'; // OPTIONS: straight, turnLeft, turnRight, uTurn, zTurn, randomLeftRight, random, null\nvar _TURN_POINT_ = 'null'; // OPTIONS: null, start, end, mid, random, null\nvar _HAS_JUMP_ = 'noJump'; // OPTIONS: random, withJump, noJump, null\nvar _NO_ITEM_AT_ = 'null'; // OPTIONS: null, noItemStart, noItemEnd, noItemBoth, null\nvar _SEED_ = random(1, 99999);\n\n// Solution\nfor (let i = 0; i < STEPS; i++) {\n   // Even steps: Item present\n   // Odd steps: No item (empty step)\n   if (i % 2 == 0) {\n      randomPattern(1, _INTERACTION_, true, 0, 'straight', _TURN_STYLE_, _TURN_POINT_, _HAS_JUMP_, 'false', _SEED_ + i); // Item forced\n   } else {\n      randomPattern(1, _INTERACTION_, true, 0, 'straight', _TURN_STYLE_, _TURN_POINT_, _HAS_JUMP_, 'true', _SEED_ + i); // Item blocked (empty)\n   }\n}",
    "descriptionMarkdown": "# Simple Parity\n\nA simple introduction to parity (even/odd) logic.\n\n## Learning Goals\n- Understand even/odd pattern\n- Recognize alternating sequences\n\n## Features\n- **Parity Logic**: Demonstrates doing something every *other* step.\n- **Control Flow**: Using logic to control action execution.\n\n## Solution & Parameters",
    "rawContent": "---\nid: logic-simple-parity\nname: \"Simple Parity\"\ncategory: logic\nconcepts: [\"conditional\", \"modulo\"]\ndifficulty: 2\ntags: [\"logic\", \"parity\", \"even_odd\"]\nauthor: system\nversion: 2\ndescription: \"Simple alternating pattern - collect every other step\"\n---\n\n# Simple Parity\n\nA simple introduction to parity (even/odd) logic.\n\n## Learning Goals\n- Understand even/odd pattern\n- Recognize alternating sequences\n\n## Features\n- **Parity Logic**: Demonstrates doing something every *other* step.\n- **Control Flow**: Using logic to control action execution.\n\n## Solution & Parameters\n\n```js\n// Parameters\nvar _MIN_PAIRS_ = 3;\nvar _MAX_PAIRS_ = 5;\nvar PAIRS = random(_MIN_PAIRS_, _MAX_PAIRS_);\n\n// Full Parameter Set (Standardized)\nvar _INTERACTION_ = 'crystal'; // OPTIONS: crystal, switch, key, mixed, null\nvar _TURN_STYLE_ = 'straight'; // OPTIONS: straight, turnLeft, turnRight, uTurn, zTurn, randomLeftRight, random, null\nvar _TURN_POINT_ = 'null'; // OPTIONS: null, start, end, mid, random, null\nvar _HAS_JUMP_ = 'noJump'; // OPTIONS: random, withJump, noJump, null\nvar _NO_ITEM_AT_ = 'null'; // OPTIONS: null, noItemStart, noItemEnd, noItemBoth, null\nvar _SEED_ = random(1, 99999);\n\n// Solution\nfor (let i = 0; i < STEPS; i++) {\n   // Even steps: Item present\n   // Odd steps: No item (empty step)\n   if (i % 2 == 0) {\n      randomPattern(1, _INTERACTION_, true, 0, 'straight', _TURN_STYLE_, _TURN_POINT_, _HAS_JUMP_, 'false', _SEED_ + i); // Item forced\n   } else {\n      randomPattern(1, _INTERACTION_, true, 0, 'straight', _TURN_STYLE_, _TURN_POINT_, _HAS_JUMP_, 'true', _SEED_ + i); // Item blocked (empty)\n   }\n}\n```\n",
    "hints": {
      "title": "Simple Parity",
      "description": "A simple introduction to parity (even/odd) logic.",
      "learningGoals": "- Understand even/odd pattern",
      "goalDetails": [
        "Recognize alternating sequences"
      ]
    }
  },
  {
    "metadata": {
      "id": "logic-3-way",
      "name": "Three-Way Cycle",
      "category": "logic",
      "concepts": [
        "loop",
        "conditional",
        "modulo"
      ],
      "difficulty": 5,
      "tags": [
        "logic",
        "modulo",
        "cycle",
        "pattern"
      ],
      "author": "system",
      "version": 2,
      "description": "A repeating cycle of 3 actions: Move -> Jump -> Collect"
    },
    "parameters": [
      {
        "name": "_MIN_CYCLES_",
        "displayName": "Min Cycles",
        "type": "number",
        "defaultValue": 3
      },
      {
        "name": "_MAX_CYCLES_",
        "displayName": "Max Cycles",
        "type": "number",
        "defaultValue": 5
      },
      {
        "name": "_INTERACTION_",
        "displayName": "Interaction",
        "type": "string",
        "defaultValue": "crystal"
      },
      {
        "name": "_TURN_STYLE_",
        "displayName": "Turn Style",
        "type": "string",
        "defaultValue": "straight"
      },
      {
        "name": "_TURN_POINT_",
        "displayName": "Turn Point",
        "type": "string",
        "defaultValue": "null"
      },
      {
        "name": "_HAS_JUMP_",
        "displayName": "Has Jump",
        "type": "string",
        "defaultValue": "noJump"
      },
      {
        "name": "_NO_ITEM_AT_",
        "displayName": "No Item At",
        "type": "string",
        "defaultValue": "null"
      },
      {
        "name": "_SEED_",
        "displayName": "Seed",
        "type": "int",
        "defaultValue": 1,
        "min": 1,
        "max": 99999
      }
    ],
    "solutionCode": "// Parameters\nvar _MIN_CYCLES_ = 3;\nvar _MAX_CYCLES_ = 5;\nvar CYCLES = random(_MIN_CYCLES_, _MAX_CYCLES_);\n\n// Full Parameter Set (Standardized)\nvar _INTERACTION_ = 'crystal'; // OPTIONS: crystal, switch, key, mixed, null\nvar _TURN_STYLE_ = 'straight'; // OPTIONS: straight, turnLeft, turnRight, uTurn, zTurn, randomLeftRight, random, null\nvar _TURN_POINT_ = 'null'; // OPTIONS: null, start, end, mid, random, null\nvar _HAS_JUMP_ = 'noJump'; // OPTIONS: random, withJump, noJump, null\nvar _NO_ITEM_AT_ = 'null'; // OPTIONS: null, noItemStart, noItemEnd, noItemBoth, null\nvar _SEED_ = random(1, 99999);\n\n// Solution\nfor (let i = 0; i < CYCLES; i++) {\n  // Case 0: Move (Simple Walk)\n  randomPattern(1, _INTERACTION_, true, 0, 'straight', _TURN_STYLE_, _TURN_POINT_, 'noJump', _NO_ITEM_AT_, _SEED_ + (i*3));\n  \n  // Case 1: Jump Up\n  randomPattern(1, _INTERACTION_, true, 0, 'straight', _TURN_STYLE_, _TURN_POINT_, 'withJump', _NO_ITEM_AT_, _SEED_ + (i*3) + 1);\n  \n  // Case 2: Collect & Move (Move with guaranteed item or just standard pattern)\n  // Logic says \"Collect & Move\". randomPattern(1) basically does Move+Collect if item exists.\n  // We'll force an item here to distinguish it from Case 0 if Case 0 was random.\n  randomPattern(1, _INTERACTION_, true, 0, 'straight', _TURN_STYLE_, _TURN_POINT_, 'noJump', 'false', _SEED_ + (i*3) + 2);\n}",
    "descriptionMarkdown": "# Three-Way Cycle\n\nA pattern that repeats every 3 steps, teaching Modulo 3 logic.\n\n## Academic Concept: Modulo N\n- Case 0: Action A\n- Case 1: Action B\n- Case 2: Action C\n\n## Features\n- **Modulo Logic**: Repeats a pattern every 3 steps (0, 1, 2).\n- **Cycle**: A repeating sequence of Move, Jump, Collect+Move.\n\n## Solution & Parameters",
    "rawContent": "---\nid: logic-3-way\nname: \"Three-Way Cycle\"\ncategory: logic\nconcepts: [\"loop\", \"conditional\", \"modulo\"]\ndifficulty: 5\ntags: [\"logic\", \"modulo\", \"cycle\", \"pattern\"]\nauthor: system\nversion: 2\ndescription: \"A repeating cycle of 3 actions: Move -> Jump -> Collect\"\n---\n\n# Three-Way Cycle\n\nA pattern that repeats every 3 steps, teaching Modulo 3 logic.\n\n## Academic Concept: Modulo N\n- Case 0: Action A\n- Case 1: Action B\n- Case 2: Action C\n\n## Features\n- **Modulo Logic**: Repeats a pattern every 3 steps (0, 1, 2).\n- **Cycle**: A repeating sequence of Move, Jump, Collect+Move.\n\n## Solution & Parameters\n\n```js\n// Parameters\nvar _MIN_CYCLES_ = 3;\nvar _MAX_CYCLES_ = 5;\nvar CYCLES = random(_MIN_CYCLES_, _MAX_CYCLES_);\n\n// Full Parameter Set (Standardized)\nvar _INTERACTION_ = 'crystal'; // OPTIONS: crystal, switch, key, mixed, null\nvar _TURN_STYLE_ = 'straight'; // OPTIONS: straight, turnLeft, turnRight, uTurn, zTurn, randomLeftRight, random, null\nvar _TURN_POINT_ = 'null'; // OPTIONS: null, start, end, mid, random, null\nvar _HAS_JUMP_ = 'noJump'; // OPTIONS: random, withJump, noJump, null\nvar _NO_ITEM_AT_ = 'null'; // OPTIONS: null, noItemStart, noItemEnd, noItemBoth, null\nvar _SEED_ = random(1, 99999);\n\n// Solution\nfor (let i = 0; i < CYCLES; i++) {\n  // Case 0: Move (Simple Walk)\n  randomPattern(1, _INTERACTION_, true, 0, 'straight', _TURN_STYLE_, _TURN_POINT_, 'noJump', _NO_ITEM_AT_, _SEED_ + (i*3));\n  \n  // Case 1: Jump Up\n  randomPattern(1, _INTERACTION_, true, 0, 'straight', _TURN_STYLE_, _TURN_POINT_, 'withJump', _NO_ITEM_AT_, _SEED_ + (i*3) + 1);\n  \n  // Case 2: Collect & Move (Move with guaranteed item or just standard pattern)\n  // Logic says \"Collect & Move\". randomPattern(1) basically does Move+Collect if item exists.\n  // We'll force an item here to distinguish it from Case 0 if Case 0 was random.\n  randomPattern(1, _INTERACTION_, true, 0, 'straight', _TURN_STYLE_, _TURN_POINT_, 'noJump', 'false', _SEED_ + (i*3) + 2);\n}\n```\n",
    "hints": {
      "title": "Three-Way Cycle",
      "description": "A pattern that repeats every 3 steps, teaching Modulo 3 logic.",
      "learningGoals": "Modulo N",
      "goalDetails": [
        "Case 0: Action A",
        "Case 1: Action B",
        "Case 2: Action C"
      ]
    }
  },
  {
    "metadata": {
      "id": "unknown",
      "name": "Untitled Template",
      "category": "sequential",
      "concepts": [
        "sequential"
      ],
      "difficulty": 5,
      "tags": [],
      "author": "system",
      "version": 1
    },
    "parameters": [],
    "solutionCode": "",
    "descriptionMarkdown": "# Lộ trình Phát triển Kỹ năng Vòng lặp (Theo Chương trình GDPT)\n\nTài liệu này ánh xạ lộ trình dạy lập trình Vòng lặp (Loop) tiêu chuẩn (từ THCS/THPT) sang thiết kế màn chơi Maze 3D, với độ khó tăng dần từ nhận biết đến vận dụng cao.\n\n## Triết lý Thiết kế\n\n1.  **Đa dạng hóa Pattern**: Không cứng nhắc sử dụng Micro-pattern cố định; ưu tiên sự ngẫu nhiên của địa hình để tạo thử thách tự nhiên cho vòng lặp.\n2.  **Logic \"If\" & Ngẫu nhiên**: Với các bài tập điều kiện (`if`, `while`), vị trí vật phẩm hoặc chướng ngại vật **phải được sinh ngẫu nhiên** mỗi lần chơi, buộc học sinh viết code logic (`if isPath`, `if hasGem`) thay vì hard-code đường đi.\n\n---\n\n## Bảng Đối chiếu Tổng quan\n\n| Cấp độ | Checkpoint GDPT | Concept Lập trình | Cơ chế Game (Maze Design) | Ghi chú Kỹ thuật |\n|:---:|---|---|---|---|\n| **Làm quen** | 1. For cơ bản | Lặp số lần cố định | Đi thẳng quãng đường dài, lặp lại hành động đơn giản. | `repeat N` |\n| | 2. For bước nhảy | Bước nhảy (Stride) | Nhảy cóc (Jump) hoặc đi bộ qua các hòn đảo cách quãng. | Random khoảng cách đảo |\n| | 3. For + Biến chạy | Sử dụng biến `i` | Mô hình bậc thang tăng dần (đi 1, đi 2, đi 3...). | Hình nón / Cầu thang xoắn |\n| | 4. While cơ bản | Điều kiện dừng đơn giản | Đi mãi cho đến khi gặp ngõ cụt hoặc đích. | Random độ dài đường đi |\n| **Củng cố** | 5. While + Logic | Check điều kiện đầu vào | Check đường trước khi đi (`if path`). Giải mê cung đơn giản. | **Random path direction** |\n| | 6. While + Tích lũy | Loop đến khi đủ lượng | Thu thập đủ N vật phẩm thì cửa mở. | **Random vị trí items** |\n| | 7. Nested (Cơ bản) | Lặp lồng nhau (Grid) | Đi tuần tra khu vực hình chữ nhật (Nông trại, Sàn nhà). | Grid diện tích thay đổi |\n| | 8. Nested (Biến đổi) | Loop lồng phụ thuộc `i` | Xây/Đi kim tự tháp, tam giác (Hàng sau dài hơn hàng trước). | Tam giác kích thước ngẫu nhiên |\n| **Nâng cao** | 9. While + For | Kết hợp 2 loại loop | Đi đường chính (While) + Rẽ vào n ngõ cụt khám phá (For). | Trục chính ngẫu nhiên |\n| | 10. Nested 3 tầng | 3D Loops | Xử lý tòa nhà nhiều tầng (Hàng x Cột x Tầng). | Tòa nhà cao tầng |\n| | 11. Loop + Flag/Break | Thoát sớm (Break) | Tìm vật phẩm trong hàng, thấy thì dừng và chuyển hàng khác. | **Item ẩn ở vị trí ngẫu nhiên** |\n| **Ứng dụng** | 12. Smart Agent | Giải thuật tìm đường | Mê cung ngẫu nhiên phức tạp (Wall follower). | Maze Generation Algorithm |\n\n---\n\n## Chi tiết Thiết kế Màn chơi (Theo Giai đoạn)\n\n### Giai đoạn 1: Làm quen (Foundation)\n\n#### 1. Hành lang vô tận (The Infinite Corridor)\n*   **Concept**: `for i in range(10)`\n*   **Mô tả**: Một con đường thẳng tắp rất dài để người chơi cảm thấy mệt mỏi nếu kéo thả thủ công.\n*   **Kỹ thuật**: Sinh map đường thẳng độ dài cố định nhưng dài (ví dụ 10-15 ô).\n\n#### 2. Quần đảo Nhảy cóc (Island Hopping)\n*   **Concept**: `for i in range(0, 10, 2)` (Bước nhảy)\n*   **Mô tả**: Các hòn đảo cách nhau 1 ô nước. Nhân vật phải nhảy (`jump`) hoặc đi cầu.\n*   **Kỹ thuật**: Dùng `postProcess` để xóa các ô đất ở vị trí lẻ, tạo cảm giác đứt quãng.\n\n#### 3. Cầu thang Vô cực (Stairway to Heaven)\n*   **Concept**: `move(i)` (Sử dụng biến đếm)\n*   **Mô tả**: Bậc thang với độ dài cạnh tăng dần (Bậc 1 dài 1 ô, Bậc 2 dài 2 ô...).\n*   **Kỹ thuật**: Sinh path theo hình xoắn ốc mở rộng dần.\n\n#### 4. Đường hầm Tối (The Dark Tunnel)\n*   **Concept**: `while not_finished`\n*   **Mô tả**: Đường đi độ dài ngẫu nhiên mỗi lần nhấn \"Chạy\". Người chơi không thể đếm ô.\n*   **Kỹ thuật**: Random độ dài `LEN` trong khoảng [5, 15] mỗi lần generate.\n\n---\n\n### Giai đoạn 2: Củng cố & Tích lũy (Development)\n\n#### 5. Khu rừng Mê cung (The Dense Forest)\n*   **Concept**: `while isPath(ahead)`\n*   **Mô tả**: Đường đi khúc khuỷu ngẫu nhiên. Người chơi phải dùng cảm biến `if path ahead` để quyết định đi tiếp hay rẽ.\n*   **Kỹ thuật**: \n    *   Sinh đường đi ngẫu nhiên hoàn toàn (Random Walk).\n    *   `Post-process`: Đặt cây dày đặc ở các ô không phải đường đi để chặn thị giác.\n\n#### 6. Người Sưu tầm (The Collector)\n*   **Concept**: `while crystals < TARGET`\n*   **Mô tả**: Nhân vật ở trong một phòng đầy item. Vị trí item thay đổi mỗi lần chơi.\n*   **Kỹ thuật**: \n    *   Sinh một phòng trống.\n    *   **Logic Random**: Rải N item ngẫu nhiên trong phòng mỗi khi generate map.\n\n#### 7. Nông trại Gà (The Chicken Farm)\n*   **Concept**: `Nested Loop` (Hình chữ nhật)\n*   **Mô tả**: Một mảnh đất `Items[Rows][Cols]`. Cần đi hết hàng, quay đầu, đi hàng tiếp theo.\n*   **Kỹ thuật**: Sinh Grid chữ nhật kích thước ngẫu nhiên (dễ: 3x3, khó: 5x5).\n\n#### 8. Kim Tự Tháp (The Pyramid)\n*   **Concept**: `Nested Loop` phụ thuộc (Tam giác)\n*   **Mô tả**: Xây dựng hoặc đi trên cấu trúc kim tự tháp.\n*   **Kỹ thuật**: Sinh path zic-zac nhưng độ dài cạnh thay đổi theo tầng (`len = row_index`).\n\n---\n\n### Giai đoạn 3: Nâng cao Tư duy (Advanced Logic)\n\n#### 9. Trục Xương cá (Fishbone Path)\n*   **Concept**: `While (main) + For (sub)`\n*   **Mô tả**: Một đường trục chính dài vô tận (While). Tại mỗi đốt xương, có một ngõ cụt dài cố định chứa kho báu (For).\n*   **Kỹ thuật**: Trục chính sinh ngẫu nhiên. Nhánh phụ sinh cố định chiều dài `L`.\n\n#### 10. Chung cư Cao tầng (Sky Scraper)\n*   **Concept**: `3D Nested Loop`\n*   **Mô tả**: Tương tự \"Nông trại\" nhưng sau khi dọn xong 1 sàn, phải tìm cầu thang lên tầng trên và lặp lại quy trình.\n*   **Kỹ thuật**: Sử dụng `postProcess` kiểu `building` để chồng các layer map lên nhau.\n\n#### 11. Cuộc tìm kiếm (Search & Break)\n*   **Concept**: `Loop + Break`\n*   **Mô tả**: Có 5 hành lang. Chỉ 1 hành lang có chìa khóa (vị trí ngẫu nhiên).\n*   **Kỹ thuật**: \n    *   Sinh 5 nhánh path giống hệt nhau.\n    *   **Logic Random**: Đặt chìa khóa vào cuối 1 nhánh bất kỳ. Các nhánh còn lại để trống hoặc có bẫy.\n    *   Yêu cầu dùng `break` khi tìm thấy để tối ưu bước đi (tính điểm).\n\n---\n\n### Giai đoạn 4: Ứng dụng & Giải thuật (Mastery)\n\n#### 12. Smart Explorer (Wall Follower AI)\n*   **Concept**: `While True + Complex Logic`\n*   **Mô tả**: Mê cung hoàn chỉnh không biết trước cấu trúc.\n*   **Kỹ thuật**: Sử dụng thuật toán sinh mê cung chuẩn (Prim/Kruskal).\n*   **Yêu cầu**: Code giải thuật bám tường hoặc tìm đường tổng quát.",
    "rawContent": "# Lộ trình Phát triển Kỹ năng Vòng lặp (Theo Chương trình GDPT)\n\nTài liệu này ánh xạ lộ trình dạy lập trình Vòng lặp (Loop) tiêu chuẩn (từ THCS/THPT) sang thiết kế màn chơi Maze 3D, với độ khó tăng dần từ nhận biết đến vận dụng cao.\n\n## Triết lý Thiết kế\n\n1.  **Đa dạng hóa Pattern**: Không cứng nhắc sử dụng Micro-pattern cố định; ưu tiên sự ngẫu nhiên của địa hình để tạo thử thách tự nhiên cho vòng lặp.\n2.  **Logic \"If\" & Ngẫu nhiên**: Với các bài tập điều kiện (`if`, `while`), vị trí vật phẩm hoặc chướng ngại vật **phải được sinh ngẫu nhiên** mỗi lần chơi, buộc học sinh viết code logic (`if isPath`, `if hasGem`) thay vì hard-code đường đi.\n\n---\n\n## Bảng Đối chiếu Tổng quan\n\n| Cấp độ | Checkpoint GDPT | Concept Lập trình | Cơ chế Game (Maze Design) | Ghi chú Kỹ thuật |\n|:---:|---|---|---|---|\n| **Làm quen** | 1. For cơ bản | Lặp số lần cố định | Đi thẳng quãng đường dài, lặp lại hành động đơn giản. | `repeat N` |\n| | 2. For bước nhảy | Bước nhảy (Stride) | Nhảy cóc (Jump) hoặc đi bộ qua các hòn đảo cách quãng. | Random khoảng cách đảo |\n| | 3. For + Biến chạy | Sử dụng biến `i` | Mô hình bậc thang tăng dần (đi 1, đi 2, đi 3...). | Hình nón / Cầu thang xoắn |\n| | 4. While cơ bản | Điều kiện dừng đơn giản | Đi mãi cho đến khi gặp ngõ cụt hoặc đích. | Random độ dài đường đi |\n| **Củng cố** | 5. While + Logic | Check điều kiện đầu vào | Check đường trước khi đi (`if path`). Giải mê cung đơn giản. | **Random path direction** |\n| | 6. While + Tích lũy | Loop đến khi đủ lượng | Thu thập đủ N vật phẩm thì cửa mở. | **Random vị trí items** |\n| | 7. Nested (Cơ bản) | Lặp lồng nhau (Grid) | Đi tuần tra khu vực hình chữ nhật (Nông trại, Sàn nhà). | Grid diện tích thay đổi |\n| | 8. Nested (Biến đổi) | Loop lồng phụ thuộc `i` | Xây/Đi kim tự tháp, tam giác (Hàng sau dài hơn hàng trước). | Tam giác kích thước ngẫu nhiên |\n| **Nâng cao** | 9. While + For | Kết hợp 2 loại loop | Đi đường chính (While) + Rẽ vào n ngõ cụt khám phá (For). | Trục chính ngẫu nhiên |\n| | 10. Nested 3 tầng | 3D Loops | Xử lý tòa nhà nhiều tầng (Hàng x Cột x Tầng). | Tòa nhà cao tầng |\n| | 11. Loop + Flag/Break | Thoát sớm (Break) | Tìm vật phẩm trong hàng, thấy thì dừng và chuyển hàng khác. | **Item ẩn ở vị trí ngẫu nhiên** |\n| **Ứng dụng** | 12. Smart Agent | Giải thuật tìm đường | Mê cung ngẫu nhiên phức tạp (Wall follower). | Maze Generation Algorithm |\n\n---\n\n## Chi tiết Thiết kế Màn chơi (Theo Giai đoạn)\n\n### Giai đoạn 1: Làm quen (Foundation)\n\n#### 1. Hành lang vô tận (The Infinite Corridor)\n*   **Concept**: `for i in range(10)`\n*   **Mô tả**: Một con đường thẳng tắp rất dài để người chơi cảm thấy mệt mỏi nếu kéo thả thủ công.\n*   **Kỹ thuật**: Sinh map đường thẳng độ dài cố định nhưng dài (ví dụ 10-15 ô).\n\n#### 2. Quần đảo Nhảy cóc (Island Hopping)\n*   **Concept**: `for i in range(0, 10, 2)` (Bước nhảy)\n*   **Mô tả**: Các hòn đảo cách nhau 1 ô nước. Nhân vật phải nhảy (`jump`) hoặc đi cầu.\n*   **Kỹ thuật**: Dùng `postProcess` để xóa các ô đất ở vị trí lẻ, tạo cảm giác đứt quãng.\n\n#### 3. Cầu thang Vô cực (Stairway to Heaven)\n*   **Concept**: `move(i)` (Sử dụng biến đếm)\n*   **Mô tả**: Bậc thang với độ dài cạnh tăng dần (Bậc 1 dài 1 ô, Bậc 2 dài 2 ô...).\n*   **Kỹ thuật**: Sinh path theo hình xoắn ốc mở rộng dần.\n\n#### 4. Đường hầm Tối (The Dark Tunnel)\n*   **Concept**: `while not_finished`\n*   **Mô tả**: Đường đi độ dài ngẫu nhiên mỗi lần nhấn \"Chạy\". Người chơi không thể đếm ô.\n*   **Kỹ thuật**: Random độ dài `LEN` trong khoảng [5, 15] mỗi lần generate.\n\n---\n\n### Giai đoạn 2: Củng cố & Tích lũy (Development)\n\n#### 5. Khu rừng Mê cung (The Dense Forest)\n*   **Concept**: `while isPath(ahead)`\n*   **Mô tả**: Đường đi khúc khuỷu ngẫu nhiên. Người chơi phải dùng cảm biến `if path ahead` để quyết định đi tiếp hay rẽ.\n*   **Kỹ thuật**: \n    *   Sinh đường đi ngẫu nhiên hoàn toàn (Random Walk).\n    *   `Post-process`: Đặt cây dày đặc ở các ô không phải đường đi để chặn thị giác.\n\n#### 6. Người Sưu tầm (The Collector)\n*   **Concept**: `while crystals < TARGET`\n*   **Mô tả**: Nhân vật ở trong một phòng đầy item. Vị trí item thay đổi mỗi lần chơi.\n*   **Kỹ thuật**: \n    *   Sinh một phòng trống.\n    *   **Logic Random**: Rải N item ngẫu nhiên trong phòng mỗi khi generate map.\n\n#### 7. Nông trại Gà (The Chicken Farm)\n*   **Concept**: `Nested Loop` (Hình chữ nhật)\n*   **Mô tả**: Một mảnh đất `Items[Rows][Cols]`. Cần đi hết hàng, quay đầu, đi hàng tiếp theo.\n*   **Kỹ thuật**: Sinh Grid chữ nhật kích thước ngẫu nhiên (dễ: 3x3, khó: 5x5).\n\n#### 8. Kim Tự Tháp (The Pyramid)\n*   **Concept**: `Nested Loop` phụ thuộc (Tam giác)\n*   **Mô tả**: Xây dựng hoặc đi trên cấu trúc kim tự tháp.\n*   **Kỹ thuật**: Sinh path zic-zac nhưng độ dài cạnh thay đổi theo tầng (`len = row_index`).\n\n---\n\n### Giai đoạn 3: Nâng cao Tư duy (Advanced Logic)\n\n#### 9. Trục Xương cá (Fishbone Path)\n*   **Concept**: `While (main) + For (sub)`\n*   **Mô tả**: Một đường trục chính dài vô tận (While). Tại mỗi đốt xương, có một ngõ cụt dài cố định chứa kho báu (For).\n*   **Kỹ thuật**: Trục chính sinh ngẫu nhiên. Nhánh phụ sinh cố định chiều dài `L`.\n\n#### 10. Chung cư Cao tầng (Sky Scraper)\n*   **Concept**: `3D Nested Loop`\n*   **Mô tả**: Tương tự \"Nông trại\" nhưng sau khi dọn xong 1 sàn, phải tìm cầu thang lên tầng trên và lặp lại quy trình.\n*   **Kỹ thuật**: Sử dụng `postProcess` kiểu `building` để chồng các layer map lên nhau.\n\n#### 11. Cuộc tìm kiếm (Search & Break)\n*   **Concept**: `Loop + Break`\n*   **Mô tả**: Có 5 hành lang. Chỉ 1 hành lang có chìa khóa (vị trí ngẫu nhiên).\n*   **Kỹ thuật**: \n    *   Sinh 5 nhánh path giống hệt nhau.\n    *   **Logic Random**: Đặt chìa khóa vào cuối 1 nhánh bất kỳ. Các nhánh còn lại để trống hoặc có bẫy.\n    *   Yêu cầu dùng `break` khi tìm thấy để tối ưu bước đi (tính điểm).\n\n---\n\n### Giai đoạn 4: Ứng dụng & Giải thuật (Mastery)\n\n#### 12. Smart Explorer (Wall Follower AI)\n*   **Concept**: `While True + Complex Logic`\n*   **Mô tả**: Mê cung hoàn chỉnh không biết trước cấu trúc.\n*   **Kỹ thuật**: Sử dụng thuật toán sinh mê cung chuẩn (Prim/Kruskal).\n*   **Yêu cầu**: Code giải thuật bám tường hoặc tìm đường tổng quát.\n",
    "hints": {
      "title": "Lộ trình Phát triển Kỹ năng Vòng lặp (Theo Chương trình GDPT)",
      "description": "Tài liệu này ánh xạ lộ trình dạy lập trình Vòng lặp (Loop) tiêu chuẩn (từ THCS/THPT) sang thiết kế màn chơi Maze 3D, với độ khó tăng dần từ nhận biết đến vận dụng cao.",
      "goalDetails": []
    }
  },
  {
    "metadata": {
      "id": "for-with-turns",
      "name": "FOR Loop with Turns",
      "category": "loop",
      "concepts": [
        "repeat_n"
      ],
      "difficulty": 2,
      "tags": [
        "for",
        "loop",
        "turn",
        "l-shape"
      ],
      "author": "system",
      "version": 1,
      "description": "Create an L-shape path using loops with turns"
    },
    "parameters": [
      {
        "name": "_MIN_STEPS_",
        "displayName": "Min Steps",
        "type": "number",
        "defaultValue": 3
      },
      {
        "name": "_MAX_STEPS_",
        "displayName": "Max Steps",
        "type": "number",
        "defaultValue": 5
      },
      {
        "name": "_INTERACTION_",
        "displayName": "Interaction",
        "type": "string",
        "defaultValue": "crystal"
      },
      {
        "name": "_TURN_STYLE_",
        "displayName": "Turn Style",
        "type": "string",
        "defaultValue": "straight"
      },
      {
        "name": "_TURN_POINT_",
        "displayName": "Turn Point",
        "type": "string",
        "defaultValue": "null"
      },
      {
        "name": "_HAS_JUMP_",
        "displayName": "Has Jump",
        "type": "string",
        "defaultValue": "noJump"
      },
      {
        "name": "_NO_ITEM_AT_",
        "displayName": "No Item At",
        "type": "string",
        "defaultValue": "null"
      },
      {
        "name": "_SEED_",
        "displayName": "Seed",
        "type": "int",
        "defaultValue": 1,
        "min": 1,
        "max": 99999
      }
    ],
    "solutionCode": "// Parameters\nvar _MIN_STEPS_ = 3;\nvar _MAX_STEPS_ = 5;\nvar SEG1_LEN = random(_MIN_STEPS_, _MAX_STEPS_);\nvar SEG2_LEN = random(_MIN_STEPS_, _MAX_STEPS_);\n\n// Full Parameter Set (Standardized)\nvar _INTERACTION_ = 'crystal'; // OPTIONS: crystal, switch, key, mixed, null\nvar _TURN_STYLE_ = 'straight'; // OPTIONS: straight, turnLeft, turnRight, uTurn, zTurn, randomLeftRight, random, null\nvar _TURN_POINT_ = 'null'; // OPTIONS: null, start, end, mid, random, null\nvar _HAS_JUMP_ = 'noJump'; // OPTIONS: random, withJump, noJump, null\nvar _NO_ITEM_AT_ = 'null'; // OPTIONS: null, noItemStart, noItemEnd, noItemBoth, null\nvar _SEED_ = random(1, 99999);\n\n// Solution\n// Segment 1\nrandomPattern(SEG1_LEN, _INTERACTION_, false, 0, 'straight', _TURN_STYLE_, _TURN_POINT_, _HAS_JUMP_, _NO_ITEM_AT_, _SEED_);\n\n// Turn\nturnRight();\n\n// Segment 2\nrandomPattern(SEG2_LEN, _INTERACTION_, false, 0, 'straight', _TURN_STYLE_, _TURN_POINT_, _HAS_JUMP_, _NO_ITEM_AT_, _SEED_ + 1);",
    "descriptionMarkdown": "# FOR Loop with Turns\n\nCombine FOR loops with turning to create more complex paths.\n\n## Learning Goals\n- Use multiple FOR loops\n- Combine loops with turn commands\n- Create L-shaped paths\n\n## Features\n- **Sequential Loops**: Uses multiple loops to create distinct path segments.\n- **Direction Change**: Connects segments with a turn command.\n- **Segments**: Each arm of the L-shape is generated as a `randomPattern`.\n\n## Solution & Parameters",
    "rawContent": "---\nid: for-with-turns\nname: \"FOR Loop with Turns\"\ncategory: loop\nconcepts: [\"repeat_n\"]\ndifficulty: 2\ntags: [\"for\", \"loop\", \"turn\", \"l-shape\"]\nauthor: system\nversion: 1\ndescription: \"Create an L-shape path using loops with turns\"\n---\n\n# FOR Loop with Turns\n\nCombine FOR loops with turning to create more complex paths.\n\n## Learning Goals\n- Use multiple FOR loops\n- Combine loops with turn commands\n- Create L-shaped paths\n\n## Features\n- **Sequential Loops**: Uses multiple loops to create distinct path segments.\n- **Direction Change**: Connects segments with a turn command.\n- **Segments**: Each arm of the L-shape is generated as a `randomPattern`.\n\n## Solution & Parameters\n\n```js\n// Parameters\nvar _MIN_STEPS_ = 3;\nvar _MAX_STEPS_ = 5;\nvar SEG1_LEN = random(_MIN_STEPS_, _MAX_STEPS_);\nvar SEG2_LEN = random(_MIN_STEPS_, _MAX_STEPS_);\n\n// Full Parameter Set (Standardized)\nvar _INTERACTION_ = 'crystal'; // OPTIONS: crystal, switch, key, mixed, null\nvar _TURN_STYLE_ = 'straight'; // OPTIONS: straight, turnLeft, turnRight, uTurn, zTurn, randomLeftRight, random, null\nvar _TURN_POINT_ = 'null'; // OPTIONS: null, start, end, mid, random, null\nvar _HAS_JUMP_ = 'noJump'; // OPTIONS: random, withJump, noJump, null\nvar _NO_ITEM_AT_ = 'null'; // OPTIONS: null, noItemStart, noItemEnd, noItemBoth, null\nvar _SEED_ = random(1, 99999);\n\n// Solution\n// Segment 1\nrandomPattern(SEG1_LEN, _INTERACTION_, false, 0, 'straight', _TURN_STYLE_, _TURN_POINT_, _HAS_JUMP_, _NO_ITEM_AT_, _SEED_);\n\n// Turn\nturnRight();\n\n// Segment 2\nrandomPattern(SEG2_LEN, _INTERACTION_, false, 0, 'straight', _TURN_STYLE_, _TURN_POINT_, _HAS_JUMP_, _NO_ITEM_AT_, _SEED_ + 1);\n```\n",
    "hints": {
      "title": "FOR Loop with Turns",
      "description": "Combine FOR loops with turning to create more complex paths.",
      "learningGoals": "- Use multiple FOR loops",
      "goalDetails": [
        "Combine loops with turn commands",
        "Create L-shaped paths"
      ]
    }
  },
  {
    "metadata": {
      "id": "micro-loop-collect",
      "name": "Micro Loop Collect",
      "category": "loop",
      "concepts": [
        "loop",
        "repeat",
        "spacing"
      ],
      "difficulty": 3,
      "tags": [
        "loop",
        "crystal",
        "repeat"
      ],
      "author": "system",
      "version": 4,
      "description": "Use a loop to collect crystals with turns and spacing"
    },
    "parameters": [
      {
        "name": "_MIN_REPEATS_",
        "displayName": "Min Repeats",
        "type": "number",
        "defaultValue": 2
      },
      {
        "name": "_MAX_REPEATS_",
        "displayName": "Max Repeats",
        "type": "number",
        "defaultValue": 4
      },
      {
        "name": "_INTERACTION_",
        "displayName": "Interaction",
        "type": "string",
        "defaultValue": "crystal"
      },
      {
        "name": "_TURN_STYLE_",
        "displayName": "Turn Style",
        "type": "string",
        "defaultValue": "straight"
      },
      {
        "name": "_TURN_POINT_",
        "displayName": "Turn Point",
        "type": "string",
        "defaultValue": "null"
      },
      {
        "name": "_HAS_JUMP_",
        "displayName": "Has Jump",
        "type": "string",
        "defaultValue": "noJump"
      },
      {
        "name": "_NO_ITEM_AT_",
        "displayName": "No Item At",
        "type": "string",
        "defaultValue": "null"
      },
      {
        "name": "_SEED_",
        "displayName": "Seed",
        "type": "int",
        "defaultValue": 1,
        "min": 1,
        "max": 99999
      }
    ],
    "solutionCode": "// Parameters\nvar _MIN_REPEATS_ = 2;\nvar _MAX_REPEATS_ = 4;\nvar REPEATS = random(_MIN_REPEATS_, _MAX_REPEATS_);\n\n// Full Parameter Set (Standardized)\nvar _INTERACTION_ = 'crystal'; // OPTIONS: crystal, switch, key, mixed, null\nvar _TURN_STYLE_ = 'straight'; // OPTIONS: straight, turnLeft, turnRight, uTurn, zTurn, randomLeftRight, random, null\nvar _TURN_POINT_ = 'null'; // OPTIONS: null, start, end, mid, random, null\nvar _HAS_JUMP_ = 'noJump'; // OPTIONS: random, withJump, noJump, null\nvar _NO_ITEM_AT_ = 'null'; // OPTIONS: null, noItemStart, noItemEnd, noItemBoth, null\nvar _SEED_ = random(1, 99999);\n\n// Solution\nfor (let i = 0; i < REPEATS; i++) {\n  // Generate a segment that includes collection\n  // nestedLoopCompatible=true is important here\n  randomPattern(random(3, 5), _INTERACTION_, true, 0, 'straight', _TURN_STYLE_, _TURN_POINT_, _HAS_JUMP_, _NO_ITEM_AT_, _SEED_ + i);\n  \n  // Optional small turn to make it a loop/path not just a line\n  if (random(0, 100) > 50) turnRight(); else turnLeft();\n}",
    "descriptionMarkdown": "# Micro Loop Collect\n\nA loop-based pattern that collects crystals, turns, and repeats.\n\n## Features\n- **Repetitive Collection**: Basic loop pattern for collecting items spaced out.\n- **Spacing**: Uses `randomPattern` to generate variable spacing between items.\n\n## Solution & Parameters",
    "rawContent": "---\nid: micro-loop-collect\nname: \"Micro Loop Collect\"\ncategory: loop\nconcepts: [\"loop\", \"repeat\", \"spacing\"]\ndifficulty: 3\ntags: [\"loop\", \"crystal\", \"repeat\"]\nauthor: system\nversion: 4\ndescription: \"Use a loop to collect crystals with turns and spacing\"\n---\n\n# Micro Loop Collect\n\nA loop-based pattern that collects crystals, turns, and repeats.\n\n## Features\n- **Repetitive Collection**: Basic loop pattern for collecting items spaced out.\n- **Spacing**: Uses `randomPattern` to generate variable spacing between items.\n\n## Solution & Parameters\n\n```js\n// Parameters\nvar _MIN_REPEATS_ = 2;\nvar _MAX_REPEATS_ = 4;\nvar REPEATS = random(_MIN_REPEATS_, _MAX_REPEATS_);\n\n// Full Parameter Set (Standardized)\nvar _INTERACTION_ = 'crystal'; // OPTIONS: crystal, switch, key, mixed, null\nvar _TURN_STYLE_ = 'straight'; // OPTIONS: straight, turnLeft, turnRight, uTurn, zTurn, randomLeftRight, random, null\nvar _TURN_POINT_ = 'null'; // OPTIONS: null, start, end, mid, random, null\nvar _HAS_JUMP_ = 'noJump'; // OPTIONS: random, withJump, noJump, null\nvar _NO_ITEM_AT_ = 'null'; // OPTIONS: null, noItemStart, noItemEnd, noItemBoth, null\nvar _SEED_ = random(1, 99999);\n\n// Solution\nfor (let i = 0; i < REPEATS; i++) {\n  // Generate a segment that includes collection\n  // nestedLoopCompatible=true is important here\n  randomPattern(random(3, 5), _INTERACTION_, true, 0, 'straight', _TURN_STYLE_, _TURN_POINT_, _HAS_JUMP_, _NO_ITEM_AT_, _SEED_ + i);\n  \n  // Optional small turn to make it a loop/path not just a line\n  if (random(0, 100) > 50) turnRight(); else turnLeft();\n}\n```\n",
    "hints": {
      "title": "Micro Loop Collect",
      "description": "A loop-based pattern that collects crystals, turns, and repeats.",
      "goalDetails": []
    }
  },
  {
    "metadata": {
      "id": "micro-zigzag-collect",
      "name": "Micro Zigzag Collect",
      "category": "loop",
      "concepts": [
        "zigzag",
        "turns",
        "alternating"
      ],
      "difficulty": 4,
      "tags": [
        "loop",
        "zigzag",
        "crystal"
      ],
      "author": "system",
      "version": 4,
      "description": "Collect crystals in a zigzag pattern with alternating turns"
    },
    "parameters": [
      {
        "name": "_MIN_PAIRS_",
        "displayName": "Min Pairs",
        "type": "number",
        "defaultValue": 2
      },
      {
        "name": "_MAX_PAIRS_",
        "displayName": "Max Pairs",
        "type": "number",
        "defaultValue": 4
      },
      {
        "name": "_INTERACTION_",
        "displayName": "Interaction",
        "type": "string",
        "defaultValue": "crystal"
      },
      {
        "name": "_TURN_STYLE_",
        "displayName": "Turn Style",
        "type": "string",
        "defaultValue": "straight"
      },
      {
        "name": "_TURN_POINT_",
        "displayName": "Turn Point",
        "type": "string",
        "defaultValue": "null"
      },
      {
        "name": "_HAS_JUMP_",
        "displayName": "Has Jump",
        "type": "string",
        "defaultValue": "noJump"
      },
      {
        "name": "_NO_ITEM_AT_",
        "displayName": "No Item At",
        "type": "string",
        "defaultValue": "null"
      },
      {
        "name": "_SEED_",
        "displayName": "Seed",
        "type": "int",
        "defaultValue": 1,
        "min": 1,
        "max": 99999
      }
    ],
    "solutionCode": "// Parameters\nvar _MIN_PAIRS_ = 2;\nvar _MAX_PAIRS_ = 4;\nvar PAIRS = random(_MIN_PAIRS_, _MAX_PAIRS_);\n\n// Full Parameter Set (Standardized)\nvar _INTERACTION_ = 'crystal'; // OPTIONS: crystal, switch, key, mixed, null\nvar _TURN_STYLE_ = 'straight'; // OPTIONS: straight, turnLeft, turnRight, uTurn, zTurn, randomLeftRight, random, null\nvar _TURN_POINT_ = 'null'; // OPTIONS: null, start, end, mid, random, null\nvar _HAS_JUMP_ = 'noJump'; // OPTIONS: random, withJump, noJump, null\nvar _NO_ITEM_AT_ = 'null'; // OPTIONS: null, noItemStart, noItemEnd, noItemBoth, null\nvar _SEED_ = random(1, 99999);\n\n// Solution\nfor (let i = 0; i < PAIRS; i++) {\n  // Leg 1\n  randomPattern(3, _INTERACTION_, true, 0, 'straight', _TURN_STYLE_, _TURN_POINT_, _HAS_JUMP_, _NO_ITEM_AT_, _SEED_ + (i*2));\n  turnRight();\n  \n  // Leg 2\n  randomPattern(3, _INTERACTION_, true, 0, 'straight', _TURN_STYLE_, _TURN_POINT_, _HAS_JUMP_, _NO_ITEM_AT_, _SEED_ + (i*2) + 1);\n  turnLeft();\n}",
    "descriptionMarkdown": "# Micro Zigzag Collect\n\nZigzag path with alternating left/right turns.\n\n## Features\n- **ZigZag Logic**: Alternates turns for a classic zigzag path.\n- **Micro-Patterns**: Each leg of the zigzag is a generated pattern.\n\n## Solution & Parameters",
    "rawContent": "---\nid: micro-zigzag-collect\nname: \"Micro Zigzag Collect\"\ncategory: loop\nconcepts: [\"zigzag\", \"turns\", \"alternating\"]\ndifficulty: 4\ntags: [\"loop\", \"zigzag\", \"crystal\"]\nauthor: system\nversion: 4\ndescription: \"Collect crystals in a zigzag pattern with alternating turns\"\n---\n\n# Micro Zigzag Collect\n\nZigzag path with alternating left/right turns.\n\n## Features\n- **ZigZag Logic**: Alternates turns for a classic zigzag path.\n- **Micro-Patterns**: Each leg of the zigzag is a generated pattern.\n\n## Solution & Parameters\n\n```js\n// Parameters\nvar _MIN_PAIRS_ = 2;\nvar _MAX_PAIRS_ = 4;\nvar PAIRS = random(_MIN_PAIRS_, _MAX_PAIRS_);\n\n// Full Parameter Set (Standardized)\nvar _INTERACTION_ = 'crystal'; // OPTIONS: crystal, switch, key, mixed, null\nvar _TURN_STYLE_ = 'straight'; // OPTIONS: straight, turnLeft, turnRight, uTurn, zTurn, randomLeftRight, random, null\nvar _TURN_POINT_ = 'null'; // OPTIONS: null, start, end, mid, random, null\nvar _HAS_JUMP_ = 'noJump'; // OPTIONS: random, withJump, noJump, null\nvar _NO_ITEM_AT_ = 'null'; // OPTIONS: null, noItemStart, noItemEnd, noItemBoth, null\nvar _SEED_ = random(1, 99999);\n\n// Solution\nfor (let i = 0; i < PAIRS; i++) {\n  // Leg 1\n  randomPattern(3, _INTERACTION_, true, 0, 'straight', _TURN_STYLE_, _TURN_POINT_, _HAS_JUMP_, _NO_ITEM_AT_, _SEED_ + (i*2));\n  turnRight();\n  \n  // Leg 2\n  randomPattern(3, _INTERACTION_, true, 0, 'straight', _TURN_STYLE_, _TURN_POINT_, _HAS_JUMP_, _NO_ITEM_AT_, _SEED_ + (i*2) + 1);\n  turnLeft();\n}\n```\n",
    "hints": {
      "title": "Micro Zigzag Collect",
      "description": "Zigzag path with alternating left/right turns.",
      "goalDetails": []
    }
  },
  {
    "metadata": {
      "id": "nested-loops",
      "name": "Nested FOR Loops",
      "category": "loop",
      "concepts": [
        "nested_loop"
      ],
      "difficulty": 4,
      "tags": [
        "for",
        "loop",
        "nested",
        "zigzag",
        "grid"
      ],
      "author": "system",
      "version": 1,
      "description": "Create a zigzag grid pattern using nested loops"
    },
    "parameters": [
      {
        "name": "_MIN_ROWS_",
        "displayName": "Min Rows",
        "type": "number",
        "defaultValue": 2
      },
      {
        "name": "_MAX_ROWS_",
        "displayName": "Max Rows",
        "type": "number",
        "defaultValue": 3
      },
      {
        "name": "_INTERACTION_",
        "displayName": "Interaction",
        "type": "string",
        "defaultValue": "crystal"
      },
      {
        "name": "_TURN_STYLE_",
        "displayName": "Turn Style",
        "type": "string",
        "defaultValue": "straight"
      },
      {
        "name": "_TURN_POINT_",
        "displayName": "Turn Point",
        "type": "string",
        "defaultValue": "null"
      },
      {
        "name": "_HAS_JUMP_",
        "displayName": "Has Jump",
        "type": "string",
        "defaultValue": "noJump"
      },
      {
        "name": "_NO_ITEM_AT_",
        "displayName": "No Item At",
        "type": "string",
        "defaultValue": "null"
      },
      {
        "name": "_SEED_",
        "displayName": "Seed",
        "type": "int",
        "defaultValue": 1,
        "min": 1,
        "max": 99999
      }
    ],
    "solutionCode": "// Parameters\nvar _MIN_ROWS_ = 2;\nvar _MAX_ROWS_ = 3;\nvar ROWS = random(_MIN_ROWS_, _MAX_ROWS_);\nvar COL_LEN = 3; \n\n// Full Parameter Set (Standardized)\nvar _INTERACTION_ = 'crystal'; // OPTIONS: crystal, switch, key, mixed, null\nvar _TURN_STYLE_ = 'straight'; // OPTIONS: straight, turnLeft, turnRight, uTurn, zTurn, randomLeftRight, random, null\nvar _TURN_POINT_ = 'null'; // OPTIONS: null, start, end, mid, random, null\nvar _HAS_JUMP_ = 'noJump'; // OPTIONS: random, withJump, noJump, null\nvar _NO_ITEM_AT_ = 'null'; // OPTIONS: null, noItemStart, noItemEnd, noItemBoth, null\nvar _SEED_ = random(1, 99999);\n\n// Solution\nfor (let r = 0; r < ROWS; r++) {\n  // Row Pattern\n  randomPattern(COL_LEN, _INTERACTION_, true, 0, 'straight', _TURN_STYLE_, _TURN_POINT_, _HAS_JUMP_, _NO_ITEM_AT_, _SEED_ + r);\n  \n  // Turn for next row (Alternating would require more logic, simplicity here)\n  if (r < ROWS - 1) {\n     turnRight();\n     moveForward();\n     turnRight();\n  }\n}",
    "descriptionMarkdown": "# Nested FOR Loops\n\nMaster nested loops by creating a grid pattern with zigzag movement.\n\n## Learning Goals\n- Understand nested loop structure\n- Create 2D patterns with loops\n- Handle zigzag traversal\n\n## Features\n- **Grid Traversal**: Covers a 2D area using nested loops.\n- **ZigZag Rows**: Alternates direction for efficient coverage.\n\n## Solution & Parameters",
    "rawContent": "---\nid: nested-loops\nname: \"Nested FOR Loops\"\ncategory: loop\nconcepts: [\"nested_loop\"]\ndifficulty: 4\ntags: [\"for\", \"loop\", \"nested\", \"zigzag\", \"grid\"]\nauthor: system\nversion: 1\ndescription: \"Create a zigzag grid pattern using nested loops\"\n---\n\n# Nested FOR Loops\n\nMaster nested loops by creating a grid pattern with zigzag movement.\n\n## Learning Goals\n- Understand nested loop structure\n- Create 2D patterns with loops\n- Handle zigzag traversal\n\n## Features\n- **Grid Traversal**: Covers a 2D area using nested loops.\n- **ZigZag Rows**: Alternates direction for efficient coverage.\n\n## Solution & Parameters\n\n```js\n// Parameters\nvar _MIN_ROWS_ = 2;\nvar _MAX_ROWS_ = 3;\nvar ROWS = random(_MIN_ROWS_, _MAX_ROWS_);\nvar COL_LEN = 3; \n\n// Full Parameter Set (Standardized)\nvar _INTERACTION_ = 'crystal'; // OPTIONS: crystal, switch, key, mixed, null\nvar _TURN_STYLE_ = 'straight'; // OPTIONS: straight, turnLeft, turnRight, uTurn, zTurn, randomLeftRight, random, null\nvar _TURN_POINT_ = 'null'; // OPTIONS: null, start, end, mid, random, null\nvar _HAS_JUMP_ = 'noJump'; // OPTIONS: random, withJump, noJump, null\nvar _NO_ITEM_AT_ = 'null'; // OPTIONS: null, noItemStart, noItemEnd, noItemBoth, null\nvar _SEED_ = random(1, 99999);\n\n// Solution\nfor (let r = 0; r < ROWS; r++) {\n  // Row Pattern\n  randomPattern(COL_LEN, _INTERACTION_, true, 0, 'straight', _TURN_STYLE_, _TURN_POINT_, _HAS_JUMP_, _NO_ITEM_AT_, _SEED_ + r);\n  \n  // Turn for next row (Alternating would require more logic, simplicity here)\n  if (r < ROWS - 1) {\n     turnRight();\n     moveForward();\n     turnRight();\n  }\n}\n```\n",
    "hints": {
      "title": "Nested FOR Loops",
      "description": "Master nested loops by creating a grid pattern with zigzag movement.",
      "learningGoals": "- Understand nested loop structure",
      "goalDetails": [
        "Create 2D patterns with loops",
        "Handle zigzag traversal"
      ]
    }
  },
  {
    "metadata": {
      "id": "simple-for-loop",
      "name": "Simple FOR Loop",
      "category": "loop",
      "concepts": [
        "repeat_n"
      ],
      "difficulty": 2,
      "tags": [
        "for",
        "loop",
        "repeat",
        "crystal"
      ],
      "author": "system",
      "version": 1,
      "description": "Collect N crystals with random count using a FOR loop"
    },
    "parameters": [
      {
        "name": "_MIN_STEPS_",
        "displayName": "Min Steps",
        "type": "number",
        "defaultValue": 3
      },
      {
        "name": "_MAX_STEPS_",
        "displayName": "Max Steps",
        "type": "number",
        "defaultValue": 6
      },
      {
        "name": "_INTERACTION_",
        "displayName": "Interaction",
        "type": "string",
        "defaultValue": "crystal"
      },
      {
        "name": "_TURN_STYLE_",
        "displayName": "Turn Style",
        "type": "string",
        "defaultValue": "straight"
      },
      {
        "name": "_TURN_POINT_",
        "displayName": "Turn Point",
        "type": "string",
        "defaultValue": "null"
      },
      {
        "name": "_HAS_JUMP_",
        "displayName": "Has Jump",
        "type": "string",
        "defaultValue": "noJump"
      },
      {
        "name": "_NO_ITEM_AT_",
        "displayName": "No Item At",
        "type": "string",
        "defaultValue": "null"
      },
      {
        "name": "_SEED_",
        "displayName": "Seed",
        "type": "int",
        "defaultValue": 1,
        "min": 1,
        "max": 99999
      }
    ],
    "solutionCode": "// Parameters\nvar _MIN_STEPS_ = 3;\nvar _MAX_STEPS_ = 6;\nvar LOOP_COUNT = random(_MIN_STEPS_, _MAX_STEPS_);\n\n// Full Parameter Set (Standardized)\nvar _INTERACTION_ = 'crystal'; // OPTIONS: crystal, switch, key, mixed, null\nvar _TURN_STYLE_ = 'straight'; // OPTIONS: straight, turnLeft, turnRight, uTurn, zTurn, randomLeftRight, random, null\nvar _TURN_POINT_ = 'null'; // OPTIONS: null, start, end, mid, random, null\nvar _HAS_JUMP_ = 'noJump'; // OPTIONS: random, withJump, noJump, null\nvar _NO_ITEM_AT_ = 'null'; // OPTIONS: null, noItemStart, noItemEnd, noItemBoth, null\nvar _SEED_ = random(1, 99999);\n\n// Solution\nfor (let i = 0; i < LOOP_COUNT; i++) {\n  // Generate a short, repeatable pattern segment\n  // compatible with being inside a loop (start/end alignment)\n  randomPattern(3, _INTERACTION_, true, 0, 'straight', _TURN_STYLE_, _TURN_POINT_, _HAS_JUMP_, _NO_ITEM_AT_, _SEED_ + i);\n  // No explicit turn here, just a straight line of patterns effectively\n}",
    "descriptionMarkdown": "# Simple FOR Loop\n\nLearn to use a FOR loop to repeat actions a specific number of times.\n\n## Features\n- **Loops**: Introduces repetition using `for` loops.\n- **Pattern**: Uses a repeating segment (e.g., move-collect) generated by `randomPattern`.\n- **Randomization**: The number of repetitions and the segment shape vary.\n\n## Solution & Parameters",
    "rawContent": "---\nid: simple-for-loop\nname: \"Simple FOR Loop\"\ncategory: loop\nconcepts: [\"repeat_n\"]\ndifficulty: 2\ntags: [\"for\", \"loop\", \"repeat\", \"crystal\"]\nauthor: system\nversion: 1\ndescription: \"Collect N crystals with random count using a FOR loop\"\n---\n\n# Simple FOR Loop\n\nLearn to use a FOR loop to repeat actions a specific number of times.\n\n## Features\n- **Loops**: Introduces repetition using `for` loops.\n- **Pattern**: Uses a repeating segment (e.g., move-collect) generated by `randomPattern`.\n- **Randomization**: The number of repetitions and the segment shape vary.\n\n## Solution & Parameters\n\n```js\n// Parameters\nvar _MIN_STEPS_ = 3;\nvar _MAX_STEPS_ = 6;\nvar LOOP_COUNT = random(_MIN_STEPS_, _MAX_STEPS_);\n\n// Full Parameter Set (Standardized)\nvar _INTERACTION_ = 'crystal'; // OPTIONS: crystal, switch, key, mixed, null\nvar _TURN_STYLE_ = 'straight'; // OPTIONS: straight, turnLeft, turnRight, uTurn, zTurn, randomLeftRight, random, null\nvar _TURN_POINT_ = 'null'; // OPTIONS: null, start, end, mid, random, null\nvar _HAS_JUMP_ = 'noJump'; // OPTIONS: random, withJump, noJump, null\nvar _NO_ITEM_AT_ = 'null'; // OPTIONS: null, noItemStart, noItemEnd, noItemBoth, null\nvar _SEED_ = random(1, 99999);\n\n// Solution\nfor (let i = 0; i < LOOP_COUNT; i++) {\n  // Generate a short, repeatable pattern segment\n  // compatible with being inside a loop (start/end alignment)\n  randomPattern(3, _INTERACTION_, true, 0, 'straight', _TURN_STYLE_, _TURN_POINT_, _HAS_JUMP_, _NO_ITEM_AT_, _SEED_ + i);\n  // No explicit turn here, just a straight line of patterns effectively\n}\n```\n",
    "hints": {
      "title": "Simple FOR Loop",
      "description": "Learn to use a FOR loop to repeat actions a specific number of times.",
      "goalDetails": []
    }
  },
  {
    "metadata": {
      "id": "square-pattern",
      "name": "Square Pattern",
      "category": "loop",
      "concepts": [
        "repeat_n",
        "nested_loop"
      ],
      "difficulty": 3,
      "tags": [
        "for",
        "loop",
        "nested",
        "square",
        "pattern"
      ],
      "author": "system",
      "version": 2,
      "description": "Walk around a square using nested loops"
    },
    "parameters": [
      {
        "name": "_MIN_SIDE_",
        "displayName": "Min Side",
        "type": "number",
        "defaultValue": 3
      },
      {
        "name": "_MAX_SIDE_",
        "displayName": "Max Side",
        "type": "number",
        "defaultValue": 5
      },
      {
        "name": "_INTERACTION_",
        "displayName": "Interaction",
        "type": "string",
        "defaultValue": "crystal"
      },
      {
        "name": "_TURN_STYLE_",
        "displayName": "Turn Style",
        "type": "string",
        "defaultValue": "straight"
      },
      {
        "name": "_TURN_POINT_",
        "displayName": "Turn Point",
        "type": "string",
        "defaultValue": "null"
      },
      {
        "name": "_HAS_JUMP_",
        "displayName": "Has Jump",
        "type": "string",
        "defaultValue": "noJump"
      },
      {
        "name": "_NO_ITEM_AT_",
        "displayName": "No Item At",
        "type": "string",
        "defaultValue": "null"
      },
      {
        "name": "_SEED_",
        "displayName": "Seed",
        "type": "int",
        "defaultValue": 1,
        "min": 1,
        "max": 99999
      }
    ],
    "solutionCode": "// Parameters\nvar _MIN_SIDE_ = 3;\nvar _MAX_SIDE_ = 5;\nvar SIDE_LEN = random(_MIN_SIDE_, _MAX_SIDE_);\n\n// Full Parameter Set (Standardized)\nvar _INTERACTION_ = 'crystal'; // OPTIONS: crystal, switch, key, mixed, null\nvar _TURN_STYLE_ = 'straight'; // OPTIONS: straight, turnLeft, turnRight, uTurn, zTurn, randomLeftRight, random, null\nvar _TURN_POINT_ = 'null'; // OPTIONS: null, start, end, mid, random, null\nvar _HAS_JUMP_ = 'noJump'; // OPTIONS: random, withJump, noJump, null\nvar _NO_ITEM_AT_ = 'null'; // OPTIONS: null, noItemStart, noItemEnd, noItemBoth, null\nvar _SEED_ = random(1, 99999);\n\n// Solution\n// 4 sides of a square\nfor (let i = 0; i < 4; i++) {\n  // Generate one side of the square\n  // nestedLoopCompatible=true ensures start/end alignment\n  randomPattern(SIDE_LEN, _INTERACTION_, true, 0, 'straight', _TURN_STYLE_, _TURN_POINT_, _HAS_JUMP_, _NO_ITEM_AT_, _SEED_ + i);\n  \n  // Turn at the corner\n  turnRight();\n}",
    "descriptionMarkdown": "# Square Pattern\n\nUse nested loops to walk around a square, collecting items along the way.\n\n## Learning Goals\n- Understand nested loops\n- Use outer loop for sides\n- Use inner loop for steps\n\n## Features\n- **Nested Loops**: Simulates a 2D walk using an outer loop for sides and inner loop for steps.\n- **Geometric Pattern**: Generates a square or rectangular path.\n- **Turns**: Demonstrates repetitive turning logic.\n\n## Solution & Parameters",
    "rawContent": "---\nid: square-pattern\nname: \"Square Pattern\"\ncategory: loop\nconcepts: [\"repeat_n\", \"nested_loop\"]\ndifficulty: 3\ntags: [\"for\", \"loop\", \"nested\", \"square\", \"pattern\"]\nauthor: system\nversion: 2\ndescription: \"Walk around a square using nested loops\"\n---\n\n# Square Pattern\n\nUse nested loops to walk around a square, collecting items along the way.\n\n## Learning Goals\n- Understand nested loops\n- Use outer loop for sides\n- Use inner loop for steps\n\n## Features\n- **Nested Loops**: Simulates a 2D walk using an outer loop for sides and inner loop for steps.\n- **Geometric Pattern**: Generates a square or rectangular path.\n- **Turns**: Demonstrates repetitive turning logic.\n\n## Solution & Parameters\n\n```js\n// Parameters\nvar _MIN_SIDE_ = 3;\nvar _MAX_SIDE_ = 5;\nvar SIDE_LEN = random(_MIN_SIDE_, _MAX_SIDE_);\n\n// Full Parameter Set (Standardized)\nvar _INTERACTION_ = 'crystal'; // OPTIONS: crystal, switch, key, mixed, null\nvar _TURN_STYLE_ = 'straight'; // OPTIONS: straight, turnLeft, turnRight, uTurn, zTurn, randomLeftRight, random, null\nvar _TURN_POINT_ = 'null'; // OPTIONS: null, start, end, mid, random, null\nvar _HAS_JUMP_ = 'noJump'; // OPTIONS: random, withJump, noJump, null\nvar _NO_ITEM_AT_ = 'null'; // OPTIONS: null, noItemStart, noItemEnd, noItemBoth, null\nvar _SEED_ = random(1, 99999);\n\n// Solution\n// 4 sides of a square\nfor (let i = 0; i < 4; i++) {\n  // Generate one side of the square\n  // nestedLoopCompatible=true ensures start/end alignment\n  randomPattern(SIDE_LEN, _INTERACTION_, true, 0, 'straight', _TURN_STYLE_, _TURN_POINT_, _HAS_JUMP_, _NO_ITEM_AT_, _SEED_ + i);\n  \n  // Turn at the corner\n  turnRight();\n}\n```\n",
    "hints": {
      "title": "Square Pattern",
      "description": "Use nested loops to walk around a square, collecting items along the way.",
      "learningGoals": "- Understand nested loops",
      "goalDetails": [
        "Use outer loop for sides",
        "Use inner loop for steps"
      ]
    }
  },
  {
    "metadata": {
      "id": "staircase-climb",
      "name": "Staircase Climb",
      "category": "loop",
      "concepts": [
        "repeat_n",
        "pattern_recognition"
      ],
      "difficulty": 3,
      "tags": [
        "repeat",
        "pattern",
        "staircase"
      ],
      "author": "system",
      "version": 2,
      "description": "Climb a staircase and collect crystals at each step"
    },
    "parameters": [
      {
        "name": "_MIN_STEPS_",
        "displayName": "Min Steps",
        "type": "number",
        "defaultValue": 3
      },
      {
        "name": "_MAX_STEPS_",
        "displayName": "Max Steps",
        "type": "number",
        "defaultValue": 5
      },
      {
        "name": "_INTERACTION_",
        "displayName": "Interaction",
        "type": "string",
        "defaultValue": "crystal"
      },
      {
        "name": "_TURN_STYLE_",
        "displayName": "Turn Style",
        "type": "string",
        "defaultValue": "straight"
      },
      {
        "name": "_TURN_POINT_",
        "displayName": "Turn Point",
        "type": "string",
        "defaultValue": "null"
      },
      {
        "name": "_HAS_JUMP_",
        "displayName": "Has Jump",
        "type": "string",
        "defaultValue": "withJump"
      },
      {
        "name": "_NO_ITEM_AT_",
        "displayName": "No Item At",
        "type": "string",
        "defaultValue": "null"
      },
      {
        "name": "_SEED_",
        "displayName": "Seed",
        "type": "int",
        "defaultValue": 1,
        "min": 1,
        "max": 99999
      }
    ],
    "solutionCode": "// Parameters\nvar _MIN_STEPS_ = 3;\nvar _MAX_STEPS_ = 5;\nvar STEPS = random(_MIN_STEPS_, _MAX_STEPS_);\n\n// Full Parameter Set (Standardized)\nvar _INTERACTION_ = 'crystal'; // OPTIONS: crystal, switch, key, mixed, null\nvar _TURN_STYLE_ = 'straight'; // OPTIONS: straight, turnLeft, turnRight, uTurn, zTurn, randomLeftRight, random, null\nvar _TURN_POINT_ = 'null'; // OPTIONS: null, start, end, mid, random, null\nvar _HAS_JUMP_ = 'withJump'; // OPTIONS: random, withJump, noJump, null\nvar _NO_ITEM_AT_ = 'null'; // OPTIONS: null, noItemStart, noItemEnd, noItemBoth, null\nvar _SEED_ = random(1, 99999);\n\n// Solution\nfor (let i = 0; i < STEPS; i++) {\n  // Generate a 1-step pattern with a jump\n  randomPattern(1, _INTERACTION_, true, 0, 'straight', _TURN_STYLE_, _TURN_POINT_, _HAS_JUMP_, _NO_ITEM_AT_, _SEED_ + i);\n}",
    "descriptionMarkdown": "# Staircase Climb\n\nClimb a staircase by recognizing the repeating pattern of forward + jump.\n\n## Learning Goals\n- Recognize repeating patterns\n- Use `repeat` block effectively\n- Combine movement with jumping\n\n## Features\n- **Staircase Logic**: Simulates climbing stairs using repeated jump/move segments.\n- **Elevation**: Demonstrates 3D movement.\n\n## Solution & Parameters",
    "rawContent": "---\nid: staircase-climb\nname: \"Staircase Climb\"\ncategory: loop\nconcepts: [\"repeat_n\", \"pattern_recognition\"]\ndifficulty: 3\ntags: [\"repeat\", \"pattern\", \"staircase\"]\nauthor: system\nversion: 2\ndescription: \"Climb a staircase and collect crystals at each step\"\n---\n\n# Staircase Climb\n\nClimb a staircase by recognizing the repeating pattern of forward + jump.\n\n## Learning Goals\n- Recognize repeating patterns\n- Use `repeat` block effectively\n- Combine movement with jumping\n\n## Features\n- **Staircase Logic**: Simulates climbing stairs using repeated jump/move segments.\n- **Elevation**: Demonstrates 3D movement.\n\n## Solution & Parameters\n\n```js\n// Parameters\nvar _MIN_STEPS_ = 3;\nvar _MAX_STEPS_ = 5;\nvar STEPS = random(_MIN_STEPS_, _MAX_STEPS_);\n\n// Full Parameter Set (Standardized)\nvar _INTERACTION_ = 'crystal'; // OPTIONS: crystal, switch, key, mixed, null\nvar _TURN_STYLE_ = 'straight'; // OPTIONS: straight, turnLeft, turnRight, uTurn, zTurn, randomLeftRight, random, null\nvar _TURN_POINT_ = 'null'; // OPTIONS: null, start, end, mid, random, null\nvar _HAS_JUMP_ = 'withJump'; // OPTIONS: random, withJump, noJump, null\nvar _NO_ITEM_AT_ = 'null'; // OPTIONS: null, noItemStart, noItemEnd, noItemBoth, null\nvar _SEED_ = random(1, 99999);\n\n// Solution\nfor (let i = 0; i < STEPS; i++) {\n  // Generate a 1-step pattern with a jump\n  randomPattern(1, _INTERACTION_, true, 0, 'straight', _TURN_STYLE_, _TURN_POINT_, _HAS_JUMP_, _NO_ITEM_AT_, _SEED_ + i);\n}\n```\n",
    "hints": {
      "title": "Staircase Climb",
      "description": "Climb a staircase by recognizing the repeating pattern of forward + jump.",
      "learningGoals": "- Recognize repeating patterns",
      "goalDetails": [
        "Use `repeat` block effectively",
        "Combine movement with jumping"
      ]
    }
  },
  {
    "metadata": {
      "id": "staircase-jump",
      "name": "Staircase with Jump",
      "category": "loop",
      "concepts": [
        "repeat_n"
      ],
      "difficulty": 4,
      "tags": [
        "loop",
        "jump",
        "staircase",
        "elevated"
      ],
      "author": "system",
      "version": 2,
      "description": "Create elevated terrain using jump command"
    },
    "parameters": [
      {
        "name": "_MIN_STEPS_",
        "displayName": "Min Steps",
        "type": "number",
        "defaultValue": 3
      },
      {
        "name": "_MAX_STEPS_",
        "displayName": "Max Steps",
        "type": "number",
        "defaultValue": 6
      },
      {
        "name": "_INTERACTION_",
        "displayName": "Interaction",
        "type": "string",
        "defaultValue": "crystal"
      },
      {
        "name": "_TURN_STYLE_",
        "displayName": "Turn Style",
        "type": "string",
        "defaultValue": "straight"
      },
      {
        "name": "_TURN_POINT_",
        "displayName": "Turn Point",
        "type": "string",
        "defaultValue": "null"
      },
      {
        "name": "_HAS_JUMP_",
        "displayName": "Has Jump",
        "type": "string",
        "defaultValue": "withJump"
      },
      {
        "name": "_NO_ITEM_AT_",
        "displayName": "No Item At",
        "type": "string",
        "defaultValue": "null"
      },
      {
        "name": "_SEED_",
        "displayName": "Seed",
        "type": "int",
        "defaultValue": 1,
        "min": 1,
        "max": 99999
      }
    ],
    "solutionCode": "// Parameters\nvar _MIN_STEPS_ = 3;\nvar _MAX_STEPS_ = 6;\nvar STEPS = random(_MIN_STEPS_, _MAX_STEPS_);\n\n// Full Parameter Set (Standardized)\nvar _INTERACTION_ = 'crystal'; // OPTIONS: crystal, switch, key, mixed, null\nvar _TURN_STYLE_ = 'straight'; // OPTIONS: straight, turnLeft, turnRight, uTurn, zTurn, randomLeftRight, random, null\nvar _TURN_POINT_ = 'null'; // OPTIONS: null, start, end, mid, random, null\nvar _HAS_JUMP_ = 'withJump'; // OPTIONS: random, withJump, noJump, null\nvar _NO_ITEM_AT_ = 'null'; // OPTIONS: null, noItemStart, noItemEnd, noItemBoth, null\nvar _SEED_ = random(1, 99999);\n\n// Solution\njumpUp(); // Initial placement\n\nfor (let i = 0; i < STEPS; i++) {\n  // Pattern with jump enabled\n  randomPattern(1, _INTERACTION_, true, 0, 'straight', _TURN_STYLE_, _TURN_POINT_, _HAS_JUMP_, _NO_ITEM_AT_, _SEED_ + i);\n}",
    "descriptionMarkdown": "# Staircase with Jump\n\nUse the jump command to climb a staircase while collecting items.\n\n## Learning Goals\n- Use the jump() command\n- Combine movement with elevation\n- Repeat jump pattern\n\n## Features\n- **Jump Commands**: Focuses on vertical traversal.\n- **Repeated Pattern**: Uses a loop to create a consistent climbing challenge.\n\n## Solution & Parameters",
    "rawContent": "---\nid: staircase-jump\nname: \"Staircase with Jump\"\ncategory: loop\nconcepts: [\"repeat_n\"]\ndifficulty: 4\ntags: [\"loop\", \"jump\", \"staircase\", \"elevated\"]\nauthor: system\nversion: 2\ndescription: \"Create elevated terrain using jump command\"\n---\n\n# Staircase with Jump\n\nUse the jump command to climb a staircase while collecting items.\n\n## Learning Goals\n- Use the jump() command\n- Combine movement with elevation\n- Repeat jump pattern\n\n## Features\n- **Jump Commands**: Focuses on vertical traversal.\n- **Repeated Pattern**: Uses a loop to create a consistent climbing challenge.\n\n## Solution & Parameters\n\n```js\n// Parameters\nvar _MIN_STEPS_ = 3;\nvar _MAX_STEPS_ = 6;\nvar STEPS = random(_MIN_STEPS_, _MAX_STEPS_);\n\n// Full Parameter Set (Standardized)\nvar _INTERACTION_ = 'crystal'; // OPTIONS: crystal, switch, key, mixed, null\nvar _TURN_STYLE_ = 'straight'; // OPTIONS: straight, turnLeft, turnRight, uTurn, zTurn, randomLeftRight, random, null\nvar _TURN_POINT_ = 'null'; // OPTIONS: null, start, end, mid, random, null\nvar _HAS_JUMP_ = 'withJump'; // OPTIONS: random, withJump, noJump, null\nvar _NO_ITEM_AT_ = 'null'; // OPTIONS: null, noItemStart, noItemEnd, noItemBoth, null\nvar _SEED_ = random(1, 99999);\n\n// Solution\njumpUp(); // Initial placement\n\nfor (let i = 0; i < STEPS; i++) {\n  // Pattern with jump enabled\n  randomPattern(1, _INTERACTION_, true, 0, 'straight', _TURN_STYLE_, _TURN_POINT_, _HAS_JUMP_, _NO_ITEM_AT_, _SEED_ + i);\n}\n```\n",
    "hints": {
      "title": "Staircase with Jump",
      "description": "Use the jump command to climb a staircase while collecting items.",
      "learningGoals": "- Use the jump() command",
      "goalDetails": [
        "Combine movement with elevation",
        "Repeat jump pattern"
      ]
    }
  },
  {
    "metadata": {
      "id": "zigzag-path",
      "name": "Zigzag Path",
      "category": "loop",
      "concepts": [
        "repeat_n"
      ],
      "difficulty": 4,
      "tags": [
        "repeat",
        "turn",
        "zigzag"
      ],
      "author": "system",
      "version": 1,
      "description": "Navigate a zigzag path and collect crystals at turns"
    },
    "parameters": [
      {
        "name": "_MIN_ZIG_COUNT_",
        "displayName": "Min Zig Count",
        "type": "number",
        "defaultValue": 3
      },
      {
        "name": "_MAX_ZIG_COUNT_",
        "displayName": "Max Zig Count",
        "type": "number",
        "defaultValue": 5
      },
      {
        "name": "_INTERACTION_",
        "displayName": "Interaction",
        "type": "string",
        "defaultValue": "crystal"
      },
      {
        "name": "_TURN_STYLE_",
        "displayName": "Turn Style",
        "type": "string",
        "defaultValue": "straight"
      },
      {
        "name": "_TURN_POINT_",
        "displayName": "Turn Point",
        "type": "string",
        "defaultValue": "null"
      },
      {
        "name": "_HAS_JUMP_",
        "displayName": "Has Jump",
        "type": "string",
        "defaultValue": "noJump"
      },
      {
        "name": "_NO_ITEM_AT_",
        "displayName": "No Item At",
        "type": "string",
        "defaultValue": "null"
      },
      {
        "name": "_SEED_",
        "displayName": "Seed",
        "type": "int",
        "defaultValue": 1,
        "min": 1,
        "max": 99999
      }
    ],
    "solutionCode": "// Parameters\nvar _MIN_ZIG_COUNT_ = 3;\nvar _MAX_ZIG_COUNT_ = 5;\nvar ZIG_COUNT = random(_MIN_ZIG_COUNT_, _MAX_ZIG_COUNT_);\nvar SEG_LEN = 3;\n\n// Full Parameter Set (Standardized)\nvar _INTERACTION_ = 'crystal'; // OPTIONS: crystal, switch, key, mixed, null\nvar _TURN_STYLE_ = 'straight'; // OPTIONS: straight, turnLeft, turnRight, uTurn, zTurn, randomLeftRight, random, null\nvar _TURN_POINT_ = 'null'; // OPTIONS: null, start, end, mid, random, null\nvar _HAS_JUMP_ = 'noJump'; // OPTIONS: random, withJump, noJump, null\nvar _NO_ITEM_AT_ = 'null'; // OPTIONS: null, noItemStart, noItemEnd, noItemBoth, null\nvar _SEED_ = random(1, 99999);\n\n// Solution\nfor (let i = 0; i < ZIG_COUNT; i++) {\n  // Generate segment\n  randomPattern(SEG_LEN, _INTERACTION_, true, 0, 'straight', _TURN_STYLE_, _TURN_POINT_, _HAS_JUMP_, _NO_ITEM_AT_, _SEED_ + i);\n  \n  // Alternate turns: Even -> Right, Odd -> Left\n  if (i % 2 == 0) {\n    turnRight();\n  } else {\n    turnLeft();\n  }\n}",
    "descriptionMarkdown": "# Zigzag Path\n\nNavigate through a zigzag path by repeating the turn-forward pattern.\n\n## Learning Goals\n- Use repeat with multiple commands  \n- Understand turn directions\n- Recognize zigzag pattern\n\n## Features\n- **Complex Pattern**: Creates a zigzag path by combining segments and turns.\n- **Alternating Direction**: Demonstrates logic to switch turn direction (Left <-> Right).\n- **Loop**: Repeats the zigzag logic multiple times.\n\n## Solution & Parameters",
    "rawContent": "---\nid: zigzag-path\nname: \"Zigzag Path\"\ncategory: loop\nconcepts: [\"repeat_n\"]\ndifficulty: 4\ntags: [\"repeat\", \"turn\", \"zigzag\"]\nauthor: system\nversion: 1\ndescription: \"Navigate a zigzag path and collect crystals at turns\"\n---\n\n# Zigzag Path\n\nNavigate through a zigzag path by repeating the turn-forward pattern.\n\n## Learning Goals\n- Use repeat with multiple commands  \n- Understand turn directions\n- Recognize zigzag pattern\n\n## Features\n- **Complex Pattern**: Creates a zigzag path by combining segments and turns.\n- **Alternating Direction**: Demonstrates logic to switch turn direction (Left <-> Right).\n- **Loop**: Repeats the zigzag logic multiple times.\n\n## Solution & Parameters\n\n```js\n// Parameters\nvar _MIN_ZIG_COUNT_ = 3;\nvar _MAX_ZIG_COUNT_ = 5;\nvar ZIG_COUNT = random(_MIN_ZIG_COUNT_, _MAX_ZIG_COUNT_);\nvar SEG_LEN = 3;\n\n// Full Parameter Set (Standardized)\nvar _INTERACTION_ = 'crystal'; // OPTIONS: crystal, switch, key, mixed, null\nvar _TURN_STYLE_ = 'straight'; // OPTIONS: straight, turnLeft, turnRight, uTurn, zTurn, randomLeftRight, random, null\nvar _TURN_POINT_ = 'null'; // OPTIONS: null, start, end, mid, random, null\nvar _HAS_JUMP_ = 'noJump'; // OPTIONS: random, withJump, noJump, null\nvar _NO_ITEM_AT_ = 'null'; // OPTIONS: null, noItemStart, noItemEnd, noItemBoth, null\nvar _SEED_ = random(1, 99999);\n\n// Solution\nfor (let i = 0; i < ZIG_COUNT; i++) {\n  // Generate segment\n  randomPattern(SEG_LEN, _INTERACTION_, true, 0, 'straight', _TURN_STYLE_, _TURN_POINT_, _HAS_JUMP_, _NO_ITEM_AT_, _SEED_ + i);\n  \n  // Alternate turns: Even -> Right, Odd -> Left\n  if (i % 2 == 0) {\n    turnRight();\n  } else {\n    turnLeft();\n  }\n}\n```\n",
    "hints": {
      "title": "Zigzag Path",
      "description": "Navigate through a zigzag path by repeating the turn-forward pattern.",
      "learningGoals": "- Use repeat with multiple commands",
      "goalDetails": [
        "Understand turn directions",
        "Recognize zigzag pattern"
      ]
    }
  },
  {
    "metadata": {
      "id": "mem-palindrome",
      "name": "Palindrome Path",
      "category": "memory",
      "concepts": [
        "pattern_recognition",
        "string_logic"
      ],
      "difficulty": 4,
      "tags": [
        "pattern",
        "palindrome",
        "symmetry"
      ],
      "author": "system",
      "version": 2,
      "description": "Execute a symmetrical sequence of actions (e.g., Jump-Move-Jump)"
    },
    "parameters": [
      {
        "name": "_MIN_MID_LENGTH_",
        "displayName": "Min Mid Length",
        "type": "number",
        "defaultValue": 1
      },
      {
        "name": "_MAX_MID_LENGTH_",
        "displayName": "Max Mid Length",
        "type": "number",
        "defaultValue": 3
      },
      {
        "name": "_INTERACTION_",
        "displayName": "Interaction",
        "type": "string",
        "defaultValue": "crystal"
      },
      {
        "name": "_TURN_STYLE_",
        "displayName": "Turn Style",
        "type": "string",
        "defaultValue": "straight"
      },
      {
        "name": "_TURN_POINT_",
        "displayName": "Turn Point",
        "type": "string",
        "defaultValue": "null"
      },
      {
        "name": "_HAS_JUMP_",
        "displayName": "Has Jump",
        "type": "string",
        "defaultValue": "noJump"
      },
      {
        "name": "_NO_ITEM_AT_",
        "displayName": "No Item At",
        "type": "string",
        "defaultValue": "null"
      },
      {
        "name": "_SEED_",
        "displayName": "Seed",
        "type": "int",
        "defaultValue": 1,
        "min": 1,
        "max": 99999
      }
    ],
    "solutionCode": "// Parameters\nvar _MIN_MID_LENGTH_ = 1;\nvar _MAX_MID_LENGTH_ = 3;\nvar MID_LENGTH = random(_MIN_MID_LENGTH_, _MAX_MID_LENGTH_);\n\n// Full Parameter Set (Standardized)\nvar _INTERACTION_ = 'crystal'; // OPTIONS: crystal, switch, key, mixed, null\nvar _TURN_STYLE_ = 'straight'; // OPTIONS: straight, turnLeft, turnRight, uTurn, zTurn, randomLeftRight, random, null\nvar _TURN_POINT_ = 'null'; // OPTIONS: null, start, end, mid, random, null\nvar _HAS_JUMP_ = 'noJump'; // OPTIONS: random, withJump, noJump, null\nvar _NO_ITEM_AT_ = 'null'; // OPTIONS: null, noItemStart, noItemEnd, noItemBoth, null\nvar _SEED_ = random(1, 99999);\n\n// Solution\n// Start (A) - Manual or Pattern\njumpUp(); \nmoveForward();\n\n// Middle (B repeated) - Forward\nfor (let i = 0; i < MID_LENGTH; i++) {\n  // Pattern segment forward\n  randomPattern(1, _INTERACTION_, true, 0, 'straight', _TURN_STYLE_, _TURN_POINT_, _HAS_JUMP_, _NO_ITEM_AT_, _SEED_ + i);\n}\n\n// Pivot (C)\nturnRight();\nmoveForward();\nturnRight();\n\n// Middle Mirror (B repeated) - Backward/Return\n// We reuse the seed logic to \"mirror\" the path structure, but for the palindrome execution \n// usually the ACTIONS are the same (Move, Collect).\nfor (let i = 0; i < MID_LENGTH; i++) {\n   randomPattern(1, _INTERACTION_, true, 0, 'straight', _TURN_STYLE_, _TURN_POINT_, _HAS_JUMP_, _NO_ITEM_AT_, _SEED_ + i + 100); \n   // Using diff seed to ensure new items generated if needed, but structure is strictly Length of 1\n}\n\n// End Mirror (A)\nmoveForward();\njumpDown();",
    "descriptionMarkdown": "# Palindrome Path\n\nA path where the action sequence reads the same backwards and forwards.\n\n## Academic Concept: Palindrome / Symmetry\n- Sequence: $A, B, C, B, A$\n\n## Features\n- **Symmetry**: Actions are mirrored around a center point.\n- **Pattern Construction**: Builds a sequence A-B-C-B-A.\n\n## Solution & Parameters",
    "rawContent": "---\nid: mem-palindrome\nname: \"Palindrome Path\"\ncategory: memory\nconcepts: [\"pattern_recognition\", \"string_logic\"]\ndifficulty: 4\ntags: [\"pattern\", \"palindrome\", \"symmetry\"]\nauthor: system\nversion: 2\ndescription: \"Execute a symmetrical sequence of actions (e.g., Jump-Move-Jump)\"\n---\n\n# Palindrome Path\n\nA path where the action sequence reads the same backwards and forwards.\n\n## Academic Concept: Palindrome / Symmetry\n- Sequence: $A, B, C, B, A$\n\n## Features\n- **Symmetry**: Actions are mirrored around a center point.\n- **Pattern Construction**: Builds a sequence A-B-C-B-A.\n\n## Solution & Parameters\n\n```js\n// Parameters\nvar _MIN_MID_LENGTH_ = 1;\nvar _MAX_MID_LENGTH_ = 3;\nvar MID_LENGTH = random(_MIN_MID_LENGTH_, _MAX_MID_LENGTH_);\n\n// Full Parameter Set (Standardized)\nvar _INTERACTION_ = 'crystal'; // OPTIONS: crystal, switch, key, mixed, null\nvar _TURN_STYLE_ = 'straight'; // OPTIONS: straight, turnLeft, turnRight, uTurn, zTurn, randomLeftRight, random, null\nvar _TURN_POINT_ = 'null'; // OPTIONS: null, start, end, mid, random, null\nvar _HAS_JUMP_ = 'noJump'; // OPTIONS: random, withJump, noJump, null\nvar _NO_ITEM_AT_ = 'null'; // OPTIONS: null, noItemStart, noItemEnd, noItemBoth, null\nvar _SEED_ = random(1, 99999);\n\n// Solution\n// Start (A) - Manual or Pattern\njumpUp(); \nmoveForward();\n\n// Middle (B repeated) - Forward\nfor (let i = 0; i < MID_LENGTH; i++) {\n  // Pattern segment forward\n  randomPattern(1, _INTERACTION_, true, 0, 'straight', _TURN_STYLE_, _TURN_POINT_, _HAS_JUMP_, _NO_ITEM_AT_, _SEED_ + i);\n}\n\n// Pivot (C)\nturnRight();\nmoveForward();\nturnRight();\n\n// Middle Mirror (B repeated) - Backward/Return\n// We reuse the seed logic to \"mirror\" the path structure, but for the palindrome execution \n// usually the ACTIONS are the same (Move, Collect).\nfor (let i = 0; i < MID_LENGTH; i++) {\n   randomPattern(1, _INTERACTION_, true, 0, 'straight', _TURN_STYLE_, _TURN_POINT_, _HAS_JUMP_, _NO_ITEM_AT_, _SEED_ + i + 100); \n   // Using diff seed to ensure new items generated if needed, but structure is strictly Length of 1\n}\n\n// End Mirror (A)\nmoveForward();\njumpDown();\n```\n",
    "hints": {
      "title": "Palindrome Path",
      "description": "A path where the action sequence reads the same backwards and forwards.",
      "learningGoals": "Palindrome / Symmetry",
      "goalDetails": [
        "Sequence: $A, B, C, B, A$"
      ]
    }
  },
  {
    "metadata": {
      "id": "mem-return",
      "name": "Path Return",
      "category": "memory",
      "concepts": [
        "function",
        "stack",
        "backtracking"
      ],
      "difficulty": 4,
      "tags": [
        "memory",
        "pattern",
        "inverse"
      ],
      "author": "system",
      "version": 1,
      "description": "Walk a path, collect crystal at destination, return, then advance to finish"
    },
    "parameters": [
      {
        "name": "_MIN_DIST_",
        "displayName": "Min Dist",
        "type": "number",
        "defaultValue": 2
      },
      {
        "name": "_MAX_DIST_",
        "displayName": "Max Dist",
        "type": "number",
        "defaultValue": 4
      },
      {
        "name": "_INTERACTION_",
        "displayName": "Interaction",
        "type": "string",
        "defaultValue": "crystal"
      },
      {
        "name": "_TURN_STYLE_",
        "displayName": "Turn Style",
        "type": "string",
        "defaultValue": "straight"
      },
      {
        "name": "_TURN_POINT_",
        "displayName": "Turn Point",
        "type": "string",
        "defaultValue": "null"
      },
      {
        "name": "_HAS_JUMP_",
        "displayName": "Has Jump",
        "type": "string",
        "defaultValue": "noJump"
      },
      {
        "name": "_NO_ITEM_AT_",
        "displayName": "No Item At",
        "type": "string",
        "defaultValue": "null"
      },
      {
        "name": "_SEED_",
        "displayName": "Seed",
        "type": "int",
        "defaultValue": 1,
        "min": 1,
        "max": 99999
      }
    ],
    "solutionCode": "// Parameters\nvar _MIN_DIST_ = 2;\nvar _MAX_DIST_ = 4;\nvar D1 = random(_MIN_DIST_, _MAX_DIST_);\nvar D2 = random(_MIN_DIST_, _MAX_DIST_);\n\n// Full Parameter Set (Standardized)\nvar _INTERACTION_ = 'crystal'; // OPTIONS: crystal, switch, key, mixed, null\nvar _TURN_STYLE_ = 'straight'; // OPTIONS: straight, turnLeft, turnRight, uTurn, zTurn, randomLeftRight, random, null\nvar _TURN_POINT_ = 'null'; // OPTIONS: null, start, end, mid, random, null\nvar _HAS_JUMP_ = 'noJump'; // OPTIONS: random, withJump, noJump, null\nvar _NO_ITEM_AT_ = 'null'; // OPTIONS: null, noItemStart, noItemEnd, noItemBoth, null\nvar _SEED_ = random(1, 99999);\n\n// Helper function\nfunction turnAround() {\n  turnRight();\n  turnRight();\n}\n\n// Solution\n// Forward Phase\n// D1 Segment\nrandomPattern(D1, 'none', false, 0, 'straight', _TURN_STYLE_, _TURN_POINT_, _HAS_JUMP_, 'true', _SEED_); // No items on path\nturnRight();\n// D2 Segment\nrandomPattern(D2, 'none', false, 0, 'straight', _TURN_STYLE_, _TURN_POINT_, _HAS_JUMP_, 'true', _SEED_ + 1);\n\n// Collect at destination\ncollectItem();\n\n// Return Phase\nturnAround();\n// Return D2\nfor(let j=0; j<D2; j++) moveForward(); // Simple return\nturnLeft();\n// Return D1\nfor(let i=0; i<D1; i++) moveForward(); // Simple return\n\n// Advance to Finish (ensures Finish ≠ Start)\nturnLeft();\nrandomPattern(2, 'crystal', true, 0, 'straight', _TURN_STYLE_, _TURN_POINT_, _HAS_JUMP_, 'false', _SEED_ + 99);",
    "descriptionMarkdown": "# Path Return\n\nWalk a random path, collect crystal at destination, turn around, return to start, then move to finish.\n\n## Academic Concept: Inverse Operations\n- Operation: `Move` | Inverse: `Move` (after turning 180)\n- Operation: `TurnRight` | Inverse: `TurnLeft`\n- Sequence `[A, B, C]` -> Inverse Sequence `[Inv(C), Inv(B), Inv(A)]` (Stack LIFO)\n\n## Features\n- **Inverse Operations**: To return, one must reverse the path and turns.\n- **Stack Logic**: Last-in, First-out concept applied to movement.\n\n## Solution & Parameters",
    "rawContent": "---\nid: mem-return\nname: \"Path Return\"\ncategory: memory\nconcepts: [\"function\", \"stack\", \"backtracking\"]\ndifficulty: 4\ntags: [\"memory\", \"pattern\", \"inverse\"]\nauthor: system\nversion: 1\ndescription: \"Walk a path, collect crystal at destination, return, then advance to finish\"\n---\n\n# Path Return\n\nWalk a random path, collect crystal at destination, turn around, return to start, then move to finish.\n\n## Academic Concept: Inverse Operations\n- Operation: `Move` | Inverse: `Move` (after turning 180)\n- Operation: `TurnRight` | Inverse: `TurnLeft`\n- Sequence `[A, B, C]` -> Inverse Sequence `[Inv(C), Inv(B), Inv(A)]` (Stack LIFO)\n\n## Features\n- **Inverse Operations**: To return, one must reverse the path and turns.\n- **Stack Logic**: Last-in, First-out concept applied to movement.\n\n## Solution & Parameters\n\n```js\n// Parameters\nvar _MIN_DIST_ = 2;\nvar _MAX_DIST_ = 4;\nvar D1 = random(_MIN_DIST_, _MAX_DIST_);\nvar D2 = random(_MIN_DIST_, _MAX_DIST_);\n\n// Full Parameter Set (Standardized)\nvar _INTERACTION_ = 'crystal'; // OPTIONS: crystal, switch, key, mixed, null\nvar _TURN_STYLE_ = 'straight'; // OPTIONS: straight, turnLeft, turnRight, uTurn, zTurn, randomLeftRight, random, null\nvar _TURN_POINT_ = 'null'; // OPTIONS: null, start, end, mid, random, null\nvar _HAS_JUMP_ = 'noJump'; // OPTIONS: random, withJump, noJump, null\nvar _NO_ITEM_AT_ = 'null'; // OPTIONS: null, noItemStart, noItemEnd, noItemBoth, null\nvar _SEED_ = random(1, 99999);\n\n// Helper function\nfunction turnAround() {\n  turnRight();\n  turnRight();\n}\n\n// Solution\n// Forward Phase\n// D1 Segment\nrandomPattern(D1, 'none', false, 0, 'straight', _TURN_STYLE_, _TURN_POINT_, _HAS_JUMP_, 'true', _SEED_); // No items on path\nturnRight();\n// D2 Segment\nrandomPattern(D2, 'none', false, 0, 'straight', _TURN_STYLE_, _TURN_POINT_, _HAS_JUMP_, 'true', _SEED_ + 1);\n\n// Collect at destination\ncollectItem();\n\n// Return Phase\nturnAround();\n// Return D2\nfor(let j=0; j<D2; j++) moveForward(); // Simple return\nturnLeft();\n// Return D1\nfor(let i=0; i<D1; i++) moveForward(); // Simple return\n\n// Advance to Finish (ensures Finish ≠ Start)\nturnLeft();\nrandomPattern(2, 'crystal', true, 0, 'straight', _TURN_STYLE_, _TURN_POINT_, _HAS_JUMP_, 'false', _SEED_ + 99);\n```\n\n",
    "hints": {
      "title": "Path Return",
      "description": "Walk a random path, collect crystal at destination, turn around, return to start, then move to finish.",
      "learningGoals": "Inverse Operations",
      "goalDetails": [
        "Operation: `Move` | Inverse: `Move` (after turning 180)",
        "Operation: `TurnRight` | Inverse: `TurnLeft`",
        "Sequence `[A, B, C]` -> Inverse Sequence `[Inv(C), Inv(B), Inv(A)]` (Stack LIFO)"
      ]
    }
  },
  {
    "metadata": {
      "id": "mem-undo",
      "name": "Undo Operations",
      "category": "memory",
      "concepts": [
        "function",
        "state_machine"
      ],
      "difficulty": 5,
      "tags": [
        "memory",
        "undo",
        "switch"
      ],
      "author": "system",
      "version": 1,
      "description": "Collect crystals and activate switches, then undo the switches and advance to finish"
    },
    "parameters": [
      {
        "name": "_MIN_COUNT_",
        "displayName": "Min Count",
        "type": "number",
        "defaultValue": 2
      },
      {
        "name": "_MAX_COUNT_",
        "displayName": "Max Count",
        "type": "number",
        "defaultValue": 4
      },
      {
        "name": "_INTERACTION_",
        "displayName": "Interaction",
        "type": "string",
        "defaultValue": "crystal"
      },
      {
        "name": "_TURN_STYLE_",
        "displayName": "Turn Style",
        "type": "string",
        "defaultValue": "straight"
      },
      {
        "name": "_TURN_POINT_",
        "displayName": "Turn Point",
        "type": "string",
        "defaultValue": "null"
      },
      {
        "name": "_HAS_JUMP_",
        "displayName": "Has Jump",
        "type": "string",
        "defaultValue": "noJump"
      },
      {
        "name": "_NO_ITEM_AT_",
        "displayName": "No Item At",
        "type": "string",
        "defaultValue": "null"
      },
      {
        "name": "_SEED_",
        "displayName": "Seed",
        "type": "int",
        "defaultValue": 1,
        "min": 1,
        "max": 99999
      }
    ],
    "solutionCode": "// Parameters\nvar _MIN_COUNT_ = 2;\nvar _MAX_COUNT_ = 4;\nvar COUNT = random(_MIN_COUNT_, _MAX_COUNT_);\n\n// Full Parameter Set (Standardized)\nvar _INTERACTION_ = 'crystal'; // OPTIONS: crystal, switch, key, mixed, null\nvar _TURN_STYLE_ = 'straight'; // OPTIONS: straight, turnLeft, turnRight, uTurn, zTurn, randomLeftRight, random, null\nvar _TURN_POINT_ = 'null'; // OPTIONS: null, start, end, mid, random, null\nvar _HAS_JUMP_ = 'noJump'; // OPTIONS: random, withJump, noJump, null\nvar _NO_ITEM_AT_ = 'null'; // OPTIONS: null, noItemStart, noItemEnd, noItemBoth, null\nvar _SEED_ = random(1, 99999);\n\n// Helper function\nfunction turnAround() {\n  turnRight();\n  turnRight();\n}\n\n// Solution\n// 1. Activate and Collect\nfor (let i = 0; i < COUNT; i++) {\n  // Move and Interact\n  randomPattern(1, _INTERACTION_, true, 0, 'straight', _TURN_STYLE_, _TURN_POINT_, _HAS_JUMP_, _NO_ITEM_AT_, _SEED_ + i);\n}\n\n// 2. Turn Around\nturnAround();\n\n// 3. Deactivate (Undo)\nfor (let i = 0; i < COUNT; i++) {\n  // Simple retrace interact\n  toggleSwitch();\n  moveForward();\n}\n\n// 4. Advance to Finish (ensures Finish ≠ Start)\nturnRight();\nrandomPattern(2, 'crystal', true, 0, 'straight', _TURN_STYLE_, _TURN_POINT_, _HAS_JUMP_, 'random', _SEED_ + 99);",
    "descriptionMarkdown": "# Undo Operations\n\nA conceptual task: \"Leave everything as you found it\", then proceed to finish.\n\n## Academic Concept: State Reversion\n- Forward: `Toggle (Off->On)`\n- Backward: `Toggle (On->Off)`\n\n## Features\n- **State Reversion**: Toggling a switch twice returns it to original state.\n- **Backtracking**: Retracing steps while undoing actions.\n\n## Solution & Parameters",
    "rawContent": "---\nid: mem-undo\nname: \"Undo Operations\"\ncategory: memory\nconcepts: [\"function\", \"state_machine\"]\ndifficulty: 5\ntags: [\"memory\", \"undo\", \"switch\"]\nauthor: system\nversion: 1\ndescription: \"Collect crystals and activate switches, then undo the switches and advance to finish\"\n---\n\n# Undo Operations\n\nA conceptual task: \"Leave everything as you found it\", then proceed to finish.\n\n## Academic Concept: State Reversion\n- Forward: `Toggle (Off->On)`\n- Backward: `Toggle (On->Off)`\n\n## Features\n- **State Reversion**: Toggling a switch twice returns it to original state.\n- **Backtracking**: Retracing steps while undoing actions.\n\n## Solution & Parameters\n\n```js\n// Parameters\nvar _MIN_COUNT_ = 2;\nvar _MAX_COUNT_ = 4;\nvar COUNT = random(_MIN_COUNT_, _MAX_COUNT_);\n\n// Full Parameter Set (Standardized)\nvar _INTERACTION_ = 'crystal'; // OPTIONS: crystal, switch, key, mixed, null\nvar _TURN_STYLE_ = 'straight'; // OPTIONS: straight, turnLeft, turnRight, uTurn, zTurn, randomLeftRight, random, null\nvar _TURN_POINT_ = 'null'; // OPTIONS: null, start, end, mid, random, null\nvar _HAS_JUMP_ = 'noJump'; // OPTIONS: random, withJump, noJump, null\nvar _NO_ITEM_AT_ = 'null'; // OPTIONS: null, noItemStart, noItemEnd, noItemBoth, null\nvar _SEED_ = random(1, 99999);\n\n// Helper function\nfunction turnAround() {\n  turnRight();\n  turnRight();\n}\n\n// Solution\n// 1. Activate and Collect\nfor (let i = 0; i < COUNT; i++) {\n  // Move and Interact\n  randomPattern(1, _INTERACTION_, true, 0, 'straight', _TURN_STYLE_, _TURN_POINT_, _HAS_JUMP_, _NO_ITEM_AT_, _SEED_ + i);\n}\n\n// 2. Turn Around\nturnAround();\n\n// 3. Deactivate (Undo)\nfor (let i = 0; i < COUNT; i++) {\n  // Simple retrace interact\n  toggleSwitch();\n  moveForward();\n}\n\n// 4. Advance to Finish (ensures Finish ≠ Start)\nturnRight();\nrandomPattern(2, 'crystal', true, 0, 'straight', _TURN_STYLE_, _TURN_POINT_, _HAS_JUMP_, 'random', _SEED_ + 99);\n```\n\n",
    "hints": {
      "title": "Undo Operations",
      "description": "A conceptual task: \"Leave everything as you found it\", then proceed to finish.",
      "learningGoals": "State Reversion",
      "goalDetails": [
        "Forward: `Toggle (Off->On)`",
        "Backward: `Toggle (On->Off)`"
      ]
    }
  },
  {
    "metadata": {
      "id": "arithmetic-collect",
      "name": "Arithmetic Collect",
      "category": "progression",
      "concepts": [
        "loop",
        "variable",
        "arithmetic_progression",
        "nested_loop"
      ],
      "difficulty": 4,
      "tags": [
        "math",
        "progression",
        "collect"
      ],
      "author": "system",
      "version": 1,
      "description": "Collect increasing numbers of items (1, 2, 3...)"
    },
    "parameters": [
      {
        "name": "_MIN_START_",
        "displayName": "Min Start",
        "type": "number",
        "defaultValue": 1
      },
      {
        "name": "_MAX_START_",
        "displayName": "Max Start",
        "type": "number",
        "defaultValue": 2
      },
      {
        "name": "_MIN_STEP_",
        "displayName": "Min Step",
        "type": "number",
        "defaultValue": 1
      },
      {
        "name": "_MAX_STEP_",
        "displayName": "Max Step",
        "type": "number",
        "defaultValue": 2
      },
      {
        "name": "_MIN_GROUPS_",
        "displayName": "Min Groups",
        "type": "number",
        "defaultValue": 3
      },
      {
        "name": "_MAX_GROUPS_",
        "displayName": "Max Groups",
        "type": "number",
        "defaultValue": 5
      },
      {
        "name": "_INTERACTION_",
        "displayName": "Interaction",
        "type": "string",
        "defaultValue": "crystal"
      },
      {
        "name": "_TURN_STYLE_",
        "displayName": "Turn Style",
        "type": "string",
        "defaultValue": "straight"
      },
      {
        "name": "_TURN_POINT_",
        "displayName": "Turn Point",
        "type": "string",
        "defaultValue": "null"
      },
      {
        "name": "_HAS_JUMP_",
        "displayName": "Has Jump",
        "type": "string",
        "defaultValue": "noJump"
      },
      {
        "name": "_NO_ITEM_AT_",
        "displayName": "No Item At",
        "type": "string",
        "defaultValue": "null"
      },
      {
        "name": "_SEED_",
        "displayName": "Seed",
        "type": "int",
        "defaultValue": 1,
        "min": 1,
        "max": 99999
      }
    ],
    "solutionCode": "// Parameters\nvar _MIN_START_ = 1;\nvar _MAX_START_ = 2;\nvar START = random(_MIN_START_, _MAX_START_);\n\nvar _MIN_STEP_ = 1;\nvar _MAX_STEP_ = 2;\nvar STEP = random(_MIN_STEP_, _MAX_STEP_);\n\nvar _MIN_GROUPS_ = 3;\nvar _MAX_GROUPS_ = 5;\nvar GROUPS = random(_MIN_GROUPS_, _MAX_GROUPS_);\n\n// Full Parameter Set (Standardized)\nvar _INTERACTION_ = 'crystal'; // OPTIONS: crystal, switch, key, mixed, null\nvar _TURN_STYLE_ = 'straight'; // OPTIONS: straight, turnLeft, turnRight, uTurn, zTurn, randomLeftRight, random, null\nvar _TURN_POINT_ = 'null'; // OPTIONS: null, start, end, mid, random, null\nvar _HAS_JUMP_ = 'noJump'; // OPTIONS: random, withJump, noJump, null\nvar _NO_ITEM_AT_ = 'null'; // OPTIONS: null, noItemStart, noItemEnd, noItemBoth, null\nvar _SEED_ = random(1, 99999);\n\n// Solution\nfor (let i = 0; i < GROUPS; i++) {\n  let count = START + i * STEP; // Arithmetic progression\n  \n  // Generate segment of length 'count'\n  randomPattern(count, _INTERACTION_, true, 0, 'straight', _TURN_STYLE_, _TURN_POINT_, _HAS_JUMP_, _NO_ITEM_AT_, _SEED_ + i);\n  \n  // Turn logic between groups (except last)\n  if (i < GROUPS - 1) {\n    turnRight();\n    // No extra move needed if randomPattern connects directly, \n    // but typically we want spacing or a \"connector\" step.\n    // randomPattern ends at a cell. Turn happens there.\n    // If we duplicate logic from original: \"turnRight(); moveForward(); turnRight();\" -> U-turn spacing?\n    // Let's implement a simple connector move.\n    \n    // NOTE: Original code was turnRight -> move -> turnRight (U-turnish or Corner?)\n    // This implies a \"winding\" path or \"rows\". \n    // Let's mimic a simple row switch.\n    \n    moveForward(); // Connector step\n    turnRight();\n  }\n}",
    "descriptionMarkdown": "# Arithmetic Collect\n\nCollect items where the count increases linearly each time.\n\n## Academic Concept: Arithmetic Progression\n- Sequence: $a, a+d, a+2d, ...$\n- Here: Number of items to collect increases by `STEP`.\n\n## Features\n- **Arithmetic Progression**: The number of items/steps increases by a fixed `STEP` amount each group.\n- **Nested Loops**: Inner loop length depends on the outer loop variable.\n\n## Solution & Parameters",
    "rawContent": "---\nid: arithmetic-collect\nname: \"Arithmetic Collect\"\ncategory: progression\nconcepts: [\"loop\", \"variable\", \"arithmetic_progression\", \"nested_loop\"]\ndifficulty: 4\ntags: [\"math\", \"progression\", \"collect\"]\nauthor: system\nversion: 1\ndescription: \"Collect increasing numbers of items (1, 2, 3...)\"\n---\n\n# Arithmetic Collect\n\nCollect items where the count increases linearly each time.\n\n## Academic Concept: Arithmetic Progression\n- Sequence: $a, a+d, a+2d, ...$\n- Here: Number of items to collect increases by `STEP`.\n\n## Features\n- **Arithmetic Progression**: The number of items/steps increases by a fixed `STEP` amount each group.\n- **Nested Loops**: Inner loop length depends on the outer loop variable.\n\n## Solution & Parameters\n\n```js\n// Parameters\nvar _MIN_START_ = 1;\nvar _MAX_START_ = 2;\nvar START = random(_MIN_START_, _MAX_START_);\n\nvar _MIN_STEP_ = 1;\nvar _MAX_STEP_ = 2;\nvar STEP = random(_MIN_STEP_, _MAX_STEP_);\n\nvar _MIN_GROUPS_ = 3;\nvar _MAX_GROUPS_ = 5;\nvar GROUPS = random(_MIN_GROUPS_, _MAX_GROUPS_);\n\n// Full Parameter Set (Standardized)\nvar _INTERACTION_ = 'crystal'; // OPTIONS: crystal, switch, key, mixed, null\nvar _TURN_STYLE_ = 'straight'; // OPTIONS: straight, turnLeft, turnRight, uTurn, zTurn, randomLeftRight, random, null\nvar _TURN_POINT_ = 'null'; // OPTIONS: null, start, end, mid, random, null\nvar _HAS_JUMP_ = 'noJump'; // OPTIONS: random, withJump, noJump, null\nvar _NO_ITEM_AT_ = 'null'; // OPTIONS: null, noItemStart, noItemEnd, noItemBoth, null\nvar _SEED_ = random(1, 99999);\n\n// Solution\nfor (let i = 0; i < GROUPS; i++) {\n  let count = START + i * STEP; // Arithmetic progression\n  \n  // Generate segment of length 'count'\n  randomPattern(count, _INTERACTION_, true, 0, 'straight', _TURN_STYLE_, _TURN_POINT_, _HAS_JUMP_, _NO_ITEM_AT_, _SEED_ + i);\n  \n  // Turn logic between groups (except last)\n  if (i < GROUPS - 1) {\n    turnRight();\n    // No extra move needed if randomPattern connects directly, \n    // but typically we want spacing or a \"connector\" step.\n    // randomPattern ends at a cell. Turn happens there.\n    // If we duplicate logic from original: \"turnRight(); moveForward(); turnRight();\" -> U-turn spacing?\n    // Let's implement a simple connector move.\n    \n    // NOTE: Original code was turnRight -> move -> turnRight (U-turnish or Corner?)\n    // This implies a \"winding\" path or \"rows\". \n    // Let's mimic a simple row switch.\n    \n    moveForward(); // Connector step\n    turnRight();\n  }\n}\n```\n",
    "hints": {
      "title": "Arithmetic Collect",
      "description": "Collect items where the count increases linearly each time.",
      "learningGoals": "Arithmetic Progression",
      "goalDetails": [
        "Sequence: $a, a+d, a+2d, ...$",
        "Here: Number of items to collect increases by `STEP`."
      ]
    }
  },
  {
    "metadata": {
      "id": "arithmetic-move",
      "name": "Arithmetic Move",
      "category": "progression",
      "concepts": [
        "loop",
        "variable",
        "arithmetic_progression"
      ],
      "difficulty": 3,
      "tags": [
        "math",
        "progression",
        "variable_step"
      ],
      "author": "system",
      "version": 2,
      "description": "Move and collect crystals with increasing distances"
    },
    "parameters": [
      {
        "name": "_MIN_START_",
        "displayName": "Min Start",
        "type": "number",
        "defaultValue": 2
      },
      {
        "name": "_MAX_START_",
        "displayName": "Max Start",
        "type": "number",
        "defaultValue": 3
      },
      {
        "name": "_MIN_STEP_",
        "displayName": "Min Step",
        "type": "number",
        "defaultValue": 1
      },
      {
        "name": "_MAX_STEP_",
        "displayName": "Max Step",
        "type": "number",
        "defaultValue": 2
      },
      {
        "name": "_MIN_ITERS_",
        "displayName": "Min Iters",
        "type": "number",
        "defaultValue": 3
      },
      {
        "name": "_MAX_ITERS_",
        "displayName": "Max Iters",
        "type": "number",
        "defaultValue": 5
      },
      {
        "name": "_INTERACTION_",
        "displayName": "Interaction",
        "type": "string",
        "defaultValue": "crystal"
      },
      {
        "name": "_TURN_STYLE_",
        "displayName": "Turn Style",
        "type": "string",
        "defaultValue": "straight"
      },
      {
        "name": "_TURN_POINT_",
        "displayName": "Turn Point",
        "type": "string",
        "defaultValue": "null"
      },
      {
        "name": "_HAS_JUMP_",
        "displayName": "Has Jump",
        "type": "string",
        "defaultValue": "noJump"
      },
      {
        "name": "_NO_ITEM_AT_",
        "displayName": "No Item At",
        "type": "string",
        "defaultValue": "null"
      },
      {
        "name": "_SEED_",
        "displayName": "Seed",
        "type": "int",
        "defaultValue": 1,
        "min": 1,
        "max": 99999
      }
    ],
    "solutionCode": "// Parameters\nvar _MIN_START_ = 2;\nvar _MAX_START_ = 3;\nvar _MIN_STEP_ = 1;\nvar _MAX_STEP_ = 2;\nvar _MIN_ITERS_ = 3;\nvar _MAX_ITERS_ = 5;\n\nvar START = random(_MIN_START_, _MAX_START_);\nvar STEP = random(_MIN_STEP_, _MAX_STEP_);\nvar ITERATIONS = random(_MIN_ITERS_, _MAX_ITERS_);\n\n// Full Parameter Set (Standardized)\nvar _INTERACTION_ = 'crystal'; // OPTIONS: crystal, switch, key, mixed, null\nvar _TURN_STYLE_ = 'straight'; // OPTIONS: straight, turnLeft, turnRight, uTurn, zTurn, randomLeftRight, random, null\nvar _TURN_POINT_ = 'null'; // OPTIONS: null, start, end, mid, random, null\nvar _HAS_JUMP_ = 'noJump'; // OPTIONS: random, withJump, noJump, null\nvar _NO_ITEM_AT_ = 'null'; // OPTIONS: null, noItemStart, noItemEnd, noItemBoth, null\nvar _SEED_ = random(1, 99999);\n\n// Solution\nfor (let i = 0; i < ITERATIONS; i++) {\n  // Calculate arithmetic length\n  let dist = START + i * STEP;\n  \n  randomPattern(dist, _INTERACTION_, true, 0, 'straight', _TURN_STYLE_, _TURN_POINT_, _HAS_JUMP_, _NO_ITEM_AT_, _SEED_ + i);\n  \n  // Turn for next segment (except last)\n  if (i < ITERATIONS - 1) {\n    turnRight();\n  }\n}",
    "descriptionMarkdown": "# Arithmetic Move\n\nA path where each segment is longer than the previous one by a fixed step.\n\n## Academic Concept: Arithmetic Progression\n- Sequence: $a, a+d, a+2d, ...$\n- Here: Move distance increases by `STEP` each time.\n\n## Features\n- **Arithmetic Progression**: Path segments grow by a constant step.\n- **Loop & Variables**: Uses loop variable to calculate length `Start + i*Step`.\n\n## Solution & Parameters",
    "rawContent": "---\nid: arithmetic-move\nname: \"Arithmetic Move\"\ncategory: progression\nconcepts: [\"loop\", \"variable\", \"arithmetic_progression\"]\ndifficulty: 3\ntags: [\"math\", \"progression\", \"variable_step\"]\nauthor: system\nversion: 2\ndescription: \"Move and collect crystals with increasing distances\"\n---\n\n# Arithmetic Move\n\nA path where each segment is longer than the previous one by a fixed step.\n\n## Academic Concept: Arithmetic Progression\n- Sequence: $a, a+d, a+2d, ...$\n- Here: Move distance increases by `STEP` each time.\n\n## Features\n- **Arithmetic Progression**: Path segments grow by a constant step.\n- **Loop & Variables**: Uses loop variable to calculate length `Start + i*Step`.\n\n## Solution & Parameters\n\n```js\n// Parameters\nvar _MIN_START_ = 2;\nvar _MAX_START_ = 3;\nvar _MIN_STEP_ = 1;\nvar _MAX_STEP_ = 2;\nvar _MIN_ITERS_ = 3;\nvar _MAX_ITERS_ = 5;\n\nvar START = random(_MIN_START_, _MAX_START_);\nvar STEP = random(_MIN_STEP_, _MAX_STEP_);\nvar ITERATIONS = random(_MIN_ITERS_, _MAX_ITERS_);\n\n// Full Parameter Set (Standardized)\nvar _INTERACTION_ = 'crystal'; // OPTIONS: crystal, switch, key, mixed, null\nvar _TURN_STYLE_ = 'straight'; // OPTIONS: straight, turnLeft, turnRight, uTurn, zTurn, randomLeftRight, random, null\nvar _TURN_POINT_ = 'null'; // OPTIONS: null, start, end, mid, random, null\nvar _HAS_JUMP_ = 'noJump'; // OPTIONS: random, withJump, noJump, null\nvar _NO_ITEM_AT_ = 'null'; // OPTIONS: null, noItemStart, noItemEnd, noItemBoth, null\nvar _SEED_ = random(1, 99999);\n\n// Solution\nfor (let i = 0; i < ITERATIONS; i++) {\n  // Calculate arithmetic length\n  let dist = START + i * STEP;\n  \n  randomPattern(dist, _INTERACTION_, true, 0, 'straight', _TURN_STYLE_, _TURN_POINT_, _HAS_JUMP_, _NO_ITEM_AT_, _SEED_ + i);\n  \n  // Turn for next segment (except last)\n  if (i < ITERATIONS - 1) {\n    turnRight();\n  }\n}\n```\n",
    "hints": {
      "title": "Arithmetic Move",
      "description": "A path where each segment is longer than the previous one by a fixed step.",
      "learningGoals": "Arithmetic Progression",
      "goalDetails": [
        "Sequence: $a, a+d, a+2d, ...$",
        "Here: Move distance increases by `STEP` each time."
      ]
    }
  },
  {
    "metadata": {
      "id": "decaying-path",
      "name": "Decaying Path",
      "category": "progression",
      "concepts": [
        "loop",
        "variable",
        "arithmetic_progression"
      ],
      "difficulty": 4,
      "tags": [
        "math",
        "decay",
        "subtraction"
      ],
      "author": "system",
      "version": 2,
      "description": "Start with long segments and decrease length each turn"
    },
    "parameters": [
      {
        "name": "_MIN_START_LEN_",
        "displayName": "Min Start Len",
        "type": "number",
        "defaultValue": 3
      },
      {
        "name": "_MAX_START_LEN_",
        "displayName": "Max Start Len",
        "type": "number",
        "defaultValue": 5
      },
      {
        "name": "_INTERACTION_",
        "displayName": "Interaction",
        "type": "string",
        "defaultValue": "crystal"
      },
      {
        "name": "_TURN_STYLE_",
        "displayName": "Turn Style",
        "type": "string",
        "defaultValue": "straight"
      },
      {
        "name": "_TURN_POINT_",
        "displayName": "Turn Point",
        "type": "string",
        "defaultValue": "null"
      },
      {
        "name": "_HAS_JUMP_",
        "displayName": "Has Jump",
        "type": "string",
        "defaultValue": "noJump"
      },
      {
        "name": "_NO_ITEM_AT_",
        "displayName": "No Item At",
        "type": "string",
        "defaultValue": "null"
      },
      {
        "name": "_SEED_",
        "displayName": "Seed",
        "type": "int",
        "defaultValue": 1,
        "min": 1,
        "max": 99999
      }
    ],
    "solutionCode": "// Parameters\nvar _MIN_START_LEN_ = 3;\nvar _MAX_START_LEN_ = 5;\nvar START_LEN = random(_MIN_START_LEN_, _MAX_START_LEN_);\nvar STEP = 1;\n\n// Full Parameter Set (Standardized)\nvar _INTERACTION_ = 'crystal'; // OPTIONS: crystal, switch, key, mixed, null\nvar _TURN_STYLE_ = 'straight'; // OPTIONS: straight, turnLeft, turnRight, uTurn, zTurn, randomLeftRight, random, null\nvar _TURN_POINT_ = 'null'; // OPTIONS: null, start, end, mid, random, null\nvar _HAS_JUMP_ = 'noJump'; // OPTIONS: random, withJump, noJump, null\nvar _NO_ITEM_AT_ = 'null'; // OPTIONS: null, noItemStart, noItemEnd, noItemBoth, null\nvar _SEED_ = random(1, 99999);\n\n// Solution\nfor (let t = 0; t < START_LEN; t++) {\n  // Calculate decaying length\n  let len = START_LEN - t * STEP;\n  \n  if (len > 0) {\n    // Generate segment of specific calculated length\n    randomPattern(len, _INTERACTION_, true, 0, 'straight', _TURN_STYLE_, _TURN_POINT_, _HAS_JUMP_, _NO_ITEM_AT_, _SEED_ + t);\n    \n    turnLeft();\n  }\n}",
    "descriptionMarkdown": "# Decaying Path\n\nA \"convergence\" pattern where movements get smaller and smaller.\n\n## Academic Concept: Arithmetic Decay\n- Sequence: $a, a-d, a-2d, ...$\n- Logic: `dist = MAX - i*STEP`\n\n## Features\n- **Arithmetic Decay**: Demonstrates decreasing value over time.\n- **Dynamic Pattern**: Uses `randomPattern` with a variable length argument.\n\n## Solution & Parameters",
    "rawContent": "---\nid: decaying-path\nname: \"Decaying Path\"\ncategory: progression\nconcepts: [\"loop\", \"variable\", \"arithmetic_progression\"]\ndifficulty: 4\ntags: [\"math\", \"decay\", \"subtraction\"]\nauthor: system\nversion: 2\ndescription: \"Start with long segments and decrease length each turn\"\n---\n\n# Decaying Path\n\nA \"convergence\" pattern where movements get smaller and smaller.\n\n## Academic Concept: Arithmetic Decay\n- Sequence: $a, a-d, a-2d, ...$\n- Logic: `dist = MAX - i*STEP`\n\n## Features\n- **Arithmetic Decay**: Demonstrates decreasing value over time.\n- **Dynamic Pattern**: Uses `randomPattern` with a variable length argument.\n\n## Solution & Parameters\n\n```js\n// Parameters\nvar _MIN_START_LEN_ = 3;\nvar _MAX_START_LEN_ = 5;\nvar START_LEN = random(_MIN_START_LEN_, _MAX_START_LEN_);\nvar STEP = 1;\n\n// Full Parameter Set (Standardized)\nvar _INTERACTION_ = 'crystal'; // OPTIONS: crystal, switch, key, mixed, null\nvar _TURN_STYLE_ = 'straight'; // OPTIONS: straight, turnLeft, turnRight, uTurn, zTurn, randomLeftRight, random, null\nvar _TURN_POINT_ = 'null'; // OPTIONS: null, start, end, mid, random, null\nvar _HAS_JUMP_ = 'noJump'; // OPTIONS: random, withJump, noJump, null\nvar _NO_ITEM_AT_ = 'null'; // OPTIONS: null, noItemStart, noItemEnd, noItemBoth, null\nvar _SEED_ = random(1, 99999);\n\n// Solution\nfor (let t = 0; t < START_LEN; t++) {\n  // Calculate decaying length\n  let len = START_LEN - t * STEP;\n  \n  if (len > 0) {\n    // Generate segment of specific calculated length\n    randomPattern(len, _INTERACTION_, true, 0, 'straight', _TURN_STYLE_, _TURN_POINT_, _HAS_JUMP_, _NO_ITEM_AT_, _SEED_ + t);\n    \n    turnLeft();\n  }\n}\n```\n",
    "hints": {
      "title": "Decaying Path",
      "description": "A \"convergence\" pattern where movements get smaller and smaller.",
      "learningGoals": "Arithmetic Decay",
      "goalDetails": [
        "Sequence: $a, a-d, a-2d, ...$",
        "Logic: `dist = MAX - i*STEP`"
      ]
    }
  },
  {
    "metadata": {
      "id": "fibonacci-path",
      "name": "Fibonacci Path",
      "category": "progression",
      "concepts": [
        "loop",
        "variable",
        "fibonacci"
      ],
      "difficulty": 5,
      "tags": [
        "math",
        "fibonacci",
        "nature"
      ],
      "author": "system",
      "version": 3,
      "description": "Walk distances following the Fibonacci sequence (1, 1, 2, 3, 5...)"
    },
    "parameters": [
      {
        "name": "_MIN_STEPS_",
        "displayName": "Min Steps",
        "type": "number",
        "defaultValue": 3
      },
      {
        "name": "_MAX_STEPS_",
        "displayName": "Max Steps",
        "type": "number",
        "defaultValue": 6
      },
      {
        "name": "_INTERACTION_",
        "displayName": "Interaction",
        "type": "string",
        "defaultValue": "crystal"
      },
      {
        "name": "_TURN_STYLE_",
        "displayName": "Turn Style",
        "type": "string",
        "defaultValue": "straight"
      },
      {
        "name": "_TURN_POINT_",
        "displayName": "Turn Point",
        "type": "string",
        "defaultValue": "null"
      },
      {
        "name": "_HAS_JUMP_",
        "displayName": "Has Jump",
        "type": "string",
        "defaultValue": "noJump"
      },
      {
        "name": "_NO_ITEM_AT_",
        "displayName": "No Item At",
        "type": "string",
        "defaultValue": "null"
      },
      {
        "name": "_SEED_",
        "displayName": "Seed",
        "type": "int",
        "defaultValue": 1,
        "min": 1,
        "max": 99999
      }
    ],
    "solutionCode": "// Parameters\nvar _MIN_STEPS_ = 3;\nvar _MAX_STEPS_ = 6;\nvar STEPS = random(_MIN_STEPS_, _MAX_STEPS_);\n\n// Full Parameter Set (Standardized)\nvar _INTERACTION_ = 'crystal'; // OPTIONS: crystal, switch, key, mixed, null\nvar _TURN_STYLE_ = 'straight'; // OPTIONS: straight, turnLeft, turnRight, uTurn, zTurn, randomLeftRight, random, null\nvar _TURN_POINT_ = 'null'; // OPTIONS: null, start, end, mid, random, null\nvar _HAS_JUMP_ = 'noJump'; // OPTIONS: random, withJump, noJump, null\nvar _NO_ITEM_AT_ = 'null'; // OPTIONS: null, noItemStart, noItemEnd, noItemBoth, null\nvar _SEED_ = random(1, 99999);\n\n// Solution\nlet a = 1;\nlet b = 1;\n\n// First 2 steps (manual or loop) for F_1 and F_2\n// Step 1: len 1\nrandomPattern(1, _INTERACTION_, true, 0, 'straight', _TURN_STYLE_, _TURN_POINT_, _HAS_JUMP_, _NO_ITEM_AT_, _SEED_);\nturnRight();\n\n// Step 2: len 1\nrandomPattern(1, _INTERACTION_, true, 0, 'straight', _TURN_STYLE_, _TURN_POINT_, _HAS_JUMP_, _NO_ITEM_AT_, _SEED_ + 1);\nturnRight();\n\n// Additional Fibonacci steps (F_3 onwards)\nfor (let i = 2; i < STEPS; i++) {\n  let next = a + b;\n  \n  // Move Fibonacci distance\n  randomPattern(next, _INTERACTION_, true, 0, 'straight', _TURN_STYLE_, _TURN_POINT_, _HAS_JUMP_, _NO_ITEM_AT_, _SEED_ + i);\n  turnRight();\n  \n  // Update sequence\n  a = b;\n  b = next;\n}",
    "descriptionMarkdown": "# Fibonacci Path\n\nA path based on the famous Fibonacci sequence found in nature.\n\n## Academic Concept: Fibonacci Sequence\n- $F_0=0, F_1=1, F_n = F_{n-1} + F_{n-2}$\n- Sequence: 1, 1, 2, 3, 5, 8...\n\n## Features\n- **Math Sequence**: Generates path based on Fibonacci numbers (1, 1, 2, 3, 5...).\n- **Variable Update**: Demonstrates updating two variables in a loop.\n\n## Solution & Parameters",
    "rawContent": "---\nid: fibonacci-path\nname: \"Fibonacci Path\"\ncategory: progression\nconcepts: [\"loop\", \"variable\", \"fibonacci\"]\ndifficulty: 5\ntags: [\"math\", \"fibonacci\", \"nature\"]\nauthor: system\nversion: 3\ndescription: \"Walk distances following the Fibonacci sequence (1, 1, 2, 3, 5...)\"\n---\n\n# Fibonacci Path\n\nA path based on the famous Fibonacci sequence found in nature.\n\n## Academic Concept: Fibonacci Sequence\n- $F_0=0, F_1=1, F_n = F_{n-1} + F_{n-2}$\n- Sequence: 1, 1, 2, 3, 5, 8...\n\n## Features\n- **Math Sequence**: Generates path based on Fibonacci numbers (1, 1, 2, 3, 5...).\n- **Variable Update**: Demonstrates updating two variables in a loop.\n\n## Solution & Parameters\n\n```js\n// Parameters\nvar _MIN_STEPS_ = 3;\nvar _MAX_STEPS_ = 6;\nvar STEPS = random(_MIN_STEPS_, _MAX_STEPS_);\n\n// Full Parameter Set (Standardized)\nvar _INTERACTION_ = 'crystal'; // OPTIONS: crystal, switch, key, mixed, null\nvar _TURN_STYLE_ = 'straight'; // OPTIONS: straight, turnLeft, turnRight, uTurn, zTurn, randomLeftRight, random, null\nvar _TURN_POINT_ = 'null'; // OPTIONS: null, start, end, mid, random, null\nvar _HAS_JUMP_ = 'noJump'; // OPTIONS: random, withJump, noJump, null\nvar _NO_ITEM_AT_ = 'null'; // OPTIONS: null, noItemStart, noItemEnd, noItemBoth, null\nvar _SEED_ = random(1, 99999);\n\n// Solution\nlet a = 1;\nlet b = 1;\n\n// First 2 steps (manual or loop) for F_1 and F_2\n// Step 1: len 1\nrandomPattern(1, _INTERACTION_, true, 0, 'straight', _TURN_STYLE_, _TURN_POINT_, _HAS_JUMP_, _NO_ITEM_AT_, _SEED_);\nturnRight();\n\n// Step 2: len 1\nrandomPattern(1, _INTERACTION_, true, 0, 'straight', _TURN_STYLE_, _TURN_POINT_, _HAS_JUMP_, _NO_ITEM_AT_, _SEED_ + 1);\nturnRight();\n\n// Additional Fibonacci steps (F_3 onwards)\nfor (let i = 2; i < STEPS; i++) {\n  let next = a + b;\n  \n  // Move Fibonacci distance\n  randomPattern(next, _INTERACTION_, true, 0, 'straight', _TURN_STYLE_, _TURN_POINT_, _HAS_JUMP_, _NO_ITEM_AT_, _SEED_ + i);\n  turnRight();\n  \n  // Update sequence\n  a = b;\n  b = next;\n}\n```\n",
    "hints": {
      "title": "Fibonacci Path",
      "description": "A path based on the famous Fibonacci sequence found in nature.",
      "learningGoals": "Fibonacci Sequence",
      "goalDetails": [
        "$F_0=0, F_1=1, F_n = F_{n-1} + F_{n-2}$",
        "Sequence: 1, 1, 2, 3, 5, 8..."
      ]
    }
  },
  {
    "metadata": {
      "id": "geometric-spiral",
      "name": "Geometric Spiral",
      "category": "progression",
      "concepts": [
        "loop",
        "variable",
        "geometric_progression"
      ],
      "difficulty": 5,
      "tags": [
        "math",
        "spiral",
        "exponential"
      ],
      "author": "system",
      "version": 3,
      "description": "Walk a spiral where side lengths double (1, 2, 4...)"
    },
    "parameters": [
      {
        "name": "_MIN_TURNS_",
        "displayName": "Min Turns",
        "type": "number",
        "defaultValue": 3
      },
      {
        "name": "_MAX_TURNS_",
        "displayName": "Max Turns",
        "type": "number",
        "defaultValue": 5
      },
      {
        "name": "_INTERACTION_",
        "displayName": "Interaction",
        "type": "string",
        "defaultValue": "crystal"
      },
      {
        "name": "_TURN_STYLE_",
        "displayName": "Turn Style",
        "type": "string",
        "defaultValue": "straight"
      },
      {
        "name": "_TURN_POINT_",
        "displayName": "Turn Point",
        "type": "string",
        "defaultValue": "null"
      },
      {
        "name": "_HAS_JUMP_",
        "displayName": "Has Jump",
        "type": "string",
        "defaultValue": "noJump"
      },
      {
        "name": "_NO_ITEM_AT_",
        "displayName": "No Item At",
        "type": "string",
        "defaultValue": "null"
      },
      {
        "name": "_SEED_",
        "displayName": "Seed",
        "type": "int",
        "defaultValue": 1,
        "min": 1,
        "max": 99999
      }
    ],
    "solutionCode": "// Parameters\nvar _MIN_TURNS_ = 3;\nvar _MAX_TURNS_ = 5;\nvar TURNS = random(_MIN_TURNS_, _MAX_TURNS_);\nvar RATIO = 2;\n\n// Full Parameter Set (Standardized)\nvar _INTERACTION_ = 'crystal'; // OPTIONS: crystal, switch, key, mixed, null\nvar _TURN_STYLE_ = 'straight'; // OPTIONS: straight, turnLeft, turnRight, uTurn, zTurn, randomLeftRight, random, null\nvar _TURN_POINT_ = 'null'; // OPTIONS: null, start, end, mid, random, null\nvar _HAS_JUMP_ = 'noJump'; // OPTIONS: random, withJump, noJump, null\nvar _NO_ITEM_AT_ = 'null'; // OPTIONS: null, noItemStart, noItemEnd, noItemBoth, null\nvar _SEED_ = random(1, 99999);\n\n// Solution\nlet length = 1;\n\nfor (let i = 0; i < TURNS; i++) {\n  // Generate expanding segment\n  randomPattern(length, _INTERACTION_, true, 0, 'straight', _TURN_STYLE_, _TURN_POINT_, _HAS_JUMP_, _NO_ITEM_AT_, _SEED_ + i);\n  \n  turnRight();\n  \n  // Clean arithmetic update\n  length = length * RATIO;\n}",
    "descriptionMarkdown": "# Geometric Spiral\n\nA spiral path that expands exponentially.\n\n## Academic Concept: Geometric Progression\n- Sequence: $a, ar, ar^2, ...$\n- Here: Side length multiplies by `RATIO` (usually 2) each turn.\n\n## Features\n- **Geometric Progression**: Demonstrates exponential properties (doubling length).\n- **Spiral**: Creates an expanding spiral path.\n\n## Solution & Parameters",
    "rawContent": "---\nid: geometric-spiral\nname: \"Geometric Spiral\"\ncategory: progression\nconcepts: [\"loop\", \"variable\", \"geometric_progression\"]\ndifficulty: 5\ntags: [\"math\", \"spiral\", \"exponential\"]\nauthor: system\nversion: 3\ndescription: \"Walk a spiral where side lengths double (1, 2, 4...)\"\n---\n\n# Geometric Spiral\n\nA spiral path that expands exponentially.\n\n## Academic Concept: Geometric Progression\n- Sequence: $a, ar, ar^2, ...$\n- Here: Side length multiplies by `RATIO` (usually 2) each turn.\n\n## Features\n- **Geometric Progression**: Demonstrates exponential properties (doubling length).\n- **Spiral**: Creates an expanding spiral path.\n\n## Solution & Parameters\n\n```js\n// Parameters\nvar _MIN_TURNS_ = 3;\nvar _MAX_TURNS_ = 5;\nvar TURNS = random(_MIN_TURNS_, _MAX_TURNS_);\nvar RATIO = 2;\n\n// Full Parameter Set (Standardized)\nvar _INTERACTION_ = 'crystal'; // OPTIONS: crystal, switch, key, mixed, null\nvar _TURN_STYLE_ = 'straight'; // OPTIONS: straight, turnLeft, turnRight, uTurn, zTurn, randomLeftRight, random, null\nvar _TURN_POINT_ = 'null'; // OPTIONS: null, start, end, mid, random, null\nvar _HAS_JUMP_ = 'noJump'; // OPTIONS: random, withJump, noJump, null\nvar _NO_ITEM_AT_ = 'null'; // OPTIONS: null, noItemStart, noItemEnd, noItemBoth, null\nvar _SEED_ = random(1, 99999);\n\n// Solution\nlet length = 1;\n\nfor (let i = 0; i < TURNS; i++) {\n  // Generate expanding segment\n  randomPattern(length, _INTERACTION_, true, 0, 'straight', _TURN_STYLE_, _TURN_POINT_, _HAS_JUMP_, _NO_ITEM_AT_, _SEED_ + i);\n  \n  turnRight();\n  \n  // Clean arithmetic update\n  length = length * RATIO;\n}\n```\n",
    "hints": {
      "title": "Geometric Spiral",
      "description": "A spiral path that expands exponentially.",
      "learningGoals": "Geometric Progression",
      "goalDetails": [
        "Sequence: $a, ar, ar^2, ...$",
        "Here: Side length multiplies by `RATIO` (usually 2) each turn."
      ]
    }
  },
  {
    "metadata": {
      "id": "prog-simple-increase",
      "name": "Simple Increase",
      "category": "progression",
      "concepts": [
        "variable",
        "arithmetic_progression"
      ],
      "difficulty": 2,
      "tags": [
        "math",
        "progression",
        "increment"
      ],
      "author": "system",
      "version": 3,
      "description": "Simple increasing pattern (1, 2, 3 steps)"
    },
    "parameters": [
      {
        "name": "_MIN_GROUPS_",
        "displayName": "Min Groups",
        "type": "number",
        "defaultValue": 3
      },
      {
        "name": "_MAX_GROUPS_",
        "displayName": "Max Groups",
        "type": "number",
        "defaultValue": 5
      },
      {
        "name": "_INTERACTION_",
        "displayName": "Interaction",
        "type": "string",
        "defaultValue": "crystal"
      },
      {
        "name": "_TURN_STYLE_",
        "displayName": "Turn Style",
        "type": "string",
        "defaultValue": "straight"
      },
      {
        "name": "_TURN_POINT_",
        "displayName": "Turn Point",
        "type": "string",
        "defaultValue": "null"
      },
      {
        "name": "_HAS_JUMP_",
        "displayName": "Has Jump",
        "type": "string",
        "defaultValue": "noJump"
      },
      {
        "name": "_NO_ITEM_AT_",
        "displayName": "No Item At",
        "type": "string",
        "defaultValue": "null"
      },
      {
        "name": "_SEED_",
        "displayName": "Seed",
        "type": "int",
        "defaultValue": 1,
        "min": 1,
        "max": 99999
      }
    ],
    "solutionCode": "// Parameters\nvar _MIN_GROUPS_ = 3;\nvar _MAX_GROUPS_ = 5;\nvar GROUPS = random(_MIN_GROUPS_, _MAX_GROUPS_);\n\n// Full Parameter Set (Standardized)\nvar _INTERACTION_ = 'crystal'; // OPTIONS: crystal, switch, key, mixed, null\nvar _TURN_STYLE_ = 'straight'; // OPTIONS: straight, turnLeft, turnRight, uTurn, zTurn, randomLeftRight, random, null\nvar _TURN_POINT_ = 'null'; // OPTIONS: null, start, end, mid, random, null\nvar _HAS_JUMP_ = 'noJump'; // OPTIONS: random, withJump, noJump, null\nvar _NO_ITEM_AT_ = 'null'; // OPTIONS: null, noItemStart, noItemEnd, noItemBoth, null\nvar _SEED_ = random(1, 99999);\n\n// Solution\n// Walk 1 step, then 2 steps, then 3 steps, etc.\nfor (let group = 0; group < GROUPS; group++) {\n  let stepsInGroup = group + 1; // 1, 2, 3...\n  \n  // Generate segment of length 'stepsInGroup'\n  randomPattern(stepsInGroup, _INTERACTION_, true, 0, 'straight', _TURN_STYLE_, _TURN_POINT_, _HAS_JUMP_, _NO_ITEM_AT_, _SEED_ + group);\n  \n  // Turn for next group (simple zigzag/stairs turn)\n  if (group < GROUPS - 1) {\n    turnRight();\n    moveForward(); // Connector\n    turnLeft();\n  }\n}",
    "descriptionMarkdown": "# Simple Increase\n\nA simple introduction to increasing patterns.\n\n## Learning Goals\n- Recognize increasing sequences\n- Understand progression\n\n## Features\n- **Increasing Pattern**: 1 step, then 2 steps, then 3 steps.\n- **Progression Logic**: Visualizes how linear growth looks in movement.\n\n## Solution & Parameters",
    "rawContent": "---\nid: prog-simple-increase\nname: \"Simple Increase\"\ncategory: progression\nconcepts: [\"variable\", \"arithmetic_progression\"]\ndifficulty: 2\ntags: [\"math\", \"progression\", \"increment\"]\nauthor: system\nversion: 3\ndescription: \"Simple increasing pattern (1, 2, 3 steps)\"\n---\n\n# Simple Increase\n\nA simple introduction to increasing patterns.\n\n## Learning Goals\n- Recognize increasing sequences\n- Understand progression\n\n## Features\n- **Increasing Pattern**: 1 step, then 2 steps, then 3 steps.\n- **Progression Logic**: Visualizes how linear growth looks in movement.\n\n## Solution & Parameters\n\n```js\n// Parameters\nvar _MIN_GROUPS_ = 3;\nvar _MAX_GROUPS_ = 5;\nvar GROUPS = random(_MIN_GROUPS_, _MAX_GROUPS_);\n\n// Full Parameter Set (Standardized)\nvar _INTERACTION_ = 'crystal'; // OPTIONS: crystal, switch, key, mixed, null\nvar _TURN_STYLE_ = 'straight'; // OPTIONS: straight, turnLeft, turnRight, uTurn, zTurn, randomLeftRight, random, null\nvar _TURN_POINT_ = 'null'; // OPTIONS: null, start, end, mid, random, null\nvar _HAS_JUMP_ = 'noJump'; // OPTIONS: random, withJump, noJump, null\nvar _NO_ITEM_AT_ = 'null'; // OPTIONS: null, noItemStart, noItemEnd, noItemBoth, null\nvar _SEED_ = random(1, 99999);\n\n// Solution\n// Walk 1 step, then 2 steps, then 3 steps, etc.\nfor (let group = 0; group < GROUPS; group++) {\n  let stepsInGroup = group + 1; // 1, 2, 3...\n  \n  // Generate segment of length 'stepsInGroup'\n  randomPattern(stepsInGroup, _INTERACTION_, true, 0, 'straight', _TURN_STYLE_, _TURN_POINT_, _HAS_JUMP_, _NO_ITEM_AT_, _SEED_ + group);\n  \n  // Turn for next group (simple zigzag/stairs turn)\n  if (group < GROUPS - 1) {\n    turnRight();\n    moveForward(); // Connector\n    turnLeft();\n  }\n}\n```\n",
    "hints": {
      "title": "Simple Increase",
      "description": "A simple introduction to increasing patterns.",
      "learningGoals": "- Recognize increasing sequences",
      "goalDetails": [
        "Understand progression"
      ]
    }
  },
  {
    "metadata": {
      "id": "crystal-garden-basic",
      "name": "Crystal Garden",
      "category": "sequential",
      "concepts": [
        "sequential",
        "optimization"
      ],
      "difficulty": 2,
      "tags": [
        "moveForward",
        "collectItem",
        "strategy"
      ],
      "author": "system",
      "version": 1,
      "description": "Collect crystals in an open garden - find the optimal path"
    },
    "parameters": [
      {
        "name": "_MIN_STEPS_",
        "displayName": "Min Steps",
        "type": "number",
        "defaultValue": 3
      },
      {
        "name": "_MAX_STEPS_",
        "displayName": "Max Steps",
        "type": "number",
        "defaultValue": 4
      },
      {
        "name": "_INTERACTION_",
        "displayName": "Interaction",
        "type": "string",
        "defaultValue": "crystal"
      },
      {
        "name": "_TURN_STYLE_",
        "displayName": "Turn Style",
        "type": "string",
        "defaultValue": "randomLeftRight"
      },
      {
        "name": "_TURN_POINT_",
        "displayName": "Turn Point",
        "type": "string",
        "defaultValue": "random"
      },
      {
        "name": "_HAS_JUMP_",
        "displayName": "Has Jump",
        "type": "string",
        "defaultValue": "noJump"
      },
      {
        "name": "_NO_ITEM_AT_",
        "displayName": "No Item At",
        "type": "string",
        "defaultValue": "noItemBoth"
      }
    ],
    "solutionCode": "// Parameters\nvar _MIN_STEPS_ = 3;\nvar _MAX_STEPS_ = 4;\nvar _INTERACTION_ = 'crystal'; // OPTIONS: crystal, switch, key, mixed, null\nvar _TURN_STYLE_ = 'randomLeftRight'; // OPTIONS: straight, turnLeft, turnRight, uTurn, zTurn, randomLeftRight, random, null\nvar _TURN_POINT_ = 'random'; // OPTIONS: null, start, end, mid, random\nvar _HAS_JUMP_ = 'noJump'; // OPTIONS: random, withJump, noJump, null\nvar _NO_ITEM_AT_ = 'noItemBoth'; // OPTIONS: null, noItemStart, noItemEnd, noItemBoth\nvar LEN = random(_MIN_STEPS_, _MAX_STEPS_);\n\n// Solution: Create a winding path with crystals\nfor (let i = 0; i < random(2, 3); i++) {\n    randomPattern(LEN, _INTERACTION_, _TURN_STYLE_, _TURN_POINT_, _HAS_JUMP_, _NO_ITEM_AT_, random(1, 99999));\n}\n\n// Post-process: Fill the bounding box to create open area\npostProcess({ type: 'fillBoundingBox', offset: 1, material: 'grass', walkable: true });\n\n// Add trees to non-path positions\npostProcess({ \n    type: 'addTrees', \n    count: [3, 5],        // Min và max số cây\n    treeTypes: ['tree.tree01', 'tree.tree02', 'tree.tree03', 'tree.tree04', 'tree.tree05'],\n    excludePath: true     // Không đặt trên path\n});",
    "descriptionMarkdown": "# Crystal Garden\n\nAn open-area map where players must strategize to collect all crystals efficiently.\nUnlike trail maps, there are multiple valid paths.\n\n## Learning Goals\n- Strategic thinking - choosing optimal routes\n- Understanding there can be multiple solutions\n- Practicing movement commands in 2D space\n\n## Features\n\n- **Open Arena**: `fillBoundingBox` creates an open area around the path\n- **Multiple Routes**: Players can choose different paths to collect items\n- **Strategic Gameplay**: Encourages optimization thinking\n\n## Solution & Parameters",
    "rawContent": "---\nid: crystal-garden-basic\nname: \"Crystal Garden\"\ncategory: sequential\nconcepts: [\"sequential\", \"optimization\"]\ndifficulty: 2\ntags: [\"moveForward\", \"collectItem\", \"strategy\"]\nauthor: system\nversion: 1\ndescription: \"Collect crystals in an open garden - find the optimal path\"\n---\n\n# Crystal Garden\n\nAn open-area map where players must strategize to collect all crystals efficiently.\nUnlike trail maps, there are multiple valid paths.\n\n## Learning Goals\n- Strategic thinking - choosing optimal routes\n- Understanding there can be multiple solutions\n- Practicing movement commands in 2D space\n\n## Features\n\n- **Open Arena**: `fillBoundingBox` creates an open area around the path\n- **Multiple Routes**: Players can choose different paths to collect items\n- **Strategic Gameplay**: Encourages optimization thinking\n\n## Solution & Parameters\n\n```js\n// Parameters\nvar _MIN_STEPS_ = 3;\nvar _MAX_STEPS_ = 4;\nvar _INTERACTION_ = 'crystal'; // OPTIONS: crystal, switch, key, mixed, null\nvar _TURN_STYLE_ = 'randomLeftRight'; // OPTIONS: straight, turnLeft, turnRight, uTurn, zTurn, randomLeftRight, random, null\nvar _TURN_POINT_ = 'random'; // OPTIONS: null, start, end, mid, random\nvar _HAS_JUMP_ = 'noJump'; // OPTIONS: random, withJump, noJump, null\nvar _NO_ITEM_AT_ = 'noItemBoth'; // OPTIONS: null, noItemStart, noItemEnd, noItemBoth\nvar LEN = random(_MIN_STEPS_, _MAX_STEPS_);\n\n// Solution: Create a winding path with crystals\nfor (let i = 0; i < random(2, 3); i++) {\n    randomPattern(LEN, _INTERACTION_, _TURN_STYLE_, _TURN_POINT_, _HAS_JUMP_, _NO_ITEM_AT_, random(1, 99999));\n}\n\n// Post-process: Fill the bounding box to create open area\npostProcess({ type: 'fillBoundingBox', offset: 1, material: 'grass', walkable: true });\n\n// Add trees to non-path positions\npostProcess({ \n    type: 'addTrees', \n    count: [3, 5],        // Min và max số cây\n    treeTypes: ['tree.tree01', 'tree.tree02', 'tree.tree03', 'tree.tree04', 'tree.tree05'],\n    excludePath: true     // Không đặt trên path\n});\n```\n",
    "hints": {
      "title": "Crystal Garden",
      "description": "An open-area map where players must strategize to collect all crystals efficiently.\nUnlike trail maps, there are multiple valid paths.",
      "learningGoals": "- Strategic thinking - choosing optimal routes",
      "goalDetails": [
        "Understanding there can be multiple solutions",
        "Practicing movement commands in 2D space"
      ]
    }
  },
  {
    "metadata": {
      "id": "crystal-trail-full",
      "name": "Crystal Trail: Master",
      "category": "sequential",
      "concepts": [
        "sequential",
        "turns",
        "jumps"
      ],
      "difficulty": 3,
      "tags": [
        "moveForward",
        "turn",
        "jump",
        "collectItem",
        "mixed"
      ],
      "author": "system",
      "version": 1,
      "description": "Complex path combining turns and jumps"
    },
    "parameters": [
      {
        "name": "_MIN_STEPS_",
        "displayName": "Min Steps",
        "type": "number",
        "defaultValue": 4
      },
      {
        "name": "_MAX_STEPS_",
        "displayName": "Max Steps",
        "type": "number",
        "defaultValue": 6
      },
      {
        "name": "_INTERACTION_",
        "displayName": "Interaction",
        "type": "string",
        "defaultValue": "crystal"
      },
      {
        "name": "_TURN_STYLE_",
        "displayName": "Turn Style",
        "type": "string",
        "defaultValue": "random"
      },
      {
        "name": "_TURN_POINT_",
        "displayName": "Turn Point",
        "type": "string",
        "defaultValue": "random"
      },
      {
        "name": "_HAS_JUMP_",
        "displayName": "Has Jump",
        "type": "string",
        "defaultValue": "random"
      },
      {
        "name": "_NO_ITEM_AT_",
        "displayName": "No Item At",
        "type": "string",
        "defaultValue": "noItemBoth"
      }
    ],
    "solutionCode": "// Parameters\nvar _MIN_STEPS_ = 4;\nvar _MAX_STEPS_ = 6;\nvar _INTERACTION_ = 'crystal'; // OPTIONS: crystal, switch, key, mixed, null\nvar _TURN_STYLE_ = 'random'; // OPTIONS: straight, turnLeft, turnRight, uTurn, zTurn, randomLeftRight, random, null\nvar _TURN_POINT_ = 'random'; // OPTIONS: null, start, end, mid, random\nvar _HAS_JUMP_ = 'random'; // OPTIONS: random, withJump, noJump, null\nvar _NO_ITEM_AT_ = 'noItemBoth'; // OPTIONS: null, noItemStart, noItemEnd, noItemBoth\nvar LEN = random(_MIN_STEPS_, _MAX_STEPS_);\n\n// Solution\nfor (let i = 0; i < random(3, 5); i++) {\n    randomPattern(LEN, _INTERACTION_, _TURN_STYLE_, _TURN_POINT_, _HAS_JUMP_, _NO_ITEM_AT_, random(1, 99999));\n}",
    "descriptionMarkdown": "# Crystal Trail: Master\n\nThe ultimate sequential challenge combining turns and jumps on a long path.\n\n## Learning Goals\n- Integrate all movement commands\n- Solve complex pathfinding problems\n- Handle mixed obstacle types\n\n## Features\n\n- **Complex Path**: `_TURN_STYLE_ = 'randomLeftRight'` mixed with `_HAS_JUMP_ = 'withJump'`\n- **Full Randomized**: Uses random seed for endless variations\n- **Extended Length**: Composes multiple patterns for a longer quest\n\n## Solution & Parameters",
    "rawContent": "---\nid: crystal-trail-full\nname: \"Crystal Trail: Master\"\ncategory: sequential\nconcepts: [\"sequential\", \"turns\", \"jumps\"]\ndifficulty: 3\ntags: [\"moveForward\", \"turn\", \"jump\", \"collectItem\", \"mixed\"]\nauthor: system\nversion: 1\ndescription: \"Complex path combining turns and jumps\"\n---\n\n# Crystal Trail: Master\n\nThe ultimate sequential challenge combining turns and jumps on a long path.\n\n## Learning Goals\n- Integrate all movement commands\n- Solve complex pathfinding problems\n- Handle mixed obstacle types\n\n## Features\n\n- **Complex Path**: `_TURN_STYLE_ = 'randomLeftRight'` mixed with `_HAS_JUMP_ = 'withJump'`\n- **Full Randomized**: Uses random seed for endless variations\n- **Extended Length**: Composes multiple patterns for a longer quest\n\n## Solution & Parameters\n\n```js\n// Parameters\nvar _MIN_STEPS_ = 4;\nvar _MAX_STEPS_ = 6;\nvar _INTERACTION_ = 'crystal'; // OPTIONS: crystal, switch, key, mixed, null\nvar _TURN_STYLE_ = 'random'; // OPTIONS: straight, turnLeft, turnRight, uTurn, zTurn, randomLeftRight, random, null\nvar _TURN_POINT_ = 'random'; // OPTIONS: null, start, end, mid, random\nvar _HAS_JUMP_ = 'random'; // OPTIONS: random, withJump, noJump, null\nvar _NO_ITEM_AT_ = 'noItemBoth'; // OPTIONS: null, noItemStart, noItemEnd, noItemBoth\nvar LEN = random(_MIN_STEPS_, _MAX_STEPS_);\n\n// Solution\nfor (let i = 0; i < random(3, 5); i++) {\n    randomPattern(LEN, _INTERACTION_, _TURN_STYLE_, _TURN_POINT_, _HAS_JUMP_, _NO_ITEM_AT_, random(1, 99999));\n}\n```\n",
    "hints": {
      "title": "Crystal Trail: Master",
      "description": "The ultimate sequential challenge combining turns and jumps on a long path.",
      "learningGoals": "- Integrate all movement commands",
      "goalDetails": [
        "Solve complex pathfinding problems",
        "Handle mixed obstacle types"
      ]
    }
  },
  {
    "metadata": {
      "id": "crystal-trail-straight-jump",
      "name": "Crystal Trail: Jumps",
      "category": "sequential",
      "concepts": [
        "sequential",
        "jumps"
      ],
      "difficulty": 2,
      "tags": [
        "moveForward",
        "jump",
        "collectItem",
        "basic"
      ],
      "author": "system",
      "version": 1,
      "description": "Collect crystals along a straight path using jumps"
    },
    "parameters": [
      {
        "name": "_MIN_STEPS_",
        "displayName": "Min Steps",
        "type": "number",
        "defaultValue": 2
      },
      {
        "name": "_MAX_STEPS_",
        "displayName": "Max Steps",
        "type": "number",
        "defaultValue": 4
      },
      {
        "name": "_INTERACTION_",
        "displayName": "Interaction",
        "type": "string",
        "defaultValue": "crystal"
      },
      {
        "name": "_TURN_STYLE_",
        "displayName": "Turn Style",
        "type": "string",
        "defaultValue": "straight"
      },
      {
        "name": "_TURN_POINT_",
        "displayName": "Turn Point",
        "type": "string",
        "defaultValue": "null"
      },
      {
        "name": "_HAS_JUMP_",
        "displayName": "Has Jump",
        "type": "string",
        "defaultValue": "withJump"
      },
      {
        "name": "_NO_ITEM_AT_",
        "displayName": "No Item At",
        "type": "string",
        "defaultValue": "noItemBoth"
      }
    ],
    "solutionCode": "// Parameters\nvar _MIN_STEPS_ = 2;\nvar _MAX_STEPS_ = 4;\nvar _INTERACTION_ = 'crystal'; // OPTIONS: crystal, switch, key, mixed, null\nvar _TURN_STYLE_ = 'straight'; // OPTIONS: straight, turnLeft, turnRight, uTurn, zTurn, randomLeftRight, random, null\nvar _TURN_POINT_ = 'null'; // OPTIONS: null, start, end, mid, random, null\nvar _HAS_JUMP_ = 'withJump'; // OPTIONS: random, withJump, noJump, null\nvar _NO_ITEM_AT_ = 'noItemBoth'; // OPTIONS: null, noItemStart, noItemEnd, noItemBoth, null\nvar LEN = random(_MIN_STEPS_, _MAX_STEPS_);\n\n// Solution\nfor (let i = 0; i < random(3, 4); i++) {\n    randomPattern(LEN, _INTERACTION_, _TURN_STYLE_, _TURN_POINT_, _HAS_JUMP_, _NO_ITEM_AT_, random(1, 99999));\n}",
    "descriptionMarkdown": "# Crystal Trail: Jumps\n\nA straight path that introduces obstacles requiring the jump command.\n\n## Learning Goals\n- Practice `jump()` command\n- Combine movement with jumping\n- Maintain sequential logic\n\n## Features\n\n- **Straight Path**: `_TURN_STYLE_ = 'straight'` keeps the direction constant\n- **Jumps Required**: `_HAS_JUMP_ = 'withJump'` introduces gaps/obstacles\n- **Sequential**: Linear progression without complex turning\n\n## Solution & Parameters",
    "rawContent": "---\nid: crystal-trail-straight-jump\nname: \"Crystal Trail: Jumps\"\ncategory: sequential\nconcepts: [\"sequential\", \"jumps\"]\ndifficulty: 2\ntags: [\"moveForward\", \"jump\", \"collectItem\", \"basic\"]\nauthor: system\nversion: 1\ndescription: \"Collect crystals along a straight path using jumps\"\n---\n\n# Crystal Trail: Jumps\n\nA straight path that introduces obstacles requiring the jump command.\n\n## Learning Goals\n- Practice `jump()` command\n- Combine movement with jumping\n- Maintain sequential logic\n\n## Features\n\n- **Straight Path**: `_TURN_STYLE_ = 'straight'` keeps the direction constant\n- **Jumps Required**: `_HAS_JUMP_ = 'withJump'` introduces gaps/obstacles\n- **Sequential**: Linear progression without complex turning\n\n## Solution & Parameters\n\n```js\n// Parameters\nvar _MIN_STEPS_ = 2;\nvar _MAX_STEPS_ = 4;\nvar _INTERACTION_ = 'crystal'; // OPTIONS: crystal, switch, key, mixed, null\nvar _TURN_STYLE_ = 'straight'; // OPTIONS: straight, turnLeft, turnRight, uTurn, zTurn, randomLeftRight, random, null\nvar _TURN_POINT_ = 'null'; // OPTIONS: null, start, end, mid, random, null\nvar _HAS_JUMP_ = 'withJump'; // OPTIONS: random, withJump, noJump, null\nvar _NO_ITEM_AT_ = 'noItemBoth'; // OPTIONS: null, noItemStart, noItemEnd, noItemBoth, null\nvar LEN = random(_MIN_STEPS_, _MAX_STEPS_);\n\n// Solution\nfor (let i = 0; i < random(3, 4); i++) {\n    randomPattern(LEN, _INTERACTION_, _TURN_STYLE_, _TURN_POINT_, _HAS_JUMP_, _NO_ITEM_AT_, random(1, 99999));\n}\n```\n",
    "hints": {
      "title": "Crystal Trail: Jumps",
      "description": "A straight path that introduces obstacles requiring the jump command.",
      "learningGoals": "- Practice `jump()` command",
      "goalDetails": [
        "Combine movement with jumping",
        "Maintain sequential logic"
      ]
    }
  },
  {
    "metadata": {
      "id": "crystal-trail-basic",
      "name": "Crystal Trail: Basic",
      "category": "sequential",
      "concepts": [
        "sequential"
      ],
      "difficulty": 1,
      "tags": [
        "moveForward",
        "collectItem",
        "basic"
      ],
      "author": "system",
      "version": 1,
      "description": "Collect crystals along a straight path"
    },
    "parameters": [
      {
        "name": "_MIN_STEPS_",
        "displayName": "Min Steps",
        "type": "number",
        "defaultValue": 3
      },
      {
        "name": "_MAX_STEPS_",
        "displayName": "Max Steps",
        "type": "number",
        "defaultValue": 5
      },
      {
        "name": "_INTERACTION_",
        "displayName": "Interaction",
        "type": "string",
        "defaultValue": "crystal"
      },
      {
        "name": "_TURN_STYLE_",
        "displayName": "Turn Style",
        "type": "string",
        "defaultValue": "straight"
      },
      {
        "name": "_TURN_POINT_",
        "displayName": "Turn Point",
        "type": "string",
        "defaultValue": "null"
      },
      {
        "name": "_HAS_JUMP_",
        "displayName": "Has Jump",
        "type": "string",
        "defaultValue": "noJump"
      },
      {
        "name": "_NO_ITEM_AT_",
        "displayName": "No Item At",
        "type": "string",
        "defaultValue": "noItemBoth"
      }
    ],
    "solutionCode": "// Parameters\nvar _MIN_STEPS_ = 3;\nvar _MAX_STEPS_ = 5;\nvar _INTERACTION_ = 'crystal'; // OPTIONS: crystal, switch, key, mixed, null\nvar _TURN_STYLE_ = 'straight'; // OPTIONS: straight, turnLeft, turnRight, uTurn, zTurn, randomLeftRight, random, null\nvar _TURN_POINT_ = 'null'; // OPTIONS: null, start, end, mid, random, null\nvar _HAS_JUMP_ = 'noJump'; // OPTIONS: random, withJump, noJump, null\nvar _NO_ITEM_AT_ = 'noItemBoth'; // OPTIONS: null, noItemStart, noItemEnd, noItemBoth, null\nvar LEN = random(_MIN_STEPS_, _MAX_STEPS_);\n\n// Solution\nfor (let i = 0; i < random(3, 4); i++) {\n    randomPattern(LEN, _INTERACTION_, _TURN_STYLE_, _TURN_POINT_, _HAS_JUMP_, _NO_ITEM_AT_, random(1, 99999));\n}",
    "descriptionMarkdown": "# Crystal Trail\n\nA simple path with crystals to collect. Perfect for learning basic movement commands.\n\n## Learning Goals\n- Understand sequential execution\n- Practice `moveForward()` command\n- Learn `collectItem()` command\n\n## Features\n\n- **Straight Path**: `_TURN_STYLE_ = 'straight'` ensures a single line\n- **No Joining Items**: `_NO_ITEM_AT_ = 'noItemStart'` prevents items at start position\n- **Safe Traversal**: `_HAS_JUMP_ = 'noJump'` keeps it simple for beginners\n\n## Solution & Parameters",
    "rawContent": "---\nid: crystal-trail-basic\nname: \"Crystal Trail: Basic\"\ncategory: sequential\nconcepts: [\"sequential\"]\ndifficulty: 1\ntags: [\"moveForward\", \"collectItem\", \"basic\"]\nauthor: system\nversion: 1\ndescription: \"Collect crystals along a straight path\"\n---\n\n# Crystal Trail\n\nA simple path with crystals to collect. Perfect for learning basic movement commands.\n\n## Learning Goals\n- Understand sequential execution\n- Practice `moveForward()` command\n- Learn `collectItem()` command\n\n## Features\n\n- **Straight Path**: `_TURN_STYLE_ = 'straight'` ensures a single line\n- **No Joining Items**: `_NO_ITEM_AT_ = 'noItemStart'` prevents items at start position\n- **Safe Traversal**: `_HAS_JUMP_ = 'noJump'` keeps it simple for beginners\n\n## Solution & Parameters\n\n```js\n// Parameters\nvar _MIN_STEPS_ = 3;\nvar _MAX_STEPS_ = 5;\nvar _INTERACTION_ = 'crystal'; // OPTIONS: crystal, switch, key, mixed, null\nvar _TURN_STYLE_ = 'straight'; // OPTIONS: straight, turnLeft, turnRight, uTurn, zTurn, randomLeftRight, random, null\nvar _TURN_POINT_ = 'null'; // OPTIONS: null, start, end, mid, random, null\nvar _HAS_JUMP_ = 'noJump'; // OPTIONS: random, withJump, noJump, null\nvar _NO_ITEM_AT_ = 'noItemBoth'; // OPTIONS: null, noItemStart, noItemEnd, noItemBoth, null\nvar LEN = random(_MIN_STEPS_, _MAX_STEPS_);\n\n// Solution\nfor (let i = 0; i < random(3, 4); i++) {\n    randomPattern(LEN, _INTERACTION_, _TURN_STYLE_, _TURN_POINT_, _HAS_JUMP_, _NO_ITEM_AT_, random(1, 99999));\n}\n```\n",
    "hints": {
      "title": "Crystal Trail",
      "description": "A simple path with crystals to collect. Perfect for learning basic movement commands.",
      "learningGoals": "- Understand sequential execution",
      "goalDetails": [
        "Practice `moveForward()` command",
        "Learn `collectItem()` command"
      ]
    }
  },
  {
    "metadata": {
      "id": "crystal-trail-turn",
      "name": "Crystal Trail: Turns",
      "category": "sequential",
      "concepts": [
        "sequential",
        "turns"
      ],
      "difficulty": 2,
      "tags": [
        "moveForward",
        "turnLeft",
        "turnRight",
        "collectItem"
      ],
      "author": "system",
      "version": 1,
      "description": "Collect crystals on a winding path with turns"
    },
    "parameters": [
      {
        "name": "_MIN_STEPS_",
        "displayName": "Min Steps",
        "type": "number",
        "defaultValue": 4
      },
      {
        "name": "_MAX_STEPS_",
        "displayName": "Max Steps",
        "type": "number",
        "defaultValue": 8
      },
      {
        "name": "_INTERACTION_",
        "displayName": "Interaction",
        "type": "string",
        "defaultValue": "crystal"
      },
      {
        "name": "_TURN_STYLE_",
        "displayName": "Turn Style",
        "type": "string",
        "defaultValue": "randomLeftRight"
      },
      {
        "name": "_TURN_POINT_",
        "displayName": "Turn Point",
        "type": "string",
        "defaultValue": "end"
      },
      {
        "name": "_HAS_JUMP_",
        "displayName": "Has Jump",
        "type": "string",
        "defaultValue": "noJump"
      },
      {
        "name": "_NO_ITEM_AT_",
        "displayName": "No Item At",
        "type": "string",
        "defaultValue": "noItemBoth"
      }
    ],
    "solutionCode": "// Parameters\n// Parameters\nvar _MIN_STEPS_ = 4;\nvar _MAX_STEPS_ = 8;\nvar _INTERACTION_ = 'crystal'; // OPTIONS: crystal, switch, key, mixed, null\nvar _TURN_STYLE_ = 'randomLeftRight'; // OPTIONS: straight, turnLeft, turnRight, uTurn, zTurn, randomLeftRight, random, null\nvar _TURN_POINT_ = 'end'; // OPTIONS: start, end, mid, random, null\nvar _HAS_JUMP_ = 'noJump'; // OPTIONS: random, withJump, noJump, null\nvar _NO_ITEM_AT_ = 'noItemBoth'; // OPTIONS: null, noItemStart, noItemEnd, noItemBoth, null\nvar LEN = random(_MIN_STEPS_, _MAX_STEPS_);\n\n// Solution\nfor (let i = 0; i < random(2, 4); i++) {\n    randomPattern(LEN, _INTERACTION_, _TURN_STYLE_, _TURN_POINT_, _HAS_JUMP_, _NO_ITEM_AT_, random(1, 99999));\n}",
    "descriptionMarkdown": "# Crystal Trail: Turns\n\nA winding path that requires the player to turn left and right to collect crystals.\n\n## Learning Goals\n- Practice `turnLeft()` and `turnRight()`\n- Navigate changing directions\n- Plan path ahead\n\n## Features\n\n- **Winding Path**: `_TURN_STYLE_ = 'randomLeftRight'` creates twists and turns\n- **No Jumps**: `_HAS_JUMP_ = 'noJump'` focuses solely on turning logistics\n- **Dynamic Turns**: `_TURN_POINT_ = 'random'` varies where turns occur\n\n## Solution & Parameters",
    "rawContent": "---\nid: crystal-trail-turn\nname: \"Crystal Trail: Turns\"\ncategory: sequential\nconcepts: [\"sequential\", \"turns\"]\ndifficulty: 2\ntags: [\"moveForward\", \"turnLeft\", \"turnRight\", \"collectItem\"]\nauthor: system\nversion: 1\ndescription: \"Collect crystals on a winding path with turns\"\n---\n\n# Crystal Trail: Turns\n\nA winding path that requires the player to turn left and right to collect crystals.\n\n## Learning Goals\n- Practice `turnLeft()` and `turnRight()`\n- Navigate changing directions\n- Plan path ahead\n\n## Features\n\n- **Winding Path**: `_TURN_STYLE_ = 'randomLeftRight'` creates twists and turns\n- **No Jumps**: `_HAS_JUMP_ = 'noJump'` focuses solely on turning logistics\n- **Dynamic Turns**: `_TURN_POINT_ = 'random'` varies where turns occur\n\n## Solution & Parameters\n\n```js\n// Parameters\n// Parameters\nvar _MIN_STEPS_ = 4;\nvar _MAX_STEPS_ = 8;\nvar _INTERACTION_ = 'crystal'; // OPTIONS: crystal, switch, key, mixed, null\nvar _TURN_STYLE_ = 'randomLeftRight'; // OPTIONS: straight, turnLeft, turnRight, uTurn, zTurn, randomLeftRight, random, null\nvar _TURN_POINT_ = 'end'; // OPTIONS: start, end, mid, random, null\nvar _HAS_JUMP_ = 'noJump'; // OPTIONS: random, withJump, noJump, null\nvar _NO_ITEM_AT_ = 'noItemBoth'; // OPTIONS: null, noItemStart, noItemEnd, noItemBoth, null\nvar LEN = random(_MIN_STEPS_, _MAX_STEPS_);\n\n// Solution\nfor (let i = 0; i < random(2, 4); i++) {\n    randomPattern(LEN, _INTERACTION_, _TURN_STYLE_, _TURN_POINT_, _HAS_JUMP_, _NO_ITEM_AT_, random(1, 99999));\n}\n```\n",
    "hints": {
      "title": "Crystal Trail: Turns",
      "description": "A winding path that requires the player to turn left and right to collect crystals.",
      "learningGoals": "- Practice `turnLeft()` and `turnRight()`",
      "goalDetails": [
        "Navigate changing directions",
        "Plan path ahead"
      ]
    }
  },
  {
    "metadata": {
      "id": "switch-island",
      "name": "Switch Islands",
      "category": "sequential",
      "concepts": [
        "sequential",
        "toggleSwitch",
        "exploration"
      ],
      "difficulty": 3,
      "tags": [
        "moveForward",
        "toggleSwitch",
        "jump"
      ],
      "author": "system",
      "version": 1,
      "description": "Navigate to switch islands branching off the main path"
    },
    "parameters": [
      {
        "name": "_MIN_STEPS_",
        "displayName": "Min Steps",
        "type": "number",
        "defaultValue": 4
      },
      {
        "name": "_MAX_STEPS_",
        "displayName": "Max Steps",
        "type": "number",
        "defaultValue": 6
      },
      {
        "name": "_INTERACTION_",
        "displayName": "Interaction",
        "type": "string",
        "defaultValue": "switch"
      },
      {
        "name": "_TURN_STYLE_",
        "displayName": "Turn Style",
        "type": "string",
        "defaultValue": "randomLeftRight"
      },
      {
        "name": "_TURN_POINT_",
        "displayName": "Turn Point",
        "type": "string",
        "defaultValue": "end"
      },
      {
        "name": "_HAS_JUMP_",
        "displayName": "Has Jump",
        "type": "string",
        "defaultValue": "noJump"
      },
      {
        "name": "_NO_ITEM_AT_",
        "displayName": "No Item At",
        "type": "string",
        "defaultValue": "noItemBoth"
      },
      {
        "name": "_PP_SHAPE_",
        "displayName": "Pp Shape",
        "type": "string",
        "defaultValue": "square"
      },
      {
        "name": "_PP_SIZE_MIN_",
        "displayName": "Pp Size Min",
        "type": "number",
        "defaultValue": 2
      },
      {
        "name": "_PP_SIZE_MAX_",
        "displayName": "Pp Size Max",
        "type": "number",
        "defaultValue": 3
      },
      {
        "name": "_PP_BIAS_",
        "displayName": "Pp Bias",
        "type": "string",
        "defaultValue": "left"
      },
      {
        "name": "_PP_MATERIAL_",
        "displayName": "Pp Material",
        "type": "string",
        "defaultValue": "grass"
      }
    ],
    "solutionCode": "// Parameters\nvar _MIN_STEPS_ = 4;\nvar _MAX_STEPS_ = 6;\nvar _INTERACTION_ = 'switch'; // OPTIONS: crystal, switch, key, mixed, null\nvar _TURN_STYLE_ = 'randomLeftRight'; // OPTIONS: straight, turnLeft, turnRight, uTurn, zTurn, randomLeftRight, random, null\nvar _TURN_POINT_ = 'end'; // OPTIONS: null, start, end, mid, random\nvar _HAS_JUMP_ = 'noJump'; // OPTIONS: random, withJump, noJump, null\nvar _NO_ITEM_AT_ = 'noItemBoth'; // OPTIONS: null, noItemStart, noItemEnd, noItemBoth\nvar LEN = random(_MIN_STEPS_, _MAX_STEPS_);\n\n// Solution: Create a path with switches\nfor (let i = 0; i < random(2, 4); i++) {\n    randomPattern(LEN, _INTERACTION_, _TURN_STYLE_, _TURN_POINT_, _HAS_JUMP_, _NO_ITEM_AT_, random(1, 99999));\n}\n\n// Post-Process Parameters\nvar _PP_SHAPE_ = 'square'; // OPTIONS: square, mountain, circle\nvar _PP_SIZE_MIN_ = 2; // OPTIONS: 2, 3, 4, 5\nvar _PP_SIZE_MAX_ = 3; // OPTIONS: 2, 3, 4, 5\nvar _PP_BIAS_ = 'left'; // OPTIONS: center, left, right\nvar _PP_MATERIAL_ = 'grass'; // OPTIONS: grass, stone, water, ice\n\n// Post-process: Extend square islands at each switch position\npostProcess({ \n    type: 'extendShape', \n    shape: _PP_SHAPE_, \n    size: [_PP_SIZE_MIN_, _PP_SIZE_MAX_], \n    bias: _PP_BIAS_,\n    levelMode: 'same',\n    material: _PP_MATERIAL_,\n    connectPath: true\n});",
    "descriptionMarkdown": "# Switch Islands\n\nA path with switches that extend into small island areas for exploration.\n\n## Learning Goals\n- Understanding branching paths\n- Toggle switches at specific locations\n- Spatial reasoning with side paths\n\n## Features\n\n- **Extended Areas**: `extendShape` creates exploration zones at switch locations\n- **Main + Side Paths**: Players follow main path and detour to islands\n- **3D Compatible**: Works with flat and elevated maps\n\n## Solution & Parameters",
    "rawContent": "---\nid: switch-island\nname: \"Switch Islands\"\ncategory: sequential\nconcepts: [\"sequential\", \"toggleSwitch\", \"exploration\"]\ndifficulty: 3\ntags: [\"moveForward\", \"toggleSwitch\", \"jump\"]\nauthor: system\nversion: 1\ndescription: \"Navigate to switch islands branching off the main path\"\n---\n\n# Switch Islands\n\nA path with switches that extend into small island areas for exploration.\n\n## Learning Goals\n- Understanding branching paths\n- Toggle switches at specific locations\n- Spatial reasoning with side paths\n\n## Features\n\n- **Extended Areas**: `extendShape` creates exploration zones at switch locations\n- **Main + Side Paths**: Players follow main path and detour to islands\n- **3D Compatible**: Works with flat and elevated maps\n\n## Solution & Parameters\n\n```js\n// Parameters\nvar _MIN_STEPS_ = 4;\nvar _MAX_STEPS_ = 6;\nvar _INTERACTION_ = 'switch'; // OPTIONS: crystal, switch, key, mixed, null\nvar _TURN_STYLE_ = 'randomLeftRight'; // OPTIONS: straight, turnLeft, turnRight, uTurn, zTurn, randomLeftRight, random, null\nvar _TURN_POINT_ = 'end'; // OPTIONS: null, start, end, mid, random\nvar _HAS_JUMP_ = 'noJump'; // OPTIONS: random, withJump, noJump, null\nvar _NO_ITEM_AT_ = 'noItemBoth'; // OPTIONS: null, noItemStart, noItemEnd, noItemBoth\nvar LEN = random(_MIN_STEPS_, _MAX_STEPS_);\n\n// Solution: Create a path with switches\nfor (let i = 0; i < random(2, 4); i++) {\n    randomPattern(LEN, _INTERACTION_, _TURN_STYLE_, _TURN_POINT_, _HAS_JUMP_, _NO_ITEM_AT_, random(1, 99999));\n}\n\n// Post-Process Parameters\nvar _PP_SHAPE_ = 'square'; // OPTIONS: square, mountain, circle\nvar _PP_SIZE_MIN_ = 2; // OPTIONS: 2, 3, 4, 5\nvar _PP_SIZE_MAX_ = 3; // OPTIONS: 2, 3, 4, 5\nvar _PP_BIAS_ = 'left'; // OPTIONS: center, left, right\nvar _PP_MATERIAL_ = 'grass'; // OPTIONS: grass, stone, water, ice\n\n// Post-process: Extend square islands at each switch position\npostProcess({ \n    type: 'extendShape', \n    shape: _PP_SHAPE_, \n    size: [_PP_SIZE_MIN_, _PP_SIZE_MAX_], \n    bias: _PP_BIAS_,\n    levelMode: 'same',\n    material: _PP_MATERIAL_,\n    connectPath: true\n});\n```\n",
    "hints": {
      "title": "Switch Islands",
      "description": "A path with switches that extend into small island areas for exploration.",
      "learningGoals": "- Understanding branching paths",
      "goalDetails": [
        "Toggle switches at specific locations",
        "Spatial reasoning with side paths"
      ]
    }
  },
  {
    "metadata": {
      "id": "switch-mountain",
      "name": "Switch Mountains",
      "category": "sequential",
      "concepts": [
        "sequential",
        "toggleSwitch",
        "exploration"
      ],
      "difficulty": 3,
      "tags": [
        "moveForward",
        "toggleSwitch",
        "jump"
      ],
      "author": "system",
      "version": 1,
      "description": "Navigate to switch islands branching off the main path"
    },
    "parameters": [
      {
        "name": "_MIN_STEPS_",
        "displayName": "Min Steps",
        "type": "number",
        "defaultValue": 4
      },
      {
        "name": "_MAX_STEPS_",
        "displayName": "Max Steps",
        "type": "number",
        "defaultValue": 6
      },
      {
        "name": "_INTERACTION_",
        "displayName": "Interaction",
        "type": "string",
        "defaultValue": "switch"
      },
      {
        "name": "_TURN_STYLE_",
        "displayName": "Turn Style",
        "type": "string",
        "defaultValue": "randomLeftRight"
      },
      {
        "name": "_TURN_POINT_",
        "displayName": "Turn Point",
        "type": "string",
        "defaultValue": "end"
      },
      {
        "name": "_HAS_JUMP_",
        "displayName": "Has Jump",
        "type": "string",
        "defaultValue": "noJump"
      },
      {
        "name": "_NO_ITEM_AT_",
        "displayName": "No Item At",
        "type": "string",
        "defaultValue": "noItemBoth"
      },
      {
        "name": "_PP_SHAPE_",
        "displayName": "Pp Shape",
        "type": "string",
        "defaultValue": "mountain"
      },
      {
        "name": "_PP_SIZE_MIN_",
        "displayName": "Pp Size Min",
        "type": "number",
        "defaultValue": 2
      },
      {
        "name": "_PP_SIZE_MAX_",
        "displayName": "Pp Size Max",
        "type": "number",
        "defaultValue": 5
      },
      {
        "name": "_PP_HEIGHT_MIN_",
        "displayName": "Pp Height Min",
        "type": "number",
        "defaultValue": 3
      },
      {
        "name": "_PP_HEIGHT_MAX_",
        "displayName": "Pp Height Max",
        "type": "number",
        "defaultValue": 5
      },
      {
        "name": "_PP_BIAS_",
        "displayName": "Pp Bias",
        "type": "string",
        "defaultValue": "right"
      },
      {
        "name": "_PP_MATERIAL_",
        "displayName": "Pp Material",
        "type": "string",
        "defaultValue": "stone"
      }
    ],
    "solutionCode": "// Parameters\nvar _MIN_STEPS_ = 4;\nvar _MAX_STEPS_ = 6;\nvar _INTERACTION_ = 'switch'; // OPTIONS: crystal, switch, key, mixed, null\nvar _TURN_STYLE_ = 'randomLeftRight'; // OPTIONS: straight, turnLeft, turnRight, uTurn, zTurn, randomLeftRight, random, null\nvar _TURN_POINT_ = 'end'; // OPTIONS: null, start, end, mid, random\nvar _HAS_JUMP_ = 'noJump'; // OPTIONS: random, withJump, noJump, null\nvar _NO_ITEM_AT_ = 'noItemBoth'; // OPTIONS: null, noItemStart, noItemEnd, noItemBoth\nvar LEN = random(_MIN_STEPS_, _MAX_STEPS_);\n\n// Solution: Create a path with switches\nfor (let i = 0; i < random(2, 4); i++) {\n    randomPattern(LEN, _INTERACTION_, _TURN_STYLE_, _TURN_POINT_, _HAS_JUMP_, _NO_ITEM_AT_, random(1, 99999));\n}\n\n// Post-Process Parameters\nvar _PP_SHAPE_ = 'mountain'; // OPTIONS: square, mountain, circle\nvar _PP_SIZE_MIN_ = 2;\nvar _PP_SIZE_MAX_ = 5;\nvar _PP_HEIGHT_MIN_ = 3;\nvar _PP_HEIGHT_MAX_ = 5;\nvar _PP_BIAS_ = 'right'; // OPTIONS: center, left, right\nvar _PP_MATERIAL_ = 'stone'; // OPTIONS: grass, stone, water, ice\n\n// Post-process: Extend square islands at each switch position\npostProcess({ \n    type: 'extendShape', \n    shape: _PP_SHAPE_, \n    size: [_PP_SIZE_MIN_, _PP_SIZE_MAX_], \n    height: [_PP_HEIGHT_MIN_, _PP_HEIGHT_MAX_],\n    bias: _PP_BIAS_,\n    levelMode: 'same',\n    material: _PP_MATERIAL_,\n    connectPath: true\n});\n\n// Add trees to non-path positions\npostProcess({ \n    type: 'addTrees', \n    count: [3, 5],        // Min và max số cây\n    treeTypes: ['tree.tree01', 'tree.tree02', 'tree.tree03', 'tree.tree04', 'tree.tree05'],\n    excludePath: true     // Không đặt trên path\n});",
    "descriptionMarkdown": "# Switch Mountains\n\nA path with switches that extend into mountainous areas for exploration.\n\n## Learning Goals\n- Understanding branching paths\n- Toggle switches at specific locations\n- Spatial reasoning with side paths\n\n## Features\n\n- **Extended Areas**: `extendShape` creates exploration zones at switch locations\n- **Main + Side Paths**: Players follow main path and detour to mountains\n- **3D Compatible**: Works with flat and elevated maps\n\n## Solution & Parameters",
    "rawContent": "---\nid: switch-mountain\nname: \"Switch Mountains\"\ncategory: sequential\nconcepts: [\"sequential\", \"toggleSwitch\", \"exploration\"]\ndifficulty: 3\ntags: [\"moveForward\", \"toggleSwitch\", \"jump\"]\nauthor: system\nversion: 1\ndescription: \"Navigate to switch islands branching off the main path\"\n---\n\n# Switch Mountains\n\nA path with switches that extend into mountainous areas for exploration.\n\n## Learning Goals\n- Understanding branching paths\n- Toggle switches at specific locations\n- Spatial reasoning with side paths\n\n## Features\n\n- **Extended Areas**: `extendShape` creates exploration zones at switch locations\n- **Main + Side Paths**: Players follow main path and detour to mountains\n- **3D Compatible**: Works with flat and elevated maps\n\n## Solution & Parameters\n\n```js\n// Parameters\nvar _MIN_STEPS_ = 4;\nvar _MAX_STEPS_ = 6;\nvar _INTERACTION_ = 'switch'; // OPTIONS: crystal, switch, key, mixed, null\nvar _TURN_STYLE_ = 'randomLeftRight'; // OPTIONS: straight, turnLeft, turnRight, uTurn, zTurn, randomLeftRight, random, null\nvar _TURN_POINT_ = 'end'; // OPTIONS: null, start, end, mid, random\nvar _HAS_JUMP_ = 'noJump'; // OPTIONS: random, withJump, noJump, null\nvar _NO_ITEM_AT_ = 'noItemBoth'; // OPTIONS: null, noItemStart, noItemEnd, noItemBoth\nvar LEN = random(_MIN_STEPS_, _MAX_STEPS_);\n\n// Solution: Create a path with switches\nfor (let i = 0; i < random(2, 4); i++) {\n    randomPattern(LEN, _INTERACTION_, _TURN_STYLE_, _TURN_POINT_, _HAS_JUMP_, _NO_ITEM_AT_, random(1, 99999));\n}\n\n// Post-Process Parameters\nvar _PP_SHAPE_ = 'mountain'; // OPTIONS: square, mountain, circle\nvar _PP_SIZE_MIN_ = 2;\nvar _PP_SIZE_MAX_ = 5;\nvar _PP_HEIGHT_MIN_ = 3;\nvar _PP_HEIGHT_MAX_ = 5;\nvar _PP_BIAS_ = 'right'; // OPTIONS: center, left, right\nvar _PP_MATERIAL_ = 'stone'; // OPTIONS: grass, stone, water, ice\n\n// Post-process: Extend square islands at each switch position\npostProcess({ \n    type: 'extendShape', \n    shape: _PP_SHAPE_, \n    size: [_PP_SIZE_MIN_, _PP_SIZE_MAX_], \n    height: [_PP_HEIGHT_MIN_, _PP_HEIGHT_MAX_],\n    bias: _PP_BIAS_,\n    levelMode: 'same',\n    material: _PP_MATERIAL_,\n    connectPath: true\n});\n\n// Add trees to non-path positions\npostProcess({ \n    type: 'addTrees', \n    count: [3, 5],        // Min và max số cây\n    treeTypes: ['tree.tree01', 'tree.tree02', 'tree.tree03', 'tree.tree04', 'tree.tree05'],\n    excludePath: true     // Không đặt trên path\n});\n```\n",
    "hints": {
      "title": "Switch Mountains",
      "description": "A path with switches that extend into mountainous areas for exploration.",
      "learningGoals": "- Understanding branching paths",
      "goalDetails": [
        "Toggle switches at specific locations",
        "Spatial reasoning with side paths"
      ]
    }
  },
  {
    "metadata": {
      "id": "var-accumulator",
      "name": "Accumulator Variable",
      "category": "variable",
      "concepts": [
        "accumulator",
        "variable"
      ],
      "difficulty": 3,
      "tags": [
        "variable",
        "sum",
        "accumulator"
      ],
      "author": "system",
      "version": 3,
      "description": "Use an accumulator to collect increasing amounts"
    },
    "parameters": [
      {
        "name": "_MIN_ROUNDS_",
        "displayName": "Min Rounds",
        "type": "number",
        "defaultValue": 3
      },
      {
        "name": "_MAX_ROUNDS_",
        "displayName": "Max Rounds",
        "type": "number",
        "defaultValue": 5
      },
      {
        "name": "_INTERACTION_",
        "displayName": "Interaction",
        "type": "string",
        "defaultValue": "crystal"
      },
      {
        "name": "_TURN_STYLE_",
        "displayName": "Turn Style",
        "type": "string",
        "defaultValue": "straight"
      },
      {
        "name": "_TURN_POINT_",
        "displayName": "Turn Point",
        "type": "string",
        "defaultValue": "null"
      },
      {
        "name": "_HAS_JUMP_",
        "displayName": "Has Jump",
        "type": "string",
        "defaultValue": "noJump"
      },
      {
        "name": "_NO_ITEM_AT_",
        "displayName": "No Item At",
        "type": "string",
        "defaultValue": "null"
      },
      {
        "name": "_SEED_",
        "displayName": "Seed",
        "type": "int",
        "defaultValue": 1,
        "min": 1,
        "max": 99999
      }
    ],
    "solutionCode": "// Parameters\nvar _MIN_ROUNDS_ = 3;\nvar _MAX_ROUNDS_ = 5;\nvar ROUNDS = random(_MIN_ROUNDS_, _MAX_ROUNDS_);\n\n// Full Parameter Set (Standardized)\nvar _INTERACTION_ = 'crystal'; // OPTIONS: crystal, switch, key, mixed, null\nvar _TURN_STYLE_ = 'straight'; // OPTIONS: straight, turnLeft, turnRight, uTurn, zTurn, randomLeftRight, random, null\nvar _TURN_POINT_ = 'null'; // OPTIONS: null, start, end, mid, random, null\nvar _HAS_JUMP_ = 'noJump'; // OPTIONS: random, withJump, noJump, null\nvar _NO_ITEM_AT_ = 'null'; // OPTIONS: null, noItemStart, noItemEnd, noItemBoth, null\nvar _SEED_ = random(1, 99999);\n\n// Solution\nfor (let round = 0; round < ROUNDS; round++) {\n  let collectCount = round + 1; // Accumulator / increasing value\n  \n  // Generate segment of increasing length\n  randomPattern(collectCount, _INTERACTION_, true, 0, 'straight', _TURN_STYLE_, _TURN_POINT_, _HAS_JUMP_, _NO_ITEM_AT_, _SEED_ + round);\n  \n  // Alternate turn direction to create zigzag\n  if (round % 2 == 0) {\n    turnRight();\n  } else {\n    turnLeft();\n  }\n}",
    "descriptionMarkdown": "# Accumulator Variable\n\nUse a variable to accumulate values (like sum = sum + i).\n\n## Learning Goals\n- Understand accumulator pattern\n- Update variable inside loop\n- Track running total\n\n## Features\n- **Accumulator Pattern**: Length of segment increases each round (1, 2, 3...).\n- **Variable Update**: Demonstrates `collectCount` derived from loop variable.\n\n## Solution & Parameters",
    "rawContent": "---\nid: var-accumulator\nname: \"Accumulator Variable\"\ncategory: variable\nconcepts: [\"accumulator\", \"variable\"]\ndifficulty: 3\ntags: [\"variable\", \"sum\", \"accumulator\"]\nauthor: system\nversion: 3\ndescription: \"Use an accumulator to collect increasing amounts\"\n---\n\n# Accumulator Variable\n\nUse a variable to accumulate values (like sum = sum + i).\n\n## Learning Goals\n- Understand accumulator pattern\n- Update variable inside loop\n- Track running total\n\n## Features\n- **Accumulator Pattern**: Length of segment increases each round (1, 2, 3...).\n- **Variable Update**: Demonstrates `collectCount` derived from loop variable.\n\n## Solution & Parameters\n\n```js\n// Parameters\nvar _MIN_ROUNDS_ = 3;\nvar _MAX_ROUNDS_ = 5;\nvar ROUNDS = random(_MIN_ROUNDS_, _MAX_ROUNDS_);\n\n// Full Parameter Set (Standardized)\nvar _INTERACTION_ = 'crystal'; // OPTIONS: crystal, switch, key, mixed, null\nvar _TURN_STYLE_ = 'straight'; // OPTIONS: straight, turnLeft, turnRight, uTurn, zTurn, randomLeftRight, random, null\nvar _TURN_POINT_ = 'null'; // OPTIONS: null, start, end, mid, random, null\nvar _HAS_JUMP_ = 'noJump'; // OPTIONS: random, withJump, noJump, null\nvar _NO_ITEM_AT_ = 'null'; // OPTIONS: null, noItemStart, noItemEnd, noItemBoth, null\nvar _SEED_ = random(1, 99999);\n\n// Solution\nfor (let round = 0; round < ROUNDS; round++) {\n  let collectCount = round + 1; // Accumulator / increasing value\n  \n  // Generate segment of increasing length\n  randomPattern(collectCount, _INTERACTION_, true, 0, 'straight', _TURN_STYLE_, _TURN_POINT_, _HAS_JUMP_, _NO_ITEM_AT_, _SEED_ + round);\n  \n  // Alternate turn direction to create zigzag\n  if (round % 2 == 0) {\n    turnRight();\n  } else {\n    turnLeft();\n  }\n}\n```\n",
    "hints": {
      "title": "Accumulator Variable",
      "description": "Use a variable to accumulate values (like sum = sum + i).",
      "learningGoals": "- Understand accumulator pattern",
      "goalDetails": [
        "Update variable inside loop",
        "Track running total"
      ]
    }
  },
  {
    "metadata": {
      "id": "var-counter",
      "name": "Counter Variable",
      "category": "variable",
      "concepts": [
        "counter",
        "variable"
      ],
      "difficulty": 2,
      "tags": [
        "variable",
        "counter",
        "accumulator"
      ],
      "author": "system",
      "version": 1,
      "description": "Use a counter variable to track collected crystals"
    },
    "parameters": [
      {
        "name": "_MIN_COUNT_",
        "displayName": "Min Count",
        "type": "number",
        "defaultValue": 3
      },
      {
        "name": "_MAX_COUNT_",
        "displayName": "Max Count",
        "type": "number",
        "defaultValue": 6
      },
      {
        "name": "_INTERACTION_",
        "displayName": "Interaction",
        "type": "string",
        "defaultValue": "crystal"
      },
      {
        "name": "_TURN_STYLE_",
        "displayName": "Turn Style",
        "type": "string",
        "defaultValue": "straight"
      },
      {
        "name": "_TURN_POINT_",
        "displayName": "Turn Point",
        "type": "string",
        "defaultValue": "null"
      },
      {
        "name": "_HAS_JUMP_",
        "displayName": "Has Jump",
        "type": "string",
        "defaultValue": "noJump"
      },
      {
        "name": "_NO_ITEM_AT_",
        "displayName": "No Item At",
        "type": "string",
        "defaultValue": "null"
      },
      {
        "name": "_SEED_",
        "displayName": "Seed",
        "type": "int",
        "defaultValue": 1,
        "min": 1,
        "max": 99999
      }
    ],
    "solutionCode": "// Parameters\nvar _MIN_COUNT_ = 3;\nvar _MAX_COUNT_ = 6;\nvar COUNT = random(_MIN_COUNT_, _MAX_COUNT_);\n\n// Full Parameter Set (Standardized)\nvar _INTERACTION_ = 'crystal'; // OPTIONS: crystal, switch, key, mixed, null\nvar _TURN_STYLE_ = 'straight'; // OPTIONS: straight, turnLeft, turnRight, uTurn, zTurn, randomLeftRight, random, null\nvar _TURN_POINT_ = 'null'; // OPTIONS: null, start, end, mid, random, null\nvar _HAS_JUMP_ = 'noJump'; // OPTIONS: random, withJump, noJump, null\nvar _NO_ITEM_AT_ = 'null'; // OPTIONS: null, noItemStart, noItemEnd, noItemBoth, null\nvar _SEED_ = random(1, 99999);\n\n// Solution\n// Use counter to collect COUNT items\nfor (let i = 0; i < COUNT; i++) {\n  randomPattern(1, _INTERACTION_, true, 0, 'straight', _TURN_STYLE_, _TURN_POINT_, _HAS_JUMP_, _NO_ITEM_AT_, _SEED_ + i);\n}",
    "descriptionMarkdown": "# Counter Variable\n\nLearn to use a variable as a counter to track progress.\n\n## Learning Goals\n- Understand variable concept\n- Increment a counter\n- Use counter in loop\n\n## Features\n- **Counter Variable**: Validates that loop count matches variable.\n- **Simple Loop**: Standard iteration.\n\n## Solution & Parameters",
    "rawContent": "---\nid: var-counter\nname: \"Counter Variable\"\ncategory: variable\nconcepts: [\"counter\", \"variable\"]\ndifficulty: 2\ntags: [\"variable\", \"counter\", \"accumulator\"]\nauthor: system\nversion: 1\ndescription: \"Use a counter variable to track collected crystals\"\n---\n\n# Counter Variable\n\nLearn to use a variable as a counter to track progress.\n\n## Learning Goals\n- Understand variable concept\n- Increment a counter\n- Use counter in loop\n\n## Features\n- **Counter Variable**: Validates that loop count matches variable.\n- **Simple Loop**: Standard iteration.\n\n## Solution & Parameters\n\n```js\n// Parameters\nvar _MIN_COUNT_ = 3;\nvar _MAX_COUNT_ = 6;\nvar COUNT = random(_MIN_COUNT_, _MAX_COUNT_);\n\n// Full Parameter Set (Standardized)\nvar _INTERACTION_ = 'crystal'; // OPTIONS: crystal, switch, key, mixed, null\nvar _TURN_STYLE_ = 'straight'; // OPTIONS: straight, turnLeft, turnRight, uTurn, zTurn, randomLeftRight, random, null\nvar _TURN_POINT_ = 'null'; // OPTIONS: null, start, end, mid, random, null\nvar _HAS_JUMP_ = 'noJump'; // OPTIONS: random, withJump, noJump, null\nvar _NO_ITEM_AT_ = 'null'; // OPTIONS: null, noItemStart, noItemEnd, noItemBoth, null\nvar _SEED_ = random(1, 99999);\n\n// Solution\n// Use counter to collect COUNT items\nfor (let i = 0; i < COUNT; i++) {\n  randomPattern(1, _INTERACTION_, true, 0, 'straight', _TURN_STYLE_, _TURN_POINT_, _HAS_JUMP_, _NO_ITEM_AT_, _SEED_ + i);\n}\n```\n",
    "hints": {
      "title": "Counter Variable",
      "description": "Learn to use a variable as a counter to track progress.",
      "learningGoals": "- Understand variable concept",
      "goalDetails": [
        "Increment a counter",
        "Use counter in loop"
      ]
    }
  }
];
