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
      },
      {
        "name": "_PATH_LENGTH_",
        "displayName": "Path Length",
        "type": "int",
        "minRef": "_MIN_PATH_LENGTH_",
        "maxRef": "_MAX_PATH_LENGTH_"
      }
    ],
    "solutionCode": "// Parameters\nvar _MIN_PATH_LENGTH_ = 3;\nvar _MAX_PATH_LENGTH_ = 6;\nvar _PATH_LENGTH_ = random(_MIN_PATH_LENGTH_, _MAX_PATH_LENGTH_);\n\n// Solution\nfor (let i = 0; i < _PATH_LENGTH_; i++) {\n  if (isOnCrystal()) {\n    collectItem();\n  } else if (isOnSwitch()) {\n    toggleSwitch();\n  }\n  moveForward();\n}",
    "descriptionMarkdown": "# Crystal or Switch\n\nLearn to make decisions based on what's in front of you.\n\n## Learning Goals\n- Use if-else for decision making\n- Detect items in the environment\n- Choose correct action based on condition\n\n## Solution & Parameters",
    "rawContent": "---\nid: crystal-or-switch\nname: \"Crystal or Switch\"\ncategory: conditional\nconcepts: [\"if_else\"]\ndifficulty: 4\ntags: [\"if\", \"else\", \"detect\"]\nauthor: system\nversion: 1\ndescription: \"Decide whether to collect crystal or activate switch\"\n---\n\n# Crystal or Switch\n\nLearn to make decisions based on what's in front of you.\n\n## Learning Goals\n- Use if-else for decision making\n- Detect items in the environment\n- Choose correct action based on condition\n\n## Solution & Parameters\n\n```js\n// Parameters\nvar _MIN_PATH_LENGTH_ = 3;\nvar _MAX_PATH_LENGTH_ = 6;\nvar _PATH_LENGTH_ = random(_MIN_PATH_LENGTH_, _MAX_PATH_LENGTH_);\n\n// Solution\nfor (let i = 0; i < _PATH_LENGTH_; i++) {\n  if (isOnCrystal()) {\n    collectItem();\n  } else if (isOnSwitch()) {\n    toggleSwitch();\n  }\n  moveForward();\n}\n```\n"
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
        "name": "_COLLECTION_COUNT_",
        "displayName": "Collection Count",
        "type": "int",
        "minRef": "_MIN_COLLECTION_COUNT_",
        "maxRef": "_MAX_COLLECTION_COUNT_"
      }
    ],
    "solutionCode": "// Parameters\nvar _MIN_COLLECTION_COUNT_ = 3;\nvar _MAX_COLLECTION_COUNT_ = 6;\nvar _COLLECTION_COUNT_ = random(_MIN_COLLECTION_COUNT_, _MAX_COLLECTION_COUNT_);\n\n// Solution\nfunction collectAndMove() {\n  collectItem();\n  moveForward();\n}\n\n// Use the procedure\nfor (let i = 0; i < _COLLECTION_COUNT_; i++) {\n  collectAndMove();\n}",
    "descriptionMarkdown": "# Collect Procedure\n\nCreate a reusable procedure for the collect-and-move pattern.\n\n## Learning Goals\n- Define custom procedures\n- Call procedures to reduce code\n- Understand code reuse\n\n## Solution & Parameters",
    "rawContent": "---\nid: collect-procedure\nname: \"Collect Procedure\"\ncategory: function\nconcepts: [\"procedure_simple\"]\ndifficulty: 4\ntags: [\"procedure\", \"function\", \"reuse\"]\nauthor: system\nversion: 1\ndescription: \"Create and use a procedure for collecting items\"\n---\n\n# Collect Procedure\n\nCreate a reusable procedure for the collect-and-move pattern.\n\n## Learning Goals\n- Define custom procedures\n- Call procedures to reduce code\n- Understand code reuse\n\n## Solution & Parameters\n\n```js\n// Parameters\nvar _MIN_COLLECTION_COUNT_ = 3;\nvar _MAX_COLLECTION_COUNT_ = 6;\nvar _COLLECTION_COUNT_ = random(_MIN_COLLECTION_COUNT_, _MAX_COLLECTION_COUNT_);\n\n// Solution\nfunction collectAndMove() {\n  collectItem();\n  moveForward();\n}\n\n// Use the procedure\nfor (let i = 0; i < _COLLECTION_COUNT_; i++) {\n  collectAndMove();\n}\n```\n"
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
      },
      {
        "name": "_COUNT_",
        "displayName": "Count",
        "type": "int",
        "minRef": "_MIN_COUNT_",
        "maxRef": "_MAX_COUNT_"
      }
    ],
    "solutionCode": "// Parameters\nvar _MIN_COUNT_ = 3;\nvar _MAX_COUNT_ = 5;\nvar _COUNT_ = random(_MIN_COUNT_, _MAX_COUNT_);\n\n// Solution\nfunction zigZagStep() {\n  moveForward();\n  turnRight();\n  moveForward();\n  turnLeft();\n  collectItem();\n}\n\nfor (let i = 0; i < _COUNT_; i++) {\n  zigZagStep();\n}",
    "descriptionMarkdown": "# Zigzag Procedure\n\nDefine a function for a complex movement pattern and reuse it.\n\n## Solution & Parameters",
    "rawContent": "---\nid: zigzag-procedure\nname: \"Zigzag Procedure\"\ncategory: function\nconcepts: [\"procedure_simple\"]\ndifficulty: 4\ntags: [\"procedure\", \"function\", \"zigzag\"]\nauthor: system\nversion: 1\ndescription: \"Create a reusable function to move in a zigzag\"\n---\n\n# Zigzag Procedure\n\nDefine a function for a complex movement pattern and reuse it.\n\n## Solution & Parameters\n\n```js\n// Parameters\nvar _MIN_COUNT_ = 3;\nvar _MAX_COUNT_ = 5;\nvar _COUNT_ = random(_MIN_COUNT_, _MAX_COUNT_);\n\n// Solution\nfunction zigZagStep() {\n  moveForward();\n  turnRight();\n  moveForward();\n  turnLeft();\n  collectItem();\n}\n\nfor (let i = 0; i < _COUNT_; i++) {\n  zigZagStep();\n}\n```\n"
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
      },
      {
        "name": "_STEPS_",
        "displayName": "Steps",
        "type": "int",
        "minRef": "_MIN_STEPS_",
        "maxRef": "_MAX_STEPS_"
      }
    ],
    "solutionCode": "// Parameters\nvar _MIN_STEPS_ = 3;\nvar _MAX_STEPS_ = 8;\nvar _STEPS_ = random(_MIN_STEPS_, _MAX_STEPS_);\n\n// Solution\nfor (let i = 0; i < _STEPS_; i++) {\n  moveForward();\n  jump();\n}\nmoveForward();",
    "descriptionMarkdown": "# Staircase Climb\n\nClimb a staircase by recognizing the repeating pattern of forward + jump.\n\n## Learning Goals\n- Recognize repeating patterns\n- Use `repeat` block effectively\n- Combine movement with jumping\n\n## Solution & Parameters",
    "rawContent": "---\nid: staircase-climb\nname: \"Staircase Climb\"\ncategory: loop\nconcepts: [\"repeat_n\", \"pattern_recognition\"]\ndifficulty: 3\ntags: [\"repeat\", \"pattern\", \"staircase\"]\nauthor: system\nversion: 1\ndescription: \"Climb a staircase using repeat pattern\"\n---\n\n# Staircase Climb\n\nClimb a staircase by recognizing the repeating pattern of forward + jump.\n\n## Learning Goals\n- Recognize repeating patterns\n- Use `repeat` block effectively\n- Combine movement with jumping\n\n## Solution & Parameters\n\n```js\n// Parameters\nvar _MIN_STEPS_ = 3;\nvar _MAX_STEPS_ = 8;\nvar _STEPS_ = random(_MIN_STEPS_, _MAX_STEPS_);\n\n// Solution\nfor (let i = 0; i < _STEPS_; i++) {\n  moveForward();\n  jump();\n}\nmoveForward();\n```\n"
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
        "name": "_ZIG_COUNT_",
        "displayName": "Zig Count",
        "type": "int",
        "minRef": "_MIN_ZIG_COUNT_",
        "maxRef": "_MAX_ZIG_COUNT_"
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
      },
      {
        "name": "_SEGMENT_LENGTH_",
        "displayName": "Segment Length",
        "type": "int",
        "minRef": "_MIN_SEGMENT_LENGTH_",
        "maxRef": "_MAX_SEGMENT_LENGTH_"
      }
    ],
    "solutionCode": "// Parameters\nvar _MIN_ZIG_COUNT_ = 3;\nvar _MAX_ZIG_COUNT_ = 5;\nvar _ZIG_COUNT_ = random(_MIN_ZIG_COUNT_, _MAX_ZIG_COUNT_);\n\nvar _MIN_SEGMENT_LENGTH_ = 2;\nvar _MAX_SEGMENT_LENGTH_ = 4;\nvar _SEGMENT_LENGTH_ = random(_MIN_SEGMENT_LENGTH_, _MAX_SEGMENT_LENGTH_);\n\n// Solution\n// Navigate zigzag\nfor (let i = 0; i < _ZIG_COUNT_; i++) {\n  for (let j = 0; j < _SEGMENT_LENGTH_; j++) {\n    moveForward();\n  }\n  turnRight();\n  moveForward();\n  turnLeft();\n}",
    "descriptionMarkdown": "# Zigzag Path\n\nNavigate through a zigzag path by repeating the turn-forward pattern.\n\n## Learning Goals\n- Use repeat with multiple commands\n- Understand turn directions\n- Recognize zigzag pattern\n\n## Solution & Parameters",
    "rawContent": "---\nid: zigzag-path\nname: \"Zigzag Path\"\ncategory: loop\nconcepts: [\"repeat_n\"]\ndifficulty: 4\ntags: [\"repeat\", \"turn\", \"zigzag\"]\nauthor: system\nversion: 1\ndescription: \"Navigate a zigzag path with turning pattern\"\n---\n\n# Zigzag Path\n\nNavigate through a zigzag path by repeating the turn-forward pattern.\n\n## Learning Goals\n- Use repeat with multiple commands\n- Understand turn directions\n- Recognize zigzag pattern\n\n## Solution & Parameters\n\n```js\n// Parameters\nvar _MIN_ZIG_COUNT_ = 3;\nvar _MAX_ZIG_COUNT_ = 5;\nvar _ZIG_COUNT_ = random(_MIN_ZIG_COUNT_, _MAX_ZIG_COUNT_);\n\nvar _MIN_SEGMENT_LENGTH_ = 2;\nvar _MAX_SEGMENT_LENGTH_ = 4;\nvar _SEGMENT_LENGTH_ = random(_MIN_SEGMENT_LENGTH_, _MAX_SEGMENT_LENGTH_);\n\n// Solution\n// Navigate zigzag\nfor (let i = 0; i < _ZIG_COUNT_; i++) {\n  for (let j = 0; j < _SEGMENT_LENGTH_; j++) {\n    moveForward();\n  }\n  turnRight();\n  moveForward();\n  turnLeft();\n}\n```\n"
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
      },
      {
        "name": "_CRYSTAL_COUNT_",
        "displayName": "Crystal Count",
        "type": "int",
        "minRef": "_MIN_CRYSTAL_COUNT_",
        "maxRef": "_MAX_CRYSTAL_COUNT_"
      }
    ],
    "solutionCode": "// Parameters\nvar _MIN_CRYSTAL_COUNT_ = 3;\nvar _MAX_CRYSTAL_COUNT_ = 8;\nvar _CRYSTAL_COUNT_ = random(_MIN_CRYSTAL_COUNT_, _MAX_CRYSTAL_COUNT_);\n\n// Solution\n// Collect all crystals along the path\nfor (let i = 0; i < _CRYSTAL_COUNT_; i++) {\n  moveForward();\n  collectItem();\n}",
    "descriptionMarkdown": "# Crystal Trail\n\nA simple path with crystals to collect. Perfect for learning basic movement commands.\n\n## Learning Goals\n- Understand sequential execution\n- Practice `moveForward()` command\n- Learn `collectItem()` command\n\n## Solution & Parameters",
    "rawContent": "---\nid: crystal-trail-basic\nname: \"Crystal Trail\"\ncategory: sequential\nconcepts: [\"sequential\"]\ndifficulty: 1\ntags: [\"moveForward\", \"collectItem\", \"basic\"]\nauthor: system\nversion: 1\ndescription: \"Collect crystals along a straight path\"\n---\n\n# Crystal Trail\n\nA simple path with crystals to collect. Perfect for learning basic movement commands.\n\n## Learning Goals\n- Understand sequential execution\n- Practice `moveForward()` command\n- Learn `collectItem()` command\n\n## Solution & Parameters\n\n```js\n// Parameters\nvar _MIN_CRYSTAL_COUNT_ = 3;\nvar _MAX_CRYSTAL_COUNT_ = 8;\nvar _CRYSTAL_COUNT_ = random(_MIN_CRYSTAL_COUNT_, _MAX_CRYSTAL_COUNT_);\n\n// Solution\n// Collect all crystals along the path\nfor (let i = 0; i < _CRYSTAL_COUNT_; i++) {\n  moveForward();\n  collectItem();\n}\n```\n"
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
        "name": "_LEG1_",
        "displayName": "Leg1",
        "type": "int",
        "minRef": "_MIN_LEG1_",
        "maxRef": "_MAX_LEG1_"
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
      },
      {
        "name": "_LEG2_",
        "displayName": "Leg2",
        "type": "int",
        "minRef": "_MIN_LEG2_",
        "maxRef": "_MAX_LEG2_"
      }
    ],
    "solutionCode": "// Parameters\nvar _MIN_LEG1_ = 2;\nvar _MAX_LEG1_ = 5;\nvar _LEG1_ = random(_MIN_LEG1_, _MAX_LEG1_);\n\nvar _MIN_LEG2_ = 2;\nvar _MAX_LEG2_ = 5;\nvar _LEG2_ = random(_MIN_LEG2_, _MAX_LEG2_);\n\n// Solution\nfor (let i = 0; i < _LEG1_; i++) {\n  moveForward();\n  collectItem();\n}\nturnRight();\nfor (let i = 0; i < _LEG2_; i++) {\n  moveForward();\n  collectItem();\n}",
    "descriptionMarkdown": "# L-Shape Path\n\nNavigate a path with a single turn.\n\n## Solution & Parameters",
    "rawContent": "---\nid: l-shape-path\nname: \"L-Shape Path\"\ncategory: sequential\nconcepts: [\"sequential\"]\ndifficulty: 2\ntags: [\"moveForward\", \"turn\", \"collectItem\"]\nauthor: system\nversion: 1\ndescription: \"Follow an L-shaped path collecting crystals\"\n---\n\n# L-Shape Path\n\nNavigate a path with a single turn.\n\n## Solution & Parameters\n\n```js\n// Parameters\nvar _MIN_LEG1_ = 2;\nvar _MAX_LEG1_ = 5;\nvar _LEG1_ = random(_MIN_LEG1_, _MAX_LEG1_);\n\nvar _MIN_LEG2_ = 2;\nvar _MAX_LEG2_ = 5;\nvar _LEG2_ = random(_MIN_LEG2_, _MAX_LEG2_);\n\n// Solution\nfor (let i = 0; i < _LEG1_; i++) {\n  moveForward();\n  collectItem();\n}\nturnRight();\nfor (let i = 0; i < _LEG2_; i++) {\n  moveForward();\n  collectItem();\n}\n```\n"
  }
];
