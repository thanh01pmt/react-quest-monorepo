// packages/quest-player/src/config/toolboxPresets.ts
// Core toolbox presets for teaching programming concepts progressively
// NOTE: This file must be kept in sync with Builder's toolboxPresets.ts
// The Builder uses granular keys (commands_l1_move, loop_micro_repeat, etc.)
// while this file historically only had 6 generic keys.

import type { ToolboxJSON } from '../types';

// Legacy type for backward compatibility
export type ToolboxPresetKey = 
  | 'basic_movement'
  | 'with_actions'
  | 'with_loops'
  | 'with_functions'
  | 'with_conditionals'
  | 'full'
  // Allow any string for dynamic Builder keys
  | (string & {});

export const TOOLBOX_PRESET_LABELS: Record<string, string> = {
  'basic_movement': 'Basic Movement',
  'with_actions': 'With Actions',
  'with_loops': 'With Loops',
  'with_functions': 'With Functions',
  'with_conditionals': 'With Conditionals',
  'full': 'Full',
};

// Type allows any string key while preserving IDE autocomplete for known keys
export const toolboxPresets: Record<string, ToolboxJSON> = {
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
          { "kind": "block", "type": "maze_toggle_switch" },
          {
            "kind": "block",
            "type": "maze_say",
            "inputs": {
              "MSG": {
                "shadow": {
                  "type": "text",
                  "fields": { "TEXT": "Hello" }
                }
              }
            }
          },
          {
            "kind": "block",
            "type": "maze_wait",
            "inputs": {
              "DURATION": {
                "shadow": {
                  "type": "math_number",
                  "fields": { "NUM": 1 }
                }
              }
            }
          },
          {
            "kind": "block",
            "type": "maze_say_for",
            "inputs": {
               "MSG": {
                 "shadow": {
                   "type": "text",
                   "fields": { "TEXT": "Hello" }
                 }
               },
               "DURATION": {
                 "shadow": {
                   "type": "math_number",
                   "fields": { "NUM": 1 }
                 }
               }
            }
          }
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

          { "kind": "block", "type": "maze_item_count" },
          { "kind": "block", "type": "math_random_float" },
          { "kind": "block", "type": "math_round" },
          { "kind": "block", "type": "math_modulo" }
        ]
      },
      {
        "kind": "category",
        "name": "%{BKY_GAMES_CATLISTS}",
        "categorystyle": "list_category",
        "contents": [
          { "kind": "block", "type": "lists_create_with" },
          { "kind": "block", "type": "lists_length" },
          { "kind": "block", "type": "lists_getIndex" },
          { "kind": "block", "type": "lists_setIndex" }
        ]
      },
      {
        "kind": "category",
        "name": "%{BKY_GAMES_CATTEXT}",
        "categorystyle": "text_category",
        "contents": [
          { "kind": "block", "type": "text" },
          { "kind": "block", "type": "text_length" },
          { "kind": "block", "type": "text_join" },
          { "kind": "block", "type": "text_print" }
        ]
      },
      {
        "kind": "category",
        "name": "OOP",
        "categorystyle": "oop_category",
        "contents": [
          { "kind": "block", "type": "oop_character_action" },
          { "kind": "block", "type": "oop_character_sensor" },
          {
            "kind": "block",
            "type": "oop_character_say",
            "inputs": {
              "MSG": {
                "shadow": {
                  "type": "text",
                  "fields": { "TEXT": "Hello" }
                }
              }
            }
          }
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

export function getToolboxPreset(key: ToolboxPresetKey): ToolboxJSON | undefined {
  // Try to find in local presets
  const preset = toolboxPresets[key];
  if (preset) return preset;
  
  // If not found, log warning and return undefined
  // The caller (QuestLoaderService) will handle the fallback
  console.warn(`[getToolboxPreset] Preset key "${key}" not found in Player presets.`);
  return undefined;
}

// Builder-compatible preset keys that Player should support
// These will be added dynamically or via build process
export const BUILDER_PRESET_ALIASES: Record<string, string> = {
  // Map Builder granular keys to closest Player equivalent
  'commands_l1_move': 'basic_movement',
  'commands_l2_turn': 'basic_movement',
  'commands_l3_jump': 'basic_movement',
  'commands_l4_collect': 'with_actions',
  'commands_l5_switch': 'with_actions',
  'commands_l6_comprehensive': 'with_actions',
  'functions_l1_movement_only': 'with_functions',
  'functions_l2_collect_gem': 'with_functions',
  'functions_l3_toggle_switch': 'with_functions',
  'functions_l4_comprehensive': 'with_functions',
  'loops_l1_basic_movement': 'with_loops',
  'loops_l2_with_actions': 'with_loops',
  'loops_l3_functions_integration': 'with_loops',
  'loops_l4_for_loop_only': 'with_loops',
  'full_toolbox': 'full',
  // Add more mappings as needed
};

/**
 * Get toolbox preset with fallback to closest equivalent
 */
export function getToolboxPresetWithFallback(key: string): ToolboxJSON {
  // Try exact match first
  let preset = toolboxPresets[key];
  if (preset) return preset;
  
  // Try alias mapping
  const aliasKey = BUILDER_PRESET_ALIASES[key];
  if (aliasKey) {
    preset = toolboxPresets[aliasKey];
    if (preset) {
      console.log(`[getToolboxPreset] Using fallback "${aliasKey}" for "${key}"`);
      return preset;
    }
  }
  
  // Ultimate fallback: full toolbox
  console.warn(`[getToolboxPreset] No preset found for "${key}", using "full" as fallback`);
  return toolboxPresets['full'];
}
