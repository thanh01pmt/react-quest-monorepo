/**
 * Repair Script - Interactive Map Config Generator
 * 
 * This script analyzes a gameConfig, shows available placement categories,
 * allows user to select categories and quantities, then generates modified
 * gameConfig files with updated collectibles and interactibles.
 * 
 * Usage: npx tsx repair.ts <configFile>
 * Example: npx tsx repair.ts mapconfig.json
 */

import * as fs from 'fs';
import * as path from 'path';
import * as readline from 'readline';

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
  count: number;
  placements: AcademicPlacement[];
}

// ============================================================================
// UTILITIES
// ============================================================================

function createReadlineInterface(): readline.Interface {
  return readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });
}

function prompt(rl: readline.Interface, question: string): Promise<string> {
  return new Promise(resolve => {
    rl.question(question, answer => {
      resolve(answer.trim());
    });
  });
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

/**
 * Convert ItemPlacement to gameConfig collectible format
 */
function toCollectible(item: ItemPlacement, id: number): any {
  return {
    id: `crystal_${id}`,
    type: item.type === 'gem' ? 'gem' : 'crystal',
    x: item.position.x,
    y: item.position.y + 1, // Place on top of block
    z: item.position.z,
    patternId: item.groupId || 'default'
  };
}

/**
 * Convert ItemPlacement to gameConfig interactible format
 */
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

/**
 * Generate collectibles and interactibles from placement
 */
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
// MAIN LOGIC
// ============================================================================

async function main() {
  const args = process.argv.slice(2);
  
  if (args.length === 0) {
    console.error('❌ Usage: npx tsx repair.ts <configFile>');
    console.error('   Example: npx tsx repair.ts mapconfig.json');
    process.exit(1);
  }
  
  const configFile = args[0];
  const configPath = path.isAbsolute(configFile)
    ? configFile
    : path.join(process.cwd(), configFile);
  
  if (!fs.existsSync(configPath)) {
    console.error(`❌ Config file not found: ${configPath}`);
    process.exit(1);
  }
  
  logSection('REPAIR SCRIPT - Interactive Map Config Generator');
  
  // =====================
  // Step 1: Load config
  // =====================
  logSubSection('Step 1: Loading Config');
  
  const configContent = fs.readFileSync(configPath, 'utf-8');
  const config: GameConfig = JSON.parse(configContent);
  
  console.log(`  File: ${path.basename(configPath)}`);
  console.log(`  Type: ${config.gameConfig.type}`);
  console.log(`  Blocks: ${config.gameConfig.blocks?.length || 0}`);
  console.log(`  Players: ${config.gameConfig.players?.length || 0}`);
  console.log(`  Current collectibles: ${config.gameConfig.collectibles?.length || 0}`);
  console.log(`  Current interactibles: ${config.gameConfig.interactibles?.length || 0}`);
  
  // =====================
  // Step 2: Analyze map
  // =====================
  logSubSection('Step 2: Analyzing Map');
  
  // MapAnalyzer expects the full config with gameConfig property
  const analyzer = new MapAnalyzer(config);
  const context = analyzer.analyze();
  
  console.log(`  Segments: ${context.segments.length}`);
  console.log(`  Areas: ${context.areas.length}`);
  console.log(`  Relations: ${context.relations.length}`);
  
  // =====================
  // Step 3: Generate placements per category
  // =====================
  logSubSection('Step 3: Generating Placements');
  
  const generator = new AcademicPlacementGenerator(context);
  
  const categories: CategoryInfo[] = [
    {
      index: 1,
      name: 'Sequential',
      count: 0,
      placements: generator.generateByCategory('sequential')
    },
    {
      index: 2,
      name: 'Loop',
      count: 0,
      placements: generator.generateByCategory('loop')
    },
    {
      index: 3,
      name: 'Conditional',
      count: 0,
      placements: generator.generateByCategory('conditional')
    },
    {
      index: 4,
      name: 'Variable',
      count: 0,
      placements: generator.generateByCategory('variable')
    },
    {
      index: 5,
      name: 'Function',
      count: 0,
      placements: generator.generateByCategory('function')
    },
    {
      index: 6,
      name: 'Combination',
      count: 0,
      placements: generator.generateByCategory('combination')
    }
  ];
  
  // Update counts
  for (const cat of categories) {
    cat.count = cat.placements.length;
  }
  
  // Display categories
  console.log('\n  Available categories:\n');
  console.log('  ┌─────┬────────────────┬───────────┬────────────────────────────────┐');
  console.log('  │ No. │ Category       │ Available │ Difficulty Range               │');
  console.log('  ├─────┼────────────────┼───────────┼────────────────────────────────┤');
  
  for (const cat of categories) {
    const difficulties = cat.placements.map(p => p.difficulty);
    const range = difficulties.length > 0 
      ? `${Math.min(...difficulties)} - ${Math.max(...difficulties)}` 
      : 'N/A';
    
    const status = cat.count > 0 ? '✅' : '❌';
    console.log(`  │ ${cat.index.toString().padStart(2)}  │ ${cat.name.padEnd(14)} │ ${status} ${cat.count.toString().padStart(5)} │ ${range.padEnd(30)} │`);
  }
  
  console.log('  └─────┴────────────────┴───────────┴────────────────────────────────┘');
  
  // Show available placements per category
  console.log('\n  Placements by category:');
  for (const cat of categories) {
    if (cat.placements.length === 0) continue;
    console.log(`\n  ${cat.name}:`);
    for (const p of cat.placements) {
      console.log(`    [${p.difficulty}/10] ${p.id}: ${p.name}`);
    }
  }
  
  // =====================
  // Step 4: User input
  // =====================
  logSubSection('Step 4: User Selection');
  
  const rl = createReadlineInterface();
  
  // Select categories
  console.log('\n  Enter category numbers (comma-separated), e.g., "1,2,4"');
  console.log('  Or press Enter for all available categories');
  
  const categoryInput = await prompt(rl, '\n  Categories > ');
  
  let selectedCategories: CategoryInfo[];
  
  if (categoryInput === '') {
    // Select all with available placements
    selectedCategories = categories.filter(c => c.count > 0);
    console.log(`  → Selected all ${selectedCategories.length} available categories`);
  } else {
    const indices = categoryInput.split(',').map(s => parseInt(s.trim(), 10));
    selectedCategories = categories.filter(c => indices.includes(c.index) && c.count > 0);
    console.log(`  → Selected: ${selectedCategories.map(c => c.name).join(', ')}`);
  }
  
  if (selectedCategories.length === 0) {
    console.log('\n  ❌ No valid categories selected. Exiting.');
    rl.close();
    process.exit(0);
  }
  
  // Select quantities
  console.log('\n  Enter quantity per category (comma-separated), e.g., "2,3,1"');
  console.log('  Or press Enter for 1 of each');
  
  const quantityInput = await prompt(rl, '\n  Quantities > ');
  
  let quantities: number[];
  
  if (quantityInput === '') {
    quantities = selectedCategories.map(() => 1);
    console.log(`  → 1 of each category`);
  } else {
    quantities = quantityInput.split(',').map(s => {
      const n = parseInt(s.trim(), 10);
      return isNaN(n) || n < 0 ? 1 : n;
    });
    
    // Pad with 1s if needed
    while (quantities.length < selectedCategories.length) {
      quantities.push(1);
    }
    
    console.log(`  → Quantities: ${quantities.slice(0, selectedCategories.length).join(', ')}`);
  }
  
  rl.close();
  
  // =====================
  // Step 5: Generate files
  // =====================
  logSubSection('Step 5: Generating Files');
  
  // Create output directory
  const outputDir = path.join(
    path.dirname(configPath),
    `repaired_${path.basename(configPath, '.json')}_${Date.now()}`
  );
  fs.mkdirSync(outputDir, { recursive: true });
  
  console.log(`\n  Output directory: ${outputDir}`);
  
  let totalFiles = 0;
  const manifest: any[] = [];
  
  for (let i = 0; i < selectedCategories.length; i++) {
    const category = selectedCategories[i];
    const quantity = Math.min(quantities[i], category.placements.length);
    
    console.log(`\n  Processing ${category.name} (${quantity} files)...`);
    
    for (let j = 0; j < quantity; j++) {
      const placement = category.placements[j];
      const { collectibles, interactibles } = generateItems(placement);
      
      // Create modified config
      const modifiedConfig: GameConfig = {
        gameConfig: {
          ...config.gameConfig,
          collectibles,
          interactibles
        }
      };
      
      // Generate filename
      const filename = `${category.name.toLowerCase()}_${j + 1}_${placement.id}.json`;
      const filepath = path.join(outputDir, filename);
      
      // Save file
      fs.writeFileSync(filepath, JSON.stringify(modifiedConfig, null, 2));
      
      console.log(`    ✅ ${filename}`);
      console.log(`       Concept: ${placement.primaryConcept} | Difficulty: ${placement.difficulty}/10`);
      console.log(`       Collectibles: ${collectibles.length} | Interactibles: ${interactibles.length}`);
      
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
        items: {
          collectibles: collectibles.length,
          interactibles: interactibles.length
        }
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
    files: manifest
  }, null, 2));
  
  console.log(`\n  ✅ Manifest saved: _manifest.json`);
  
  // =====================
  // Summary
  // =====================
  logSection('COMPLETE');
  
  console.log(`  Source: ${path.basename(configPath)}`);
  console.log(`  Output: ${outputDir}`);
  console.log(`  Files generated: ${totalFiles}`);
  console.log(`\n  Categories processed:`);
  
  for (let i = 0; i < selectedCategories.length; i++) {
    const cat = selectedCategories[i];
    const qty = Math.min(quantities[i], cat.placements.length);
    console.log(`    - ${cat.name}: ${qty} files`);
  }
  
  console.log('\n');
}

// Run
main().catch(error => {
  console.error('❌ Error:', error);
  process.exit(1);
});
