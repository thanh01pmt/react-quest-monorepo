/**
 * Test: fromTopology() bridge method
 * 
 * Usage: npx tsx scripts/test-from-topology.ts
 */

import { MapAnalyzer } from '../src/MapAnalyzer';

// Simulate V-Shape topology output (IPathInfo format)
const vShapePathInfo = {
  start_pos: [1, 0, 1] as [number, number, number],
  target_pos: [1, 0, 7] as [number, number, number],
  path_coords: [
    [1, 0, 1], [1, 0, 2], [2, 0, 2], [2, 0, 3], [3, 0, 3], [3, 0, 4],  // left arm
    [3, 0, 5], [2, 0, 5], [2, 0, 6], [1, 0, 6], [1, 0, 7]              // right arm
  ] as [number, number, number][],
  placement_coords: [
    [1, 0, 1], [1, 0, 2], [2, 0, 2], [2, 0, 3], [3, 0, 3], [3, 0, 4],
    [3, 0, 5], [2, 0, 5], [2, 0, 6], [1, 0, 6], [1, 0, 7]
  ] as [number, number, number][],
  metadata: {
    topology_type: 'v_shape',
    segments: [
      [[1, 0, 1], [1, 0, 2], [2, 0, 2], [2, 0, 3], [3, 0, 3], [3, 0, 4]] as [number, number, number][],
      [[3, 0, 4], [3, 0, 5], [2, 0, 5], [2, 0, 6], [1, 0, 6], [1, 0, 7]] as [number, number, number][]
    ],
    semantic_positions: {
      left_end: [1, 0, 1],
      apex: [3, 0, 4],
      right_end: [1, 0, 7],
      optimal_start: 'left_end',
      optimal_end: 'right_end'
    },
    arm_length: 3
  }
};

console.log('═'.repeat(60));
console.log('  TEST: MapAnalyzer.fromTopology()');
console.log('═'.repeat(60));

// Test 1: Basic conversion
console.log('\n📋 Test 1: Convert V-Shape pathInfo to PlacementContext');
console.log('─'.repeat(40));

const context = MapAnalyzer.fromTopology(vShapePathInfo);

console.log(`✅ Segments: ${context.segments.length}`);
console.log(`✅ Selectable Elements: ${context.selectableElements.length}`);
console.log(`✅ Metrics.topology: ${context.metrics.detectedTopology}`);
console.log(`✅ Metrics.totalBlocks: ${context.metrics.totalBlocks}`);
console.log(`✅ Constraints.maxItems: ${context.constraints.maxItems}`);

// Test 2: Verify selectable elements
console.log('\n📋 Test 2: Verify Selectable Elements breakdown');
console.log('─'.repeat(40));

const byType = {
  keypoint: context.selectableElements.filter(e => e.type === 'keypoint'),
  segment: context.selectableElements.filter(e => e.type === 'segment'),
  position: context.selectableElements.filter(e => e.type === 'position')
};

console.log(`  Keypoints: ${byType.keypoint.length}`);
for (const kp of byType.keypoint) {
  console.log(`    - ${kp.id}: ${kp.display.name} (${kp.category})`);
}

console.log(`  Segments: ${byType.segment.length}`);
for (const seg of byType.segment) {
  console.log(`    - ${seg.id}: ${seg.display.name}`);
}

console.log(`  Positions: ${byType.position.length}`);
if (byType.position.length > 0) {
  console.log(`    (showing first 5)`);
  for (const pos of byType.position.slice(0, 5)) {
    console.log(`    - ${pos.id}: ${pos.display.name}`);
  }
}

// Test 3: Verify semantic keypoints were extracted
console.log('\n📋 Test 3: Verify semantic keypoints');
console.log('─'.repeat(40));

const apexElement = context.selectableElements.find(e => e.id === 'keypoint:apex');
const leftEndElement = context.selectableElements.find(e => e.id === 'keypoint:left_end');
const rightEndElement = context.selectableElements.find(e => e.id === 'keypoint:right_end');

console.log(`  apex found: ${apexElement ? '✅' : '❌'}`);
console.log(`  left_end found: ${leftEndElement ? '✅' : '❌'}`);
console.log(`  right_end found: ${rightEndElement ? '✅' : '❌'}`);

// Test 4: Metrics validation
console.log('\n📋 Test 4: Verify metrics');
console.log('─'.repeat(40));

const metricsValid = 
  context.metrics.segmentCount === 2 &&
  context.metrics.totalBlocks === 11 &&
  context.metrics.detectedTopology === 'v_shape';

console.log(`  segmentCount (expected 2): ${context.metrics.segmentCount} ${context.metrics.segmentCount === 2 ? '✅' : '❌'}`);
console.log(`  totalBlocks (expected 11): ${context.metrics.totalBlocks} ${context.metrics.totalBlocks === 11 ? '✅' : '❌'}`);
console.log(`  detectedTopology: ${context.metrics.detectedTopology} ✅`);

// Summary
console.log('\n' + '═'.repeat(60));
const allPassed = 
  context.segments.length === 2 &&
  context.selectableElements.length > 0 &&
  apexElement !== undefined &&
  metricsValid;

if (allPassed) {
  console.log('  ✅ PHASE 1 TESTS PASSED');
} else {
  console.log('  ❌ PHASE 1 TESTS FAILED');
}
console.log('═'.repeat(60));

// Exit with appropriate code
process.exit(allPassed ? 0 : 1);
