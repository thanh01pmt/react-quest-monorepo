/**
 * Analyze multiple topology test files
 */
import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';
import { MapAnalyzer } from '../src/analyzer/MapAnalyzer';

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

console.log('======================================================================');
console.log('🔬 MULTI-TOPOLOGY ANALYSIS');
console.log('======================================================================\n');

const results: {name: string; blocks: number; areas: number; segments: number; topology: string; elements: number}[] = [];

for (const file of TEST_FILES) {
  const filePath = path.join(testDataDir, file);
  
  if (!fs.existsSync(filePath)) {
    console.log(`⚠️  ${file} - NOT FOUND`);
    continue;
  }

  try {
    const jsonData = JSON.parse(fs.readFileSync(filePath, 'utf-8'));
    const analyzer = new MapAnalyzer(jsonData);
    const result = analyzer.analyze();
    
    const topology = result.metrics?.detectedTopology || 'unknown';
    const blocks = result.metrics?.totalBlocks || 0;
    const areas = result.areas?.length || 0;
    const segments = result.segments?.length || 0;
    const elements = result.selectableElements?.length || 0;
    
    results.push({
      name: file.replace('_v1.json', ''),
      blocks,
      areas,
      segments,
      topology,
      elements
    });
    
    console.log(`✅ ${file.padEnd(35)} | Blocks: ${String(blocks).padStart(3)} | Areas: ${areas} | Segments: ${String(segments).padStart(2)} | Topology: ${topology}`);
  } catch (err: any) {
    console.log(`❌ ${file} - ERROR: ${err.message}`);
  }
}

console.log('\n======================================================================');
console.log('📊 SUMMARY TABLE');
console.log('======================================================================\n');

console.log('| Topology | Blocks | Areas | Segments | Detected Type | Elements |');
console.log('|----------|--------|-------|----------|---------------|----------|');
for (const r of results) {
  console.log(`| ${r.name.padEnd(8)} | ${String(r.blocks).padStart(6)} | ${String(r.areas).padStart(5)} | ${String(r.segments).padStart(8)} | ${r.topology.padEnd(13)} | ${String(r.elements).padStart(8)} |`);
}

console.log('\n======================================================================');
console.log('✨ Analysis Complete!');
console.log('======================================================================');
