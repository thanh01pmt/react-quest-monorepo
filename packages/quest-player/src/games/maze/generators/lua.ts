import { luaGenerator, Order } from 'blockly/lua';
import * as Blockly from 'blockly/core';

// Initialize the Lua generator for Maze blocks
export const initLuaGenerator = () => {
  // Move Forward
  luaGenerator.forBlock['maze_moveForward'] = function(_block: Blockly.Block) {
    return 'moveForward()\n';
  };
  // Maze Jump
  luaGenerator.forBlock['maze_jump'] = function(_block: Blockly.Block) {
    return 'jump()\n';
  };
  // Turn
  luaGenerator.forBlock['maze_turn'] = function(block: Blockly.Block) {
    const direction = block.getFieldValue('DIR');
    // Output turnLeft() or turnRight() directly
    if (direction === 'turnLeft') {
      return 'turnLeft()\n';
    } else {
      return 'turnRight()\n';
    }
  };

  // Turn Left/Right (Direct function calls)
  luaGenerator.forBlock['maze_turnLeft'] = function(_block: Blockly.Block) {
    return 'turnLeft()\n';
  };
  luaGenerator.forBlock['maze_turnRight'] = function(_block: Blockly.Block) {
    return 'turnRight()\n';
  };

  // Collect Crystal
  luaGenerator.forBlock['maze_collect'] = function(_block: Blockly.Block) {
    return 'collect()\n';
  };

  // Toggle Switch
  luaGenerator.forBlock['maze_toggle_switch'] = function(_block: Blockly.Block) {
    return 'toggleSwitch()\n';
  };

  // Maze Forever: Repeat until finish
  luaGenerator.forBlock['maze_forever'] = function(block: Blockly.Block) {
    const branch = luaGenerator.statementToCode(block, 'DO') || '';
    return 'while not atFinish() do\n' + branch + 'end\n';
  };
  luaGenerator.forBlock['maze_while'] = function(block: Blockly.Block) {
    const condition = luaGenerator.valueToCode(block, 'CONDITION', Order.NONE) || 'false';
    const branch = luaGenerator.statementToCode(block, 'DO') || '';
    return 'while ' + condition + ' do\n' + branch + 'end\n';
  };

  // Maze Until: repeat ... until condition
  luaGenerator.forBlock['maze_until'] = function(block: Blockly.Block) {
    const condition = luaGenerator.valueToCode(block, 'CONDITION', Order.NONE) || 'false';
    const branch = luaGenerator.statementToCode(block, 'DO') || '';
    return 'repeat\n' + branch + 'until ' + condition + '\n';
  };
  
  // Maze Repeat (Count loop): for i = 1, count do ... end
  luaGenerator.forBlock['maze_repeat'] = function(block: Blockly.Block) {
    const repeats = luaGenerator.valueToCode(block, 'TIMES', Order.NONE) || '0';
    const branch = luaGenerator.statementToCode(block, 'DO') || '';
    const loopVar = luaGenerator.nameDB_?.getDistinctName('count', 'variable') || 'count';
    return 'for ' + loopVar + ' = 1, ' + repeats + ' do\n' + branch + 'end\n';
  };

  // Sensors
  luaGenerator.forBlock['maze_is_path'] = function(block: Blockly.Block) {
    const direction = block.getFieldValue('DIR');
    // Map to direct function calls: isPathForward(), isPathLeft(), etc.
    const funcMap: Record<string, string> = {
      'forward': 'isPathForward()',
      'right': 'isPathRight()',
      'left': 'isPathLeft()',
      'backward': 'isPathBackward()'
    };
    const code = funcMap[direction] || 'isPathForward()';
    return [code, Order.HIGH]; // Lua function calls have high precedence
  };

  luaGenerator.forBlock['maze_is_item_present'] = function(_block: Blockly.Block) {
    const code = 'isItemPresent()';
    return [code, Order.HIGH];
  };
  
  luaGenerator.forBlock['maze_is_switch_state'] = function(block: Blockly.Block) {
    const state = block.getFieldValue('STATE');
    const code = 'isSwitchState("' + state + '")';
    return [code, Order.HIGH];
  };

  luaGenerator.forBlock['maze_at_finish'] = function(_block: Blockly.Block) {
    const code = 'atFinish()';
    return [code, Order.HIGH];
  };
  
  luaGenerator.forBlock['maze_item_count'] = function(_block: Blockly.Block) {
    const code = 'itemCount()';
    return [code, Order.HIGH];
  };

  luaGenerator.forBlock['maze_say'] = function(block: Blockly.Block) {
    const msg = luaGenerator.valueToCode(block, 'MSG', Order.NONE) || "''";
    return `say(${msg})\n`;
  };

  luaGenerator.forBlock['oop_character_say'] = function(block: Blockly.Block) {
    const character = block.getFieldValue('CHARACTER');
    const msg = luaGenerator.valueToCode(block, 'MSG', Order.NONE) || "''";
    return `${character}:say(${msg})\n`;
  };
  
  // Start block - Remove leading indentation from statementToCode output
  luaGenerator.forBlock['maze_start'] = function(block: Blockly.Block) {
    const code = luaGenerator.statementToCode(block, 'DO') || '';
    // Remove leading whitespace from each line
    return code.split('\n').map(line => line.trimStart()).join('\n');
  };
};
