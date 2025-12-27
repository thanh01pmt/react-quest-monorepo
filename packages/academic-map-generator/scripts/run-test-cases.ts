/**
 * Test Case Runner
 * 
 * Runs all test cases in the test-cases directory and generates
 * Markdown reports in the output directory.
 * 
 * Usage:
 *   npx tsx scripts/run-test-cases.ts           # Run all test cases
 *   npx tsx scripts/run-test-cases.ts 01        # Run specific test case
 *   npx tsx scripts/run-test-cases.ts 01 05 10  # Run multiple test cases
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { SolutionDrivenGenerator } from '../src/generator/solution-driven';
import { MarkdownReporter } from '../src/analyzer/MarkdownReporter';
import type { CodeTemplate } from '../src/generator/solution-driven';
import type { AcademicConcept } from '../src/analyzer';

// ESM compatibility
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Directories
const TEST_CASES_DIR = path.join(__dirname, 'test-cases');
const OUTPUT_DIR = path.join(__dirname, 'output', 'test-reports');

// ============================================================================
// TYPES
// ============================================================================

interface TestCase {
  id: string;
  name: string;
  difficulty: number;
  concept: string;
  description: string;
  code: string;
}

interface TestResult {
  testCase: TestCase;
  success: boolean;
  error?: string;
  outputPath?: string;
  stats?: {
    pathLength: number;
    itemCount: number;
    loopIterations: number;
    executionTime: number;
  };
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  console.log('═'.repeat(80));
  console.log('  SOLUTION-DRIVEN GENERATOR - TEST CASE RUNNER');
  console.log('═'.repeat(80));
  console.log('');

  // Parse command line args
  const args = process.argv.slice(2);
  const specificTests = args.length > 0 ? args : null;

  // Ensure output directory exists
  if (!fs.existsSync(OUTPUT_DIR)) {
    fs.mkdirSync(OUTPUT_DIR, { recursive: true });
  }

  // Load test cases
  const testCases = await loadTestCases(specificTests);
  
  if (testCases.length === 0) {
    console.log('❌ No test cases found!');
    process.exit(1);
  }

  console.log(`📂 Test Cases Directory: ${TEST_CASES_DIR}`);
  console.log(`📄 Output Directory: ${OUTPUT_DIR}`);
  console.log(`🧪 Test Cases to Run: ${testCases.length}`);
  console.log('');

  // Run tests
  const results: TestResult[] = [];
  const generator = new SolutionDrivenGenerator();
  const reporter = new MarkdownReporter();

  for (const testCase of testCases) {
    const result = runTestCase(testCase, generator, reporter);
    results.push(result);
    printTestResult(result);
  }

  // Generate summary report
  generateSummaryReport(results);

  // Print final summary
  console.log('');
  console.log('═'.repeat(80));
  const passed = results.filter(r => r.success).length;
  const failed = results.length - passed;
  console.log(`  ✅ Passed: ${passed}  |  ❌ Failed: ${failed}  |  Total: ${results.length}`);
  console.log('═'.repeat(80));

  if (failed > 0) {
    process.exit(1);
  }
}

// ============================================================================
// HELPERS
// ============================================================================

async function loadTestCases(specificTests: string[] | null): Promise<TestCase[]> {
  const testCases: TestCase[] = [];
  
  const files = fs.readdirSync(TEST_CASES_DIR)
    .filter(f => f.endsWith('.ts') && !f.startsWith('_'))
    .sort();

  for (const file of files) {
    // Check if this test should be included
    if (specificTests) {
      const filePrefix = file.split('-')[0];
      if (!specificTests.some(t => file.includes(t) || filePrefix === t)) {
        continue;
      }
    }

    try {
      const modulePath = path.join(TEST_CASES_DIR, file);
      const module = await import(modulePath);
      testCases.push(module.default as TestCase);
    } catch (err) {
      console.error(`⚠️ Failed to load ${file}:`, err);
    }
  }

  return testCases;
}

function runTestCase(
  testCase: TestCase,
  generator: SolutionDrivenGenerator,
  reporter: MarkdownReporter
): TestResult {
  const startTime = Date.now();

  try {
    // Create template from test case
    const template: CodeTemplate = {
      id: testCase.id,
      code: testCase.code,
      parameters: {},
      concept: testCase.concept as AcademicConcept,
      gradeLevel: '3-5',
      meta: {
        titleVi: testCase.name,
        titleEn: testCase.name,
        descVi: testCase.description,
        descEn: testCase.description
      }
    };

    // Generate map
    const result = generator.generateWithParams(template, {}, `test-${testCase.id}`);
    const executionTime = Date.now() - startTime;

    // Generate Markdown report
    const markdownReport = generateTestReport(testCase, result, reporter);
    
    // Save report
    const outputPath = path.join(OUTPUT_DIR, `${testCase.id}.md`);
    fs.writeFileSync(outputPath, markdownReport);

    // Save GameConfig JSON
    const jsonPath = path.join(OUTPUT_DIR, `${testCase.id}.json`);
    fs.writeFileSync(jsonPath, JSON.stringify(result.gameConfig, null, 2));

    return {
      testCase,
      success: true,
      outputPath,
      stats: {
        pathLength: result.metadata.pathLength,
        itemCount: result.metadata.itemCount,
        loopIterations: result.trace.loopIterations,
        executionTime
      }
    };
  } catch (err) {
    return {
      testCase,
      success: false,
      error: err instanceof Error ? err.message : String(err)
    };
  }
}

function generateTestReport(testCase: TestCase, result: any, reporter: MarkdownReporter): string {
  const lines: string[] = [];
  
  // Header
  lines.push(`# Test Case: ${testCase.name}`);
  lines.push('');
  lines.push(`**ID:** \`${testCase.id}\``);
  lines.push(`**Difficulty:** ${'⭐'.repeat(testCase.difficulty)}`);
  lines.push(`**Concept:** \`${testCase.concept}\``);
  lines.push('');
  lines.push(`> ${testCase.description}`);
  lines.push('');

  // Source Code
  lines.push('## Source Code');
  lines.push('');
  lines.push('```javascript');
  lines.push(testCase.code.trim());
  lines.push('```');
  lines.push('');

  // Execution Summary
  lines.push('## Execution Summary');
  lines.push('');
  lines.push(`| Metric | Value |`);
  lines.push(`|--------|-------|`);
  lines.push(`| Path Length | ${result.metadata.pathLength} blocks |`);
  lines.push(`| Items Placed | ${result.metadata.itemCount} |`);
  lines.push(`| Loop Iterations | ${result.trace.loopIterations} |`);
  lines.push(`| Total Moves | ${result.trace.totalMoves} |`);
  lines.push(`| Total Collects | ${result.trace.totalCollects} |`);
  lines.push('');

  // ASCII Map
  lines.push('## Map Visualization');
  lines.push('');
  lines.push(drawAsciiMap(result.trace));
  lines.push('');

  // Raw Actions
  lines.push('## Raw Actions');
  lines.push('');
  lines.push('```');
  result.solution.rawActions.slice(0, 30).forEach((action: string, i: number) => {
    lines.push(`${(i + 1).toString().padStart(2)}. ${action}`);
  });
  if (result.solution.rawActions.length > 30) {
    lines.push(`... and ${result.solution.rawActions.length - 30} more actions`);
  }
  lines.push('```');
  lines.push('');

  // Item Goals
  lines.push('## Item Goals');
  lines.push('');
  for (const [type, count] of Object.entries(result.solution.itemGoals)) {
    lines.push(`- **${type}:** ${count}`);
  }
  lines.push('');

  // Path Coordinates
  lines.push('## Path Coordinates');
  lines.push('');
  lines.push('```json');
  lines.push(JSON.stringify(result.trace.pathCoords, null, 2));
  lines.push('```');
  lines.push('');

  return lines.join('\n');
}

function drawAsciiMap(trace: any): string {
  const { pathCoords, items, startPosition, endPosition } = trace;
  const lines: string[] = [];

  if (pathCoords.length === 0) {
    return '*No path generated*';
  }

  // Calculate bounds
  const xs = pathCoords.map((c: number[]) => c[0]);
  const zs = pathCoords.map((c: number[]) => c[2]);
  const minX = Math.min(...xs) - 1;
  const maxX = Math.max(...xs) + 1;
  const minZ = Math.min(...zs) - 1;
  const maxZ = Math.max(...zs) + 1;

  // Create lookups
  const pathSet = new Set(pathCoords.map((c: number[]) => `${c[0]},${c[2]}`));
  const itemMap = new Map<string, string>();
  items.forEach((item: any) => {
    itemMap.set(`${item.position[0]},${item.position[2]}`, item.type);
  });
  const startKey = `${startPosition[0]},${startPosition[2]}`;
  const endKey = `${endPosition[0]},${endPosition[2]}`;

  lines.push('```text');

  // Header
  let header = '    ';
  for (let x = minX; x <= maxX; x++) {
    header += `${x.toString().padStart(2)} `;
  }
  lines.push(header);
  lines.push('    ' + '-'.repeat((maxX - minX + 1) * 3));

  // Rows
  for (let z = maxZ; z >= minZ; z--) {
    let row = `${z.toString().padStart(2)} |`;
    for (let x = minX; x <= maxX; x++) {
      const key = `${x},${z}`;
      const isStart = key === startKey;
      const isEnd = key === endKey;
      const item = itemMap.get(key);
      const isPath = pathSet.has(key);

      if (isStart) {
        row += ' S ';
      } else if (isEnd && !item) {
        row += ' E ';
      } else if (item) {
        const symbols: Record<string, string> = {
          'crystal': 'C',
          'key': 'K',
          'switch': 'W',
          'portal': 'P'
        };
        row += ` ${symbols[item] || '?'} `;
      } else if (isPath) {
        row += '██ ';
      } else {
        row += ' . ';
      }
    }
    lines.push(row);
  }

  lines.push('```');
  lines.push('');
  lines.push('**Legend:** S=Start, E=End, ██=Path, C=Crystal, K=Key, W=Switch, P=Portal');

  return lines.join('\n');
}

function printTestResult(result: TestResult) {
  const status = result.success ? '✅' : '❌';
  const stats = result.stats 
    ? `[${result.stats.pathLength} blocks, ${result.stats.itemCount} items, ${result.stats.executionTime}ms]`
    : '';
  
  console.log(`${status} ${result.testCase.id}: ${result.testCase.name} ${stats}`);
  
  if (!result.success) {
    console.log(`   └─ Error: ${result.error}`);
  }
}

function generateSummaryReport(results: TestResult[]) {
  const lines: string[] = [];
  
  lines.push('# Test Cases Summary');
  lines.push('');
  lines.push(`Generated: ${new Date().toISOString()}`);
  lines.push('');
  
  lines.push('## Results');
  lines.push('');
  lines.push('| # | Test Case | Difficulty | Concept | Status | Path | Items |');
  lines.push('|---|-----------|------------|---------|--------|------|-------|');
  
  for (const result of results) {
    const status = result.success ? '✅ Pass' : '❌ Fail';
    const path = result.stats?.pathLength ?? '-';
    const items = result.stats?.itemCount ?? '-';
    const difficulty = '⭐'.repeat(result.testCase.difficulty);
    
    lines.push(`| ${result.testCase.id.split('-')[0]} | ${result.testCase.name} | ${difficulty} | ${result.testCase.concept} | ${status} | ${path} | ${items} |`);
  }
  
  lines.push('');
  lines.push('## Individual Reports');
  lines.push('');
  
  for (const result of results) {
    if (result.success) {
      lines.push(`- [${result.testCase.name}](./${result.testCase.id}.md)`);
    }
  }
  
  const summaryPath = path.join(OUTPUT_DIR, '_summary.md');
  fs.writeFileSync(summaryPath, lines.join('\n'));
  console.log(`\n📋 Summary report: ${summaryPath}`);
}

// Run
main().catch(console.error);
