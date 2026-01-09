
import { getAllPatterns } from '../packages/shared-templates/src/micro-patterns';

console.log("Testing getAllPatterns filter logic...");

const results = getAllPatterns({
  minLength: 6,
  maxLength: 8,
  interactionType: 'crystal',
  turnStyle: 'straight',
  turnPoint: 'null',
  hasJump: false,
});

console.log(`Found ${results.length} patterns.`);

results.forEach((p, i) => {
    if (p.turnCount > 0) {
        console.error(`[FAIL] Pattern ${i} has turns but filtered for straight! Actions: ${p.actions.join(', ')}`);
        console.error(`Meta: turnStyle=${p.turnStyle}, turnPoint=${p.turnPoint}, turnCount=${p.turnCount}`);
    } else {
        // console.log(`[PASS] Pattern ${i} is straight.`); // Verbose
    }
});

if (results.some(p => p.turnCount > 0)) {
    console.error("TEST FAILED: Found turning patterns when 'straight' requested.");
} else {
    console.log("TEST PASSED: All patterns are straight.");
}
