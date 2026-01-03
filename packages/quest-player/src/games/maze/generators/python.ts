import { pythonGenerator, Order } from 'blockly/python';
import * as Blockly from 'blockly/core';

// Initialize the Python generator for Maze blocks
export const initPythonGenerator = () => {
  // Move Forward
  pythonGenerator.forBlock['maze_moveForward'] = function(_block: Blockly.Block) {
    return 'moveForward()\n';
  };

  // Turn
  pythonGenerator.forBlock['maze_turn'] = function(block: Blockly.Block) {
    const direction = block.getFieldValue('DIR');
    return 'turn("' + direction + '")\n';
  };

  // Turn Left/Right (Legacy support if needed, or mapped to turn)
  pythonGenerator.forBlock['maze_turnLeft'] = function(_block: Blockly.Block) {
    return 'turn("turnLeft")\n';
  };
  pythonGenerator.forBlock['maze_turnRight'] = function(_block: Blockly.Block) {
    return 'turn("turnRight")\n';
  };

  // Collect Crystal
  pythonGenerator.forBlock['maze_collect'] = function(_block: Blockly.Block) {
    return 'collect()\n';
  };

  // Toggle Switch
  pythonGenerator.forBlock['maze_toggle_switch'] = function(_block: Blockly.Block) {
    return 'toggleSwitch()\n';
  };

  // Maze Jump
  pythonGenerator.forBlock['maze_jump'] = function(_block: Blockly.Block) {
    return 'jump()\n';
  };

  // Maze Forever (Repeat until finish)
  pythonGenerator.forBlock['maze_forever'] = function(block: Blockly.Block) {
    const branch = pythonGenerator.statementToCode(block, 'DO') || '  pass\n';
    return 'while not atFinish():\n' + branch;
  };

  // Maze Repeat (Count loop)
  pythonGenerator.forBlock['maze_repeat'] = function(block: Blockly.Block) {
    // Repeat n times
    const repeats = pythonGenerator.valueToCode(block, 'TIMES', Order.NONE) || '0';
    const branch = pythonGenerator.statementToCode(block, 'DO') || '  pass\n';
    return 'for count in range(' + repeats + '):\n' + branch;
  };

  // Maze While
  pythonGenerator.forBlock['maze_while'] = function(block: Blockly.Block) {
    const condition = pythonGenerator.valueToCode(block, 'CONDITION', Order.NONE) || 'False';
    const branch = pythonGenerator.statementToCode(block, 'DO') || '  pass\n';
    return 'while ' + condition + ':\n' + branch;
  };

  // Maze Until
  pythonGenerator.forBlock['maze_until'] = function(block: Blockly.Block) {
    const condition = pythonGenerator.valueToCode(block, 'CONDITION', Order.NONE) || 'False';
    const branch = pythonGenerator.statementToCode(block, 'DO') || '  pass\n';
    // Python doesn't have a native 'repeat until' loop, so we generate 'while not condition:'
    // Or if simulate do-while:
    // while True:
    //   ...
    //   if condition: break
    // Typically educational tools map 'repeat until' to 'while not'
    return 'while not ' + condition + ':\n' + branch;
  };

  // Sensors
  pythonGenerator.forBlock['maze_is_path'] = function(block: Blockly.Block) {
    const direction = block.getFieldValue('DIR');
    const code = 'isPath("' + direction + '")';
    return [code, Order.FUNCTION_CALL];
  };

  pythonGenerator.forBlock['maze_is_item_present'] = function(block: Blockly.Block) {
    const code = 'isItemPresent()';
    return [code, Order.FUNCTION_CALL];
  };
  
  pythonGenerator.forBlock['maze_is_switch_state'] = function(block: Blockly.Block) {
    const state = block.getFieldValue('STATE');
    const code = 'isSwitchState("' + state + '")';
    return [code, Order.FUNCTION_CALL];
  };

  pythonGenerator.forBlock['maze_at_finish'] = function(_block: Blockly.Block) {
    const code = 'atFinish()';
    return [code, Order.FUNCTION_CALL];
  };
  
  pythonGenerator.forBlock['maze_item_count'] = function(_block: Blockly.Block) {
    const code = 'itemCount()';
    return [code, Order.FUNCTION_CALL];
  };
  
  // Start block (no-op in Python mainly, or entry point)
  pythonGenerator.forBlock['maze_start'] = function(block: Blockly.Block) {
    return pythonGenerator.statementToCode(block, 'DO') || '';
  };
};
