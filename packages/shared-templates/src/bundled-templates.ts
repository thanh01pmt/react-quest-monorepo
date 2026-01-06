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
      "version": 1,
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
        "defaultValue": 6
      }
    ],
    "solutionCode": "// Parameters\nvar _MIN_PATH_LENGTH_ = 3;\nvar _MAX_PATH_LENGTH_ = 6;\nvar PATH_LENGTH = random(_MIN_PATH_LENGTH_, _MAX_PATH_LENGTH_);\n\n// Solution\nmoveForward();\n\nfor (let i = 0; i < PATH_LENGTH; i++) {\n  if (isOnCrystal()) {\n    collectItem();\n  } else if (isOnSwitch()) {\n    toggleSwitch();\n  }\n  moveForward();\n}\n\nmoveForward();",
    "descriptionMarkdown": "# Crystal or Switch\n\nLearn to make decisions based on what's in front of you.\n\n## Learning Goals\n- Use if-else for decision making\n- Detect items in the environment\n- Choose correct action based on condition\n\n## Solution & Parameters",
    "rawContent": "---\nid: crystal-or-switch\nname: \"Crystal or Switch\"\ncategory: conditional\nconcepts: [\"if_else\"]\ndifficulty: 4\ntags: [\"if\", \"else\", \"detect\"]\nauthor: system\nversion: 1\ndescription: \"Decide whether to collect crystal or activate switch\"\n---\n\n# Crystal or Switch\n\nLearn to make decisions based on what's in front of you.\n\n## Learning Goals\n- Use if-else for decision making\n- Detect items in the environment\n- Choose correct action based on condition\n\n## Solution & Parameters\n\n```js\n// Parameters\nvar _MIN_PATH_LENGTH_ = 3;\nvar _MAX_PATH_LENGTH_ = 6;\nvar PATH_LENGTH = random(_MIN_PATH_LENGTH_, _MAX_PATH_LENGTH_);\n\n// Solution\nmoveForward();\n\nfor (let i = 0; i < PATH_LENGTH; i++) {\n  if (isOnCrystal()) {\n    collectItem();\n  } else if (isOnSwitch()) {\n    toggleSwitch();\n  }\n  moveForward();\n}\n\nmoveForward();\n```\n"
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
      "version": 1,
      "description": "Draw petals around a center point"
    },
    "parameters": [
      {
        "name": "_MIN_LEN_",
        "displayName": "Min Len",
        "type": "number",
        "defaultValue": 2
      },
      {
        "name": "_MAX_LEN_",
        "displayName": "Max Len",
        "type": "number",
        "defaultValue": 3
      }
    ],
    "solutionCode": "// Parameters\nvar _MIN_LEN_ = 2;\nvar _MAX_LEN_ = 3;\nvar LEN = random(_MIN_LEN_, _MAX_LEN_);\n\n// Helper function\nfunction turnAround() {\n  turnRight();\n  turnRight();\n}\n\n// Solution\nfunction drawPetal() {\n  // Go out\n  for(let i=0; i<LEN; i++) { \n    moveForward(); \n    collectItem(); \n  }\n  // Return\n  turnAround();\n  for(let i=0; i<LEN; i++) { \n    moveForward(); \n  }\n  // Face next direction (90 deg rot)\n  turnAround();\n  turnRight();\n}\n\n// Main\nfor(let k=0; k<4; k++) {\n  drawPetal();\n}",
    "descriptionMarkdown": "# Flower Pattern\n\nA radial pattern where the code draws a \"petal\" and returns to center.\n\n## Academic Concept: Radial Symmetry / Reset State\n- Function must Perform Action AND Return to initial state (Center, Facing Out) to be reusable in a loop.\n\n## Solution & Parameters",
    "rawContent": "---\nid: decomp-flower\nname: \"Flower Pattern\"\ncategory: decomposition\nconcepts: [\"function\", \"geometry\", \"nested_loop\"]\ndifficulty: 5\ntags: [\"function\", \"pattern\", \"radial\"]\nauthor: system\nversion: 1\ndescription: \"Draw petals around a center point\"\n---\n\n# Flower Pattern\n\nA radial pattern where the code draws a \"petal\" and returns to center.\n\n## Academic Concept: Radial Symmetry / Reset State\n- Function must Perform Action AND Return to initial state (Center, Facing Out) to be reusable in a loop.\n\n## Solution & Parameters\n\n```js\n// Parameters\nvar _MIN_LEN_ = 2;\nvar _MAX_LEN_ = 3;\nvar LEN = random(_MIN_LEN_, _MAX_LEN_);\n\n// Helper function\nfunction turnAround() {\n  turnRight();\n  turnRight();\n}\n\n// Solution\nfunction drawPetal() {\n  // Go out\n  for(let i=0; i<LEN; i++) { \n    moveForward(); \n    collectItem(); \n  }\n  // Return\n  turnAround();\n  for(let i=0; i<LEN; i++) { \n    moveForward(); \n  }\n  // Face next direction (90 deg rot)\n  turnAround();\n  turnRight();\n}\n\n// Main\nfor(let k=0; k<4; k++) {\n  drawPetal();\n}\n```\n"
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
      "version": 1,
      "description": "Use a 'Side' function to draw a square"
    },
    "parameters": [
      {
        "name": "_MIN_LEN_",
        "displayName": "Min Len",
        "type": "number",
        "defaultValue": 2
      },
      {
        "name": "_MAX_LEN_",
        "displayName": "Max Len",
        "type": "number",
        "defaultValue": 4
      }
    ],
    "solutionCode": "// Parameters\nvar _MIN_LEN_ = 2;\nvar _MAX_LEN_ = 4;\nvar LEN = random(_MIN_LEN_, _MAX_LEN_);\n\n// Solution\nfunction drawSide() {\n  for(let i=0; i<LEN; i++) {\n    collectItem();\n    moveForward();\n  }\n  turnRight();\n}\n\n// Main logic\nfor(let k=0; k<4; k++) {\n  drawSide();\n}",
    "descriptionMarkdown": "# Square Function\n\nDecompose the square into 4 identical sides.\n\n## Academic Concept: Decomposition\n- Complex Task: Draw Square\n- Sub-Task: Draw Line + Turn\n- Composition: Repeat(Sub-Task, 4)\n\n## Solution & Parameters",
    "rawContent": "---\nid: decomp-square\nname: \"Square Function\"\ncategory: decomposition\nconcepts: [\"function\", \"geometry\"]\ndifficulty: 3\ntags: [\"function\", \"reuse\", \"square\"]\nauthor: system\nversion: 1\ndescription: \"Use a 'Side' function to draw a square\"\n---\n\n# Square Function\n\nDecompose the square into 4 identical sides.\n\n## Academic Concept: Decomposition\n- Complex Task: Draw Square\n- Sub-Task: Draw Line + Turn\n- Composition: Repeat(Sub-Task, 4)\n\n## Solution & Parameters\n\n```js\n// Parameters\nvar _MIN_LEN_ = 2;\nvar _MAX_LEN_ = 4;\nvar LEN = random(_MIN_LEN_, _MAX_LEN_);\n\n// Solution\nfunction drawSide() {\n  for(let i=0; i<LEN; i++) {\n    collectItem();\n    moveForward();\n  }\n  turnRight();\n}\n\n// Main logic\nfor(let k=0; k<4; k++) {\n  drawSide();\n}\n```\n"
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
      "version": 1,
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
        "defaultValue": 6
      }
    ],
    "solutionCode": "// Parameters\nvar _MIN_HEIGHT_ = 3;\nvar _MAX_HEIGHT_ = 6;\nvar HEIGHT = random(_MIN_HEIGHT_, _MAX_HEIGHT_);\n\n// Solution\nfunction climbStep() {\n  moveForward();\n  jump();\n  moveForward();\n  collectItem();\n}\n\n// Main\nfor(let i=0; i<HEIGHT; i++) {\n  climbStep();\n}",
    "descriptionMarkdown": "# Staircase Function\n\nDecompose climbing into a single \"Step Up\" action.\n\n## Academic Concept: Procedural Abstraction\n- Abstract \"Move, Jump, Move\" into \"ClimbStep()\"\n\n## Solution & Parameters",
    "rawContent": "---\nid: decomp-stair\nname: \"Staircase Function\"\ncategory: decomposition\nconcepts: [\"function\", \"procedure\"]\ndifficulty: 3\ntags: [\"function\", \"staircase\", \"automation\"]\nauthor: system\nversion: 1\ndescription: \"Use a 'Step' function to climb a staircase\"\n---\n\n# Staircase Function\n\nDecompose climbing into a single \"Step Up\" action.\n\n## Academic Concept: Procedural Abstraction\n- Abstract \"Move, Jump, Move\" into \"ClimbStep()\"\n\n## Solution & Parameters\n\n```js\n// Parameters\nvar _MIN_HEIGHT_ = 3;\nvar _MAX_HEIGHT_ = 6;\nvar HEIGHT = random(_MIN_HEIGHT_, _MAX_HEIGHT_);\n\n// Solution\nfunction climbStep() {\n  moveForward();\n  jump();\n  moveForward();\n  collectItem();\n}\n\n// Main\nfor(let i=0; i<HEIGHT; i++) {\n  climbStep();\n}\n```\n"
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
      }
    ],
    "solutionCode": "// Parameters\nvar _MIN_COLLECTION_COUNT_ = 3;\nvar _MAX_COLLECTION_COUNT_ = 6;\nvar COLLECTION_COUNT = random(_MIN_COLLECTION_COUNT_, _MAX_COLLECTION_COUNT_);\n\n// Solution\nfunction collectAndMove() {\n  collectItem();\n  moveForward();\n}\n\n// Use the procedure\nmoveForward();\n\nfor (let i = 0; i < COLLECTION_COUNT; i++) {\n  collectAndMove();\n}\n\nmoveForward();",
    "descriptionMarkdown": "# Collect Procedure\n\nCreate a reusable procedure for the collect-and-move pattern.\n\n## Learning Goals\n- Define custom procedures\n- Call procedures to reduce code\n- Understand code reuse\n\n## Solution & Parameters",
    "rawContent": "---\nid: collect-procedure\nname: \"Collect Procedure\"\ncategory: function\nconcepts: [\"procedure_simple\"]\ndifficulty: 4\ntags: [\"procedure\", \"function\", \"reuse\"]\nauthor: system\nversion: 1\ndescription: \"Create and use a procedure for collecting items\"\n---\n\n# Collect Procedure\n\nCreate a reusable procedure for the collect-and-move pattern.\n\n## Learning Goals\n- Define custom procedures\n- Call procedures to reduce code\n- Understand code reuse\n\n## Solution & Parameters\n\n```js\n// Parameters\nvar _MIN_COLLECTION_COUNT_ = 3;\nvar _MAX_COLLECTION_COUNT_ = 6;\nvar COLLECTION_COUNT = random(_MIN_COLLECTION_COUNT_, _MAX_COLLECTION_COUNT_);\n\n// Solution\nfunction collectAndMove() {\n  collectItem();\n  moveForward();\n}\n\n// Use the procedure\nmoveForward();\n\nfor (let i = 0; i < COLLECTION_COUNT; i++) {\n  collectAndMove();\n}\n\nmoveForward();\n```\n"
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
      "version": 1,
      "description": "Define and call a simple function"
    },
    "parameters": [
      {
        "name": "_MIN_PER_CALL_",
        "displayName": "Min Per Call",
        "type": "number",
        "defaultValue": 1
      },
      {
        "name": "_MAX_PER_CALL_",
        "displayName": "Max Per Call",
        "type": "number",
        "defaultValue": 3
      },
      {
        "name": "_MIN_CALLS_",
        "displayName": "Min Calls",
        "type": "number",
        "defaultValue": 2
      },
      {
        "name": "_MAX_CALLS_",
        "displayName": "Max Calls",
        "type": "number",
        "defaultValue": 4
      }
    ],
    "solutionCode": "// Parameters\nvar _MIN_PER_CALL_ = 1;\nvar _MAX_PER_CALL_ = 3;\nvar _MIN_CALLS_ = 2;\nvar _MAX_CALLS_ = 4;\nvar PER_CALL = random(_MIN_PER_CALL_, _MAX_PER_CALL_);\nvar CALLS = random(_MIN_CALLS_, _MAX_CALLS_);\n\n// Solution\nfunction collectItems() {\n  for (let i = 0; i < PER_CALL; i++) {\n    collectItem();\n    moveForward();\n  }\n}\n\nmoveForward();\n\nfor (let c = 0; c < CALLS; c++) {\n  collectItems();\n  turnRight();\n}\n\nmoveForward();",
    "descriptionMarkdown": "# Simple Function\n\nLearn to define and call functions to organize your code.\n\n## Learning Goals\n- Define a function\n- Call a function multiple times\n- Understand code reuse\n\n## Solution & Parameters",
    "rawContent": "---\nid: simple-function\nname: \"Simple Function\"\ncategory: function\nconcepts: [\"procedure_simple\"]\ndifficulty: 3\ntags: [\"function\", \"procedure\", \"reuse\", \"define\"]\nauthor: system\nversion: 1\ndescription: \"Define and call a simple function\"\n---\n\n# Simple Function\n\nLearn to define and call functions to organize your code.\n\n## Learning Goals\n- Define a function\n- Call a function multiple times\n- Understand code reuse\n\n## Solution & Parameters\n\n```js\n// Parameters\nvar _MIN_PER_CALL_ = 1;\nvar _MAX_PER_CALL_ = 3;\nvar _MIN_CALLS_ = 2;\nvar _MAX_CALLS_ = 4;\nvar PER_CALL = random(_MIN_PER_CALL_, _MAX_PER_CALL_);\nvar CALLS = random(_MIN_CALLS_, _MAX_CALLS_);\n\n// Solution\nfunction collectItems() {\n  for (let i = 0; i < PER_CALL; i++) {\n    collectItem();\n    moveForward();\n  }\n}\n\nmoveForward();\n\nfor (let c = 0; c < CALLS; c++) {\n  collectItems();\n  turnRight();\n}\n\nmoveForward();\n```\n"
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
        "defaultValue": 5
      }
    ],
    "solutionCode": "// Parameters\nvar _MIN_COUNT_ = 3;\nvar _MAX_COUNT_ = 5;\nvar COUNT = random(_MIN_COUNT_, _MAX_COUNT_);\n\n// Solution\nfunction zigZagStep() {\n  moveForward();\n  turnRight();\n  moveForward();\n  turnLeft();\n  collectItem();\n}\n\nmoveForward();\n\nfor (let i = 0; i < COUNT; i++) {\n  zigZagStep();\n}\n\nmoveForward();",
    "descriptionMarkdown": "# Zigzag Procedure\n\nDefine a function for a complex movement pattern and reuse it.\n\n## Solution & Parameters",
    "rawContent": "---\nid: zigzag-procedure\nname: \"Zigzag Procedure\"\ncategory: function\nconcepts: [\"procedure_simple\"]\ndifficulty: 4\ntags: [\"procedure\", \"function\", \"zigzag\"]\nauthor: system\nversion: 1\ndescription: \"Create a reusable function to move in a zigzag\"\n---\n\n# Zigzag Procedure\n\nDefine a function for a complex movement pattern and reuse it.\n\n## Solution & Parameters\n\n```js\n// Parameters\nvar _MIN_COUNT_ = 3;\nvar _MAX_COUNT_ = 5;\nvar COUNT = random(_MIN_COUNT_, _MAX_COUNT_);\n\n// Solution\nfunction zigZagStep() {\n  moveForward();\n  turnRight();\n  moveForward();\n  turnLeft();\n  collectItem();\n}\n\nmoveForward();\n\nfor (let i = 0; i < COUNT; i++) {\n  zigZagStep();\n}\n\nmoveForward();\n```\n"
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
      "version": 1,
      "description": "Alternate between collecting Item and toggling Switch"
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
      }
    ],
    "solutionCode": "// Parameters\nvar _MIN_PAIRS_ = 3;\nvar _MAX_PAIRS_ = 5;\nvar PAIRS = random(_MIN_PAIRS_, _MAX_PAIRS_);\nvar STEPS = PAIRS * 2;\n\n// Solution\nfor (let i = 0; i < PAIRS; i++) {\n  // Even Step (Crystal)\n  moveForward();\n  collectItem();\n  \n  // Odd Step (Switch)\n  moveForward();\n  toggleSwitch();\n}",
    "descriptionMarkdown": "# Alternating Interaction\n\nA complex task requiring the student to recognize two interleaved patterns.\n\n## Academic Concept: Parity (Modulo 2)\n- Even steps: Collect Crystal\n- Odd steps: Toggle Switch\n\n## Solution & Parameters",
    "rawContent": "---\nid: logic-alt-interact\nname: \"Alternating Interaction\"\ncategory: logic\nconcepts: [\"loop\", \"conditional\", \"modulo\"]\ndifficulty: 4\ntags: [\"logic\", \"parity\", \"switch\", \"collect\"]\nauthor: system\nversion: 1\ndescription: \"Alternate between collecting Item and toggling Switch\"\n---\n\n# Alternating Interaction\n\nA complex task requiring the student to recognize two interleaved patterns.\n\n## Academic Concept: Parity (Modulo 2)\n- Even steps: Collect Crystal\n- Odd steps: Toggle Switch\n\n## Solution & Parameters\n\n```js\n// Parameters\nvar _MIN_PAIRS_ = 3;\nvar _MAX_PAIRS_ = 5;\nvar PAIRS = random(_MIN_PAIRS_, _MAX_PAIRS_);\nvar STEPS = PAIRS * 2;\n\n// Solution\nfor (let i = 0; i < PAIRS; i++) {\n  // Even Step (Crystal)\n  moveForward();\n  collectItem();\n  \n  // Odd Step (Switch)\n  moveForward();\n  toggleSwitch();\n}\n```\n"
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
      "version": 1,
      "description": "Alternate between walking and jumping, collecting crystals"
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
      }
    ],
    "solutionCode": "// Parameters\nvar _MIN_PAIRS_ = 2;\nvar _MAX_PAIRS_ = 4;\nvar STEPS = 2 * random(_MIN_PAIRS_, _MAX_PAIRS_);\n\n// Solution\nfor (let i = 0; i < STEPS / 2; i++) {\n  // Even: Walk\n  moveForward();\n  collectItem();\n  \n  // Odd: Jump\n  jump();\n  collectItem();\n}",
    "descriptionMarkdown": "# Alternating Move\n\nA pattern that changes action based on whether the step count is Odd or Even.\n\n## Academic Concept: Parity (Modulo 2)\n- Logic: `if (i % 2 == 0) ActionA else ActionB`\n\n## Solution & Parameters",
    "rawContent": "---\nid: logic-alt-move\nname: \"Alternating Move\"\ncategory: logic\nconcepts: [\"loop\", \"conditional\", \"modulo\"]\ndifficulty: 3\ntags: [\"logic\", \"parity\", \"even_odd\"]\nauthor: system\nversion: 1\ndescription: \"Alternate between walking and jumping, collecting crystals\"\n---\n\n# Alternating Move\n\nA pattern that changes action based on whether the step count is Odd or Even.\n\n## Academic Concept: Parity (Modulo 2)\n- Logic: `if (i % 2 == 0) ActionA else ActionB`\n\n## Solution & Parameters\n\n```js\n// Parameters\nvar _MIN_PAIRS_ = 2;\nvar _MAX_PAIRS_ = 4;\nvar STEPS = 2 * random(_MIN_PAIRS_, _MAX_PAIRS_);\n\n// Solution\nfor (let i = 0; i < STEPS / 2; i++) {\n  // Even: Walk\n  moveForward();\n  collectItem();\n  \n  // Odd: Jump\n  jump();\n  collectItem();\n}\n```\n"
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
      "version": 1,
      "description": "Traverse a grid and interact only on 'Black' squares (checkerboard pattern)"
    },
    "parameters": [
      {
        "name": "_MIN_SIZE_",
        "displayName": "Min Size",
        "type": "number",
        "defaultValue": 3
      },
      {
        "name": "_MAX_SIZE_",
        "displayName": "Max Size",
        "type": "number",
        "defaultValue": 4
      }
    ],
    "solutionCode": "// Solution\nfor (let r = 0; r < SIZE; r++) {\n  for (let c = 0; c < SIZE; c++) {\n    if ((r + c) % 2 == 1) {\n       collectItem();\n    }\n    if (c < SIZE - 1) moveForward();\n  }\n  \n  // Return to start of row (Raster scan style)\n  turnAround();\n  for(let k=0; k<SIZE-1; k++) moveForward();\n  turnLeft();\n  moveForward(); // Next row\n  turnLeft();\n}",
    "descriptionMarkdown": "# Logic Checkerboard\n\nTraverse a 2D grid, but only act when the coordinate sum (row + col) satisfies a parity condition.\n\n## Academic Concept: 2D Parity\n- White square: `(row + col) % 2 == 0`\n- Black square: `(row + col) % 2 == 1`\n\n## Solution & Parameters\n\n\n\n**Alternative simpler logic for template**:\n\n*Refining for final Markdown*:",
    "rawContent": "---\nid: logic-checkerboard\nname: \"Logic Checkerboard\"\ncategory: logic\nconcepts: [\"nested_loop\", \"conditional\", \"coordinates\"]\ndifficulty: 5\ntags: [\"logic\", \"grid\", \"checkerboard\", \"2d_array\"]\nauthor: system\nversion: 1\ndescription: \"Traverse a grid and interact only on 'Black' squares (checkerboard pattern)\"\n---\n\n# Logic Checkerboard\n\nTraverse a 2D grid, but only act when the coordinate sum (row + col) satisfies a parity condition.\n\n## Academic Concept: 2D Parity\n- White square: `(row + col) % 2 == 0`\n- Black square: `(row + col) % 2 == 1`\n\n## Solution & Parameters\n\n```js\n// Parameters\nvar _MIN_SIZE_ = 3;\nvar _MAX_SIZE_ = 4;\nvar SIZE = random(_MIN_SIZE_, _MAX_SIZE_);\n\n// Helper function\nfunction turnAround() {\n  turnRight();\n  turnRight();\n}\n\n// Solution\n// Solution\nfor (let r = 0; r < SIZE; r++) {\n  // Row Traversal\n  for (let c = 0; c < SIZE; c++) {\n    // Check if current spot has item\n    if (isOnCrystal()) {\n      collectItem();\n    }\n    \n    if (c < SIZE - 1) {\n      moveForward();\n    }\n  }\n  \n  // Return to start of row (Raster scan)\n  turnAround();\n  for(let k=0; k<SIZE-1; k++) {\n    moveForward();\n  }\n  turnAround(); // Face right again\n  \n  // Move to next row if not last\n  if (r < SIZE - 1) {\n    turnRight();\n    moveForward();\n    turnLeft();\n  }\n}\n```\n\n**Alternative simpler logic for template**:\n```js\n// Solution\nfor (let r = 0; r < SIZE; r++) {\n  for (let c = 0; c < SIZE; c++) {\n    if ((r + c) % 2 == 1) {\n       collectItem();\n    }\n    if (c < SIZE - 1) moveForward();\n  }\n  \n  // Return to start of row (Raster scan style)\n  turnAround();\n  for(let k=0; k<SIZE-1; k++) moveForward();\n  turnLeft();\n  moveForward(); // Next row\n  turnLeft();\n}\n```\n*Refining for final Markdown*:\n\n```js\n// Parameters\nvar _MIN_SIZE_ = 3;\nvar _MAX_SIZE_ = 4;\nvar SIZE = random(_MIN_SIZE_, _MAX_SIZE_);\n\n// Solution\nfor (let r = 0; r < SIZE; r++) {\n  for (let c = 0; c < SIZE; c++) {\n    if ((r + c) % 2 == 1) {\n       collectItem();\n    }\n    if (c < SIZE - 1) moveForward();\n  }\n  \n  // Prepare for next row (if not last)\n  if (r < SIZE - 1) {\n    turnAround();\n    for(let k=0; k<SIZE-1; k++) moveForward();\n    turnLeft();\n    moveForward();\n    turnLeft();\n  }\n}\n```\n"
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
      "version": 1,
      "description": "A repeating cycle of 3 actions: Move -> Jump -> Collect"
    },
    "parameters": [
      {
        "name": "_MIN_CYCLES_",
        "displayName": "Min Cycles",
        "type": "number",
        "defaultValue": 2
      },
      {
        "name": "_MAX_CYCLES_",
        "displayName": "Max Cycles",
        "type": "number",
        "defaultValue": 4
      }
    ],
    "solutionCode": "// Parameters\nvar _MIN_CYCLES_ = 2;\nvar _MAX_CYCLES_ = 4;\nvar CYCLES = random(_MIN_CYCLES_, _MAX_CYCLES_);\nvar STEPS = CYCLES * 3;\n\n// Solution\nfor (let i = 0; i < CYCLES; i++) {\n  // Case 0: Move\n  moveForward();\n  \n  // Case 1: Jump\n  jump();\n  \n  // Case 2: Collect & Move\n  collectItem();\n  moveForward();\n}",
    "descriptionMarkdown": "# Three-Way Cycle\n\nA pattern that repeats every 3 steps, teaching Modulo 3 logic.\n\n## Academic Concept: Modulo N\n- Case 0: Action A\n- Case 1: Action B\n- Case 2: Action C\n\n## Solution & Parameters",
    "rawContent": "---\nid: logic-3-way\nname: \"Three-Way Cycle\"\ncategory: logic\nconcepts: [\"loop\", \"conditional\", \"modulo\"]\ndifficulty: 5\ntags: [\"logic\", \"modulo\", \"cycle\", \"pattern\"]\nauthor: system\nversion: 1\ndescription: \"A repeating cycle of 3 actions: Move -> Jump -> Collect\"\n---\n\n# Three-Way Cycle\n\nA pattern that repeats every 3 steps, teaching Modulo 3 logic.\n\n## Academic Concept: Modulo N\n- Case 0: Action A\n- Case 1: Action B\n- Case 2: Action C\n\n## Solution & Parameters\n\n```js\n// Parameters\nvar _MIN_CYCLES_ = 2;\nvar _MAX_CYCLES_ = 4;\nvar CYCLES = random(_MIN_CYCLES_, _MAX_CYCLES_);\nvar STEPS = CYCLES * 3;\n\n// Solution\nfor (let i = 0; i < CYCLES; i++) {\n  // Case 0: Move\n  moveForward();\n  \n  // Case 1: Jump\n  jump();\n  \n  // Case 2: Collect & Move\n  collectItem();\n  moveForward();\n}\n```\n"
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
        "name": "_MIN_SEGMENT1_",
        "displayName": "Min Segment1",
        "type": "number",
        "defaultValue": 2
      },
      {
        "name": "_MAX_SEGMENT1_",
        "displayName": "Max Segment1",
        "type": "number",
        "defaultValue": 4
      },
      {
        "name": "_MIN_SEGMENT2_",
        "displayName": "Min Segment2",
        "type": "number",
        "defaultValue": 2
      },
      {
        "name": "_MAX_SEGMENT2_",
        "displayName": "Max Segment2",
        "type": "number",
        "defaultValue": 4
      }
    ],
    "solutionCode": "// Parameters\nvar _MIN_SEGMENT1_ = 2;\nvar _MAX_SEGMENT1_ = 4;\nvar _MIN_SEGMENT2_ = 2;\nvar _MAX_SEGMENT2_ = 4;\nvar SEGMENT1 = random(_MIN_SEGMENT1_, _MAX_SEGMENT1_);\nvar SEGMENT2 = random(_MIN_SEGMENT2_, _MAX_SEGMENT2_);\n\n// Solution\n// L-shape path\nmoveForward();\n\nfor (let i = 0; i < SEGMENT1; i++) {\n  collectItem();\n  moveForward();\n}\n\nturnRight();\n\nfor (let i = 0; i < SEGMENT2; i++) {\n  collectItem();\n  moveForward();\n}\n\nmoveForward();",
    "descriptionMarkdown": "# FOR Loop with Turns\n\nCombine FOR loops with turning to create more complex paths.\n\n## Learning Goals\n- Use multiple FOR loops\n- Combine loops with turn commands\n- Create L-shaped paths\n\n## Solution & Parameters",
    "rawContent": "---\nid: for-with-turns\nname: \"FOR Loop with Turns\"\ncategory: loop\nconcepts: [\"repeat_n\"]\ndifficulty: 2\ntags: [\"for\", \"loop\", \"turn\", \"l-shape\"]\nauthor: system\nversion: 1\ndescription: \"Create an L-shape path using loops with turns\"\n---\n\n# FOR Loop with Turns\n\nCombine FOR loops with turning to create more complex paths.\n\n## Learning Goals\n- Use multiple FOR loops\n- Combine loops with turn commands\n- Create L-shaped paths\n\n## Solution & Parameters\n\n```js\n// Parameters\nvar _MIN_SEGMENT1_ = 2;\nvar _MAX_SEGMENT1_ = 4;\nvar _MIN_SEGMENT2_ = 2;\nvar _MAX_SEGMENT2_ = 4;\nvar SEGMENT1 = random(_MIN_SEGMENT1_, _MAX_SEGMENT1_);\nvar SEGMENT2 = random(_MIN_SEGMENT2_, _MAX_SEGMENT2_);\n\n// Solution\n// L-shape path\nmoveForward();\n\nfor (let i = 0; i < SEGMENT1; i++) {\n  collectItem();\n  moveForward();\n}\n\nturnRight();\n\nfor (let i = 0; i < SEGMENT2; i++) {\n  collectItem();\n  moveForward();\n}\n\nmoveForward();\n```\n"
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
        "name": "_MIN_COLS_",
        "displayName": "Min Cols",
        "type": "number",
        "defaultValue": 3
      },
      {
        "name": "_MAX_COLS_",
        "displayName": "Max Cols",
        "type": "number",
        "defaultValue": 5
      }
    ],
    "solutionCode": "// Parameters\nvar _MIN_ROWS_ = 2;\nvar _MAX_ROWS_ = 3;\nvar _MIN_COLS_ = 3;\nvar _MAX_COLS_ = 5;\nvar ROWS = random(_MIN_ROWS_, _MAX_ROWS_);\nvar COLS = random(_MIN_COLS_, _MAX_COLS_);\n\n// Solution\n// Zigzag grid pattern\nmoveForward();\n\nfor (let col = 0; col < COLS; col++) {\n  collectItem();\n  moveForward();\n}\n\nfor (let row = 1; row < ROWS; row++) {\n  turnRight();\n  moveForward();\n  turnRight();\n  \n  for (let col = 0; col < COLS; col++) {\n    collectItem();\n    moveForward();\n  }\n}\n\nmoveForward();",
    "descriptionMarkdown": "# Nested FOR Loops\n\nMaster nested loops by creating a grid pattern with zigzag movement.\n\n## Learning Goals\n- Understand nested loop structure\n- Create 2D patterns with loops\n- Handle zigzag traversal\n\n## Solution & Parameters",
    "rawContent": "---\nid: nested-loops\nname: \"Nested FOR Loops\"\ncategory: loop\nconcepts: [\"nested_loop\"]\ndifficulty: 4\ntags: [\"for\", \"loop\", \"nested\", \"zigzag\", \"grid\"]\nauthor: system\nversion: 1\ndescription: \"Create a zigzag grid pattern using nested loops\"\n---\n\n# Nested FOR Loops\n\nMaster nested loops by creating a grid pattern with zigzag movement.\n\n## Learning Goals\n- Understand nested loop structure\n- Create 2D patterns with loops\n- Handle zigzag traversal\n\n## Solution & Parameters\n\n```js\n// Parameters\nvar _MIN_ROWS_ = 2;\nvar _MAX_ROWS_ = 3;\nvar _MIN_COLS_ = 3;\nvar _MAX_COLS_ = 5;\nvar ROWS = random(_MIN_ROWS_, _MAX_ROWS_);\nvar COLS = random(_MIN_COLS_, _MAX_COLS_);\n\n// Solution\n// Zigzag grid pattern\nmoveForward();\n\nfor (let col = 0; col < COLS; col++) {\n  collectItem();\n  moveForward();\n}\n\nfor (let row = 1; row < ROWS; row++) {\n  turnRight();\n  moveForward();\n  turnRight();\n  \n  for (let col = 0; col < COLS; col++) {\n    collectItem();\n    moveForward();\n  }\n}\n\nmoveForward();\n```\n"
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
        "name": "_MIN_CRYSTAL_NUM_",
        "displayName": "Min Crystal Num",
        "type": "number",
        "defaultValue": 3
      },
      {
        "name": "_MAX_CRYSTAL_NUM_",
        "displayName": "Max Crystal Num",
        "type": "number",
        "defaultValue": 6
      }
    ],
    "solutionCode": "// Parameters\nvar _MIN_CRYSTAL_NUM_ = 3;\nvar _MAX_CRYSTAL_NUM_ = 6;\nvar CRYSTAL_NUM = random(_MIN_CRYSTAL_NUM_, _MAX_CRYSTAL_NUM_);\nvar SPACE = 1; // Default spacing\n\n// Solution\n// Collect crystals using a loop\nmoveForward();\n\nfor (let i = 0; i < CRYSTAL_NUM; i++) {\n  collectItem();\n  \n  // Zig-Zag movement\n  turnLeft();\n  moveForward();\n  turnRight();\n  moveForward();\n  \n  // Extra Spacing if needed\n  for(let j=0; j<SPACE; j++) {\n    moveForward();\n  }\n}\n\nmoveForward();",
    "descriptionMarkdown": "# Simple FOR Loop\n\nLearn to use a FOR loop to repeat actions a specific number of times.\n\n## Learning Goals\n- Understand FOR loop syntax\n- Use a counter variable\n- Repeat actions N times\n\n## Solution & Parameters",
    "rawContent": "---\nid: simple-for-loop\nname: \"Simple FOR Loop\"\ncategory: loop\nconcepts: [\"repeat_n\"]\ndifficulty: 2\ntags: [\"for\", \"loop\", \"repeat\", \"crystal\"]\nauthor: system\nversion: 1\ndescription: \"Collect N crystals with random count using a FOR loop\"\n---\n\n# Simple FOR Loop\n\nLearn to use a FOR loop to repeat actions a specific number of times.\n\n## Learning Goals\n- Understand FOR loop syntax\n- Use a counter variable\n- Repeat actions N times\n\n## Solution & Parameters\n\n```js\n// Parameters\nvar _MIN_CRYSTAL_NUM_ = 3;\nvar _MAX_CRYSTAL_NUM_ = 6;\nvar CRYSTAL_NUM = random(_MIN_CRYSTAL_NUM_, _MAX_CRYSTAL_NUM_);\nvar SPACE = 1; // Default spacing\n\n// Solution\n// Collect crystals using a loop\nmoveForward();\n\nfor (let i = 0; i < CRYSTAL_NUM; i++) {\n  collectItem();\n  \n  // Zig-Zag movement\n  turnLeft();\n  moveForward();\n  turnRight();\n  moveForward();\n  \n  // Extra Spacing if needed\n  for(let j=0; j<SPACE; j++) {\n    moveForward();\n  }\n}\n\nmoveForward();\n```\n"
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
      "version": 1,
      "description": "Walk around a square using nested loops"
    },
    "parameters": [
      {
        "name": "_MIN_SIDE_",
        "displayName": "Min Side",
        "type": "number",
        "defaultValue": 2
      },
      {
        "name": "_MAX_SIDE_",
        "displayName": "Max Side",
        "type": "number",
        "defaultValue": 4
      }
    ],
    "solutionCode": "// Parameters\nvar _MIN_SIDE_ = 2;\nvar _MAX_SIDE_ = 4;\nvar SIDE = random(_MIN_SIDE_, _MAX_SIDE_);\n\n// Solution\n// Square pattern\nmoveForward();\n\nfor (let side = 0; side < 4; side++) {\n  for (let step = 0; step < SIDE; step++) {\n    collectItem();\n    moveForward();\n  }\n  turnRight();\n}\n\nmoveForward();",
    "descriptionMarkdown": "# Square Pattern\n\nUse nested loops to walk around a square, collecting items along the way.\n\n## Learning Goals\n- Understand nested loops\n- Use outer loop for sides\n- Use inner loop for steps\n\n## Solution & Parameters",
    "rawContent": "---\nid: square-pattern\nname: \"Square Pattern\"\ncategory: loop\nconcepts: [\"repeat_n\", \"nested_loop\"]\ndifficulty: 3\ntags: [\"for\", \"loop\", \"nested\", \"square\", \"pattern\"]\nauthor: system\nversion: 1\ndescription: \"Walk around a square using nested loops\"\n---\n\n# Square Pattern\n\nUse nested loops to walk around a square, collecting items along the way.\n\n## Learning Goals\n- Understand nested loops\n- Use outer loop for sides\n- Use inner loop for steps\n\n## Solution & Parameters\n\n```js\n// Parameters\nvar _MIN_SIDE_ = 2;\nvar _MAX_SIDE_ = 4;\nvar SIDE = random(_MIN_SIDE_, _MAX_SIDE_);\n\n// Solution\n// Square pattern\nmoveForward();\n\nfor (let side = 0; side < 4; side++) {\n  for (let step = 0; step < SIDE; step++) {\n    collectItem();\n    moveForward();\n  }\n  turnRight();\n}\n\nmoveForward();\n```\n"
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
      "version": 1,
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
        "defaultValue": 8
      }
    ],
    "solutionCode": "// Parameters\nvar _MIN_STEPS_ = 3;\nvar _MAX_STEPS_ = 8;\nvar STEPS = random(_MIN_STEPS_, _MAX_STEPS_);\n\n// Solution\nmoveForward();\n\nfor (let i = 0; i < STEPS; i++) {\n  collectItem();\n  moveForward();\n  jump();\n}\ncollectItem();\nmoveForward();",
    "descriptionMarkdown": "# Staircase Climb\n\nClimb a staircase by recognizing the repeating pattern of forward + jump.\n\n## Learning Goals\n- Recognize repeating patterns\n- Use `repeat` block effectively\n- Combine movement with jumping\n\n## Solution & Parameters",
    "rawContent": "---\nid: staircase-climb\nname: \"Staircase Climb\"\ncategory: loop\nconcepts: [\"repeat_n\", \"pattern_recognition\"]\ndifficulty: 3\ntags: [\"repeat\", \"pattern\", \"staircase\"]\nauthor: system\nversion: 1\ndescription: \"Climb a staircase and collect crystals at each step\"\n---\n\n# Staircase Climb\n\nClimb a staircase by recognizing the repeating pattern of forward + jump.\n\n## Learning Goals\n- Recognize repeating patterns\n- Use `repeat` block effectively\n- Combine movement with jumping\n\n## Solution & Parameters\n\n```js\n// Parameters\nvar _MIN_STEPS_ = 3;\nvar _MAX_STEPS_ = 8;\nvar STEPS = random(_MIN_STEPS_, _MAX_STEPS_);\n\n// Solution\nmoveForward();\n\nfor (let i = 0; i < STEPS; i++) {\n  collectItem();\n  moveForward();\n  jump();\n}\ncollectItem();\nmoveForward();\n```\n"
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
      "version": 1,
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
      }
    ],
    "solutionCode": "// Parameters\nvar _MIN_STEPS_ = 3;\nvar _MAX_STEPS_ = 6;\nvar STEPS = random(_MIN_STEPS_, _MAX_STEPS_);\n\n// Solution\n// Staircase\nmoveForward();\njump();\n\nfor (let step = 0; step < STEPS; step++) {\n  collectItem();\n  jump();\n}\n\nmoveForward();",
    "descriptionMarkdown": "# Staircase with Jump\n\nUse the jump command to climb a staircase while collecting items.\n\n## Learning Goals\n- Use the jump() command\n- Combine movement with elevation\n- Repeat jump pattern\n\n## Solution & Parameters",
    "rawContent": "---\nid: staircase-jump\nname: \"Staircase with Jump\"\ncategory: loop\nconcepts: [\"repeat_n\"]\ndifficulty: 4\ntags: [\"loop\", \"jump\", \"staircase\", \"elevated\"]\nauthor: system\nversion: 1\ndescription: \"Create elevated terrain using jump command\"\n---\n\n# Staircase with Jump\n\nUse the jump command to climb a staircase while collecting items.\n\n## Learning Goals\n- Use the jump() command\n- Combine movement with elevation\n- Repeat jump pattern\n\n## Solution & Parameters\n\n```js\n// Parameters\nvar _MIN_STEPS_ = 3;\nvar _MAX_STEPS_ = 6;\nvar STEPS = random(_MIN_STEPS_, _MAX_STEPS_);\n\n// Solution\n// Staircase\nmoveForward();\njump();\n\nfor (let step = 0; step < STEPS; step++) {\n  collectItem();\n  jump();\n}\n\nmoveForward();\n```\n"
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
        "name": "_MIN_SEGMENT_LENGTH_",
        "displayName": "Min Segment Length",
        "type": "number",
        "defaultValue": 2
      },
      {
        "name": "_MAX_SEGMENT_LENGTH_",
        "displayName": "Max Segment Length",
        "type": "number",
        "defaultValue": 4
      }
    ],
    "solutionCode": "// Parameters\nvar _MIN_ZIG_COUNT_ = 3;\nvar _MAX_ZIG_COUNT_ = 5;\nvar ZIG_COUNT = random(_MIN_ZIG_COUNT_, _MAX_ZIG_COUNT_);\n\nvar _MIN_SEGMENT_LENGTH_ = 2;\nvar _MAX_SEGMENT_LENGTH_ = 4;\nvar SEGMENT_LENGTH = random(_MIN_SEGMENT_LENGTH_, _MAX_SEGMENT_LENGTH_);\n\n// Solution\n// Navigate zigzag\nmoveForward();\n\nfor (let i = 0; i < ZIG_COUNT; i++) {\n  for (let j = 0; j < SEGMENT_LENGTH; j++) {\n    moveForward();\n  }\n  collectItem();\n  turnRight();\n  moveForward();\n  turnLeft();\n}\n\ncollectItem();\nmoveForward();",
    "descriptionMarkdown": "# Zigzag Path\n\nNavigate through a zigzag path by repeating the turn-forward pattern.\n\n## Learning Goals\n- Use repeat with multiple commands  \n- Understand turn directions\n- Recognize zigzag pattern\n\n## Solution & Parameters",
    "rawContent": "---\nid: zigzag-path\nname: \"Zigzag Path\"\ncategory: loop\nconcepts: [\"repeat_n\"]\ndifficulty: 4\ntags: [\"repeat\", \"turn\", \"zigzag\"]\nauthor: system\nversion: 1\ndescription: \"Navigate a zigzag path and collect crystals at turns\"\n---\n\n# Zigzag Path\n\nNavigate through a zigzag path by repeating the turn-forward pattern.\n\n## Learning Goals\n- Use repeat with multiple commands  \n- Understand turn directions\n- Recognize zigzag pattern\n\n## Solution & Parameters\n\n```js\n// Parameters\nvar _MIN_ZIG_COUNT_ = 3;\nvar _MAX_ZIG_COUNT_ = 5;\nvar ZIG_COUNT = random(_MIN_ZIG_COUNT_, _MAX_ZIG_COUNT_);\n\nvar _MIN_SEGMENT_LENGTH_ = 2;\nvar _MAX_SEGMENT_LENGTH_ = 4;\nvar SEGMENT_LENGTH = random(_MIN_SEGMENT_LENGTH_, _MAX_SEGMENT_LENGTH_);\n\n// Solution\n// Navigate zigzag\nmoveForward();\n\nfor (let i = 0; i < ZIG_COUNT; i++) {\n  for (let j = 0; j < SEGMENT_LENGTH; j++) {\n    moveForward();\n  }\n  collectItem();\n  turnRight();\n  moveForward();\n  turnLeft();\n}\n\ncollectItem();\nmoveForward();\n```\n"
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
      "version": 1,
      "description": "Execute a symmetrical sequence of actions (e.g., Jump-Move-Jump)"
    },
    "parameters": [],
    "solutionCode": "// Parameters\nvar MID_LENGTH = random(1, 3);\n\n// Solution\n// Start (A)\njump();\nmoveForward();\n\n// Middle (B repeated)\nfor(let i=0; i<MID_LENGTH; i++) {\n  collectItem();\n  moveForward();\n}\n\n// Pivot (C)\nturnRight();\nmoveForward();\nturnRight(); // U-Turn effect (conceptually) or just a pivot point in path\n\n// Middle Mirror (B repeated)\nfor(let i=0; i<MID_LENGTH; i++) {\n  collectItem();\n  moveForward();\n}\n\n// End Mirror (A)\njump();\nmoveForward();",
    "descriptionMarkdown": "# Palindrome Path\n\nA path where the action sequence reads the same backwards and forwards.\n\n## Academic Concept: Palindrome / Symmetry\n- Sequence: $A, B, C, B, A$\n\n## Solution & Parameters",
    "rawContent": "---\nid: mem-palindrome\nname: \"Palindrome Path\"\ncategory: memory\nconcepts: [\"pattern_recognition\", \"string_logic\"]\ndifficulty: 4\ntags: [\"pattern\", \"palindrome\", \"symmetry\"]\nauthor: system\nversion: 1\ndescription: \"Execute a symmetrical sequence of actions (e.g., Jump-Move-Jump)\"\n---\n\n# Palindrome Path\n\nA path where the action sequence reads the same backwards and forwards.\n\n## Academic Concept: Palindrome / Symmetry\n- Sequence: $A, B, C, B, A$\n\n## Solution & Parameters\n\n```js\n// Parameters\nvar MID_LENGTH = random(1, 3);\n\n// Solution\n// Start (A)\njump();\nmoveForward();\n\n// Middle (B repeated)\nfor(let i=0; i<MID_LENGTH; i++) {\n  collectItem();\n  moveForward();\n}\n\n// Pivot (C)\nturnRight();\nmoveForward();\nturnRight(); // U-Turn effect (conceptually) or just a pivot point in path\n\n// Middle Mirror (B repeated)\nfor(let i=0; i<MID_LENGTH; i++) {\n  collectItem();\n  moveForward();\n}\n\n// End Mirror (A)\njump();\nmoveForward();\n```\n"
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
      "description": "Walk a path, collect crystal at destination, then return"
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
      }
    ],
    "solutionCode": "// Parameters\nvar _MIN_DIST_ = 2;\nvar _MAX_DIST_ = 4;\nvar D1 = random(_MIN_DIST_, _MAX_DIST_);\nvar D2 = random(_MIN_DIST_, _MAX_DIST_);\n\n// Helper function\nfunction turnAround() {\n  turnRight();\n  turnRight();\n}\n\n// Solution\n// Forward Phase\nfor(let i=0; i<D1; i++) moveForward();\nturnRight();\nfor(let j=0; j<D2; j++) moveForward();\n\n// Collect at destination\ncollectItem();\n\n// Return Phase\nturnAround();\nfor(let j=0; j<D2; j++) moveForward();\nturnLeft();\nfor(let i=0; i<D1; i++) moveForward();\n\nturnAround();",
    "descriptionMarkdown": "# Path Return\n\nWalk a random path, collect crystal at destination, turn around, and walk exactly back to the start.\n\n## Academic Concept: Inverse Operations\n- Operation: `Move` | Inverse: `Move` (after turning 180)\n- Operation: `TurnRight` | Inverse: `TurnLeft`\n- Sequence `[A, B, C]` -> Inverse Sequence `[Inv(C), Inv(B), Inv(A)]` (Stack LIFO)\n\n## Solution & Parameters",
    "rawContent": "---\nid: mem-return\nname: \"Path Return\"\ncategory: memory\nconcepts: [\"function\", \"stack\", \"backtracking\"]\ndifficulty: 4\ntags: [\"memory\", \"pattern\", \"inverse\"]\nauthor: system\nversion: 1\ndescription: \"Walk a path, collect crystal at destination, then return\"\n---\n\n# Path Return\n\nWalk a random path, collect crystal at destination, turn around, and walk exactly back to the start.\n\n## Academic Concept: Inverse Operations\n- Operation: `Move` | Inverse: `Move` (after turning 180)\n- Operation: `TurnRight` | Inverse: `TurnLeft`\n- Sequence `[A, B, C]` -> Inverse Sequence `[Inv(C), Inv(B), Inv(A)]` (Stack LIFO)\n\n## Solution & Parameters\n\n```js\n// Parameters\nvar _MIN_DIST_ = 2;\nvar _MAX_DIST_ = 4;\nvar D1 = random(_MIN_DIST_, _MAX_DIST_);\nvar D2 = random(_MIN_DIST_, _MAX_DIST_);\n\n// Helper function\nfunction turnAround() {\n  turnRight();\n  turnRight();\n}\n\n// Solution\n// Forward Phase\nfor(let i=0; i<D1; i++) moveForward();\nturnRight();\nfor(let j=0; j<D2; j++) moveForward();\n\n// Collect at destination\ncollectItem();\n\n// Return Phase\nturnAround();\nfor(let j=0; j<D2; j++) moveForward();\nturnLeft();\nfor(let i=0; i<D1; i++) moveForward();\n\nturnAround();\n```\n"
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
      "description": "Collect crystals and activate switches, then undo the switches"
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
        "defaultValue": 5
      }
    ],
    "solutionCode": "// Parameters\nvar _MIN_COUNT_ = 3;\nvar _MAX_COUNT_ = 5;\nvar COUNT = random(_MIN_COUNT_, _MAX_COUNT_);\n\n// Helper function\nfunction turnAround() {\n  turnRight();\n  turnRight();\n}\n\n// Solution\n// 1. Activate and Collect\nfor (let i = 0; i < COUNT; i++) {\n  moveForward();\n  collectItem();\n  toggleSwitch();\n}\n\n// 2. Turn Around\nturnAround();\n\n// 3. Deactivate (Undo)\nfor (let i = 0; i < COUNT; i++) {\n  toggleSwitch();\n  moveForward();\n}",
    "descriptionMarkdown": "# Undo Operations\n\nA conceptual task: \"Leave everything as you found it\".\n\n## Academic Concept: State Reversion\n- Forward: `Toggle (Off->On)`\n- Backward: `Toggle (On->Off)`\n\n## Solution & Parameters",
    "rawContent": "---\nid: mem-undo\nname: \"Undo Operations\"\ncategory: memory\nconcepts: [\"function\", \"state_machine\"]\ndifficulty: 5\ntags: [\"memory\", \"undo\", \"switch\"]\nauthor: system\nversion: 1\ndescription: \"Collect crystals and activate switches, then undo the switches\"\n---\n\n# Undo Operations\n\nA conceptual task: \"Leave everything as you found it\".\n\n## Academic Concept: State Reversion\n- Forward: `Toggle (Off->On)`\n- Backward: `Toggle (On->Off)`\n\n## Solution & Parameters\n\n```js\n// Parameters\nvar _MIN_COUNT_ = 3;\nvar _MAX_COUNT_ = 5;\nvar COUNT = random(_MIN_COUNT_, _MAX_COUNT_);\n\n// Helper function\nfunction turnAround() {\n  turnRight();\n  turnRight();\n}\n\n// Solution\n// 1. Activate and Collect\nfor (let i = 0; i < COUNT; i++) {\n  moveForward();\n  collectItem();\n  toggleSwitch();\n}\n\n// 2. Turn Around\nturnAround();\n\n// 3. Deactivate (Undo)\nfor (let i = 0; i < COUNT; i++) {\n  toggleSwitch();\n  moveForward();\n}\n```\n"
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
        "defaultValue": 4
      }
    ],
    "solutionCode": "// Parameters\nvar _MIN_START_ = 1;\nvar _MAX_START_ = 2;\nvar START = random(_MIN_START_, _MAX_START_);\n\nvar _MIN_STEP_ = 1;\nvar _MAX_STEP_ = 2;\nvar STEP = random(_MIN_STEP_, _MAX_STEP_);\n\nvar _MIN_GROUPS_ = 3;\nvar _MAX_GROUPS_ = 4;\nvar GROUPS = random(_MIN_GROUPS_, _MAX_GROUPS_);\n\n// Solution\nmoveForward();\n\nfor (let i = 0; i < GROUPS - 1; i++) {\n  let count = START + i * STEP;\n  for (let j = 0; j < count; j++) {\n    collectItem();\n    moveForward();\n  }\n  \n  turnRight();\n  moveForward();\n  turnRight();\n}\n\n// Last Group (No turn)\nlet lastCount = START + (GROUPS - 1) * STEP;\nfor (let k = 0; k < lastCount; k++) {\n  collectItem();\n  moveForward();\n}",
    "descriptionMarkdown": "# Arithmetic Collect\n\nCollect items where the count increases linearly each time.\n\n## Academic Concept: Arithmetic Progression\n- Sequence: $a, a+d, a+2d, ...$\n- Here: Number of items to collect increases by `STEP`.\n\n## Solution & Parameters",
    "rawContent": "---\nid: arithmetic-collect\nname: \"Arithmetic Collect\"\ncategory: progression\nconcepts: [\"loop\", \"variable\", \"arithmetic_progression\", \"nested_loop\"]\ndifficulty: 4\ntags: [\"math\", \"progression\", \"collect\"]\nauthor: system\nversion: 1\ndescription: \"Collect increasing numbers of items (1, 2, 3...)\"\n---\n\n# Arithmetic Collect\n\nCollect items where the count increases linearly each time.\n\n## Academic Concept: Arithmetic Progression\n- Sequence: $a, a+d, a+2d, ...$\n- Here: Number of items to collect increases by `STEP`.\n\n## Solution & Parameters\n\n```js\n// Parameters\nvar _MIN_START_ = 1;\nvar _MAX_START_ = 2;\nvar START = random(_MIN_START_, _MAX_START_);\n\nvar _MIN_STEP_ = 1;\nvar _MAX_STEP_ = 2;\nvar STEP = random(_MIN_STEP_, _MAX_STEP_);\n\nvar _MIN_GROUPS_ = 3;\nvar _MAX_GROUPS_ = 4;\nvar GROUPS = random(_MIN_GROUPS_, _MAX_GROUPS_);\n\n// Solution\nmoveForward();\n\nfor (let i = 0; i < GROUPS - 1; i++) {\n  let count = START + i * STEP;\n  for (let j = 0; j < count; j++) {\n    collectItem();\n    moveForward();\n  }\n  \n  turnRight();\n  moveForward();\n  turnRight();\n}\n\n// Last Group (No turn)\nlet lastCount = START + (GROUPS - 1) * STEP;\nfor (let k = 0; k < lastCount; k++) {\n  collectItem();\n  moveForward();\n}\n```\n"
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
      "version": 1,
      "description": "Move and collect crystals with increasing distances"
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
        "defaultValue": 1
      },
      {
        "name": "_MIN_ITERATIONS_",
        "displayName": "Min Iterations",
        "type": "number",
        "defaultValue": 3
      },
      {
        "name": "_MAX_ITERATIONS_",
        "displayName": "Max Iterations",
        "type": "number",
        "defaultValue": 4
      }
    ],
    "solutionCode": "// Parameters\nvar _MIN_START_ = 1;\nvar _MAX_START_ = 2;\nvar START = random(_MIN_START_, _MAX_START_);\n\nvar _MIN_STEP_ = 1;\nvar _MAX_STEP_ = 1;\nvar STEP = random(_MIN_STEP_, _MAX_STEP_);\n\nvar _MIN_ITERATIONS_ = 3;\nvar _MAX_ITERATIONS_ = 4;\nvar ITERATIONS = random(_MIN_ITERATIONS_, _MAX_ITERATIONS_);\n\n// Solution\nfor (let i = 0; i < ITERATIONS - 1; i++) {\n  let dist = START + i * STEP;\n  for (let j = 0; j < dist; j++) {\n    moveForward();\n  }\n  collectItem();\n  turnRight();\n}\n\n// Last Segment (No turn)\nlet lastDist = START + (ITERATIONS - 1) * STEP;\nfor (let k = 0; k < lastDist; k++) {\n  moveForward();\n}\ncollectItem();",
    "descriptionMarkdown": "# Arithmetic Move\n\nA path where each segment is longer than the previous one by a fixed step.\n\n## Academic Concept: Arithmetic Progression\n- Sequence: $a, a+d, a+2d, ...$\n- Here: Move distance increases by `STEP` each time.\n\n## Solution & Parameters",
    "rawContent": "---\nid: arithmetic-move\nname: \"Arithmetic Move\"\ncategory: progression\nconcepts: [\"loop\", \"variable\", \"arithmetic_progression\"]\ndifficulty: 3\ntags: [\"math\", \"progression\", \"variable_step\"]\nauthor: system\nversion: 1\ndescription: \"Move and collect crystals with increasing distances\"\n---\n\n# Arithmetic Move\n\nA path where each segment is longer than the previous one by a fixed step.\n\n## Academic Concept: Arithmetic Progression\n- Sequence: $a, a+d, a+2d, ...$\n- Here: Move distance increases by `STEP` each time.\n\n## Solution & Parameters\n\n```js\n// Parameters\nvar _MIN_START_ = 1;\nvar _MAX_START_ = 2;\nvar START = random(_MIN_START_, _MAX_START_);\n\nvar _MIN_STEP_ = 1;\nvar _MAX_STEP_ = 1;\nvar STEP = random(_MIN_STEP_, _MAX_STEP_);\n\nvar _MIN_ITERATIONS_ = 3;\nvar _MAX_ITERATIONS_ = 4;\nvar ITERATIONS = random(_MIN_ITERATIONS_, _MAX_ITERATIONS_);\n\n// Solution\nfor (let i = 0; i < ITERATIONS - 1; i++) {\n  let dist = START + i * STEP;\n  for (let j = 0; j < dist; j++) {\n    moveForward();\n  }\n  collectItem();\n  turnRight();\n}\n\n// Last Segment (No turn)\nlet lastDist = START + (ITERATIONS - 1) * STEP;\nfor (let k = 0; k < lastDist; k++) {\n  moveForward();\n}\ncollectItem();\n```\n"
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
      "version": 1,
      "description": "Start with long segments and decrease length each turn"
    },
    "parameters": [
      {
        "name": "_MIN_START_LEN_",
        "displayName": "Min Start Len",
        "type": "number",
        "defaultValue": 4
      },
      {
        "name": "_MAX_START_LEN_",
        "displayName": "Max Start Len",
        "type": "number",
        "defaultValue": 6
      }
    ],
    "solutionCode": "// Parameters\nvar _MIN_START_LEN_ = 4;\nvar _MAX_START_LEN_ = 6;\nvar START_LEN = random(_MIN_START_LEN_, _MAX_START_LEN_);\n\nvar STEP = 1;\n\n// Solution\n// Number of segments to draw\nlet TURNS = START_LEN / STEP;\n\nfor (let t = 0; t < TURNS; t++) {\n  // Logic: currentLen = START_LEN - t * STEP\n  let len = START_LEN - t * STEP;\n  \n  if (len > 0) {\n      for (let i = 0; i < len; i++) {\n        moveForward();\n      }\n      collectItem();\n      turnLeft();\n  }\n}",
    "descriptionMarkdown": "# Decaying Path\n\nA \"convergence\" pattern where movements get smaller and smaller.\n\n## Academic Concept: Arithmetic Decay\n- Sequence: $a, a-d, a-2d, ...$\n- Logic: `dist = MAX - i*STEP`\n\n## Solution & Parameters",
    "rawContent": "---\nid: decaying-path\nname: \"Decaying Path\"\ncategory: progression\nconcepts: [\"loop\", \"variable\", \"arithmetic_progression\"]\ndifficulty: 4\ntags: [\"math\", \"decay\", \"subtraction\"]\nauthor: system\nversion: 1\ndescription: \"Start with long segments and decrease length each turn\"\n---\n\n# Decaying Path\n\nA \"convergence\" pattern where movements get smaller and smaller.\n\n## Academic Concept: Arithmetic Decay\n- Sequence: $a, a-d, a-2d, ...$\n- Logic: `dist = MAX - i*STEP`\n\n## Solution & Parameters\n\n```js\n// Parameters\nvar _MIN_START_LEN_ = 4;\nvar _MAX_START_LEN_ = 6;\nvar START_LEN = random(_MIN_START_LEN_, _MAX_START_LEN_);\n\nvar STEP = 1;\n\n// Solution\n// Number of segments to draw\nlet TURNS = START_LEN / STEP;\n\nfor (let t = 0; t < TURNS; t++) {\n  // Logic: currentLen = START_LEN - t * STEP\n  let len = START_LEN - t * STEP;\n  \n  if (len > 0) {\n      for (let i = 0; i < len; i++) {\n        moveForward();\n      }\n      collectItem();\n      turnLeft();\n  }\n}\n```\n"
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
      "version": 1,
      "description": "Walk distances following the Fibonacci sequence (1, 1, 2, 3, 5...)"
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
      }
    ],
    "solutionCode": "// Parameters\nvar _MIN_STEPS_ = 4;\nvar _MAX_STEPS_ = 6;\nvar STEPS = random(_MIN_STEPS_, _MAX_STEPS_);\n\n// Solution\nlet a = 1;\nlet b = 1;\n\n// First step (1)\nmoveForward();\ncollectItem();\nturnRight();\n\n// Second step (1)\nmoveForward();\ncollectItem();\nturnRight();\n\nfor (let i = 2; i < STEPS; i++) {\n  let next = a + b;\n  \n  // Atom: Move Fibonacci Dist\n  for (let j = 0; j < next; j++) {\n    moveForward();\n  }\n  collectItem();\n  turnRight();\n  \n  // Update sequence\n  a = b;\n  b = next;\n}",
    "descriptionMarkdown": "# Fibonacci Path\n\nA path based on the famous Fibonacci sequence found in nature.\n\n## Academic Concept: Fibonacci Sequence\n- $F_0=0, F_1=1, F_n = F_{n-1} + F_{n-2}$\n- Sequence: 1, 1, 2, 3, 5, 8...\n\n## Solution & Parameters",
    "rawContent": "---\nid: fibonacci-path\nname: \"Fibonacci Path\"\ncategory: progression\nconcepts: [\"loop\", \"variable\", \"fibonacci\"]\ndifficulty: 5\ntags: [\"math\", \"fibonacci\", \"nature\"]\nauthor: system\nversion: 1\ndescription: \"Walk distances following the Fibonacci sequence (1, 1, 2, 3, 5...)\"\n---\n\n# Fibonacci Path\n\nA path based on the famous Fibonacci sequence found in nature.\n\n## Academic Concept: Fibonacci Sequence\n- $F_0=0, F_1=1, F_n = F_{n-1} + F_{n-2}$\n- Sequence: 1, 1, 2, 3, 5, 8...\n\n## Solution & Parameters\n\n```js\n// Parameters\nvar _MIN_STEPS_ = 4;\nvar _MAX_STEPS_ = 6;\nvar STEPS = random(_MIN_STEPS_, _MAX_STEPS_);\n\n// Solution\nlet a = 1;\nlet b = 1;\n\n// First step (1)\nmoveForward();\ncollectItem();\nturnRight();\n\n// Second step (1)\nmoveForward();\ncollectItem();\nturnRight();\n\nfor (let i = 2; i < STEPS; i++) {\n  let next = a + b;\n  \n  // Atom: Move Fibonacci Dist\n  for (let j = 0; j < next; j++) {\n    moveForward();\n  }\n  collectItem();\n  turnRight();\n  \n  // Update sequence\n  a = b;\n  b = next;\n}\n```\n"
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
      "version": 1,
      "description": "Walk a spiral where side lengths double (1, 2, 4...)"
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
        "defaultValue": 1
      },
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
      }
    ],
    "solutionCode": "// Parameters\nvar _MIN_START_ = 1;\nvar _MAX_START_ = 1;\nvar START = random(_MIN_START_, _MAX_START_);\n\nvar RATIO = 2; \n\nvar _MIN_TURNS_ = 3;\nvar _MAX_TURNS_ = 5;\nvar TURNS = random(_MIN_TURNS_, _MAX_TURNS_);\n\n// Solution\nlet length = START;\n\nfor (let i = 0; i < TURNS; i++) {\n  // Atom: Move Side\n  for (let j = 0; j < length; j++) {\n    collectItem(); // Dense interaction for spiral\n    moveForward();\n  }\n  \n  turnRight();\n  length = length * RATIO;\n}",
    "descriptionMarkdown": "# Geometric Spiral\n\nA spiral path that expands exponentially.\n\n## Academic Concept: Geometric Progression\n- Sequence: $a, ar, ar^2, ...$\n- Here: Side length multiplies by `RATIO` (usually 2) each turn.\n\n## Solution & Parameters",
    "rawContent": "---\nid: geometric-spiral\nname: \"Geometric Spiral\"\ncategory: progression\nconcepts: [\"loop\", \"variable\", \"geometric_progression\"]\ndifficulty: 5\ntags: [\"math\", \"spiral\", \"exponential\"]\nauthor: system\nversion: 1\ndescription: \"Walk a spiral where side lengths double (1, 2, 4...)\"\n---\n\n# Geometric Spiral\n\nA spiral path that expands exponentially.\n\n## Academic Concept: Geometric Progression\n- Sequence: $a, ar, ar^2, ...$\n- Here: Side length multiplies by `RATIO` (usually 2) each turn.\n\n## Solution & Parameters\n\n```js\n// Parameters\nvar _MIN_START_ = 1;\nvar _MAX_START_ = 1;\nvar START = random(_MIN_START_, _MAX_START_);\n\nvar RATIO = 2; \n\nvar _MIN_TURNS_ = 3;\nvar _MAX_TURNS_ = 5;\nvar TURNS = random(_MIN_TURNS_, _MAX_TURNS_);\n\n// Solution\nlet length = START;\n\nfor (let i = 0; i < TURNS; i++) {\n  // Atom: Move Side\n  for (let j = 0; j < length; j++) {\n    collectItem(); // Dense interaction for spiral\n    moveForward();\n  }\n  \n  turnRight();\n  length = length * RATIO;\n}\n```\n"
  },
  {
    "metadata": {
      "id": "search-binary",
      "name": "Binary Search Sim",
      "category": "search",
      "concepts": [
        "loop",
        "search",
        "divide_conquer"
      ],
      "difficulty": 5,
      "tags": [
        "search",
        "algorithm",
        "binary",
        "logarithmic"
      ],
      "author": "system",
      "version": 1,
      "description": "Go to middle, turn, then collect - simulating binary search"
    },
    "parameters": [
      {
        "name": "_MIN_DIST_",
        "displayName": "Min Dist",
        "type": "number",
        "defaultValue": 3
      },
      {
        "name": "_MAX_DIST_",
        "displayName": "Max Dist",
        "type": "number",
        "defaultValue": 5
      }
    ],
    "solutionCode": "// Parameters\nvar _MIN_DIST_ = 3;\nvar _MAX_DIST_ = 5;\nvar DIST = random(_MIN_DIST_, _MAX_DIST_);\n\n// Solution\n// 1. Go to Middle\nfor (let i = 0; i < DIST; i++) {\n  moveForward();\n}\ncollectItem();\n\n// 2. Turn and go to sub-section\nturnRight();\nfor (let j = 0; j < DIST / 2; j++) {\n  moveForward();\n}\ncollectItem();",
    "descriptionMarkdown": "# Binary Search Simulation\n\nA physical representation of the Binary Search logic.\n\n## Academic Concept: Binary Search ($O(log N)$)\n- Go to middle.\n- Check and collect.\n- Go to sub-section.\n\n## Solution & Parameters",
    "rawContent": "---\nid: search-binary\nname: \"Binary Search Sim\"\ncategory: search\nconcepts: [\"loop\", \"search\", \"divide_conquer\"]\ndifficulty: 5\ntags: [\"search\", \"algorithm\", \"binary\", \"logarithmic\"]\nauthor: system\nversion: 1\ndescription: \"Go to middle, turn, then collect - simulating binary search\"\n---\n\n# Binary Search Simulation\n\nA physical representation of the Binary Search logic.\n\n## Academic Concept: Binary Search ($O(log N)$)\n- Go to middle.\n- Check and collect.\n- Go to sub-section.\n\n## Solution & Parameters\n\n```js\n// Parameters\nvar _MIN_DIST_ = 3;\nvar _MAX_DIST_ = 5;\nvar DIST = random(_MIN_DIST_, _MAX_DIST_);\n\n// Solution\n// 1. Go to Middle\nfor (let i = 0; i < DIST; i++) {\n  moveForward();\n}\ncollectItem();\n\n// 2. Turn and go to sub-section\nturnRight();\nfor (let j = 0; j < DIST / 2; j++) {\n  moveForward();\n}\ncollectItem();\n```\n"
  },
  {
    "metadata": {
      "id": "search-linear",
      "name": "Linear Search",
      "category": "search",
      "concepts": [
        "loop",
        "search"
      ],
      "difficulty": 4,
      "tags": [
        "search",
        "algorithm",
        "linear"
      ],
      "author": "system",
      "version": 1,
      "description": "Move along a line, checking each spot and collecting crystals"
    },
    "parameters": [
      {
        "name": "_MIN_LEN_",
        "displayName": "Min Len",
        "type": "number",
        "defaultValue": 4
      },
      {
        "name": "_MAX_LEN_",
        "displayName": "Max Len",
        "type": "number",
        "defaultValue": 6
      }
    ],
    "solutionCode": "// Parameters\nvar _MIN_LEN_ = 4;\nvar _MAX_LEN_ = 6;\nvar LEN = random(_MIN_LEN_, _MAX_LEN_);\n\n// Solution\n// Walk the path and collect crystals along the way\nfor (let i = 0; i < LEN; i++) {\n  moveForward();\n  collectItem();\n}",
    "descriptionMarkdown": "# Linear Search\n\nClassic search algorithm: check every item until you find what you need.\n\n## Academic Concept: Linear Search ($O(N)$)\n- Iterate through array/path.\n- Check condition at each step.\n- Collect if found.\n\n## Solution & Parameters",
    "rawContent": "---\nid: search-linear\nname: \"Linear Search\"\ncategory: search\nconcepts: [\"loop\", \"search\"]\ndifficulty: 4\ntags: [\"search\", \"algorithm\", \"linear\"]\nauthor: system\nversion: 1\ndescription: \"Move along a line, checking each spot and collecting crystals\"\n---\n\n# Linear Search\n\nClassic search algorithm: check every item until you find what you need.\n\n## Academic Concept: Linear Search ($O(N)$)\n- Iterate through array/path.\n- Check condition at each step.\n- Collect if found.\n\n## Solution & Parameters\n\n```js\n// Parameters\nvar _MIN_LEN_ = 4;\nvar _MAX_LEN_ = 6;\nvar LEN = random(_MIN_LEN_, _MAX_LEN_);\n\n// Solution\n// Walk the path and collect crystals along the way\nfor (let i = 0; i < LEN; i++) {\n  moveForward();\n  collectItem();\n}\n```\n"
  },
  {
    "metadata": {
      "id": "sort-selection",
      "name": "Selection Sort Sim",
      "category": "search",
      "concepts": [
        "nested_loop",
        "search",
        "sorting"
      ],
      "difficulty": 6,
      "tags": [
        "sorting",
        "algorithm",
        "selection"
      ],
      "author": "system",
      "version": 1,
      "description": "Scan row, find item, bring it back. Repeat."
    },
    "parameters": [
      {
        "name": "_MIN_ITEMS_",
        "displayName": "Min Items",
        "type": "number",
        "defaultValue": 2
      },
      {
        "name": "_MAX_ITEMS_",
        "displayName": "Max Items",
        "type": "number",
        "defaultValue": 3
      }
    ],
    "solutionCode": "// Parameters\nvar _MIN_ITEMS_ = 2;\nvar _MAX_ITEMS_ = 3;\nvar ITEMS = random(_MIN_ITEMS_, _MAX_ITEMS_);\nvar UNIVERSE_SIZE = 4;\n\n// Helper function\nfunction turnAround() {\n  turnRight();\n  turnRight();\n}\n\n// Solution\nfor (let i = 0; i < ITEMS; i++) {\n  // 1. Search Phase (Go out)\n  for(let k=0; k<UNIVERSE_SIZE; k++) {\n     moveForward();\n  }\n  \n  // 2. Action (Simulate \"Select\")\n  collectItem();\n  turnAround();\n  \n  // 3. Return Phase (Place)\n  for(let k=0; k<UNIVERSE_SIZE; k++) {\n     moveForward();\n  }\n  \n  // 4. Next Iteration setup\n  turnAround();\n}",
    "descriptionMarkdown": "# Selection Sort Simulation\n\nSimulates the mechanic of finding the \"best\" item and placing it.\n\n## Academic Concept: Selection Sort ($O(N^2)$)\n- Find min/max in unsorted part.\n- Swap/Move to sorted part.\n\n## Solution & Parameters",
    "rawContent": "---\nid: sort-selection\nname: \"Selection Sort Sim\"\ncategory: search\nconcepts: [\"nested_loop\", \"search\", \"sorting\"]\ndifficulty: 6\ntags: [\"sorting\", \"algorithm\", \"selection\"]\nauthor: system\nversion: 1\ndescription: \"Scan row, find item, bring it back. Repeat.\"\n---\n\n# Selection Sort Simulation\n\nSimulates the mechanic of finding the \"best\" item and placing it.\n\n## Academic Concept: Selection Sort ($O(N^2)$)\n- Find min/max in unsorted part.\n- Swap/Move to sorted part.\n\n## Solution & Parameters\n\n```js\n// Parameters\nvar _MIN_ITEMS_ = 2;\nvar _MAX_ITEMS_ = 3;\nvar ITEMS = random(_MIN_ITEMS_, _MAX_ITEMS_);\nvar UNIVERSE_SIZE = 4;\n\n// Helper function\nfunction turnAround() {\n  turnRight();\n  turnRight();\n}\n\n// Solution\nfor (let i = 0; i < ITEMS; i++) {\n  // 1. Search Phase (Go out)\n  for(let k=0; k<UNIVERSE_SIZE; k++) {\n     moveForward();\n  }\n  \n  // 2. Action (Simulate \"Select\")\n  collectItem();\n  turnAround();\n  \n  // 3. Return Phase (Place)\n  for(let k=0; k<UNIVERSE_SIZE; k++) {\n     moveForward();\n  }\n  \n  // 4. Next Iteration setup\n  turnAround();\n}\n```\n"
  },
  {
    "metadata": {
      "id": "crystal-trail-basic",
      "name": "Crystal Trail",
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
        "name": "_MIN_CRYSTAL_COUNT_",
        "displayName": "Min Crystal Count",
        "type": "number",
        "defaultValue": 3
      },
      {
        "name": "_MAX_CRYSTAL_COUNT_",
        "displayName": "Max Crystal Count",
        "type": "number",
        "defaultValue": 8
      }
    ],
    "solutionCode": "// Parameters\nvar _MIN_CRYSTAL_COUNT_ = 3;\nvar _MAX_CRYSTAL_COUNT_ = 8;\nvar CRYSTAL_COUNT = random(_MIN_CRYSTAL_COUNT_, _MAX_CRYSTAL_COUNT_);\n\n// Solution\n// Collect all crystals along the path\nmoveForward();\n\nfor (let i = 0; i < CRYSTAL_COUNT; i++) {\n  moveForward();\n  collectItem();\n}\n\nmoveForward();",
    "descriptionMarkdown": "# Crystal Trail\n\nA simple path with crystals to collect. Perfect for learning basic movement commands.\n\n## Learning Goals\n- Understand sequential execution\n- Practice `moveForward()` command\n- Learn `collectItem()` command\n\n## Solution & Parameters",
    "rawContent": "---\nid: crystal-trail-basic\nname: \"Crystal Trail\"\ncategory: sequential\nconcepts: [\"sequential\"]\ndifficulty: 1\ntags: [\"moveForward\", \"collectItem\", \"basic\"]\nauthor: system\nversion: 1\ndescription: \"Collect crystals along a straight path\"\n---\n\n# Crystal Trail\n\nA simple path with crystals to collect. Perfect for learning basic movement commands.\n\n## Learning Goals\n- Understand sequential execution\n- Practice `moveForward()` command\n- Learn `collectItem()` command\n\n## Solution & Parameters\n\n```js\n// Parameters\nvar _MIN_CRYSTAL_COUNT_ = 3;\nvar _MAX_CRYSTAL_COUNT_ = 8;\nvar CRYSTAL_COUNT = random(_MIN_CRYSTAL_COUNT_, _MAX_CRYSTAL_COUNT_);\n\n// Solution\n// Collect all crystals along the path\nmoveForward();\n\nfor (let i = 0; i < CRYSTAL_COUNT; i++) {\n  moveForward();\n  collectItem();\n}\n\nmoveForward();\n```\n"
  },
  {
    "metadata": {
      "id": "l-shape-path",
      "name": "L-Shape Path",
      "category": "sequential",
      "concepts": [
        "sequential"
      ],
      "difficulty": 2,
      "tags": [
        "moveForward",
        "turn",
        "collectItem"
      ],
      "author": "system",
      "version": 1,
      "description": "Follow an L-shaped path collecting crystals"
    },
    "parameters": [
      {
        "name": "_MIN_LEG1_",
        "displayName": "Min Leg1",
        "type": "number",
        "defaultValue": 2
      },
      {
        "name": "_MAX_LEG1_",
        "displayName": "Max Leg1",
        "type": "number",
        "defaultValue": 5
      },
      {
        "name": "_MIN_LEG2_",
        "displayName": "Min Leg2",
        "type": "number",
        "defaultValue": 2
      },
      {
        "name": "_MAX_LEG2_",
        "displayName": "Max Leg2",
        "type": "number",
        "defaultValue": 5
      }
    ],
    "solutionCode": "// Parameters\nvar _MIN_LEG1_ = 2;\nvar _MAX_LEG1_ = 5;\nvar LEG1 = random(_MIN_LEG1_, _MAX_LEG1_);\n\nvar _MIN_LEG2_ = 2;\nvar _MAX_LEG2_ = 5;\nvar LEG2 = random(_MIN_LEG2_, _MAX_LEG2_);\n\n// Solution\nmoveForward();\n\nfor (let i = 0; i < LEG1; i++) {\n  moveForward();\n  collectItem();\n}\nturnRight();\nfor (let i = 0; i < LEG2; i++) {\n  moveForward();\n  collectItem();\n}\n\nmoveForward();",
    "descriptionMarkdown": "# L-Shape Path\n\nNavigate a path with a single turn.\n\n## Solution & Parameters",
    "rawContent": "---\nid: l-shape-path\nname: \"L-Shape Path\"\ncategory: sequential\nconcepts: [\"sequential\"]\ndifficulty: 2\ntags: [\"moveForward\", \"turn\", \"collectItem\"]\nauthor: system\nversion: 1\ndescription: \"Follow an L-shaped path collecting crystals\"\n---\n\n# L-Shape Path\n\nNavigate a path with a single turn.\n\n## Solution & Parameters\n\n```js\n// Parameters\nvar _MIN_LEG1_ = 2;\nvar _MAX_LEG1_ = 5;\nvar LEG1 = random(_MIN_LEG1_, _MAX_LEG1_);\n\nvar _MIN_LEG2_ = 2;\nvar _MAX_LEG2_ = 5;\nvar LEG2 = random(_MIN_LEG2_, _MAX_LEG2_);\n\n// Solution\nmoveForward();\n\nfor (let i = 0; i < LEG1; i++) {\n  moveForward();\n  collectItem();\n}\nturnRight();\nfor (let i = 0; i < LEG2; i++) {\n  moveForward();\n  collectItem();\n}\n\nmoveForward();\n```\n"
  },
  {
    "metadata": {
      "id": "simple-sequence",
      "name": "Simple Sequence",
      "category": "sequential",
      "concepts": [
        "sequential"
      ],
      "difficulty": 1,
      "tags": [
        "moveForward",
        "collectItem",
        "basic",
        "sequence"
      ],
      "author": "system",
      "version": 1,
      "description": "Sequential commands without loops - basic movement and collection"
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
      }
    ],
    "solutionCode": "// Parameters\nvar _MIN_STEPS_ = 3;\nvar _MAX_STEPS_ = 5;\nvar STEPS = random(_MIN_STEPS_, _MAX_STEPS_);\n\n// Solution\n// Simple sequence of move and collect\nmoveForward();\n\nfor (let i = 0; i < STEPS; i++) {\n  moveForward();\n  collectItem();\n}\nmoveForward();",
    "descriptionMarkdown": "# Simple Sequence\n\nLearn the basics of sequential programming by executing commands in order.\n\n## Learning Goals\n- Understand sequential execution\n- Practice basic commands\n- Learn that each command runs one after another\n\n## Solution & Parameters",
    "rawContent": "---\nid: simple-sequence\nname: \"Simple Sequence\"\ncategory: sequential\nconcepts: [\"sequential\"]\ndifficulty: 1\ntags: [\"moveForward\", \"collectItem\", \"basic\", \"sequence\"]\nauthor: system\nversion: 1\ndescription: \"Sequential commands without loops - basic movement and collection\"\n---\n\n# Simple Sequence\n\nLearn the basics of sequential programming by executing commands in order.\n\n## Learning Goals\n- Understand sequential execution\n- Practice basic commands\n- Learn that each command runs one after another\n\n## Solution & Parameters\n\n```js\n// Parameters\nvar _MIN_STEPS_ = 3;\nvar _MAX_STEPS_ = 5;\nvar STEPS = random(_MIN_STEPS_, _MAX_STEPS_);\n\n// Solution\n// Simple sequence of move and collect\nmoveForward();\n\nfor (let i = 0; i < STEPS; i++) {\n  moveForward();\n  collectItem();\n}\nmoveForward();\n```\n"
  }
];
