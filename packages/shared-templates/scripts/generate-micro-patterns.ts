/**
 * Micro-Pattern Generator Script
 * 
 * Generates all valid micro-patterns using combinatorics + filtering.
 * Run with: npx ts-node scripts/generate-micro-patterns.ts
 */

// =============================================================================
// ACTION TYPES
// =============================================================================

type PositionAction = 'moveForward' | 'jump' | 'jumpUp' | 'jumpDown';
type DirectionAction = 'turnLeft' | 'turnRight';
type InteractionAction = 'collectItem' | 'toggleSwitch';
type ActionType = PositionAction | DirectionAction | InteractionAction;

const POSITION_ACTIONS: PositionAction[] = ['moveForward', 'jump', 'jumpUp', 'jumpDown'];
const DIRECTION_ACTIONS: DirectionAction[] = ['turnLeft', 'turnRight'];
const INTERACTION_ACTIONS: InteractionAction[] = ['collectItem', 'toggleSwitch'];
const ALL_ACTIONS: ActionType[] = [...POSITION_ACTIONS, ...DIRECTION_ACTIONS, ...INTERACTION_ACTIONS];

// Short names for readable IDs
const ACTION_SHORT: Record<ActionType, string> = {
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

function isPositionAction(a: ActionType): boolean {
  return POSITION_ACTIONS.includes(a as PositionAction);
}

function isDirectionAction(a: ActionType): boolean {
  return DIRECTION_ACTIONS.includes(a as DirectionAction);
}

function isInteractionAction(a: ActionType): boolean {
  return INTERACTION_ACTIONS.includes(a as InteractionAction);
}

/**
 * Rule 1: Must have ≥1 position-changing action
 */
function hasPositionAction(actions: ActionType[]): boolean {
  return actions.some(isPositionAction);
}

/**
 * Rule 2: Must have ≥1 interaction action
 */
function hasInteractionAction(actions: ActionType[]): boolean {
  return actions.some(isInteractionAction);
}

/**
 * Rule 3: Direction-only actions cannot stand alone
 * (Already covered by Rule 1, but explicit check: pattern can't be all directions)
 */
function directionHasPosition(actions: ActionType[]): boolean {
  const hasDirection = actions.some(isDirectionAction);
  if (!hasDirection) return true; // No direction, no problem
  return hasPositionAction(actions);
}

/**
 * Rule 5: Action count must be 2-10
 */
function validActionCount(actions: ActionType[]): boolean {
  return actions.length >= 2 && actions.length <= 10;
}

/**
 * Rule 6: Atomicity - cannot be N × smaller pattern
 * Check if pattern can be split into N identical sub-patterns
 */
function isAtomic(actions: ActionType[]): boolean {
  const len = actions.length;
  // Check all possible divisors
  for (let subLen = 1; subLen < len; subLen++) {
    if (len % subLen !== 0) continue;
    const repeatCount = len / subLen;
    if (repeatCount < 2) continue;
    
    const subPattern = actions.slice(0, subLen);
    let isRepetition = true;
    
    for (let i = 0; i < repeatCount; i++) {
      for (let j = 0; j < subLen; j++) {
        if (actions[i * subLen + j] !== subPattern[j]) {
          isRepetition = false;
          break;
        }
      }
      if (!isRepetition) break;
    }
    
    if (isRepetition) {
      // Additional check: sub-pattern must also be valid (have both P and I)
      if (hasPositionAction(subPattern) && hasInteractionAction(subPattern)) {
        return false; // Pattern = N × valid_subpattern → NOT atomic
      }
    }
  }
  return true;
}

/**
 * Rule 8: Anti-oscillation - no 2× consecutive same-direction turns
 */
function noOscillation(actions: ActionType[]): boolean {
  for (let i = 0; i < actions.length - 1; i++) {
    if (actions[i] === 'turnLeft' && actions[i + 1] === 'turnLeft') return false;
    if (actions[i] === 'turnRight' && actions[i + 1] === 'turnRight') return false;
  }
  return true;
}

/**
 * Check ALL rules
 */
function isValidPattern(actions: ActionType[]): boolean {
  if (!validActionCount(actions)) return false;      // Rule 5
  if (!hasPositionAction(actions)) return false;     // Rule 1
  if (!hasInteractionAction(actions)) return false;  // Rule 2
  if (!directionHasPosition(actions)) return false;  // Rule 3
  if (!noOscillation(actions)) return false;         // Rule 8
  if (!isAtomic(actions)) return false;              // Rule 6
  
  return true;
}

// =============================================================================
// PATTERN GENERATION (Combinatorics)
// =============================================================================

/**
 * Generate all permutations of given length from action set
 * Using iterative approach to avoid stack overflow
 */
function* generatePermutations(actions: ActionType[], length: number): Generator<ActionType[]> {
  if (length === 0) {
    yield [];
    return;
  }
  
  // Use indices to build permutations
  const indices = new Array(length).fill(0);
  const numActions = actions.length;
  
  while (true) {
    yield indices.map(i => actions[i]);
    
    // Increment indices (like counting in base numActions)
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
function generateValidPatterns(length: number, actionSet: ActionType[]): ActionType[][] {
  const valid: ActionType[][] = [];
  
  const iterator = generatePermutations(actionSet, length);
  let result = iterator.next();
  while (!result.done) {
    const perm = result.value;
    if (isValidPattern(perm)) {
      valid.push([...perm]);
    }
    result = iterator.next();
  }
  
  return valid;
}

// =============================================================================
// PATTERN METADATA
// =============================================================================

interface PatternMeta {
  id: string;
  actions: ActionType[];
  actionCount: number;
  complexity: 1 | 2 | 3 | 4 | 5;
  interactionType: 'crystal' | 'switch' | 'mixed';
  movementStyle: 'straight' | 'turn' | 'jump' | 'mixed';
}

function getPatternMeta(actions: ActionType[]): PatternMeta {
  const id = actions.map(a => ACTION_SHORT[a]).join('_');
  
  const hasC = actions.includes('collectItem');
  const hasT = actions.includes('toggleSwitch');
  const hasTurn = actions.some(isDirectionAction);
  const hasJump = actions.some(a => ['jump', 'jumpUp', 'jumpDown'].includes(a));
  const hasMove = actions.includes('moveForward');
  
  let interactionType: 'crystal' | 'switch' | 'mixed';
  if (hasC && hasT) interactionType = 'mixed';
  else if (hasT) interactionType = 'switch';
  else interactionType = 'crystal';
  
  let movementStyle: 'straight' | 'turn' | 'jump' | 'mixed';
  if (hasTurn && hasJump) movementStyle = 'mixed';
  else if (hasTurn) movementStyle = 'turn';
  else if (hasJump) movementStyle = 'jump';
  else movementStyle = 'straight';
  
  let complexity: 1 | 2 | 3 | 4 | 5;
  if (actions.length <= 2) complexity = 1;
  else if (actions.length <= 3) complexity = 2;
  else if (actions.length <= 5) complexity = 3;
  else if (actions.length <= 7) complexity = 4;
  else complexity = 5;
  
  return {
    id,
    actions,
    actionCount: actions.length,
    complexity,
    interactionType,
    movementStyle,
  };
}

// =============================================================================
// MAIN GENERATION
// =============================================================================

function main() {
  console.log('=== Micro-Pattern Generator ===\n');
  
  // For simplicity, start with core actions only (no jumpUp/jumpDown for complexity)
  const CORE_ACTIONS: ActionType[] = [
    'moveForward', 'jump',
    'turnLeft', 'turnRight',
    'collectItem', 'toggleSwitch'
  ];
  
  const allPatterns: PatternMeta[] = [];
  
  // Generate patterns from length 2 to 6 (longer patterns explode combinatorially)
  for (let len = 2; len <= 6; len++) {
    console.log(`Generating length ${len}...`);
    const patterns = generateValidPatterns(len, CORE_ACTIONS);
    console.log(`  Found ${patterns.length} valid patterns`);
    
    for (const p of patterns) {
      allPatterns.push(getPatternMeta(p));
    }
  }
  
  console.log(`\n=== TOTAL: ${allPatterns.length} patterns ===\n`);
  
  // Statistics
  const byLength: Record<number, number> = {};
  const byInteraction: Record<string, number> = { crystal: 0, switch: 0, mixed: 0 };
  const byMovement: Record<string, number> = { straight: 0, turn: 0, jump: 0, mixed: 0 };
  
  for (const p of allPatterns) {
    byLength[p.actionCount] = (byLength[p.actionCount] || 0) + 1;
    byInteraction[p.interactionType]++;
    byMovement[p.movementStyle]++;
  }
  
  console.log('By Length:', byLength);
  console.log('By Interaction:', byInteraction);
  console.log('By Movement:', byMovement);
  
  // Output sample
  console.log('\n=== Sample patterns (first 20) ===');
  for (const p of allPatterns.slice(0, 20)) {
    console.log(`  ${p.id}: ${p.actions.join(' → ')}`);
  }
  
  // Generate TypeScript code
  console.log('\n=== Generating TypeScript... ===');
  generateTypeScriptFile(allPatterns);
}

function generateTypeScriptFile(patterns: PatternMeta[]) {
  // This would write to micro-patterns.ts
  // For now, just output the count
  console.log(`Would generate ${patterns.length} patterns to micro-patterns.ts`);
}

main();
