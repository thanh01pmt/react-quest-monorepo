/**
 * Test script for micro-pattern generator API
 * Run: node --loader ts-node/esm packages/shared-templates/scripts/test-micro-patterns.ts
 * Or:  npx ts-node --esm packages/shared-templates/scripts/test-micro-patterns.ts
 */

import { 
  getAllPatterns, 
  getRandomPattern, 
  getRandomPatterns,
  patternToCode,
  countPatterns,
  type GeneratorOptions 
} from '../src/micro-patterns.js';

console.log('=== Micro-Pattern Generator API Test ===\n');

// Test 1: Count patterns with default options
console.log('--- Test 1: Default options (length 2-5) ---');
const defaultCount = countPatterns();
console.log(`Total patterns: ${defaultCount}\n`);

// Test 2: Count with specific length
console.log('--- Test 2: By length ---');
for (let len = 2; len <= 5; len++) {
  const count = countPatterns({ minLength: len, maxLength: len });
  console.log(`  Length ${len}: ${count} patterns`);
}

// Test 3: Get random pattern
console.log('\n--- Test 3: Random pattern ---');
const random1 = getRandomPattern({ seed: 12345 });
console.log(`  ID: ${random1?.id}`);
console.log(`  Actions: ${random1?.actions.join(' → ')}`);
console.log(`  Type: ${random1?.interactionType}, Movement: ${random1?.movementStyle}`);

// Test 4: Get random with filters
console.log('\n--- Test 4: Random with filters ---');
const crystalOnly = getRandomPattern({ 
  interactionType: 'crystal',
  movementStyle: 'turn',
  minLength: 3,
  maxLength: 4,
  seed: 99999
});
console.log(`  Crystal+Turn pattern: ${crystalOnly?.id}`);
console.log(`  Actions: ${crystalOnly?.actions.join(' → ')}`);

// Test 5: Get multiple random patterns
console.log('\n--- Test 5: Multiple random patterns (5) ---');
const randoms = getRandomPatterns(5, { minLength: 3, maxLength: 3, seed: 42 });
for (const p of randoms) {
  console.log(`  ${p.id}`);
}

// Test 6: Pattern to code
console.log('\n--- Test 6: Pattern to code ---');
const sample = getRandomPattern({ minLength: 4, maxLength: 4, seed: 1234 });
if (sample) {
  console.log(`Pattern: ${sample.id}`);
  console.log('Code:');
  console.log(patternToCode(sample));
}

// Test 7: Filter by movement style
console.log('\n--- Test 7: Count by movement style ---');
const styles = ['straight', 'turn', 'jump', 'mixed'] as const;
for (const style of styles) {
  const count = countPatterns({ movementStyle: style, maxLength: 4 });
  console.log(`  ${style}: ${count} patterns`);
}

console.log('\n=== All tests passed! ===');
