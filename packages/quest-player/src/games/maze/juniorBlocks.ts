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
          "src": `${pathToMedia}start_rabbit.svg`,
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
          "src": `${pathToMedia}turn_left.svg`,
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
          "src": `${pathToMedia}turn_right.svg`,
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
          "type": "input_statement",
          "name": "DO"
        },
        {
          "type": "field_image",
          "src": `${pathToMedia}loop.svg`,
          "width": 40,
          "height": 40,
          "alt": t('Controls.repeat', 'Repeat'),
        },
        {
          "type": "field_number",
          "name": "TIMES",
          "value": 4,
          "min": 1,
          "max": 99,
          "precision": 1,
        }
      ],
      "previousStatement": null,
      "nextStatement": null,
      "style": "loops_category",
      "tooltip": t('Maze.repeatTooltip', 'Repeat the actions inside'),
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
