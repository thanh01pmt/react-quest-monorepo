/**
 * Shared Template Types
 * 
 * Type definitions for practice mode templates
 */

// ============================================================================
// LOCAL TYPE DEFINITIONS (to avoid circular dependencies during build)
// ============================================================================

/**
 * Concept categories - mirrors @repo/academic-map-generator
 */
export type ConceptCategory = 
  | 'sequential'
  | 'loop'
  | 'conditional'
  | 'function'
  | 'variable'
  | 'advanced';

/**
 * Academic concepts - common subset used in practice mode
 */
export type AcademicConcept = 
  | 'sequential'
  | 'repeat_n'
  | 'repeat_until'
  | 'while_condition'
  | 'for_each'
  | 'if_simple'
  | 'if_else'
  | 'if_elif_else'
  | 'nested_if'
  | 'procedure_simple'
  | 'procedure_with_param'
  | 'function_return'
  | 'counter'
  | 'accumulator'
  | 'pattern_recognition'
  | 'nested_loop'
  | 'loop_if_inside'
  | string; // Allow other concepts

// ============================================================================
// TEMPLATE METADATA
// ============================================================================

/**
 * Difficulty levels for practice mode
 */
export type DifficultyLevel = 
  | 'very_easy'   // 1-2
  | 'easy'        // 3-4
  | 'medium'      // 5-6
  | 'hard'        // 7-8
  | 'very_hard';  // 9-10

/**
 * Mapping từ difficulty level sang difficulty range
 */
export const DIFFICULTY_RANGES: Record<DifficultyLevel, [number, number]> = {
  very_easy: [1, 2],
  easy: [3, 4],
  medium: [5, 6],
  hard: [7, 8],
  very_hard: [9, 10],
};

/**
 * Template parameter definition
 */
export interface TemplateParameter {
  name: string;           // e.g., "_MIN_CRYSTAL_NUM_"
  displayName: string;    // e.g., "Min Crystal Count"
  type: 'number' | 'boolean' | 'string' | 'int';
  defaultValue?: number | boolean | string;
  min?: number;
  max?: number;
  step?: number;
  minRef?: string;
  maxRef?: string;
}

/**
 * Template frontmatter metadata (parsed from YAML)
 */
export interface TemplateMetadata {
  id: string;
  name: string;
  category: ConceptCategory;
  concepts: AcademicConcept[];
  difficulty: number;         // 1-10
  tags: string[];
  author: string;
  version: number;
  description?: string;
}

/**
 * Full template config (metadata + content)
 */
export interface TemplateConfig {
  metadata: TemplateMetadata;
  parameters: TemplateParameter[];
  solutionCode: string;
  descriptionMarkdown: string;
  rawContent: string;         // Original markdown
}

// ============================================================================
// PRACTICE SESSION TYPES
// ============================================================================

/**
 * Topic config for practice session
 */
export interface TopicConfig {
  category: ConceptCategory;
  enabled: boolean;
  questionCount: number;
  difficultyLevel: DifficultyLevel;
}

/**
 * Practice session configuration
 */
export interface PracticeConfig {
  topics: TopicConfig[];
  mode: 'custom' | 'challenge_me';
  seed?: number;              // For deterministic generation
}

/**
 * Generated exercise from template
 */
export interface GeneratedExercise {
  id: string;
  templateId: string;
  concept: AcademicConcept;
  difficulty: number;
  parameters: Record<string, number | boolean | string>;
  mapData: unknown;           // Generated map JSON
  expectedSolution?: {
    rawActions: string[];
    optimalBlocks: number;
  };
  hints: string[];
}

/**
 * Exercise result after user completes
 */
export interface ExerciseResult {
  exerciseId: string;
  completed: boolean;
  success: boolean;
  timeTaken: number;          // seconds
  hintsUsed: number;
  attempts: number;
  blocksUsed: number;
  xpEarned: number;
  completedAt: Date;
}

/**
 * Practice session state
 */
export interface PracticeSession {
  id: string;
  userId?: string;            // Firebase UID if authenticated
  config: PracticeConfig;
  exercises: GeneratedExercise[];
  currentIndex: number;
  results: ExerciseResult[];
  startedAt: Date;
  completedAt?: Date;
}

// ============================================================================
// SCORING TYPES
// ============================================================================

/**
 * Progress for a single concept category
 */
export interface CategoryProgress {
  category: ConceptCategory;
  xp: number;
  level: number;
  streak: number;
  exercisesCompleted: number;
  exercisesAttempted: number;
  lastActivity?: Date;
}

/**
 * User's overall progress across all categories
 */
export interface UserProgress {
  userId: string;
  displayName?: string;
  totalXP: number;
  categories: Record<ConceptCategory, CategoryProgress>;
  lastUpdated: Date;
}
