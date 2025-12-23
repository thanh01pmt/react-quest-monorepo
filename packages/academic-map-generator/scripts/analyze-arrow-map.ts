/**
 * Analyze Arrow Game Config - Ground Blocks Analysis
 * 
 * This script analyzes the arrow_game_config.json and generates a report
 * focusing on the ground blocks structure.
 * 
 * Usage: npx tsx scripts/analyze-arrow-map.ts
 */

import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { MapAnalyzer, MarkdownReporter, MapAnalysisService } from '../src/index.js';
import type { GameConfig, PlacementContext } from '../src/index.js';

// ESM-compatible __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ============================================================================
// LOAD TEST DATA
// ============================================================================

const testDataPath = path.join(__dirname, 'test_data', 'arrow_game_config.json');
const rawData = fs.readFileSync(testDataPath, 'utf-8');
const jsonData = JSON.parse(rawData);

// Extract gameConfig from the wrapper
const gameConfig: GameConfig = jsonData.gameConfig;

console.log('='.repeat(70));
console.log('🎯 ARROW MAP GROUND BLOCKS ANALYSIS');
console.log('='.repeat(70));
console.log();

// ============================================================================
// 1. BASIC BLOCK STATISTICS
// ============================================================================

console.log('📊 BASIC STATISTICS');
console.log('-'.repeat(40));
console.log(`Total Blocks: ${gameConfig.blocks.length}`);
console.log(`Map Type: ${gameConfig.type}`);

// Calculate bounding box
const xs = gameConfig.blocks.map(b => b.position.x);
const ys = gameConfig.blocks.map(b => b.position.y);
const zs = gameConfig.blocks.map(b => b.position.z);

const bounds = {
  minX: Math.min(...xs), maxX: Math.max(...xs),
  minY: Math.min(...ys), maxY: Math.max(...ys),
  minZ: Math.min(...zs), maxZ: Math.max(...zs)
};

console.log(`Bounding Box: X[${bounds.minX}-${bounds.maxX}] Y[${bounds.minY}-${bounds.maxY}] Z[${bounds.minZ}-${bounds.maxZ}]`);
console.log(`Dimensions: ${bounds.maxX - bounds.minX + 1} x ${bounds.maxY - bounds.minY + 1} x ${bounds.maxZ - bounds.minZ + 1}`);
console.log();

// ============================================================================
// 2. ASCII VISUALIZATION
// ============================================================================

console.log('🗺️  ASCII MAP (Top-Down View)');
console.log('-'.repeat(40));

// Create a 2D grid
const blockSet = new Set(gameConfig.blocks.map(b => `${b.position.x},${b.position.z}`));

// Print header
let header = '    ';
for (let x = bounds.minX; x <= bounds.maxX; x++) {
  header += x.toString().padStart(2) + ' ';
}
console.log(header);
console.log('    ' + '-'.repeat((bounds.maxX - bounds.minX + 1) * 3));

// Print rows (Z from high to low)
for (let z = bounds.maxZ; z >= bounds.minZ; z--) {
  let row = z.toString().padStart(2) + ' |';
  for (let x = bounds.minX; x <= bounds.maxX; x++) {
    if (blockSet.has(`${x},${z}`)) {
      row += '██ ';
    } else {
      row += ' . ';
    }
  }
  console.log(row);
}
console.log();

// ============================================================================
// 3. GEOGRAPHIC ANALYSIS
// ============================================================================

console.log('📐 GEOGRAPHIC ANALYSIS');
console.log('-'.repeat(40));

// Group blocks by Z level
const blocksByZ = new Map<number, { x: number; y: number; z: number }[]>();
gameConfig.blocks.forEach(b => {
  const z = b.position.z;
  if (!blocksByZ.has(z)) blocksByZ.set(z, []);
  blocksByZ.get(z)!.push(b.position);
});

console.log('Blocks per Z-level:');
const sortedZ = Array.from(blocksByZ.keys()).sort((a, b) => a - b);
for (const z of sortedZ) {
  const blocks = blocksByZ.get(z)!;
  const xPositions = blocks.map(b => b.x).sort((a, b) => a - b);
  console.log(`  Z=${z}: ${blocks.length} blocks at X=[${xPositions.join(', ')}]`);
}
console.log();

// Identify shape components
console.log('Shape Analysis:');
// Shaft: Z=6 to Z=11 (single column at X=10)
const shaftBlocks = gameConfig.blocks.filter(b => b.position.z >= 6 && b.position.z <= 11);
console.log(`  Shaft: ${shaftBlocks.length} blocks (Z=6 to Z=11)`);

// Head: Z=12 to Z=14
const headBlocks = gameConfig.blocks.filter(b => b.position.z >= 12);
console.log(`  Arrow Head: ${headBlocks.length} blocks (Z=12 to Z=14)`);

// Left wing: X < 10 at Z=12
const leftWing = gameConfig.blocks.filter(b => b.position.x < 10 && b.position.z === 12);
console.log(`  Left Wing: ${leftWing.length} blocks`);

// Right wing: X > 10 at Z=12
const rightWing = gameConfig.blocks.filter(b => b.position.x > 10 && b.position.z === 12);
console.log(`  Right Wing: ${rightWing.length} blocks`);

// Tip: Z=14
const tipBlock = gameConfig.blocks.filter(b => b.position.z === 14);
console.log(`  Tip: ${tipBlock.length} block(s) at X=${tipBlock.map(b => b.position.x).join(', ')}`);
console.log();

// ============================================================================
// 4. MAP ANALYZER FULL ANALYSIS
// ============================================================================

console.log('🧠 MAP ANALYZER RESULTS');
console.log('-'.repeat(40));

try {
  const analyzer = new MapAnalyzer({ gameConfig });
  const context: PlacementContext = analyzer.analyze();

  console.log(`Segments: ${context.segments.length}`);
  context.segments.forEach((seg, i) => {
    console.log(`  [${i}] ${seg.id}: ${seg.length} blocks, dir=[${seg.direction.x},${seg.direction.y},${seg.direction.z}]`);
  });

  console.log(`\nAreas: ${context.areas.length}`);
  context.areas.forEach((area, i) => {
    console.log(`  [${i}] ${area.id}: ${area.blocks.length} blocks, shape=${area.shapeType || 'unknown'}`);
  });

  console.log(`\nMeta-Paths: ${context.metaPaths.length}`);
  context.metaPaths.forEach((mp, i) => {
    console.log(`  [${i}] ${mp.structureType}: ${mp.segments.length} segments, regular=${mp.isRegular}`);
  });

  console.log(`\nRelations: ${context.relations.length}`);
  context.relations.forEach(rel => {
    console.log(`  ${rel.type}: ${rel.path1Id} ↔ ${rel.path2Id}`);
  });

  console.log(`\nGateways: ${context.gateways.length}`);
  context.gateways.forEach((gw, i) => {
    console.log(`  [${i}] ${gw.id}: At [${gw.coord.x},${gw.coord.y},${gw.coord.z}] -> Area ${gw.connectedAreaId}`);
  });

  console.log(`\nPatterns: ${context.patterns.length}`);
  context.patterns.forEach((p, i) => {
    console.log(`  [${i}] ${p.type}: ${p.repetitions} repetitions`);
    console.log(`       Unit Elements: ${p.unitElements.join(', ')}`);
  });

  console.log(`\nSelectable Elements (Detailed):`);
  context.selectableElements.forEach((element, i) => {
    const el = element as any;
    // Print all elements
    const coords = el.coords || [];
    const coordsStr = coords.length <= 10 
      ? coords.map((c: any) => `[${c[0]},${c[1]},${c[2]}]`).join(', ')
      : `${coords.length} coords`;
      
    console.log(`  - ${el.id} (${el.type}): ${coordsStr}. Role: ${el.metadata?.role || 'N/A'} - Label: ${el.metadata?.label || 'N/A'}`);
  });

  console.log(`\nPrioritized Coords: ${context.prioritizedCoords.length}`);
  const topCoords = context.prioritizedCoords; // Print all
  topCoords.forEach(pc => {
    console.log(`  Priority ${pc.priority}: [${pc.position.x},${pc.position.y},${pc.position.z}] (${pc.category}) - ${pc.reasons[0]}`);
  });

  console.log(`\nSelectable Elements: ${context.selectableElements.length}`);
  const byType = new Map<string, number>();
  context.selectableElements.forEach(el => {
    byType.set(el.type, (byType.get(el.type) || 0) + 1);
  });
  byType.forEach((count, type) => {
    console.log(`  ${type}: ${count}`);
  });

} catch (error) {
  console.error('Error during analysis:', error);
}

console.log();

// ============================================================================
// 5. GENERATE MARKDOWN REPORT
// ============================================================================

console.log('📄 GENERATING MARKDOWN REPORT...');
console.log('-'.repeat(40));

try {
  const service = new MapAnalysisService();
  const { context, report } = service.analyze(gameConfig);

  // Save report to file
  const reportPath = path.join(__dirname, 'output', 'arrow_analysis_report.md');
  
  // Ensure output directory exists
  const outputDir = path.join(__dirname, 'output');
  if (!fs.existsSync(outputDir)) {
    fs.mkdirSync(outputDir, { recursive: true });
  }
  
  fs.writeFileSync(reportPath, report, 'utf-8');
  console.log(`✅ Report saved to: ${reportPath}`);
  
  // Print summary
  console.log('\nReport Summary:');
  console.log(`  - Total Blocks: ${gameConfig.blocks.length}`);
  console.log(`  - Segments: ${context.segments.length}`);
  console.log(`  - Areas: ${context.areas.length}`);
  console.log(`  - Meta-Paths: ${context.metaPaths.length}`);
  console.log(`  - Selectable Elements: ${context.selectableElements.length}`);

} catch (error) {
  console.error('Error generating report:', error);
}

console.log();
console.log('='.repeat(70));
console.log('✨ Analysis Complete!');
console.log('='.repeat(70));
