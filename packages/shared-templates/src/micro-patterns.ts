/**
 * Micro-Pattern Generator Service
 * 
 * On-demand generation of valid micro-patterns with parameterized constraints.
 * Two modes: getAll() for testing, getRandom() for random selection.
 * 
 * =============================================================================
 * RULES FOR VALID MICRO-PATTERNS
 * =============================================================================
 * 1. Must have ≥1 position-changing action (moveForward, jump, jumpUp, jumpDown)
 * 2. Must have ≥1 interaction action (collectItem, toggleSwitch)
 * 3. Direction-only (turnLeft/Right) must pair with position action
 * 4. Action count: 2-10
 * 5. Order matters (affects map generation)
 * 6. Atomic: cannot be N × smaller_pattern
 * 7. Anti-oscillation: no 2× same-direction turns consecutive
 * 8. Max consecutive same position actions (configurable, default 4)
 * 9. Between any 2 interactions, must have ≥1 position-changing action
 *    (Each cell can only have 1 crystal OR 1 switch)
 */

// =============================================================================
// TYPES
// =============================================================================

export type PositionAction = 'moveForward' | 'jump' | 'jumpUp' | 'jumpDown';
export type DirectionAction = 'turnLeft' | 'turnRight';
export type InteractionAction = 'collectItem' | 'toggleSwitch' | 'pickUpKey';
export type ActionType = PositionAction | DirectionAction | InteractionAction;

export const POSITION_ACTIONS: PositionAction[] = ['moveForward', 'jump', 'jumpUp', 'jumpDown'];
export const DIRECTION_ACTIONS: DirectionAction[] = ['turnLeft', 'turnRight'];
export const INTERACTION_ACTIONS: InteractionAction[] = ['collectItem', 'toggleSwitch', 'pickUpKey'];

export const ACTION_SHORT: Record<ActionType, string> = {
  moveForward: 'M', jump: 'J', jumpUp: 'U', jumpDown: 'D',
  turnLeft: 'L', turnRight: 'R',
  collectItem: 'C', toggleSwitch: 'T', pickUpKey: 'K',
};

export interface MicroPattern {
  id: string;
  actions: ActionType[];
  actionCount: number;
  interactionType: 'crystal' | 'switch' | 'key' | 'mixed';
  movementStyle: 'straight' | 'turn' | 'jump' | 'mixed';
  /** Net direction change: 0 = same direction, 90 = right, -90 = left, 180 = u-turn */
  netTurn: 0 | 90 | -90 | 180;
  /** Can be used as inner pattern in nested loops (netTurn === 0) */
  nestedLoopCompatible: boolean;
  
  /** Number of turns in pattern */
  turnCount: number;
  /** Style of turn (if turnCount === 1) */
  turnStyle: 'turnLeft' | 'straight' | 'turnRight' | 'uTurn' | 'zTurn';
  /** Position of turn (if turnCount === 1) */
  turnPoint: 'start' | 'end' | 'mid' | 'null';
  
  /** Does the pattern contain jump actions? */
  hasJump: boolean;
  
  /** Does the pattern start with an interaction action? */
  startsWithItem: boolean;
  /** Does the pattern end with an interaction action? */
  endsWithItem: boolean;
}

export interface GeneratorOptions {
  /** Min pattern length (default: 2) */
  minLength?: number;
  /** Max pattern length (default: 5) */
  maxLength?: number;
  /** Which actions to use (default: all) */
  actions?: ActionType[];
  /** Filter by interaction type */
  interactionType?: 'crystal' | 'switch' | 'key' | 'mixed';
  /** Filter by movement style */
  movementStyle?: 'straight' | 'turn' | 'jump' | 'mixed';
  /** Include template-only actions (jumpUp/Down)? Default: false */
  includeTemplateActions?: boolean;
  /** Max consecutive same position actions (default: 4 -> 10) */
  maxConsecutivePosition?: number;
  /** Only return patterns compatible with nested loops (netTurn = 0) */
  nestedLoopCompatible?: boolean;
  /** Filter by specific net turn angle */
  netTurn?: 0 | 90 | -90 | 180;
  
  /** Filter by turn style (requires turnCount <= 1) */
  turnStyle?: 'turnLeft' | 'straight' | 'turnRight' | 'uTurn' | 'zTurn';
  /** Filter by turn point (requires turnCount <= 1) */
  turnPoint?: 'start' | 'end' | 'mid' | 'null';
  
  /** Filter by presence of jump actions */
  hasJump?: boolean;
  
  /** Exclude patterns with items at specific positions */
  noItemAt?: 'start' | 'end' | 'both';
  
  /** Seeded RNG for reproducibility */
  seed?: number;
  
  /** Require at least one interaction? Default: true */
  requireInteraction?: boolean;
}

// =============================================================================
// VALIDATION FUNCTIONS
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

function hasPositionAction(actions: ActionType[]): boolean {
  return actions.some(isPositionAction);
}

function hasInteractionAction(actions: ActionType[]): boolean {
  return actions.some(isInteractionAction);
}

function noConsecutiveTurns(actions: ActionType[]): boolean {
  for (let i = 0; i < actions.length - 1; i++) {
    if (isDirectionAction(actions[i]) && isDirectionAction(actions[i + 1])) {
        return false;
    }
  }
  return true;
}

function maxConsecutive(actions: ActionType[], maxCount: number): boolean {
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

function isAtomic(actions: ActionType[]): boolean {
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

function isValidPattern(actions: ActionType[], maxConsecutivePos: number, requireInteraction: boolean = true): boolean {
  if (actions.length < 2 || actions.length > 10) return false;
  if (!hasPositionAction(actions)) return false;
  if (requireInteraction && !hasInteractionAction(actions)) return false;
  if (!noConsecutiveTurns(actions)) return false;
  if (!turnsMustHaveMoves(actions)) return false; // Rule: turns must be separated by movement
  return true;
}

/** 
 * Rule: Between any two interaction actions, must have ≥1 position-changing action.
 * Reason: Each cell can only have 1 crystal OR 1 switch, not both.
 * Example: M → C → L → T is INVALID (C and T on same cell after M)
 * Example: M → C → M → T is VALID (C on cell X, T on cell Y)
 */
function positionBetweenInteractions(actions: ActionType[]): boolean {
  let needsPosition = false;
  
  for (const action of actions) {
    if (isInteractionAction(action)) {
      if (needsPosition) {
        // Previous was interaction, but no position-change happened
        return false;
      }
      needsPosition = true;  // Next interaction must have position-change before it
    } else if (isPositionAction(action)) {
      needsPosition = false;  // Reset - position changed
    }
    // Direction actions don't reset needsPosition
  }
  
  return true;
}


/**
 * Rule: Between any two turns, must have ≥1 position-changing action.
 * Reason: L-R (even with items in between) results in no geometric change.
 * Reason: L-L (even with items) results in u-turn on spot (reversing).
 * We want distinct geometric legs.
 */
function turnsMustHaveMoves(actions: ActionType[]): boolean {
    let lastWasTurn = false;
    
    // We strictly check: if we see a Turn, we must see a PositionAction before seeing another Turn.
    // We can iterate and track state.
    // State 1: No turn seen yet (or last turn "cleared" by move).
    // State 2: Turn seen, waiting for move.
    
    // Actually simpler: Find all indices of turns.
    // Check if between turn indices there is any position action.
    
    let lastTurnIndex = -1;
    
    for (let i = 0; i < actions.length; i++) {
        if (isDirectionAction(actions[i])) {
            if (lastTurnIndex !== -1) {
                // Check valid interval
                // actions[lastTurnIndex+1 ... i-1] must contain position
                let hasMove = false;
                for (let j = lastTurnIndex + 1; j < i; j++) {
                    if (isPositionAction(actions[j])) {
                        hasMove = true;
                        break;
                    }
                }
                if (!hasMove) return false;
            }
            lastTurnIndex = i;
        }
    }
    return true;
}

// =============================================================================
// PATTERN METADATA
// =============================================================================

/**
 * Calculate net direction change after pattern completes
 * Returns: 0 (no change), 90 (right), -90 (left), 180 (u-turn)
 */
function calculateNetTurn(actions: ActionType[]): 0 | 90 | -90 | 180 {
  let net = 0;
  for (const a of actions) {
    if (a === 'turnLeft') net -= 90;
    if (a === 'turnRight') net += 90;
  }
  // Normalize to -180 to 180 range
  net = ((net % 360) + 360) % 360;
  if (net > 180) net -= 360;
  return net === 180 ? 180 : net as 0 | 90 | -90;
}

function getPatternMeta(actions: ActionType[]): MicroPattern {
  const id = actions.map(a => ACTION_SHORT[a]).join('_');
  
  const hasC = actions.includes('collectItem');
  const hasT = actions.includes('toggleSwitch');
  const hasK = actions.includes('pickUpKey');
  const hasTurn = actions.some(isDirectionAction);
  const hasJump = actions.some(a => ['jump', 'jumpUp', 'jumpDown'].includes(a));
  
  // Determine interaction type
  let interactionType: 'crystal' | 'switch' | 'key' | 'mixed';
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
  
  const movementStyle: 'straight' | 'turn' | 'jump' | 'mixed' = 
    hasTurn && hasJump ? 'mixed' : hasTurn ? 'turn' : hasJump ? 'jump' : 'straight';
  
  const netTurn = calculateNetTurn(actions);
  const nestedLoopCompatible = netTurn === 0;
  
  // Calculate Turn Metadata
  const turnIndices = actions.map((a, i) => isDirectionAction(a) ? i : -1).filter(i => i !== -1);
  const turnCount = turnIndices.length;
  
  let turnStyle: 'turnLeft' | 'straight' | 'turnRight' | 'uTurn' | 'zTurn' = 'straight';
  let turnPoint: 'start' | 'end' | 'mid' | 'null' = 'null';
  
  if (turnCount === 1) {
    const idx = turnIndices[0];
    const action = actions[idx];
    turnStyle = action as 'turnLeft' | 'turnRight';
    
    if (idx === 0) turnPoint = 'start';
    else if (idx === actions.length - 1) turnPoint = 'end';
    else turnPoint = 'mid';
  } else if (turnCount === 0) {
    turnStyle = 'straight';
    turnPoint = 'null';
  } else {
    // Check for U-Turn and Z-Turn
    // Strict definition:
    // uTurn: Exact 2 turns, SAME direction (L,L or R,R) -> Net 180
    // zTurn: Exact 2 turns, OPPOSITE direction (L,R or R,L) -> Net 0
    
    // We get the actual turn actions
    const turns = actions.filter(isDirectionAction);
    
    if (turnCount === 2) {
        if (turns[0] === turns[1]) {
            turnStyle = 'uTurn';
            turnPoint = 'mid'; 
        } else {
            turnStyle = 'zTurn';
            turnPoint = 'mid';
        }
    } 
    // What about 3 turns? LLL -> R. LLR -> Straight. 
    // For now, only classifying 2-turn patterns as specific shapes.
    // Others remain 'straight' (default) but have turnCount > 1.
    // For patterns with > 1 turn, we don't assign simplified metadata (or assign a "complex" tag if we had one)
    // But for now, we just leave them compatible with basic fields, but filter logic will skip them if turnStyle is requested
     // We can assign defaults but indicate they are multi-turn
     // Actually, let's keep 'straight' and 'null' as defaults for multi-turn to avoid type errors, 
     // but the turnCount > 1 will be used to exclude them if filtering is active.
  }
  // startsWithItem: true if item is at the START position (ignoring initial turns)
  // endsWithItem: true if item is at the LAST position (ignoring trailing turns)
  let startsWithItem = false;
  for (let i = 0; i < actions.length; i++) {
    if (isInteractionAction(actions[i])) { startsWithItem = true; break; }
    if (isPositionAction(actions[i])) { startsWithItem = false; break; }
    // If direction, continue checking next
  }

  let endsWithItem = false;
  for (let i = actions.length - 1; i >= 0; i--) {
     if (isInteractionAction(actions[i])) { endsWithItem = true; break; }
     if (isPositionAction(actions[i])) { endsWithItem = false; break; }
     // If direction, continue checking prev
  }
  
  return { 
    id, actions, actionCount: actions.length, 
    interactionType, movementStyle,
    netTurn, nestedLoopCompatible,
    turnCount, turnStyle, turnPoint,
    hasJump,
    startsWithItem,
    endsWithItem
  };
}

// =============================================================================
// GENERATOR
// =============================================================================

/**
 * Generator iterator for permutations with replacement
 */
function* generatePermutations(actions: ActionType[], length: number): Generator<ActionType[]> {
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

/**
 * Simple seeded random number generator (Mulberry32)
 */
function createRng(seed: number): () => number {
  return function() {
    let t = seed += 0x6D2B79F5;
    t = Math.imul(t ^ t >>> 15, t | 1);
    t ^= t + Math.imul(t ^ t >>> 7, t | 61);
    return ((t ^ t >>> 14) >>> 0) / 4294967296;
  };
}

// =============================================================================
// PUBLIC API
// =============================================================================

/**
 * Get all valid patterns matching criteria
 * Use for testing/debugging only - can return large results!
 */
export function getAllPatterns(options: GeneratorOptions = {}): MicroPattern[] {
  const {
    minLength = 2,
    maxLength = 5,
    includeTemplateActions = false,
    maxConsecutivePosition = 4,
    interactionType,
    movementStyle,
    nestedLoopCompatible,
    netTurn,
    turnStyle,
    turnPoint,
    hasJump,
    noItemAt,
    requireInteraction = true,
  } = options;
  
  // Build action set
  let actionSet: ActionType[] = options.actions || [
    'moveForward', 'jump',
    'turnLeft', 'turnRight',
    'collectItem', 'toggleSwitch',
  ];
  
  if (includeTemplateActions && !options.actions) {
    actionSet = [...actionSet, 'jumpUp', 'jumpDown'];
  }
  
  const results: MicroPattern[] = [];
  
  for (let len = minLength; len <= maxLength; len++) {
    for (const perm of generatePermutations(actionSet, len)) {
      if (!isValidPattern(perm, maxConsecutivePosition, requireInteraction)) continue;
      
      const meta = getPatternMeta(perm);
      
      // Apply filters
      if (interactionType && meta.interactionType !== interactionType) continue;
      if (movementStyle && meta.movementStyle !== movementStyle) continue;
      if (nestedLoopCompatible !== undefined && meta.nestedLoopCompatible !== nestedLoopCompatible) continue;
      if (netTurn !== undefined && meta.netTurn !== netTurn) continue;
      
      // New Turn Filter Logic
      // If turnStyle or turnPoint is specified, we STRICTLY require turnCount <= 1
      // EXCEPTION: 'uTurn' and 'zTurn' styles allow turnCount > 1
      if (turnStyle || turnPoint) {
        if (turnStyle === 'uTurn') {
            if (meta.turnStyle !== 'uTurn') continue;
        } else if (turnStyle === 'zTurn') {
            if (meta.turnStyle !== 'zTurn') continue;
        } else {
            // Normal single-turn styles
            if (meta.turnCount > 1) continue; 
            
            if (turnStyle && meta.turnStyle !== turnStyle) continue;
            if (turnPoint && meta.turnPoint !== turnPoint) continue;
        }
      }

      if (hasJump !== undefined && meta.hasJump !== hasJump) continue;
      
      // noItemAt filter: exclude patterns with items at start/end
      if (noItemAt) {
        if (noItemAt === 'start' && meta.startsWithItem) continue;
        if (noItemAt === 'end' && meta.endsWithItem) continue;
        if (noItemAt === 'both' && (meta.startsWithItem || meta.endsWithItem)) continue;
      }
      
      results.push(meta);
    }
  }
  
  return results;
}

/**
 * Get a random valid pattern matching criteria
 * Efficient: uses reservoir sampling to avoid generating all patterns
 */
export function getRandomPattern(options: GeneratorOptions = {}): MicroPattern | null {
  const {
    minLength = 2,
    maxLength = 5,
    includeTemplateActions = false,
    maxConsecutivePosition = 4,
    interactionType,
    movementStyle,
    nestedLoopCompatible,
    netTurn,
    turnStyle,
    turnPoint,
    hasJump,
    noItemAt,
    seed = Date.now(),
    requireInteraction = true,
  } = options;
  
  // Build action set
  let actionSet: ActionType[] = options.actions || [
    'moveForward', 'jump',
    'turnLeft', 'turnRight',
    'collectItem', 'toggleSwitch',
  ];
  
  if (includeTemplateActions && !options.actions) {
    actionSet = [...actionSet, 'jumpUp', 'jumpDown'];
  }
  
  const rng = createRng(seed);
  let selected: MicroPattern | null = null;
  let count = 0;
  
  // Reservoir sampling with k=1
  for (let len = minLength; len <= maxLength; len++) {
    for (const perm of generatePermutations(actionSet, len)) {
      if (!isValidPattern(perm, maxConsecutivePosition, requireInteraction)) continue;
      
      const meta = getPatternMeta(perm);
      
      // Apply filters
      if (interactionType && meta.interactionType !== interactionType) continue;
      if (movementStyle && meta.movementStyle !== movementStyle) continue;
      if (nestedLoopCompatible !== undefined && meta.nestedLoopCompatible !== nestedLoopCompatible) continue;
      if (netTurn !== undefined && meta.netTurn !== netTurn) continue;
      
      if (turnStyle || turnPoint) {
        if (turnStyle === 'uTurn') {
            if (meta.turnStyle !== 'uTurn') continue;
        } else if (turnStyle === 'zTurn') {
            if (meta.turnStyle !== 'zTurn') continue;
        } else {
            if (meta.turnCount > 1) continue; 
            if (turnStyle && meta.turnStyle !== turnStyle) continue;
            if (turnPoint && meta.turnPoint !== turnPoint) continue;
        }
      }
      
      if (hasJump !== undefined && meta.hasJump !== hasJump) continue;
      
      // noItemAt filter
      if (noItemAt) {
        if (noItemAt === 'start' && meta.startsWithItem) continue;
        if (noItemAt === 'end' && meta.endsWithItem) continue;
        if (noItemAt === 'both' && (meta.startsWithItem || meta.endsWithItem)) continue;
      }
      
      count++;
      // Reservoir sampling: keep with probability 1/count
      if (rng() < 1 / count) {
        selected = meta;
      }
    }
  }
  
  return selected;
}

/**
 * Get multiple random patterns (non-repeating)
 */
export function getRandomPatterns(count: number, options: GeneratorOptions = {}): MicroPattern[] {
  const all = getAllPatterns(options);
  if (all.length <= count) return all;
  
  const rng = createRng(options.seed ?? Date.now());
  const result: MicroPattern[] = [];
  const used = new Set<string>();
  
  while (result.length < count && result.length < all.length) {
    const idx = Math.floor(rng() * all.length);
    const pattern = all[idx];
    if (!used.has(pattern.id)) {
      used.add(pattern.id);
      result.push(pattern);
    }
  }
  
  return result;
}

/**
 * Convert pattern to executable code string
 */
export function patternToCode(pattern: MicroPattern): string {
  return pattern.actions.map(a => `${a}();`).join('\n');
}

/**
 * Get pattern count for given criteria (without generating all)
 */
export function countPatterns(options: GeneratorOptions = {}): number {
  return getAllPatterns(options).length;
}
