/**
 * Generate detailed markdown reports for multiple topologies
 */
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { MapAnalysisService } from '../src/index.js';
import type { GameConfig } from '../src/index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TEST_FILES = [
  'spiral_path_v1.json',
  'square_shape_v1.json',
  'staircase_v1.json',
  'star_shape_v1.json',
  'stepped_island_clusters_v1.json',
  'triangle_v1.json',
  'z_shape_v1.json',
  'zigzag_v1.json'
];

const testDataDir = path.join(__dirname, 'test_data');
const outputDir = path.join(__dirname, 'output');

// Ensure output directory exists
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

console.log('======================================================================');
console.log('📄 GENERATING DETAILED REPORTS FOR ALL TOPOLOGIES');
console.log('======================================================================\n');

const service = new MapAnalysisService();

for (const file of TEST_FILES) {
  const filePath = path.join(testDataDir, file);
  const reportName = file.replace('_v1.json', '_report.md');
  const reportPath = path.join(outputDir, reportName);
  
  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  ${file} - NOT FOUND`);
    continue;
  }

  try {
    const jsonData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    const gameConfig: GameConfig = jsonData.gameConfig;
    
    const { context, report } = service.analyze(gameConfig);
    
    fs.writeFileSync(reportPath, report, 'utf-8');
    
    console.log(`✅ ${file.padEnd(35)} → ${reportName}`);
    console.log(`   Blocks: ${gameConfig.blocks.length}, Areas: ${context.areas.length}, Segments: ${context.segments.length}, Elements: ${context.selectableElements.length}`);
    
  } catch (err: any) {
    console.log(`❌ ${file} - ERROR: ${err.message}`);
  }
}

console.log('\n======================================================================');
console.log('✨ All reports generated in: ' + outputDir);
console.log('======================================================================');
