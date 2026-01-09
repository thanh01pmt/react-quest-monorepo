
// Mock types and valid actions since we are outside TS
const POSITION_ACTIONS = ['moveForward', 'jump', 'jumpUp', 'jumpDown'];
const DIRECTION_ACTIONS = ['turnLeft', 'turnRight'];
const INTERACTION_ACTIONS = ['collectItem', 'toggleSwitch', 'pickUpKey'];

const ACTION_SHORT = {
    moveForward: 'M', jump: 'J', jumpUp: 'U', jumpDown: 'D',
    turnLeft: 'L', turnRight: 'R',
    collectItem: 'C', toggleSwitch: 'T', pickUpKey: 'K',
};

// --- COPY PASTE RELEVANT FUNCTIONS FROM micro-patterns.ts (simplified import) ---
// Since we can't easily import TS files in Node without setup, I will paste the logic here to verify LOGIC correctness only.
// If logic is correct here but fails in app, then it's an environment/import issue or TemplateInterpreter issue.

function isDirectionAction(a) {
    return DIRECTION_ACTIONS.includes(a);
}

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

    const hasTurn = actions.some(isDirectionAction);
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
    } else {
        // straight/null default
    }

    return {
        id, actions,
        turnCount, turnStyle, turnPoint
    };
}

function runTest() {
    console.log("Testing Logic...");

    // Test Case: L-shape pattern which should FAIL filter
    const badPattern = ['moveForward', 'turnLeft', 'moveForward', 'collectItem'];
    const meta = getPatternMeta(badPattern);
    console.log("Meta:", meta);

    const turnStyleFilter = 'straight';
    const turnPointFilter = 'null';

    let pass = true;
    if (turnStyleFilter || turnPointFilter) {
        if (meta.turnCount > 1) pass = false;

        if (turnStyleFilter && meta.turnStyle !== turnStyleFilter) {
            console.log(`Failed turnStyle: Expected ${turnStyleFilter}, got ${meta.turnStyle}`);
            pass = false;
        }
        if (turnPointFilter && meta.turnPoint !== turnPointFilter) {
            console.log(`Failed turnPoint: Expected ${turnPointFilter}, got ${meta.turnPoint}`);
            pass = false;
        }
    }

    if (pass) {
        console.error("TEST FAILED: Logic accepted a bent pattern despite 'straight' filter.");
    } else {
        console.log("TEST PASSED: Logic rejected the bent pattern.");
    }
}

runTest();
