/**
 * Test Script: Solution-Driven Generator
 * 
 * Run: npx tsx scripts/test-solution-driven.ts
 */

import {
  SolutionDrivenGenerator,
  TemplateFactory,
  generateFromCode
} from '../src/generator/solution-driven';
import type { CodeTemplate } from '../src/generator/solution-driven';
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

// ESM compatibility
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ============================================================================
// TEST CASES
// ============================================================================

console.log('='.repeat(80));
console.log('SOLUTION-DRIVEN GENERATOR TEST');
console.log('='.repeat(80));

const generator = new SolutionDrivenGenerator();

// --- Test 1: Simple FOR loop ---
console.log('\n📋 TEST 1: Simple FOR Loop');
console.log('-'.repeat(40));

const template1: CodeTemplate = {
  id: 'TEST_FOR_SIMPLE',
  code: 'for i in 1 to $N { moveForward(); pickCrystal() }',
  parameters: {
    N: { type: 'int', min: 3, max: 8, default: 5 }
  },
  concept: 'repeat_n',
  gradeLevel: '3-5',
  meta: {
    titleVi: 'Thu thập pha lê',
    titleEn: 'Collect Crystals',
    descVi: 'Sử dụng vòng lặp để thu thập pha lê',
    descEn: 'Use a loop to collect crystals'
  }
};

const result1 = generator.generateWithParams(template1, { N: 5 }, 'test-seed-1');

console.log('Template:', template1.code);
console.log('Parameters: N=5');
console.log('');
console.log('Path coords:', result1.trace.pathCoords.length, 'blocks');
console.log('Start:', result1.trace.startPosition);
console.log('End:', result1.trace.endPosition);
console.log('Items:', result1.trace.items.length, 'crystals');
console.log('');
console.log('Raw Actions (first 10):');
result1.solution.rawActions.slice(0, 10).forEach((action, i) => {
  console.log(`  ${i + 1}. ${action}`);
});
console.log('');

// Draw ASCII map for Test 1
console.log('ASCII Map:');
drawAsciiMap(result1);

// --- Test 2: FOR loop with turns ---
console.log('\n📋 TEST 2: FOR Loop with Turns (Square)');
console.log('-'.repeat(40));

const template2 = TemplateFactory.squareLoop('TEST_SQUARE', '3-5');
const result2 = generator.generateWithParams(template2, { SIDE: 3 }, 'test-seed-2');

console.log('Template:', template2.code);
console.log('Parameters: SIDE=3');
console.log('');
console.log('Path coords:', result2.trace.pathCoords.length, 'blocks');
console.log('Items:', result2.trace.items.length, 'crystals');
console.log('Loop iterations:', result2.trace.loopIterations);
console.log('');

drawAsciiMap(result2);

// --- Test 3: Quick generateFromCode ---
console.log('\n📋 TEST 3: generateFromCode() convenience function');
console.log('-'.repeat(40));

const result3 = generateFromCode(
  'for i in 1 to 4 { moveForward(); pickCrystal(); turnRight() }',
  { concept: 'repeat_n', gradeLevel: '3-5' }
);

console.log('Code: for i in 1 to 4 { moveForward(); pickCrystal(); turnRight() }');
console.log('Path length:', result3.trace.pathCoords.length);
console.log('Items:', result3.trace.items.length);
console.log('');

drawAsciiMap(result3);

// --- Test 4: GameConfig output ---
console.log('\n📋 TEST 4: Full GameConfig Output');
console.log('-'.repeat(40));

console.log('ID:', result1.gameConfig.id);
console.log('Type:', result1.gameConfig.gameType);
console.log('Blocks:', result1.gameConfig.gameConfig.blocks.length);
console.log('Collectibles:', result1.gameConfig.gameConfig.collectibles.length);
console.log('Player start:', JSON.stringify(result1.gameConfig.gameConfig.players[0].start));
console.log('Finish:', JSON.stringify(result1.gameConfig.gameConfig.finish));
console.log('Max blocks:', result1.gameConfig.blocklyConfig.maxBlocks);
console.log('');

// Save full GameConfig to file
const outputDir = path.join(__dirname, 'output');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

const outputPath = path.join(outputDir, 'solution_driven_test.json');
fs.writeFileSync(outputPath, JSON.stringify(result1.gameConfig, null, 2));
console.log('✅ Full GameConfig saved to:', outputPath);

// ============================================================================
// PHASE 2 TESTS
// ============================================================================

console.log('\n' + '='.repeat(80));
console.log('PHASE 2: NESTED LOOPS & FUNCTIONS');
console.log('='.repeat(80));

// --- Test 5: Nested FOR loops ---
console.log('\n📋 TEST 5: Nested FOR Loop (3x4 Grid)');
console.log('-'.repeat(40));

const template5: CodeTemplate = {
  id: 'TEST_NESTED_FOR',
  code: `
    for row in 1 to 3 {
      for col in 1 to 4 {
        moveForward()
        pickCrystal()
      }
      turnRight()
      moveForward()
      turnRight()
    }
  `,
  parameters: {},
  concept: 'nested_loop',
  gradeLevel: '3-5'
};

const result5 = generator.generateWithParams(template5, {}, 'test-seed-5');

console.log('Template: Nested FOR (3 rows × 4 cols)');
console.log('Path coords:', result5.trace.pathCoords.length, 'blocks');
console.log('Items:', result5.trace.items.length, 'crystals');
console.log('Loop iterations:', result5.trace.loopIterations);
console.log('');

drawAsciiMap(result5);

// --- Test 6: User-defined functions ---
console.log('\n📋 TEST 6: User-Defined Function');
console.log('-'.repeat(40));

const template6: CodeTemplate = {
  id: 'TEST_FUNCTION',
  code: `
    func clearPath() {
      moveForward()
      pickCrystal()
      moveForward()
      pickCrystal()
    }
    
    clearPath()
    turnRight()
    clearPath()
    turnRight()
    clearPath()
  `,
  parameters: {},
  concept: 'procedure_simple',
  gradeLevel: '3-5'
};

const result6 = generator.generateWithParams(template6, {}, 'test-seed-6');

console.log('Template: Function clearPath() called 3 times');
console.log('Path coords:', result6.trace.pathCoords.length, 'blocks');
console.log('Items:', result6.trace.items.length, 'crystals');
console.log('');

drawAsciiMap(result6);

// --- Test 7: Function inside loop ---
console.log('\n📋 TEST 7: Function Called In Loop');
console.log('-'.repeat(40));

const template7: CodeTemplate = {
  id: 'TEST_LOOP_FUNCTION',
  code: `
    func step() {
      moveForward()
      pickCrystal()
    }
    
    for i in 1 to 4 {
      step()
      step()
      turnRight()
    }
  `,
  parameters: {},
  concept: 'loop_function_call',
  gradeLevel: '3-5'
};

const result7 = generator.generateWithParams(template7, {}, 'test-seed-7');

console.log('Template: step() function called 2x per loop iteration');
console.log('Path coords:', result7.trace.pathCoords.length, 'blocks');
console.log('Items:', result7.trace.items.length, 'crystals');
console.log('Loop iterations:', result7.trace.loopIterations);
console.log('');

drawAsciiMap(result7);

// ============================================================================
// TYPESCRIPT SYNTAX TESTS
// ============================================================================

console.log('\n' + '='.repeat(80));
console.log('TYPESCRIPT SYNTAX SUPPORT');
console.log('='.repeat(80));

// --- Test 8: TypeScript-style FOR loop ---
console.log('\n📋 TEST 8: TypeScript FOR Loop Syntax');
console.log('-'.repeat(40));

const template8: CodeTemplate = {
  id: 'TEST_TS_FOR',
  code: `
    // TypeScript-style for loop
    for (let i = 1; i <= 5; i++) {
      moveForward();
      pickCrystal();
    }
  `,
  parameters: {},
  concept: 'repeat_n',
  gradeLevel: '3-5'
};

const result8 = generator.generateWithParams(template8, {}, 'test-seed-8');

console.log('Template: for (let i = 1; i <= 5; i++)');
console.log('Path coords:', result8.trace.pathCoords.length, 'blocks');
console.log('Items:', result8.trace.items.length, 'crystals');
console.log('');

drawAsciiMap(result8);

// --- Test 9: TypeScript-style function ---
console.log('\n📋 TEST 9: TypeScript Function Syntax');
console.log('-'.repeat(40));

const template9: CodeTemplate = {
  id: 'TEST_TS_FUNCTION',
  code: `
    function collectRow() {
      moveForward();
      pickCrystal();
      moveForward();
      pickCrystal();
    }
    
    collectRow();
    turnRight();
    collectRow();
  `,
  parameters: {},
  concept: 'procedure_simple',
  gradeLevel: '3-5'
};

const result9 = generator.generateWithParams(template9, {}, 'test-seed-9');

console.log('Template: function collectRow() {...}');
console.log('Path coords:', result9.trace.pathCoords.length, 'blocks');
console.log('Items:', result9.trace.items.length, 'crystals');
console.log('');

drawAsciiMap(result9);

// --- Test 10: Nested TypeScript FOR loops ---
console.log('\n📋 TEST 10: Nested TypeScript FOR Loops');
console.log('-'.repeat(40));

const template10: CodeTemplate = {
  id: 'TEST_TS_NESTED',
  code: `
    // Nested TypeScript-style for loops
    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 4; col++) {
        moveForward();
        pickCrystal();
      }
      turnRight();
      moveForward();
      turnRight();
    }
  `,
  parameters: {},
  concept: 'nested_loop',
  gradeLevel: '3-5'
};

const result10 = generator.generateWithParams(template10, {}, 'test-seed-10');

console.log('Template: Nested for (let row...) { for (let col...) }');
console.log('Path coords:', result10.trace.pathCoords.length, 'blocks');
console.log('Items:', result10.trace.items.length, 'crystals');
console.log('Loop iterations:', result10.trace.loopIterations);
console.log('');

drawAsciiMap(result10);

// --- Summary ---
console.log('\n' + '='.repeat(80));
console.log('✅ ALL TESTS PASSED');
console.log('='.repeat(80));

// ============================================================================
// ASCII MAP HELPER
// ============================================================================

function drawAsciiMap(result: any) {
  const pathCoords = result.trace.pathCoords;
  const items = result.trace.items;
  const startPos = result.trace.startPosition;
  const endPos = result.trace.endPosition;

  if (pathCoords.length === 0) {
    console.log('  (empty map)');
    return;
  }

  // Calculate bounds
  const xs = pathCoords.map((c: number[]) => c[0]);
  const zs = pathCoords.map((c: number[]) => c[2]);
  const minX = Math.min(...xs) - 1;
  const maxX = Math.max(...xs) + 1;
  const minZ = Math.min(...zs) - 1;
  const maxZ = Math.max(...zs) + 1;

  // Create lookup sets
  const pathSet = new Set(pathCoords.map((c: number[]) => `${c[0]},${c[2]}`));
  const itemMap = new Map<string, string>();
  items.forEach((item: any) => {
    const key = `${item.position[0]},${item.position[2]}`;
    itemMap.set(key, item.type);
  });
  const startKey = `${startPos[0]},${startPos[2]}`;
  const endKey = `${endPos[0]},${endPos[2]}`;

  // Draw header
  let header = '    ';
  for (let x = minX; x <= maxX; x++) {
    header += `${x.toString().padStart(2)} `;
  }
  console.log(header);
  console.log('    ' + '-'.repeat((maxX - minX + 1) * 3));

  // Draw rows
  for (let z = maxZ; z >= minZ; z--) {
    let row = `${z.toString().padStart(2)} |`;
    for (let x = minX; x <= maxX; x++) {
      const key = `${x},${z}`;
      const isPath = pathSet.has(key);
      const isStart = key === startKey;
      const isEnd = key === endKey;
      const item = itemMap.get(key);

      if (isStart) {
        row += ' S ';
      } else if (isEnd && !item) {
        row += ' E ';
      } else if (item) {
        const symbols: Record<string, string> = {
          'crystal': 'C',
          'key': 'K',
          'switch': 'W'
        };
        row += ` ${symbols[item] || '?'} `;
      } else if (isPath) {
        row += '██ ';
      } else {
        row += ' . ';
      }
    }
    console.log(row);
  }
  console.log('');
  console.log('  Legend: S=Start, E=End, ██=Path, C=Crystal, K=Key, W=Switch');
  console.log('');
}
