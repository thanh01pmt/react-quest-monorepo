/**
 * ExerciseToQuestMapper
 * 
 * Converts GeneratedExercise from PracticeGenerator to Quest format
 * using the SolutionDrivenGenerator from academic-map-generator.
 * 
 * Flow:
 * 1. Select template code based on concept
 * 2. Auto-resolve parameters based on difficulty
 * 3. Generate map with generateFromCode()
 * 4. Convert SolutionDrivenResult to Quest format
 */

import { generateFromCode, type SolutionDrivenResult } from '@repo/academic-map-generator';
import type { Quest } from '@repo/quest-player';
import { templateRegistry, BUNDLED_TEMPLATES, prepareTemplateCode, type GeneratedExercise, type DifficultyLevel } from '@repo/shared-templates';

// Template code presets for each concept - FALLBACK only
// NOTE: These should match the pattern in shared-templates:
// - _MIN_X_, _MAX_X_ for slider params (replaced by DIFFICULTY_PARAMS)
// - VARIABLE_NAME for computed values (no underscores around)
const CONCEPT_TEMPLATES: Record<string, { code: string; concept: string }> = {
  // Sequential - straight line
  sequential: {
    concept: 'sequential',
    code: `moveForward();
collectItem();
moveForward();
collectItem();
moveForward();
collectItem();
moveForward();
`,
  },
  
  // Loop - For loop with crystals
  repeat_n: {
    concept: 'repeat_n',
    code: `moveForward();
for (let i = 0; i < CRYSTAL_NUM; i++) {
  collectItem();
  moveForward();
}
`,
  },
  
  // Loop with turns
  repeat_until: {
    concept: 'repeat_n',
    code: `moveForward();
for (let i = 0; i < SEGMENT1; i++) {
  collectItem();
  moveForward();
}
turnRight();
for (let i = 0; i < SEGMENT2; i++) {
  collectItem();
  moveForward();
}
`,
  },
  
  // Nested loops
  nested_loop: {
    concept: 'nested_loop',
    code: `moveForward();
for (let col = 0; col < COLS; col++) {
  collectItem();
  moveForward();
}
for (let row = 1; row < ROWS; row++) {
  turnRight();
  moveForward();
  turnRight();
  for (let col = 0; col < COLS; col++) {
    collectItem();
    moveForward();
  }
}
`,
  },
  
  // Conditional
  if_simple: {
    concept: 'sequential',
    code: `moveForward();
for (let i = 0; i < PATH_LENGTH; i++) {
  collectItem();
  moveForward();
}
`,
  },
  
  if_else: {
    concept: 'if_else',
    code: `// Fallback If-Else
moveForward();
for (let i = 0; i < PATH_LENGTH; i++) {
  // Deterministic alternating pattern to ensure safe map generation
  // (Avoids isOnCrystal() which may not be supported in generator context)
  // Deterministic pattern: Turn every step
  collectItem();
  turnRight();
  turnLeft();
  moveForward();
}
`,
  },
  
  // Function/Procedure
  procedure_simple: {
    concept: 'procedure_simple',
    code: `// Fallback Procedure
function doAction() {
  collectItem();
  moveForward();
  moveForward(); // Spacing
}

moveForward();
for (let c = 0; c < CALLS; c++) {
  doAction();
}
moveForward();
`,
  },
};

// Default template for unknown concepts
const DEFAULT_TEMPLATE = CONCEPT_TEMPLATES.sequential;

// Parameter ranges based on difficulty
// Values are [min, max] tuples for variety
type ParamRange = number | [number, number]; // Single value or [min, max] range
const DIFFICULTY_PARAMS: Record<DifficultyLevel, Record<string, ParamRange>> = {
  very_easy: {
    CRYSTAL_NUM: [2, 3],
    SEGMENT1: [2, 3],
    SEGMENT2: [1, 2],
    COLS: [2, 2],
    ROWS: [2, 2],
    PATH_LENGTH: [2, 3],
    PER_CALL: [1, 2],
    CALLS: [2, 2],
    STEPS: [2, 3],
    SIDE: [2, 2],
  },
  easy: {
    CRYSTAL_NUM: [3, 4],
    SEGMENT1: [3, 4],
    SEGMENT2: [2, 3],
    COLS: [2, 3],
    ROWS: [2, 2],
    PATH_LENGTH: [3, 5],
    PER_CALL: [2, 3],
    CALLS: [2, 3],
    STEPS: [3, 4],
    SIDE: [2, 3],
  },
  medium: {
    CRYSTAL_NUM: [4, 5],
    SEGMENT1: [4, 5],
    SEGMENT2: [3, 4],
    COLS: [3, 4],
    ROWS: [2, 3],
    PATH_LENGTH: [4, 6],
    PER_CALL: [2, 3],
    CALLS: [3, 4],
    STEPS: [4, 5],
    SIDE: [3, 4],
  },
  hard: {
    CRYSTAL_NUM: [5, 6],
    SEGMENT1: [5, 6],
    SEGMENT2: [4, 5],
    COLS: [4, 5],
    ROWS: [3, 4],
    PATH_LENGTH: [5, 7],
    PER_CALL: [3, 4],
    CALLS: [3, 4],
    STEPS: [5, 6],
    SIDE: [4, 5],
  },
  very_hard: {
    CRYSTAL_NUM: [6, 8],
    SEGMENT1: [6, 7],
    SEGMENT2: [5, 6],
    COLS: [5, 6],
    ROWS: [3, 4],
    PATH_LENGTH: [6, 8],
    PER_CALL: [3, 4],
    CALLS: [4, 5],
    STEPS: [6, 7],
    SIDE: [5, 6],
  },
};

// Map difficulty number (1-10) to DifficultyLevel
function getDifficultyLevel(difficulty: number): DifficultyLevel {
  if (difficulty <= 2) return 'very_easy';
  if (difficulty <= 4) return 'easy';
  if (difficulty <= 6) return 'medium';
  if (difficulty <= 8) return 'hard';
  return 'very_hard';
}

// Resolve template parameters based on difficulty (picks random from ranges)
function resolveTemplateCode(templateCode: string, difficulty: number): string {
  const level = getDifficultyLevel(difficulty);
  const params = DIFFICULTY_PARAMS[level];
  
  let code = templateCode;
  for (const [param, range] of Object.entries(params)) {
    // Pick random value from range, or use fixed value
    const value = Array.isArray(range) 
      ? Math.floor(Math.random() * (range[1] - range[0] + 1)) + range[0]
      : range;
    const pattern = new RegExp(param.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
    code = code.replace(pattern, String(value));
  }
  
  return code;
}

// Helper to create coordinate key for comparison
function coordKey(x: number, y: number, z: number): string {
  return `${x},${y},${z}`;
}

/**
 * Validate generated map result for position collisions
 * Returns invalid if items overlap with start/finish (maintains academic integrity)
 */
function validateMapResult(result: SolutionDrivenResult): { valid: boolean; reason?: string } {
  const gameConfig = result.gameConfig.gameConfig;
  const trace = result.trace;
  
  // Helper to extract coordinates from various position formats
  const getCoords = (pos: any): [number, number, number] => {
    if (Array.isArray(pos)) {
      return [pos[0] ?? 0, pos[1] ?? 1, pos[2] ?? 0];
    }
    return [pos?.x ?? 0, pos?.y ?? 1, pos?.z ?? 0];
  };
  
  // Get start and finish positions
  const startPos = gameConfig.players?.[0]?.start || { x: 0, y: 1, z: 0 };
  const finishPos = gameConfig.finish || trace.endPosition;
  
  const [sx, sy, sz] = getCoords(startPos);
  const [fx, fy, fz] = getCoords(finishPos);
  
  const startKey = coordKey(sx, sy, sz);
  const finishKey = coordKey(fx, fy, fz);
  
  // Rule 1: Start and Finish must not overlap
  if (startKey === finishKey) {
    return { valid: false, reason: 'Start and Finish positions overlap' };
  }
  
  // Check items for collisions
  const collectibles = gameConfig.collectibles || [];
  const itemPositions = new Set<string>();
  
  for (const item of collectibles) {
    const pos = item.position || item;
    const [ix, iy, iz] = getCoords(pos);
    const key = coordKey(ix, iy, iz);
    
    // Rule 2: Items must not be at start position
    if (key === startKey) {
      return { valid: false, reason: `Item at start position: ${key}` };
    }
    
    // Rule 3: Items must not be at finish position
    if (key === finishKey) {
      return { valid: false, reason: `Item at finish position: ${key}` };
    }
    
    // Rule 4: Items must not overlap with each other
    if (itemPositions.has(key)) {
      return { valid: false, reason: `Duplicate item position: ${key}` };
    }
    
    itemPositions.add(key);
  }
  
  return { valid: true };
}

// Blockly toolbox with proper i18n keys
const PRACTICE_TOOLBOX = {
  kind: 'categoryToolbox' as const,
  contents: [
    {
      kind: 'category' as const,
      name: '%{BKY_GAMES_CATMOVEMENT}',
      categorystyle: 'movement_category',
      contents: [
        { kind: 'block' as const, type: 'maze_moveForward' },
        { kind: 'block' as const, type: 'maze_turn' },
        { kind: 'block' as const, type: 'maze_jump' },
      ],
    },
    {
      kind: 'category' as const,
      name: '%{BKY_GAMES_CATACTIONS}',
      categorystyle: 'actions_category',
      contents: [
        { kind: 'block' as const, type: 'maze_collect' },
        { kind: 'block' as const, type: 'maze_toggle_switch' },
      ],
    },
    {
      kind: 'category' as const,
      name: '%{BKY_GAMES_CATLOOPS}',
      categorystyle: 'loops_category',
      contents: [
        {
          kind: 'block' as const,
          type: 'maze_repeat',
          inputs: {
            TIMES: {
              shadow: {
                type: 'math_number',
                fields: { NUM: 4 },
              },
            },
          },
        },
      ],
    },
    { kind: 'sep' as const },
    {
      kind: 'category' as const,
      name: '%{BKY_GAMES_CATPROCEDURES}',
      custom: 'PROCEDURE' as const,
      categorystyle: 'procedure_category',
    },
  ],
};

// Debug: Log available templates on module load
console.log('[ExerciseToQuestMapper] BUNDLED_TEMPLATES loaded:', BUNDLED_TEMPLATES.length, 'templates');
console.log('[ExerciseToQuestMapper] Template IDs:', BUNDLED_TEMPLATES.map(t => t.metadata.id).join(', '));

/**
 * Convert GeneratedExercise to Quest format using SolutionDrivenGenerator
 */
export function exerciseToQuest(exercise: GeneratedExercise, index: number): Quest {
  console.log(`[ExerciseToQuest] ===== Processing exercise ${index} =====`);
  console.log(`[ExerciseToQuest] templateId: "${exercise.templateId}"`);
  console.log(`[ExerciseToQuest] concept: "${exercise.concept}"`);
  console.log(`[ExerciseToQuest] parameters:`, exercise.parameters);

  // 1. Try to find actual template in registry or bundled fallback
  let registryTemplate = templateRegistry.get(exercise.templateId);
  
  // ROBUST FAILSAFE: If registry is empty/missed (race condition), check BUNDLED_TEMPLATES directly
  if (!registryTemplate) {
      console.log(`[ExerciseToQuest] Registry lookup failed. Searching BUNDLED_TEMPLATES for: "${exercise.templateId}"`);
      registryTemplate = BUNDLED_TEMPLATES.find(t => t.metadata.id === exercise.templateId);
      if (registryTemplate) {
          console.log(`[ExerciseToQuest] ✓ Found in BUNDLED_TEMPLATES:`, exercise.templateId);
      } else {
          console.warn(`[ExerciseToQuest] ✗ NOT FOUND in BUNDLED_TEMPLATES. Available IDs:`, 
            BUNDLED_TEMPLATES.slice(0, 5).map(t => t.metadata.id), '...');
      }
  }

  console.log(`[ExerciseToQuest] Template lookup result:`, registryTemplate ? 'FOUND' : 'NOT FOUND');
  
  let resolvedCode = '';

  if (registryTemplate) {
    // Case A: Smart Template (Loaded from registry/bundle)
    console.log(`[ExerciseToQuest] Using TEMPLATE. solutionCode length:`, registryTemplate.solutionCode.length);
    resolvedCode = prepareTemplateCode(registryTemplate.solutionCode, exercise.parameters);
  } else {
    // Case B: Legacy/Fallback (using concept presets)
    console.warn(`[ExerciseToQuest] Template NOT found. Using FALLBACK concept: "${exercise.concept}"`);
    const preset = CONCEPT_TEMPLATES[exercise.concept] || DEFAULT_TEMPLATE;
    console.log(`[ExerciseToQuest] Fallback preset code:\n`, preset.code);
    resolvedCode = resolveTemplateCode(preset.code, exercise.difficulty);
    console.log(`[ExerciseToQuest] Resolved fallback code:\n`, resolvedCode);
  }
  
  // 3. Generate map using generateFromCode
  let result: SolutionDrivenResult | null = null;
  const MAX_RETRIES = 5; // Aggressive retry count to avoid fallback

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
      let candidateCode = '';
      
      try {
        // Create modified parameters with range-aware variation
        // Each attempt tries different values within allowed [min, max] range
        const attemptParams: Record<string, number | boolean | string> = {};
        
        for (const [key, value] of Object.entries(exercise.parameters)) {
          if (typeof value === 'number') {
            // Find the template parameter definition to get min/max
            const paramDef = registryTemplate?.parameters.find(p => p.name === key);
            const min = paramDef?.min ?? (value - 2);
            const max = paramDef?.max ?? (value + 3);
            const rangeSize = max - min + 1;
            
            // Generate alternative value based on attempt number
            // Pattern: initial → max → (other values cycling)
            let newValue: number;
            if (attempt === 1) {
              newValue = value; // First attempt uses original value
            } else if (attempt === 2) {
              newValue = max; // Second attempt tries max
            } else {
              // Subsequent attempts: cycle through range from initial towards min, then wrap
              const offset = (attempt - 2) % rangeSize;
              newValue = min + ((value - min - offset + rangeSize) % rangeSize);
            }
            
            // Clamp to valid range
            attemptParams[key] = Math.max(min, Math.min(max, newValue));
          } else {
            attemptParams[key] = value;
          }
        }

        // Re-resolve code with attempt-specific parameters
        if (registryTemplate) {
           resolvedCode = prepareTemplateCode(registryTemplate.solutionCode, attemptParams);
        } else {
           // Preset logic
        }
        
        let attemptCode = resolvedCode;
        if (!registryTemplate) {
            attemptCode = prepareTemplateCode(resolvedCode, {});
        }

        console.log(`[ExerciseToQuest] Generation Attempt ${attempt}/${MAX_RETRIES} with params:`, attemptParams);
        
        candidateCode = attemptCode;
        
        result = generateFromCode(candidateCode, {
          concept: exercise.concept as any,
          gradeLevel: '3-5',
        });
  
        // Basic validation: Must have items and actions
        if (result.trace.items.length === 0 && result.trace.actions.length < 5) {
           console.warn("[ExerciseToQuest] Generated map is trivial/empty. Code:", candidateCode);
           throw new Error("Generated map is too empty/trivial");
        }
        
        // Position validation - reject if items at start/finish
        const validation = validateMapResult(result);
        if (!validation.valid) {
           console.warn("[ExerciseToQuest] Map validation failed:", validation.reason);
           throw new Error(`Position collision: ${validation.reason}`);
        }
  
        console.log(`[ExerciseToQuest] Generation SUCCESS at attempt ${attempt}. Trace:`, {
            pathLength: result.trace.pathCoords.length,
            items: result.trace.items.length,
        });
        
        break; // Success!
      } catch (err) {
        console.warn(`[ExerciseToQuest] Attempt ${attempt}/${MAX_RETRIES} failed for Template: ${exercise.templateId}`);
        console.warn(`[ExerciseToQuest] Reason: ${(err as any).message}`);
        
        if (attempt === MAX_RETRIES) {
          console.error('[ExerciseToQuest] ALL RETRIES FAILED.');
          console.error(`[ExerciseToQuest] Context - Template: ${exercise.templateId}, Concept: ${exercise.concept}, Diff: ${exercise.difficulty}`);
          console.error('[ExerciseToQuest] FINAL FAILED CODE:', candidateCode || resolvedCode);
          console.error('[ExerciseToQuest] Stack Trace:', err);
        }
      }
  }

  // Final Fallback if all retries failed
  if (!result) {
    console.error('[ExerciseToQuest] CRITICAL FAILURE: Initiating Ultimate Fallback (Default Sequential).');
    console.error(`[ExerciseToQuest] This indicates that template "${exercise.templateId}" is chemically unstable or invalid.`);
    console.warn(`[ExerciseToQuest] Failed Concept: ${exercise.concept}, Difficulty: ${exercise.difficulty}`);
    
    result = generateFromCode(`moveForward();collectItem();moveForward();`, {
      concept: 'sequential',
      gradeLevel: '3-5',
    });
  }
  
  // 4. Extract gameConfig from result
  const gameConfig = result.gameConfig.gameConfig;
  const solution = result.solution;
  const trace = result.trace;
  
  // Extract template metadata for dynamic toolbox selection (sync with Builder)
  const templateMeta = registryTemplate ? {
    tags: registryTemplate.metadata.tags || [],
    concepts: registryTemplate.metadata.concepts || [],
    category: registryTemplate.metadata.category,
  } : undefined;

  // FAILSAFE: Ensure finish position has a ground block
  // (Fixes issue where finish marker floats in air if trace.endPosition isn't in pathCoords)
  const finishPos = gameConfig.finish || { x: 5, y: 1, z: 0 };
  const hasFinishBlock = gameConfig.blocks.some((b: any) => 
    (b.position?.x ?? b.x) === finishPos.x && 
    (b.position?.y ?? b.y) === finishPos.y - 1 && 
    (b.position?.z ?? b.z) === finishPos.z
  );
  
  if (!hasFinishBlock && gameConfig.blocks) {
    console.warn(`⚠️ Missing ground block for finish at [${finishPos.x}, ${finishPos.y}, ${finishPos.z}]. Adding failsafe block.`);
    gameConfig.blocks.push({
      modelKey: 'ground.earthChecker',
      position: { x: finishPos.x, y: finishPos.y - 1, z: finishPos.z }
    });
  }
  
  // 5. Build Quest object
  const title = exercise.hints[0] || `Bài tập ${index + 1}`;
  
  // Calculate maxBlocks based on solution with buffer (1.5x optimal, min 10, max 50)
  const optimalBlockCount = solution.optimalBlocks || 10;
  const calculatedMaxBlocks = Math.min(50, Math.max(10, Math.ceil(optimalBlockCount * 1.5)));
  
  return {
    id: exercise.id,
    gameType: 'maze',
    level: index + 1,
    titleKey: `practice_${exercise.id}`,
    questTitleKey: `practice_${exercise.id}`,
    title,
    descriptionKey: `practice_${exercise.id}_desc`,
    supportedEditors: ['blockly'],
    translations: {
      en: {
        [`practice_${exercise.id}`]: `Exercise ${index + 1}: ${exercise.concept}`,
        [`practice_${exercise.id}_desc`]: exercise.hints[0] || 'Complete the maze',
      },
      vi: {
        [`practice_${exercise.id}`]: `Bài ${index + 1}: ${exercise.concept}`,
        [`practice_${exercise.id}_desc`]: exercise.hints[0] || 'Hoàn thành mê cung',
      },
    },
    blocklyConfig: {
      toolbox: PRACTICE_TOOLBOX,
      maxBlocks: calculatedMaxBlocks,
      startBlocks: '<xml><block type="maze_start" deletable="false" movable="false"></block></xml>',
    },
    gameConfig: {
      type: 'maze',
      renderer: '3d',
      blocks: gameConfig.blocks || [],
      collectibles: gameConfig.collectibles || [],
      player: gameConfig.players?.[0] || {
        id: 'player1',
        start: { x: 0, y: 1, z: 0, direction: 0 },
      },
      finish: gameConfig.finish || { x: 5, y: 1, z: 0 },
      // Add movementSequence for path visualization (sync with Builder)
      movementSequence: trace.movementSequence || [],
    } as Quest['gameConfig'],
    solution: {
      type: 'reach_target',
      itemGoals: { crystal: gameConfig.collectibles?.length || 0 },
      optimalBlocks: solution.optimalBlocks || 10,
      rawActions: solution.rawActions || [],
      structuredSolution: solution.structuredSolution,
    } as Quest['solution'],
    // Include template metadata for dynamic toolbox selection (sync with Builder)
    templateMeta,
  };
}

/**
 * Create a demo quest for testing
 */
export function createDemoQuest(): Quest {
  const demoExercise: GeneratedExercise = {
    id: 'demo-quest',
    templateId: 'simple-for-loop',
    concept: 'repeat_n',
    difficulty: 3,
    parameters: {},
    mapData: null,
    hints: ['Thu thập tất cả pha lê và đến đích!'],
  };
  return exerciseToQuest(demoExercise, 0);
}
