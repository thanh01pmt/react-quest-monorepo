/**
 * Repair Script - Non-interactive Map Config Generator
 * 
 * Usage: 
 *   npx tsx repair-batch.ts <configFile> [--categories=1,2,3] [--quantities=2,3,1] [--output=dir]
 * 
 * Examples:
 *   npx tsx repair-batch.ts mapconfig.json
 *   npx tsx repair-batch.ts mapconfig.json --categories=1,2 --quantities=2,3
 *   npx tsx repair-batch.ts test_game_config.json --categories=all
 */

import * as fs from 'fs';
import * as path from 'path';

// Import MapAnalyzer and Generator
import { MapAnalyzer, type PlacementContext } from '../src/MapAnalyzer';
import { 
  AcademicPlacementGenerator,
  type AcademicPlacement,
  type ItemPlacement
} from '../src/AcademicPlacementGenerator';

// ============================================================================
// TYPES
// ============================================================================

interface GameConfig {
  gameConfig: {
    type: string;
    renderer: string;
    blocks: any[];
    players: any[];
    collectibles: any[];
    interactibles: any[];
    finish?: any;
  };
}

interface CategoryInfo {
  index: number;
  name: string;
  key: 'sequential' | 'loop' | 'conditional' | 'variable' | 'function' | 'combination';
  count: number;
  placements: AcademicPlacement[];
}

interface Args {
  configFile: string;
  categories: number[] | 'all';
  quantities: number[];
  outputDir?: string;
}

// ============================================================================
// UTILITIES
// ============================================================================

function parseArgs(): Args {
  const args = process.argv.slice(2);
  
  if (args.length === 0 || args[0].startsWith('--')) {
    console.error('❌ Usage: npx tsx repair-batch.ts <configFile> [options]');
    console.error('   Options:');
    console.error('     --categories=1,2,3  Category numbers (or "all")');
    console.error('     --quantities=2,3,1  Quantity per category');
    console.error('     --output=dir        Output directory');
    process.exit(1);
  }
  
  const result: Args = {
    configFile: args[0],
    categories: 'all',
    quantities: []
  };
  
  for (let i = 1; i < args.length; i++) {
    const arg = args[i];
    
    if (arg.startsWith('--categories=')) {
      const value = arg.split('=')[1];
      if (value === 'all') {
        result.categories = 'all';
      } else {
        result.categories = value.split(',').map(s => parseInt(s.trim(), 10));
      }
    } else if (arg.startsWith('--quantities=')) {
      const value = arg.split('=')[1];
      result.quantities = value.split(',').map(s => parseInt(s.trim(), 10));
    } else if (arg.startsWith('--output=')) {
      result.outputDir = arg.split('=')[1];
    }
  }
  
  return result;
}

function logSection(title: string) {
  console.log('\n' + '═'.repeat(60));
  console.log(`  ${title}`);
  console.log('═'.repeat(60));
}

function logSubSection(title: string) {
  console.log('\n' + '-'.repeat(50));
  console.log(`  ${title}`);
  console.log('-'.repeat(50));
}

// ============================================================================
// ITEM CONVERSION
// ============================================================================

function toCollectible(item: ItemPlacement, id: number): any {
  return {
    id: `crystal_${id}`,
    type: item.type === 'gem' ? 'gem' : 'crystal',
    x: item.position.x,
    y: item.position.y + 1,
    z: item.position.z,
    patternId: item.groupId || 'default'
  };
}

function toInteractible(item: ItemPlacement, id: number): any {
  return {
    id: `switch_${id}`,
    type: item.type === 'goal' ? 'goal' : 'switch',
    x: item.position.x,
    y: item.position.y + 1,
    z: item.position.z,
    state: 'off',
    patternId: item.groupId || 'default'
  };
}

function generateItems(placement: AcademicPlacement): {
  collectibles: any[];
  interactibles: any[];
} {
  const collectibles: any[] = [];
  const interactibles: any[] = [];
  
  let collectibleId = 1;
  let interactibleId = 1;
  
  for (const item of placement.items) {
    if (item.type === 'crystal' || item.type === 'gem') {
      collectibles.push(toCollectible(item, collectibleId++));
    } else if (item.type === 'switch' || item.type === 'goal') {
      interactibles.push(toInteractible(item, interactibleId++));
    }
  }
  
  return { collectibles, interactibles };
}

// ============================================================================
// MAIN
// ============================================================================

function main() {
  const args = parseArgs();
  
  const configPath = path.isAbsolute(args.configFile)
    ? args.configFile
    : path.join(process.cwd(), args.configFile);
  
  if (!fs.existsSync(configPath)) {
    console.error(`❌ Config file not found: ${configPath}`);
    process.exit(1);
  }
  
  logSection('REPAIR BATCH - Non-interactive Mode');
  
  // Load config
  logSubSection('Step 1: Loading Config');
  
  const configContent = fs.readFileSync(configPath, 'utf-8');
  const config: GameConfig = JSON.parse(configContent);
  
  console.log(`  File: ${path.basename(configPath)}`);
  console.log(`  Type: ${config.gameConfig.type}`);
  console.log(`  Blocks: ${config.gameConfig.blocks?.length || 0}`);
  console.log(`  Collectibles: ${config.gameConfig.collectibles?.length || 0}`);
  console.log(`  Interactibles: ${config.gameConfig.interactibles?.length || 0}`);
  
  // Analyze map
  logSubSection('Step 2: Analyzing Map');
  
  const analyzer = new MapAnalyzer(config);
  const context = analyzer.analyze();
  
  console.log(`  Segments: ${context.segments.length}`);
  console.log(`  Areas: ${context.areas.length}`);
  console.log(`  Relations: ${context.relations.length}`);
  
  // Generate placements
  logSubSection('Step 3: Generating Placements');
  
  const generator = new AcademicPlacementGenerator(context);
  
  const allCategories: CategoryInfo[] = [
    { index: 1, name: 'Sequential', key: 'sequential', count: 0, placements: generator.generateByCategory('sequential') },
    { index: 2, name: 'Loop', key: 'loop', count: 0, placements: generator.generateByCategory('loop') },
    { index: 3, name: 'Conditional', key: 'conditional', count: 0, placements: generator.generateByCategory('conditional') },
    { index: 4, name: 'Variable', key: 'variable', count: 0, placements: generator.generateByCategory('variable') },
    { index: 5, name: 'Function', key: 'function', count: 0, placements: generator.generateByCategory('function') },
    { index: 6, name: 'Combination', key: 'combination', count: 0, placements: generator.generateByCategory('combination') }
  ];
  
  allCategories.forEach(c => c.count = c.placements.length);
  
  // Display available
  console.log('\n  Available categories:');
  for (const cat of allCategories) {
    const status = cat.count > 0 ? '✅' : '❌';
    console.log(`    ${cat.index}. ${cat.name}: ${status} ${cat.count} placements`);
  }
  
  // Select categories
  let selectedCategories: CategoryInfo[];
  
  if (args.categories === 'all') {
    selectedCategories = allCategories.filter(c => c.count > 0);
  } else {
    selectedCategories = allCategories.filter(
      c => args.categories.includes(c.index) && c.count > 0
    );
  }
  
  if (selectedCategories.length === 0) {
    console.log('\n  ❌ No valid categories available');
    process.exit(0);
  }
  
  console.log(`\n  Selected: ${selectedCategories.map(c => c.name).join(', ')}`);
  
  // Determine quantities
  const quantities = selectedCategories.map((cat, i) => {
    const q = args.quantities[i] !== undefined ? args.quantities[i] : 1;
    return Math.min(q, cat.count);
  });
  
  console.log(`  Quantities: ${quantities.join(', ')}`);
  
  // Generate files
  logSubSection('Step 4: Generating Files');
  
  const outputDir = args.outputDir || path.join(
    path.dirname(configPath),
    `repaired_${path.basename(configPath, '.json')}_${Date.now()}`
  );
  
  fs.mkdirSync(outputDir, { recursive: true });
  console.log(`\n  Output: ${outputDir}`);
  
  let totalFiles = 0;
  const manifest: any[] = [];
  
  for (let i = 0; i < selectedCategories.length; i++) {
    const category = selectedCategories[i];
    const quantity = quantities[i];
    
    console.log(`\n  ${category.name} (${quantity} files):`);
    
    for (let j = 0; j < quantity; j++) {
      const placement = category.placements[j];
      const { collectibles, interactibles } = generateItems(placement);
      
      const modifiedConfig: GameConfig = {
        gameConfig: {
          ...config.gameConfig,
          collectibles,
          interactibles
        }
      };
      
      const filename = `${category.key}_${j + 1}_${placement.id}.json`;
      const filepath = path.join(outputDir, filename);
      
      fs.writeFileSync(filepath, JSON.stringify(modifiedConfig, null, 2));
      
      console.log(`    ✅ ${filename} (D${placement.difficulty}, C${collectibles.length}, I${interactibles.length})`);
      
      manifest.push({
        filename,
        category: category.name,
        placement: {
          id: placement.id,
          name: placement.name,
          primaryConcept: placement.primaryConcept,
          concepts: placement.concepts,
          difficulty: placement.difficulty,
          patternDescription: placement.patternDescription,
          educationalGoal: placement.educationalGoal
        },
        items: { collectibles: collectibles.length, interactibles: interactibles.length }
      });
      
      totalFiles++;
    }
  }
  
  // Save manifest
  const manifestPath = path.join(outputDir, '_manifest.json');
  fs.writeFileSync(manifestPath, JSON.stringify({
    source: path.basename(configPath),
    generatedAt: new Date().toISOString(),
    totalFiles,
    categories: selectedCategories.map((c, i) => ({ name: c.name, count: quantities[i] })),
    files: manifest
  }, null, 2));
  
  // Summary
  logSection('COMPLETE');
  console.log(`  Source: ${path.basename(configPath)}`);
  console.log(`  Output: ${outputDir}`);
  console.log(`  Files: ${totalFiles}`);
  console.log('');
}

main();
