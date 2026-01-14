/**
 * Junior Blocks - Icon-Only Block Definitions for Horizontal Layout
 * 
 * These blocks use icons instead of text labels, designed for younger learners.
 */

import * as Blockly from 'blockly/core';
import { javascriptGenerator } from 'blockly/javascript';
import type { TFunction } from 'i18next';

/**
 * Initialize junior blocks with icon-only designs
 */
export function initJuniorBlocks(t: TFunction, pathToMedia = '/assets/junior/') {
  // Clean up existing junior blocks
  const blocksToDelete = [
    'junior_start',
    'junior_moveForward',
    'junior_turnLeft',
    'junior_turnRight',
    'junior_repeat',
  ];
  
  blocksToDelete.forEach(blockType => {
    if (Blockly.Blocks[blockType]) {
      delete Blockly.Blocks[blockType];
    }
  });

  // ==========================================================================
  // JUNIOR START BLOCK (Hat block with rabbit icon)
  // ==========================================================================
  Blockly.defineBlocksWithJsonArray([
    {
      "type": "junior_start",
      "message0": "%1 %2",
      "args0": [
        {
          "type": "field_image",
          // Authentic Scratch Green Flag
          "src": "data:image/svg+xml;base64,PHN2ZyBpZD0iSWNvbiIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB2aWV3Qm94PSIwIDAgNDAgNDAiPjx0aXRsZT5ncmVlbmZsYWc8L3RpdGxlPjxwYXRoIGQ9Ik0zMy40NywxMC42NHYxMy43YTAuOSwwLjksMCwwLDEtLjMzLjY5LDEwLjI3LDEwLjI3LDAsMCwxLTEzLDAsOC4zNSw4LjM1LDAsMCwwLTUuMjYtMS44OEE4LjE5LDguMTksMCwwLDAsMTAsMjQuNzd2OS4wOWExLDEsMCwwLDEtMiwwVjEwLjY0YTAuOTIsMC45MiwwLDAsMSwuNjEtMC44NywxMC4yNSwxMC4yNSwwLDAsMSwxMi43Ny4xOCw4LjM0LDguMzQsMCwwLDAsMTAuNTIsMCwxLDEsMCwwLDEsMS0uMTRBMC45LDAuOSwwLDAsMSwzMy40NywxMC42NFoiIGZpbGw9IiM0Y2JmNTYiIHN0cm9rZT0iIzQ1OTkzZCIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIiBzdHJva2Utd2lkdGg9IjAuOSIvPjxyZWN0IHg9IjgiIHk9IjYuOTEiIHdpZHRoPSIxLjg4IiBoZWlnaHQ9IjI3Ljg4IiByeD0iMC45NCIgcnk9IjAuOTQiIGZpbGw9IiM0NTk5M2QiIHN0cm9rZT0iIzQ1OTkzZCIgc3Ryb2tlLWxpbmVjYXA9InJvdW5kIiBzdHJva2UtbGluZWpvaW49InJvdW5kIiBzdHJva2Utd2lkdGg9IjAuOSIvPjwvc3ZnPg==",
          "width": 40,
          "height": 40,
          "alt": t('Maze.whenRunClicked', 'When run'),
        },
        {
          "type": "input_dummy"
        }
      ],
      "nextStatement": null,
      "style": "events_category",
      "tooltip": t('Maze.whenRunTooltip', 'Start your program'),
      "inputsInline": true,
    },
    
    // ========================================================================
    // JUNIOR MOVE FORWARD BLOCK
    // ========================================================================
    {
      "type": "junior_moveForward",
      "message0": "%1",
      "args0": [
        {
          "type": "field_image",
          "src": `${pathToMedia}move_forward.svg`,
          "width": 40,
          "height": 40,
          "alt": t('Maze.moveForward', 'Move forward'),
          "flip_rtl": true,
        }
      ],
      "previousStatement": null,
      "nextStatement": null,
      "style": "movement_category",
      "tooltip": t('Maze.moveForwardTooltip', 'Move one step forward'),
      "inputsInline": true,
    },
    
    // ========================================================================
    // JUNIOR TURN LEFT BLOCK
    // ========================================================================
    {
      "type": "junior_turnLeft",
      "message0": "%1",
      "args0": [
        {
          "type": "field_image",
          // Authentic Scratch Rotate Left
          "src": "data:image/svg+xml;base64,PHN2ZyBpZD0icm90YXRlLWNvdW50ZXItY2xvY2t3aXNlIiB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAyNCAyNCI+PGRlZnM+PHN0eWxlPi5jbHMtMXtmaWxsOiMzZDc5Y2M7fS5jbHMtMntmaWxsOiNmZmY7fTwvc3R5bGU+PC9kZWZzPjx0aXRsZT5yb3RhdGUtY291bnRlci1jbG9ja3dpc2U8L3RpdGxlPjxwYXRoIGNsYXNzPSJjbHMtMSIgZD0iTTIyLjY4LDEyLjJhMS42LDEuNiwwLDAsMS0xLjI3LjYzSDEzLjcyYTEuNTksMS41OSwwLDAsMS0xLjE2LTIuNThsMS4xMi0xLjQxYTQuODIsNC44MiwwLDAsMC0zLjE0LS43Nyw0LjMxLDQuMzEsMCwwLDAtMiwuOCw0LjI1LDQuMjUsMCwwLDAtMS4zNCwxLjczLDUuMDYsNS4wNiwwLDAsMCwuNTQsNC42MkE1LjU4LDUuNTgsMCwwLDAsMTIsMTcuNzRoMGEyLjI2LDIuMjYsMCwwLDEtLjE2LDQuNTJBMTAuMjUsMTAuMjUsMCwwLDEsMy43NCwxOCwxMC4xNCwxMC4xNCwwLDAsMSwyLjI1LDguNzgsOS43LDkuNywwLDAsMSw1LjA4LDQuNjQsOS45Miw5LjkyLDAsMCwxLDkuNjYsMi41YTEwLjY2LDEwLjY2LDAsMCwxLDcuNzIsMS42OGwxLjA4LTEuMzVhMS41NywxLjU3LDAsMCwxLDEuMjQtLjYsMS42LDEuNiwwLDAsMSwxLjU0LDEuMjFsMS43LDcuMzdBMS41NywxLjU3LDAsMCwxLDIyLjY4LDEyLjJaIi8+PHBhdGggY2xhc3M9ImNscy0yIiBkPSJNMjEuMzgsMTEuODNIMTMuNzdhLjU5LjU5LDAsMCwxLS40My0xbDEuNzUtMi4xOWE1LjksNS45LDAsMCwwLTQuNy0xLjU4LDUuMDcsNS4wNywwLDAsMC00LjExLDMuMTdBNiw2LDAsMCwwLDcsMTUuNzdhNi41MSw2LjUxLDAsMCwwLDUsMi45MiwxLjMxLDEuMzEsMCwwLDEtLjA4LDIuNjIsOS4zLDkuMywwLDAsMS03LjM1LTMuODJBOS4xNiw5LjE2LDAsMCwxLDMuMTcsOS4xMiw4LjUxLDguNTEsMCwwLDEsNS43MSw1LjQsOC43Niw4Ljc2LDAsMCwxLDkuODIsMy40OGE5LjcxLDkuNzEsMCwwLDEsNy43NSwyLjA3bDEuNjctMi4xYS41OS41OSwwLDAsMSwxLC4yMUwyMiwxMS4wOEEuNTkuNTksMCwwLDEsMjEuMzgsMTEuODNaIi8+PC9zdmc+",
          "width": 40,
          "height": 40,
          "alt": t('Maze.turnLeft', 'Turn left'),
        }
      ],
      "previousStatement": null,
      "nextStatement": null,
      "style": "turn_category",
      "tooltip": t('Maze.turnLeftTooltip', 'Turn 90° left'),
      "inputsInline": true,
    },
    
    // ========================================================================
    // JUNIOR TURN RIGHT BLOCK
    // ========================================================================
    {
      "type": "junior_turnRight",
      "message0": "%1",
      "args0": [
        {
          "type": "field_image",
          // Authentic Scratch Rotate Right
          "src": "data:image/svg+xml;base64,PHN2ZyBpZD0icm90YXRlLWNsb2Nrd2lzZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB2aWV3Qm94PSIwIDAgMjQgMjQiPjxkZWZzPjxzdHlsZT4uY2xzLTF7ZmlsbDojM2Q3OWNjO30uY2xzLTJ7ZmlsbDojZmZmO308L3N0eWxlPjwvZGVmcz48dGl0bGU+cm90YXRlLWNsb2Nrd2lzZTwvdGl0bGU+PHBhdGggY2xhc3M9ImNscy0xIiBkPSJNMjAuMzQsMTguMjFhMTAuMjQsMTAuMjQsMCwwLDEtOC4xLDQuMjIsMi4yNiwyLjI2LDAsMCwxLS4xNi00LjUyaDBhNS41OCw1LjU4LDAsMCwwLDQuMjUtMi41Myw1LjA2LDUuMDYsMCwwLDAsLjU0LTQuNjJBNC4yNSw0LjI1LDAsMCwwLDE1LjU1LDlhNC4zMSw0LjMxLDAsMCwwLTItLjhANC44Miw0LjgyLDAsMCwwLDEwLjQsOWwxLjEyLDEuNDFBMS41OSwxLjU5LDAsMCwxLDEwLjM2LDEzSDIuNjdhMS41NiwxLjU2LDAsMCwxLTEuMjYtLjYzQTEuNTQsMS41NCwwLDAsMSwxLjEzLDExTDIuODUsMy41N0ExLjU5LDEuNTksMCwwLDEsNC4zOCwyLjQsMS41NywxLjU3LDAsMCwxLDUuNjIsM0w2LjcsNC4zNWExMC42NiwxMC42NiwwLDAsMSw3LjcyLTEuNjhBOS44OCw5Ljg4LDAsMCwxLDE5LDQuODEsOS42MSw5LjYxLDAsMCwxLDIxLjgzLDksMTAuMDgsMTAuMDgsMCwwLDEsMjAuMzQsMTguMjFaIi8+PHBhdGggY2xhc3M9ImNscy0yIiBkPSJNMTkuNTYsMTcuNjVhOS4yOSw5LjI5LDAsMCwxLTcuMzUsMy44MywxLjMxLDEuMzEsMCwwLDEtLjA4LTIuNjIsNi41Myw2LjUzLDAsMCwwLDUtMi45Miw2LjA1LDYuMDUsMCwwLDAsLjY3LTUuNTEsNS4zMiw1LjMyLDAsMCwwLTEuNjQtMi4xNiw1LjIxLDUuMjEsMCwwLDAtMi40OC0xQTUuODYsNS44NiwwLDAsMCw5LDguODRMMTAuNzQsMTFhLjU5LjU5LDAsMCwxLS40MywxSDIuN2EuNi42LDAsMCwxLS42LS43NUwzLjgxLDMuODNhLjU5LjU5LDAsMCwxLDEtLjIxbDEuNjcsMi4xYTkuNzEsOS43MSwwLDAsMSw3Ljc1LTIuMDcsOC44NCw4Ljg0LDAsMCwxLDQuMTIsMS45Miw4LjY4LDguNjgsMCwwLDEsMi41NCwzLjcyQTkuMTQsOS4xNCwwLDAsMSwxOS41NiwxNy42NVoiLz48L3N2Zz4=",
          "width": 40,
          "height": 40,
          "alt": t('Maze.turnRight', 'Turn right'),
          "flip_rtl": true,
        }
      ],
      "previousStatement": null,
      "nextStatement": null,
      "style": "turn_category",
      "tooltip": t('Maze.turnRightTooltip', 'Turn 90° right'),
      "inputsInline": true,
    },
    
    // ========================================================================
    // JUNIOR REPEAT BLOCK (C-Block with loop icon)
    // ========================================================================
    {
      "type": "junior_repeat",
      "message0": "%1 %2 %3",
      "args0": [
        {
          "type": "field_image",
          // Authentic Scratch Repeat Icon
          "src": "data:image/svg+xml;base64,PHN2ZyBpZD0iSWNvbiIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB2aWV3Qm94PSIwIDAgNDAgNDAiPjx0aXRsZT5jb250cm9sX3JlcGVhdDwvdGl0bGU+PHBhdGggZD0iTTM0Ljc1LDIzdjAuMWwwLDAuMjVhMTMuNjIsMTMuNjIsMCwwLDEtMSw0LjY5LDE0LjE5LDE0LjE5LDAsMCwxLTIuMzMsMy44LDE1LjM2LDE1LjM2LDAsMCwxLTMsMi41N2wtMC4wNSwwYTE0LjI1LDE0LjI1LDAsMCwxLTMsMS40LDguNjIsOC42MiwwLDAsMS0xLjMyLjM3LDkuMiw5LjIsMCwwLDEtMS4yMi4yMWwtMC4yNiwwYy0wLjI4LDAtLjU0LjA3LTAuNzgsMC4wOGgtMWEzLDMsMCwwLDEtLjI4LTZzMC4xOCwwLC41LDBsMC4yNywwLDAuMjQsMGEwLjU5LDAuNTksMCwwLDAsLjE5LDAsMS41NywxLjU3LDAsMCwxLC4yNSwwbDAuMDgsMGExLjksMS45LDAsMCwwLC40NC0wLjEybDAuMDYsMEEzLjI4LDMuMjgsMCwwLDAsMjMuMTUsMzBsMC4wNywwYTcuNjksNy42OSwwLDAsMCwxLjUyLS44Niw4LjcsOC43LDAsMCwwLDEuNDYtMS40NSw3LjY5LDcuNjksMCwwLDAsMS4wOC0yLDYuMzQsNi4zNCwwLDAsMCwuMzctMi4zNFYyMy4wNmwwLS40OFYyMi40NGEwLjYyLDAuNjIsMCwwLDEsMC0uMTNMMjcuNTIsMjJhMC4xNSwwLjE1LDAsMCwxLDAtLjA3YzAtLjEzLTAuMDYtMC4yOS0wLjEyLTAuNDhsLTAuMDctLjIyYTIuMjgsMi4yOCwwLDAsMC0uMS0wLjMxbDAtLjA4YTYuNzUsNi43NSwwLDAsMC0zLTMuNDcsNi4yNCw2LjI0LDAsMCwwLTItLjdsLTAuMjUsMGE1LjczLDUuNzMsMCwwLDAtLjY3LTAuMDZIMjBjLTAuOTIsMC0xLjc4LDAtMi41MywwaC0xdjNBMi4wNiwyLjA2LDAsMCwxLDEzLDIxLjFMNS45LDE0YTIuMDUsMi4wNSwwLDAsMSwwLTIuOTFMMTMsNGEyLDIsMCwwLDEsMS40NS0uNjIsMi4wNiwyLjA2LDAsMCwxLDIuMDYsMi4wNnYzaDFsMi41MiwwaDAuNzlMMjEuNjksOC42QTEzLjYzLDEzLjYzLDAsMCwxLDIzLjgzLDlhMTQuMzYsMTQuMzYsMCwwLDEsMTAuMjQsOS41LDguMjksOC4yOSwwLDAsMSwuMywxLjA3bDAsMC4xNWExMS43MywxMS43MywwLDAsMS0uMDcsMC43OGwwLjA3LDAuNjRjMCwwLjE2LDAsLjI4LDAsMC4zOXYxWiIgZmlsbD0iI2NmOGIxNyIvPjxwYXRoIGQ9Ik0zMy43NSwyMy4wOGwwLDAuMjlhMTIuNTksMTIuNTksMCwwLDEtMSw0LjM0LDEzLjMyLDEzLjMyLDAsMCwxLTIuMTUsMy41MiwxNC4xNywxNC4xNywwLDAsMS0yLjc4LDIuNEExMi44OCwxMi44OCwwLDAsMSwyNSwzNC45NGE4LjI1LDguMjUsMCwwLDEtMS4yMy4zNSw3LjU2LDcuNTYsMCwwLDEtMS4xMS4xOWMtMC4zNCwwLS42OS4wOS0wLjkyLDAuMWgtMWEyLDIsMCwwLDEtLjItNGwwLjQ1LDAsMC41NC0uMDVhNSw1LDAsMCwwLC41My0wLjExLDMuMjEsMy4yMSwwLDAsMCwuNjYtMC4xNyw1LjIyLDUuMjIsMCwwLDAsLjgtMC4yOSw4LjU3LDguNTcsMCwwLDAsMS43Ni0xQTEwLjA2LDEwLjA2LDAsMCwwLDI3LDI4LjI2LDguNDIsOC40MiwwLDAsMCwyOC4yMiwyNmE3LjQ0LDcuNDQsMCwwLDAsLjQzLTIuNzFWMjNsMC0uNDdhMi42MiwyLjYyLDAsMCwwLDAtLjQzbC0wLjA3LS4yOWEzLjkyLDMuOTIsMCwwLDAtLjE1LTAuNjIsNS4xMSw1LjExLDAsMCwwLS4yMi0wLjY2LDcuNzIsNy43MiwwLDAsMC0zLjUtNCw3LjQsNy40LDAsMCwwLTIuMjktLjgxLDcuMjEsNy4yMSwwLDAsMC0xLjEyLS4xMUgyMGMtMS44NCwwLTMuMzgsMC00LjQ3LDB2NC4wNWExLjA1LDEuMDUsMCwwLDEtMS44Ljc0TDYuNiwxMy4zMWExLDEsMCwwLDEsMC0xLjQ5bDcuMDgtNy4wOWExLjA1LDEuMDUsMCwwLDEsMS44Ljc0djRjMS4wOSwwLDIuNjQsMCw0LjQ4LDBoMC43MmwxLDAuMDZhMTIuODYsMTIuODYsMCwwLDEsMiwuMzMsMTMsMTMsMCwwLDEsNCwxLjY4LDEzLjIyLDEzLjIyLDAsMCwxLDUuNTYsNy4xNyw5LDksMCwwLDEsLjMxLDEuMTMsMTAsMTAsMCwwLDEsLjIxLDEuMjJsMC4wNywwLjYzYzAsMC4yMSwwLC4zMywwLDAuNDl2MC44M1oiIGZpbGw9IiNmZmYiLz48L3N2Zz4=",
          "width": 32, 
          "height": 32,
          "alt": t('Controls.repeat', 'Repeat'),
        },
        {
          "type": "field_number",
          "name": "TIMES",
          "value": 4,
          "min": 1,
          "max": 99,
          "precision": 1,
        },
        {
          "type": "input_statement",
          "name": "DO"
        }
      ],
      "previousStatement": null,
      "nextStatement": null,
      "style": "loops_category",
      "tooltip": t('Maze.repeatTooltip', 'Repeat the actions inside'),
      "inputsInline": true,
    },
    
    // ========================================================================
    // JUNIOR JUMP BLOCK
    // ========================================================================
    {
      "type": "junior_jump",
      "message0": "%1 %2",
      "args0": [
        {
          "type": "field_image",
          // Simple Jump/Hop Icon
          "src": "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA0MCA0MCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIj48cGF0aCBkPSJNMTAgMzAgQSAxMCAxMCAwIDAgMSAzMCAzMCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjRkZGIiBzdHJva2Utd2lkdGg9IjQiLz48cG9seWdvbiBwb2ludHM9IjMwLDI1IDM1LDMwIDI1LDMwIiBmaWxsPSIjRkZGIi8+PC9zdmc+",
          "width": 32,
          "height": 32,
          "alt": t('Maze.jump', 'Jump'),
        },
        {
           /* Optional: Jump Height/Distance? Assuming default for now, can add field_number if needed */
          "type": "input_dummy" 
        }
      ],
      "previousStatement": null,
      "nextStatement": null,
      "style": "movement_category",
      "tooltip": t('Maze.jumpTooltip', 'Jump over an obstacle'),
      "inputsInline": true,
    },

    // ========================================================================
    // JUNIOR COLLECT BLOCK
    // ========================================================================
    {
      "type": "junior_collect",
      "message0": "%1",
      "args0": [
        {
          "type": "field_image",
          // New Collect Gem/Star Icon (Valid Base64)
          "src": "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA0MCA0MCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIj48cGF0aCBkPSJNMjAgNEw4IDE1TDEzIDM2SDI3TDMyIDE1TDIwIDRaIiBmaWxsPSJub25lIiBzdHJva2U9IiNGRkYiIHN0cm9rZS13aWR0aD0iMyIgc3Ryb2tlLWxpbmVqb2luPSJyb3VuZCIvPjwvc3ZnPg==",
          "width": 32,
          "height": 32,
          "alt": t('Maze.collect', 'Collect'),
          "flip_rtl": false,
        }
      ],
      "previousStatement": null,
      "nextStatement": null,
      "style": "actions_category", 
      "tooltip": t('Maze.collectTooltip', 'Collect item'),
      "inputsInline": true,
    },

    // ========================================================================
    // JUNIOR TOGGLE BLOCK
    // ========================================================================
    {
      "type": "junior_toggle",
      "message0": "%1",
      "args0": [
        {
          "type": "field_image",
          // Switch Icon
          "src": "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA0MCA0MCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIj48cmVjdCB4PSIxMCIgeT0iMTAiIHdpZHRoPSIyMCIgaGVpZ2h0PSIyMCIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjRkZGIiBzdHJva2Utd2lkdGg9IjMiLz48Y2lyY2xlIGN4PSIyMCIgY3k9IjIwIiByPSI1IiBmaWxsPSIjRkZGIi8+PC9zdmc+",
          "width": 32,
          "height": 32,
          "alt": t('Maze.toggle', 'Toggle Switch'),
        }
      ],
      "previousStatement": null,
      "nextStatement": null,
      "style": "actions_category", 
      "tooltip": t('Maze.toggleTooltip', 'Toggle switch'),
      "inputsInline": true,
    },

    // ========================================================================
    // JUNIOR SAY BLOCK
    // ========================================================================
    {
      "type": "junior_say",
      "message0": "%1 %2",
      "args0": [
        {
          "type": "field_image",
          // Speech Bubble Icon
          "src": "data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCA0MCA0MCIgd2lkdGg9IjQwIiBoZWlnaHQ9IjQwIj48cGF0aCBkPSJNNSAxMCB2IDE1IGggNSB2IDUgbCA1IC01IGggMTUydiAtMTUgeiIgZmlsbD0ibm9uZSIgc3Ryb2tlPSIjRkZGIiBzdHJva2Utd2lkdGg9IjMiLz48L3N2Zz4=",
          "width": 32,
          "height": 32,
          "alt": t('Maze.say', 'Say'),
        },
        {
          "type": "field_input",
          "name": "TEXT",
          "text": "Hi"
        }
      ],
      "previousStatement": null,
      "nextStatement": null,
      "style": "looks_category",
      "tooltip": t('Maze.sayTooltip', 'Say something'),
      "inputsInline": true,
    },
  ]);

  // ==========================================================================
  // CODE GENERATORS
  // ==========================================================================

  // Junior Start - generates same code as maze_start
  javascriptGenerator.forBlock['junior_start'] = function(block: Blockly.Block) {
    const nextBlock = block.getNextBlock();
    if (nextBlock) {
      return javascriptGenerator.blockToCode(nextBlock);
    }
    return '';
  };

  // Junior Move Forward
  javascriptGenerator.forBlock['junior_moveForward'] = function(block: Blockly.Block) {
    return `moveForward('block_id_${block.id}');\n`;
  };

  // Junior Turn Left
  javascriptGenerator.forBlock['junior_turnLeft'] = function(block: Blockly.Block) {
    return `turnLeft('block_id_${block.id}');\n`;
  };

  // Junior Turn Right
  javascriptGenerator.forBlock['junior_turnRight'] = function(block: Blockly.Block) {
    return `turnRight('block_id_${block.id}');\n`;
  };

  // Junior Repeat
  javascriptGenerator.forBlock['junior_repeat'] = function(block: Blockly.Block) {
    const times = block.getFieldValue('TIMES') || 4;
    const branch = javascriptGenerator.statementToCode(block, 'DO');
    const loopVar = javascriptGenerator.nameDB_?.getDistinctName('count', 'variable') || 'count';
    return `for (var ${loopVar} = 0; ${loopVar} < ${times}; ${loopVar}++) {\n${branch}}\n`;
  };

  // Junior Jump
  javascriptGenerator.forBlock['junior_jump'] = function(block: Blockly.Block) {
    return `jump('block_id_${block.id}');\n`;
  };

  // Junior Collect
  javascriptGenerator.forBlock['junior_collect'] = function(block: Blockly.Block) {
    return `collect('block_id_${block.id}');\n`;
  };

  // Junior Toggle
  javascriptGenerator.forBlock['junior_toggle'] = function(block: Blockly.Block) {
    return `toggle('block_id_${block.id}');\n`;
  };

  // Junior Say
  javascriptGenerator.forBlock['junior_say'] = function(block: Blockly.Block) {
    const text = block.getFieldValue('TEXT') || '';
    return `say('block_id_${block.id}', '${text}');\n`;
  };
}

/**
 * Get the toolbox configuration for junior mode
 */
export function getJuniorToolbox() {
  return {
    kind: 'flyoutToolbox',
    contents: [
      { kind: 'block', type: 'junior_start' },
      { kind: 'block', type: 'junior_moveForward' },
      { kind: 'block', type: 'junior_turnLeft' },
      { kind: 'block', type: 'junior_turnRight' },
      { kind: 'block', type: 'junior_jump' },
      { kind: 'block', type: 'junior_collect' },
      { kind: 'block', type: 'junior_toggle' },
      { kind: 'block', type: 'junior_say' },
      { kind: 'block', type: 'junior_repeat' },
    ],
  };
}

/**
 * Get initial XML with junior_start block for horizontal mode
 */
export function getJuniorStartXml(): string {
  return `<xml xmlns="https://developers.google.com/blockly/xml">
  <block type="junior_start" deletable="false" movable="false" x="50" y="50">
  </block>
</xml>`;
}
