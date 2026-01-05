/**
 * Scoring Utilities
 * 
 * XP calculation and level progression for practice mode
 */

import type { 
  ExerciseResult, 
  GeneratedExercise, 
  CategoryProgress,
  UserProgress,
  ConceptCategory
} from './types';

// ============================================================================
// CONSTANTS
// ============================================================================

/**
 * XP required per level (linear progression)
 */
export const XP_PER_LEVEL = 100;

/**
 * Base XP multiplier per difficulty
 */
export const DIFFICULTY_XP_MULTIPLIER = 10;

/**
 * Maximum streak multiplier
 */
export const MAX_STREAK_MULTIPLIER = 2.0;

/**
 * Par time in seconds for time bonus
 */
export const PAR_TIME_SECONDS = 30;

// ============================================================================
// XP CALCULATION
// ============================================================================

/**
 * Calculate XP earned for completing an exercise
 */
export function calculateXP(
  exercise: GeneratedExercise,
  timeTaken: number,        // seconds
  hintsUsed: number,
  attempts: number,
  currentStreak: number
): number {
  // Base XP from difficulty (10-100)
  const baseXP = exercise.difficulty * DIFFICULTY_XP_MULTIPLIER;
  
  // Time bonus: max 60 XP if completed under par time
  const timeBonus = Math.max(0, Math.min(60, (PAR_TIME_SECONDS - timeTaken) * 2));
  
  // Hint penalty: -5 XP per hint used
  const hintPenalty = hintsUsed * 5;
  
  // First attempt bonus: +20 XP if solved on first try
  const firstAttemptBonus = attempts === 1 ? 20 : 0;
  
  // Streak multiplier: +10% per streak, max 2x
  const streakMultiplier = Math.min(
    MAX_STREAK_MULTIPLIER, 
    1 + (currentStreak * 0.1)
  );
  
  // Calculate final XP (minimum 5 XP)
  const rawXP = (baseXP + timeBonus - hintPenalty + firstAttemptBonus) * streakMultiplier;
  return Math.max(5, Math.floor(rawXP));
}

/**
 * Calculate level from total XP
 */
export function calculateLevel(totalXP: number): number {
  return Math.floor(totalXP / XP_PER_LEVEL) + 1;
}

/**
 * Calculate XP progress within current level (0-100)
 */
export function calculateLevelProgress(totalXP: number): number {
  return totalXP % XP_PER_LEVEL;
}

/**
 * Calculate XP needed for next level
 */
export function xpToNextLevel(totalXP: number): number {
  return XP_PER_LEVEL - (totalXP % XP_PER_LEVEL);
}

// ============================================================================
// PROGRESS MANAGEMENT
// ============================================================================

/**
 * Create initial category progress
 */
export function createCategoryProgress(category: ConceptCategory): CategoryProgress {
  return {
    category,
    xp: 0,
    level: 1,
    streak: 0,
    exercisesCompleted: 0,
    exercisesAttempted: 0,
  };
}

/**
 * Update category progress after exercise completion
 */
export function updateCategoryProgress(
  progress: CategoryProgress,
  result: ExerciseResult
): CategoryProgress {
  const newXP = progress.xp + result.xpEarned;
  const newStreak = result.success ? progress.streak + 1 : 0;
  
  return {
    ...progress,
    xp: newXP,
    level: calculateLevel(newXP),
    streak: newStreak,
    exercisesCompleted: progress.exercisesCompleted + (result.success ? 1 : 0),
    exercisesAttempted: progress.exercisesAttempted + 1,
    lastActivity: new Date(),
  };
}

/**
 * Create initial user progress
 */
export function createUserProgress(userId: string, displayName?: string): UserProgress {
  const categories: ConceptCategory[] = [
    'sequential', 'loop', 'conditional', 'function', 'variable', 'advanced'
  ];
  
  const categoryProgress: Record<ConceptCategory, CategoryProgress> = {} as any;
  for (const category of categories) {
    categoryProgress[category] = createCategoryProgress(category);
  }
  
  return {
    userId,
    displayName,
    totalXP: 0,
    categories: categoryProgress,
    lastUpdated: new Date(),
  };
}

/**
 * Calculate total XP across all categories
 */
export function calculateTotalXP(progress: UserProgress): number {
  return Object.values(progress.categories).reduce(
    (sum, cat) => sum + cat.xp, 
    0
  );
}

// ============================================================================
// STREAK CALCULATION
// ============================================================================

/**
 * Check if streak should be reset (more than 24h since last activity)
 */
export function shouldResetStreak(lastActivity?: Date): boolean {
  if (!lastActivity) return false;
  
  const now = new Date();
  const diff = now.getTime() - lastActivity.getTime();
  const hoursDiff = diff / (1000 * 60 * 60);
  
  return hoursDiff > 24;
}
