// packages/quest-player/src/config/toolboxPresets.ts
// Core toolbox presets for teaching programming concepts progressively

import type { ToolboxJSON } from '../types';

export type ToolboxPresetKey = 
  | 'basic_movement'
  | 'with_actions'
  | 'with_loops'
  | 'with_functions'
  | 'with_conditionals'
  | 'full';

export const TOOLBOX_PRESET_LABELS: Record<ToolboxPresetKey, string> = {
  'basic_movement': 'Basic Movement',
  'with_actions': 'With Actions',
  'with_loops': 'With Loops',
  'with_functions': 'With Functions',
  'with_conditionals': 'With Conditionals',
  'full': 'Full',
};

export const toolboxPresets: Record<ToolboxPresetKey, ToolboxJSON> = {
  // Level 1: Basic movement only
  "basic_movement": {
    "kind": "categoryToolbox",
    "contents": [
      {
        "kind": "category",
        "name": "%{BKY_GAMES_CATMOVEMENT}",
        "categorystyle": "movement_category",
        "contents": [
          { "kind": "block", "type": "maze_moveForward" },
          { "kind": "block", "type": "maze_turn" },
          { "kind": "block", "type": "maze_jump" }
        ]
      }
    ]
  },

  // Level 2: Basic + Actions (collect, switch)
  "with_actions": {
    "kind": "categoryToolbox",
    "contents": [
      {
        "kind": "category",
        "name": "%{BKY_GAMES_CATMOVEMENT}",
        "categorystyle": "movement_category",
        "contents": [
          { "kind": "block", "type": "maze_moveForward" },
          { "kind": "block", "type": "maze_turn" },
          { "kind": "block", "type": "maze_jump" }
        ]
      },
      {
        "kind": "category",
        "name": "%{BKY_GAMES_CATACTIONS}",
        "categorystyle": "actions_category",
        "contents": [
          { "kind": "block", "type": "maze_collect" },
          { "kind": "block", "type": "maze_toggle_switch" }
        ]
      }
    ]
  },

  // Level 3: Actions + Loops (maze_repeat)
  "with_loops": {
    "kind": "categoryToolbox",
    "contents": [
      {
        "kind": "category",
        "name": "%{BKY_GAMES_CATMOVEMENT}",
        "categorystyle": "movement_category",
        "contents": [
          { "kind": "block", "type": "maze_moveForward" },
          { "kind": "block", "type": "maze_turn" },
          { "kind": "block", "type": "maze_jump" }
        ]
      },
      {
        "kind": "category",
        "name": "%{BKY_GAMES_CATACTIONS}",
        "categorystyle": "actions_category",
        "contents": [
          { "kind": "block", "type": "maze_collect" },
          { "kind": "block", "type": "maze_toggle_switch" }
        ]
      },
      {
        "kind": "category",
        "name": "%{BKY_GAMES_CATLOOPS}",
        "categorystyle": "loops_category",
        "contents": [
          {
            "kind": "block",
            "type": "maze_repeat",
            "inputs": {
              "TIMES": {
                "shadow": {
                  "type": "math_number",
                  "fields": { "NUM": 5 }
                }
              }
            }
          },
          { "kind": "block", "type": "maze_while" },
          { "kind": "block", "type": "maze_until" }
        ]
      }
    ]
  },

  // Level 4: Loops + Functions (Procedures)
  "with_functions": {
    "kind": "categoryToolbox",
    "contents": [
      {
        "kind": "category",
        "name": "%{BKY_GAMES_CATMOVEMENT}",
        "categorystyle": "movement_category",
        "contents": [
          { "kind": "block", "type": "maze_moveForward" },
          { "kind": "block", "type": "maze_turn" },
          { "kind": "block", "type": "maze_jump" }
        ]
      },
      {
        "kind": "category",
        "name": "%{BKY_GAMES_CATACTIONS}",
        "categorystyle": "actions_category",
        "contents": [
          { "kind": "block", "type": "maze_collect" },
          { "kind": "block", "type": "maze_toggle_switch" }
        ]
      },
      {
        "kind": "category",
        "name": "%{BKY_GAMES_CATLOOPS}",
        "categorystyle": "loops_category",
        "contents": [
          {
            "kind": "block",
            "type": "maze_repeat",
            "inputs": {
              "TIMES": {
                "shadow": {
                  "type": "math_number",
                  "fields": { "NUM": 5 }
                }
              }
            }
          },
          { "kind": "block", "type": "maze_while" },
          { "kind": "block", "type": "maze_until" }
        ]
      },
      { "kind": "sep" },
      {
        "kind": "category",
        "name": "%{BKY_GAMES_CATPROCEDURES}",
        "custom": "PROCEDURE",
        "categorystyle": "procedure_category"
      }
    ]
  },

  // Level 5: Functions + Conditionals (if, sensing blocks)
  "with_conditionals": {
    "kind": "categoryToolbox",
    "contents": [
      {
        "kind": "category",
        "name": "%{BKY_GAMES_CATMOVEMENT}",
        "categorystyle": "movement_category",
        "contents": [
          { "kind": "block", "type": "maze_moveForward" },
          { "kind": "block", "type": "maze_turn" },
          { "kind": "block", "type": "maze_jump" }
        ]
      },
      {
        "kind": "category",
        "name": "%{BKY_GAMES_CATACTIONS}",
        "categorystyle": "actions_category",
        "contents": [
          { "kind": "block", "type": "maze_collect" },
          { "kind": "block", "type": "maze_toggle_switch" }
        ]
      },
      {
        "kind": "category",
        "name": "%{BKY_GAMES_CATLOOPS}",
        "categorystyle": "loops_category",
        "contents": [
          {
            "kind": "block",
            "type": "maze_repeat",
            "inputs": {
              "TIMES": {
                "shadow": {
                  "type": "math_number",
                  "fields": { "NUM": 5 }
                }
              }
            }
          },
          { "kind": "block", "type": "maze_while" },
          { "kind": "block", "type": "maze_until" }
        ]
      },
      {
        "kind": "category",
        "name": "%{BKY_GAMES_CATLOGIC}",
        "categorystyle": "logic_category",
        "contents": [
          { "kind": "block", "type": "controls_if" },
          { "kind": "block", "type": "maze_is_path" },
          { "kind": "block", "type": "maze_is_item_present" },
          { "kind": "block", "type": "maze_is_switch_state" },
          { "kind": "block", "type": "maze_at_finish" }
        ]
      },
      { "kind": "sep" },
      {
        "kind": "category",
        "name": "%{BKY_GAMES_CATPROCEDURES}",
        "custom": "PROCEDURE",
        "categorystyle": "procedure_category"
      }
    ]
  },

  // Level 6: Full - All blocks including variables, math, logic operators
  "full": {
    "kind": "categoryToolbox",
    "contents": [
      {
        "kind": "category",
        "name": "%{BKY_GAMES_CATMOVEMENT}",
        "categorystyle": "movement_category",
        "contents": [
          { "kind": "block", "type": "maze_moveForward" },
          { "kind": "block", "type": "maze_turn" },
          { "kind": "block", "type": "maze_jump" }
        ]
      },
      {
        "kind": "category",
        "name": "%{BKY_GAMES_CATACTIONS}",
        "categorystyle": "actions_category",
        "contents": [
          { "kind": "block", "type": "maze_collect" },
          { "kind": "block", "type": "maze_toggle_switch" }
        ]
      },
      {
        "kind": "category",
        "name": "%{BKY_GAMES_CATLOOPS}",
        "categorystyle": "loops_category",
        "contents": [
          {
            "kind": "block",
            "type": "maze_repeat",
            "inputs": {
              "TIMES": {
                "shadow": {
                  "type": "math_number",
                  "fields": { "NUM": 5 }
                }
              }
            }
          },
          {
            "kind": "block",
            "type": "maze_while",
            "inputs": {
              "BOOL": {
                "shadow": {
                  "type": "maze_is_path",
                  "fields": { "DIR": "path ahead" }
                }
              }
            }
          },
          {
            "kind": "block",
            "type": "maze_until",
            "inputs": {
              "BOOL": {
                "shadow": {
                  "type": "maze_at_finish"
                }
              }
            }
          }
        ]
      },
      {
        "kind": "category",
        "name": "%{BKY_GAMES_CATLOGIC}",
        "categorystyle": "logic_category",
        "contents": [
          { "kind": "block", "type": "controls_if" },
          { "kind": "block", "type": "logic_compare" },
          { "kind": "block", "type": "logic_operation" },
          { "kind": "block", "type": "logic_negate" },
          { "kind": "block", "type": "maze_is_path" },
          { "kind": "block", "type": "maze_is_item_present" },
          { "kind": "block", "type": "maze_is_switch_state" },
          { "kind": "block", "type": "maze_at_finish" }
        ]
      },
      {
        "kind": "category",
        "name": "%{BKY_GAMES_CATMATH}",
        "categorystyle": "math_category",
        "contents": [
          { "kind": "block", "type": "math_number" },
          {
            "kind": "block",
            "type": "math_arithmetic",
            "inputs": {
              "A": { "shadow": { "type": "math_number", "fields": { "NUM": 1 } } },
              "B": { "shadow": { "type": "math_number", "fields": { "NUM": 1 } } }
            }
          },
          { "kind": "block", "type": "maze_item_count" }
        ]
      },
      { "kind": "sep" },
      {
        "kind": "category",
        "name": "%{BKY_GAMES_CATVARIABLES}",
        "custom": "VARIABLE",
        "categorystyle": "variable_category"
      },
      {
        "kind": "category",
        "name": "%{BKY_GAMES_CATPROCEDURES}",
        "custom": "PROCEDURE",
        "categorystyle": "procedure_category"
      }
    ]
  }
};

export function getToolboxPreset(key: ToolboxPresetKey): ToolboxJSON {
  return toolboxPresets[key];
}
