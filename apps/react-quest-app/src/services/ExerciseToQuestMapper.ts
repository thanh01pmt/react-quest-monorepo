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
import { templateRegistry, applyParameters, type GeneratedExercise, type DifficultyLevel } from '@repo/shared-templates';

// Template code presets for each concept (same as map-builder presets)
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
for (let i = 0; i < _CRYSTAL_NUM_; i++) {
  collectItem();
  moveForward();
}
`,
  },
  
  // Loop with turns
  repeat_until: {
    concept: 'repeat_n',
    code: `moveForward();
for (let i = 0; i < _SEGMENT1_; i++) {
  collectItem();
  moveForward();
}
turnRight();
for (let i = 0; i < _SEGMENT2_; i++) {
  collectItem();
  moveForward();
}
`,
  },
  
  // Nested loops
  nested_loop: {
    concept: 'nested_loop',
    code: `moveForward();
for (let col = 0; col < _COLS_; col++) {
  collectItem();
  moveForward();
}
for (let row = 1; row < _ROWS_; row++) {
  turnRight();
  moveForward();
  turnRight();
  for (let col = 0; col < _COLS_; col++) {
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
for (let i = 0; i < _PATH_LENGTH_; i++) {
  collectItem();
  moveForward();
}
`,
  },
  
  if_else: {
    concept: 'sequential',
    code: `moveForward();
for (let i = 0; i < _SEGMENT1_; i++) {
  collectItem();
  moveForward();
}
turnRight();
for (let i = 0; i < _SEGMENT2_; i++) {
  collectItem();
  moveForward();
}
`,
  },
  
  // Function/Procedure
  procedure_simple: {
    concept: 'procedure_simple',
    code: `function collectItems() {
  for (let i = 0; i < _PER_CALL_; i++) {
    collectItem();
    moveForward();
  }
}

moveForward();
for (let c = 0; c < _CALLS_; c++) {
  collectItems();
  turnRight();
}
moveForward();
`,
  },
};

// Default template for unknown concepts
const DEFAULT_TEMPLATE = CONCEPT_TEMPLATES.sequential;

// Parameter ranges based on difficulty
const DIFFICULTY_PARAMS: Record<DifficultyLevel, Record<string, number>> = {
  very_easy: {
    _CRYSTAL_NUM_: 2,
    _SEGMENT1_: 2,
    _SEGMENT2_: 2,
    _COLS_: 2,
    _ROWS_: 2,
    _PATH_LENGTH_: 3,
    _PER_CALL_: 1,
    _CALLS_: 2,
    _STEPS_: 2,
    _SIDE_: 2,
  },
  easy: {
    _CRYSTAL_NUM_: 3,
    _SEGMENT1_: 3,
    _SEGMENT2_: 2,
    _COLS_: 3,
    _ROWS_: 2,
    _PATH_LENGTH_: 4,
    _PER_CALL_: 2,
    _CALLS_: 2,
    _STEPS_: 3,
    _SIDE_: 2,
  },
  medium: {
    _CRYSTAL_NUM_: 4,
    _SEGMENT1_: 4,
    _SEGMENT2_: 3,
    _COLS_: 4,
    _ROWS_: 2,
    _PATH_LENGTH_: 5,
    _PER_CALL_: 2,
    _CALLS_: 3,
    _STEPS_: 4,
    _SIDE_: 3,
  },
  hard: {
    _CRYSTAL_NUM_: 5,
    _SEGMENT1_: 5,
    _SEGMENT2_: 4,
    _COLS_: 5,
    _ROWS_: 3,
    _PATH_LENGTH_: 6,
    _PER_CALL_: 3,
    _CALLS_: 3,
    _STEPS_: 5,
    _SIDE_: 4,
  },
  very_hard: {
    _CRYSTAL_NUM_: 6,
    _SEGMENT1_: 6,
    _SEGMENT2_: 5,
    _COLS_: 6,
    _ROWS_: 3,
    _PATH_LENGTH_: 7,
    _PER_CALL_: 3,
    _CALLS_: 4,
    _STEPS_: 6,
    _SIDE_: 5,
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

// Resolve template parameters based on difficulty
function resolveTemplateCode(templateCode: string, difficulty: number): string {
  const level = getDifficultyLevel(difficulty);
  const params = DIFFICULTY_PARAMS[level];
  
  let code = templateCode;
  for (const [param, value] of Object.entries(params)) {
    const pattern = new RegExp(param.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'g');
    code = code.replace(pattern, String(value));
  }
  
  return code;
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

/**
 * Convert GeneratedExercise to Quest format using SolutionDrivenGenerator
 */
export function exerciseToQuest(exercise: GeneratedExercise, index: number): Quest {
  console.log(`[ExerciseToQuest] Processing exercise ${index}:`, exercise.templateId, exercise.parameters);

  // 1. Try to find actual template in registry
  const registryTemplate = templateRegistry.get(exercise.templateId);
  let resolvedCode = '';

  if (registryTemplate) {
    // Case A: Smart Template (Loaded from registry)
    console.log(`[ExerciseToQuest] Found registry template. Original solution:`, registryTemplate.solutionCode);
    resolvedCode = applyParameters(registryTemplate.solutionCode, exercise.parameters);
    console.log(`[ExerciseToQuest] Resolved code with params:`, resolvedCode);
  } else {
    // Case B: Legacy/Fallback (using concept presets)
    console.warn(`[ExerciseToQuest] Template ${exercise.templateId} not found. Using fallback concept:`, exercise.concept);
    const preset = CONCEPT_TEMPLATES[exercise.concept] || DEFAULT_TEMPLATE;
    resolvedCode = resolveTemplateCode(preset.code, exercise.difficulty);
  }
  
  // 3. Generate map using generateFromCode
  let result: SolutionDrivenResult;
  try {
    console.log(`[ExerciseToQuest] Generating map from code...`);
    result = generateFromCode(resolvedCode, {
      concept: exercise.concept as any,
      gradeLevel: '3-5',
    });
    console.log(`[ExerciseToQuest] Generation success. Trace:`, {
        pathLength: result.trace.pathCoords.length,
        items: result.trace.items.length,
        actions: result.trace.actions.length,
        blocks: result.gameConfig.gameConfig.blocks?.length
    });
  } catch (err) {
    console.error('[ExerciseToQuest] Failed to generate map from code:', resolvedCode);
    console.error('[ExerciseToQuest] Error details:', err);
    // Fallback to simple sequential
    result = generateFromCode(`moveForward();collectItem();moveForward();`, {
      concept: 'sequential',
      gradeLevel: '3-5',
    });
  }
  
  // 4. Extract gameConfig from result
  const gameConfig = result.gameConfig.gameConfig;
  const solution = result.solution;

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
      maxBlocks: 35,
      startBlocks: '<xml><block type="maze_start" deletable="false" movable="false"></block></xml>',
    },
    gameConfig: {
      type: 'maze',
      renderer: '3d',
      blocks: gameConfig.blocks || [],
      collectibles: gameConfig.collectibles || [],
      player: gameConfig.players?.[0] || {
        id: 'player1',
        start: { x: 0, y: 1, z: 0, direction: 1 },
      },
      finish: gameConfig.finish || { x: 5, y: 1, z: 0 },
    } as Quest['gameConfig'],
    solution: {
      type: 'reach_target',
      itemGoals: { crystal: gameConfig.collectibles?.length || 0 },
      optimalBlocks: solution.optimalBlocks || 10,
      rawActions: solution.rawActions || [],
      structuredSolution: solution.structuredSolution,
    } as Quest['solution'],
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
