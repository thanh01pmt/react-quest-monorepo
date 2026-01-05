/**
 * ExerciseToQuestMapper
 * 
 * Converts GeneratedExercise from PracticeGenerator to Quest format
 * that QuestPlayer can consume.
 */

import type { Quest } from '@repo/quest-player';
import type { GeneratedExercise } from '@repo/shared-templates';

// Define local types that mirror quest-player types
interface Position3D {
  x: number;
  y: number;
  z: number;
}

interface Block {
  modelKey: string;
  position: Position3D;
}

interface Collectible {
  id: string;
  type: 'crystal' | 'key';
  position: Position3D;
}

interface ToolboxBlock {
  kind: 'block';
  type: string;
  fields?: Record<string, unknown>;
}

interface ToolboxCategory {
  kind: 'category';
  name: string;
  colour?: string;
  contents?: Array<ToolboxBlock | ToolboxCategory>;
  custom?: 'PROCEDURE' | 'VARIABLE';
}

interface ToolboxJSON {
  kind: 'flyoutToolbox' | 'categoryToolbox';
  contents: Array<ToolboxBlock | ToolboxCategory>;
}

interface MazeConfig {
  type: 'maze';
  renderer?: '2d' | '3d';
  blocks?: Block[];
  collectibles?: Collectible[];
  player?: {
    id: string;
    start: { x: number; y: number; z?: number; direction: number };
  };
  finish: { x: number; y: number; z?: number };
  introScene?: {
    enabled: boolean;
    type: string;
  };
}

interface BlocklyConfig {
  toolbox: ToolboxJSON;
  maxBlocks?: number;
  startBlocks?: string;
}

interface SolutionConfig {
  type: string;
  itemGoals?: Record<string, number>;
  optimalBlocks?: number;
}

// Sample maze configurations for different concepts
type MazeData = {
  blocks: Block[];
  collectibles: Collectible[];
  player: { id: string; start: { x: number; y: number; z: number; direction: number } };
  finish: { x: number; y: number; z: number };
};

const SAMPLE_MAZES: Record<string, MazeData> = {
  // Simple straight path for sequential
  sequential_easy: {
    blocks: [
      { modelKey: 'grass', position: { x: 0, y: 0, z: 0 } },
      { modelKey: 'grass', position: { x: 1, y: 0, z: 0 } },
      { modelKey: 'grass', position: { x: 2, y: 0, z: 0 } },
      { modelKey: 'grass', position: { x: 3, y: 0, z: 0 } },
      { modelKey: 'grass', position: { x: 4, y: 0, z: 0 } },
    ],
    collectibles: [
      { id: 'crystal1', type: 'crystal', position: { x: 2, y: 1, z: 0 } },
    ],
    player: { id: 'player1', start: { x: 0, y: 1, z: 0, direction: 1 } },
    finish: { x: 4, y: 1, z: 0 },
  },
  
  // L-shape path for turning
  sequential_medium: {
    blocks: [
      { modelKey: 'grass', position: { x: 0, y: 0, z: 0 } },
      { modelKey: 'grass', position: { x: 1, y: 0, z: 0 } },
      { modelKey: 'grass', position: { x: 2, y: 0, z: 0 } },
      { modelKey: 'grass', position: { x: 2, y: 0, z: 1 } },
      { modelKey: 'grass', position: { x: 2, y: 0, z: 2 } },
    ],
    collectibles: [
      { id: 'crystal1', type: 'crystal', position: { x: 1, y: 1, z: 0 } },
      { id: 'crystal2', type: 'crystal', position: { x: 2, y: 1, z: 1 } },
    ],
    player: { id: 'player1', start: { x: 0, y: 1, z: 0, direction: 1 } },
    finish: { x: 2, y: 1, z: 2 },
  },
  
  // Staircase for loops
  loop_easy: {
    blocks: [
      { modelKey: 'grass', position: { x: 0, y: 0, z: 0 } },
      { modelKey: 'grass', position: { x: 1, y: 0, z: 0 } },
      { modelKey: 'grass', position: { x: 2, y: 1, z: 0 } },
      { modelKey: 'grass', position: { x: 3, y: 1, z: 0 } },
      { modelKey: 'grass', position: { x: 4, y: 2, z: 0 } },
    ],
    collectibles: [
      { id: 'crystal1', type: 'crystal', position: { x: 1, y: 1, z: 0 } },
      { id: 'crystal2', type: 'crystal', position: { x: 3, y: 2, z: 0 } },
    ],
    player: { id: 'player1', start: { x: 0, y: 1, z: 0, direction: 1 } },
    finish: { x: 4, y: 3, z: 0 },
  },
  
  // Zigzag path
  loop_medium: {
    blocks: [
      { modelKey: 'grass', position: { x: 0, y: 0, z: 0 } },
      { modelKey: 'grass', position: { x: 1, y: 0, z: 0 } },
      { modelKey: 'grass', position: { x: 1, y: 0, z: 1 } },
      { modelKey: 'grass', position: { x: 2, y: 0, z: 1 } },
      { modelKey: 'grass', position: { x: 2, y: 0, z: 2 } },
      { modelKey: 'grass', position: { x: 3, y: 0, z: 2 } },
    ],
    collectibles: [
      { id: 'crystal1', type: 'crystal', position: { x: 1, y: 1, z: 0 } },
      { id: 'crystal2', type: 'crystal', position: { x: 2, y: 1, z: 1 } },
      { id: 'crystal3', type: 'crystal', position: { x: 2, y: 1, z: 2 } },
    ],
    player: { id: 'player1', start: { x: 0, y: 1, z: 0, direction: 1 } },
    finish: { x: 3, y: 1, z: 2 },
  },
  
  // Conditional path with switch
  conditional_easy: {
    blocks: [
      { modelKey: 'grass', position: { x: 0, y: 0, z: 0 } },
      { modelKey: 'grass', position: { x: 1, y: 0, z: 0 } },
      { modelKey: 'grass', position: { x: 2, y: 0, z: 0 } },
      { modelKey: 'grass', position: { x: 3, y: 0, z: 0 } },
    ],
    collectibles: [
      { id: 'crystal1', type: 'crystal', position: { x: 2, y: 1, z: 0 } },
    ],
    player: { id: 'player1', start: { x: 0, y: 1, z: 0, direction: 1 } },
    finish: { x: 3, y: 1, z: 0 },
  },
  
  // Function/procedure practice
  function_easy: {
    blocks: [
      { modelKey: 'grass', position: { x: 0, y: 0, z: 0 } },
      { modelKey: 'grass', position: { x: 1, y: 0, z: 0 } },
      { modelKey: 'grass', position: { x: 2, y: 0, z: 0 } },
      { modelKey: 'grass', position: { x: 3, y: 0, z: 0 } },
      { modelKey: 'grass', position: { x: 4, y: 0, z: 0 } },
      { modelKey: 'grass', position: { x: 5, y: 0, z: 0 } },
    ],
    collectibles: [
      { id: 'crystal1', type: 'crystal', position: { x: 1, y: 1, z: 0 } },
      { id: 'crystal2', type: 'crystal', position: { x: 3, y: 1, z: 0 } },
      { id: 'crystal3', type: 'crystal', position: { x: 5, y: 1, z: 0 } },
    ],
    player: { id: 'player1', start: { x: 0, y: 1, z: 0, direction: 1 } },
    finish: { x: 5, y: 1, z: 0 },
  },
};

// Toolbox for practice mode
const PRACTICE_TOOLBOX: ToolboxJSON = {
  kind: 'categoryToolbox',
  contents: [
    {
      kind: 'category',
      name: 'Di chuyển',
      colour: '#5C81A6',
      contents: [
        { kind: 'block', type: 'maze_moveForward' },
        { kind: 'block', type: 'maze_turn', fields: { DIR: 'turnLeft' } },
        { kind: 'block', type: 'maze_turn', fields: { DIR: 'turnRight' } },
        { kind: 'block', type: 'maze_jump' },
      ],
    },
    {
      kind: 'category',
      name: 'Hành động',
      colour: '#A65C5C',
      contents: [
        { kind: 'block', type: 'maze_collect' },
      ],
    },
    {
      kind: 'category',
      name: 'Vòng lặp',
      colour: '#5CA65C',
      contents: [
        { kind: 'block', type: 'maze_repeat' },
        { kind: 'block', type: 'controls_repeat_ext' },
      ],
    },
    {
      kind: 'category',
      name: 'Hàm',
      colour: '#995BA5',
      custom: 'PROCEDURE',
    },
  ],
};

/**
 * Get sample maze configuration based on concept and difficulty
 */
function getMazeConfig(concept: string, difficulty: number): MazeData {
  // Map concept to category
  let category = 'sequential';
  if (concept.includes('loop') || concept.includes('repeat')) {
    category = 'loop';
  } else if (concept.includes('if') || concept.includes('conditional')) {
    category = 'conditional';
  } else if (concept.includes('function') || concept.includes('procedure')) {
    category = 'function';
  }
  
  // Map difficulty to easy/medium
  const level = difficulty <= 2 ? 'easy' : 'medium';
  const key = `${category}_${level}`;
  
  return SAMPLE_MAZES[key] || SAMPLE_MAZES.sequential_easy;
}

/**
 * Convert GeneratedExercise to Quest format
 */
export function exerciseToQuest(exercise: GeneratedExercise, index: number): Quest {
  const mazeData = getMazeConfig(exercise.concept, exercise.difficulty);
  
  const gameConfig: MazeConfig = {
    type: 'maze',
    renderer: '3d',
    blocks: mazeData.blocks,
    collectibles: mazeData.collectibles,
    player: mazeData.player,
    finish: mazeData.finish,
    introScene: {
      enabled: false,
      type: 'dronie',
    },
  };
  
  const blocklyConfig: BlocklyConfig = {
    toolbox: PRACTICE_TOOLBOX,
    maxBlocks: 20,
    startBlocks: '<xml><block type="maze_start" deletable="false" movable="false"></block></xml>',
  };
  
  const solution: SolutionConfig = {
    type: 'reach_target',
    itemGoals: { crystal: mazeData.collectibles?.length || 0 },
    optimalBlocks: Math.max(5, (mazeData.collectibles?.length || 0) + 3),
  };
  
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
    blocklyConfig,
    gameConfig: gameConfig as Quest['gameConfig'],
    solution: solution as Quest['solution'],
  };
}

/**
 * Create a demo quest for testing
 */
export function createDemoQuest(): Quest {
  const demoExercise: GeneratedExercise = {
    id: 'demo-quest',
    templateId: 'crystal-trail-basic',
    concept: 'sequential',
    difficulty: 1,
    parameters: {},
    mapData: null,
    hints: ['Di chuyển tới mục tiêu và thu thập tất cả pha lê!'],
  };
  return exerciseToQuest(demoExercise, 0);
}
