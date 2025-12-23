/**
 * Test PlacementStrategy constraints
 * 
 * Run: npx tsx test-strategy.ts [configFile]
 */

import * as fs from 'fs';
import * as path from 'path';

import { MapAnalyzer } from '../src/MapAnalyzer';
import { AcademicPlacementGenerator } from '../src/AcademicPlacementGenerator';
import {
  analyzeMapMetrics,
  calculateConstraints,
  createPlacementConfig,
  filterPlacements,
  adjustItemDensity,
  validatePlacement,
  calculateOptimalInterval,
  DENSITY_BY_SIZE,
  TOPOLOGY_CHARACTERISTICS,
  CODE_BLOCKS_ESTIMATE
} from '../src/PlacementStrategy';

// ============================================================================
// MAIN
// ============================================================================

function main() {
  const args = process.argv.slice(2);
  const configFile = args[0] || 'test_game_config.json';
  const configPath = path.isAbsolute(configFile)
    ? configFile
    : path.join(path.dirname(__dirname), configFile);

  if (!fs.existsSync(configPath)) {
    console.error(`❌ Config not found: ${configPath}`);
    process.exit(1);
  }

  console.log('\n' + '═'.repeat(70));
  console.log('  PLACEMENT STRATEGY TEST');
  console.log('═'.repeat(70));
  console.log(`  Config: ${path.basename(configPath)}`);

  // Load and analyze
  const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
  const analyzer = new MapAnalyzer(config);
  const context = analyzer.analyze();

  // ========== Step 1: Map Metrics ==========
  console.log('\n' + '-'.repeat(50));
  console.log('  Step 1: Map Metrics');
  console.log('-'.repeat(50));

  const placementConfig = createPlacementConfig(context);
  const { metrics, constraints } = placementConfig;

  console.log('\n  📐 Size Metrics:');
  console.log(`    Total blocks: ${metrics.totalBlocks}`);
  console.log(`    Bounding box: ${metrics.boundingBox.width}x${metrics.boundingBox.depth}`);
  console.log(`    Area: ${metrics.area} blocks²`);
  console.log(`    Size category: ${metrics.estimatedSize.toUpperCase()}`);

  console.log('\n  🔗 Structure Metrics:');
  console.log(`    Segments: ${metrics.segmentCount}`);
  console.log(`    Areas: ${metrics.areaCount}`);
  console.log(`    Junctions: ${metrics.junctionCount}`);
  console.log(`    Longest path: ${metrics.longestPathLength}`);
  console.log(`    Center: (${metrics.center.x}, ${metrics.center.y}, ${metrics.center.z})`);

  console.log('\n  🏗️ Detected Topology:');
  const topo = metrics.detectedTopology || 'unknown';
  const topoInfo = TOPOLOGY_CHARACTERISTICS[topo];
  console.log(`    Type: ${topo.toUpperCase()}`);
  console.log(`    Description: ${topoInfo.description}`);

  // ========== Step 2: Constraints ==========
  console.log('\n' + '-'.repeat(50));
  console.log('  Step 2: Calculated Constraints');
  console.log('-'.repeat(50));

  console.log('\n  📊 Item Density:');
  console.log(`    Target ratio: ${(constraints.targetItemRatio * 100).toFixed(0)}%`);
  console.log(`    Min items: ${constraints.minItems}`);
  console.log(`    Max items: ${constraints.maxItems}`);

  console.log('\n  📦 Item Intervals:');
  console.log(`    Min interval: ${constraints.minInterval}`);
  console.log(`    Max interval: ${constraints.maxInterval}`);
  console.log(`    Preferred: ${constraints.preferredInterval}`);

  console.log('\n  💻 Code Block Limits:');
  console.log(`    Target: ${constraints.targetCodeBlocks}`);
  console.log(`    Max: ${constraints.maxCodeBlocks}`);

  console.log('\n  🎯 Topology Preferences:');
  console.log(`    Distribution: ${constraints.distribution}`);
  console.log(`    Preferred concepts: ${constraints.preferredConcepts.join(', ')}`);
  console.log(`    Avoid concepts: ${constraints.avoidConcepts.length > 0 ? constraints.avoidConcepts.join(', ') : 'None'}`);

  // ========== Step 3: Generate & Filter ==========
  console.log('\n' + '-'.repeat(50));
  console.log('  Step 3: Generate & Filter Placements');
  console.log('-'.repeat(50));

  const generator = new AcademicPlacementGenerator(context);
  const allPlacements = generator.generateAll();
  console.log(`\n  Generated: ${allPlacements.length} placements`);

  const filtered = filterPlacements(allPlacements, placementConfig);
  console.log(`  After filtering: ${filtered.length} placements`);

  // ========== Step 4: Validation ==========
  console.log('\n' + '-'.repeat(50));
  console.log('  Step 4: Validate Placements');
  console.log('-'.repeat(50));

  console.log('\n  Top 10 placements (after filtering):');
  console.log('  ┌─────────────────────────────────────┬─────┬───────┬───────────┬──────────┐');
  console.log('  │ Placement                           │ D   │ Items │ Est.Blks  │ Valid    │');
  console.log('  ├─────────────────────────────────────┼─────┼───────┼───────────┼──────────┤');

  for (const p of filtered.slice(0, 10)) {
    const adjusted = adjustItemDensity(p, placementConfig);
    const validation = validatePlacement(adjusted, placementConfig);
    const codeEst = CODE_BLOCKS_ESTIMATE[p.primaryConcept];

    console.log(`  │ ${p.id.padEnd(37).slice(0, 37)} │ ${p.difficulty.toString().padStart(2)}  │ ${adjusted.items.length.toString().padStart(5)} │ ${codeEst ? '~' + codeEst.avg.toString().padStart(2) : 'N/A'.padStart(3)}       │ ${validation.valid ? '✅      ' : '❌      '} │`);
    
    if (!validation.valid) {
      for (const issue of validation.issues) {
        console.log(`  │   ⚠️ ${issue.padEnd(56).slice(0, 56)} │`);
      }
    }
  }
  console.log('  └─────────────────────────────────────┴─────┴───────┴───────────┴──────────┘');

  // ========== Step 5: Density Examples ==========
  console.log('\n' + '-'.repeat(50));
  console.log('  Step 5: Density Reference');
  console.log('-'.repeat(50));

  console.log('\n  📊 Density by Map Size:');
  console.log('  ┌─────────┬───────────┬─────────┬─────────┐');
  console.log('  │ Size    │ Ratio     │ Min     │ Max     │');
  console.log('  ├─────────┼───────────┼─────────┼─────────┤');
  for (const [size, d] of Object.entries(DENSITY_BY_SIZE)) {
    console.log(`  │ ${size.padEnd(7)} │ ${(d.ratio * 100).toFixed(0)}%       │ ${d.minItems.toString().padStart(3)}     │ ${d.maxItems.toString().padStart(3)}     │`);
  }
  console.log('  └─────────┴───────────┴─────────┴─────────┘');

  console.log('\n  📏 Examples for this map (size=${metrics.estimatedSize}):');
  
  const exampleSizes = [9, 16, 25, 36, 49, 64, 100];
  console.log('  ┌───────────┬───────────┬─────────────┐');
  console.log('  │ Blocks    │ Max Items │ Interval    │');
  console.log('  ├───────────┼───────────┼─────────────┤');
  
  for (const blocks of exampleSizes) {
    const ratio = constraints.targetItemRatio;
    const maxForSize = Math.min(
      Math.max(Math.floor(blocks * ratio), constraints.minItems),
      constraints.maxItems
    );
    const interval = Math.ceil(Math.sqrt(blocks) / maxForSize * 2);
    console.log(`  │ ${blocks.toString().padStart(4)}      │ ${maxForSize.toString().padStart(5)}     │ ~${interval.toString().padStart(2)} steps   │`);
  }
  console.log('  └───────────┴───────────┴─────────────┘');

  // ========== Summary ==========
  console.log('\n' + '═'.repeat(70));
  console.log('  SUMMARY');
  console.log('═'.repeat(70));

  console.log(`
  Map: ${path.basename(configPath)}
  Size: ${metrics.estimatedSize.toUpperCase()} (${metrics.totalBlocks} blocks)
  Topology: ${topo.toUpperCase()}
  
  Constraints Applied:
    • Max items: ${constraints.maxItems} (${(constraints.targetItemRatio * 100).toFixed(0)}% density)
    • Preferred interval: ${constraints.preferredInterval} steps
    • Max code blocks: ${constraints.maxCodeBlocks}
    • Distribution: ${constraints.distribution}
    
  Best concepts for this map:
    ${constraints.preferredConcepts.slice(0, 5).join(', ')}
    
  Filtered placements: ${filtered.length}/${allPlacements.length}
  `);

  // Save output
  const outputPath = path.join(path.dirname(configPath), 'strategy-output.json');
  fs.writeFileSync(outputPath, JSON.stringify({
    config: path.basename(configPath),
    metrics,
    constraints,
    topPlacements: filtered.slice(0, 10).map(p => ({
      id: p.id,
      name: p.name,
      difficulty: p.difficulty,
      primaryConcept: p.primaryConcept,
      items: p.items.length,
      valid: validatePlacement(adjustItemDensity(p, placementConfig), placementConfig).valid
    }))
  }, null, 2));

  console.log(`  Output saved: ${path.basename(outputPath)}\n`);
}

main();
