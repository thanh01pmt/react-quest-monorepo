/**
 * Comprehensive Test Suite for randomPattern Filters
 * 
 * This file contains a self-contained copy of the micro-patterns logic
 * and tests all filter combinations to ensure correctness.
 * 
 * Run with: node test-random-pattern.js
 */

// =============================================================================
// TYPES (Copied from micro-patterns.ts)
// =============================================================================

const POSITION_ACTIONS = ['moveForward', 'jump', 'jumpUp', 'jumpDown'];
const DIRECTION_ACTIONS = ['turnLeft', 'turnRight'];
const INTERACTION_ACTIONS = ['collectItem', 'toggleSwitch', 'pickUpKey'];

const ACTION_SHORT = {
    moveForward: 'M', jump: 'J', jumpUp: 'U', jumpDown: 'D',
    turnLeft: 'L', turnRight: 'R',
    collectItem: 'C', toggleSwitch: 'T', pickUpKey: 'K',
};

// =============================================================================
// VALIDATION FUNCTIONS
// =============================================================================

function isPositionAction(a) {
    return POSITION_ACTIONS.includes(a);
}

function isDirectionAction(a) {
    return DIRECTION_ACTIONS.includes(a);
}

function isInteractionAction(a) {
    return INTERACTION_ACTIONS.includes(a);
}

function hasPositionAction(actions) {
    return actions.some(isPositionAction);
}

function hasInteractionAction(actions) {
    return actions.some(isInteractionAction);
}

function noOscillation(actions) {
    for (let i = 0; i < actions.length - 1; i++) {
        if (actions[i] === 'turnLeft' && actions[i + 1] === 'turnLeft') return false;
        if (actions[i] === 'turnRight' && actions[i + 1] === 'turnRight') return false;
    }
    return true;
}

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

function isAtomic(actions) {
    const len = actions.length;
    for (let subLen = 1; subLen < len; subLen++) {
        if (len % subLen !== 0) continue;
        const repeatCount = len / subLen;
        if (repeatCount < 2) continue;

        const subPattern = actions.slice(0, subLen);
        let isRepetition = true;

        for (let i = 0; i < repeatCount && isRepetition; i++) {
            for (let j = 0; j < subLen; j++) {
                if (actions[i * subLen + j] !== subPattern[j]) {
                    isRepetition = false;
                    break;
                }
            }
        }

        if (isRepetition && hasPositionAction(subPattern) && hasInteractionAction(subPattern)) {
            return false;
        }
    }
    return true;
}

function positionBetweenInteractions(actions) {
    let needsPosition = false;

    for (const action of actions) {
        if (isInteractionAction(action)) {
            if (needsPosition) {
                return false;
            }
            needsPosition = true;
        } else if (isPositionAction(action)) {
            needsPosition = false;
        }
    }

    return true;
}

function isValidPattern(actions, maxConsecutivePos) {
    if (actions.length < 2 || actions.length > 10) return false;
    if (!hasPositionAction(actions)) return false;
    if (!hasInteractionAction(actions)) return false;
    if (!noOscillation(actions)) return false;
    if (!positionBetweenInteractions(actions)) return false;
    if (!maxConsecutive(actions, maxConsecutivePos)) return false;
    if (!isAtomic(actions)) return false;
    return true;
}

// =============================================================================
// PATTERN METADATA
// =============================================================================

function calculateNetTurn(actions) {
    let net = 0;
    for (const a of actions) {
        if (a === 'turnLeft') net -= 90;
        if (a === 'turnRight') net += 90;
    }
    net = ((net % 360) + 360) % 360;
    if (net > 180) net -= 360;
    return net;
}

function getPatternMeta(actions) {
    const id = actions.map(a => ACTION_SHORT[a]).join('_');

    const hasC = actions.includes('collectItem');
    const hasT = actions.includes('toggleSwitch');
    const hasK = actions.includes('pickUpKey');
    const hasTurn = actions.some(isDirectionAction);
    const hasJump = actions.some(a => ['jump', 'jumpUp', 'jumpDown'].includes(a));

    // Determine interaction type
    let interactionType;
    const interactionCount = [hasC, hasT, hasK].filter(Boolean).length;
    if (interactionCount > 1) {
        interactionType = 'mixed';
    } else if (hasK) {
        interactionType = 'key';
    } else if (hasT) {
        interactionType = 'switch';
    } else {
        interactionType = 'crystal';
    }

    const movementStyle =
        hasTurn && hasJump ? 'mixed' : hasTurn ? 'turn' : hasJump ? 'jump' : 'straight';

    const netTurn = calculateNetTurn(actions);
    const nestedLoopCompatible = netTurn === 0;

    // Calculate Turn Metadata
    const turnIndices = actions.map((a, i) => isDirectionAction(a) ? i : -1).filter(i => i !== -1);
    const turnCount = turnIndices.length;

    let turnStyle = 'straight';
    let turnPoint = 'null';

    if (turnCount === 1) {
        const idx = turnIndices[0];
        const action = actions[idx];
        turnStyle = action;

        if (idx === 0) turnPoint = 'start';
        else if (idx === actions.length - 1) turnPoint = 'end';
        else turnPoint = 'mid';
    } else if (turnCount === 0) {
        turnStyle = 'straight';
        turnPoint = 'null';
    }

    return {
        id, actions, actionCount: actions.length,
        interactionType, movementStyle,
        netTurn, nestedLoopCompatible,
        turnCount, turnStyle, turnPoint,
        hasJump
    };
}

// =============================================================================
// GENERATOR
// =============================================================================

function* generatePermutations(actions, length) {
    if (length === 0) { yield []; return; }

    const indices = new Array(length).fill(0);
    const numActions = actions.length;

    while (true) {
        yield indices.map(i => actions[i]);

        let pos = length - 1;
        while (pos >= 0) {
            indices[pos]++;
            if (indices[pos] < numActions) break;
            indices[pos] = 0;
            pos--;
        }
        if (pos < 0) break;
    }
}

function createRng(seed) {
    return function () {
        let t = seed += 0x6D2B79F5;
        t = Math.imul(t ^ t >>> 15, t | 1);
        t ^= t + Math.imul(t ^ t >>> 7, t | 61);
        return ((t ^ t >>> 14) >>> 0) / 4294967296;
    };
}

// =============================================================================
// PUBLIC API
// =============================================================================

function getAllPatterns(options = {}) {
    const {
        minLength = 2,
        maxLength = 5,
        includeTemplateActions = false,
        maxConsecutivePosition = 10, // CHANGED: Increased from 4 to 10
        interactionType,
        movementStyle,
        nestedLoopCompatible,
        netTurn,
        turnStyle,
        turnPoint,
        hasJump,
    } = options;

    let actionSet = options.actions || [
        'moveForward', 'jump',
        'turnLeft', 'turnRight',
        'collectItem', 'toggleSwitch',
    ];

    if (includeTemplateActions && !options.actions) {
        actionSet = [...actionSet, 'jumpUp', 'jumpDown'];
    }

    const results = [];

    for (let len = minLength; len <= maxLength; len++) {
        for (const perm of generatePermutations(actionSet, len)) {
            if (!isValidPattern(perm, maxConsecutivePosition)) continue;

            const meta = getPatternMeta(perm);

            // Apply filters
            if (interactionType && meta.interactionType !== interactionType) continue;
            if (movementStyle && meta.movementStyle !== movementStyle) continue;
            if (nestedLoopCompatible !== undefined && meta.nestedLoopCompatible !== nestedLoopCompatible) continue;
            if (netTurn !== undefined && meta.netTurn !== netTurn) continue;

            // New Turn Filter Logic
            if (turnStyle || turnPoint) {
                if (meta.turnCount > 1) continue;

                if (turnStyle && meta.turnStyle !== turnStyle) continue;
                if (turnPoint && meta.turnPoint !== turnPoint) continue;
            }

            if (hasJump !== undefined && meta.hasJump !== hasJump) continue;

            results.push(meta);
        }
    }

    return results;
}

function getRandomPattern(options = {}) {
    const {
        minLength = 2,
        maxLength = 5,
        includeTemplateActions = false,
        maxConsecutivePosition = 10, // CHANGED: Increased from 4 to 10
        interactionType,
        movementStyle,
        nestedLoopCompatible,
        netTurn,
        turnStyle,
        turnPoint,
        hasJump,
        seed = Date.now(),
    } = options;

    let actionSet = options.actions || [
        'moveForward', 'jump',
        'turnLeft', 'turnRight',
        'collectItem', 'toggleSwitch',
    ];

    if (includeTemplateActions && !options.actions) {
        actionSet = [...actionSet, 'jumpUp', 'jumpDown'];
    }

    const rng = createRng(seed);
    let selected = null;
    let count = 0;

    for (let len = minLength; len <= maxLength; len++) {
        for (const perm of generatePermutations(actionSet, len)) {
            if (!isValidPattern(perm, maxConsecutivePosition)) continue;

            const meta = getPatternMeta(perm);

            // Apply filters
            if (interactionType && meta.interactionType !== interactionType) continue;
            if (movementStyle && meta.movementStyle !== movementStyle) continue;
            if (nestedLoopCompatible !== undefined && meta.nestedLoopCompatible !== nestedLoopCompatible) continue;
            if (netTurn !== undefined && meta.netTurn !== netTurn) continue;

            if (turnStyle || turnPoint) {
                if (meta.turnCount > 1) continue;
                if (turnStyle && meta.turnStyle !== turnStyle) continue;
                if (turnPoint && meta.turnPoint !== turnPoint) continue;
            }

            if (hasJump !== undefined && meta.hasJump !== hasJump) continue;

            count++;
            if (rng() < 1 / count) {
                selected = meta;
            }
        }
    }

    return selected;
}

// =============================================================================
// TEST SUITE
// =============================================================================

let passed = 0;
let failed = 0;

function test(name, condition, details = '') {
    if (condition) {
        console.log(`✅ PASS: ${name}`);
        passed++;
    } else {
        console.error(`❌ FAIL: ${name}`);
        if (details) console.error(`   Details: ${details}`);
        failed++;
    }
}

function runTests() {
    console.log('\n========================================');
    console.log('🧪 RANDOMPATTERN FILTER TEST SUITE');
    console.log('========================================\n');

    // -------------------------------------------------------------------------
    // TEST 1: Basic filtering - turnStyle = 'straight'
    // -------------------------------------------------------------------------
    console.log('--- Test 1: turnStyle = "straight" ---');
    const straightPatterns = getAllPatterns({
        minLength: 2,
        maxLength: 5,
        turnStyle: 'straight',
    });

    const allStraight = straightPatterns.every(p => p.turnStyle === 'straight');
    test('All patterns have turnStyle="straight"', allStraight,
        allStraight ? '' : `Found: ${straightPatterns.filter(p => p.turnStyle !== 'straight').map(p => p.id).join(', ')}`);

    const noTurnsInStraight = straightPatterns.every(p => p.turnCount === 0);
    test('All "straight" patterns have turnCount=0', noTurnsInStraight,
        noTurnsInStraight ? '' : `Found patterns with turns: ${straightPatterns.filter(p => p.turnCount !== 0).map(p => p.id).join(', ')}`);

    // -------------------------------------------------------------------------
    // TEST 2: turnStyle = 'turnLeft'
    // -------------------------------------------------------------------------
    console.log('\n--- Test 2: turnStyle = "turnLeft" ---');
    const leftPatterns = getAllPatterns({
        minLength: 2,
        maxLength: 5,
        turnStyle: 'turnLeft',
    });

    const allLeft = leftPatterns.every(p => p.turnStyle === 'turnLeft');
    test('All patterns have turnStyle="turnLeft"', allLeft);

    const exactlyOneTurnLeft = leftPatterns.every(p => p.turnCount === 1);
    test('All "turnLeft" patterns have exactly 1 turn', exactlyOneTurnLeft);

    // -------------------------------------------------------------------------
    // TEST 3: turnStyle = 'turnRight'
    // -------------------------------------------------------------------------
    console.log('\n--- Test 3: turnStyle = "turnRight" ---');
    const rightPatterns = getAllPatterns({
        minLength: 2,
        maxLength: 5,
        turnStyle: 'turnRight',
    });

    const allRight = rightPatterns.every(p => p.turnStyle === 'turnRight');
    test('All patterns have turnStyle="turnRight"', allRight);

    // -------------------------------------------------------------------------
    // TEST 4: turnPoint = 'mid'
    // -------------------------------------------------------------------------
    console.log('\n--- Test 4: turnPoint = "mid" ---');
    const midPatterns = getAllPatterns({
        minLength: 3, // Need at least 3 to have a "mid" position
        maxLength: 5,
        turnPoint: 'mid',
    });

    const allMid = midPatterns.every(p => p.turnPoint === 'mid');
    test('All patterns have turnPoint="mid"', allMid,
        allMid ? '' : `Found: ${midPatterns.filter(p => p.turnPoint !== 'mid').map(p => p.id).join(', ')}`);

    // -------------------------------------------------------------------------
    // TEST 5: turnPoint = 'start'
    // -------------------------------------------------------------------------
    console.log('\n--- Test 5: turnPoint = "start" ---');
    const startPatterns = getAllPatterns({
        minLength: 2,
        maxLength: 5,
        turnPoint: 'start',
    });

    const allStart = startPatterns.every(p => p.turnPoint === 'start');
    test('All patterns have turnPoint="start"', allStart);

    // Verify that turnPoint="start" means the turn is at index 0
    const turnAtStart = startPatterns.every(p => {
        if (p.turnCount === 0) return false; // should not happen with turnPoint filter
        return isDirectionAction(p.actions[0]);
    });
    test('All "start" patterns have turn action at index 0', turnAtStart);

    // -------------------------------------------------------------------------
    // TEST 6: turnPoint = 'end'
    // -------------------------------------------------------------------------
    console.log('\n--- Test 6: turnPoint = "end" ---');
    const endPatterns = getAllPatterns({
        minLength: 2,
        maxLength: 5,
        turnPoint: 'end',
    });

    const allEnd = endPatterns.every(p => p.turnPoint === 'end');
    test('All patterns have turnPoint="end"', allEnd);

    const turnAtEnd = endPatterns.every(p => {
        if (p.turnCount === 0) return false;
        return isDirectionAction(p.actions[p.actions.length - 1]);
    });
    test('All "end" patterns have turn action at last index', turnAtEnd);

    // -------------------------------------------------------------------------
    // TEST 7: hasJump = true (withJump)
    // -------------------------------------------------------------------------
    console.log('\n--- Test 7: hasJump = true (withJump) ---');
    const jumpPatterns = getAllPatterns({
        minLength: 2,
        maxLength: 5,
        hasJump: true,
    });

    const allHaveJump = jumpPatterns.every(p => p.hasJump === true);
    test('All patterns have hasJump=true', allHaveJump);

    const containsJumpAction = jumpPatterns.every(p =>
        p.actions.some(a => ['jump', 'jumpUp', 'jumpDown'].includes(a))
    );
    test('All "withJump" patterns contain a jump action', containsJumpAction);

    // -------------------------------------------------------------------------
    // TEST 8: hasJump = false (noJump)
    // -------------------------------------------------------------------------
    console.log('\n--- Test 8: hasJump = false (noJump) ---');
    const noJumpPatterns = getAllPatterns({
        minLength: 2,
        maxLength: 5,
        hasJump: false,
    });

    const noneHaveJump = noJumpPatterns.every(p => p.hasJump === false);
    test('All patterns have hasJump=false', noneHaveJump);

    const noJumpActions = noJumpPatterns.every(p =>
        !p.actions.some(a => ['jump', 'jumpUp', 'jumpDown'].includes(a))
    );
    test('All "noJump" patterns do not contain jump actions', noJumpActions);

    // -------------------------------------------------------------------------
    // TEST 9: Combined filter - turnStyle='straight' + hasJump=false
    // -------------------------------------------------------------------------
    console.log('\n--- Test 9: turnStyle="straight" + hasJump=false ---');
    const straightNoJump = getAllPatterns({
        minLength: 2,
        maxLength: 5,
        turnStyle: 'straight',
        hasJump: false,
    });

    test('Combined filter returns results', straightNoJump.length > 0);

    const combinedCorrect = straightNoJump.every(p =>
        p.turnStyle === 'straight' && p.hasJump === false
    );
    test('All results match both filters', combinedCorrect);

    // -------------------------------------------------------------------------
    // TEST 10: Combined filter - turnStyle='turnRight' + turnPoint='mid'
    // -------------------------------------------------------------------------
    console.log('\n--- Test 10: turnStyle="turnRight" + turnPoint="mid" ---');
    const rightMid = getAllPatterns({
        minLength: 3,
        maxLength: 5,
        turnStyle: 'turnRight',
        turnPoint: 'mid',
    });

    test('L-shape filter returns results', rightMid.length > 0);

    const lShapeCorrect = rightMid.every(p =>
        p.turnStyle === 'turnRight' && p.turnPoint === 'mid'
    );
    test('All L-shape patterns match filters', lShapeCorrect);

    // -------------------------------------------------------------------------
    // TEST 11: interactionType filter
    // -------------------------------------------------------------------------
    console.log('\n--- Test 11: interactionType = "crystal" ---');
    const crystalPatterns = getAllPatterns({
        minLength: 2,
        maxLength: 4,
        interactionType: 'crystal',
    });

    const allCrystal = crystalPatterns.every(p => p.interactionType === 'crystal');
    test('All patterns have interactionType="crystal"', allCrystal);

    // -------------------------------------------------------------------------
    // TEST 12: movementStyle filter
    // -------------------------------------------------------------------------
    console.log('\n--- Test 12: movementStyle = "straight" ---');
    const straightMovePatterns = getAllPatterns({
        minLength: 2,
        maxLength: 4,
        movementStyle: 'straight',
    });

    const allStraightMove = straightMovePatterns.every(p => p.movementStyle === 'straight');
    test('All patterns have movementStyle="straight"', allStraightMove);

    // -------------------------------------------------------------------------
    // TEST 13: netTurn filter
    // -------------------------------------------------------------------------
    console.log('\n--- Test 13: netTurn = 0 ---');
    const netTurn0 = getAllPatterns({
        minLength: 2,
        maxLength: 5,
        netTurn: 0,
    });

    const allNetTurn0 = netTurn0.every(p => p.netTurn === 0);
    test('All patterns have netTurn=0', allNetTurn0);

    // -------------------------------------------------------------------------
    // TEST 14: Length constraints
    // -------------------------------------------------------------------------
    console.log('\n--- Test 14: Length constraints (6-8) ---');
    const longPatterns = getAllPatterns({
        minLength: 6,
        maxLength: 8,
        turnStyle: 'straight',
        hasJump: false,
    });

    const correctLength = longPatterns.every(p => p.actionCount >= 6 && p.actionCount <= 8);
    test('All patterns have length 6-8', correctLength);
    test('Long straight patterns exist', longPatterns.length > 0,
        `Found ${longPatterns.length} patterns`);

    // -------------------------------------------------------------------------
    // TEST 15: getRandomPattern returns valid result
    // -------------------------------------------------------------------------
    console.log('\n--- Test 15: getRandomPattern consistency ---');
    const randomResult = getRandomPattern({
        minLength: 3,
        maxLength: 5,
        turnStyle: 'straight',
        hasJump: false,
        seed: 12345,
    });

    test('getRandomPattern returns a result', randomResult !== null);
    if (randomResult) {
        test('Random result matches turnStyle filter', randomResult.turnStyle === 'straight');
        test('Random result matches hasJump filter', randomResult.hasJump === false);
    }

    // -------------------------------------------------------------------------
    // SUMMARY
    // -------------------------------------------------------------------------
    console.log('\n========================================');
    console.log(`📊 RESULTS: ${passed} passed, ${failed} failed`);
    console.log('========================================\n');

    if (failed > 0) {
        console.log('⚠️  Some tests failed. Please review the filter logic.');
        process.exit(1);
    } else {
        console.log('🎉 All tests passed! Filter logic is correct.');
        process.exit(0);
    }
}

// Run tests
runTests();
