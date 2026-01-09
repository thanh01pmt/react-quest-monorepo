/**
 * Test: Verify maxConsecutivePosition = 4 still allows valid straight patterns
 */

const POSITION_ACTIONS = ['moveForward', 'jump'];
const DIRECTION_ACTIONS = ['turnLeft', 'turnRight'];
const INTERACTION_ACTIONS = ['collectItem', 'toggleSwitch'];

function isPositionAction(a) { return POSITION_ACTIONS.includes(a); }
function isDirectionAction(a) { return DIRECTION_ACTIONS.includes(a); }
function isInteractionAction(a) { return INTERACTION_ACTIONS.includes(a); }

function maxConsecutive(actions, maxCount) {
    let count = 1;
    for (let i = 1; i < actions.length; i++) {
        if (actions[i] === actions[i - 1] && isPositionAction(actions[i])) {
            count++;
            if (count > maxCount) return false;
        } else {
            count = 1;
        }
    }
    return true;
}

function positionBetweenInteractions(actions) {
    let needsPosition = false;
    for (const action of actions) {
        if (isInteractionAction(action)) {
            if (needsPosition) return false;
            needsPosition = true;
        } else if (isPositionAction(action)) {
            needsPosition = false;
        }
    }
    return true;
}

// Test cases
const testCases = [
    {
        name: 'M-M-M-M-C-M-M (7 actions, 4 consecutive M)',
        pattern: ['moveForward', 'moveForward', 'moveForward', 'moveForward', 'collectItem', 'moveForward', 'moveForward'],
        expectPass: true
    },
    {
        name: 'M-M-M-M-C-M-C-M (8 actions)',
        pattern: ['moveForward', 'moveForward', 'moveForward', 'moveForward', 'collectItem', 'moveForward', 'collectItem', 'moveForward'],
        expectPass: true
    },
    {
        name: 'M-M-M-M-M-C-M (7 actions, 5 consecutive M)',
        pattern: ['moveForward', 'moveForward', 'moveForward', 'moveForward', 'moveForward', 'collectItem', 'moveForward'],
        expectPass: false
    },
    {
        name: 'M-C-M-C-M-C-M-C (8 actions, alternating)',
        pattern: ['moveForward', 'collectItem', 'moveForward', 'collectItem', 'moveForward', 'collectItem', 'moveForward', 'collectItem'],
        expectPass: true
    },
];

console.log('=== maxConsecutivePosition Test ===\n');

let passed = 0;
for (const tc of testCases) {
    const result = maxConsecutive(tc.pattern, 4);
    const posCheck = positionBetweenInteractions(tc.pattern);
    const overallPass = result && posCheck;

    const status = overallPass === tc.expectPass ? '✅' : '❌';
    console.log(`${status} ${tc.name}`);
    console.log(`   maxConsecutive(4): ${result}, positionBetweenInteractions: ${posCheck}`);
    console.log(`   Expected: ${tc.expectPass}, Got: ${overallPass}`);

    if (overallPass === tc.expectPass) passed++;
}

console.log(`\n=== Results: ${passed}/${testCases.length} passed ===`);
