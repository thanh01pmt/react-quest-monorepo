/**
 * Micro-Pattern Generator Script
 * 
 * Generates all valid micro-patterns using combinatorics + filtering.
 * Run with: node scripts/generate-micro-patterns.js
 */

// =============================================================================
// ACTION TYPES
// =============================================================================

const POSITION_ACTIONS = ['moveForward', 'jump', 'jumpUp', 'jumpDown'];
const DIRECTION_ACTIONS = ['turnLeft', 'turnRight'];
const INTERACTION_ACTIONS = ['collectItem', 'toggleSwitch'];

// Short names for readable IDs
const ACTION_SHORT = {
    moveForward: 'M',
    jump: 'J',
    jumpUp: 'U',
    jumpDown: 'D',
    turnLeft: 'L',
    turnRight: 'R',
    collectItem: 'C',
    toggleSwitch: 'T',
};

// =============================================================================
// VALIDATION RULES
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

/** Rule 1: Must have ≥1 position-changing action */
function hasPositionAction(actions) {
    return actions.some(isPositionAction);
}

/** Rule 2: Must have ≥1 interaction action */
function hasInteractionAction(actions) {
    return actions.some(isInteractionAction);
}

/** Rule 3: Direction-only actions cannot stand alone */
function directionHasPosition(actions) {
    const hasDirection = actions.some(isDirectionAction);
    if (!hasDirection) return true;
    return hasPositionAction(actions);
}

/** Rule 5: Action count must be 2-10 */
function validActionCount(actions) {
    return actions.length >= 2 && actions.length <= 10;
}

/**
 * Rule 6: Atomicity - cannot be N × smaller pattern
 */
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

        if (isRepetition) {
            // Sub-pattern must also be valid to count as repetition
            if (hasPositionAction(subPattern) && hasInteractionAction(subPattern)) {
                return false;
            }
        }
    }
    return true;
}

/** Rule 8: Anti-oscillation - no 2× consecutive same-direction turns */
function noOscillation(actions) {
    for (let i = 0; i < actions.length - 1; i++) {
        if (actions[i] === 'turnLeft' && actions[i + 1] === 'turnLeft') return false;
        if (actions[i] === 'turnRight' && actions[i + 1] === 'turnRight') return false;
    }
    return true;
}

/** Rule 9: Max 4 consecutive same position action */
function maxConsecutive(actions, max = 4) {
    let count = 1;
    for (let i = 1; i < actions.length; i++) {
        if (actions[i] === actions[i - 1] && isPositionAction(actions[i])) {
            count++;
            if (count > max) return false;
        } else {
            count = 1;
        }
    }
    return true;
}

/** 
 * Rule: Between any two interactions, must have ≥1 position-changing action.
 * Reason: Each cell can only have 1 crystal OR 1 switch.
 */
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

/** Check ALL rules */
function isValidPattern(actions) {
    if (!validActionCount(actions)) return false;
    if (!hasPositionAction(actions)) return false;
    if (!hasInteractionAction(actions)) return false;
    if (!directionHasPosition(actions)) return false;
    if (!noOscillation(actions)) return false;
    if (!positionBetweenInteractions(actions)) return false;
    if (!maxConsecutive(actions)) return false;
    if (!isAtomic(actions)) return false;
    return true;
}

// =============================================================================
// PATTERN GENERATION (Combinatorics)
// =============================================================================

/**
 * Generate all permutations with repetition of given length
 */
function* generatePermutations(actions, length) {
    if (length === 0) {
        yield [];
        return;
    }

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

/**
 * Generate all valid patterns of a given length
 */
function generateValidPatterns(length, actionSet) {
    const valid = [];

    for (const perm of generatePermutations(actionSet, length)) {
        if (isValidPattern(perm)) {
            valid.push([...perm]);
        }
    }

    return valid;
}

// =============================================================================
// MAIN GENERATION
// =============================================================================

function main() {
    console.log('=== Micro-Pattern Generator ===\n');

    // Core actions (excluding jumpUp/jumpDown for initial run)
    const CORE_ACTIONS = [
        'moveForward', 'jump',
        'turnLeft', 'turnRight',
        'collectItem', 'toggleSwitch'
    ];

    const allPatterns = [];

    // Generate patterns from length 2 to 7 (with Rule 9 limiting moves)
    for (let len = 2; len <= 7; len++) {
        console.log(`Generating length ${len}...`);
        const start = Date.now();
        const patterns = generateValidPatterns(len, CORE_ACTIONS);
        const elapsed = Date.now() - start;
        console.log(`  Found ${patterns.length} valid patterns (${elapsed}ms)`);

        for (const p of patterns) {
            allPatterns.push({
                id: p.map(a => ACTION_SHORT[a]).join('_'),
                actions: p,
                actionCount: p.length,
            });
        }
    }

    console.log(`\n=== TOTAL: ${allPatterns.length} patterns ===\n`);

    // Statistics
    const byLength = {};
    for (const p of allPatterns) {
        byLength[p.actionCount] = (byLength[p.actionCount] || 0) + 1;
    }
    console.log('By Length:', byLength);

    // Output sample
    console.log('\n=== Sample patterns ===');
    for (let len = 2; len <= 5; len++) {
        const samples = allPatterns.filter(p => p.actionCount === len).slice(0, 5);
        console.log(`\nLength ${len}:`);
        for (const p of samples) {
            console.log(`  ${p.id}: ${p.actions.join(' → ')}`);
        }
    }
}

main();
