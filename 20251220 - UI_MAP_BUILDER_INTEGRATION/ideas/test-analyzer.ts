/**
 * Test script for MapAnalyzer
 * 
 * Usage:
 *   npx ts-node test-analyzer.ts
 *   # or
 *   npx tsx test-analyzer.ts
 */

import { MapAnalyzer, testMapAnalyzer } from './MapAnalyzer';
import { AcademicPlacementGenerator, testAcademicGenerator } from './AcademicPlacementGenerator';
import * as fs from 'fs';
import * as path from 'path';

// Load config file from argument or default
const configFileName = process.argv[2] || 'mapconfig.json';
const configPath = path.join(__dirname, configFileName);
console.log(`Loading config from: ${configPath}`);
const rawConfig = fs.readFileSync(configPath, 'utf-8');

// Fix trailing comma issue in JSON
const fixedConfig = rawConfig.replace(/,\s*}/g, '}').replace(/,\s*]/g, ']');
const config = JSON.parse(fixedConfig);

console.log('Loaded config with', config.gameConfig.blocks.length, 'blocks');
console.log('Players:', config.gameConfig.players?.length ?? 0);
console.log('Collectibles:', config.gameConfig.collectibles?.length ?? 0);
console.log('Interactibles:', config.gameConfig.interactibles?.length ?? 0);
console.log('');

// Run the test
testMapAnalyzer(config);

// Also output detailed JSON for inspection
console.log('\n\n📄 DETAILED JSON OUTPUT');
console.log('='.repeat(60));

const analyzer = new MapAnalyzer(config, { minLength: 2 });
const details = analyzer.analyzeWithDetails();

// Output to JSON file
const outputPath = path.join(__dirname, 'analysis-output.json');
fs.writeFileSync(outputPath, JSON.stringify(details, null, 2));
console.log(`\n✅ Detailed results saved to: ${outputPath}`);

// Print summary tables
console.log('\n\n📊 AREAS SUMMARY');
console.log('-'.repeat(60));
console.log('| ID | Blocks | Boundary | Center (x,y,z) | BBox Size |');
console.log('|' + '-'.repeat(58) + '|');

for (const area of details.tier1.areas) {
  const bboxSize = {
    x: area.boundingBox.max.x - area.boundingBox.min.x + 1,
    y: area.boundingBox.max.y - area.boundingBox.min.y + 1,
    z: area.boundingBox.max.z - area.boundingBox.min.z + 1,
  };
  console.log(
    `| ${area.id.padEnd(8)} | ${String(area.blocks.length).padStart(6)} | ${String(area.boundary.length).padStart(8)} | ` +
    `(${area.center.x.toFixed(1)}, ${area.center.y.toFixed(1)}, ${area.center.z.toFixed(1)}).padEnd(12) | ` +
    `${bboxSize.x}x${bboxSize.y}x${bboxSize.z} |`
  );
}

console.log('\n\n📊 SEGMENTS SUMMARY');
console.log('-'.repeat(60));
console.log('| ID | Length | Plane | Direction |');
console.log('|' + '-'.repeat(58) + '|');

for (const segment of details.tier1.segments.slice(0, 20)) {
  console.log(
    `| ${segment.id.padEnd(10)} | ${String(segment.length).padStart(6)} | ${(segment.plane || '?').padEnd(5)} | ` +
    `(${segment.direction.x.toFixed(1)}, ${segment.direction.y.toFixed(1)}, ${segment.direction.z.toFixed(1)}) |`
  );
}

if (details.tier1.segments.length > 20) {
  console.log(`... and ${details.tier1.segments.length - 20} more segments`);
}

console.log('\n\n📊 RELATIONS SUMMARY');
console.log('-'.repeat(60));

const relationCounts = new Map<string, number>();
for (const rel of details.tier1.relations) {
  relationCounts.set(rel.type, (relationCounts.get(rel.type) || 0) + 1);
}

// Convert Map to array for iteration (ES5 compatible)
Array.from(relationCounts.entries()).forEach(([type, count]) => {
  console.log(`  ${type}: ${count}`);
});

console.log('\n\n📊 PATTERNS SUMMARY');
console.log('-'.repeat(60));

for (const pattern of details.tier2.patterns) {
  console.log(`  ${pattern.id}:`);
  console.log(`    Type: ${pattern.type}`);
  console.log(`    Repetitions: ${pattern.repetitions}`);
  console.log(`    Unit elements: ${pattern.unitElements.join(', ')}`);
  console.log(`    Transform: ${JSON.stringify(pattern.transform)}`);
}

console.log('\n\n📊 SUGGESTED PLACEMENTS');
console.log('-'.repeat(60));

for (const suggestion of details.tier4.suggestedPlacements) {
  console.log(`  ${suggestion.itemType.toUpperCase()} (${suggestion.rule}):`);
  for (const pos of suggestion.positions) {
    console.log(`    - (${pos.x}, ${pos.y}, ${pos.z})`);
  }
}

// ============================================================================
// ACADEMIC PLACEMENT GENERATOR TEST
// ============================================================================
console.log('\n\n');
testAcademicGenerator(details.tier4);

// Save full academic output to JSON
const academicGenerator = new AcademicPlacementGenerator(details.tier4);
const academicOutput = {
  opportunities: academicGenerator.getOpportunities(),
  summary: academicGenerator.getSummary(),
  allPlacements: academicGenerator.generateAll()
};

const academicOutputPath = path.join(__dirname, 'academic-output.json');
fs.writeFileSync(academicOutputPath, JSON.stringify(academicOutput, null, 2));
console.log(`\n✅ Academic placements saved to: ${academicOutputPath}`);

console.log('\n✅ Test complete!');

