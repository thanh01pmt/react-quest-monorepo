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
        "defaultValue": 6
      }
    ],
    "solutionCode": "// Parameters\nvar _MIN_PATH_LENGTH_ = 3;\nvar _MAX_PATH_LENGTH_ = 6;\nvar PATH_LENGTH = random(_MIN_PATH_LENGTH_, _MAX_PATH_LENGTH_);\n\n// Solution\nmoveForward();\n\nfor (let i = 0; i < PATH_LENGTH; i++) {\n  if (isItemPresent('crystal')) {\n    collectItem();\n  } else if (isItemPresent('switch')) {\n    toggleSwitch();\n  }\n  moveForward();\n}\n\nmoveForward();",
    "descriptionMarkdown": "# Crystal or Switch\n\nLearn to make decisions based on what's in front of you.\n\n## Learning Goals\n- Use if-else for decision making\n- Detect items in the environment\n- Choose correct action based on condition\n\n## Solution & Parameters",
    "rawContent": "---\nid: crystal-or-switch\nname: \"Crystal or Switch\"\ncategory: conditional\nconcepts: [\"if_else\"]\ndifficulty: 4\ntags: [\"if\", \"else\", \"detect\"]\nauthor: system\nversion: 2\ndescription: \"Decide whether to collect crystal or activate switch\"\n---\n\n# Crystal or Switch\n\nLearn to make decisions based on what's in front of you.\n\n## Learning Goals\n- Use if-else for decision making\n- Detect items in the environment\n- Choose correct action based on condition\n\n## Solution & Parameters\n\n```js\n// Parameters\nvar _MIN_PATH_LENGTH_ = 3;\nvar _MAX_PATH_LENGTH_ = 6;\nvar PATH_LENGTH = random(_MIN_PATH_LENGTH_, _MAX_PATH_LENGTH_);\n\n// Solution\nmoveForward();\n\nfor (let i = 0; i < PATH_LENGTH; i++) {\n  if (isItemPresent('crystal')) {\n    collectItem();\n  } else if (isItemPresent('switch')) {\n    toggleSwitch();\n  }\n  moveForward();\n}\n\nmoveForward();\n```\n\n",
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
        "defaultValue": 5
      }
    ],
    "solutionCode": "// Parameters\nvar _MIN_PATH_ = 3;\nvar _MAX_PATH_ = 5;\nvar PATH_LEN = random(_MIN_PATH_, _MAX_PATH_);\n\n// Solution\nmoveForward();\n\nfor (let i = 0; i < PATH_LEN; i++) {\n  if (isItemPresent('crystal')) {\n    collectItem();\n  }\n  moveForward();\n}\n\nmoveForward();",
    "descriptionMarkdown": "# Simple If\n\nLearn to use a simple if statement to make decisions.\n\n## Learning Goals\n- Understand if statement\n- Make conditional decisions\n- Check conditions\n\n## Solution & Parameters",
    "rawContent": "---\nid: if-simple\nname: \"Simple If\"\ncategory: conditional\nconcepts: [\"if_simple\"]\ndifficulty: 2\ntags: [\"conditional\", \"if\", \"decision\"]\nauthor: system\nversion: 3\ndescription: \"Use simple if statement to collect crystals\"\n---\n\n# Simple If\n\nLearn to use a simple if statement to make decisions.\n\n## Learning Goals\n- Understand if statement\n- Make conditional decisions\n- Check conditions\n\n## Solution & Parameters\n\n```js\n// Parameters\nvar _MIN_PATH_ = 3;\nvar _MAX_PATH_ = 5;\nvar PATH_LEN = random(_MIN_PATH_, _MAX_PATH_);\n\n// Solution\nmoveForward();\n\nfor (let i = 0; i < PATH_LEN; i++) {\n  if (isItemPresent('crystal')) {\n    collectItem();\n  }\n  moveForward();\n}\n\nmoveForward();\n```\n\n",
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
        "defaultValue": 2
      },
      {
        "name": "_MAX_LEN_",
        "displayName": "Max Len",
        "type": "number",
        "defaultValue": 3
      }
    ],
    "solutionCode": "// Parameters\nvar _MIN_LEN_ = 2;\nvar _MAX_LEN_ = 3;\nvar LEN = random(_MIN_LEN_, _MAX_LEN_);\n\n// Helper function\nfunction turnAround() {\n  turnRight();\n  turnRight();\n}\n\n// Solution\nfunction drawPetal() {\n  // Go out\n  for (let i = 0; i < LEN; i++) { \n    moveForward(); \n    collectItem(); \n  }\n  // Return\n  turnAround();\n  for (let i = 0; i < LEN; i++) { \n    moveForward(); \n  }\n  // Face next direction (90 deg rot)\n  turnAround();\n  turnRight();\n}\n\n// Main - draw 4 petals\nfor (let k = 0; k < 4; k++) {\n  drawPetal();\n}\n\n// Exit path (move away from center to ensure finish != start)\nmoveForward();\ncollectItem();\nmoveForward();",
    "descriptionMarkdown": "# Flower Pattern\n\nA radial pattern where the code draws a \"petal\" and returns to center.\n\n## Academic Concept: Radial Symmetry / Reset State\n- Function must Perform Action AND Return to initial state (Center, Facing Out) to be reusable in a loop.\n\n## Solution & Parameters",
    "rawContent": "---\nid: decomp-flower\nname: \"Flower Pattern\"\ncategory: decomposition\nconcepts: [\"function\", \"geometry\", \"nested_loop\"]\ndifficulty: 5\ntags: [\"function\", \"pattern\", \"radial\"]\nauthor: system\nversion: 2\ndescription: \"Draw petals around a center point\"\n---\n\n# Flower Pattern\n\nA radial pattern where the code draws a \"petal\" and returns to center.\n\n## Academic Concept: Radial Symmetry / Reset State\n- Function must Perform Action AND Return to initial state (Center, Facing Out) to be reusable in a loop.\n\n## Solution & Parameters\n\n```js\n// Parameters\nvar _MIN_LEN_ = 2;\nvar _MAX_LEN_ = 3;\nvar LEN = random(_MIN_LEN_, _MAX_LEN_);\n\n// Helper function\nfunction turnAround() {\n  turnRight();\n  turnRight();\n}\n\n// Solution\nfunction drawPetal() {\n  // Go out\n  for (let i = 0; i < LEN; i++) { \n    moveForward(); \n    collectItem(); \n  }\n  // Return\n  turnAround();\n  for (let i = 0; i < LEN; i++) { \n    moveForward(); \n  }\n  // Face next direction (90 deg rot)\n  turnAround();\n  turnRight();\n}\n\n// Main - draw 4 petals\nfor (let k = 0; k < 4; k++) {\n  drawPetal();\n}\n\n// Exit path (move away from center to ensure finish != start)\nmoveForward();\ncollectItem();\nmoveForward();\n```\n",
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
        "defaultValue": 2
      },
      {
        "name": "_MAX_LEN_",
        "displayName": "Max Len",
        "type": "number",
        "defaultValue": 3
      }
    ],
    "solutionCode": "// Parameters\nvar _MIN_LEN_ = 2;\nvar _MAX_LEN_ = 3;\nvar LEN = random(_MIN_LEN_, _MAX_LEN_);\n\n// Solution\nfunction drawSide() {\n  for (let i = 0; i < LEN; i++) {\n    collectItem();\n    moveForward();\n  }\n  turnRight();\n}\n\n// Main logic - draw 3 sides with turns\nmoveForward();\n\nfor (let k = 0; k < 3; k++) {\n  drawSide();\n}\n\n// Final side without turn (exit path)\nfor (let i = 0; i < LEN; i++) {\n  collectItem();\n  moveForward();\n}\n\nmoveForward();",
    "descriptionMarkdown": "# Square Function\n\nDecompose the square into 4 identical sides.\n\n## Academic Concept: Decomposition\n- Complex Task: Draw Square\n- Sub-Task: Draw Line + Turn\n- Composition: Repeat(Sub-Task, 4)\n\n## Solution & Parameters",
    "rawContent": "---\nid: decomp-square\nname: \"Square Function\"\ncategory: decomposition\nconcepts: [\"function\", \"geometry\"]\ndifficulty: 3\ntags: [\"function\", \"reuse\", \"square\"]\nauthor: system\nversion: 2\ndescription: \"Use a 'Side' function to draw a square\"\n---\n\n# Square Function\n\nDecompose the square into 4 identical sides.\n\n## Academic Concept: Decomposition\n- Complex Task: Draw Square\n- Sub-Task: Draw Line + Turn\n- Composition: Repeat(Sub-Task, 4)\n\n## Solution & Parameters\n\n```js\n// Parameters\nvar _MIN_LEN_ = 2;\nvar _MAX_LEN_ = 3;\nvar LEN = random(_MIN_LEN_, _MAX_LEN_);\n\n// Solution\nfunction drawSide() {\n  for (let i = 0; i < LEN; i++) {\n    collectItem();\n    moveForward();\n  }\n  turnRight();\n}\n\n// Main logic - draw 3 sides with turns\nmoveForward();\n\nfor (let k = 0; k < 3; k++) {\n  drawSide();\n}\n\n// Final side without turn (exit path)\nfor (let i = 0; i < LEN; i++) {\n  collectItem();\n  moveForward();\n}\n\nmoveForward();\n```\n",
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
        "defaultValue": 2
      },
      {
        "name": "_MAX_HEIGHT_",
        "displayName": "Max Height",
        "type": "number",
        "defaultValue": 4
      }
    ],
    "solutionCode": "// Parameters\nvar _MIN_HEIGHT_ = 2;\nvar _MAX_HEIGHT_ = 4;\nvar HEIGHT = random(_MIN_HEIGHT_, _MAX_HEIGHT_);\n\n// Solution\nfunction climbStep() {\n  moveForward();\n  jumpUp();\n  collectItem();\n}\n\n// Main\nmoveForward();\n\nfor(let i = 0; i < HEIGHT; i++) {\n  climbStep();\n}\n\nmoveForward();",
    "descriptionMarkdown": "# Staircase Function\n\nDecompose climbing into a single \"Step Up\" action.\n\n## Academic Concept: Procedural Abstraction\n- Abstract \"Move, Jump, Move\" into \"ClimbStep()\"\n\n## Solution & Parameters",
    "rawContent": "---\nid: decomp-stair\nname: \"Staircase Function\"\ncategory: decomposition\nconcepts: [\"function\", \"procedure\"]\ndifficulty: 3\ntags: [\"function\", \"staircase\", \"automation\"]\nauthor: system\nversion: 2\ndescription: \"Use a 'Step' function to climb a staircase\"\n---\n\n# Staircase Function\n\nDecompose climbing into a single \"Step Up\" action.\n\n## Academic Concept: Procedural Abstraction\n- Abstract \"Move, Jump, Move\" into \"ClimbStep()\"\n\n## Solution & Parameters\n\n```js\n// Parameters\nvar _MIN_HEIGHT_ = 2;\nvar _MAX_HEIGHT_ = 4;\nvar HEIGHT = random(_MIN_HEIGHT_, _MAX_HEIGHT_);\n\n// Solution\nfunction climbStep() {\n  moveForward();\n  jumpUp();\n  collectItem();\n}\n\n// Main\nmoveForward();\n\nfor(let i = 0; i < HEIGHT; i++) {\n  climbStep();\n}\n\nmoveForward();\n```\n",
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
      }
    ],
    "solutionCode": "// Parameters\nvar _MIN_COLLECTION_COUNT_ = 3;\nvar _MAX_COLLECTION_COUNT_ = 6;\nvar COLLECTION_COUNT = random(_MIN_COLLECTION_COUNT_, _MAX_COLLECTION_COUNT_);\n\n// Solution\nfunction collectAndMove() {\n  collectItem();\n  moveForward();\n}\n\n// Use the procedure\nmoveForward();\n\nfor (let i = 0; i < COLLECTION_COUNT; i++) {\n  collectAndMove();\n}\n\nmoveForward();",
    "descriptionMarkdown": "# Collect Procedure\n\nCreate a reusable procedure for the collect-and-move pattern.\n\n## Learning Goals\n- Define custom procedures\n- Call procedures to reduce code\n- Understand code reuse\n\n## Solution & Parameters",
    "rawContent": "---\nid: collect-procedure\nname: \"Collect Procedure\"\ncategory: function\nconcepts: [\"procedure_simple\"]\ndifficulty: 4\ntags: [\"procedure\", \"function\", \"reuse\"]\nauthor: system\nversion: 1\ndescription: \"Create and use a procedure for collecting items\"\n---\n\n# Collect Procedure\n\nCreate a reusable procedure for the collect-and-move pattern.\n\n## Learning Goals\n- Define custom procedures\n- Call procedures to reduce code\n- Understand code reuse\n\n## Solution & Parameters\n\n```js\n// Parameters\nvar _MIN_COLLECTION_COUNT_ = 3;\nvar _MAX_COLLECTION_COUNT_ = 6;\nvar COLLECTION_COUNT = random(_MIN_COLLECTION_COUNT_, _MAX_COLLECTION_COUNT_);\n\n// Solution\nfunction collectAndMove() {\n  collectItem();\n  moveForward();\n}\n\n// Use the procedure\nmoveForward();\n\nfor (let i = 0; i < COLLECTION_COUNT; i++) {\n  collectAndMove();\n}\n\nmoveForward();\n```\n",
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
        "defaultValue": 3
      }
    ],
    "solutionCode": "// Parameters\nvar _MIN_PER_CALL_ = 1;\nvar _MAX_PER_CALL_ = 3;\nvar _MIN_CALLS_ = 2;\nvar _MAX_CALLS_ = 3;\nvar PER_CALL = random(_MIN_PER_CALL_, _MAX_PER_CALL_);\nvar CALLS = random(_MIN_CALLS_, _MAX_CALLS_);\n\n// Solution\nfunction collectItems() {\n  for (let i = 0; i < PER_CALL; i++) {\n    collectItem();\n    moveForward();\n  }\n}\n\nmoveForward();\n\n// Zigzag pattern to avoid circular path\nfor (let c = 0; c < CALLS; c++) {\n  collectItems();\n  \n  if (c % 2 == 0) {\n    turnRight();\n    moveForward();\n    turnRight();\n  } else {\n    turnLeft();\n    moveForward();\n    turnLeft();\n  }\n}\n\n// Final segment\ncollectItems();\nmoveForward();",
    "descriptionMarkdown": "# Simple Function\n\nLearn to define and call functions to organize your code.\n\n## Learning Goals\n- Define a function\n- Call a function multiple times\n- Understand code reuse\n\n## Solution & Parameters",
    "rawContent": "---\nid: simple-function\nname: \"Simple Function\"\ncategory: function\nconcepts: [\"procedure_simple\"]\ndifficulty: 3\ntags: [\"function\", \"procedure\", \"reuse\", \"define\"]\nauthor: system\nversion: 2\ndescription: \"Define and call a simple function\"\n---\n\n# Simple Function\n\nLearn to define and call functions to organize your code.\n\n## Learning Goals\n- Define a function\n- Call a function multiple times\n- Understand code reuse\n\n## Solution & Parameters\n\n```js\n// Parameters\nvar _MIN_PER_CALL_ = 1;\nvar _MAX_PER_CALL_ = 3;\nvar _MIN_CALLS_ = 2;\nvar _MAX_CALLS_ = 3;\nvar PER_CALL = random(_MIN_PER_CALL_, _MAX_PER_CALL_);\nvar CALLS = random(_MIN_CALLS_, _MAX_CALLS_);\n\n// Solution\nfunction collectItems() {\n  for (let i = 0; i < PER_CALL; i++) {\n    collectItem();\n    moveForward();\n  }\n}\n\nmoveForward();\n\n// Zigzag pattern to avoid circular path\nfor (let c = 0; c < CALLS; c++) {\n  collectItems();\n  \n  if (c % 2 == 0) {\n    turnRight();\n    moveForward();\n    turnRight();\n  } else {\n    turnLeft();\n    moveForward();\n    turnLeft();\n  }\n}\n\n// Final segment\ncollectItems();\nmoveForward();\n```\n",
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
    "rawContent": "---\nid: zigzag-procedure\nname: \"Zigzag Procedure\"\ncategory: function\nconcepts: [\"procedure_simple\"]\ndifficulty: 4\ntags: [\"procedure\", \"function\", \"zigzag\"]\nauthor: system\nversion: 1\ndescription: \"Create a reusable function to move in a zigzag\"\n---\n\n# Zigzag Procedure\n\nDefine a function for a complex movement pattern and reuse it.\n\n## Solution & Parameters\n\n```js\n// Parameters\nvar _MIN_COUNT_ = 3;\nvar _MAX_COUNT_ = 5;\nvar COUNT = random(_MIN_COUNT_, _MAX_COUNT_);\n\n// Solution\nfunction zigZagStep() {\n  moveForward();\n  turnRight();\n  moveForward();\n  turnLeft();\n  collectItem();\n}\n\nmoveForward();\n\nfor (let i = 0; i < COUNT; i++) {\n  zigZagStep();\n}\n\nmoveForward();\n```\n",
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
        "name": "_MIN_SPACE_",
        "displayName": "Min Space",
        "type": "number",
        "defaultValue": 0
      },
      {
        "name": "_MAX_SPACE_",
        "displayName": "Max Space",
        "type": "number",
        "defaultValue": 1
      }
    ],
    "solutionCode": "// Parameters\nvar _MIN_PAIRS_ = 2;\nvar _MAX_PAIRS_ = 4;\nvar _MIN_SPACE_ = 0;\nvar _MAX_SPACE_ = 1;\n\nvar PAIRS = random(_MIN_PAIRS_, _MAX_PAIRS_);\nvar SPACE = random(_MIN_SPACE_, _MAX_SPACE_);\n\n// Solution\nmoveForward();\n\nfor (let i = 0; i < PAIRS; i++) {\n  // Phase 1: Crystal\n  for (let s = 0; s < SPACE + 1; s++) {\n    moveForward();\n  }\n  collectItem();\n  \n  // Phase 2: Switch\n  for (let s = 0; s < SPACE + 1; s++) {\n    moveForward();\n  }\n  toggleSwitch();\n}\n\nmoveForward();",
    "descriptionMarkdown": "# Alternating Interaction\n\nA complex task requiring the student to recognize two interleaved patterns.\n\n## Academic Concept: Parity (Modulo 2)\n- Even steps: Collect Crystal\n- Odd steps: Toggle Switch\n\n## Solution & Parameters",
    "rawContent": "---\nid: logic-alt-interact\nname: \"Alternating Interaction\"\ncategory: logic\nconcepts: [\"loop\", \"conditional\", \"modulo\"]\ndifficulty: 4\ntags: [\"logic\", \"parity\", \"switch\", \"collect\"]\nauthor: system\nversion: 2\ndescription: \"Alternate between collecting Item and toggling Switch\"\n---\n\n# Alternating Interaction\n\nA complex task requiring the student to recognize two interleaved patterns.\n\n## Academic Concept: Parity (Modulo 2)\n- Even steps: Collect Crystal\n- Odd steps: Toggle Switch\n\n## Solution & Parameters\n\n```js\n// Parameters\nvar _MIN_PAIRS_ = 2;\nvar _MAX_PAIRS_ = 4;\nvar _MIN_SPACE_ = 0;\nvar _MAX_SPACE_ = 1;\n\nvar PAIRS = random(_MIN_PAIRS_, _MAX_PAIRS_);\nvar SPACE = random(_MIN_SPACE_, _MAX_SPACE_);\n\n// Solution\nmoveForward();\n\nfor (let i = 0; i < PAIRS; i++) {\n  // Phase 1: Crystal\n  for (let s = 0; s < SPACE + 1; s++) {\n    moveForward();\n  }\n  collectItem();\n  \n  // Phase 2: Switch\n  for (let s = 0; s < SPACE + 1; s++) {\n    moveForward();\n  }\n  toggleSwitch();\n}\n\nmoveForward();\n```\n",
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
        "defaultValue": 2
      },
      {
        "name": "_MAX_PAIRS_",
        "displayName": "Max Pairs",
        "type": "number",
        "defaultValue": 4
      }
    ],
    "solutionCode": "// Parameters\nvar _MIN_PAIRS_ = 2;\nvar _MAX_PAIRS_ = 4;\nvar PAIRS = random(_MIN_PAIRS_, _MAX_PAIRS_);\n\n// Solution\nmoveForward();\n\nfor (let i = 0; i < PAIRS; i++) {\n  // Even: Walk\n  moveForward();\n  collectItem();\n  \n  // Odd: Jump Up\n  jumpUp();\n  collectItem();\n}\n\nmoveForward();",
    "descriptionMarkdown": "# Alternating Move\n\nA pattern that changes action based on whether the step count is Odd or Even.\n\n## Academic Concept: Parity (Modulo 2)\n- Logic: `if (i % 2 == 0) ActionA else ActionB`\n\n## Solution & Parameters",
    "rawContent": "---\nid: logic-alt-move\nname: \"Alternating Move\"\ncategory: logic\nconcepts: [\"loop\", \"conditional\", \"modulo\"]\ndifficulty: 3\ntags: [\"logic\", \"parity\", \"even_odd\"]\nauthor: system\nversion: 2\ndescription: \"Alternate between walking and jumping, collecting crystals\"\n---\n\n# Alternating Move\n\nA pattern that changes action based on whether the step count is Odd or Even.\n\n## Academic Concept: Parity (Modulo 2)\n- Logic: `if (i % 2 == 0) ActionA else ActionB`\n\n## Solution & Parameters\n\n```js\n// Parameters\nvar _MIN_PAIRS_ = 2;\nvar _MAX_PAIRS_ = 4;\nvar PAIRS = random(_MIN_PAIRS_, _MAX_PAIRS_);\n\n// Solution\nmoveForward();\n\nfor (let i = 0; i < PAIRS; i++) {\n  // Even: Walk\n  moveForward();\n  collectItem();\n  \n  // Odd: Jump Up\n  jumpUp();\n  collectItem();\n}\n\nmoveForward();\n```\n",
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
      }
    ],
    "solutionCode": "// Parameters\nvar _MIN_SIZE_ = 2;\nvar _MAX_SIZE_ = 3;\nvar SIZE = random(_MIN_SIZE_, _MAX_SIZE_);\n\n// Helper function\nfunction turnAround() {\n  turnRight();\n  turnRight();\n}\n\n// Solution\nmoveForward();\n\nfor (let row = 0; row < SIZE; row++) {\n  for (let col = 0; col < SIZE; col++) {\n    // Checkerboard logic: collect only on \"black\" squares\n    if ((row + col) % 2 == 1) {\n      collectItem();\n    }\n    \n    if (col < SIZE - 1) {\n      moveForward();\n    }\n  }\n  \n  // Move to next row (if not last)\n  if (row < SIZE - 1) {\n    // Raster scan: return to start of row, then go up\n    turnAround();\n    for (let k = 0; k < SIZE - 1; k++) {\n      moveForward();\n    }\n    turnLeft();\n    moveForward();\n    turnLeft();\n  }\n}\n\nmoveForward();",
    "descriptionMarkdown": "# Logic Checkerboard\n\nTraverse a 2D grid, but only act when the coordinate sum (row + col) satisfies a parity condition.\n\n## Academic Concept: 2D Parity\n- White square: `(row + col) % 2 == 0`\n- Black square: `(row + col) % 2 == 1`\n\n## Solution & Parameters",
    "rawContent": "---\nid: logic-checkerboard\nname: \"Logic Checkerboard\"\ncategory: logic\nconcepts: [\"nested_loop\", \"conditional\", \"coordinates\"]\ndifficulty: 5\ntags: [\"logic\", \"grid\", \"checkerboard\", \"2d_array\"]\nauthor: system\nversion: 2\ndescription: \"Traverse a grid and interact only on 'Black' squares (checkerboard pattern)\"\n---\n\n# Logic Checkerboard\n\nTraverse a 2D grid, but only act when the coordinate sum (row + col) satisfies a parity condition.\n\n## Academic Concept: 2D Parity\n- White square: `(row + col) % 2 == 0`\n- Black square: `(row + col) % 2 == 1`\n\n## Solution & Parameters\n\n```js\n// Parameters\nvar _MIN_SIZE_ = 2;\nvar _MAX_SIZE_ = 3;\nvar SIZE = random(_MIN_SIZE_, _MAX_SIZE_);\n\n// Helper function\nfunction turnAround() {\n  turnRight();\n  turnRight();\n}\n\n// Solution\nmoveForward();\n\nfor (let row = 0; row < SIZE; row++) {\n  for (let col = 0; col < SIZE; col++) {\n    // Checkerboard logic: collect only on \"black\" squares\n    if ((row + col) % 2 == 1) {\n      collectItem();\n    }\n    \n    if (col < SIZE - 1) {\n      moveForward();\n    }\n  }\n  \n  // Move to next row (if not last)\n  if (row < SIZE - 1) {\n    // Raster scan: return to start of row, then go up\n    turnAround();\n    for (let k = 0; k < SIZE - 1; k++) {\n      moveForward();\n    }\n    turnLeft();\n    moveForward();\n    turnLeft();\n  }\n}\n\nmoveForward();\n```\n",
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
        "defaultValue": 3
      },
      {
        "name": "_MIN_SPACE_CRYSTAL_",
        "displayName": "Min Space Crystal",
        "type": "number",
        "defaultValue": 0
      },
      {
        "name": "_MAX_SPACE_CRYSTAL_",
        "displayName": "Max Space Crystal",
        "type": "number",
        "defaultValue": 2
      },
      {
        "name": "_MIN_SPACE_SWITCH_",
        "displayName": "Min Space Switch",
        "type": "number",
        "defaultValue": 0
      },
      {
        "name": "_MAX_SPACE_SWITCH_",
        "displayName": "Max Space Switch",
        "type": "number",
        "defaultValue": 1
      }
    ],
    "solutionCode": "var _MIN_REPEATS_ = 2;\nvar _MAX_REPEATS_ = 3;\nvar _MIN_SPACE_CRYSTAL_ = 0;\nvar _MAX_SPACE_CRYSTAL_ = 2;\nvar _MIN_SPACE_SWITCH_ = 0;\nvar _MAX_SPACE_SWITCH_ = 1;\n\nvar REPEATS = random(_MIN_REPEATS_, _MAX_REPEATS_);\nvar SPACE_CRYSTAL = random(_MIN_SPACE_CRYSTAL_, _MAX_SPACE_CRYSTAL_);\nvar SPACE_SWITCH = random(_MIN_SPACE_SWITCH_, _MAX_SPACE_SWITCH_);\n\nmoveForward();\n\n// Zigzag pattern to avoid circular path\nfor (let i = 0; i < REPEATS; i++) {\n  // Phase 1: Crystal Spacing\n  for (let c = 0; c < SPACE_CRYSTAL + 1; c++) {\n    moveForward();\n  }\n  collectItem();\n  \n  // Phase 2: Switch Spacing\n  for (let s = 0; s < SPACE_SWITCH + 1; s++) {\n    moveForward();\n  }\n  toggleSwitch();\n  \n  // Alternate turn direction\n  if (i % 2 == 0) {\n    turnRight();\n    moveForward();\n    turnRight();\n  } else {\n    turnLeft();\n    moveForward();\n    turnLeft();\n  }\n}\n\n// Final exit\ncollectItem();\nmoveForward();",
    "descriptionMarkdown": "# Micro Mixed Interact\n\nCollect crystals and toggle switches.\n\n## Solution & Parameters",
    "rawContent": "---\nid: micro-mixed-interact\nname: \"Micro Mixed Interact\"\ncategory: logic\nconcepts: [\"micropattern\", \"crystal\", \"switch\", \"mixed\"]\ndifficulty: 4\ntags: [\"logic\", \"crystal\", \"switch\", \"interact\"]\nauthor: system\nversion: 5\ndescription: \"Collect crystals AND toggle switches with different spacing\"\n---\n\n# Micro Mixed Interact\n\nCollect crystals and toggle switches.\n\n## Solution & Parameters\n\n```js\nvar _MIN_REPEATS_ = 2;\nvar _MAX_REPEATS_ = 3;\nvar _MIN_SPACE_CRYSTAL_ = 0;\nvar _MAX_SPACE_CRYSTAL_ = 2;\nvar _MIN_SPACE_SWITCH_ = 0;\nvar _MAX_SPACE_SWITCH_ = 1;\n\nvar REPEATS = random(_MIN_REPEATS_, _MAX_REPEATS_);\nvar SPACE_CRYSTAL = random(_MIN_SPACE_CRYSTAL_, _MAX_SPACE_CRYSTAL_);\nvar SPACE_SWITCH = random(_MIN_SPACE_SWITCH_, _MAX_SPACE_SWITCH_);\n\nmoveForward();\n\n// Zigzag pattern to avoid circular path\nfor (let i = 0; i < REPEATS; i++) {\n  // Phase 1: Crystal Spacing\n  for (let c = 0; c < SPACE_CRYSTAL + 1; c++) {\n    moveForward();\n  }\n  collectItem();\n  \n  // Phase 2: Switch Spacing\n  for (let s = 0; s < SPACE_SWITCH + 1; s++) {\n    moveForward();\n  }\n  toggleSwitch();\n  \n  // Alternate turn direction\n  if (i % 2 == 0) {\n    turnRight();\n    moveForward();\n    turnRight();\n  } else {\n    turnLeft();\n    moveForward();\n    turnLeft();\n  }\n}\n\n// Final exit\ncollectItem();\nmoveForward();\n```\n",
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
    "solutionCode": "// Parameters\nvar _MIN_STEPS_ = 3;\nvar _MAX_STEPS_ = 5;\nvar STEPS = random(_MIN_STEPS_, _MAX_STEPS_);\n\n// Solution\n// Collect at every other position (skip one step between each)\nmoveForward();\n\nfor (let i = 0; i < STEPS; i++) {\n  collectItem();\n  moveForward();\n  moveForward();  // Skip one position\n}\n\nmoveForward();",
    "descriptionMarkdown": "# Simple Parity\n\nA simple introduction to parity (even/odd) logic.\n\n## Learning Goals\n- Understand even/odd pattern\n- Recognize alternating sequences\n\n## Solution & Parameters",
    "rawContent": "---\nid: logic-simple-parity\nname: \"Simple Parity\"\ncategory: logic\nconcepts: [\"conditional\", \"modulo\"]\ndifficulty: 2\ntags: [\"logic\", \"parity\", \"even_odd\"]\nauthor: system\nversion: 2\ndescription: \"Simple alternating pattern - collect every other step\"\n---\n\n# Simple Parity\n\nA simple introduction to parity (even/odd) logic.\n\n## Learning Goals\n- Understand even/odd pattern\n- Recognize alternating sequences\n\n## Solution & Parameters\n\n```js\n// Parameters\nvar _MIN_STEPS_ = 3;\nvar _MAX_STEPS_ = 5;\nvar STEPS = random(_MIN_STEPS_, _MAX_STEPS_);\n\n// Solution\n// Collect at every other position (skip one step between each)\nmoveForward();\n\nfor (let i = 0; i < STEPS; i++) {\n  collectItem();\n  moveForward();\n  moveForward();  // Skip one position\n}\n\nmoveForward();\n```\n",
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
        "defaultValue": 2
      },
      {
        "name": "_MAX_CYCLES_",
        "displayName": "Max Cycles",
        "type": "number",
        "defaultValue": 3
      }
    ],
    "solutionCode": "// Parameters\nvar _MIN_CYCLES_ = 2;\nvar _MAX_CYCLES_ = 3;\nvar CYCLES = random(_MIN_CYCLES_, _MAX_CYCLES_);\n\n// Solution\nmoveForward();\n\nfor (let i = 0; i < CYCLES; i++) {\n  // Case 0: Move\n  moveForward();\n  \n  // Case 1: Jump Up\n  jumpUp();\n  \n  // Case 2: Collect & Move\n  collectItem();\n  moveForward();\n}\n\nmoveForward();",
    "descriptionMarkdown": "# Three-Way Cycle\n\nA pattern that repeats every 3 steps, teaching Modulo 3 logic.\n\n## Academic Concept: Modulo N\n- Case 0: Action A\n- Case 1: Action B\n- Case 2: Action C\n\n## Solution & Parameters",
    "rawContent": "---\nid: logic-3-way\nname: \"Three-Way Cycle\"\ncategory: logic\nconcepts: [\"loop\", \"conditional\", \"modulo\"]\ndifficulty: 5\ntags: [\"logic\", \"modulo\", \"cycle\", \"pattern\"]\nauthor: system\nversion: 2\ndescription: \"A repeating cycle of 3 actions: Move -> Jump -> Collect\"\n---\n\n# Three-Way Cycle\n\nA pattern that repeats every 3 steps, teaching Modulo 3 logic.\n\n## Academic Concept: Modulo N\n- Case 0: Action A\n- Case 1: Action B\n- Case 2: Action C\n\n## Solution & Parameters\n\n```js\n// Parameters\nvar _MIN_CYCLES_ = 2;\nvar _MAX_CYCLES_ = 3;\nvar CYCLES = random(_MIN_CYCLES_, _MAX_CYCLES_);\n\n// Solution\nmoveForward();\n\nfor (let i = 0; i < CYCLES; i++) {\n  // Case 0: Move\n  moveForward();\n  \n  // Case 1: Jump Up\n  jumpUp();\n  \n  // Case 2: Collect & Move\n  collectItem();\n  moveForward();\n}\n\nmoveForward();\n```\n",
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
    "rawContent": "---\nid: for-with-turns\nname: \"FOR Loop with Turns\"\ncategory: loop\nconcepts: [\"repeat_n\"]\ndifficulty: 2\ntags: [\"for\", \"loop\", \"turn\", \"l-shape\"]\nauthor: system\nversion: 1\ndescription: \"Create an L-shape path using loops with turns\"\n---\n\n# FOR Loop with Turns\n\nCombine FOR loops with turning to create more complex paths.\n\n## Learning Goals\n- Use multiple FOR loops\n- Combine loops with turn commands\n- Create L-shaped paths\n\n## Solution & Parameters\n\n```js\n// Parameters\nvar _MIN_SEGMENT1_ = 2;\nvar _MAX_SEGMENT1_ = 4;\nvar _MIN_SEGMENT2_ = 2;\nvar _MAX_SEGMENT2_ = 4;\nvar SEGMENT1 = random(_MIN_SEGMENT1_, _MAX_SEGMENT1_);\nvar SEGMENT2 = random(_MIN_SEGMENT2_, _MAX_SEGMENT2_);\n\n// Solution\n// L-shape path\nmoveForward();\n\nfor (let i = 0; i < SEGMENT1; i++) {\n  collectItem();\n  moveForward();\n}\n\nturnRight();\n\nfor (let i = 0; i < SEGMENT2; i++) {\n  collectItem();\n  moveForward();\n}\n\nmoveForward();\n```\n",
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
        "defaultValue": 3
      },
      {
        "name": "_MIN_SPACE_",
        "displayName": "Min Space",
        "type": "number",
        "defaultValue": 0
      },
      {
        "name": "_MAX_SPACE_",
        "displayName": "Max Space",
        "type": "number",
        "defaultValue": 2
      }
    ],
    "solutionCode": "var _MIN_REPEATS_ = 2;\nvar _MAX_REPEATS_ = 3;\nvar _MIN_SPACE_ = 0;\nvar _MAX_SPACE_ = 2;\n\nvar REPEATS = random(_MIN_REPEATS_, _MAX_REPEATS_);\nvar SPACE = random(_MIN_SPACE_, _MAX_SPACE_);\n\nmoveForward();\n\n// Zigzag pattern to avoid circular path\nfor (let r = 0; r < REPEATS; r++) {\n  // Collect phase\n  for (let s = 0; s < SPACE + 1; s++) {\n    moveForward();\n  }\n  collectItem();\n  \n  for (let s = 0; s < SPACE + 1; s++) {\n    moveForward();\n  }\n  collectItem();\n  \n  // Alternate turn direction\n  if (r % 2 == 0) {\n    turnRight();\n    moveForward();\n    turnRight();\n  } else {\n    turnLeft();\n    moveForward();\n    turnLeft();\n  }\n}\n\n// Final exit\ncollectItem();\nmoveForward();",
    "descriptionMarkdown": "# Micro Loop Collect\n\nA loop-based pattern that collects crystals, turns, and repeats.\n\n## Solution & Parameters",
    "rawContent": "---\nid: micro-loop-collect\nname: \"Micro Loop Collect\"\ncategory: loop\nconcepts: [\"loop\", \"repeat\", \"spacing\"]\ndifficulty: 3\ntags: [\"loop\", \"crystal\", \"repeat\"]\nauthor: system\nversion: 4\ndescription: \"Use a loop to collect crystals with turns and spacing\"\n---\n\n# Micro Loop Collect\n\nA loop-based pattern that collects crystals, turns, and repeats.\n\n## Solution & Parameters\n\n```js\nvar _MIN_REPEATS_ = 2;\nvar _MAX_REPEATS_ = 3;\nvar _MIN_SPACE_ = 0;\nvar _MAX_SPACE_ = 2;\n\nvar REPEATS = random(_MIN_REPEATS_, _MAX_REPEATS_);\nvar SPACE = random(_MIN_SPACE_, _MAX_SPACE_);\n\nmoveForward();\n\n// Zigzag pattern to avoid circular path\nfor (let r = 0; r < REPEATS; r++) {\n  // Collect phase\n  for (let s = 0; s < SPACE + 1; s++) {\n    moveForward();\n  }\n  collectItem();\n  \n  for (let s = 0; s < SPACE + 1; s++) {\n    moveForward();\n  }\n  collectItem();\n  \n  // Alternate turn direction\n  if (r % 2 == 0) {\n    turnRight();\n    moveForward();\n    turnRight();\n  } else {\n    turnLeft();\n    moveForward();\n    turnLeft();\n  }\n}\n\n// Final exit\ncollectItem();\nmoveForward();\n```\n",
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
        "defaultValue": 1
      },
      {
        "name": "_MAX_PAIRS_",
        "displayName": "Max Pairs",
        "type": "number",
        "defaultValue": 3
      },
      {
        "name": "_SEGMENT_LENGTH_",
        "displayName": "Segment Length",
        "type": "number",
        "defaultValue": 2
      }
    ],
    "solutionCode": "var _MIN_PAIRS_ = 1;\nvar _MAX_PAIRS_ = 3;\nvar _SEGMENT_LENGTH_ = 2;\n\nvar PAIRS = random(_MIN_PAIRS_, _MAX_PAIRS_);\n\nmoveForward();\n\nfor (let p = 0; p < PAIRS; p++) {\n  // === Segment 1 (Right Turn) ===\n  for (let s1 = 0; s1 < _SEGMENT_LENGTH_; s1++) {\n    moveForward();\n  }\n  collectItem();\n  \n  // Turn Right Sequence\n  turnRight();\n  moveForward();\n  turnRight();\n  \n  // === Segment 2 (Left Turn) ===\n  for (let s2 = 0; s2 < _SEGMENT_LENGTH_; s2++) {\n    moveForward();\n  }\n  collectItem();\n  \n  // Turn Left Sequence (prepare for next pair, or end facing forward)\n  turnLeft();\n  moveForward();\n  turnLeft();\n}\n\nmoveForward();",
    "descriptionMarkdown": "# Micro Zigzag Collect\n\nZigzag path with alternating left/right turns.\n\n## Solution & Parameters",
    "rawContent": "---\nid: micro-zigzag-collect\nname: \"Micro Zigzag Collect\"\ncategory: loop\nconcepts: [\"zigzag\", \"turns\", \"alternating\"]\ndifficulty: 4\ntags: [\"loop\", \"zigzag\", \"crystal\"]\nauthor: system\nversion: 4\ndescription: \"Collect crystals in a zigzag pattern with alternating turns\"\n---\n\n# Micro Zigzag Collect\n\nZigzag path with alternating left/right turns.\n\n## Solution & Parameters\n\n```js\nvar _MIN_PAIRS_ = 1;\nvar _MAX_PAIRS_ = 3;\nvar _SEGMENT_LENGTH_ = 2;\n\nvar PAIRS = random(_MIN_PAIRS_, _MAX_PAIRS_);\n\nmoveForward();\n\nfor (let p = 0; p < PAIRS; p++) {\n  // === Segment 1 (Right Turn) ===\n  for (let s1 = 0; s1 < _SEGMENT_LENGTH_; s1++) {\n    moveForward();\n  }\n  collectItem();\n  \n  // Turn Right Sequence\n  turnRight();\n  moveForward();\n  turnRight();\n  \n  // === Segment 2 (Left Turn) ===\n  for (let s2 = 0; s2 < _SEGMENT_LENGTH_; s2++) {\n    moveForward();\n  }\n  collectItem();\n  \n  // Turn Left Sequence (prepare for next pair, or end facing forward)\n  turnLeft();\n  moveForward();\n  turnLeft();\n}\n\nmoveForward();\n```\n",
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
    "rawContent": "---\nid: nested-loops\nname: \"Nested FOR Loops\"\ncategory: loop\nconcepts: [\"nested_loop\"]\ndifficulty: 4\ntags: [\"for\", \"loop\", \"nested\", \"zigzag\", \"grid\"]\nauthor: system\nversion: 1\ndescription: \"Create a zigzag grid pattern using nested loops\"\n---\n\n# Nested FOR Loops\n\nMaster nested loops by creating a grid pattern with zigzag movement.\n\n## Learning Goals\n- Understand nested loop structure\n- Create 2D patterns with loops\n- Handle zigzag traversal\n\n## Solution & Parameters\n\n```js\n// Parameters\nvar _MIN_ROWS_ = 2;\nvar _MAX_ROWS_ = 3;\nvar _MIN_COLS_ = 3;\nvar _MAX_COLS_ = 5;\nvar ROWS = random(_MIN_ROWS_, _MAX_ROWS_);\nvar COLS = random(_MIN_COLS_, _MAX_COLS_);\n\n// Solution\n// Zigzag grid pattern\nmoveForward();\n\nfor (let col = 0; col < COLS; col++) {\n  collectItem();\n  moveForward();\n}\n\nfor (let row = 1; row < ROWS; row++) {\n  turnRight();\n  moveForward();\n  turnRight();\n  \n  for (let col = 0; col < COLS; col++) {\n    collectItem();\n    moveForward();\n  }\n}\n\nmoveForward();\n```\n",
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
    "rawContent": "---\nid: simple-for-loop\nname: \"Simple FOR Loop\"\ncategory: loop\nconcepts: [\"repeat_n\"]\ndifficulty: 2\ntags: [\"for\", \"loop\", \"repeat\", \"crystal\"]\nauthor: system\nversion: 1\ndescription: \"Collect N crystals with random count using a FOR loop\"\n---\n\n# Simple FOR Loop\n\nLearn to use a FOR loop to repeat actions a specific number of times.\n\n## Learning Goals\n- Understand FOR loop syntax\n- Use a counter variable\n- Repeat actions N times\n\n## Solution & Parameters\n\n```js\n// Parameters\nvar _MIN_CRYSTAL_NUM_ = 3;\nvar _MAX_CRYSTAL_NUM_ = 6;\nvar CRYSTAL_NUM = random(_MIN_CRYSTAL_NUM_, _MAX_CRYSTAL_NUM_);\nvar SPACE = 1; // Default spacing\n\n// Solution\n// Collect crystals using a loop\nmoveForward();\n\nfor (let i = 0; i < CRYSTAL_NUM; i++) {\n  collectItem();\n  \n  // Zig-Zag movement\n  turnLeft();\n  moveForward();\n  turnRight();\n  moveForward();\n  \n  // Extra Spacing if needed\n  for(let j=0; j<SPACE; j++) {\n    moveForward();\n  }\n}\n\nmoveForward();\n```\n",
    "hints": {
      "title": "Simple FOR Loop",
      "description": "Learn to use a FOR loop to repeat actions a specific number of times.",
      "learningGoals": "- Understand FOR loop syntax",
      "goalDetails": [
        "Use a counter variable",
        "Repeat actions N times"
      ]
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
        "defaultValue": 2
      },
      {
        "name": "_MAX_SIDE_",
        "displayName": "Max Side",
        "type": "number",
        "defaultValue": 3
      }
    ],
    "solutionCode": "// Parameters\nvar _MIN_SIDE_ = 2;\nvar _MAX_SIDE_ = 3;\nvar SIDE = random(_MIN_SIDE_, _MAX_SIDE_);\n\n// Solution\n// Square pattern (3 sides only to avoid returning to start)\nmoveForward();\n\nfor (let side = 0; side < 3; side++) {\n  for (let step = 0; step < SIDE; step++) {\n    collectItem();\n    moveForward();\n  }\n  turnRight();\n}\n\n// Final side (partial) to exit\nfor (let step = 0; step < SIDE; step++) {\n  collectItem();\n  moveForward();\n}\n\nmoveForward();",
    "descriptionMarkdown": "# Square Pattern\n\nUse nested loops to walk around a square, collecting items along the way.\n\n## Learning Goals\n- Understand nested loops\n- Use outer loop for sides\n- Use inner loop for steps\n\n## Solution & Parameters",
    "rawContent": "---\nid: square-pattern\nname: \"Square Pattern\"\ncategory: loop\nconcepts: [\"repeat_n\", \"nested_loop\"]\ndifficulty: 3\ntags: [\"for\", \"loop\", \"nested\", \"square\", \"pattern\"]\nauthor: system\nversion: 2\ndescription: \"Walk around a square using nested loops\"\n---\n\n# Square Pattern\n\nUse nested loops to walk around a square, collecting items along the way.\n\n## Learning Goals\n- Understand nested loops\n- Use outer loop for sides\n- Use inner loop for steps\n\n## Solution & Parameters\n\n```js\n// Parameters\nvar _MIN_SIDE_ = 2;\nvar _MAX_SIDE_ = 3;\nvar SIDE = random(_MIN_SIDE_, _MAX_SIDE_);\n\n// Solution\n// Square pattern (3 sides only to avoid returning to start)\nmoveForward();\n\nfor (let side = 0; side < 3; side++) {\n  for (let step = 0; step < SIDE; step++) {\n    collectItem();\n    moveForward();\n  }\n  turnRight();\n}\n\n// Final side (partial) to exit\nfor (let step = 0; step < SIDE; step++) {\n  collectItem();\n  moveForward();\n}\n\nmoveForward();\n```\n",
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
        "defaultValue": 2
      },
      {
        "name": "_MAX_STEPS_",
        "displayName": "Max Steps",
        "type": "number",
        "defaultValue": 5
      }
    ],
    "solutionCode": "// Parameters\nvar _MIN_STEPS_ = 2;\nvar _MAX_STEPS_ = 5;\nvar STEPS = random(_MIN_STEPS_, _MAX_STEPS_);\n\n// Solution\nmoveForward();\n\nfor (let i = 0; i < STEPS; i++) {\n  collectItem();\n  moveForward();\n  jumpUp();\n}\n\ncollectItem();\nmoveForward();",
    "descriptionMarkdown": "# Staircase Climb\n\nClimb a staircase by recognizing the repeating pattern of forward + jump.\n\n## Learning Goals\n- Recognize repeating patterns\n- Use `repeat` block effectively\n- Combine movement with jumping\n\n## Solution & Parameters",
    "rawContent": "---\nid: staircase-climb\nname: \"Staircase Climb\"\ncategory: loop\nconcepts: [\"repeat_n\", \"pattern_recognition\"]\ndifficulty: 3\ntags: [\"repeat\", \"pattern\", \"staircase\"]\nauthor: system\nversion: 2\ndescription: \"Climb a staircase and collect crystals at each step\"\n---\n\n# Staircase Climb\n\nClimb a staircase by recognizing the repeating pattern of forward + jump.\n\n## Learning Goals\n- Recognize repeating patterns\n- Use `repeat` block effectively\n- Combine movement with jumping\n\n## Solution & Parameters\n\n```js\n// Parameters\nvar _MIN_STEPS_ = 2;\nvar _MAX_STEPS_ = 5;\nvar STEPS = random(_MIN_STEPS_, _MAX_STEPS_);\n\n// Solution\nmoveForward();\n\nfor (let i = 0; i < STEPS; i++) {\n  collectItem();\n  moveForward();\n  jumpUp();\n}\n\ncollectItem();\nmoveForward();\n```\n",
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
        "defaultValue": 2
      },
      {
        "name": "_MAX_STEPS_",
        "displayName": "Max Steps",
        "type": "number",
        "defaultValue": 5
      }
    ],
    "solutionCode": "// Parameters\nvar _MIN_STEPS_ = 2;\nvar _MAX_STEPS_ = 5;\nvar STEPS = random(_MIN_STEPS_, _MAX_STEPS_);\n\n// Solution\n// Initial entry\nmoveForward();\njumpUp();\n\nfor (let step = 0; step < STEPS; step++) {\n  collectItem();\n  jumpUp();\n}\n\n// Final exit\ncollectItem();\nmoveForward();",
    "descriptionMarkdown": "# Staircase with Jump\n\nUse the jump command to climb a staircase while collecting items.\n\n## Learning Goals\n- Use the jump() command\n- Combine movement with elevation\n- Repeat jump pattern\n\n## Solution & Parameters",
    "rawContent": "---\nid: staircase-jump\nname: \"Staircase with Jump\"\ncategory: loop\nconcepts: [\"repeat_n\"]\ndifficulty: 4\ntags: [\"loop\", \"jump\", \"staircase\", \"elevated\"]\nauthor: system\nversion: 2\ndescription: \"Create elevated terrain using jump command\"\n---\n\n# Staircase with Jump\n\nUse the jump command to climb a staircase while collecting items.\n\n## Learning Goals\n- Use the jump() command\n- Combine movement with elevation\n- Repeat jump pattern\n\n## Solution & Parameters\n\n```js\n// Parameters\nvar _MIN_STEPS_ = 2;\nvar _MAX_STEPS_ = 5;\nvar STEPS = random(_MIN_STEPS_, _MAX_STEPS_);\n\n// Solution\n// Initial entry\nmoveForward();\njumpUp();\n\nfor (let step = 0; step < STEPS; step++) {\n  collectItem();\n  jumpUp();\n}\n\n// Final exit\ncollectItem();\nmoveForward();\n```\n",
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
    "rawContent": "---\nid: zigzag-path\nname: \"Zigzag Path\"\ncategory: loop\nconcepts: [\"repeat_n\"]\ndifficulty: 4\ntags: [\"repeat\", \"turn\", \"zigzag\"]\nauthor: system\nversion: 1\ndescription: \"Navigate a zigzag path and collect crystals at turns\"\n---\n\n# Zigzag Path\n\nNavigate through a zigzag path by repeating the turn-forward pattern.\n\n## Learning Goals\n- Use repeat with multiple commands  \n- Understand turn directions\n- Recognize zigzag pattern\n\n## Solution & Parameters\n\n```js\n// Parameters\nvar _MIN_ZIG_COUNT_ = 3;\nvar _MAX_ZIG_COUNT_ = 5;\nvar ZIG_COUNT = random(_MIN_ZIG_COUNT_, _MAX_ZIG_COUNT_);\n\nvar _MIN_SEGMENT_LENGTH_ = 2;\nvar _MAX_SEGMENT_LENGTH_ = 4;\nvar SEGMENT_LENGTH = random(_MIN_SEGMENT_LENGTH_, _MAX_SEGMENT_LENGTH_);\n\n// Solution\n// Navigate zigzag\nmoveForward();\n\nfor (let i = 0; i < ZIG_COUNT; i++) {\n  for (let j = 0; j < SEGMENT_LENGTH; j++) {\n    moveForward();\n  }\n  collectItem();\n  turnRight();\n  moveForward();\n  turnLeft();\n}\n\ncollectItem();\nmoveForward();\n```\n",
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
      }
    ],
    "solutionCode": "// Parameters\nvar _MIN_MID_LENGTH_ = 1;\nvar _MAX_MID_LENGTH_ = 3;\nvar MID_LENGTH = random(_MIN_MID_LENGTH_, _MAX_MID_LENGTH_);\n\n// Solution\n// Start (A)\nmoveForward();\njumpUp();\n\n// Middle (B repeated)\nfor (let i = 0; i < MID_LENGTH; i++) {\n  collectItem();\n  moveForward();\n}\n\n// Pivot (C)\nturnRight();\nmoveForward();\nturnRight();\n\n// Middle Mirror (B repeated)\nfor (let i = 0; i < MID_LENGTH; i++) {\n  collectItem();\n  moveForward();\n}\n\n// End Mirror (A)\njumpDown();\nmoveForward();",
    "descriptionMarkdown": "# Palindrome Path\n\nA path where the action sequence reads the same backwards and forwards.\n\n## Academic Concept: Palindrome / Symmetry\n- Sequence: $A, B, C, B, A$\n\n## Solution & Parameters",
    "rawContent": "---\nid: mem-palindrome\nname: \"Palindrome Path\"\ncategory: memory\nconcepts: [\"pattern_recognition\", \"string_logic\"]\ndifficulty: 4\ntags: [\"pattern\", \"palindrome\", \"symmetry\"]\nauthor: system\nversion: 2\ndescription: \"Execute a symmetrical sequence of actions (e.g., Jump-Move-Jump)\"\n---\n\n# Palindrome Path\n\nA path where the action sequence reads the same backwards and forwards.\n\n## Academic Concept: Palindrome / Symmetry\n- Sequence: $A, B, C, B, A$\n\n## Solution & Parameters\n\n```js\n// Parameters\nvar _MIN_MID_LENGTH_ = 1;\nvar _MAX_MID_LENGTH_ = 3;\nvar MID_LENGTH = random(_MIN_MID_LENGTH_, _MAX_MID_LENGTH_);\n\n// Solution\n// Start (A)\nmoveForward();\njumpUp();\n\n// Middle (B repeated)\nfor (let i = 0; i < MID_LENGTH; i++) {\n  collectItem();\n  moveForward();\n}\n\n// Pivot (C)\nturnRight();\nmoveForward();\nturnRight();\n\n// Middle Mirror (B repeated)\nfor (let i = 0; i < MID_LENGTH; i++) {\n  collectItem();\n  moveForward();\n}\n\n// End Mirror (A)\njumpDown();\nmoveForward();\n```\n",
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
      }
    ],
    "solutionCode": "// Parameters\nvar _MIN_DIST_ = 2;\nvar _MAX_DIST_ = 4;\nvar D1 = random(_MIN_DIST_, _MAX_DIST_);\nvar D2 = random(_MIN_DIST_, _MAX_DIST_);\n\n// Helper function\nfunction turnAround() {\n  turnRight();\n  turnRight();\n}\n\n// Solution\n// Forward Phase\nfor(let i=0; i<D1; i++) moveForward();\nturnRight();\nfor(let j=0; j<D2; j++) moveForward();\n\n// Collect at destination\ncollectItem();\n\n// Return Phase\nturnAround();\nfor(let j=0; j<D2; j++) moveForward();\nturnLeft();\nfor(let i=0; i<D1; i++) moveForward();\n\n// Advance to Finish (ensures Finish ≠ Start)\nturnLeft();\nmoveForward();\ncollectItem();\nmoveForward();",
    "descriptionMarkdown": "# Path Return\n\nWalk a random path, collect crystal at destination, turn around, return to start, then move to finish.\n\n## Academic Concept: Inverse Operations\n- Operation: `Move` | Inverse: `Move` (after turning 180)\n- Operation: `TurnRight` | Inverse: `TurnLeft`\n- Sequence `[A, B, C]` -> Inverse Sequence `[Inv(C), Inv(B), Inv(A)]` (Stack LIFO)\n\n## Solution & Parameters",
    "rawContent": "---\nid: mem-return\nname: \"Path Return\"\ncategory: memory\nconcepts: [\"function\", \"stack\", \"backtracking\"]\ndifficulty: 4\ntags: [\"memory\", \"pattern\", \"inverse\"]\nauthor: system\nversion: 1\ndescription: \"Walk a path, collect crystal at destination, return, then advance to finish\"\n---\n\n# Path Return\n\nWalk a random path, collect crystal at destination, turn around, return to start, then move to finish.\n\n## Academic Concept: Inverse Operations\n- Operation: `Move` | Inverse: `Move` (after turning 180)\n- Operation: `TurnRight` | Inverse: `TurnLeft`\n- Sequence `[A, B, C]` -> Inverse Sequence `[Inv(C), Inv(B), Inv(A)]` (Stack LIFO)\n\n## Solution & Parameters\n\n```js\n// Parameters\nvar _MIN_DIST_ = 2;\nvar _MAX_DIST_ = 4;\nvar D1 = random(_MIN_DIST_, _MAX_DIST_);\nvar D2 = random(_MIN_DIST_, _MAX_DIST_);\n\n// Helper function\nfunction turnAround() {\n  turnRight();\n  turnRight();\n}\n\n// Solution\n// Forward Phase\nfor(let i=0; i<D1; i++) moveForward();\nturnRight();\nfor(let j=0; j<D2; j++) moveForward();\n\n// Collect at destination\ncollectItem();\n\n// Return Phase\nturnAround();\nfor(let j=0; j<D2; j++) moveForward();\nturnLeft();\nfor(let i=0; i<D1; i++) moveForward();\n\n// Advance to Finish (ensures Finish ≠ Start)\nturnLeft();\nmoveForward();\ncollectItem();\nmoveForward();\n```\n\n",
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
      }
    ],
    "solutionCode": "// Parameters\nvar _MIN_COUNT_ = 2;\nvar _MAX_COUNT_ = 4;\nvar COUNT = random(_MIN_COUNT_, _MAX_COUNT_);\n\n// Helper function\nfunction turnAround() {\n  turnRight();\n  turnRight();\n}\n\n// Solution\n// 1. Activate and Collect\nfor (let i = 0; i < COUNT; i++) {\n  moveForward();\n  collectItem();\n  toggleSwitch();\n}\n\n// 2. Turn Around\nturnAround();\n\n// 3. Deactivate (Undo)\nfor (let i = 0; i < COUNT; i++) {\n  toggleSwitch();\n  moveForward();\n}\n\n// 4. Advance to Finish (ensures Finish ≠ Start)\nturnRight();\nmoveForward();\ncollectItem();\nmoveForward();",
    "descriptionMarkdown": "# Undo Operations\n\nA conceptual task: \"Leave everything as you found it\", then proceed to finish.\n\n## Academic Concept: State Reversion\n- Forward: `Toggle (Off->On)`\n- Backward: `Toggle (On->Off)`\n\n## Solution & Parameters",
    "rawContent": "---\nid: mem-undo\nname: \"Undo Operations\"\ncategory: memory\nconcepts: [\"function\", \"state_machine\"]\ndifficulty: 5\ntags: [\"memory\", \"undo\", \"switch\"]\nauthor: system\nversion: 1\ndescription: \"Collect crystals and activate switches, then undo the switches and advance to finish\"\n---\n\n# Undo Operations\n\nA conceptual task: \"Leave everything as you found it\", then proceed to finish.\n\n## Academic Concept: State Reversion\n- Forward: `Toggle (Off->On)`\n- Backward: `Toggle (On->Off)`\n\n## Solution & Parameters\n\n```js\n// Parameters\nvar _MIN_COUNT_ = 2;\nvar _MAX_COUNT_ = 4;\nvar COUNT = random(_MIN_COUNT_, _MAX_COUNT_);\n\n// Helper function\nfunction turnAround() {\n  turnRight();\n  turnRight();\n}\n\n// Solution\n// 1. Activate and Collect\nfor (let i = 0; i < COUNT; i++) {\n  moveForward();\n  collectItem();\n  toggleSwitch();\n}\n\n// 2. Turn Around\nturnAround();\n\n// 3. Deactivate (Undo)\nfor (let i = 0; i < COUNT; i++) {\n  toggleSwitch();\n  moveForward();\n}\n\n// 4. Advance to Finish (ensures Finish ≠ Start)\nturnRight();\nmoveForward();\ncollectItem();\nmoveForward();\n```\n\n",
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
        "defaultValue": 4
      }
    ],
    "solutionCode": "// Parameters\nvar _MIN_START_ = 1;\nvar _MAX_START_ = 2;\nvar START = random(_MIN_START_, _MAX_START_);\n\nvar _MIN_STEP_ = 1;\nvar _MAX_STEP_ = 2;\nvar STEP = random(_MIN_STEP_, _MAX_STEP_);\n\nvar _MIN_GROUPS_ = 3;\nvar _MAX_GROUPS_ = 4;\nvar GROUPS = random(_MIN_GROUPS_, _MAX_GROUPS_);\n\n// Solution\nmoveForward();\n\nfor (let i = 0; i < GROUPS - 1; i++) {\n  let count = START + i * STEP;\n  for (let j = 0; j < count; j++) {\n    collectItem();\n    moveForward();\n  }\n  \n  turnRight();\n  moveForward();\n  turnRight();\n}\n\n// Last Group (No turn)\nlet lastCount = START + (GROUPS - 1) * STEP;\nfor (let k = 0; k < lastCount; k++) {\n  collectItem();\n  moveForward();\n}",
    "descriptionMarkdown": "# Arithmetic Collect\n\nCollect items where the count increases linearly each time.\n\n## Academic Concept: Arithmetic Progression\n- Sequence: $a, a+d, a+2d, ...$\n- Here: Number of items to collect increases by `STEP`.\n\n## Solution & Parameters",
    "rawContent": "---\nid: arithmetic-collect\nname: \"Arithmetic Collect\"\ncategory: progression\nconcepts: [\"loop\", \"variable\", \"arithmetic_progression\", \"nested_loop\"]\ndifficulty: 4\ntags: [\"math\", \"progression\", \"collect\"]\nauthor: system\nversion: 1\ndescription: \"Collect increasing numbers of items (1, 2, 3...)\"\n---\n\n# Arithmetic Collect\n\nCollect items where the count increases linearly each time.\n\n## Academic Concept: Arithmetic Progression\n- Sequence: $a, a+d, a+2d, ...$\n- Here: Number of items to collect increases by `STEP`.\n\n## Solution & Parameters\n\n```js\n// Parameters\nvar _MIN_START_ = 1;\nvar _MAX_START_ = 2;\nvar START = random(_MIN_START_, _MAX_START_);\n\nvar _MIN_STEP_ = 1;\nvar _MAX_STEP_ = 2;\nvar STEP = random(_MIN_STEP_, _MAX_STEP_);\n\nvar _MIN_GROUPS_ = 3;\nvar _MAX_GROUPS_ = 4;\nvar GROUPS = random(_MIN_GROUPS_, _MAX_GROUPS_);\n\n// Solution\nmoveForward();\n\nfor (let i = 0; i < GROUPS - 1; i++) {\n  let count = START + i * STEP;\n  for (let j = 0; j < count; j++) {\n    collectItem();\n    moveForward();\n  }\n  \n  turnRight();\n  moveForward();\n  turnRight();\n}\n\n// Last Group (No turn)\nlet lastCount = START + (GROUPS - 1) * STEP;\nfor (let k = 0; k < lastCount; k++) {\n  collectItem();\n  moveForward();\n}\n```\n",
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
        "name": "_MIN_ITERATIONS_",
        "displayName": "Min Iterations",
        "type": "number",
        "defaultValue": 2
      },
      {
        "name": "_MAX_ITERATIONS_",
        "displayName": "Max Iterations",
        "type": "number",
        "defaultValue": 4
      }
    ],
    "solutionCode": "// Parameters\nvar _MIN_START_ = 1;\nvar _MAX_START_ = 2;\nvar _MIN_STEP_ = 1;\nvar _MAX_STEP_ = 2;\nvar _MIN_ITERATIONS_ = 2;\nvar _MAX_ITERATIONS_ = 4;\n\nvar START = random(_MIN_START_, _MAX_START_);\nvar STEP = random(_MIN_STEP_, _MAX_STEP_);\nvar ITERATIONS = random(_MIN_ITERATIONS_, _MAX_ITERATIONS_);\n\n// Solution\nmoveForward();\n\nfor (let i = 0; i < ITERATIONS; i++) {\n  let dist = START + i * STEP;\n  for (let j = 0; j < dist; j++) {\n    moveForward();\n  }\n  collectItem();\n  \n  // Turn for next segment (except last)\n  if (i < ITERATIONS - 1) {\n    turnRight();\n  }\n}\n\nmoveForward();",
    "descriptionMarkdown": "# Arithmetic Move\n\nA path where each segment is longer than the previous one by a fixed step.\n\n## Academic Concept: Arithmetic Progression\n- Sequence: $a, a+d, a+2d, ...$\n- Here: Move distance increases by `STEP` each time.\n\n## Solution & Parameters",
    "rawContent": "---\nid: arithmetic-move\nname: \"Arithmetic Move\"\ncategory: progression\nconcepts: [\"loop\", \"variable\", \"arithmetic_progression\"]\ndifficulty: 3\ntags: [\"math\", \"progression\", \"variable_step\"]\nauthor: system\nversion: 2\ndescription: \"Move and collect crystals with increasing distances\"\n---\n\n# Arithmetic Move\n\nA path where each segment is longer than the previous one by a fixed step.\n\n## Academic Concept: Arithmetic Progression\n- Sequence: $a, a+d, a+2d, ...$\n- Here: Move distance increases by `STEP` each time.\n\n## Solution & Parameters\n\n```js\n// Parameters\nvar _MIN_START_ = 1;\nvar _MAX_START_ = 2;\nvar _MIN_STEP_ = 1;\nvar _MAX_STEP_ = 2;\nvar _MIN_ITERATIONS_ = 2;\nvar _MAX_ITERATIONS_ = 4;\n\nvar START = random(_MIN_START_, _MAX_START_);\nvar STEP = random(_MIN_STEP_, _MAX_STEP_);\nvar ITERATIONS = random(_MIN_ITERATIONS_, _MAX_ITERATIONS_);\n\n// Solution\nmoveForward();\n\nfor (let i = 0; i < ITERATIONS; i++) {\n  let dist = START + i * STEP;\n  for (let j = 0; j < dist; j++) {\n    moveForward();\n  }\n  collectItem();\n  \n  // Turn for next segment (except last)\n  if (i < ITERATIONS - 1) {\n    turnRight();\n  }\n}\n\nmoveForward();\n```\n",
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
      }
    ],
    "solutionCode": "// Parameters\nvar _MIN_START_LEN_ = 3;\nvar _MAX_START_LEN_ = 5;\nvar START_LEN = random(_MIN_START_LEN_, _MAX_START_LEN_);\nvar STEP = 1;\n\n// Solution\nmoveForward();\n\nfor (let t = 0; t < START_LEN; t++) {\n  let len = START_LEN - t * STEP;\n  \n  if (len > 0) {\n    for (let i = 0; i < len; i++) {\n      moveForward();\n    }\n    collectItem();\n    turnLeft();\n  }\n}\n\nmoveForward();",
    "descriptionMarkdown": "# Decaying Path\n\nA \"convergence\" pattern where movements get smaller and smaller.\n\n## Academic Concept: Arithmetic Decay\n- Sequence: $a, a-d, a-2d, ...$\n- Logic: `dist = MAX - i*STEP`\n\n## Solution & Parameters",
    "rawContent": "---\nid: decaying-path\nname: \"Decaying Path\"\ncategory: progression\nconcepts: [\"loop\", \"variable\", \"arithmetic_progression\"]\ndifficulty: 4\ntags: [\"math\", \"decay\", \"subtraction\"]\nauthor: system\nversion: 2\ndescription: \"Start with long segments and decrease length each turn\"\n---\n\n# Decaying Path\n\nA \"convergence\" pattern where movements get smaller and smaller.\n\n## Academic Concept: Arithmetic Decay\n- Sequence: $a, a-d, a-2d, ...$\n- Logic: `dist = MAX - i*STEP`\n\n## Solution & Parameters\n\n```js\n// Parameters\nvar _MIN_START_LEN_ = 3;\nvar _MAX_START_LEN_ = 5;\nvar START_LEN = random(_MIN_START_LEN_, _MAX_START_LEN_);\nvar STEP = 1;\n\n// Solution\nmoveForward();\n\nfor (let t = 0; t < START_LEN; t++) {\n  let len = START_LEN - t * STEP;\n  \n  if (len > 0) {\n    for (let i = 0; i < len; i++) {\n      moveForward();\n    }\n    collectItem();\n    turnLeft();\n  }\n}\n\nmoveForward();\n```\n",
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
        "defaultValue": 2
      },
      {
        "name": "_MAX_STEPS_",
        "displayName": "Max Steps",
        "type": "number",
        "defaultValue": 5
      }
    ],
    "solutionCode": "// Parameters\nvar _MIN_STEPS_ = 2;\nvar _MAX_STEPS_ = 5;\nvar STEPS = random(_MIN_STEPS_, _MAX_STEPS_);\n\n// Solution\nlet a = 1;\nlet b = 1;\n\n// First step (distance 1)\nmoveForward();\ncollectItem();\nturnRight();\n\n// Second step (distance 1)\nmoveForward();\ncollectItem();\nturnRight();\n\n// Additional Fibonacci steps\nfor (let i = 2; i < STEPS + 1; i++) {\n  let next = a + b;\n  \n  // Move Fibonacci distance\n  for (let j = 0; j < next; j++) {\n    moveForward();\n  }\n  collectItem();\n  turnRight();\n  \n  // Update sequence\n  a = b;\n  b = next;\n}\n\n// Final exit segment (no turn, just continue forward)\nfor (let j = 0; j < b; j++) {\n  collectItem();\n  moveForward();\n}\n\nmoveForward();",
    "descriptionMarkdown": "# Fibonacci Path\n\nA path based on the famous Fibonacci sequence found in nature.\n\n## Academic Concept: Fibonacci Sequence\n- $F_0=0, F_1=1, F_n = F_{n-1} + F_{n-2}$\n- Sequence: 1, 1, 2, 3, 5, 8...\n\n## Solution & Parameters",
    "rawContent": "---\nid: fibonacci-path\nname: \"Fibonacci Path\"\ncategory: progression\nconcepts: [\"loop\", \"variable\", \"fibonacci\"]\ndifficulty: 5\ntags: [\"math\", \"fibonacci\", \"nature\"]\nauthor: system\nversion: 3\ndescription: \"Walk distances following the Fibonacci sequence (1, 1, 2, 3, 5...)\"\n---\n\n# Fibonacci Path\n\nA path based on the famous Fibonacci sequence found in nature.\n\n## Academic Concept: Fibonacci Sequence\n- $F_0=0, F_1=1, F_n = F_{n-1} + F_{n-2}$\n- Sequence: 1, 1, 2, 3, 5, 8...\n\n## Solution & Parameters\n\n```js\n// Parameters\nvar _MIN_STEPS_ = 2;\nvar _MAX_STEPS_ = 5;\nvar STEPS = random(_MIN_STEPS_, _MAX_STEPS_);\n\n// Solution\nlet a = 1;\nlet b = 1;\n\n// First step (distance 1)\nmoveForward();\ncollectItem();\nturnRight();\n\n// Second step (distance 1)\nmoveForward();\ncollectItem();\nturnRight();\n\n// Additional Fibonacci steps\nfor (let i = 2; i < STEPS + 1; i++) {\n  let next = a + b;\n  \n  // Move Fibonacci distance\n  for (let j = 0; j < next; j++) {\n    moveForward();\n  }\n  collectItem();\n  turnRight();\n  \n  // Update sequence\n  a = b;\n  b = next;\n}\n\n// Final exit segment (no turn, just continue forward)\nfor (let j = 0; j < b; j++) {\n  collectItem();\n  moveForward();\n}\n\nmoveForward();\n```\n",
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
        "defaultValue": 2
      },
      {
        "name": "_MAX_TURNS_",
        "displayName": "Max Turns",
        "type": "number",
        "defaultValue": 3
      }
    ],
    "solutionCode": "// Parameters\nvar _MIN_TURNS_ = 2;\nvar _MAX_TURNS_ = 3;\nvar TURNS = random(_MIN_TURNS_, _MAX_TURNS_);\nvar RATIO = 2;\n\n// Solution\nmoveForward();\n\nlet length = 1;\n\nfor (let i = 0; i < TURNS; i++) {\n  // Move side and collect\n  for (let j = 0; j < length; j++) {\n    collectItem();\n    moveForward();\n  }\n  \n  turnRight();\n  length = length * RATIO;\n}\n\n// Final side without turn (exit)\nfor (let j = 0; j < length; j++) {\n  collectItem();\n  moveForward();\n}\n\nmoveForward();",
    "descriptionMarkdown": "# Geometric Spiral\n\nA spiral path that expands exponentially.\n\n## Academic Concept: Geometric Progression\n- Sequence: $a, ar, ar^2, ...$\n- Here: Side length multiplies by `RATIO` (usually 2) each turn.\n\n## Solution & Parameters",
    "rawContent": "---\nid: geometric-spiral\nname: \"Geometric Spiral\"\ncategory: progression\nconcepts: [\"loop\", \"variable\", \"geometric_progression\"]\ndifficulty: 5\ntags: [\"math\", \"spiral\", \"exponential\"]\nauthor: system\nversion: 3\ndescription: \"Walk a spiral where side lengths double (1, 2, 4...)\"\n---\n\n# Geometric Spiral\n\nA spiral path that expands exponentially.\n\n## Academic Concept: Geometric Progression\n- Sequence: $a, ar, ar^2, ...$\n- Here: Side length multiplies by `RATIO` (usually 2) each turn.\n\n## Solution & Parameters\n\n```js\n// Parameters\nvar _MIN_TURNS_ = 2;\nvar _MAX_TURNS_ = 3;\nvar TURNS = random(_MIN_TURNS_, _MAX_TURNS_);\nvar RATIO = 2;\n\n// Solution\nmoveForward();\n\nlet length = 1;\n\nfor (let i = 0; i < TURNS; i++) {\n  // Move side and collect\n  for (let j = 0; j < length; j++) {\n    collectItem();\n    moveForward();\n  }\n  \n  turnRight();\n  length = length * RATIO;\n}\n\n// Final side without turn (exit)\nfor (let j = 0; j < length; j++) {\n  collectItem();\n  moveForward();\n}\n\nmoveForward();\n```\n",
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
        "defaultValue": 2
      },
      {
        "name": "_MAX_GROUPS_",
        "displayName": "Max Groups",
        "type": "number",
        "defaultValue": 4
      }
    ],
    "solutionCode": "// Parameters\nvar _MIN_GROUPS_ = 2;\nvar _MAX_GROUPS_ = 4;\nvar GROUPS = random(_MIN_GROUPS_, _MAX_GROUPS_);\n\n// Solution\n// Walk 1 step, then 2 steps, then 3 steps, etc.\nmoveForward();\n\nfor (let group = 0; group < GROUPS; group++) {\n  let stepsInGroup = group + 1;\n  for (let step = 0; step < stepsInGroup; step++) {\n    collectItem();\n    moveForward();\n  }\n  \n  // Turn for next group (except last)\n  if (group < GROUPS - 1) {\n    turnRight();\n    moveForward();\n    turnLeft();\n  }\n}\n\nmoveForward();",
    "descriptionMarkdown": "# Simple Increase\n\nA simple introduction to increasing patterns.\n\n## Learning Goals\n- Recognize increasing sequences\n- Understand progression\n\n## Solution & Parameters",
    "rawContent": "---\nid: prog-simple-increase\nname: \"Simple Increase\"\ncategory: progression\nconcepts: [\"variable\", \"arithmetic_progression\"]\ndifficulty: 2\ntags: [\"math\", \"progression\", \"increment\"]\nauthor: system\nversion: 3\ndescription: \"Simple increasing pattern (1, 2, 3 steps)\"\n---\n\n# Simple Increase\n\nA simple introduction to increasing patterns.\n\n## Learning Goals\n- Recognize increasing sequences\n- Understand progression\n\n## Solution & Parameters\n\n```js\n// Parameters\nvar _MIN_GROUPS_ = 2;\nvar _MAX_GROUPS_ = 4;\nvar GROUPS = random(_MIN_GROUPS_, _MAX_GROUPS_);\n\n// Solution\n// Walk 1 step, then 2 steps, then 3 steps, etc.\nmoveForward();\n\nfor (let group = 0; group < GROUPS; group++) {\n  let stepsInGroup = group + 1;\n  for (let step = 0; step < stepsInGroup; step++) {\n    collectItem();\n    moveForward();\n  }\n  \n  // Turn for next group (except last)\n  if (group < GROUPS - 1) {\n    turnRight();\n    moveForward();\n    turnLeft();\n  }\n}\n\nmoveForward();\n```\n",
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
        "name": "_MIN_LEN_",
        "displayName": "Min Len",
        "type": "number",
        "defaultValue": 3
      },
      {
        "name": "_MAX_LEN_",
        "displayName": "Max Len",
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
      }
    ],
    "solutionCode": "// Parameters\nvar _MIN_LEN_ = 3;\nvar _MAX_LEN_ = 8;\nvar _INTERACTION_ = 'crystal'; // OPTIONS: crystal, switch, key\n// Straight line = no turns\nvar _TURN_STYLE_ = 'straight';\nvar _TURN_POINT_ = 'null';\nvar _HAS_JUMP_ = 'noJump'; // Default to no jump for basic trail\n\nvar LEN = random(_MIN_LEN_, _MAX_LEN_);\n\n// Solution\nrandomPattern(LEN, _INTERACTION_, _TURN_STYLE_, _TURN_POINT_, _HAS_JUMP_);",
    "descriptionMarkdown": "# Crystal Trail\n\nA simple path with crystals to collect. Perfect for learning basic movement commands.\n\n## Learning Goals\n- Understand sequential execution\n- Practice `moveForward()` command\n- Learn `collectItem()` command\n\n## Solution & Parameters",
    "rawContent": "---\nid: crystal-trail-basic\nname: \"Crystal Trail\"\ncategory: sequential\nconcepts: [\"sequential\"]\ndifficulty: 1\ntags: [\"moveForward\", \"collectItem\", \"basic\"]\nauthor: system\nversion: 1\ndescription: \"Collect crystals along a straight path\"\n---\n\n# Crystal Trail\n\nA simple path with crystals to collect. Perfect for learning basic movement commands.\n\n## Learning Goals\n- Understand sequential execution\n- Practice `moveForward()` command\n- Learn `collectItem()` command\n\n## Solution & Parameters\n\n```js\n// Parameters\nvar _MIN_LEN_ = 3;\nvar _MAX_LEN_ = 8;\nvar _INTERACTION_ = 'crystal'; // OPTIONS: crystal, switch, key\n// Straight line = no turns\nvar _TURN_STYLE_ = 'straight';\nvar _TURN_POINT_ = 'null';\nvar _HAS_JUMP_ = 'noJump'; // Default to no jump for basic trail\n\nvar LEN = random(_MIN_LEN_, _MAX_LEN_);\n\n// Solution\nrandomPattern(LEN, _INTERACTION_, _TURN_STYLE_, _TURN_POINT_, _HAS_JUMP_);\n```\n",
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
      "version": 2,
      "description": "Two identical straight segments with a right turn between them"
    },
    "parameters": [
      {
        "name": "_MIN_STEPS_",
        "displayName": "Min Steps",
        "type": "number",
        "defaultValue": 6
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
      },
      {
        "name": "_SEED_",
        "displayName": "Seed",
        "type": "number",
        "defaultValue": 99999
      }
    ],
    "solutionCode": "// Parameters\nvar _MIN_STEPS_ = 6;\nvar _MAX_STEPS_ = 8;\nvar _INTERACTION_ = 'crystal'; // OPTIONS: crystal, switch, key\nvar _TURN_STYLE_ = 'straight'; // OPTIONS: straight, turnLeft, turnRight\nvar _TURN_POINT_ = 'null'; // OPTIONS: null, start, end, mid\nvar _HAS_JUMP_ = 'noJump'; // OPTIONS: random, withJump, noJump\nvar _NO_ITEM_AT_ = 'noItemBoth'; // OPTIONS: noItemStart, noItemEnd, noItemBoth\nvar LEN = random(_MIN_STEPS_, _MAX_STEPS_);\nvar _SEED_ = 99999;\n\n// Solution\n// Segment 1\nrandomPattern(LEN, _INTERACTION_, _TURN_STYLE_, _TURN_POINT_, _HAS_JUMP_, _NO_ITEM_AT_, _SEED_);\nmoveForward();\nturnRight();\n// Segment 2 - identical to Segment 1 (same seed)\nrandomPattern(LEN, _INTERACTION_, _TURN_STYLE_, _TURN_POINT_, _HAS_JUMP_, _NO_ITEM_AT_, _SEED_);",
    "descriptionMarkdown": "# L-Shape Path\n\nTwo identical straight segments connected by a right turn. Demonstrates pattern repetition using seed.\n\n## Solution & Parameters\n\n\n\n## Features\n\n- **Identical segments**: Same `_SEED_` ensures both segments have the same pattern\n- **No items at boundaries**: `noItemBoth` prevents item collisions at junction\n- **Straight movement**: `_TURN_STYLE_ = 'straight'` ensures no turns within segments\n- **No jumping**: `_HAS_JUMP_ = 'noJump'` keeps path flat",
    "rawContent": "---\nid: l-shape-path\nname: \"L-Shape Path\"\ncategory: sequential\nconcepts: [\"sequential\"]\ndifficulty: 2\ntags: [\"moveForward\", \"turn\", \"collectItem\"]\nauthor: system\nversion: 2\ndescription: \"Two identical straight segments with a right turn between them\"\n---\n\n# L-Shape Path\n\nTwo identical straight segments connected by a right turn. Demonstrates pattern repetition using seed.\n\n## Solution & Parameters\n\n```js\n// Parameters\nvar _MIN_STEPS_ = 6;\nvar _MAX_STEPS_ = 8;\nvar _INTERACTION_ = 'crystal'; // OPTIONS: crystal, switch, key\nvar _TURN_STYLE_ = 'straight'; // OPTIONS: straight, turnLeft, turnRight\nvar _TURN_POINT_ = 'null'; // OPTIONS: null, start, end, mid\nvar _HAS_JUMP_ = 'noJump'; // OPTIONS: random, withJump, noJump\nvar _NO_ITEM_AT_ = 'noItemBoth'; // OPTIONS: noItemStart, noItemEnd, noItemBoth\nvar LEN = random(_MIN_STEPS_, _MAX_STEPS_);\nvar _SEED_ = 99999;\n\n// Solution\n// Segment 1\nrandomPattern(LEN, _INTERACTION_, _TURN_STYLE_, _TURN_POINT_, _HAS_JUMP_, _NO_ITEM_AT_, _SEED_);\nmoveForward();\nturnRight();\n// Segment 2 - identical to Segment 1 (same seed)\nrandomPattern(LEN, _INTERACTION_, _TURN_STYLE_, _TURN_POINT_, _HAS_JUMP_, _NO_ITEM_AT_, _SEED_);\n```\n\n## Features\n\n- **Identical segments**: Same `_SEED_` ensures both segments have the same pattern\n- **No items at boundaries**: `noItemBoth` prevents item collisions at junction\n- **Straight movement**: `_TURN_STYLE_ = 'straight'` ensures no turns within segments\n- **No jumping**: `_HAS_JUMP_ = 'noJump'` keeps path flat\n",
    "hints": {
      "title": "L-Shape Path",
      "description": "Two identical straight segments connected by a right turn. Demonstrates pattern repetition using seed.",
      "goalDetails": []
    }
  },
  {
    "metadata": {
      "id": "micro-collect-line",
      "name": "Micro Collect Line",
      "category": "sequential",
      "concepts": [
        "micropattern",
        "spacing",
        "collect"
      ],
      "difficulty": 2,
      "tags": [
        "sequential",
        "crystal",
        "spacing"
      ],
      "author": "system",
      "version": 3,
      "description": "Collect crystals along a line with configurable spacing"
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
      }
    ],
    "solutionCode": "// Parameters\nvar _MIN_LEN_ = 3;\nvar _MAX_LEN_ = 8;\nvar _INTERACTION_ = 'crystal'; // OPTIONS: crystal, switch, key\nvar _TURN_STYLE_ = 'straight';\nvar _TURN_POINT_ = 'null';\nvar _HAS_JUMP_ = 'noJump'; // Line walk typically doesn't jump\n\nvar LEN = random(_MIN_LEN_, _MAX_LEN_);\n\n// Solution\nrandomPattern(LEN, _INTERACTION_, _TURN_STYLE_, _TURN_POINT_, _HAS_JUMP_);",
    "descriptionMarkdown": "# Micro Collect Line\n\nA simple linear path collecting crystals with random spacing between them.\n\n## Solution & Parameters",
    "rawContent": "---\nid: micro-collect-line\nname: \"Micro Collect Line\"\ncategory: sequential\nconcepts: [\"micropattern\", \"spacing\", \"collect\"]\ndifficulty: 2\ntags: [\"sequential\", \"crystal\", \"spacing\"]\nauthor: system\nversion: 3\ndescription: \"Collect crystals along a line with configurable spacing\"\n---\n\n# Micro Collect Line\n\nA simple linear path collecting crystals with random spacing between them.\n\n## Solution & Parameters\n\n```js\n// Parameters\nvar _MIN_LEN_ = 3;\nvar _MAX_LEN_ = 8;\nvar _INTERACTION_ = 'crystal'; // OPTIONS: crystal, switch, key\nvar _TURN_STYLE_ = 'straight';\nvar _TURN_POINT_ = 'null';\nvar _HAS_JUMP_ = 'noJump'; // Line walk typically doesn't jump\n\nvar LEN = random(_MIN_LEN_, _MAX_LEN_);\n\n// Solution\nrandomPattern(LEN, _INTERACTION_, _TURN_STYLE_, _TURN_POINT_, _HAS_JUMP_);\n```\n",
    "hints": {
      "title": "Micro Collect Line",
      "description": "A simple linear path collecting crystals with random spacing between them.",
      "goalDetails": []
    }
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
        "defaultValue": "random"
      }
    ],
    "solutionCode": "// Parameters\nvar _MIN_STEPS_ = 3;\nvar _MAX_STEPS_ = 6;\nvar _INTERACTION_ = 'crystal'; // OPTIONS: crystal, switch, key\nvar _TURN_STYLE_ = 'straight'; // OPTIONS: straight, turnLeft, turnRight\nvar _TURN_POINT_ = 'null'; // OPTIONS: null, start, end, mid\nvar _HAS_JUMP_ = 'random'; // OPTIONS: random, withJump, noJump\nvar LEN = random(_MIN_STEPS_, _MAX_STEPS_);\n\n// Solution\n// Generate a dynamic path using Micro Patterns\n// This will create a random sequence of moves, turns, and collections.\n// Users can adjust:\n// - _INTERACTION_: item type\n// - _TURN_STYLE_: turn direction (only 1 turn allowed per pattern)\n// - _TURN_POINT_: where the turn happens (start/mid/end)\n// - _HAS_JUMP_: enforce or ban jumps\nrandomPattern(LEN, _INTERACTION_, _TURN_STYLE_, _TURN_POINT_, _HAS_JUMP_);",
    "descriptionMarkdown": "# Simple Sequence\n\nLearn the basics of sequential programming by executing commands in order.\n\n## Learning Goals\n- Understand sequential execution\n- Practice basic commands\n- Learn that each command runs one after another\n\n## Solution & Parameters",
    "rawContent": "---\nid: simple-sequence\nname: \"Simple Sequence\"\ncategory: sequential\nconcepts: [\"sequential\"]\ndifficulty: 1\ntags: [\"moveForward\", \"collectItem\", \"basic\", \"sequence\"]\nauthor: system\nversion: 1\ndescription: \"Sequential commands without loops - basic movement and collection\"\n---\n\n# Simple Sequence\n\nLearn the basics of sequential programming by executing commands in order.\n\n## Learning Goals\n- Understand sequential execution\n- Practice basic commands\n- Learn that each command runs one after another\n\n## Solution & Parameters\n\n```js\n// Parameters\nvar _MIN_STEPS_ = 3;\nvar _MAX_STEPS_ = 6;\nvar _INTERACTION_ = 'crystal'; // OPTIONS: crystal, switch, key\nvar _TURN_STYLE_ = 'straight'; // OPTIONS: straight, turnLeft, turnRight\nvar _TURN_POINT_ = 'null'; // OPTIONS: null, start, end, mid\nvar _HAS_JUMP_ = 'random'; // OPTIONS: random, withJump, noJump\nvar LEN = random(_MIN_STEPS_, _MAX_STEPS_);\n\n// Solution\n// Generate a dynamic path using Micro Patterns\n// This will create a random sequence of moves, turns, and collections.\n// Users can adjust:\n// - _INTERACTION_: item type\n// - _TURN_STYLE_: turn direction (only 1 turn allowed per pattern)\n// - _TURN_POINT_: where the turn happens (start/mid/end)\n// - _HAS_JUMP_: enforce or ban jumps\nrandomPattern(LEN, _INTERACTION_, _TURN_STYLE_, _TURN_POINT_, _HAS_JUMP_);\n```\n\n",
    "hints": {
      "title": "Simple Sequence",
      "description": "Learn the basics of sequential programming by executing commands in order.",
      "learningGoals": "- Understand sequential execution",
      "goalDetails": [
        "Practice basic commands",
        "Learn that each command runs one after another"
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
        "defaultValue": 2
      },
      {
        "name": "_MAX_ROUNDS_",
        "displayName": "Max Rounds",
        "type": "number",
        "defaultValue": 3
      }
    ],
    "solutionCode": "// Parameters\nvar _MIN_ROUNDS_ = 2;\nvar _MAX_ROUNDS_ = 3;\nvar ROUNDS = random(_MIN_ROUNDS_, _MAX_ROUNDS_);\n\n// Solution\n// Collect 1, then 2, then 3 crystals per round (zigzag path)\nmoveForward();\n\nfor (let round = 0; round < ROUNDS; round++) {\n  let collectCount = round + 1;\n  for (let i = 0; i < collectCount; i++) {\n    collectItem();\n    moveForward();\n  }\n  \n  // Alternate turn direction to create zigzag (not circular)\n  if (round % 2 == 0) {\n    turnRight();\n    moveForward();\n    turnRight();\n  } else {\n    turnLeft();\n    moveForward();\n    turnLeft();\n  }\n}\n\n// Final exit\ncollectItem();\nmoveForward();",
    "descriptionMarkdown": "# Accumulator Variable\n\nUse a variable to accumulate values (like sum = sum + i).\n\n## Learning Goals\n- Understand accumulator pattern\n- Update variable inside loop\n- Track running total\n\n## Solution & Parameters",
    "rawContent": "---\nid: var-accumulator\nname: \"Accumulator Variable\"\ncategory: variable\nconcepts: [\"accumulator\", \"variable\"]\ndifficulty: 3\ntags: [\"variable\", \"sum\", \"accumulator\"]\nauthor: system\nversion: 3\ndescription: \"Use an accumulator to collect increasing amounts\"\n---\n\n# Accumulator Variable\n\nUse a variable to accumulate values (like sum = sum + i).\n\n## Learning Goals\n- Understand accumulator pattern\n- Update variable inside loop\n- Track running total\n\n## Solution & Parameters\n\n```js\n// Parameters\nvar _MIN_ROUNDS_ = 2;\nvar _MAX_ROUNDS_ = 3;\nvar ROUNDS = random(_MIN_ROUNDS_, _MAX_ROUNDS_);\n\n// Solution\n// Collect 1, then 2, then 3 crystals per round (zigzag path)\nmoveForward();\n\nfor (let round = 0; round < ROUNDS; round++) {\n  let collectCount = round + 1;\n  for (let i = 0; i < collectCount; i++) {\n    collectItem();\n    moveForward();\n  }\n  \n  // Alternate turn direction to create zigzag (not circular)\n  if (round % 2 == 0) {\n    turnRight();\n    moveForward();\n    turnRight();\n  } else {\n    turnLeft();\n    moveForward();\n    turnLeft();\n  }\n}\n\n// Final exit\ncollectItem();\nmoveForward();\n```\n",
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
        "defaultValue": 5
      }
    ],
    "solutionCode": "// Parameters\nvar _MIN_COUNT_ = 3;\nvar _MAX_COUNT_ = 5;\nvar COUNT = random(_MIN_COUNT_, _MAX_COUNT_);\n\n// Solution\n// Use counter to collect COUNT items\nmoveForward();\n\nfor (let i = 0; i < COUNT; i++) {\n  collectItem();\n  moveForward();\n}",
    "descriptionMarkdown": "# Counter Variable\n\nLearn to use a variable as a counter to track progress.\n\n## Learning Goals\n- Understand variable concept\n- Increment a counter\n- Use counter in loop\n\n## Solution & Parameters",
    "rawContent": "---\nid: var-counter\nname: \"Counter Variable\"\ncategory: variable\nconcepts: [\"counter\", \"variable\"]\ndifficulty: 2\ntags: [\"variable\", \"counter\", \"accumulator\"]\nauthor: system\nversion: 1\ndescription: \"Use a counter variable to track collected crystals\"\n---\n\n# Counter Variable\n\nLearn to use a variable as a counter to track progress.\n\n## Learning Goals\n- Understand variable concept\n- Increment a counter\n- Use counter in loop\n\n## Solution & Parameters\n\n```js\n// Parameters\nvar _MIN_COUNT_ = 3;\nvar _MAX_COUNT_ = 5;\nvar COUNT = random(_MIN_COUNT_, _MAX_COUNT_);\n\n// Solution\n// Use counter to collect COUNT items\nmoveForward();\n\nfor (let i = 0; i < COUNT; i++) {\n  collectItem();\n  moveForward();\n}\n```\n",
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
