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
    "solutionCode": "// Parameters\nvar _MIN_CRYSTAL_NUM_ = 3;\nvar _MAX_CRYSTAL_NUM_ = 6;\nvar CRYSTAL_NUM = random(_MIN_CRYSTAL_NUM_, _MAX_CRYSTAL_NUM_);\n\n// Solution\n// Collect crystals using a loop\nmoveForward();\n\nfor (let i = 0; i < CRYSTAL_NUM; i++) {\n  collectItem();\n  moveForward();\n}\n\nmoveForward();",
    "descriptionMarkdown": "# Simple FOR Loop\n\nLearn to use a FOR loop to repeat actions a specific number of times.\n\n## Learning Goals\n- Understand FOR loop syntax\n- Use a counter variable\n- Repeat actions N times\n\n## Solution & Parameters",
    "rawContent": "---\nid: simple-for-loop\nname: \"Simple FOR Loop\"\ncategory: loop\nconcepts: [\"repeat_n\"]\ndifficulty: 2\ntags: [\"for\", \"loop\", \"repeat\", \"crystal\"]\nauthor: system\nversion: 1\ndescription: \"Collect N crystals with random count using a FOR loop\"\n---\n\n# Simple FOR Loop\n\nLearn to use a FOR loop to repeat actions a specific number of times.\n\n## Learning Goals\n- Understand FOR loop syntax\n- Use a counter variable\n- Repeat actions N times\n\n## Solution & Parameters\n\n```js\n// Parameters\nvar _MIN_CRYSTAL_NUM_ = 3;\nvar _MAX_CRYSTAL_NUM_ = 6;\nvar CRYSTAL_NUM = random(_MIN_CRYSTAL_NUM_, _MAX_CRYSTAL_NUM_);\n\n// Solution\n// Collect crystals using a loop\nmoveForward();\n\nfor (let i = 0; i < CRYSTAL_NUM; i++) {\n  collectItem();\n  moveForward();\n}\n\nmoveForward();\n```\n"
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
      "description": "Climb a staircase using repeat pattern"
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
    "solutionCode": "// Parameters\nvar _MIN_STEPS_ = 3;\nvar _MAX_STEPS_ = 8;\nvar STEPS = random(_MIN_STEPS_, _MAX_STEPS_);\n\n// Solution\nmoveForward();\n\nfor (let i = 0; i < STEPS; i++) {\n  moveForward();\n  jump();\n}\nmoveForward();",
    "descriptionMarkdown": "# Staircase Climb\n\nClimb a staircase by recognizing the repeating pattern of forward + jump.\n\n## Learning Goals\n- Recognize repeating patterns\n- Use `repeat` block effectively\n- Combine movement with jumping\n\n## Solution & Parameters",
    "rawContent": "---\nid: staircase-climb\nname: \"Staircase Climb\"\ncategory: loop\nconcepts: [\"repeat_n\", \"pattern_recognition\"]\ndifficulty: 3\ntags: [\"repeat\", \"pattern\", \"staircase\"]\nauthor: system\nversion: 1\ndescription: \"Climb a staircase using repeat pattern\"\n---\n\n# Staircase Climb\n\nClimb a staircase by recognizing the repeating pattern of forward + jump.\n\n## Learning Goals\n- Recognize repeating patterns\n- Use `repeat` block effectively\n- Combine movement with jumping\n\n## Solution & Parameters\n\n```js\n// Parameters\nvar _MIN_STEPS_ = 3;\nvar _MAX_STEPS_ = 8;\nvar STEPS = random(_MIN_STEPS_, _MAX_STEPS_);\n\n// Solution\nmoveForward();\n\nfor (let i = 0; i < STEPS; i++) {\n  moveForward();\n  jump();\n}\nmoveForward();\n```\n"
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
      "description": "Navigate a zigzag path with turning pattern"
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
    "solutionCode": "// Parameters\nvar _MIN_ZIG_COUNT_ = 3;\nvar _MAX_ZIG_COUNT_ = 5;\nvar ZIG_COUNT = random(_MIN_ZIG_COUNT_, _MAX_ZIG_COUNT_);\n\nvar _MIN_SEGMENT_LENGTH_ = 2;\nvar _MAX_SEGMENT_LENGTH_ = 4;\nvar SEGMENT_LENGTH = random(_MIN_SEGMENT_LENGTH_, _MAX_SEGMENT_LENGTH_);\n\n// Solution\n// Navigate zigzag\nmoveForward();\n\nfor (let i = 0; i < ZIG_COUNT; i++) {\n  for (let j = 0; j < SEGMENT_LENGTH; j++) {\n    moveForward();\n  }\n  turnRight();\n  moveForward();\n  turnLeft();\n}\n\nmoveForward();",
    "descriptionMarkdown": "# Zigzag Path\n\nNavigate through a zigzag path by repeating the turn-forward pattern.\n\n## Learning Goals\n- Use repeat with multiple commands\n- Understand turn directions\n- Recognize zigzag pattern\n\n## Solution & Parameters",
    "rawContent": "---\nid: zigzag-path\nname: \"Zigzag Path\"\ncategory: loop\nconcepts: [\"repeat_n\"]\ndifficulty: 4\ntags: [\"repeat\", \"turn\", \"zigzag\"]\nauthor: system\nversion: 1\ndescription: \"Navigate a zigzag path with turning pattern\"\n---\n\n# Zigzag Path\n\nNavigate through a zigzag path by repeating the turn-forward pattern.\n\n## Learning Goals\n- Use repeat with multiple commands\n- Understand turn directions\n- Recognize zigzag pattern\n\n## Solution & Parameters\n\n```js\n// Parameters\nvar _MIN_ZIG_COUNT_ = 3;\nvar _MAX_ZIG_COUNT_ = 5;\nvar ZIG_COUNT = random(_MIN_ZIG_COUNT_, _MAX_ZIG_COUNT_);\n\nvar _MIN_SEGMENT_LENGTH_ = 2;\nvar _MAX_SEGMENT_LENGTH_ = 4;\nvar SEGMENT_LENGTH = random(_MIN_SEGMENT_LENGTH_, _MAX_SEGMENT_LENGTH_);\n\n// Solution\n// Navigate zigzag\nmoveForward();\n\nfor (let i = 0; i < ZIG_COUNT; i++) {\n  for (let j = 0; j < SEGMENT_LENGTH; j++) {\n    moveForward();\n  }\n  turnRight();\n  moveForward();\n  turnLeft();\n}\n\nmoveForward();\n```\n"
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
