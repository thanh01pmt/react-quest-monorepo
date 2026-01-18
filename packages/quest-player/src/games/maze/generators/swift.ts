import { javascriptGenerator, Order } from 'blockly/javascript';
import * as Blockly from 'blockly/core';

// Swift Generator - uses JavaScript generator as base but outputs Swift syntax

const indent = (code: string, level: number = 1): string => {
  const spaces = '    '.repeat(level);
  return code.split('\n').map(line => line ? spaces + line : line).join('\n');
};

// Initialize the Swift generator for Maze blocks
export const initSwiftGenerator = () => {
  const swiftGenerator: Record<string, (block: Blockly.Block) => string | [string, number]> = {};

  // Move Forward
  swiftGenerator['maze_moveForward'] = function(_block: Blockly.Block) {
    return 'moveForward()\n';
  };

  // Turn
  swiftGenerator['maze_turn'] = function(block: Blockly.Block) {
    const direction = block.getFieldValue('DIR');
    if (direction === 'turnLeft') {
      return 'turnLeft()\n';
    } else {
      return 'turnRight()\n';
    }
  };

  // Turn Left/Right
  swiftGenerator['maze_turnLeft'] = function(_block: Blockly.Block) {
    return 'turnLeft()\n';
  };
  swiftGenerator['maze_turnRight'] = function(_block: Blockly.Block) {
    return 'turnRight()\n';
  };

  // Collect Crystal
  swiftGenerator['maze_collect'] = function(_block: Blockly.Block) {
    return 'collect()\n';
  };

  // Toggle Switch
  swiftGenerator['maze_toggle_switch'] = function(_block: Blockly.Block) {
    return 'toggleSwitch()\n';
  };

  // Jump
  swiftGenerator['maze_jump'] = function(_block: Blockly.Block) {
    return 'jump()\n';
  };

  // Forever loop
  swiftGenerator['maze_forever'] = function(block: Blockly.Block) {
    const branch = javascriptGenerator.statementToCode(block, 'DO') || '';
    const swiftBranch = convertToSwift(branch);
    return 'while !atFinish() {\n' + indent(swiftBranch) + '}\n';
  };

  // Repeat loop
  swiftGenerator['maze_repeat'] = function(block: Blockly.Block) {
    const repeats = javascriptGenerator.valueToCode(block, 'TIMES', Order.NONE) || '0';
    const branch = javascriptGenerator.statementToCode(block, 'DO') || '';
    const swiftBranch = convertToSwift(branch);
    return `for _ in 0..<${repeats} {\n` + indent(swiftBranch) + '}\n';
  };

  // While loop
  swiftGenerator['maze_while'] = function(block: Blockly.Block) {
    const condition = javascriptGenerator.valueToCode(block, 'CONDITION', Order.NONE) || 'false';
    const branch = javascriptGenerator.statementToCode(block, 'DO') || '';
    const swiftBranch = convertToSwift(branch);
    return `while ${condition} {\n` + indent(swiftBranch) + '}\n';
  };

  // Until loop
  swiftGenerator['maze_until'] = function(block: Blockly.Block) {
    const condition = javascriptGenerator.valueToCode(block, 'CONDITION', Order.NONE) || 'false';
    const branch = javascriptGenerator.statementToCode(block, 'DO') || '';
    const swiftBranch = convertToSwift(branch);
    return `while !(${condition}) {\n` + indent(swiftBranch) + '}\n';
  };

  // Sensors
  swiftGenerator['maze_is_path'] = function(block: Blockly.Block) {
    const direction = block.getFieldValue('DIR');
    const funcMap: Record<string, string> = {
      'forward': 'isPathForward()',
      'right': 'isPathRight()',
      'left': 'isPathLeft()',
      'backward': 'isPathBackward()'
    };
    return [funcMap[direction] || 'isPathForward()', Order.FUNCTION_CALL];
  };

  swiftGenerator['maze_is_item_present'] = function(_block: Blockly.Block) {
    return ['isItemPresent()', Order.FUNCTION_CALL];
  };

  swiftGenerator['maze_is_switch_state'] = function(block: Blockly.Block) {
    const state = block.getFieldValue('STATE');
    return [`isSwitchState("${state}")`, Order.FUNCTION_CALL];
  };

  swiftGenerator['maze_at_finish'] = function(_block: Blockly.Block) {
    return ['atFinish()', Order.FUNCTION_CALL];
  };

  swiftGenerator['maze_item_count'] = function(_block: Blockly.Block) {
    return ['itemCount()', Order.FUNCTION_CALL];
  };

  swiftGenerator['maze_say'] = function(block: Blockly.Block) {
    const msg = javascriptGenerator.valueToCode(block, 'MSG', Order.NONE) || "''";
    return `say(${msg})\n`;
  };

  swiftGenerator['text_print'] = function(block: Blockly.Block) {
    const msg = javascriptGenerator.valueToCode(block, 'TEXT', Order.NONE) || "''";
    return `print(${msg})\n`;
  };

  // Start block
  swiftGenerator['maze_start'] = function(block: Blockly.Block) {
    const jsCode = javascriptGenerator.statementToCode(block, 'DO') || '';
    const swiftCode = convertToSwift(jsCode);
    // Remove leading whitespace
    return swiftCode.split('\n').map(line => line.trimStart()).join('\n');
  };

  return swiftGenerator;
};

// Convert JavaScript-style code to Swift style
function convertToSwift(jsCode: string): string {
  return jsCode
    // Remove semicolons (Swift doesn't need them)
    .replace(/;/g, '')
    // Keep function calls as-is (Swift syntax is similar)
    .trim();
}

// Strip blockId parameters from JavaScript code for clean display
function stripBlockIds(code: string): string {
  return code
    // Remove block_id parameters: func('block_id_xxx') -> func()
    .replace(/\('block_id_[^']*'\)/g, '()')
    // Remove block_id in multi-param calls: func('param', 'block_id_xxx') -> func('param')
    .replace(/,\s*'block_id_[^']*'/g, '')
    // Clean up any remaining block_id references
    .replace(/'block_id_[^']*'/g, '');
}

// Generate Swift code from a workspace
export const generateSwiftCode = (workspace: Blockly.Workspace): string => {
  let jsCode = javascriptGenerator.workspaceToCode(workspace);
  
  // IMPORTANT: Strip blockIds for clean display
  jsCode = stripBlockIds(jsCode);
  
  // Convert JS to Swift syntax
  let swiftCode = jsCode
    // Remove semicolons
    .replace(/;/g, '')
    // Convert for loop syntax
    .replace(/for\s*\(\s*var\s+(\w+)\s*=\s*0;\s*\1\s*<\s*(\d+);\s*\1\+\+\s*\)/g, 'for _ in 0..<$2')
    // Convert while(true)
    .replace(/while\s*\(\s*true\s*\)/g, 'while !atFinish()')
    // Remove var keyword (Swift uses let/var differently)
    .replace(/var\s+/g, 'var ')
    // Convert != to Swift style
    .replace(/!\s*=/g, '!=')
    // Convert ! for booleans
    .replace(/!\s*(\w+\(\))/g, '!$1');

  // Add Swift header
  const header = `// Swift Code
// API declarations
@_silgen_name("moveForward") func moveForward()
@_silgen_name("turnLeft") func turnLeft()
@_silgen_name("turnRight") func turnRight()
@_silgen_name("jump") func jump()
@_silgen_name("collect") func collect()
@_silgen_name("toggleSwitch") func toggleSwitch()
@_silgen_name("isPathForward") func isPathForward() -> Bool
@_silgen_name("isPathRight") func isPathRight() -> Bool
@_silgen_name("isPathLeft") func isPathLeft() -> Bool
@_silgen_name("atFinish") func atFinish() -> Bool
@_silgen_name("isItemPresent") func isItemPresent() -> Bool
@_silgen_name("itemCount") func itemCount() -> Int
@_silgen_name("say") func say(_ msg: String)
@_silgen_name("print") func print(_ msg: String)

@_cdecl("run")
public func run() {
`;

  const footer = `}
`;

  // Indent the body
  const indentedCode = swiftCode.split('\n').map(line => line ? '    ' + line : line).join('\n');

  return header + indentedCode + footer;
};
