import { javascriptGenerator, Order } from 'blockly/javascript';
import * as Blockly from 'blockly/core';

// C++ Generator - uses JavaScript generator as base but outputs C++ syntax
// Note: We use javascriptGenerator internally but override output format

// Store for C++ code generation
// @ts-ignore - unused but required by signarture
// eslint-disable-next-line @typescript-eslint/no-unused-vars
let _cppCode: string[] = [];

const indent = (code: string, level: number = 1): string => {
  const spaces = '    '.repeat(level);
  return code.split('\n').map(line => line ? spaces + line : line).join('\n');
};

// Initialize the C++ generator for Maze blocks
export const initCppGenerator = () => {
  // We'll create a custom generator object that mimics Blockly's generator
  const cppGenerator: Record<string, (block: Blockly.Block) => string | [string, number]> = {};

  // Move Forward
  cppGenerator['maze_moveForward'] = function(_block: Blockly.Block) {
    return 'moveForward();\n';
  };

  // Turn
  cppGenerator['maze_turn'] = function(block: Blockly.Block) {
    const direction = block.getFieldValue('DIR');
    if (direction === 'turnLeft') {
      return 'turnLeft();\n';
    } else {
      return 'turnRight();\n';
    }
  };

  // Turn Left/Right
  cppGenerator['maze_turnLeft'] = function(_block: Blockly.Block) {
    return 'turnLeft();\n';
  };
  cppGenerator['maze_turnRight'] = function(_block: Blockly.Block) {
    return 'turnRight();\n';
  };

  // Collect Crystal
  cppGenerator['maze_collect'] = function(_block: Blockly.Block) {
    return 'collect();\n';
  };

  // Toggle Switch
  cppGenerator['maze_toggle_switch'] = function(_block: Blockly.Block) {
    return 'toggleSwitch();\n';
  };

  // Jump
  cppGenerator['maze_jump'] = function(_block: Blockly.Block) {
    return 'jump();\n';
  };

  // Forever loop
  cppGenerator['maze_forever'] = function(block: Blockly.Block) {
    const branch = javascriptGenerator.statementToCode(block, 'DO') || '';
    const cppBranch = convertToCpp(branch);
    return 'while (!atFinish()) {\n' + indent(cppBranch) + '}\n';
  };

  // Repeat loop
  cppGenerator['maze_repeat'] = function(block: Blockly.Block) {
    const repeats = javascriptGenerator.valueToCode(block, 'TIMES', Order.NONE) || '0';
    const branch = javascriptGenerator.statementToCode(block, 'DO') || '';
    const cppBranch = convertToCpp(branch);
    return `for (int i = 0; i < ${repeats}; i++) {\n` + indent(cppBranch) + '}\n';
  };

  // While loop
  cppGenerator['maze_while'] = function(block: Blockly.Block) {
    const condition = javascriptGenerator.valueToCode(block, 'CONDITION', Order.NONE) || 'false';
    const branch = javascriptGenerator.statementToCode(block, 'DO') || '';
    const cppBranch = convertToCpp(branch);
    return `while (${condition}) {\n` + indent(cppBranch) + '}\n';
  };

  // Until loop
  cppGenerator['maze_until'] = function(block: Blockly.Block) {
    const condition = javascriptGenerator.valueToCode(block, 'CONDITION', Order.NONE) || 'false';
    const branch = javascriptGenerator.statementToCode(block, 'DO') || '';
    const cppBranch = convertToCpp(branch);
    return `while (!(${condition})) {\n` + indent(cppBranch) + '}\n';
  };

  // Sensors
  cppGenerator['maze_is_path'] = function(block: Blockly.Block) {
    const direction = block.getFieldValue('DIR');
    const funcMap: Record<string, string> = {
      'forward': 'isPathForward()',
      'right': 'isPathRight()',
      'left': 'isPathLeft()',
      'backward': 'isPathBackward()'
    };
    return [funcMap[direction] || 'isPathForward()', Order.FUNCTION_CALL];
  };

  cppGenerator['maze_is_item_present'] = function(_block: Blockly.Block) {
    return ['isItemPresent()', Order.FUNCTION_CALL];
  };

  cppGenerator['maze_is_switch_state'] = function(block: Blockly.Block) {
    const state = block.getFieldValue('STATE');
    return [`isSwitchState("${state}")`, Order.FUNCTION_CALL];
  };

  cppGenerator['maze_at_finish'] = function(_block: Blockly.Block) {
    return ['atFinish()', Order.FUNCTION_CALL];
  };

  cppGenerator['maze_item_count'] = function(_block: Blockly.Block) {
    return ['itemCount()', Order.FUNCTION_CALL];
  };

  cppGenerator['maze_say'] = function(block: Blockly.Block) {
    const msg = javascriptGenerator.valueToCode(block, 'MSG', Order.NONE) || "''";
    // Using printf for C++ or std::cout. Let's stick to C-style extern func for simplicity
    return `say(${msg});\n`;
  };

  cppGenerator['text_print'] = function(block: Blockly.Block) {
    const msg = javascriptGenerator.valueToCode(block, 'TEXT', Order.NONE) || "''";
    // Assuming we expose a 'print' function in C++ environment
    return `print(${msg});\n`;
  };

  // Start block
  cppGenerator['maze_start'] = function(block: Blockly.Block) {
    const jsCode = javascriptGenerator.statementToCode(block, 'DO') || '';
    const cppCode = convertToCpp(jsCode);
    // Remove leading whitespace
    return cppCode.split('\n').map(line => line.trimStart()).join('\n');
  };

  // Register generators
  Object.keys(cppGenerator).forEach(blockType => {
    (javascriptGenerator as any).forBlock_cpp = (javascriptGenerator as any).forBlock_cpp || {};
    (javascriptGenerator as any).forBlock_cpp[blockType] = cppGenerator[blockType];
  });

  return cppGenerator;
};

// Convert JavaScript-style code to C++ style
function convertToCpp(jsCode: string): string {
  return jsCode
    // Add semicolons to function calls that don't have them
    .replace(/(\w+\([^)]*\))(?!;)\n/g, '$1;\n')
    // Keep existing semicolons
    .replace(/;;/g, ';');
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

// Generate C++ code from a workspace
export const generateCppCode = (workspace: Blockly.Workspace): string => {
  let jsCode = javascriptGenerator.workspaceToCode(workspace);
  
  // IMPORTANT: Strip blockIds for clean display
  jsCode = stripBlockIds(jsCode);
  
  // Convert JS to C++ syntax
  let cppCode = jsCode
    // Function calls need semicolons
    .replace(/(\w+\([^)]*\))(?!;|\s*\{)\s*\n/g, '$1;\n')
    // Clean up double semicolons
    .replace(/;;/g, ';')
    // Convert for...in to C++ for
    .replace(/for\s*\(\s*var\s+(\w+)\s*=\s*0;\s*\1\s*<\s*(\d+);\s*\1\+\+\s*\)/g, 'for (int $1 = 0; $1 < $2; $1++)')
    // Convert while(true) to while(!atFinish())
    .replace(/while\s*\(\s*true\s*\)/g, 'while (!atFinish())')
    // Convert var to auto (or remove)
    .replace(/var\s+/g, 'auto ');

  // Add C++ header
  const header = `// C++ Code
// API declarations
extern "C" void moveForward();
extern "C" void turnLeft();
extern "C" void turnRight();
extern "C" void jump();
extern "C" void collect();
extern "C" void toggleSwitch();
extern "C" bool isPathForward();
extern "C" bool isPathRight();
extern "C" bool isPathLeft();
extern "C" bool atFinish();
extern "C" bool isItemPresent();
extern "C" int itemCount();
extern "C" void say(const char* msg);
extern "C" void print(const char* msg);

void run() {
`;

  const footer = `}
`;

  // Indent the body
  const indentedCode = cppCode.split('\n').map(line => line ? '    ' + line : line).join('\n');

  return header + indentedCode + footer;
};
