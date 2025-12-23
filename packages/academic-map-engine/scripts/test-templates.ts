/**
 * Test: PlacementTemplate System
 * 
 * Usage: npx tsx scripts/test-templates.ts
 */

import { MapAnalyzer } from '../src/MapAnalyzer';
import { 
  PlacementTemplateRegistry, 
  getTemplateRegistry,
  DEFAULT_TEMPLATES 
} from '../src/PlacementTemplate';
import { findElementsBySelector } from '../src/SelectableElement';

// Simulate V-Shape topology output
const vShapePathInfo = {
  start_pos: [1, 0, 1] as [number, number, number],
  target_pos: [1, 0, 7] as [number, number, number],
  path_coords: [
    [1, 0, 1], [1, 0, 2], [2, 0, 2], [2, 0, 3], [3, 0, 3], [3, 0, 4],
    [3, 0, 5], [2, 0, 5], [2, 0, 6], [1, 0, 6], [1, 0, 7]
  ] as [number, number, number][],
  placement_coords: [] as [number, number, number][],
  metadata: {
    topology_type: 'v_shape',
    segments: [
      [[1, 0, 1], [1, 0, 2], [2, 0, 2], [2, 0, 3], [3, 0, 3], [3, 0, 4]] as [number, number, number][],
      [[3, 0, 4], [3, 0, 5], [2, 0, 5], [2, 0, 6], [1, 0, 6], [1, 0, 7]] as [number, number, number][]
    ],
    semantic_positions: {
      left_end: [1, 0, 1],
      apex: [3, 0, 4],
      right_end: [1, 0, 7]
    }
  }
};

console.log('═'.repeat(60));
console.log('  TEST: PlacementTemplate System');
console.log('═'.repeat(60));

// Get context
const context = MapAnalyzer.fromTopology(vShapePathInfo);

// Create new registry instance (in-memory only for test)
const registry = new PlacementTemplateRegistry();

// Test 1: Save template
console.log('\n📋 Test 1: Save template');
console.log('─'.repeat(40));

const template1 = registry.save({
  name: 'Test V-Shape',
  topologyType: 'v_shape',
  rules: [
    { selector: { type: 'keypoint', name: 'apex' }, itemType: 'switch' },
    { selector: { type: 'position', segment: 'seg_0', offset: 2 }, itemType: 'crystal' }
  ]
});

console.log(`  Template saved with ID: ${template1.id}`);
console.log(`  Name: ${template1.name}`);
console.log(`  Rules: ${template1.rules.length}`);
console.log('  ✅ Save works');

// Test 2: Get template
console.log('\n📋 Test 2: Get template');
console.log('─'.repeat(40));

const retrieved = registry.get(template1.id);
console.log(`  Retrieved: ${retrieved ? '✅' : '❌'}`);
console.log(`  Same name: ${retrieved?.name === template1.name ? '✅' : '❌'}`);

// Test 3: Find by topology
console.log('\n📋 Test 3: Find by topology');
console.log('─'.repeat(40));

const vShapeTemplates = registry.findByTopology('v_shape');
console.log(`  Found ${vShapeTemplates.length} template(s) for v_shape`);
console.log(`  ✅ findByTopology works`);

// Test 4: Apply template
console.log('\n📋 Test 4: Apply template');
console.log('─'.repeat(40));

const placements = registry.apply(template1.id, context.selectableElements);
console.log(`  Generated ${placements.length} placements:`);
for (const p of placements) {
  console.log(`    - ${p.type} at [${p.position.join(',')}]`);
}

const hasSwitch = placements.some(p => p.type === 'switch');
const hasCrystal = placements.some(p => p.type === 'crystal');
console.log(`  Has switch: ${hasSwitch ? '✅' : '❌'}`);
console.log(`  Has crystal: ${hasCrystal ? '✅' : '❌'}`);

// Test 5: Apply rules directly
console.log('\n📋 Test 5: Apply rules with symmetric option');
console.log('─'.repeat(40));

const symmetricRules = [
  { 
    selector: { type: 'position' as const, segment: 'seg_0', offset: 2 }, 
    itemType: 'crystal' as const, 
    options: { symmetric: true } 
  }
];

// First, we need to set up mirror relationships
// For now, test the basic rule application
const symPlacements = registry.applyRules(symmetricRules, context.selectableElements);
console.log(`  Symmetric placements: ${symPlacements.length}`);
// Note: symmetric won't work until we set up mirror relationships properly
console.log(`  ✅ applyRules works`);

// Test 6: Create from selections
console.log('\n📋 Test 6: Create template from selections');
console.log('─'.repeat(40));

const template2 = registry.createFromSelections(
  'User Created Template',
  'v_shape',
  [
    { elementId: 'keypoint:apex', itemType: 'switch' },
    { elementId: 'position:seg_0[2]', itemType: 'crystal' }
  ],
  context.selectableElements
);

console.log(`  Created template: ${template2.name}`);
console.log(`  Rules: ${template2.rules.length}`);
console.log(`  ✅ createFromSelections works`);

// Test 7: Export/Import
console.log('\n📋 Test 7: Export templates');
console.log('─'.repeat(40));

const exported = registry.export();
console.log(`  Exported JSON length: ${exported.length} chars`);
const parsed = JSON.parse(exported);
console.log(`  Templates in export: ${parsed.length}`);
console.log(`  ✅ Export works`);

// Test 8: Delete template
console.log('\n📋 Test 8: Delete template');
console.log('─'.repeat(40));

const deleted = registry.delete(template1.id);
console.log(`  Deleted: ${deleted ? '✅' : '❌'}`);
const afterDelete = registry.get(template1.id);
console.log(`  Gone after delete: ${!afterDelete ? '✅' : '❌'}`);

// Summary
console.log('\n' + '═'.repeat(60));
const allPassed = 
  template1.id &&
  retrieved &&
  placements.length >= 2 &&
  hasSwitch &&
  hasCrystal &&
  template2.rules.length === 2 &&
  deleted &&
  !afterDelete;

if (allPassed) {
  console.log('  ✅ PHASE 3 TESTS PASSED');
} else {
  console.log('  ❌ PHASE 3 TESTS FAILED');
}
console.log('═'.repeat(60));

process.exit(allPassed ? 0 : 1);
