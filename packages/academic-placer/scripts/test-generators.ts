/**
 * Test file for Academic Placement Generators
 * 
 * Run with: npx tsx test-generators.ts [configFile]
 * Example: npx tsx test-generators.ts test_game_config.json
 */

import * as fs from 'fs';
import * as path from 'path';

// Import MapAnalyzer
import { MapAnalyzer, type PlacementContext } from '../src/MapAnalyzer';

// Import main generator
import { 
  AcademicPlacementGenerator, 
  testAcademicGenerator,
  type AcademicPlacement 
} from '../src/AcademicPlacementGenerator';

// Import individual generators for detailed testing
import { generateSequentialPlacements } from '../src/generators/SequentialGenerators';
import { 
  generateRepeatNPlacements,
  generateRepeatUntilPlacements,
  generateWhilePlacements,
  generateForEachPlacements,
  generateInfiniteLoopPlacements,
  generateNestedLoopPlacements,
  generateAllLoopPlacements
} from '../src/generators/LoopGenerators';
import { 
  generateIfSimplePlacements,
  generateIfElsePlacements,
  generateIfElifElsePlacements,
  generateSwitchCasePlacements,
  generateNestedIfPlacements,
  generateAllConditionalPlacements
} from '../src/generators/ConditionalGenerators';
import { 
  generateProcedureSimplePlacements,
  generateProcedureWithParamPlacements,
  generateFunctionReturnPlacements,
  generateFunctionComposePlacements,
  generateRecursionPlacements,
  generateAllFunctionPlacements
} from '../src/generators/FunctionGenerators';
import { 
  generateCounterPlacements,
  generateStateTogglePlacements,
  generateAccumulatorPlacements,
  generateCollectionPlacements,
  generateFlagPlacements,
  generateAllVariablePlacements
} from '../src/generators/VariableGenerators';
import { 
  generateRepeatNCounterPlacements,
  generateWhileCounterPlacements,
  generateRepeatUntilStatePlacements,
  generateForEachAccumulatorPlacements,
  generateLoopIfInsidePlacements,
  generateIfLoopInsidePlacements,
  generateLoopBreakPlacements,
  generateFunctionLoopInsidePlacements,
  generateLoopFunctionCallPlacements,
  generateFunctionIfInsidePlacements,
  generateConditionalFunctionCallPlacements,
  generateLoopIfFunctionPlacements,
  generateFunctionLoopIfPlacements,
  generateAllCombinationPlacements
} from '../src/generators/CombinationGenerators';

import { GENERATOR_COVERAGE } from '../src/generators/index';

// ============================================================================
// TEST UTILITIES
// ============================================================================

interface TestResult {
  name: string;
  passed: boolean;
  count: number;
  details?: string;
}

function formatTable(headers: string[], rows: string[][]): string {
  const colWidths = headers.map((h, i) => 
    Math.max(h.length, ...rows.map(r => (r[i] || '').length))
  );
  
  const separator = colWidths.map(w => '-'.repeat(w + 2)).join('+');
  const formatRow = (row: string[]) => 
    row.map((cell, i) => ` ${(cell || '').padEnd(colWidths[i])} `).join('|');
  
  return [
    separator,
    formatRow(headers),
    separator,
    ...rows.map(formatRow),
    separator
  ].join('\n');
}

function logSection(title: string) {
  console.log('\n' + '═'.repeat(70));
  console.log(`  ${title}`);
  console.log('═'.repeat(70));
}

function logSubSection(title: string) {
  console.log('\n' + '-'.repeat(50));
  console.log(`  ${title}`);
  console.log('-'.repeat(50));
}

// ============================================================================
// INDIVIDUAL GENERATOR TESTS
// ============================================================================

function testGeneratorOutput(
  name: string,
  generator: (context: PlacementContext) => AcademicPlacement[],
  context: PlacementContext
): TestResult {
  try {
    const placements = generator(context);
    const passed = placements.length >= 0; // Always passes if no error
    
    // Validate placement structure
    let validCount = 0;
    for (const p of placements) {
      if (
        p.id && 
        p.name && 
        p.concepts.length > 0 &&
        p.primaryConcept &&
        typeof p.difficulty === 'number' &&
        Array.isArray(p.items) &&
        p.expectedSolution &&
        Array.isArray(p.requiredBlocks)
      ) {
        validCount++;
      }
    }
    
    return {
      name,
      passed: validCount === placements.length,
      count: placements.length,
      details: validCount !== placements.length 
        ? `${validCount}/${placements.length} valid` 
        : undefined
    };
  } catch (error) {
    return {
      name,
      passed: false,
      count: 0,
      details: `Error: ${(error as Error).message}`
    };
  }
}

// ============================================================================
// MAIN TEST RUNNER
// ============================================================================

async function runAllTests(configPath: string) {
  logSection('ACADEMIC PLACEMENT GENERATOR TESTS');
  console.log(`Config: ${configPath}`);
  console.log(`Time: ${new Date().toISOString()}`);
  
  // Load config
  const configContent = fs.readFileSync(configPath, 'utf-8');
  const gameConfig = JSON.parse(configContent);
  
  console.log(`\n📦 Loaded config with ${gameConfig.blocks?.length || 0} blocks`);
  
  // Run MapAnalyzer
  logSubSection('Step 1: Map Analysis');
  const analyzer = new MapAnalyzer(gameConfig);
  const context = analyzer.analyze();
  
  console.log(`  Segments: ${context.segments.length}`);
  console.log(`  Areas: ${context.areas.length}`);
  console.log(`  Relations: ${context.relations.length}`);
  console.log(`  Patterns: ${context.patterns.length}`);
  
  // Test coverage stats
  logSubSection('Step 2: Generator Coverage');
  console.log(`  Sequential: ${GENERATOR_COVERAGE.sequential.implemented}/${GENERATOR_COVERAGE.sequential.total}`);
  console.log(`  Loop: ${GENERATOR_COVERAGE.loop.implemented}/${GENERATOR_COVERAGE.loop.total}`);
  console.log(`  Conditional: ${GENERATOR_COVERAGE.conditional.implemented}/${GENERATOR_COVERAGE.conditional.total}`);
  console.log(`  Function: ${GENERATOR_COVERAGE.function.implemented}/${GENERATOR_COVERAGE.function.total}`);
  console.log(`  Variable: ${GENERATOR_COVERAGE.variable.implemented}/${GENERATOR_COVERAGE.variable.total}`);
  console.log(`  Combination: ${GENERATOR_COVERAGE.combination.implemented}/${GENERATOR_COVERAGE.combination.total}`);
  console.log(`\n  TOTAL: ${GENERATOR_COVERAGE.totalImplemented}/${GENERATOR_COVERAGE.totalConcepts} = ${GENERATOR_COVERAGE.percentage}%`);
  
  // Run individual generator tests
  logSubSection('Step 3: Individual Generator Tests');
  
  const tests: TestResult[] = [];
  
  // Sequential
  tests.push(testGeneratorOutput('Sequential', generateSequentialPlacements, context));
  
  // Loop
  tests.push(testGeneratorOutput('RepeatN', generateRepeatNPlacements, context));
  tests.push(testGeneratorOutput('RepeatUntil', generateRepeatUntilPlacements, context));
  tests.push(testGeneratorOutput('While', generateWhilePlacements, context));
  tests.push(testGeneratorOutput('ForEach', generateForEachPlacements, context));
  tests.push(testGeneratorOutput('InfiniteLoop', generateInfiniteLoopPlacements, context));
  tests.push(testGeneratorOutput('NestedLoop', generateNestedLoopPlacements, context));
  
  // Conditional
  tests.push(testGeneratorOutput('IfSimple', generateIfSimplePlacements, context));
  tests.push(testGeneratorOutput('IfElse', generateIfElsePlacements, context));
  tests.push(testGeneratorOutput('IfElifElse', generateIfElifElsePlacements, context));
  tests.push(testGeneratorOutput('SwitchCase', generateSwitchCasePlacements, context));
  tests.push(testGeneratorOutput('NestedIf', generateNestedIfPlacements, context));
  
  // Function
  tests.push(testGeneratorOutput('ProcedureSimple', generateProcedureSimplePlacements, context));
  tests.push(testGeneratorOutput('ProcedureWithParam', generateProcedureWithParamPlacements, context));
  tests.push(testGeneratorOutput('FunctionReturn', generateFunctionReturnPlacements, context));
  tests.push(testGeneratorOutput('FunctionCompose', generateFunctionComposePlacements, context));
  tests.push(testGeneratorOutput('Recursion', generateRecursionPlacements, context));
  
  // Variable
  tests.push(testGeneratorOutput('Counter', generateCounterPlacements, context));
  tests.push(testGeneratorOutput('StateToggle', generateStateTogglePlacements, context));
  tests.push(testGeneratorOutput('Accumulator', generateAccumulatorPlacements, context));
  tests.push(testGeneratorOutput('Collection', generateCollectionPlacements, context));
  tests.push(testGeneratorOutput('Flag', generateFlagPlacements, context));
  
  // Combinations
  tests.push(testGeneratorOutput('RepeatN+Counter', generateRepeatNCounterPlacements, context));
  tests.push(testGeneratorOutput('While+Counter', generateWhileCounterPlacements, context));
  tests.push(testGeneratorOutput('RepeatUntil+State', generateRepeatUntilStatePlacements, context));
  tests.push(testGeneratorOutput('ForEach+Accumulator', generateForEachAccumulatorPlacements, context));
  tests.push(testGeneratorOutput('Loop+If', generateLoopIfInsidePlacements, context));
  tests.push(testGeneratorOutput('If+Loop', generateIfLoopInsidePlacements, context));
  tests.push(testGeneratorOutput('Loop+Break', generateLoopBreakPlacements, context));
  tests.push(testGeneratorOutput('Function+Loop', generateFunctionLoopInsidePlacements, context));
  tests.push(testGeneratorOutput('Loop+Function', generateLoopFunctionCallPlacements, context));
  tests.push(testGeneratorOutput('Function+If', generateFunctionIfInsidePlacements, context));
  tests.push(testGeneratorOutput('Conditional+Function', generateConditionalFunctionCallPlacements, context));
  tests.push(testGeneratorOutput('Loop+If+Function', generateLoopIfFunctionPlacements, context));
  tests.push(testGeneratorOutput('Function+Loop+If', generateFunctionLoopIfPlacements, context));
  
  // Display results table
  const tableRows = tests.map(t => [
    t.passed ? '✅' : '❌',
    t.name,
    t.count.toString(),
    t.details || ''
  ]);
  
  console.log(formatTable(['', 'Generator', 'Count', 'Details'], tableRows));
  
  // Summary
  const passedCount = tests.filter(t => t.passed).length;
  const totalPlacements = tests.reduce((sum, t) => sum + t.count, 0);
  
  console.log(`\n  Generators: ${passedCount}/${tests.length} passed`);
  console.log(`  Total placements generated: ${totalPlacements}`);
  
  // Test aggregate generators
  logSubSection('Step 4: Aggregate Generator Tests');
  
  const aggregateTests: TestResult[] = [
    testGeneratorOutput('AllLoop', generateAllLoopPlacements, context),
    testGeneratorOutput('AllConditional', generateAllConditionalPlacements, context),
    testGeneratorOutput('AllFunction', generateAllFunctionPlacements, context),
    testGeneratorOutput('AllVariable', generateAllVariablePlacements, context),
    testGeneratorOutput('AllCombination', generateAllCombinationPlacements, context),
  ];
  
  const aggTableRows = aggregateTests.map(t => [
    t.passed ? '✅' : '❌',
    t.name,
    t.count.toString(),
    t.details || ''
  ]);
  
  console.log(formatTable(['', 'Aggregate', 'Count', 'Details'], aggTableRows));
  
  // Test main generator class
  logSubSection('Step 5: Main Generator Class Test');
  
  const generator = new AcademicPlacementGenerator(context);
  
  const allPlacements = generator.generateAll();
  const opportunities = generator.getOpportunities();
  const summary = generator.getSummary();
  
  console.log(`  Opportunities detected: ${opportunities.length}`);
  console.log(`  Total placements: ${allPlacements.length}`);
  console.log(`  Difficulty range: ${summary.difficultyRange[0]} - ${summary.difficultyRange[1]}`);
  console.log(`  Available concepts: ${summary.availableConcepts.length}`);
  console.log(`\n  By category:`);
  for (const [cat, count] of Object.entries(summary.byCategory)) {
    console.log(`    - ${cat}: ${count}`);
  }
  
  // Test filtering methods
  logSubSection('Step 6: Filter Method Tests');
  
  const byDifficulty = generator.generateByDifficulty(1, 3);
  console.log(`  generateByDifficulty(1, 3): ${byDifficulty.length} placements`);
  
  const byConcept = generator.generateForConcept('repeat_n');
  console.log(`  generateForConcept('repeat_n'): ${byConcept.length} placements`);
  
  const byMastered = generator.generateForMasteredConcepts(['sequential', 'repeat_n']);
  console.log(`  generateForMasteredConcepts(['sequential', 'repeat_n']): ${byMastered.length} placements`);
  
  const byCategory = generator.generateByCategory('loop');
  console.log(`  generateByCategory('loop'): ${byCategory.length} placements`);
  
  // Save full output
  logSubSection('Step 7: Save Output');
  
  const output = {
    timestamp: new Date().toISOString(),
    config: configPath,
    coverage: {
      ...GENERATOR_COVERAGE,
      summary: `${GENERATOR_COVERAGE.totalImplemented}/${GENERATOR_COVERAGE.totalConcepts} = ${GENERATOR_COVERAGE.percentage}%`
    },
    mapAnalysis: {
      segments: context.segments.length,
      areas: context.areas.length,
      relations: context.relations.length,
      patterns: context.patterns.length
    },
    testResults: {
      individual: tests.map(t => ({ name: t.name, passed: t.passed, count: t.count })),
      aggregate: aggregateTests.map(t => ({ name: t.name, passed: t.passed, count: t.count }))
    },
    opportunities,
    summary,
    allPlacements
  };
  
  const outputPath = path.join(path.dirname(configPath), 'generator-test-output.json');
  fs.writeFileSync(outputPath, JSON.stringify(output, null, 2));
  console.log(`  ✅ Full output saved to: ${outputPath}`);
  
  // Final summary
  logSection('TEST COMPLETE');
  console.log(`  Config: ${configPath}`);
  console.log(`  Generators tested: ${tests.length}`);
  console.log(`  All passed: ${passedCount === tests.length ? '✅ YES' : '❌ NO'}`);
  console.log(`  Total placements: ${allPlacements.length}`);
  console.log(`  Coverage: ${GENERATOR_COVERAGE.percentage}%`);
  console.log('');
  
  return {
    success: passedCount === tests.length,
    totalTests: tests.length,
    passedTests: passedCount,
    totalPlacements: allPlacements.length
  };
}

// ============================================================================
// CLI ENTRY POINT
// ============================================================================

const args = process.argv.slice(2);
const configFile = args[0] || 'test_game_config.json';
const configPath = path.isAbsolute(configFile) 
  ? configFile 
  : path.join(path.dirname(__dirname), configFile);

if (!fs.existsSync(configPath)) {
  console.error(`❌ Config file not found: ${configPath}`);
  process.exit(1);
}

runAllTests(configPath)
  .then(result => {
    process.exit(result.success ? 0 : 1);
  })
  .catch(error => {
    console.error('❌ Test failed with error:', error);
    process.exit(1);
  });
