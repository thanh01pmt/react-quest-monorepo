/**
 * Test CoordinatePrioritizer
 * 
 * Run: npx tsx test-prioritizer.ts [configFile] [topologyType]
 */

import * as fs from 'fs';
import * as path from 'path';

import { MapAnalyzer } from '../src/MapAnalyzer';
import { analyzeMapMetrics } from '../src/PlacementStrategy';
import {
  prioritizeCoordinates,
  getTopPriorityCoords,
  getCoordsByCategory,
  TOPOLOGY_KEY_POINTS,
  type PrioritizedCoord,
  type CoordCategory
} from '../src/CoordinatePrioritizer';
import type { TopologyType } from '../src/PlacementStrategy';

function main() {
  const args = process.argv.slice(2);
  const configFile = args[0] || 'test_game_config.json';
  const overrideTopology = args[1] as TopologyType | undefined;
  
  const configPath = path.isAbsolute(configFile)
    ? configFile
    : path.join(path.dirname(__dirname), configFile);

  if (!fs.existsSync(configPath)) {
    console.error(`❌ Config not found: ${configPath}`);
    process.exit(1);
  }

  console.log('\n' + '═'.repeat(70));
  console.log('  COORDINATE PRIORITIZER TEST');
  console.log('═'.repeat(70));

  // Load and analyze
  const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
  const analyzer = new MapAnalyzer(config);
  const context = analyzer.analyze();
  const metrics = analyzeMapMetrics(context);
  
  const topology = overrideTopology || metrics.detectedTopology || 'unknown';

  console.log(`\n  Config: ${path.basename(configPath)}`);
  console.log(`  Topology: ${topology.toUpperCase()}`);
  console.log(`  Segments: ${context.segments.length}`);
  console.log(`  Center: (${metrics.center.x}, ${metrics.center.y}, ${metrics.center.z})`);

  // Get topology info
  const topoInfo = TOPOLOGY_KEY_POINTS[topology];
  console.log(`\n  📋 Topology Characteristics:`);
  console.log(`    ${topoInfo.description}`);
  console.log(`    Critical: ${topoInfo.criticalPoints.join(', ')}`);
  console.log(`    Important: ${topoInfo.importantPoints.join(', ')}`);
  console.log(`    Pattern: ${topoInfo.patternHint}`);

  // Prioritize coordinates
  console.log('\n' + '-'.repeat(50));
  console.log('  All Prioritized Coordinates');
  console.log('-'.repeat(50));

  const allCoords = prioritizeCoordinates(context, topology);
  console.log(`\n  Total coords analyzed: ${allCoords.length}`);

  // Group by category
  const byCategory = new Map<CoordCategory, PrioritizedCoord[]>();
  for (const coord of allCoords) {
    const list = byCategory.get(coord.category) || [];
    list.push(coord);
    byCategory.set(coord.category, list);
  }

  console.log('\n  By Category:');
  const categories: CoordCategory[] = ['critical', 'important', 'recommended', 'optional', 'avoid'];
  for (const cat of categories) {
    const list = byCategory.get(cat) || [];
    const emoji = cat === 'critical' ? '🔴' : 
                  cat === 'important' ? '🟠' :
                  cat === 'recommended' ? '🟡' :
                  cat === 'optional' ? '🟢' : '⚫';
    console.log(`    ${emoji} ${cat.toUpperCase()}: ${list.length} coords`);
  }

  // Show top coords
  console.log('\n' + '-'.repeat(50));
  console.log('  Top Priority Coordinates');
  console.log('-'.repeat(50));

  console.log('\n  ┌─────┬────────────────────┬──────────┬────────────────────────────────────────┐');
  console.log('  │ Pri │ Position           │ Category │ Reasons                                │');
  console.log('  ├─────┼────────────────────┼──────────┼────────────────────────────────────────┤');

  for (const coord of allCoords.slice(0, 15)) {
    const posStr = `(${coord.position.x}, ${coord.position.y}, ${coord.position.z})`;
    const reasonStr = coord.reasons.slice(0, 2).join('; ').slice(0, 38);
    
    console.log(`  │ ${coord.priority.toString().padStart(2)}  │ ${posStr.padEnd(18)} │ ${coord.category.padEnd(8)} │ ${reasonStr.padEnd(38)} │`);
  }
  console.log('  └─────┴────────────────────┴──────────┴────────────────────────────────────────┘');

  // Show critical and important only
  console.log('\n' + '-'.repeat(50));
  console.log('  Critical & Important Coords (for placement)');
  console.log('-'.repeat(50));

  const criticalImportant = allCoords.filter(
    c => c.category === 'critical' || c.category === 'important'
  );

  console.log(`\n  Found ${criticalImportant.length} key positions:\n`);

  for (const coord of criticalImportant) {
    const emoji = coord.category === 'critical' ? '🔴' : '🟠';
    console.log(`    ${emoji} (${coord.position.x}, ${coord.position.y}, ${coord.position.z})`);
    console.log(`       Priority: ${coord.priority}/10`);
    console.log(`       Reasons: ${coord.reasons.join(', ')}`);
    if (coord.relatedCoords) {
      console.log(`       Related: ${coord.relatedCoords.map(r => `(${r.x},${r.y},${r.z})`).join(', ')}`);
    }
    console.log('');
  }

  // Visual representation
  console.log('\n' + '-'.repeat(50));
  console.log('  Visual Map (Top-Down View)');
  console.log('-'.repeat(50));

  // Find bounds
  const allPoints = context.segments.flatMap(s => s.points);
  if (allPoints.length > 0) {
    const xs = allPoints.map(p => p.x);
    const zs = allPoints.map(p => p.z);
    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minZ = Math.min(...zs);
    const maxZ = Math.max(...zs);

    // Create grid
    const grid: string[][] = [];
    for (let z = minZ; z <= maxZ; z++) {
      const row: string[] = [];
      for (let x = minX; x <= maxX; x++) {
        const coord = allCoords.find(c => c.position.x === x && c.position.z === z);
        if (coord) {
          if (coord.category === 'critical') row.push('🔴');
          else if (coord.category === 'important') row.push('🟠');
          else if (coord.category === 'recommended') row.push('🟡');
          else if (coord.category === 'optional') row.push('⬜');
          else if (coord.category === 'avoid') row.push('⚫');
          else row.push('⬜');
        } else {
          // Check if it's a walkable block
          const isBlock = allPoints.some(p => p.x === x && p.z === z);
          row.push(isBlock ? '⬜' : '  ');
        }
      }
      grid.push(row);
    }

    console.log('\n    Legend: 🔴=Critical  🟠=Important  🟡=Recommended  ⬜=Optional  ⚫=Avoid\n');
    for (const row of grid) {
      console.log('    ' + row.join(''));
    }
  }

  // Summary recommendations
  console.log('\n' + '═'.repeat(70));
  console.log('  RECOMMENDATION');
  console.log('═'.repeat(70));

  const maxItems = Math.min(6, criticalImportant.length);
  const topCoords = getTopPriorityCoords(context, maxItems, topology);

  console.log(`\n  For a ${topology.toUpperCase()} map, place items at these ${topCoords.length} key positions:\n`);

  for (let i = 0; i < topCoords.length; i++) {
    const coord = topCoords[i];
    const itemType = coord.category === 'critical' ? 'switch/goal' : 'crystal';
    console.log(`    ${i + 1}. (${coord.position.x}, ${coord.position.y}, ${coord.position.z}) → ${itemType}`);
    console.log(`       ${coord.reasons[0]}`);
  }

  console.log(`\n  Pattern suggestion: ${topoInfo.patternHint}\n`);

  // Save output
  const outputPath = path.join(path.dirname(configPath), 'prioritizer-output.json');
  fs.writeFileSync(outputPath, JSON.stringify({
    config: path.basename(configPath),
    topology,
    metrics: {
      segments: context.segments.length,
      center: metrics.center
    },
    allCoords: allCoords.map(c => ({
      position: c.position,
      priority: c.priority,
      category: c.category,
      reasons: c.reasons
    })),
    topCoords: topCoords.map(c => ({
      position: c.position,
      priority: c.priority,
      reasons: c.reasons
    })),
    recommendation: topoInfo.patternHint
  }, null, 2));

  console.log(`  Output saved: ${path.basename(outputPath)}\n`);
}

main();
